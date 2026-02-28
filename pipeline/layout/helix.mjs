/**
 * Double-helix layout computation for pipeline data.
 *
 * Adapted from src/constellation/layout/helixLayout.js for use in the
 * build-time pipeline. Produces a positions map keyed by node ID
 * (separate from node data) for constellation.layout.json.
 *
 * Uses mulberry32 PRNG from pipeline utils for deterministic jitter.
 */

import { mulberry32 } from '../utils/deterministic.mjs';

/**
 * Groups nodes by epoch, preserving date-sorted order within each group.
 *
 * @param {Object[]} nodes - Sorted nodes with epoch field
 * @returns {Array<Object[]>} Array of epoch groups
 */
function groupByEpoch(nodes) {
  const epochMap = new Map();
  for (const node of nodes) {
    const epoch = node.epoch || 'Unknown';
    if (!epochMap.has(epoch)) {
      epochMap.set(epoch, []);
    }
    epochMap.get(epoch).push(node);
  }
  return Array.from(epochMap.values());
}

/**
 * Compute a double-helix layout for constellation nodes.
 *
 * Nodes are sorted by date, grouped by epoch, then positioned along a
 * parametric double helix with seeded jitter for organic feel.
 *
 * Output is a positions map { [nodeId]: { x, y, z } } separate from
 * node data, for constellation.layout.json.
 *
 * @param {Object[]} nodes - Array of canonical nodes with { id, date, epoch, isHub, size }
 * @param {Object} config - Layout configuration
 * @param {number} config.radius - Helix radius (default 30)
 * @param {number} config.pitch - Vertical distance per full rotation (default 5)
 * @param {number} config.epochGap - Extra vertical gap between epochs (default 15)
 * @param {number} config.jitterRadius - Random offset for organic feel (default 2)
 * @param {number} config.seed - Seed for deterministic PRNG (default 42)
 * @returns {{ positions: Object, helixParams: Object, bounds: { minY: number, maxY: number } }}
 */
export function computePipelineLayout(nodes, config = {}) {
  const {
    radius = 30,
    pitch = 5,
    epochGap = 15,
    jitterRadius = 2,
    seed = 42,
  } = config;

  const rng = mulberry32(seed);

  // Sort nodes by date
  const sorted = [...nodes].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  // Group by epoch (preserves date-sorted order within each epoch)
  const epochs = groupByEpoch(sorted);

  const positions = {};
  let currentY = 0;
  let minY = Infinity;
  let maxY = -Infinity;

  epochs.forEach((epochNodes, epochIndex) => {
    if (epochIndex > 0) {
      currentY += epochGap;
    }

    const epochStartY = currentY;

    epochNodes.forEach((node, i) => {
      // Full rotation per epoch
      const t = (i / Math.max(epochNodes.length, 1)) * Math.PI * 2;

      // Double helix: strand 0 and strand 1 offset by PI
      // Hub nodes always on strand 0 for visual prominence
      const strand = node.isHub ? 0 : i % 2;
      const angle = t + strand * Math.PI;

      // Seeded jitter for organic feel
      const jitterX = (rng() - 0.5) * 2 * jitterRadius;
      const jitterZ = (rng() - 0.5) * 2 * jitterRadius;

      const x = Number((radius * Math.cos(angle) + jitterX).toFixed(4));
      const y = Number((epochStartY + (i / Math.max(epochNodes.length, 1)) * pitch).toFixed(4));
      const z = Number((radius * Math.sin(angle) + jitterZ).toFixed(4));

      positions[node.id] = { x, y, z };

      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });

    // Advance currentY past this epoch's extent
    currentY = epochStartY + pitch;
  });

  // Handle empty input
  if (Object.keys(positions).length === 0) {
    minY = 0;
    maxY = 0;
  }

  return {
    positions,
    helixParams: { radius, pitch, epochGap, jitterRadius, seed },
    bounds: { minY, maxY },
  };
}
