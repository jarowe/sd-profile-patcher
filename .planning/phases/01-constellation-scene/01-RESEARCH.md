# Phase 1: Constellation Scene - Research

**Researched:** 2026-02-27
**Domain:** 3D WebGL scene rendering (React Three Fiber + Three.js), instanced geometry, post-processing, camera animation, GPU tier adaptive degradation, accessibility fallback
**Confidence:** HIGH

## Summary

Phase 1 delivers a 3D constellation scene at `/constellation` rendering 150+ life-moment nodes as a double-helix shape. The existing project already uses `@react-three/fiber` v9.5, `@react-three/drei` v10.7, `@react-three/postprocessing` v3.0, Three.js r183, and GSAP 3.14 -- all of which are the standard stack for this phase. No new core rendering libraries are needed beyond `troika-three-text` (already bundled inside Drei's `<Text>` component) and `detect-gpu` (already bundled inside Drei's `useDetectGPU` hook).

The project has established patterns for orbit controls (auto-rotate with pause/resume on interaction, damping, zoom clamping) in `Home.jsx` and for R3F Canvas scenes in `UniversePage.jsx`. The constellation scene should follow these patterns for consistency. The primary technical risks are: (1) InstancedMesh raycasting for 150+ nodes with per-instance hover/click, (2) GSAP-driven camera fly-to that must coordinate with OrbitControls target, (3) GPU memory disposal on route change, and (4) the double-helix layout algorithm which is custom math (no library exists).

