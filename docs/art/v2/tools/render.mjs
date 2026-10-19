// Render an .svg or .html file to PNG (or WebP) with headless Chromium.
// usage: node render.mjs <in.svg|in.html> <out.png|out.webp> [width] [height] [scale]
//   SVG: drawn to exactly width x height CSS px (viewBox fitted), transparent background.
//   HTML: page viewport width x height, full page screenshot.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [inp, out, w = '1000', h = '1000', s = '1'] = process.argv.slice(2);
const W = +w, H = +h, S = +s;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: S });
if (inp.endsWith('.svg')) {
  const svg = readFileSync(inp, 'utf8');
  await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">
  <div style="width:${W}px;height:${H}px">${svg.replace(/<svg /, `<svg width="${W}" height="${H}" `)}</div></body></html>`);
} else {
  await page.goto('file://' + resolve(inp));
}
await page.waitForLoadState('networkidle').catch(() => {});
await page.evaluate(() => document.fonts && document.fonts.ready);
const webp = out.endsWith('.webp');
const buf = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: W, height: H }, type: 'png' });
if (webp) {
  // re-encode via the browser's canvas so we need no native image deps
  const b64 = buf.toString('base64');
  const data = await page.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    c.getContext('2d').drawImage(img, 0, 0);
    return c.toDataURL('image/webp', 0.9).split(',')[1];
  }, b64);
  writeFileSync(out, Buffer.from(data, 'base64'));
} else writeFileSync(out, buf);
await browser.close();
console.log('wrote', out);
