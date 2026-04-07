# SMB Job Filter

A personal tool to discover, extract, rank, and track job postings at SMBs and startups based on resume fit.

## Pipeline

```
[Scraper]           ← Playwright + public APIs (RemoteOK, Remotive, WeWorkRemotely, Greenhouse)
     ↓
[Raw Jobs → MongoDB]
     ↓
[LLM Extraction]    ← Claude Haiku: extracts tech_stack + employee_count from job text
     ↓
[Hard Filter]       ← Stack match (React/Node/TS/Next.js) + company size (5–200 employees)
     ↓
[Filtered Jobs → MongoDB]
     ↓
[Next.js Dashboard] ← Browse and track applications
```

### Running the pipeline

```bash
cd pipeline
node pipeline.js                          # scrape + filter (default 100 jobs)
node pipeline.js --scrape-limit=50        # limit scrape count
node pipeline.js --no-should-scrape       # skip scraping, re-filter existing raw jobs
```

Or via npm scripts:

```bash
npm run scraper     # scrape only
npm run filter      # filter only
npm run pipeline    # scrape + filter
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
| `mongoose` | MongoDB ODM for raw and filtered job storage |
| `varlock` | Secure env var management (wraps `ANTHROPIC_API_KEY`, `MONGODB_URI`) |

### Dashboard (`dashboard/`)

| Package | Purpose |
|---|---|
| `next` (16.x) | Frontend framework |
| `react` / `react-dom` | UI |
| `mongoose` | MongoDB queries from API routes |
| `varlock` / `@varlock/nextjs-integration` | Env var management integrated into Next.js build |
| `tailwindcss` | Styling |
| `typescript` | Type safety |

---

## Data Sources

| Source | Method |
|---|---|
| [RemoteOK](https://remoteok.com) | Public JSON API |
| [Remotive](https://remotive.com) | Public JSON API (software-dev category) |
| [WeWorkRemotely](https://weworkremotely.com) | Playwright shallow scrape |
| [Greenhouse](https://greenhouse.io) | Public board API across ~20 target companies |

---

## MongoDB Schema

### `rawjobs`

Stores every job collected before filtering.

```js
{
  title:         String,   // required
  company:       String,   // required
  url:           String,   // required, unique
  extractedText: String,   // raw text scraped from the job page
  scrapedAt:     Date
}
```

### `filteredjobs`

Jobs that passed the hard filter. Embedding/ranking fields are reserved for a future pass.

```js
{
  title:         String,    // required
  company:       String,    // required
  url:           String,    // required, unique
  extractedText: String,    // raw text from job page
  tech_stack:    [String],  // extracted by Claude Haiku
  employee_count: Number,   // extracted by Claude Haiku (null if unknown)
  embedding:     [Number],  // 1536 floats — text-embedding-3-small (future)
  matchScore:    Number,    // cosine similarity vs. resume embedding (future)
  applied:       Boolean,   // tracked via dashboard (default: false)
  scrapedAt:     Date
}
```

---

## Filter Logic

**Hard filter** (applied before any embedding to save API cost):

- Tech stack overlaps with: `React`, `Angular`, `Node.js`, `Express`, `TypeScript`, `JavaScript`, `Next.js`
- Company size: 5–200 employees (or unknown)
- Not already marked `applied: true`

**Ranking** (planned): cosine similarity between job embedding and resume embedding, stored as `matchScore`.

---

## Environment Variables

Managed via [varlock](https://github.com/varlock/varlock). Required vars:

```
ANTHROPIC_API_KEY   # Claude API key (used in filter.js)
MONGODB_URI         # MongoDB connection string
```
