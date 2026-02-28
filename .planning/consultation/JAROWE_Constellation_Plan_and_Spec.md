# The JAROWE Constellation  
## Comprehensive plan + technical spec to achieve an award‑winning, data‑woven personal website

**Site:** www.jarowe.com  
**Document:** Plan & Spec (Consultant + Claude Code ready)  
**Version:** v1.0  
**Generated:** 2026-02-27 (America/New_York)

---

## The JAROWE Constellation

You’re not building a “personal website.” You’re building a **living graph**: a cinematic, explorable **fabric of real moments** (projects, posts, places, people, ideas) woven together by **evidence‑based connections** (timestamps, GPS, tags, collaborators, captions, metadata).

**Core promise**
- **Every node is real.**
- **Every connection is justified** (the system can explain “why this is connected”).
- **The narrator doesn’t invent meaning — it discovers meaning.**
- The experience is **playable** (discovery, guided tour, trails), not scrollable.

This document turns that promise into an implementable architecture.

---

# 1) Product definition

## 1.1 North‑star experience
A visitor enters a dark void. A core light pulses. The universe blooms into a 3D constellation of glowing nodes and threads.

They can:
- **Free‑explore** (orbit, hover, click‑to‑focus)
- **Follow threads** (person/location/theme/client connections)
- **Scrub time** (timeline sweep through epochs)
- **Take a guided tour** (≈90 seconds, cinematic and skippable)
- **Unlock narration** that reacts to what they discover

The narrator behaves like a **reflective inner voice**, not a chatbot:
- short, poetic monologues
- triggered by *actual exploration events*
- layered (epoch → node → connection → discovery → idle)

## 1.2 Key user stories
**First‑time visitor**
- “I want to feel who Jared is in 60 seconds.”
- “I want to understand the arc: creator → builder → family → innovation.”

**Creative director / recruiter**
- “I want to quickly see the best work, the range, and the leadership story.”

**Peer / collaborator**
- “I want to see how our collaboration fits into the broader life/career web.”

**Friends/family (optional gated mode)**
- “I want the personal layer without exposing everything publicly.”

## 1.3 Scope boundaries (so it ships)
You will have infinite data. You need finite output.

**Rule:** *Not every artifact becomes a node.*  
Many artifacts become **evidence** inside a node (cluster) rather than a visible star.

---

# 2) System architecture at a glance

## 2.1 Two‑layer system: Build‑time truth + Runtime cinema

### Build‑time (offline, deterministic)
1) **Ingest exports** (Instagram/Facebook/X/LinkedIn/Google Photos/Carbonmade archive)  
2) **Normalize** into a common schema  
3) **Enrich** (tags, sentiment, entity extraction, clustering, dedupe people/places)  
4) **Connect** nodes via evidence‑based edges  
5) **Layout** nodes into stable 3D positions (helix + clustering + relaxation)  

**Outputs**
- `constellation.graph.json` (nodes + edges + media refs + narratable summaries)
- `constellation.layout.json` (stable 3D positions + cluster metadata)
- `constellation.narration.json` (scripted narration library + triggers)

### Runtime (the website)
- Renders the graph in 3D (React + Three / R3F)
- Handles interaction, camera state, UI overlays
- Runs narrator engine (scripted first; optional live LLM later)
- Plays ambient + interaction audio; optional audio‑reactive visuals
- Tracks discovery locally (or optionally analytics)

**Why this split matters**  
It keeps the site fast, predictable, and safe. The “realness” lives in deterministic outputs.

---

# 3) Data governance, privacy, and “realness constraints”

If you’re pulling from “all social media,” you must design for:
- **Minors**
- **Other people’s privacy**
- **Sensitive locations** (home, schools)
- **DMs, contact graphs, close friends lists**

## 3.1 Visibility tiers (non‑negotiable)
Every node, edge, and media item gets a `visibility`:

- `public` → can ship
- `private` → never ships
- `redacted` → ships but with masked fields (e.g., city‑level only)
- `friends` (optional) → ships only behind an access gate

