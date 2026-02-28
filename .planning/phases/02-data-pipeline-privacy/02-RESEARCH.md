# Phase 2: Data Pipeline & Privacy - Research

**Researched:** 2026-02-28
**Domain:** Build-time data pipeline (Instagram HTML + Carbonmade JSON parsing), privacy enforcement, EXIF stripping, deterministic graph output, thin admin UI
**Confidence:** HIGH (for core stack), MEDIUM (for Instagram HTML format details)

## Summary

Phase 2 builds a Node.js build-time pipeline that ingests two data sources (Instagram HTML export and Carbonmade JSON archive), normalizes them into a canonical schema matching `mock-constellation.json`, generates evidence-based edges using a weighted signal system, computes helix layout positions, and emits deterministic JSON output files. Privacy is enforced at every layer with EXIF stripping, GPS truncation, minors protection, visibility tiers, and a fail-closed build validation step.

The Carbonmade data is already well-structured JSON (35 projects, 31 blog posts, about/experience/awards metadata) residing in `carbonmade-archive/`. The Instagram data is an HTML export ("Download Your Information" HTML version) that will require HTML parsing with defensive null-safe traversal. The existing `mock-constellation.json` schema (158 nodes, 209 edges, 5 epochs) provides the exact target output format -- the pipeline must produce a drop-in replacement.

A thin admin slice at `/admin` provides read-only pipeline status and publish/hide toggles backed by a version-controlled `curation.json` file, de-risking the full Phase 4 admin dashboard.

**Primary recommendation:** Use `cheerio` for Instagram HTML parsing, `sharp` for EXIF stripping + image processing, `exifr` for post-strip EXIF verification, and plain Node.js scripts (run via `npm run pipeline`) for the build-time pipeline. Output to `public/data/constellation.graph.json` + `public/data/constellation.layout.json`. Add `/admin` route with simple env-var auth.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **GPS redaction**: City-level (truncate to 2 decimal places, ~1.1km) for public content
- **EXIF stripping**: Strip ALL output media regardless of visibility tier
- **EXIF verification**: Post-strip re-read to assert no EXIF remains (belt and suspenders)
- **Minors policy**: First names OK, no last names, no GPS data, no school/home identifiers
- **Visibility tiers**: 3 tiers -- public / friends / private
- **Fail mode**: Build fails hard (exit code 1) if private content appears in public output. Zero tolerance.
- **Allowlist precedence**: Most restrictive rule wins. Explicit allowlist entry required to override to public.
- **Friends-tier enforcement**: All three points -- Vercel Edge Function on API routes, route guard on /constellation, signed URLs or proxy for media assets
- **Instagram format**: HTML export (Download Your Information, HTML version) -- parser needs HTML scraping
- **Carbonmade format**: JSON/data export with 35 projects and 20 blog posts
- **Malformed data handling**: Required fields missing (id/date) = log warning + skip node; optional fields missing (caption/location/media) = include partial node with safe defaults. Parser never crashes entire pipeline for a single bad post.
- **Deduplication**: Within-source only (by sourceId or content hash). Cross-source = evidence edges, not merges.
- **Schema compatibility**: Same node/edge structure as mock-constellation.json. Drop-in replacement, zero frontend changes required.
- **Edge generation**: Evidence-based heuristic rules with citations per edge
- **Signal weight table**: same-day: 0.8, shared-project: 0.7, shared-entity: 0.6, shared-tags: 0.4, temporal-proximity (<30 days): 0.3, threshold >= 0.5
- **Determinism**: Fully deterministic -- seeded algorithms, sorted outputs, no timestamps in data. Same input = same output byte-for-byte.
- **Output files**: Split -- `public/data/constellation.graph.json` (nodes, edges, evidence) + `public/data/constellation.layout.json` (positions, helix params). Graph is source of truth; layout is derived.
- **Output location**: Build artifact only. Generated at build time into public/data/. NOT checked into git. Source data stays in private location.
- **Thin admin scope**: Read-only pipeline status (last run, success/fail, node counts) + publish/hide toggle per node. No editing, no curation UI.
- **Admin route**: `/admin` with simple env-var auth gate (Phase 4 replaces with GitHub OAuth)
- **Admin state**: `curation.json` file in repo, read by build pipeline. Version-controlled, no database.
- **Admin node display**: Metadata table only -- title, type, date, visibility tier, publish/hide toggle. No thumbnails.

### Claude's Discretion
- HTML parsing library choice for Instagram export
- Carbonmade JSON schema mapping details
- Evidence edge algorithm implementation details beyond the weight table
- Helix layout algorithm for real data (must produce same format as mock)
- Admin UI component library/styling approach
- Build pipeline orchestration (scripts, Vite plugin, etc.)
- Error logging format and verbosity

