// Render each mock HTML to a 390x844 PNG.
// Usage (from repo root): PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node docs/design/mocks/src/render.mjs
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const names = process.argv.slice(2).length ? process.argv.slice(2) : ['pop-up-taipei', 'snap-first-album', 'stroller-break'];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
for (const n of names) {
  await page.goto(pathToFileURL(path.join(here, `${n}.html`)).href);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(here, '..', `${n}.png`) });
  console.log('rendered', n);
}
await browser.close();
