---
phase: 01-constellation-scene
plan: 02
subsystem: ui
tags: [react-three-fiber, gsap, framer-motion, zustand, camera-animation, detail-panel, timeline-scrubber, lightbox, entity-chips, hover-labels]

# Dependency graph
requires:
  - phase: 01-constellation-scene/01
    provides: R3F Canvas, InstancedMesh NodeCloud, Zustand store, helix layout, OrbitControls ref
provides:
  - 3D billboard hover labels on nodes (HoverLabel + Billboard + Text)
  - GSAP-driven camera fly-to on node click with auto-orbit pause/resume
  - Right sidebar detail panel with title, type badge, date, description, media, entity chips, Because section
  - Vertical timeline scrubber with epoch labels for helix navigation
  - Toolbar with Home/Reset and 3D/2D toggle
  - Media lightbox overlay with arrow key navigation
  - Entity chip filtering (click chip to dim non-matching nodes)
  - Focus dimming (non-connected nodes ghost to 15% opacity)
  - Layered ESC and browser back-button navigation (lightbox > panel > exit)
  - Mobile bottom-sheet detail panel with Framer Motion drag
affects: [01-03-PLAN, 03-narrator-guided-tour]

# Tech tracking
tech-stack:
  added: []
  patterns: [gsap-camera-fly-to, layered-esc-navigation, popstate-history-management, framer-motion-slide-panel, instanceColor-focus-dimming]

key-files:
  created:
    - src/constellation/scene/CameraController.jsx
    - src/constellation/scene/HoverLabel.jsx
    - src/constellation/ui/DetailPanel.jsx
    - src/constellation/ui/DetailPanel.css
    - src/constellation/ui/EntityChip.jsx
    - src/constellation/ui/MediaLightbox.jsx
    - src/constellation/ui/MediaLightbox.css
    - src/constellation/ui/TimelineScrubber.jsx
    - src/constellation/ui/TimelineScrubber.css
    - src/constellation/ui/Toolbar.jsx
    - src/constellation/ui/Toolbar.css
  modified:
    - src/constellation/scene/ConstellationCanvas.jsx
    - src/constellation/scene/NodeCloud.jsx
    - src/constellation/store.js
    - src/pages/ConstellationPage.jsx

key-decisions:
  - "Used instanceColor attribute (THREE.InstancedBufferAttribute on geometry) for focus dimming rather than per-frame color writes"
  - "Disabled Bloom postprocessing to prevent WebGL context loss during React StrictMode double-mount"
  - "Deferred Canvas mount with state flag to survive StrictMode unmount/remount lifecycle"
  - "Capped GPU tier at 2 and removed NebulaFog to reduce GPU pressure and prevent context loss"
  - "Used Framer Motion AnimatePresence for panel slide-in/out and drag for mobile bottom sheet"

patterns-established:
  - "GSAP camera fly-to pattern: animate both camera.position AND controls.target simultaneously in a GSAP timeline"
  - "Layered ESC navigation: lightbox > detail panel > exit constellation, using popstate with pushState/replaceState"
  - "Focus dimming via instanceColor: set RGB to (0.15,0.15,0.15) for non-connected nodes, restore originals on clearFocus"
  - "Mobile detail panel: bottom-sheet with Framer Motion drag='y' and dragConstraints for half-screen snap"

requirements-completed: [REND-02, REND-03, REND-04, REND-07, REND-11]

# Metrics
duration: 47min
completed: 2026-02-27
---

# Phase 1 Plan 02: Interactive Constellation UI Summary

**Camera fly-to, hover labels, detail panel with entity chips and Because section, timeline scrubber, media lightbox, and layered ESC/back navigation across 11 new UI components**

## Performance

- **Duration:** ~47 min (18:35 to 19:22 UTC-5 including bug-fix iterations)
- **Started:** 2026-02-27T23:35:02Z
- **Completed:** 2026-02-28T00:21:39Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 17

## Accomplishments
- Full interactive constellation: hover any node for 3D billboard label, click to trigger GSAP camera fly-to with detail panel slide-in
- Detail panel displays title, type badge, date, description, media thumbnails, entity chips with connection counts, and collapsible "Because..." evidence section
- Timeline scrubber with epoch labels allows dragging to navigate along the double-helix; Toolbar provides Home/Reset and 3D/2D toggle
- Media lightbox overlay with arrow key navigation and layered ESC dismissal (lightbox > panel > constellation exit)
- Entity chip filtering dims non-matching nodes; focus dimming ghosts non-connected nodes to ~15% opacity
- Mobile responsive: detail panel renders as draggable bottom sheet on narrow viewports

## Task Commits

Each task was committed atomically:

1. **Task 1: Hover labels, camera fly-to controller, toolbar, and timeline scrubber** - `d682f24` (feat)
2. **Task 2: Detail panel, media lightbox, entity chips, and ESC/back navigation** - `7ad543b` (feat)

Bug-fix commits (post-Task 2, before checkpoint):
3. `c16b302` - fix: instancedBufferAttribute placement + add error boundary
4. `f7c85a3` - fix: WebGL context lost + white nodes (instanceColor API)
5. `7fe5f3c` - fix: use instanceColor API, remove nebula fog, cap GPU tier
6. `90c6050` - fix: defer Canvas mount to survive StrictMode double-mount
7. `b609eae` - fix: disable bloom (fixes context loss), fix white nodes

**Task 3: Checkpoint (human-verify)** - Approved by user.

## Files Created/Modified

