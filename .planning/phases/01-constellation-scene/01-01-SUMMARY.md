---
phase: 01-constellation-scene
plan: 01
subsystem: ui
tags: [react-three-fiber, three.js, instanced-mesh, zustand, bloom, postprocessing, helix-layout, gpu-tier]

# Dependency graph
requires: []
provides:
  - Zustand constellation store with all UI state slices
  - 158-node mock constellation dataset with 209 evidence-based edges across 5 epochs
  - Deterministic double-helix layout algorithm (seeded PRNG, no Math.random)
  - R3F Canvas with GPU tier detection, conditional Bloom, OrbitControls
  - InstancedMesh node cloud with type-colored spheres and breathing pulse
  - Starfield and NebulaFog atmospheric effects (tier-based)
  - Lazy-loaded /constellation route
affects: [01-02-PLAN, 01-03-PLAN, 02-constellation-pipeline]

# Tech tracking
tech-stack:
  added: [zustand@5.0.11]
  patterns: [instanced-mesh-with-buffer-attributes, gpu-tier-adaptive-rendering, seeded-prng-layout]

key-files:
  created:
    - src/constellation/store.js
    - src/constellation/data/mock-constellation.json
    - src/constellation/layout/helixLayout.js
    - src/constellation/scene/ConstellationCanvas.jsx
    - src/constellation/scene/NodeCloud.jsx
    - src/constellation/scene/Starfield.jsx
    - src/constellation/scene/NebulaFog.jsx
    - src/pages/ConstellationPage.jsx
    - src/pages/ConstellationPage.css
  modified:
    - src/App.jsx
    - package.json
    - package-lock.json

key-decisions:
  - "Used native instancedMesh with InstancedBufferAttribute (not Drei Instances) for zero CPU overhead on 158 nodes"
  - "GPU tier detection runs inside Canvas tree via GPUDetector child component (useDetectGPU needs WebGL context)"
  - "Default to tier 2 (medium) config until GPU detection completes, avoiding flash of no-effects"
  - "Breathing pulse implemented via useFrame matrix updates (scale modulation) rather than shader uniforms for simplicity"
  - "NebulaFog uses standard blending with very low opacity (0.03-0.05), NOT FrontSide+AdditiveBlending per MEMORY.md"

patterns-established:
  - "GPU tier adaptive config: getGPUConfig(tier) returns feature flags (bloom, particles, nebula, dpr, segments)"
  - "Auto-orbit with pause/resume: pause on interaction start, resume with speed ramp after 5s idle"
  - "Constellation store pattern: Zustand with selector-based subscriptions, localStorage persistence for viewMode"
  - "Seeded PRNG pattern: mulberry32 hash function for deterministic layout positions across sessions"

requirements-completed: [REND-01, REND-06, REND-10, REND-12]

# Metrics
duration: 10min
completed: 2026-02-27
---

# Phase 1 Plan 01: R3F Constellation Scene Summary

**158 instanced spheres in double-helix layout with Zustand store, GPU-adaptive Bloom/Starfield/Nebula, and auto-orbit controls at /constellation**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-27T23:17:36Z
- **Completed:** 2026-02-27T23:27:49Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Zustand store with all constellation UI state (focus, hover, filter, lightbox, timeline, GPU tier, view mode)
- 158 mock nodes across 6 types with 209 evidence-based edges spanning 5 life epochs
- Deterministic double-helix layout algorithm with seeded PRNG (mulberry32) producing reproducible positions
- R3F Canvas scene with InstancedMesh, conditional Bloom, Starfield, NebulaFog, and GPU tier adaptive degradation
- Lazy-loaded /constellation route following existing UniversePage pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Zustand, create store, mock data, and helix layout** - `37ebf6d` (feat)
2. **Task 2: Build R3F Canvas scene with instanced nodes, starfield, nebula, bloom, and disposal** - `10f1ace` (feat)

## Files Created/Modified
- `src/constellation/store.js` - Zustand store: viewMode, gpuTier, focus/hover/filter, lightbox, timeline
- `src/constellation/data/mock-constellation.json` - 158 nodes, 209 edges, 5 epochs of mock life data
- `src/constellation/layout/helixLayout.js` - computeHelixLayout, getHelixCenter, getHelixBounds
- `src/constellation/scene/ConstellationCanvas.jsx` - R3F Canvas wrapper with GPU detection, Bloom, OrbitControls
- `src/constellation/scene/NodeCloud.jsx` - InstancedMesh with type colors and breathing pulse
- `src/constellation/scene/Starfield.jsx` - Drei Stars background (tier-dependent count)
- `src/constellation/scene/NebulaFog.jsx` - Billboard sprites near epoch centers (tier 3 only)
- `src/pages/ConstellationPage.jsx` - Route entry with 3D/2D mode switch and loading state
- `src/pages/ConstellationPage.css` - Full viewport dark background with loading overlay
- `src/App.jsx` - Added lazy-loaded /constellation route
- `package.json` - Added zustand@5.0.11 as direct dependency

## Decisions Made
- Used native `<instancedMesh>` with InstancedBufferAttribute rather than Drei `<Instances>` to avoid CPU overhead (per research recommendations)
- GPU detection placed inside Canvas tree via GPUDetector child component since useDetectGPU requires WebGL context
- Default to tier 2 config until GPU detection completes to avoid initial frame without effects
- Breathing pulse implemented as scale modulation in useFrame (sin wave with per-node phase offset) rather than custom shader uniform, trading slight CPU cost for implementation simplicity
- NebulaFog uses standard blending with very low opacity (0.03-0.05) per MEMORY.md anti-pattern for FrontSide+AdditiveBlending

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Scene foundation complete: 158 nodes render in double-helix at /constellation
- Store ready for Plan 02 (camera fly-to, hover labels, detail panel, timeline scrubber)
- NodeCloud events wired (onClick -> focusNode, onPointerOver/Out -> setHoveredNode) ready for Plan 02 to add camera animation and UI
- OrbitControls ref exposed for GSAP camera fly-to in Plan 02
- No blockers for Plan 02

## Self-Check: PASSED

---
*Phase: 01-constellation-scene*
*Completed: 2026-02-27*
