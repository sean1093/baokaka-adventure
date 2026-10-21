import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import POSES from '../../../docs/art/v2/baked/poses.json';
import STILLS from '../../../docs/art/v2/baked/manifest.json';
import { BAKE_PAD, POSE_CONFIG } from './config';
import { eventsBetween, frameAt, frameOfStep, manualClock, rafClock, stepAt } from './clock';
import { bundledFiles, chapterGradeKey, floorUrl, frameUrl, pageSprites, payloadBytes, shownStem, spriteDef, SpriteLoader, SpriteGrade, spriteUrls } from './loader';
import { fromAnchor, framePoint, gradedStem, isMirrored, pickScale, spriteTransform, toPage, validateManifest, type SpriteAnimDef, type SpriteDef } from './manifest';
import { gradeKey, standeeGrade } from '../env/grade';
import { PAGES } from '../pages';
import { SpriteAnim, spriteHead } from './SpriteAnim';
import { SPRITE_IDS, SPRITE_MANIFEST } from './sprites.gen';

/**
 * #94: the baked sprites. The committed files and `sprites.gen.ts` must agree with each other and
 * with the character artist's manifests (`docs/art/v2/baked/poses.json`, `manifest.json`); the
 * timing, mirroring and loading maths are pure and tested here with a fake clock.
 */

const M = SPRITE_MANIFEST;
const sprites = Object.entries(M.sprites) as [string, SpriteDef][];

/** The bits of `node:fs` the test reads with (the app's tsconfig carries no Node types). */
interface FsLike {
  readFileSync(path: URL): Uint8Array;
  readdirSync(path: URL, opts: { withFileTypes: true }): { name: string; isDirectory(): boolean }[];
}
const NODE_FS = 'node:fs';
const fs = (await import(/* @vite-ignore */ NODE_FS)) as FsLike;
const OUT = new URL('../assets/sprites/', import.meta.url);
const list = (dir: string): string[] =>
  fs.readdirSync(new URL(dir, OUT), { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? list(`${dir}${d.name}/`) : [`${dir}${d.name}`]));

/** Every committed sprite file's bytes, by path under `src/popup/assets/sprites/`. */
const FILES: Record<string, Uint8Array> = Object.fromEntries(list('').map((f) => [f, fs.readFileSync(new URL(f, OUT))]));
const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.subarray(from, to));
const u24 = (b: Uint8Array, at: number) => b[at] | (b[at + 1] << 8) | (b[at + 2] << 16);

describe('manifest ↔ committed files', () => {
  test('the manifest is internally sound', () => {
    expect(validateManifest(M)).toEqual([]);
    expect(Object.keys(M.sprites)).toEqual([...SPRITE_IDS]);
  });

  test('every animation frame exists at both scales, with the recorded bytes', () => {
    for (const [id, s] of sprites) {
      for (const [name, a] of Object.entries(s.anims)) {
        for (const f of a.frames) {
          for (const [k, scale] of [[0, 2], [1, 3]] as const) {
            const file = FILES[`${s.files[f]}@${scale}x.webp`];
            expect(file, `${id}/${name} frame ${f} @${scale}x`).toBeDefined();
            expect(file.length, `${id} ${s.files[f]}@${scale}x bytes`).toBe(s.bytes[f][k]);
          }
        }
      }
    }
    for (const [k, scale] of [[0, 2], [1, 3]] as const) expect(FILES[`${M.floor.file}@${scale}x.webp`].length).toBe(M.floor.bytes[k]);
  });

  test('no file is missing from or extra to the manifest, and Vite bundles exactly those', () => {
    const expected = new Set<string>();
    for (const [, s] of sprites) {
      for (const stem of s.files) {
        for (const scale of [2, 3]) {
          expected.add(`${stem}@${scale}x.webp`);
          for (const key of Object.keys(s.graded ?? {})) expected.add(`${gradedStem(stem, key)}@${scale}x.webp`);
        }
      }
    }
    for (const scale of [2, 3]) expected.add(`${M.floor.file}@${scale}x.webp`);
    expect(new Set(Object.keys(FILES))).toEqual(expected);
    expect(new Set(bundledFiles())).toEqual(expected);
  });

  test('frames are WebP of the box at @2x and @3x', () => {
    for (const [id, s] of sprites) {
      for (const stem of s.files) {
        for (const scale of [2, 3]) {
          for (const file of [stem, ...Object.keys(s.graded ?? {}).map((key) => gradedStem(stem, key))]) {
            const buf = FILES[`${file}@${scale}x.webp`];
            expect(ascii(buf, 0, 4), id).toBe('RIFF');
            expect(ascii(buf, 8, 12), id).toBe('WEBP');
            const [w, h] = webpSize(buf);
            expect([w, h], `${file}@${scale}x`).toEqual([s.size[0] * scale, s.size[1] * scale]);
          }
        }
      }
    }
  });

  test('graded variants are recorded with their bytes', () => {
    for (const [id, s] of sprites) {
      for (const [key, g] of Object.entries(s.graded ?? {})) {
        s.files.forEach((stem, i) => {
          for (const [k, scale] of [[0, 2], [1, 3]] as const) expect(FILES[`${gradedStem(stem, key)}@${scale}x.webp`].length, `${id} ${key} ${i}`).toBe(g.bytes[i][k]);
        });
      }
    }
  });
});

