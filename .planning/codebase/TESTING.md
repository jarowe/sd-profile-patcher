# Testing Patterns

**Analysis Date:** 2026-02-27

## Test Framework

**Status:** No testing framework configured

- **Test runner:** None installed (Jest, Vitest, or Cypress not in dependencies)
- **Assertion library:** None installed
- **Current coverage:** 0% - no test files exist in `/src`

**Development command:**
```bash
npm run dev       # Start Vite dev server
npm run build     # Build for production
npm run lint      # Run ESLint
```

**Note:** No test scripts defined in `package.json`. Testing infrastructure not yet implemented.

## Why No Tests Currently

The codebase is rapidly iterating on:
- Visual/interactive features (3D globe, animations, game mechanics)
- Client-side state management (localStorage-based)
- Third-party integrations (Howler.js audio, react-globe.gl, Three.js)

Testing would require:
- Mocking Web Audio API, Three.js canvas, DOM events
- Snapshot testing for complex 3D components (expensive/brittle)
- E2E tests for interaction flows (cipher guessing, animations)

## Current Testing Approach

**Manual testing only:**
- Visual regression: Browser inspection of rendered output
- Interaction: Manual clicking through game flows (cipher, speed puzzle)
- State persistence: Opening DevTools console to inspect localStorage
- Audio/3D: Real-time browser rendering verification

**Debug tools:**
- **URL parameters:** `?editor=jarowe` activates lil-gui debug UI (see `DailyCipher.jsx` lines 339-469)
- **localStorage inspection:** Manual checks via DevTools → Application tab
- **Console logging:** Prefixed logs for tracking state transitions (e.g., `[GlobeEditor]`, `[Cipher Debug]`)
- **Browser DevTools:** Network tab for asset loading, Performance tab for frame rate

**Example: DailyCipher Debug Panel** (`DailyCipher.jsx`):
```javascript
// Activated by ?editor=jarowe URL parameter
if (new URLSearchParams(window.location.search).get('editor') !== 'jarowe') return;

// Provides GUI controls for:
// - Bonus cipher count (grant/reset)
// - Vault card collection (unlock next, unlock all, clear)
// - Game state (force win, force lose, reveal word, reset daily)
// - High score reset
// - Global data reset
```

Access via: `http://localhost:5173/?editor=jarowe`

## Test Data & Fixtures

**Hardcoded test data in components:**

**Example: Word list for cipher** (`DailyCipher.jsx` lines 8-21):
```javascript
const WORDS = [
    'VAULT', 'SPACE', 'REACT', 'AUDIO', 'BUILD', 'NOISE', 'MAKER', 'GLOBE', 'CODES', 'STARS',
    'PIXEL', 'SYNTH', 'ORBIT', 'CODEC', 'PATCH', 'STACK', 'CLOUD', 'PROBE', 'BLAZE', 'SPARK',
    // ... 90 total words
];
```

**Example: Vault photos** (`DailyCipher.jsx` lines 25-37):
```javascript
const vaultPhotos = [
    { id: 0, src: `${BASE}images/vault/velocicoaster.jpg`, name: 'VelociCoaster', rar: 'Legendary' },
    { id: 1, src: `${BASE}images/vault/hulk-coaster.jpg`, name: 'Incredible Hulk', rar: 'Epic' },
    // ... 11 photos
];
```

**Example: Audio tracks** (`AudioContext.jsx` lines 6-10):
```javascript
export const sunoTracks = [
    { title: "Electric Dreams", artist: "Jarowe", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3" },
    { title: "Neon Nights", artist: "Jarowe", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3" },
    { title: "The Void Calls", artist: "Jarowe", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3" }
];
```

**Example: Game state messages** (`Home.jsx` lines 55-83):
```javascript
const worldschoolMessages = [
  { from: 'Maria', text: "Found a gluten-free bakery in Athens!! The boys lost it" },
  { from: 'Jace', text: "Dad, glaciers move like 1 inch per day. I measured." },
  // ... 16 messages
];
```

No fixtures framework; data embedded in component files.

## What Would Need Testing

If testing framework were implemented, priority areas:

**Game Logic (High Priority):**
- **Cipher word selection:** Daily word determinism based on date seed
- **Win/loss condition:** Correct guess detection, max attempts enforcement
- **Bonus cipher mechanics:** State transitions, collection unlocking, localStorage persistence
- **XP calculation:** Level progression, streak tracking, confetti triggers
- **Speed Puzzle:** Timer countdown, round generation, high score comparison

**State Management (High Priority):**
- **Audio context:** Track switching, play/pause toggle, persistence across routes
- **localStorage persistence:** State recovery after page reload, data corruption handling
- **SessionStorage for brand reveal:** First-visit detection, one-time animation

**Interactions (Medium Priority):**
- **Event handlers:** Keyboard input (arrow keys, letters, Enter for cipher)
- **3D card tilt:** Mouse position mapping to rotation angles
- **Konami code easter egg:** Key sequence detection and state updates

**Three.js Integration (Low Priority):**
- Globe rendering initialization and shader application (expensive to test)
- Particle system updates (useFrame callbacks)
- Canvas resize handling

## Recommended Testing Strategy

If implementing testing:

### Unit Tests
**Framework:** Vitest (lighter than Jest, works with Vite)

