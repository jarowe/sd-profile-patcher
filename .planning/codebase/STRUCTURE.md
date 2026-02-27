# Codebase Structure

**Analysis Date:** 2026-02-27

## Directory Layout

```
jarowe/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/               # Route-specific pages
│   ├── context/             # React Context providers
│   ├── utils/               # Shared utility functions
│   ├── data/                # Static data exports
│   ├── App.jsx              # Root router component
│   ├── main.jsx             # Vite entry point
│   └── index.css            # Global styles
├── public/                  # Static assets (images, fonts)
│   └── images/
│       ├── vault/           # Vault reward photos (11 coaster images)
│       └── Instagram/       # Instagram export data
├── .planning/               # Documentation (this file, codebase analysis, research)
├── package.json             # Dependencies (Vite 7, React 19, React Router 7, Three.js, etc.)
├── vite.config.js           # Vite build config with BASE_PATH support
├── eslint.config.js         # ESLint rules
├── index.html               # HTML entry point
└── carbonmade-archive/      # Historical project archive (not deployed)
```

## Directory Purposes

**src/components/:**
- Purpose: Reusable, feature-specific React components
- Contains: UI components, interactive elements, audio player, overlays
- Key files:
  - `AudioContext.jsx` - Global audio state provider (wraps entire app)
  - `GameOverlay.jsx` - XP counter + notifications + Konami code easter egg
  - `GlobalPlayer.jsx` - Fixed music player (hidden on home page, MusicCell handles it)
  - `MusicCell.jsx` - Music player in home bento grid
  - `DailyCipher.jsx` - Wordle-clone puzzle with vault card unlock system
  - `SpeedPuzzle.jsx` - Another puzzle variant
  - `GlobeEditor.jsx` - Real-time globe shader parameter tuning (debug only, hidden by default)
  - `Navbar.jsx` - Top navigation with links + mute button
  - `Projects.jsx` - Project card grid component
  - `Experience.jsx` - 3D scene wrapper (not actively used)

**src/pages/:**
- Purpose: Route-specific page components (one per URL path)
- Contains: Full-page layouts, complex component orchestration
- Key files:
  - `Home.jsx` - Hero page with interactive globe, bento grid, expeditions, cipher modal
  - `UniversePage.jsx` (lazy-loaded) - 3D starfield + orbiting polaroid photos
  - `Garden.jsx` - Blog-style notes with scrolling + images
  - `Vault.jsx` - Classified secrets + project stories
  - `Now.jsx` - Status/current focus (simple glass panels, NOT telemetry)
  - `Workshop.jsx` - Tool & project showcase grid with GSAP animations
  - `Patcher.jsx` - SD Profile Patcher tool (file upload form)
  - `BeamyProject.jsx` - BEAMY animation engine project details
  - `StarseedProject.jsx` - Starseed Labs project details
  - `Favorites.jsx` - Curated favorites (music, articles, etc.)

**src/context/:**
- Purpose: React Context providers for global state
- Contains: `AudioContext.jsx` with audio state + Howler.js management

**src/utils/:**
- Purpose: Shared utility functions and configuration
- Contains:
  - `sounds.js` - Web Audio API synthesis for hover/click tones + mute state getter/setter
  - `globeDefaults.js` - 300+ tunable globe shader parameters (lighting, colors, speeds, effects)

**src/data/:**
- Purpose: Static data exports (photos, messages, coordinates)
- Contains: `photos.js` - Photo array with captions for home gallery

**public/images/:**
- Purpose: Static image assets
- Contains:
  - `vault/` - 11 coaster reward photos (VelociCoaster, Kraken, Mako, etc.)
  - `Instagram/` - Instagram data export (posts, metadata)
  - Root-level: Avatar photos, family/travel photos, screenshots
  - CRITICAL: Use `import.meta.env.BASE_URL` prefix for GitHub Pages (`/jarowe/` BASE_PATH)

## Key File Locations

**Entry Points:**
- `src/main.jsx` - ReactDOM.createRoot() entry point
- `index.html` - HTML shell with `<div id="root">`
- `src/App.jsx` - Router configuration, AudioProvider wrapper, route definitions

**Configuration:**
- `package.json` - Dependencies (React 19, Vite 7, Three.js 0.183, react-globe.gl, GSAP, Framer Motion, Howler.js)
- `vite.config.js` - BASE_PATH for deployment, React plugin
- `eslint.config.js` - ESLint rules (React hooks, refresh)

**Core Logic:**
- `src/pages/Home.jsx` - Globe rendering (800+ lines), shader material, particles, expeditions
- `src/components/GameOverlay.jsx` - XP system + localStorage + confetti
- `src/components/DailyCipher.jsx` - Puzzle logic + card unlock animations
- `src/context/AudioContext.jsx` - Global audio state, Howler.js lifecycle

**Testing:**
- None detected (no .test.jsx, jest.config.js, or vitest.config.js files)

