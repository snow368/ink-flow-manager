import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../public/icons');

const BG = '#0f172a';
const ACCENT = '#3b82f6';

const sizes = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
];

async function generate(size, filename) {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="${BG}"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="url(#bg)"/>
    <circle cx="${size * 0.5}" cy="${size * 0.45}" r="${size * 0.22}" fill="${ACCENT}" opacity="0.15"/>
    <text x="${size * 0.5}" y="${size * 0.52}" font-family="system-ui,sans-serif" font-size="${size * 0.35}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">IF</text>
  </svg>`;

  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(outDir, filename));
  console.log(`Generated ${filename} (${size}x${size})`);
}

await Promise.all(sizes.map(({ file, size }) => generate(size, file)));
console.log('Done!');
