Dev Job Filter
A personal tool to discover, filter, and track software engineering job postings at SMBs and startups based on resume fit.

## Repo Structure

```
pipeline/    ← Node.js scraper + Claude extraction pipeline
dashboard/   ← Next.js frontend + API routes
logs/        ← Pipeline run logs (auto-written, one file per run)
```

## Stack

- Scraper: Playwright (Node.js) — `pipeline/scraper.js`
- Company discovery: Serper API (Google search) — finds Greenhouse-hosted companies
- Extraction: Claude Haiku (`claude-haiku-4-5-20251001`) — `pipeline/filter.js`, `pipeline/info.js`
- DB: MongoDB Atlas (Mongoose) — `pipeline/lib/db.js`
- Dashboard: Next.js (App Router) + Tailwind — `dashboard/`
- Env management: `varlock` wraps all pipeline CLI commands

## Architecture

```
Serper API → Greenhouse company slugs
     ↓
Greenhouse public API → job list
     ↓ upsertScrapedJobs
Playwright → full job descriptions (pipeline/scraper.js)
     ↓ upsertPreFilteredJobs / upsertStackPassedJobs
Claude Haiku → tech_stack extraction (pipeline/filter.js)
     ↓ upsertTechStackProgress (checkpointed every 10 batches)
Claude Haiku → location + workArrangement (pipeline/info.js)
     ↓ upsertInfoJobs
MongoDB ← Next.js dashboard
```

## Pipeline Commands

Each step is independently runnable:

| npm script         | what runs              |
|--------------------|------------------------|
| `npm run pipeline` | scrape → filter → info |
| `npm run scrape`   | scrape only            |
| `npm run filter`   | stack filter only      |
| `npm run info`     | info gather only       |
| `npm run migrate`  | one-time DB migration  |

CLI flags: `--no-scraping`, `--no-filtering`, `--no-info`, `--scrape_limit=N`, `--filter_limit=N`, `--renew_slugs`, `--clear_jobs`

All commands must be run from `pipeline/` and are wrapped by `varlock` (reads `.env`).

## Configuration — `pipeline/pipeline.cfg`

The main config file. Key settings:
- `scraper.concurrency` — parallel Playwright pages
- `scraper.jobKeywords` — search terms used to find jobs via Serper
- `filter.batchSize` — jobs per Claude API call (default 5)
- `filter.batchDelayMs` — delay between filter batches (rate limiting)
- `filter.targetStack` — skills that must appear for a job to pass
- `filter.windowKeywords` — keywords used to extract relevant text windows from job descriptions before sending to Claude

## MongoDB Document Shape

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
  filterRan: Boolean,    // true = filter step ran (pass or fail)
  filterPassed: Boolean, // true = passed the stack filter
  scrapedAt: Date
}
```

## Filtering Logic

1. **Pre-filter** (`filter.js`): extracts text windows around `windowKeywords`; jobs with no usable description (`< minDescriptionLength` chars) are marked `filterRan: true, filterPassed: false` without calling Claude
2. **Stack filter** (`filter.js`): Claude extracts `tech_stack`; jobs matching `targetStack` skills pass (`filterPassed: true`)
   - `tech_stack` is checkpointed to DB every 10 batches so interrupted runs resume without re-calling Claude
   - Jobs with an existing non-empty `tech_stack` skip the Claude call entirely
3. **Info gather** (`info.js`): Claude extracts `location` and `workArrangement` for stack-passed jobs only

## DB Query Helpers (`pipeline/lib/db.js`)

- `getUnfilteredJobs()` — `{ filterRan: false }` — input to filter step
- `getStackPassedJobs()` — `{ filterPassed: true }` — input to info step
- `getScrapedJobs()` — all jobs
- `deleteAll()` — wipes the jobs collection

## Dashboard

Next.js App Router. Run from `dashboard/` with `npm run dev`.

### Pages
- `/` — job list with filters (work arrangement, keyword search, pagination)
- `/pipeline` — funnel stats + pipeline run panel (streams live output)
- `/about` — project overview

### Key files
- `dashboard/src/lib/mongodb.ts` — DB connection (separate from pipeline's)
- `dashboard/src/models/Job.ts` — Mongoose model (mirrors pipeline schema)
- `dashboard/src/app/api/pipeline/run/route.ts` — POST spawns pipeline process, streams stdout via SSE; DELETE kills it
- `dashboard/src/app/api/pipeline/stats/route.ts` — returns `{ totalScraped, filterRan, filterPassed }`

### Components
- `PipelineView` — owns `running`/`activeStep`/stats state; highlights active funnel card during a run
- `RunPanel` — pipeline run controls + live log output

## Environment Variables

**Pipeline** (`pipeline/.env` via varlock):
- `MONGODB_URI`
- `ANTHROPIC_API_KEY`
- `SERPER_API_KEY`

**Dashboard** (`dashboard/.env.local`):
- `MONGODB_URI`

## Logs

Pipeline writes a timestamped log to `logs/` on every run (e.g. `logs/pipeline-2026-04-20T16-30-19-579Z.log`).
Format: `[ISO_TIMESTAMP] LOG   [tag] message`
Tags: `[scraper]`, `[filter]`, `[info]`, `[db]`, `[exit:0]`, `[exit:1]`, `[exit:killed]`