**Default:** anything involving DMs, minors, or non‑public contacts is `private`.

## 3.2 Redaction rules
- GPS precision:
  - Public: round to city/region (or random jitter radius)
  - Private/friends: optional full precision
- People:
  - Public: allowlist names you explicitly want public
  - Otherwise: “Friend”, “Family”, “Collaborator” with no identifying metadata
- Messages / DMs:
  - Never ship raw content publicly
  - Only derive *aggregate signals* (e.g., “this person is a frequent collaborator”) if you want

## 3.3 Curation layer (the secret to “award winning”)
You need an editable layer to override the algorithm.

Create:
- `curation/allowlists.json`
- `curation/hide.json`
- `curation/overrides.json`
- `curation/highlights.json`

Examples:
- Force certain nodes to always appear
- Hide sensitive nodes
- Rename a person node
- Pin an “anchor memory” per epoch
- Promote specific projects as tour stops

This is how you keep it **true** without becoming **exposed**.

---

# 4) Canonical data model (the heart of the whole system)

## 4.1 Node types
Standardize to a small set:

- `core` → “JAROWE” center
- `hub` → navigation nodes (Work, Family, Experiments, Writing, Music, Values, Contact)
- `epoch` → time clusters (AOTV, DNP, Doctrine, Eezy, VBI/Now, etc.)
- `project` → curated professional artifacts (Carbonmade projects)
- `moment` → photo/video‑based life events (Instagram posts, Google Photos clusters)
- `thought` → short‑form ideas (X posts, LinkedIn posts, Facebook posts)
- `milestone` → life events (moves, births, job changes, awards)
- `person` → deduped identity node (with privacy controls)
- `place` → canonical location node (city‑level public)
- `tag` → theme/skill/topic node (3D, leadership, fatherhood, etc.)
- `track` → music nodes (Suno, playlists, etc., if included)

**Key choice:** people/places/tags can be either:
- real nodes (visible), or
- latent entities only used for edges/filters

Start latent, then promote the best ones.

## 4.2 Node schema (implementation‑ready)
Use this shape everywhere, regardless of source:

```json
{
  "id": "moment_ig_2025-06-12_abc123",
  "type": "moment",
  "visibility": "public",
  "title": "Maria’s Birthday Letter — Greece to Maine to Europe",
  "time": {
    "start": "2025-06-12T00:00:00.000Z",
    "end": null,
    "precision": "day"
  },
  "location": {
    "placeId": "place_orlando_fl",
    "lat": 28.5383,
    "lon": -81.3792,
    "precision": "city",
    "source": "instagram"
  },
  "summary": "A long-form love letter spanning travel, family, and choosing adventure as a lifestyle.",
  "content": {
    "text": "…(sanitized excerpt or full caption depending on rules)…",
    "language": "en"
  },
  "media": [
    { "kind": "image", "src": "/media/ig/xyz.jpg", "w": 1080, "h": 1350, "hash": "sha1..." }
  ],
  "entities": {
    "people": ["person_maria", "person_jace", "person_jole"],
    "tags": ["tag_family", "tag_travel", "tag_worldschooling"],
    "clients": [],
    "brands": []
  },
  "source": {
    "platform": "instagram",
    "sourceId": "abc123",
    "uri": null
  },
  "metrics": {
    "likes": 0,
    "comments": 0
  },
  "computed": {
    "sentiment": 0.82,
    "emotion": ["love", "gratitude"],
    "embedding": "optional_vector_ref",
    "qualityScore": 0.91,
    "clusterId": "cluster_trip_europe_2025"
  }
}
```

## 4.3 Edge schema (connections must carry evidence)
Edges are not “because vibes.” They’re “because signals.”

```json
{
  "id": "edge_person_maria__moment_ig_2025-06-12_abc123",
  "type": "family",
  "visibility": "public",
  "from": "person_maria",
  "to": "moment_ig_2025-06-12_abc123",
  "weight": 0.95,
  "evidence": [
    { "signal": "tagged_user", "value": "maria", "confidence": 0.95 },
    { "signal": "caption_mention", "value": "Maria", "confidence": 0.90 }
  ]
}
```

