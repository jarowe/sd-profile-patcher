/**
 * GPS coordinate redaction for privacy.
 *
 * Truncates GPS coordinates to 2 decimal places (~1.1 km city-level precision).
 * Returns null for minors and private-visibility content.
 *
 * Uses Number(Number(val).toFixed(2)) to avoid IEEE 754 floating-point
 * precision artifacts (e.g., 28.540000000000003 instead of 28.54).
 */

/**
 * Redact GPS coordinates based on visibility and minor status.
 *
 * @param {number|null} lat - Latitude
 * @param {number|null} lng - Longitude
 * @param {string} visibility - Visibility tier: "public" | "friends" | "private"
 * @param {boolean} isMinor - Whether the content involves a minor (PRIV-05)
 * @returns {{lat: number, lng: number}|null} Truncated coordinates or null
 */
export function redactGPS(lat, lng, visibility, isMinor) {
  // Minors: no GPS data at all (PRIV-05)
  if (isMinor) return null;

  // Private content: no GPS data in output
  if (visibility === 'private') return null;

  // Missing coordinates: nothing to redact
  if (lat == null || lng == null) return null;

  // Truncate to 2 decimal places (~1.1 km precision)
  // Double Number() wrap prevents floating-point trailing artifacts
  return {
    lat: Number(Number(lat).toFixed(2)),
    lng: Number(Number(lng).toFixed(2)),
  };
}
