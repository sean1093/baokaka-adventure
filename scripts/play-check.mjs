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
 * It also fails when a registered page (listed at `#/pagelab?section=fixtures`) has no scenario:
 * add one with every new page. A scenario can also play a PageLab stage through a live fixture
 * (`SCENARIO_URLS`): `lab-gates` plays 1-3's word flow end to end (#99) — the 「要！」 poke, Mocha's
 * push, the learn beat and its word card, the tutorial, the word ring and 嗶！ — until #107 brings
 * the real 1-3; `hints-c1p2` plays 1-2 with 提示 alone (#100: where, how, then show me until done);
 * `stickers-c1p2` earns all three of 1-2's stickers in the game shell (#101: four rides for the 淘氣,
 * the board flipped and the 土地公 tapped, the solve, the sticker card, then the 目錄's 淘氣 line).
 * Exits 1 on any failure. Part of `npm run qa` (#92) with the visual
 * and UI checks.
 */
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { listPopupFixtures } from './popup-checks.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { values: args } = parseArgs({
  options: { serve: { type: 'boolean' }, url: { type: 'string' }, shots: { type: 'string' } },
});

/** Page-unit gesture scripts per page (data from src/popup/pages/). */
const SCENARIOS = {
  c0p1: [
    // The prologue's lines open the page (#102): read them away, a tap a beat (on a small phone they can cover the tab)
    { readTalk: true },
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
  // 1-3's words (#99), on the lab stage: elements are tapped where they are drawn (`tapEl`)
  'lab-gates': [
    // The fixture opens on its own poke: let it fade, then poke him for real (no word yet: no ring)
    { settle: 2000 },
    { tapEl: '[data-actor="baby"]' },
    { expect: '[data-bark-kind="want"]', absent: '[data-word-ring]' },
    { settle: 600 },
    // Mocha to the counter: the card hits the reader, gate A opens, he learns 嗶！
    { tap: [100, 294] },
    { tapEl: '[data-subtitle]' },
    { tapEl: '[data-word-card]', paused: true },
    { wait: 'reaching' },
    { expect: '[data-glow]' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="beep"]', paused: true },
  ],
  // The hint ladder (#100, GDD § 2.7) on 1-2: 提示 shows where (the halo), then how (the ghost hand),
  // then "show me" plays the solver's next step for real — pressed again and again, it finishes the page
  'hints-c1p2': [
    { wait: 'reaching' },
    { tapEl: '[data-bar="hint"]' },
    { expect: '[data-hint-halo]' },
    // The answer came from the worker's solver, not the fallback
    { expect: '[data-hint-source="solver"]' },
    { tapEl: '[data-bar="hint"]' },
    { expect: '[data-hint-hand]' },
    { showMe: 30 },
  ],
  // Stickers (#101, GDD § 2.8) on 1-2 in the game shell: 淘氣 for riding back and forth twice, the
  // 土地公 behind the flipped board, then the solve and the sticker card with all three
  'stickers-c1p2': [
    { wait: 'reaching' },
    { drag: [[80, 610], [142, 610]] },
    { settle: 1500 },
    { drag: [[140, 610], [76, 610]] },
    { settle: 700 },
    { drag: [[80, 610], [142, 610]] },
    { settle: 700 },
    { drag: [[140, 610], [76, 610]] },
    { settle: 700 },
    { drag: [[80, 610], [142, 610]] },
    { expect: '[data-sticker-pop="mischief"]' },
    { expect: '[data-sticker="淘氣"][data-earned]' },
    { tap: [140, 72] },
    { settle: 900 },
    { tap: [236, 98] },
    { expect: '[data-sticker-pop="tudigong"]' },
    { expect: '[data-sticker="土地公"][data-earned]' },
    { expect: '[data-subtitle]' },
    { settle: 800 },
    { tap: [280, 234] },
    { settle: 2500 },
    { drag: [[140, 610], [205, 610]] },
    { expect: 'svg[data-page][data-done]', timeout: 20_000 },
    { expect: '[data-sticker-card="111"]', timeout: 5_000 },
    // 1-2 is the last page so far: the card, then the 目錄 with the page's 淘氣 (earned)
    { expect: '[data-mischief="c1p2"][data-earned]', timeout: 8_000 },
  ],
  // The prologue's chapter card (#102, GDD § 2.13 / § 5.2 P) in the game shell, from a fresh save:
  // 「開始」 drops the card over the book on the quilt, its lines play a tap a beat (the world held),
  // then the card lifts, the camera comes in and 0-1 opens on the rest of the prologue
  'prologue-card': [
    { fresh: true },
    { tapEl: '[data-button="start"]' },
    { expect: '[data-chapter-board="0"]' },
    { expect: '[data-card-talk="1"] [data-card-line="nar"]', timeout: 6_000 },
    { absent: '[data-subtitle], [data-narration]' },
    { tapEl: '[data-card-next]' },
    { expect: '[data-card-talk="2"] [data-card-line="grandma"]' },
    { tapEl: '[data-card-next]' },
    { expect: '[data-popup-page="c0p1"] [data-narration]', timeout: 6_000 },
    { absent: '[data-chapter-board]' },
  ],
};

/** Scenarios that end somewhere other than their page done (the shell moved on). */
const SCENARIO_ENDS = { 'stickers-c1p2': '[data-screen="contents"]', 'prologue-card': '[data-popup-page="c0p1"] [data-narration]' };
/** Scenarios that start on a screen other than a page (the cover). */
const SCENARIO_READY = { 'prologue-card': '[data-screen="cover"][data-screen-ready]' };

/** Scenarios that start somewhere other than `#/popup?page=<id>`: a PageLab stage, live. */
const SCENARIO_URLS = {
  'lab-gates': '#/pagelab?fixture=word-poke',
  'hints-c1p2': '#/popup?page=c1p2&speed=fast',
  'stickers-c1p2': '#/pagelab?fixture=page-hud',
  'prologue-card': '#/popup',
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
  await page.goto(`${base}${SCENARIO_URLS[id] ?? `#/popup?page=${id}&speed=fast`}`);
  await page.waitForSelector(SCENARIO_READY[id] ?? 'svg[data-page]');
  await page.evaluate(() => document.fonts.ready);
  const toClient = SCENARIO_READY[id] ? null : await mapper(page);
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
    } else if (stepDef.tapEl) {
      // Tap an element where it is drawn (a character, a subtitle, an overlay button)
      const el = await page.waitForSelector(stepDef.tapEl, { timeout: 15_000 });
      await page.waitForTimeout(400);
      if (stepDef.paused) {
        // The word ring and the word card hold the world while they are up (GDD § 2.4)
        const before = await tickOf(page);
        await page.waitForTimeout(900);
        if ((await tickOf(page)) !== before) throw new Error(`the world ticked under ${stepDef.tapEl}`);
      }
      const box = await el.boundingBox();
      if (!box) throw new Error(`${stepDef.tapEl} has no box`);
      await input.down([box.x + box.width / 2, box.y + box.height / 2]);
      await page.waitForTimeout(60);
      await input.up();
      await shot('tap');
    } else if (stepDef.fresh) {
      // A first launch: no save
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.waitForSelector(SCENARIO_READY[id] ?? 'svg[data-page]');
      await page.evaluate(() => document.fonts.ready);
    } else if (stepDef.absent && !stepDef.expect) {
      if (await page.$(stepDef.absent)) throw new Error(`${stepDef.absent} should not be there`);
    } else if (stepDef.readTalk) {
      // Tap the subtitle beat on the page until none is left (a tap on a bubble or the strip is the next beat)
      for (let i = 0; i < 8; i++) {
        const bubble = await page.$('[data-subtitle], [data-narration]');
        if (!bubble) break;
        await page.waitForTimeout(350);
        // On its words (a bubble's box also spans its spring)
        const el = (await bubble.$('text')) ?? bubble;
        const box = await el.boundingBox();
        if (!box) break;
        await input.down([box.x + box.width / 2, box.y + box.height / 2]);
        await page.waitForTimeout(60);
        await input.up();
      }
      await page.waitForTimeout(300);
      if (await page.$('[data-subtitle], [data-narration]')) throw new Error('the page\'s lines did not clear');
      await shot('read');
    } else if (stepDef.showMe) {
      // 提示 at level 3, pressed until the page is done (each press: the hand, then the step played)
      const button = await page.waitForSelector('[data-bar="hint"]');
      for (let i = 0; i < stepDef.showMe && !(await page.$('svg[data-page][data-done]')); i++) {
        const box = await button.boundingBox();
        await input.down([box.x + box.width / 2, box.y + box.height / 2]);
        await page.waitForTimeout(60);
        await input.up();
        await page.waitForTimeout(1700);
      }
      if ((await page.getAttribute('[data-popup-page]', 'data-hint-level')) === null) throw new Error('no hint ladder on the page');
      await shot('show-me');
    } else if (stepDef.expect) {
      await page.waitForSelector(stepDef.expect, { timeout: stepDef.timeout ?? 5_000 });
      if (stepDef.absent && (await page.$(stepDef.absent))) throw new Error(`${stepDef.absent} should not be there`);
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
  await page.waitForSelector(SCENARIO_ENDS[id] ?? 'svg[data-page][data-done]', { timeout: 20_000 });
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
    // Every registered page needs a scenario (PageLab lists the registry)
    const index = await browser.newPage();
    const listed = await listPopupFixtures(index, base);
    await index.close();
    if (!listed) {
      failures++;
      console.log('FAIL could not read the page list at #/pagelab?section=fixtures (a dev server is needed)');
    } else {
      const missing = listed.pages.filter((id) => !SCENARIOS[id]);
      if (missing.length > 0) {
        failures++;
        console.log(`FAIL pages without a play scenario in SCENARIOS: ${missing.join(', ')}`);
      } else console.log(`ok   every registered page has a scenario (${listed.pages.join(', ')})`);
    }
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
