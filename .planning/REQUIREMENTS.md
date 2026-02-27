# Requirements: The JAROWE Constellation

**Defined:** 2026-02-27
**Core Value:** The Constellation must render real life data as an explorable, evidence-connected 3D experience -- every node real, every connection justified, every visit a discovery.

## v1 Requirements

Requirements for initial milestone. Each maps to roadmap phases.

### Constellation Rendering

- [ ] **REND-01**: Constellation page renders 150+ nodes as instanced meshes at 60fps on desktop
- [ ] **REND-02**: User can hover any node to see tooltip with title, type, and date
- [ ] **REND-03**: User can click any node to fly camera to it and open detail panel
- [ ] **REND-04**: Detail panel shows node media (images/video), text content, and entity chips (people, places, tags)
- [ ] **REND-05**: Connection lines render between nodes with evidence-based edges, dimming non-connected nodes on focus
- [ ] **REND-06**: Nodes are positioned in double-helix temporal layout (time as spine, epoch clustering, seeded stability)
- [ ] **REND-07**: Timeline scrubber moves camera along helix with epoch labels and year markers
- [ ] **REND-08**: "Because..." meaning lens shows 3-5 evidence reasons for each connection in detail panel
- [ ] **REND-09**: 2D library fallback provides searchable, keyboard-navigable node index for accessibility
- [ ] **REND-10**: Mobile responsive with graceful degradation (no ChromaticAberration, simplified effects, touch gestures)
- [ ] **REND-11**: ESC key and back button exit constellation cleanly, no broken state
- [ ] **REND-12**: Three.js disposal utilities prevent GPU memory leaks on navigation

### Narrator & Tour

- [ ] **NARR-01**: Guided tour plays ~90-second cinematic journey through curated anchor nodes
- [ ] **NARR-02**: Tour is skippable at any point with prominent skip button, returns to orbit mode without broken state
- [ ] **NARR-03**: Scripted narrator engine responds to user behavior (hover, click, camera movement, timeline scrub)
- [ ] **NARR-04**: Narrator speaks in Jared's inner voice -- reflective, poetic, personal, not robotic or chatbot-like
- [ ] **NARR-05**: 150+ unique narration lines across 3 tiers: epoch transitions, node focus, connection reveals
- [ ] **NARR-06**: Narration selection uses behavior-responsive logic: relevance + novelty + emotional pacing
- [ ] **NARR-07**: No narration line repeats within 60 seconds; 3+ variants per event type
- [ ] **NARR-08**: Narration displays with typewriter animation and is dismissible

### Data Pipeline

- [ ] **PIPE-01**: Instagram parser extracts posts, captions, media files, GPS, tagged users, and reels from 276-file export
- [ ] **PIPE-02**: Carbonmade parser extracts 35 projects, 20 blog posts, career milestones, clients, and collaborators from JSON archive
- [ ] **PIPE-03**: Build-time pipeline runs end-to-end: parse -> normalize (canonical schema) -> enrich -> connect (evidence-based edges) -> layout (double-helix) -> emit JSON
- [ ] **PIPE-04**: Pipeline outputs constellation.json with nodes, edges, layout positions, and narration metadata
- [ ] **PIPE-05**: Evidence-based edge generation uses signal weights (person +0.55, client +0.40, place +0.25, tag +0.20, temporal +0.15) with pruning (top 6 per type per node)
- [ ] **PIPE-06**: Defensive Instagram parsing: null-safe traversal, logs unknown fields, never crashes on format changes
- [ ] **PIPE-07**: Ingest resilience: if APIs fail or rate-limit, keep last good snapshot and surface status in admin

### Privacy

- [ ] **PRIV-01**: Every node, edge, and media item has visibility tier: public / private / redacted / friends
- [ ] **PRIV-02**: Build-time validation script FAILS build (exit code 1) if private content appears in public output
- [ ] **PRIV-03**: GPS coordinates redacted to city-level (2 decimal places max) for public content; exact only for friends tier
- [ ] **PRIV-04**: All EXIF metadata stripped from images during pipeline processing
- [ ] **PRIV-05**: Minors policy enforced: no legal names, no home/school identifiers, no exact GPS, allowlisted before publish
- [ ] **PRIV-06**: DMs, contact graphs, and close friends lists are always private (never appear in output)
- [ ] **PRIV-07**: People visible publicly only via explicit allowlist; otherwise labeled "Friend" / "Family" / "Collaborator"
- [ ] **PRIV-08**: Owner-controlled allowlists with gated friends visibility layer
- [ ] **PRIV-09**: Evidence transparency: each key connection shows "Because..." reasons (evidence array visible to user)
- [ ] **PRIV-10**: Friends-gated visibility enforced server-side (public/friends/private access control via Vercel Edge Functions)

### Admin Dashboard

