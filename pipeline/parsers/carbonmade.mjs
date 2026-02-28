/**
 * Carbonmade JSON parser.
 *
 * Parses the Carbonmade JSON archive (projects, blog posts, experience milestones)
 * into canonical constellation nodes with visibility tiers and epoch assignment.
 *
 * IMPORTANT: Never modifies files in carbonmade-archive/. Read-only.
 */

import fs from 'fs/promises';
import path from 'path';
import { parse as dateParse } from 'date-fns';
import { createCanonicalNode } from '../schemas/canonical.mjs';
import { assignEpoch } from '../config/epochs.mjs';
import { createLogger } from '../utils/logger.mjs';
import { sortedGlob } from '../utils/deterministic.mjs';

const log = createLogger('carbonmade');

// --------------------------------------------------------------------------
// HTML Entity Cleaning
// --------------------------------------------------------------------------

/** Common HTML entities found in Carbonmade data */
const HTML_ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&#xE9;': '\u00e9', // e-acute
  '&#xE8;': '\u00e8', // e-grave
  '&#xE0;': '\u00e0', // a-grave
  '&#xF1;': '\u00f1', // n-tilde
  '\u201c': '"',       // left double quotation mark
  '\u201d': '"',       // right double quotation mark
  '\u2018': "'",       // left single quotation mark
  '\u2019': "'",       // right single quotation mark
};

/**
 * Clean HTML entities from text.
 * @param {string} text - Raw text with potential HTML entities
 * @returns {string} Cleaned text
 */
function cleanHtmlEntities(text) {
  if (!text) return '';
  let cleaned = text;
  for (const [entity, replacement] of Object.entries(HTML_ENTITIES)) {
    cleaned = cleaned.split(entity).join(replacement);
  }
  // Also handle numeric HTML entities like &#xNN; and &#NNN;
  cleaned = cleaned.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  cleaned = cleaned.replace(/&#(\d+);/g, (_, dec) =>
    String.fromCharCode(parseInt(dec, 10))
  );
  return cleaned;
}

// --------------------------------------------------------------------------
// Date Parsing
// --------------------------------------------------------------------------

/**
 * Parse a Carbonmade project date string to ISO format.
 * Handles: "2019", "2018", "2008 – 2014", "2008 - 2014"
 * For ranges, uses the start year. For single years, uses Jan 1.
 *
 * @param {string} dateStr - Raw date string from project.json
 * @returns {string|null} ISO date string "YYYY-01-01" or null if unparseable
 */
function parseProjectDate(dateStr) {
  if (!dateStr) return null;
  const cleaned = String(dateStr).trim();

  // Match year range: "2008 – 2014" or "2008 - 2014"
  const rangeMatch = cleaned.match(/^(\d{4})\s*[\u2013\u2014-]\s*(\d{4}|\w+)$/);
  if (rangeMatch) {
    return `${rangeMatch[1]}-01-01`;
  }

  // Match single year: "2019"
  const yearMatch = cleaned.match(/^(\d{4})$/);
  if (yearMatch) {
    return `${yearMatch[1]}-01-01`;
  }

  // Fallback: try to extract any 4-digit year
  const anyYear = cleaned.match(/(\d{4})/);
  if (anyYear) {
    return `${anyYear[1]}-01-01`;
  }

  return null;
}

/**
 * Parse blog post date "Month DD, YYYY" to ISO format.
 * @param {string} dateStr - e.g., "June 15, 2022"
 * @returns {string|null} ISO date string "YYYY-MM-DD" or null
 */
function parseBlogDate(dateStr) {
  if (!dateStr) return null;
  try {
    const parsed = dateParse(dateStr.trim(), 'MMMM dd, yyyy', new Date(2000, 0, 1));
    if (isNaN(parsed.getTime())) {
      // Try alternate format: "MMMM d, yyyy" (single digit day)
      const parsed2 = dateParse(dateStr.trim(), 'MMMM d, yyyy', new Date(2000, 0, 1));
      if (isNaN(parsed2.getTime())) return null;
      return formatISODate(parsed2);
    }
    return formatISODate(parsed);
  } catch {
    return null;
  }
}

/**
 * Parse experience details date (e.g., "July 2019", "2015", "2001")
 * from the details field which has format:
 * "Location  ·  StartDate – EndDate"
 * @param {string} details - Experience details string
 * @returns {string|null} ISO date string
 */
