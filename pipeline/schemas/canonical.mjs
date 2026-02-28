/**
 * Canonical node schema for the constellation pipeline.
 *
 * Both Instagram and Carbonmade parsers normalize to this shape,
 * which matches mock-constellation.json for drop-in replacement.
 */

import { assignEpoch } from '../config/epochs.mjs';

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
    epoch: fields.epoch || assignEpoch(date),
    description: fields.description || '',
    media: Array.isArray(fields.media) ? fields.media : [],
    connections: Array.isArray(fields.connections) ? fields.connections : [],
    size: typeof fields.size === 'number' ? fields.size : 1.0,
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
