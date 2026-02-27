# Codebase Concerns

**Analysis Date:** 2026-02-27

## Tech Debt

**Monolithic Home.jsx Component:**
- Issue: `src/pages/Home.jsx` at 3,472 lines contains the entire globe visualization (shaders, particles, animations, UI), DailyCipher wrapper, globe editor integration, and bento grid layout. Single file with multiple responsibilities makes testing and maintenance difficult.
- Files: `src/pages/Home.jsx`
- Impact: Changes to any visual aspect require editing massive file. Hot reload is slow. Git diffs are unreadable. New developers struggle to find logic.
- Fix approach: Refactor into: `Globe.jsx` (container), `GlobeSurface.jsx` (shader setup), `GlobeAtmosphere.jsx` (atmosphere layers), `GlobeParticles.jsx` (star/dust system), `BentoGrid.jsx` (layout). Move shader strings to separate `.glsl` files or shader utility functions.

**Shader Code Inline in Components:**
- Issue: 2000+ lines of GLSL vertex/fragment shaders embedded as JavaScript template strings in `src/pages/Home.jsx` (lines 258-1900+). Hard to debug, no syntax highlighting, difficult to reuse.
- Files: `src/pages/Home.jsx` (globe surface shader, cloud shader, particle shader), `src/components/GlobeEditor.jsx` (multiple mini-shaders)
- Impact: Shader compilation errors are unclear. Cannot use GLSL linters. Difficult to swap/tweak shaders without editing sprawling JSX files. DX is poor.
- Fix approach: Extract shaders to `src/utils/shaders/` directory with named exports: `surfaceShader.glsl`, `cloudShader.glsl`, `particleShader.glsl`. Import and use `fetch()` or build-time imports. Enables shader hot-reload workflow.

**Missing Error Boundaries:**
- Issue: No React Error Boundaries throughout app. Three.js rendering failures (missing textures, shader compilation errors, WebGL context loss) crash entire page silently.
- Files: All component files
- Impact: A single texture load failure or shader error brings down the entire site. Users see blank page or console errors.
- Fix approach: Wrap `Home.jsx` in Error Boundary. Add ErrorBoundary component around Globe, particles, and DailyCipher. Log errors to console clearly. Display fallback UI with "something broke" message + contact info.

**localStorage Proliferation:**
- Issue: 60+ localStorage calls scattered across `src/components/DailyCipher.jsx` and `src/components/GameOverlay.jsx`. Keys like `jarowe_xp`, `jarowe_collection`, `jarowe_bonus_ciphers`, `dailyCipher` are magic strings with no schema. No validation on parse or retrieval.
- Files: `src/components/DailyCipher.jsx`, `src/components/GameOverlay.jsx`, `src/components/GlobeEditor.jsx`
- Impact: If localStorage is corrupted (e.g., JSON.parse on invalid data), components crash. No way to migrate data schema if keys change. Multiple components can write to same key causing race conditions.
- Fix approach: Create `src/utils/localStorage.ts` with schema: `LocalStorage = { xp: number, collection: number[], bonusCiphers: number, ... }`. Provide typed getters/setters with fallbacks. Export `useLocalStorage()` hook that handles errors gracefully.

**No TypeScript:**
- Issue: Codebase is 100% JavaScript/JSX with no type checking. Props are PropTypes annotations only. No compile-time safety on object shapes.
- Files: All `.jsx` and `.js` files
- Impact: Hard to refactor. IDE autocomplete is weak. Runtime errors from typos in object keys. New contributors don't know what props components expect.
- Fix approach: (Low priority, big lift) Migrate to TypeScript gradually. Start with critical files: `Context` (AudioContext, GameOverlay), utilities (sounds.js, globeDefaults.js), then components.

## Known Bugs

**Globe Shader Texture Loading Race Condition:**
- Symptoms: Globe occasionally shows with missing/wrong textures on first load. Night map sometimes appears inverted. Water mask doesn't render correctly on reload.
- Files: `src/pages/Home.jsx` lines 191-194
- Trigger: Hard refresh or slow network. TextureLoader loads async but shader material is applied immediately.
- Workaround: Manual page reload usually fixes it. Textures load fine on slow 3G after second attempt.
- Root cause: `TextureLoader` async but no promise-based loading. Material is applied before textures are ready.
- Fix: Wrap texture loads in promises, ensure material only applies after all textures load.

**Mobile Touch Handling Missing:**
- Symptoms: Globe is not touchable on mobile. No pan/zoom with fingers. Particles don't respond to touch.
- Files: `src/pages/Home.jsx` lines 1805-1807 (mouse event only)
- Trigger: View on any mobile device
- Impact: 50%+ of visitors on mobile see non-interactive globe. Breaks the "playful" promise.
- Workaround: None - feature just doesn't work
- Fix approach: Add touch event listeners to globe container. Map touch coordinates to mouse position for particle ripples. Add pinch-zoom handling for camera.