function parseExperienceDate(details) {
  if (!details) return null;

  // Extract date portion after the dot separator
  const parts = details.split('\u00b7'); // middle dot
  if (parts.length < 2) {
    // Try plain dash split if no middle dot
    const yearMatch = details.match(/(\d{4})/);
    if (yearMatch) return `${yearMatch[1]}-01-01`;
    return null;
  }

  const datePart = parts[parts.length - 1].trim();

  // Try "Month YYYY" format (e.g., "July 2019")
  const monthYearMatch = datePart.match(/^(\w+)\s+(\d{4})/);
  if (monthYearMatch) {
    try {
      const parsed = dateParse(`${monthYearMatch[1]} ${monthYearMatch[2]}`, 'MMMM yyyy', new Date(2000, 0, 1));
      if (!isNaN(parsed.getTime())) {
        return formatISODate(parsed);
      }
    } catch { /* fall through */ }
  }

  // Try just a year
  const yearMatch = datePart.match(/(\d{4})/);
  if (yearMatch) {
    return `${yearMatch[1]}-01-01`;
  }

  return null;
}

/**
 * Extract location from experience details field.
 * Format: "Location  ·  DateRange"
 * @param {string} details - Experience details string
 * @returns {string|null} Location string or null
 */
function parseExperienceLocation(details) {
  if (!details) return null;
  const parts = details.split('\u00b7'); // middle dot ·
  if (parts.length < 2) return null;
  const location = parts[0].trim();
  // Filter out full addresses (keep city/state only patterns)
  // Match "City, ST" or "City, State" patterns
  const cityStateMatch = location.match(/^([A-Za-z\s]+),\s*([A-Z]{2})\b/);
  if (cityStateMatch) {
    return `${cityStateMatch[1].trim()}, ${cityStateMatch[2]}`;
  }
  // If it contains numbers (likely a full address), extract city/state
  if (/\d/.test(location)) {
    const cityState = location.match(/,\s*([A-Za-z\s]+),\s*([A-Z]{2})\b/);
    if (cityState) {
      return `${cityState[1].trim()}, ${cityState[2]}`;
    }
  }
  return location || null;
}

/**
 * Format a Date object to ISO date string "YYYY-MM-DD".
 * @param {Date} date
 * @returns {string}
 */
function formatISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// --------------------------------------------------------------------------
// Entity Extraction
// --------------------------------------------------------------------------

/**
 * Extract tags from project role and type fields.
 * Splits on bullets, ampersands, commas, and pipes.
 * @param {Object} project - Project JSON object
 * @returns {string[]} Array of tag strings
 */
function extractProjectTags(project) {
  const tags = new Set();

  // Extract from role (e.g., "Director • Animator • Motion Designer • Producer • Writer")
  if (project.role) {
    const roleParts = cleanHtmlEntities(project.role)
      .split(/[•\u2022|,&]+/)
      .map(s => s.trim())
      .filter(Boolean);
    for (const part of roleParts) {
      tags.add(part);
    }
  }

  // Extract from type (e.g., "Sony PlayStation Source", "Narrative & Documentary")
  if (project.type) {
    tags.add(cleanHtmlEntities(project.type).trim());
  }

  return [...tags];
}

/**
 * Extract collaborator/people names from description text.
 * Looks for patterns like "alongside {Name}", "friend {Name}",
 * "brother {Name}", "team: {Name}", "Artist {Name}", "Lead Animator {Name}".
 *
 * @param {string} text - Description text
 * @param {string[]} knownPeople - Known collaborator names from about.json
 * @returns {string[]} Array of extracted names
 */