describe('the half grade (#96, D-59)', () => {
  test('every chapter with pages and a grade has its variant; chapters 0–2 share one (×0.775, 0.785, 0.86)', () => {
    const chapters = [...new Set(PAGES.map((p) => p.chapter))];
    for (const ch of chapters) expect(chapterGradeKey(ch), `chapter ${ch}`).toBe(gradeKey(standeeGrade(ch)));
    expect(gradeKey(standeeGrade(0))).toBe('775-785-860');
    expect(gradeKey(standeeGrade(2))).toBe(gradeKey(standeeGrade(0)));
    expect(M.grades['775-785-860'].by).toEqual([0.775, 0.785, 0.86]);
  });

  test('every pose a graded chapter preloads has that chapter’s variant; stills and UI poses stay ungraded', () => {
    for (const [key, g] of Object.entries(M.grades)) {
      for (const ch of g.chapters) for (const id of pageSprites(ch)) expect(spriteDef(id).graded?.[key], `${id} in chapter ${ch}`).toBeDefined();
    }
    for (const [id, s] of sprites) if (s.kind === 'still' || s.group === 'ui') expect(s.graded, id).toBeUndefined();
  });

  test('URLs pick the graded variant when there is one, else the plain frame', () => {
    const key = chapterGradeKey(1)!;
    const crawl = spriteDef('baokaka.crawl');
    expect(shownStem(crawl, 0, key)).toBe(gradedStem(crawl.files[0], key));
    expect(shownStem(crawl, 0, undefined)).toBe(crawl.files[0]);
    expect(shownStem(spriteDef('baokaka-stand'), 0, key)).toBe(spriteDef('baokaka-stand').files[0]);
    expect(spriteUrls('baokaka.crawl', 2, 'main', key)[0]).toBe(frameUrl(gradedStem(crawl.files[0], key), 2));
    expect(chapterGradeKey(99)).toBeUndefined();
  });

  test('a page draws its chapter’s variant (the SpriteGrade context)', async () => {
    const key = chapterGradeKey(0)!;
    const loader = new SpriteLoader(async () => 1);
    await loader.preload(spriteUrls('baokaka.sit', 2, 'main', key));
    const draw = (grade: string | undefined) =>
      renderToStaticMarkup(createElement(SpriteGrade.Provider, { value: grade }, createElement('svg', null, createElement(SpriteAnim, { sprite: 'baokaka.sit', dpr: 2, loader, playing: false }))));
    const sit = spriteDef('baokaka.sit');
    expect(draw(key)).toContain(`href="${frameUrl(gradedStem(sit.files[0], key), 2)}"`);
    // Outside a page (no grade) the plain frames are asked for: not loaded here, so the placeholder card
    expect(draw(undefined)).toContain('data-placeholder');
  });

  test('the graded core set stays under the core budget (≤ 400 KB @3x)', () => {
    const key = chapterGradeKey(0)!;
    expect(payloadBytes(pageSprites(0), 3, key)).toBeLessThanOrEqual(400 * 1024);
  });
});

/** Canvas size of a VP8X (alpha) WebP. */
function webpSize(buf: Uint8Array): [number, number] {
  expect(ascii(buf, 12, 16)).toBe('VP8X');
  return [1 + u24(buf, 24), 1 + u24(buf, 27)];
}