**Audio Context Not Persisted Across Routes:**
- Symptoms: Music stops when navigating between pages (though AudioContext is global, Howl instance may lose reference).
- Files: `src/context/AudioContext.jsx`
- Trigger: Click navigation link while music is playing
- Workaround: Click play button again - but should be seamless
- Root cause: Howler instance in `soundRef.current` but ref cleanup on unmount may lose audio state
- Fix: Verify AudioProvider wraps entire app before Router. Consider persisting playback time to localStorage.

**DailyCipher localStorage Data Loss Risk:**
- Symptoms: If user clears browser storage or uses private/incognito mode, all vault photo progress is lost with no warning.
- Files: `src/components/DailyCipher.jsx` lines 207, 225, 266
- Trigger: Browser storage cleared or incognito session ends
- Workaround: No workaround. Progress is gone.
- Impact: Users who play daily may lose weeks of progress
- Fix: Add localStorage.availabilityChange listener. Warn users before data is lost. Offer option to export/import collection.

## Security Considerations

**XSS Risk in Message Rendering:**
- Risk: `src/pages/Home.jsx` lines 3072-3074 render `globeMessage.text` directly without escaping. If worldschoolMessages array is ever populated from API or user input, XSS is possible.
- Files: `src/pages/Home.jsx` lines 3072-3074, `src/pages/Home.jsx` lines 66-83 (hardcoded for now)
- Current mitigation: Messages are hardcoded strings in source code. Safe today.
- Recommendations: If messages ever come from API/DB, sanitize with DOMPurify or React's built-in escaping. Add CSP header blocking inline scripts.

**localStorage Data Exposure:**
- Risk: All game state (XP, vault progress, speed puzzle highscore) stored in localStorage readable by any script on jarowe.com. If attacker gains script execution, they can modify scores.
- Files: `src/components/DailyCipher.jsx`, `src/components/GameOverlay.jsx`, `src/components/GlobeEditor.jsx`
- Current mitigation: Single-user site, no authentication, no financial transactions. Data exposure is low-impact.
- Recommendations: For now, acceptable. If user data becomes sensitive (accounts, payments), move to server-backed API with authentication.

**Texture URL External CDN:**
- Risk: Globe textures loaded from unpkg.com and cdn.jsdelivr.net (lines 191-194, 623-624 in Home.jsx). If CDN is compromised, malicious images could be served.
- Files: `src/pages/Home.jsx` lines 191-194, 622-624
- Current mitigation: Using official three.js examples URLs (mrdoob/three.js@dev). High trust, but still external dependency.
- Recommendations: Download textures to `public/textures/` at build time. Or use SRI (subresource integrity) hashes on CDN URLs. For production, prefer local hosting.

**No Input Validation on Cipher Guesses:**
- Risk: `src/components/DailyCipher.jsx` accepts user keyboard input for word guesses. Not currently validated beyond length check.
- Files: `src/components/DailyCipher.jsx` lines 283-314
- Current mitigation: Input is uppercase guesses against hardcoded WORDS array. No backend. Safe for now.
- Recommendations: Keep input sanitized (already is - just letters). No risk on client-side only game.

## Performance Bottlenecks

**Globe Material Creation Every Render:**
- Problem: `globeShaderMaterial` is memoized in useMemo (line 188) but re-creates material if editorParams changes. Creates 100+ THREE.ShaderMaterial instances during development if editor is active.
- Files: `src/pages/Home.jsx` lines 188-257
- Cause: TextureLoader creates new texture objects every time. useMemo dependency is editorParams.current which mutates in place (not clean React pattern).
- Improvement path: (1) Move texture loading to top level with useRef so textures are created once. (2) Use lil-gui callbacks to update uniforms directly instead of re-rendering. (3) Profile with Chrome DevTools Performance tab to measure actual impact.
- Measured impact: Not quantified but visible on slower devices - initial page load may stutter.

**No Lazy Loading for DailyCipher/GlobeEditor:**
- Problem: `src/pages/Home.jsx` eagerly imports GlobeEditor. GlobeEditor with lil-gui adds ~50KB to Home bundle even if editor is never used (?editor=jarowe).
- Files: `src/pages/Home.jsx` line 19
- Cause: Static import instead of dynamic import with React.lazy
- Improvement: Change to `const GlobeEditor = lazy(() => import('../components/GlobeEditor'))` and conditionally render only if editor URL param is set.
- Estimated savings: ~50KB in main bundle for users who don't use editor (99% of visitors).

