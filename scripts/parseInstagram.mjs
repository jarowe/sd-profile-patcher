/**
 * parseInstagram.mjs
 *
 * Parses the Instagram data-export HTML (posts_1.html) and writes a JSON
 * array of post objects to src/data/instagramPosts.json.
 *
 * Each object contains:
 *   caption  - the post caption text
 *   images   - array of image paths (served from /images/Instagram/...)
 *   date     - the human-readable date string from the export
 *   lat      - latitude  (number | null)
 *   lng      - longitude (number | null)
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

// -- Paths ---------------------------------------------------------------
const HTML_PATH =
  "C:/dev/jarowe/public/images/Instagram/your_instagram_activity/media/posts_1.html";
const OUTPUT_PATH = "C:/dev/jarowe/src/data/instagramPosts.json";

// -- Read the HTML -------------------------------------------------------
const html = readFileSync(HTML_PATH, "utf-8");

// -- Split into individual post blocks -----------------------------------
// Each post lives inside a <div class="pam _3-95 _2ph- _a6-g uiBoxWhite noborder">
const postDivMarker = '<div class="pam _3-95 _2ph- _a6-g uiBoxWhite noborder">';
const chunks = html.split(postDivMarker).slice(1); // first chunk is page header

// -- Helpers -------------------------------------------------------------

/** Decode common HTML entities. */
function decodeEntities(str) {
  return str
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

/** Strip all HTML tags from a string. */
function stripTags(str) {
  return str.replace(/<[^>]*>/g, "");
}

// -- Parse each post -----------------------------------------------------
const posts = chunks.map((chunk) => {
  // --- Caption ---
  const captionMatch = chunk.match(
    /<h2 class="_3-95 _2pim _a6-h _a6-i">([\s\S]*?)<\/h2>/
  );
  const caption = captionMatch
    ? decodeEntities(stripTags(captionMatch[1])).trim()
    : "";

  // --- Images ---
  // Links like <a target="_blank" href="media/posts/YYYYMM/filename.ext">
  const imageRegex = /<a\s+target="_blank"\s+href="(media\/posts\/[^"]+)"/g;
  const images = [];
  let imgMatch;
  while ((imgMatch = imageRegex.exec(chunk)) !== null) {
    // Rewrite to the public-served path
    images.push("/images/Instagram/" + imgMatch[1]);
  }

  // --- Date ---
  const dateMatch = chunk.match(
    /<div class="_3-94 _a6-o">([\s\S]*?)<\/div>/
  );
  const date = dateMatch ? decodeEntities(stripTags(dateMatch[1])).trim() : "";

  // --- Latitude / Longitude ---
  let lat = null;
  let lng = null;

  const latMatch = chunk.match(
    /<div class="_a6-q">Latitude<\/div>\s*<div>\s*<div class="_a6-q">([-\d.]+)<\/div>/
  );
  if (latMatch) {
    lat = parseFloat(latMatch[1]);
  }

  const lngMatch = chunk.match(
    /<div class="_a6-q">Longitude<\/div>\s*<div>\s*<div class="_a6-q">([-\d.]+)<\/div>/
  );
  if (lngMatch) {
    lng = parseFloat(lngMatch[1]);
  }

  return { caption, images, date, lat, lng };
});

// -- Write output --------------------------------------------------------
mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, JSON.stringify(posts, null, 2), "utf-8");

console.log("Parsed " + posts.length + " posts -> " + OUTPUT_PATH);

// Quick summary
const withCoords = posts.filter((p) => p.lat !== null).length;
const totalImages = posts.reduce((n, p) => n + p.images.length, 0);
console.log("  " + totalImages + " total images");
console.log("  " + withCoords + " posts with GPS coordinates");
