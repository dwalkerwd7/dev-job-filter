const { chromium } = require("playwright");

async function shallow_scrape(browser, url, selectors) {
    const context = await browser.newContext({ // new context like it's own cookies, local storage etc...
        userAgent: `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36` // realistic userAgent to avoid anti-scraping techniques
    });

    const page = await context.newPage(); // actual tab of the browser

    await page.goto(url, {
        waitUntil: "domcontentloaded"
    });

    // wait for JS to render client-side DOM elements
    await page.waitForSelector(selectors.main, { timeout: 1000 });

    // run over all .job-list-item elements and extract info
    const jobs = await page.$$eval(selectors.main, (nodes, args) => {
        return nodes.map(node => ({
            position: node.querySelector(args.position)?.innerText.trim() ?? '',
            company: node.querySelector(args.company)?.innerText.trim() ?? '',
            url: node.querySelector(args.url)?.href ?? ''
        }));
    }, selectors);

    return jobs;
}

async function deep_scrape() {
    // TODO: implement deep_scrape
}

async function scrape(limit) {
    const browser = await chromium.launch({ headless: true });
    const jobs = await shallow_scrape(browser, "https://weworkremotely.com/categories/remote-full-stack-programming-jobs", {
        main: ".new-listing-container",
        position: ".new-listing__header__title__text",
        company: ".new-listing__company-name",
        url: "a.listing-link--unlocked"
    });

    const jobs_with_url = jobs.filter(job => job.url);
    let jobs_found = jobs_with_url.slice(0, limit);

    browser.close();

    return jobs_found;
}

module.exports = { scrape }