### Edge types (keep it limited)
- `chronological`
- `geographic`
- `collaboration`
- `client`
- `thematic`
- `family`
- `influence`
- `simultaneous`
- `growth`

---

# 5) Source ingestion spec (exports → normalized JSON)

**Principle:** Never scrape live social platforms for this. Use exports. Exports are safer and don’t break.

## 5.1 Folder conventions
Keep raw exports out of git:

```
data/
  raw/
    instagram/
    facebook/
    twitter/
    linkedin/
    google-photos/
    carbonmade/
  normalized/
    instagram.json
    facebook.json
    twitter.json
    linkedin.json
    googlePhotos.json
    carbonmade.json
  build/
    constellation.graph.json
    constellation.layout.json
    constellation.narration.json
curation/
  allowlists.json
  hide.json
  overrides.json
  highlights.json
```

Add `data/raw/**` to `.gitignore`.

## 5.2 Parser contracts (every parser outputs the same format)
Each parser outputs:

```json
{
  "platform": "instagram",
  "artifacts": [],
  "mediaIndex": [],
  "peopleIndex": [],
  "placeIndex": [],
  "notes": { "exportVersion": "...", "warnings": [] }
}
```

Then a single `normalize.mjs` converts intermediate artifacts into canonical nodes.

## 5.3 Instagram export parsing (high value)
Parse:
- posts (captions + timestamps)
- media files
- tagged users
- location/GPS if present
- reels subtitles (SRT) → text evidence
- optionally likes/saves for influence signals (keep private unless curated)

Output to:
- `data/normalized/instagram.json`

## 5.4 Google Photos (Takeout) parsing (massive volume)
Plan for thousands of items.

Rules:
- Parse sidecar JSON metadata: taken time, geoData, album membership if available
- Compute file hash for dedupe
- Cluster into “moments” by:
  - same day + same city, or
  - within N hours + within radius
- Only promote clusters above a “story threshold” into visible nodes
- Use representative thumbnails

This avoids 10,000 stars becoming unreadable.

## 5.5 LinkedIn parsing (professional graph)
Parse:
- positions
- posts/articles
- recommendations
- connections list (likely private)
- skills endorsements (aggregate only)

Convert into:
- `thought` nodes
- professional `person` edges (recommendations) with visibility controls

## 5.6 X/Twitter parsing (thought stream)
Parse:
- tweets
- retweets
- likes (influence signals)
- replies (community edges)

Convert into:
- `thought` nodes
- `influence` edges (topic/person)
Keep raw handles private unless curated.

## 5.7 Facebook parsing (deep history)
Parse:
- timeline posts
- albums
- life events
- check‑ins (geo expansion)
- groups/pages liked (topic signals)

Convert into:
- `milestone`, `moment`, `thought`
Private by default unless curated.

---

# 6) Enrichment pipeline spec (turn raw into meaning)

## 6.1 Deterministic enrichment stages
Run in a build script so results don’t change randomly:

1) **Text cleanup**
- strip URLs
- normalize whitespace
- keep original text only if allowed by visibility

2) **Entity extraction**
- People: from tags + @handles + name mentions
- Places: from geo + place names
- Topics: from keywords + curated mapping
- Clients/brands: from known lists + pattern match

3) **Sentiment / emotion (lightweight)**
- score: -1..1
- emotion buckets: joy, gratitude, wonder, grit, reflection, etc.

4) **Embedding (optional but powerful)**
Use embeddings for:
- theme similarity edges
- “growth” edges (same topic across years)
- discovery suggestions (“if you liked this, follow this thread”)

5) **Clustering**
- Photo clusters → moments
- Thought clusters → “themes over time”
- Projects cluster by epoch/client

6) **Scoring**
Compute `qualityScore` per node:
- rich text + media + clear time + clear place + clear people → higher
- sparse items → lower (more likely hidden or merged)

