# The JAROWE Constellation

## What This Is

A living, data-woven personal website for Jared Rowe (jarowe.com) that serves as "life in webform" — two experiences in one site. A **Bento Hub** acts as a dynamic dashboard showing the pulse of Jared's life at a glance. A **Constellation** is a cinematic, explorable 3D graph where every node is a real moment (project, post, place, person, idea) and every connection is evidence-based. The site is powered by real social media data, ingested automatically, curated through an admin dashboard, and designed to be playful, experiential, and constantly evolving.

## Core Value

The Constellation must render real life data as an explorable, evidence-connected 3D experience — every node real, every connection justified, every visit a discovery.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. Existing site capabilities. -->

- ✓ Interactive 3D globe with real-time sun, day/night shader, clouds, atmosphere, lens flare, satellites — existing
- ✓ Bento grid home page with hero, music player, globe, cipher, social links — existing
- ✓ Global music player with Howler.js, persists across page navigation — existing
- ✓ XP/gamification system with level-ups, confetti, Konami code easter egg — existing
- ✓ Daily Cipher (Wordle-clone) with vault visual integration and roller coaster photo rewards — existing
- ✓ Universe page with 3D starfield, orbiting nodes, discovery counter — existing
- ✓ Garden page with card grid and full-screen modal overlay — existing
- ✓ Workshop, Patcher, Beamy, Starseed project pages — existing
- ✓ Now page with glass panels — existing
- ✓ Vault and Favorites pages — existing
- ✓ Web Audio API sine tone sound effects (hover, click) — existing
- ✓ Lazy loading for heavy 3D components — existing
- ✓ Dual deployment: Vercel (primary) + GitHub Pages (secondary) — existing

### Active

<!-- Current scope. Building toward these. Hypotheses until shipped and validated. -->

**Constellation Core**
- [ ] Build-time pipeline: parse exports → normalize → enrich → connect → layout → emit JSON
- [ ] Canonical node/edge schema with 11 node types and 9 edge types
- [ ] Evidence-based edge generation with signal weights and pruning rules
- [ ] Double-helix 3D layout algorithm with epoch clustering and seeded stability
- [ ] R3F constellation scene: instanced nodes, connection lines, hover/click interaction
- [ ] Detail panel with media, text, entity chips, and "Because..." meaning lens
- [ ] Timeline scrubber moving camera along helix with epoch transitions
- [ ] Scripted narrator engine: 5-tier event-driven narration (epoch, node, connection, discovery, idle)
- [ ] Guided tour (~90 seconds, cinematic, skippable, anchor nodes with narration beats)
- [ ] Ambient sound bed + interaction sounds + optional audio-reactive rendering
- [ ] Discovery tracking with XP integration (reuse existing GameOverlay system)
- [ ] Constellation modes: "Life" / "Work" / "Ideas" (filter + edge weight + narration tone)
- [ ] Path memory: faint glowing trail of visitor's journey
- [ ] 2D library fallback: searchable node index for accessibility

**Data Pipeline (Hybrid: API + Export + Scheduled)**
- [ ] Instagram parser for existing 276-file export
- [ ] Carbonmade archive parser for 35 projects + 20 blog posts + milestones
- [ ] Suno music auto-ingest: pull from profile, draft inbox, curate + publish
- [ ] Nightly scheduled ingest from connected platforms (cron via Vercel)
- [ ] On-demand "Pull Latest Now" button in admin dashboard
- [ ] Official API integrations where available, export-based fallback otherwise
- [ ] Schema validation + privacy enforcement at build time (fails on private leaks)

**Admin Dashboard**
- [ ] Authentication (owner-only access)
- [ ] Curation UI: publish/hide/highlight nodes, manage tour anchors
- [ ] Draft inbox: new auto-ingested content lands here for review before publish
- [ ] Narration text editing
- [ ] Allowlist management for people/names appearing publicly
- [ ] Garden and Now page content editing
- [ ] Music track management: curate, add metadata (mood, era, story), publish to player + constellation

**Privacy (Non-Negotiable)**
- [ ] Visibility tiers: public / private / redacted / friends
- [ ] Minors policy: no legal names, no home/school identifiers, no exact GPS/EXIF, curated allowlist before publish
- [ ] DMs, contact graphs, close friends lists: always private
- [ ] GPS redaction: city-level for public, exact only for friends
- [ ] People: public allowlist only, otherwise "Friend" / "Family" / "Collaborator"
- [ ] Build-time validation script fails if private content appears in public output

