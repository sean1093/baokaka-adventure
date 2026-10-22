#!/usr/bin/env node
/**
 * The frame-rate and animated-node gate (#136; GDD § 8 technical gates, § 3.9; art bible § 9),
 * measured on the **production build** (`vite preview` over `dist/`), where React runs without its
 * dev checks and the code is minified, as a player gets it.
 *
 *   node scripts/perf-check.mjs [--build] [--url <base>] [--pages c1p6,c9p2|all] [--seconds 6] [--throttle 4]
 *
 *   --build     run `npm run build` first (otherwise `dist/` must exist)
 *   --url       measure this base URL instead of previewing `dist/` (e.g. the live site)
 *   --pages     the pages to measure: a comma list, `all` (every registered page, ≈ 10 min), or
 *               by default `PERF_PAGES`: the heaviest page of each chapter (below)
 *   --throttle  the CPU slowdown (default 4: the GDD's "2021 mid-range Android" stand-in)
 *
 * Each page opens at `#/?page=<id>&demo=1` (`PopupGame`, every build): three idle ticks, then the
 * page's authored solution played through the session, one input per tick, so every part moves,
 * every ride rides and the bead is grabbed. The page is phone-sized (390×844 at DPR 3, touch) with
 * the CPU throttled. A rAF sampler counts the frames from the first input to the end of the
 * solution and, every 500 ms, the animated nodes (the `data-anim` groups and everything in them,
 * GDD § 3.9). Fails when:
 *
 *   - fps         the frames per second over the replay < 55 (GDD § 8: ≥ 55 fps sustained);
 *   - window      the worst 1 s window < 45 fps (a hitch the average would hide);
 *   - nodes       more than 150 animated nodes at any sample (§ 3.9);
 *   - grain       a live grain or noise layer (an `feTurbulence` anywhere on the page, bible § 9.1);
 *   - 3d          `transform-style: preserve-3d` on anything in play (bible § 9.2);
 *   - errors      a console error.
 *
 * Headless Chromium rasterises on the CPU (no GPU here), so these numbers are a floor: a phone's
 * GPU composites the page's bitmaps for free. `--pages all` prints the whole table; `PERF_PAGES`
 * is regenerated from it (the heaviest page per chapter by fps, then by nodes).
 */
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { values: args } = parseArgs({
  options: {
    build: { type: 'boolean', default: false },
    url: { type: 'string' },
    pages: { type: 'string' },
    seconds: { type: 'string' },
    throttle: { type: 'string', default: '4' },
  },
});

export const BUDGET = { fps: 55, windowFps: 45, nodes: 150 };

/**
 * The heaviest pages of each chapter (and 尾聲, 番外) on the production build, from a `--pages all`
 * run (#136): per chapter the page with the lowest fps and the one with the most animated nodes
 * (and 7-6 and 10-6, the longest replays).
 */
export const PERF_PAGES = ['c0p1', 'c0p3', 'c1p3', 'c1p6', 'c2p3', 'c2p6', 'c3p1', 'c3p3', 'c4p5', 'c4p6', 'c5p1', 'c5p2', 'c6p2', 'c6p4', 'c7p2', 'c7p6', 'c8p5', 'c8p6', 'c9p2', 'c9p4', 'c10p1', 'c10p2', 'c10p6', 'c11p1', 'c12p1'];

const VIEWPORT = { width: 390, height: 844 };

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

/** Every registered page id, read from the build's own 目錄 order (the solver's ids, `c<ch>p<n>`). */
const ALL = (() => {
  const out = [];
  for (const [ch, n] of [[0, 4], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 1], [12, 1]]) for (let p = 1; p <= n; p++) out.push(`c${ch}p${p}`);
  return out;
})();

/** Runs in the page: samples frames until the page is done (plus a beat), or `capMs`. */
function sample({ capMs, tailMs }) {
  return new Promise((done) => {
    const box = () => document.querySelector('[data-popup-page] svg[data-tick], [data-popup-page] [data-tick]');
    const t0 = performance.now();
    const stamps = [];
    let nodes = 0;
    let nodeSamples = 0;
    let doneAt = null;
    const countNodes = () => {
      const n = document.querySelectorAll('[data-anim], [data-anim] *').length;
      nodes = Math.max(nodes, n);
      nodeSamples += 1;
    };
    const timer = setInterval(countNodes, 500);
    countNodes();
    const tick = (now) => {
      stamps.push(now);
      const el = box();
      if (doneAt === null && el?.hasAttribute('data-done')) doneAt = now;
      if (now - t0 < capMs && (doneAt === null || now - doneAt < tailMs)) requestAnimationFrame(tick);
      else {
        clearInterval(timer);
        countNodes();
        // A live grain layer or 3D in play (bible § 9)
        const grain = document.querySelectorAll('[data-popup-page] feTurbulence').length;
        const threeD = [...document.querySelectorAll('[data-popup-page] *')].filter((e) => getComputedStyle(e).transformStyle === 'preserve-3d').length;
        done({ stamps, nodes, nodeSamples, done: doneAt !== null, ticks: Number(box()?.getAttribute('data-tick') ?? 0), grain, threeD });
      }
    };
    requestAnimationFrame(tick);
  });
}

