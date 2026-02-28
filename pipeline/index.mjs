#!/usr/bin/env node

/**
 * Pipeline orchestrator: parse -> curation -> privacy -> connect -> layout -> emit
 *
 * Produces:
 *   - public/data/constellation.graph.json  (nodes, edges, epochs)
 *   - public/data/constellation.layout.json  (positions, helixParams, bounds)
 *   - public/data/pipeline-status.json       (runtime metadata, NOT in constellation data)
 *
 * IMPORTANT per user decision:
 *   - curation.json is READ-ONLY input (never written by pipeline)
 *   - All arrays sorted before serialization for determinism
 *   - deterministicStringify for all output files
 *   - No Math.random() -- seeded PRNG only
 *   - No timestamps in constellation data (only in pipeline-status.json)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Pipeline modules
import { parseInstagram } from './parsers/instagram.mjs';
import { parseCarbonmade } from './parsers/carbonmade.mjs';
import { generateEdges } from './edges/edge-generator.mjs';
import { computePipelineLayout } from './layout/helix.mjs';
import { stripAndVerify } from './privacy/exif-stripper.mjs';
import { redactGPS } from './privacy/gps-redactor.mjs';
import { getEpochConfig } from './config/epochs.mjs';
import { PIPELINE_CONFIG } from './config/pipeline-config.mjs';
import { deterministicStringify } from './utils/deterministic.mjs';
import { createLogger, printLogSummary } from './utils/logger.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

const log = createLogger('orchestrator');

// ---------------------------------------------------------------------------
// Phase helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a path relative to the project root.
 * @param {string} relPath - Relative path
 * @returns {string} Absolute path
 */
function resolve(relPath) {
  return path.resolve(PROJECT_ROOT, relPath);
}

/**
 * Read a JSON file, returning null if it does not exist.
 * @param {string} filePath - Absolute path to JSON file
 * @returns {Promise<Object|null>}
 */