function extractPeople(text, knownPeople = []) {
  if (!text) return [];
  const people = new Set();
  const cleaned = cleanHtmlEntities(text);

  // Common non-name words that start with uppercase in prose
  const stopWords = new Set([
    'The', 'And', 'For', 'With', 'From', 'This', 'That', 'Here', 'Also',
    'Many', 'Some', 'Most', 'Very', 'All', 'His', 'Her', 'Our', 'Was',
    'Had', 'Has', 'Have', 'Been', 'Being', 'Made', 'Created', 'Working',
    'Into', 'About', 'After', 'Before', 'Over', 'Under', 'Between',
    'During', 'Without', 'Through', 'Every', 'Each', 'Both', 'Such',
    'Hand', 'Scene', 'Design', 'Style', 'Animation', 'Video',
    'Initial', 'Early', 'Final', 'New', 'Old',
  ]);

  /**
   * Validate that a matched string looks like a proper name:
   * - 2-4 words, each starting with uppercase letter
   * - No stop words in first position
   * - Reasonable length per word
   */
  function isLikelyName(str) {
    const words = str.trim().split(/\s+/);
    if (words.length < 2 || words.length > 4) return false;
    if (stopWords.has(words[0])) return false;
    // All words should be capitalized and reasonable length
    return words.every(w => /^[A-Z][a-z]{1,15}$/.test(w));
  }

  // Pattern: context word followed by a Proper Name (2-4 capitalized words)
  // Using {1,3} to limit the repeated group to max 3 additional words
  const relPatterns = [
    /(?:alongside|friend|brother|partner|collaborator)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/g,
    /(?:animator|artist|editor|director|producer)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/gi,
    /(?:Lead\s+Animator|Lead\s+Editor|Sound)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/g,
    /(?:Animator|Sound|Editor)\s*:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/g,
  ];

  for (const pattern of relPatterns) {
    let match;
    while ((match = pattern.exec(cleaned)) !== null) {
      // Take only the first 2-3 proper name words
      const rawName = match[1].trim();
      const words = rawName.split(/\s+/);
      // Try 2-word name first, then 3-word
      for (const len of [2, 3]) {
        if (words.length >= len) {
          const candidate = words.slice(0, len).join(' ');
          if (isLikelyName(candidate)) {
            people.add(candidate);
            break;
          }
        }
      }
    }
  }

  // Check for known people from about.json
  for (const known of knownPeople) {
    if (cleaned.includes(known)) {
      people.add(known);
    }
  }

  return [...people];
}

/**
 * Extract client names from experience description text.
 * Looks for patterns like "working with {Client}", or matches against known clients.
 *
 * @param {string} text - Description text
 * @param {string[]} knownClients - Known client names from about.json
 * @returns {string[]} Array of client names found
 */
function extractClients(text, knownClients = []) {
  if (!text) return [];
  const clients = new Set();
  const cleaned = cleanHtmlEntities(text);

  for (const client of knownClients) {
    if (cleaned.includes(client)) {
      clients.add(client);
    }
  }

  return [...clients];
}

// --------------------------------------------------------------------------
// Main Parser
// --------------------------------------------------------------------------

/**
 * Parse the Carbonmade JSON archive into canonical constellation nodes.
 *
 * @param {string} archiveDir - Path to the carbonmade-archive directory
 * @returns {Promise<{nodes: Object[], stats: Object}>}
 */
