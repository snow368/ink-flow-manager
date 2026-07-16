/**
 * extract-strings.mjs
 * --------------------
 * Scans the built Astro site (dist/) and extracts every user-visible English
 * string that needs to be translated for the Spanish (/es/) version.
 *
 * Why scan `dist` (built HTML) instead of `.astro` source?
 *   - Component text is already inlined, so we capture nav/footer/child
 *     components without parsing .astro frontmatter or {expressions}.
 *   - Built HTML is well-formed and free of template syntax, so a lightweight
 *     regex walk is reliable enough for *building a dictionary* (missing an
 *     entry is harmless; it just stays English).
 *
 * Output: i18n-dict/pending.json
 *   { total, unique: string[], byFile: { "<relpath>": string[] } }
 *
 * Usage: node scripts/extract-strings.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT_DIR = path.join(ROOT, 'i18n-dict');
const OUT_FILE = path.join(OUT_DIR, 'pending.json');

if (!fs.existsSync(DIST)) {
  console.error('ERROR: dist/ not found. Run `astro build` first.');
  process.exit(1);
}

// Collect every .html file under dist (skip any already under /es/).
const htmlFiles = [];
(function walk(dir, rel) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const r = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (r === 'es') continue; // never extract from a Spanish dir
      walk(full, r);
    } else if (entry.name.endsWith('.html')) {
      htmlFiles.push({ full, rel: r });
    }
  }
})(DIST, '');

const unique = new Set();
const byFile = {};

// Strip <script> and <style> blocks entirely (case-insensitive, with attrs).
function stripScriptStyle(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ');
}

// Grab a quoted attribute value (handles single/double quotes).
function attrValue(regex, html, out) {
  let m;
  const re = new RegExp(regex, 'gi');
  while ((m = re.exec(html)) !== null) {
    const v = m[1];
    if (isTranslatable(v)) out.add(v);
  }
}

function isTranslatable(s) {
  const t = s.trim();
  if (t.length < 2) return false;
  // skip pure numbers / punctuation / urls / symbols
  if (/^[\d\s.,\-–—()/:]+$/.test(t)) return false;
  if (/^https?:\/\//.test(t)) return false;
  // skip if it looks like a template/code fragment
  if (t.includes('{') || t.includes('<')) return false;
  // must contain at least one letter
  if (!/[a-zA-Z]/.test(t)) return false;
  return true;
}

for (const { full, rel } of htmlFiles) {
  let html = fs.readFileSync(full, 'utf8');
  const fileStrings = [];

  // 1) <title>
  let m = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (m && isTranslatable(m[1])) { unique.add(m[1].trim()); fileStrings.push(m[1].trim()); }

  // 2) meta description + og:title / og:description
  attrValue(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i, html, unique);
  attrValue(/<meta\b[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i, html, unique);
  attrValue(/<meta\b[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i, html, unique);

  // 3) visible attributes on elements
  attrValue(/<[^>]*\balt=["']([^"']*)["']/gi, html, unique);
  attrValue(/<[^>]*\baria-label=["']([^"']*)["']/gi, html, unique);
  attrValue(/<[^>]*\bplaceholder=["']([^"']*)["']/gi, html, unique);
  attrValue(/<[^>]*\btitle=["']([^"']*)["']/gi, html, unique);

  // 4) text nodes (after stripping script/style)
  const body = stripScriptStyle(html);
  // Match text between > and <, but avoid breaking on void/self-closing noise.
  const textRe = />([^<]+)</g;
  let tm;
  while ((tm = textRe.exec(body)) !== null) {
    const raw = tm[1];
    // skip if contains a tag-like or expression fragment (shouldn't after strip, but safe)
    if (raw.includes('<') || raw.includes('{')) continue;
    const parts = raw.split(/(\s+)/); // keep whitespace as separators? we take whole node for now
    // We treat the whole trimmed node as one candidate.
    const t = raw.trim();
    if (isTranslatable(t)) {
      unique.add(t);
      fileStrings.push(t);
    }
  }

  if (fileStrings.length) byFile[rel] = [...new Set(fileStrings)];
}

const uniqueArr = [...unique].sort();
const result = { total: htmlFiles.length, uniqueCount: uniqueArr.length, unique: uniqueArr, byFile };

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(result, null, 2), 'utf8');

console.log(`Scanned ${htmlFiles.length} HTML files.`);
console.log(`Unique translatable strings: ${uniqueArr.length}`);
console.log(`Wrote ${OUT_FILE}`);
