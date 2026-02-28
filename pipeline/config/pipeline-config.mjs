/**
 * Central pipeline configuration.
 *
 * Centralizes all paths, output locations, privacy defaults, layout parameters,
 * and determinism settings used across the data pipeline.
 */

export const PIPELINE_CONFIG = Object.freeze({
  /** Data source directories */
  sources: {
    /** Instagram HTML export (gitignored, private) */
    instagram: {
      dir: 'data-private/instagram',
    },
    /** Carbonmade JSON archive (already in repo, read-only) */
    carbonmade: {
      dir: 'carbonmade-archive',
    },
  },

  /** Output file paths (generated at build time into public/data/) */
  output: {
    /** Main graph data: nodes, edges, evidence */
    graphFile: 'public/data/constellation.graph.json',
    /** Layout positions computed from graph data */
    layoutFile: 'public/data/constellation.layout.json',
    /** Processed media assets directory */
    mediaDir: 'public/data/media',
  },

  /** Curation and allowlist files (version-controlled) */
  curation: {
    file: 'curation.json',
  },
  allowlist: {
    file: 'allowlist.json',
  },

  /** Privacy settings */
  privacy: {
    /** Maximum decimal places for GPS coordinates (2 = ~1.1km precision) */
    gpsMaxDecimals: 2,
    /** Default visibility for new nodes (most restrictive by default) */
    defaultVisibility: 'private',
  },

  /** Helix layout parameters (matching existing helixLayout defaults) */
  layout: {
    radius: 30,
    pitch: 5,
    epochGap: 15,
    jitterRadius: 2,
    seed: 42,
  },

  /** Determinism settings */
  determinism: {
    seed: 42,
  },
});