### Deferred Ideas (OUT OF SCOPE)
- Cross-source deduplication/merge logic -- revisit in a later phase once data patterns are clear
- Richer admin UX (curation, editing, draft inbox) -- Phase 4
- GitHub OAuth authentication -- Phase 4
- Media thumbnails in admin view -- Phase 4
- API source ingestion (Suno, SoundCloud) -- Phase 5
</user_constraints>

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| cheerio | ^1.0 | Instagram HTML parsing | jQuery-like API, fast, well-maintained, uses parse5 for spec-compliant parsing. Most popular Node.js HTML parser (26M+ weekly downloads). Handles malformed HTML gracefully. |
| sharp | ^0.33 | EXIF stripping + image processing | Default behavior strips ALL metadata (EXIF, ICC, XMP, IPTC). Native libvips binding = fast. Can also resize/convert images if needed later. |
| exifr | ^7.1 | Post-strip EXIF verification | Fastest JS EXIF reader, can detect EXIF presence without reading full file. Pure JS, no native deps. Used for the "belt and suspenders" verification step. |
| seedrandom | ^3.0 | Deterministic PRNG | Battle-tested seeded random for deterministic output. The project already has a mulberry32 implementation in helixLayout.js -- can reuse or use seedrandom for consistency. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| glob | ^11.0 | File discovery for Instagram media | Find all HTML/image files in Instagram export directory |
| ajv | ^8.17 | JSON schema validation | Validate pipeline output against constellation schema. Fail-closed validation. |
| date-fns | ^4.1 | Date parsing/manipulation | Parse various date formats from Instagram/Carbonmade, temporal proximity calculations |

### Already in Project (reuse)

| Library | Purpose in Pipeline |
|---------|-------------------|
| zustand | Admin page state (already in project) |
| lucide-react | Admin UI icons (already in project) |
| react-router-dom | Admin route `/admin` (already in project) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| cheerio | node-html-parser | Faster benchmarks but less mature API, fewer edge case handlers. Cheerio's jQuery-like API is more familiar and better documented. |
| cheerio | jsdom | Full DOM implementation = heavy (50MB+ deps). Overkill for parsing static HTML exports. |
| sharp | piexifjs | piexifjs only handles JPEG EXIF, not PNG/GIF. Sharp handles all image formats and strips all metadata types. |
| exifr | exif-parser | exif-parser is JPEG-only. exifr supports JPEG, HEIC, TIFF, and more. |
| ajv | zod | Zod is great for runtime validation but ajv is better for JSON Schema validation of output files. |

**Installation:**
```bash
npm install -D cheerio sharp exifr glob ajv date-fns
```

Note: These are dev dependencies because they're only used in the build-time pipeline script, not in the browser-facing React app.

## Architecture Patterns

### Recommended Project Structure
```
pipeline/                          # Build-time pipeline (Node.js scripts)
  parsers/
    instagram.mjs                  # Instagram HTML parser
    carbonmade.mjs                 # Carbonmade JSON parser
  privacy/
    exif-stripper.mjs              # EXIF stripping + verification
    gps-redactor.mjs               # GPS truncation to 2 decimal places
    minors-guard.mjs               # Minors policy enforcement
    visibility.mjs                 # Visibility tier assignment + allowlist
  edges/
    edge-generator.mjs             # Evidence-based edge creation
    signals.mjs                    # Signal weight calculations
  layout/
    helix.mjs                      # Double-helix layout (reuse/adapt existing)
  validation/
    schema-validator.mjs           # JSON Schema validation of output
    privacy-audit.mjs              # Fail-closed privacy scan of final output
  curation/
    curation-reader.mjs            # Read curation.json for publish/hide state
  index.mjs                        # Pipeline orchestrator (main entry point)

curation.json                      # Publish/hide state per node (version-controlled)
allowlist.json                     # People allowlist for public visibility

src/pages/
  Admin.jsx                        # Thin admin page
  Admin.css

public/data/                       # Generated at build time (NOT in git)
  constellation.graph.json         # Nodes, edges, evidence
  constellation.layout.json        # Helix positions
```

### Pattern 1: Pipeline-as-Script (not Vite plugin)

**What:** The pipeline runs as a standalone Node.js script (`node pipeline/index.mjs`) invoked before `vite build`, not as a Vite plugin.

**When to use:** Always. Build-time data processing that reads files from disk, processes images, and writes JSON output files. This is fundamentally a Node.js script, not a bundler concern.

**Why:** Vite plugins are for transforming source code during bundling. The data pipeline reads external data sources, processes images, runs privacy validation, and emits static JSON. Keeping it as a standalone script means:
- Can be run independently for testing/debugging
- No coupling to Vite's build lifecycle
- Clearer error reporting (process.exit(1) for privacy failures)
- Can be invoked from CI, admin panel, or manually