**Bento Hub Enhancement**
- [ ] Dynamic cells pulling from constellation data (latest moments, projects, music)
- [ ] Existing pages wired into constellation data system
- [ ] Polish and connect existing pages (Globe, Garden, Vault, Workshop, Now, Universe)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Live AI narrator (Gemini/LLM) — deferred to future milestone; scripted narrator first for reliability and control
- Facebook/X/LinkedIn/Google Photos parsers — deferred until first milestone proves the pipeline with Instagram + Carbonmade
- Multiplayer / real-time visitor presence — complexity explosion, not core to personal storytelling
- Mobile native app — web-first, responsive design covers mobile
- OAuth social login for visitors — site is public; only owner needs auth for admin
- Web Speech API TTS narrator voice — polish feature for later
- Lyria RealTime (live AI music generation) — experimental, defer to future exploration
- OS-themed portfolio (desktop simulator) — doesn't fit the constellation metaphor

## Context

**Existing codebase**: Vite 7 + React 19 + React Router 7 SPA with R3F, drei, postprocessing, GSAP, Framer Motion, Howler.js, canvas-confetti. Custom globe shader system using globeMaterial prop. XP gamification layer. Music persists across navigation via AudioProvider context.

**Data sources available now**: Instagram data export (276 files with posts, media, GPS, tagged users, reels, locations), Carbonmade archive (35 projects, 20 blog posts, career history as structured JSON), Suno AI music tracks.

**Consultation**: Extensive vision documents from Gemini research phase and consultant spec defining the constellation architecture, data model, privacy rules, layout algorithm, narrator engine, and ticket-based execution plan.

**Deployment**: Vercel (primary, jarowe.com) with serverless functions for admin/API. GitHub Pages (secondary, jarowe.github.io/jarowe/) for static fallback.

**Philosophy**: "The medium IS the message." The site itself demonstrates who Jared is — experience designer, innovator, technologist, storyteller, father, worldschooler. Not a resume. A playable, discoverable universe of real moments. "The language of the universe is excitement and the purpose is the balance we become."

## Constraints

- **Stack**: Must build on existing Vite 7 + React 19 + R3F stack — no framework migration
- **Deployment**: Vercel full-stack for primary (serverless functions, KV/Blob storage for admin + pipeline). GitHub Pages remains as static fallback (loses admin/API features)
- **Performance**: Constellation must render 150+ instanced nodes at 60fps on desktop; graceful degradation on mobile (no ChromaticAberration, simplified effects)
- **Privacy**: Minors protected by hard policy. Build-time validation enforced. No private data leaks to public output.
- **No regressions**: All existing pages (Home, Workshop, Vault, Garden, Now, Universe, etc.) must continue to work
- **API limits**: Platform APIs have rate limits. Nightly ingest + on-demand refresh must respect them. Export-based fallback when APIs are unavailable.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Two-mode site (Bento Hub + Constellation) | Hub provides accessible dashboard; constellation provides deep experiential exploration | — Pending |
| Build-time truth + runtime cinema | Keeps site fast, predictable, safe. Realness lives in deterministic build outputs. | — Pending |
| Vercel full-stack for backend | Serverless functions for API ingest, admin auth, cron jobs. No separate infra to manage. | — Pending |
| Hybrid pipeline (API + export + scheduled) | Nightly auto-ingest for "living" behavior, on-demand for immediate updates, export fallback for reliability | — Pending |
| Scripted narrator first (no live LLM) | Reliability and control. LLM narrator deferred to future milestone after scripted system proves the interaction model. | — Pending |
| Instagram + Carbonmade first | Highest data quality available now. Proves pipeline end-to-end before adding more platforms. | — Pending |
| Music auto-ingest with draft inbox | Tracks appear automatically but are curated before publish. Published tracks become constellation nodes. | — Pending |
| Privacy-first with curation layer | Allowlists, hide lists, overrides, highlights. True without being exposed. Build fails on leaks. | — Pending |

---
*Last updated: 2026-02-27 after initialization*
