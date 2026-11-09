/**
 * `npm run bake:3d` (#225, the three.js spike): cuts 1-2 「月台的縫」 into the paper cards the 3D
 * page stage (`src/popup3d/`) stands up, and writes them as WebP next to a typed manifest
 * (`src/popup3d/cards.gen.ts`).
 *
 * Two sources, both the game's own art, nothing redrawn by hand:
 * - **The backdrop's layers**, from the same drawing functions `npm run bake:popup` bakes into the
 *   one flat backdrop (`env/art/c1.ts`): the standing sky page, the station's V-fold facade and the
 *   two lamps as separate cards; plus the floor page drawn flat (top-down), since the 3D camera
 *   does the perspective the 2D art paints in.
 * - **The 2D renderer's pieces**: `PageView` rendered to static markup at the states needed, then
 *   each piece (a ledge, the pillar, the bench, the carriage, the tab, the bead, the pigeon, the
 *   paw marks…) isolated in Chromium and cut to its alpha box. This is the generic path: it works
 *   for any page and any part state with no per-page drawing.
 *
 * Every card records its box in page units (390 × 560 model; the floor in floor units), so the
 * stage places it exactly where the 2D page draws it, seen from its default camera.
 *
 * Run: `npm run bake:3d` (vite-node; needs Playwright's Chromium and Python 3 with Pillow).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chromium, type Page } from 'playwright';
import { PNG } from 'pngjs';
import { POPUP as C, POPUP_STATION as T } from '../src/art/palette';
import { grain, kitCtx, kitDefs, ref, softEllipse } from '../src/popup/art';
import { initialState, step } from '../src/popup/core';
import { withPartState } from '../src/popup/core/state';
import type { PageDef, SimState } from '../src/popup/core/types';
import { cityNight, stLamp, stationDefs, stationFacade } from '../src/popup/env/art/c1';
import { standingPage } from '../src/popup/env/art/common';
import { pageById } from '../src/popup/pages';
import { PageView } from '../src/popup/view/PageView';
import { chapterSky, stageDefs } from '../src/popup/view/art/placeholders';
import { FLOOR_DEPTH, FLOOR_W } from '../src/popup3d/camera';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/popup3d/assets');
const GEN = join(ROOT, 'src/popup3d/cards.gen.ts');
/** px per unit in every card (the env bitmaps' @2x, D-56). */
const SCALE = 2;
const FONTS = 'https://fonts.googleapis.com/css2?family=Chiron+GoRound+TC:wght@700;900&family=Noto+Serif+TC:wght@700;900&family=Fredoka:wght@500;600;700&display=block';

interface Box { x: number; y: number; w: number; h: number }
type Kind = 'back' | 'stand' | 'lie' | 'floor';
interface Card { id: string; kind: Kind; file: string; bytes: number; box: Box }

// ——— Sources ———

/** The 2D page as static markup, with every bitmap inlined (Chromium renders it from a string). */
function pageMarkup(def: PageDef, state: SimState): string {
  const html = renderToStaticMarkup(createElement(PageView, { def, prev: state, state, ms: 0, tickMs: 500, reduced: true, still: true }));
  return html.replace(/href="(\/[^"]+\.webp)"/g, (_, url: string) => `href="data:image/webp;base64,${readFileSync(join(ROOT, url.replace(/^\/baokaka-adventure/, ''))).toString('base64')}"`);
}

