# Pitfalls Research

**Domain:** Data-driven 3D personal websites with social media pipelines and privacy requirements
**Researched:** 2026-02-27
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: GPU Memory Leaks from Improper Three.js Disposal

**What goes wrong:**
WebGL resources (geometries, materials, textures) accumulate in GPU memory until the browser crashes or performance degrades to single-digit FPS. Scene.clear() removes objects from the scene graph but doesn't free GPU memory. With 150+ constellation nodes that load/unload dynamically, memory grows unbounded.

**Why it happens:**
Three.js doesn't garbage collect GPU resources automatically—developers assume removing objects from the scene is sufficient. React's component lifecycle makes this worse: when components unmount, developers forget to dispose Three.js resources. For GLTF textures loaded as ImageBitmap, even calling texture.dispose() isn't enough.

**How to avoid:**
- Call dispose() on geometry, material, and ALL textures before removing objects from scene
- For GLTF ImageBitmap textures, also call `texture.source.data.close?.()`
- Monitor `renderer.info.memory` in development: if geometries/textures count keeps growing, you have a leak
- Create a cleanup utility that recursively disposes all resources in a scene subtree
- Use React useEffect cleanup functions to dispose Three.js resources on unmount

**Warning signs:**
- FPS degrading over time during navigation
- renderer.info.memory.geometries or .textures growing without plateau
- Browser DevTools showing WebGL context warnings
- Mobile devices crashing after 30-60 seconds of interaction

**Phase to address:**
Phase 1 (Constellation MVP) — implement disposal utilities BEFORE building dynamic node loading, or refactoring becomes massive

---

### Pitfall 2: React State Mutations in useFrame Destroying Performance

**What goes wrong:**
Mutating React state inside useFrame (60fps animation loop) triggers 60 re-renders per second, causing React reconciliation overhead to consume 80%+ of frame budget. Constellation camera movement, node animations, and shader uniforms become choppy at 15-20 FPS despite simple scenes.

**Why it happens:**
Developers coming from traditional React patterns try to use setState for everything. The critical rule: Three.js mutations should happen in useFrame via direct object mutation, NOT React state. Anything changing at 60fps—camera position, animation progress, shader uniforms—cannot live in React state.

**How to avoid:**
- Use useRef for any value that changes every frame (camera position, animation time, particle velocities)
- Mutate refs directly in useFrame: `cameraRef.current.position.x += delta`
- Only trigger React re-renders on discrete user actions (click node, change filter mode)
- Use delta time (`(state, delta) => ...`) for frame-rate independent animations
- Never create new objects inside useFrame (new Vector3, new Color)—reuse with useMemo

**Warning signs:**
- FPS drops to 20-30 despite simple geometry
- React DevTools Profiler showing constant re-renders during idle
- useFrame callback taking >8ms in Chrome Performance tab
- Janky camera movement despite smooth user input

**Phase to address:**
Phase 1 (Constellation MVP) — architecture decision before implementing camera controls and node animations

---

### Pitfall 3: Privacy Leaks from Unredacted EXIF/GPS Data

**What goes wrong:**
Instagram export photos contain exact GPS coordinates (latitude/longitude to 6+ decimal places), revealing home addresses, schools attended by minors, and daily routines. A celebrity influencer's vacation photos led stalkers directly to their rental property within hours. Insurance burglary reports show 78% of burglars now use social media reconnaissance.

**Why it happens:**
Social media platforms strip EXIF on upload, but export data contains ORIGINAL files with full metadata. Developers assume "if Instagram showed it, it's safe to re-publish." GPS precision is deceptive: 6 decimal places = exact building corner. Minors' location data is especially sensitive—school locations, home addresses, after-school activity venues.

**How to avoid:**
- Build-time validation script that FAILS the build if GPS data exceeds city-level precision (2 decimal places max)
- Strip ALL EXIF data from images during pipeline processing
- For minors: reject ANY content with GPS data, require manual curation allowlist
- Implement visibility tiers: public (city-level only), friends (neighborhood), private (exact)
- Use automated tools like ExifTool in CI/CD to scan for metadata before deployment
- Document GPS redaction policy explicitly: "Public: city-level max, Exact coords: friends-only override required"

