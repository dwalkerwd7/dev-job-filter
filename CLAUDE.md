SMB Job Scraper
A personal tool to discover, extract, rank, and track SMB/startup job postings based on resume fit.

## Stack

- Scraper: Playwright (Node.js) — `pipeline/scraper.js`
- Extraction: Claude API (Haiku) — `pipeline/filter.js`, `pipeline/info.js`
- Backend/DB: MongoDB (Mongoose) — `pipeline/lib/db.js`
- Frontend: Next.js dashboard — `dashboard/`

## Architecture

```
[Scraper]         ← pipeline/scraper.js
     ↓ upsertScrapedJobs
[Stack Filter]    ← pipeline/filter.js (filterStack)
     ↓ upsertStackPassedJobs / upsertPreFilteredJobs
[Info Gather]     ← pipeline/info.js (gatherInfo)
     ↓ upsertInfoJobs
[MongoDB + Next.js dashboard]
```

## MongoDB Document Shape (`pipeline/lib/db.js`)

```js
{
  title: String,
  company: String,
  url: String,           // unique key
  jobDesc: String,
  tech_stack: [String],
  location: String,
  workArrangement: String,  // "remote" | "hybrid" | "in-person" | null
  applied: Boolean,
  filterRan: Boolean,    // true = filter step ran on this job (pass or fail)
  filterPassed: Boolean, // true = passed the stack filter
  scrapedAt: Date
}
```

## Pipeline Steps & Flags

Each step is independently skippable:

| npm script      | what runs                        |
|-----------------|----------------------------------|
| `npm run pipeline` | scrape → filter → info        |
| `npm run scrape`   | scrape only                   |
| `npm run filter`   | stack filter only             |
| `npm run info`     | info gather only              |
| `npm run migrate`  | one-time DB migration         |

CLI flags: `--no-scraping`, `--no-filtering`, `--no-info`, `--scrape_limit=N`, `--filter_limit=N`, `--renew_slugs`

## Filtering Logic

1. **Pre-filter** (`filter.js`): text-window the jobDesc around keywords; jobs with no usable description are marked `filterRan: true, filterPassed: false`
2. **Stack filter** (`filter.js`): Claude extracts `tech_stack`; jobs matching target skills (React, Node.js, TypeScript, Next.js) are marked `filterRan: true, filterPassed: true`
   - Tech stack is checkpointed to DB every 10 batches (`upsertTechStackProgress`) so interrupted runs resume without re-calling Claude
   - Jobs with existing `tech_stack` skip the Claude call
3. **Info gather** (`info.js`): Claude extracts `location` and `workArrangement` for stack-passed jobs

## DB Query Helpers

- `getUnfilteredJobs()` — `{ filterRan: false }` — input to stack filter step
- `getStackPassedJobs()` — `{ filterPassed: true }` — input to info step
- `getScrapedJobs()` — all jobs

## Data Sources

Use APIs where available — do not scrape gated platforms (LinkedIn, Indeed):

- Adzuna API — free tier, good SMB coverage
- The Muse API — startup/culture-forward companies
- RemoteOK / Remotive — free public JSON APIs
- Greenhouse API / Lever API — many startups use these ATS platforms with public job feeds
- Direct company career pages — scraping generally allowed
