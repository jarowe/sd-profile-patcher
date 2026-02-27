# Architecture

**Analysis Date:** 2026-02-27

## Pattern Overview

**Overall:** Multi-layered React SPA with context-driven state management, lazy-loaded 3D experiences, and modular page-based routing.

**Key Characteristics:**
- **Router-centric**: React Router v7 with `basename` for GitHub Pages deployment (`/jarowe/`)
- **Context Provider pattern**: `AudioProvider` wraps entire app, manages music state with Howler.js
- **Lazy component loading**: Heavy 3D/3R3F components split via `React.lazy()` to reduce initial bundle
- **Shader-based visuals**: Custom Three.js ShaderMaterial for globe rendering with real-time uniforms
- **Local state persistence**: `localStorage` for XP, cipher state, mute state, visited paths
- **Web Audio API**: Native sine-tone synthesis for hover/click feedback (no audio files)

## Layers

**Presentation Layer (Components & Pages):**
- Purpose: Render UI, handle user interaction, trigger sound effects
- Location: `src/components/`, `src/pages/`
- Contains: React components using Framer Motion, Lucide icons, Canvas (R3F), GSAP animations
- Depends on: `AudioContext`, utility functions (`sounds.js`), data files
- Used by: App.jsx (router)

**State Management Layer:**
- Purpose: Provide audio state, XP/game state, configuration
- Location: `src/context/AudioContext.jsx` (global), component-local `useState` hooks
- Contains: AudioProvider context, sunoTracks data, mute state
- Depends on: Howler.js library
- Used by: GlobalPlayer, MusicCell, all pages

**3D/Graphics Layer:**
- Purpose: Render interactive 3D scenes, shader effects, post-processing
- Location: `src/pages/Home.jsx` (globe + particles), `src/pages/UniversePage.jsx` (starfield + polaroids)
- Contains: Three.js ShaderMaterial, R3F components, EffectComposer effects
- Depends on: `@react-three/fiber`, `@react-three/drei`, `three`, `@react-three/postprocessing`, `maath`
- Used by: Home and UniversePage routes

**Utilities Layer:**
- Purpose: Shared functions for audio synthesis, globe configuration, sound effects
- Location: `src/utils/sounds.js`, `src/utils/globeDefaults.js`
- Contains: `playHoverSound()`, `playClickSound()`, `GLOBE_DEFAULTS` object (100+ tunable parameters)
- Depends on: Web Audio API (native), Three.js constants
- Used by: All interactive components, Home page shader

**Data Layer:**
- Purpose: Static/configuration data (photos, tracks, world school messages)
- Location: `src/data/photos.js`
- Contains: Photo arrays with captions, expedition coordinates, vault photos
- Depends on: None (static exports)
- Used by: Home page, DailyCipher component

**Router Entry Point:**
- Location: `src/App.jsx`
- Triggers: Route changes via React Router
- Responsibilities: Wrap AudioProvider, define all routes, render Navbar + main content + overlays

## Data Flow

**Music Playback Flow:**

1. User clicks play in MusicCell (Home) or GlobalPlayer (other pages)
2. Click triggers `togglePlay()` via `useAudio()` hook
3. AudioProvider creates Howler instance with `sunoTracks[currentTrackIndex]`
4. On track end, `handleNext()` increments index, plays next track
5. GlobalPlayer listens to `isPlaying`/`currentTrack`, renders UI
6. Music persists across page navigation (AudioProvider wraps Router)

**XP & Game Flow:**

1. User visits page → GameOverlay.jsx detects route change
2. Checks `localStorage.jarowe_visited_paths` for new page
3. If new, waits 1s then calls `addXp(50, "Explored: /path")`
4. `addXp()` updates state, saves to `localStorage.jarowe_xp`
5. Calculates level (floor(xp / 100) + 1)
6. If level up, triggers canvas-confetti explosion
7. Konami code (↑↑↓↓←→←→BA) adds 200 XP, applies `retro-mode` class

**Daily Cipher Flow:**

1. Component mounts, calls `getDailyData()` to seed puzzle based on date
2. User types letters → validates against daily word
3. On win: triggers confetti, reveals card, saves to `localStorage.jarowe_cipher_state`
4. Unlocked cards displayed in splash modal with 3D tilt effect
5. User can access bonus cipher for extra cards

**Globe Rendering (Home page):**

1. Vite lazy-loads Globe component on mount
2. `handleGlobeRef()` callback fires when Globe resolves
3. ResizeObserver watches container, updates `globeSize` state
4. Custom ShaderMaterial created via `useMemo()` with 200+ uniforms
5. `sharedUniforms` ref holds `time`, `sunDir`, `audioPulse` updated each frame
6. Animation loop updates `sharedUniforms.current.sunDir` via `getSunDirection()`
7. Cloud mesh counter-rotates, particles tint, satellites orbit
8. GlobeEditor (when `?editor=jarowe`) mutates `editorParams` in real-time, triggers re-render

**State Management:**

