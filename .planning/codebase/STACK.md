# Technology Stack

**Analysis Date:** 2026-02-27

## Languages

**Primary:**
- JavaScript (ES2020+) - All source files use modern JS
- JSX - React component templates in `src/pages/*.jsx` and `src/components/*.jsx`

**Secondary:**
- CSS/CSS3 - Styling with CSS variables, gradients, animations; imported via `@import` in `.css` files
- GLSL - Shader code embedded in component files (Three.js materials for globe rendering in `src/pages/Home.jsx`)
- HTML5 - Single-page app entry point `index.html`

## Runtime

**Environment:**
- Node.js 20 (specified in `.github/workflows/deploy.yml`)
- Browser (modern ES2020+ compatible: Chrome, Firefox, Safari, Edge)
- Web Audio API for sound synthesis (`src/utils/sounds.js`)

**Package Manager:**
- npm 10.5.0 (inferred from package-lock.json)
- Lockfile: `package-lock.json` present (committed to git)

## Frameworks

**Core:**
- React 19.2.0 - UI framework, strict mode enabled in `src/main.jsx`
- React Router DOM 7.13.1 - Client-side routing with `<BrowserRouter>` in `src/App.jsx`
- Vite 7.3.1 - Build tool, configured in `vite.config.js` with React plugin

**3D & Graphics:**
- Three.js 0.183.1 - 3D rendering engine used for globe visualization
- react-three/fiber 9.5.0 - React reconciler for Three.js (used in `src/pages/UniversePage.jsx`)
- react-three/drei 10.7.7 - Reusable Three.js components (OrbitControls, Stars, Points, etc.)
- react-three/postprocessing 3.0.4 - Post-processing effects in R3F scenes
- react-globe.gl 2.37.0 - Interactive globe component with lazy loading in `src/pages/Home.jsx`

**Animation & Motion:**
- Framer Motion 12.34.3 - React animations (`motion.*` components in all pages)
- GSAP 3.14.2 - GreenSock Animation Platform for timeline-based animations
- @gsap/react 2.1.2 - React hook for GSAP (`useGSAP` in `src/pages/Favorites.jsx`, `src/pages/Vault.jsx`)
- GSAP ScrollTrigger plugin - Scroll-driven animations in `src/pages/Favorites.jsx`, `src/pages/Workshop.jsx`

**Audio:**
- Howler.js 2.2.4 - Web Audio wrapper for music playback in `src/context/AudioContext.jsx`
- Web Audio API - Native sine-wave tone generation for UI sounds in `src/utils/sounds.js` (replaces old base64)

**Effects & Utilities:**
- canvas-confetti 1.9.4 - Confetti animation on wins in `src/components/GameOverlay.jsx`, `src/components/DailyCipher.jsx`, `src/components/SpeedPuzzle.jsx`
- lucide-react 0.575.0 - Icon library (Social icons, UI icons across all pages)
- lil-gui 0.21.0 - Parameter tweaking UI for globe shader debugging in `src/components/GlobeEditor.jsx`
- clsx 2.1.1 - Conditional CSS class utilities (not extensively used)
- maath 0.10.8 - Math utilities for Three.js (used in `src/pages/UniversePage.jsx`)
- prop-types 15.8.1 - Runtime type checking

**Data:**
- jszip 3.10.1 - ZIP file handling for SD Profile Patcher tool in `src/pages/Patcher.jsx`

## Key Dependencies

**Critical:**
- Three.js 0.183.1 - Powers globe rendering with custom ShaderMaterial; globe uses TSL (Three.js Shading Language) for day/night lighting
- react-globe.gl 2.37.0 - Encapsulates globe geometry; mounted and re-initialized on globe ready in `src/pages/Home.jsx`
- Howler.js 2.2.4 - Manages audio playback state across page navigation via `AudioContext.jsx`

**Infrastructure:**
- Vite 7.3.1 - Dev server with HMR; builds to `dist/` with asset hashing
- @vitejs/plugin-react 5.1.1 - Vite plugin for JSX and Fast Refresh
- esbuild 0.27.3 - Bundler (used by Vite under the hood)

## Configuration

**Environment:**
- `import.meta.env.BASE_URL` - Runtime asset path prefix, sourced from `base` in `vite.config.js`
- `BASE_PATH` env var - Set during build in `.github/workflows/deploy.yml` (value: `/jarowe/` for GitHub Pages)
- Vite dev mode: `BASE_URL` defaults to `/`
- Vite build mode: `BASE_URL` set from env var for deployment targets

**Build:**
- `vite.config.js` - Minimal config with React plugin + dynamic base path
- `eslint.config.js` - Flat config (ESLint 9 format) with React hooks + React refresh rules
- `package.json` - Scripts: `dev` (vite), `build` (vite build), `lint` (eslint .), `preview` (vite preview)
- `.gitignore` - Excludes node_modules, dist/, build artifacts

**Development Tools:**
- ESLint 9.39.1 with @eslint/js (recommended preset)
- eslint-plugin-react-hooks 7.0.1 - Rules: dependencies array warnings
- eslint-plugin-react-refresh 0.4.24 - Fast Refresh compatibility checks
- globals 16.5.0 - Global variable definitions for browser

## Platform Requirements

**Development:**
- Node.js 20+ (npm 10.5.0+)
- Modern browser with WebGL 2.0 support (for Three.js)
- Web Audio API support (for audio context)
- ES2020+ JavaScript support
- WASM support optional (some Three.js utilities may use it)

**Production:**
- **Primary:** Vercel (jarowe.com) - Serverless deployment
- **Secondary:** GitHub Pages (jarowe.github.io/jarowe/) - Static site hosting
- Both deployments serve same SPA; GitHub Pages uses `BASE_PATH=/jarowe/` in CI
- No Node.js runtime required on server (pure static SPA)
- CDN edge caching for assets
- Supports browsers: ES2020+ compliant (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

---

*Stack analysis: 2026-02-27*
