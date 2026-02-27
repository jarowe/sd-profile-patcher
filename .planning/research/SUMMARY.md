# Project Research Summary

**Project:** JAROWE Constellation — Data-driven 3D personal website
**Domain:** Interactive portfolio with 3D constellation visualization
**Researched:** 2026-02-27
**Confidence:** HIGH

## Executive Summary

The JAROWE Constellation project adds a data pipeline, 3D visualization, and admin dashboard to an existing Vite 7 + React 19 + R3F portfolio site. Research reveals a clear path: extend the proven React Three Fiber foundation with Vercel-native serverless infrastructure (Functions, Blob, Cron, Edge Config) rather than introducing external databases or backend frameworks. The recommended architecture uses build-time data processing with runtime-loaded static JSON, avoiding the performance and complexity traps of live API calls during navigation.

The core technical challenge is rendering 150+ constellation nodes at 60fps on mid-range devices while maintaining privacy-first data handling. Solutions are well-documented: instanced rendering reduces draw calls by 90%+, Zustand state management prevents React re-render overhead in 3D scenes, and build-time validation enforces privacy policies before deployment. The primary risks are GPU memory leaks from improper Three.js disposal, privacy leaks from unredacted EXIF/GPS data in Instagram exports, and scope creep delaying launch indefinitely.

Success requires strict phase discipline: ship a minimal 3D constellation with Instagram + Carbonmade parsers first (validate the concept), then layer guided tour + narrator (storytelling), then admin dashboard + scheduled ingest (living site). Each phase must enforce privacy-first validation, performance budgets (60fps desktop, 30fps mobile), and disposal utilities from day one—retrofitting these later becomes prohibitively expensive.

## Key Findings

### Recommended Stack

Vercel's serverless ecosystem provides a cohesive, zero-infrastructure stack that extends the existing React 19 + R3F foundation. Vercel Functions handle API endpoints (10-second execution on Hobby, 60s on Pro), Vercel Cron schedules nightly data ingestion (2 jobs/day on Hobby), Vercel Blob stores media and parsed constellation JSON (5TB limit, CDN-backed), and Vercel Edge Config provides sub-5ms reads for feature flags and allowlists. This stack avoids Vercel KV (sunset in 2026) and Vercel Postgres (severe cold start issues in serverless context).

**Core technologies:**
- **Vercel Functions + Cron + Blob + Edge Config**: Serverless-first infrastructure that matches current Vercel deployment, auto-scales, requires zero database configuration
- **Auth.js v5 (NextAuth)**: Owner-only admin authentication with JWT sessions (stateless, no database), auto-infers `AUTH_*` env vars on Vercel
- **Zod v3.24**: TypeScript-first schema validation for parsed social media data, runtime validation prevents malformed data from breaking builds
- **React Three Fiber 9.5 + drei 10.7**: Already installed; InstancedMesh for 150+ nodes reduces draw calls from 150 to 1, maintaining 60fps
- **troika-three-text 0.53**: SDF-based 3D text labels with web worker parsing (prevents main thread jank), supports Three.js materials for lighting/fog
- **date-fns v4**: Lightweight date utilities for timestamp normalization and epoch clustering (tree-shakeable, replaces deprecated Moment.js)

**Critical exclusions:**
- **Vercel KV**: Sunset in 2026, marketplace alternatives add complexity—use Blob for data storage, Edge Config for flags
- **Vercel Postgres**: Cold start issues (100-200ms) and connection limits in serverless—build-time-generated static JSON eliminates database need
- **react-force-graph / d3-force-3d**: Physics-based layout (non-deterministic)—user wants stable double-helix layout that rebuilds consistently

### Expected Features

Research reveals a clear MVP boundary: 3D constellation rendering with Instagram + Carbonmade parsers, 2D library accessibility fallback, and privacy tier enforcement (public only for v1). These features validate the constellation concept and prove the build-time pipeline end-to-end. Guided tour, narrator engine, discovery gamification, and admin dashboard should be deferred to post-launch phases when the core experience is validated.