**Example:**
```json
// package.json scripts
{
  "scripts": {
    "pipeline": "node pipeline/index.mjs",
    "prebuild": "node pipeline/index.mjs",
    "build": "vite build",
    "dev": "vite"
  }
}
```

### Pattern 2: Source Data Location Convention

**What:** Source data lives in a private directory NOT served by Vite's dev server and NOT checked into git (except Carbonmade which is already in repo).

**When to use:** Always for Instagram data. Carbonmade is already committed.

**Structure:**
```
data-private/                      # Gitignored. Only on build machine.
  instagram/                       # Instagram HTML export
    your_instagram_activity/
      content/
        posts_1.html               # Posts HTML files
        ...
      media/
        images/                    # Original photos (with EXIF)
        videos/
    ...

carbonmade-archive/                # Already in repo (JSON + images)
  manifest.json
  about/about.json
  blog/blog.json
  projects/
    01-*/project.json
    ...
```

### Pattern 3: Canonical Node Schema

**What:** Both parsers normalize to a single canonical node schema that matches the existing `mock-constellation.json` structure.

**Example:**
```javascript
// Canonical node schema (matches mock-constellation.json)
const canonicalNode = {
  id: "ig-001",                    // Source prefix + incremental ID
  type: "moment",                  // milestone | person | moment | idea | project | place
  title: "Beach Day with Family",  // Short title
  date: "2023-07-15",             // ISO date string
  epoch: "Present",               // Epoch label
  description: "...",             // Caption/description text
  media: [],                      // Array of media URLs (processed, EXIF-stripped)
  connections: [],                // Populated after edge generation
  size: 0.8,                      // Node visual size (0.5-2.0)
  isHub: false,                   // Hub nodes are visually prominent

  // Extended fields for pipeline (not in mock but compatible)
  source: "instagram",            // Data source identifier
  sourceId: "ig_post_12345",      // Original source ID for dedup
  visibility: "public",           // public | friends | private
  entities: {                     // Extracted entities for edge generation
    people: ["Jace"],
    places: ["Orlando, FL"],
    tags: ["family", "beach"],
    clients: [],
    projects: []
  },
  location: {                     // GPS data (truncated for public)
    city: "Orlando",
    state: "FL",
    lat: 28.54,                   // Truncated to 2 decimal places
    lng: -81.38                   // Truncated to 2 decimal places
  }
};
```

### Pattern 4: Evidence Edge Schema

**What:** Edges follow the existing mock schema but are generated algorithmically with weight calculations.

**Example:**
```javascript
const edge = {
  source: "ig-001",
  target: "cm-005",
  weight: 0.8,                    // Combined signal weight
  evidence: [
    {
      type: "temporal",           // temporal | person | place | tag | project
      signal: "same_day",         // Specific signal type
      description: "Both from July 15, 2023",
      weight: 0.8                 // Individual signal contribution
    }
  ]
};
```

### Pattern 5: Fail-Closed Privacy Validation

**What:** The final pipeline step scans the complete output JSON for privacy violations. Any violation causes `process.exit(1)`.

**Checks:**
1. No private-tier nodes in output
2. No GPS coordinates with >2 decimal places on public nodes
3. No full names of minors (checked against minors list)
4. No DM content, contact graphs, or close friends lists
5. No school/home identifiers for minors
6. All media files have been EXIF-stripped (re-read and verify)

### Anti-Patterns to Avoid
- **Streaming Instagram HTML**: Don't use SAX/streaming parsers (htmlparser2) for Instagram export. The files are small enough to load entirely and the DOM-query approach (cheerio) is much simpler for extracting structured data.
- **Runtime privacy filtering**: Don't filter private content at render time. The pipeline must produce clean output. Privacy is a build-time concern, not a runtime concern (for public tier).
- **Timestamps in output**: Don't include build timestamps, "generated at" dates, or any non-deterministic data in output files. This breaks byte-for-byte determinism.
- **Non-seeded randomness**: Never use `Math.random()` in the pipeline. Use seeded PRNG (mulberry32 or seedrandom) for any randomized operation.
- **Mutating Carbonmade archive**: Never write to or modify files in `carbonmade-archive/`. It's a read-only data source.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| EXIF stripping | Manual binary header parsing | `sharp` with default settings | EXIF has dozens of formats (EXIF, XMP, IPTC, ICC). Sharp handles all of them via libvips. |
| EXIF verification | Custom binary readers | `exifr` probe | Exifr can detect EXIF presence in any image format without reading the full file. |
| HTML parsing | Regex on HTML | `cheerio` | HTML is not regular. Instagram exports may have malformed HTML. Cheerio handles edge cases. |
| Date parsing | Custom date parsers | `date-fns` `parse()` | Instagram dates come in various formats ("Jun 15, 2022", ISO strings, timestamps). date-fns handles locale-aware parsing. |
| JSON Schema validation | Manual field checking | `ajv` compile + validate | Schema validation catches structural issues the planner can't anticipate. |
| Seeded PRNG | Custom implementation | Reuse `mulberry32` from `helixLayout.js` | Already battle-tested in the project. Extract to shared utility. |
| File globbing | Manual `fs.readdir` recursion | `glob` | Handles symlinks, permissions, platform differences. |

