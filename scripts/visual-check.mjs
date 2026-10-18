#!/usr/bin/env node
/**
 * Visual QA (docs/project/README.md § Visual QA, art-direction § 8.6, decisions.md D-18).
 *
 *   node scripts/visual-check.mjs [--serve] [--url <base>] [--update] [--perf] [--only a,b]
 *
 * Screenshots every target in scripts/visual-targets.mjs (plus every art lab fixture) at each
 * viewport into artifacts/visual/<viewport>/<name>.png, then either diffs them against
 * tests/visual-baseline/ (default; writes <name>.diff.png and exits 1 on a failure) or, with
 * --update, copies them over the baselines.
 *
 *   --serve    start a Vite dev server for the run (the art lab exists only in dev builds)
 *   --url      base URL of a server you started yourself (default http://localhost:5173/baokaka-adventure/)
 *   --update   accept the new screenshots as baselines
 *   --perf     also measure frame times on the world fixture at 4x CPU throttle (report only)
 *   --perf-fixture <name>  walk around another fixture instead (e.g. world-follower, the park)
 *   --only     comma list of target names
 *
 * Needs Playwright's Chromium: preinstalled in the agent environment (PLAYWRIGHT_BROWSERS_PATH=
 * /opt/pw-browsers); elsewhere run `npx playwright install chromium` once. Local only: the deploy
 * workflow never runs this.
 */
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import pixelmatch from 'pixelmatch';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { PERF_FIXTURE, TARGETS, VIEWPORTS, fixtureTarget } from './visual-targets.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'artifacts', 'visual');
const BASELINE = join(ROOT, 'tests', 'visual-baseline');

/** pixelmatch's per-pixel colour threshold, and the share of differing pixels that fails a target. */
const THRESHOLD = 0.1;
const MAX_DIFF_RATIO = 0.005;
/** The DOM must stay unchanged this long before a screenshot (typewriter text, lazy chunks). */
const QUIET_MS = 500;
const QUIET_CAP_MS = 8000;
/** Art direction § 8.5 Performance budget. */
const FRAME_BUDGET_MS = 12;
const DOM_BUDGET = 3000;
const PERF_SECONDS = 3;

const { values: args } = parseArgs({
  options: {
    serve: { type: 'boolean', default: false },
    url: { type: 'string', default: 'http://localhost:5173/baokaka-adventure/' },
    update: { type: 'boolean', default: false },
    perf: { type: 'boolean', default: false },
    'perf-fixture': { type: 'string', default: PERF_FIXTURE },
    only: { type: 'string' },
  },
});

async function startDevServer() {
  const { createServer } = await import('vite');
  const server = await createServer({ root: ROOT, logLevel: 'warn', server: { port: 5173, strictPort: false } });
  await server.listen();
  const url = server.resolvedUrls?.local[0];
  if (!url) throw new Error('Vite dev server did not report a local URL');
  return { server, url };
}

/** Resolves once nothing in the DOM has changed for QUIET_MS (or after QUIET_CAP_MS regardless). */
const waitForQuiet = (page) =>
  page.evaluate(
    ({ quiet, cap }) =>
      new Promise((done) => {
        let timer = setTimeout(finish, quiet);
        const observer = new MutationObserver(() => {
          clearTimeout(timer);
          timer = setTimeout(finish, quiet);
        });
        const hardStop = setTimeout(finish, cap);
        function finish() {
          observer.disconnect();
          clearTimeout(timer);
          clearTimeout(hardStop);
          done();
        }
        observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true });
      }),
    { quiet: QUIET_MS, cap: QUIET_CAP_MS },
  );

