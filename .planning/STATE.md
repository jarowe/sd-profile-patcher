# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-27)

**Core value:** The Constellation must render real life data as an explorable, evidence-connected 3D experience -- every node real, every connection justified, every visit a discovery.
**Current focus:** Phase 1 - Constellation Scene

## Current Position

Phase: 1 of 6 (Constellation Scene)
Plan: 3 of 3 in current phase
Status: Phase 1 complete (awaiting checkpoint approval)
Last activity: 2026-02-28 -- Completed 01-03-PLAN.md (Connection lines, enhanced Because evidence, 2D accessible list fallback)

Progress: [===.................] 15% (3/20 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 21 min
- Total execution time: 1.05 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Constellation Scene | 3/3 | 63 min | 21 min |

**Recent Trend:**
- Last 5 plans: 01-01 (10 min), 01-02 (47 min), 01-03 (6 min)
- Trend: Plan 03 was fast -- straightforward feature addition with no bug-fix iterations

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

### Pending Todos

- Re-enable Bloom in production mode (conditional on StrictMode detection or environment)
- Tune node colors (instanceColor * material.color blending makes colors muted)
- Fix starfield rendering (Stars component count vs GPU tier)

### Blockers/Concerns

- Research flags Phase 2 (Instagram export format), Phase 4 (Auth.js v5 non-Next.js), and Phase 5 (Suno API) as needing deeper research during planning
- WebGL context loss in dev mode (React StrictMode) required disabling Bloom -- production builds unaffected but dev experience is degraded

## Session Continuity

Last session: 2026-02-28T00:52:01Z
Stopped at: Completed 01-03-PLAN.md (awaiting checkpoint approval)
Resume file: None
