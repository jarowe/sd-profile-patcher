# Architecture Research

**Domain:** Data-driven interactive personal website with build-time pipeline, 3D constellation, admin dashboard
**Researched:** 2026-02-27
**Confidence:** HIGH

## System Overview

The JAROWE Constellation architecture integrates five major subsystems into an existing Vite 7 + React 19 + R3F site:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │ Bento Hub   │  │ Constellation    │  │ Admin Dashboard  │       │
│  │ (Existing)  │  │ (R3F Scene)      │  │ (Protected)      │       │
│  └──────┬──────┘  └────────┬─────────┘  └────────┬─────────┘       │
│         │                  │                      │                 │
│         └──────────────────┴──────────────────────┘                 │
│                            │                                        │
│                    ┌───────▼──────────┐                             │
│                    │  Zustand Stores  │                             │
│                    │  - Constellation │                             │
│                    │  - Narrator      │                             │
│                    │  - Discovery     │                             │
│                    │  - Admin         │                             │
│                    └───────┬──────────┘                             │
│                            │                                        │
├────────────────────────────┴─────────────────────────────────────────┤
│                      STATIC DATA LAYER                              │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  constellation.json (150+ nodes, edges, layouts, metadata)   │   │
│  │  Generated at build-time, loaded runtime                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                               ▲
                               │
┌──────────────────────────────┴──────────────────────────────────────┐
│                   BUILD-TIME PIPELINE (Node.js)                     │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │ Parse   │→ │Normalize│→ │ Enrich  │→ │ Connect │→ │  Emit   │  │
│  │ Exports │  │ Schema  │  │ Signals │  │  Edges  │  │  JSON   │  │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │
│       ▲                                                              │
│       │                                                              │
│  ┌────┴──────────────────────────────────────────────────────────┐  │
│  │  Data Sources: Instagram export (276 files), Carbonmade JSON  │  │
│  └────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                               ▲
                               │
┌──────────────────────────────┴──────────────────────────────────────┐
│                 SERVERLESS LAYER (Vercel Functions)                 │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  API Ingest  │  │ Admin Auth   │  │  Cron Jobs   │              │
│  │  (on-demand) │  │ (Edge Fns)   │  │  (nightly)   │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                      │
│  ┌──────▼─────────────────▼──────────────────▼───────┐              │
│  │  Vercel KV (curation), Blob (media), Edge Config  │              │
│  └────────────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Build Pipeline** | Parse raw exports → generate constellation.json | Node.js scripts in `/scripts/build-data/` |
| **R3F Constellation** | Render 150+ instanced nodes, handle camera, interactions | React Three Fiber with InstancedMesh |
| **Narrator Engine** | Event-driven narration (5 tiers: epoch/node/connection/discovery/idle) | State machine with Zustand store |
| **Admin Dashboard** | Curate nodes, edit narration, manage allowlists | Protected React page with Vercel auth |
| **Serverless Functions** | API ingest, scheduled pulls, admin mutations | Vercel Edge Functions + Node.js Functions |
| **State Management** | Global constellation/narrator/discovery state | Zustand stores with persistence |
| **Existing Site** | Bento Hub, Globe, Music, XP, Cipher, Garden, etc. | Unchanged, continues to function |

## Recommended Project Structure