**Key insight:** The privacy enforcement chain (strip -> verify -> validate) must use battle-tested libraries because a single missed EXIF tag or GPS coordinate is a privacy leak. Hand-rolling any part of this chain introduces risk.

## Common Pitfalls

### Pitfall 1: Instagram HTML Format Instability
**What goes wrong:** Instagram changes their HTML export format between versions. The parser breaks silently, producing empty/partial data.
**Why it happens:** Instagram's "Download Your Information" HTML format has no versioning or schema contract. The DOM structure, class names, and element nesting change without notice.
**How to avoid:**
- Build the parser defensively with null-safe traversal (`?.` chains)
- Log every unknown/unexpected element encountered
- Validate parsed output (minimum expected fields per post)
- Include the Instagram export date in pipeline metadata for debugging
- Never crash the pipeline for a single malformed post -- log + skip
**Warning signs:** Sudden drop in parsed node count, empty media arrays, missing dates.

### Pitfall 2: EXIF Stripping That Doesn't Actually Strip
**What goes wrong:** Some image formats (HEIC, WebP, PNG) have metadata in non-EXIF locations (XMP, IPTC). Stripping "EXIF" doesn't remove all metadata.
**Why it happens:** EXIF is just one metadata standard. Images can contain GPS data in XMP tags, IPTC fields, or ICC profiles.
**How to avoid:**
- Use `sharp` with default settings (strips ALL metadata, not just EXIF)
- Post-strip verification with `exifr` that checks for ANY metadata presence
- Fail the build if any output image still has GPS coordinates
**Warning signs:** `exifr.parse()` returns non-null GPS data after stripping.

### Pitfall 3: Non-Deterministic Output
**What goes wrong:** Same input produces different output bytes on different runs. Breaks caching and makes diffs meaningless.
**Why it happens:** Object key ordering, Map iteration order, `Date.now()` calls, `Math.random()`, or OS-dependent file ordering.
**How to avoid:**
- Sort ALL arrays before serialization (nodes by ID, edges by source+target)
- Use `JSON.stringify(data, null, 2)` with sorted keys
- Never include timestamps in output
- Use seeded PRNG for any randomized operation
- Use sorted file globbing (glob results are platform-dependent order)
- Verify determinism: run pipeline twice, `diff` the outputs
**Warning signs:** Git diffs on output files that show only reordering.

### Pitfall 4: GPS Truncation Precision
**What goes wrong:** JavaScript floating point produces coordinates like `28.540000000000003` instead of `28.54`.
**Why it happens:** IEEE 754 floating-point arithmetic.
**How to avoid:**
- Use `Number(lat.toFixed(2))` to truncate AND remove trailing precision artifacts
- Validate in privacy audit: regex `/^\-?\d+\.\d{1,2}$/` on stringified coordinates
**Warning signs:** Coordinates with >2 decimal places in output JSON.

### Pitfall 5: Sharp Native Binary Issues
**What goes wrong:** `sharp` fails to install or crashes at runtime because native bindings don't match the platform.
**Why it happens:** Sharp uses native libvips bindings that must match the OS/arch.
**How to avoid:**
- Pin sharp version in package.json
- Test pipeline on the deployment platform (Vercel)
- Note: Vercel's build environment supports sharp natively
- Add sharp to `devDependencies` (build-time only, not bundled for browser)
**Warning signs:** `Error: Could not load the "sharp" module` during build.

### Pitfall 6: Data Loading in Frontend After Migration
**What goes wrong:** Changing from static `import mockData from '...'` to runtime `fetch('/data/constellation.graph.json')` breaks all 7 components that import the mock.
**Why it happens:** Static JSON imports are bundled at compile time. Dynamic fetch is async. All components need to handle the loading/error states.
**How to avoid:**
- Create a data loader module that provides the same interface as the mock import
- Initially, keep the static import as fallback
- Phase 2 should produce files that can be EITHER imported statically OR fetched dynamically
- Recommendation: Keep the static import path working during Phase 2. The constellation page can `fetch()` the real data files if they exist, falling back to mock data if not. This preserves dev experience.
**Warning signs:** All 7 constellation components show "undefined" data.

## Code Examples