/** The floor page drawn flat, top-down (floor units: x 0–FLOOR_W left to right, y 0 at the gutter to FLOOR_DEPTH at the front edge). */
function flatFloor(): string {
  const ctx = kitCtx('fl', { filters: true });
  const cell = 32.5;
  let d = '';
  for (let r = 0; r * cell < FLOOR_DEPTH; r++) for (let u = 0; u * cell < FLOOR_W; u++) if ((u + r) % 2 === 0) d += `M${u * cell} ${r * cell}h${cell}v${cell}h${-cell}Z`;
  const pool = (cx: number, cy: number, rx: number, ry: number) => softEllipse(ctx, cx, cy, rx, ry, 'lamp', 0.32, 'blur12');
  return stageDefs(ctx, chapterSky(def.chapter), { all: true }) + kitDefs(ctx)
    + `<defs><linearGradient id="flShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.shadow}" stop-opacity=".22"/><stop offset=".35" stop-color="${C.shadow}" stop-opacity="0"/><stop offset="1" stop-color="${C.shadow}" stop-opacity=".1"/></linearGradient></defs>`
    + `<rect width="${FLOOR_W}" height="${FLOOR_DEPTH}" fill="${T.checkLight}"/><path d="${d}" fill="${T.checkDark}" opacity=".6"/>`
    + pool(100, 60, 140, 70) + pool(350, 60, 130, 66) + pool(195, 20, 110, 40)
    + `<rect width="${FLOOR_W}" height="${FLOOR_DEPTH}" fill="url(#flShade)"/>`
    + `<rect width="${FLOOR_W}" height="${FLOOR_DEPTH}" fill="${ref(ctx, 'hatch')}" opacity=".2"/>`
    + grain(ctx, FLOOR_W, FLOOR_DEPTH, 0.42);
}

// ——— Rendering ———

