---
name: Dashboard Architecture
description: Next.js App Router structure, components, API routes, and key UI patterns
type: project
originSessionId: ba0154fa-240d-437f-ba4e-d6f4d5066aba
---
**Why:** Read-only (mostly) job review UI — user marks jobs applied or dismissed, filters by arrangement/search, views paginated results.
**How to apply:** Server components fetch from DB directly; client components handle interactivity. All state lives in URL params.

## Stack
- Next.js 16.2.2, React 19.2.4, Tailwind 4, TypeScript 5
- Mongoose for DB queries (same MongoDB Atlas instance as pipeline)
- `varlock` overrides `@next/env` for env var management

## App Router Structure
```
src/app/
  page.tsx              — Main layout with two Suspense boundaries
  layout.tsx            — Root layout (Geist fonts)
  api/
    jobs/route.ts       — GET all jobs (currently unused by dashboard)
    jobs/[id]/route.ts  — PATCH job fields (applied, dismissed)
```

## Components
| Component | Type | Role |
|---|---|---|
| StatsBar | Server | Queries DB for totals; renders StatsCards |
| StatsCards | Client | 4 stat cards; clicking sets ?view= URL param |
| FilterBar | Client | Arrangement dropdown + 300ms debounced search; updates URL params |
| JobList | Server | Paginated DB query from URL params; renders cards |
| JobCard | Client | Per-job card; Applied/Dismiss toggles via PATCH |
| Pagination | Client | Page nav + page size controls (10–50) |

## URL Params (all state in URL)
- `?view=all|passed|applied|dismissed`
- `?arrangement=remote|hybrid|in-person`
- `?search=<text>`
- `?page=<n>`
- `?pageSize=10|20|30|40|50`

## Key Patterns
- Suspense key on JobList includes filters to force re-suspend on filter changes
- StatsCards uses `useTransition()` for optimistic view switching
- Connection caching: `mongodb.ts` caches Mongoose connection on `global` to survive hot reloads
- Dismissed jobs hidden from all views except `?view=dismissed`
- JobCard uses `e.stopPropagation()` on buttons to prevent parent click triggers
