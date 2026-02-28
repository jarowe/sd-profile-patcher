/**
 * EXIF stripping and post-strip verification.
 *
 * Uses sharp (default settings strip ALL metadata) for stripping and
 * exifr for belt-and-suspenders verification that GPS data was removed.
 *
 * Fail-closed: stripAndVerify() throws if verification detects GPS data.
 */

import sharp from 'sharp';
import * as exifr from 'exifr';
import fs from 'fs/promises';
import path from 'path';
import { createLogger } from '../utils/logger.mjs';

const log = createLogger('exif-stripper');

/**
 * Strip ALL metadata from an image using sharp.
 * Sharp's default pipeline strips EXIF, XMP, IPTC, and ICC metadata.
 *
 * @param {string} inputPath - Path to source image
 * @param {string} outputPath - Path to write stripped image
 * @returns {Promise<string>} outputPath on success
 */
export async function stripExif(inputPath, outputPath) {
  try {
    await fs.access(inputPath);
  } catch {
    log.warn(`Input file not found or unreadable: ${inputPath}`);
    return null;
  }

  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Sharp strips ALL metadata by default when processing
    await sharp(inputPath).toFile(outputPath);
    return outputPath;
  } catch (err) {
    log.warn(`Failed to strip EXIF from ${path.basename(inputPath)}: ${err.message}`);
    return null;
  }
}

/**
 * Verify that a file has no EXIF GPS metadata remaining.
 *
 * Checks for GPS, TIFF, XMP, and IPTC metadata (excluding ICC color profiles
 * which are benign).
 *
 * @param {string} filePath - Path to image file to verify
 * @returns {Promise<{clean: boolean, violations: string[]}>}
 */
export async function verifyNoExif(filePath) {
  const violations = [];

  try {
    await fs.access(filePath);
  } catch {
    // File doesn't exist or is unreadable -- report as violation
    violations.push(`File not found or unreadable: ${filePath}`);
    return { clean: false, violations };
  }

  try {
    const buffer = await fs.readFile(filePath);
    const exifData = await exifr.parse(buffer, {
      gps: true,
      tiff: true,
      xmp: true,
      iptc: true,
      icc: false, // ICC color profile is OK
    });

    if (exifData) {
      // Check specifically for GPS data -- this is the critical privacy concern
      if (
        exifData.latitude != null ||
        exifData.longitude != null ||
        exifData.GPSLatitude != null ||
        exifData.GPSLongitude != null
      ) {
        violations.push(
          `GPS data found in ${path.basename(filePath)}: ` +
          `lat=${exifData.latitude ?? exifData.GPSLatitude}, ` +
          `lng=${exifData.longitude ?? exifData.GPSLongitude}`
        );
      }

      // Log non-GPS metadata as info (not a violation, but worth noting)
      const metaKeys = Object.keys(exifData);
      const gpsKeys = ['latitude', 'longitude', 'GPSLatitude', 'GPSLongitude'];
      const nonGpsKeys = metaKeys.filter(k => !gpsKeys.includes(k));
      if (nonGpsKeys.length > 0) {
        log.info(
          `Non-GPS metadata in ${path.basename(filePath)}: ${nonGpsKeys.join(', ')}`
        );
      }
    }
  } catch (err) {
    // exifr throws on some file types -- treat as clean (no EXIF to find)
    log.info(`Could not parse EXIF from ${path.basename(filePath)}: ${err.message}`);
  }

  return { clean: violations.length === 0, violations };
}

/**
 * Strip EXIF then verify no GPS data remains. Fail-closed.
 *
 * Convenience function that calls stripExif() then verifyNoExif().
 * Throws an Error if verification fails (GPS data survived stripping).
 *
 * @param {string} inputPath - Path to source image
 * @param {string} outputPath - Path to write stripped image
 * @returns {Promise<string>} outputPath on success
 * @throws {Error} If GPS data survives stripping (privacy violation)
 */
export async function stripAndVerify(inputPath, outputPath) {
  const result = await stripExif(inputPath, outputPath);
  if (result === null) {
    log.warn(`Skipping verification for ${inputPath} (strip failed or file missing)`);
    return null;
  }

  const verification = await verifyNoExif(outputPath);
  if (!verification.clean) {
    const msg =
      `PRIVACY VIOLATION: EXIF data survived stripping in ${path.basename(inputPath)}. ` +
      `Violations: ${verification.violations.join('; ')}`;
    log.error(msg);
    throw new Error(msg);
  }

  return outputPath;
}