export async function parseCarbonmade(archiveDir) {
  const nodes = [];
  const warnings = [];
  const seenSourceIds = new Set();
  let projectCount = 0;
  let blogPostCount = 0;
  let milestoneCount = 0;
  let skippedCount = 0;

  // ---- Step 1: Read manifest ----
  let manifest = null;
  try {
    const manifestPath = path.join(archiveDir, 'manifest.json');
    const raw = await fs.readFile(manifestPath, 'utf8');
    manifest = JSON.parse(raw);
    log.info(`Loaded manifest: ${manifest.projectCount} projects, source: ${manifest.source}`);
  } catch (err) {
    log.warn(`Could not load manifest.json: ${err.message}`);
  }

  // Load about.json for known clients and collaborators
  let aboutData = null;
  try {
    const aboutPath = path.join(archiveDir, 'about', 'about.json');
    const raw = await fs.readFile(aboutPath, 'utf8');
    aboutData = JSON.parse(raw);
  } catch (err) {
    log.warn(`Could not load about.json: ${err.message}`);
  }

  const knownClients = aboutData?.clients || [];

  // ---- Step 2: Parse projects ----
  try {
    const projectDirs = await sortedGlob(
      path.join(archiveDir, 'projects', '*', 'project.json').replace(/\\/g, '/')
    );
    log.info(`Found ${projectDirs.length} project files`);

    for (let i = 0; i < projectDirs.length; i++) {
      try {
        const raw = await fs.readFile(projectDirs[i], 'utf8');
        const project = JSON.parse(raw);

        // Deduplication by sourceId
        const sourceId = String(project.id || '');
        if (sourceId && seenSourceIds.has(sourceId)) {
          log.warn(`Duplicate project sourceId: ${sourceId}, skipping`);
          skippedCount++;
          continue;
        }
        if (sourceId) seenSourceIds.add(sourceId);

        // Parse date
        const date = parseProjectDate(project.date);
        if (!date) {
          log.warn(`Project "${project.name}" has unparseable date "${project.date}", skipping`);
          skippedCount++;
          continue;
        }

        // Build description from description + texts
        const descParts = [cleanHtmlEntities(project.description || '')];
        if (Array.isArray(project.texts)) {
          for (const t of project.texts) {
            if (t.text && t.type === 'paragraph') {
              descParts.push(cleanHtmlEntities(t.text));
            }
          }
        }
        const description = descParts.join('\n\n').trim();

        // Build media array (CDN URLs + local images as fallback)
        const media = [];
        if (Array.isArray(project.imageUrls)) {
          for (const url of project.imageUrls) {
            // imageUrls may contain srcset-style strings "url1 1x, url2"
            // Take the first URL only
            const firstUrl = url.split(/\s+/)[0].split(',')[0].trim();
            if (firstUrl) media.push(firstUrl);
          }
        }

        // Check for local images directory
        const projectDir = path.dirname(projectDirs[i]);
        try {
          const localImages = await sortedGlob(
            path.join(projectDir, 'images', '*').replace(/\\/g, '/')
          );
          for (const img of localImages) {
            media.push(img);
          }
        } catch { /* no local images directory */ }

        // Determine size and isHub
        const hasVideos = Array.isArray(project.videoStreams) && project.videoStreams.length > 0;
        const hasMultipleImages = (project.imageCount || 0) >= 3;
        const size = hasVideos ? 1.5 : 1.0;
        const isHub = hasVideos && hasMultipleImages;

        // Extract entities
        const clientName = project.for && project.for !== 'Jarowe'
          ? cleanHtmlEntities(project.for)
          : null;
        const allText = description + ' ' + (project.texts || []).map(t => cleanHtmlEntities(t.text || '')).join(' ');
        const people = extractPeople(allText);
        const tags = extractProjectTags(project);

        // Create canonical node
        const nodeId = `cm-p-${String(i + 1).padStart(3, '0')}`;
        const node = createCanonicalNode({
          id: nodeId,
          type: 'project',
          title: cleanHtmlEntities(project.name || project.title || ''),
          date,
          epoch: assignEpoch(date),
          description,
          media,
          size,
          isHub,
          source: 'carbonmade',
          sourceId,
          visibility: 'public',
          entities: {
            clients: clientName ? [clientName] : [],
            people,
            tags,
            projects: [cleanHtmlEntities(project.name || '')],
          },
        });

        if (node) {
          nodes.push(node);
          projectCount++;
        } else {
          log.warn(`Failed to create node for project "${project.name}"`);
          skippedCount++;
        }
      } catch (err) {
        log.warn(`Error parsing project file ${projectDirs[i]}: ${err.message}`);
        skippedCount++;
      }
    }
  } catch (err) {
    log.warn(`Error discovering project directories: ${err.message}`);
  }

  // ---- Step 3: Parse blog posts ----
  try {
    const blogPath = path.join(archiveDir, 'blog', 'blog.json');
    const raw = await fs.readFile(blogPath, 'utf8');
    const blogData = JSON.parse(raw);
    const posts = blogData.posts || [];
    log.info(`Found ${posts.length} blog posts`);

    for (let i = 0; i < posts.length; i++) {
      try {
        const post = posts[i];
        const text = cleanHtmlEntities(post.text || '');

        // Parse date
        const date = parseBlogDate(post.date);
        if (!date) {
          log.warn(`Blog post ${i} has unparseable date "${post.date}", skipping`);
          skippedCount++;
          continue;
        }

        // Determine type: "idea" for short posts (<100 chars), "moment" for longer
        const type = text.length < 100 ? 'idea' : 'moment';

        // Generate title: first sentence up to 80 chars, or "Blog: {date}"
        let title = '';
        if (text) {
          // First sentence: up to first period, exclamation, or question mark
          const sentenceEnd = text.match(/[.!?]/);
          if (sentenceEnd && sentenceEnd.index < 80) {
            title = text.substring(0, sentenceEnd.index + 1);
          } else {
            title = text.substring(0, 80);
            if (text.length > 80) title += '...';
          }
        }
        if (!title) {
          title = `Blog: ${post.date}`;
        }

        // Generate a content-based sourceId for dedup
        const sourceId = `blog-${i}-${date}`;
        if (seenSourceIds.has(sourceId)) {
          log.warn(`Duplicate blog sourceId: ${sourceId}, skipping`);
          skippedCount++;
          continue;
        }
        seenSourceIds.add(sourceId);

        // Extract entities from text
        const people = extractPeople(text);
        const tags = extractBlogTags(text, knownClients);

        const nodeId = `cm-b-${String(i + 1).padStart(3, '0')}`;
        const node = createCanonicalNode({
          id: nodeId,
          type,
          title,
          date,
          epoch: assignEpoch(date),
          description: text,
          media: [],
          size: 1.0,
          isHub: false,
          source: 'carbonmade',
          sourceId,
          visibility: 'public',
          entities: {
            people,
            tags,
          },
        });

        if (node) {
          nodes.push(node);
          blogPostCount++;
        } else {
          log.warn(`Failed to create node for blog post ${i}`);
          skippedCount++;
        }
      } catch (err) {
        log.warn(`Error parsing blog post ${i}: ${err.message}`);
        skippedCount++;
      }
    }
  } catch (err) {
    log.warn(`Error loading blog.json: ${err.message}`);
  }

  // ---- Step 4: Parse experience milestones ----
  if (aboutData?.experience) {
    const experiences = aboutData.experience;
    log.info(`Found ${experiences.length} experience entries`);

    for (let i = 0; i < experiences.length; i++) {
      try {
        const exp = experiences[i];

        // Parse date from details
        const date = parseExperienceDate(exp.details);
        if (!date) {
          log.warn(`Experience "${exp.role} at ${exp.company}" has unparseable date, skipping`);
          skippedCount++;
          continue;
        }

        // Build title: "{role} at {company}" (cleaned)
        const role = cleanHtmlEntities(exp.role || '').trim();
        const company = cleanHtmlEntities(exp.company || '').trim();
        const title = `${role} at ${company}`;

        // Build description
        const description = cleanHtmlEntities(exp.description || '');

        // Extract location
        const location = parseExperienceLocation(exp.details);

        // Extract clients from description
        const clients = extractClients(description, knownClients);

        // Deduplication
        const sourceId = `exp-${company}-${date}`;
        if (seenSourceIds.has(sourceId)) {
          log.warn(`Duplicate experience sourceId: ${sourceId}, skipping`);
          skippedCount++;
          continue;
        }
        seenSourceIds.add(sourceId);

        const nodeId = `cm-m-${String(i + 1).padStart(3, '0')}`;
        const node = createCanonicalNode({
          id: nodeId,
          type: 'milestone',
          title,
          date,
          epoch: assignEpoch(date),
          description,
          media: [],
          size: 1.5,
          isHub: true,
          source: 'carbonmade',
          sourceId,
          visibility: 'public',
          entities: {
            clients,
            places: location ? [location] : [],
          },
        });

        if (node) {
          nodes.push(node);
          milestoneCount++;
        } else {
          log.warn(`Failed to create node for experience "${title}"`);
          skippedCount++;
        }
      } catch (err) {
        log.warn(`Error parsing experience entry ${i}: ${err.message}`);
        skippedCount++;
      }
    }
  }

  // ---- Step 5: Summary ----
  const total = projectCount + blogPostCount + milestoneCount;
  const stats = {
    projects: projectCount,
    blogPosts: blogPostCount,
    milestones: milestoneCount,
    total,
    skipped: skippedCount,
    warnings: warnings.length,
  };

  log.info(`Parsing complete: ${total} nodes (${projectCount} projects, ${blogPostCount} blog posts, ${milestoneCount} milestones), ${skippedCount} skipped`);

  return { nodes, stats };
}

