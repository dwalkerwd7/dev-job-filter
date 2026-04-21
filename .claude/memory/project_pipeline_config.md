---
name: Pipeline Config & Rate Limits
description: Batch sizes, rate limit math, Claude model pinned version, and pipeline CLI flags
type: project
originSessionId: ba0154fa-240d-437f-ba4e-d6f4d5066aba
---
All config lives in `pipeline/pipeline.cfg`.

## Claude Usage
- Model: `claude-haiku-4-5-20251001` (pinned version string, used in both filter.js and info.js)
- Stack extraction: batch 5, delay 12s between batches (math: 5 jobs × ~1100 tokens = ~5500 tokens/batch → need ≥6.6s; 12s = 1.8× headroom for 50k TPM limit)
- Info extraction: batch 5, delay 25s between batches
- Max output tokens: stack=100, location=30, workArrangement=10

## Target Stack (filter.js)
React, Angular, Node.js, Express, TypeScript, Next.js, Tailwind, SQL, NoSQL, MongoDB, PostgreSQL, HTML, CSS, Kubernetes, Docker (40+ total)

## CLI Flags (pipeline.js)
- `--no-scraping`, `--no-filtering`, `--no-info` — skip steps
- `--scrape_limit=N`, `--filter_limit=N` — limit jobs processed
- `--renew_slugs` — re-run Serper search to refresh Greenhouse company slugs

## npm Scripts (in pipeline/)
- `npm run pipeline` — full run
- `npm run scrape` — scrape only
- `npm run filter` — filter only
- `npm run info` — info gather only
- `npm run migrate` — one-time DB migration

All scripts use `varlock run --` prefix for env var injection.