---

# 7) Connection engine spec (how threads are justified)

## 7.1 Signals → edge weights
Edges created from signals; each adds weight; cap at 1.0.

Example weighting model:
- Same person entity: +0.55
- Same place (within threshold): +0.25
- Same tag/topic: +0.20
- Same client/brand: +0.40
- Same week across platforms: +0.15
- Embedding similarity > 0.82: +0.25
- Same album/trip cluster: +0.30

Then:
- `weight = min(1, sum(signals))`
- keep `evidence[]` for transparency/debugging

## 7.2 Edge pruning (avoid spaghetti)
Rules:
- For each node, keep only top **N strongest** edges per type (e.g., N=6)
- Always keep:
  - 1 chronological predecessor/successor
  - strongest person edge
  - strongest place edge
  - strongest theme edge
- Optionally keep more when zoomed in (progressive edge reveal)

## 7.3 Discovery thread logic
When a user focuses a node:
- highlight strongest edges
- optionally animate a “trail suggestion” (next node glow)
This is a major cinematic multiplier.

---

# 8) 3D layout spec (the constellation must be readable)

## 8.1 Spatial metaphor
- **Time** is the spine (double helix or gentle spiral)
- **Epochs** are nebula clusters along the spine
- **Personal warmth** (family moments) subtly pulls toward a “warm” region
- **Professional nodes** cluster by client + era
- **Hubs** form a ring near the core (site navigation as “planets”)

## 8.2 Layout algorithm (stable + cinematic)
1) **Base helix position from time**
- map timestamp → `t` in [0..1]
- helix radius R
- helix height H
- phase offset for double helix

2) **Epoch clustering offset**
- compute epoch centroids
- pull nodes toward epoch centroid proportional to node type

3) **Local relaxation (force sim)**
- repel to avoid overlap
- spring along strong edges
- keep close to helix “rail” for legibility

4) **Seeded randomness**
Use node ID as a seed so:
- positions are stable across builds
- the universe feels consistent

## 8.3 Level‑of‑detail (performance)
Nodes:
- Far: points/sprites
- Mid: simple spheres + emissive glow
- Near: higher fidelity + labels/tooltips

Edges:
- Far: none/minimal
- Mid: strongest only
- Near: full local neighborhood

---

# 9) Runtime implementation spec (React/R3F)

## 9.1 Pages / routes
- `/` (landing)
- `/constellation` (main experience)
- optional `/index` (2D library fallback)

## 9.2 Core runtime modules
**Data**
- `src/data/loadConstellation.js` loads graph + layout JSON and merges.

**State**
- `src/state/constellationStore.js` (Zustand or similar)
  - focusedNodeId
  - hoveredNodeId
  - activeFilters
  - discoveredSet
  - cameraMode
  - narrationQueue

**Scene**
- `src/components/constellation/ConstellationScene.jsx`
  - starfield
  - nodes
  - edges
  - postprocessing
  - camera controller

**UI overlay**
- tooltip
- detail panel
- timeline scrubber
- filter controls
- discovery counter
- narrator overlay
- tour controls

## 9.3 Interaction spec
Hover:
- show tooltip
- brighten connected edges
- dim others

Click node:
- camera fly‑to focus
- open detail panel
- trigger node narration
- mark discovered

Click person/place/tag chip:
- highlight matching nodes; dim others

Scrub timeline:
- camera moves along helix smoothly
- narrator speaks at epoch boundaries

Guided tour:
- overrides camera mode
- steps through curated anchor nodes
- plays narration beats
- always skippable

---

# 10) Narrator engine spec (scripted first, then live AI)

## 10.1 Narration as an event‑driven system
Treat narration like music cues in film.

Events:
- `ENTER_EPOCH(epochId)`
- `FOCUS_NODE(nodeId)`
- `HOVER_EDGE(edgeId)`
- `DISCOVERY_MILESTONE(count)`
- `IDLE(seconds)`
- `TOUR_STEP(stepId)`

