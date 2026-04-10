const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic();

// Pause between batches to stay under Anthropic's 50k tokens-per-minute limit.
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 8000;
const MAX_TOKENS = 16;

const TARGET_STACK = [
    "react", "react.js", "reactjs", "angular.js", "angularjs",
    "node", "node.js", "nodejs",
    "express", "express.js", "expressjs",
    "typescript", "javascript",
    "next.js", "nextjs",
    "tailwind", "tailwindcss", "tailwind css",
    "sql", "nosql", "monogdb",
];

const STACK_KEYWORDS = [
    "tech", "stack",
    "framework", "frameworks",
    "front-end", "back-end",
    "database", "aws", "azure",
    "ci/cd", "devops"
];

const MIN_EMPLOYEES = 5;
const MAX_EMPLOYEES = 500;
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

function preFilter(extractedText) {
    return getTextWindows(extractedText, STACK_KEYWORDS).flat().toString();
}

function extractTechStack(text) {
    const lower = text.toLowerCase();
    return TARGET_STACK.filter(kw => lower.includes(kw.toLowerCase()));
}

function hardFilter(jobs) {
    return jobs.filter(job => {
        const stack = job.tech_stack.map(s => s.toLowerCase());
        const hasStackMatch = TARGET_STACK.some(skill => stack.some(s => s.includes(skill)));
        const withinSize = job.employee_count === null || (job.employee_count >= MIN_EMPLOYEES && job.employee_count <= MAX_EMPLOYEES);
        return hasStackMatch && withinSize;
    });
}

async function fetchEmployeeCount(company) {
    try {
        const message = await client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: MAX_TOKENS,
            tools: [{ type: "web_search_20260209", name: "web_search" }],
            messages: [{
                role: "user",
                content: `Search the web for the approximate employee count of "${company}". Reply with only a single integer. If unknown, reply with 0.`
            }]
        });

        const textBlock = message.content.filter(b => b.type === 'text').pop();
        if (!textBlock) return null;
        const count = parseInt(textBlock.text.trim(), 10);

        return isNaN(count) || count === 0 ? null : count;
    } catch {
        return null;
    }
}

async function filter(jobs, limit) {
    // Local tech stack extraction — no API cost
    const enriched = jobs.map(job => {
        if (!job.extractedText) return { ...job, tech_stack: [], employee_count: null };
        const filtered = preFilter(job.extractedText);
        if (filtered.length < MIN_DESCRIPTION_LENGTH) return { ...job, tech_stack: [], employee_count: null };
        return { ...job, tech_stack: extractTechStack(filtered), employee_count: null };
    });

    // Only look up employee counts for jobs that passed the tech stack check
    const stackPassed = enriched.filter(job => job.tech_stack.length > 0);
    const stackPassedLimited = limit ? stackPassed.slice(0, Math.min(limit, stackPassed.length)) : stackPassed;
    for (let i = 0; i < stackPassedLimited.length; i += BATCH_SIZE) {
        if (i > 0) await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
        await Promise.all(
            stackPassedLimited.slice(i, i + BATCH_SIZE).map(async job => {
                job.employee_count = await fetchEmployeeCount(job.company);
            })
        );
    }

    const results = hardFilter(stackPassedLimited).map(({ title, company, url, tech_stack, employee_count }) => ({
        title, company, url, tech_stack, employee_count
    }));
    results.forEach(job => console.log(`[filtered] ${job.company} — ${job.title}`));

    return results;
}

module.exports = { filter };
