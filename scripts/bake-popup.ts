/**
 * `npm run bake:popup` (#96; popup art bible § 9.1, § 10 item 2): bakes the pop-up environment
 * art into the WebP bitmaps the game draws, mirroring the character artist's bake
 * (`docs/art/v2/tools/bake.py` + `docs/art/popup/src/render.mjs`) and `npm run sync:sprites`.
 *
 * For every registered page (`src/popup/pages`) it renders, in Playwright's Chromium at
 * `ENV_SCALE` (2) device px per page unit, with the kit's filters on (depth shadows, blurs, glows,
 * grain):
 * - each **backdrop** art key: its drawing, or its chapter's placeholder stage
 *   (`src/popup/env/sources.ts`), over the page's whole view box, with the chapter's environment
 *   grade baked into its colours (`env/grade.ts`; lights, foil, touchables and the sky excepted);
 * - each **part** art key with a drawing (`PART_SOURCES`), once per state, cropped to what was
 *   drawn (whole units), with its cut-edge rim and stacked shadow baked in; draggable presets also
 *   get a lifted variant per state (risen, scaled, over a dropped shadow: bible § 4.1);
 * - each **cut-out** a page places (`CUTOUT_SOURCES`), graded like its chapter;
 *
 * then encodes WebP with Pillow (`method=6`; D-56: ≈ 40 % smaller than Chromium's encoder) and
 * writes `src/popup/assets/env/**` and the typed `src/popup/env/env.gen.ts`, and prints the
 * payload report (`npm run art:report` prints it without baking).
 *
 * **Idempotent:** every bitmap records a hash of its SVG source (and the encoder settings). An
 * unchanged source is not re-rendered and an unchanged manifest is not rewritten, so a second run
 * changes nothing; stale files are removed; `--force` re-bakes everything. Chromium's blurs are
 * not bit-exact from run to run, so a forced re-bake may differ in bytes (within 1 % in size).
 *
 * The deploy workflow has no browsers: the output is committed and `src/popup/env/env.test.ts`
 * checks files ↔ manifest and the budgets (D-59).
 *
 * Run: `npm run bake:popup` (vite-node; needs Playwright's Chromium and Python 3 with Pillow).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Page } from 'playwright';
import { PNG } from 'pngjs';
import { ENCODE, backdropHash, backdropSvg, cutoutHash, cutoutSvg, paddedBox, partHash, partVariants } from '../src/popup/env/bake';
import { envGrade } from '../src/popup/env/grade';
import { ENV_SCALE, envFile, type BackdropEntry, type CutoutEntry, type EnvBox, type EnvFile, type EnvManifest, type PartEntry } from '../src/popup/env/manifest';
import { formatReport } from '../src/popup/env/report';
import { backdropSources, cutoutSources, partSources } from '../src/popup/env/sources';
import { PAGES } from '../src/popup/pages';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/popup/assets/env');
const GEN = join(ROOT, 'src/popup/env/env.gen.ts');
type Encode = (typeof ENCODE)[keyof typeof ENCODE];
const FORCE = process.argv.includes('--force');
const FONTS = 'https://fonts.googleapis.com/css2?family=Chiron+GoRound+TC:wght@700;900&family=Noto+Serif+TC:wght@700;900&family=Fredoka:wght@500;600;700&display=block';

const round2 = (n: number) => Math.round(n * 100) / 100;

// ——— Rendering ———

/** The text a drawing prints, per font family (so the web fonts' subsets load before the shot). */
function fontLoads(svg: string): string[] {
  const out: string[] = [];
  for (const m of svg.matchAll(/<text[^>]*font-family="([^"]+)"[^>]*font-weight="(\d+)"[^>]*>([^<]*)<\/text>/g)) {
    out.push(`${m[2]} 16px ${m[1].replace(/&#x27;|&apos;/g, "'")}|${m[3]}`);
  }
  return [...new Set(out)];
}

/** Renders an SVG body over `box` (page units) to a PNG at ENV_SCALE, transparent outside the art. */
async function renderPng(page: Page, body: string, box: EnvBox): Promise<PNG> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${box.w}" height="${box.h}" viewBox="${box.x} ${box.y} ${box.w} ${box.h}" style="font-family:'Chiron GoRound TC'">${body}</svg>`;
  await page.setContent(`<!doctype html><html><head><link rel="stylesheet" href="${FONTS}"></head>`
    + `<body style="margin:0;background:transparent"><div id="c" style="display:inline-block;line-height:0">${svg}</div></body></html>`, { waitUntil: 'networkidle' });
  await page.evaluate(async (loads) => {
    await Promise.all(loads.map((l) => {
      const [font, text] = l.split('|');
      return document.fonts.load(font, text).catch(() => undefined);
    }));
    await document.fonts.ready;
  }, fontLoads(body));
  await page.waitForTimeout(30);
  const buf = await page.locator('#c > svg').screenshot({ omitBackground: true, type: 'png' });
  return PNG.sync.read(buf);
}