- [ ] **ADMN-01**: Owner-only authentication via Auth.js v5 (GitHub OAuth, JWT sessions, Edge Functions for fast auth)
- [ ] **ADMN-02**: Curation UI: publish/hide/highlight nodes with preview before publish
- [ ] **ADMN-03**: Draft inbox: auto-ingested content lands here for review; bulk approve/reject supported
- [ ] **ADMN-04**: Allowlist management: add/remove people names for public visibility
- [ ] **ADMN-05**: Tour anchor management: select which nodes appear in guided tour
- [ ] **ADMN-06**: Narration text editing: modify scripted narrator lines per node/epoch/connection
- [ ] **ADMN-07**: Publish states: draft -> preview -> published, with undo capability
- [ ] **ADMN-08**: Data quality view: shows missing/malformed fields per source, last sync timestamp
- [ ] **ADMN-09**: "Pull Latest Now" button triggers on-demand data refresh from connected platforms
- [ ] **ADMN-10**: Admin can edit and publish Garden and Now page content (not just constellation curation)

### Automation

- [ ] **AUTO-01**: Nightly scheduled ingest via Vercel cron pulls latest from connected platforms (Suno first)
- [ ] **AUTO-02**: Suno music auto-ingest: tracks pulled to draft inbox, owner curates with metadata (mood, era, story)
- [ ] **AUTO-03**: Published tracks become constellation nodes linked to relevant projects/eras and appear in site player
- [ ] **AUTO-04**: Cron jobs authenticated via CRON_SECRET pattern to prevent external triggering
- [ ] **AUTO-05**: Ingest respects API rate limits with exponential backoff and graceful degradation
- [ ] **AUTO-06**: Ingest observability in admin: last run timestamp, status, errors, source health per platform
- [ ] **AUTO-07**: On ingest failure, keep and serve last known good snapshot (no broken public state)
- [ ] **AUTO-08**: Music source adapters support Suno + SoundCloud normalization into unified track schema

### Bento Hub Enhancement

- [ ] **BENT-01**: Latest moments cell displays most recent Instagram/life moments from constellation data
- [ ] **BENT-02**: Featured project cell shows rotating showcase from Carbonmade project nodes
- [ ] **BENT-03**: Music player cell enhanced with Suno track metadata (mood, era, story) from constellation
- [ ] **BENT-04**: Constellation portal cell links to /constellation with live node count and visual preview
- [ ] **BENT-05**: Existing pages (Globe, Garden, Vault, Workshop, Now, Universe) polished and wired into constellation data system

## v1.1 Requirements

Deferred to next iteration after v1 validates.

### Constellation Polish
- **MODE-01**: Constellation modes: "Life" / "Work" / "Ideas" (filter + edge weight + narration tone)
- **PATH-01**: Path memory: faint glowing trail of visitor's journey through nodes
- **DISC-01**: Discovery gamification: XP awards per node (+50), per epoch complete (+200), constellation complete (+500)
- **DISC-02**: Discovery/idle narration tiers (tiers 4-5) added to narrator engine

### Audio
- **AUDI-01**: Ambient soundscape: cosmic drone, epoch tonal shifts
- **AUDI-02**: Interaction sounds: hover ping, focus whoosh, discovery sparkle, narration bell
- **AUDI-03**: Optional audio-reactive rendering (bass -> node pulse, mids -> edge glow, highs -> star twinkle)

### AI Narrator
- **AINR-01**: LLM narrator for nodes without scripted text (Vercel Edge Function + Gemini Flash)
- **AINR-02**: Caching by (nodeId + contextHash), fallback to scripted on API failure
- **AINR-03**: Privacy: never send private nodes to external LLM

## v2+ Requirements

Deferred to future milestones.

### Additional Platform Parsers
- **PLAT-01**: Facebook parser (timeline posts, albums, life events, check-ins)
- **PLAT-02**: X/Twitter parser (tweets, retweets, influence signals)
- **PLAT-03**: LinkedIn parser (positions, articles, recommendations)
- **PLAT-04**: Google Photos parser with clustering (thousands -> 200-500 moment nodes)