describe('agreement with the artist’s manifests (docs/art/v2/baked)', () => {
  type Pose = { frames: number; keyframes: number[] | null; loop: boolean; fps: number; size_pt: number[]; anchor_pt: number[]; files: string[] };
  const poses = POSES as { characters: Record<string, Record<string, Pose>> };
  const stills = STILLS as Record<string, unknown>;

  test('every pose and still is baked; nothing else is', () => {
    const want = [...Object.entries(poses.characters).flatMap(([c, ps]) => Object.keys(ps).map((p) => `${c}.${p}`)), ...Object.keys(stills)];
    expect(new Set(Object.keys(M.sprites))).toEqual(new Set(want));
  });

  test.each(Object.entries(poses.characters).flatMap(([c, ps]) => Object.entries(ps).map(([p, e]) => [`${c}.${p}`, e] as const)))('%s keeps the artist’s frames, timing and foot anchor', (id, e) => {
    const s = spriteDef(id);
    const cfg = POSE_CONFIG[id] ?? {};
    expect(s.files).toEqual(e.files.map((f) => `poses/${f.replace('@{2x,3x}.webp', '')}`));
    expect(s.anims.main.frames).toEqual(e.files.map((_, i) => i));
    expect(s.anims.main.fps).toBe(cfg.fps ?? e.fps);
    expect(s.anims.main.mode).toBe(cfg.mode ?? (e.loop ? 'loop' : 'once'));
    if (e.keyframes) expect(s.anims.key?.frames).toEqual(e.keyframes);
    // The baked box is the artist's box grown by the border (≤ the bake padding each side), and the
    // anchor moved by the same offset
    const dx = s.anchor[0] - e.anchor_pt[0];
    const dy = s.anchor[1] - e.anchor_pt[1];
    expect(dx).toBeGreaterThanOrEqual(0);
    expect(dx).toBeLessThanOrEqual(BAKE_PAD.l + 1e-9);
    expect(dy).toBeGreaterThanOrEqual(0);
    expect(dy).toBeLessThanOrEqual(BAKE_PAD.t + 1e-9);
    expect(s.size[0]).toBeGreaterThanOrEqual(e.size_pt[0] - 2);
    expect(s.size[0]).toBeLessThanOrEqual(e.size_pt[0] + BAKE_PAD.l + BAKE_PAD.r);
    expect(s.size[1]).toBeLessThanOrEqual(e.size_pt[1] + BAKE_PAD.t + BAKE_PAD.b);
    // The head is above the feet, and the footprint brackets the anchor's neighbourhood
    expect(s.head[1]).toBeLessThan(s.anchor[1] - 20);
    expect(s.foot[0]).toBeLessThan(s.foot[1]);
  });

  test('Baokaka crawls about 70 pt tall (GDD § 3.9), Mocha sits at about 0.55× of that', () => {
    const crawl = spriteDef('baokaka.crawl');
    expect(crawl.anchor[1] - crawl.head[1]).toBeGreaterThan(60);
    expect(crawl.anchor[1] - crawl.head[1]).toBeLessThan(80);
    const sit = spriteDef('mocha.sit');
    expect(sit.anchor[1] - sit.head[1]).toBeGreaterThan(40);
    expect(sit.anchor[1] - sit.head[1]).toBeLessThan(66);
  });
});

describe('payload (#94 R3)', () => {
  const inGroup = (g: number | 'ui') => Object.keys(M.sprites).filter((id) => M.sprites[id as keyof typeof M.sprites].kind === 'pose' && M.sprites[id as keyof typeof M.sprites].group === g);

  test('the core set (every page from the prologue on) is ≤ 400 KB at @3x', () => {
    const core = inGroup(0);
    expect(pageSprites(0)).toEqual(core);
    expect(payloadBytes(core, 3)).toBeLessThanOrEqual(400 * 1024);
    expect(payloadBytes(core, 2)).toBeLessThan(payloadBytes(core, 3));
  });

  test('chapter 1 (the rest of M1) adds at most 100 KB @3x to the core set (#141, D-58)', () => {
    expect(new Set(pageSprites(1))).toEqual(new Set([...inGroup(0), ...inGroup(1)]));
    expect(payloadBytes(inGroup(1), 3)).toBeLessThanOrEqual(100 * 1024);
  });

  test('later chapters add their own poses (walk on 10, the rail stand on 9)', () => {
    expect(pageSprites(10)).toContain('baokaka.walk');
    expect(pageSprites(10)).toContain('mocha.walk');
    expect(pageSprites(9)).toContain('baokaka.pull');
    expect(pageSprites(9)).toContain('baokaka.cruise');
    expect(pageSprites(8)).not.toContain('baokaka.cruise');
    expect(pageSprites(1)).not.toContain('baokaka.walk');
    expect(pageSprites(3)).toContain('baokaka.refuse');
    // A chapter keeps what earlier chapters needed (a word learnt in 2 is said in 3)
    expect(pageSprites(3)).toContain('baokaka.wave');
    expect(pageSprites(1)).toContain('baokaka.giggle');
    expect(pageSprites(0)).not.toContain('baokaka.giggle');
    expect(pageSprites(7)).toContain('baokaka.carried');
    expect(pageSprites(6)).not.toContain('baokaka.climb');
    expect(pageSprites(10)).not.toContain('baokaka.zhuazhou');
  });
});

