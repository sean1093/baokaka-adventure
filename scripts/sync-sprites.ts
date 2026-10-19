/**
 * `npm run sync:sprites` (#94): bakes the character artist's frames into game sprites.
 *
 * Reads `docs/art/v2/baked/poses.json` (gameplay poses) and `manifest.json` (the stand, Mocha's sit
 * and the expression heads) with their @2x/@3x WebP frames, and for every frame at both scales:
 *
 * - applies the die-cut standee look (bible § 5, § 9.1) with the kit's own `standeeFilter`
 *   (`src/popup/art/defs.ts`, its `bake` variant, D-56): the 3.2 pt warm-white border dilated from
 *   alpha, the 0.6 pt cut line, the stacked contact + soft shadow, and the easel tab on standing
 *   poses, rendered by Playwright's Chromium at the scale's device pixel ratio;
 * - crops every frame of a sprite to one shared box (the union of what the filter drew, on the
 *   whole-pt grid so @2x and @3x agree), so the anchor never jitters;
 * - re-encodes WebP through the browser's canvas (no native image libraries, as `render.mjs`);
 *
 * then measures the head (bubble anchor) and the ground footprint, bakes the shared floor contact
 * ellipse, and writes `src/popup/assets/sprites/**` plus `src/popup/sprites/sprites.gen.ts`.
 *
 * **Idempotent:** each sprite records a hash of everything its bake read (the source entry and
 * files, `sprites/config.ts`, the filter, this script's bake version). A sprite whose hash and
 * files are unchanged is not re-rendered, and an unchanged manifest is not rewritten, so a second
 * run changes nothing. `--force` re-bakes everything. Stale files are removed.
 *
 * The deploy workflow has no browsers: the output is committed (D-35, D-56) and
 * `src/popup/sprites/sprites.test.ts` checks files ↔ manifest.
 *
 * Run: `npm run sync:sprites` (vite-node; needs Playwright's Chromium, `PLAYWRIGHT_BROWSERS_PATH`).
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Page } from 'playwright';
import { PNG } from 'pngjs';
import { POPUP as C } from '../src/art/palette';
import { standeeFilter } from '../src/popup/art/defs';
import { ALPHA_QUALITY, BAKE_PAD, HEAD_MAP_SCALE, POSE_CONFIG, SCALES, STILL_CONFIG, WEBP_QUALITY, type PoseConfig } from '../src/popup/sprites/config';
import type { FloorDef, SpriteAnimDef, SpriteDef, SpriteManifest } from '../src/popup/sprites/manifest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'docs/art/v2/baked');
const OUT = join(ROOT, 'src/popup/assets/sprites');
const GEN = join(ROOT, 'src/popup/sprites/sprites.gen.ts');
/** Bump when the bake itself changes (crop, easel, measuring): every sprite re-bakes. */
const BAKE_VERSION = 'standee-v1';
const FORCE = process.argv.includes('--force');

type Scale = (typeof SCALES)[number];

interface PoseEntry {
  label: string;
  frames: number;
  keyframes: number[] | null;
  loop: boolean;
  fps: number;
  size_pt: [number, number];
  anchor_pt: [number, number];
  files: string[];
}

/** One sprite to bake: its source frames and the artist's numbers. */
interface Job {
  id: string;
  kind: 'pose' | 'still';
  char: 'baokaka' | 'mocha';
  label: string;
  /** Per frame: the source file for each scale */
  frames: { stem: string; src: Record<Scale, string> }[];
  size: [number, number];
  /** null: measure (stills have no anchor in the artist's manifest) */
  anchor: [number, number] | null;
  cfg: PoseConfig & { mapScale?: number };
  anims: () => Record<string, SpriteAnimDef>;
}

