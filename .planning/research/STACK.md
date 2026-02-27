# Stack Research

**Domain:** Data-driven interactive personal website with 3D constellation visualization
**Researched:** 2026-02-27
**Confidence:** HIGH

## Executive Summary

This stack analysis focuses on **adding** data pipeline, admin dashboard, scheduled ingestion, and performant 3D constellation capabilities to an existing Vite 7 + React 19 + R3F + drei + GSAP + Howler.js site. Research prioritizes Vercel-native solutions to minimize infrastructure complexity, type-safe data transformation with runtime validation, and proven 3D performance patterns for instanced rendering at 60fps with 150+ nodes.

**Key Finding:** Vercel's serverless ecosystem (Functions, Blob, Cron) combined with Auth.js v5, Zod validation, and troika-three-text for performant 3D labels provides a cohesive, zero-infrastructure stack that extends the existing React 19 + R3F foundation without framework migration.

## Recommended Stack

### Backend & Infrastructure

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Vercel Functions** | Platform native | Serverless API endpoints for data ingestion, admin operations | Zero configuration on Vercel. Auto-scales. 10-second execution limit on Hobby (sufficient for API calls), 60s on Pro. Serverless-first architecture matches current deployment. |
| **Vercel Cron Jobs** | Platform native | Nightly scheduled data ingestion | Native cron support via `vercel.json`. Hobby plan: 2 jobs, 1/day. Pro: unlimited, custom schedules. Uses `CRON_SECRET` auth pattern for security. |
| **Vercel Blob** | `@vercel/blob@2.3.0` | File storage for media assets, parsed data outputs | 5TB file support, multi-part uploads, client-direct uploads (bypasses 4.5MB serverless limit). Replaces need for S3. Auto-scales, CDN-backed. |
| **Vercel Edge Config** | Platform native | Feature flags, admin allowlists, privacy tier configs | 5MB global key-value store. <5ms read latency (99% <15ms). Update from dashboard without redeployment. Perfect for allowlists, highlights, tour anchor configs. |

**Why NOT Vercel KV/Postgres:**
- Vercel KV is **sunset** as of 2026. Marketplace alternatives (Upstash Redis) exist but add complexity.
- Vercel Postgres has severe **cold start** issues (100-200ms) and connection limits in serverless context.
- **Alternative:** Store constellation JSON in Blob, use Edge Config for lightweight flags/lists. No database needed for build-time-generated static data.

### Authentication & Security

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Auth.js (NextAuth v5)** | `next-auth@5.x` | Owner-only admin authentication | Serverless-first architecture. Auto-infers `AUTH_*` env vars on Vercel. Supports JWT sessions (stateless, no DB). Preview deployment support via `redirectProxyUrl`. Industry standard for Next.js/Vercel auth. |
| **CRON_SECRET pattern** | Built-in | Authenticate cron job requests | Vercel's official pattern: `Authorization: Bearer ${process.env.CRON_SECRET}` header on scheduled functions. Prevents external triggering. |

**Why NOT OAuth social login for visitors:**
- Site is public. Only owner needs auth for admin dashboard.
- Auth.js supports GitHub/Google OAuth providers for owner login.

### Data Pipeline & Validation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Zod** | `zod@3.24.x` | Schema validation for parsed social media data | 40M+ weekly downloads (Feb 2026). TypeScript-first with automatic type inference (`z.infer<>`). Runtime validation prevents malformed data from breaking builds. Use `.parse()` for fail-fast, `.safeParse()` for graceful errors. |
| **Node.js native JSON** | Built-in | Parse Instagram/Carbonmade exports | Instagram exports are JSON. No external library needed. Use `JSON.parse()` with try/catch, validate with Zod schemas. |
| **date-fns** | `date-fns@4.x` | Timestamp normalization and epoch clustering | Lightweight (tree-shakeable). Handles ISO 8601 parsing, timezone-aware comparisons for epoch grouping. Better than Moment.js (deprecated). |

**Data Pipeline Pattern:**
```typescript
// Build-time script (Node.js)
1. Parse exports → JSON.parse()
2. Validate → zod schemas (fail build on invalid data)
3. Normalize → canonical node/edge schema
4. Enrich → add metadata, privacy tiers
5. Connect → evidence-based edge generation
6. Layout → 3D coordinates (custom double-helix algorithm)
7. Emit → constellation.json to Blob or /public
```

**Why NOT external parsers (Apify, ScrapingBee):**
- User already has Instagram **export** (276 files). No scraping needed.
- Carbonmade archive is structured JSON.
- Build-time parsing is deterministic and free.