- Audio: Centralized in `AudioContext`, read via `useAudio()` hook throughout app
- XP/Game: Local component state + `localStorage` persistence (survives page refresh)
- Cipher: Component state + `localStorage.jarowe_cipher_state` (daily/bonus modes)
- Mute state: Stored in `sounds.js` module (getter/setter), synced via useState in Navbar
- Route state: React Router location context
- Scroll/viewport state: Component-level refs (ResizeObserver for globe container)

## Key Abstractions

**AudioProvider Context:**
- Purpose: Provides global music state without prop drilling
- Examples: `src/context/AudioContext.jsx`
- Pattern: React Context + useContext hook, manages Howler.js lifecycle

**Globe Shader Material:**
- Purpose: Apply custom lighting/color/effects to three-globe geometry
- Examples: `src/pages/Home.jsx` lines 188-400+
- Pattern: THREE.ShaderMaterial passed via `globeMaterial` prop (official react-globe.gl API), not scene.traverse() mutation

**Expedition Card System:**
- Purpose: Dynamically render photo cards with location pins on globe
- Examples: `src/pages/Home.jsx` (expeditions array + card rendering)
- Pattern: Map coordinates to globe, overlay CSS glass panels with image + caption

**Game Overlay XP System:**
- Purpose: Persistent gamification layer tracking exploration
- Examples: `src/components/GameOverlay.jsx`
- Pattern: useLocation hook detects route changes, localStorage persists across sessions, confetti on level-up

**Daily Cipher (Wordle-clone):**
- Purpose: Daily puzzle with vault reward unlock system
- Examples: `src/components/DailyCipher.jsx`
- Pattern: Seeded by date, tracks guesses in state, card unlock animation with 3D tilt

## Entry Points

**Application Root:**
- Location: `src/main.jsx`
- Triggers: Page load
- Responsibilities: Mount React app to DOM, render App component in StrictMode

**App Component:**
- Location: `src/App.jsx`
- Triggers: App initialization
- Responsibilities: Wrap AudioProvider, define Router with all routes, render navbar + main + GameOverlay + GlobalPlayer

**Home Page:**
- Location: `src/pages/Home.jsx`
- Triggers: Route `/` or page refresh
- Responsibilities: Render hero section, bento grid, interactive globe, expedition cards, daily cipher modal, music cell

**Workshop/Tools Pages:**
- Location: `src/pages/Workshop.jsx`, `src/pages/Patcher.jsx`, `src/pages/BeamyProject.jsx`, `src/pages/StarseedProject.jsx`
- Triggers: Nested routes under `/workshop`, `/tools/*`, `/projects/*`
- Responsibilities: Display tool showcase, project details, back navigation

**Universe Page:**
- Location: `src/pages/UniversePage.jsx` (lazy-loaded)
- Triggers: Route `/universe`
- Responsibilities: Render 3D starfield + orbiting polaroid photos + discovery counter

**Garden Page:**
- Location: `src/pages/Garden.jsx`
- Triggers: Route `/garden`
- Responsibilities: Render scrollable blog-like notes with icons/stages + images

**Now/Vault/Favorites/Garden Pages:**
- Location: `src/pages/Now.jsx`, `src/pages/Vault.jsx`, `src/pages/Favorites.jsx`
- Triggers: Routes `/now`, `/vault`, `/favorites`, `/garden`
- Responsibilities: Display personal content (status, secrets, favorites, notes)

## Error Handling

**Strategy:** Try-catch for Web Audio API (gracefully degrades if suspended), fallback for lazy loading with Suspense

**Patterns:**
- **Web Audio errors**: `playClickSound()` and `playHoverSound()` wrapped in try-catch; checks `ctx.state === 'suspended'` before playing
- **Lazy component fallback**: UniversePage wrapped in Suspense with loading text fallback
- **Shader compilation**: Globe shader syntax validated at material creation; errors logged to console
- **Image loading**: Texture loading via THREE.TextureLoader (automatic retry); graceful fallback if missing

## Cross-Cutting Concerns

**Logging:** Console logging only (no external service); shader compilation logs, Web Audio context errors logged to console

**Validation:**
- Cipher guesses validated against WORDS array
- Route-based XP adds validated against visited paths in localStorage
- No formal schema validation

**Authentication:** None (public portfolio site)

**Sound Effects:**
- Implemented via `sounds.js` Web Audio API module
- Hover: 800Hz sine for 0.1s
- Click: 600Hz sine for 0.15s
- Mute state persisted via module-level variable + localStorage
- Triggered by onClick/onMouseEnter on `.clickable` elements

**Styling:**
- Global styles in `src/index.css` (variables, glass-panel class, back-link class)
- Component-scoped CSS files (one per component)
- Tailwind-like utility approach (flex, grid, text-align inline via className)
- CSS variables for colors/spacing

**Image Paths:**
- All image imports use `import.meta.env.BASE_URL` constant for GitHub Pages deployment
- Pattern: `` `${BASE}images/filename.jpg` ``
- Deployed to: `public/images/` directory

---

*Architecture analysis: 2026-02-27*
