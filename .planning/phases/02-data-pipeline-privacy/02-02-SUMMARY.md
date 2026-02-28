---
phase: 02-data-pipeline-privacy
plan: 02
subsystem: pipeline
tags: [carbonmade, json-parser, epochs, pipeline-config, entity-extraction, date-fns]

# Dependency graph
requires:
  - phase: 02-data-pipeline-privacy/01
    provides: "canonical schema (createCanonicalNode), logger, deterministic utils"
provides:
  - "Carbonmade JSON parser producing 60 canonical nodes (35 projects, 20 blog posts, 5 milestones)"
  - "Configurable epoch system with 5 epochs covering 2001-2026"
  - "Pipeline config centralizing all source dirs, output paths, privacy and layout defaults"
  - "Entity extraction (clients, collaborators, tags, locations) for edge generation"
affects: [02-data-pipeline-privacy/03, 02-data-pipeline-privacy/04, 02-data-pipeline-privacy/05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Epoch assignment via configurable boundaries with edge-case clamping"
    - "HTML entity cleaning across all text fields from external data"
    - "NLP-style name extraction with stop-word filtering and word-length validation"
    - "Defensive date parsing for multiple formats (year, range, Month DD YYYY, Month YYYY)"

key-files:
  created:
    - "pipeline/config/epochs.mjs"
    - "pipeline/config/pipeline-config.mjs"
    - "pipeline/parsers/carbonmade.mjs"
  modified:
    - "pipeline/schemas/canonical.mjs"

key-decisions:
  - "Blog posts are 20 (not 31 as estimated in research) -- actual count from archive used"
  - "Epoch ranges start at 2001 (not 2005) to capture AOTV experience entry"
  - "People extraction limited to 2-3 word proper names with stop-word filtering to prevent prose capture"
  - "Project date ranges use start year (2008-2014 -> 2008-01-01)"
  - "imageUrls parsed by taking first URL from srcset-style strings"

patterns-established:
  - "Canonical node factory: createCanonicalNode() validates required fields and fills safe defaults"
  - "Epoch assignment: assignEpoch(dateStr) handles any date format via regex year extraction"
  - "Entity extraction: client names from project.for field, collaborators via NLP patterns"
  - "Pipeline config: PIPELINE_CONFIG object centralizes all paths and defaults"

requirements-completed: [PIPE-02, PRIV-01]

# Metrics
duration: 9min
completed: 2026-02-28
---

# Phase 2 Plan 2: Carbonmade JSON Parser Summary

**Carbonmade archive parsed into 60 canonical nodes (35 projects, 20 blog posts, 5 milestones) with entity extraction, epoch assignment, and configurable pipeline config**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-28T15:54:27Z
- **Completed:** 2026-02-28T16:03:03Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Epoch configuration system covering 2001-2026 in 5 configurable epochs matching mock-constellation.json labels
- Pipeline config centralizing all source directories, output paths, privacy defaults, and layout parameters
- Carbonmade parser extracting 35 projects, 20 blog posts, and 5 experience milestones into canonical nodes
- Entity extraction capturing client names (Sony PlayStation, Disney, Google, etc.), collaborator names (Jeff Halalay, Derek Alan, Hanggoro Candra), locations, and role tags
- Deterministic output verified (same input produces identical JSON on multiple runs)

## Task Commits

Each task was committed atomically:

1. **Task 1: Pipeline config and epoch assignment** - `1c9e167` (feat)
2. **Task 2: Carbonmade JSON parser** - `658087b` (feat)

## Files Created/Modified
- `pipeline/config/epochs.mjs` - Configurable epoch boundaries with assignEpoch() and getEpochConfig()
- `pipeline/config/pipeline-config.mjs` - Central PIPELINE_CONFIG with source dirs, output paths, privacy and layout defaults
- `pipeline/parsers/carbonmade.mjs` - Carbonmade JSON parser: projects, blog posts, experience milestones
- `pipeline/schemas/canonical.mjs` - Updated to use shared epoch module from pipeline/config/epochs.mjs

## Decisions Made
- **Blog count is 20 not 31:** The research estimated 31 blog posts but the actual blog.json contains 20 posts. The parser handles the actual count correctly.
- **Epoch ranges adjusted:** Early Years starts at 2001 (not 2005 as in mock) to capture the AOTV experience entry from 2001.
- **People extraction precision:** Limited name capture to 2-3 word proper names with stop-word filtering. This prevents greedy regex from capturing prose text after names. Trade-off: may miss some less common name patterns, but avoids false positives.
- **Date range handling:** For project date ranges like "2008 - 2014", the start year is used (2008-01-01). This places the project in the epoch when work began.
- **Image URL parsing:** Carbonmade imageUrls contain srcset-style strings ("url 1x, url 2x"). Parser takes the first URL only.
- **Canonical schema default size:** Changed from 0.8 to 1.0 to match plan specification for standard projects.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Canonical schema needed epoch module update**
- **Found during:** Task 1 (Pipeline config and epoch assignment)
- **Issue:** The existing canonical.mjs (from partial 02-01 execution) had its own embedded epoch logic (DEFAULT_EPOCHS, getEpoch). Task 1 needed to create the proper epochs.mjs module and have canonical.mjs use it.
- **Fix:** Updated canonical.mjs to import assignEpoch from pipeline/config/epochs.mjs instead of using embedded epoch config. Also fixed default size from 0.8 to 1.0.
- **Files modified:** pipeline/schemas/canonical.mjs
- **Verification:** node -e verify confirmed canonical nodes get correct epoch labels
- **Committed in:** 1c9e167 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to establish proper module boundaries. No scope creep.

## Issues Encountered
- People extraction regex initially captured too much text (greedy matching beyond proper names). Fixed by limiting repeated groups to {1,3} words and adding stop-word validation. The improved version correctly identifies names like "Jeff Halalay", "Derek Alan", "Hanggoro Candra" without capturing surrounding prose.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- 60 canonical nodes ready for edge generation (plan 02-03)
- Entity data (clients, people, tags, locations) available for evidence-based edge creation
- Pipeline config centralized for use by all subsequent pipeline modules
- Epoch assignment tested across full date range (2001-2026)
- Blog posts count is 20 (not 31 as estimated) -- edge generation should use actual data counts

## Self-Check: PASSED

---
*Phase: 02-data-pipeline-privacy*
*Completed: 2026-02-28*
