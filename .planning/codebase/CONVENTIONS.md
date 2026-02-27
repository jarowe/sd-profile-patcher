# Coding Conventions

**Analysis Date:** 2026-02-27

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `DailyCipher.jsx`, `GlobalPlayer.jsx`, `AudioContext.jsx`)
- CSS: kebab-case corresponding to component (e.g., `DailyCipher.css`, `GlobalPlayer.css`)
- Utility functions: camelCase (e.g., `sounds.js`, `photos.js`, `globeDefaults.js`)
- Pages: PascalCase in `/pages` directory (e.g., `Home.jsx`, `Garden.jsx`, `UniversePage.jsx`)

**Functions:**
- Regular functions: camelCase (e.g., `playClickSound`, `togglePlay`, `handleNext`, `getDailyData`)
- React hooks: camelCase starting with `use` (e.g., `useAudio`, `useGSAP`, `useFrame`)
- Event handlers: `handle` prefix in camelCase (e.g., `handleKeyDown`, `handleWin`, `handleNext`, `handlePrevious`)
- Callbacks: camelCase with descriptive name (e.g., `startBonusCipher`, `finishBonusCipher`, `generateRound`)

**Variables:**
- State variables: camelCase (e.g., `isPlaying`, `currentTrack`, `gameState`, `unlockedCards`)
- Constants (module-level): UPPER_SNAKE_CASE (e.g., `WORD_LENGTH`, `MAX_GUESSES`, `GAME_DURATION`, `COLORS`)
- Object/array data: camelCase (e.g., `sunoTracks`, `vaultPhotos`, `expeditions`, `arcsData`)
- DOM refs: camelCase ending with `Ref` (e.g., `globeRef`, `heroCardRef`, `heroCardRef`)

**Types:**
- No TypeScript - JSX/JavaScript only
- Used PropTypes (installed but minimal enforcement) in some components

## Code Style

**Formatting:**
- No Prettier config found - code follows consistent 2-space indentation
- Line length: varies, but typically under 120 characters
- Semicolons used throughout
- Trailing commas in multiline objects/arrays observed

**Linting:**
- ESLint 9.39.1 with flat config
- Config file: `eslint.config.js`
- Plugins: `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- Key rule: `no-unused-vars` ignores uppercase-starting variables (e.g., `API_KEY`, `Fragment`)
- No explicit error/warning levels - using defaults
- Build target: ES2020, JSX enabled

**Comments Style:**
- JSDoc sparse; minimal documentation comments
- Inline comments explain complex logic (e.g., solar position math in `Home.jsx`, cipher word selection)
- Debug comments with editor mode checks (e.g., `?editor=jarowe` URL parameter gates debug UI)

## Import Organization

**Order:**
1. React and core hooks first (e.g., `import { useState, useEffect } from 'react'`)
2. External libraries (e.g., `framer-motion`, `lucide-react`, `gsap`, `three`)
3. Three.js and react-three packages (e.g., `@react-three/fiber`, `@react-three/drei`)
4. Relative imports - context, utils, components (e.g., `from '../context/AudioContext'`)
5. CSS imports last (e.g., `import './DailyCipher.css'`)

**Path Aliases:**
- No aliases configured; all imports use relative paths (`../`)
- Environment-based assets use `import.meta.env.BASE_URL` for path resolution
- Pattern: `const BASE = import.meta.env.BASE_URL; src={${BASE}images/vault/...}`

**Example from `DailyCipher.jsx`:**
```javascript
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Lock, Unlock, Zap, X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { playClickSound, playHoverSound } from '../utils/sounds';
import './DailyCipher.css';
```

## Error Handling

**Patterns:**
- Try-catch blocks used for Web Audio API calls (graceful failure if context suspended)
- Error logs with context prefix: `console.error('[GlobeEditor] Load failed:', e)`
- Missing/null checks with early returns (e.g., `if (!soundRef.current) return`)
- Fallback values for localStorage: `parseInt(localStorage.getItem(...) || '0', 10)`

**Example from `sounds.js`:**
```javascript
export const playClickSound = () => {
    if (isMuted) return;
    try {
        const c = getCtx();
        if (c.state === 'suspended') {
            c.resume();
        }
        // ... audio setup
    } catch (e) { }  // Silent catch, no logging
};
```

**Example from `Home.jsx`:**
```javascript
console.warn('Globe init error:', e);
```

## Logging

**Framework:** `console` methods (no logger library)

**Patterns:**
- `console.log()`: Informational; used in debug panels and editor mode checks
- `console.warn()`: Non-critical issues (e.g., missing globe presets)
- `console.error()`: Critical failures (e.g., API failures, load errors)
- Contextual prefixes in brackets: `[Cipher Debug]`, `[GlobeEditor]`, `[GlobeEditor]`

**When to Log:**
- Debug UI panels: prefix with `?editor=jarowe` URL parameter check
- Error recovery: log on fallback behavior
- Rarely in production paths; console calls mostly isolated to editor/debug code

**Example from `DailyCipher.jsx` (debug panel):**
```javascript
gameFolder.add({ fn: () => {
    const w = debugActionsRef.current.activeWord;
    console.log('[Cipher Debug] Active word:', w);
    alert('Active word: ' + w);
}}, 'fn').name('Reveal Word');
```

## Comments

**When to Comment:**
- Complex mathematical logic: Solar declination, degree-to-radians, vector normalization (in `Home.jsx`)
- Non-obvious state management: Bonus cipher state transitions (in `DailyCipher.jsx`)
- Three.js coordinate system notes: `// Must match three-globe polar2Cartesian`
- Inline flags: `// Hide on home page - MusicCell handles it there` (in `GlobalPlayer.jsx`)

