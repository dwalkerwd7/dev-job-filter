---
name: Pipeline Page Implementation
description: Plan and progress for the pipeline page v2 with active step highlighting and live stat updates
type: project
originSessionId: 244c493c-89b9-4c79-9408-c5771dbf0f30
---
**Status as of 2026-04-20:** v1 complete. Planning v2.

## v2 Plan — NOT STARTED

### 1. `/api/pipeline/stats` GET route
Returns `{ totalScraped, filterRan, filterPassed }` from DB. Used by PipelineView for live card updates.

### 2. `PipelineView` (new client component)
Owns: `running`, `activeStep`, card value state (initialized from server props).
- `onChunk(text)` — matches `[scraper]`/`[filter]`/`pipeline complete` → sets `activeStep`; checks for `"db"` → debounced fetch to `/api/pipeline/stats` to update card values
- Passes `running`/`setRunning`/`onChunk` down to `RunPanel`

### 3. `PipelinePage` (server component)
Fetches stats, passes as props to `PipelineView`. No longer renders cards directly.

### 4. Funnel cards (inside PipelineView)
- Active card: `ring-2 ring-green-500`
- Non-active while running: `opacity-50`
- All transitions: `transition-all duration-700`
- Tag → card mapping: `[scraper]` → Total Scraped, `[filter]` → Filter Ran, `pipeline complete` → Filter Passed
- Returns to normal on run end

### 5. `RunPanel` changes
- Replace owned `running`/`setRunning` with props
- Call `onChunk(text)` in stream loop
- "Stop" → "Halt" with `window.confirm` before calling DELETE

**Why:** User wants live pipeline feedback — active step indication and real-time DB count updates on the funnel cards.
**How to apply:** Implement in order listed. User writes all code.