describe('scale, URLs and mirroring', () => {
  test('DPR ≤ 2 → @2x, else @3x', () => {
    expect(pickScale(1)).toBe(2);
    expect(pickScale(2)).toBe(2);
    expect(pickScale(2.625)).toBe(3);
    expect(pickScale(3)).toBe(3);
  });

  test('URLs resolve for every frame and the floor', () => {
    for (const id of SPRITE_IDS) for (const scale of [2, 3] as const) expect(spriteUrls(id, scale)).toHaveLength(spriteDef(id).files.length);
    expect(spriteUrls('baokaka.crawl', 3, 'key')).toHaveLength(4);
    expect(frameUrl('poses/baokaka-crawl-0', 2)).toMatch(/baokaka-crawl-0@2x/);
    expect(floorUrl(3)).toMatch(/floor@3x/);
  });

  const s = { size: [80, 90] as const, anchor: [30, 84] as const, noMirror: false };

  test('the anchor lands on (x, y) facing either way, at any scale', () => {
    for (const facing of ['l', 'r'] as const) {
      for (const k of [1, 0.5]) expect(toPage(s, facing, 200, 300, s.anchor, k)).toEqual([200, 300]);
    }
  });

  test('mirrored, frame x becomes size − x (Art v2 § 5), about the anchor', () => {
    expect(framePoint(s, [10, 5], 'l')).toEqual([70, 5]);
    expect(framePoint(s, [10, 5], 'r')).toEqual([10, 5]);
    expect(toPage(s, 'r', 0, 0, [50, 4])).toEqual([20, -80]);
    expect(toPage(s, 'l', 0, 0, [50, 4])).toEqual([-20, -80]);
    expect(fromAnchor(s, [50, 4], 'l', 2)).toEqual([-40, -160]);
    expect(spriteTransform(s, 'r', 200, 300)).toBe('matrix(1 0 0 1 170 216)');
    expect(spriteTransform(s, 'l', 200, 300)).toBe('matrix(-1 0 0 1 230 216)');
  });

  test('noMirror sprites never flip', () => {
    const fixed = { ...s, noMirror: true };
    expect(isMirrored(fixed, 'l')).toBe(false);
    expect(spriteTransform(fixed, 'l', 200, 300)).toBe(spriteTransform(fixed, 'r', 200, 300));
    expect(spriteDef('mocha.album').noMirror).toBe(true);
  });

  test('the head sits above the feet, mirrored with the facing', () => {
    const r = spriteHead('baokaka.crawl', 'r');
    const l = spriteHead('baokaka.crawl', 'l');
    expect(r[1]).toBeLessThan(-60);
    expect(l[0]).toBeCloseTo(-r[0]);
  });
});

describe('frame timing', () => {
  const anim = (mode: SpriteAnimDef['mode'], n = 4, fps = 8, events: SpriteAnimDef['events'] = []): SpriteAnimDef => ({ frames: [...Array(n).keys()], fps, mode, hold: 1, events });

  test('steps follow fps', () => {
    expect(stepAt({ fps: 8 }, 0)).toBe(0);
    expect(stepAt({ fps: 8 }, 124)).toBe(0);
    expect(stepAt({ fps: 8 }, 125)).toBe(1);
    expect(stepAt({ fps: 8 }, 1000)).toBe(8);
  });

  test('loop, pingpong and once', () => {
    expect([...Array(9).keys()].map((n) => frameOfStep(anim('loop'), n))).toEqual([0, 1, 2, 3, 0, 1, 2, 3, 0]);
    expect([...Array(9).keys()].map((n) => frameOfStep(anim('pingpong'), n))).toEqual([0, 1, 2, 3, 2, 1, 0, 1, 2]);
    expect([...Array(6).keys()].map((n) => frameOfStep(anim('once'), n))).toEqual([0, 1, 2, 3, 3, 3]);
    expect(frameOfStep(anim('pingpong', 1), 5)).toBe(0);
  });

  test('once is done after its last frame has shown for a frame; reduced holds the key frame', () => {
    expect(frameAt(anim('once'), 3 * 125).done).toBe(false);
    expect(frameAt(anim('once'), 4 * 125)).toEqual({ index: 3, frame: 3, done: true });
    expect(frameAt(anim('loop'), 99_999).done).toBe(false);
    expect(frameAt(anim('loop'), 250, true)).toEqual({ index: 1, frame: 1, done: true });
  });

  test('events fire on their frames, once per crossing, and a stall replays at most a cycle', () => {
    const a = anim('loop', 4, 8, [{ frame: 0, name: 'step' }, { frame: 2, name: 'step' }]);
    expect(eventsBetween(a, -1, 0)).toEqual(['step']);
    expect(eventsBetween(a, 0, 1)).toEqual([]);
    expect(eventsBetween(a, 1, 4)).toEqual(['step', 'step']);
    expect(eventsBetween(a, 4, 4)).toEqual([]);
    expect(eventsBetween(a, 0, 10_000)).toEqual(['step', 'step']);
    const once = anim('once', 3, 8, [{ frame: 2, name: 'land' }]);
    expect(eventsBetween(once, -1, 50)).toEqual(['land']);
    expect(eventsBetween(once, 2, 50)).toEqual([]);
  });

  test('the shipped jump lands on its last frame; the crawl steps twice a cycle', () => {
    expect(spriteDef('mocha.jump').anims.main.events).toEqual([{ frame: 2, name: 'land' }]);
    expect(eventsBetween(spriteDef('baokaka.crawl').anims.main, -1, 7)).toEqual(['step', 'step']);
    // The keyframe cycle keeps the steps on its frames 0 and 2 (artist frames 0 and 4), at half the fps
    expect(spriteDef('baokaka.crawl').anims.key).toMatchObject({ frames: [0, 2, 4, 6], fps: 4, events: [{ frame: 0, name: 'step' }, { frame: 2, name: 'step' }] });
  });
});

