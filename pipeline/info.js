const Anthropic = require("@anthropic-ai/sdk");
const { filter: cfg } = require("./lib/config");

const client = new Anthropic();

async function fetchOtherInfo(text) {
    const [locationResult, workArrangementResult] = await Promise.allSettled([
        client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: cfg.locationMaxTokens,
            messages: [{
                role: "user",
                content: `Based on this job description, extract the job location as a city and/or state (e.g. "Austin, TX" or "New York"). Reply with only the location, or "unknown" if not mentioned.\n\n${text}`
            }]
        }),
        client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: cfg.workArrangementMaxTokens,
            messages: [{
                role: "user",
                content: `Based on this job description, reply with only one word: "remote", "hybrid", or "in-person".\n\n${text}`
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
        console.error(`[info] location fetch failed:`, locationResult.reason?.message ?? locationResult.reason);
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

async function gatherInfo(jobs) {
    const infoBatches = Math.ceil(jobs.length / cfg.batchSize);
    const results = jobs.map(job => ({ ...job, location: null, workArrangement: null }));

    for (let i = 0; i < results.length; i += cfg.batchSize) {
        const batch = Math.floor(i / cfg.batchSize) + 1;
        console.log(`[info] [${batch}/${infoBatches}]`);
        if (i > 0) await new Promise(r => setTimeout(r, cfg.infoBatchDelayMs));
        await Promise.all(
            results.slice(i, i + cfg.batchSize).map(async job => {
                ({ location: job.location, workArrangement: job.workArrangement } = await fetchOtherInfo(job.jobDesc ?? job.title));
            })
        );
    }

    console.log(`[info] ${results.length} jobs processed.`);
    return results;
}

module.exports = { gatherInfo };