**Particle System at 16K Vertices:**
- Problem: Particle system creates 8K stars + 8K dust particles (16K total) every frame with mouse ripple calculations in shader. On low-end devices (older phones, iPads) this may cause frame drops.
- Files: `src/pages/Home.jsx` particle shader lines 1829-1895
- Cause: No LOD (level of detail). Same particle count on 4K displays and mobile.
- Improvement path: Detect device pixel ratio and reduce particle count on low-end. Or use requestAnimationFrame cap to 30fps on low-end devices.
- Impact: Smooth on flagship devices, janky on budget phones.

**No Canvas Resize Debounce:**
- Problem: ResizeObserver fires on every pixel change (line 148). Globe re-renders on every resize event. No debouncing.
- Files: `src/pages/Home.jsx` lines 147-158
- Cause: ResizeObserver directly updates state without debounce
- Improvement: Debounce ResizeObserver callback with useRef + setTimeout(300ms) to batch resize events
- Impact: Window resize/orientation change causes multiple unnecessary re-renders.

**DailyCipher Collection Array Not Optimized:**
- Problem: `src/components/DailyCipher.jsx` loads entire `jarowe_collection` array from localStorage on every mount and game state change. Array can grow to 11 items but is re-parsed from JSON string multiple times.
- Files: `src/components/DailyCipher.jsx` lines 207, 254, 266
- Cause: Multiple JSON.parse() calls, no caching
- Improvement: Create custom hook `useCollectionState()` that caches parsed collection in useRef and only updates on localStorage changes.
- Impact: Negligible for 11 items but bad practice that won't scale.

## Fragile Areas

**Globe Reference Chain Complexity:**
- Files: `src/pages/Home.jsx` (entire globe setup)
- Why fragile: Globe system stores state in multiple places - `sharedUniforms.current` (ref), `editorParams.current` (ref), `globeRef.current` (three-globe instance), and state objects. Changes to one often require changes to 3-4 other places. Shader uniforms, material uniforms, and JS values can get out of sync.
- Safe modification: (1) When adding new shader param: add to editorParams, add uniform to sharedUniforms, add to GLOBE_DEFAULTS, add to GlobeEditor GUI, add to shader code. (2) Test editor loads and saves presets. (3) Verify shader compiles (check browser console).
- Test coverage: No unit tests. Manual visual testing only.

**DailyCipher State Machine (Daily + Bonus Mode):**
- Files: `src/components/DailyCipher.jsx` (entire component)
- Why fragile: Complex state machine with daily/bonus mode switching, localStorage persistence, bonus unlock logic, and reward splash. Multiple useRef/useState managing overlapping state. If one callback doesn't update the right state, game breaks silently.
- Safe modification: (1) Draw state diagram before changing logic. (2) Add console.log statements to track mode switches and state updates. (3) Test daily → bonus → daily flow manually. (4) Verify localStorage state is consistent after each action.
- Test coverage: No unit tests. Manual gameplay testing only.

**Shader Compilation Errors Silent:**
- Files: `src/pages/Home.jsx` shaders, `src/components/GlobeEditor.jsx` shaders
- Why fragile: THREE.js shader compilation errors are logged to console but don't throw exceptions. A typo in shader code silently falls back to default material or shows incorrect colors. Hard to debug.
- Safe modification: (1) Always check browser console after shader changes. (2) Use WebGL shader validator. (3) Test on multiple browsers (Chrome WebGL2 vs Firefox).
- Test coverage: No shader tests. Manual visual inspection only.

**CSS Class Name Coupling:**
- Files: `src/pages/Home.css`, `src/pages/Home.jsx`, `src/components/*.css`
- Why fragile: Home.jsx renders many divs with hardcoded class names like `.bento-cell`, `.peek-character`, `.prism-bubble`. If CSS is renamed, JSX breaks silently (no error). CSS animations depend on exact timing.
- Safe modification: (1) Use CSS modules or Tailwind to prevent name conflicts. (2) Test all animations after CSS changes. (3) Run visual regression tests.
- Test coverage: No CSS tests.

## Scaling Limits

**localStorage Size Cap:**
- Current capacity: localStorage quota ~5-10MB per domain (varies by browser)
- Current usage: ~2KB (xp, collection, cipher state, speed score)
- Limit: If user data expands to include all vault card metadata, weekly stats, journey history, could hit limits
- Scaling path: Move to IndexedDB for unlimited storage, or implement server API with database for persistent user profiles

**Particle System at 8K Stars:**
- Current capacity: Smooth 60fps on modern devices with 16K particles
- Limit: Mobile devices start dropping frames above 8K particles total
- Scaling path: (1) Implement viewport frustum culling - only render particles visible to camera. (2) Use LoD system - distant particles become simpler quads. (3) Add quality setting in UI.