## 10.2 Narration tiers (structured content)
**Tier 1 — Epoch** (5–8)  
**Tier 2 — Node** (50–120)  
**Tier 3 — Connection** (20–60)  
**Tier 4 — Discovery** (10–25)  
**Tier 5 — Idle** (10–20)

## 10.3 Narration selection logic (avoid repetition)
- maintain `recentNarrations` queue
- score candidates by relevance + novelty + pacing
- enforce cooldown per tier

## 10.4 Optional Live AI narrator (when ready)
Server‑side only:
- `/api/narrate` (Edge Function)
- Inputs:
  - focused node summary
  - last 10 visited node summaries
  - current filters
  - current epoch
- Output:
  - 1–3 sentences, max ~350 chars
- Must support:
  - caching by `(nodeId + contextHash)`
  - safety filters
  - fallback to scripted if API fails

**Privacy rule:** never send raw DMs or private nodes to an external LLM.

## 10.5 Voice option (award‑winning boost)
Start with:
- Web Speech API (local TTS) behind a toggle  
Later:
- premium voice service if desired, optional

---

# 11) Sound + audio‑reactive visuals spec

## 11.1 Ambient bed
- low drone + cosmic texture
- epoch tonal shifts (pitch changes by cluster)

## 11.2 Interaction sounds
- hover ping
- focus whoosh
- discovery sparkle
- narration bell cue

## 11.3 Audio‑reactive rendering (optional)
If music plays:
- bass → node emissive pulse
- mids → edge glow intensity
- highs → star twinkle

**Mobile rule:** auto‑disable heavy effects unless user opts in.

---

# 12) “Award winning” polish features (high ROI)

1) **Path memory (trail overlay)**: faint line showing the visitor’s recent journey  
2) **Cinematic camera language**: easing curves + micro‑settle after focus  
3) **Meaning lens**: show 3–5 “Because…” reasons for key connections  
4) **Constellation modes**:
   - “Life” (warmth‑forward)
   - “Work” (client/project‑forward)
   - “Ideas” (topic/thought‑forward)
5) **2D library fallback**: searchable node index for accessibility + credibility

---

# 13) Build pipeline & commands (how consultants actually run it)

## 13.1 Scripts (recommended)
- `scripts/parseInstagram.mjs`
- `scripts/parseFacebook.mjs`
- `scripts/parseTwitter.mjs`
- `scripts/parseLinkedIn.mjs`
- `scripts/parseGooglePhotos.mjs`
- `scripts/buildConstellation.mjs` (normalize → enrich → connect → layout → emit JSON)

## 13.2 Output consumed by the site
- `src/data/constellation.graph.json`
- `src/data/constellation.layout.json`
- `src/data/constellation.narration.json`

Or combine to:
- `src/data/constellation.bundle.json`

---

# 14) Implementation backlog (Claude Code‑ready “tickets”)

**Order that minimizes risk and keeps the project demonstrable at each step:**

## Ticket 01 — Canonical schema + validation
**Goal:** define node/edge schema + a validator script.  
Deliverables:
- `src/data/schema.js` (JSDoc types or TS types)
- `scripts/validateGraph.mjs`  
Acceptance:
- graph JSON fails loudly if edges reference missing nodes
- visibility rules enforced (no private leaks)

## Ticket 02 — Build orchestrator (empty graph works)
**Goal:** pipeline runs end‑to‑end even with placeholder data.  
Deliverables:
- `scripts/buildConstellation.mjs`
- outputs JSON files  
Acceptance:
- site loads and renders 10 demo nodes + 10 edges with helix layout

## Ticket 03 — Helix layout + seeded stability
**Goal:** deterministic positions from timestamp + seeded jitter.  
Deliverables:
- `scripts/layout/helix.mjs`
- `scripts/layout/relax.mjs`  
Acceptance:
- repeated builds produce identical positions
- no major overlaps for 150 nodes

