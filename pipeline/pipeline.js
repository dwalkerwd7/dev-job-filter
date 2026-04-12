const { parseArgs } = require("util");
const { initLogger } = require("./lib/logger");
const { scrape } = require("./scraper");
const { filterStack } = require("./filter");
const { gatherInfo } = require("./info");
const db = require('./lib/db');

async function pipelineStep(stepCb, jobType) {
    const res = await stepCb();
    afterDBUpdate(res, jobType);
}

function afterDBUpdate(res, jobType) {
    const total = (res.upsertedCount ?? 0) + (res.modifiedCount ?? 0) + (res.matchedCount ?? 0);
    if (total > 0) {
        console.log(`DB updated: ${res.upsertedCount} inserted, ${res.modifiedCount} modified (${jobType} jobs).\n`);
    } else {
        console.log(`No ${jobType} jobs to be upserted.`);
    }
}

async function pipeline() {
    initLogger();

    const { values } = parseArgs({
        options: {
            renew_slugs: { type: "boolean", default: false },
            scraping: { type: "boolean", default: true },
            filtering: { type: "boolean", default: true },
            info: { type: "boolean", default: true },
            scrape_limit: { type: "string", default: "100" },
            filter_limit: { type: "string", default: "100" },
        },
        allowNegative: true
    });

    await db.connect();

    try {
        /* Scraping Step */
        let scraped_jobs = [];
        if (values.scraping) {
            await pipelineStep(async _ => {
                console.log("Scraping jobs...\n");
                scraped_jobs = await scrape(parseInt(values.scrape_limit), values.renew_slugs);
                return await db.upsertScrapedJobs(scraped_jobs);
            }, 'scraped');
        } else {
            scraped_jobs = await db.getScrapedJobs();
        }

        /* Stack Filter Step */
        let stack_passed_jobs = [];
        if (values.filtering && scraped_jobs.length > 0) {
            await pipelineStep(async _ => {
                console.log("Filtering jobs (stack)...\n");
                stack_passed_jobs = await filterStack(scraped_jobs, parseInt(values.filter_limit));
                return await db.upsertStackPassedJobs(stack_passed_jobs);
            }, 'stack-passed');
        } else {
            stack_passed_jobs = await db.getStackPassedJobs();
        }

        /* Info Step */
        if (values.info && stack_passed_jobs.length > 0) {
            await pipelineStep(async _ => {
                console.log("Fetching job info...\n");
                const info_jobs = await gatherInfo(stack_passed_jobs);
                return await db.upsertInfoJobs(info_jobs);
            }, 'complete');
        }
    } finally {
        await db.disconnect();
    }

    return true;
}

/* Run pipeline */
pipeline()
    .catch(error => console.error(`Pipeline Error: ${error}`));
