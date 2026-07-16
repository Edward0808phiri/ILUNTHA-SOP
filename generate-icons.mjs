// Generates SVG-based PNG icons for the PWA using Canvas API (Node 18+)
// Run: node generate-icons.mjs
import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background gradient (blue)
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#6AAEC8');
  grad.addColorStop(1, '#4E96B0');
  ctx.fillStyle = grad;
  const r = size * 0.22;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.arcTo(size, 0, size, r, r);
  ctx.lineTo(size, size - r);
  ctx.arcTo(size, size, size - r, size, r);
  ctx.lineTo(r, size);
  ctx.arcTo(0, size, 0, size - r, r);
  ctx.lineTo(0, r);
  ctx.arcTo(0, 0, r, 0, r);
  ctx.closePath();
  ctx.fill();

  // "CS" text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.38}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CS', size / 2, size / 2 + size * 0.02);

  writeFileSync(`public/icons/icon-${size}x${size}.png`, canvas.toBuffer('image/png'));
  console.log(`Generated icon-${size}x${size}.png`);
}
console.log('Done.');
