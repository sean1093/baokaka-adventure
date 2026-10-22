import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { POPUP, POPUP_101 } from '../../art/palette';
import { deltaEHex, kitCtx } from '../art';
import { initialState, withPartState } from '../core';
import type { PageDef } from '../core/types';
import { ALL_PAGES as PAGES, pageById } from '../pages';
import { lintMarkup } from '../view/affordance/lint';
import { backdropArt, backdropBitmap, cutoutBitmap, hasCreatureArt, isPlaceholder, partArt, partBitmap } from '../view/art/registry';
import { placeholderBackdrop } from '../view/art/placeholders';
import { PageView } from '../view/PageView';
import { PAGE_VIEW_BOX } from '../view/geometry';
import { backdropHash, cutoutHash, envHash, partHash, screenHash } from './bake';
import { ENV_MANIFEST } from './env.gen';
import { envGrade, gradeKey, gradeSvg, isIdentity, keepColours, standeeGrade, ungradeSvg } from './grade';
import { backdropImage, bundledEnvFiles, cutoutImage, envUrl, pageArtUrls, partImage, screenImage } from './loader';
import { ENV_SCALE, envFile, manifestFiles, validateEnvManifest, type EnvManifest } from './manifest';
import { FIRST_LOAD_BUDGET, PAGE_ART_BUDGET, firstLoad, formatReport, pageArt } from './report';
import { CUTOUT_SOURCES, PART_SOURCES, SCREEN_SOURCES, backdropSources, cutoutSources, partSources } from './sources';
import { SPOT_BEARING } from './art/c2';

/**
 * #96: the baked environment. The committed bitmaps, `env.gen.ts` and the sources must agree
 * (files ↔ manifest ↔ the sources' current hashes, so a source edited without a re-bake fails CI);
 * every page fits the GDD § 3.9 budget; the registry resolves art keys per state and falls back to
 * the placeholder paper style for unknown keys.
 */

beforeAll(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {});
});
afterAll(() => {
  vi.restoreAllMocks();
});

const M = ENV_MANIFEST;

/** The bits of `node:fs` the test reads with (the app's tsconfig carries no Node types). */
interface FsLike {
  readFileSync(path: URL): Uint8Array;
  readdirSync(path: URL, opts: { withFileTypes: true }): { name: string; isDirectory(): boolean }[];
}
const NODE_FS = 'node:fs';
const fs = (await import(/* @vite-ignore */ NODE_FS)) as FsLike;
const OUT = new URL('../assets/env/', import.meta.url);
const list = (dir: string): string[] =>
  fs.readdirSync(new URL(dir, OUT), { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? list(`${dir}${d.name}/`) : [`${dir}${d.name}`]));
const FILES: Record<string, Uint8Array> = Object.fromEntries(list('').map((f) => [f, fs.readFileSync(new URL(f, OUT))]));
const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.subarray(from, to));
const u24 = (b: Uint8Array, at: number) => b[at] | (b[at + 1] << 8) | (b[at + 2] << 16);

/** Canvas size of a VP8X (alpha) WebP, or of a plain lossy one (an opaque screen: the quilt). */
function webpSize(buf: Uint8Array): [number, number] {
  expect(ascii(buf, 0, 4)).toBe('RIFF');
  expect(ascii(buf, 8, 12)).toBe('WEBP');
  const chunk = ascii(buf, 12, 16);
  expect(['VP8X', 'VP8 ']).toContain(chunk);
  if (chunk === 'VP8 ') return [(buf[26] | (buf[27] << 8)) & 0x3fff, (buf[28] | (buf[29] << 8)) & 0x3fff];
  return [u24(buf, 24) + 1, u24(buf, 27) + 1];
}

