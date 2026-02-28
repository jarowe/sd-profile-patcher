# Phase 2: Data Pipeline & Privacy - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

**Locked scope:** Phase 2 priority is real data + privacy correctness over polish: Instagram + Carbonmade only, deterministic build outputs, strict EXIF/GPS/minor protections, fail-closed validation (build fails on leaks), and a thin admin slice (ingest status + publish/hide).

<domain>
## Phase Boundary

Parse Instagram (HTML export) and Carbonmade (JSON export) into a deterministic constellation.json that drops into the existing Phase 1 scene with zero frontend changes. Privacy enforced at every layer -- build fails if anything leaks. A thin admin slice at /admin validates the pipeline/curation workflow early, de-risking Phase 4's full admin dashboard.

</domain>

<decisions>
## Implementation Decisions

### Privacy Rules & Enforcement
- **GPS redaction**: City-level (truncate to 2 decimal places, ~1.1km) for public content
- **EXIF stripping**: Strip ALL output media regardless of visibility tier
- **EXIF verification**: Post-strip re-read to assert no EXIF remains (belt and suspenders)
- **Minors policy**: First names OK, no last names, no GPS data, no school/home identifiers
- **Visibility tiers**: 3 tiers -- public / friends / private
- **Fail mode**: Build fails hard (exit code 1) if private content appears in public output. Zero tolerance.
- **Allowlist precedence**: Most restrictive rule wins. Explicit allowlist entry required to override to public.
- **Friends-tier enforcement**: All three points -- Vercel Edge Function on API routes, route guard on /constellation, signed URLs or proxy for media assets

### Source Parsing & Edge Cases
- **Instagram format**: HTML export (Download Your Information, HTML version) -- parser needs HTML scraping
- **Carbonmade format**: JSON/data export with 35 projects and 20 blog posts
- **Malformed data handling**: Required fields missing (id/date) = log warning + skip node; optional fields missing (caption/location/media) = include partial node with safe defaults. Parser never crashes entire pipeline for a single bad post.
- **Deduplication**: Within-source only (by sourceId or content hash). Cross-source = evidence edges, not merges. Merge logic deferred to later phase.

### Pipeline Output & Schema
- **Schema compatibility**: Same node/edge structure as mock-constellation.json. Drop-in replacement, zero frontend changes required.
- **Edge generation**: Evidence-based heuristic rules with citations per edge
- **Signal weight table**:
  - same-day: 0.8
  - shared-project: 0.7
  - shared-entity: 0.6
  - shared-tags: 0.4
  - temporal-proximity (<30 days): 0.3
  - Edge creation threshold: total weight >= 0.5
- **Determinism**: Fully deterministic -- seeded algorithms, sorted outputs, no timestamps in data. Same input = same output byte-for-byte.
- **Output files**: Split -- `public/data/constellation.graph.json` (nodes, edges, evidence) + `public/data/constellation.layout.json` (positions, helix params). Graph is source of truth; layout is derived.
- **Output location**: Build artifact only. Generated at build time into public/data/. NOT checked into git. Source data stays in private location.

### Thin Admin Slice
- **Scope**: Read-only pipeline status (last run, success/fail, node counts) + publish/hide toggle per node. No editing, no curation UI.
- **Route**: `/admin` with simple env-var auth gate (Phase 4 replaces with GitHub OAuth)
- **State persistence**: `curation.json` file in repo, read by build pipeline. Version-controlled, no database.
- **Node display**: Metadata table only -- title, type, date, visibility tier, publish/hide toggle. No thumbnails.

### Claude's Discretion
- HTML parsing library choice for Instagram export
- Carbonmade JSON schema mapping details
- Evidence edge algorithm implementation details beyond the weight table
- Helix layout algorithm for real data (must produce same format as mock)
- Admin UI component library/styling approach
- Build pipeline orchestration (scripts, Vite plugin, etc.)
- Error logging format and verbosity

</decisions>

<specifics>
## Specific Ideas

- Keep Phase 2 focused on deterministic ingest + privacy enforcement + thin admin status/toggles
- Defer richer admin UX/auth to Phase 4
- Instagram export is the HTML version, not JSON -- the parser will need to scrape HTML pages
- The carbonmade-archive/ directory already exists in the repo root
- constellation.graph.json and constellation.layout.json are separate concerns: graph is the semantic data, layout is the visual positioning

</specifics>

<deferred>
## Deferred Ideas

- Cross-source deduplication/merge logic -- revisit in a later phase once data patterns are clear
- Richer admin UX (curation, editing, draft inbox) -- Phase 4
- GitHub OAuth authentication -- Phase 4
- Media thumbnails in admin view -- Phase 4
- API source ingestion (Suno, SoundCloud) -- Phase 5

</deferred>

---

*Phase: 02-data-pipeline-privacy*
*Context gathered: 2026-02-28*
