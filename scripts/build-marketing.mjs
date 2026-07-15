// Build the marketing (Astro) site and copy its output into the repo-root
// `dist/` so that Cloudflare Pages (which runs `npm run build` at repo root
// and serves `dist/`) deploys the correct marketing site for ink-flows.com.
//
// The React PWA (the studio app) lives under src/ and is built separately via
// `npm run build:app` for the app.ink-flows.com subdomain.

import { execSync } from 'node:child_process';
import { cpSync, rmSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const marketingDir = resolve(root, 'marketing');
const outSrc = resolve(marketingDir, 'dist');
const outDst = resolve(root, 'dist');

console.log('=== [build-marketing] installing marketing deps ===');
execSync('npm install', { cwd: marketingDir, stdio: 'inherit' });

console.log('=== [build-marketing] building Astro marketing site ===');
execSync('npm run build', { cwd: marketingDir, stdio: 'inherit' });

console.log('=== [build-marketing] copying marketing/dist -> dist ===');
if (existsSync(outDst)) rmSync(outDst, { recursive: true, force: true });
cpSync(outSrc, outDst, { recursive: true });

console.log('=== [build-marketing] done. Root dist/ is ready for Cloudflare Pages ===');
