/**
 * Instagram HTML export parser.
 *
 * Parses Instagram "Download Your Information" HTML export files into
 * canonical constellation nodes. Handles posts_*.html, reels.html,
 * and stories.html files from the content/ directory.
 *
 * IMPORTANT: Instagram changes their HTML export format without notice.
 * The parser includes a discovery phase to log actual DOM structure and
 * keeps selectors in a config object at the top for easy adjustment.
 *
 * Resilience: Never crashes the pipeline for a single bad post.
 * Missing export directory returns empty array gracefully.
 */

import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { parse as dateParse, isValid as isValidDate, format } from 'date-fns';
import { createCanonicalNode } from '../schemas/canonical.mjs';
import { assignEpoch } from '../config/epochs.mjs';
import { sortedGlob } from '../utils/deterministic.mjs';
import { createLogger } from '../utils/logger.mjs';

const log = createLogger('instagram');

// ─── Selector configuration ─────────────────────────────────────────────
// These selectors WILL need adjustment based on the actual Instagram export.
// They are kept here for easy tweaking once real data is available.
const SELECTORS = {
  // Instagram HTML exports typically structure posts as table cells or divs
  // Strategy: try multiple selector patterns and use the first one that matches

  // Post container candidates (tried in order)
  postContainers: [
    // Modern Instagram HTML export: each post is a div with nested content
    'div._a6-g',               // Instagram class-based (observed in some exports)
    'div[role="article"]',     // Semantic article role
    'table td',                // Older table-based exports
    'div > div > div',         // Generic nested divs (fallback discovery)
  ],

  // Date/time extraction
  dateSelectors: [
    'time[datetime]',          // <time datetime="...">
    'time',                    // <time> with text content
    'td:last-child',           // Table-based: date often in last cell
  ],

  // Caption text
  captionSelectors: [
    'div._a6-i',               // Instagram caption class
    'div > div:first-child',   // First text content in post container
  ],

  // Media elements
  mediaSelectors: [
    'img[src]',
    'video source[src]',
    'video[src]',
  ],

  // Location
  locationSelectors: [
    'a[href*="location"]',
    'div._a6-p',
    '[class*="location"]',
  ],

  // Tagged users
  taggedSelectors: [
    'a[href*="instagram.com"]',
    '[class*="tagged"]',
    '[class*="mention"]',
  ],
};

// ─── Date parsing formats ────────────────────────────────────────────────
// Instagram dates appear in various formats across export versions
const DATE_FORMATS = [
  "yyyy-MM-dd'T'HH:mm:ss",     // ISO-like without timezone
  'MMM d, yyyy, h:mm a',       // "Jun 15, 2022, 3:45 PM"
  'MMM d, yyyy',               // "Jun 15, 2022"
  'MMMM d, yyyy',              // "June 15, 2022"
  'yyyy-MM-dd HH:mm:ss',       // "2022-06-15 15:45:00"
  'yyyy-MM-dd',                // "2022-06-15"
  'MM/dd/yyyy',                // "06/15/2022"
  'd MMM yyyy',                // "15 Jun 2022"
];

/**
 * Attempt to parse a date string using multiple format strategies.
 *
 * @param {string} dateStr - Date text from HTML
 * @returns {string|null} ISO date string "YYYY-MM-DD" or null if unparseable
 */
function parseDate(dateStr) {
  if (!dateStr) return null;

  const cleaned = dateStr.trim();
  if (!cleaned) return null;

  // Strategy 1: Try as ISO date directly
  const directDate = new Date(cleaned);
  if (isValidDate(directDate) && !isNaN(directDate.getTime())) {
    const year = directDate.getFullYear();
    // Sanity check: year should be reasonable (2000-2030)
    if (year >= 2000 && year <= 2030) {
      return format(directDate, 'yyyy-MM-dd');
    }
  }

  // Strategy 2: Try each known format
  for (const fmt of DATE_FORMATS) {
    try {
      const parsed = dateParse(cleaned, fmt, new Date(2020, 0, 1));
      if (isValidDate(parsed) && !isNaN(parsed.getTime())) {
        const year = parsed.getFullYear();
        if (year >= 2000 && year <= 2030) {
          return format(parsed, 'yyyy-MM-dd');
        }
      }
    } catch {
      // This format didn't match, try next
    }
  }

  // Strategy 3: Extract date-like pattern from text with regex
  const isoMatch = cleaned.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const candidate = `${y}-${m}-${d}`;
    const check = new Date(candidate);
    if (isValidDate(check) && !isNaN(check.getTime())) {
      return candidate;
    }
  }

  return null;
}