### Instagram HTML Parser (Defensive Pattern)
```javascript
// Source: pattern based on cheerio docs + Instagram export analysis
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

/**
 * Parse a single Instagram HTML post file.
 * Defensive: never crashes, returns null for unparseable posts.
 */
function parseInstagramPost($, postElement) {
  try {
    // These selectors WILL need adjustment based on actual export format
    // Instagram HTML exports use simple div structures
    const title = $(postElement).find('[class*="title"], h2, h3').first().text()?.trim() || '';
    const caption = $(postElement).find('[class*="caption"], [class*="content"] > div').first().text()?.trim() || '';
    const dateText = $(postElement).find('time, [class*="date"], [class*="timestamp"]').first().text()?.trim()
                  || $(postElement).find('time').attr('datetime') || '';

    // Media: look for img/video elements
    const media = [];
    $(postElement).find('img[src], video source[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (src && !src.includes('profile_pic')) {
        media.push(src);
      }
    });

    // Location
    const locationText = $(postElement).find('[class*="location"]').first().text()?.trim() || null;

    // Required: must have at least a date to be valid
    if (!dateText) {
      console.warn('[instagram-parser] Post missing date, skipping');
      return null;
    }

    return { caption, dateText, media, locationText, title };
  } catch (err) {
    console.warn('[instagram-parser] Failed to parse post:', err.message);
    return null;
  }
}
```

### EXIF Strip + Verify Pattern
```javascript
// Source: sharp docs (default metadata stripping) + exifr docs
import sharp from 'sharp';
import * as exifr from 'exifr';
import fs from 'fs/promises';
import path from 'path';

/**
 * Strip ALL metadata from an image and verify removal.
 * Returns path to cleaned image.
 * Throws if verification fails (fail-closed).
 */
async function stripAndVerify(inputPath, outputPath) {
  // Step 1: Sharp strips all metadata by default
  await sharp(inputPath)
    .toFile(outputPath);

  // Step 2: Verify no EXIF remains (belt and suspenders)
  const outputBuffer = await fs.readFile(outputPath);
  const exifData = await exifr.parse(outputBuffer, {
    gps: true,         // Check for GPS specifically
    tiff: true,        // Check TIFF/EXIF
    xmp: true,         // Check XMP
    iptc: true,        // Check IPTC
    icc: false         // ICC profile is OK (color management)
  });

  if (exifData) {
    // Check specifically for GPS data
    if (exifData.latitude || exifData.longitude || exifData.GPSLatitude || exifData.GPSLongitude) {
      throw new Error(
        `PRIVACY VIOLATION: GPS data survived stripping in ${path.basename(inputPath)}. ` +
        `lat=${exifData.latitude}, lng=${exifData.longitude}`
      );
    }
    // Log but don't fail for non-GPS metadata (some benign data may survive)
    console.warn(`[exif-verify] Non-GPS metadata found in ${path.basename(outputPath)}:`,
      Object.keys(exifData).join(', '));
  }

  return outputPath;
}
```

### GPS Truncation
```javascript
/**
 * Truncate GPS coordinates to city-level (2 decimal places).
 * Returns null for private/minors content.
 */
function redactGPS(lat, lng, visibility, isMinor) {
  if (isMinor) return null;  // Minors: no GPS at all
  if (visibility === 'private') return null;

  if (lat == null || lng == null) return null;

  return {
    lat: Number(Number(lat).toFixed(2)),
    lng: Number(Number(lng).toFixed(2))
  };
}
```

