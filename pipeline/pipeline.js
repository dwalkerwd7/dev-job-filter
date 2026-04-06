const { parseArgs } = require("util");
const { scrape } = require("./scraper");

async function pipeline() {
    const { values } = parseArgs({
        options: {
            should_scrape: { type: "boolean", default: true },
            scrape_limit: { type: "string", default: "100" }
        }
    });

    if (values.should_scrape) {
        const scraped_jobs = await scrape(values.scrape_limit);
        console.log(`Scraped ${scraped_jobs.length} jobs successfully...`);
    }
}

// run pipeline
pipeline().catch(error => console.error(`Pipeline Error: ${error}`));
