/**
 * Deterministic output helpers for the pipeline.
 *
 * Ensures same input always produces the same output bytes --
 * sorted JSON keys, seeded PRNG, and sorted file globbing.
 */

import { glob } from 'glob';

/**
 * Serialize data to deterministic JSON.
 *
 * Object keys are recursively sorted. Arrays are NOT sorted (caller must
 * pre-sort arrays where ordering matters for determinism). 2-space indent.
 *
 * @param {*} data - Data to serialize
 * @returns {string} Deterministic JSON string
 */
export function deterministicStringify(data) {
  return JSON.stringify(
    data,
    (_key, value) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return Object.keys(value)
          .sort()
          .reduce((sorted, k) => {
            sorted[k] = value[k];
            return sorted;
          }, {});
      }
      return value;
    },
    2
  );
}

/**
 * Seeded PRNG (mulberry32) for deterministic randomness.
 *
 * Copied from src/constellation/layout/helixLayout.js (reuse, not reinvent).
 * Returns a function that produces values in [0, 1).
 *
 * @param {number} seed - Integer seed
 * @returns {() => number} PRNG function returning [0, 1)
 */
export function mulberry32(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Sorted file glob for cross-platform determinism.
 *
 * Wraps glob() and sorts results alphabetically so file ordering
 * is consistent regardless of OS/filesystem.
 *
 * @param {string} pattern - Glob pattern
 * @param {Object} options - glob options
 * @returns {Promise<string[]>} Sorted array of file paths
 */
export async function sortedGlob(pattern, options = {}) {
  const files = await glob(pattern, { ...options, posix: true });
  return files.sort();
}