function jobs(): Job[] {
  const poses = JSON.parse(readFileSync(join(SRC, 'poses.json'), 'utf8')) as { characters: Record<string, Record<string, PoseEntry>> };
  const out: Job[] = [];
  for (const [char, set] of Object.entries(poses.characters)) {
    for (const [pose, e] of Object.entries(set)) {
      const id = `${char}.${pose}`;
      const cfg = POSE_CONFIG[id] ?? {};
      const stems = e.files.map((f) => f.replace('@{2x,3x}.webp', ''));
      if (stems.length !== e.frames) throw new Error(`${id}: ${stems.length} files for ${e.frames} frames`);
      const mode = cfg.mode ?? (e.loop ? 'loop' : 'once');
      const all = stems.map((_, i) => i);
      const events = cfg.events ?? [];
      out.push({
        id,
        kind: 'pose',
        char: char as Job['char'],
        label: e.label,
        frames: stems.map((stem) => ({ stem: `poses/${stem}`, src: { 2: join(SRC, 'poses', `${stem}@2x.webp`), 3: join(SRC, 'poses', `${stem}@3x.webp`) } })),
        size: e.size_pt,
        anchor: e.anchor_pt,
        cfg,
        anims: () => ({
          main: { frames: all, fps: cfg.fps ?? e.fps, mode, hold: cfg.hold ?? 0, events },
          ...(e.keyframes && e.keyframes.length < e.frames
            ? {
                key: {
                  frames: e.keyframes,
                  fps: (cfg.fps ?? e.fps) * (e.keyframes.length / e.frames),
                  mode,
                  hold: 0,
                  // An event survives on the keyframe version only where its frame is a keyframe
                  events: events.filter((ev) => e.keyframes!.includes(ev.frame)).map((ev) => ({ ...ev, frame: e.keyframes!.indexOf(ev.frame) })),
                },
              }
            : {}),
        }),
      });
    }
  }
  const stills = JSON.parse(readFileSync(join(SRC, 'manifest.json'), 'utf8')) as Record<string, { logical: [number, number] }>;
  for (const [name, e] of Object.entries(stills)) {
    const char = name.startsWith('mocha') ? 'mocha' : 'baokaka';
    const head = name.includes('-head-');
    const cfg = STILL_CONFIG[name] ?? { mapScale: HEAD_MAP_SCALE[char], noMirror: head };
    out.push({
      id: name,
      kind: 'still',
      char,
      label: head ? `${char === 'mocha' ? '摩卡' : '寶咖咖'}頭像 ${name.split('-head-')[1]}` : name,
      frames: [{ stem: `stills/${name}`, src: { 2: join(SRC, `${name}@2x.webp`), 3: join(SRC, `${name}@3x.webp`) } }],
      size: e.logical,
      anchor: null,
      cfg,
      anims: () => ({ main: { frames: [0], fps: 1, mode: 'once', hold: 0, events: [] } }),
    });
  }
  return out;
}

// ——— Rendering ———

const FILTER = standeeFilter('st', { bake: true });

/** The easel tab (bible § 5; kit `standee()`): a kraft fold-back trapezoid behind the feet. */
function easel(ax: number, ay: number, w: number, h: number): string {
  const tw = Math.min(w, 60);
  const th = Math.min(h * 0.22, 16);
  const f = (n: number) => n.toFixed(2);
  return `<path d="M${f(ax - tw * 0.18)} ${f(ay + 1)}L${f(ax - tw * 0.12)} ${f(ay - th)}L${f(ax + tw * 0.12)} ${f(ay - th)}L${f(ax + tw * 0.28)} ${f(ay + 3)}Z" fill="${C.easel}" opacity=".9"/>`;
}

function frameSvg(job: Job, srcFile: string, anchor: [number, number]): { svg: string; w: number; h: number } {
  const [w, h] = job.size;
  const W = w + BAKE_PAD.l + BAKE_PAD.r;
  const H = h + BAKE_PAD.t + BAKE_PAD.b;
  const href = `data:image/webp;base64,${readFileSync(srcFile).toString('base64')}`;
  const tab = job.cfg.easel ? easel(anchor[0] + BAKE_PAD.l, anchor[1] + BAKE_PAD.t, w, h) : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${FILTER}</defs>${tab}`
    + `<image href="${href}" x="${BAKE_PAD.l}" y="${BAKE_PAD.t}" width="${w}" height="${h}" preserveAspectRatio="none" filter="url(#st)"/></svg>`;
  return { svg, w: W, h: H };
}

async function renderPng(page: Page, svg: string): Promise<PNG> {
  await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent"><div id="c" style="display:inline-block;line-height:0">${svg}</div></body></html>`);
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => undefined))));
  // Let the SVG <image> decode and paint
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

