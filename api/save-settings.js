// Vercel serverless function: commits updated globe settings to GitHub
// POST /api/save-settings  { secret, settings }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { secret, settings } = req.body || {};

  // ── Auth ──
  const editorSecret = process.env.EDITOR_SECRET;
  if (!editorSecret || secret !== editorSecret) {
    return res.status(401).json({ error: 'Invalid passphrase' });
  }

  // ── Validate settings shape ──
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return res.status(400).json({ error: 'settings must be a plain object' });
  }

  for (const [key, val] of Object.entries(settings)) {
    if (typeof val === 'number' || typeof val === 'boolean') continue;
    if (
      Array.isArray(val) &&
      val.length === 3 &&
      val.every((v) => typeof v === 'number')
    ) continue;
    return res.status(400).json({ error: `Invalid value type for key "${key}"` });
  }

  const repo = process.env.GITHUB_REPO || 'jarowe/jarowe';
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Server misconfigured (no GITHUB_TOKEN)' });
  }

  const filePath = 'src/utils/globeDefaults.js';
  const apiBase = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'jarowe-globe-editor',
  };

  try {
    // ── GET current file ──
    const getRes = await fetch(apiBase, { headers });
    if (!getRes.ok) {
      const body = await getRes.text();
      return res.status(502).json({ error: `GitHub GET failed: ${getRes.status}`, detail: body });
    }
    const fileData = await getRes.json();
    const currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const sha = fileData.sha;

    // ── Line-by-line replacement ──
    let updatedContent = currentContent;
    let changedCount = 0;

    for (const [key, val] of Object.entries(settings)) {
      // Match lines like:  keyName: value,  or  keyName: value,  // comment
      // Captures: indent, key, old value, trailing comma + optional comment
      const regex = new RegExp(
        `^(\\s*)(${escapeRegex(key)})(:\\s*)(.+?)(,\\s*(?:\\/\\/.*)?)?$`,
        'm'
      );
      const match = updatedContent.match(regex);
      if (!match) continue; // key not found in file, skip silently

      const [fullMatch, indent, matchedKey, colonSpace, oldValStr, trailing] = match;
      const newValStr = formatValue(val, oldValStr);
      if (newValStr === oldValStr.trim()) continue; // no change

      const newLine = `${indent}${matchedKey}${colonSpace}${newValStr}${trailing || ','}`;
      updatedContent = updatedContent.replace(fullMatch, newLine);
      changedCount++;
    }

    if (changedCount === 0) {
      return res.status(200).json({ success: true, message: 'No changes needed', changedCount: 0 });
    }

    // ── Sanity check ──
    if (!updatedContent.includes('export const GLOBE_DEFAULTS')) {
      return res.status(500).json({ error: 'Sanity check failed: output missing GLOBE_DEFAULTS export' });
    }

    // ── PUT updated file ──
    const putRes = await fetch(apiBase, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `globe: update ${changedCount} setting${changedCount > 1 ? 's' : ''} via editor`,
        content: Buffer.from(updatedContent).toString('base64'),
        sha,
      }),
    });

    if (!putRes.ok) {
      const body = await putRes.text();
      return res.status(502).json({ error: `GitHub PUT failed: ${putRes.status}`, detail: body });
    }

    const putData = await putRes.json();
    return res.status(200).json({
      success: true,
      changedCount,
      commitSha: putData.commit?.sha,
      commitUrl: putData.commit?.html_url,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatValue(val, oldValStr) {
  if (typeof val === 'boolean') return String(val);

  if (Array.isArray(val)) {
    // Format each number in the array, matching original style where possible
    const formatted = val.map((n) => formatNumber(n));
    return `[${formatted.join(', ')}]`;
  }

  // Number — try to match the original formatting style
  return formatNumber(val, oldValStr?.trim());
}

function formatNumber(num, reference) {
  if (!Number.isFinite(num)) return String(num);

  // If integer value, check if original had .0 suffix
  if (Number.isInteger(num)) {
    if (reference && /\d+\.0$/.test(reference)) return num.toFixed(1);
    return String(num);
  }

  // Float — keep reasonable precision (trim trailing zeros but keep at least one decimal)
  const s = num.toPrecision(6);
  // Remove trailing zeros after decimal, but keep at least one
  return parseFloat(s).toString();
}