### Evidence Edge Generation
```javascript
/**
 * Signal weight constants (from user decisions).
 */
const SIGNAL_WEIGHTS = {
  'same-day':           0.8,
  'shared-project':     0.7,
  'shared-entity':      0.6,
  'shared-tags':        0.4,
  'temporal-proximity': 0.3,
};
const EDGE_THRESHOLD = 0.5;

/**
 * Generate evidence-based edges between nodes.
 * Deterministic: sorted input, sorted output, no randomness.
 */
function generateEdges(nodes) {
  const edges = [];
  const sortedNodes = [...nodes].sort((a, b) => a.id.localeCompare(b.id));

  for (let i = 0; i < sortedNodes.length; i++) {
    for (let j = i + 1; j < sortedNodes.length; j++) {
      const a = sortedNodes[i];
      const b = sortedNodes[j];
      const evidence = [];

      // Same-day signal
      if (a.date === b.date) {
        evidence.push({
          type: 'temporal',
          signal: 'same_day',
          description: `Both from ${a.date}`,
          weight: SIGNAL_WEIGHTS['same-day']
        });
      }

      // Shared entity signal (people, places)
      const sharedPeople = intersect(a.entities?.people, b.entities?.people);
      if (sharedPeople.length > 0) {
        evidence.push({
          type: 'person',
          signal: 'shared_entity',
          description: `Both mention ${sharedPeople.join(', ')}`,
          weight: SIGNAL_WEIGHTS['shared-entity']
        });
      }

      // Shared tags signal
      const sharedTags = intersect(a.entities?.tags, b.entities?.tags);
      if (sharedTags.length > 0) {
        evidence.push({
          type: 'tag',
          signal: 'shared_tags',
          description: `Shared tags: ${sharedTags.join(', ')}`,
          weight: SIGNAL_WEIGHTS['shared-tags']
        });
      }

      // Temporal proximity (<30 days)
      const daysDiff = Math.abs(daysBetween(a.date, b.date));
      if (daysDiff > 0 && daysDiff <= 30) {
        evidence.push({
          type: 'temporal',
          signal: 'temporal_proximity',
          description: `${daysDiff} days apart`,
          weight: SIGNAL_WEIGHTS['temporal-proximity']
        });
      }

      // Calculate total weight
      const totalWeight = evidence.reduce((sum, e) => sum + e.weight, 0);

      if (totalWeight >= EDGE_THRESHOLD) {
        edges.push({
          source: a.id,
          target: b.id,
          weight: Number(totalWeight.toFixed(2)),
          evidence
        });
      }
    }
  }

  // Sort for determinism
  return edges.sort((a, b) =>
    a.source.localeCompare(b.source) || a.target.localeCompare(b.target)
  );
}

function intersect(a = [], b = []) {
  const setB = new Set(b.map(s => s?.toLowerCase()));
  return (a || []).filter(x => setB.has(x?.toLowerCase()));
}
```

### Fail-Closed Privacy Audit
```javascript
/**
 * Final privacy audit of the complete output.
 * Returns array of violations. Build should fail if non-empty.
 */
function auditPrivacy(graph, config) {
  const violations = [];

  for (const node of graph.nodes) {
    // Check: no private nodes in output
    if (node.visibility === 'private') {
      violations.push(`PRIVATE node "${node.id}" present in output`);
    }

    // Check: GPS precision
    if (node.location?.lat != null) {
      const latStr = String(node.location.lat);
      const lngStr = String(node.location.lng);
      const latDecimals = (latStr.split('.')[1] || '').length;
      const lngDecimals = (lngStr.split('.')[1] || '').length;

      if (latDecimals > 2 || lngDecimals > 2) {
        violations.push(
          `GPS too precise on "${node.id}": ${node.location.lat}, ${node.location.lng}`
        );
      }
    }

    // Check: minors protection
    if (config.minors?.includes(node.id) || node._isMinor) {
      if (node.location?.lat != null) {
        violations.push(`Minor node "${node.id}" has GPS data`);
      }
      // Check for last names, school, home identifiers
      const text = `${node.title} ${node.description}`.toLowerCase();
      for (const pattern of config.minorBlockedPatterns || []) {
        if (text.includes(pattern.toLowerCase())) {
          violations.push(
            `Minor node "${node.id}" contains blocked pattern: "${pattern}"`
          );
        }
      }
    }
  }

  // Check: no DM content, contact graphs
  // (These should never make it through the parser, but belt-and-suspenders)
  const outputStr = JSON.stringify(graph);
  const dmPatterns = ['direct_messages', 'close_friends', 'contact_graph'];
  for (const pattern of dmPatterns) {
    if (outputStr.toLowerCase().includes(pattern)) {
      violations.push(`Output contains blocked pattern: "${pattern}"`);
    }
  }

  return violations;
}
```

### Deterministic JSON Serialization
```javascript
/**
 * Serialize data to deterministic JSON.
 * Object keys are sorted, arrays are pre-sorted by caller.
 */
function deterministicStringify(data) {
  return JSON.stringify(data, (key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value).sort().reduce((sorted, k) => {
        sorted[k] = value[k];
        return sorted;
      }, {});
    }
    return value;
  }, 2);
}
```

### Admin Auth Gate
```javascript
// src/pages/Admin.jsx -- env-var auth pattern
import { useState } from 'react';

function AdminAuthGate({ children }) {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState('');

  // In production, VITE_ADMIN_KEY is set in Vercel env vars
  // In dev, set in .env.local (gitignored)
  const adminKey = import.meta.env.VITE_ADMIN_KEY;

  if (!adminKey) {
    return <div>Admin disabled (no VITE_ADMIN_KEY set)</div>;
  }

  if (authed) return children;

  return (
    <div style={{ padding: '2rem', maxWidth: 400, margin: '0 auto' }}>
      <h2>Admin Access</h2>
      <input
        type="password"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Enter admin key"
        onKeyDown={e => {
          if (e.key === 'Enter' && input === adminKey) setAuthed(true);
        }}
      />
      <button onClick={() => input === adminKey && setAuthed(true)}>
        Enter
      </button>
    </div>
  );
}
```