**Primary recommendation:** Use native Three.js `<instancedMesh>` (not Drei's declarative `<Instances>`) for the 150+ node spheres to avoid CPU overhead, with a custom `InstancedBufferAttribute` for per-node color/opacity. Use Drei's `<Text>` (troika wrapper) inside `<Billboard>` for hover labels. Use `@react-three/postprocessing` Bloom with emissive intensity technique for glow. Use GSAP `timeline()` to animate both `camera.position` and `orbitControls.target` simultaneously for fly-to. Use Zustand for constellation UI state (focused node, filter, panel open/closed).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Deep void with twinkling star particles as base
- Subtle nebula haze (low opacity color gradients) only near epoch cluster cores -- nodes and connections remain the primary light sources
- Overall feel: contemplative deep space, not flashy
- All nodes are spheres -- size encodes importance/connection count, color encodes type
- Warm-cool contrast palette: Projects = amber, Moments = coral, People = violet, Places = teal, Ideas/thoughts = cyan, Milestones/epochs = gold (accent)
- Hub/epoch nodes are larger than leaf nodes
- Glow: soft UnrealBloomPass bloom + gentle breathing pulse animation (hybrid of bloom and pulsing aura)
- Brighter glow for larger/more-connected nodes
- Medium cluster: nodes visibly grouped by epoch with breathing room between clusters
- Double-helix shape clearly visible at default zoom
- Thin luminous threads (1-2px), soft glow, partially transparent connection lines
- Like fiber optics in space -- subtle until node is focused
- On focus: connected lines brighten, non-connected lines fade with their nodes
- Clicking a node: non-connected nodes fade to ~15% opacity (ghost)
- Connected nodes stay bright, focused node glows brighter than normal
- "Clear filter" restores all nodes to full opacity
- GSAP easeInOut over ~1.5 seconds camera fly-to on click
- Smooth, cinematic feel camera positioning
- Gentle auto-orbit rotation around helix center, pauses on interaction, resumes after ~5 seconds
- Spiral inline minimap timeline scrubber with vertical rail fallback
- Moderate manual zoom range (cluster-level), click-to-focus handles deep zoom
- Tighter zoom clamps on mobile
- Vertical orbit clamped 15-165 degrees, no panning, no upside-down
- Double-click = same as single click
- Home/Reset button: animated fly-back to initial camera, clears focus
- troika-three-text hover labels in 3D space, billboard, title only
- Right sidebar detail panel (~350px) with: title + type + date, text content, media gallery, entity chips with count badges, "Because..." connection reasons (collapsed)
- Panel stays open until ESC, X, back, or different node click
- Browser back uses history.pushState (no navigation away)
- Entity chip click filters constellation to highlight connected nodes
- Lightbox overlay for media gallery, arrow keys to navigate, ESC closes lightbox only
- Pinch-to-zoom, single-finger drag orbit, tap to fly-to on mobile
- detect-gpu at load time for GPU tier: Tier 0-1 aggressive cuts (no bloom, no pulse, no particles, no nebula -- 30fps target), Tier 2 moderate cuts, Tier 3 full effects
- Mobile detail panel: bottom sheet half-screen, drag up for full
- Both portrait and landscape supported, detail panel adapts
- 2D fallback: searchable filterable list view, fully keyboard-navigable, auto-detect suggests 2D on weak devices, manual toggle persisted in localStorage
- ESC exits cleanly (panel first, then page), browser back at every level
- GPU disposal on unmount via renderer.info.memory monitoring

### Claude's Discretion
- Exact bloom intensity and breathing pulse speed
- Star particle count and twinkle behavior
- Troika-three-text font choice and sizing
- Loading state / skeleton while constellation initializes
- Exact breakpoints for GPU tier degradation thresholds
- Mock constellation.json structure and sample data (must support all node types and connection types)
- InstancedMesh buffer sizing strategy

### Deferred Ideas (OUT OF SCOPE)
- Spiral inline minimap scrubber may be deferred to v1.1 if schedule/perf risk (vertical rail ships instead)
- Constellation modes ("Life" / "Work" / "Ideas" filtering) -- v1.1
- Path memory (glowing trail of visited nodes) -- v1.1
- Discovery XP integration (node visit rewards) -- v1.1
- Audio-reactive rendering -- v1.1
- Node pulse synced to music -- future
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REND-01 | Constellation page renders 150+ nodes as instanced meshes at 60fps on desktop | Native `<instancedMesh>` with shared geometry/material, InstancedBufferAttribute for color. Drei `<PerformanceMonitor>` for adaptive DPR. Bloom via emissive technique avoids per-object pass overhead. |
| REND-02 | User can hover any node to see tooltip with title, type, and date | R3F `onPointerOver`/`onPointerOut` on instancedMesh returns `event.instanceId`. Drei `<Text>` inside `<Billboard>` for 3D label. |
| REND-03 | User can click any node to fly camera to it and open detail panel | R3F `onClick` returns `event.instanceId`. GSAP `timeline().to()` animates `camera.position` + `controls.target` simultaneously over 1.5s easeInOut. |
| REND-04 | Detail panel shows node media, text content, and entity chips | React DOM sidebar (not 3D). CSS transition for slide-in. Zustand store for `focusedNodeId`. History.pushState for back-button support. |
| REND-05 | Connection lines render between nodes with evidence-based edges, dimming non-connected on focus | Drei `<Line>` (Line2 wrapper) for wide luminous lines. InstancedBufferAttribute opacity uniform for fade effect. Bloom makes lines glow. |
| REND-06 | Nodes positioned in double-helix temporal layout | Custom math: parametric helix `x = R*cos(t + offset)`, `y = t * pitch`, `z = R*sin(t + offset)` with offset=PI for second strand. Epoch clustering via t-spacing. Seeded position jitter for organic feel. |
| REND-07 | Timeline scrubber moves camera along helix with epoch labels and year markers | React DOM vertical rail scrubber (v1, spiral deferred). Maps scrubber % to helix parameter t, GSAP animates camera to corresponding position. Epoch labels rendered as HTML overlay. |
| REND-08 | "Because..." meaning lens shows evidence reasons for each connection | Detail panel React component. Expandable section, collapsed by default. Data from mock constellation.json edge evidence arrays. |
| REND-09 | 2D fallback provides searchable, keyboard-navigable node index | Pure React DOM list component. No Three.js dependency. Search input filters by title/type/tag. `role="listbox"` + `aria-selected` + keyboard arrow/tab/enter. Toggle persisted in localStorage. |
| REND-10 | Mobile responsive with graceful degradation | Drei `useDetectGPU` hook for tier detection. Tier-based config object controls: bloom on/off, particle count, pulse animation, nebula fog. CSS media queries for panel layout (bottom sheet vs sidebar). |
| REND-11 | ESC and back button exit cleanly, no broken state | `useEffect` keydown listener for ESC with layered dismissal (lightbox > panel > exit). `window.addEventListener('popstate')` for back button. React Router `useNavigate(-1)` for final exit. |
| REND-12 | Three.js disposal utilities prevent GPU memory leaks | R3F auto-disposal on unmount. `useEffect` cleanup to verify via `renderer.info.memory`. Manual disposal for InstancedBufferAttributes and shared textures. `renderer.info.memory.geometries` + `textures` logged on unmount. |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@react-three/fiber` | ^9.5.0 | React renderer for Three.js | Already in project. R3F v9 is current stable. Provides Canvas, useFrame, useThree, event system. |
| `@react-three/drei` | ^10.7.7 | R3F helper components | Already in project. Provides OrbitControls, Text (troika wrapper), Billboard, Stars, Points, PointMaterial, Line, PerformanceMonitor, useDetectGPU. |
| `@react-three/postprocessing` | ^3.0.4 | Post-processing effects | Already in project. Provides EffectComposer, Bloom with emissive-selective technique. |
| `three` | ^0.183.1 | WebGL 3D engine | Already in project. Provides InstancedMesh, InstancedBufferAttribute, Vector3, Color, Matrix4, SphereGeometry. |
| `gsap` | ^3.14.2 | Animation engine | Already in project. Used for camera fly-to, timeline scrubber animation. `@gsap/react` provides useGSAP hook. |
| `react-router-dom` | ^7.13.1 | Client-side routing | Already in project. Provides Route for /constellation, useNavigate, useLocation for history management. |
| `framer-motion` | ^12.34.3 | React animation | Already in project. Useful for detail panel slide-in/out, bottom sheet drag, 2D fallback transitions. |

### Supporting (New Installs Required)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zustand` | ^5.x | Lightweight state store | Constellation UI state: focusedNodeId, filterEntity, panelOpen, gpuTier, viewMode (3D/2D). Avoids prop drilling across 3D and DOM layers. Created by pmndrs (same team as R3F). |

### Already Bundled (No Install Needed)
| Library | Bundled In | Purpose |
|---------|-----------|---------|
| `troika-three-text` | `@react-three/drei` `<Text>` | SDF text rendering in 3D. Drei wraps it. No separate install. |
| `detect-gpu` | `@react-three/drei` `useDetectGPU` | GPU tier classification. Drei wraps it. No separate install. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `<instancedMesh>` | Drei `<Instances>` | Drei's declarative `<Instances>` has CPU overhead per docs. For 150+ nodes it may be fine, but native InstancedMesh gives zero overhead. Since we need custom InstancedBufferAttributes for color/opacity/size anyway, native is cleaner. |
| Zustand | React Context | Context causes full-tree re-renders on any state change. Zustand gives selector-based subscriptions (only re-renders what uses the changed slice). Critical for 60fps 3D scene. |
| Drei `<Line>` | Raw Line2/LineMaterial | Drei `<Line>` wraps Line2 and handles LineMaterial setup. For 150+ connection lines, the convenience is worth it and has negligible overhead vs raw. |
| GSAP camera fly-to | Drei CameraControls | CameraControls has built-in `truck()` and `dolly()` but GSAP is already in the project and gives finer control over easing. Reuse existing dependency. |

**Installation:**
```bash
npm install zustand
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── pages/
│   └── ConstellationPage.jsx    # Route entry, lazy-loaded
├── constellation/
│   ├── store.js                 # Zustand store (focusedNode, filter, gpuTier, viewMode)
│   ├── data/
│   │   └── constellation.json   # Mock data (nodes, edges, layout)
│   ├── layout/
│   │   └── helixLayout.js       # Double-helix positioning algorithm
│   ├── scene/
│   │   ├── ConstellationCanvas.jsx  # R3F Canvas + EffectComposer + OrbitControls
│   │   ├── NodeCloud.jsx            # InstancedMesh for all nodes
│   │   ├── ConnectionLines.jsx      # Line2 edges between nodes
│   │   ├── HoverLabel.jsx           # Drei <Text> + <Billboard> for hovered node
│   │   ├── Starfield.jsx            # Background star particles (reuse pattern from UniversePage)
│   │   ├── NebulaFog.jsx            # Low-opacity gradient sprites near epoch cores
│   │   └── CameraController.jsx     # GSAP fly-to + auto-orbit + idle resume
│   ├── ui/
│   │   ├── DetailPanel.jsx          # Right sidebar / bottom sheet
│   │   ├── TimelineScrubber.jsx     # Vertical rail scrubber
│   │   ├── Toolbar.jsx              # Home/Reset button, 3D/2D toggle
│   │   ├── MediaLightbox.jsx        # Full-screen media overlay
│   │   └── EntityChip.jsx           # Clickable tag/person/place chip
│   └── fallback/
│       └── ListView.jsx             # 2D accessible list view
```

### Pattern 1: Native InstancedMesh with Custom Attributes
**What:** Render all 150+ nodes as a single draw call using native `<instancedMesh>` with `InstancedBufferAttribute` for per-instance color, opacity, and scale.
**When to use:** When you have many identical geometries differing only in transform, color, and opacity.
**Example:**
```jsx
// Source: R3F docs (https://r3f.docs.pmnd.rs/advanced/scaling-performance)
// + Three.js docs (https://threejs.org/docs/pages/InstancedMesh.html)
import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const dummy = new THREE.Object3D()
const tempColor = new THREE.Color()

function NodeCloud({ nodes }) {
  const meshRef = useRef()
  const count = nodes.length

  // Pre-compute colors as Float32Array
  const colors = useMemo(() => {
    const arr = new Float32Array(count * 3)
    nodes.forEach((node, i) => {
      tempColor.set(NODE_COLORS[node.type])
      arr[i * 3] = tempColor.r
      arr[i * 3 + 1] = tempColor.g
      arr[i * 3 + 2] = tempColor.b
    })
    return arr
  }, [nodes, count])

  useEffect(() => {
    nodes.forEach((node, i) => {
      dummy.position.set(node.x, node.y, node.z)
      dummy.scale.setScalar(node.size)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [nodes])

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, count]}
      onClick={(e) => {
        e.stopPropagation()
        // e.instanceId gives the clicked node index
        store.getState().focusNode(nodes[e.instanceId].id)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        store.getState().setHoveredNode(e.instanceId)
      }}
      onPointerOut={() => store.getState().setHoveredNode(null)}
    >
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        emissive="white"
        emissiveIntensity={1.5}
        toneMapped={false}
        vertexColors
      >
        <instancedBufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </meshStandardMaterial>
    </instancedMesh>
  )
}
```

### Pattern 2: GSAP Camera Fly-To with OrbitControls
**What:** Animate camera position and OrbitControls target together using GSAP timeline for smooth cinematic fly-to.
**When to use:** When user clicks a node and camera should smoothly reposition.
**Example:**
```jsx
// Source: GSAP + R3F pattern (https://gsap.com/community/forums/topic/35688-how-to-use-gsap-with-react-three-fiber/)
import { useThree } from '@react-three/fiber'
import gsap from 'gsap'

function useFlyTo(controlsRef) {
  const { camera } = useThree()

  return (targetPosition, nodePosition) => {
    const controls = controlsRef.current
    if (!controls) return

    // Pause auto-rotate during animation
    controls.autoRotate = false

    const tl = gsap.timeline({
      onComplete: () => {
        // Resume auto-rotate after idle timeout
      }
    })

    // Animate camera position and controls target simultaneously
    tl.to(camera.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => controls.update(),
    }, 0)

    tl.to(controls.target, {
      x: nodePosition.x,
      y: nodePosition.y,
      z: nodePosition.z,
      duration: 1.5,
      ease: 'power2.inOut',
    }, 0) // '<' = start at same time
  }
}
```

### Pattern 3: Zustand Store for Constellation State
**What:** Central state store shared between 3D Canvas and DOM UI, with selector-based subscriptions.
**When to use:** When 3D scene events (click node) need to update DOM (open panel) and vice versa.
**Example:**
```jsx
// Source: Zustand docs (https://github.com/pmndrs/zustand)
import { create } from 'zustand'

const useConstellationStore = create((set, get) => ({
  // View mode
  viewMode: localStorage.getItem('constellation-view') || '3d', // '3d' | '2d'
  setViewMode: (mode) => {
    localStorage.setItem('constellation-view', mode)
    set({ viewMode: mode })
  },

  // GPU tier (set once on mount)
  gpuTier: null,
  setGpuTier: (tier) => set({ gpuTier: tier }),

  // Node interaction
  focusedNodeId: null,
  hoveredNodeIdx: null,
  filterEntity: null,

  focusNode: (id) => set({ focusedNodeId: id }),
  clearFocus: () => set({ focusedNodeId: null, filterEntity: null }),
  setHoveredNode: (idx) => set({ hoveredNodeIdx: idx }),
  setFilterEntity: (entity) => set({ filterEntity: entity }),

  // Lightbox
  lightboxMedia: null,
  lightboxIndex: 0,
  openLightbox: (media, index) => set({ lightboxMedia: media, lightboxIndex: index }),
  closeLightbox: () => set({ lightboxMedia: null }),
}))
```

### Pattern 4: Auto-Orbit with Pause/Resume (from existing globe)
**What:** Auto-rotate camera around scene center, pause on any user interaction, resume with speed ramp after 5 seconds idle.
**When to use:** Idle state for the constellation scene.
**Example:**
```jsx
// Source: Existing project pattern (src/pages/Home.jsx lines 525-563)
function CameraController({ controlsRef }) {
  const autoRotateTimer = useRef(null)

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    controls.autoRotate = true
    controls.autoRotateSpeed = 0.5
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enablePan = false
    controls.minPolarAngle = THREE.MathUtils.degToRad(15)
    controls.maxPolarAngle = THREE.MathUtils.degToRad(165)

    const handleStart = () => {
      controls.autoRotate = false
      if (autoRotateTimer.current) clearTimeout(autoRotateTimer.current)
    }

    const handleEnd = () => {
      autoRotateTimer.current = setTimeout(() => {
        controls.autoRotate = true
        controls.autoRotateSpeed = 0
        const ramp = setInterval(() => {
          if (controls.autoRotateSpeed < 0.5) {
            controls.autoRotateSpeed += 0.02
          } else {
            controls.autoRotateSpeed = 0.5
            clearInterval(ramp)
          }
        }, 50)
      }, 5000) // Resume after 5 seconds idle
    }

    controls.addEventListener('start', handleStart)
    controls.addEventListener('end', handleEnd)

    return () => {
      controls.removeEventListener('start', handleStart)
      controls.removeEventListener('end', handleEnd)
      if (autoRotateTimer.current) clearTimeout(autoRotateTimer.current)
    }
  }, [controlsRef])
}
```

### Pattern 5: Selective Bloom via Emissive Materials
**What:** Make specific objects glow using Bloom post-processing by lifting emissive colors above 1.0 range with `toneMapped={false}`.
**When to use:** Node glow + connection line glow without everything glowing.
**Example:**
```jsx
// Source: react-postprocessing docs (https://react-postprocessing.docs.pmnd.rs/effects/bloom)
import { EffectComposer, Bloom } from '@react-three/postprocessing'

// In Canvas:
<EffectComposer>
  <Bloom
    luminanceThreshold={1}
    luminanceSmoothing={0.9}
    intensity={0.5}
    mipmapBlur
  />
</EffectComposer>

// On node material (will glow):
<meshStandardMaterial
  emissive={nodeColor}
  emissiveIntensity={2.0}  // Above 1.0 = triggers bloom
  toneMapped={false}       // CRITICAL: must be false
/>

// On background (will NOT glow):
<meshBasicMaterial color="black" />  // Under threshold, no glow
```

### Anti-Patterns to Avoid
- **Individual `<mesh>` per node:** 150+ individual meshes = 150+ draw calls = frame drops. Always use InstancedMesh for identical geometry.
- **Drei `<Html>` for hover labels:** Html components inside Canvas cause DOM reflow per frame during animation. Use Drei `<Text>` (troika SDF) for in-3D labels instead.
- **Context API for high-frequency state:** React Context re-renders entire tree. For state accessed by both 3D and DOM (hoveredNode changes 60fps on mousemove), Zustand selectors avoid unnecessary re-renders.
- **FrontSide atmosphere meshes:** Per project memory, never use FrontSide atmosphere meshes -- they paint fog over content. Use BackSide only for any atmospheric effect.
- **`scene.traverse()` to replace materials:** Per project memory, this silently fails. Use `globeMaterial` prop or direct refs.
- **Animating camera without updating controls.target:** Camera fly-to without matching controls.target causes snapping when user next interacts. Always animate both together.
- **Not calling `e.stopPropagation()` on InstancedMesh events:** Without stopPropagation, pointer events bubble through to background, causing unwanted orbit/zoom during hover.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SDF text rendering in 3D | Custom text mesh / sprite | Drei `<Text>` (wraps troika-three-text) | Kerning, ligatures, Unicode, SDF antialiasing -- enormous complexity. |
| GPU tier detection | `navigator.gpu` feature detection | Drei `useDetectGPU` (wraps detect-gpu) | Benchmarks thousands of GPU models, handles mobile detection, returns tier 0-3. |
| Wide lines with glow | Custom shader tubes | Drei `<Line>` (wraps Line2/LineMaterial) | LineMaterial handles round caps, arbitrary width, resolution-independent. Bloom handles glow. |
| Camera orbit controls | Custom mouse/touch handlers | Drei `<OrbitControls>` | Damping, touch gestures, polar clamping, auto-rotate -- extremely complex to get right. |
| Post-processing pipeline | Manual render targets + passes | `@react-three/postprocessing` EffectComposer | Automatic effect merging reduces render passes. Handles resize, HiDPI, disposal. |
| Bottom sheet drag gesture | Custom touch math | `framer-motion` drag + AnimatePresence | Snap points, velocity detection, gesture cancellation already handled. |

**Key insight:** The R3F/Drei/postprocessing ecosystem already solves every complex 3D rendering problem this phase needs. The custom work is: (1) the double-helix layout algorithm, (2) the constellation data shape, (3) the DOM UI panels, and (4) the state coordination between 3D and DOM.

## Common Pitfalls

### Pitfall 1: InstancedMesh Color Not Updating
**What goes wrong:** Calling `setColorAt()` or modifying `instanceColor` but colors don't change on screen.
**Why it happens:** Three.js requires `instanceColor.needsUpdate = true` after every modification. R3F doesn't auto-flag this.
**How to avoid:** After modifying the InstancedBufferAttribute for colors, set `meshRef.current.instanceColor.needsUpdate = true`. For opacity (custom attribute), set `geometry.attributes.instanceOpacity.needsUpdate = true`.
**Warning signs:** Nodes all appear the same color, or color changes appear one frame late.

### Pitfall 2: GSAP + OrbitControls Conflict
**What goes wrong:** Camera animates to position correctly, but on next mouse interaction it snaps back to the old orbit target.
**Why it happens:** OrbitControls maintains its own internal `target` Vector3. If you only animate `camera.position` without updating `controls.target`, the next `controls.update()` call resets the camera to orbit around the old target.
**How to avoid:** Always animate `camera.position` AND `controls.target` in the same GSAP timeline. Call `controls.update()` in the `onUpdate` callback.
**Warning signs:** Camera snaps or jumps after a fly-to animation when user starts dragging.

### Pitfall 3: Bloom Bleeds to Everything
**What goes wrong:** The entire scene glows, not just nodes.
**Why it happens:** `luminanceThreshold` too low, or background materials have colors above threshold.
**How to avoid:** Set `luminanceThreshold={1}`. Only materials with `emissiveIntensity > 1.0` AND `toneMapped={false}` will glow. Background stars/nebula should use `toneMapped={true}` or keep intensity under 1.0.
**Warning signs:** Stars, lines, or background fog all appear to bloom.

### Pitfall 4: Memory Leak on Route Change
**What goes wrong:** GPU memory keeps growing when navigating to/from constellation.
**Why it happens:** R3F auto-disposes on unmount, but shared materials/geometries created outside the Canvas (in module scope or useMemo without deps) may not be tracked.
**How to avoid:** Create materials/geometries inside the Canvas tree so R3F tracks them. For any manually created resources, add `useEffect` cleanup that calls `.dispose()`. Monitor `renderer.info.memory.geometries` and `renderer.info.memory.textures` on unmount.
**Warning signs:** `renderer.info.memory.geometries` count increases each time you visit /constellation.

### Pitfall 5: Raycasting Misses After Matrix Update
**What goes wrong:** Hover/click events stop working on instances after updating their positions.
**Why it happens:** After calling `setMatrixAt()`, you must set `instanceMatrix.needsUpdate = true` AND the bounding sphere must be recomputed with `computeBoundingSphere()`.
**How to avoid:** After any batch of `setMatrixAt()` calls: set `instanceMatrix.needsUpdate = true` then call `meshRef.current.computeBoundingSphere()`.
**Warning signs:** Clicks register on the wrong node, or no node responds to hover.

### Pitfall 6: Mobile Touch Conflicts
**What goes wrong:** Pinch-to-zoom triggers browser zoom instead of Three.js zoom, or single-finger drag conflicts with scroll.
**Why it happens:** Canvas touch events need `touch-action: none` CSS and the Canvas element must prevent default on touch events.
**How to avoid:** R3F Canvas already sets `touch-action: none` by default. Ensure no parent element overrides this. OrbitControls handles touch gestures natively.
**Warning signs:** Page scrolls or browser zoom activates during 3D interaction on mobile.

### Pitfall 7: History State Stack Overflow
**What goes wrong:** Clicking multiple nodes pushes many history entries, and back button takes forever to leave the page.
**Why it happens:** Each node click calls `history.pushState()` without checking if we're already in a constellation state.
**How to avoid:** Use `history.replaceState()` for node-to-node navigation (only the first node click uses `pushState()`). Track whether a constellation state is already on the stack.
**Warning signs:** User presses back 10+ times and is still on the constellation page.

## Code Examples

### Double-Helix Layout Algorithm
```jsx
// Custom algorithm -- no library exists for this
// Verified math: parametric double helix with epoch clustering

function computeHelixLayout(nodes, config = {}) {
  const {
    radius = 30,          // Helix radius
    pitch = 5,            // Vertical distance per full rotation
    epochGap = 15,        // Extra vertical gap between epochs
    jitterRadius = 2,     // Random offset for organic feel
    seed = 42,            // Seeded random for deterministic layout
  } = config

  // Sort nodes by date
  const sorted = [...nodes].sort((a, b) => new Date(a.date) - new Date(b.date))

  // Group by epoch
  const epochs = groupByEpoch(sorted)

  let currentY = 0
  const positions = []

  epochs.forEach((epochNodes, epochIndex) => {
    if (epochIndex > 0) currentY += epochGap

    epochNodes.forEach((node, i) => {
      const t = (i / epochNodes.length) * Math.PI * 2 // Full rotation per epoch
      // Double helix: strand 0 and strand 1 offset by PI
      const strand = node.isHub ? 0 : (i % 2) // Hubs on strand 0
      const angle = t + strand * Math.PI

      const x = radius * Math.cos(angle) + seededRandom(seed + i) * jitterRadius
      const y = currentY + (i / epochNodes.length) * pitch
      const z = radius * Math.sin(angle) + seededRandom(seed + i + 1000) * jitterRadius

      positions.push({ ...node, x, y, z })
      currentY = y
    })
  })

  return positions
}
```

### GPU Tier Adaptive Config
```jsx
// Source: Drei docs (https://drei.docs.pmnd.rs/misc/detect-gpu-use-detect-gpu)

import { useDetectGPU } from '@react-three/drei'

function useGPUConfig() {
  const gpu = useDetectGPU()

  return useMemo(() => {
    const tier = gpu?.tier ?? 1

    if (tier <= 1) {
      // LOW: Aggressive cuts for mobile/weak GPU
      return {
        bloom: false,
        pulseAnimation: false,
        starParticles: 0,
        nebulaFog: false,
        dpr: 1,
        sphereSegments: 8,
        lineWidth: 1,
        targetFps: 30,
      }
    }
    if (tier === 2) {
      // MEDIUM: Moderate cuts
      return {
        bloom: true,
        pulseAnimation: true,
        starParticles: 4000,
        nebulaFog: false,
        dpr: 1.5,
        sphereSegments: 12,
        lineWidth: 1.5,
        targetFps: 60,
      }
    }
    // HIGH: Full effects
    return {
      bloom: true,
      pulseAnimation: true,
      starParticles: 8000,
      nebulaFog: true,
      dpr: 2,
      sphereSegments: 16,
      lineWidth: 2,
      targetFps: 60,
    }
  }, [gpu])
}
```

### Disposal Verification
```jsx
// Source: R3F docs (https://docs.pmnd.rs/react-three-fiber/advanced/pitfalls)
// + Three.js docs (https://threejs.org/docs/#manual/en/introduction/How-to-dispose-of-objects)

function ConstellationCanvas() {
  const rendererRef = useRef()

  useEffect(() => {
    return () => {
      // Log memory on unmount to verify disposal
      if (rendererRef.current) {
        const info = rendererRef.current.info.memory
        console.log('Constellation unmount - geometries:', info.geometries, 'textures:', info.textures)
      }
    }
  }, [])

  return (
    <Canvas
      gl={{ antialias: true }}
      onCreated={({ gl }) => { rendererRef.current = gl }}
    >
      {/* R3F auto-disposes children on unmount */}
      {/* ... scene contents ... */}
    </Canvas>
  )
}
```

### Browser History State Management
```jsx
// Pattern for detail panel + lightbox + constellation layered back-button

function useConstellationHistory() {
  const navigate = useNavigate()
  const store = useConstellationStore()
  const hasConstellationState = useRef(false)

  const focusNode = useCallback((nodeId) => {
    if (!hasConstellationState.current) {
      // First node focus: pushState
      window.history.pushState({ constellation: true, nodeId }, '')
      hasConstellationState.current = true
    } else {
      // Subsequent: replaceState (avoid stack buildup)
      window.history.replaceState({ constellation: true, nodeId }, '')
    }
    store.focusNode(nodeId)
  }, [store])

  useEffect(() => {
    const handlePopState = (e) => {
      if (store.lightboxMedia) {
        // Layer 1: Close lightbox
        store.closeLightbox()
      } else if (store.focusedNodeId) {
        // Layer 2: Close detail panel
        store.clearFocus()
        hasConstellationState.current = false
      } else {
        // Layer 3: Leave constellation
        navigate(-1)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [store, navigate])

  return { focusNode }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `UnrealBloomPass` (three/examples) | `@react-three/postprocessing` Bloom | 2022+ | Automatic effect merging, no manual pass chaining, emissive-selective by default |
| Individual meshes for many objects | `InstancedMesh` + `InstancedBufferAttribute` | Three.js r124+ | Single draw call for 100K+ objects, per-instance color/transform |
| `THREE.Font` + `TextGeometry` | troika-three-text (via Drei `<Text>`) | 2020+ | SDF rendering, no geometry per character, dynamic text, font loading |
| Force-directed graph layout | Deterministic parametric layout | Project decision | Reproducible positions, no physics simulation, stable across sessions |
| `react-force-graph` / `d3-force-3d` | Custom helix layout + R3F | Project decision | Out of scope per REQUIREMENTS.md -- physics-based is non-deterministic |

**Deprecated/outdated:**
- `THREE.Geometry` (removed r125+) -- use `BufferGeometry` only
- `fontJSON` text approach -- use troika SDF instead
- Pass-based post-processing (EffectComposer from three/examples) -- use @react-three/postprocessing for automatic merging

## Open Questions

1. **Breathing pulse animation technique**
   - What we know: Nodes should have a gentle breathing pulse (scale or emissive intensity oscillation). Can be done via `useFrame` updating InstancedBufferAttribute or via uniform in custom ShaderMaterial.
   - What's unclear: Performance of updating InstancedBufferAttribute every frame for 150+ nodes vs. using a time-based uniform in a custom shader.
   - Recommendation: Use a `time` uniform in the material shader -- `sin(time + instanceIndex * offset)` gives per-node phase offset with zero CPU cost per frame. Falls under Claude's discretion.

2. **Connection line rendering strategy for 150+ potential edges**
   - What we know: Drei `<Line>` wraps Line2, handles width and LineMaterial. Each `<Line>` component is a separate draw call.
   - What's unclear: If there are hundreds of connection lines, each as a separate `<Line>`, draw call count could be high. Alternative: batch all line segments into a single `LineSegments2`.
   - Recommendation: Start with individual Drei `<Line>` components. If draw calls exceed ~50 visible lines, batch into a single `LineSegments2` with per-segment vertex colors. Profile first.

3. **Mock constellation.json data structure**
   - What we know: Must support all 6 node types (project, moment, person, place, idea, milestone), edges with evidence arrays, epochs, dates, media references.
   - What's unclear: Exact schema -- this is Claude's discretion per CONTEXT.md.
   - Recommendation: Define during planning. Minimum fields per node: `id, type, title, date, epoch, description, media[], connections[], size, isHub`. Minimum fields per edge: `source, target, weight, evidence[]`.

4. **Spiral minimap scrubber feasibility**
   - What we know: User wants spiral inline minimap but explicitly allows vertical rail fallback if schedule/perf risk.
   - What's unclear: SVG spiral minimap rendering + drag interaction complexity.
   - Recommendation: Plan vertical rail scrubber as the v1 implementation. Spiral minimap can be a stretch goal if time allows. This aligns with CONTEXT.md's explicit fallback rule.

## Sources

### Primary (HIGH confidence)
- [R3F scaling performance docs](https://r3f.docs.pmnd.rs/advanced/scaling-performance) - InstancedMesh pattern, performance monitoring, disposal
- [R3F performance pitfalls](https://docs.pmnd.rs/react-three-fiber/advanced/pitfalls) - Auto-disposal behavior, re-mount costs
- [react-postprocessing Bloom docs](https://react-postprocessing.docs.pmnd.rs/effects/bloom) - Emissive-selective bloom technique, luminanceThreshold, toneMapped
- [Three.js InstancedMesh docs](https://threejs.org/docs/pages/InstancedMesh.html) - setMatrixAt, setColorAt, instanceId raycasting
- [Three.js OrbitControls docs](https://threejs.org/docs/pages/OrbitControls.html) - autoRotate, polar angle, zoom clamps, enablePan
- [Drei Instances docs](https://drei.docs.pmnd.rs/performances/instances) - Declarative InstancedMesh wrapper, CPU overhead warning
- [Drei Billboard docs](https://drei.docs.pmnd.rs/abstractions/billboard) - Billboard + Text combination
- [Drei useDetectGPU docs](https://drei.docs.pmnd.rs/misc/detect-gpu-use-detect-gpu) - GPU tier hook, works outside Canvas
- [Drei Line docs](https://drei.docs.pmnd.rs/shapes/line) - Line2 wrapper API, lineWidth, vertexColors
- Existing project code: `src/pages/Home.jsx` lines 525-563 (auto-rotate pause/resume pattern)
- Existing project code: `src/pages/UniversePage.jsx` (R3F Canvas, OrbitControls, Starfield, Points)

### Secondary (MEDIUM confidence)
- [GSAP + R3F camera animation gist](https://gist.github.com/ektogamat/8ba8c0d103fa683e7a836661aada55ed) - useGSAP + camera.position animation pattern
- [GSAP + R3F forum](https://gsap.com/community/forums/topic/35688-how-to-use-gsap-with-react-three-fiber/) - Camera + controls.target simultaneous animation
- [Zustand GitHub](https://github.com/pmndrs/zustand) - Store creation, selector subscriptions
- [detect-gpu GitHub](https://github.com/pmndrs/detect-gpu) - Tier classification, benchmark data, mobile detection
- [troika-three-text npm](https://www.npmjs.com/package/troika-three-text) - SDF text rendering capabilities, v0.52.4
- [Three.js InstancedMesh raycasting discussion](https://discourse.threejs.org/t/best-way-to-do-instanced-mesh-picking-in-2024/59917) - instanceId on raycast intersection

### Tertiary (LOW confidence)
- [100 Three.js Tips (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips) - General optimization tips, unverified comprehensively
- [R3F InstancedMesh performance issue #3306](https://github.com/pmndrs/react-three-fiber/issues/3306) - Reported Drei Instances CPU overhead vs raw InstancedMesh (validates our recommendation to use native)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All core libraries already installed in project, APIs verified via official docs
- Architecture: HIGH - Patterns verified from official R3F/Drei docs and existing project code
- Pitfalls: HIGH - Sourced from official docs, Three.js forum, and existing project experience (MEMORY.md lessons)
- Layout algorithm: MEDIUM - Double-helix math is standard parametric geometry, but no Three.js-specific library exists; custom implementation needed
- Connection line batching: MEDIUM - Individual Drei `<Line>` components are documented, but batching strategy for 100+ lines needs profiling

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (stable ecosystem, no major releases expected)