## Ticket 04 — Constellation scene scaffold (R3F)
**Goal:** render nodes/edges with hover + click.  
Deliverables:
- `src/pages/ConstellationPage.jsx`
- `src/components/constellation/ConstellationScene.jsx`
- `DataNodes.jsx` (instanced mesh + picking)
- `ConnectionLines.jsx`  
Acceptance:
- hover tooltip works
- click focuses + camera fly‑to basic

## Ticket 05 — Detail panel + entity chips
**Goal:** show node’s media/text and allow clicking people/place/tag chips.  
Deliverables:
- `NodeDetailPanel.jsx`
- `NodeTooltip.jsx`  
Acceptance:
- clicking a chip highlights matching nodes and dims others

## Ticket 06 — Timeline scrubber + epoch transitions
**Goal:** time navigation that feels cinematic.  
Deliverables:
- `TimelineScrubber.jsx`
- camera mode `TIMELINE`  
Acceptance:
- scrub smoothly moves camera along helix
- epoch label updates and triggers narration event

## Ticket 07 — Narrator overlay + scripted narration engine
**Goal:** narration system running on events.  
Deliverables:
- `NarrationOverlay.jsx`
- `src/data/narrations.js`
- `src/utils/narratorEngine.js`  
Acceptance:
- Tier 1 epoch narration + Tier 2 node narration firing correctly
- cooldown and non‑repetition logic in place

## Ticket 08 — Guided tour
**Goal:** ≈90‑second skippable tour across anchor nodes.  
Deliverables:
- `src/data/tourScript.js`
- `CameraController.jsx` supports `TOUR` mode  
Acceptance:
- tour plays; skip returns to orbit mode; no broken state

## Ticket 09 — Audio bed + interaction sounds + optional reactivity
**Goal:** make it feel alive.  
Deliverables:
- `src/utils/constellationAudio.js`
- extend `src/utils/sounds.js`  
Acceptance:
- ambient starts on user gesture
- hover/click/discover sounds work
- reactivity toggle works

## Ticket 10 — Instagram parser (first real data win)
**Goal:** ingest Instagram export into nodes.  
Deliverables:
- `scripts/parseInstagram.mjs`
- `data/normalized/instagram.json`  
Acceptance:
- posts + media show up as moment nodes
- tagged users create person entities
- GPS creates place entities (public precision rules enforced)

## Ticket 11 — Carbonmade archive → projects spine
**Goal:** professional backbone nodes with clients/collaborators.  
Deliverables:
- `scripts/parseCarbonmade.mjs` (or reuse existing structured archive)  
Acceptance:
- projects appear as project nodes
- client edges work

## Ticket 12 — Google Photos clustering (huge expansion, controlled)
**Goal:** clusters into 200–500 meaningful moments.  
Deliverables:
- `scripts/parseGooglePhotos.mjs`
- clustering module  
Acceptance:
- clusters created with representative thumbnails
- performance remains acceptable

## Ticket 13 — Privacy hardening + curation overrides
**Goal:** make it shippable.  
Deliverables:
- curation files + merge logic in builder  
Acceptance:
- allowlist controls people visibility
- redaction works
- build fails if private content is accidentally public

---

# 15) Definition of done (what “it’s real” means)

The constellation is “done” when:
- The experience loads fast and runs smoothly (desktop + acceptable mobile mode)
- Nodes come from **real exports** and normalize into one graph
- Connections are **evidence‑based** and inspectable (at least in dev)
- Narration enhances exploration without feeling like a chatbot
- A guided tour communicates the identity arc in ≈90 seconds
- Private/sensitive content cannot leak due to validation + visibility tiers
- A 2D fallback index exists for accessibility and “real website” credibility

---

## Consultant / Claude Code instruction summary
**Execution order**
1) Schema + pipeline (Tickets 01–03)  
2) Scene + interaction (Tickets 04–06)  
3) Narrator + tour + audio (Tickets 07–09)  
4) Instagram + Carbonmade (Tickets 10–11)  
5) Google Photos + other platforms + privacy hardening (Tickets 12–13)

This order gives an early “working constellation” and then pours real life into it.
