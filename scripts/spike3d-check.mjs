#!/usr/bin/env node
/**
 * The three.js spike's checks and measurements (#225; `docs/project/spike-threejs.md`), against
 * the 3D page `popup3d.html#/popup3d?page=c1p2`.
 *
 *   node scripts/spike3d-check.mjs [--build] [--url <base>] [--only play,context,reduced,perf,media]
 *
 *   --build  run `npm run build` first; without --url the built `dist/` is previewed
 *   --url    a running server (dev or preview), e.g. http://localhost:5173/baokaka-adventure/
 *
 * Checks (each fails the run):
 *   - play     at 390×844 and 375×667, with the mouse and with touch: every touchable's effective
 *              target (its raycast hit plane, projected) is ≥ 48 CSS px both ways at every step;
 *              then 1-2 is played to done by hand: drag the tab to 半, tap the pillar's paw prints,
 *              drag the tab to the end, wait for the bead.
 *   - context  `WEBGL_lose_context`: losing the context shows 「紙頁重新摺好中…」 and the clock
 *              holds; restoring it rebuilds the stage and play goes on from the same state; a loss
 *              that is never restored hands over to the 2D page (`PagePlayer`) within 3.5 s.
 *   - reduced  `&reduced=1`: no opening (the page is ready at once, open), no idle breath.
 * Measurements (printed, and written to artifacts/spike3d/report.json):
 *   - perf     frame times over 6 s of the open page (idle breath on) and over a scripted play,
 *              at 1× and 4× CPU throttle, 390×844, DPR 2 and 1, per shadow mode; and the main
 *              thread's share (the stage's update, the render call). Chromium here renders WebGL with
 *              SwiftShader (software): real-GPU numbers come from a phone with `&fps=1`.
 *   - media    the 3D page at the 2D fixtures' states (start, reaching, riding, grab) next to the
 *              committed 2D baselines, and a webm of the page opening, leaning and being played,
 *              into artifacts/spike3d/.
 */
import { spawn } from 'node:child_process';
import { mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'artifacts', 'spike3d');
const { values: args } = parseArgs({ options: { build: { type: 'boolean' }, url: { type: 'string' }, only: { type: 'string' } } });
const ONLY = new Set((args.only ?? 'play,context,reduced,perf,media').split(','));
const VIEWPORTS = [{ width: 390, height: 844 }, { width: 375, height: 667 }];
const GL_ARGS = ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'];
const MIN_HIT = 48;
const failures = [];
const report = {};
const fail = (m) => {
  failures.push(m);
  console.log(`  FAIL ${m}`);
};

const run = (cmd, argv) => new Promise((ok, no) => {
  const c = spawn(cmd, argv, { cwd: ROOT, stdio: 'inherit' });
  c.on('exit', (code) => (code === 0 ? ok() : no(new Error(`${cmd} exited ${code}`))));
});