**Created:**
- `src/constellation/scene/CameraController.jsx` - GSAP fly-to animation, auto-orbit pause/resume, timeline-driven camera positioning
- `src/constellation/scene/HoverLabel.jsx` - Drei Text + Billboard for 3D hover tooltip on nodes
- `src/constellation/ui/DetailPanel.jsx` - Right sidebar (desktop) / bottom sheet (mobile) with node info, media, entities, Because section
- `src/constellation/ui/DetailPanel.css` - Glass panel styles, mobile responsive bottom sheet, type badge colors
- `src/constellation/ui/EntityChip.jsx` - Clickable entity chips with count badges, filters constellation on click
- `src/constellation/ui/MediaLightbox.jsx` - Full-screen media overlay with arrow key navigation
- `src/constellation/ui/MediaLightbox.css` - Overlay positioning, image sizing, navigation buttons
- `src/constellation/ui/TimelineScrubber.jsx` - Vertical rail scrubber with epoch labels and drag interaction
- `src/constellation/ui/TimelineScrubber.css` - Glass-aesthetic track, thumb, epoch label positioning
- `src/constellation/ui/Toolbar.jsx` - Home/Reset button and 3D/2D toggle with glass panel styling
- `src/constellation/ui/Toolbar.css` - Toolbar positioning and button styles

**Modified:**
- `src/constellation/scene/ConstellationCanvas.jsx` - Added HoverLabel and CameraController as Canvas children; simplified to remove Bloom
- `src/constellation/scene/NodeCloud.jsx` - Added instanceColor focus dimming, entity filter support, error boundary
- `src/constellation/store.js` - Minor store adjustment for focus/filter interactions
- `src/pages/ConstellationPage.jsx` - Added Toolbar, TimelineScrubber, DetailPanel, MediaLightbox as DOM overlays; wired ESC/popstate navigation
- `src/pages/Home.css` - Minor styling adjustments
- `src/pages/Home.jsx` - Minor update

## Decisions Made
- **instanceColor for focus dimming**: Used THREE.InstancedBufferAttribute on geometry (not material) with the `instanceColor` attribute name, which three.js InstancedMesh auto-applies to material color. More performant than per-frame color writes.
- **Bloom disabled**: React StrictMode double-mount causes WebGL context loss when EffectComposer with Bloom is present. Disabled bloom entirely as a stability fix; can be re-enabled in production mode or with conditional StrictMode wrapping.
- **Deferred Canvas mount**: Added state-based deferred mount (`setTimeout`) so the R3F Canvas survives StrictMode's unmount/remount cycle without losing WebGL context.
- **GPU tier capped at 2**: Removed NebulaFog and capped tier to reduce GPU pressure, preventing context loss on integrated GPUs.
- **Framer Motion for panel animation**: Used AnimatePresence + motion.div for detail panel slide-in/out, and drag="y" with dragConstraints for mobile bottom sheet behavior.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] InstancedBufferAttribute placed on geometry, not material**
- **Found during:** Post-Task 2 verification
- **Issue:** InstancedBufferAttribute was being attached to material instead of geometry, causing render errors
- **Fix:** Moved attribute attachment to mesh.geometry and used `instanceColor` attribute name for three.js auto-integration
- **Files modified:** src/constellation/scene/NodeCloud.jsx
- **Committed in:** c16b302

**2. [Rule 1 - Bug] WebGL context loss during React StrictMode**
- **Found during:** Post-Task 2 verification
- **Issue:** EffectComposer with Bloom triggered WebGL context loss on StrictMode's double-mount. White/blank nodes appeared after context recovery.
- **Fix:** Multiple iterations: (1) fixed instanceColor API usage, (2) removed nebula fog and capped GPU tier, (3) deferred Canvas mount with setTimeout, (4) disabled bloom entirely
- **Files modified:** src/constellation/scene/ConstellationCanvas.jsx, src/constellation/scene/NodeCloud.jsx
- **Committed in:** f7c85a3, 7fe5f3c, 90c6050, b609eae

**3. [Rule 2 - Missing Critical] Added error boundary around Canvas**
- **Found during:** Post-Task 2 verification
- **Issue:** WebGL context loss crashed the entire page with no recovery path
- **Fix:** Added React error boundary wrapping the Canvas to catch and display fallback UI
- **Files modified:** src/constellation/scene/ConstellationCanvas.jsx
- **Committed in:** c16b302

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 missing critical)
**Impact on plan:** All fixes necessary for stable rendering. Bloom disabled is a visual regression but prevents crashes. Node colors slightly muted due to instanceColor blending with material color -- polish item for Plan 03 or future work.

## Issues Encountered
- **WebGL context loss in dev mode**: React 19 StrictMode double-mounts components, which causes R3F Canvas and EffectComposer to initialize twice rapidly. This triggers WebGL context loss on some GPUs. Resolved by deferring mount and disabling Bloom. Production builds (no StrictMode) would not exhibit this issue.
- **Node colors muted**: The instanceColor attribute multiplies with material.color, so if material.color is not white, instance colors appear darker than intended. Needs color tuning in future work.
- **Starfield not rendering**: Stars component may need GPU tier check or count adjustment. Deferred to polish.

## Known Polish Items (deferred)
- Re-enable Bloom in production mode (conditional on StrictMode detection or environment)
- Tune node colors (instanceColor * material.color blending)
- Fix starfield rendering (Stars component count vs GPU tier)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All interactive UI is wired: hover, click, fly-to, panel, scrubber, lightbox, ESC/back navigation
- Ready for Plan 03: connection lines with focus-aware opacity, "Because..." evidence lens, 2D accessible list fallback
- CameraController and focus dimming patterns are established for Plan 03 to build connection line visibility on top of
- Entity chip filtering is in place -- Plan 03 can enhance with connection-line highlighting
- Bloom re-enablement and color tuning can happen in Plan 03 or as polish

## Self-Check: PASSED

---
*Phase: 01-constellation-scene*
*Completed: 2026-02-27*
