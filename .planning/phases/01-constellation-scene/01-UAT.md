---
status: complete
phase: 01-constellation-scene
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md]
started: 2026-02-28T02:00:00Z
updated: 2026-02-28T02:20:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Constellation Route Loads
expected: Navigate to /constellation. The page loads with a dark background and a 3D scene showing ~158 colored spheres arranged in a double-helix shape. The scene should render without errors or blank screen.
result: pass

### 2. Node Hover Labels
expected: Hovering over any sphere shows a 3D billboard label with the node's title, type, and date floating near it.
result: issue
reported: "fail — hover label shows title only; type and date are missing."
severity: major

### 3. Node Click & Camera Fly-To
expected: Clicking any node triggers a smooth camera animation flying toward that node. A detail panel slides in from the right showing the node's title, type badge, date, description, and media thumbnails.
result: pass

### 4. Detail Panel - Entity Chips & Because Section
expected: In the detail panel, entity chips appear showing connected people/places with counts. A collapsible "Because..." section shows evidence grouped by connected node with icons and signal weight bars. Clicking a connected node name flies the camera there.
result: pass

### 5. Timeline Scrubber
expected: A vertical timeline scrubber appears on the left side with epoch labels (life period names). Dragging the scrubber thumb moves the camera along the helix to different time periods.
result: issue
reported: "fail — timeline scrubber is on the right side (not left). Drag behavior and epoch labels work."
severity: cosmetic

### 6. Toolbar - Home/Reset & 3D/2D Toggle
expected: A toolbar shows Home/Reset button (returns camera to default orbit) and a 3D/2D toggle. Home resets the view; the toggle switches between modes.
result: pass

### 7. Media Lightbox
expected: Clicking a media thumbnail in the detail panel opens a full-screen lightbox overlay. Arrow keys navigate between media. ESC or clicking outside closes it.
result: pass

### 8. Layered ESC Navigation
expected: With lightbox open, ESC closes lightbox first. With detail panel open (no lightbox), ESC closes the panel. With nothing focused, ESC exits the constellation. Browser back button follows the same layered order.
result: pass

### 9. Connection Lines (3D)
expected: In 3D mode, luminous connection lines are visible between related nodes. When a node is focused, its connections brighten while non-connected lines fade to near-invisible.
result: pass

### 10. Focus Dimming
expected: When a node is clicked/focused, non-connected nodes dim to ~15% opacity (ghost appearance). Clearing focus (ESC or clicking empty space) restores all nodes to full opacity.
result: issue
reported: "fail — ESC clears focus correctly, but clicking empty space does not clear focus/restore node opacity."
severity: major

### 11. 2D List View
expected: Switching to 2D mode shows a searchable, scrollable list of all nodes. A search box filters by text, type filter pills narrow by category, and a sort dropdown changes ordering. Clicking a list item opens the same detail panel.
result: pass

### 12. 2D Keyboard Navigation
expected: In 2D mode, arrow keys move selection up/down through the list. Home/End jump to first/last. Enter opens the selected node's detail panel. Focus rings are visible on the selected item.
result: pass

### 13. Mobile Responsive
expected: On a narrow viewport (or mobile device), the detail panel renders as a bottom sheet that can be dragged up/down. The layout doesn't break or overflow.
result: pass

### 14. Auto-Orbit & Controls
expected: The 3D scene auto-rotates slowly. Dragging to orbit pauses auto-rotation. After ~5 seconds of no interaction, auto-rotation resumes.
result: pass

## Summary

total: 14
passed: 11
issues: 3
pending: 0
skipped: 0

## Gaps

- truth: "Hovering over any sphere shows a 3D billboard label with the node's title, type, and date"
  status: failed
  reason: "User reported: hover label shows title only; type and date are missing."
  severity: major
  test: 2
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Timeline scrubber appears on the left side with epoch labels"
  status: failed
  reason: "User reported: timeline scrubber is on the right side (not left). Drag behavior and epoch labels work."
  severity: cosmetic
  test: 5
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Clicking empty space clears focus and restores all nodes to full opacity"
  status: failed
  reason: "User reported: ESC clears focus correctly, but clicking empty space does not clear focus/restore node opacity."
  severity: major
  test: 10
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