### 3D Constellation Rendering

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **React Three Fiber** | `@react-three/fiber@9.5.0` | 3D scene orchestration (already installed) | Already in use. R3F reconciler enables React patterns for Three.js. Instanced rendering via `<instancedMesh>` reduces draw calls by 90%+. 150 nodes = single draw call. |
| **drei** | `@react-three/drei@10.7.7` | R3F helper components (already installed) | Already in use. Provides `<Instances>`, `<OrbitControls>`, `<Html>` for detail panels, `<Detailed>` for LOD (30-40% perf gain in large scenes). |
| **troika-three-text** | `troika-three-text@0.53.x` | Performant 3D text labels for nodes | SDF-based rendering. Web worker for font parsing/glyph layout (prevents main thread jank). Supports Three.js materials (lighting, fog). Drei's `<Text>` uses troika under the hood but adds React overhead. Use troika directly for instanced labels. |
| **three-spritetext** | `three-spritetext@1.9.x` | Fallback for simpler text labels | Canvas2D-based sprites. Simpler than troika but less flexible. Use for non-instanced labels (detail panel, UI overlays). |
| **maath** | `maath@0.10.8` | Math utilities for R3F (already installed) | Already in use. Provides easing, interpolation, noise for camera animations and particle effects. |

**3D Performance Strategy:**
- **Instanced rendering:** Single `<instancedMesh>` for all 150+ nodes. Each node type (project, post, place, etc.) = 1 geometry, 1 material, 1 draw call.
- **LOD (Level of Detail):** Use drei's `<Detailed>` to show simplified geometry when zoomed out, full detail when close.
- **Text labels:** Show labels only for hovered/selected nodes or nearby nodes (distance culling). Use troika-three-text for SDF rendering.
- **Connection lines:** Use `THREE.Line` with instanced positions. Prune low-weight edges (only show meaningful connections).
- **Frame budget:** Target <100 draw calls for 60fps. R3F Perf tool (`r3f-perf@7.x`) for monitoring.

**Why NOT react-force-graph or d3-force-3d:**
- `react-force-graph` uses physics-based layout. User wants **deterministic** double-helix layout (stable on rebuild).
- `d3-force-3d` is for force-directed graphs. User's layout is **custom** (epoch clustering along helix).
- User has full control with R3F + custom layout algorithm.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@vercel/blob** | `2.3.0` | Blob storage SDK | Upload parsed constellation JSON, media assets. Use `put()` for serverless functions, client upload tokens for large files (>4.5MB). |
| **@edge-config/client** | Latest | Read Edge Config in serverless functions | Access allowlists, feature flags, tour anchor configs from serverless functions. <5ms reads. |
| **date-fns** | `4.x` | Date utilities | Parse ISO 8601 timestamps, cluster nodes by epoch (year/month), calculate time deltas for edge weights. |
| **clsx** | `2.1.1` (already installed) | Conditional CSS classes | Already installed. Use for admin dashboard UI, detail panel styling. |
| **r3f-perf** | `7.x` | R3F performance monitoring (dev only) | Dev tool to monitor draw calls, frame rate, memory. Remove from production builds. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **TypeScript** | Type safety for data pipeline and constellation schema | Add `typescript@5.x` and `@types/node@22.x`. Define canonical `Node` and `Edge` types. Zod schemas provide runtime validation. |
| **Vercel CLI** | Local development with serverless functions | `vercel dev` runs Functions, Cron, Blob locally. Test admin dashboard auth before deployment. |
| **ESLint + Prettier** | Code quality | ESLint already configured. Add Prettier for consistent formatting. |

## Installation

