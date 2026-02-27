import * as THREE from 'three';

/**
 * Seeded PRNG (mulberry32) for deterministic jitter.
 * Returns a function that produces values in [0, 1).
 */
function mulberry32(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Groups nodes by epoch, preserving order.
 * @param {Array} nodes - Sorted nodes with epoch field
 * @returns {Array<Array>} Array of epoch groups (arrays of nodes)
 */
function groupByEpoch(nodes) {
  const epochMap = new Map();
  for (const node of nodes) {
    const epoch = node.epoch;
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
 * Nodes are sorted by date, grouped by epoch, then positioned
 * along a parametric double helix with seeded jitter for organic feel.
 *
 * @param {Array} nodes - Array of node objects with { date, epoch, isHub, size, ... }
 * @param {Object} config - Layout configuration
 * @param {number} config.radius - Helix radius (default 30)
 * @param {number} config.pitch - Vertical distance per full rotation (default 5)
 * @param {number} config.epochGap - Extra vertical gap between epochs (default 15)
 * @param {number} config.jitterRadius - Random offset for organic feel (default 2)
 * @param {number} config.seed - Seed for deterministic PRNG (default 42)
 * @returns {Array} Nodes with added x, y, z position fields
 */
export function computeHelixLayout(nodes, config = {}) {
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

  let currentY = 0;
  const positions = [];

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

      const x = radius * Math.cos(angle) + jitterX;
      const y = epochStartY + (i / Math.max(epochNodes.length, 1)) * pitch;
      const z = radius * Math.sin(angle) + jitterZ;

      positions.push({ ...node, x, y, z });
    });

    // Advance currentY past this epoch's extent
    currentY = epochStartY + pitch;
  });

  return positions;
}

/**
 * Get the center point of the helix layout for camera targeting.
 * @param {Array} positions - Array of nodes with x, y, z fields
 * @returns {THREE.Vector3} Midpoint of the helix
 */
export function getHelixCenter(positions) {
  if (!positions.length) return new THREE.Vector3(0, 0, 0);

  let sumX = 0,
    sumY = 0,
    sumZ = 0;
  for (const p of positions) {
    sumX += p.x;
    sumY += p.y;
    sumZ += p.z;
  }
  const n = positions.length;
  return new THREE.Vector3(sumX / n, sumY / n, sumZ / n);
}

/**
 * Get the vertical bounds of the helix for timeline scrubber mapping.
 * @param {Array} positions - Array of nodes with y field
 * @returns {{ minY: number, maxY: number }} Vertical extent
 */
export function getHelixBounds(positions) {
  if (!positions.length) return { minY: 0, maxY: 0 };

  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of positions) {
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minY, maxY };
}
