#!/usr/bin/env node
/**
 * The production smoke test and load report for the routing switch (#109): what a visitor to
 * https://sean1093.github.io/baokaka-adventure/ gets, run against the built site (`vite preview`
 * over `dist/`, or a URL such as the live site).
 *
 *   node scripts/prod-check.mjs [--build] [--url <base>]
 *
 *   --build  run `npm run build` first (otherwise `dist/` must exist)
 *   --url    check this base URL instead of previewing `dist/` (e.g. the live site after a deploy)
 *
 * Checks (each fails the run):
 *   - routes   `#/`, `#/popup`, `#/quest` and an unknown hash open 翻翻台北's cover; `#/find` and
 *              `#/sudoku` are rewritten to `#/`; the dev tools (`#/artlab`, `#/pagelab`) are not in
 *              the build and show the cover too.
 *   - play     a fresh visitor: the cover (「開始」) → page 0-1 renders with its characters; a
 *              returning one (0-1 solved): 「繼續」 → page 0-2. No console errors anywhere.
 *   - farewell an old RPG save (`baokaka.quest.v6`) is deleted at boot and the cover says
 *              「寶咖咖的新冒險開始了！」 once; the next boot says nothing.
 *   - fonts    (#68) external font stylesheets (render-blocking) ≤ 60 KB, and the font files the
 *              cover and page 0-1 pull (after `document.fonts.ready`) ≤ 250 KB; each request is
 *              listed in the report.
 *
 * Report only (GDD § M1 budgets, printed, never failing): the bytes transferred until the cover is
 * ready (first load, budget 2.5 MB) and the time until the cover, then page 0-1, is interactive on
 * a throttled 4G link (budget 3 s). The throttle is WebPageTest's "4G" profile: 9 Mbps down,
 * 9 Mbps up, 170 ms round trip, applied through the Chrome DevTools protocol, cache disabled.
 */
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { values: args } = parseArgs({ options: { build: { type: 'boolean' }, url: { type: 'string' } } });

const VIEWPORT = { width: 390, height: 844 };
const FOUR_G = { offline: false, latency: 170, downloadThroughput: (9e6 / 8) | 0, uploadThroughput: (9e6 / 8) | 0 };
const BUDGET = { firstLoadBytes: 2.5 * 1024 * 1024, interactiveMs: 3000, fontCssBytes: 60 * 1024, fontBytes: 250 * 1024 };
/** An external font stylesheet (Google Fonts' `css2`, before #68 self-hosted the fonts) */
const FONT_CSS = /^https:\/\/fonts\.googleapis\.com\//;
const sum = (list) => list.reduce((n, f) => n + f.bytes, 0);
const COVER_READY = '[data-screen="cover"][data-screen-ready]';
const PAGE_READY = '[data-popup-page="c0p1"][data-sprites="ready"] [data-actor="baby"]';
const FAREWELL = '寶咖咖的新冒險開始了！';
/** `popup.save.v1` with 0-1 solved, as `encodeSave` writes it (#93) */
const PLAYED_SAVE = JSON.stringify({ v: 1, pages: { c0p1: 's1' }, photos: {}, furthest: 'c0p2', current: 'c0p2', settings: { speed: 1, bigText: false, elder: false, autoHint: 30, sfx: 80, music: 50, vibrate: true, reduceMotion: null, leftHand: false, tilt: false } });

const run = (cmd, argv) =>
  new Promise((ok, fail) => {
    const child = spawn(cmd, argv, { cwd: ROOT, stdio: 'inherit' });
    child.on('exit', (code) => (code === 0 ? ok() : fail(new Error(`${cmd} ${argv.join(' ')} exited ${code}`))));
  });

async function startPreview() {
  const { preview } = await import('vite');
  const server = await preview({ root: ROOT, logLevel: 'warn', preview: { port: 4173, strictPort: false } });
  const url = server.resolvedUrls?.local[0];
  if (!url) throw new Error('vite preview did not report a local URL');
  return { server, url };
}

const failures = [];
const ok = (label) => console.log(`ok   ${label}`);
const fail = (label, why) => {
  failures.push(label);
  console.log(`FAIL ${label}: ${why}`);
};

