---
phase: 02-data-pipeline-privacy
plan: 04
subsystem: pipeline
tags: [privacy-audit, fail-closed, visibility-tiers, allowlist, minors-guard, schema-validation, ajv]

# Dependency graph
requires:
  - phase: 02-data-pipeline-privacy/01
    provides: "Canonical schema, EXIF/GPS privacy utilities, Instagram parser"
  - phase: 02-data-pipeline-privacy/02
    provides: "Carbonmade parser, epoch config, pipeline config"
  - phase: 02-data-pipeline-privacy/03
    provides: "Pipeline orchestrator, edge generation, data loader"
provides:
  - "Fail-closed privacy audit scanning complete output (PRIV-02/03/05/06/07)"
  - "Two-phase visibility: parser defaults refined by allowlist + curation + minors + most-restrictive-wins"
  - "Minors guard: first names only, no GPS, no school/home identifiers (PRIV-05)"
  - "Schema validation with ajv for graph and layout JSON"
  - "allowlist.json and curation.json version-controlled templates"
  - "Pipeline exits code 1 on any privacy violation or schema error"
affects: [02-data-pipeline-privacy/05, 04-admin-auth]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-phase visibility: parsers set source defaults, pipeline refines via allowlist/curation/minors"
    - "Fail-closed privacy audit as final pipeline step before write"
    - "Most-restrictive-wins rule for visibility tier assignment"
    - "Allowlist-based name redaction: non-public names replaced with generic labels"

key-files:
  created:
    - "pipeline/privacy/visibility.mjs"
    - "pipeline/privacy/minors-guard.mjs"
    - "pipeline/validation/privacy-audit.mjs"
    - "pipeline/validation/schema-validator.mjs"
    - "allowlist.json"
    - "curation.json"
  modified:
    - "pipeline/index.mjs"

key-decisions:
  - "Allowlist enforcement caps visibility at friends for unknown people (cannot be public with uncleared names)"
  - "Minors last-name stripping uses case-sensitive uppercase detection for name tokens (not case-insensitive regex)"
  - "Privacy audit scans stringified output for PRIV-06 forbidden patterns (DMs, contact graphs, close friends)"
  - "Curation.json supports both new format (hidden array + visibility_overrides) and legacy format (nodes map) for backward compatibility"
  - "Pipeline runs 13 phases sequentially: parse -> curation -> visibility -> allowlist -> minors -> filter -> EXIF/GPS -> edges -> layout -> build -> schema -> audit -> emit"

patterns-established:
  - "Privacy audit: auditPrivacy(graph, config) returns { violations, warnings } -- violations > 0 = exit 1"
  - "Schema validation: validateSchema(graph, layout) returns { valid, errors } -- not valid = exit 1"
  - "Visibility refinement: assignVisibility(node, allowlist, overrides) applies most-restrictive-wins"
  - "Name redaction: applyAllowlist(nodes, allowlist) replaces non-public names with 'Friend'"
  - "Minors guard: enforceMinorsPolicy(node, allowlist) strips last names, removes GPS, redacts blocked patterns, sets _isMinor flag"

requirements-completed: [PRIV-01, PRIV-02, PRIV-05, PRIV-06, PRIV-07, PRIV-08]

# Metrics
duration: 7min
completed: 2026-02-28
---

# Phase 2 Plan 4: Privacy Validation & Visibility Refinement Summary

**Fail-closed privacy audit with exit-code-1 enforcement, two-phase visibility refinement via allowlist/curation/minors with most-restrictive-wins, and ajv schema validation for pipeline output**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-28T16:16:33Z
- **Completed:** 2026-02-28T16:23:08Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Fail-closed privacy audit scanning complete output JSON for PRIV-02 (no private nodes), PRIV-03 (GPS decimals), PRIV-05 (minors), PRIV-06 (DMs/contact graphs), PRIV-07 (non-public full names)
- Two-phase visibility system: parsers set source defaults (Instagram=private, Carbonmade=public), pipeline refines via allowlist enforcement, curation overrides, minors policy, and most-restrictive-wins rule
- Minors guard strips last names, removes GPS data, redacts blocked patterns (school names, home identifiers), and marks nodes with _isMinor flag for audit verification
- Schema validation with ajv ensures graph and layout JSON conform to expected structure before output
- Pipeline now runs 13 sequential phases with fail-closed guarantees: any privacy violation or schema error exits with code 1
- 16 person names auto-replaced with generic labels ("Friend") by allowlist enforcement on real Carbonmade data