**Must have (table stakes):**
- Mobile responsiveness with graceful degradation (reduce effects on mobile, 30fps acceptable)
- Fast initial load under 3 seconds (code-splitting, lazy loading constellation scene)
- 2D library accessibility fallback (WCAG 3.0 developing 2026-2028 mandates text alternatives for immersive content)
- Privacy controls visibility (show privacy tiers visually via icons/colors on nodes)
- Keyboard navigation (tab, arrow keys for 3D exploration, ESC to exit)
- Persistent state across navigation (music player, XP progress already exist)

**Should have (competitive advantage):**
- Evidence-based connections (every edge justified by data signals: co-occurrence, GPS proximity, tag overlap)
- Cinematic guided tour (90-second narrative journey through life anchored to key moments)
- 5-tier narrator system (epoch, node, connection, discovery, idle contexts with event-driven state machine)
- Discovery gamification with XP (reuse existing GameOverlay system, emit XP events on node discoveries)
- Real-time data auto-ingest (nightly cron + on-demand refresh via admin)
- Privacy-first with curation layer (publish/hide/highlight controls, allowlists, minors protection)
- Double-helix temporal layout (epoch clustering with seeded stability for reproducible builds)
- Draft inbox for auto-ingested content (prevents embarrassing auto-posts, essential for trust)
- Multi-mode constellation ("Life" / "Work" / "Ideas" filters with different edge weights and narration tones)

**Defer (v2+):**
- Live AI narrator (LLM-based dynamic storytelling)—scripted narrator with event logic first, LLM deferred until system proves itself
- Additional platform parsers (Suno, Facebook, X, LinkedIn, Google Photos)—Instagram + Carbonmade prove pipeline first
- Advanced privacy tiers (friends, redacted, private)—public tier proves curation workflow before adding complexity
- Audio-reactive rendering (music visualizer pulsing to Web Audio API analyzer)—polish after core experience validated

### Architecture Approach

The architecture integrates five subsystems into the existing site: (1) build-time data pipeline (Node.js scripts that parse exports, generate edges, emit static constellation.json), (2) R3F constellation scene (InstancedMesh rendering, Zustand state management, camera animations), (3) narrator engine (event-driven state machine with 5-tier priority queue), (4) admin dashboard (protected by Auth.js, Vercel Functions for mutations), and (5) scheduled ingest (nightly cron + on-demand pulls). The critical pattern is "build-time truth, runtime cinema"—data processing happens at build with validated static output, runtime loads JSON and renders performant 3D scene.

**Major components:**
1. **Build Pipeline (scripts/build-data/)**: Parse Instagram/Carbonmade exports → normalize to canonical schema → enrich with signals → generate evidence-based edges → apply double-helix layout → emit constellation.json to public/data/. Runs during `vite build`, privacy validation fails build on violations.
2. **R3F Constellation Scene**: InstancedMesh for 150+ nodes (1 draw call per node type), LineSegments for edges, troika-three-text for labels on hover/selection. Zustand stores manage camera target, focused node, filter mode—NO React state in useFrame (prevents 60 re-renders/sec). Disposal utilities in useEffect cleanup prevent GPU memory leaks.
3. **Narrator Engine**: Event-driven architecture with Zustand store. Scene emits events (hover node, click connection, scrub timeline), narrator consumes priority queue with 5 tiers. Decoupled design—narrator knows nothing about scene structure, scene doesn't control narration timing.
4. **Admin Dashboard**: Owner-only auth via Auth.js v5 JWT sessions (stateless, no database), Vercel Edge Functions for fast routes, draft inbox stored in Vercel Blob. Publish/hide/highlight nodes, edit narration text, manage allowlists, trigger on-demand API pulls.
5. **Scheduled Ingest**: Vercel Cron (nightly 2am UTC) fetches Suno tracks, stores in draft inbox. Admin reviews before publishing. Triggering rebuild via Vercel API deploys updated constellation.json.