/** A fresh visitor's tab, collecting console errors and failed same-origin requests. */
async function openTab(browser, base, init) {
  // `init`: a function, or [function, arg], run before the app boots on every navigation
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  if (init) await (Array.isArray(init) ? context.addInitScript(init[0], init[1]) : context.addInitScript(init));
  const page = await context.newPage();
  const errors = [];
  const origin = new URL(base).origin;
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('requestfailed', (r) => r.url().startsWith(origin) && errors.push(`request failed: ${r.url()}`));
  return { context, page, errors };
}

async function checkRoutes(browser, base) {
  for (const hash of ['#/', '#/popup', '#/quest', '#/no-such-page', '#/artlab', '#/pagelab', '#/find', '#/sudoku']) {
    const label = `route ${hash}`;
    const { context, page, errors } = await openTab(browser, base);
    try {
      await page.goto(new URL(hash, base).href, { waitUntil: 'load' });
      await page.waitForSelector(COVER_READY, { timeout: 20_000 });
      const now = new URL(page.url()).hash;
      if ((hash === '#/find' || hash === '#/sudoku') && now !== '#/') throw new Error(`not rewritten to #/ (now ${now})`);
      if (await page.$('[data-artlab], [data-popup-fixture], [data-pagelab-kit]')) throw new Error('a dev tool rendered in the production build');
      if (errors.length) throw new Error(`console errors: ${errors.join(' | ')}`);
      ok(label);
    } catch (e) {
      fail(label, e.message.split('\n')[0]);
    } finally {
      await context.close();
    }
  }
}

/** Bytes and time to the cover on throttled 4G, then 「開始」 → page 0-1, then a reload → 「繼續」. */
async function checkPlay(browser, base) {
  const { context, page, errors } = await openTab(browser, base);
  const report = {};
  try {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', FOUR_G);
    let bytes = 0;
    // Font traffic (#68): the font files, and any external font stylesheet (render-blocking)
    const fontRequests = new Map();
    const fonts = [];
    cdp.on('Network.requestWillBeSent', (e) => {
      if (e.type === 'Font' || FONT_CSS.test(e.request.url)) fontRequests.set(e.requestId, { url: e.request.url, css: e.type !== 'Font' });
    });
    cdp.on('Network.loadingFinished', (e) => {
      bytes += e.encodedDataLength;
      const font = fontRequests.get(e.requestId);
      if (font) fonts.push({ ...font, bytes: e.encodedDataLength });
    });
    // Every font face the screen asked for has arrived (after the timing, so it does not change it)
    const fontsSettled = async () => {
      await page.evaluate(() => document.fonts.ready);
      return fonts.splice(0);
    };

    const t0 = Date.now();
    await page.goto(new URL('#/', base).href, { waitUntil: 'commit' });
    await page.waitForSelector(`${COVER_READY} [data-button="start"]`, { timeout: 60_000 });
    report.coverMs = Date.now() - t0;
    report.coverBytes = bytes;
    ok(`cover on first launch (「開始」) in ${report.coverMs} ms, ${kb(report.coverBytes)} transferred`);
    report.coverFonts = await fontsSettled();

    const t1 = Date.now();
    await page.click('[data-button="start"]');
    await page.waitForSelector(PAGE_READY, { timeout: 60_000 });
    report.pageMs = Date.now() - t1;
    report.pageBytes = bytes;
    ok(`開始 → page 0-1 renders with its characters in ${report.pageMs} ms (${kb(report.pageBytes)} in total)`);
    report.pageFonts = await fontsSettled();
    const cssBytes = sum([...report.coverFonts, ...report.pageFonts].filter((f) => f.css));
    const fileBytes = sum([...report.coverFonts, ...report.pageFonts].filter((f) => !f.css));
    if (cssBytes > BUDGET.fontCssBytes) fail('font payload', `render-blocking font stylesheets ${kb(cssBytes)} > ${kb(BUDGET.fontCssBytes)}`);
    else if (fileBytes > BUDGET.fontBytes) fail('font payload', `font files for the cover and page 0-1 ${kb(fileBytes)} > ${kb(BUDGET.fontBytes)}`);
    else ok(`font payload: ${kb(cssBytes)} of external font stylesheets, ${kb(fileBytes)} of font files for the cover and page 0-1`);

    if (errors.length) throw new Error(`console errors: ${errors.join(' | ')}`);
    ok('no console errors on the first launch');
  } catch (e) {
    fail('play', e.message.split('\n')[0]);
  } finally {
    await context.close();
  }
  return report;
}