## Carbonmade Data Analysis

The Carbonmade archive is already in the repo at `carbonmade-archive/` with well-structured JSON.

### Available Data (Confidence: HIGH -- directly examined)

**Projects (35 total):** Each `projects/XX-Name/project.json` contains:
- `id`: String numeric ID (e.g. "7151472")
- `name` / `title`: Project name
- `description`: Project description text
- `role`: Creator's role (e.g. "Director & Lead Animator")
- `for`: Client name (e.g. "Sony PlayStation")
- `date`: Year string (e.g. "2019")
- `type`: Project type description
- `texts[]`: Array of `{type, text}` objects (paragraph, quote, caption)
- `imageCount`: Number of images
- `videoStreams[]`: HLS video URLs (carbon-media CDN)
- `imageUrls[]`: Image URLs (carbon-media CDN)
- Local `images/` and `videos/` folders with downloaded copies

**Blog Posts (31 total):** `blog/blog.json` contains `{posts: [{text, date}]}`. Date format: "Month DD, YYYY" (e.g. "June 15, 2022"). Text is the blog post content.

**About/Profile:** `about/about.json` contains:
- Personal info: name, title, location, biography
- Experience: Array of `{role, company, details, description}`
- Education, awards, exhibitions
- Clients list: ["Google", "Disney", "Sony PlayStation", ...]
- Skills and specialties

**Manifest:** `manifest.json` contains full site metadata including project count.

### Mapping Strategy
- Each project becomes a "project" type node
- Blog posts become "moment" or "idea" type nodes
- Experience entries become "milestone" type nodes
- Client names become entity references for edge generation
- Collaborator names mentioned in descriptions (e.g. "Jeff Halalay", "Derek Alan Rowe") become entity references

## Instagram HTML Export Format

### Known Structure (Confidence: MEDIUM -- based on community documentation, not direct examination)

Instagram's "Download Your Information" HTML export typically contains:
```
your_instagram_activity/
  content/
    posts_1.html              # Posts with captions, dates
    reels.html                # Reels
    stories.html              # Stories
  media/
    posts/
      YYYYMM/                # Organized by year-month
        image_001.jpg
        video_001.mp4
    stories/
      YYYYMM/
        ...
  ...
```

### HTML Structure Pattern
Each post in the HTML files is typically rendered as a `<div>` containing:
- Caption text
- Creation timestamp (datetime attribute on `<time>` element or text content)
- Media file references (relative `<img src="...">` or `<video>` tags)
- Location name (if tagged)
- Tagged users (if any)

### Critical Caveat
The exact HTML structure MUST be determined by examining the actual export files. The parser should:
1. Start with a discovery phase that logs the actual DOM structure
2. Adapt selectors based on what's found
3. Fall back gracefully when expected elements aren't present

### Recommendation for Parser Development
Build the parser in three steps:
1. **Discovery:** Write a script that loads a sample HTML file and logs its structure (tag names, class names, nesting depth). This informs the selector strategy.
2. **Extraction:** Write cheerio selectors based on discovered structure.
3. **Validation:** Count parsed posts vs expected (276 files mentioned in PIPE-01). Log warnings for any posts that fail to parse.

## Output Schema (Drop-in Replacement)

### constellation.graph.json
```json
{
  "nodes": [
    {
      "id": "ig-001",
      "type": "moment",
      "title": "Beach Day",
      "date": "2023-07-15",
      "epoch": "Present",
      "description": "...",
      "media": ["/data/media/ig-001-1.jpg"],
      "connections": ["ig-002", "cm-005"],
      "size": 0.8,
      "isHub": false,
      "source": "instagram",
      "visibility": "public",
      "entities": { ... }
    }
  ],
  "edges": [
    {
      "source": "ig-001",
      "target": "cm-005",
      "weight": 0.8,
      "evidence": [{ ... }]
    }
  ],
  "epochs": [
    { "id": "early-years", "label": "Early Years", "range": "2001-2007", "color": "#fbbf24" }
  ]
}
```

### constellation.layout.json
```json
{
  "positions": {
    "ig-001": { "x": 12.5, "y": 35.2, "z": -8.1 },
    "cm-005": { "x": -5.3, "y": 40.7, "z": 22.4 }
  },
  "helixParams": {
    "radius": 30,
    "pitch": 5,
    "epochGap": 15,
    "jitterRadius": 2,
    "seed": 42
  },
  "bounds": {
    "minY": 0,
    "maxY": 180
  }
}
```

### Frontend Data Loading Strategy
Currently, 7 components import `mock-constellation.json` directly:
- `ConstellationCanvas.jsx`
- `NodeCloud.jsx`
- `ConnectionLines.jsx`
- `HoverLabel.jsx`
- `DetailPanel.jsx`
- `TimelineScrubber.jsx`
- `ListView.jsx`

