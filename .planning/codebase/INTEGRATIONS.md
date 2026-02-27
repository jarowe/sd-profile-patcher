# External Integrations

**Analysis Date:** 2026-02-27

## APIs & External Services

**Audio Streaming:**
- SoundHelix CDN (placeholder/demo tracks)
  - URLs: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-*.mp3`
  - Used in: `src/context/AudioContext.jsx` (sunoTracks array, lines 6-10)
  - Purpose: Sample music tracks played via Howler.js audio player
  - Status: Placeholder; intended for future Suno/Spotify integration (see MEMORY.md pending work)

**Social & Web:**
- Twitter/X API (future integration, not yet implemented)
  - Planned in: MEMORY.md vision document
  - Current: X logo links only (`src/components/Navbar.jsx` uses lucide-react X icon)
- Instagram (data export only, no API integration)
  - Photos: Static imports from `public/images/Instagram/media/posts/`
  - Reference in: `src/data/photos.js` (lines 9-23)
  - Status: Historical data export from Instagram, no live API pull
- Google Photos (future integration, not yet implemented)
  - Planned in MEMORY.md but not coded

**Fonts & Web Resources:**
- Google Fonts CDN
  - URL: `https://fonts.googleapis.com` + `https://fonts.gstatic.com`
  - Fonts: Inter (body, 300/400/500/600), Outfit (display, 400/600/800/900)
  - Loaded in: `index.html` (lines 25-27) with crossorigin preconnect

## Data Storage

**Databases:**
- None - This is a pure static SPA with no backend

**Client-Side State Persistence:**
- localStorage
  - `jarowe_xp` - Integer XP points for game overlay (accumulated across sessions)
  - `jarowe_visited_paths` - JSON array of visited route paths for XP rewards
  - `jarowe_cipher_state` - Cipher game state (daily/bonus mode, unlocked cards)
  - `jarowe_avatar_state` - Selected avatar photo index
  - `jarowe_mute_state` - Audio mute toggle (boolean)
  - Used in: `src/components/GameOverlay.jsx`, `src/components/DailyCipher.jsx`, `src/components/GlobalPlayer.jsx`

- sessionStorage
  - `brandCompleted` - Boolean flag to prevent re-running GSAP entrance after brand reveal
  - Used in: `src/pages/Home.jsx` (lazy initialization of useState)

**File Storage:**
- Local filesystem only (public/images/)
  - Avatar photos: `public/images/*.jpg` (family, couple, headshots)
  - Instagram exports: `public/images/Instagram/media/posts/` (historical archive)
  - Vault reward photos: `public/images/vault/*.jpg` and `public/images/vault/*.png` (11 coaster photos)
  - No cloud storage integration

**Caching:**
- Browser cache (default HTTP caching headers)
- Vite asset hashing - Static assets include content hash for cache busting
- Service Worker: Not implemented

## Authentication & Identity

**Auth Provider:**
- None - Public portfolio site, no user authentication
- Easter egg (Konami Code) - `src/components/GameOverlay.jsx` - client-side only

**Identity:**
- hardcoded avatar in `src/pages/Home.jsx` - User can select from list of photos but no account system
- No login, no user profiles, no permissions

## Monitoring & Observability

**Error Tracking:**
- None configured - Production errors not tracked to Sentry/Rollbar/etc.

**Analytics:**
- None detected - No Google Analytics, Mixpanel, or similar

**Logs:**
- Console only (browser dev tools)
- Build logs: GitHub Actions `deploy.yml` (line 32: npm run build logs to workflow output)

## CI/CD & Deployment

**Hosting:**
- **Primary:** Vercel (jarowe.com)
  - Automatic deployments from git (inferred from README.md line 36)
  - Serverless edge functions not used (pure static SPA)

- **Secondary:** GitHub Pages (jarowe.github.io/jarowe/)
  - Defined in: `.github/workflows/deploy.yml`
  - Trigger: Push to `master` branch
  - Node.js 20 build environment
  - Build step: `npm ci && npm run build` with `BASE_PATH=/jarowe/` env var
  - Deploy step: Upload `dist/` folder + copy `dist/index.html` to `dist/404.html` for SPA routing

**CI Pipeline:**
- GitHub Actions
  - Workflow file: `.github/workflows/deploy.yml`
  - Runs on: ubuntu-latest
  - Steps: checkout → setup Node 20 (cached npm) → npm ci → npm run build → configure pages → upload artifact → deploy
  - No linting or testing gates (lint task exists but not run in CI)
  - Concurrency: Single deployment at a time (`cancel-in-progress: true`)

## Environment Configuration

**Required env vars:**
- `BASE_PATH` - Deployment path prefix (set in CI for GitHub Pages, Vercel handles internally)
- No other env vars required for functionality

**Development env vars:**
- None enforced; uses Vite defaults (BASE_URL = `/` in dev, built value in prod)

**Secrets location:**
- None used - No API keys, credentials, or sensitive data in codebase
- No `.env` file (not checked into git via `.gitignore`)

## Webhooks & Callbacks

**Incoming:**
- None implemented

**Outgoing:**
- None implemented
- Future: Suno API webhook for track generation (planned in MEMORY.md)

## Browser APIs Used

**Web Audio API:**
- AudioContext in `src/utils/sounds.js`
- Used for: Real-time sine-wave tone generation (hover/click UI sounds)
- Fallback: Try/catch silently fails if context unavailable

**localStorage & sessionStorage:**
- Game state, XP tracking, visit history persistence

**ResizeObserver:**
- Globe container resizing - `src/pages/Home.jsx` (line 148)
- Detects map container size changes to adjust globe layout

**Fetch API:**
- Howler.js uses fetch internally to load audio files from SoundHelix CDN

**Canvas API:**
- canvas-confetti draws particle animations to offscreen canvas

**WebGL 2.0:**
- Three.js renderer, react-three/fiber, globe rendering

## Image Assets & CDN

**Image Paths:**
- All image imports use `import.meta.env.BASE_URL` prefix
- Examples in `src/data/photos.js`, `src/components/DailyCipher.jsx`, `src/pages/Home.jsx`
- Local assets: `public/` folder (Vite serves as `/`)

**No external image CDN:**
- All images hosted on same domain (Vercel CDN or GitHub Pages)
- Vite automatically optimizes images at build time

---

*Integration audit: 2026-02-27*