describe('the shared clock', () => {
  test('one rAF for all subscribers, none when idle', () => {
    const queued: FrameRequestCallback[] = [];
    let cancelled = 0;
    const clock = rafClock((cb) => (queued.push(cb), queued.length), () => cancelled++, () => 0);
    const seen: number[] = [];
    const a = clock.subscribe((t) => seen.push(t));
    const b = clock.subscribe((t) => seen.push(-t));
    expect(queued).toHaveLength(1);
    queued.shift()!(16);
    expect(seen).toEqual([16, -16]);
    expect(queued).toHaveLength(1);
    a();
    b();
    expect(cancelled).toBe(1);
  });

  test('a manual clock drives subscribers', () => {
    const clock = manualClock(100);
    const seen: number[] = [];
    const off = clock.subscribe((t) => seen.push(t));
    clock.advance(50);
    off();
    clock.advance(50);
    expect(seen).toEqual([150]);
    expect(clock.now()).toBe(200);
  });
});

describe('the loader', () => {
  test('decodes once per URL, tracks states, keeps going on errors', async () => {
    const calls: string[] = [];
    const loader = new SpriteLoader(async (url) => {
      calls.push(url);
      if (url === 'bad') throw new Error('404');
      return url;
    });
    let changes = 0;
    loader.subscribe(() => changes++);
    expect(loader.ready(['a'])).toBe(false);
    const p = loader.preload(['a', 'b', 'a', 'bad']);
    expect(loader.state('a')).toBe('loading');
    await p;
    expect(calls).toEqual(['a', 'b', 'bad']);
    expect(loader.ready(['a', 'b'])).toBe(true);
    expect(loader.ready(['a', 'bad'])).toBe(false);
    expect(loader.settled(['a', 'bad'])).toBe(true);
    expect(loader.state('bad')).toBe('error');
    expect(changes).toBe(3);
    await loader.load('a');
    expect(calls).toHaveLength(3);
  });
});

describe('<SpriteAnim> (server render: nothing decoded yet)', () => {
  test('a placeholder card in the frame box, the anchor on (x, y), the floor ellipse, no filter', () => {
    const html = renderToStaticMarkup(createElement('svg', null, createElement(SpriteAnim, { sprite: 'baokaka.crawl', facing: 'l', x: 100, y: 200, dpr: 2 })));
    const s = spriteDef('baokaka.crawl');
    expect(html).toContain('data-sprite="baokaka.crawl"');
    expect(html).toContain('data-placeholder=""');
    expect(html).toContain(`matrix(-1 0 0 1 ${100 + s.anchor[0]} ${200 - s.anchor[1]})`);
    expect(html).toContain('data-floor=""');
    expect(html).not.toMatch(/filter/);
    expect(html).toContain(`data-frame="${s.anims.main.hold}"`);
  });

  test('stills draw at map scale', () => {
    const html = renderToStaticMarkup(createElement('svg', null, createElement(SpriteAnim, { sprite: 'baokaka-stand', dpr: 3, floor: false })));
    const k = spriteDef('baokaka-stand').mapScale;
    expect(k).toBeLessThan(1);
    expect(html).toContain(`matrix(${k} 0 0 ${k} `);
    expect(html).not.toContain('data-floor');
  });
});