describe('manifest ↔ committed files ↔ sources', () => {
  test('the manifest is sound', () => {
    expect(validateEnvManifest(M)).toEqual([]);
    expect(M.scale).toBe(ENV_SCALE);
  });

  test('no file is missing from or extra to the manifest, and Vite bundles exactly those', () => {
    const expected = new Set(manifestFiles(M).map((f) => envFile(f.file)));
    expect(new Set(Object.keys(FILES))).toEqual(expected);
    expect(new Set(bundledEnvFiles())).toEqual(expected);
    for (const f of manifestFiles(M)) expect(FILES[envFile(f.file)].length, f.file).toBe(f.bytes);
  });

  test('every bitmap is a WebP of its box at @2x', () => {
    for (const b of Object.values(M.backdrops)) expect(webpSize(FILES[envFile(b.file)]), b.file).toEqual([b.box.w * ENV_SCALE, b.box.h * ENV_SCALE]);
    for (const c of Object.values(M.cutouts)) expect(webpSize(FILES[envFile(c.file)]), c.file).toEqual([c.box.w * ENV_SCALE, c.box.h * ENV_SCALE]);
    for (const c of Object.values(M.screens)) expect(webpSize(FILES[envFile(c.file)]), c.file).toEqual([c.box.w * ENV_SCALE, c.box.h * ENV_SCALE]);
    for (const p of Object.values(M.parts)) {
      for (const f of [...Object.values(p.states), ...Object.values(p.lifted ?? {})]) expect(webpSize(FILES[envFile(f.file)]), f.file).toEqual([p.box.w * ENV_SCALE, p.box.h * ENV_SCALE]);
    }
  });

  test('every registered page has its backdrop baked over the whole view box', () => {
    for (const p of PAGES) {
      expect(M.backdrops[p.backdrop], p.id).toBeDefined();
      expect(M.backdrops[p.backdrop].box).toEqual(PAGE_VIEW_BOX);
    }
  });

  test('the bake is up to date: every source hashes to what its bitmap was baked from (run `npm run bake:popup`)', () => {
    const backdrops = backdropSources(PAGES);
    expect(Object.keys(M.backdrops).sort()).toEqual(backdrops.map((b) => b.key).sort());
    for (const src of backdrops) expect(M.backdrops[src.key].source, src.key).toBe(backdropHash(src));
    const parts = partSources(PAGES);
    expect(Object.keys(M.parts).sort()).toEqual(parts.map(([k]) => k).sort());
    for (const [key, src] of parts) {
      expect(M.parts[key].source, key).toBe(partHash(key, src));
      expect(Object.keys(M.parts[key].states)).toEqual([...src.states]);
    }
    const cutouts = cutoutSources(PAGES);
    expect(Object.keys(M.cutouts).sort()).toEqual(cutouts.map(([k]) => k).sort());
    for (const [key, src] of cutouts) expect(M.cutouts[key].source, key).toBe(cutoutHash(key, src));
    // The screens (#97) are always baked
    expect(Object.keys(M.screens).sort()).toEqual(Object.keys(SCREEN_SOURCES).sort());
    for (const [key, src] of Object.entries(SCREEN_SOURCES)) {
      expect(M.screens[key].source, key).toBe(screenHash(key, src));
      expect(M.screens[key].box).toEqual(src.box);
    }
  });

  test('the screens resolve to their bitmaps (#97); an unknown screen is null', () => {
    for (const key of ['quilt', 'cover-scene', 'map-sheet']) expect(screenImage(key)?.url, key).toBeTruthy();
    expect(screenImage('nope')).toBeNull();
  });

  test('the hash is stable and sensitive', () => {
    expect(envHash('a', 1)).toBe(envHash('a', 1));
    expect(envHash('a', 1)).not.toBe(envHash('a', 2));
    expect(envHash('x')).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe('budgets (GDD § 3.9)', () => {
  test('every page’s art is ≤ 350 KB', () => {
    for (const p of PAGES) expect(pageArt(p, M).bytes, p.id).toBeLessThanOrEqual(PAGE_ART_BUDGET);
  });

  test('the first load (first chapter’s environment art + its characters @3x) is ≤ 2.5 MB', () => {
    const f = firstLoad(PAGES, M);
    expect(f.chapter).toBe(0);
    expect(f.env).toBeGreaterThan(0);
    expect(f.sprites).toBeGreaterThan(0);
    expect(f.bytes).toBeLessThanOrEqual(FIRST_LOAD_BUDGET);
  });

  test('the report lists every page with its budget verdict', () => {
    const text = formatReport(PAGES, M);
    for (const p of PAGES) expect(text).toMatch(new RegExp(`^ok\\s+${p.id}\\b`, 'm'));
    expect(text).toContain('First load');
  });
});

/** A small manifest for the resolution rules. */
const FAKE: EnvManifest = {
  version: 1,
  scale: 2,
  backdrops: { 'x/back': { file: 'backdrops/x/back', bytes: 100_000, chapter: 1, grade: [1, 1, 1], box: PAGE_VIEW_BOX, source: 's' } },
  parts: {
    'x/wheel': {
      preset: 'wheel',
      box: { x: -30, y: -30, w: 60, h: 60 },
      pivot: [0, 0],
      states: { a: { file: 'parts/x/wheel.a', bytes: 5000 }, b: { file: 'parts/x/wheel.b', bytes: 6000 } },
      lifted: { a: { file: 'parts/x/wheel.a.lifted', bytes: 7000 }, b: { file: 'parts/x/wheel.b.lifted', bytes: 8000 } },
      source: 's',
    },
  },
  cutouts: { 'x/lamp': { file: 'cutouts/x/lamp', bytes: 3000, chapter: 1, grade: [1, 1, 1], box: { x: -5, y: -60, w: 10, h: 60 }, source: 's' } },
  screens: {},
};

describe('registry resolution', () => {
  const c1p2 = pageById('c1p2')!;

  test('the board is baked per state; unknown states draw the first; non-dragged parts have no lifted variant', () => {
    const times = partImage('c1/departure-board', 'times');
    const flip = partImage('c1/departure-board', 'flip');
    expect(times?.url).toBe(envUrl(M.parts['c1/departure-board'].states.times.file));
    expect(flip?.url).toBe(envUrl(M.parts['c1/departure-board'].states.flip.file));
    expect(flip?.url).not.toBe(times?.url);
    expect(partImage('c1/departure-board', 'nope')?.url).toBe(times?.url);
    expect(partImage('c1/departure-board', 'times', { lifted: true })).toMatchObject({ url: times?.url, lifted: false });
    expect(partBitmap('c1/departure-board', 'flip')?.url).toBe(flip?.url);
    expect(isPlaceholder('c1/departure-board')).toBe(false);
  });

  test('per-state art selection with lifted variants, pivots, and a missing file (fake manifest)', () => {
    // envUrl only knows committed files, so the fake's files resolve to nothing: no bitmap, no error
    expect(partImage('x/wheel', 'b', {}, FAKE)).toBeNull();
    const stub: EnvManifest = { ...FAKE, parts: { 'x/wheel': { ...FAKE.parts['x/wheel'], states: M.parts['c1/departure-board'].states, lifted: { times: M.parts['c1/departure-board'].states.flip } } } };
    expect(partImage('x/wheel', 'times', { lifted: true }, stub)).toMatchObject({ url: envUrl(M.parts['c1/departure-board'].states.flip.file), lifted: true, pivot: [0, 0] });
    expect(partImage('x/wheel', 'flip', { lifted: true }, stub)).toMatchObject({ url: envUrl(M.parts['c1/departure-board'].states.flip.file), lifted: true });
    expect(partImage('x/wheel', 'flip', {}, stub)).toMatchObject({ url: envUrl(M.parts['c1/departure-board'].states.flip.file), lifted: false });
    expect(backdropImage('x/back', FAKE)).toBeNull();
    expect(cutoutImage('x/lamp', FAKE)).toBeNull();
  });

  test('unknown keys fall back to the placeholder paper style without errors', () => {
    expect(partBitmap('c9/nothing', 'on')).toBeNull();
    expect(partArt('c9/nothing', 'flap')).toBeDefined();
    expect(isPlaceholder('c1/train-blue')).toBe(true);
    expect(backdropBitmap('c9/nowhere')).toBeNull();
    expect(backdropArt('c9/nowhere')).toBe(placeholderBackdrop);
    expect(cutoutBitmap('c9/lamp')).toBeNull();
    const def: PageDef = { ...c1p2, backdrop: 'c9/nowhere', cutouts: [{ art: 'c9/lamp', x: 10, y: 300 }], parts: c1p2.parts.map((p) => ({ ...p, art: `c9/${p.id}` })) };
    const s = initialState(def);
    const html = renderToStaticMarkup(createElement(PageView, { def, prev: s, state: s, ms: 0, tickMs: 500 }));
    expect(html).not.toContain('data-baked');
    expect(html).toContain('data-layer="backdrop"');
  });

  test('1-2 draws the baked backdrop and the board’s bitmap for its state', () => {
    const s0 = initialState(c1p2);
    const draw = (s: typeof s0) => renderToStaticMarkup(createElement(PageView, { def: c1p2, prev: s, state: s, ms: 0, tickMs: 500 }));
    const open = draw(s0);
    expect(open).toContain(`href="${backdropImage('c1/hall-night')!.url}"`);
    expect(open).toContain('data-baked="backdrop"');
    expect(open).toContain(`href="${partImage('c1/departure-board', 'times')!.url}"`);
    const flipped = draw(withPartState(s0, 'board', 'flip'));
    expect(flipped).toContain(`href="${partImage('c1/departure-board', 'flip')!.url}"`);
    expect(flipped).not.toContain(`href="${partImage('c1/departure-board', 'times')!.url}"`);
  });

  test('a page’s preload list is its backdrop and every state of its baked parts', () => {
    const c1p2Urls = pageArtUrls(c1p2);
    expect(c1p2Urls).toEqual([backdropImage('c1/hall-night')!.url, partImage('c1/departure-board', 'times')!.url, partImage('c1/departure-board', 'flip')!.url]);
  });

  test('the payload report counts every state, lifted variant and cut-out, and names placeholders', () => {
    const def = { id: 'x', backdrop: 'x/back', parts: [{ art: 'x/wheel' }, { art: 'x/wheel' }, { art: 'x/other' }], cutouts: [{ art: 'x/lamp', x: 0, y: 0 }] } as unknown as PageDef;
    const a = pageArt(def, FAKE);
    expect(a.bytes).toBe(100_000 + 5000 + 6000 + 7000 + 8000 + 3000);
    expect(a.placeholders).toEqual(['x/other']);
  });

  test('validation catches a rotary part without a pivot and a dragged part without lifted states', () => {
    const bad: EnvManifest = { ...FAKE, parts: { w: { ...FAKE.parts['x/wheel'], pivot: undefined, lifted: undefined } } };
    expect(validateEnvManifest(bad)).toEqual(['part w: a rotary part needs a pivot', "part w: no lifted variant of 'a'", "part w: no lifted variant of 'b'"]);
  });
});

describe('the chapter grade (bible § 3.3, D-59)', () => {
  test('the environment grade is identity through chapter 2 and lifts toward dawn; page E is daylight', () => {
    for (const ch of [0, 1, 2]) expect(isIdentity(envGrade(ch)), `chapter ${ch}`).toBe(true);
    expect(envGrade(10).every((c) => c > 1)).toBe(true);
    expect(envGrade(3).every((c) => c >= 1)).toBe(true);
  });

  test('characters get half the table’s grade', () => {
    expect(standeeGrade(0)).toEqual([0.775, 0.785, 0.86]);
    expect(gradeKey(standeeGrade(1))).toBe('775-785-860');
    expect(isIdentity(standeeGrade(11))).toBe(true);
  });

  test('gradeSvg multiplies every colour but lights, foil, touchables and the chapter’s sky', () => {
    const keep = keepColours(10);
    const by = envGrade(10);
    const svg = '<rect fill="#808080"/><rect fill="#ffc23a"/><rect fill="#FFD98A"/><stop stop-color="#3A3A80"/><rect fill="#123"/>';
    const out = gradeSvg(svg, by, keep);
    expect(out).toContain('fill="#ffc23a"');
    expect(out).toContain('fill="#FFD98A"');
    expect(out).toContain('stop-color="#3A3A80"');
    expect(out).not.toContain('fill="#808080"');
    expect(out).not.toContain('fill="#123"');
    expect(gradeSvg(svg, [1, 1, 1], keep)).toBe(svg);
  });
});

describe('sources', () => {
  test('the board source is printed paper: no decoration near the reserved marigold, in either state', () => {
    const src = PART_SOURCES['c1/departure-board'];
    for (const state of src.states) {
      const markup = src.draw(kitCtx('t', { filters: true }), state);
      expect(lintMarkup(markup, { page: 'c1p2', touchable: () => false, expected: [], where: `board ${state}` })).toEqual([]);
    }
  });

  test('every baked part is printed paper, except a flap\'s marigold grip ear (#108)', () => {
    for (const [key, src] of Object.entries(PART_SOURCES)) {
      for (const state of src.states) {
        const markup = src.draw(kitCtx('t', { filters: true }), state);
        if (src.preset === 'flap' || src.preset === 'wheel') {
          // The grip (a flap's ear, a wheel's knurled rim) is its one marigold; the seal and cue stay live
          expect(markup, `${key} ${state}`).toMatch(/data-grip="(ear|rim)"/);
          expect(markup).toMatch(/url\(#t-tab[GR]\)/);
          const rest = markup.replace(/<path data-grip="(ear|rim)"[^>]*\/>/g, '');
          expect(lintMarkup(rest, { page: key, touchable: () => false, expected: [], where: `${key} ${state}` }), `${key} ${state}`).toEqual([]);
        } else {
          expect(lintMarkup(markup, { page: key, touchable: () => false, expected: [], where: `${key} ${state}` }), `${key} ${state}`).toEqual([]);
        }
      }
    }
  });

  test('chapter 2 (#115): every art key resolves to its own art — no live placeholder, no placeholder stage', () => {
    const c2 = PAGES.filter((p) => p.chapter === 2);
    expect(c2.map((p) => p.id)).toEqual(['c2p1', 'c2p2', 'c2p3', 'c2p4', 'c2p5', 'c2p6']);
    for (const b of backdropSources(c2)) {
      expect(b.placeholder, b.key).toBe(false);
      expect(lintMarkup(b.draw(kitCtx('t', { filters: true })), { page: b.key, touchable: () => false, expected: [], where: b.key }), b.key).toEqual([]);
    }
    for (const p of c2) {
      expect(pageArt(p, M).placeholders, p.id).toEqual([]);
      for (const part of p.parts) expect(isPlaceholder(part.art), `${p.id} ${part.art}`).toBe(false);
      for (const c of p.creatures) expect(hasCreatureArt(c.art), `${p.id} ${c.art}`).toBe(true);
      for (const c of p.cutouts ?? []) expect(cutoutBitmap(c.art), `${p.id} ${c.art}`).not.toBeNull();
    }
  });

  test('chapter 3 (#117): every art key resolves to its own art — no live placeholder, no placeholder stage', () => {
    const c3 = PAGES.filter((p) => p.chapter === 3);
    expect(c3.map((p) => p.id)).toEqual(['c3p1', 'c3p2', 'c3p3', 'c3p4', 'c3p5', 'c3p6']);
    for (const b of backdropSources(c3)) {
      expect(b.placeholder, b.key).toBe(false);
      expect(lintMarkup(b.draw(kitCtx('t', { filters: true })), { page: b.key, touchable: () => false, expected: [], where: b.key }), b.key).toEqual([]);
    }
    for (const p of c3) {
      expect(pageArt(p, M).placeholders, p.id).toEqual([]);
      for (const part of p.parts) expect(isPlaceholder(part.art), `${p.id} ${part.art}`).toBe(false);
      for (const c of p.creatures) expect(hasCreatureArt(c.art), `${p.id} ${c.art}`).toBe(true);
      for (const c of p.cutouts ?? []) expect(cutoutBitmap(c.art), `${p.id} ${c.art}`).not.toBeNull();
    }
    // 3-4's gate plate is the campus's own now, not 2-2's trap door
    expect(pageById('c3p4')!.parts.find((x) => x.id === 'plate')!.art).toBe('c3/plate');
  });

  test('chapter 4 (#119): every art key resolves to its own art — no live placeholder, no placeholder stage', () => {
    const c4 = PAGES.filter((p) => p.chapter === 4);
    expect(c4.map((p) => p.id)).toEqual(['c4p1', 'c4p2', 'c4p3', 'c4p4', 'c4p5', 'c4p6']);
    for (const b of backdropSources(c4)) {
      expect(b.placeholder, b.key).toBe(false);
      expect(lintMarkup(b.draw(kitCtx('t', { filters: true })), { page: b.key, touchable: () => false, expected: [], where: b.key }), b.key).toEqual([]);
    }
    for (const p of c4) {
      expect(pageArt(p, M).placeholders, p.id).toEqual([]);
      for (const part of p.parts) expect(isPlaceholder(part.art), `${p.id} ${part.art}`).toBe(false);
      for (const c of p.creatures) expect(hasCreatureArt(c.art), `${p.id} ${c.art}`).toBe(true);
      for (const c of p.cutouts ?? []) expect(cutoutBitmap(c.art), `${p.id} ${c.art}`).not.toBeNull();
    }
    // 紅樓 turns one drawing: baked once, every state served from it
    for (const state of ['0', '4', '7']) expect(partImage('c4/red-house', state)?.url, state).toBe(partImage('c4/red-house', '0')?.url);
  });

  test('chapter 5 (#122): every art key resolves to its own art — no live placeholder, no placeholder stage', () => {
    const c5 = PAGES.filter((p) => p.chapter === 5);
    expect(c5.map((p) => p.id)).toEqual(['c5p1', 'c5p2', 'c5p3', 'c5p4', 'c5p5', 'c5p6']);
    for (const b of backdropSources(c5)) {
      expect(b.placeholder, b.key).toBe(false);
      expect(lintMarkup(b.draw(kitCtx('t', { filters: true })), { page: b.key, touchable: () => false, expected: [], where: b.key }), b.key).toEqual([]);
    }
    for (const p of c5) {
      expect(pageArt(p, M).placeholders, p.id).toEqual([]);
      for (const part of p.parts) expect(isPlaceholder(part.art), `${p.id} ${part.art}`).toBe(false);
      for (const c of p.creatures) expect(hasCreatureArt(c.art), `${p.id} ${c.art}`).toBe(true);
    }
    // A carrier is baked per look (D-85), not per route index: every carrier has its carrying look
    for (const p of c5) for (const part of p.parts.filter((x) => x.preset === 'carrier')) {
      expect(Object.keys(M.parts[part.art]?.states ?? {}), part.art).toEqual(expect.arrayContaining(['idle', 'carrying', 'back', 'done']));
    }
    expect(M.parts['c5/chicken-boss']?.states.away).toBeDefined();
  });

  test('chapter 6 (#124): every art key resolves to its own art — no live placeholder, no placeholder stage', () => {
    const c6 = PAGES.filter((p) => p.chapter === 6);
    expect(c6.map((p) => p.id)).toEqual(['c6p1', 'c6p2', 'c6p3', 'c6p4', 'c6p5', 'c6p6']);
    for (const b of backdropSources(c6)) {
      expect(b.placeholder, b.key).toBe(false);
      expect(lintMarkup(b.draw(kitCtx('t', { filters: true })), { page: b.key, touchable: () => false, expected: [], where: b.key }), b.key).toEqual([]);
    }
    for (const p of c6) {
      expect(pageArt(p, M).placeholders, p.id).toEqual([]);
      for (const part of p.parts) expect(isPlaceholder(part.art), `${p.id} ${part.art}`).toBe(false);
      for (const c of p.creatures) expect(hasCreatureArt(c.art), `${p.id} ${c.art}`).toBe(true);
    }
    // The cabin-crew 姊姊 is baked per look (D-85); the loops' belts are one drawing each
    expect(Object.keys(M.parts['c6/sleepy-crew']?.states ?? {})).toEqual(expect.arrayContaining(['idle', 'carrying', 'back', 'done']));
    for (const state of ['1', '2', '3']) expect(partImage('c6/carousel-belt', state)?.url, state).toBe(partImage('c6/carousel-belt', '0')?.url);
  });

  test('chapter 7 (#126): every art key resolves to its own art — no live placeholder, no placeholder stage', () => {
    const c7 = PAGES.filter((p) => p.chapter === 7);
    expect(c7.map((p) => p.id)).toEqual(['c7p1', 'c7p2', 'c7p3', 'c7p4', 'c7p5', 'c7p6']);
    for (const b of backdropSources(c7)) {
      expect(b.placeholder, b.key).toBe(false);
      expect(lintMarkup(b.draw(kitCtx('t', { filters: true })), { page: b.key, touchable: () => false, expected: [], where: b.key }), b.key).toEqual([]);
    }
    for (const p of c7) {
      expect(pageArt(p, M).placeholders, p.id).toEqual([]);
      for (const part of p.parts) expect(isPlaceholder(part.art), `${p.id} ${part.art}`).toBe(false);
      for (const c of p.creatures) expect(hasCreatureArt(c.art), `${p.id} ${c.art}`).toBe(true);
    }
    // The carriers are baked per look (D-85), 黑糖 with his `away` look while he sleeps; the loop's drive and the teapot's cradle are one drawing each
    expect(Object.keys(M.parts['c7/zookeeper']?.states ?? {})).toEqual(expect.arrayContaining(['idle', 'carrying', 'back', 'done']));
    expect(Object.keys(M.parts['c7/black-bear']?.states ?? {})).toEqual(expect.arrayContaining(['idle', 'away', 'carrying', 'back', 'done']));
    for (const state of ['1', '2', '3']) expect(partImage('c7/bullwheel', state)?.url, state).toBe(partImage('c7/bullwheel', '0')?.url);
    // 7-4's mirror and 7-5's teapot are cut-outs shown with a part's state (pure art)
    for (const key of ['c7/glass-mirror', 'c7/teapot-0', 'c7/teapot-1', 'c7/teapot-2', 'c7/cable']) {
      expect(M.cutouts[key], key).toBeDefined();
      expect(lintMarkup(CUTOUT_SOURCES[key].draw(kitCtx('t', { filters: true })), { page: 'c7', touchable: () => false, expected: [], where: key }), key).toEqual([]);
    }
  });

  test('chapter 8 (#130): every art key resolves to its own art — no live placeholder, no placeholder stage', () => {
    const c8 = PAGES.filter((p) => p.chapter === 8);
    expect(c8.map((p) => p.id)).toEqual(['c8p1', 'c8p2', 'c8p3', 'c8p4', 'c8p5', 'c8p6']);
    for (const b of backdropSources(c8)) {
      expect(b.placeholder, b.key).toBe(false);
      expect(lintMarkup(b.draw(kitCtx('t', { filters: true })), { page: b.key, touchable: () => false, expected: [], where: b.key }), b.key).toEqual([]);
    }
    for (const p of c8) {
      expect(pageArt(p, M).placeholders, p.id).toEqual([]);
      for (const part of p.parts) expect(isPlaceholder(part.art), `${p.id} ${part.art}`).toBe(false);
      for (const c of p.creatures) expect(hasCreatureArt(c.art), `${p.id} ${c.art}`).toBe(true);
    }
    // The 阿伯 is baked per look (D-85); the belt is one drawing; the 阿嬤 sits under her hat in its part
    expect(Object.keys(M.parts['c8/bath-uncle']?.states ?? {})).toEqual(expect.arrayContaining(['idle', 'carrying', 'back', 'done']));
    for (const state of ['1', '2', '3']) expect(partImage('c8/book-belt', state)?.url, state).toBe(partImage('c8/book-belt', '0')?.url);
    expect(Object.keys(M.parts['c8/granny-hat']?.states ?? {})).toEqual(expect.arrayContaining(['on', 'off']));
  });

  test('chapter 9 (#132): every art key resolves to its own art — no live placeholder, no placeholder stage', () => {
    const c9 = PAGES.filter((p) => p.chapter === 9);
    expect(c9.map((p) => p.id)).toEqual(['c9p1', 'c9p2', 'c9p3', 'c9p4', 'c9p5', 'c9p6']);
    for (const b of backdropSources(c9)) {
      expect(b.placeholder, b.key).toBe(false);
      expect(lintMarkup(b.draw(kitCtx('t', { filters: true })), { page: b.key, touchable: () => false, expected: [], where: b.key }), b.key).toEqual([]);
    }
    for (const p of c9) {
      expect(pageArt(p, M).placeholders, p.id).toEqual([]);
      for (const part of p.parts) expect(isPlaceholder(part.art), `${p.id} ${part.art}`).toBe(false);
      for (const c of p.creatures) expect(hasCreatureArt(c.art), `${p.id} ${c.art}`).toBe(true);
    }
    // One drawing for the sun dial, the tune's dial and the derrick (the view turns or rides them)
    for (const state of ['noon', 'sunset']) expect(partImage('c9/sun-dial', state)?.url, state).toBe(partImage('c9/sun-dial', 'dawn')?.url);
    for (const state of ['1', '5']) expect(partImage('c9/tune-dial', state)?.url, state).toBe(partImage('c9/tune-dial', '0')?.url);
    for (const state of ['1', '2', '3']) expect(partImage('c9/derrick', state)?.url, state).toBe(partImage('c9/derrick', '0')?.url);
    // The 阿婆 is baked per look (D-85); the tide warms with the sun (a bitmap per level)
    expect(Object.keys(M.parts['c9/iron-egg-granny']?.states ?? {})).toEqual(expect.arrayContaining(['idle', 'carrying', 'back', 'done']));
    expect(new Set(['dawn', 'noon', 'sunset'].map((s) => partImage('c9/tide', s)?.url)).size).toBe(3);
    expect(lintMarkup(CUTOUT_SOURCES['c9/tune-plate'].draw(kitCtx('t', { filters: true })), { page: 'c9', touchable: () => false, expected: [], where: 'tune-plate' })).toEqual([]);
  });

  test('chapter 10 (#134): every art key resolves to its own art — no live placeholder, no placeholder stage', () => {
    const c10 = PAGES.filter((p) => p.chapter === 10);
    expect(c10.map((p) => p.id)).toEqual(['c10p1', 'c10p2', 'c10p3', 'c10p4', 'c10p5', 'c10p6']);
    for (const b of backdropSources(c10)) {
      expect(b.placeholder, b.key).toBe(false);
      expect(lintMarkup(b.draw(kitCtx('t', { filters: true })), { page: b.key, touchable: () => false, expected: [], where: b.key }), b.key).toEqual([]);
    }
    for (const p of c10) {
      expect(pageArt(p, M).placeholders, p.id).toEqual([]);
      for (const part of p.parts) expect(isPlaceholder(part.art), `${p.id} ${part.art}`).toBe(false);
      for (const c of p.creatures) expect(hasCreatureArt(c.art), `${p.id} ${c.art}`).toBe(true);
    }
    // One drawing for the altitude dial, the sections' medallion and the crank (the view turns them)
    expect(partImage('c10/altimeter', '89F')?.url).toBe(partImage('c10/altimeter', '5F')?.url);
    for (const state of ['1', '2']) {
      expect(partImage('c10/tower-section', state)?.url, state).toBe(partImage('c10/tower-section', '0')?.url);
      expect(partImage('c10/section-crank', state)?.url, state).toBe(partImage('c10/section-crank', '0')?.url);
    }
    // The 清潔阿伯 is baked per look (D-85); the cake lights a candle a state; the sphere swings (a bitmap per stop)
    expect(Object.keys(M.parts['c10/cleaner-uncle']?.states ?? {})).toEqual(expect.arrayContaining(['idle', 'carrying', 'back', 'done']));
    expect(new Set(['0', '1', '2', '3', '4'].map((s) => partImage('c10/cake', s)?.url)).size).toBe(5);
    expect(new Set(['left', 'centre', 'right'].map((s) => partImage('c10/damper', s)?.url)).size).toBe(3);
  });

  test('chapter 10\'s backdrops are authored in screen colours (D-99): the bake\'s grade lands them back on the kit', () => {
    const svg = `<rect fill="${POPUP_101.violet}"/><rect fill="${POPUP_101.peach}"/>`;
    const back = gradeSvg(ungradeSvg(svg, 10), envGrade(10), keepColours(10));
    const hexes = [...back.matchAll(/#[0-9A-F]{6}/g)].map((m) => m[0]);
    expect(hexes).toHaveLength(2);
    for (const [i, h] of hexes.entries()) expect(deltaEHex(h, [POPUP_101.violet, POPUP_101.peach][i])).toBeLessThan(1);
    // Lights, foil and the sky are never graded, so never ungraded either
    expect(ungradeSvg(`<rect fill="${POPUP.lamp}"/>`, 10)).toBe(`<rect fill="${POPUP.lamp}"/>`);
  });

  test('4-3\'s shadow (the 淘氣\'s art) shows only while Mocha hides behind the lit second sign (#119)', () => {
    const src = CUTOUT_SOURCES['c4/mocha-shadow'];
    expect(lintMarkup(src.draw(kitCtx('t', { filters: true })), { page: 'c4p3', touchable: () => false, expected: [], where: 'shadow' })).toEqual([]);
    const def = pageById('c4p3')!;
    const html = (state: ReturnType<typeof initialState>) => renderToStaticMarkup(createElement(PageView, { def, prev: state, state, ms: 0, tickMs: 500 }));
    const s = initialState(def);
    const behind = { ...s, mocha: { ...s.mocha, perch: 'behind' } };
    expect(html(behind)).not.toContain('data-cutout="c4/mocha-shadow"');
    expect(html(withPartState(s, 'sign2', 'on'))).not.toContain('data-cutout="c4/mocha-shadow"');
    expect(html(withPartState(behind, 'sign2', 'on'))).toContain('data-cutout="c4/mocha-shadow"');
  });

  test('3-5\'s squeeze (the 淘氣\'s art) shows only while Mocha is shut in aisle 2 (#117)', () => {
    const src = CUTOUT_SOURCES['c3/squeeze'];
    expect(lintMarkup(src.draw(kitCtx('t', { filters: true })), { page: 'c3p5', touchable: () => false, expected: [], where: 'squeeze' })).toEqual([]);
    const def = pageById('c3p5')!;
    const html = (state: ReturnType<typeof initialState>) => renderToStaticMarkup(createElement(PageView, { def, prev: state, state, ms: 0, tickMs: 500 }));
    const s = initialState(def);
    expect(html(s)).not.toContain('data-cutout="c3/squeeze"');
    // In the cart with aisle 2 open (B west, C east): not yet; shut (C back west): squeezed
    const inCart = { ...withPartState(withPartState(s, 'shelfB', 'w'), 'shelfC', 'e'), mocha: { ...s.mocha, perch: 'cart' } };
    expect(html(inCart)).not.toContain('data-cutout="c3/squeeze"');
    expect(html(withPartState(inCart, 'shelfC', 'w'))).toContain('data-cutout="c3/squeeze"');
  });

  test('2-6\'s portrait of Mocha is printed paper, and shows only once all three flaps are open (#115)', () => {
    const src = CUTOUT_SOURCES['c2/mocha-portrait'];
    expect(lintMarkup(src.draw(kitCtx('t', { filters: true })), { page: 'c2p6', touchable: () => false, expected: [], where: 'portrait' })).toEqual([]);
    const def = pageById('c2p6')!;
    const html = (state: ReturnType<typeof initialState>) => renderToStaticMarkup(createElement(PageView, { def, prev: state, state, ms: 0, tickMs: 500 }));
    let s = initialState(def);
    expect(html(s)).not.toContain('data-cutout="c2/mocha-portrait"');
    s = withPartState(withPartState(s, 'flapA', 'open'), 'flapB', 'open');
    expect(html(s)).not.toContain('data-cutout="c2/mocha-portrait"');
    expect(html(withPartState(s, 'flapC', 'open'))).toContain('data-cutout="c2/mocha-portrait"');
  });

  test('2-2\'s spotlight aims each state at its pool of light (#115)', () => {
    const def = pageById('c2p2')!;
    const spot = def.parts.find((p) => p.id === 'spot')!;
    const glow = def.attractors.find((a) => a.id === 'glow')!;
    for (const [state, node] of Object.entries(glow.nodeBy!.map)) {
      const n = def.nodes.find((x) => x.id === node)!;
      const bearing = (Math.atan2(n.x - spot.center![0], spot.center![1] - n.y) * 180) / Math.PI;
      // Within a few degrees of the lamp's printed aim (the stage's pool sits a little past S3)
      expect(Math.abs(bearing - SPOT_BEARING[state]), state).toBeLessThan(10);
    }
  });

  test('the slice\'s backdrops are drawn, not the placeholder stage (#108)', () => {
    const own = backdropSources(PAGES).filter((b) => b.chapter <= 1);
    expect(own.map((b) => b.key).sort()).toEqual(['c0/home-window', 'c0/living-room', 'c0/nursery-night', 'c0/zhuazhou-corner', 'c1/bento-shop', 'c1/bento-spread', 'c1/car', 'c1/gates', 'c1/hall', 'c1/hall-night']);
    for (const b of own) {
      expect(b.placeholder, b.key).toBe(false);
      expect(lintMarkup(b.draw(kitCtx('t', { filters: true })), { page: b.key, touchable: () => false, expected: [], where: b.key }), b.key).toEqual([]);
    }
  });
});