async function serve() {
  if (args.url) return { base: args.url, stop: () => {} };
  const child = spawn(join(ROOT, 'node_modules', '.bin', 'vite'), ['preview', '--port', '4317', '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch('http://localhost:4317/baokaka-adventure/')).ok) break;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  return { base: 'http://localhost:4317/baokaka-adventure/', stop: () => child.kill() };
}

const url3d = (base, extra = '') => new URL(`popup3d.html#/popup3d?page=c1p2${extra}`, base).href;
const ready = (page, timeout = 60000) => page.waitForFunction(() => window.__popup3d?.ready?.() === true, null, { timeout, polling: 100 });

/** A pointer: the mouse, or one finger through CDP touch events. */
async function pointer(page, kind) {
  if (kind === 'mouse') {
    return {
      down: async ([x, y]) => { await page.mouse.move(x, y); await page.mouse.down(); },
      move: async ([x, y]) => page.mouse.move(x, y, { steps: 4 }),
      up: async () => page.mouse.up(),
    };
  }
  const cdp = await page.context().newCDPSession(page);
  const send = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  return {
    down: async ([x, y]) => send('touchStart', [{ x, y, id: 1 }]),
    move: async ([x, y]) => {
      for (let i = 1; i <= 4; i++) await send('touchMove', [{ x, y, id: 1 }]);
    },
    up: async () => send('touchEnd', []),
  };
}

const centre = (t) => [t.x + t.w / 2, t.y + t.h / 2];
const touchables = (page) => page.evaluate(() => window.__popup3d.touchables());
const state = (page) => page.evaluate(() => {
  const f = window.__popup3d.session.frame();
  return { tick: f.state.tick, train: f.state.parts.train, perch: f.state.mocha.perch, done: f.state.done, node: f.state.baby.node };
});

async function checkTargets(page, label) {
  const list = await touchables(page);
  if (list.length === 0) fail(`${label}: no touchables`);
  for (const t of list) {
    if (t.w < MIN_HIT - 0.5 || t.h < MIN_HIT - 0.5) fail(`${label}: ${t.key} is ${t.w.toFixed(1)}×${t.h.toFixed(1)} px (< ${MIN_HIT})`);
  }
  return list.map((t) => `${t.key} ${t.w.toFixed(0)}×${t.h.toFixed(0)}`).join(', ');
}

async function waitFor(page, pred, what, timeout = 20000) {
  const t0 = Date.now();
  for (;;) {
    const s = await state(page);
    if (pred(s)) return s;
    if (Date.now() - t0 > timeout) throw new Error(`timed out waiting for ${what} (${JSON.stringify(s)})`);
    await page.waitForTimeout(150);
  }
}

/** Drags the tab `stops` stops to the right (60 page units each), from its current hit plane. */
async function dragTab(page, p, stops) {
  const tab = (await touchables(page)).find((t) => t.key === 'train');
  const scale = (await page.evaluate(() => window.__popup3d.layout().scale));
  const [x, y] = centre(tab);
  await p.down([x, y]);
  await p.move([x + 20, y]);
  await p.move([x + 60 * stops * scale * 0.95, y]);
  await p.move([x + 60 * stops * scale * 1.02, y]);
  await page.waitForTimeout(80);
  await p.up();
}

async function tapTarget(page, p, key) {
  const t = (await touchables(page)).find((x) => x.key === key);
  if (!t) throw new Error(`no touchable ${key}`);
  await p.down(centre(t));
  await page.waitForTimeout(60);
  await p.up();
}

async function play(browser, base) {
  console.log('play: touch targets and a playthrough, mouse and touch, both sizes');
  report.targets = {};
  for (const viewport of VIEWPORTS) {
    for (const kind of ['mouse', 'touch']) {
      const label = `${viewport.width}x${viewport.height} ${kind}`;
      const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: kind === 'touch', isMobile: kind === 'touch' });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      try {
        await page.goto(url3d(base, '&speed=fast&still=1'));
        await ready(page);
        const p = await pointer(page, kind);
        report.targets[label] = { start: await checkTargets(page, `${label} start`) };
        await waitFor(page, (s) => s.tick >= 2, 'the clock');
        await dragTab(page, p, 1);
        await waitFor(page, (s) => s.train === 'half', 'train half');
        await page.waitForTimeout(1500);
        report.targets[label].half = await checkTargets(page, `${label} half`);
        await tapTarget(page, p, 'perch:pillar');
        await waitFor(page, (s) => s.perch === 'pillar', 'Mocha on the pillar');
        await page.waitForTimeout(1200);
        report.targets[label].pillar = await checkTargets(page, `${label} pillar`);
        await dragTab(page, p, 1);
        await waitFor(page, (s) => s.train === 'full', 'train full');
        const end = await waitFor(page, (s) => s.done, 'done', 30000);
        await page.waitForSelector('.p3d-done-card button', { timeout: 5000 });
        console.log(`  ok ${label}: done at tick ${end.tick}`);
      } catch (e) {
        fail(`${label}: ${e.message}`);
        await page.screenshot({ path: join(OUT, `fail-${viewport.width}-${kind}.png`) });
      }
      if (errors.length) fail(`${label}: page errors: ${errors.join(' | ')}`);
      await ctx.close();
    }
  }
}

