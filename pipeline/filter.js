const Anthropic = require("@anthropic-ai/sdk");
const { filter: cfg } = require("./lib/config");

const client = new Anthropic();

// Pause between batches to stay under Anthropic's 50k TPM limit.
// Stack batches: 5 jobs × ~1100 tokens (900 in + 100 out) = ~5500 tokens/batch → need ≥ 6.6s, use 12s for 1.8× headroom.
// Info batches: 5 jobs × ~1840 tokens (900 in × 2 calls + 40 out) = ~9200 tokens/batch → need ≥ 11s, use 25s for 2.3× headroom.

function getTextWindows(text, keywords, windowSize = cfg.minDescriptionLength) {
    const half = Math.round(windowSize / 2);

    // Collect [start, end] for each keyword hit
    const ranges = [];
    for (const kw of keywords) {
        const idx = text.indexOf(kw);
        if (idx !== -1) {
            ranges.push([Math.max(0, idx - half), Math.min(text.length, idx + half)]);
        }
    }

    if (ranges.length === 0) return [];

    // Sort by start then merge overlapping ranges to avoid sending duplicate text
    ranges.sort((a, b) => a[0] - b[0]);
    const merged = [ranges[0]]; // commit to the first range being in merged
    for (const [start, end] of ranges.slice(1)) {
        const last = merged[merged.length - 1]; // the last committed range
        if (start <= last[1]) { // if they overlap
            // extend "last" so that it includes the new range -- this way both ranges will get merged together as one in the return statement
            last[1] = Math.max(last[1], end); // mutating arrays with a const ref works b/c javascript is cool
        } else {
            merged.push([start, end]);
        }
    }

    return merged.map(([start, end]) => text.slice(start, end));
}

function preFilter(jobDesc) {
    return getTextWindows(jobDesc, cfg.windowKeywords).join('\n');
}

async function fetchTechStack(filteredText) {
    try {
        const message = await client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: cfg.stackMaxTokens,
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

async function fetchOtherInfo(filteredText) {
    const [locationResult, workArrangementResult] = await Promise.allSettled([
        client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: cfg.locationMaxTokens,
            messages: [{
                role: "user",
                content: `Based on this job description, extract the job location as a city and/or state (e.g. "Austin, TX" or "New York"). Reply with only the location, or "unknown" if not mentioned.\n\n${filteredText}`
            }]
        }),
        client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: cfg.workArrangementMaxTokens,
            messages: [{
                role: "user",
                content: `Based on this job description, reply with only one word: "remote", "hybrid", or "in-person".\n\n${filteredText}`
            }]
        })
    ]);

    let location = null;
    if (locationResult.status === 'fulfilled') {
        const textBlock = locationResult.value.content.find(b => b.type === 'text');
        if (textBlock) {
            const val = textBlock.text.trim();
            if (val.toLowerCase() !== 'unknown') location = val;
        }
    } else {
        console.error(`[filter] location fetch failed:`, locationResult.reason?.message ?? locationResult.reason);
    }

    let workArrangement = null;
    if (workArrangementResult.status === 'fulfilled') {
        const textBlock = workArrangementResult.value.content.find(b => b.type === 'text');
        if (textBlock) {
            const val = textBlock.text.trim().toLowerCase();
            if (["remote", "hybrid", "in-person"].includes(val)) workArrangement = val;
        }
    }

    return { location, workArrangement };
}

async function filter(jobs, limit) {
    // Pre-filter text windows, skip jobs with no usable description
    const jobsLimited = limit ? jobs.slice(0, Math.min(jobs.length, limit)) : jobs;
    const preFiltered = jobsLimited.flatMap(job => {
        if (!job.jobDesc) return [];
        const filtered = preFilter(job.jobDesc);
        if (filtered.length < cfg.minDescriptionLength) return [];
        return [{ ...job, tech_stack: [], location: null, workArrangement: null, jobDesc: filtered }];
    });
    console.log(`[filter] pre-filter: ${preFiltered.length}/${jobsLimited.length} jobs have usable descriptions`);

    // Extract tech stack via Claude for each pre-filtered job
    const stackBatches = Math.ceil(preFiltered.length / cfg.batchSize);
    for (let i = 0; i < preFiltered.length; i += cfg.batchSize) {
        const batch = Math.floor(i / cfg.batchSize) + 1;
        console.log(`[filter] stack [${batch}/${stackBatches}]`);
        if (i > 0) await new Promise(r => setTimeout(r, cfg.batchDelayMs));
        await Promise.all(
            preFiltered.slice(i, i + cfg.batchSize).map(async job => {
                job.tech_stack = await fetchTechStack(job.jobDesc);
            })
        );
    }

    // Only look up location/work arrangement for jobs that matched the target stack
    const stackPassed = preFiltered.filter(job => {
        const stack = job.tech_stack.map(s => s.toLowerCase());
        return cfg.targetStack.some(skill => stack.some(s => s.includes(skill)));
    });
    console.log(`[filter] stack: ${stackPassed.length}/${preFiltered.length} passed`);

    const infoBatches = Math.ceil(stackPassed.length / cfg.batchSize);
    for (let i = 0; i < stackPassed.length; i += cfg.batchSize) {
        const batch = Math.floor(i / cfg.batchSize) + 1;
        console.log(`[filter] info  [${batch}/${infoBatches}]`);
        if (i > 0) await new Promise(r => setTimeout(r, cfg.infoBatchDelayMs));
        await Promise.all(
            stackPassed.slice(i, i + cfg.batchSize).map(async job => {
                ({ location: job.location, workArrangement: job.workArrangement } = await fetchOtherInfo(job.jobDesc));
            })
        );
    }

    const results = stackPassed.map(({ title, company, url, tech_stack, location, workArrangement, scrapedAt }) => ({
        title, company, url, tech_stack, location, workArrangement, scrapedAt
    }));
    console.log(`[filter] done: ${results.length} jobs passed`);

    return results;
}

module.exports = { filter };
