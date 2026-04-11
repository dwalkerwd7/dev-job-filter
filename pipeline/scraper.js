const { chromium } = require("playwright");
const { removeTextNoise } = require("./lib/utils");
const db = require("./lib/db");
const { scraper: cfg } = require("./lib/config");

async function fetchGreenhouse(slug, maxJobsPerSlug = 50) {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`);
    if (!res.ok) return [];
    const { jobs } = await res.json();

    return jobs.slice(0, maxJobsPerSlug).map(job => ({
        title: job.title ?? '',
        company: slug,
        url: job.absolute_url ?? ''
    })).filter(job => job.url);
}

async function scrapeGreenhouseSlugs(keywords, maxPages = 5) {
    let query = `site:boards.greenhouse.io "${keywords[0]}"`;
    for (const kw of keywords.slice(1, -1)) {
        query += ` OR "${kw}"`;
    }

    let slugs = new Set();

    for (let page = 0; page < maxPages; page++) {
        const serper = await fetch(
            "https://google.serper.dev/search",
            {
                method: "post",
                headers: {
                    'X-API-KEY': process.env.SERPER_API_KEY || '',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    q: query,
                    page,
                    num: 10
                })
            }
        );

        const { organic } = await serper.json();
        organic.forEach(result => {
            const match = result.link.match(/boards\.greenhouse\.io\/([^\/]+)/);
            if (match) {
                const m = match[1];
                let slug = "";

                if (m.indexOf("?") !== -1) {
                    slug = m.slice(0, m.indexOf("?"));
                } else {
                    slug = m
                }

                slugs.add(slug);
            }
        });
    }

    return [...slugs];
}

async function deepScrape(browser, url) {
    const context = await browser.newContext({
        userAgent: `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`
    });
    const page = await context.newPage();

    try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        console.log(`[scrape] ${url}`);

        let jobDesc = null;
        for (const selector of cfg.jobDescSelectors) {
            const el = await page.$(selector);
            if (el) {
                jobDesc = await el.innerText();
                break;
            }
        }

        if (!jobDesc) {
            jobDesc = await page.locator("body").innerText();
        }

        return { url, jobDesc: removeTextNoise(jobDesc) };
    } catch (err) {
        console.error(`[deepScrape] failed ${url}: ${err.message}`);
        return { url, jobDesc: null, error: err.message };
    } finally {
        await context.close();
    }
}

async function scrape(limit, renewSlugs) {
    const browser = await chromium.launch({ headless: true });

    let slugs = [];
    if (renewSlugs) {
        slugs = await scrapeGreenhouseSlugs(cfg.jobKeywords);
        await db.renewSlugs(slugs);
    } else {
        slugs = await db.getSlugs();
    }

    const greenhouse = await Promise.all(slugs.map(slug => fetchGreenhouse(slug)));
    const all_jobs = greenhouse.flat();
    const candidates = limit ? all_jobs.slice(0, limit) : all_jobs;

    // limit concurrent contexts to not starve system resources or cause page timeouts
    const CONCURRENCY = cfg.concurrency;
    const deep_results = [];
    for (let i = 0; i < candidates.length; i += CONCURRENCY) {
        const batch = await Promise.allSettled(
            candidates.slice(i, i + CONCURRENCY).map(job => deepScrape(browser, job.url))
        );
        deep_results.push(...batch);
    }

    browser.close();

    return candidates.map((job, i) => {
        const result = deep_results[i];
        const { jobDesc = null, error = null } =
            result.status === "fulfilled" ? result.value : { error: result.reason?.message };
        return { ...job, jobDesc, error };
    });
}

module.exports = { scrape };
