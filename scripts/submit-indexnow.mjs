// scripts/submit-indexnow.mjs
// -----------------------------------------------------------------------------
// IndexNow auto-submit hook for InkFlow (closes seo-saas checklist item #10/#20).
//
// What it does:
//   1. Reads the built sitemap (dist/sitemap-index.xml + its sub-sitemaps) to get
//      every indexable URL on the site.
//   2. POSTs the full URL list to the IndexNow API (https://api.indexnow.org).
//      Bing + Yandex + most LLM crawlers consume IndexNow, so this also speeds up
//      discovery by ChatGPT / Perplexity / Claude before Google even crawls.
//
// Why after deploy:
//   Running it right after `wrangler pages deploy` means newly published/updated
//   pages are pushed to search engines immediately instead of waiting for the next
//   crawl. Idempotent — re-submitting the same URLs is a no-op for Bing.
//
// Run:
//   node scripts/submit-indexnow.mjs        (manual)
//   npm run deploy                          (auto, chained after wrangler)
//
// Key file must be served at https://ink-flows.com/inkflow-indexnow-key-2026.txt
// (already present in public/ as inkflow-indexnow-key-2026.txt).
// -----------------------------------------------------------------------------

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SITE = 'https://ink-flows.com';
const KEY = 'inkflow-indexnow-key-2026';
const KEY_LOCATION = `${SITE}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const BATCH = 10000; // IndexNow allows up to 10k URLs per request

function extractUrls(xml) {
  const urls = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) urls.push(m[1].trim());
  return urls;
}

// Read a sitemap by URI. Prefers the local built file (dist/) when available so we
// submit the *just-deployed* URLs, falls back to fetching over HTTP.
async function readSitemap(uri) {
  if (uri.startsWith('http')) {
    const local = resolve(process.cwd(), 'dist', uri.replace(SITE + '/', ''));
    if (existsSync(local)) return readFileSync(local, 'utf8');
    const res = await fetch(uri);
    if (!res.ok) throw new Error(`fetch ${uri} -> HTTP ${res.status}`);
    return await res.text();
  }
  return readFileSync(uri, 'utf8');
}

async function collectUrls() {
  const localIndex = resolve(process.cwd(), 'dist', 'sitemap-index.xml');
  const useLocal = existsSync(localIndex);
  const indexUri = useLocal ? localIndex : `${SITE}/sitemap-index.xml`;

  const indexXml = await readSitemap(indexUri);
  const subLocs = extractUrls(indexXml); // sitemap file URLs
  const urls = [];
  for (const sub of subLocs) {
    try {
      const subXml = await readSitemap(sub);
      urls.push(...extractUrls(subXml));
    } catch (e) {
      console.warn(`[indexnow] skip ${sub}: ${e.message}`);
    }
  }
  // Single-sitemap case: the index itself holds page URLs
  if (urls.length === 0) urls.push(...extractUrls(indexXml));
  return [...new Set(urls)];
}

async function postBatch(urlList) {
  const body = JSON.stringify({
    host: 'ink-flows.com',
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  });
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body,
  });
  const text = await res.text();
  if (!res.ok) {
    // 400/429/503 etc. — surface but don't crash the whole deploy
    throw new Error(`IndexNow HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return text;
}

async function main() {
  let urls;
  try {
    urls = await collectUrls();
  } catch (e) {
    console.error(`[indexnow] could not read sitemap: ${e.message}`);
    process.exitCode = 1;
    return;
  }

  if (urls.length === 0) {
    console.warn('[indexnow] no URLs found, skipping submit');
    return;
  }

  console.log(`[indexnow] submitting ${urls.length} URLs → ${ENDPOINT}`);
  for (let i = 0; i < urls.length; i += BATCH) {
    const batch = urls.slice(i, i + BATCH);
    const n = i / BATCH + 1;
    try {
      const resp = await postBatch(batch);
      console.log(`[indexnow] batch ${n} OK (${batch.length} urls) ${resp ? '— ' + resp : ''}`);
    } catch (e) {
      console.error(`[indexnow] batch ${n} FAILED: ${e.message}`);
      process.exitCode = 1;
    }
  }
}

main();