/** Alpha bbox (alpha ≥ 3) in px: [x0, y0, x1, y1), or null when empty. */
function alphaBox(png: PNG, min = 3): [number, number, number, number] | null {
  let x0 = png.width, y0 = png.height, x1 = -1, y1 = -1;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      if (png.data[(y * png.width + x) * 4 + 3] >= min) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : [x0, y0, x1 + 1, y1 + 1];
}

function crop(png: PNG, x: number, y: number, w: number, h: number): PNG {
  const out = new PNG({ width: w, height: h });
  out.data.fill(0);
  const sx = Math.max(0, x), sy = Math.max(0, y);
  const ex = Math.min(png.width, x + w), ey = Math.min(png.height, y + h);
  if (ex > sx && ey > sy) PNG.bitblt(png, out, sx, sy, ex - sx, ey - sy, sx - x, sy - y);
  return out;
}

/** Encodes PNGs to WebP with Pillow (`method=6`), as `sync-sprites.ts` does. */
function pillowWebp(pngs: PNG[], enc: Encode): Buffer[] {
  const dir = mkdtempSync(join(tmpdir(), 'env-'));
  try {
    const ins = pngs.map((png, i) => {
      const f = join(dir, `${i}.png`);
      writeFileSync(f, PNG.sync.write(png));
      return f;
    });
    const py = `import sys\nfrom PIL import Image\nfor f in sys.argv[3:]:\n  Image.open(f).save(f[:-4] + '.webp', 'WEBP', quality=int(sys.argv[1]), alpha_quality=int(sys.argv[2]), method=6)\n`;
    execFileSync('python3', ['-I', '-c', py, String(enc.quality), String(enc.alpha), ...ins], { stdio: 'inherit' });
    return ins.map((f) => readFileSync(f.replace(/\.png$/, '.webp')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function write(stem: string, webp: Buffer): EnvFile {
  const file = join(OUT, envFile(stem));
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, webp);
  return { file: stem, bytes: webp.length };
}

const fileOk = (f: EnvFile | undefined): f is EnvFile => {
  if (f === undefined) return false;
  const p = join(OUT, envFile(f.file));
  return existsSync(p) && statSync(p).size === f.bytes;
};

// ——— The previous manifest (for skipping) ———

function previous(): EnvManifest | null {
  if (FORCE || !existsSync(GEN)) return null;
  const text = readFileSync(GEN, 'utf8');
  const json = text.slice(text.indexOf('= {', text.indexOf('export const ENV_MANIFEST')) + 2, text.lastIndexOf('}') + 1);
  try {
    return JSON.parse(json) as EnvManifest;
  } catch {
    return null;
  }
}

/** A key as a file stem: 'c1/hall-night' → 'backdrops/c1/hall-night'. */
const stemOf = (kind: string, key: string, state?: string) => `${kind}/${key}${state === undefined ? '' : `.${state}`}`;

// ——— Bakers ———

async function bakeBackdrops(page: Page, prev: EnvManifest | null): Promise<[Record<string, BackdropEntry>, number]> {
  const out: Record<string, BackdropEntry> = {};
  let baked = 0;
  for (const src of backdropSources(PAGES)) {
    const grade = envGrade(src.chapter);
    const svg = backdropSvg(src);
    const source = backdropHash(src, svg);
    const old = prev?.backdrops[src.key];
    if (old && old.source === source && fileOk(old)) {
      out[src.key] = old;
      continue;
    }
    process.stdout.write(`bake backdrop ${src.key}${src.placeholder ? ' (placeholder stage)' : ''}\n`);
    const [webp] = pillowWebp([await renderPng(page, svg, src.box)], ENCODE.backdrop);
    out[src.key] = { ...write(stemOf('backdrops', src.key), webp), chapter: src.chapter, grade, box: src.box, source };
    baked++;
  }
  return [out, baked];
}

async function bakeParts(page: Page, prev: EnvManifest | null): Promise<[Record<string, PartEntry>, number]> {
  const out: Record<string, PartEntry> = {};
  let baked = 0;
  for (const [key, src] of partSources(PAGES)) {
    const svgs = partVariants(src);
    const source = partHash(key, src, svgs);
    const old = prev?.parts[key];
    if (old && old.source === source && [...Object.values(old.states), ...Object.values(old.lifted ?? {})].every(fileOk)) {
      out[key] = old;
      continue;
    }
    process.stdout.write(`bake part ${key} (${svgs.length})\n`);
    // Render every variant over the padded box, then crop all to one shared box on the whole-unit grid
    const padded = paddedBox(src.box);
    const pngs = [];
    let box: [number, number, number, number] | null = null;
    for (const s of svgs) {
      const png = await renderPng(page, s.svg, padded);
      pngs.push(png);
      const b = alphaBox(png);
      if (b) box = box === null ? b : [Math.min(box[0], b[0]), Math.min(box[1], b[1]), Math.max(box[2], b[2]), Math.max(box[3], b[3])];
    }
    if (box === null) throw new Error(`part ${key}: nothing drawn`);
    const u = [Math.floor(box[0] / ENV_SCALE), Math.floor(box[1] / ENV_SCALE), Math.ceil(box[2] / ENV_SCALE), Math.ceil(box[3] / ENV_SCALE)];
    const webps = pillowWebp(pngs.map((png) => crop(png, u[0] * ENV_SCALE, u[1] * ENV_SCALE, (u[2] - u[0]) * ENV_SCALE, (u[3] - u[1]) * ENV_SCALE)), ENCODE.part);
    const states: Record<string, EnvFile> = {};
    const lifted: Record<string, EnvFile> = {};
    svgs.forEach((s, i) => {
      const file = write(stemOf('parts', key, s.lifted ? `${s.state}.lifted` : s.state), webps[i]);
      (s.lifted ? lifted : states)[s.state] = file;
    });
    out[key] = {
      preset: src.preset,
      box: { x: round2(padded.x + u[0]), y: round2(padded.y + u[1]), w: u[2] - u[0], h: u[3] - u[1] },
      ...(src.pivot ? { pivot: src.pivot } : {}),
      ...(src.hinge !== undefined ? { hinge: src.hinge } : {}),
      states,
      ...(Object.keys(lifted).length > 0 ? { lifted } : {}),
      source,
    };
    baked++;
  }
  return [out, baked];
}

async function bakeCutouts(page: Page, prev: EnvManifest | null): Promise<[Record<string, CutoutEntry>, number]> {
  const out: Record<string, CutoutEntry> = {};
  let baked = 0;
  for (const [key, src] of cutoutSources(PAGES)) {
    const grade = envGrade(src.chapter);
    const svg = cutoutSvg(src);
    const source = cutoutHash(key, src, svg);
    const old = prev?.cutouts[key];
    if (old && old.source === source && fileOk(old)) {
      out[key] = old;
      continue;
    }
    process.stdout.write(`bake cutout ${key}\n`);
    const [webp] = pillowWebp([await renderPng(page, svg, src.box)], ENCODE.part);
    out[key] = { ...write(stemOf('cutouts', key), webp), chapter: src.chapter, grade, box: src.box, source };
    baked++;
  }
  return [out, baked];
}

// ——— Output ———

function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? listFiles(join(dir, d.name)) : [join(dir, d.name)]));
}