**Warning signs:**
- Build outputs contain image files with EXIF data intact
- GPS coordinates in constellation nodes show >2 decimal places
- No validation errors when test content includes school location data
- Allowlist system missing for people/places that appear in photos

**Phase to address:**
Phase 2 (Data Pipeline) — privacy enforcement MUST be built into pipeline before ingesting real Instagram data, or data leak is guaranteed

---

### Pitfall 4: Instagram API Shift Breaking Personal Account Parsers

**What goes wrong:**
Instagram fully ended the Basic Display API in December 2024. In 2026, all integrations must use Instagram Graph and Messaging APIs, which ONLY support business and creator accounts. Personal account data is no longer accessible via public APIs. Export-based parsers become the only option, but export formats change without notice.

**Why it happens:**
Platform deprecations are announced but poorly documented. Developers build against old API assuming it's stable. Export formats are not versioned or documented—Instagram's data export structure is reverse-engineered from current exports, but fields can change, disappear, or relocate between JSON files without warning.

**How to avoid:**
- Build parser with defensive error handling: missing fields don't crash, they log warnings
- Schema validation layer that reports unknown fields (signals format change)
- Version detection: parse export metadata to identify format version if available
- Maintain fallback parsers for old export formats (6-12 month retention window)
- Export format changes MUST NOT crash pipeline—degrade gracefully, flag for review
- Build admin dashboard "data quality" view showing missing/malformed fields per source

**Warning signs:**
- Parser crashes on new Instagram export when format changes
- Silent data loss (fields ignored without warning)
- No monitoring for export format version changes
- Hardcoded field paths without null-safe traversal

**Phase to address:**
Phase 2 (Data Pipeline) — resilient parsing architecture before handling real exports, or every Instagram update breaks the site

---

### Pitfall 5: Vercel Serverless Cold Starts Killing Admin UX

**What goes wrong:**
Admin dashboard serverless functions connecting to databases experience 800ms-2.5 second cold starts. Every page load after inactivity requires re-authentication, re-establishing DB connections, re-initializing parsers. Admin workflow becomes: click button → wait 2 seconds → timeout → retry. Curation becomes frustrating.

**Why it happens:**
Serverless functions can't share database connections between invocations during cold boots. Each cold start requires new DB connection handshake. Admin dashboards are used intermittently (not constant traffic), so almost every request is cold. Traditional auth patterns (session lookups) add extra database round-trips.

**How to avoid:**
- Use Vercel Edge Functions for auth/routing (microsecond cold starts vs. serverless 800ms+)
- JWT-based stateless sessions (no DB lookup per request)
- Database connection pooling with PgBouncer or serverless-friendly DB (Vercel Postgres, Neon)
- Cache expensive operations in Vercel KV (Redis): parsed export schemas, node counts, last sync times
- Implement optimistic UI updates: button → immediate feedback → background serverless call
- For admin-only features, consider Edge Functions + Vercel KV instead of serverless + traditional DB

**Warning signs:**
- Admin dashboard feels sluggish on first click after inactivity
- Vercel logs show "cold start" frequently for admin routes
- Database connection pool exhaustion errors
- Auth middleware taking >500ms per request

**Phase to address:**
Phase 3 (Admin Dashboard) — architecture decision before building curation UI, or UX becomes unusable

---

### Pitfall 6: Narrator Repetition Causing User Fatigue

**What goes wrong:**
Scripted narrator reuses the same phrases ("fascinating connection", "notice how") within 90-second tour. Users report "robotic" feeling. With 15 scenes and 10-minute scroll, visitors abandon halfway. The narrator becomes background noise instead of engagement driver.

**Why it happens:**
Developers write a few narration templates, then reuse them across all scenarios. Lack of variation testing—narrator sounds fine for 30 seconds in development, but repetition emerges over 2+ minutes. Event-driven narration (epoch, node, connection, discovery, idle) triggers the same tier repeatedly if not carefully managed.