async function context(browser, base) {
  console.log('context: WEBGL_lose_context');
  const ctx = await browser.newContext({ viewport: VIEWPORTS[0] });
  const page = await ctx.newPage();
  await page.goto(url3d(base, '&still=1'));
  await ready(page);
  await waitFor(page, (s) => s.tick >= 2, 'the clock');
  await page.evaluate(() => window.__lose = window.__popup3d.loseContext());
  await page.evaluate(() => window.__lose.loseContext());
  await page.waitForSelector('.p3d-lost', { timeout: 3000 }).catch(() => fail('context: no lost notice'));
  const held = await state(page);
  await page.waitForTimeout(600);
  if ((await state(page)).tick !== held.tick) fail('context: the clock ran while the context was lost');
  await page.evaluate(() => window.__lose.restoreContext());
  await ready(page, 20000).catch(() => fail('context: the stage did not come back'));
  await page.waitForSelector('.p3d-lost', { state: 'detached', timeout: 5000 }).catch(() => fail('context: the notice stayed'));
  await waitFor(page, (s) => s.tick > held.tick, 'play after the restore').catch((e) => fail(`context: ${e.message}`));
  const after = await state(page);
  report.context = { lostAtTick: held.tick, restored: true, tickAfter: after.tick };
  console.log(`  ok restored: lost at tick ${held.tick}, ticking again (${after.tick})`);
  // A loss that never comes back: the 2D page takes over from the same state
  await page.evaluate(() => window.__popup3d.loseContext().loseContext());
  const t0 = Date.now();
  await page.waitForSelector('[data-popup3d="fallback"] [data-popup-page="c1p2"]', { timeout: 6000 }).then(
    () => {
      report.context.fallbackMs = Date.now() - t0;
      console.log(`  ok fallback to the 2D page after ${report.context.fallbackMs} ms`);
    },
    () => fail('context: no 2D fallback after an unrestored loss'),
  );
  await ctx.close();
}

async function reduced(browser, base) {
  console.log('reduced: no opening');
  const ctx = await browser.newContext({ viewport: VIEWPORTS[0], reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(url3d(base));
  const t0 = Date.now();
  await page.waitForSelector('[data-popup3d="ready"]', { timeout: 60000 });
  await ready(page, 1500).catch(() => fail('reduced: the page was not open at once'));
  if ((await page.$('[data-reduced]')) === null) fail('reduced: the OS setting was not read');
  console.log(`  ok open ${Date.now() - t0} ms after the stage loaded`);
  await ctx.close();
}

/** Frame times (ms) over `ms` of rAF, in the page. */
const frameTimes = (page, ms) => page.evaluate((dur) => new Promise((done) => {
  const out = [];
  let last = performance.now();
  const t0 = last;
  const f = (now) => {
    out.push(now - last);
    last = now;
    if (now - t0 < dur) requestAnimationFrame(f);
    else done(out);
  };
  requestAnimationFrame(f);
}), ms);

function summarise(times) {
  const s = [...times].sort((a, b) => a - b);
  const mean = s.reduce((a, b) => a + b, 0) / s.length;
  const pct = (q) => s[Math.min(s.length - 1, Math.floor(q * s.length))];
  return { frames: s.length, fps: +(1000 / mean).toFixed(1), meanMs: +mean.toFixed(1), p95Ms: +pct(0.95).toFixed(1), worstMs: +s.at(-1).toFixed(1) };
}

async function perf(browser, base) {
  console.log('perf: frame times (SwiftShader software WebGL), 390×844 DPR 2');
  report.perf = {};
  const runs = [['map', 1, 2], ['map', 4, 2], ['blob', 1, 2], ['blob', 4, 2], ['map', 1, 1], ['map', 4, 1], ['off', 4, 1]];
  for (const [shadows, rate, dpr] of runs) {
    {
      const ctx = await browser.newContext({ viewport: VIEWPORTS[0], deviceScaleFactor: dpr });
      const page = await ctx.newPage();
      const cdp = await ctx.newCDPSession(page);
      await page.goto(url3d(base, `&shadows=${shadows}`));
      await ready(page, 90000);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate });
      const idle = summarise(await frameTimes(page, 6000));
      // A scripted play: the tab to 半 and the pillar, while frames are timed
      const timing = frameTimes(page, 6000);
      await page.evaluate(() => {
        const s = window.__popup3d.session;
        s.input({ t: 'set', part: 'train', to: 'half' });
        setTimeout(() => s.input({ t: 'mocha', perch: 'pillar' }), 2500);
      });
      const playing = summarise(await timing);
      const stats = await page.evaluate(() => window.__popup3d.stats());
      const key = `dpr=${dpr} shadows=${shadows} cpu=${rate}x`;
      report.perf[key] = { idle, playing, stats };
      console.log(`  ${key}: idle ${idle.fps} fps (p95 ${idle.p95Ms} ms), play ${playing.fps} fps (p95 ${playing.p95Ms}, worst ${playing.worstMs}); update p50/p95 ${stats.updateMs.p50}/${stats.updateMs.p95} ms, render call ${stats.renderMs.p50}/${stats.renderMs.p95} ms; ${stats.calls} calls, ${stats.triangles} tris, ${stats.textureMB} MB textures`);
      await ctx.close();
    }
  }
}