**Recommendation:** Create a `src/constellation/data/loader.js` module that:
1. Attempts to `fetch('/data/constellation.graph.json')` at runtime
2. Falls back to the mock data import if fetch fails (dev mode, no pipeline run)
3. Merges layout positions from `constellation.layout.json`
4. Exposes the same data shape all 7 components expect
5. All 7 components switch from direct import to using the loader

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sharp v0.32 `withMetadata(false)` | Sharp v0.33+ default strips metadata | 2024 | No explicit call needed -- default behavior is what we want |
| Cheerio v0.22 (callback API) | Cheerio v1.0 (ESM, promises) | 2024 | Use ESM imports, modern API |
| Instagram JSON export | Instagram HTML export | 2024-2025 | Must parse HTML, not JSON. HTML format is the current default. |
| `fs.glob` (Node 22+) | `glob` npm package | Current | Node's built-in glob is very new. Use npm `glob` for compatibility. |

## Open Questions

1. **Instagram Export Actual DOM Structure**
   - What we know: HTML export uses `your_instagram_activity/content/` folder structure, posts in HTML files with media in `media/` subfolder
   - What's unclear: Exact CSS class names, nesting structure, how location/tagged-people are encoded in the HTML DOM
   - Recommendation: First pipeline task should be a "discovery" script that loads a sample file and logs structure. Build selectors based on actual structure. **The user needs to provide their Instagram export or a sample HTML file.**

2. **Instagram Media File Organization**
   - What we know: Media organized by `YYYYMM/` folders
   - What's unclear: How HTML file references map to media file paths (relative? absolute? encoded?)
   - Recommendation: Build media path resolver that handles multiple reference formats

3. **Epoch Assignment for Real Data**
   - What we know: Mock data uses 5 epochs ("Early Years", "College", "Career Start", "Growth", "Present") with date ranges
   - What's unclear: Whether the same epoch boundaries make sense for real Instagram/Carbonmade data spanning 2001-2026
   - Recommendation: Make epoch boundaries configurable in a `pipeline-config.json`. Start with Carbonmade experience dates as epoch markers.

4. **Carbonmade CDN Image Availability**
   - What we know: project.json files reference `carbon-media.accelerator.net` URLs for images/videos
   - What's unclear: Whether these CDN URLs are still live or have expired
   - Recommendation: Pipeline should attempt to download referenced images and fall back to local `images/` directory copies. Log warnings for unavailable URLs.

5. **Sharp on Vercel Build**
   - What we know: Sharp works on Vercel (official documentation confirms it). Sharp is a dev dependency used only at build time.
   - What's unclear: Whether Vercel's build environment pre-installs sharp binaries
   - Recommendation: Test pipeline in CI early. Have a fallback plan using a lighter EXIF library if sharp causes build issues.

## Sources

### Primary (HIGH confidence)
- Carbonmade archive files directly examined: `carbonmade-archive/manifest.json`, `about/about.json`, `blog/blog.json`, `projects/*/project.json`
- Mock constellation schema directly examined: `src/constellation/data/mock-constellation.json` (158 nodes, 209 edges, 5 epochs)
- Existing helix layout directly examined: `src/constellation/layout/helixLayout.js`
- Constellation store directly examined: `src/constellation/store.js`
- [Sharp output API docs](https://sharp.pixelplumbing.com/api-output/) -- metadata stripping defaults
- [Cheerio official docs](https://cheerio.js.org/docs/basics/loading/) -- loading and parsing API

### Secondary (MEDIUM confidence)
- [ScrapeOps HTML Parser Comparison](https://scrapeops.io/nodejs-web-scraping-playbook/best-nodejs-html-parsing-libraries/) -- cheerio vs alternatives
- [MetaRemover EXIF npm guide](https://metaremover.com/articles/en/exif-remove-npm) -- EXIF stripping approaches
- [exifr GitHub](https://github.com/MikeKovarik/exifr) -- EXIF reading capabilities
- Community documentation on Instagram HTML export structure

### Tertiary (LOW confidence)
- Instagram HTML export DOM structure details (inferred from community docs, not verified against actual export)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified via official docs, well-established in npm ecosystem
- Architecture: HIGH -- patterns derived from examining actual codebase and data files
- Carbonmade parser: HIGH -- actual JSON schema directly examined
- Instagram parser: MEDIUM -- HTML export format not directly examined, parser will need discovery phase
- Privacy enforcement: HIGH -- clear requirements, battle-tested libraries
- Admin slice: HIGH -- simple React page with existing project patterns
- Edge generation: HIGH -- algorithm clearly specified in user decisions

**Research date:** 2026-02-28
**Valid until:** 2026-03-28 (stable domain, libraries well-established)