async function readJsonOrNull(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

async function main() {
  const startTime = Date.now();
  log.info('Pipeline starting...');

  // ========================================================================
  // Phase 1: PARSE
  // ========================================================================
  log.info('--- Phase 1: Parse ---');

  const instagramDir = resolve(PIPELINE_CONFIG.sources.instagram.dir);
  const carbonmadeDir = resolve(PIPELINE_CONFIG.sources.carbonmade.dir);

  const [instagramResult, carbonmadeResult] = await Promise.all([
    parseInstagram(instagramDir),
    parseCarbonmade(carbonmadeDir),
  ]);

  const allNodes = [...instagramResult.nodes, ...carbonmadeResult.nodes];

  log.info(
    `Parsed ${allNodes.length} total nodes ` +
    `(Instagram: ${instagramResult.nodes.length}, Carbonmade: ${carbonmadeResult.nodes.length})`
  );

  if (allNodes.length === 0) {
    log.error('Pipeline produced zero nodes -- aborting');
    process.exit(1);
  }

  // ========================================================================
  // Phase 2: CURATION (read-only input)
  // ========================================================================
  log.info('--- Phase 2: Curation ---');

  const curationFile = resolve(PIPELINE_CONFIG.curation.file);
  let curation = await readJsonOrNull(curationFile);

  if (curation) {
    log.info(`Loaded curation.json with ${Object.keys(curation.nodes || {}).length} node overrides`);

    // Apply publish/hide overrides
    const nodeOverrides = curation.nodes || {};
    const hiddenIds = new Set();

    for (const [nodeId, override] of Object.entries(nodeOverrides)) {
      if (override.hidden === true) {
        hiddenIds.add(nodeId);
      }
      if (override.visibility) {
        const node = allNodes.find(n => n.id === nodeId);
        if (node) {
          node.visibility = override.visibility;
        }
      }
    }

    // Remove hidden nodes
    const beforeCount = allNodes.length;
    const visibleNodes = allNodes.filter(n => !hiddenIds.has(n.id));
    const hiddenCount = beforeCount - visibleNodes.length;

    if (hiddenCount > 0) {
      log.info(`Curation: ${hiddenCount} nodes hidden, ${visibleNodes.length} visible`);
      // Replace allNodes content with visible only
      allNodes.length = 0;
      allNodes.push(...visibleNodes);
    }
  } else {
    log.info('No curation.json found -- all nodes visible by default');
  }

  // Load allowlist for privacy phase
  const allowlistFile = resolve(PIPELINE_CONFIG.allowlist.file);
  const allowlist = await readJsonOrNull(allowlistFile);
  if (allowlist) {
    log.info(`Loaded allowlist.json with ${Object.keys(allowlist).length} entries`);
  } else {
    log.info('No allowlist.json found -- default visibility applies');
  }

  // ========================================================================
  // Phase 3: PRIVACY (EXIF + GPS)
  // ========================================================================
  log.info('--- Phase 3: Privacy ---');

  const outputMediaDir = resolve(PIPELINE_CONFIG.output.mediaDir);
  let mediaProcessed = 0;
  let mediaSkipped = 0;

  for (const node of allNodes) {
    // Process media files (EXIF stripping)
    if (node.media && node.media.length > 0) {
      const processedMedia = [];

      for (const mediaPath of node.media) {
        // Only process local files (not CDN URLs)
        if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
          processedMedia.push(mediaPath);
          continue;
        }

        // Check if source file exists
        const sourceAbsolute = path.isAbsolute(mediaPath)
          ? mediaPath
          : resolve(mediaPath);

        try {
          await fs.access(sourceAbsolute);

          // Compute output path
          const relativeName = path.basename(mediaPath);
          const outputPath = path.join(outputMediaDir, node.id, relativeName);

          const result = await stripAndVerify(sourceAbsolute, outputPath);
          if (result) {
            // Store path relative to public/
            const relativeToPublic = path.relative(resolve('public'), outputPath).replace(/\\/g, '/');
            processedMedia.push(`/${relativeToPublic}`);
            mediaProcessed++;
          } else {
            mediaSkipped++;
          }
        } catch {
          // Source media not available -- skip (log warning, keep empty)
          log.warn(`Media file not available: ${mediaPath} (node: ${node.id})`);
          mediaSkipped++;
        }
      }

      node.media = processedMedia;
    }

    // GPS redaction based on visibility tier
    if (node.location) {
      const isMinor = false; // TODO: integrate with allowlist minor flags
      const redacted = redactGPS(
        node.location?.lat,
        node.location?.lng,
        node.visibility,
        isMinor
      );
      node.location = redacted;
    }
  }

  log.info(`Privacy: ${mediaProcessed} media files processed, ${mediaSkipped} skipped`);

  // ========================================================================
  // Phase 4: EDGE GENERATION
  // ========================================================================
  log.info('--- Phase 4: Edge Generation ---');

  const { edges, stats: edgeStats } = await generateEdges(allNodes);

  log.info(
    `Edges: ${edgeStats.edgesCreated} created from ${edgeStats.totalPairs} pairs ` +
    `(${edgeStats.edgesPruned} pruned)`
  );

  // ========================================================================
  // Phase 5: LAYOUT
  // ========================================================================
  log.info('--- Phase 5: Layout ---');

  const { positions, helixParams, bounds } = computePipelineLayout(
    allNodes,
    PIPELINE_CONFIG.layout
  );

  log.info(
    `Layout: ${Object.keys(positions).length} positions computed, ` +
    `bounds Y: [${bounds.minY.toFixed(1)}, ${bounds.maxY.toFixed(1)}]`
  );

  // ========================================================================
  // Phase 6: EMIT
  // ========================================================================
  log.info('--- Phase 6: Emit ---');

  // Sort nodes by id for deterministic output
  const sortedNodes = [...allNodes].sort((a, b) => a.id.localeCompare(b.id));

  // Sort edges by source + target
  const sortedEdges = [...edges].sort((a, b) => {
    const cmp = a.source.localeCompare(b.source);
    if (cmp !== 0) return cmp;
    return a.target.localeCompare(b.target);
  });

  // Build epoch config
  const epochs = getEpochConfig();

  // Build graph JSON
  const graphData = {
    nodes: sortedNodes,
    edges: sortedEdges,
    epochs,
  };

  // Build layout JSON
  const layoutData = {
    positions,
    helixParams,
    bounds,
  };

  // Ensure output directory exists
  const outputDir = path.dirname(resolve(PIPELINE_CONFIG.output.graphFile));
  await fs.mkdir(outputDir, { recursive: true });

  // Write constellation files with deterministic serialization
  const graphJson = deterministicStringify(graphData);
  const layoutJson = deterministicStringify(layoutData);

  await Promise.all([
    fs.writeFile(resolve(PIPELINE_CONFIG.output.graphFile), graphJson + '\n', 'utf8'),
    fs.writeFile(resolve(PIPELINE_CONFIG.output.layoutFile), layoutJson + '\n', 'utf8'),
  ]);

  // Compute stats by source, type, and visibility
  const bySource = {};
  const byType = {};
  const byVisibility = {};

  for (const node of sortedNodes) {
    bySource[node.source] = (bySource[node.source] || 0) + 1;
    byType[node.type] = (byType[node.type] || 0) + 1;
    byVisibility[node.visibility] = (byVisibility[node.visibility] || 0) + 1;
  }

  // Write pipeline-status.json (runtime artifact, has timestamps)
  const statusData = {
    lastRun: new Date().toISOString(),
    status: 'success',
    stats: {
      nodeCount: sortedNodes.length,
      edgeCount: sortedEdges.length,
      bySource,
      byType,
      byVisibility,
    },
  };

  await fs.writeFile(
    resolve('public/data/pipeline-status.json'),
    JSON.stringify(statusData, null, 2) + '\n',
    'utf8'
  );

  // File size reporting
  const graphSize = Buffer.byteLength(graphJson, 'utf8');
  const layoutSize = Buffer.byteLength(layoutJson, 'utf8');

  log.info(`Written: constellation.graph.json (${(graphSize / 1024).toFixed(1)} KB, ${sortedNodes.length} nodes, ${sortedEdges.length} edges)`);
  log.info(`Written: constellation.layout.json (${(layoutSize / 1024).toFixed(1)} KB, ${Object.keys(positions).length} positions)`);
  log.info(`Written: pipeline-status.json`);

  // ========================================================================
  // Summary
  // ========================================================================
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  log.info('');
  log.info('=== Pipeline Complete ===');
  log.info(`Duration: ${duration}s`);
  log.info(`Nodes: ${sortedNodes.length} (${Object.entries(bySource).map(([k, v]) => `${k}: ${v}`).join(', ')})`);
  log.info(`Edges: ${sortedEdges.length} (${edgeStats.edgesPruned} pruned)`);
  log.info(`Types: ${Object.entries(byType).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
  log.info(`Visibility: ${Object.entries(byVisibility).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
  log.info(`Media: ${mediaProcessed} processed, ${mediaSkipped} skipped`);

  printLogSummary();

  process.exit(0);
}

// Run
main().catch(err => {
  log.error(`Pipeline failed: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
