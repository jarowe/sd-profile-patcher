/**
 * Signal weight constants and calculation functions for evidence-based edges.
 *
 * The signal weight table is LOCKED by user decision (02-CONTEXT.md).
 * Bonus signals (shared-place, shared-client) are within Claude's discretion
 * for evidence quality improvement.
 */

import { differenceInDays } from 'date-fns';

// ---------------------------------------------------------------------------
// Signal Weight Table (LOCKED)
// ---------------------------------------------------------------------------

/** Signal weights for edge generation. Locked by user decision. */
export const SIGNAL_WEIGHTS = Object.freeze({
  'same-day':            0.8,
  'shared-project':      0.7,
  'shared-entity':       0.6,
  'shared-tags':         0.4,
  'temporal-proximity':  0.3,
  // Bonus signals (within discretion)
  'shared-place':        0.25,
  'shared-client':       0.35,
});

/** Minimum total signal weight to create an edge. Locked at >= 0.5. */
export const EDGE_THRESHOLD = 0.5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Case-insensitive array intersection.
 *
 * @param {string[]} a - First array
 * @param {string[]} b - Second array
 * @returns {string[]} Intersection (original-case from array `a`)
 */
function intersect(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) {
    return [];
  }
  const setB = new Set(b.map(s => String(s).toLowerCase()));
  const result = [];
  const seen = new Set();
  for (const item of a) {
    const lower = String(item).toLowerCase();
    if (setB.has(lower) && !seen.has(lower)) {
      seen.add(lower);
      result.push(item);
    }
  }
  return result;
}

/**
 * Parse a date string to a Date object for comparison.
 * Handles ISO "YYYY-MM-DD" and "YYYY-01-01" formats.
 *
 * @param {string} dateStr - Date string
 * @returns {Date|null} Parsed date or null
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d;
}

// ---------------------------------------------------------------------------
// Signal Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate all applicable signals between two nodes.
 *
 * Returns an array of evidence objects, each describing why the two nodes
 * are connected and with what weight.
 *
 * @param {Object} nodeA - First canonical node
 * @param {Object} nodeB - Second canonical node
 * @returns {Array<{type: string, signal: string, description: string, weight: number}>}
 */
export function calculateSignals(nodeA, nodeB) {
  const signals = [];
  const entA = nodeA.entities || {};
  const entB = nodeB.entities || {};

  // ---- same-day ----
  if (nodeA.date && nodeB.date && nodeA.date === nodeB.date) {
    signals.push({
      type: 'temporal',
      signal: 'same-day',
      description: `Both from ${nodeA.date}`,
      weight: SIGNAL_WEIGHTS['same-day'],
    });
  }

  // ---- shared-project ----
  const sharedProjects = intersect(entA.projects || [], entB.projects || []);
  if (sharedProjects.length > 0) {
    signals.push({
      type: 'semantic',
      signal: 'shared-project',
      description: `Both part of ${sharedProjects.join(', ')}`,
      weight: SIGNAL_WEIGHTS['shared-project'],
    });
  }

  // ---- shared-entity (people) ----
  const sharedPeople = intersect(entA.people || [], entB.people || []);
  if (sharedPeople.length > 0) {
    signals.push({
      type: 'semantic',
      signal: 'shared-entity',
      description: `Both mention ${sharedPeople.join(', ')}`,
      weight: SIGNAL_WEIGHTS['shared-entity'],
    });
  }

  // ---- shared-tags ----
  const sharedTags = intersect(entA.tags || [], entB.tags || []);
  if (sharedTags.length > 0) {
    signals.push({
      type: 'semantic',
      signal: 'shared-tags',
      description: `Shared tags: ${sharedTags.join(', ')}`,
      weight: SIGNAL_WEIGHTS['shared-tags'],
    });
  }

  // ---- temporal-proximity ----
  if (nodeA.date && nodeB.date) {
    const dateA = parseDate(nodeA.date);
    const dateB = parseDate(nodeB.date);
    if (dateA && dateB) {
      const daysBetween = Math.abs(differenceInDays(dateA, dateB));
      if (daysBetween > 0 && daysBetween <= 30) {
        signals.push({
          type: 'temporal',
          signal: 'temporal-proximity',
          description: `${daysBetween} days apart`,
          weight: SIGNAL_WEIGHTS['temporal-proximity'],
        });
      }
    }
  }

  // ---- shared-place (bonus) ----
  const sharedPlaces = intersect(entA.places || [], entB.places || []);
  if (sharedPlaces.length > 0) {
    signals.push({
      type: 'spatial',
      signal: 'shared-place',
      description: `Shared location: ${sharedPlaces.join(', ')}`,
      weight: SIGNAL_WEIGHTS['shared-place'],
    });
  }

  // ---- shared-client (bonus) ----
  const sharedClients = intersect(entA.clients || [], entB.clients || []);
  if (sharedClients.length > 0) {
    signals.push({
      type: 'semantic',
      signal: 'shared-client',
      description: `Same client: ${sharedClients.join(', ')}`,
      weight: SIGNAL_WEIGHTS['shared-client'],
    });
  }

  return signals;
}