**How to avoid:**
- Generate pseudo-random combinations of sentences with the same meaning using simple templating
- Vary phrasing and tone per context: epoch transition vs. node hover vs. connection reveal
- Maximum 5 narration beats for guided tour (better to leave wanting more than lose to fatigue)
- Silence is golden: narrator should pause between beats, not constantly talk
- Test full tour 3-5 times in a row to catch repetition patterns
- Track which narration variants played recently, avoid re-using within 60 second window
- Skip button prominently displayed—if users click skip, track which beats drove them away

**Warning signs:**
- Same phrases appear within 30 seconds of each other
- Tour completion rate <40% (abandonment before end)
- User feedback mentions "repetitive" or "robotic"
- No variation tracking—each event type has single narration string

**Phase to address:**
Phase 4 (Narrator Engine) — variation system built from start, or rewriting all narration text later becomes massive effort

---

### Pitfall 7: Scope Creep Preventing Launch

**What goes wrong:**
Personal portfolio starts with "constellation + Instagram + Carbonmade" but expands to "add Facebook, add X, add LinkedIn, add Google Photos, add live LLM narrator, add multiplayer, add mobile app" before shipping Phase 1. Project becomes 18-month effort instead of 3-month MVP. Nothing ships. Excitement fades. Project stalls at 80% done forever.

**Why it happens:**
Personal projects have no external deadline, no stakeholders, no budget pressure. Every cool idea gets added to scope. "Just one more feature" syndrome. Perfectionism: "can't launch until X is perfect." Ambitious scope feels validating ("this will be amazing!") but execution discipline is harder.

**How to avoid:**
- Document exclusions explicitly with reasoning: "Facebook parser deferred until Phase 1 proves pipeline"
- Name MVP deliverables specifically: "150 nodes from Instagram + Carbonmade only"
- Time-box each phase: 3 weeks max, or break it down further
- Ship-first mentality: "What's the minimum that demonstrates the constellation value?"
- Track scope additions: every new idea goes to "Future Milestones" backlog, NOT current phase
- Define success as "shipped and learning" not "perfect and still building"
- Use phased rollout: launch with limited data, add sources incrementally

**Warning signs:**
- Roadmap keeps expanding, phases keep growing
- "Almost done" for 3+ weeks
- New ideas added to current phase instead of future phases
- No shipped demos/previews after 4+ weeks of work
- Talking about features instead of building features

**Phase to address:**
Phase 0 (Roadmap Planning) — strict phase boundaries and exclusions list BEFORE starting development

---

### Pitfall 8: Instanced Mesh Count Limits Not Tested Until Production

**What goes wrong:**
Constellation renders beautifully with 50 test nodes, ships to production with 150 real nodes, and FPS drops to 12 on mid-range laptops. InstancedMesh needs predefined maximum count—changing it later requires full rewrite. Effects stack (bloom, chromatic aberration, depth of field) work great with 50 nodes but crush performance with 150+.