```bash
# Backend & Infrastructure (Vercel platform features require no install)

# Authentication
npm install next-auth@beta  # Auth.js v5 (still in beta as "next-auth@beta")

# Data Pipeline & Validation
npm install zod@^3.24 date-fns@^4

# 3D Constellation Rendering
npm install troika-three-text@^0.53 three-spritetext@^1.9

# Vercel SDKs
npm install @vercel/blob@^2.3 @edge-config/client@latest

# TypeScript (for build scripts)
npm install -D typescript@^5 @types/node@^22

# Performance monitoring (dev only)
npm install -D r3f-perf@^7
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Vercel Functions** | AWS Lambda + API Gateway | If already using AWS infrastructure or need >60s execution time (Pro limit). Adds complexity. |
| **Vercel Blob** | AWS S3 + CloudFront | If need >5TB files or existing S3 workflows. Requires separate credentials, CORS config. |
| **Auth.js v5** | Clerk, Auth0, Supabase Auth | If need multi-user roles, team management, or user directory. Overkill for single-owner admin. |
| **Zod** | Yup, Joi, io-ts | Yup is React-focused (form validation). Joi is older. io-ts has steeper learning curve. Zod has best TypeScript DX in 2026. |
| **troika-three-text** | drei `<Text>`, `three-bmfont-text` | Drei `<Text>` uses troika but adds React overhead (not ideal for instanced labels). `three-bmfont-text` requires pre-generated bitmap fonts (inflexible). |
| **Custom layout algorithm** | react-force-graph, d3-force-3d | If want physics-based force-directed layout instead of deterministic double-helix. User wants **stable, reproducible** layout. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Vercel KV** | Sunset in 2026. Marketplace alternatives exist (Upstash Redis) but add complexity. | Vercel Blob for data, Edge Config for flags/lists |
| **Vercel Postgres** | Cold start issues (100-200ms), connection limits in serverless. | Blob storage for static constellation JSON. No DB needed for build-time-generated data. |
| **Moment.js** | Deprecated. Large bundle size (67KB). | `date-fns` (tree-shakeable, actively maintained) |
| **react-force-graph** | Physics-based layout (non-deterministic). User wants stable double-helix. | Custom layout algorithm + R3F instanced rendering |
| **NextAuth v4** | Deprecated. v5 (Auth.js) is current. | Auth.js v5 (`next-auth@beta` on npm) |
| **Separate backend (Express, Fastify)** | Adds infrastructure complexity. Vercel Functions provide API endpoints. | Vercel Functions (serverless, auto-scaling) |
| **CMS (Contentful, Sanity)** | Overkill for single-owner curation. User wants custom admin dashboard. | Custom admin UI + Vercel Blob for storage |

## Stack Patterns by Variant

**If deploying to GitHub Pages (secondary, static fallback):**
- Admin dashboard and API features unavailable (no serverless functions).
- Pre-build constellation JSON and commit to repo.
- Edge Config, Cron, Auth.js do not work on static hosting.
- Use Vercel deployment as primary for full feature set.

**If data ingestion fails (API rate limits, auth issues):**
- Graceful degradation: show last successful build's constellation.
- Store fallback `constellation-snapshot.json` in repo.
- Admin dashboard shows "Last updated: X days ago" warning.

**If constellation has <50 nodes (early stage):**
- Skip instanced rendering. Use individual `<mesh>` components.
- Instancing overhead not worth it for small node counts.
- Switch to `<instancedMesh>` when approaching 100+ nodes.

**If mobile performance issues:**
- Disable postprocessing effects (ChromaticAberration, Bloom).
- Reduce particle count (stars/dust).
- Use `<Detailed>` LOD with simpler geometry for distant nodes.
- Hide connection lines on mobile (draw call reduction).

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| **React 19.2.0** | R3F 9.5.0, drei 10.7.7 | R3F 9.x fully supports React 19. No issues. |
| **Three.js 0.183.1** | R3F 9.5.0, drei 10.7.7, troika-three-text 0.53.x | drei is tested against latest Three.js. troika uses Three.js materials (compatible). |
| **Auth.js v5** | Next.js 14+ or standalone React | Works with Vite + React Router. Use manual setup (not Next.js adapter). Requires custom `/api/auth/*` routes in Vercel Functions. |
| **Zod 3.24.x** | TypeScript 5.x | Requires TS 5.0+ for best type inference. Works with Node.js 18+. |
| **Vercel Functions** | Node.js 20.x | User's repo uses Node 20 (`.github/workflows/deploy.yml`). Compatible. |
| **troika-three-text 0.53.x** | Three.js 0.150+ | Compatible with Three.js 0.183.1. Uses web workers (requires CORS-safe bundler config). |

## Architecture Notes

### Data Pipeline Flow
```
[Instagram Export] + [Carbonmade JSON] + [Suno API]
  ↓ (Vercel Cron nightly or on-demand button)
[Serverless Function: /api/ingest]
  ↓ (Parse, validate with Zod)
[Normalize to canonical schema]
  ↓ (Privacy filter, allowlist check)
[Connect nodes (evidence-based edges)]
  ↓ (Double-helix layout algorithm)
[constellation.json] → Vercel Blob
  ↓ (Edge Config: updated_at timestamp)
[Constellation page fetches JSON, renders R3F scene]
```

### Admin Dashboard Flow
```
[Owner visits /admin]
  ↓ (Auth.js v5 OAuth login)
[Admin UI: Draft inbox, curation tools]
  ↓ (Hide/highlight nodes, edit narration)
[Serverless Function: /api/admin/publish]
  ↓ (Update constellation.json in Blob)
[Edge Config: allowlists, tour anchors, feature flags]
```

### 3D Rendering Strategy
```
[Constellation JSON from Blob]
  ↓ (Parse nodes/edges)
[Group by node type (11 types)]
  ↓ (Create instancedMesh per type)
[Position instances via layout coords]
  ↓ (Single draw call per node type)
[Connection lines via THREE.Line]
  ↓ (Instanced positions, pruned low-weight edges)
[troika-three-text labels]
  ↓ (Show on hover/selection, distance culling)
[60fps @ 150+ nodes]
```

## Privacy & Security Architecture

**Build-time validation:**
- Zod schema enforces `visibility: "public" | "private" | "redacted" | "friends"` on all nodes.
- Build script fails if `visibility: "private"` nodes appear in public constellation JSON.
- Minors policy: `isMinor: boolean` flag. If true, enforce name redaction, GPS city-level only.

**Edge Config allowlists:**
- `public_people`: Array of legal names allowed in public nodes.
- `tour_anchors`: Node IDs for guided tour beats.
- `highlights`: Node IDs to feature in Bento Hub.

**CRON_SECRET authentication:**
- Nightly cron jobs use `Authorization: Bearer ${CRON_SECRET}` header.
- Prevent external triggering of data ingestion endpoints.

**Auth.js JWT sessions:**
- Stateless sessions (no DB). Owner login via GitHub OAuth.
- Admin routes protected: `if (!session) return 401`.

## Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| **FPS (desktop)** | 60fps stable | Instanced rendering, <100 draw calls, LOD for distant nodes |
| **FPS (mobile)** | 30fps acceptable | Disable postprocessing, reduce particles, hide connection lines |
| **Time to Interactive (TTI)** | <3s on fast 3G | Lazy load constellation scene, preload JSON, code-split admin dashboard |
| **Constellation load time** | <500ms | constellation.json from Blob (CDN-backed), gzip compression |
| **Admin dashboard auth** | <1s OAuth flow | JWT sessions (stateless), Edge Config for allowlists (<5ms reads) |
| **Cron job execution** | <10s (Hobby), <60s (Pro) | Batch API calls, parallel parsing, fail gracefully on timeout |

## Sources

### Vercel Platform
- [Vercel Functions](https://vercel.com/docs/functions) — Serverless function documentation (HIGH confidence)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs) — Scheduled jobs setup guide (HIGH confidence)
- [Vercel Blob](https://vercel.com/docs/vercel-blob) — Blob storage API reference (HIGH confidence)
- [Vercel Edge Config](https://vercel.com/docs/edge-config) — Edge Config feature flags (HIGH confidence)
- [Vercel KV Sunset](https://vercel.com/docs/storage) — KV product deprecation notice (HIGH confidence)
- [Vercel Postgres Challenges](https://kuberns.com/blogs/post/vercel-app-guide/) — Serverless database limitations (MEDIUM confidence)

### Authentication
- [Auth.js Deployment](https://authjs.dev/getting-started/deployment) — Official v5 deployment guide (HIGH confidence)
- [NextAuth.js Serverless](https://strapi.io/blog/nextauth-js-secure-authentication-next-js-guide) — 2025 guide (MEDIUM confidence)

### Data Pipeline
- [Zod Documentation](https://zod.dev/) — Official schema validation docs (HIGH confidence)
- [Data Normalization TypeScript](https://oneuptime.com/blog/post/2026-01-30-data-pipeline-normalization/view) — 2026 guide (MEDIUM confidence)
- [Instagram Export Parsing](https://github.com/michabirklbauer/instagram_json_viewer) — JSON parser example (MEDIUM confidence)

### 3D Rendering
- [React Three Fiber Performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance) — Official performance guide (HIGH confidence)
- [troika-three-text](https://protectwise.github.io/troika/troika-three-text/) — Official documentation (HIGH confidence)
- [drei Text Component](https://github.com/pmndrs/drei) — drei component library (HIGH confidence)
- [Instanced Rendering Three.js](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/) — 2025 performance guide (MEDIUM confidence)

### Graph Layout
- [Force-Directed 3D Algorithms](https://github.com/vasturiano/d3-force-3d) — d3-force-3d library (HIGH confidence)
- [React Force Graph](https://github.com/vasturiano/react-force-graph) — React graph visualization (MEDIUM confidence)

---
*Stack research for: JAROWE Constellation — Data pipeline, admin dashboard, scheduled ingestion, and performant 3D constellation*
*Researched: 2026-02-27*
