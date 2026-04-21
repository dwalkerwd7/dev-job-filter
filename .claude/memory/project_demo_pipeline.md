---
name: Demo Pipeline Plan
description: Plan for a portfolio demo version of the back-end pipeline using log replay and fixture data
type: project
originSessionId: 3dd58fca-8048-46e5-92dc-10573885620d
---
Portfolio demo mode that runs without real API keys, uses fixture data, and replays a captured log at sped-up speed.

**Why:** Personal tool needs a demo version for portfolio/employer review — no API keys required, full pipeline flow still visible.

**How to apply:** Use this as the implementation spec when building demo mode.

## Files to create
- `pipeline/lib/demoReplay.js` — log replayer (timestamp parser + speed-scaled emitter)
- `pipeline/fixtures/jobs.json` — DB snapshot exported after a full pipeline run
- `pipeline/demo.js` — seeds DB from fixtures, then kicks off the replayer

## Files to modify
- `pipeline/lib/db.js` — add `seedDemoJobs(fixtures)` helper
- `/api/pipeline/run/route.ts` — check `body.demo === true`; spawn `demo.js` instead of `pipeline.js`

## Replayer logic (`demoReplay.js`)
- Parse each line: `/^\[(.+?)\] LOG\s+(.+)$/`
- Compute delta = ts[n] - ts[n-1]
- Emit stripped line (no timestamp prefix) after `setTimeout(delta / DEMO_SPEED)`
- `DEMO_SPEED = 20` hardcoded constant (13s Claude gaps → ~650ms)

## DB seeding (`demo.js`)
- Wipe jobs collection
- Insert `fixtures/jobs.json` docs in **pre-pipeline state** (`filterRan: false`) so funnel card counts update live during replay
- Then stream the log replay

## Log format
`[ISO_TIMESTAMP] LOG   [tag] message`
Example: `[2026-04-20T16:30:21.187Z] LOG   [filter] stack [1/151]`

## Prerequisite
User needs to capture a full run log (scrape → filter → info) in one shot. Pipeline writes to `logs/` automatically. Log file is the source of truth for both timing and mock output.
