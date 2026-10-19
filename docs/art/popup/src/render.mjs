// Render the Pop-Up Taipei style proofs to 390x844 @2x PNGs in docs/art/popup/.
// Usage (repo root): PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node docs/art/popup/src/render.mjs [name ...]
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const all = ['proof-a-station', 'proof-b-taipei101', 'proof-c-page-turn', 'proof-d-swatches'];
const names = process.argv.slice(2).length ? process.argv.slice(2) : all;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
for (const n of names) {
  await page.goto(pathToFileURL(path.join(here, `${n}.html`)).href);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(here, '..', `${n}.png`) });
  console.log('rendered', n);
}
await browser.close();