**Example structure for cipher logic:**
```javascript
// __tests__/utils/cipher.test.js
import { describe, it, expect } from 'vitest';

describe('Cipher helpers', () => {
  it('getDailyData returns consistent word for same date', () => {
    // Mock Date, verify same seed produces same word
  });

  it('getCharClasses marks correct chars', () => {
    // Test color-coding logic (correct, present, absent)
  });

  it('determines win/loss on game state change', () => {
    // Test game state transitions
  });
});
```

### Integration Tests
**Framework:** Vitest with DOM testing library

**Example for audio context:**
```javascript
// __tests__/AudioContext.test.js
import { render, screen } from '@testing-library/react';
import { AudioProvider, useAudio } from '@/context/AudioContext';

describe('AudioContext', () => {
  it('toggles play state', async () => {
    // Render component using hook, fire events, check state
  });

  it('switches tracks and updates current track', () => {
    // Test handleNext/handlePrevious
  });

  it('persists play state via localStorage', () => {
    // Mock localStorage, verify state saved
  });
});
```

### Component Tests
**Example for GameOverlay XP tracking:**
```javascript
// __tests__/GameOverlay.test.js
describe('GameOverlay', () => {
  it('loads XP from localStorage on mount', () => {
    // Mock localStorage, verify initial state
  });

  it('grants XP on new page visit', async () => {
    // Mock useLocation, verify addXp called
  });

  it('triggers level-up confetti at thresholds', () => {
    // Mock confetti, verify called on level change
  });
});
```

### E2E Tests
**Framework:** Playwright or Cypress

**Critical flows:**
```javascript
// e2e/cipher.spec.js
describe('Daily Cipher Flow', () => {
  it('should allow user to guess and win', () => {
    cy.visit('/');
    cy.get('[data-testid=cipher-input]').type('VAULT');
    cy.get('[data-testid=submit]').click();
    cy.contains('ACCESS GRANTED').should('be.visible');
    cy.contains('NEW RELIC ACQUIRED').should('be.visible');
  });
});

// e2e/audio.spec.js
describe('Audio persistence across routes', () => {
  it('should persist playing music when navigating', () => {
    cy.visit('/');
    cy.get('[data-testid=play-btn]').click();
    cy.visit('/garden');
    cy.get('[data-testid=global-player]').should('be.visible');
    cy.get('[data-testid=current-track]').should('contain', 'Electric Dreams');
  });
});
```

## Mock Patterns (When Implemented)

**Web Audio API:**
```javascript
// Mock in test setup
vi.stubGlobal('AudioContext', class MockAudioContext {
  createOscillator() { return { type: '', frequency: { value: 0 }, connect: () => this, start: () => {}, stop: () => {} }; }
  createGain() { return { gain: { value: 0, exponentialRampToValueAtTime: () => {} }, connect: () => this }; }
  get destination() { return {}; }
});
```

**localStorage:**
```javascript
const localStorageMock = {
  getItem: vi.fn((key) => mockStore[key]),
  setItem: vi.fn((key, value) => { mockStore[key] = value; }),
  removeItem: vi.fn((key) => { delete mockStore[key]; }),
  clear: vi.fn(() => { mockStore = {}; })
};
vi.stubGlobal('localStorage', localStorageMock);
```

**Three.js useFrame:**
```javascript
// Disable frame loop in tests
vi.mock('@react-three/fiber', async () => {
  const actual = await vi.importActual('@react-three/fiber');
  return {
    ...actual,
    useFrame: vi.fn(() => {})  // No-op
  };
});
```

## Testing Challenges & Considerations

**Three.js Complexity:**
- Globe component (`Home.jsx`) is massive (3472 lines)
- Involves custom shaders, dynamic geometry, particle systems
- Canvas-based rendering difficult to assert on
- **Recommendation:** Test shader generation and parameter passing separately from visual output

**Animation Brittleness:**
- Framer Motion, GSAP animations hard to test reliably
- useFrame callbacks run in game loop, not testable without mocking entire renderer
- **Recommendation:** Test animation triggers/parameters, not visual animation itself

**localStorage Dependency:**
- Heavy reliance on localStorage for state persistence
- **Recommendation:** Mock localStorage, test serialization/deserialization

**Audio Context Browser Restrictions:**
- Web Audio API requires user interaction to initialize
- **Recommendation:** Mock AudioContext entirely; test frequency/gain parameters, not actual sound

**Async State Updates:**
- Components load data from localStorage on mount
- Image textures load asynchronously
- **Recommendation:** Use `async` test patterns, `act()` wrapper for state updates

## Coverage Targets (If Implemented)

**Priority areas to target first:**
- Game logic: 80%+ (cipher rules, XP calculation, win conditions)
- State/Context: 75%+ (localStorage, audio state, routing)
- Utilities: 90%+ (sounds.js, globeDefaults.js)

**Lower priority (expensive/brittle):**
- Three.js rendering: 20-30% (unit test shader params, not output)
- Animation logic: 40% (test triggers, not visual output)
- Component integration: 50% (too tightly coupled to Canvas/Three.js)

---

*Testing analysis: 2026-02-27*

**Next Steps to Implement Testing:**

1. Install Vitest + @testing-library/react
2. Configure Vitest in `vite.config.js`
3. Create `__tests__` directory structure mirroring `/src`
4. Start with cipher game logic (highest ROI)
5. Add localStorage mocking utility
6. Gradually expand to context, utilities, then components
7. Skip Three.js rendering tests (not cost-effective)
