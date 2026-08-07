import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const dist = join(root, 'dist');
const distMarketing = join(root, 'marketing', 'dist');
const distPwa = join(root, 'dist-pwa');
// 2026-08-07 FIX: deploy the CANONICAL _redirects (marketing/marketing/public/_redirects)
// as the single source of truth. Previously this pointed at a stale 18-line
// /marketing/_redirects that clobbered the freshly-built Astro _redirects with
// outdated rules, so edits to the canonical source only landed intermittently
// (e.g. the /features/aftercare 301->404 rule survived every rebuild). Pointing
// the overlay at the canonical source guarantees the deployed _redirects always
// equals marketing/marketing/public/_redirects.
const redirects = join(root, 'marketing', 'public', '_redirects');
const headers = join(root, '_headers');

// Clean dist
if (existsSync(dist)) rmSync(dist, { recursive: true });
mkdirSync(dist);

// 2026-08-07: regenerate _redirects inside the (possibly cached) Astro build
// output from the canonical source BEFORE copying it downstream. This guarantees
// the deployed _redirects always equals marketing/marketing/public/_redirects even
// when the Astro build cache is stale — which is exactly what prevented the
// /features/aftercare 301->404 fix from reaching production previously.
if (existsSync(distMarketing) && existsSync(redirects)) {
  copyFileSync(redirects, join(distMarketing, '_redirects'));
  console.log('✓ Regenerated marketing/marketing/dist/_redirects from canonical source');
}

// Copy marketing site build to dist/
if (existsSync(distMarketing)) {
  cpSync(distMarketing, dist, { recursive: true });
  console.log('✓ Marketing site copied');
}

// Copy PWA build to dist/app/
if (existsSync(distPwa)) {
  mkdirSync(join(dist, 'app'));
  cpSync(distPwa, join(dist, 'app'), { recursive: true });
  console.log('✓ PWA copied to /app/');
}

// Copy _redirects
if (existsSync(redirects)) {
  copyFileSync(redirects, join(dist, '_redirects'));
  console.log('✓ _redirects copied');
}

// Copy _headers
if (existsSync(headers)) {
  copyFileSync(headers, join(dist, '_headers'));
  console.log('✓ _headers copied');
}

console.log('✓ Build combine complete');