**Styling:**
- `src/index.css` - Global variables, glass-panel utility, back-link style
- Component CSS files: One per component/page (e.g., `Home.css`, `GameOverlay.css`, etc.)

## Naming Conventions

**Files:**
- PascalCase for React components: `GameOverlay.jsx`, `DailyCipher.jsx`, `UniversePage.jsx`
- camelCase for utilities/data: `sounds.js`, `photos.js`, `globeDefaults.js`
- Index files avoided (no barrel exports)

**Directories:**
- kebab-case avoided
- Plural for feature collections: `components/`, `pages/`, `utils/`, `data/`, `context/`
- `public/` for static assets

**CSS:**
- BEM-like naming: `.glass-panel`, `.xp-container`, `.nav-link`, `.back-link`
- Component-scoped: `.global-player`, `.game-overlay`, `.daily-cipher`
- Utility classes: `.clickable`, `.tilt-enabled`

**Variables & Functions:**
- camelCase: `currentTrackIndex`, `isPlaying`, `handleGlobeRef()`, `playHoverSound()`
- Event handlers prefixed with `on`: `onPointerOver`, `onClick`
- State booleans prefixed with verb: `isPlaying`, `isMuted`, `accessGranted`, `globeMounted`

**Constants:**
- UPPERCASE for object exports: `GLOBE_DEFAULTS`, `WORDS`, `EARTH_DEFAULTS`
- camelCase for local constants: `quotes`, `expeditions`, `vaultPhotos`
- Prefixed with `BASE` for asset paths: `BASE = import.meta.env.BASE_URL`

## Where to Add New Code

**New Feature (e.g., new game, interaction):**
- Create component in `src/components/FeatureName.jsx`
- Add styles to `src/components/FeatureName.css`
- Import + use in relevant page (Home.jsx for homepage features)
- If needs global state: add to AudioContext or create new context
- If needs sounds: use `src/utils/sounds.js` functions

**New Page:**
- Create file in `src/pages/PageName.jsx`
- Add styles to `src/pages/PageName.css`
- Import in `src/App.jsx`
- Add route: `<Route path="/path" element={<PageName />} />`
- Add navigation link in `src/components/Navbar.jsx` (if public-facing)
- For heavy 3D pages: use `React.lazy()` + Suspense in App.jsx

**New Utility Function:**
- If sound-related: add to `src/utils/sounds.js`
- If globe-related: add to `src/utils/globeDefaults.js` or separate file
- If general: create new file in `src/utils/` with camelCase name
- Export function, use `import { fn } from '../utils/filename.js'`

**New Static Data:**
- Add to `src/data/` directory
- Export as object/array: `export const dataName = [...]`
- Use BASE_PATH prefix for asset URLs: `` `${BASE}images/file.jpg` ``

**New 3D Component:**
- Create in `src/components/` or `src/pages/` depending on scope
- Import Three.js + R3F + drei as needed
- Use Canvas wrapper from `@react-three/fiber`
- Add effect composer + postprocessing if visual effects needed
- Wrap in Suspense with fallback text if heavy

**New Globe Effect/Shader:**
- Add parameter to `src/utils/globeDefaults.js`
- Reference parameter in `src/pages/Home.jsx` shader uniforms
- For debug: expose in GlobeEditor.jsx panel
- Test with `?editor=jarowe` URL parameter

## Special Directories

**public/images/:**
- Purpose: Static assets served by Vite
- Generated: No (manually curated)
- Committed: Yes (to git)
- Subfolder structure:
  - `vault/` - 11 coaster photos (reward photos for Daily Cipher win)
  - `Instagram/` - Full Instagram data export (not all used)
  - Root: Avatar photos, family photos, general site imagery

**.planning/:**
- Purpose: Project documentation, architecture notes, research
- Generated: No (manually created)
- Committed: Yes (to git)
- Contents: This STRUCTURE.md, ARCHITECTURE.md, CONVENTIONS.md (future), TESTING.md (future), CONCERNS.md (future)

**src/ (root level):**
- Generated: No
- Committed: Yes
- index.css: Global styles (variables, resets, utility classes)

## Asset Path Pattern

**All image/asset imports must use BASE_PATH:**
```javascript
const BASE = import.meta.env.BASE_URL;
const imageSrc = `${BASE}images/filename.jpg`;
```

This ensures correct paths on GitHub Pages (where BASE_URL = `/jarowe/`) and local dev (where BASE_URL = `/`).

## Deployment Structure

**Development:**
- `npm run dev` → Vite serves from localhost:5173, BASE_URL = `/`
- Assets load from `/public/images/`

**Production (Vercel):**
- `npm run build` → Creates `dist/` with code splitting
- Deployed to jarowe.com, BASE_URL = `/`
- Assets from `dist/images/`

**Secondary Deploy (GitHub Pages):**
- Same build, pushed to jarowe.github.io/jarowe
- BASE_PATH environment variable set to `/jarowe/` during build
- Assets load from `/jarowe/images/`

---

*Structure analysis: 2026-02-27*
