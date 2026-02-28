---
phase: 01-constellation-scene
plan: 03
subsystem: ui
tags: [react-three-fiber, drei-line, zustand, accessibility, aria, keyboard-navigation, search-filter, 2d-fallback, connection-lines, evidence-display]

# Dependency graph
requires:
  - phase: 01-constellation-scene/01
    provides: R3F Canvas, InstancedMesh NodeCloud, Zustand store, helix layout, mock data with 209 edges
  - phase: 01-constellation-scene/02
    provides: DetailPanel with Because section, Toolbar with 3D/2D toggle, CameraController, entity chip filtering, ESC/back navigation
provides:
  - Connection lines between 209 edges with focus-aware opacity (brighten connected, fade non-connected)
  - Enhanced "Because..." evidence display with clickable node names, evidence type icons, signal weight bars
  - 2D accessible list view with search, type filter, sort, keyboard navigation (arrow/Home/End/Enter)
  - ARIA-compliant listbox with live region for result count announcement
  - Auto-detect GPU tier prompt suggesting 2D switch for tier 0-1 devices
  - Complete Phase 1 constellation scene (all REND requirements)
affects: [02-constellation-pipeline, 03-narrator-guided-tour]

# Tech tracking
tech-stack:
  added: []
  patterns: [drei-line-connection-lines, focus-aware-line-opacity, accessible-list-fallback, keyboard-navigable-listbox, gpu-autodetect-prompt]

key-files:
  created:
    - src/constellation/scene/ConnectionLines.jsx
    - src/constellation/fallback/ListView.jsx
    - src/constellation/fallback/ListView.css
  modified:
    - src/constellation/ui/DetailPanel.jsx
    - src/constellation/ui/DetailPanel.css
    - src/constellation/scene/ConstellationCanvas.jsx
    - src/pages/ConstellationPage.jsx
    - src/pages/ConstellationPage.css

key-decisions:
  - "Used Drei <Line> components per edge rather than batched LineSegments2 — 209 edges is manageable, batching deferred unless profiling shows draw call issues"
  - "Line color [1.5, 1.5, 2.0] with toneMapped=false for luminous appearance without bloom (bloom still disabled)"
  - "Enhanced Because section groups evidence by connected node with clickable titles that fly camera to that node"
  - "ListView uses role=listbox with aria-selected and aria-live for screen reader compatibility"
  - "AutoDetectPrompt stored in localStorage (constellation-autodetect-dismissed) — shown once per device for tier 0-1"
  - "2D mode shares DetailPanel and MediaLightbox from 3D mode via same Zustand store"

patterns-established:
  - "Connection line visibility pattern: focus-aware opacity with three states (normal: 0.12, active: 0.8, dimmed: 0.03)"
  - "Accessible list fallback: debounced search + type filter pills + sort dropdown + keyboard nav all in pure React DOM"
  - "GPU auto-detect prompt: one-shot localStorage flag prevents repeat prompting"

requirements-completed: [REND-05, REND-08, REND-09]

# Metrics
duration: 6min
completed: 2026-02-28
---

# Phase 1 Plan 03: Connection Lines, Evidence Display, and 2D Fallback Summary

**Drei Line connection threads with focus-aware opacity, enhanced Because evidence lens with clickable node navigation, and fully accessible 2D list view with search/filter/keyboard nav**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-02-28T00:46:20Z
- **Completed:** 2026-02-28T00:52:01Z
- **Tasks:** 2 auto + 1 checkpoint (pending)
- **Files modified:** 8

## Accomplishments
- 209 connection lines rendered as luminous Drei Line components with three opacity states (normal, active, dimmed) responding to focus and entity filter
- Enhanced "Because..." evidence section grouped by connected node with clickable titles (fly-to), Lucide icons per evidence type, and signal weight bars
- Complete 2D accessible list fallback: debounced search, type filter pills, sort dropdown, full keyboard navigation (arrow/Home/End/Enter), ARIA listbox with live result count
- Auto-detect prompt for tier 0-1 GPU devices suggesting 2D switch (once per device, stored in localStorage)

## Task Commits

Each task was committed atomically:

1. **Task 1: Connection lines + enhanced Because evidence display** - `0e051e4` (feat)
2. **Task 2: 2D accessible list view with search, filter, keyboard nav** - `c3590e8` (feat)

**Task 3:** Checkpoint (human-verify) -- pending user approval.

## Files Created/Modified

**Created:**
- `src/constellation/scene/ConnectionLines.jsx` - Drei Line components for 209 edges with focus-aware opacity and entity filter support
- `src/constellation/fallback/ListView.jsx` - Pure DOM 2D list view with search, type filter, sort, keyboard nav, ARIA roles
- `src/constellation/fallback/ListView.css` - Glass panel aesthetic, responsive filter pills, scrollable list with focus rings

**Modified:**
- `src/constellation/ui/DetailPanel.jsx` - Enhanced Because section: grouped by connected node, clickable titles, evidence icons (Calendar/MapPin/User/Folder/Lightbulb), weight bars, "Show N more" expand
- `src/constellation/ui/DetailPanel.css` - New styles for connection groups, evidence icons, weight bars, show-more button
- `src/constellation/scene/ConstellationCanvas.jsx` - Added ConnectionLines component before NodeCloud (renders behind)
- `src/pages/ConstellationPage.jsx` - Added ListView import, AutoDetectPrompt, wired 2D mode with shared DetailPanel/Lightbox
- `src/pages/ConstellationPage.css` - Added 2D layout styles, auto-detect prompt toast with slide-up animation

## Decisions Made
- **Drei Line per edge (not batched)**: 209 edges is within comfortable draw call budget for WebGL. Batching into LineSegments2 deferred unless profiling reveals issues. Plan recommended this approach.
- **Line color above 1.0**: Using `[1.5, 1.5, 2.0]` with `toneMapped={false}` gives luminous appearance even without bloom post-processing.
- **Evidence grouped by connection**: Rather than flat list of all evidence items, grouped by connected node so user sees "Jake from Band Class -> [evidence1, evidence2]" structure. Clicking the node name flies camera there.
- **ListView as pure DOM**: Zero Three.js dependency in the 2D fallback, keeping the import lightweight for low-tier devices.
- **Shared store for both modes**: 2D list calls `focusNode()` which opens the same DetailPanel, allowing both modes to share all panel UI without duplication.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 1 constellation scene is feature-complete: 3D helix with 158 nodes, 209 connection lines, hover labels, click fly-to, detail panel, timeline scrubber, entity chips, Because evidence, 2D fallback, ESC/back layering
- Awaiting human verification checkpoint (Task 3) before marking phase complete
- Known polish items from Plan 02 remain: re-enable bloom in production, tune node colors, fix starfield
- Ready for Phase 2 (constellation pipeline) once Phase 1 is approved

## Self-Check: PASSED

---
*Phase: 01-constellation-scene*
*Completed: 2026-02-28*
