# Dev Job Filter

A tool to discover and filter tech-related jobs. Only jobs that overlap with a target tech stack make it through.

`NOTE`: It costs about $0.33 in Claude tokens and 20 minutes to run the pipeline end-to-end for 800 jobs.

## Pipeline

```
[Scraper]           ← Playwright + Greenhouse public API (slugs found via Serper search)
     ↓
[Scraped Jobs → MongoDB]
     ↓
[LLM Filter]        ← Claude Haiku: extracts tech_stack, location, work arrangement
     ↓
[Hard Filter]       ← Stack match (React / Node / TS / Next.js)
     ↓
[Filtered Jobs → MongoDB]
     ↓
[Next.js Dashboard] ← Browse and track applications
```

### Running the pipeline

```bash
cd pipeline
npm run pipeline    # scrape + filter
npm run scrape      # scrape only
npm run filter      # filter only
```

Flags (passed after `--`):

```bash
node pipeline.js --no-scraping              # skip scraping, re-filter existing scraped jobs
node pipeline.js --no-filtering             # scrape only (long form of npm run scrape)
node pipeline.js --scrape_limit=50          # cap jobs scraped (default: 100)
node pipeline.js --filter_limit=50          # cap jobs filtered (default: 100)
node pipeline.js --renew_slugs              # re-search for Greenhouse company slugs via Serper
```

### Running the dashboard

```bash
cd dashboard
npm run dev         # http://localhost:3000
```

---

## Dependencies

### Pipeline (`pipeline/`)

| Package | Purpose |
|---|---|
| `playwright` | Headless browser for deep-scraping job description text |
| `@anthropic-ai/sdk` | Claude Haiku — extracts structured data from raw job text |
| `mongoose` | MongoDB ODM for scraped and filtered job storage |
| `varlock` | Secure env var management |

### Dashboard (`dashboard/`)

| Package | Purpose |
|---|---|
| `next` | Frontend framework |
| `react` / `react-dom` | UI |
| `mongoose` | MongoDB queries from API routes |
| `tailwindcss` | Styling |
| `typescript` | Type safety |

---

## Data Sources

| Source | Method |
|---|---|
| [Greenhouse](https://greenhouse.io) | Public board API — company slugs discovered via Serper Google search |

---

## MongoDB Schema

### `scrapedjobs`

Every job collected before filtering.

```js
{
  title:     String,   // required
  company:   String,   // required
  url:       String,   // required, unique
  jobDesc:   String,   // raw text scraped from the job page
  scrapedAt: Date
}
```

### `filteredjobs`

Jobs that passed the hard filter.

```js
{
  title:           String,    // required
  company:         String,    // required
  url:             String,    // required, unique
  tech_stack:      [String],  // extracted by Claude Haiku
  location:        String,    // extracted by Claude Haiku (null if unknown)
  workArrangement: String,    // "remote" | "hybrid" | "in-person" (null if unknown)
  applied:         Boolean,   // tracked via dashboard (default: false)
  scrapedAt:       Date
}
```

---

## Filter Logic

- Tech stack overlaps with target skills (React, Angular, Node.js, Express, TypeScript, JavaScript, Next.js, etc.)
- Not already marked `applied: true`

---

## Environment Variables

Managed via [varlock](https://github.com/varlock/varlock). Required vars:

```
ANTHROPIC_API_KEY   # Claude API key (used in filter.js)
MONGODB_URI         # MongoDB connection string
SERPER_API_KEY      # Serper API key (used to find Greenhouse company slugs)
```