async function render(page: Page, svg: string, viewBox: Box, isolate: { show: string[]; hide?: string[] } | null, clip: Box): Promise<PNG> {
  const css = isolate === null
    ? ''
    : `svg *{visibility:hidden!important}${isolate.show.map((s) => `${s},${s} *`).join(',')}{visibility:visible!important}`
      + (isolate.hide ?? []).map((s) => `${s},${s} *`).join(',') + (isolate.hide?.length ? '{visibility:hidden!important}' : '');
  await page.setContent(`<!doctype html><html><head><link rel="stylesheet" href="${FONTS}"><style>html,body{margin:0;background:transparent}${css}</style></head>`
    + `<body><div id="c" style="width:${viewBox.w}px;height:${viewBox.h}px;line-height:0">${svg.replace(/<svg([^>]*?) width="[^"]*" height="[^"]*"/, '<svg$1')
      .replace(/^<svg/, `<svg width="${viewBox.w}" height="${viewBox.h}"`)}</div></body></html>`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(40);
  const buf = await page.screenshot({ omitBackground: true, type: 'png', clip: { x: clip.x - viewBox.x, y: clip.y - viewBox.y, width: clip.w, height: clip.h } });
  return PNG.sync.read(buf);
}

/** Alpha bbox (alpha ≥ 3) in px, or null. */
function alphaBox(png: PNG): [number, number, number, number] | null {
  let x0 = png.width, y0 = png.height, x1 = -1, y1 = -1;
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
    if (png.data[(y * png.width + x) * 4 + 3] >= 3) {
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
  }
  return x1 < 0 ? null : [x0, y0, x1 + 1, y1 + 1];
}

function crop(png: PNG, x: number, y: number, w: number, h: number): PNG {
  const out = new PNG({ width: w, height: h });
  out.data.fill(0);
  PNG.bitblt(png, out, x, y, Math.min(w, png.width - x), Math.min(h, png.height - y), 0, 0);
  return out;
}

function webp(png: PNG, quality: number): Buffer {
  const dir = mkdtempSync(join(tmpdir(), 'card3d-'));
  try {
    const f = join(dir, 'c.png');
    writeFileSync(f, PNG.sync.write(png));
    execFileSync('python3', ['-I', '-c', 'import sys\nfrom PIL import Image\nImage.open(sys.argv[1]).save(sys.argv[2], "WEBP", quality=int(sys.argv[3]), alpha_quality=70, method=6)', f, join(dir, 'c.webp'), String(quality)]);
    return readFileSync(join(dir, 'c.webp'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ——— The cards of 1-2 ———

const def = pageById('c1p2')!;
const VIEW: Box = { x: -30, y: -12, w: 450, h: 688 };
const s0 = initialState(def);
const afterTicks = (s: SimState, n: number) => Array.from({ length: n }).reduce<SimState>((acc) => step(def, acc, { t: 'none' }).state, s);
const onPillar = afterTicks({ ...s0, mocha: { ...s0.mocha, perch: 'pillar', path: [] } }, 0);
const flipped = withPartState(s0, 'board', 'flip');

interface Spec { id: string; kind: Kind; svg: () => string; view: Box; clip: Box; isolate: { show: string[]; hide?: string[] } | null; trim?: boolean; quality?: number }

/** A drawing from the backdrop's own functions, with the stage defs the backdrop bake emits; `grained` adds the paper grain over `grained`'s rect. */
const art = (body: (ctx: ReturnType<typeof kitCtx>) => string, grained?: Box) => () => {
  const ctx = kitCtx('bk', { filters: true });
  const g = grained === undefined ? '' : `<clipPath id="g3d"><rect x="${grained.x}" y="${grained.y}" width="${grained.w}" height="${grained.h}" rx="5"/></clipPath><g clip-path="url(#g3d)"><g transform="translate(${grained.x} ${grained.y})">${grain(ctx, grained.w, grained.h, 0.42)}</g></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}" style="font-family:'Chiron GoRound TC'">${stageDefs(ctx, chapterSky(def.chapter), { all: true })}${kitDefs(ctx)}${stationDefs(ctx)}${body(ctx)}${g}</svg>`;
};
const live = (state: SimState) => () => pageMarkup(def, state);
const FULL: Box = VIEW;

const SPECS: Spec[] = [
  // The standing page: the city night and the lamplight wash at its foot (no station, no lamps: they are cards)
  { id: 'sky', kind: 'back', view: VIEW, clip: { x: 0, y: 0, w: 390, h: 360 }, isolate: null, trim: false, quality: 82,
    svg: art((ctx) => standingPage(ctx, cityNight(ctx, [326, 64, 20]) + `<rect x="-20" y="316" width="430" height="44" fill="${ref(ctx, 'lampWashS')}"/>`), { x: 0, y: 0, w: 390, h: 360 }) },
  { id: 'station', kind: 'stand', view: VIEW, clip: { x: 0, y: 150, w: 390, h: 222 }, isolate: null, svg: art((ctx) => stationFacade(ctx, 34, 356, 196, 364)) },
  { id: 'lampL', kind: 'stand', view: VIEW, clip: { x: -20, y: 250, w: 60, h: 140 }, isolate: null, svg: art((ctx) => stLamp(ctx, 18, 288, 378)) },
  { id: 'lampR', kind: 'stand', view: VIEW, clip: { x: 350, y: 250, w: 60, h: 140 }, isolate: null, svg: art((ctx) => stLamp(ctx, 372, 282, 382)) },
  // The 2D renderer's pieces
  { id: 'ledgeL', kind: 'stand', view: VIEW, clip: { x: -30, y: 380, w: 230, h: 140 }, isolate: { show: ['[data-layer="floor"]'], hide: ['[data-post]'] }, svg: live(s0) },
  { id: 'ledgeR', kind: 'stand', view: VIEW, clip: { x: 200, y: 380, w: 220, h: 140 }, isolate: { show: ['[data-layer="floor"]'], hide: ['[data-post]'] }, svg: live(s0) },
  { id: 'pillar', kind: 'stand', view: VIEW, clip: FULL, isolate: { show: ['[data-post="pillar"]'] }, svg: live(s0) },
  { id: 'bench', kind: 'stand', view: VIEW, clip: FULL, isolate: { show: ['[data-post="bench"]'] }, svg: live(s0) },
  { id: 'pit', kind: 'lie', view: VIEW, clip: FULL, isolate: { show: ['[data-layer="cutouts"] > g:first-child'] }, svg: live(s0) },
  { id: 'carriage', kind: 'stand', view: VIEW, clip: FULL, isolate: { show: ['[data-carriage="train"]'], hide: ['[data-affordance]'] }, svg: live(s0) },
  { id: 'track', kind: 'lie', view: VIEW, clip: FULL, isolate: { show: ['[data-cue="track"]'] }, svg: live(s0) },
  { id: 'tab', kind: 'lie', view: VIEW, clip: FULL, isolate: { show: ['[data-part="train"] > g[data-anim]'] }, svg: live(s0) },
  { id: 'board.times', kind: 'stand', view: VIEW, clip: FULL, isolate: { show: ['[data-part="board"]'] }, svg: live(s0) },
  { id: 'board.flip', kind: 'stand', view: VIEW, clip: FULL, isolate: { show: ['[data-part="board"]'] }, svg: live(flipped) },
  { id: 'tudigong', kind: 'stand', view: VIEW, clip: FULL, isolate: { show: ['[data-layer="cutouts"] > g:last-child'] }, svg: live(flipped) },
  { id: 'bead', kind: 'stand', view: VIEW, clip: FULL, isolate: { show: ['[data-attractor="bead"]'] }, svg: live(s0) },
  { id: 'pigeon', kind: 'stand', view: VIEW, clip: FULL, isolate: { show: ['[data-creature="pigeon"]'] }, svg: live(s0) },
  { id: 'luggage', kind: 'stand', view: VIEW, clip: FULL, isolate: { show: ['[data-foreground]'] }, svg: live(s0) },
  { id: 'paw.pillar', kind: 'stand', view: VIEW, clip: FULL, isolate: { show: ['[data-marks]'] }, svg: live(s0) },
  { id: 'paw.bench', kind: 'stand', view: VIEW, clip: FULL, isolate: { show: ['[data-marks]'] }, svg: live(onPillar) },
];

async function main() {
  // PageView's layout effects are client-only; on the server they are rightly skipped
  const error = console.error;
  console.error = (...a: unknown[]) => (String(a[0]).includes('useLayoutEffect') ? undefined : error(...a));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 520, height: 760 }, deviceScaleFactor: SCALE });
  const cards: Card[] = [];
  mkdirSync(join(OUT, def.id), { recursive: true });
  try {
    for (const spec of SPECS) {
      const png = await render(page, spec.svg(), spec.view, spec.isolate, spec.clip);
      const b = spec.trim === false ? [0, 0, png.width, png.height] : alphaBox(png);
      if (b === null) throw new Error(`card ${spec.id}: nothing drawn`);
      // Whole units, so the box in page units is exact
      const u = [Math.floor(b[0] / SCALE), Math.floor(b[1] / SCALE), Math.ceil(b[2] / SCALE), Math.ceil(b[3] / SCALE)];
      const out = crop(png, u[0] * SCALE, u[1] * SCALE, (u[2] - u[0]) * SCALE, (u[3] - u[1]) * SCALE);
      const data = webp(out, spec.quality ?? 86);
      const file = `${def.id}/${spec.id}`;
      writeFileSync(join(OUT, `${file}@2x.webp`), data);
      cards.push({ id: spec.id, kind: spec.kind, file, bytes: data.length, box: { x: spec.clip.x + u[0], y: spec.clip.y + u[1], w: u[2] - u[0], h: u[3] - u[1] } });
      process.stdout.write(`card ${spec.id.padEnd(12)} ${String(data.length).padStart(6)} B  ${JSON.stringify(cards.at(-1)!.box)}\n`);
    }
    // The floor page, flat
    const floorView: Box = { x: 0, y: 0, w: FLOOR_W, h: FLOOR_DEPTH };
    const png = await render(page, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FLOOR_W} ${FLOOR_DEPTH}">${flatFloor()}</svg>`, floorView, null, floorView);
    const data = webp(png, 80);
    writeFileSync(join(OUT, `${def.id}/floor@2x.webp`), data);
    cards.push({ id: 'floor', kind: 'floor', file: `${def.id}/floor`, bytes: data.length, box: floorView });
    process.stdout.write(`card floor        ${String(data.length).padStart(6)} B\n`);
  } finally {
    await browser.close();
  }
  const total = cards.reduce((n, c) => n + c.bytes, 0);
  writeFileSync(GEN, `// Generated by \`npm run bake:3d\` (scripts/bake-3d.ts, #225). Do not edit.\nimport type { CardDef } from './cards';\n\n/** ${cards.length} cards, ${total} bytes. */\nexport const CARDS: Readonly<Record<string, readonly CardDef[]>> = ${JSON.stringify({ [def.id]: cards }, null, 2)};\n`);
  process.stdout.write(`${cards.length} cards, ${(total / 1024).toFixed(1)} KB\n`);
}

await main();
