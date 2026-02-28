---
phase: 02-data-pipeline-privacy
plan: 05
subsystem: pipeline
tags: [admin, pipeline-status, curation, resilience, env-config, publish-hide, glass-ui]

# Dependency graph
requires:
  - phase: 02-data-pipeline-privacy/03
    provides: "Pipeline orchestrator, constellation.graph.json output"
  - phase: 02-data-pipeline-privacy/04
    provides: "Privacy audit, visibility tiers, curation.json format, schema validation"
provides:
  - "Pipeline resilience: last good output preserved on failure, pipeline-status.json tracks runtime state"
  - "Thin admin page at /admin with auth gate, pipeline status display, node table with publish/hide toggles"
  - "Configurable source paths via env vars (INSTAGRAM_EXPORT_DIR, CARBONMADE_ARCHIVE_DIR)"
  - "Curation.json download workflow for publish/hide changes"
affects: [04-admin-auth, 03-narrator-guided-tour]

# Tech tracking
tech-stack:
  added: [lucide-react]
  patterns:
    - "Pipeline resilience: snapshot last good output, write-on-success-only, failPipeline() for all error paths"
    - "Admin auth gate: session-only env-var key check (VITE_ADMIN_KEY), replaced by GitHub OAuth in Phase 4"
    - "Curation download workflow: admin generates curation.json for user to place in repo and re-run pipeline"
    - "Env var overrides for pipeline source paths: INSTAGRAM_EXPORT_DIR, CARBONMADE_ARCHIVE_DIR"

key-files:
  created:
    - "src/pages/Admin.jsx"
    - "src/pages/Admin.css"
    - ".env.example"
  modified:
    - "pipeline/index.mjs"
    - "pipeline/config/pipeline-config.mjs"
    - "src/App.jsx"

key-decisions:
  - "Pipeline-status.json is the ONLY runtime output file; curation.json is read-only input (never written by pipeline)"
  - "Admin auth is session-only env-var key (no localStorage persistence for security); Phase 4 replaces with GitHub OAuth"
  - "Curation changes are downloaded as JSON file (no server-side write in Phase 2); user places in repo and re-runs pipeline"
  - "Source paths configurable via INSTAGRAM_EXPORT_DIR and CARBONMADE_ARCHIVE_DIR env vars for flexible data placement"

patterns-established:
  - "failPipeline(msg, exitCode): centralized failure handler preserving last good output and writing failure status"
  - "Admin auth gate pattern: check VITE_ADMIN_KEY env var, session-only, no localStorage"
  - "Pipeline source path override: process.env.X || 'default-path' in PIPELINE_CONFIG"

requirements-completed: [PIPE-07]

# Metrics
duration: 12min
completed: 2026-02-28
---

# Phase 2 Plan 5: Thin Admin & Pipeline Resilience Summary

**Thin admin page at /admin with pipeline status display and publish/hide toggles, pipeline resilience preserving last good output on failure, and configurable Instagram source path via env var override**

## Performance

- **Duration:** 12 min (includes continuation after checkpoint)
- **Started:** 2026-02-28T16:24:00Z
- **Completed:** 2026-02-28T16:43:50Z
- **Tasks:** 3 (2 auto + 1 checkpoint with fix)
- **Files modified:** 6

## Accomplishments
- Pipeline resilience: last good constellation.graph.json and layout preserved when pipeline fails; failure written to pipeline-status.json with error description
- Thin admin page at /admin with env-var auth gate, pipeline status section (last run, success/fail badge, node/edge/visibility counts), and sortable node table with type filter pills and search
- Publish/hide toggle per node with Save Changes generating downloadable curation.json (hidden array + visibility_overrides only, no pipeline status)
- Configurable Instagram source path via INSTAGRAM_EXPORT_DIR env var, allowing flexible data placement without code changes
- Pipeline gracefully handles missing Instagram export (warns, continues with available sources)

## Task Commits

Each task was committed atomically:

1. **Task 1: Pipeline resilience and admin route setup** - `2dfc9c1` (feat) -- pipeline/index.mjs, src/App.jsx, .env.example, .gitignore
2. **Task 2: Thin admin page with pipeline status and publish/hide controls** - `e5c599d` (feat) -- src/pages/Admin.jsx, src/pages/Admin.css
3. **Task 3 fix: Configurable Instagram source path** - `1758fa5` (fix) -- pipeline/config/pipeline-config.mjs, .env.example

## Files Created/Modified
- `src/pages/Admin.jsx` - Thin admin page: auth gate, pipeline status from pipeline-status.json, sortable node table, publish/hide toggles, curation.json download
- `src/pages/Admin.css` - Admin page glass-panel styling with dark background, alternating row table, status badges, responsive layout
- `.env.example` - Documents VITE_ADMIN_KEY, INSTAGRAM_EXPORT_DIR, and CARBONMADE_ARCHIVE_DIR
- `pipeline/index.mjs` - Pipeline resilience: snapshot last good output, failPipeline() handler, pipeline-status.json write on success/failure
- `pipeline/config/pipeline-config.mjs` - Source path env var overrides (INSTAGRAM_EXPORT_DIR, CARBONMADE_ARCHIVE_DIR)
- `src/App.jsx` - Added lazy-loaded /admin route

## Decisions Made
- **Pipeline-status.json is write-only output; curation.json is read-only input:** Clean separation ensures pipeline never corrupts curation state. Pipeline status lives in gitignored public/data/, curation lives in version-controlled root.
- **Session-only admin auth:** No localStorage persistence for the admin key -- security-first approach. Phase 4 replaces with proper GitHub OAuth.
- **Download-based curation workflow:** Since Phase 2 has no API server, the admin page generates a downloadable curation.json. User replaces the file in repo and re-runs pipeline. Phase 4 adds proper server-side save.
- **Env var source path overrides:** INSTAGRAM_EXPORT_DIR and CARBONMADE_ARCHIVE_DIR allow pointing to data exports at any location on disk without modifying tracked config files.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Configurable Instagram source path via env var**
- **Found during:** Task 3 (checkpoint verification)
- **Issue:** Pipeline used hardcoded `data-private/instagram` path. User reported Instagram source path warning and requested configurability so bySource includes instagram when data is available.
- **Fix:** Added `process.env.INSTAGRAM_EXPORT_DIR || 'data-private/instagram'` in pipeline-config.mjs and documented in .env.example
- **Files modified:** pipeline/config/pipeline-config.mjs, .env.example
- **Verification:** Pipeline runs successfully, warns about missing directory, continues with Carbonmade-only data. Setting env var would enable Instagram processing.
- **Committed in:** 1758fa5

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential for Instagram data integration. Without env var override, users with non-default Instagram export locations cannot use the pipeline.

## Issues Encountered
- Instagram export directory still not available on disk -- pipeline correctly warns and continues with Carbonmade-only data (60 nodes). Instagram will appear in bySource stats once INSTAGRAM_EXPORT_DIR is set and data is provided.

## User Setup Required
None required for basic operation. To enable Instagram data processing:
1. Copy `.env.example` to `.env.local`
2. Set `INSTAGRAM_EXPORT_DIR` to the path containing your Instagram HTML export
3. Run `npm run pipeline` to process both sources

## Next Phase Readiness
- Phase 2 complete: full pipeline (parse -> privacy -> edges -> layout -> validate -> emit) operational with 60 nodes, 88 edges, 0 privacy violations
- Admin page provides early validation of pipeline/curation workflow for Phase 4
- Pipeline resilience ensures frontend always has valid data even during development
- Instagram integration ready -- just needs data export and env var configuration
- Phase 3 (Narrator) can begin: constellation data available, node structure stable

## Self-Check: PASSED

---
*Phase: 02-data-pipeline-privacy*
*Completed: 2026-02-28*