async function openTarget(page, base, target) {
  // A fresh document per target: no state (or saved game) leaks from the previous one
  await page.goto('about:blank');
  await page.goto(new URL(target.hash, base).href, { waitUntil: 'load' });
  if (target.waitFor) await page.waitForSelector(target.waitFor, { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await waitForQuiet(page);
}

/** Fixture names, read from the art lab index so new fixtures are picked up without edits here. */
async function listFixtures(page, base) {
  await page.goto(new URL('#/artlab?section=fixtures', base).href, { waitUntil: 'load' });
  try {
    await page.waitForSelector('[data-fixture]', { timeout: 20000 });
  } catch {
    return null;
  }
  return page.$$eval('[data-fixture]', (items) => items.map((item) => item.getAttribute('data-fixture')));
}

function compare(actualPath, baselinePath, diffPath) {
  return Promise.all([readFile(actualPath), readFile(baselinePath)]).then(async ([actualBuffer, baselineBuffer]) => {
    const actual = PNG.sync.read(actualBuffer);
    const baseline = PNG.sync.read(baselineBuffer);
    if (actual.width !== baseline.width || actual.height !== baseline.height) {
      return { ok: false, detail: `size ${actual.width}x${actual.height} vs baseline ${baseline.width}x${baseline.height}` };
    }
    const diff = new PNG({ width: actual.width, height: actual.height });
    const pixels = pixelmatch(actual.data, baseline.data, diff.data, actual.width, actual.height, { threshold: THRESHOLD });
    const ratio = pixels / (actual.width * actual.height);
    const ok = ratio <= MAX_DIFF_RATIO;
    if (ok) await rm(diffPath, { force: true });
    else await writeFile(diffPath, PNG.sync.write(diff));
    return { ok, detail: `${(ratio * 100).toFixed(3)}% (${pixels} px)` };
  });
}

const percentile = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];

async function measurePerf(browser, base) {
  const viewport = VIEWPORTS[0];
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const fixture = args['perf-fixture'];
  const target = { ...fixtureTarget(fixture), hash: `#/artlab?section=fixtures&only=${fixture}` };
  await openTarget(page, base, target);

  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Performance.enable');
  const taskTime = async () => (await cdp.send('Performance.getMetrics')).metrics.find((metric) => metric.name === 'TaskDuration')?.value ?? 0;
  const tasksBefore = await taskTime();

  // The map frame: IsoMap's tap layer
  const frame = await page.locator('[data-iso-map]').first().boundingBox();
  if (!frame) throw new Error('--perf: could not find the world map frame');

  const sampling = page.evaluate(
    (ms) =>
      new Promise((done) => {
        const frames = [];
        let walking = 0;
        // The ground must be one SVG that walking never touches (#13): count mutations inside it
        let groundMutations = 0;
        const grounds = document.querySelectorAll('svg[data-ground]');
        const observer = new MutationObserver((records) => {
          groundMutations += records.length;
        });
        grounds.forEach((ground) => observer.observe(ground, { subtree: true, childList: true, attributes: true, characterData: true }));
        let last = performance.now();
        const start = last;
        const tick = (now) => {
          frames.push(now - last);
          last = now;
          if (document.querySelector('.walk')) walking += 1;
          if (now - start < ms) requestAnimationFrame(tick);
          else {
            observer.disconnect();
            done({ frames: frames.slice(1), walking, nodes: document.querySelectorAll('*').length, grounds: grounds.length, groundMutations });
          }
        };
        requestAnimationFrame(tick);
      }),
    PERF_SECONDS * 1000,
  );

  // Keep the party walking so the camera pans the whole time: tap spots around the room in turn
  // (some land on furniture or walls and do nothing), and after a walk starts, wait for it to end
  const spots = [
    [0.2, 0.8],
    [0.8, 0.25],
    [0.5, 0.85],
    [0.3, 0.3],
    [0.8, 0.7],
    [0.5, 0.2],
  ];
  const deadline = Date.now() + PERF_SECONDS * 1000;
  for (let index = 0; Date.now() < deadline; index += 1) {
    const [fx, fy] = spots[index % spots.length];
    await page.touchscreen.tap(frame.x + frame.width * fx, frame.y + frame.height * fy);
    await page.waitForTimeout(150);
    while (Date.now() < deadline && (await page.locator('.walk').count()) > 0) await page.waitForTimeout(100);
  }

  const { frames, walking, nodes, grounds, groundMutations } = await sampling;
  // Main-thread work per frame (script, style, layout, paint), throttled: what the 12 ms budget is about
  const busy = ((await taskTime()) - tasksBefore) * 1000;
  await context.close();
  const sorted = [...frames].sort((a, b) => a - b);
  const median = percentile(sorted, 0.5);
  const p95 = percentile(sorted, 0.95);
  console.log(`\nPerf: '${fixture}' fixture, ${viewport.name}, 4x CPU throttle, ${PERF_SECONDS}s while walking`);
  console.table({
    frames: { value: frames.length },
    'frames while walking': { value: walking },
    'median ms': { value: Number(median.toFixed(2)), budget: `<= ${FRAME_BUDGET_MS} (§ 8.5), <= 16 (§ 8.6)` },
    'p95 ms': { value: Number(p95.toFixed(2)) },
    'max ms': { value: Number(sorted[sorted.length - 1].toFixed(2)) },
    'main-thread ms / frame': { value: Number((busy / Math.max(1, frames.length)).toFixed(2)), budget: `<= ${FRAME_BUDGET_MS} (§ 8.5)` },
    'DOM nodes': { value: nodes, budget: `<= ${DOM_BUDGET}` },
    'ground SVGs': { value: grounds, budget: '1' },
    'ground mutations while walking': { value: groundMutations, budget: '0' },
  });
  console.log('rAF intervals are vsync-bound: 16.7 ms is the floor at 60 Hz, so the § 8.5 12 ms budget needs a trace to verify.');
  if (walking === 0) console.warn('Perf: the party never walked; the taps may have missed the floor.');
  // Report only for now; issue #57 turns the budget into a failure
}

async function main() {
  let server = null;
  let base = args.url;
  if (args.serve) {
    ({ server, url: base } = await startDevServer());
    console.log(`Dev server: ${base}`);
  }

  const browser = await chromium.launch();
  const failures = [];
  const rows = [];
  try {
    const probe = await browser.newPage();
    const fixtures = await listFixtures(probe, base);
    await probe.close();
    if (!fixtures) console.warn('No art lab at this URL (production build?): only non-art-lab targets will run.');

    const only = args.only ? new Set(args.only.split(',')) : null;
    const targets = [...TARGETS, ...(fixtures ?? []).map(fixtureTarget)]
      .filter((target) => fixtures || !target.artlab)
      .filter((target) => !only || only.has(target.name));
    if (targets.length === 0) throw new Error('No targets to run');
    const names = targets.map((target) => target.name);
    const clash = names.find((name, index) => names.indexOf(name) !== index);
    if (clash) throw new Error(`Two targets are named '${clash}': rename the fixture or the target`);

    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });

      const outDir = join(OUT, viewport.name);
      const baseDir = join(BASELINE, viewport.name);
      await mkdir(outDir, { recursive: true });
      if (args.update) await mkdir(baseDir, { recursive: true });

      for (const target of targets) {
        errors.length = 0;
        const file = `${target.name}.png`;
        const actualPath = join(outDir, file);
        await openTarget(page, base, target);
        await page.screenshot({ path: actualPath, fullPage: Boolean(target.fullPage), animations: 'disabled', caret: 'hide' });

        let status;
        let detail = '';
        if (args.update) {
          await copyFile(actualPath, join(baseDir, file));
          status = 'updated';
        } else if (!existsSync(join(baseDir, file))) {
          status = 'NO BASELINE';
          failures.push(`${viewport.name}/${target.name}`);
        } else {
          const result = await compare(actualPath, join(baseDir, file), join(outDir, `${target.name}.diff.png`));
          status = result.ok ? 'ok' : 'FAIL';
          detail = result.detail;
          if (!result.ok) failures.push(`${viewport.name}/${target.name}`);
        }
        if (errors.length > 0) {
          status = `${status} + console errors`;
          detail = `${detail} ${errors.join(' | ')}`.trim();
          failures.push(`${viewport.name}/${target.name} (console)`);
        }
        rows.push({ viewport: viewport.name, target: target.name, status, diff: detail });
      }
      await context.close();
    }

    console.table(rows);
    console.log(`Screenshots: ${OUT}${args.update ? `\nBaselines updated: ${BASELINE}` : ''}`);

    if (args.perf) await measurePerf(browser, base);
  } finally {
    await browser.close();
    await server?.close();
  }

  if (failures.length > 0) {
    console.error(`\nVisual check failed: ${failures.join(', ')}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
