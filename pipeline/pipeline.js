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
        const scraped_jobs = await scrape(parseInt(values.scrape_limit));
        console.log(`Scraped ${scraped_jobs.length} unique jobs.`);
    }

    console.log("\nFiltering jobs...");
    const filtered_jobs = await filter(scraped_jobs);
    console.log(`${filtered_jobs.length} jobs passed the filter.`);
}

// run pipeline
pipeline().catch(error => console.error(`Pipeline Error: ${error}`));