**Comment Format:**
- Single-line: `// Comment`
- Multi-line explanations above code blocks
- No JSDoc for components (minimal prop documentation)

**Example from `Home.jsx`:**
```javascript
// Real-time sun position based on UTC time (solar declination + hour angle)
// Uses three-globe's coordinate system: theta = (90 - lng), so lng=0 → +Z
// overrideHour: -1 = real time, 0-24 = manual UTC hour
function getSunDirection(overrideHour) {
```

## Function Design

**Size:**
- Typical functions: 5-40 lines
- Complex components: can reach 100+ lines (e.g., `DailyCipher.jsx` at 678 lines total)
- Extracted helpers for reusable logic (e.g., `getCharClasses`, `getDailyData`)

**Parameters:**
- Functions accept 0-3 parameters; complex state passed via context or component state
- Callbacks destructured from hooks: `const { isPlaying, currentTrack, togglePlay } = useAudio()`
- Event handlers receive event object: `const handleKeyDown = (e) => { ... }`

**Return Values:**
- Components return JSX (motion.div, Fragment, null for conditional rendering)
- Utilities return primitives or objects (e.g., `{ word, cardIndex }`)
- No explicit undefined returns; early returns used for guards

**Example from `GameOverlay.jsx`:**
```javascript
const addXp = useCallback((amount, reason) => {
    setXp(prev => {
        const newXp = prev + amount;
        localStorage.setItem('jarowe_xp', newXp.toString());
        // ... complex logic
        return newXp;
    });
}, []);
```

## Module Design

**Exports:**
- Most files export single component: `export default function Component() { ... }`
- Context files export both provider and hook: `export function AudioProvider` and `export const useAudio`
- Data/utilities export multiple named exports: `export const sunoTracks = [...]` and `export const playClickSound = () => {}`

**Barrel Files:**
- Not used; each component imports from source file
- Data consolidated in `/data` (e.g., `photos.js` for image metadata)
- Utilities grouped in `/utils` (e.g., `sounds.js`, `globeDefaults.js`)

**Example of dual export from `AudioContext.jsx`:**
```javascript
export const sunoTracks = [...];

export function AudioProvider({ children }) { ... }

export const useAudio = () => useContext(AudioContext);
```

## State Management

**Pattern:**
- Local component state: `useState` for UI state (phase, guesses, selections)
- Context API: `AudioContext.jsx` for global audio playback across routes
- localStorage: Persistence for game state, user progress, preferences
  - XP: `jarowe_xp`
  - Cipher state: `dailyCipher`, `jarowe_bonus_cipher_state`
  - Collection: `jarowe_collection`
  - Visited paths: `jarowe_visited_paths`
  - High scores: `jarowe_speed_highscore`
  - Bonus ciphers: `jarowe_bonus_ciphers`

**Refs:**
- Used for DOM manipulation: `heroCardRef` for 3D card tilt calculations
- Used to preserve values across renders: `brandCompleted` ref in Home, `dailyStateRef` in DailyCipher
- useFrame refs for Three.js mesh references

## CSS & Styling

**Pattern:**
- Utility classes in global `index.css`: `.glass-panel`, `.text-gradient`, `.btn-primary`, `.back-link`
- Component-specific CSS in co-located files (e.g., `DailyCipher.css` alongside `DailyCipher.jsx`)
- CSS variables for theming in `:root` (e.g., `--accent-primary: #7c3aed`, `--bg-dark: #050505`)
- BEM-inspired naming: `.cipher-cell`, `.cipher-row`, `.terminal-header`

**Animation:**
- Framer Motion for React component animations: `motion.div`, `AnimatePresence`
- GSAP for complex timeline animations (but removed from Home to prevent black screen bugs)
- CSS transitions for simple hover states
- Three.js useFrame for continuous 3D rotations

## Async Patterns

**Promises:**
- `.then()` chains for async UI actions
- `async/await` used in API checks (e.g., `checkSpotify()` in `MusicCell.jsx`)

**Callbacks:**
- `useCallback` for event handlers to prevent unnecessary re-renders
- Memoized refs for closures capturing state

**Example from `DailyCipher.jsx`:**
```javascript
const startBonusCipher = useCallback(() => {
    playClickSound();
    // ... state updates
}, [bonusAvailable, guesses, gameState]);
```

---

*Convention analysis: 2026-02-27*
