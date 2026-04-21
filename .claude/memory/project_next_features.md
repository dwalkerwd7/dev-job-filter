---
name: Planned Next Dashboard Features
description: Agreed next steps for dashboard development, in priority order
type: project
originSessionId: b013672a-d815-4844-a5dc-5bf60db1976f
---
**Next up: Sort controls**

Add a `?sort=` URL param with options: `newest` (default), `oldest`, `company`, `title`. Sorting by company naturally groups same-company roles together, which was the company deduplication ask.

Implementation order agreed on:
1. `JobList.tsx` — swap hardcoded `.sort({ scrapedAt: -1 })` for a sort map; add `sort` to `Filters` type
2. `FilterBar.tsx` — add sort `<select>` dropdown following same pattern as arrangement dropdown
3. `page.tsx` — add `sort` to the Suspense key

**Next: Pipeline run status page** (read-only, queries DB metadata for last run time, job counts per stage, errors). TabNav is complete as of 2026-04-19.

**Why:** User confirmed this priority order in conversation on 2026-04-19.
**How to apply:** Implement in the order listed above. Do not skip ahead to the status page.