```
jarowe/
├── scripts/
│   └── build-data/              # Build-time data pipeline
│       ├── parse/               # Instagram, Carbonmade parsers
│       │   ├── instagram.js     # Parses 276-file export
│       │   └── carbonmade.js    # Parses JSON archive
│       ├── normalize.js         # Canonical node/edge schema
│       ├── enrich.js            # Add signals, metadata
│       ├── connect.js           # Evidence-based edge generation
│       ├── layout.js            # Double-helix 3D positioning
│       └── emit.js              # Write public/data/constellation.json
│
├── src/
│   ├── pages/
│   │   ├── ConstellationPage.jsx    # Main 3D experience
│   │   └── AdminDashboard.jsx       # Protected curation UI
│   │
│   ├── components/
│   │   ├── constellation/
│   │   │   ├── ConstellationScene.jsx   # R3F Canvas wrapper
│   │   │   ├── Nodes.jsx                # InstancedMesh renderer
│   │   │   ├── Edges.jsx                # Line connections
│   │   │   ├── Camera.jsx               # Animated camera controls
│   │   │   ├── DetailPanel.jsx          # Node info overlay
│   │   │   ├── Timeline.jsx             # Epoch scrubber
│   │   │   └── GuidedTour.jsx           # Cinematic intro
│   │   │
│   │   ├── narrator/
│   │   │   ├── NarratorEngine.jsx       # Event listener + state machine
│   │   │   └── NarratorUI.jsx           # Text display component
│   │   │
│   │   └── admin/
│   │       ├── DraftInbox.jsx           # New nodes queue
│   │       ├── NodeEditor.jsx           # Publish/hide/highlight
│   │       └── NarrationEditor.jsx      # Edit scripted text
│   │
│   ├── stores/
│   │   ├── constellationStore.js    # Focus, filters, camera mode
│   │   ├── narratorStore.js         # Current event, narration queue
│   │   ├── discoveryStore.js        # XP, visited nodes, path memory
│   │   └── adminStore.js            # Draft inbox, allowlists
│   │
│   ├── hooks/
│   │   ├── useConstellation.js      # Load JSON, manage scene state
│   │   ├── useNarrator.js           # Event-driven narration triggers
│   │   └── useDiscovery.js          # Track exploration, award XP
│   │
│   └── utils/
│       ├── constellationData.js     # Load JSON, filter/transform
│       └── narratorEvents.js        # Event types, priority queue
│
├── api/                             # Vercel serverless functions
│   ├── ingest/
│   │   └── suno.js                  # Pull Suno tracks on-demand
│   ├── admin/
│   │   ├── auth.js                  # Owner authentication
│   │   ├── publish.js               # Publish/hide nodes
│   │   └── narration.js             # Update scripted text
│   └── cron/
│       └── nightly-ingest.js        # Scheduled platform pulls
│
├── public/
│   └── data/
│       └── constellation.json       # Build-time generated, runtime loaded
│
└── vercel.json                      # Cron schedules, Edge Config
```

### Structure Rationale

