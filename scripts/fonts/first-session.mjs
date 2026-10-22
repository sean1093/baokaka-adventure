#!/usr/bin/env node
/**
 * Records the characters a first session puts on screen (#68, D-105): the cover, 「開始」 and page
 * 0-1 with the prologue lines it plays. Their glyphs go into each font's first file
 * (`src/fonts/first-session.txt`, read by `scripts/fonts/subset.py`), so a new visitor downloads
 * one small file per face instead of the whole game's character set.
 *
 *   npm run build && node scripts/fonts/first-session.mjs [--taps <n>]
 *
 * Runs against `dist/` through `vite preview`. Every text node the page shows is collected while it
 * plays (a MutationObserver from the first byte). The list only steers which file a glyph lands in:
 * a character missed here is still in a later file, so it can cost a download, never a glyph.
 */
import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = resolve(ROOT, 'src/fonts/first-session.txt');
const { values: args } = parseArgs({ options: { taps: { type: 'string', default: '20' } } });

const COVER_READY = '[data-screen="cover"][data-screen-ready] [data-button="start"]';
const PAGE_READY = '[data-popup-page="c0p1"][data-sprites="ready"] [data-actor="baby"]';

/** In the page, before the app boots: gather the text of every node that is ever shown. */
function collect() {
  const seen = new Set();
  const add = (node) => {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    for (let t = node.nodeType === Node.TEXT_NODE ? node : walker.nextNode(); t; t = walker.nextNode()) {
      const tag = t.parentElement?.tagName.toLowerCase();
      if (tag !== 'script' && tag !== 'style' && tag !== 'title') for (const c of t.data) seen.add(c);
    }
  };
  new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'characterData') add(r.target);
      else r.addedNodes.forEach(add);
    }
  }).observe(document, { subtree: true, childList: true, characterData: true });
  window.__seenChars = () => [...seen].join('');
}

async function main() {
  const { preview } = await import('vite');
  const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4174, strictPort: false } });
  const base = server.resolvedUrls?.local[0];
  if (!base) throw new Error('vite preview did not report a local URL');
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    await context.addInitScript(collect);
    const page = await context.newPage();
    await page.goto(new URL('#/', base).href);
    await page.waitForSelector(COVER_READY, { timeout: 60_000 });
    await page.click('[data-button="start"]');
    await page.waitForSelector(PAGE_READY, { timeout: 60_000 });
    // The prologue's card plays its lines on its own (a tap would skip it): let it, then read the
    // page's lines on with taps on the paper's top edge, as a player does (#183)
    await page.waitForTimeout(45_000);
    for (let t = 0; t < Number(args.taps); t += 1) {
      await page.touchscreen.tap(195, 70);
      await page.waitForTimeout(3000);
    }
    const text = await page.evaluate(() => window.__seenChars());
    const chars = [...new Set(text)].filter((c) => c === ' ' || !/[\p{C}\p{Z}]/u.test(c));
    chars.sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
    await writeFile(OUT, `${chars.join('')}\n`);
    console.log(`${chars.length} characters (${chars.filter((c) => c > '\x7f').length} beyond ASCII) → ${OUT}`);
  } finally {
    await browser.close();
    await new Promise((done) => server.httpServer.close(done));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
