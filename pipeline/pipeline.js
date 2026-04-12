const { parseArgs } = require("util");
const { initLogger } = require("./lib/logger");
const { scrape } = require("./scraper");
const { filterStack } = require("./filter");
const { gatherInfo } = require("./info");
const db = require('./lib/db');

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
        let scraped_jobs = []
        if (values.scraping) {
            console.log("Scraping jobs...\n");
            scraped_jobs = await scrape(parseInt(values.scrape_limit), values.renew_slugs);
            await db.upsertScrapedJobs(scraped_jobs);
        } else {
            scraped_jobs = await db.getScrapedJobs();
        }

        /* Stack Filter Step */
        let stack_passed_jobs = [];
        if (values.filtering && scraped_jobs.length > 0) {
            console.log("Filtering jobs (stack)...\n");
            const jobs = await db.getUnfilteredJobs();
            const { passed, preFilteredOut } = await filterStack(
                jobs,
                parseInt(values.filter_limit),
                (jobs) => db.upsertTechStackProgress(jobs)
            );
            stack_passed_jobs = passed;
            if (preFilteredOut.length > 0) await db.upsertPreFilteredJobs(preFilteredOut);
            await db.upsertStackPassedJobs(stack_passed_jobs);
        } else {
            stack_passed_jobs = await db.getStackPassedJobs();
        }

        /* Info Step */
        if (values.info && stack_passed_jobs.length > 0) {
            console.log("Fetching job info...\n");
            const info_jobs = await gatherInfo(stack_passed_jobs);
            await db.upsertInfoJobs(info_jobs);
        }
    } finally {
        await db.disconnect();
    }

    console.log("Pipeline completed successfully!");
}

pipeline()
    .catch(error => console.error(`Pipeline Error: ${error}`));
