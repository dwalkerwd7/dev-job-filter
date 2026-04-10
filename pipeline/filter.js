const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic();

// Pause between batches to stay under Anthropic's 50k TPM limit.
// Stack batches: 5 jobs × ~700 tokens = ~3500 tokens/batch → need ≥ 4.2s, use 8s for headroom.
// Info batches: web_search responses can be several thousand tokens each → use 60s to be sure.
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 8000;
const INFO_BATCH_DELAY_MS = 60000;
const EMPLOYEE_COUNT_MAX_TOKENS = 100;
const STACK_MAX_TOKENS = 100;
const WORK_ARRANGEMENT_MAX_TOKENS = 10;

const TARGET_STACK = [
    "react", "react.js", "reactjs", "angular.js", "angularjs",
    "node", "node.js", "nodejs",
    "express", "express.js", "expressjs",
    "typescript", "javascript",
    "next.js", "nextjs",
    "tailwind", "tailwindcss",
    "sql", "nosql", "monogdb", "postgresql",
    "html", "css",
    "kubernetes", "docker"
];

const WINDOW_KEYWORDS = [
    // tech stack signals
    "stack", "framework", "frameworks", "technologies", "tools",
    "languages", "libraries", "platforms", "infrastructure",
    // job description sections
    "qualifications", "requirements", "responsibilities", "description",
    "what you'll use", "what we use", "our stack", "tech stack",
    // work arrangement signals
    "remote", "hybrid", "in-person", "on-site", "onsite"
];

const MIN_EMPLOYEES = 10;
const MAX_EMPLOYEES = 999;
const MIN_DESCRIPTION_LENGTH = 300;

function getTextWindows(text, keywords, windowSize = MIN_DESCRIPTION_LENGTH) {
    let windows = [];

    for (kw of keywords) {
        const kwIdx = text.indexOf(kw);
        if (kwIdx !== -1) {
            const halfWindowSize = Math.round(windowSize / 2);
            if (kwIdx > halfWindowSize) {
                windows.push(text.slice(kwIdx - halfWindowSize, kwIdx + halfWindowSize));
            } else {
                windows.push(text.slice(0, windowSize));
            }
        }
    }

    return windows;
}

function preFilter(jobDesc) {
    return getTextWindows(jobDesc, WINDOW_KEYWORDS).flat().join('\n');
}

async function fetchTechStack(filteredText) {
    try {
        const message = await client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: STACK_MAX_TOKENS,
            messages: [{
                role: "user",
                content: `List the technology names mentioned in this job description. Reply with only a comma-separated list, nothing else.\n\n${filteredText}`
            }]
        });
        const text = message.content.find(b => b.type === 'text')?.text.trim();
        if (!text) return [];
        return text.split(',').map(s => s.trim()).filter(Boolean);
    } catch {
        return [];
    }
}

async function fetchOtherInfo(company, filteredText) {
    const [employeeCountResult, workArrangementResult] = await Promise.allSettled([
        client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: EMPLOYEE_COUNT_MAX_TOKENS,
            tools: [{ type: "web_search_20260209", name: "web_search", allowed_callers: ["direct"] }],
            messages: [{
                role: "user",
                content: `Search the web for the approximate employee count of "${company}" using your best judgment. Reply with only a single integer and nothing else.`
            }]
        }),
        client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: WORK_ARRANGEMENT_MAX_TOKENS,
            messages: [{
                role: "user",
                content: `Based on this job description, reply with only one word: "remote", "hybrid", or "in-person".\n\n${filteredText}`
            }]
        })
    ]);

    let employee_count = null;
    if (employeeCountResult.status === 'fulfilled') {
        const textBlock = employeeCountResult.value.content.filter(b => b.type === 'text').pop();
        if (textBlock) {
            const match = textBlock.text.match(/\d+/);
            if (match) employee_count = parseInt(match[0], 10);
            else console.error(`[filter] no number in employee count response for ${company}: "${textBlock.text.trim().slice(0, 150)}"`);
        } else {
            console.error(`[filter] no text block for ${company} — stop_reason: ${employeeCountResult.value.stop_reason}`);
        }
    } else {
        console.error(`[filter] employee count fetch failed for ${company}:`, employeeCountResult.reason?.message ?? employeeCountResult.reason);
    }

    let workArrangement = null;
    if (workArrangementResult.status === 'fulfilled') {
        const textBlock = workArrangementResult.value.content.find(b => b.type === 'text');
        if (textBlock) {
            const val = textBlock.text.trim().toLowerCase();
            if (["remote", "hybrid", "in-person"].includes(val)) workArrangement = val;
        }
    }

    return { employee_count, workArrangement };
}

function hardFilter(jobs) {
    return jobs.filter(job => {
        return job.employee_count === null || (job.employee_count >= MIN_EMPLOYEES && job.employee_count <= MAX_EMPLOYEES);
    });
}

async function filter(jobs, limit) {
    // Pre-filter text windows, skip jobs with no usable description
    const jobsLimited = limit ? jobs.slice(0, Math.min(jobs.length, limit)) : jobs;
    const preFiltered = jobsLimited.flatMap(job => {
        if (!job.jobDesc) return [];
        const filtered = preFilter(job.jobDesc);
        if (filtered.length < MIN_DESCRIPTION_LENGTH) return [];
        return [{ ...job, tech_stack: [], employee_count: null, workArrangement: null, jobDesc: filtered }];
    });
    console.log(`[filter] pre-filter: ${preFiltered.length}/${jobsLimited.length} jobs have usable descriptions`);

    // Extract tech stack via Claude for each pre-filtered job
    const stackBatches = Math.ceil(preFiltered.length / BATCH_SIZE);
    for (let i = 0; i < preFiltered.length; i += BATCH_SIZE) {
        const batch = Math.floor(i / BATCH_SIZE) + 1;
        console.log(`[filter] stack [${batch}/${stackBatches}]`);
        if (i > 0) await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
        await Promise.all(
            preFiltered.slice(i, i + BATCH_SIZE).map(async job => {
                job.tech_stack = await fetchTechStack(job.jobDesc);
            })
        );
    }

    // Only look up employee counts for jobs that matched the target stack
    const stackPassed = preFiltered.filter(job => {
        const stack = job.tech_stack.map(s => s.toLowerCase());
        return TARGET_STACK.some(skill => stack.some(s => s.includes(skill)));
    });
    console.log(`[filter] stack: ${stackPassed.length}/${preFiltered.length} passed`);

    const infoBatches = Math.ceil(stackPassed.length / BATCH_SIZE);
    for (let i = 0; i < stackPassed.length; i += BATCH_SIZE) {
        const batch = Math.floor(i / BATCH_SIZE) + 1;
        console.log(`[filter] info  [${batch}/${infoBatches}]`);
        if (i > 0) await new Promise(r => setTimeout(r, INFO_BATCH_DELAY_MS));
        await Promise.all(
            stackPassed.slice(i, i + BATCH_SIZE).map(async job => {
                ({ employee_count: job.employee_count, workArrangement: job.workArrangement } = await fetchOtherInfo(job.company, job.jobDesc));
            })
        );
    }

    const results = hardFilter(stackPassed).map(({ title, company, url, tech_stack, employee_count, workArrangement, scrapedAt }) => ({
        title, company, url, tech_stack, employee_count, workArrangement, scrapedAt
    }));
    console.log(`[filter] done: ${results.length} jobs passed`);

    return results;
}

module.exports = { filter };
