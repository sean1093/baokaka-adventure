#!/usr/bin/env node
/**
 * Plays pages of 翻翻台北 to completion through real pointer input (issue #90; GDD § 2.6), with a
 * mouse and with touch emulation, at 390×844 and 375×667. Each scenario drives the page the way a
 * player would — drags along tab tracks, taps on perches — and passes when the page reports
 * `data-done`. It also checks that a finger down pauses the world (the tick stops) and that no
 * console errors appear.
 *
 *   node scripts/play-check.mjs [--serve] [--url <base>] [--shots <dir>]
 *
 *   --serve    start a Vite dev server for the run
 *   --url      base URL of a server you started yourself (default http://localhost:5173/baokaka-adventure/)
 *   --shots    write a PNG per step into this directory
 *
 * Exits 1 on any failure. Manual until #92 folds it into the visual QA run.
 */
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { values: args } = parseArgs({
  options: { serve: { type: 'boolean' }, url: { type: 'string' }, shots: { type: 'string' } },
});

/** Page-unit gesture scripts per page (data from src/popup/pages/). */
const SCENARIOS = {
  c0p1: [
    // Pull the crib-rail tab down along its track (150,480 → 150,540)
    { drag: [[150, 480], [150, 545]] },
  ],
  c1p2: [
    { wait: 'reaching' },
    // The train tab out → half (stops at x 80 / 140 / 200 on y 610)
    { drag: [[80, 610], [142, 610]] },
    { settle: 1500 },
    // Mocha to the pillar: the pigeon flees the track
    { tap: [280, 234] },
    { settle: 2500 },
    // half → full
    { drag: [[140, 610], [205, 610]] },
  ],
};

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 375, height: 667 },
];

async function startServer() {
  const { createServer } = await import('vite');
  const server = await createServer({ root: ROOT, logLevel: 'warn', server: { port: 5174, strictPort: false } });
  await server.listen();
  const url = server.resolvedUrls?.local[0];
  if (!url) throw new Error('Vite dev server did not report a local URL');
  return { server, url };
}

/** Page units → client px, read off the page SVG's view box and its box on screen. */
async function mapper(page) {
  const m = await page.evaluate(() => {
    const svg = document.querySelector('svg[data-page]');
    const r = svg.getBoundingClientRect();
    const [x, y, w, h] = svg.getAttribute('viewBox').split(/\s+/).map(Number);
    return { left: r.left, top: r.top, sx: r.width / w, sy: r.height / h, x, y };
  });
  return ([u, v]) => [m.left + (u - m.x) * m.sx, m.top + (v - m.y) * m.sy];
}

/** A pointer driver: the mouse, or one finger through CDP touch events (Chromium makes pointer events of them). */
async function driver(page, kind) {
  if (kind === 'mouse') {
    return {
      async down([x, y]) { await page.mouse.move(x, y); await page.mouse.down(); },
      async move([x, y]) { await page.mouse.move(x, y); },
      async up() { await page.mouse.up(); },
    };
  }
  const cdp = await page.context().newCDPSession(page);
  let at = [0, 0];
  const send = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
  return {
    async down(p) { at = p; await send('touchStart', [{ x: p[0], y: p[1], id: 1 }]); },
    async move(p) { at = p; await send('touchMove', [{ x: p[0], y: p[1], id: 1 }]); },
    async up() { await send('touchEnd', []); void at; },
  };
}

const tickOf = (page) => page.evaluate(() => Number(document.querySelector('svg[data-page]').getAttribute('data-tick')));

async function run(page, base, id, kind, viewport, shots) {
  await page.setViewportSize(viewport);
  await page.goto(`${base}#/popup?page=${id}&speed=fast`);
  await page.waitForSelector('svg[data-page]');
  await page.evaluate(() => document.fonts.ready);
  const toClient = await mapper(page);
  const input = await driver(page, kind);
  let n = 0;
  const shot = async (label) => {
    if (!shots) return;
    await page.screenshot({ path: join(shots, `${id}-${kind}-${viewport.width}-${String(++n).padStart(2, '0')}-${label}.png`) });
  };
  await shot('start');
  let pauseChecked = false;
  for (const stepDef of SCENARIOS[id]) {
    if (stepDef.wait) {
      await page.waitForSelector(`[data-actor="baby"][data-mode="${stepDef.wait}"]`, { timeout: 10_000 });
    } else if (stepDef.settle) {
      await page.waitForTimeout(stepDef.settle);
    } else if (stepDef.tap) {
      await input.down(toClient(stepDef.tap));
      await page.waitForTimeout(60);
      await input.up();
      await shot('tap');
    } else if (stepDef.drag) {
      const [a, b] = stepDef.drag;
      await input.down(toClient(a));
      for (let i = 1; i <= 12; i++) {
        const t = i / 12;
        await input.move(toClient([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]));
        await page.waitForTimeout(16);
      }
      if (!pauseChecked) {
        // Touch pauses the world: no tick runs while the finger is down
        const before = await tickOf(page);
        await page.waitForTimeout(900);
        const after = await tickOf(page);
        if (after !== before) throw new Error(`the world ticked while a finger was down (${before} → ${after})`);
        const dragging = await page.$('[data-dragging]');
        if (!dragging) throw new Error('no part flagged data-dragging during a drag');
        pauseChecked = true;
      }
      await shot('drag');
      await input.up();
    }
  }
  await page.waitForSelector('svg[data-page][data-done]', { timeout: 20_000 });
  await page.waitForTimeout(400);
  await shot('done');
}

async function main() {
  const { chromium } = await import('playwright');
  const started = args.url ? null : args.serve ? await startServer() : null;
  const base = args.url ?? started?.url ?? 'http://localhost:5173/baokaka-adventure/';
  if (args.shots) await mkdir(args.shots, { recursive: true });
  const browser = await chromium.launch();
  let failures = 0;
  try {
    for (const kind of ['mouse', 'touch']) {
      for (const viewport of VIEWPORTS) {
        const context = await browser.newContext({ viewport, deviceScaleFactor: 2, hasTouch: kind === 'touch', isMobile: kind === 'touch' });
        for (const id of Object.keys(SCENARIOS)) {
          const page = await context.newPage();
          const errors = [];
          page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
          page.on('pageerror', (e) => errors.push(String(e)));
          const label = `${id} · ${kind} · ${viewport.width}×${viewport.height}`;
          try {
            await run(page, base, id, kind, viewport, args.shots);
            if (errors.length) throw new Error(`console errors: ${errors.join(' | ')}`);
            console.log(`ok   ${label}`);
          } catch (e) {
            failures++;
            console.log(`FAIL ${label}: ${e.message.split('\n')[0]}`);
          }
          await page.close();
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
    await started?.server.close();
  }
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
