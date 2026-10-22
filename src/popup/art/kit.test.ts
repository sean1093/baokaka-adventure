import { describe, expect, test } from 'vitest';
import { POPUP, POPUP_CHAPTER_CLOCK, POPUP_FOIL } from '../../art/palette';
import { partArt, renderPart, isPlaceholder } from '../view/art/registry';
import {
  DEPTHS,
  FILTER_DEFS,
  PAINT_DEFS,
  PART_PRESETS,
  PRESET_ART,
  bead,
  bottomBar,
  brad,
  cover,
  depth,
  depthFilter,
  fibers,
  flap,
  grain,
  hudLabel,
  kitCtx,
  kitDefs,
  mountainFold,
  pageBlock,
  paw,
  perch,
  pinholes,
  presetSvg,
  pullTab,
  scallopBand,
  seal,
  seeded,
  skyline,
  slider,
  softEllipse,
  sparkle,
  springBubble,
  standee,
  standeeFilter,
  swatchSheet,
  valleyFold,
  washi,
  wheel,
  type KitCtx,
} from '.';

/**
 * The kit port (#139): every helper is a pure function of its arguments (snapshotted), seeded
 * randomness repeats, filters appear only when the context allows them (GDD § 3.9), def ids are
 * scoped per document, and colours come from the palette only.
 */

const live = kitCtx('t');
const baked = kitCtx('t', { filters: true });

/** Every helper, called once with representative arguments. */
const HELPERS: Record<string, (ctx: KitCtx) => string> = {
  depthFilter: () => depthFilter('z3', 3),
  standeeFilter: () => standeeFilter('standee'),
  kitDefs: (ctx) => kitDefs(ctx),
  depth: (ctx) => depth(ctx, 2, '<rect width="10" height="8" fill="red"/>', '<rect width="10" height="8"/>'),
  softEllipse: (ctx) => softEllipse(ctx, 10, 20, 12, 4, 'shadow', 0.5),
  grain: (ctx) => grain(ctx),
  fibers: () => fibers(0, 0, 87, 56, 12, POPUP.kraftFiber, 7, 0.45),
  scallopBand: () => scallopBand(0, 120, 40, 60, 3),
  skyline: () => JSON.stringify(skyline(0, 120, 80, 9)),
  pinholes: (ctx) => pinholes(ctx, 0, 0, 87, 56, 12, 3),
  sparkle: (ctx) => sparkle(ctx, 10, 10, 6),
  washi: (ctx) => washi(ctx, 44, 16, 50, 15, -8),
  mountainFold: (ctx) => mountainFold(ctx, 0, 0),
  valleyFold: (ctx) => valleyFold(ctx, 0, 0),
  cover: (ctx) => cover(ctx, 120, 200),
  seal: (ctx) => seal(ctx, 0, 0, '拉', 13),
  brad: (ctx) => brad(ctx, 0, 0, 4.5, true),
  pullTab: (ctx) => pullTab(ctx, 0, 0),
  wheel: (ctx) => wheel(ctx, 0, 0, 24, { teeth: 16, rot: 45 }),
  flap: (ctx) => flap(ctx, 0, 0, 50, 40, { open: 0.5 }),
  slider: (ctx) => slider(ctx, 0, 0, 58, 0.25),
  paw: () => paw(),
  perch: (ctx) => perch(ctx, 0, 0, 0.8),
  standee: (ctx) => standee(ctx, 'mocha.webp', 80, 64, 58, 0.5, { glow: true }),
  springBubble: (ctx) => springBubble(ctx, 0, 0, 40, -60, '<circle r="4"/>'),
  bead: (ctx) => bead(ctx, 0, 0),
  hudLabel: (ctx) => hudLabel(ctx, { title: '台北車站', page: '月台的縫', sub: '第1章 · 第 2 頁 / 6', time: '00:20', filled: 2 }),
  bottomBar: (ctx) => bottomBar(ctx, { stickers: [true, false, true] }),
  pageBlock: () => pageBlock(10, 380, 700),
};

