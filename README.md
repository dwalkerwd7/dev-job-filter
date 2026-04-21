# Dev Job Filter

A self-hosted job search tool for software developers. Scrapes Greenhouse-hosted job boards, uses Claude to filter by tech stack and extract structured metadata, and surfaces results in a Next.js dashboard.

> Pipeline cost: ~$1.00 in Claude API tokens to process 1000 jobs end-to-end.

---

## How it works

```
Serper API (Google search) → Greenhouse company slugs
        ↓
Greenhouse public API → job listings
        ↓
Playwright → full job descriptions
        ↓
Claude Haiku → tech stack extraction → stack filter (React / Node.js / TypeScript / Next.js)
        ↓
Claude Haiku → location + work arrangement
        ↓
MongoDB → Next.js dashboard
```

Jobs that don't match the target stack are discarded after the filter step. Everything else is browsable, searchable, and trackable in the dashboard.

---

## Stack

| Layer | Technology |
|---|---|
| Scraper | Playwright + Node.js |
| Company discovery | Serper API (Google search) |
| AI extraction | Claude Haiku (`@anthropic-ai/sdk`) |
| Database | MongoDB Atlas (Mongoose) |
| Dashboard | Next.js (App Router) + Tailwind CSS |
| Env management | varlock |

---

## Getting started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier works)
- [Anthropic API key](https://console.anthropic.com/)
- [Serper API key](https://serper.dev/)

### Pipeline setup

```bash
cd pipeline
npm install
```

Create a `.env.local` file in `pipeline/` (managed by varlock):

```
MONGODB_URI=your_mongodb_connection_string
ANTHROPIC_API_KEY=your_anthropic_key
SERPER_API_KEY=your_serper_key
```

### Dashboard setup

```bash
cd dashboard
npm install
```

Create a `.env.local` file in `dashboard/`:

```
MONGODB_URI=your_mongodb_connection_string
```

---

## Running the pipeline

```bash
cd pipeline

npm run pipeline   # full run: scrape → filter → info
npm run scrape     # scrape only
npm run filter     # stack filter only
npm run info       # info gather only
```

### CLI flags

```bash
node pipeline.js --scrape_limit=50     # cap jobs scraped
node pipeline.js --filter_limit=50     # cap jobs filtered
node pipeline.js --no-scraping         # skip scrape step
node pipeline.js --no-filtering        # skip filter step
node pipeline.js --no-info             # skip info step
node pipeline.js --renew_slugs         # re-fetch Greenhouse company slugs via Serper
node pipeline.js --clear_jobs          # wipe the jobs collection before running
```

### Configuration

Edit `pipeline/pipeline.cfg` to customise:

- `scraper.jobKeywords` — search terms used to discover companies via Serper
- `filter.targetStack` — skills a job must mention to pass the filter
- `filter.batchSize` / `filter.batchDelayMs` — Claude API rate limiting
- `scraper.concurrency` — parallel Playwright pages

---

## Running the dashboard

```bash
cd dashboard
npm run dev    # http://localhost:3000
```

The dashboard has three pages:

- **Jobs** — browse, filter by work arrangement, search by keyword, mark as applied
- **Pipeline** — run the pipeline from the browser with a live log stream and funnel stats
- **About** — project overview

---

## Database schema

One collection. `filterRan` and `filterPassed` track which pipeline stage each job has completed.

```js
{
  title:           String,   // required
  company:         String,   // required
  url:             String,   // required, unique
  jobDesc:         String,   // raw scraped text
  tech_stack:      [String], // extracted by Claude
  location:        String,   // extracted by Claude (null if unknown)
  workArrangement: String,   // "remote" | "hybrid" | "in-person" | null
  applied:         Boolean,  // tracked via dashboard
  filterRan:       Boolean,  // true = filter step ran (pass or fail)
  filterPassed:    Boolean,  // true = passed the stack filter
  scrapedAt:       Date
}
```

---

## Logs

Each pipeline run writes a timestamped log to `logs/`:

```
logs/pipeline-2026-04-20T16-30-19-579Z.log
```

Line format: `[ISO_TIMESTAMP] LOG   [tag] message`

---

## License

MIT
