const { chromium } = require("playwright");
const { removeTextNoise } = require("./lib/utils");

const JOB_KEYWORDS = [
    "web developer",
    "full-stack",
    "front-end",
    "back-end",
    "javascript"
];

const JOB_DESC_SELECTORS = [
    // Greenhouse
    ".job__description",
    "#job-description",
    // WeWorkRemotely
    ".listing-container",
    // Generic job-specific (most specific first)
    "[class*='job-description']",
    "[id*='job-description']",
    "[class*='job_description']",
    "[id*='job_description']",
    "[class*='jobDescription']",
    "[class*='job-details']",
    "[class*='jobDetails']",
    "[class*='job-body']",
    "[class*='job-content']",
    "[class*='jobContent']",
    "[class*='posting-content']",
    "[class*='listing-content']",
    // Semantic HTML (broad but meaningful)
    "article",
    "main",
    // Last-resort generics
    "[class*='description']",
    ".content",
    "#content",
];

async function fetchGreenhouse(slug, maxJobsPerSlug = 20) {
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

async function shallowScrape(browser, url, selectors, maxJobs = 50) {
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
        })).filter(job => job.url);
    }, selectors);

    await context.close();
    return jobs.slice(0, maxJobs);
}

async function deepScrape(browser, url) {
    const context = await browser.newContext({
        userAgent: `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`
    });
    const page = await context.newPage();

    try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        console.log(`Scraping ${url}`);

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

        return { url, extractedText: removeTextNoise(extractedText) };
    } catch (err) {
        console.error(`[deepScrape] failed ${url}: ${err.message}`);
        return { url, extractedText: null, error: err.message };
    } finally {
        await context.close();
    }
}

async function scrape(limit) {
    const browser = await chromium.launch({ headless: true });

    const greenhouseSlugs = await scrapeGreenhouseSlugs(JOB_KEYWORDS);
    const [wwr, ...greenhouse] = await Promise.allSettled([
        shallowScrape(browser, "https://weworkremotely.com/categories/remote-full-stack-programming-jobs", {
            main: ".new-listing-container",
            title: ".new-listing__header__title__text",
            company: ".new-listing__company-name",
            url: "a.listing-link--unlocked"
        }),
        ...greenhouseSlugs.map(slug => fetchGreenhouse(slug))
    ]);

    const extract = result => result.status === "fulfilled" ? result.value : [];

    const all_jobs = [
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

    // so that 5 contexts run at a time to not starve system resources and make each page timeout on load
    const CONCURRENCY = 5;
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
        const { extractedText = null, error = null } =
            result.status === "fulfilled" ? result.value : { error: result.reason?.message };
        return { ...job, extractedText, error };
    });
}

module.exports = { scrape };