describe('helper snapshots', () => {
  test.each(Object.keys(HELPERS))('%s (in-game, no filters)', (name) => {
    expect(HELPERS[name](live)).toMatchSnapshot();
  });
  test.each(Object.keys(HELPERS))('%s (PageLab / bake, filters)', (name) => {
    expect(HELPERS[name](baked)).toMatchSnapshot();
  });
  test.each([...PART_PRESETS])('preset %s default art', (preset) => {
    expect(PRESET_ART[preset].draw(live, {})).toMatchSnapshot();
  });
  test('the swatch sheet (proof D) is stable', () => {
    const sheet = swatchSheet(baked, { mochaSit: 'm.webp', crawl: 'c.webp' });
    expect(sheet.length).toMatchSnapshot();
    expect(sheet).toBe(swatchSheet(kitCtx('t', { filters: true }), { mochaSit: 'm.webp', crawl: 'c.webp' }));
  });
});

describe('determinism', () => {
  test('a seeded stream repeats and differs between seeds', () => {
    const a = seeded(7), b = seeded(7), c = seeded(8);
    const draws = (r: () => number) => Array.from({ length: 5 }, r);
    const [da, db, dc] = [draws(a), draws(b), draws(c)];
    expect(da).toEqual(db);
    expect(da).not.toEqual(dc);
    for (const v of da) expect(v >= 0 && v < 1).toBe(true);
  });

  test('seed 0 behaves like seed 1, as in kit.js', () => {
    expect(fibers(0, 0, 10, 10, 3, POPUP.ink, 0)).toBe(fibers(0, 0, 10, 10, 3, POPUP.ink, 1));
  });

  test.each(Object.keys(HELPERS))('%s returns the same string twice', (name) => {
    expect(HELPERS[name](baked)).toBe(HELPERS[name](kitCtx('t', { filters: true })));
  });

  test('seeded shapes change with the seed', () => {
    expect(scallopBand(0, 120, 40, 60, 3)).not.toBe(scallopBand(0, 120, 40, 60, 4));
    expect(skyline(0, 120, 80, 1).d).not.toBe(skyline(0, 120, 80, 2).d);
  });
});

describe('filters only in PageLab and the bake (GDD § 3.9, bible § 9.1)', () => {
  const FILTER = /\bfilter=|<filter\b|feGaussianBlur|feTurbulence/;

  test.each(Object.keys(HELPERS).filter((name) => !['depthFilter', 'standeeFilter'].includes(name)))('%s draws no filter without filters', (name) => {
    expect(HELPERS[name](live)).not.toMatch(FILTER);
  });

  test.each([...PART_PRESETS])('preset %s draws no filter in game, in every state', (preset) => {
    for (const opts of [{}, { state: 'open', states: ['closed', 'open'] }, { state: 'on', states: ['off', 'on'] }, { state: 'down', states: ['up', 'down'] }, { touchable: false }]) {
      expect(presetSvg(live, preset, opts)).not.toMatch(FILTER);
      expect(renderPart(live, 'c1/whatever', preset, opts)).not.toMatch(FILTER);
    }
  });

  test('the swatch sheet without filters has none either', () => {
    expect(swatchSheet(live)).not.toMatch(FILTER);
  });

  test('with filters, the depth, grain and standee filters are in the defs and used', () => {
    const defs = kitDefs(baked);
    for (const z of DEPTHS) expect(defs).toContain(`<filter id="t-z${z}"`);
    expect(defs).toContain('<filter id="t-grain"');
    expect(defs).toContain('<filter id="t-standee"');
    expect(pullTab(baked, 0, 0)).toContain('filter="url(#t-z3)"');
    expect(grain(baked)).toContain('filter="url(#t-grain)"');
    expect(standee(baked, 'a.webp', 0, 0, 50, 0.5)).toContain('filter="url(#t-standee)"');
  });

  test('the depth filter follows the bible § 2.2 formula', () => {
    const f = depthFilter('d', 2);
    expect(f).toContain('stdDeviation="4.7"'); // soft blur 1.5 + 1.6z
    expect(f).toContain('dx="3.2" dy="6.4"'); // soft offset 1 + 1.1z / 2 + 2.2z
    expect(f).toContain('flood-opacity="0.28"'); // .22 + .03z
    expect(f).toContain(`flood-color="${POPUP.cutRim}" flood-opacity=".42"`);
    expect(f).toContain(`flood-color="${POPUP.shadow}"`);
  });
});

