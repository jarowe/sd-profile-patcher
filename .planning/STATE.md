---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in-progress
last_updated: "2026-02-28T15:59:34Z"
progress:
  total_phases: 2
  completed_phases: 1
  total_plans: 9
  completed_plans: 5
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-27)

**Core value:** The Constellation must render real life data as an explorable, evidence-connected 3D experience -- every node real, every connection justified, every visit a discovery.
**Current focus:** Phase 2 - Data Pipeline & Privacy (Instagram parser and shared pipeline utilities complete)

## Current Position

Phase: 2 of 6 (Data Pipeline & Privacy)
Plan: 1 of 5 in current phase (02-01 complete)
Status: In progress -- pipeline foundation and Instagram parser complete, Carbonmade parser next
Last activity: 2026-02-28 -- Completed 02-01-PLAN.md (Instagram parser + pipeline foundation)

Progress: [=====....] 56% (5/9 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 14 min
- Total execution time: 1.17 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Constellation Scene | 4/4 | 65 min | 16 min |
| 2. Data Pipeline & Privacy | 1/5 | 5 min | 5 min |

**Recent Trend:**
- Last 5 plans: 01-02 (47 min), 01-03 (6 min), 01-04 (2 min), 02-01 (5 min)
- Trend: Pipeline plans are fast -- mostly file creation with verification

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

### Pending Todos

- Re-enable Bloom in production mode (conditional on StrictMode detection or environment)
- Tune node colors (instanceColor * material.color blending makes colors muted)
- Fix starfield rendering (Stars component count vs GPU tier)
- Instagram parser selector tuning once actual HTML export is provided

### Blockers/Concerns

- Instagram export HTML not yet available at data-private/instagram/ -- parser verified with missing-directory graceful handling only
- Research flags Phase 4 (Auth.js v5 non-Next.js) and Phase 5 (Suno API) as needing deeper research during planning
- WebGL context loss in dev mode (React StrictMode) required disabling Bloom -- production builds unaffected but dev experience is degraded

## Session Continuity

Last session: 2026-02-28
Stopped at: Completed 02-01-PLAN.md (Instagram parser + pipeline foundation)
Resume file: None