/**
 * Extract hashtags from caption text.
 *
 * @param {string} text - Caption text
 * @returns {string[]} Array of hashtag strings (without #)
 */
function extractHashtags(text) {
  if (!text) return [];
  const matches = text.match(/#(\w+)/g);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.slice(1).toLowerCase()))];
}

/**
 * Generate a deterministic sourceId from post content for deduplication.
 *
 * @param {string} caption - Post caption
 * @param {string} dateStr - Post date
 * @param {string} fileName - Source HTML file name
 * @param {number} index - Post index within file
 * @returns {string} Deterministic source ID
 */
function generateSourceId(caption, dateStr, fileName, index) {
  // Use a combination of date + filename + index for determinism
  const base = `${dateStr || 'nodate'}_${path.basename(fileName, '.html')}_${index}`;
  // Simple hash for shorter IDs
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    const char = base.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `ig_${Math.abs(hash).toString(36)}`;
}

/**
 * Discovery phase: log the DOM structure of the first HTML file.
 * Helps debug selector issues when the export format changes.
 *
 * @param {string} htmlContent - HTML file content
 * @param {string} fileName - File name for logging
 */
function discoveryPhase(htmlContent, fileName) {
  const $ = cheerio.load(htmlContent);
  const body = $('body');

  log.info(`=== Discovery: ${fileName} ===`);
  log.info(`Top-level children: ${body.children().length}`);

  // Log top-level tag structure
  const topTags = [];
  body.children().each((i, el) => {
    if (i < 5) {
      const tag = $(el).prop('tagName')?.toLowerCase() || 'unknown';
      const className = $(el).attr('class') || '';
      const childCount = $(el).children().length;
      topTags.push(`${tag}${className ? `.${className.split(' ')[0]}` : ''} (${childCount} children)`);
    }
  });
  log.info(`Top tags: ${topTags.join(', ')}`);

  // Log selector match rates
  for (const [name, selectors] of Object.entries(SELECTORS)) {
    if (Array.isArray(selectors)) {
      for (const sel of selectors) {
        try {
          const count = $(sel).length;
          if (count > 0) {
            log.info(`Selector ${name}: "${sel}" matched ${count} elements`);
          }
        } catch {
          // Invalid selector, skip
        }
      }
    }
  }

  log.info(`=== End discovery ===`);
}

/**
 * Find post containers using multiple selector strategies.
 *
 * @param {CheerioAPI} $ - Loaded cheerio instance
 * @returns {{ elements: Cheerio, selector: string }} Matched elements and the selector used
 */
function findPostContainers($) {
  // Strategy 1: Try known selectors
  for (const sel of SELECTORS.postContainers) {
    try {
      const elements = $(sel);
      if (elements.length > 0) {
        return { elements, selector: sel };
      }
    } catch {
      // Invalid selector, try next
    }
  }

  // Strategy 2: Look for elements containing both text and media
  // This is a heuristic fallback for unknown formats
  const allDivs = $('div');
  const candidates = [];
  allDivs.each((_, el) => {
    const $el = $(el);
    const hasText = $el.text().trim().length > 10;
    const hasMedia = $el.find('img, video').length > 0;
    const hasDate = $el.find('time').length > 0 || $el.text().match(/\d{4}/);
    if (hasText && (hasMedia || hasDate)) {
      candidates.push(el);
    }
  });

  if (candidates.length > 0) {
    return { elements: $(candidates), selector: 'heuristic:div-with-text-and-media' };
  }

  // Strategy 3: Fall back to body children as "posts"
  const bodyChildren = $('body > *');
  return { elements: bodyChildren, selector: 'fallback:body-children' };
}

/**
 * Extract a single post from a DOM element.
 * Defensive: never crashes, returns null for unparseable posts.
 *
 * @param {CheerioAPI} $ - Loaded cheerio instance
 * @param {Element} postElement - DOM element representing a post
 * @param {string} fileName - Source file name (for logging)
 * @param {number} index - Post index within file
 * @returns {Object|null} Extracted post data or null
 */
function extractPost($, postElement, fileName, index) {
  try {
    const $post = $(postElement);

    // ── Caption ──
    let caption = '';
    for (const sel of SELECTORS.captionSelectors) {
      try {
        const text = $post.find(sel).first().text()?.trim();
        if (text && text.length > 0) {
          caption = text;
          break;
        }
      } catch { /* skip */ }
    }
    // Fallback: get all text content
    if (!caption) {
      caption = $post.text()?.trim() || '';
    }

    // ── Date ──
    let dateText = null;

    // Try datetime attribute first
    for (const sel of SELECTORS.dateSelectors) {
      try {
        const $dateEl = $post.find(sel).first();
        if ($dateEl.length > 0) {
          // Try datetime attribute
          const dtAttr = $dateEl.attr('datetime');
          if (dtAttr) {
            dateText = parseDate(dtAttr);
            if (dateText) break;
          }
          // Try text content
          const dtText = $dateEl.text()?.trim();
          if (dtText) {
            dateText = parseDate(dtText);
            if (dateText) break;
          }
        }
      } catch { /* skip */ }
    }

    // Fallback: look for date-like patterns anywhere in the post text
    if (!dateText) {
      const fullText = $post.text() || '';
      const datePatterns = [
        /(\w+ \d{1,2}, \d{4})/,           // "Jun 15, 2022"
        /(\d{4}-\d{2}-\d{2})/,            // "2022-06-15"
        /(\d{1,2}\/\d{1,2}\/\d{4})/,      // "06/15/2022"
      ];
      for (const pat of datePatterns) {
        const match = fullText.match(pat);
        if (match) {
          dateText = parseDate(match[1]);
          if (dateText) break;
        }
      }
    }

    // REQUIRED: skip post if no date parseable
    if (!dateText) {
      log.warn(`Post ${index} in ${fileName}: missing or unparseable date, skipping`);
      return null;
    }

    // ── Media ──
    const media = [];
    for (const sel of SELECTORS.mediaSelectors) {
      try {
        $post.find(sel).each((_, el) => {
          const src = $(el).attr('src');
          if (src && !src.includes('profile_pic') && !src.startsWith('data:')) {
            media.push(src);
          }
        });
      } catch { /* skip */ }
    }

    // ── Location ──
    let locationText = null;
    for (const sel of SELECTORS.locationSelectors) {
      try {
        const locText = $post.find(sel).first().text()?.trim();
        if (locText && locText.length > 0 && locText.length < 200) {
          locationText = locText;
          break;
        }
      } catch { /* skip */ }
    }

    // ── Tagged users ──
    const taggedUsers = [];
    for (const sel of SELECTORS.taggedSelectors) {
      try {
        $post.find(sel).each((_, el) => {
          const href = $(el).attr('href') || '';
          const text = $(el).text()?.trim();
          // Extract username from Instagram profile links
          if (href.includes('instagram.com') && text && text.startsWith('@')) {
            taggedUsers.push(text.slice(1)); // Remove @ prefix
          } else if (text && text.startsWith('@')) {
            taggedUsers.push(text.slice(1));
          }
        });
      } catch { /* skip */ }
    }

    return {
      caption,
      dateText,
      media,
      locationText,
      taggedUsers: [...new Set(taggedUsers)], // Deduplicate
    };
  } catch (err) {
    log.warn(`Post ${index} in ${fileName}: extraction error: ${err.message}`);
    return null;
  }
}

/**
 * Parse Instagram HTML export directory into canonical constellation nodes.
 *
 * @param {string} exportDir - Path to Instagram export root directory
 * @param {Object} options - Parser options
 * @param {boolean} options.discovery - Run discovery phase (default: true for first file)
 * @param {Array} options.epochs - Custom epoch configuration
 * @returns {Promise<{nodes: Object[], stats: Object}>} Parsed nodes and stats
 */
export async function parseInstagram(exportDir, options = {}) {
  const stats = {
    total: 0,
    parsed: 0,
    skipped: 0,
    duplicates: 0,
    files: 0,
    warnings: [],
    selectorUsed: '',
  };

  // ── Resilience: handle missing/empty export directory ──
  try {
    await fs.access(exportDir);
  } catch {
    log.warn(`Instagram export directory not found: ${exportDir}`);
    stats.warnings.push('Instagram export directory not found');
    return { nodes: [], stats };
  }

  // ── File discovery ──
  // Look for HTML files in content/ subdirectory and also directly in exportDir
  const contentDir = path.join(exportDir, 'content');
  let htmlFiles = [];

  try {
    await fs.access(contentDir);
    htmlFiles = await sortedGlob('**/*.html', { cwd: contentDir });
    // Make paths absolute
    htmlFiles = htmlFiles.map(f => path.join(contentDir, f));
  } catch {
    // No content/ dir -- look for HTML files directly in exportDir
    htmlFiles = await sortedGlob('**/*.html', { cwd: exportDir });
    htmlFiles = htmlFiles.map(f => path.join(exportDir, f));
  }

  if (htmlFiles.length === 0) {
    log.warn('No HTML files found in Instagram export directory');
    stats.warnings.push('No HTML files found');
    return { nodes: [], stats };
  }

  log.info(`Found ${htmlFiles.length} HTML file(s) to parse`);
  stats.files = htmlFiles.length;

  // ── Discover media files ──
  const mediaDir = path.join(exportDir, 'media');
  let mediaFiles = [];
  try {
    await fs.access(mediaDir);
    mediaFiles = await sortedGlob('**/*.{jpg,jpeg,png,gif,mp4,mov,webp}', {
      cwd: mediaDir,
    });
    log.info(`Found ${mediaFiles.length} media file(s)`);
  } catch {
    log.info('No media/ directory found');
  }

  // ── Parse each HTML file ──
  let discoveryDone = false;
  let globalIndex = 0;
  const allPosts = [];
  const seenSourceIds = new Set();

  for (const htmlFile of htmlFiles) {
    let htmlContent;
    try {
      htmlContent = await fs.readFile(htmlFile, 'utf-8');
    } catch (err) {
      log.warn(`Failed to read ${htmlFile}: ${err.message}`);
      continue;
    }

    const $ = cheerio.load(htmlContent);
    const fileName = path.basename(htmlFile);

    // Discovery phase: run once on first file
    if (!discoveryDone && options.discovery !== false) {
      discoveryPhase(htmlContent, fileName);
      discoveryDone = true;
    }

    // Find post containers
    const { elements: postElements, selector } = findPostContainers($);
    if (!stats.selectorUsed) {
      stats.selectorUsed = selector;
      log.info(`Using selector strategy: ${selector} (${postElements.length} elements)`);
    }

    // Extract posts
    postElements.each((i, el) => {
      stats.total++;
      globalIndex++;

      const post = extractPost($, el, fileName, globalIndex);
      if (!post) {
        stats.skipped++;
        return; // cheerio .each continue
      }

      // Generate sourceId for dedup
      const sourceId = generateSourceId(post.caption, post.dateText, fileName, i);

      // Within-source deduplication
      if (seenSourceIds.has(sourceId)) {
        log.warn(`Duplicate post detected (sourceId: ${sourceId}), keeping first occurrence`);
        stats.duplicates++;
        stats.skipped++;
        return;
      }
      seenSourceIds.add(sourceId);

      allPosts.push({ ...post, sourceId, fileName });
    });
  }

  // ── Normalize to canonical nodes ──
  const nodes = [];

  for (let i = 0; i < allPosts.length; i++) {
    const post = allPosts[i];
    const paddedIndex = String(i + 1).padStart(3, '0');
    const id = `ig-${paddedIndex}`;

    const title = post.caption
      ? post.caption.slice(0, 60) + (post.caption.length > 60 ? '...' : '')
      : `Instagram Post ${post.dateText}`;

    const epoch = assignEpoch(post.dateText);
    const hashtags = extractHashtags(post.caption);

    // Resolve media paths relative to export directory
    const media = post.media.map(p => {
      if (path.isAbsolute(p)) return p;
      // Try resolving relative to the source HTML file's directory
      return path.relative(exportDir, path.resolve(path.dirname(
        // Find the HTML file this post came from
        path.join(exportDir, 'content', post.fileName)
      ), p)).replace(/\\/g, '/');
    });

    const node = createCanonicalNode({
      id,
      type: 'moment',
      title,
      date: post.dateText,
      epoch,
      description: post.caption || '',
      media,
      source: 'instagram',
      sourceId: post.sourceId,
      visibility: 'private', // Default private -- allowlist promotes to public/friends
      entities: {
        people: post.taggedUsers || [],
        places: post.locationText ? [post.locationText] : [],
        tags: hashtags,
        clients: [],
        projects: [],
      },
      location: null, // GPS comes from EXIF in media files, handled separately
    });

    if (node) {
      nodes.push(node);
      stats.parsed++;
    } else {
      stats.skipped++;
      log.warn(`Node creation returned null for post ${i + 1}`);
    }
  }

  // ── Summary ──
  log.info(
    `Parse complete: ${stats.parsed} nodes from ${stats.total} posts ` +
    `(${stats.skipped} skipped, ${stats.duplicates} duplicates)`
  );

  if (stats.warnings.length > 0) {
    log.info(`Warnings: ${stats.warnings.join('; ')}`);
  }

  return { nodes, stats };
}