/**
 * Encodes PNGs to WebP with Pillow (`method=6`, the artist's encoder, D-56): Chromium's canvas
 * encoder made frames ~40 % larger, and alpha (the border and its shadow) is most of a frame.
 */
function pillowWebp(pngs: PNG[]): Buffer[] {
  const dir = mkdtempSync(join(tmpdir(), 'sprites-'));
  try {
    const ins = pngs.map((png, i) => {
      const f = join(dir, `${i}.png`);
      writeFileSync(f, PNG.sync.write(png));
      return f;
    });
    const py = `import sys\nfrom PIL import Image\nfor f in sys.argv[3:]:\n  Image.open(f).save(f[:-4] + '.webp', 'WEBP', quality=int(sys.argv[1]), alpha_quality=int(sys.argv[2]), method=6)\n`;
    execFileSync('python3', ['-I', '-c', py, String(WEBP_QUALITY), String(ALPHA_QUALITY), ...ins], { stdio: 'inherit' });
    return ins.map((f) => readFileSync(f.replace(/\.png$/, '.webp')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Source-alpha measurements in pt (frame space): the head top and the footprint. */
function measure(src: PNG, scale: number, anchorY: number | null): { head: [number, number]; foot: [number, number]; bottom: number; bottomX: number } {
  const a = (x: number, y: number) => src.data[(y * src.width + x) * 4 + 3];
  const box = alphaBox(src, 128)!;
  // Head: the opaque columns of a 10 pt band below the topmost opaque row; its centre, at the top
  const band = Math.round(10 * scale);
  let sx = 0, n = 0;
  for (let y = box[1]; y < Math.min(box[3], box[1] + band); y++) {
    for (let x = box[0]; x < box[2]; x++) if (a(x, y) >= 128) (sx += x, n++);
  }
  const head: [number, number] = [round2(sx / n / scale), round2(box[1] / scale)];
  // Footprint: opaque columns within 5 pt above the ground line (the anchor, or the bottom)
  const ground = anchorY === null ? box[3] : Math.round(anchorY * scale);
  let fx0 = Infinity, fx1 = -Infinity, bx = 0, bn = 0;
  for (let y = Math.max(0, ground - Math.round(5 * scale)); y < Math.min(src.height, ground + 1); y++) {
    for (let x = 0; x < src.width; x++) {
      if (a(x, y) >= 128) {
        fx0 = Math.min(fx0, x);
        fx1 = Math.max(fx1, x);
        if (y >= ground - Math.round(2 * scale)) (bx += x, bn++);
      }
    }
  }
  return { head, foot: [round2(fx0 / scale), round2((fx1 + 1) / scale)], bottom: box[3] / scale, bottomX: bn ? bx / bn / scale : (box[0] + box[2]) / 2 / scale };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Decodes a WebP source to PNG through the browser (for measuring). */
async function decodeSource(page: Page, file: string): Promise<PNG> {
  const b64 = readFileSync(file).toString('base64');
  const png = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/webp;base64,${b64}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    c.getContext('2d')!.drawImage(img, 0, 0);
    return c.toDataURL('image/png').split(',')[1];
  }, b64);
  return PNG.sync.read(Buffer.from(png, 'base64'));
}

function hashJob(job: Job): string {
  const h = createHash('sha256');
  h.update(JSON.stringify({ BAKE_VERSION, FILTER, BAKE_PAD, WEBP_QUALITY, ALPHA_QUALITY, id: job.id, label: job.label, size: job.size, anchor: job.anchor, cfg: job.cfg, anims: job.anims() }));
  for (const f of job.frames) for (const s of SCALES) h.update(readFileSync(f.src[s]));
  return h.digest('hex').slice(0, 16);
}

async function bakeJob(pages: Record<Scale, Page>, job: Job): Promise<SpriteDef> {
  // Measure on the @3x source: head, footprint, and (stills) the anchor
  const src3 = await decodeSource(pages[3], job.frames[0].src[3]);
  const m = measure(src3, 3, job.anchor?.[1] ?? null);
  const anchor: [number, number] = job.anchor ?? [round2(m.bottomX), round2(m.bottom - 0.5)];
  // Render @3x first, union the alpha boxes on the whole-pt grid
  const renders: Record<Scale, PNG[]> = { 2: [], 3: [] };
  let box: [number, number, number, number] | null = null;
  for (const f of job.frames) {
    const { svg } = frameSvg(job, f.src[3], anchor);
    const png = await renderPng(pages[3], svg);
    renders[3].push(png);
    const b = alphaBox(png);
    if (b) box = box === null ? b : [Math.min(box[0], b[0]), Math.min(box[1], b[1]), Math.max(box[2], b[2]), Math.max(box[3], b[3])];
  }
  if (box === null) throw new Error(`${job.id}: nothing drawn`);
  const pt = [Math.floor(box[0] / 3), Math.floor(box[1] / 3), Math.ceil(box[2] / 3), Math.ceil(box[3] / 3)];
  for (const f of job.frames) renders[2].push(await renderPng(pages[2], frameSvg(job, f.src[2], anchor).svg));
  const files: string[] = [];
  const bytes: [number, number][] = [];
  const encoded = Object.fromEntries(
    SCALES.map((s) => [s, pillowWebp(renders[s].map((png) => crop(png, pt[0] * s, pt[1] * s, (pt[2] - pt[0]) * s, (pt[3] - pt[1]) * s)))]),
  ) as Record<Scale, Buffer[]>;
  for (let i = 0; i < job.frames.length; i++) {
    const stem = job.frames[i].stem;
    const b: [number, number] = [0, 0];
    for (const s of SCALES) {
      const file = join(OUT, `${stem}@${s}x.webp`);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, encoded[s][i]);
      b[s === 2 ? 0 : 1] = encoded[s][i].length;
    }
    files.push(stem);
    bytes.push(b);
  }
  // Frame space → baked space: the pad, then the crop
  const off: [number, number] = [BAKE_PAD.l - pt[0], BAKE_PAD.t - pt[1]];
  const mv = (p: readonly [number, number]): [number, number] => [round2(p[0] + off[0]), round2(p[1] + off[1])];
  const head = mv(job.cfg.head ?? m.head);
  return {
    kind: job.kind,
    char: job.char,
    label: job.label,
    size: [pt[2] - pt[0], pt[3] - pt[1]],
    anchor: mv(anchor),
    head,
    ...(job.cfg.hand ? { hand: mv(job.cfg.hand) } : {}),
    foot: [round2(m.foot[0] + off[0]), round2(m.foot[1] + off[0])],
    mapScale: job.cfg.mapScale ?? 1,
    group: job.cfg.group ?? 0,
    noMirror: job.cfg.noMirror ?? false,
    files,
    bytes,
    anims: job.anims(),
    source: '',
  };
}

const FLOOR = { size: [56, 20] as [number, number], ellipse: { cx: 28, cy: 10, rx: 20, ry: 3.6 } };
const FLOOR_STEM = 'floor';

async function bakeFloor(pages: Record<Scale, Page>): Promise<FloorDef> {
  const { size, ellipse: e } = FLOOR;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size[0]}" height="${size[1]}" viewBox="0 0 ${size[0]} ${size[1]}">`
    + `<filter id="b" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="3"/></filter>`
    + `<ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" fill="${C.shadow}" opacity=".5" filter="url(#b)"/></svg>`;
  const bytes: [number, number] = [0, 0];
  for (const s of SCALES) {
    const [webp] = pillowWebp([await renderPng(pages[s], svg)]);
    writeFileSync(join(OUT, `${FLOOR_STEM}@${s}x.webp`), webp);
    bytes[s === 2 ? 0 : 1] = webp.length;
  }
  return { file: FLOOR_STEM, bytes, size, ellipse: e };
}

// ——— The previous manifest (for skipping) ———

function previous(): SpriteManifest | null {
  if (!existsSync(GEN)) return null;
  const text = readFileSync(GEN, 'utf8');
  const json = text.slice(text.indexOf('= {', text.indexOf('export const SPRITE_MANIFEST')) + 2, text.lastIndexOf('}') + 1);
  try {
    return JSON.parse(json) as SpriteManifest;
  } catch {
    return null;
  }
}

const fileOk = (stem: string, s: Scale, n: number) => {
  const f = join(OUT, `${stem}@${s}x.webp`);
  return existsSync(f) && statSync(f).size === n;
};

function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? listFiles(join(dir, d.name)) : [join(dir, d.name)]));
}

