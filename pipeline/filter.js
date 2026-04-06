const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic();

const TARGET_STACK = [
    "react", "angular", "angularjs",
    "node", "node.js", "nodejs",
    "express", "express.js", "expressjs",
    "typescript", "javascript",
    "next.js", "nextjs"
];
const MIN_EMPLOYEES = 5;
const MAX_EMPLOYEES = 200;

async function extractStructured(job) {
    if (!job.extractedText) return { ...job, tech_stack: [], employee_count: null };

    const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        messages: [{
            role: "user",
            content: `Extract the following from this job posting. Return only valid JSON with no explanation.

                    {
                    "tech_stack": ["array of technologies, languages, and frameworks mentioned"],
                    "employee_count": <number if company size is mentioned, infer employee count from business size, otherwise null>
                    }

                    Job posting:
                    ${job.extractedText.slice(0, 4000)}`
        }]
    });

    try {
        const parsed = JSON.parse(message.content[0].text);
        return {
            ...job,
            tech_stack: parsed.tech_stack ?? [],
            employee_count: parsed.employee_count ?? null
        };
    } catch {
        return { ...job, tech_stack: [], employee_count: null };
    }
}

function hardFilter(jobs) {
    return jobs.filter(job => {
        const stack = job.tech_stack.map(s => s.toLowerCase());
        const hasStackMatch = TARGET_STACK.some(skill => stack.some(s => s.includes(skill)));
        const withinSize = job.employee_count === null || (job.employee_count >= MIN_EMPLOYEES && job.employee_count <= MAX_EMPLOYEES);
        return hasStackMatch && withinSize;
    });
}

async function filter(jobs) {
    const extracted = await Promise.all(jobs.map(extractStructured));
    return hardFilter(extracted);
}

module.exports = { filter };