**Why it happens:**
Developers test with small datasets (faster iteration). Performance seems fine, so they assume it scales. InstancedMesh initialization with wrong count (too low = can't show all nodes, too high = wasted GPU memory). Postprocessing effects are measured individually, not combined under full load.

**How to avoid:**
- Test with FULL expected dataset size from day 1: 150+ nodes minimum
- InstancedMesh count = 200 (buffer for growth), not exact current count
- Performance budget: 60 FPS desktop, 30 FPS mobile at full node count
- Measure combined effects: globe + constellation + postprocessing + audio visualizer together
- Device testing matrix: high-end desktop, mid-range laptop, modern mobile, older mobile
- Implement LOD (Level of Detail): fewer particles/effects on mobile
- Feature flags for effects: ChromaticAberration off by default on mobile

**Warning signs:**
- Only testing with <50 nodes during development
- No performance metrics tracked per commit
- Effects tested individually, never together
- InstancedMesh count hardcoded to current data size
- No mobile testing until "later"

**Phase to address:**
Phase 1 (Constellation MVP) — full-scale performance testing BEFORE adding effects, or optimization becomes archaeology

---

### Pitfall 9: COPPA Violations from Minors Data

**What goes wrong:**
Instagram export contains posts with minors (family, friends' kids, school events). Constellation publishes full names, faces, exact locations, ages, and school identifiers without parental consent. FTC revised COPPA in 2025 (compliance deadline April 22, 2026) expands "personal information" to include biometric identifiers (facial data, voice data). Sites violating COPPA face $51,744 per violation.

**Why it happens:**
Developer assumes "Instagram showed it, so it's public." Minors data requires explicit parental consent for collection, use, and display. Social media platforms comply via their own Terms of Service; personal sites re-publishing that data do NOT inherit that compliance. Facial recognition in photos counts as biometric data under 2026 COPPA rules.

**How to avoid:**
- Hard policy: NO legal names for minors, NO home/school identifiers, NO exact GPS/EXIF, NO faces without manual review
- Allowlist-only system: minors MUST be on explicit allowlist before appearing publicly
- Build-time validation fails if minor detected without allowlist entry
- Redaction UI: blur faces, replace names with "Friend" / "Family", remove location metadata
- Age verification for people in constellation: if age unknown or under 18, assume minor
- Annual policy review: COPPA rules evolve, site must adapt
- Visibility tiers: minors' content defaults to "private" unless manually published

**Warning signs:**
- No age field in person schema
- No allowlist enforcement for minors
- Automated publishing without manual review for people
- Face detection/tagging without consent workflow
- GPS data not stripped from photos with minors

**Phase to address:**
Phase 2 (Data Pipeline) — minors protection MUST be built into schema and validation, or site violates COPPA day 1

---

### Pitfall 10: Build-Time Validation That Doesn't Actually Fail Builds

**What goes wrong:**
Privacy validation script logs warnings about GPS leaks, minor names, and private data in public output, but build continues and deploys successfully. Developers ignore warnings. Production site leaks private data. Post-hoc cleanup is embarrassing and legally risky.

**Why it happens:**
Validation scripts implemented as "nice to have" logging, not strict gatekeeping. CI/CD doesn't enforce exit codes. Developers become blind to warnings ("that's always there"). No cultural norm of "warnings = blockers for privacy."

**How to avoid:**
- Privacy validation MUST fail build with exit code 1 on ANY violation
- CI/CD configured to block deployment on validation failure
- Make validation failures loud: GitHub Actions annotations, Slack alerts, email to owner
- Categories: ERRORS (block build), WARNINGS (manual review required), INFO (logged only)
- Privacy violations = ERROR tier, never WARNINGS
- Test the validator: intentionally add violation to test data, verify build fails
- Document validation rules in .planning/PRIVACY_POLICY.md

**Warning signs:**
- Validation script logs issues but build succeeds
- No CI/CD integration for validation
- Developers can deploy despite validation failures
- No test suite for validation rules themselves
- Privacy policy documented separately from enforcement code

**Phase to address:**
Phase 2 (Data Pipeline) — strict validation as CI/CD gate BEFORE ingesting real data

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skipping disposal utilities for R3F components | Faster development, fewer files | Guaranteed GPU memory leaks, expensive refactoring across all 3D components | Never—disposal utilities are 1 hour upfront, 20+ hours to retrofit later |
| Using React state in useFrame for animations | Feels like normal React patterns | 60 re-renders/sec, 15 FPS performance, full architecture rewrite needed | Never—useRef is just as easy, teaches correct R3F mental model |
| Hardcoded Instagram export field paths | Faster parsing, simple code | Breaks silently when Instagram changes export format, no error reporting | Only if defensive null-safe traversal + logging is included |
| JWT auth without database session tracking | No DB round-trips, faster cold starts | Can't revoke admin tokens, compromised tokens valid until expiry | Acceptable for single-owner admin dashboard (low risk, high performance gain) |
| Same narration text for all event types | Faster content creation, ships sooner | Repetitive UX, low tour completion rate, expensive to rewrite later | MVP only—plan variation system for Phase 2, defer complex templating |
| Manual privacy review without automated validation | More control, no tooling overhead | Human error guaranteed, scales poorly, no deployment safety net | Never—automated validation is required baseline, manual review is additional layer |
| Generic "Node" type instead of 11 distinct node types | Simpler schema, less code | Loses semantic meaning, harder to build filters/modes, migration later is massive | Never—typed schema is foundation for constellation, shortcuts here cascade everywhere |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Instagram Data Export | Assuming export format is stable and versioned | Defensive parsing with null-safe traversal, schema validation logging unknown fields, maintain 6-month fallback parsers |
| Vercel Serverless + Database | Opening new DB connection per invocation | Use connection pooling (PgBouncer) OR serverless-friendly DB (Vercel Postgres, Neon) OR Edge Functions + KV for admin routes |
| Three.js GLTF Loader | Calling texture.dispose() only | ALSO call texture.source.data.close?.() for ImageBitmap textures from GLTF |
| Social Media API Rate Limits | Hitting rate limit = crash pipeline | Exponential backoff retry, queue system for batch requests, respect rate limit headers proactively |
| EXIF/GPS Data | Trusting platform redaction (Instagram strips EXIF on upload) | Platform export data contains ORIGINAL files with full metadata—must strip EXIF yourself in pipeline |
| Vercel KV (Redis) | Using as primary database for structured data | KV is cache layer—use for sessions, parsed schemas, counters—NOT source of truth for constellation nodes |
| Build-Time Validation | Logging warnings to console | Fail build with exit code 1, block CI/CD deployment, make violations impossible to ignore |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Creating objects in useFrame (new Vector3, new Color) | FPS degrades over time, GC pauses | Reuse objects with useMemo outside useFrame | Breaks at 30+ FPS drops after 60 seconds |
| No InstancedMesh for repeated geometry (150 node spheres) | 150 draw calls, 20-30 FPS despite simple geometry | InstancedMesh for all repeated geometries, 1 draw call for 150 nodes | Breaks at 100+ nodes |
| Postprocessing effects without mobile detection | Desktop 60 FPS, mobile 8 FPS and crashes | Feature flags: disable ChromaticAberration, reduce bloom passes on mobile | Breaks on any mobile device |
| Loading all constellation nodes at once | Initial load takes 3-5 seconds, janky scroll | Lazy load nodes as they enter viewport, unload distant nodes | Breaks at 150+ nodes with textures |
| Force-directed layout running every frame | 100% CPU, battery drain, hot devices | Run layout simulation to convergence at build time, save positions to JSON | Breaks at 50+ nodes if live simulation |
| Serverless function fetching full dataset on every request | 2+ second response times, high costs | Cache parsed data in Vercel KV, invalidate on rebuild | Breaks at 500+ nodes |
| No renderer.info.memory monitoring | Silent memory leaks until crash | Log memory stats every 5 seconds in dev, alert if growth >20% in 60 seconds | Leaks until browser crash (5-15 minutes) |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| GPS coordinates at full precision (6+ decimal places) | Exact home/school addresses exposed, stalking risk, minors endangered | Build-time validation: public content limited to city-level (2 decimals), friends-only override for exact coords |
| Minors' faces in photos without parental consent | COPPA violation ($51,744 per violation), biometric data privacy breach | Allowlist system for minors, manual review required, face blurring option, default to private visibility |
| Private DMs or close friends lists in export data | Exposing private relationships, personal conversations, contact graphs | Schema validation: reject DM content, social graph parsing only for public interactions |
| Hardcoded API keys in serverless functions | Keys leak via source control or deployment logs | Environment variables only, Vercel Secret management, never commit keys |
| Admin dashboard without authentication | Anyone can curate/delete/publish content | Edge Functions with JWT auth, owner-only access verified per request |
| Allowing user-generated content without sanitization | XSS attacks if constellation nodes contain <script> tags | Sanitize all text fields from social media exports before storing in JSON |
| Leaking original filenames from personal photos | Filenames reveal device names, dates, context | Hash-based filenames in public output, store originals in private storage only |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Guided tour that can't be skipped | Users feel trapped, abandon site if not interested in narration | Skip button prominently displayed, tour progress indicator, "press ESC to skip" |
| No loading state during constellation initial render | Black screen for 2-3 seconds, users think site is broken | Loading animation, progressive reveal (render starfield first, then nodes), percentage indicator |
| Camera controls not explained | Users don't know they can rotate/zoom, miss interactive features | Brief tutorial overlay on first visit: "Drag to rotate, scroll to zoom, click nodes to explore" |
| Narrator speaking over user interactions | Users click node, narrator interrupts with epoch narration, jarring | Pause narrator on user interaction, resume after 3 seconds of idle |
| No 2D library fallback for accessibility | Users on slow devices or screen readers can't access content | 2D searchable node index, keyboard navigation, semantic HTML |
| Discovery XP without visible progress | Users gain XP but don't see what unlocked or why | Toast notification: "+50 XP: Discovered hidden connection", progress bar for next level |
| Timeline scrubber without epoch labels | Users don't know what year/era they're viewing | Epoch labels on timeline, year range indicator, "Jump to 2020" shortcuts |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **R3F 3D Scene:** Often missing disposal utilities—verify useEffect cleanup calls dispose() on geometries, materials, textures, and texture.source.data.close?.() for GLTF ImageBitmaps
- [ ] **Animation System:** Often missing delta time usage—verify all animations use delta parameter, not hardcoded increments (breaks on slow devices)
- [ ] **Data Pipeline:** Often missing schema validation—verify unknown fields are logged, missing required fields fail build, not silent ignoring
- [ ] **Privacy Enforcement:** Often missing build failure on violations—verify validation script exits with code 1, CI/CD blocks deployment, not just warnings
- [ ] **Instagram Parser:** Often missing null-safe traversal—verify every field access uses optional chaining (?.), handles missing data gracefully
- [ ] **Admin Dashboard:** Often missing cold start optimization—verify JWT auth (not session DB lookups), KV caching for expensive operations, Edge Functions for fast routes
- [ ] **Narrator Engine:** Often missing variation system—verify narration templates have 3+ variants per event type, variation tracking prevents repetition
- [ ] **Minors Protection:** Often missing allowlist enforcement—verify build fails if minor detected without allowlist entry, face detection requires consent
- [ ] **Mobile Performance:** Often missing feature flags—verify ChromaticAberration, complex bloom, and heavy effects are disabled on mobile devices
- [ ] **Constellation Nodes:** Often missing InstancedMesh—verify repeated geometries use InstancedMesh (1 draw call) not individual meshes (150 draw calls)

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| GPU memory leak discovered in production | MEDIUM | 1. Add renderer.info.memory monitoring to detect leak source 2. Implement disposal utility for leaked component 3. Audit all R3F components for similar pattern 4. Deploy fix + monitor memory over 24 hours |
| React state in useFrame killing performance | HIGH | 1. Identify all useState calls in 3D components 2. Convert to useRef for values changing per-frame 3. Refactor useFrame to mutate refs directly 4. Test full app for state-dependent features that broke |
| Privacy leak (GPS/minors data published) | CRITICAL | 1. Immediate: take site offline or redact leaked content 2. Notify affected individuals if identifiable 3. Implement automated validation that blocks builds 4. Audit all published content manually 5. Document incident + prevention in .planning/POSTMORTEM.md |
| Instagram export format change breaks parser | LOW | 1. Parser logs unknown fields (not crash) 2. Investigate new export format structure 3. Update parser with new field paths 4. Test with both old and new export formats 5. Deploy updated parser |
| Vercel serverless cold starts >2 seconds | MEDIUM | 1. Migrate auth to Edge Functions (JWT-based) 2. Add Vercel KV caching for parsed data 3. Use serverless-friendly database (Neon/Vercel Postgres) 4. Measure cold start improvement, target <500ms |
| Narrator repetition causing tour abandonment | MEDIUM | 1. Add variation tracking (last N narrations played) 2. Write 2 additional variants for each event type 3. Implement pseudo-random selection avoiding recent variants 4. A/B test tour completion rate |
| Scope creep delaying launch by 3+ months | HIGH | 1. Audit current roadmap against original MVP scope 2. Move all non-essential features to "Future Milestones" 3. Define new MVP: what's shippable in 2 weeks? 4. Time-box remaining work, cut anything beyond 2 weeks 5. Ship MVP, gather feedback before continuing |
| InstancedMesh count too low for new nodes | LOW | 1. Update InstancedMesh count to 200 (buffer for growth) 2. Re-initialize instanced geometries with new count 3. Test full dataset renders correctly 4. Document max count in code comments |
| COPPA violation from minors data | CRITICAL | 1. Immediate: remove all minors content from public site 2. Implement allowlist system with manual review 3. Add age field to person schema 4. Build-time validation for minors without allowlist 5. Legal review of privacy policy + COPPA compliance |
| Build validation not failing on privacy violations | MEDIUM | 1. Update validation script to exit with code 1 on errors 2. Configure CI/CD to block deployment on non-zero exit code 3. Test: add intentional violation, verify build fails 4. Document validation rules in .planning/PRIVACY_POLICY.md |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| GPU memory leaks | Phase 1: Constellation MVP | renderer.info.memory stays flat over 5 minutes of interaction, dispose utilities in useEffect cleanup |
| React state in useFrame | Phase 1: Constellation MVP | FPS stays 60+ with 150 nodes, no useState in components with useFrame |
| Privacy leaks (GPS/EXIF) | Phase 2: Data Pipeline | Build-time validation passes, no GPS coordinates >2 decimals in public output |
| Instagram API/export changes | Phase 2: Data Pipeline | Parser handles test exports with missing fields, logs unknowns, doesn't crash |
| Vercel cold starts | Phase 3: Admin Dashboard | Admin routes respond <500ms on cold start, JWT auth + KV caching implemented |
| Narrator repetition | Phase 4: Narrator Engine | Same phrase doesn't repeat within 60 seconds, 3+ variants per event type |
| Scope creep | Phase 0: Roadmap Planning | Explicit exclusions list, MVP defined with 2-week time-box |
| InstancedMesh limits | Phase 1: Constellation MVP | Testing with 200-node dataset, InstancedMesh count = 200 (buffered) |
| COPPA violations | Phase 2: Data Pipeline | Allowlist enforcement, build fails if minor without allowlist entry |
| Build validation weakness | Phase 2: Data Pipeline | CI/CD blocks deployment on validation error, tested with intentional violations |

## Sources

### R3F Performance and Memory Management
- [Scaling performance - React Three Fiber](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- [100 Three.js Tips That Actually Improve Performance (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- [The reason for the very low performance of R3F with instances - GitHub Issue #3306](https://github.com/pmndrs/react-three-fiber/issues/3306)
- [Roger Chi | Tips on preventing memory leak in Three.js scene](https://roger-chi.vercel.app/blog/tips-on-preventing-memory-leak-in-threejs-scene)
- [Performance pitfalls - React Three Fiber](https://r3f.docs.pmnd.rs/advanced/pitfalls)
- [About the memory leak when dispose the texture - three.js forum](https://discourse.threejs.org/t/about-the-memory-leak-when-dispose-the-texture/2543)

### Instagram API and Data Export
- [Instagram Graph API: Complete Developer Guide for 2026](https://elfsight.com/blog/instagram-graph-api-complete-developer-guide-for-2026/)
- [Instagram API Deprecated? Here's What to Do in 2026](https://sociavault.com/blog/instagram-api-deprecated-alternative-2026)
- [After Basic Display EOL: How Instagram's 2026 API Rules Reshape Scheduling](https://storrito.com/resources/Instagram-API-2026/)

### Privacy and EXIF/GPS Data
- [EXIF data in shared photos may compromise your privacy | Proton](https://proton.me/blog/exif-data)
- [How a Photo's Hidden 'Exif' Data Exposes Your Personal Information | Consumer Reports](https://www.consumerreports.org/electronics-computers/privacy/what-can-you-tell-from-photo-exif-data-a2386546443/)
- [Do Social Media Platforms Strip EXIF Metadata? (2026) - PrivacyStrip Blog](https://privacystrip.com/blog/social-media-metadata-policies/)
- [Social Media & EXIF Data: Protect Your Photo Privacy - EXIFData.org](https://exifdata.org/blog/social-media-exif-data-protect-your-photo-privacy)

### Vercel Serverless Cold Starts
- [How can I improve function cold start performance on Vercel?](https://vercel.com/kb/guide/how-can-i-improve-serverless-function-lambda-cold-start-performance-on-vercel)
- [Experiencing long lambda cold start delays of 2 - 3 seconds on Vercel - Discussion #7961](https://github.com/vercel/vercel/discussions/7961)
- [Application Authentication on Vercel](https://vercel.com/kb/guide/application-authentication-on-vercel)

### WebGL Memory and Performance
- [Comparing Canvas vs. WebGL for JavaScript Chart Performance](https://digitaladblog.com/2025/05/21/comparing-canvas-vs-webgl-for-javascript-chart-performance/)
- [WebGL Memory Leak - Khronos Forums](https://community.khronos.org/t/webgl-memory-leak/3124)
- [WebGL memory management puzzlers - three.js forum](https://discourse.threejs.org/t/webgl-memory-management-puzzlers/24583)

### Scope Creep and Portfolio Mistakes
- [What Is Scope Creep? Meaning, Real Examples & How Agencies Avoid It](https://www.teamcamp.app/blogs/scope-creep-meaning-examples-how-agencies-avoid-it)
- [How to Prevent Scope Expansion as a Freelancer (2026)](https://www.plutio.com/freelancer-magazine/scope-creep)
- [5 Mistakes Developers Make in Their Portfolio Websites](https://www.devportfoliotemplates.com/blog/5-mistakes-developers-make-in-their-portfolio-websites)

### Interactive Storytelling and Narrator Engines
- [Dynamic emphatical narration for reduced authorial burden](https://www.tandfonline.com/doi/full/10.1080/09540091.2018.1454891)
- [Immersive Storytelling Websites: The 2026 Guide](https://www.utsubo.com/blog/immersive-storytelling-websites-guide)
- [Storycaster: An AI System for Immersive Room-Based Storytelling](https://arxiv.org/html/2510.22857)

### Minors Privacy and COPPA
- [Children's Privacy in 2026: From Australia's Under-16 Social Media Ban](https://datamatters.sidley.com/2026/02/13/childrens-privacy-in-2026-from-australias-under-16-social-media-ban-to-a-shift-beyond-notice-and-consent-in-the-united-states/)
- [Children's Online Privacy: Recent Actions by the States and the FTC](https://www.mayerbrown.com/en/insights/publications/2025/02/protecting-the-next-generation-how-states-and-the-ftc-are-holding-businesses-accountable-for-childrens-online-privacy)
- [2026 Year in Preview: Global Minors' Privacy and Online Safety Predictions](https://www.wsgr.com/en/insights/2026-year-in-preview-global-minors-privacy-and-online-safety-predictions.html)

### CI/CD Security and Build Validation
- [CI/CD Pipeline Security Best Practices | Wiz](https://www.wiz.io/academy/application-security/ci-cd-security-best-practices)
- [How Secrets Leak in CI/CD Pipelines - Truffle Security](https://trufflesecurity.com/blog/secrets-leak-in-ci-cd)
- [CI CD Security - OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/cheatsheets/CI_CD_Security_Cheat_Sheet.html)

### 3D Force-Directed Graph Performance
- [Force Directed 3D Graph Visualization Algorithm - Preprints.org](https://www.preprints.org/manuscript/202404.1504)
- [The Best Libraries and Methods to Render Large Force-Directed Graphs on the Web](https://weber-stephen.medium.com/the-best-libraries-and-methods-to-render-large-network-graphs-on-the-web-d122ece2f4dc)

---
*Pitfalls research for: Data-driven 3D personal websites with social media pipelines*
*Researched: 2026-02-27*