- **scripts/build-data/**: Node.js pipeline runs at build-time, emits static JSON. Keeps runtime fast and safe.
- **stores/**: Zustand stores for global state. Zustand chosen over Redux (lighter, simpler) and Context API (performance).
- **components/constellation/**: R3F scene components. Scene graph mirrors data structure (nodes → InstancedMesh).
- **api/**: Vercel serverless functions. Hybrid approach: nightly cron + on-demand pulls + admin mutations.
- **hooks/**: Custom hooks abstract Zustand stores. Components stay clean, stores stay testable.

## Architectural Patterns

### Pattern 1: Build-Time Truth, Runtime Cinema

**What:** Data pipeline runs at build-time (Node.js), emits static JSON. Runtime loads JSON, renders 3D scene. No dynamic data fetching during navigation.

**When to use:** When data changes infrequently (daily/weekly), privacy enforcement must be deterministic, and performance is critical.

**Trade-offs:**
- **Pro:** Fast (no API calls), safe (validated at build), predictable (no runtime failures)
- **Con:** Changes require rebuild/redeploy, not "live" updating

**Example:**
```typescript
// scripts/build-data/emit.js (build-time)
import fs from 'fs';

function emitConstellation(nodes, edges, layout) {
  const data = {
    nodes: nodes.map(n => ({ id: n.id, type: n.type, position: layout[n.id], ... })),
    edges: edges.filter(e => e.weight > THRESHOLD),
    metadata: { generated: new Date(), nodeCount: nodes.length }
  };

  fs.writeFileSync('public/data/constellation.json', JSON.stringify(data));
}

// src/hooks/useConstellation.js (runtime)
export function useConstellation() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/data/constellation.json')
      .then(r => r.json())
      .then(setData);
  }, []);

  return data;
}
```

### Pattern 2: Hybrid Ingest (API + Export + Scheduled)

**What:** Three data ingest modes: (1) Export-based (Instagram 276 files), (2) API-based (Suno, scheduled nightly), (3) On-demand (admin "Pull Now").

**When to use:** When some data sources have APIs (Suno), others don't (Instagram requires export), and you want both automation and manual control.

**Trade-offs:**
- **Pro:** Reliable (export fallback), automated (nightly cron), flexible (on-demand)
- **Con:** More complex than single-mode, requires Vercel Pro for cron

**Example:**
```javascript
// api/cron/nightly-ingest.js (Vercel cron)
export default async function handler(req, res) {
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tracks = await fetchSunoAPI();
  await storeInVercelKV('draft_inbox', tracks);

  // Trigger rebuild via Vercel API
  await fetch('https://api.vercel.com/v1/deployments', { ... });

  res.json({ ingested: tracks.length });
}

// vercel.json
{
  "crons": [{
    "path": "/api/cron/nightly-ingest",
    "schedule": "0 2 * * *"  // 2am UTC daily
  }]
}
```

### Pattern 3: Instanced Rendering with Data-Driven Scene Graph

**What:** Single InstancedMesh for all nodes (150+), position/color set via instance matrix. Reduces draw calls from 150 to 1.

**When to use:** When rendering many similar objects (nodes in graph). Each mesh is a draw call; with 150 nodes, instancing is mandatory for 60fps.

**Trade-offs:**
- **Pro:** 90%+ reduction in draw calls, scales to thousands of nodes
- **Con:** All instances share same geometry/material (node types need color/scale variation via attributes)

**Example:**
```jsx
// src/components/constellation/Nodes.jsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Nodes({ nodes }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Set instance matrices on mount
  useLayoutEffect(() => {
    nodes.forEach((node, i) => {
      dummy.position.set(...node.position);
      dummy.scale.setScalar(node.scale || 1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, new THREE.Color(node.color));
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [nodes, dummy]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, nodes.length]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial />
    </instancedMesh>
  );
}
```

### Pattern 4: Event-Driven Narrator with State Machine

**What:** 5-tier event system (epoch, node, connection, discovery, idle). Events enqueued with priorities, narrator state machine consumes queue.

**When to use:** When narration must respond to user actions (hover node, discover new, timeline scrub) with prioritized, interruptible text.

**Trade-offs:**
- **Pro:** Decoupled (narrator doesn't know about scene), flexible (easy to add new event types), interruptible (high-priority events override)
- **Con:** More complex than direct imperative narration

**Example:**
```javascript
// src/stores/narratorStore.js (Zustand)
import create from 'zustand';

export const useNarratorStore = create((set, get) => ({
  events: [],
  current: null,

  enqueue: (event) => set((state) => ({
    events: [...state.events, event].sort((a, b) => b.priority - a.priority)
  })),

  dequeue: () => set((state) => ({
    current: state.events[0] || null,
    events: state.events.slice(1)
  })),

  interrupt: (event) => set((state) => {
    if (event.priority > (state.current?.priority || 0)) {
      return { current: event, events: [state.current, ...state.events].filter(Boolean) };
    }
    return state;
  })
}));

// src/components/constellation/Nodes.jsx
function handleNodeHover(node) {
  useNarratorStore.getState().enqueue({
    type: 'node',
    priority: 3,
    text: node.narration,
    duration: 5000
  });
}
```

### Pattern 5: Zustand for R3F Scene State (Not React State)

**What:** Use Zustand stores for camera target, focused node, filter mode, timeline position. Read via selectors, mutate outside React render.

**When to use:** In R3F scenes where React state causes unnecessary re-renders. Zustand + selectors prevent re-renders unless specific slice changes.

**Trade-offs:**
- **Pro:** No re-renders on every camera move, 60fps maintained, clean separation
- **Con:** More abstraction than useState (but necessary for performance)

**Example:**
```javascript
// src/stores/constellationStore.js
import create from 'zustand';

export const useConstellationStore = create((set) => ({
  focusedNode: null,
  cameraTarget: [0, 0, 0],
  mode: 'life', // 'life' | 'work' | 'ideas'

  setFocus: (node) => set({
    focusedNode: node,
    cameraTarget: node.position
  }),

  setMode: (mode) => set({ mode })
}));

// src/components/constellation/Camera.jsx
import { useFrame } from '@react-three/fiber';
import { useConstellationStore } from '@/stores/constellationStore';

function Camera() {
  const target = useConstellationStore(state => state.cameraTarget);
  const cameraRef = useRef();

  useFrame((state, delta) => {
    // Lerp camera to target (mutable, no React re-render)
    cameraRef.current.position.lerp(
      new THREE.Vector3(...target),
      1 - Math.exp(-5 * delta)
    );
  });

  return <perspectiveCamera ref={cameraRef} />;
}
```

## Data Flow

### Build-Time Pipeline Flow

```
Instagram Export (276 files) + Carbonmade JSON
    ↓
[Parse] → Raw events array (posts, projects, reels, etc.)
    ↓
[Normalize] → Canonical schema (11 node types, 9 edge types)
    ↓
[Enrich] → Add signals (co-occurrence, GPS proximity, tag overlap)
    ↓
[Connect] → Generate edges with weights, prune below threshold
    ↓
[Layout] → Double-helix 3D positions (epoch clustering, seeded)
    ↓
[Emit] → public/data/constellation.json (static, versioned)
```

### Runtime Constellation Flow

```
Page Load → fetch('/data/constellation.json')
    ↓
[useConstellation hook] → Load into Zustand store
    ↓
[Mode Filter] → Filter nodes/edges by mode ('life'/'work'/'ideas')
    ↓
[R3F Scene] → InstancedMesh renders nodes, LineSegments render edges
    ↓
User Hovers Node → Narrator event enqueued (priority 3)
    ↓
[NarratorEngine] → Dequeue event, display text, start 5s timer
    ↓
User Clicks Node → Focus event (priority 5, interrupts hover)
    ↓
[Camera] → Lerp to node position, DetailPanel slides in
    ↓
[Discovery] → Check localStorage, if new node → XP +10
```

### Admin Ingest Flow (On-Demand)

```
Admin clicks "Pull Suno Tracks Now"
    ↓
POST /api/ingest/suno (authenticated via Edge Function)
    ↓
[Serverless Function] → Fetch Suno API, parse tracks
    ↓
[Vercel KV] → Store in 'draft_inbox' key
    ↓
[Admin Dashboard] → Refetch draft inbox, display new tracks
    ↓
Admin publishes track → POST /api/admin/publish
    ↓
[Vercel Blob] → Upload track metadata (if privacy checks pass)
    ↓
[Trigger Rebuild] → Vercel API deployment hook
    ↓
[Build Pipeline] → Runs again, emits new constellation.json
    ↓
[Site Redeploys] → New track appears as constellation node
```

### Scheduled Ingest Flow (Nightly Cron)

```
2am UTC → Vercel cron triggers /api/cron/nightly-ingest
    ↓
[Cron Function] → Verify CRON_SECRET from headers
    ↓
[API Calls] → Fetch Suno, other platforms (future)
    ↓
[Privacy Filter] → Remove minors, redact GPS, check allowlists
    ↓
[Vercel KV] → Merge into 'draft_inbox'
    ↓
[Optional Auto-Publish] → If configured, publish to Blob
    ↓
[Trigger Rebuild] → Vercel API deployment hook
    ↓
Next morning: Site has new nodes (if auto-publish enabled)
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-500 nodes** | Current architecture works perfectly. Single InstancedMesh, JSON under 200KB, loads in <100ms. |
| **500-2000 nodes** | Add LOD (Level of Detail): render distant nodes as billboards, near nodes as spheres. Add spatial chunking (only render visible epoch clusters). Compress JSON with gzip (Vite does this automatically). |
| **2000-10000 nodes** | Split constellation.json into epoch chunks (load on-demand as user scrubs timeline). Add Web Worker for edge filtering. Consider edge bundling (group parallel edges into tubes). Add R3F-Perf monitoring. |
| **10000+ nodes** | Move to octree spatial indexing. Implement streaming: load only visible frustum. Consider WebGPU for compute shaders (edge layout). This is far beyond current scope. |

### Scaling Priorities

1. **First bottleneck (500-1000 nodes):** JSON parse time. **Fix:** Compress with gzip, lazy-load edge data.
2. **Second bottleneck (1000-2000 nodes):** Draw calls from non-instanced edges. **Fix:** Merge LineSegments into single BufferGeometry.
3. **Third bottleneck (2000+ nodes):** Camera/raycasting with 2000+ hitboxes. **Fix:** Spatial octree for raycasting, frustum culling.

**Current project (150 nodes):** No bottlenecks. Instancing alone handles this easily.

## Anti-Patterns

### Anti-Pattern 1: React State for Camera Position

**What people do:** Store camera position in useState, update every frame in useFrame
**Why it's wrong:** Triggers React re-render 60 times/second, kills performance
**Do this instead:** Use mutable refs or Zustand with frame-loop updates outside React

```javascript
// ❌ BAD: React state in render loop
const [cameraPos, setCameraPos] = useState([0, 0, 10]);
useFrame(() => setCameraPos([x, y, z])); // 60 re-renders/sec

// ✅ GOOD: Mutable ref or Zustand (no re-renders)
const cameraRef = useRef();
useFrame(() => {
  cameraRef.current.position.set(x, y, z);
});
```

### Anti-Pattern 2: Individual Meshes for Each Node

**What people do:** Render 150 `<mesh>` components in scene graph
**Why it's wrong:** 150 draw calls = ~10-15fps on mobile, excessive GPU load
**Do this instead:** Single InstancedMesh with instance matrices

```javascript
// ❌ BAD: 150 draw calls
{nodes.map(node => (
  <mesh key={node.id} position={node.position}>
    <sphereGeometry />
    <meshStandardMaterial />
  </mesh>
))}

// ✅ GOOD: 1 draw call
<instancedMesh args={[null, null, nodes.length]}>
  <sphereGeometry />
  <meshStandardMaterial />
</instancedMesh>
```

### Anti-Pattern 3: Runtime Data Fetching for Constellation

**What people do:** Fetch Instagram/Carbonmade APIs at page load
**Why it's wrong:** Slow (network latency), unreliable (API rate limits), unsafe (no privacy validation)
**Do this instead:** Build-time pipeline with validated static JSON

```javascript
// ❌ BAD: Runtime API calls
useEffect(() => {
  fetch('https://api.instagram.com/...')
    .then(parseInstagram)
    .then(generateConstellation);
}, []);

// ✅ GOOD: Build-time generation
// scripts/build-data/emit.js runs during `vite build`
// src/hooks/useConstellation.js loads pre-validated JSON
```

### Anti-Pattern 4: Coupling Narrator to Scene Components

**What people do:** Pass `setNarration()` callback down through scene graph components
**Why it's wrong:** Tight coupling, hard to test, narrator can't interrupt or prioritize
**Do this instead:** Event-driven architecture with Zustand store

```javascript
// ❌ BAD: Prop drilling narrator callback
<Nodes nodes={nodes} onHover={(text) => setNarration(text)} />

// ✅ GOOD: Event-driven with store
function handleHover(node) {
  useNarratorStore.getState().enqueue({
    type: 'node',
    priority: 3,
    text: node.narration
  });
}
```

### Anti-Pattern 5: Rebuilding on Every Ingest

**What people do:** Trigger build/deploy immediately when new data arrives (e.g., every Suno track)
**Why it's wrong:** Expensive (Vercel build minutes), slow (5+ min to deploy), noisy (constant deploys)
**Do this instead:** Batch ingest (nightly cron) + draft inbox (review before publish)

```javascript
// ❌ BAD: Rebuild on every track
api.onNewTrack(track => {
  vercel.deploy(); // Wasteful
});

// ✅ GOOD: Nightly batch + manual publish
// Cron runs 2am daily, collects all new tracks
// Admin reviews draft inbox, publishes when ready
// Single rebuild per batch
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Instagram** | Export-based (one-time manual export) | No API access; parse 276-file JSON export at build-time |
| **Carbonmade** | JSON archive (static file) | Pre-exported archive with 35 projects + blog posts |
| **Suno** | API-based (scheduled + on-demand) | Nightly cron pulls tracks; admin can trigger manual pull |
| **Vercel KV** | Read/write via @vercel/kv SDK | Draft inbox, allowlists, curation metadata |
| **Vercel Blob** | Write-once media storage | Published node media (photos, audio files) |
| **Vercel Edge Config** | Read-only config (feature flags, public allowlists) | Ultra-low latency global reads for narrator text, mode configs |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Build Pipeline ↔ Site** | Static JSON file | Pipeline emits `constellation.json`, site fetches at runtime |
| **Admin Dashboard ↔ Serverless** | Authenticated API calls (POST /api/admin/*) | Edge Functions verify owner token before mutations |
| **Constellation Scene ↔ Narrator** | Zustand events (enqueue/dequeue) | Scene emits events, narrator consumes; no direct coupling |
| **Existing Site ↔ New Systems** | Shared Zustand stores (XP), shared localStorage | Discovery XP integrates with existing GameOverlay |
| **Serverless ↔ Build** | Vercel API deployment hook | Cron/admin triggers rebuild via POST to Vercel API |

## Existing Architecture Integration

### Preserving Current Patterns

The existing JAROWE site has proven patterns that must continue:

| Existing Pattern | How New Systems Integrate |
|------------------|---------------------------|
| **AudioProvider context** | Constellation mode changes can trigger music playlist shifts (future enhancement) |
| **GameOverlay XP** | Discovery store calls `GameOverlay.addXp()` on new node visits |
| **localStorage persistence** | Constellation uses same pattern: `jarowe_constellation_discovered`, `jarowe_constellation_path` |
| **Lazy-loaded R3F** | ConstellationPage lazy-loads like UniversePage: `React.lazy(() => import('./pages/ConstellationPage'))` |
| **Globe ShaderMaterial** | Constellation uses same pattern: custom ShaderMaterial via useMemo, uniforms in useRef |
| **BASE_URL for assets** | Constellation media paths use `import.meta.env.BASE_URL + 'data/media/' + node.media` |
| **Sound effects (sounds.js)** | Node hover/click triggers `playHoverSound()`, `playClickSound()` |
| **Bento grid cells** | New "Constellation" cell added to Home.jsx bento grid, links to `/constellation` |

### Shared State Integration

```javascript
// src/stores/discoveryStore.js (NEW)
import { useGameOverlay } from '@/components/GameOverlay'; // EXISTING

export const useDiscoveryStore = create((set, get) => ({
  discovered: JSON.parse(localStorage.getItem('jarowe_constellation_discovered') || '[]'),

  discoverNode: (nodeId) => {
    const { discovered } = get();
    if (!discovered.includes(nodeId)) {
      const newDiscovered = [...discovered, nodeId];
      localStorage.setItem('jarowe_constellation_discovered', JSON.stringify(newDiscovered));

      // Integrate with existing XP system
      useGameOverlay.getState().addXp(10, `Discovered: ${nodeId}`);

      set({ discovered: newDiscovered });
    }
  }
}));
```

## Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| **Initial load (constellation.json)** | <200ms | Gzip compression (automatic via Vite), lazy-load media |
| **First render (150 nodes)** | <16ms (60fps) | InstancedMesh, no individual meshes |
| **Hover interaction** | <5ms | Raycasting via Three.js (GPU-accelerated) |
| **Camera animation** | Smooth 60fps | Exponential damping (lerp), no tweens |
| **Narrator event** | <10ms | Priority queue in Zustand, no DOM thrashing |
| **Discovery XP** | <2ms | Direct localStorage write, async confetti |
| **Admin publish** | <3s | Vercel Edge Function, KV write, async rebuild trigger |

## Build Order Dependencies

Suggested implementation sequence to avoid rework:

### Phase 1: Build-Time Foundation
1. **scripts/build-data/parse/** — Start with Instagram parser (most data)
2. **scripts/build-data/normalize.js** — Define canonical schema
3. **scripts/build-data/emit.js** — Emit minimal JSON (nodes only, no edges)
4. **public/data/constellation.json** — Verify JSON structure

**Validation:** Run `node scripts/build-data/emit.js`, check JSON is valid.

### Phase 2: R3F Scene Rendering
5. **src/stores/constellationStore.js** — Basic store (focusedNode, mode)
6. **src/hooks/useConstellation.js** — Load JSON hook
7. **src/components/constellation/Nodes.jsx** — InstancedMesh renderer
8. **src/pages/ConstellationPage.jsx** — Canvas wrapper

**Validation:** See 150 nodes in 3D space.

### Phase 3: Interactivity
9. **src/components/constellation/Camera.jsx** — Animated controls
10. **src/components/constellation/Edges.jsx** — LineSegments for connections
11. **scripts/build-data/connect.js** — Edge generation logic
12. **Rebuild JSON** — Now includes edges

**Validation:** Click node, camera animates to it. See connection lines.

### Phase 4: Narrator Engine
13. **src/stores/narratorStore.js** — Event queue + state machine
14. **src/components/narrator/NarratorEngine.jsx** — Event listener
15. **src/components/narrator/NarratorUI.jsx** — Text display
16. **src/utils/narratorEvents.js** — Event types, priorities

**Validation:** Hover node, see narration text appear.

### Phase 5: Discovery & XP
17. **src/stores/discoveryStore.js** — Track visited nodes
18. **src/hooks/useDiscovery.js** — Integrate with GameOverlay
19. **Update ConstellationPage** — Call `discoverNode()` on click

**Validation:** Visit new node, see XP +10 in GameOverlay.

### Phase 6: Admin Dashboard (Serverless Required)
20. **api/admin/auth.js** — Edge Function for owner verification
21. **api/admin/publish.js** — Publish/hide nodes
22. **src/pages/AdminDashboard.jsx** — Curation UI
23. **Vercel KV setup** — Draft inbox storage

**Validation:** Log in, see draft inbox, publish node.

### Phase 7: Scheduled Ingest
24. **api/ingest/suno.js** — Suno API fetcher
25. **api/cron/nightly-ingest.js** — Cron function
26. **vercel.json crons** — Schedule configuration
27. **scripts/build-data/parse/suno.js** — Suno parser for pipeline

**Validation:** Wait for 2am UTC cron, check Vercel logs, see new tracks in draft inbox.

## Sources

**Vite Architecture:**
- [Building for Production | Vite](https://vite.dev/guide/build)
- [VitePress Data Loading](https://vitepress.dev/guide/data-loading)
- [Vite: The Complete Guide for 2026](https://devtoolbox.dedyn.io/blog/vite-complete-guide)

**React Three Fiber Performance:**
- [Scaling Performance - React Three Fiber](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- [Building Efficient Three.js Scenes: Optimize Performance While Maintaining Quality | Codrops](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/)
- [100 Three.js Tips That Actually Improve Performance (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- [From Websites to Games: The Future of React Three Fiber](https://gitnation.com/contents/from-websites-to-games-the-future-of-react-three-fiber)

**State Management:**
- [React State Management in 2026: Zustand, Jotai, or Redux?](https://viprasol.com/blog/state-management-react-2026/)
- [State Machines in React](https://mastery.games/post/state-machines-in-react/)
- [Event-Driven Architecture for Clean React Component Communication](https://dev.to/nicolalc/event-driven-architecture-for-clean-react-component-communication-fph)

**Vercel Infrastructure:**
- [Vercel Functions](https://vercel.com/docs/functions)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Vercel Edge Config](https://vercel.com/docs/storage/edge-config)
- [How to Actually Use Vercel Edge Config in Production](https://www.buildwithmatija.com/blog/vercel-edge-config-production-guide)

**Hybrid Architecture:**
- [Static Vs Dynamic Architecture Explained](https://www.restack.io/p/dynamic-vs-static-group-management-answer-architecture-comparison)
- [Data Engineering Trends 2026 for AI-Driven Enterprises](https://www.trigyn.com/insights/data-engineering-trends-2026-building-foundation-ai-driven-enterprises)

---
*Architecture research for: JAROWE Constellation*
*Researched: 2026-02-27*
