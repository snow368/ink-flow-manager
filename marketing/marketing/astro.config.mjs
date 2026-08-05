import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { EEAT_UPDATED } from './src/data/tattoo-category-content';

// Real per-page lastmod for tattoo-meaning pages, sourced from EEAT_UPDATED
// (the same content-finalization dates already used for Article schema
// dateModified). Non-meaning pages omit <lastmod> entirely so we never emit a
// false "updated today" signal: the previous `lastmod: new Date()` churned to a
// single timestamp on every build and was ignored site-wide by Google.
function lastmodForUrl(url) {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    if (parts[0] === 'tattoo-meaning' && parts.length >= 3) {
      const last = parts[parts.length - 1];
      // Variant (spoke) URL: last segment is the full variant slug key.
      if (EEAT_UPDATED[last]) return new Date(EEAT_UPDATED[last]);
      // Pillar URL: strip the "-tattoo-meaning" suffix to get the symbol slug key.
      const symbol = last.replace(/-tattoo-meaning$/, '');
      if (EEAT_UPDATED[symbol]) return new Date(EEAT_UPDATED[symbol]);
    }
  } catch {
    // fall through to undefined
  }
  return undefined;
}

export default defineConfig({
  site: 'https://ink-flows.com',
  integrations: [
    tailwind(),
    sitemap({
      // Exclude thin local landing pages (minimal content, not ready for indexing)
      filter: (page) => !page.startsWith('https://ink-flows.com/book/'),
      // Per-URL lastmod: real meaning-page dates, no date on other pages.
      serialize: (item) => {
        const lm = lastmodForUrl(item.url);
        if (lm) item.lastmod = lm;
        return item;
      },
    }),
  ],
  output: 'static',
});
