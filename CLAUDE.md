SMB Job Scraper
A personal tool to discover, extract, rank, and track SMB/startup job postings based on resume fit.
Stack

Scraper: Playwright or Puppeteer (Node.js)
Extraction: Claude API (parse raw HTML → structured JSON)
Backend/DB: MongoDB
Frontend: Next.js dashboard

Architecture
[Scraper layer]        ← Playwright/Puppeteer
       ↓
[LLM extraction]       ← Claude API: HTML → structured JSON
       ↓
[Hard filter]          ← Rule-based (stack match, not already applied)
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
  location: String,
  workArrangement: String,  // "remote" | "hybrid" | "in-person"
  applied: Boolean,
  scrapedAt: Date
}
Filtering Logic

Hard filter (stack match only):

Stack overlap with target skills (React, Node.js, TypeScript, Next.js)
Not already applied

Commands

(fill in as the project develops)
