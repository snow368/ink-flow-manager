import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://ink-flows.com',
  integrations: [
    tailwind(),
    sitemap({
      // Exclude thin local landing pages (minimal content, not ready for indexing)
      filter: (page) => !page.startsWith('https://ink-flows.com/book/'),
      // Set lastmod for all pages to trigger re-crawl after content updates
      lastmod: new Date(),
    }),
  ],
  output: 'static',
});