### Advanced Features
- **ADVN-01**: Web Speech API TTS narrator voice toggle
- **ADVN-02**: Lyria RealTime adaptive music generation
- **ADVN-03**: Garden and Now page content editing in admin dashboard

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Live AI narrator in v1 | Unpredictable, expensive, slow. Scripted-but-responsive first to prove interaction model. |
| Multiplayer / visitor presence | Complexity explosion. WebSocket infra, moderation, privacy. Not core to personal storytelling. |
| VR/AR mode | Tiny audience (1-2% have headsets), massive dev cost, motion sickness concerns. |
| Mobile native app | Web-first. Responsive design covers mobile adequately. |
| OAuth social login for visitors | Site is public. Only owner needs auth for admin. |
| Blockchain/NFT integration | Hype-driven, no value for personal portfolio. |
| Auto-playing video | Accessibility fail, bandwidth hog. Click-to-play with thumbnails. |
| Force-directed live physics layout | Non-deterministic. User wants stable, reproducible double-helix layout. |
| Full CMS (Contentful, Sanity) | Overkill for single-owner. Custom admin dashboard with Vercel storage. |
| react-force-graph or d3-force-3d | Physics-based, not deterministic. Custom layout algorithm preferred. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| REND-01 | Phase 1: Constellation Scene | Pending |
| REND-02 | Phase 1: Constellation Scene | Pending |
| REND-03 | Phase 1: Constellation Scene | Pending |
| REND-04 | Phase 1: Constellation Scene | Pending |
| REND-05 | Phase 1: Constellation Scene | Pending |
| REND-06 | Phase 1: Constellation Scene | Pending |
| REND-07 | Phase 1: Constellation Scene | Pending |
| REND-08 | Phase 1: Constellation Scene | Pending |
| REND-09 | Phase 1: Constellation Scene | Pending |
| REND-10 | Phase 1: Constellation Scene | Pending |
| REND-11 | Phase 1: Constellation Scene | Pending |
| REND-12 | Phase 1: Constellation Scene | Pending |
| NARR-01 | Phase 3: Narrator & Guided Tour | Pending |
| NARR-02 | Phase 3: Narrator & Guided Tour | Pending |
| NARR-03 | Phase 3: Narrator & Guided Tour | Pending |
| NARR-04 | Phase 3: Narrator & Guided Tour | Pending |
| NARR-05 | Phase 3: Narrator & Guided Tour | Pending |
| NARR-06 | Phase 3: Narrator & Guided Tour | Pending |
| NARR-07 | Phase 3: Narrator & Guided Tour | Pending |
| NARR-08 | Phase 3: Narrator & Guided Tour | Pending |
| PIPE-01 | Phase 2: Data Pipeline & Privacy | Pending |
| PIPE-02 | Phase 2: Data Pipeline & Privacy | Pending |
| PIPE-03 | Phase 2: Data Pipeline & Privacy | Pending |
| PIPE-04 | Phase 2: Data Pipeline & Privacy | Pending |
| PIPE-05 | Phase 2: Data Pipeline & Privacy | Pending |
| PIPE-06 | Phase 2: Data Pipeline & Privacy | Pending |
| PIPE-07 | Phase 2: Data Pipeline & Privacy | Pending |
| PRIV-01 | Phase 2: Data Pipeline & Privacy | Pending |
| PRIV-02 | Phase 2: Data Pipeline & Privacy | Pending |
| PRIV-03 | Phase 2: Data Pipeline & Privacy | Pending |
| PRIV-04 | Phase 2: Data Pipeline & Privacy | Pending |
| PRIV-05 | Phase 2: Data Pipeline & Privacy | Pending |
| PRIV-06 | Phase 2: Data Pipeline & Privacy | Pending |
| PRIV-07 | Phase 2: Data Pipeline & Privacy | Pending |
| PRIV-08 | Phase 2: Data Pipeline & Privacy | Pending |
| PRIV-09 | Phase 2: Data Pipeline & Privacy | Pending |
| PRIV-10 | Phase 4: Admin Dashboard | Pending |
| ADMN-01 | Phase 4: Admin Dashboard | Pending |
| ADMN-02 | Phase 4: Admin Dashboard | Pending |
| ADMN-03 | Phase 4: Admin Dashboard | Pending |
| ADMN-04 | Phase 4: Admin Dashboard | Pending |
| ADMN-05 | Phase 4: Admin Dashboard | Pending |
| ADMN-06 | Phase 4: Admin Dashboard | Pending |
| ADMN-07 | Phase 4: Admin Dashboard | Pending |
| ADMN-08 | Phase 4: Admin Dashboard | Pending |
| ADMN-09 | Phase 4: Admin Dashboard | Pending |
| ADMN-10 | Phase 4: Admin Dashboard | Pending |
| AUTO-01 | Phase 5: Automation | Pending |
| AUTO-02 | Phase 5: Automation | Pending |
| AUTO-03 | Phase 5: Automation | Pending |
| AUTO-04 | Phase 5: Automation | Pending |
| AUTO-05 | Phase 5: Automation | Pending |
| AUTO-06 | Phase 5: Automation | Pending |
| AUTO-07 | Phase 5: Automation | Pending |
| AUTO-08 | Phase 5: Automation | Pending |
| BENT-01 | Phase 6: Bento Hub Integration | Pending |
| BENT-02 | Phase 6: Bento Hub Integration | Pending |
| BENT-03 | Phase 6: Bento Hub Integration | Pending |
| BENT-04 | Phase 6: Bento Hub Integration | Pending |
| BENT-05 | Phase 6: Bento Hub Integration | Pending |

**Coverage:**
- v1 requirements: 60 total
- Mapped to phases: 60
- Unmapped: 0

---
*Requirements defined: 2026-02-27*
*Last updated: 2026-02-27 after roadmap creation*