## Task Commits

Each task was committed atomically:

1. **Task 1: Visibility tier refinement, allowlist, and minors guard** - `c2344db` (feat) -- visibility.mjs, minors-guard.mjs, allowlist.json, curation.json
2. **Task 2: Privacy audit, schema validation, and pipeline integration** - `70aafd3` (feat) -- privacy-audit.mjs, schema-validator.mjs, index.mjs

## Files Created/Modified
- `pipeline/privacy/visibility.mjs` - Visibility tier refinement: assignVisibility(), applyAllowlist(), filterPrivateNodes()
- `pipeline/privacy/minors-guard.mjs` - Minors policy: isMinor(), enforceMinorsPolicy() with last-name stripping and blocked pattern redaction
- `pipeline/validation/privacy-audit.mjs` - Fail-closed privacy audit: auditPrivacy() checks PRIV-02/03/05/06/07
- `pipeline/validation/schema-validator.mjs` - JSON Schema validation: validateSchema() using ajv for graph and layout structure
- `pipeline/index.mjs` - Updated orchestrator: 13-phase execution with visibility refinement, minors guard, schema validation, and privacy audit integration
- `allowlist.json` - People allowlist template: public, friends, minors (firstNames + blockedPatterns)
- `curation.json` - Node curation state template: hidden list + visibility_overrides (read-only input to pipeline)

## Decisions Made
- **Allowlist caps unknown people at friends:** Any node mentioning people not on the public allowlist gets visibility capped at "friends" -- cannot be public with uncleared names. This is the most-restrictive-wins rule in action.
- **Case-sensitive last-name detection:** The minors guard uses case-sensitive uppercase detection for last-name tokens (words starting with A-Z) rather than case-insensitive regex, preventing false matches on common lowercase words like "at", "the", "and".
- **Curation format compatibility:** The pipeline supports both the new curation.json format (hidden array + visibility_overrides object) and the legacy format (nodes map with per-node hidden/visibility) for backward compatibility with Plan 03.
- **13-phase pipeline:** Extended from 6 phases to 13 to integrate visibility refinement, allowlist, minors guard, private node filtering, schema validation, and privacy audit as discrete, auditable steps.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed case-insensitive regex consuming entire text in minors last-name stripping**
- **Found during:** Task 1 (minors-guard.mjs implementation)
- **Issue:** Initial regex used `gi` flags which made `[A-Z]` match lowercase letters too, causing the entire remaining text after a minor's name to be consumed as "last name" tokens. "Jace Rowe at the park" became "Jace" instead of "Jace at the park".
- **Fix:** Replaced regex approach with a custom replacer function that matches first names case-insensitively but detects last-name tokens with case-SENSITIVE uppercase check.
- **Files modified:** pipeline/privacy/minors-guard.mjs
- **Verification:** "Jace Rowe at the park" correctly becomes "Jace at the park"
- **Committed in:** c2344db (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix for correct minors name stripping. Without this fix, all text after a minor's name would be erroneously removed.

## Issues Encountered
- Instagram export directory still not available (data-private/instagram/) -- parser returns empty array gracefully, pipeline succeeds with Carbonmade-only data (60 nodes)
- Edge count changed from 93 to 88 after visibility refinement: 13 nodes changed from public to friends visibility (due to unknown people), which slightly affects edge generation (fewer shared-entity signals when names are genericized to "Friend")

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Privacy audit provides fail-closed guarantee for all pipeline output
- allowlist.json ready for population with real names when user decides which people should appear publicly
- curation.json ready for admin UI integration (Plan 05): hidden list + visibility overrides
- Pipeline runs end-to-end with all privacy/validation checks: 60 nodes, 88 edges, 0 violations
- Instagram parser will produce additional nodes with their own privacy protections when export is provided

## Self-Check: PASSED

---
*Phase: 02-data-pipeline-privacy*
*Completed: 2026-02-28*
