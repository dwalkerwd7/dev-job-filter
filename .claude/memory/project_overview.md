---
name: Project Overview
description: Architecture, stack, pipeline flow, data sources, and key design decisions for the SMB job scraper
type: project
originSessionId: ba0154fa-240d-437f-ba4e-d6f4d5066aba
---
Personal tool to discover, filter, and track SMB/startup job postings against a target tech stack.

**Why:** Resume-fit job discovery — scrapes Greenhouse-hosted jobs, filters by stack match via Claude, surfaces results in a dashboard.

**How to apply:** Always understand this as a personal productivity tool; suggestions should favor simplicity and low cost over scalability.

## Stack
- Scraper: Playwright (Node.js) — `pipeline/scraper.js`
- Extraction: Claude Haiku (`claude-haiku-4-5-20251001`) — `pipeline/filter.js`, `pipeline/info.js`
- DB: MongoDB Atlas free tier + Mongoose — `pipeline/lib/db.js`
- Frontend: Next.js 16.2.2 + Tailwind 4 — `dashboard/`
- Env management: `varlock` wraps CLI commands in both pipeline and dashboard

## Pipeline Flow
```
Serper API (Google search) → Greenhouse company slugs
→ Greenhouse public API → job list
→ Playwright deep scrape → jobDesc
→ Claude Haiku pre-filter + stack extraction → tech_stack, filterPassed
→ Claude Haiku info gather → location, workArrangement
→ MongoDB → Next.js dashboard
```

## Data Source
Only Greenhouse API (discovered via Serper `site:boards.greenhouse.io` search). No LinkedIn/Indeed scraping.

## Key Design Decisions
- `url` is the unique key; prevents duplicates across pipeline runs
- `filterRan` + `filterPassed` flags track which pipeline stage each job completed
- Tech stack checkpointed every 10 batches (`upsertTechStackProgress`) so interrupted runs resume without re-calling Claude
- Jobs with existing `tech_stack` skip the Claude call entirely
- All DB queries use `.lean()` for performance
- MongoDB Atlas free tier drops idle sockets at ~60s; pipeline sets `socketTimeoutMS: 120000`
- Pre-filter extracts text windows around keywords before sending to Claude (reduces tokens, improves relevance)

## Environment Variables (in `pipeline/.env.schema`)
- `MONGODB_URI`, `ANTHROPIC_API_KEY`, `SERPER_API_KEY`

## Cost Reference
~$0.33 Claude tokens + ~20 min runtime for 800 jobs
