/**
 * build-es.mjs
 * ------------
 * Post-build step: turns the English `dist/` into a Spanish `dist/es/` mirror
 * by string-swapping every visible string using i18n-dict/en-es.json.
 *
 * This is the "automated" half of the localization pipeline. The dictionary
 * itself is produced by a human/LLM translator from i18n-dict/pending.json.
 *
 * What it does per English HTML file:
 *   1. Replace text nodes whose trimmed content matches a dict key.
 *   2. Replace <title>, <meta name=description>, og:title, og:description.
 *   3. Replace translatable attributes (alt / aria-label / placeholder / title).
 *   4. Rewrite internal href="/x" -> "/es/x" (assets & static files skipped).
 *   5. Set <html lang="es">.
 *
 * Run order: `astro build`  THEN  `node scripts/build-es.mjs`
 * Idempotent: re-running overwrites dist/es/ from the current dist/.
 *
 * Known v1 limitations (documented, not bugs):
 *   - JSON-LD / Schema text stays English (lives inside <script>).
 *   - The language switcher on /es/ pages still points to /es/ (the copied
 *     page was rendered with locale=en). Fully native es pages would need
 *     Astro to render src/pages/es/* — a future enhancement.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const ES_DIR = path.join(DIST, 'es');
const DICT_FILE = path.join(ROOT, 'i18n-dict', 'en-es.json');

if (!fs.existsSync(DIST)) {
  console.error('ERROR: dist/ not found. Run `astro build` first.');
  process.exit(1);
}
if (!fs.existsSync(DICT_FILE)) {
  console.error('ERROR: i18n-dict/en-es.json not found. Translate pending.json first.');
  process.exit(1);
}

const dict = JSON.parse(fs.readFileSync(DICT_FILE, 'utf8'));

// Paths that must NOT get the /es/ prefix (assets, static, already-localized).
const SKIP_PREFIX = [
  '/_astro', '/icons', '/images', '/fonts', '/favicon', '/manifest',
  '/robots.txt', '/sitemap', '/inkflow', '/llms.txt', '/404', '/es',
];

function shouldPrefix(p) {
  if (!p.startsWith('/')) return false;            // external / protocol-relative
  if (/^https?:\/\//.test(p)) return false;
  if (p.startsWith('/es/')) return false;
  return !SKIP_PREFIX.some((s) => p.startsWith(s));
}

function swapTextNodes(html) {
  return html.replace(/>([^<]+)</g, (full, inner) => {
    const trimmed = inner.trim();
    if (trimmed in dict) {
      const lead = inner.slice(0, inner.indexOf(trimmed[0]));
      const trail = inner.slice(inner.lastIndexOf(trimmed[trimmed.length - 1]) + 1);
      return '>' + lead + dict[trimmed] + trail + '<';
    }
    return full;
  });
}

function swapAttributes(html) {
  // alt / aria-label / placeholder / title attributes
  return html.replace(
    /(\s(?:alt|aria-label|placeholder|title)=)(["'])(.*?)\2/gi,
    (full, pre, q, val) => (val in dict ? `${pre}${q}${dict[val]}${q}` : full)
  );
}

function swapMeta(html) {
  // <title>...</title>
  html = html.replace(/<title>([\s\S]*?)<\/title>/i, (full, val) =>
    val.trim() in dict ? `<title>${dict[val.trim()]}</title>` : full
  );
  // meta name=description / property=og:title / property=og:description
  html = html.replace(
    /(<meta\b[^>]*\b(?:name|property)=["'](description|og:title|og:description)["'][^>]*\bcontent=)(["'])(.*?)\3/gi,
    (full, pre, _name, q, val) => (val in dict ? `${pre}${q}${dict[val]}${q}` : full)
  );
  return html;
}

function rewriteLinks(html) {
  return html.replace(/(href)=("|')(\/[^"']*)\2/gi, (full, attr, q, p) =>
    shouldPrefix(p) ? `${attr}=${q}/es${p}${q}` : full
  );
}

function setLang(html) {
  return html.replace(/<html\b([^>]*)lang=["']en["']/i, '<html$1lang="es"');
}

// Collect English html files (skip any under /es/).
const files = [];
(function walk(dir, rel) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const r = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (r === 'es') continue;
      walk(full, r);
    } else if (entry.name.endsWith('.html')) {
      files.push({ full, rel: r });
    }
  }
})(DIST, '');

let swapped = 0;
for (const { full, rel } of files) {
  let html = fs.readFileSync(full, 'utf8');
  const before = html;
  html = swapTextNodes(html);
  html = swapAttributes(html);
  html = swapMeta(html);
  html = rewriteLinks(html);
  html = setLang(html);

  const outPath = path.join(ES_DIR, rel);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf8');
  if (html !== before) swapped++;
}

console.log(`Generated ${files.length} Spanish pages under dist/es/ (${swapped} had string swaps).`);