// --------------------------------------------------------------------------
// Helper: Blog Tag Extraction
// --------------------------------------------------------------------------

/**
 * Extract relevant tags from blog post content.
 * Looks for project names, tool names, and client mentions.
 *
 * @param {string} text - Blog post text
 * @param {string[]} knownClients - Known client names
 * @returns {string[]} Array of tags
 */
function extractBlogTags(text, knownClients = []) {
  if (!text) return [];
  const tags = new Set();

  // Check for known client mentions
  for (const client of knownClients) {
    if (text.includes(client)) {
      tags.add(client);
    }
  }

  // Check for common tool/software mentions
  const tools = [
    'Cinema 4D', 'After Effects', 'Octane', 'Unreal Engine',
    'Element 3D', 'ZBrush', 'Premiere', 'Photoshop',
    'Illustrator', 'Unity', 'RNDR', 'Nuke',
  ];
  for (const tool of tools) {
    if (text.includes(tool)) {
      tags.add(tool);
    }
  }

  // Check for common project/topic keywords
  const topics = [
    'VR', 'animation', '3D', 'motion graphics', 'compositing',
    'character animation', 'product video', 'explainer',
  ];
  for (const topic of topics) {
    if (text.toLowerCase().includes(topic.toLowerCase())) {
      tags.add(topic);
    }
  }

  return [...tags];
}
