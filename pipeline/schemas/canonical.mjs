/**
 * Canonical node schema for the constellation pipeline.
 *
 * Both Instagram and Carbonmade parsers normalize to this shape,
 * which matches mock-constellation.json for drop-in replacement.
 */

/** Valid node types (matching mock-constellation.json) */
export const NODE_TYPES = Object.freeze([
  'milestone',
  'person',
  'moment',
  'idea',
  'project',
  'place',
]);

/** Visibility tiers -- exactly 3 (public / friends / private).
 *  "redacted" is NOT a tier -- it is a transformation applied by
 *  the privacy pipeline (exif-stripper, gps-redactor, allowlist). */
export const VISIBILITY_TIERS = Object.freeze([
  'public',
  'friends',
  'private',
]);

/** Default epoch configuration.
 *  Maps date ranges to epoch labels, matching mock-constellation.json. */
export const DEFAULT_EPOCHS = Object.freeze([
  { id: 'early-years', label: 'Early Years', start: 2001, end: 2010 },
  { id: 'college', label: 'College', start: 2010, end: 2014 },
  { id: 'career-start', label: 'Career Start', start: 2014, end: 2018 },
  { id: 'growth', label: 'Growth', start: 2018, end: 2022 },
  { id: 'present', label: 'Present', start: 2022, end: 2026 },
]);

/**
 * Determine the epoch label for a given date string.
 * @param {string} dateStr - ISO date string "YYYY-MM-DD"
 * @param {Array} epochs - Epoch configuration array (default: DEFAULT_EPOCHS)
 * @returns {string} Epoch label or "Unknown"
 */
export function getEpoch(dateStr, epochs = DEFAULT_EPOCHS) {
  if (!dateStr) return 'Unknown';
  const year = new Date(dateStr).getFullYear();
  if (isNaN(year)) return 'Unknown';
  for (const epoch of epochs) {
    if (year >= epoch.start && year < epoch.end) {
      return epoch.label;
    }
  }
  // If year matches the last epoch's end year, include it in the last epoch
  const last = epochs[epochs.length - 1];
  if (year === last.end) return last.label;
  return 'Unknown';
}

/**
 * Factory function to create a canonical node object.
 *
 * Validates required fields (id, date). Returns null if either is missing
 * so the caller can log a warning and skip.
 *
 * All optional fields are filled with safe defaults for rendering.
 *
 * @param {Object} fields - Node fields
 * @returns {Object|null} Canonical node or null if required fields missing
 */
export function createCanonicalNode(fields = {}) {
  const { id, date } = fields;

  // Required field validation -- return null so caller can skip gracefully
  if (!id || !date) {
    return null;
  }

  const type = fields.type && NODE_TYPES.includes(fields.type)
    ? fields.type
    : 'moment';

  const visibility = fields.visibility && VISIBILITY_TIERS.includes(fields.visibility)
    ? fields.visibility
    : 'private';

  return {
    id,
    type,
    title: fields.title || '',
    date,
    epoch: fields.epoch || getEpoch(date),
    description: fields.description || '',
    media: Array.isArray(fields.media) ? fields.media : [],
    connections: Array.isArray(fields.connections) ? fields.connections : [],
    size: typeof fields.size === 'number' ? fields.size : 0.8,
    isHub: Boolean(fields.isHub),
    source: fields.source || '',
    sourceId: fields.sourceId || '',
    visibility,
    entities: {
      people: Array.isArray(fields.entities?.people) ? fields.entities.people : [],
      places: Array.isArray(fields.entities?.places) ? fields.entities.places : [],
      tags: Array.isArray(fields.entities?.tags) ? fields.entities.tags : [],
      clients: Array.isArray(fields.entities?.clients) ? fields.entities.clients : [],
      projects: Array.isArray(fields.entities?.projects) ? fields.entities.projects : [],
    },
    location: fields.location || null,
  };
}
