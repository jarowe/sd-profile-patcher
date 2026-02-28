---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-02-28T16:54:12.674Z"
progress:
  total_phases: 2
  completed_phases: 2
  total_plans: 9
  completed_plans: 9
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in-progress
last_updated: "2026-02-28T16:44:00Z"
progress:
  total_phases: 2
  completed_phases: 2
  total_plans: 9
  completed_plans: 9
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-27)

**Core value:** The Constellation must render real life data as an explorable, evidence-connected 3D experience -- every node real, every connection justified, every visit a discovery.
**Current focus:** Phase 2 complete -- ready for Phase 3 (Narrator & Guided Tour)

## Current Position

Phase: 2 of 6 (Data Pipeline & Privacy) -- COMPLETE
Plan: 5 of 5 in current phase (02-01, 02-02, 02-03, 02-04, 02-05 complete)
Status: Phase 2 complete -- full pipeline operational with 60 nodes, 88 edges, fail-closed privacy, thin admin, and pipeline resilience
Last activity: 2026-02-28 -- Completed 02-05-PLAN.md (thin admin, pipeline resilience, Instagram path config)

Progress: [=========] 100% (9/9 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 9
- Average duration: 12 min
- Total execution time: 1.74 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Constellation Scene | 4/4 | 65 min | 16 min |
| 2. Data Pipeline & Privacy | 5/5 | 39 min | 8 min |

**Recent Trend:**
- Last 5 plans: 02-01 (5 min), 02-02 (9 min), 02-03 (6 min), 02-04 (7 min), 02-05 (12 min)
- Trend: Pipeline plans consistently fast -- structured data processing with clear module boundaries

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 6 phases derived from 60 requirements across 7 categories
- [Roadmap]: Privacy requirements embedded in Phase 2 (pipeline), not a separate phase -- privacy is a property of data processing, not a standalone feature
- [Roadmap]: Narrator and Guided Tour merged into one phase -- they share Zustand store, event model, and narration content
- [Roadmap]: PRIV-10 (server-side access control) assigned to Phase 4 (Admin) since it requires auth infrastructure
- [Roadmap]: Thin admin slice added to Phase 2 (plan 02-05) -- read-only pipeline status + basic publish/hide to de-risk full Admin in Phase 4
- [Roadmap]: Phase 5 Suno fallback made explicit -- last-good snapshot + manual track import/publish when adapters fail
- [01-01]: Used native instancedMesh with InstancedBufferAttribute (not Drei Instances) for zero CPU overhead
- [01-01]: GPU tier detection runs inside Canvas tree via GPUDetector child component
- [01-01]: Default to tier 2 (medium) config until GPU detection completes
- [01-01]: Breathing pulse via useFrame scale modulation rather than shader uniforms
- [01-01]: NebulaFog uses standard blending with very low opacity per MEMORY.md anti-pattern guidance
- [01-02]: Used instanceColor attribute on geometry (not material) for focus dimming -- three.js auto-applies to material color
- [01-02]: Disabled Bloom postprocessing to prevent WebGL context loss during React StrictMode double-mount
- [01-02]: Deferred Canvas mount with setTimeout to survive StrictMode unmount/remount cycle
- [01-02]: Capped GPU tier at 2 and removed NebulaFog to reduce GPU pressure
- [01-02]: Used Framer Motion AnimatePresence for panel slide-in/out and drag for mobile bottom sheet
- [01-03]: Used Drei Line per edge (not batched LineSegments2) -- 209 edges within draw call budget
- [01-03]: Line color [1.5, 1.5, 2.0] with toneMapped=false for luminous appearance without bloom
- [01-03]: Because section groups evidence by connected node with clickable fly-to titles
- [01-03]: ListView uses role=listbox with aria-selected and aria-live for screen reader compatibility
- [01-03]: 2D mode shares DetailPanel and MediaLightbox via same Zustand store (no duplication)
- [01-04]: TYPE_COLORS map defines 6 node type colors for hover labels
- [01-04]: onPointerMissed on Canvas for empty-space click-to-clear-focus
- [01-04]: Date formatting uses en-US locale with short month format
- [02-01]: 3 visibility tiers (public/friends/private) -- "redacted" is a transformation, not a tier
- [02-01]: Default visibility is private -- allowlist promotes to public/friends
- [02-01]: Instagram parser uses configurable selector strategy with discovery phase for format adaptation
- [02-01]: Within-source dedup only (by sourceId hash) -- cross-source dedup deferred
- [02-01]: assignEpoch from shared config/epochs.mjs module for centralized epoch assignment
- [02-02]: Blog posts are 20 (not 31 estimated) -- actual count from archive used
- [02-02]: Epoch ranges start at 2001 to capture AOTV experience entry
- [02-02]: People extraction limited to 2-3 word proper names with stop-word filtering
- [02-02]: Project date ranges use start year for epoch assignment
- [02-02]: PIPELINE_CONFIG centralizes all pipeline paths, privacy defaults, and layout params
- [02-03]: Bonus signals shared-place (0.25) and shared-client (0.35) added for richer evidence
- [02-03]: Pruning keeps top 6 edges per node per signal type (diverse edge types)
- [02-03]: Pipeline output (public/data/) gitignored as build artifacts
- [02-03]: Frontend loader uses import.meta.env.BASE_URL for dual-deployment support
- [02-03]: Pipeline-status.json is the only timestamped output (constellation data is timestamp-free)
- [02-04]: Allowlist caps unknown people at friends (most-restrictive-wins)
- [02-04]: Minors last-name stripping uses case-sensitive uppercase detection (not case-insensitive regex)
- [02-04]: Privacy audit scans stringified output for forbidden patterns (DMs, contact graphs, close friends)
- [02-04]: Curation.json supports both new format (hidden array + visibility_overrides) and legacy format (nodes map)
- [02-04]: Pipeline extended to 13 phases with schema validation and privacy audit as final steps before write
- [02-05]: Pipeline-status.json is write-only output; curation.json is read-only input (clean separation)
- [02-05]: Admin auth is session-only env-var key (no localStorage) -- Phase 4 replaces with GitHub OAuth
- [02-05]: Curation changes downloaded as JSON (no server-side write in Phase 2); Phase 4 adds proper API
- [02-05]: Source paths configurable via INSTAGRAM_EXPORT_DIR and CARBONMADE_ARCHIVE_DIR env vars

### Pending Todos

- Re-enable Bloom in production mode (conditional on StrictMode detection or environment)
- Tune node colors (instanceColor * material.color blending makes colors muted)
- Fix starfield rendering (Stars component count vs GPU tier)
- Instagram parser selector tuning once actual HTML export is provided
- Populate allowlist.json with real names when user decides public visibility

### Blockers/Concerns

- Instagram export HTML not yet available -- parser verified with missing-directory graceful handling, env var override available (INSTAGRAM_EXPORT_DIR)
- Research flags Phase 4 (Auth.js v5 non-Next.js) and Phase 5 (Suno API) as needing deeper research during planning
- WebGL context loss in dev mode (React StrictMode) required disabling Bloom -- production builds unaffected but dev experience is degraded

## Session Continuity

Last session: 2026-02-28
Stopped at: Completed 02-05-PLAN.md (thin admin, pipeline resilience, Instagram path config) -- Phase 2 complete
Resume file: None
