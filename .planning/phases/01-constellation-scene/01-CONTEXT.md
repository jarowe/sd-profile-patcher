# Phase 1: Constellation Scene - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a 3D constellation scene at /constellation where users explore 150+ life-moment nodes rendered as a double-helix shape. Users can orbit, zoom, hover for tooltips, click for detail panels, scrub through time, and view connection lines. The scene runs at 60fps on desktop with graceful degradation on mobile and a 2D fallback for accessibility. Uses mock constellation.json data (real parsers are Phase 2).

</domain>

<decisions>
## Implementation Decisions

### Visual Tone & Background
- Deep void with twinkling star particles as base
- Subtle nebula haze (low opacity color gradients) only near epoch cluster cores — nodes and connections remain the primary light sources
- Overall feel: contemplative deep space, not flashy

### Node Appearance
- All nodes are spheres — size encodes importance/connection count, color encodes type
- Warm-cool contrast palette:
  - Projects = amber
  - Moments = coral
  - People = violet
  - Places = teal
  - Ideas/thoughts = cyan
  - Milestones/epochs = gold (accent)
- Hub/epoch nodes are larger than leaf nodes
- Glow: soft UnrealBloomPass bloom + gentle breathing pulse animation (hybrid of bloom and pulsing aura)
- Brighter glow for larger/more-connected nodes

### Constellation Density
- Medium cluster: nodes visibly grouped by epoch with breathing room between clusters
- Double-helix shape clearly visible at default zoom

### Connection Lines
- Thin luminous threads (1-2px), soft glow, partially transparent
- Like fiber optics in space — subtle until node is focused
- On focus: connected lines brighten, non-connected lines fade with their nodes

### Focus State
- Clicking a node: non-connected nodes fade to ~15% opacity (ghost)
- Connected nodes stay bright
- Focused node glows brighter than normal
- "Clear filter" restores all nodes to full opacity

### Camera Fly-To
- GSAP easeInOut over ~1.5 seconds on click
- Smooth, cinematic feel
- Camera positions to show the clicked node prominently with its connections visible

### Idle Behavior
- Gentle auto-orbit rotation around the helix center
- Pauses on any user interaction (drag, hover, click)
- Resumes after ~5 seconds of idle

### Timeline Scrubber
- Spiral inline minimap that follows the helix shape — a miniature representation of the constellation
- Drag along the mini-helix to navigate camera to that epoch position
- **Fallback rule:** If spiral minimap risks schedule or performance, ship a vertical rail scrubber on the right side in v1 and defer spiral minimap to v1.1

### Zoom & Orbit Controls
- Moderate manual zoom range (cluster-level, not node-level)
- Click-to-focus fly-to handles the deep zoom to individual nodes
- Tighter zoom clamps on mobile
- Vertical orbit clamped (15° to 165°) — can't go upside-down, helix stays oriented
- No panning — camera always looks at center of action
- Double-click = same as single click (no separate action)

### Home/Reset Button
- Small button in constellation toolbar
- Animated fly-back to initial camera position showing full helix
- Clears any focused node (restores all nodes to full opacity)
- Same smooth ease as fly-to

### Hover Labels (3D)
- troika-three-text rendered in 3D space near the hovered node
- Title only — clean, fast, doesn't obscure other nodes
- Rotates to face camera (billboard)
- Full detail comes from click (detail panel)

### Detail Panel (Click)
- Right sidebar slide-in (~350px wide)
- 3D scene shrinks/shifts left to accommodate
- Content hierarchy (top to bottom):
  1. Title + type badge + date
  2. Text content / description
  3. Media gallery (if any)
  4. Entity chips (people, places, tags) — with count badges showing connected node count
  5. "Because..." connection reasons — expandable section, collapsed by default
- Panel stays open until: ESC key, X button, browser back, or clicking a different node
- Browser back uses history.pushState (doesn't navigate away from /constellation)

### Entity Chip Interaction
- Clicking a chip filters the constellation to highlight all nodes connected to that entity
- Count badge shows how many nodes (e.g., "Person (7)")
- "Clear filter" button appears to reset
- Panel stays open during filter

### Media Gallery
- Lightbox overlay on click — full-screen overlay on top of 3D scene
- Arrow keys to navigate between media items
- ESC closes lightbox (returns to detail panel, not to constellation)

### Mobile Touch Gestures
- Pinch-to-zoom (within mobile zoom clamps)
- Single-finger drag to orbit
- Tap node to fly-to + open detail panel
- Standard mobile 3D interaction patterns

### Mobile Effect Degradation
- Detection: detect-gpu library at load time, one-time GPU tier check
- Tier 0-1 (low): aggressive cuts — no bloom post-processing, no node pulse animation, no star particles, no nebula fog. Keep: nodes, connections, labels, detail panel. Target 30fps.
- Tier 2 (medium): moderate cuts — reduced bloom, fewer particles
- Tier 3 (high): full effects

### Mobile Detail Panel
- Bottom sheet (slides up from bottom)
- Half-screen by default, drag up for full-screen
- 3D scene visible above the sheet

### Orientation
- Both portrait and landscape supported
- Detail panel adapts: bottom sheet in portrait, side panel in landscape
- No forced orientation — 3D scene fills available space in both

### 2D Fallback (Accessibility)
- Searchable, filterable list view sorted by date
- Each row: title, type badge, date, connection count
- Click row for same detail panel content
- Fully keyboard-navigable (tab, arrow keys, enter)
- Toggle: auto-detect suggests 2D on weak devices (with prompt), manual "3D / List" toggle always available in toolbar
- Toggle preference persisted in localStorage

### Navigation & Exit
- ESC key exits constellation cleanly (closes detail panel first, then returns to previous page)
- Browser back button works at every level (lightbox → panel → constellation → previous page)
- No broken state on any exit path
- GPU disposal on unmount (geometries, materials, textures via renderer.info.memory monitoring)

### Claude's Discretion
- Exact bloom intensity and breathing pulse speed
- Star particle count and twinkle behavior
- Troika-three-text font choice and sizing
- Loading state / skeleton while constellation initializes
- Exact breakpoints for GPU tier degradation thresholds
- Mock constellation.json structure and sample data (must support all node types and connection types)
- InstancedMesh buffer sizing strategy

</decisions>

<specifics>
## Specific Ideas

- Existing site has a globe with similar camera patterns (orbit, zoom clamps, idle auto-rotate) — reuse those interaction patterns for consistency
- GSAP is already used for brand reveal animation — reuse for camera fly-to and timeline scrubber
- Existing GameOverlay XP system uses localStorage — 2D fallback toggle should follow same pattern
- Warm-cool palette should feel like the user's existing site aesthetic (dark glass panels, amber/coral accents)
- The spiral minimap scrubber is the most unique/risky UI element — vertical rail fallback if it threatens schedule

</specifics>

<deferred>
## Deferred Ideas

- Spiral inline minimap scrubber may be deferred to v1.1 if schedule/perf risk (vertical rail ships instead)
- Constellation modes ("Life" / "Work" / "Ideas" filtering) — v1.1
- Path memory (glowing trail of visited nodes) — v1.1
- Discovery XP integration (node visit rewards) — v1.1
- Audio-reactive rendering — v1.1
- Node pulse synced to music — future

</deferred>

---

*Phase: 01-constellation-scene*
*Context gathered: 2026-02-27*