**Key patterns:**
- **Instanced rendering**: Single InstancedMesh for all nodes of same type, reduces 150 meshes to 11 draw calls (one per node type)
- **Build-time validation**: Zod schemas validate data structure, custom privacy checks fail build if GPS >2 decimals, minors without allowlist, or private data in public output
- **Zustand for R3F state**: Camera target, focused node, mode filters live in Zustand—read via selectors, mutate outside React render to prevent performance-killing re-renders
- **Hybrid ingest**: Export-based (Instagram 276 files), API-based (Suno scheduled), on-demand (admin "Pull Now")—each mode serves different data freshness and platform API availability needs

### Critical Pitfalls

Research identified ten critical pitfalls with high impact if not addressed early. The top five that threaten project success are GPU memory leaks (requires disposal utilities from day one or refactoring becomes massive), React state mutations in useFrame (architecture decision that's expensive to reverse), privacy leaks from EXIF/GPS data (legal and ethical risk), Instagram export format changes (requires defensive parsing with fallbacks), and scope creep preventing launch (personal projects have no external deadline pressure).

1. **GPU memory leaks from improper Three.js disposal** — Call dispose() on geometry, material, and ALL textures before removing from scene. For GLTF ImageBitmap textures, also call `texture.source.data.close?.()`. Monitor `renderer.info.memory` in development—if geometries/textures count grows unbounded, you have a leak. Mobile devices crash after 30-60 seconds without proper disposal. **Address in Phase 1 (Constellation MVP)** before building dynamic node loading.

2. **React state mutations in useFrame destroying performance** — Never use setState inside useFrame (60fps loop). Use useRef for values changing per-frame (camera position, animation time), mutate refs directly. React re-renders 60 times/second consume 80%+ of frame budget, causing 15-20 FPS despite simple scenes. **Address in Phase 1 (Constellation MVP)** as architecture decision before camera controls.

3. **Privacy leaks from unredacted EXIF/GPS data** — Instagram export photos contain exact GPS coordinates (6+ decimal places = exact building corner), revealing home addresses and schools. Build-time validation MUST fail build if GPS exceeds city-level precision (2 decimals max). Strip ALL EXIF during pipeline. For minors: reject ANY GPS data, require manual allowlist. **Address in Phase 2 (Data Pipeline)** before ingesting real Instagram data.

4. **Instagram API shift breaking parsers** — Instagram ended Basic Display API in Dec 2024. Personal accounts have no API access; export-based parsing is only option. Export formats change without notice. Build parser with defensive null-safe traversal, schema validation that logs unknown fields, maintain 6-12 month fallback parsers. **Address in Phase 2 (Data Pipeline)** before handling real exports.

5. **Scope creep preventing launch** — Personal projects expand from "constellation + Instagram + Carbonmade" to "add Facebook, X, LinkedIn, Google Photos, live LLM, multiplayer, mobile app" before shipping Phase 1. Document exclusions explicitly, time-box phases (3 weeks max), ship-first mentality ("minimum that demonstrates value"). **Address in Phase 0 (Roadmap Planning)** with strict boundaries before development starts.

Additional pitfalls requiring attention:
- **Vercel serverless cold starts killing admin UX** — Use Edge Functions for auth (microsecond cold starts), JWT sessions (no DB lookup), Vercel KV caching for expensive operations. Target <500ms admin routes on cold start. **Address in Phase 3 (Admin Dashboard)**.
- **Narrator repetition causing user fatigue** — Generate pseudo-random sentence variations with same meaning, vary phrasing per context, test full tour 3-5 times to catch repetition, track recent variants to avoid reuse within 60 seconds. **Address in Phase 4 (Narrator Engine)**.
- **InstancedMesh count limits not tested until production** — Test with full 150+ node dataset from day one, set InstancedMesh count to 200 (buffer for growth), measure combined effects (globe + constellation + postprocessing together). **Address in Phase 1 (Constellation MVP)**.
- **COPPA violations from minors data** — Hard policy: NO legal names for minors, NO home/school identifiers, NO exact GPS. Allowlist-only system, build fails if minor detected without allowlist. **Address in Phase 2 (Data Pipeline)**.
- **Build-time validation that doesn't fail builds** — Privacy validation MUST exit with code 1 on violations, CI/CD blocks deployment on non-zero exit, test validator with intentional violations to verify build fails. **Address in Phase 2 (Data Pipeline)**.

## Implications for Roadmap

Based on research, the project naturally divides into seven phases with clear dependencies and risk mitigation strategies. The order addresses technical dependencies (can't build guided tour until constellation renders), validates concepts before investing in complexity (prove 3D constellation before building admin dashboard), and front-loads critical pitfall prevention (disposal utilities, privacy validation, performance budgets established in Phase 1-2).

### Phase 1: Constellation MVP (3D Rendering Foundation)
**Rationale:** Validates core concept—can users explore their life as 3D graph? Establishes performance patterns (instanced rendering, disposal utilities, Zustand state) that are expensive to retrofit later. Proves R3F integration with existing site before building dependent features.

**Delivers:** 150+ nodes rendering at 60fps desktop with InstancedMesh, basic camera controls (OrbitControls with zoom limits), hover states on nodes, detail panel on click showing node content, timeline scrubber with epoch markers, integration with existing bento hub (new "Constellation" cell linking to /constellation page).

**Addresses features:** 3D constellation rendering (table stakes), mobile responsiveness with degradation (table stakes), detail panel on click (table stakes), timeline scrubber (table stakes).

**Avoids pitfalls:** GPU memory leaks (disposal utilities from start), React state in useFrame (useRef pattern established), InstancedMesh limits (test with 200-node dataset, buffer for growth).

**Research needs:** Standard R3F patterns well-documented. **Skip research-phase**—proceed directly to implementation.

---

### Phase 2: Data Pipeline (Instagram + Carbonmade Parsers)
**Rationale:** Proves end-to-end pipeline with real data sources. Privacy enforcement MUST be built before ingesting real Instagram exports (contains EXIF, GPS, minors data). Evidence-based edge generation requires normalized schema foundation. Can't validate constellation value without real personal data.

**Delivers:** Build-time pipeline in scripts/build-data/ (parse Instagram 276-file export + Carbonmade JSON → normalize to canonical 11 node types → enrich with signals → generate evidence-based edges with weights → apply double-helix layout → emit constellation.json), privacy validation that fails build on violations (GPS >2 decimals, minors without allowlist, EXIF data present), 2D library accessibility fallback (searchable node index for screen readers), connection lines in R3F scene showing evidence-based edges.

**Addresses features:** Instagram + Carbonmade parsers (table stakes), privacy tier enforcement (table stakes), evidence-based connections (differentiator), 2D library fallback (table stakes), double-helix temporal layout (differentiator).

**Avoids pitfalls:** Privacy leaks from EXIF/GPS (strip metadata, fail build on violations), Instagram export format changes (defensive parsing, log unknowns), COPPA violations from minors (allowlist enforcement, build failure), build validation weakness (CI/CD blocks deployment on errors).

**Research needs:** Instagram export format is reverse-engineered (no official docs). **Consider research-phase** for parsing specifics if export structure is unclear. Zod validation and EXIF stripping are well-documented. **Skip research** for those.

---

### Phase 3: Interactivity & Discovery (Gamification Integration)
**Rationale:** Adds engagement layer after core rendering works. Integrates with existing GameOverlay XP system (proven pattern, localStorage-based). Validates exploration patterns before building guided tour—which nodes do users click? What connections intrigue them?

**Delivers:** Discovery tracking in localStorage (jarowe_constellation_discovered array), XP integration calling existing GameOverlay.addXp() on new node visits, path memory trail (faint glow showing visitor's journey, last 20 nodes), "Because..." meaning lens in detail panel (shows WHY connection exists via evidence signals), sound effects on hover/click using existing sounds.js patterns.

**Addresses features:** Discovery gamification with XP (differentiator), path memory trail (differentiator).

**Avoids pitfalls:** None specific to this phase—builds on established patterns.

**Research needs:** XP system already exists, localStorage patterns proven. **Skip research-phase**—implementation-only.

---

### Phase 4: Narrator Engine (Event-Driven Storytelling)
**Rationale:** Storytelling layer requires stable constellation and exploration patterns from Phase 3. Event-driven architecture allows guided tour (Phase 5) and free exploration modes to share narrator system. Scripted narration first—LLM deferred to v2+ after interaction model proves itself.

**Delivers:** Zustand narrator store (event queue, state machine, priority handling), 5-tier event system (epoch transition, node hover, connection reveal, discovery, idle), scripted narration text for each event type (3+ variants per type to avoid repetition), variation tracking (prevent same phrase within 60 seconds), NarratorUI component (text display with fade in/out), event emission from constellation scene (hover, click, timeline scrub).

**Addresses features:** 5-tier narrator system (differentiator).

**Avoids pitfalls:** Narrator repetition (variation system from start, test full experience 3-5 times).

**Research needs:** Event-driven state machines in React are well-documented. **Skip research-phase**—standard patterns.

---

### Phase 5: Guided Tour (Cinematic Introduction)
**Rationale:** Depends on narrator engine (Phase 4) and stable constellation (Phase 1). Tour validates anchor node selection and camera path system before scaling to full narrator integration. 90-second time limit prevents user fatigue—better to leave wanting more.

**Delivers:** Anchor node selection stored in Edge Config (tour_anchors: array of node IDs for key life moments), camera path system (GSAP timeline animating camera to anchors with smooth easing), guided tour component with progress indicator and skip button (ESC key + visible UI), 5 narration beats maximum (epoch intro, 3 key nodes, finale), integration with existing GSAP patterns (site uses GSAP for brand reveal animation).

**Addresses features:** Cinematic guided tour (differentiator).

**Avoids pitfalls:** Narrator repetition (variation system from Phase 4), tour fatigue (5 beats max, 90 seconds total).

**Research needs:** GSAP camera animations are well-documented in R3F community. **Skip research-phase**—proven patterns.

---

### Phase 6: Admin Dashboard (Owner Curation Tools)
**Rationale:** After constellation validates with real data (Phase 2) and storytelling works (Phase 4-5), admin tools enable ongoing curation. Requires Vercel Functions (serverless), Auth.js (owner-only access), and Edge Config (allowlists, feature flags). Manual curation proves workflow before automating with nightly cron (Phase 7).

**Delivers:** Auth.js v5 setup with JWT sessions (GitHub OAuth for owner login, stateless sessions without database), protected /admin route (middleware checks session, 401 if not owner), admin UI components (DraftInbox for reviewing new content, NodeEditor for publish/hide/highlight, NarrationEditor for scripted text changes), Vercel Edge Functions for fast auth routes (sub-100ms cold starts), Vercel Blob storage for published node metadata (constellation.json updates), allowlist management UI for people/places.

**Addresses features:** Admin dashboard with draft inbox (differentiator), privacy-first with curation layer (differentiator).

**Avoids pitfalls:** Vercel serverless cold starts (Edge Functions for auth, JWT sessions, no database lookups).

**Research needs:** Auth.js v5 manual setup (non-Next.js) needs research—official docs focus on Next.js adapter. **Consider research-phase** for Vite + React Router integration specifics. Vercel Edge Functions are well-documented. **Skip research** for those.

---

### Phase 7: Scheduled Ingest (Living Site Automation)
**Rationale:** Final phase enables "living site" vision—nightly updates without manual intervention. Requires stable pipeline (Phase 2), admin dashboard (Phase 6), and proven curation workflow. Suno API integration proves scheduled pattern before scaling to additional platforms (v2+).

**Delivers:** Vercel Cron job configuration in vercel.json (nightly 2am UTC, CRON_SECRET authentication), api/cron/nightly-ingest.js serverless function (fetch Suno tracks via API, parse to canonical schema, store in draft inbox), api/ingest/suno.js for on-demand admin pulls, Suno parser in scripts/build-data/parse/suno.js (normalize track data to node schema), Vercel API deployment hook (trigger rebuild after admin publishes from draft inbox), admin "Pull Now" button for manual triggers.

**Addresses features:** Real-time data auto-ingest (differentiator), draft inbox for auto-ingested content (differentiator).

**Avoids pitfalls:** Scope creep (Suno only—additional platforms deferred to v2+).

**Research needs:** Suno API documentation (unofficial, community-reverse-engineered). **Research-phase recommended** for API endpoints, authentication, rate limits, response schemas.

---

### Phase Ordering Rationale

This sequence addresses three critical concerns that emerged from research:

**Dependency management:** Phases build incrementally—can't tour (Phase 5) without narrator (Phase 4), can't narrate without scene (Phase 1), can't populate scene without data (Phase 2). Admin dashboard (Phase 6) requires proven pipeline (Phase 2) and storytelling (Phase 4-5) to know what curation tools are needed. Scheduled ingest (Phase 7) requires admin workflow (Phase 6) to manage incoming data.

**Risk front-loading:** Phases 1-2 address the three critical pitfalls that threaten project success: GPU memory leaks and React performance (Phase 1 disposal utilities and useRef patterns), privacy leaks (Phase 2 EXIF stripping and build validation), and scope creep (strict phase boundaries prevent "just one more feature" syndrome). These architectural decisions are expensive to retrofit—establishing them early prevents costly rework.

**Validation before investment:** Each phase validates an assumption before building dependent features. Phase 1 validates "can 3D constellation be performant?" before investing in narrator/tour (Phases 4-5). Phase 2 validates "can pipeline handle real messy data?" before building admin tools (Phase 6). Phases 4-5 validate "does storytelling engage users?" before automating ingestion (Phase 7). This de-risks the project by proving core value propositions incrementally.

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 2 (Data Pipeline):** Instagram export format is undocumented, reverse-engineered from current exports. Field paths and structure may vary. Research actual export structure before building parser to avoid hardcoded assumptions.
- **Phase 6 (Admin Dashboard):** Auth.js v5 with Vite + React Router (non-Next.js setup) has sparse documentation. Official guides focus on Next.js adapter. Research manual setup patterns, custom route handling, JWT configuration for Vercel Functions.
- **Phase 7 (Scheduled Ingest):** Suno API is unofficial, community-reverse-engineered. Research current API endpoints, authentication requirements, rate limits, response schemas before implementing parser and cron job.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Constellation MVP):** R3F instanced rendering, Zustand state management, OrbitControls are extensively documented with official guides and community examples. Existing JAROWE site uses R3F (globe), patterns proven.
- **Phase 3 (Interactivity & Discovery):** localStorage patterns, XP integration with existing GameOverlay, sound effects using existing sounds.js—all proven patterns in current codebase.
- **Phase 4 (Narrator Engine):** Event-driven state machines in React, Zustand stores, priority queues are well-documented. Multiple articles and examples available.
- **Phase 5 (Guided Tour):** GSAP camera animations in R3F have established patterns. Existing site uses GSAP for brand reveal. Community examples abundant.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Vercel official documentation extensive, R3F/drei/troika well-documented with 2026 guides, Zod widely adopted with clear examples. Only Auth.js v5 non-Next.js setup has sparse docs (MEDIUM confidence). |
| Features | MEDIUM-HIGH | Interactive portfolio and 3D data viz best practices well-researched (Awwwards, Codrops, Neo4j). Privacy trends backed by regulatory analysis. Some feature prioritization based on inference from competitive analysis. |
| Architecture | HIGH | R3F performance patterns verified in official docs and community guides, Vercel serverless architecture documented extensively, build-time pipeline approach proven in VitePress and similar tools. Hybrid ingest pattern synthesized from multiple sources (MEDIUM confidence). |
| Pitfalls | HIGH | GPU memory leaks, React state performance, privacy risks, COPPA requirements backed by official sources and technical forums. Instagram API deprecation verified via platform announcements. Scope creep patterns from project management literature. |

**Overall confidence:** HIGH

### Gaps to Address

**Instagram export format variations:** Research identified that Instagram exports are not versioned or documented officially. Current parser will be built against one export snapshot (276 files from user's account). Future exports may have different field names, nesting structures, or file organization. **Mitigation:** Defensive parsing with null-safe traversal, schema validation logging unknown fields, manual review of any new export before rebuilding parser.

**Auth.js v5 non-Next.js integration:** Official documentation heavily favors Next.js adapter. Manual setup for Vite + React Router + Vercel Functions requires synthesizing examples from GitHub issues and community blog posts. **Mitigation:** Phase 6 should include research-phase for Auth.js setup patterns, potentially prototype minimal auth before building full admin UI.

**Suno API stability:** Unofficial, reverse-engineered API with no stability guarantees. Endpoints, authentication, or response schemas may change without notice. **Mitigation:** Phase 7 research-phase must document current API state, implement defensive parsing similar to Instagram export handling, plan for graceful degradation if API breaks.

**Mobile performance with full effects stack:** Research provided individual optimization techniques (LOD, instancing, reduced effects) but combined performance under full load (globe + constellation + postprocessing + audio visualizer) not verified. **Mitigation:** Phase 1 must test on mid-range mobile device with all existing effects enabled, establish mobile feature flags before adding constellation rendering.

**Multi-mode constellation implementation complexity:** "Life" / "Work" / "Ideas" mode filtering with different edge weights and narration tones is conceptually clear but implementation details (how to tag nodes for modes, how to weight edges differently, how to vary narration tone) not fully specified. **Mitigation:** Defer multi-mode to v2+, validate single-mode constellation first, gather user feedback on what modes would be valuable.

## Sources

### Primary (HIGH confidence)
- [Vercel Functions, Cron, Blob, Edge Config official docs](https://vercel.com/docs) — Infrastructure patterns, API references, serverless execution limits
- [React Three Fiber performance guide](https://r3f.docs.pmnd.rs/advanced/scaling-performance) — Instanced rendering, LOD, disposal patterns, frame loop optimization
- [Zod documentation](https://zod.dev/) — Schema validation, TypeScript inference, error handling
- [Auth.js v5 deployment guide](https://authjs.dev/getting-started/deployment) — JWT sessions, OAuth providers, Vercel integration
- [troika-three-text documentation](https://protectwise.github.io/troika/troika-three-text/) — SDF rendering, web worker usage, Three.js material compatibility
- [COPPA 2025 FTC revisions](https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa) — Biometric data definitions, parental consent requirements, compliance deadline April 22, 2026
- [WCAG 3.0 W3C working draft](https://www.w3.org/WAI/standards-guidelines/wcag/wcag3-intro/) — Immersive tech accessibility, text alternative requirements

### Secondary (MEDIUM confidence)
- [Awwwards portfolio best practices 2026](https://www.awwwards.com/websites/portfolio/) — WebGL effects, micro-interactions, performance optimization, CMS patterns from award-winning sites
- [Utsubo 100 Three.js performance tips](https://www.utsubo.com/blog/threejs-best-practices-100-tips) — Memory management, instancing, LOD, mobile optimization from 2026 guide
- [Codrops efficient Three.js scenes](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/) — Combined performance strategies, draw call reduction, 60fps targets
- [Epic.org social media privacy analysis](https://epic.org/issues/consumer-privacy/social-media-privacy/) — Platform data practices, export vs. API metadata differences, regulatory trends
- [Instagram API deprecation timeline](https://developers.facebook.com/docs/instagram-basic-display-api) — Basic Display API sunset December 2024, Graph API restrictions to business accounts
- [Neo4j 3D graph visualization guide](https://neo4j.com/blog/developer/visualizing-graphs-in-3d-with-webgl/) — Force-directed layouts, interactivity patterns, performance at scale
- [Dear Data project](http://www.dear-data.com/theproject) — Data autobiography patterns, visual metaphor design, analog to digital translation

### Tertiary (LOW confidence, needs validation)
- [Vercel Postgres serverless challenges](https://kuberns.com/blogs/post/vercel-app-guide/) — Cold start issues, connection pooling limitations (third-party blog, not official Vercel docs)
- [Instagram export parsing examples](https://github.com/michabirklbauer/instagram_json_viewer) — Community parser for Instagram exports, format may differ from 2026 exports
- Suno API unofficial docs (community-reverse-engineered, not verified) — No official API, endpoints reverse-engineered by community, stability not guaranteed

---
*Research completed: 2026-02-27*
*Ready for roadmap: yes*
