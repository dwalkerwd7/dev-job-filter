---
name: Schema Quirks & Known Issues
description: Known schema divergence between pipeline and dashboard, and non-obvious DB behaviors
type: project
originSessionId: ba0154fa-240d-437f-ba4e-d6f4d5066aba
---
## `dismissed` field mismatch
Dashboard `Job.ts` model includes `dismissed: Boolean`; pipeline `db.js` schema does not set it. Pipeline never writes this field. If a user dismisses a job in the dashboard and the pipeline runs again, the `dismissed` field will not be cleared (upserts only set known pipeline fields), so dismissals persist. But new jobs won't have the field pre-set.

**Why:** Dashboard added `dismissed` as a UI feature after the pipeline schema was established.
**How to apply:** If asked to add pipeline-side `dismissed` support or sync schemas, this is the known gap to close.

## Regex injection risk
Search in `JobList.tsx` passes user input directly into MongoDB `$regex` with no escaping. Special regex characters in search input could cause unexpected query behavior.

**Why:** Simple personal tool, low risk in practice, but worth flagging if hardening.

## Schema fields at a glance (pipeline vs dashboard)
| Field | Pipeline | Dashboard |
|---|---|---|
| title, company, url, jobDesc | ✓ | ✓ |
| tech_stack | ✓ | ✓ |
| location, workArrangement | ✓ | ✓ |
| applied, filterRan, filterPassed | ✓ | ✓ |
| scrapedAt | ✓ | ✓ |
| dismissed | ✗ | ✓ |