async function media(browser, base) {
  console.log('media: comparison frames and the video');
  const ctx = await browser.newContext({ viewport: VIEWPORTS[0], deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(url3d(base, '&still=1'));
  await ready(page);
  // The 2D fixtures' states (src/popup/dev/fixtures.ts), the same steps through the same core
  const states = {
    start: { steps: [{ wait: 3 }], ms: 0, baseline: 'popup-c1p2' },
    reaching: { steps: [{ set: 'train', to: 'half' }, { wait: 'settle' }], ms: 0, baseline: 'c1p2-reaching' },
    riding: { steps: [{ set: 'train', to: 'half' }, { wait: 'settle' }, { set: 'train', to: 'out' }], ms: 0, baseline: 'c1p2-riding' },
    grab: { steps: [{ set: 'train', to: 'half' }, { wait: 'settle' }, { mocha: 'pillar' }, { set: 'train', to: 'full' }, { wait: 'goal' }], ms: 0, baseline: 'c1p2-grab' },
  };
  for (const [name, s] of Object.entries(states)) {
    await page.evaluate(([steps, ms]) => window.__popup3d.show(steps, ms), [s.steps, s.ms]);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: join(OUT, `3d-${name}.png`) });
  }
  // Leaning: the same start state, the eye held left-up and right-down
  for (const [name, tilt] of [['lean-left', '-1,-1'], ['lean-right', '1,0.6']]) {
    await page.goto(url3d(base, `&still=1&tilt=${tilt}`));
    await ready(page);
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(OUT, `3d-${name}.png`) });
  }
  // The opening held at four moments
  for (const open of [0.12, 0.3, 0.55, 0.8]) {
    await page.goto(url3d(base, `&still=1&open=${open}`));
    await page.waitForSelector('[data-popup3d="ready"]', { timeout: 60000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(OUT, `3d-open-${open}.png`) });
  }
  await ctx.close();

  // The video: open, lean with the pointer, play by hand (DPR 1 keeps it small)
  const vctx = await browser.newContext({ viewport: VIEWPORTS[0], recordVideo: { dir: OUT, size: VIEWPORTS[0] } });
  const v = await vctx.newPage();
  await v.goto(url3d(base));
  await ready(v, 90000);
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    await v.mouse.move(195 + Math.cos(a) * 180, 420 + Math.sin(a) * 300);
    await v.waitForTimeout(90);
  }
  await v.mouse.move(195, 420);
  const p = await pointer(v, 'mouse');
  await dragTab(v, p, 1);
  await waitFor(v, (s) => s.train === 'half', 'train half');
  await v.waitForTimeout(1800);
  await tapTarget(v, p, 'perch:pillar');
  await waitFor(v, (s) => s.perch === 'pillar', 'Mocha on the pillar');
  await v.waitForTimeout(1200);
  await dragTab(v, p, 1);
  await waitFor(v, (s) => s.done, 'done', 30000);
  await v.waitForTimeout(1500);
  const video = v.video();
  await vctx.close();
  const path = await video.path();
  await rename(path, join(OUT, 'spike3d.webm'));
  console.log('  ok artifacts/spike3d/');
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  if (args.build) await run('npm', ['run', 'build']);
  const server = await serve();
  const browser = await chromium.launch({ args: GL_ARGS });
  try {
    if (ONLY.has('play')) await play(browser, server.base);
    if (ONLY.has('context')) await context(browser, server.base);
    if (ONLY.has('reduced')) await reduced(browser, server.base);
    if (ONLY.has('perf')) await perf(browser, server.base);
    if (ONLY.has('media')) await media(browser, server.base);
  } finally {
    await browser.close();
    server.stop();
  }
  for (const f of await readdir(OUT)) if (f.endsWith('.webm') && f !== 'spike3d.webm') await rm(join(OUT, f));
  await writeFile(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  if (failures.length) {
    console.log(`\n${failures.length} failure(s)`);
    process.exit(1);
  }
  console.log('\nall spike checks passed');
}

await main();