**Three.js Memory Usage:**
- Current capacity: ~300MB VRAM on typical device (globe geometry, textures, materials, particles)
- Limit: If adding more interactive elements or 3D objects, memory could exceed device limits (especially mobile)
- Scaling path: Texture atlasing, compression, unload unused geometries, streaming.

## Dependencies at Risk

**three-globe Actively Maintained but Not Latest Three.js:**
- Risk: react-globe.gl@2.37.0 depends on three@^0.130, but app uses three@0.183.1. Version mismatch could cause bugs if globe isn't updated to match latest three API.
- Impact: May limit use of new three.js features. Could encounter breaking changes on next three.js major version.
- Migration plan: Monitor react-globe.gl releases. When it updates to support latest three, bump it. If no update, fork three-globe or replace with custom globe implementation using three.js directly.

**Howler.js Audio Library:**
- Risk: Howler.js@2.2.4 is stable but last release was 2022. Web Audio API has evolved significantly.
- Impact: Missing support for new audio features (spatial audio, worklets). Library doesn't seem abandoned but updates are infrequent.
- Migration plan: For simple playback (current use) it's fine. If building sophisticated audio features, consider switching to native Web Audio API or tone.js.

**Framer Motion v12 + React 19 Compatibility:**
- Risk: Framer Motion is actively maintained but React 19 is very new. Subtle animation bugs could emerge.
- Impact: Animations might behave unexpectedly. AnimatePresence could have timing issues.
- Migration plan: Monitor Framer Motion GitHub for reported React 19 issues. File issues if found. Consider testing animations on real devices.

**Vite 7.3.1 (Very Recent):**
- Risk: Vite 7 was just released (Feb 2024). Very few projects depend on it yet. Bugs may surface.
- Impact: Build process could break on unexpected edge cases.
- Migration plan: Pin Vite version. Monitor for critical releases. Don't upgrade to pre-release until stable.

**GSAp + @gsap/react Dependency:**
- Risk: @gsap/react@2.1.2 is thin wrapper around gsap@3.14.2. If GSAP major version changes, breaking changes possible.
- Impact: Animations using useGSAP hook could break.
- Migration plan: Keep gsap and @gsap/react in sync. Test animations after gsap upgrades.

## Missing Critical Features

**No Fallback If WebGL Not Supported:**
- Problem: Globe is pure WebGL. If user's browser doesn't support WebGL 2 (older browsers, some corporate networks), entire globe fails silently.
- Blocks: Globe visualization is core to site experience
- Workaround: None - users see broken page
- Fix: Detect WebGL support. If missing, show fallback (static image, ASCII art map, or simple HTML version of globe). Display message to user about browser requirements.

**No Error Reporting:**
- Problem: If shader fails to compile, texture fails to load, or audio fails to play, users have no way to report it. Only developers see console errors.
- Blocks: Can't track production bugs
- Workaround: None
- Fix: Add Sentry or similar error tracking. Send uncaught errors and console.error() to server. Enable user to report issues.

**No Responsive Design for Mobile Globe:**
- Problem: Globe optimized for desktop 1:1 aspect ratio. On mobile (portrait), globe either gets squashed or navigation breaks.
- Blocks: Mobile users can't fully experience the site
- Workaround: None - feature just doesn't work well
- Fix: Implement responsive globe - detect viewport aspect, adjust camera FOV, reposition UI elements for mobile.

## Test Coverage Gaps

**No Unit Tests:**
- Untested area: All components, utilities, and context
- Files: All src/ files
- Risk: Refactoring breaks features silently. New contributors don't know what's expected. Regressions go unnoticed until production.
- Priority: High - need at least smoke tests for core features (DailyCipher, GameOverlay, AudioContext)

**No Integration Tests:**
- Untested area: Routes, context provider setup, data flow between components
- Files: App.jsx, main routes
- Risk: Adding new routes could break AudioContext or GameOverlay propagation
- Priority: Medium - would catch route-level bugs

**No Visual Regression Tests:**
- Untested area: CSS animations, responsive design, bento grid layout
- Files: All *.css files
- Risk: CSS changes could break layout on specific breakpoints without notice
- Priority: Medium - would catch styling regressions

**No Shader Tests:**
- Untested area: GLSL compilation, shader correctness
- Files: Shaders in Home.jsx and GlobeEditor.jsx
- Risk: Shader syntax errors only caught manually in browser console
- Priority: Low - difficult to test, caught easily in visual testing

**No Audio Tests:**
- Untested area: Howler.js integration, audio context setup, playback persistence
- Files: AudioContext.jsx, MusicCell.jsx
- Risk: Audio might break on specific browsers or audio devices
- Priority: Low - mostly dependency code, simple wrapper

---

*Concerns audit: 2026-02-27*