describe('unique ids per document', () => {
  const ids = (svg: string) => [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  const refs = (svg: string) => [...svg.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]);

  test('every def id carries the context scope, once', () => {
    const all = ids(kitDefs(baked));
    expect(new Set(all).size).toBe(all.length);
    for (const id of all) expect(id.startsWith('t-')).toBe(true);
    expect(all.length).toBe(Object.keys(FILTER_DEFS).length + Object.keys(PAINT_DEFS).length);
  });

  test('two documents never share an id', () => {
    const a = ids(presetSvg(kitCtx('a'), 'wheel'));
    const b = new Set(ids(presetSvg(kitCtx('b'), 'wheel')));
    for (const id of a) expect(b.has(id)).toBe(false);
  });

  test('every reference in a preset fragment resolves inside it', () => {
    for (const preset of PART_PRESETS) {
      for (const ctx of [live, baked]) {
        const svg = presetSvg(ctx, preset, { touchable: true });
        const defined = new Set(ids(svg));
        for (const r of refs(svg)) expect(defined.has(r), `${preset}: #${r}`).toBe(true);
      }
    }
  });

  test('every reference in the swatch sheet resolves inside it', () => {
    for (const ctx of [live, baked]) {
      const svg = swatchSheet(ctx);
      const defined = new Set(ids(svg));
      for (const r of refs(svg)) expect(defined.has(r), `#${r}`).toBe(true);
    }
  });

  test('the HUD and bar resolve against the full defs', () => {
    const svg = kitDefs(baked) + hudLabel(baked, { title: 'x', sub: 'y', time: '00:00' }) + bottomBar(baked);
    const defined = new Set(ids(svg));
    for (const r of refs(svg)) expect(defined.has(r), `#${r}`).toBe(true);
  });
});

describe('default art for every GDD part preset (the registry fallback)', () => {
  test('all fourteen presets of GDD § 2.1 have art', () => {
    expect([...PART_PRESETS].sort()).toEqual(['blowable', 'button', 'carrier', 'flap', 'gate', 'lift', 'light', 'loop', 'prop', 'pushable', 'section', 'slider', 'tab', 'wheel']);
    for (const preset of PART_PRESETS) {
      expect(PRESET_ART[preset].preset).toBe(preset);
      expect(PRESET_ART[preset].draw(live, {}).length).toBeGreaterThan(50);
    }
  });

  test('only player-driven presets are marigold with a verb seal (bible § 4)', () => {
    for (const preset of PART_PRESETS) {
      const art = PRESET_ART[preset];
      const svg = art.draw(live, { touchable: true });
      const marigold = svg.includes('tabG') || svg.includes('tabR') || svg.includes(POPUP.marigold);
      const sealed = svg.includes(POPUP.seal);
      if (art.touchable === false) {
        expect(marigold, preset).toBe(false);
        expect(sealed, preset).toBe(false);
      } else {
        expect(marigold, preset).toBe(true);
        expect(sealed, preset).toBe(true);
        expect(svg, preset).toContain(`>${art.verb}</text>`);
      }
    }
  });

  test('a loop without a crank is printed, not marigold', () => {
    const svg = PRESET_ART.loop.draw(live, { touchable: false });
    expect(svg).not.toContain(POPUP.seal);
    expect(svg).not.toContain('tabR');
  });

  test('state-dependent looks: flap open, light on, gate open, button down', () => {
    const pair = (preset: 'flap' | 'light' | 'gate' | 'button', a: string, b: string) =>
      expect(PRESET_ART[preset].draw(live, { state: a, states: [a, b] })).not.toBe(PRESET_ART[preset].draw(live, { state: b, states: [a, b] }));
    pair('flap', 'closed', 'open');
    pair('light', 'off', 'on');
    pair('gate', 'closed', 'open');
    pair('button', 'up', 'down');
  });

  test('an unregistered art key falls back to its preset', () => {
    expect(partArt('c1/train-blue', 'tab')).toBe(PRESET_ART.tab);
    expect(isPlaceholder('c1/train-blue')).toBe(true);
  });

  test('every preset declares a sane bounding box', () => {
    for (const preset of PART_PRESETS) {
      const { box } = PRESET_ART[preset];
      expect(box.w).toBeGreaterThan(20);
      expect(box.h).toBeGreaterThan(20);
    }
  });
});

