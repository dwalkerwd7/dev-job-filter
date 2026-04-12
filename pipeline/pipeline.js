const { parseArgs } = require("util");
const { initLogger } = require("./lib/logger");
const { scrape } = require("./scraper");
const { filter } = require("./filter");
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
            aligning: { type: "boolean", default: true },
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

        /* Filtering Step */
        let filtered_jobs = [];
        if (values.filtering && scraped_jobs.length > 0) {
            await pipelineStep(async _ => {
                console.log("Filtering jobs...\n");
                filtered_jobs = await filter(scraped_jobs, parseInt(values.filter_limit));
                console.log(`${filtered_jobs.length} jobs were filtered!`);
                return await db.upsertFilteredJobs(filtered_jobs);
            }, 'filtered');
        } else {
            filtered_jobs = await db.getFilteredJobs();
        }
    } finally {
        await db.disconnect();
    }

    return true;
}

/* Run pipeline */
pipeline()
    .then(success => success && console.log("Pipeline completed successfully!"))
    .catch(error => console.error(`Pipeline Error: ${error}`));
