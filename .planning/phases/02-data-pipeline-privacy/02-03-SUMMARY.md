---
phase: 02-data-pipeline-privacy
plan: 03
subsystem: pipeline
tags: [edge-generation, signal-weights, helix-layout, pipeline-orchestrator, data-loader, deterministic-output]

# Dependency graph
requires:
  - phase: 02-data-pipeline-privacy/01
    provides: "Canonical schema, EXIF/GPS privacy utilities, Instagram parser, logger, deterministic helpers"
  - phase: 02-data-pipeline-privacy/02
    provides: "Carbonmade parser, epoch config, pipeline config"
provides:
  - "Evidence-based edge generation with locked signal weight table and 6-per-type pruning"
  - "Pipeline orchestrator running end-to-end (parse -> curation -> privacy -> connect -> layout -> emit)"
  - "Deterministic constellation.graph.json (60 nodes, 93 edges) and constellation.layout.json"
  - "Frontend data loader with real-data fetch and mock fallback"
  - "npm run pipeline and prebuild scripts"
affects: [02-data-pipeline-privacy/04, 02-data-pipeline-privacy/05, 03-narrator-guided-tour]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Signal weight table for evidence-based edge creation with threshold pruning"
    - "Pipeline orchestrator with phased execution (parse -> curation -> privacy -> connect -> layout -> emit)"
    - "Deterministic JSON output with sorted arrays and deterministicStringify"
    - "Frontend data loader pattern: fetch real data or fall back to mock"

key-files:
  created:
    - "pipeline/edges/signals.mjs"
    - "pipeline/edges/edge-generator.mjs"
    - "pipeline/layout/helix.mjs"
    - "pipeline/index.mjs"
    - "src/constellation/data/loader.js"
  modified:
    - "package.json"
    - "pipeline/privacy/exif-stripper.mjs"
    - ".gitignore"

key-decisions:
  - "Bonus signals shared-place (0.25) and shared-client (0.35) added within discretion for richer evidence"
  - "Pruning keeps top 6 edges per node per signal type (not top 6 total per node)"
  - "Pipeline output files gitignored (public/data/) since they are build artifacts"
  - "Frontend loader uses import.meta.env.BASE_URL for Vite-compatible path resolution"
  - "Pipeline-status.json is the only file with timestamps (constellation data is timestamp-free for determinism)"

patterns-established:
  - "Signal calculation: calculateSignals(nodeA, nodeB) returns evidence array for all matching signal types"
  - "Edge generation: sorted pair iteration -> signal calculation -> threshold filter -> per-type pruning -> deterministic sort"
  - "Pipeline orchestrator: sequential phases with logging, zero Math.random(), deterministic output"
  - "Data loader: try fetch real data, catch fall back to mock -- same output shape"

requirements-completed: [PIPE-03, PIPE-04, PIPE-05, PRIV-09]

# Metrics
duration: 6min
completed: 2026-02-28
---

# Phase 2 Plan 3: Pipeline Orchestrator & Edge Generation Summary

**Evidence-based edge generation with locked signal weights (93 edges from 60 nodes), end-to-end pipeline orchestrator producing deterministic constellation JSON, and frontend data loader with mock fallback**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-28T16:06:46Z
- **Completed:** 2026-02-28T16:12:56Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Signal weight module with locked table (same-day 0.8, shared-project 0.7, shared-entity 0.6, shared-tags 0.4, temporal-proximity 0.3) plus bonus signals (shared-place 0.25, shared-client 0.35)
- Edge generator producing 93 evidence-based edges from 60 real Carbonmade nodes (1770 pairs evaluated, 42 edges pruned)
- Pipeline orchestrator running 6 phases end-to-end in 4.1 seconds: parse (60 nodes), curation (read-only), privacy (264 media files stripped), edge generation, helix layout, emit
- Deterministic output verified -- byte-identical constellation.graph.json and constellation.layout.json across multiple runs
- Frontend data loader ready for component migration (fetch real data with mock fallback)

## Task Commits

Each task was committed atomically:

1. **Task 1: Evidence-based edge generation and helix layout** - `7613f4e` (feat) -- signals.mjs, edge-generator.mjs, helix.mjs
2. **Task 2: Pipeline orchestrator and frontend data loader** - `fad3112` (feat) -- index.mjs, loader.js, package.json scripts, exifr fix

## Files Created/Modified
- `pipeline/edges/signals.mjs` - Signal weight constants (LOCKED table) and calculateSignals() for evidence-based edges
- `pipeline/edges/edge-generator.mjs` - generateEdges() with threshold filtering, per-type pruning (top 6), and deterministic sorting
- `pipeline/layout/helix.mjs` - computePipelineLayout() producing positions map for constellation.layout.json
- `pipeline/index.mjs` - End-to-end pipeline orchestrator: parse -> curation -> privacy -> connect -> layout -> emit
- `src/constellation/data/loader.js` - Frontend data loader: fetch real data or fall back to mock-constellation.json
- `package.json` - Added "pipeline" and "prebuild" scripts
- `pipeline/privacy/exif-stripper.mjs` - Fixed exifr import (default import, not namespace)
- `.gitignore` - Added public/data/ and data-private/ to prevent committing build artifacts and private data

## Decisions Made
- **Bonus signals added:** shared-place (0.25) and shared-client (0.35) enrich evidence quality beyond the locked core table. Both are below the 0.5 threshold alone so they only contribute as supplementary signals.
- **Per-type pruning:** Top 6 edges per node per signal type (not top 6 total). This keeps diverse edge types rather than only keeping the strongest signals.
- **Pipeline output gitignored:** constellation.graph.json, constellation.layout.json, and pipeline-status.json are build artifacts generated at build time. They should not be checked into version control per the phase context ("Build artifact only").
- **Loader uses BASE_URL:** The data loader prepends `import.meta.env.BASE_URL` to fetch paths, supporting both Vercel (`/`) and GitHub Pages (`/jarowe/`) deployments.
- **curation.json is read-only:** The pipeline reads curation.json if present but never writes to it. Runtime stats go to pipeline-status.json (separate concern).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed exifr import in exif-stripper.mjs**
- **Found during:** Task 2 (Pipeline orchestrator run)
- **Issue:** `import * as exifr from 'exifr'` resulted in `exifr.parse is not a function` because exifr uses a default export, not named exports. This was a pre-existing bug from Plan 01 that manifested as info-level "Could not parse EXIF" messages during verification.
- **Fix:** Changed to `import exifr from 'exifr'` (default import)
- **Files modified:** pipeline/privacy/exif-stripper.mjs
- **Verification:** `node -e "import exifr from 'exifr'; console.log(typeof exifr.parse);"` returns "function"
- **Committed in:** fad3112 (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added public/data/ and data-private/ to .gitignore**
- **Found during:** Task 2 (after pipeline emit phase)
- **Issue:** Pipeline output files (constellation.graph.json, constellation.layout.json, pipeline-status.json) and private data directory were not gitignored. Per phase context: "Build artifact only. NOT checked into git."
- **Fix:** Added `public/data/` and `data-private/` to .gitignore
- **Files modified:** .gitignore
- **Verification:** `git check-ignore public/data/` confirms the directory is now ignored
- **Committed in:** Will be part of metadata commit

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both fixes necessary for correctness. Exifr fix ensures EXIF verification actually works. Gitignore prevents accidental commit of build artifacts and private data.

## Issues Encountered
- Instagram export directory not available (`data-private/instagram/`) -- parser returns empty array gracefully. Pipeline still succeeds with Carbonmade-only data (60 nodes).
- Carbonmade local project images exist but are processed through EXIF stripping during the privacy phase (264 media files). CDN URLs are passed through as-is.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Pipeline produces valid constellation JSON from real Carbonmade data (60 nodes, 93 edges)
- Output format is a drop-in replacement for mock-constellation.json (superset of fields)
- Data loader is ready for component migration (Plan 04 or later)
- Instagram parser will produce additional nodes when the export is placed at data-private/instagram/
- Privacy module needs allowlist.json for production visibility overrides (Plan 04)
- Pipeline runs automatically before build via prebuild script

## Self-Check: PASSED

---
*Phase: 02-data-pipeline-privacy*
*Completed: 2026-02-28*
