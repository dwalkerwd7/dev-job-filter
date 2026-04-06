SMB Job Scraper
A personal tool to discover, extract, rank, and track SMB/startup job postings based on resume fit.
Stack

Scraper: Playwright or Puppeteer (Node.js)
Extraction: Claude API (parse raw HTML → structured JSON)
Ranking: OpenAI or similar embeddings + cosine similarity vs. resume
Backend/DB: MongoDB
Frontend: Next.js dashboard

Architecture
[Scheduler / cron]
       ↓
[Scraper layer]        ← Playwright/Puppeteer
       ↓
[LLM extraction]       ← Claude API: HTML → structured JSON
       ↓
[Hard filter]          ← Rule-based (stack match, company size, not already applied)
       ↓
[Embedding rank]       ← Cosine similarity vs. resume embedding
       ↓
[MongoDB + Next.js dashboard]
Data Sources
Use APIs where available — do not scrape gated platforms (LinkedIn, Indeed):

Adzuna API — free tier, good SMB coverage
The Muse API — startup/culture-forward companies
RemoteOK / Remotive — free public JSON APIs
Greenhouse API / Lever API — many startups use these ATS platforms with public job feeds
Direct company career pages — scraping generally allowed

MongoDB Document Shape
js{
  title: String,
  company: String,
  extractedText: String,
  tech_stack: [String],
  employee_count: Number,
  embedding: [Number],   // 1536 floats (text-embedding-3-small)
  matchScore: Number,    // cosine similarity vs. resume
  applied: Boolean,
  scrapedAt: Date
}
Filtering & Ranking Logic

Hard filter first (before embedding to save API costs):

Stack overlap with target skills (React, Node.js, TypeScript, Next.js)
Company size < 200 employees
Not already applied


Embed + rank remaining candidates via cosine similarity against resume embedding
Store matchScore in MongoDB; dashboard queries sorted by score descending

Key Decisions

No custom ML model needed at this scale — use LLM for extraction, embeddings for ranking
Store embeddings directly in MongoDB (no vector DB needed for hundreds of jobs; migrate to pgvector or MongoDB Atlas Vector Search if scale increases)
Fine-tuning a sentence-transformers model on labeled apply/outcome data is a future v2 option

Commands

(fill in as the project develops)