describe('palette', () => {
  const HEX = /^#[0-9A-F]{6}$/;

  test('foil gradients are ordered stops of solid colours', () => {
    for (const stops of Object.values(POPUP_FOIL)) {
      expect(stops[0][0]).toBe(0);
      expect(stops.at(-1)?.[0]).toBe(1);
      for (let i = 1; i < stops.length; i++) expect(stops[i][0]).toBeGreaterThan(stops[i - 1][0]);
      for (const [, color] of stops) expect(color).toMatch(HEX);
    }
  });

  test('the chapter colour clock covers 序, 1–10 and E in time order, then the bonus page\'s sunrise (bible § 3.3; #135)', () => {
    expect(POPUP_CHAPTER_CLOCK.map((sky) => sky.label)).toEqual(['序', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'E', '象']);
    expect(POPUP_CHAPTER_CLOCK.map((sky) => sky.chapter)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    // The night's clock runs to page E; 番外 is another morning
    const minutes = POPUP_CHAPTER_CLOCK.filter((sky) => sky.chapter <= 11).map((sky) => Number(sky.time.slice(0, 2)) * 60 + Number(sky.time.slice(3)));
    for (let i = 1; i < minutes.length; i++) expect(minutes[i]).toBeGreaterThan(minutes[i - 1]);
    for (const sky of POPUP_CHAPTER_CLOCK) {
      expect(sky.top).toMatch(HEX);
      expect(sky.horizon).toMatch(HEX);
    }
    expect(POPUP_CHAPTER_CLOCK[1]).toMatchObject({ time: '00:20', top: '#0B1238', horizon: '#40408E' });
    expect(POPUP_CHAPTER_CLOCK[10]).toMatchObject({ time: '05:10', top: '#3A3A80', horizon: '#F4B49A' });
  });

  test('kit.js core colours carried over unchanged', () => {
    expect(POPUP).toMatchObject({
      cover: '#1B2052', gold: '#E8C77A', page: '#F3E6CC', ink: '#2E2235', shadow: '#140C34',
      marigold: '#FFC23A', marigoldLight: '#FFE38C', marigoldDeep: '#E39A17', marigoldEdge: '#A9650C',
      seal: '#D8342A', sealDark: '#9E1F18', standeeCard: '#FBF6EC', standeeCut: '#8F8296',
    });
  });

  // Every source file under src/popup, as text (tests excluded)
  const SOURCES = import.meta.glob(['../**/*.ts', '../**/*.tsx', '!../**/*.test.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
  const HEX_ANY = /(?<![\w&])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![\w-])/gi;

  // Issue references (#139) are all digits and up to four long; no colour token looks like that
  const colours = (src: string) => (src.replace(/url\(#[^)]*\)/g, '').replace(/href=["'`{]+#[^"'`}]*/g, '').match(HEX_ANY) ?? []).filter((m) => !/^#\d{1,4}$/.test(m));

  test('the colour scan catches colours and skips id references and issue numbers', () => {
    expect(colours('fill="#FFC23A" stroke="#fff" fill="url(#a-b)" see #139')).toEqual(['#FFC23A', '#fff']);
  });

  test('no raw hex anywhere in src/popup: colours come from palette.ts', () => {
    expect(Object.keys(SOURCES).length).toBeGreaterThan(5);
    const offenders = Object.entries(SOURCES)
      .filter(([, src]) => colours(src).length > 0)
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });
});
