const { parseArgs } = require("util");
const { scrape } = require("./scraper");
const { filter } = require("./filter");

async function pipeline() {
    const { values } = parseArgs({
        options: {
            should_scrape: { type: "boolean", default: true },
            scrape_limit: { type: "string", default: "100" }
        }
    });

    if (values.should_scrape) {
        console.log("Scraping jobs...");
        const raw_jobs = await scrape(parseInt(values.scrape_limit));
        console.log(`raw ${scraped_jobs.length} unique jobs.`);
        console.log(`The database is updated with ${raw_jobs.length} raw jobs.`);
    }

    console.log("\nFiltering jobs...");
    const filtered_jobs = await filter(raw_jobs);
    console.log(`The database is updated with ${filtered_jobs.length} filtered jobs.`);
}

// run pipeline
pipeline()
    .then(_ => console.log("Pipeline complete! Check the dashboard for the updates."))
    .catch(error => console.error(`Pipeline Error: ${error}`));
