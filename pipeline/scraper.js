const { chromium } = require("playwright");

const GREENHOUSE_COMPANIES = [
    "retool", "replit", "webflow", "sourcegraph", "snyk",
    "loom", "notion", "mercury", "brex", "iterable",
    "postman", "netlify", "algolia", "amplitude", "mixpanel",
    "productboard", "typeform", "intercom", "dbtlabs", "planetscale"
];

const JOB_DESC_SELECTORS = [
    "[class*='job-description']",
    "[id*='job-description']",
    "[class*='jobDescription']",
    "[class*='description']",
    "article",
    "main",
    ".content",
    "#content",
];

async function fetchRemoteOK() {
    const res = await fetch("https://remoteok.com/api", {
        headers: { "User-Agent": "Mozilla/5.0" }
    });
    const data = await res.json();
    return data
        .slice(1) // first element is metadata
        .map(job => ({
            title: job.position ?? '',
            company: job.company ?? '',
            url: job.url ?? ''
        }))
        .filter(job => job.url);
}

async function fetchRemotive() {
    const res = await fetch("https://remotive.com/api/remote-jobs?category=software-dev");
    const { jobs } = await res.json();
    return jobs.map(job => ({
        title: job.title ?? '',
        company: job.company_name ?? '',
        url: job.url ?? ''
    }));
}

async function fetchGreenhouse(slug) {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`);
    if (!res.ok) return [];
    const { jobs } = await res.json();
    return jobs.map(job => ({
        title: job.title ?? '',
        company: slug,
        url: job.absolute_url ?? ''
    })).filter(job => job.url);
}

async function shallowScrape(browser, url, selectors) {
    const context = await browser.newContext({
        userAgent: `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`
    });

    const page = await context.newPage();

    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(selectors.main, { timeout: 15000 });

    const jobs = await page.$$eval(selectors.main, (nodes, args) => {
        return nodes.map(node => ({
            title: node.querySelector(args.title)?.innerText.trim() ?? '',
            company: node.querySelector(args.company)?.innerText.trim() ?? '',
            url: node.querySelector(args.url)?.href ?? ''
        }));
    }, selectors);

    await context.close();
    return jobs.filter(job => job.url);
}

async function deepScrape(browser, url) {
    const context = await browser.newContext({
        userAgent: `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`
    });
    const page = await context.newPage();

    try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

        let extractedText = null;
        for (const selector of JOB_DESC_SELECTORS) {
            const el = await page.$(selector);
            if (el) {
                extractedText = await el.innerText();
                break;
            }
        }

        if (!extractedText) {
            extractedText = await page.locator("body").innerText();
        }

        return { url, extractedText: extractedText.trim() };
    } catch (err) {
        return { url, extractedText: null, error: err.message };
    } finally {
        await context.close();
    }
}

async function scrape(limit) {
    const browser = await chromium.launch({ headless: true });

    const [remoteok, remotive, wwr, ...greenhouse] = await Promise.allSettled([
        fetchRemoteOK(),
        fetchRemotive(),
        shallowScrape(browser, "https://weworkremotely.com/categories/remote-full-stack-programming-jobs", {
            main: ".new-listing-container",
            title: ".new-listing__header__title__text",
            company: ".new-listing__company-name",
            url: "a.listing-link--unlocked"
        }),
        ...GREENHOUSE_COMPANIES.map(slug => fetchGreenhouse(slug))
    ]);

    const extract = result => result.status === "fulfilled" ? result.value : [];

    const all_jobs = [
        ...extract(remoteok),
        ...extract(remotive),
        ...extract(wwr),
        ...greenhouse.flatMap(extract)
    ];

    const seen = new Set();
    const deduped = all_jobs.filter(job => {
        if (!job.url || seen.has(job.url)) return false;
        seen.add(job.url);
        return true;
    });

    const candidates = limit ? deduped.slice(0, limit) : deduped;

    const deep_results = await Promise.allSettled(
        candidates.map(job => deepScrape(browser, job.url))
    );

    browser.close();

    return candidates.map((job, i) => {
        const result = deep_results[i];
        const { extractedText = null, error = null } =
            result.status === "fulfilled" ? result.value : { error: result.reason?.message };
        return { ...job, extractedText, error };
    });
}

module.exports = { scrape };