/** fps over the whole run, and the worst 1 s sliding window. */
export function frameStats(stamps) {
  if (stamps.length < 2) return { fps: 0, worst: 0, p95: 0, seconds: 0 };
  const seconds = (stamps[stamps.length - 1] - stamps[0]) / 1000;
  const fps = (stamps.length - 1) / seconds;
  let worst = Infinity;
  let j = 0;
  for (let i = 0; i < stamps.length; i++) {
    while (j < stamps.length && stamps[j] - stamps[i] < 1000) j++;
    if (j >= stamps.length) break;
    worst = Math.min(worst, (j - i - 1) / ((stamps[j - 1] - stamps[i]) / 1000));
  }
  const gaps = stamps.slice(1).map((t, i) => t - stamps[i]).sort((a, b) => a - b);
  return { fps, worst: Number.isFinite(worst) ? worst : fps, p95: gaps[Math.floor((gaps.length - 1) * 0.95)], seconds };
}

async function measure(browser, base, id, throttle) {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  try {
    // Load and decode unthrottled (the load is check:prod's), then throttle for the replay
    await page.goto(new URL(`#/?page=${id}&paused=1`, base).href, { waitUntil: 'load' });
    await page.waitForSelector(`[data-popup-page="${id}"][data-sprites="ready"]`, { timeout: 60_000 });
    await page.evaluate(() => document.fonts.ready);
    await page.goto(new URL(`#/?page=${id}&demo=1`, base).href, { waitUntil: 'load' });
    await page.waitForSelector(`[data-popup-page="${id}"][data-sprites="ready"]`, { timeout: 60_000 });
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
    const sampling = page.evaluate(sample, { capMs: Number(args.seconds ?? 0) * 1000 || 45_000, tailMs: 1500 });
    // Lines that hold the world (page E's cheers) are read away as a player would, once the clock
    // has stood still under them for a while: a tap on the page's sky, never on a touchable
    let finished = false;
    void sampling.finally(() => (finished = true));
    let last = null;
    let still = 0;
    while (!finished) {
      await page.waitForTimeout(700);
      if (finished) break;
      const tick = await page.evaluate(() => document.querySelector('[data-popup-page] svg[data-tick]')?.getAttribute('data-tick') ?? null).catch(() => null);
      still = tick === last ? still + 1 : 0;
      last = tick;
      if (still >= 3 && (await page.$('[data-subtitle], [data-narration]'))) {
        await page.touchscreen.tap(40, 130).catch(() => {});
        still = 0;
      }
    }
    const result = await sampling;
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    return { ...result, ...frameStats(result.stamps), errors };
  } finally {
    await context.close();
  }
}

async function main() {
  if (args.build && !args.url) await run('npm', ['run', 'build']);
  let server = null;
  let base = args.url;
  if (!base) ({ server, url: base } = await startPreview());
  const pages = args.pages === 'all' ? ALL : args.pages ? args.pages.split(',') : PERF_PAGES;
  const throttle = Number(args.throttle);
  console.log(`Perf: ${base} (production build), ${pages.length} page(s), ${VIEWPORT.width}×${VIEWPORT.height} @3x, ${throttle}× CPU throttle, the solution replayed`);
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const rows = [];
  const failures = [];
  try {
    for (const id of pages) {
      const r = await measure(browser, base, id, throttle);
      const why = [];
      if (r.fps < BUDGET.fps) why.push(`fps ${r.fps.toFixed(1)} < ${BUDGET.fps}`);
      if (r.worst < BUDGET.windowFps) why.push(`worst 1 s ${r.worst.toFixed(1)} fps < ${BUDGET.windowFps}`);
      if (r.nodes > BUDGET.nodes) why.push(`${r.nodes} animated nodes > ${BUDGET.nodes}`);
      if (r.grain > 0) why.push(`${r.grain} live grain filter(s)`);
      if (r.threeD > 0) why.push(`${r.threeD} preserve-3d element(s) in play`);
      if (!r.done) why.push('the solution did not finish (demo)');
      if (r.errors.length) why.push(`console errors: ${r.errors.join(' | ')}`);
      if (why.length) failures.push(`${id}: ${why.join('; ')}`);
      const row = { page: id, fps: Number(r.fps.toFixed(1)), 'worst 1 s': Number(r.worst.toFixed(1)), 'p95 ms': Number(r.p95.toFixed(1)), seconds: Number(r.seconds.toFixed(1)), ticks: r.ticks, 'anim nodes': r.nodes, status: why.length ? 'FAIL' : 'ok' };
      rows.push(row);
      console.log(`${row.status.padEnd(4)} ${id.padEnd(6)} ${String(row.fps).padStart(5)} fps (worst 1 s ${row['worst 1 s']}, p95 ${row['p95 ms']} ms) over ${row.seconds} s, ${r.nodes} animated nodes`);
    }
  } finally {
    await browser.close();
    await new Promise((done) => (server ? server.httpServer.close(done) : done()));
  }
  console.table(rows);
  console.log(`Budgets: ≥ ${BUDGET.fps} fps over the replay, ≥ ${BUDGET.windowFps} fps in the worst 1 s, ≤ ${BUDGET.nodes} animated nodes; no live grain, no preserve-3d in play.`);
  if (failures.length) {
    console.error(`\nPerf check failed:\n  ${failures.join('\n  ')}`);
    process.exit(1);
  }
  console.log('\nPerf check passed');
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain)
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
