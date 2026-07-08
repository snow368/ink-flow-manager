import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const dist = join(root, 'dist');
const distMarketing = join(root, 'marketing', 'dist');
const distPwa = join(root, 'dist-pwa');
const redirects = join(root, '_redirects');
const headers = join(root, '_headers');

// Clean dist
if (existsSync(dist)) rmSync(dist, { recursive: true });
mkdirSync(dist);

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