/** Puts arrays of plain values on one line (still JSON, so `previous()` can read it back). */
function compact(json: string): string {
  return json.replace(/\[\s+([^[\]{}]*?)\s+\]/g, (_, inner: string) => `[${inner.split(/,\s+/).join(', ')}]`);
}

function render(m: EnvManifest): string {
  return `// Generated by \`npm run bake:popup\` (scripts/bake-popup.ts) from src/popup/env/sources.ts. Do not edit.\n`
    + `import type { EnvManifest } from './manifest';\n\n`
    + `export const ENV_MANIFEST: EnvManifest = ${compact(JSON.stringify(m, null, 2))};\n`;
}

async function main() {
  const prev = previous();
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ deviceScaleFactor: ENV_SCALE, viewport: { width: 1000, height: 1400 } })).newPage();
  try {
    const [backdrops, nb] = await bakeBackdrops(page, prev);
    const [parts, np] = await bakeParts(page, prev);
    const [cutouts, nc] = await bakeCutouts(page, prev);
    const manifest: EnvManifest = { version: 1, scale: ENV_SCALE, backdrops, parts, cutouts };
    const keep = new Set<string>();
    for (const e of Object.values(backdrops)) keep.add(join(OUT, envFile(e.file)));
    for (const e of Object.values(cutouts)) keep.add(join(OUT, envFile(e.file)));
    for (const p of Object.values(parts)) for (const f of [...Object.values(p.states), ...Object.values(p.lifted ?? {})]) keep.add(join(OUT, envFile(f.file)));
    let removed = 0;
    for (const f of listFiles(OUT)) if (!keep.has(f)) (rmSync(f), removed++);
    const text = render(manifest);
    const changed = !existsSync(GEN) || readFileSync(GEN, 'utf8') !== text;
    if (changed) writeFileSync(GEN, text);
    const total = Object.keys(backdrops).length + Object.keys(parts).length + Object.keys(cutouts).length;
    console.log(`${nb + np + nc} item(s) baked, ${total - nb - np - nc} unchanged, ${removed} stale file(s) removed; ${relative(ROOT, GEN)} ${changed ? 'written' : 'unchanged'}`);
    console.log('');
    console.log(formatReport(PAGES, manifest));
  } finally {
    await browser.close();
  }
}

await main();
