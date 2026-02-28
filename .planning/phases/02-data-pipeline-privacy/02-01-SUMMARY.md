---
phase: 02-data-pipeline-privacy
plan: 01
subsystem: pipeline
tags: [cheerio, sharp, exifr, instagram, html-parser, exif, gps, privacy, canonical-schema]

# Dependency graph
requires:
  - phase: 01-constellation-scene
    provides: "mock-constellation.json node/edge schema as target format"
provides:
  - "Canonical node schema factory (createCanonicalNode) matching mock-constellation.json shape"
  - "EXIF stripping (sharp) with post-strip GPS verification (exifr)"
  - "GPS redactor truncating to 2 decimal places with minors/private null handling"
  - "Instagram HTML parser with discovery, defensive extraction, and within-source dedup"
  - "Pipeline logger with module context and warning counters"
  - "Deterministic helpers: sorted JSON stringify, mulberry32 PRNG, sortedGlob"
affects: [02-data-pipeline-privacy, 03-narrator-guided-tour]

# Tech tracking
tech-stack:
  added: [cheerio, sharp, exifr, glob, ajv, date-fns]
  patterns: [pipeline-as-script, canonical-node-schema, fail-closed-privacy, defensive-html-parsing]

key-files:
  created:
    - pipeline/schemas/canonical.mjs
    - pipeline/privacy/exif-stripper.mjs
    - pipeline/privacy/gps-redactor.mjs
    - pipeline/utils/logger.mjs
    - pipeline/utils/deterministic.mjs
    - pipeline/parsers/instagram.mjs
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "3 visibility tiers (public/friends/private) -- redacted is a transformation, not a tier"
  - "Default visibility is private -- allowlist promotes to public/friends"
  - "Instagram parser uses configurable selector strategy with discovery phase for format adaptation"
  - "Within-source dedup only (by sourceId hash) -- cross-source dedup deferred"
  - "assignEpoch from config/epochs.mjs for epoch assignment (shared with 02-02)"

patterns-established:
  - "Canonical node factory: createCanonicalNode() validates required fields, fills safe defaults"
  - "Fail-closed EXIF: stripAndVerify() throws on GPS data survival"
  - "GPS truncation: Number(Number(val).toFixed(2)) for IEEE 754 safety"
  - "Configurable selectors: SELECTORS object at top of parser for easy tweaking"
  - "Pipeline logger: createLogger(module) with warn counting and summary"

requirements-completed: [PIPE-01, PIPE-06, PRIV-03, PRIV-04]

# Metrics
duration: 5min
completed: 2026-02-28
---

# Phase 2 Plan 1: Instagram Parser & Pipeline Foundation Summary

**Canonical node schema, EXIF/GPS privacy utilities, and Instagram HTML parser with multi-strategy selector discovery and defensive null-safe extraction**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-28T15:54:06Z
- **Completed:** 2026-02-28T15:59:34Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Canonical node schema factory producing objects matching mock-constellation.json with exactly 3 visibility tiers
- EXIF stripping using sharp (strip all metadata) + exifr (verify no GPS survives) with fail-closed semantics
- GPS redactor truncating coordinates to 2 decimal places (~1.1km city-level) with IEEE 754 floating-point safety
- Instagram HTML parser with discovery phase, configurable selectors, multi-format date parsing, hashtag extraction, within-source dedup, and graceful missing-directory handling
- Pipeline logger, deterministic JSON stringify, mulberry32 PRNG, and sorted glob utilities

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared pipeline foundation** - `9525e27` (feat) -- canonical schema, EXIF stripper, GPS redactor, logger, deterministic helpers, 6 dev dependencies
2. **Task 2: Instagram HTML parser** - `6eebb07` (feat) -- parseInstagram() with discovery, extraction, normalization, dedup

## Files Created/Modified
- `pipeline/schemas/canonical.mjs` - Canonical node factory, NODE_TYPES, VISIBILITY_TIERS, with assignEpoch integration
- `pipeline/privacy/exif-stripper.mjs` - stripExif(), verifyNoExif(), stripAndVerify() using sharp + exifr
- `pipeline/privacy/gps-redactor.mjs` - redactGPS() with minors/private null handling and 2-decimal truncation
- `pipeline/utils/logger.mjs` - createLogger() with module context, warning counters, printLogSummary()
- `pipeline/utils/deterministic.mjs` - deterministicStringify(), mulberry32(), sortedGlob()
- `pipeline/parsers/instagram.mjs` - parseInstagram() with full discovery/parse/normalize/dedup pipeline
- `package.json` - Added cheerio, sharp, exifr, glob, ajv, date-fns as devDependencies
- `package-lock.json` - Lock file updated

## Decisions Made
- Used `assignEpoch` from shared `pipeline/config/epochs.mjs` module (created by 02-02 config commit) rather than inline epoch logic -- this keeps epoch assignment centralized
- Default visibility set to "private" for all Instagram posts -- allowlist-based promotion to public/friends happens in a later pipeline step
- sourceId generated via deterministic hash of (date + filename + index) for within-source dedup
- Selector strategy uses ordered fallback: Instagram-specific class selectors > semantic role selectors > table-based > heuristic div matching > body children fallback

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adapted imports to existing config/epochs.mjs module**
- **Found during:** Task 2 (Instagram parser creation)
- **Issue:** Plan specified importing `getEpoch` from `../schemas/canonical.mjs`, but a prior commit (1c9e167, feat(02-02)) had refactored epoch assignment into `../config/epochs.mjs` as `assignEpoch`. The original `getEpoch` export no longer existed.
- **Fix:** Changed import to use `assignEpoch` from `../config/epochs.mjs` and updated the call site
- **Files modified:** pipeline/parsers/instagram.mjs
- **Verification:** Module loads without error, epoch assignment works correctly
- **Committed in:** 6eebb07 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor import path change to align with existing module structure. No scope creep.

## Issues Encountered
- Instagram export data not available at `data-private/instagram/` -- parser was verified with missing-directory graceful handling only. Full parsing verification deferred until actual export is provided.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Canonical schema, privacy utilities, and Instagram parser are ready for Plan 02 (Carbonmade parser) to reuse
- Plan 02's Carbonmade parser can import createCanonicalNode, assignEpoch, and all privacy/deterministic utilities
- Instagram parser will need selector tuning once the actual HTML export is provided
- EXIF stripping and GPS redaction are ready for the media processing step

## Self-Check: PASSED

---
*Phase: 02-data-pipeline-privacy*
*Completed: 2026-02-28*