function render(manifest: SpriteManifest): string {
  return `// Generated by \`npm run sync:sprites\` (scripts/sync-sprites.ts) from docs/art/v2/baked. Do not edit.\n`
    + `import type { SpriteDef, SpriteManifest } from './manifest';\n\n`
    + `/** Every sprite id: \`<char>.<pose>\` for gameplay poses, the artist's names for stills. */\n`
    + `export const SPRITE_IDS = ${JSON.stringify(Object.keys(manifest.sprites))} as const;\n`
    + `export type SpriteId = (typeof SPRITE_IDS)[number];\n\n`
    + `export const SPRITE_MANIFEST: SpriteManifest & { readonly sprites: Readonly<Record<SpriteId, SpriteDef>> } = ${compact(JSON.stringify(manifest, null, 2))};\n`;
}

/** Puts arrays of plain values on one line (still JSON, so `previous()` can read it back). */
function compact(json: string): string {
  return json.replace(/\[\s+([^[\]{}]*?)\s+\]/g, (_, inner: string) => `[${inner.split(/,\s+/).join(', ')}]`);
}

async function main() {
  const list = jobs();
  const prev = FORCE ? null : previous();
  const floorHash = createHash('sha256').update(JSON.stringify({ BAKE_VERSION, FLOOR, WEBP_QUALITY, shadow: C.shadow })).digest('hex').slice(0, 16);
  const browser = await chromium.launch();
  const pages = {} as Record<Scale, Page>;
  for (const s of SCALES) pages[s] = await (await browser.newContext({ deviceScaleFactor: s, viewport: { width: 800, height: 800 } })).newPage();
  const sprites: Record<string, SpriteDef> = {};
  let baked = 0;
  try {
    for (const job of list) {
      const source = hashJob(job);
      const old = prev?.sprites[job.id];
      if (old && old.source === source && old.files.every((stem, i) => fileOk(stem, 2, old.bytes[i][0]) && fileOk(stem, 3, old.bytes[i][1]))) {
        sprites[job.id] = old;
        continue;
      }
      process.stdout.write(`bake ${job.id} (${job.frames.length})\n`);
      sprites[job.id] = { ...(await bakeJob(pages, job)), source };
      baked++;
    }
    const oldFloor = prev?.floor;
    const floorKept = oldFloor && oldFloor.source === floorHash && fileOk(oldFloor.file, 2, oldFloor.bytes[0]) && fileOk(oldFloor.file, 3, oldFloor.bytes[1]);
    const floor = floorKept ? oldFloor : { ...(await bakeFloor(pages)), source: floorHash };
    const manifest: SpriteManifest = { version: 1, floor, sprites };
    // Remove files no sprite references any more
    const keep = new Set<string>();
    for (const s of Object.values(sprites)) for (const stem of s.files) for (const sc of SCALES) keep.add(join(OUT, `${stem}@${sc}x.webp`));
    for (const sc of SCALES) keep.add(join(OUT, `${floor.file}@${sc}x.webp`));
    let removed = 0;
    for (const f of listFiles(OUT)) if (!keep.has(f)) (rmSync(f), removed++);
    const text = render(manifest);
    const changed = !existsSync(GEN) || readFileSync(GEN, 'utf8') !== text;
    if (changed) writeFileSync(GEN, text);
    // The payload report (#94 R3)
    const sum = (filter: (s: SpriteDef) => boolean, k: 0 | 1) => Object.values(sprites).filter(filter).reduce((n, s) => n + s.bytes.reduce((m, b) => m + b[k], 0), 0);
    const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
    const core = (s: SpriteDef) => s.kind === 'pose' && s.group === 0;
    console.log(`${baked} sprite(s) baked, ${list.length - baked} unchanged, ${removed} stale file(s) removed; ${relative(ROOT, GEN)} ${changed ? 'written' : 'unchanged'}`);
    console.log(`core poses (group 0) + floor: @2x ${kb(sum(core, 0) + floor.bytes[0])}, @3x ${kb(sum(core, 1) + floor.bytes[1])}`);
    console.log(`all sprites: @2x ${kb(sum(() => true, 0))}, @3x ${kb(sum(() => true, 1))}`);
  } finally {
    await browser.close();
  }
}

await main();