/** A returning player (0-1 solved): 「繼續」 opens 0-2 in one tap. */
async function checkResume(browser, base) {
  const seed = (save) => {
    if (!localStorage.getItem('popup.save.v1')) localStorage.setItem('popup.save.v1', save);
  };
  const { context, page, errors } = await openTab(browser, base, [seed, PLAYED_SAVE]);
  try {
    await page.goto(new URL('#/', base).href, { waitUntil: 'load' });
    await page.waitForSelector(`${COVER_READY} [data-button="resume"]`, { timeout: 20_000 });
    await page.click('[data-button="resume"]');
    await page.waitForSelector('[data-popup-page="c0p2"][data-sprites="ready"] [data-actor="baby"]', { timeout: 20_000 });
    if (errors.length) throw new Error(`console errors: ${errors.join(' | ')}`);
    ok('a returning player: 「繼續」 → page 0-2 renders, no console errors');
  } catch (e) {
    fail('resume', e.message.split('\n')[0]);
  } finally {
    await context.close();
  }
}

async function checkFarewell(browser, base) {
  // Seeds the RPG's last save once, before the app boots on the first navigation only
  const seed = () => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('baokaka.quest.v6', JSON.stringify({ version: 6, run: { chapter: 3 } }));
  };
  const { context, page, errors } = await openTab(browser, base, seed);
  try {
    await page.goto(new URL('#/', base).href, { waitUntil: 'load' });
    await page.waitForSelector(COVER_READY, { timeout: 20_000 });
    const note = await page.$('[data-farewell]');
    if (!note) throw new Error('no farewell note on the cover');
    if (!(await note.isVisible()) || (await note.textContent())?.trim() !== FAREWELL) throw new Error('the note does not show the farewell line');
    const left = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('baokaka.quest')));
    if (left.length) throw new Error(`RPG keys left: ${left.join(', ')}`);
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector(COVER_READY, { timeout: 20_000 });
    if (await page.$('[data-farewell]')) throw new Error('the farewell showed a second time');
    if (errors.length) throw new Error(`console errors: ${errors.join(' | ')}`);
    ok('an old RPG save: deleted, the farewell shown once, no crash');
  } catch (e) {
    fail('farewell', e.message.split('\n')[0]);
  } finally {
    await context.close();
  }
}

const kb = (n) => `${Math.round(n / 1024)} KB`;

async function main() {
  if (args.build && !args.url) await run('npm', ['run', 'build']);
  let server = null;
  let base = args.url;
  if (!base) ({ server, url: base } = await startPreview());
  console.log(`Checking ${base}`);
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  try {
    await checkRoutes(browser, base);
    const report = await checkPlay(browser, base);
    await checkResume(browser, base);
    await checkFarewell(browser, base);
    if (report.coverMs !== undefined) {
      console.log('\nLoad report (throttled 4G: 9 Mbps, 170 ms RTT; report only)');
      console.log(`  first load (to the cover)   ${kb(report.coverBytes)} of ${kb(BUDGET.firstLoadBytes)}${report.coverBytes > BUDGET.firstLoadBytes ? '  OVER' : ''}`);
      console.log(`  cover interactive           ${report.coverMs} ms of ${BUDGET.interactiveMs}${report.coverMs > BUDGET.interactiveMs ? '  OVER' : ''}`);
      if (report.pageMs !== undefined) console.log(`  開始 → page 0-1 interactive  ${report.pageMs} ms (${kb(report.pageBytes - report.coverBytes)} more)`);
      for (const [step, list] of [['cover', report.coverFonts], ['page 0-1', report.pageFonts]]) {
        if (!list) continue;
        console.log(`  fonts, ${step}: ${kb(sum(list))} in ${list.length} request(s)`);
        for (const f of list) console.log(`    ${kb(f.bytes).padStart(8)}  ${f.css ? '(css) ' : ''}${f.url.replace(/^.*\//, '').slice(0, 72)}`);
      }
    }
  } finally {
    await browser.close();
    await new Promise((done) => (server ? server.httpServer.close(done) : done()));
  }
  if (failures.length) {
    console.log(`\n${failures.length} check(s) failed`);
    process.exit(1);
  }
  console.log('\nAll production checks passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
