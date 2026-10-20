import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { initialState, replay, step, withPartState } from '../core';
import type { PageDef, SimState } from '../core/types';
import { PAGES, pageById } from '../pages';
import { compilePart } from '../core/presets';
import { NO_GESTURE, targetsOf, type GestureFlags } from './gestures';
import { ANIMATED_LAYERS, ANIMATED_NODE_BUDGET, LAYERS, type LayerId } from './layers';
import { CARRY_AHEAD, CARRY_LIFT, PageView, carriedPose } from './PageView';
import { toyHug } from '../core/fixtures/m3';

/**
 * The page renderer, rendered to static markup (#89; GDD § 3.9): the layers in order, node counts
 * per layer against the 150 animated-node budget, no `filter` anywhere on the in-game path, a hit
 * shape for every part, and the moving pieces where the state puts them.
 */

beforeAll(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {});
});
afterAll(() => {
  vi.restoreAllMocks();
});

function render(def: PageDef, prev: SimState, state: SimState, ms = 0, reduced = false, gesture?: GestureFlags): string {
  return renderToStaticMarkup(createElement(PageView, { def, prev, state, ms, tickMs: 500, reduced, gesture }));
}

/** Each layer's markup (layers are sibling groups, so a layer runs to the next one's start). */
function layers(html: string): Record<LayerId, string> {
  const out = {} as Record<LayerId, string>;
  const starts = LAYERS.map((id) => [id, html.indexOf(`data-layer="${id}"`)] as const);
  starts.forEach(([id, at], i) => {
    expect(at, `layer ${id}`).toBeGreaterThan(-1);
    const end = starts[i + 1]?.[1] ?? html.length;
    out[id] = html.slice(at, end);
  });
  return out;
}

/** SVG/DOM elements in a chunk of markup. */
const elements = (html: string) => (html.match(/<[a-zA-Z][\w:-]*/g) ?? []).length;
/** Groups the view moves between ticks. */
const animated = (html: string) => (html.match(/data-anim=""/g) ?? []).length;

/** Every element that moves: the `data-anim` groups and everything inside them. */
function animatedNodes(html: string): number {
  const stack: boolean[] = [];
  let count = 0;
  for (const [, close, , attrs, selfClose] of html.matchAll(/<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g)) {
    if (close) {
      stack.pop();
      continue;
    }
    const inside = (stack[stack.length - 1] ?? false) || attrs.includes('data-anim=""');
    if (inside) count++;
    if (!selfClose) stack.push(inside);
  }
  return count;
}

/** Frames worth checking per page: the start, mid-step, after a few idle ticks, and every tick of the solution mid-tween. */
function frames(def: PageDef): [SimState, SimState][] {
  const out: [SimState, SimState][] = [];
  let s = initialState(def);
  out.push([s, s]);
  for (let i = 0; i < 3; i++) {
    const next = step(def, s, { t: 'none' }).state;
    out.push([s, next]);
    s = next;
  }
  for (const t of replay(def, def.solution, s).ticks) {
    const next = step(def, s, t.input).state;
    out.push([s, next]);
    s = next;
  }
  return out;
}

describe('PageView layers and budget', () => {
  test.each(PAGES.map((def) => [def.id, def] as const))('%s: layers in the GDD § 3.9 order, no filters, animated nodes within budget', (_, def) => {
    for (const [prev, state] of frames(def)) {
      const html = render(def, prev, state, 120);
      const byLayer = layers(html);
      // GDD § 3.9: no runtime SVG filters (the kit draws flat stand-ins in game)
      expect(html).not.toMatch(/\bfilter=/);
      expect(html).not.toMatch(/filter:/);
      expect(animatedNodes(html), `${def.id} tick ${state.tick}: animated nodes`).toBeLessThanOrEqual(ANIMATED_NODE_BUDGET);
      for (const id of LAYERS) if (!ANIMATED_LAYERS.has(id)) expect(animated(byLayer[id]), `${def.id}: ${id} is static`).toBe(0);
    }
  });

  test('node counts per layer (1-2 is far below the animated budget)', () => {
    const def = pageById('c1p2')!;
    const s = initialState(def);
    let max = 0;
    for (const [prev, state] of frames(def)) max = Math.max(max, animatedNodes(render(def, prev, state, 120)));
    // Strict reading (every element inside a moving group) stays well inside the budget …
    expect(max).toBeLessThanOrEqual(ANIMATED_NODE_BUDGET * 0.8);
    // … and the moving groups themselves (what the compositor animates) are a handful
    expect(animated(render(def, s, s))).toBeLessThanOrEqual(15);
    const html = render(def, s, s);
    const counts = Object.fromEntries(Object.entries(layers(html)).map(([id, chunk]) => [id, { elements: elements(chunk), animated: animatedNodes(chunk) }]));
    expect(counts).toMatchSnapshot();
  });

  test('a hit shape for every touchable (player-driven parts, perches, actors), in page units', () => {
    for (const def of PAGES) {
      const s = initialState(def);
      const hit = layers(render(def, s, s)).hit;
      for (const t of targetsOf(def, s)) expect(hit).toContain(`data-hit="${t.key}"`);
      for (const part of def.parts.filter((p) => compilePart(p).input !== 'none')) expect(hit).toContain(`data-hit="${part.id}"`);
      expect(hit).toContain('fill="transparent"');
      expect(hit).not.toContain('data-reveal');
    }
  });
});

describe('PageView motion', () => {
  const def = pageById('c1p2')!;
  const s0 = initialState(def);
  const transformOf = (html: string, attr: string) => html.match(new RegExp(`${attr}[^>]*transform="([^"]*)"`))?.[1] ?? html.match(new RegExp(`transform="([^"]*)"[^>]*${attr}`))?.[1];

  test('Baokaka hop-lerps between nodes as a leaning card, landing 120 ms before the tick ends (#95)', () => {
    const s1 = step(def, s0, { t: 'none' }).state;
    const at = (ms: number) => transformOf(render(def, s0, s1, ms), 'data-actor="baby"');
    expect(at(0)).toBe('translate(40 430) scale(1 1)');
    // Mid-step (380 ms of travel): half way, the 2 px arc at its top, the full 4° lean to the right
    expect(at(190)).toBe('translate(65 428) rotate(4) scale(1 1)');
    // Landed at 380 ms, then the ±2° wobble, settled by the tick's end
    expect(at(380)).toBe('translate(90 430) scale(1 1)');
    expect(at(410)).toMatch(/^translate\(90 430\) rotate\(1\.\d+\) scale\(1 1\)$/);
    expect(at(500)).toBe('translate(90 430) scale(1 1)');
  });

  test('the crawl cycle is synced to the step: whole strides per edge, the key frame between steps', () => {
    const s1 = step(def, s0, { t: 'none' }).state;
    const frameAt = (ms: number) => render(def, s0, s1, ms).match(/data-sprite="baokaka\.crawl" data-frame="(\d+)"/)?.[1];
    // A 50-unit edge is one stride: 8 frames over the eased step
    expect(frameAt(0)).toBe('0');
    expect(frameAt(190)).toBe('4');
    expect(frameAt(500)).toBe('0');
    expect(new Set([40, 80, 120, 160, 200, 240, 280, 320, 360].map(frameAt)).size).toBeGreaterThanOrEqual(6);
  });

  test('the train tab slides with the part tween and the carriage carries its riders', () => {
    const half = withPartState(s0, 'train', 'half');
    const html0 = render(def, s0, half, 0);
    const html1 = render(def, s0, half, 400);
    expect(html1).not.toBe(html0);
    expect(transformOf(html1, 'data-carriage="train"')).toBe('translate(124 430)');
    expect(transformOf(html0, 'data-carriage="train"')).toBe('translate(34 430)');
  });

  test('reduced motion: a step is a short fade-slide, with no arc, lean or frame cycle', () => {
    const s1 = step(def, s0, { t: 'none' }).state;
    const html0 = render(def, s0, s1, 0, true);
    expect(transformOf(html0, 'data-actor="baby"')).toBe('translate(80 430) scale(1 1)');
    expect(html0).toMatch(/data-actor="baby"[^>]*opacity="0.25"/);
    const html1 = render(def, s0, s1, 200, true);
    expect(transformOf(html1, 'data-actor="baby"')).toBe('translate(90 430) scale(1 1)');
    expect(html1).not.toMatch(/data-actor="baby"[^>]*opacity=/);
    expect(render(def, s0, s1, 100, true)).toMatch(/data-sprite="baokaka\.crawl" data-frame="0"/);
  });

  test('the bubble shows what he wants: 要！ while reaching', () => {
    let s = s0;
    for (let i = 0; i < 3; i++) s = step(def, s, { t: 'none' }).state;
    expect(s.baby.mode).toBe('reaching');
    const fx = layers(render(def, s, s)).fx;
    expect(fx).toContain('data-bubble="want"');
    expect(fx).toContain('要！');
  });
});

describe('the spread\'s treasure (#107)', () => {
  test('the thought bubble shows the chapter treasure, not the bead, when he wants it', () => {
    const c1p6 = pageById('c1p6')!;
    const s = replay(c1p6, [{ tap: 'lid' }, { wait: 'settle' }]).state;
    expect(s.baby.mode).toBe('reaching');
    expect(s.baby.target).toBe('drumstick');
    const fx = layers(render(c1p6, s, s)).fx;
    expect(fx).toContain('data-bubble-treasure="1"');
    // On an ordinary page the bead's icon stays
    const c1p2 = pageById('c1p2')!;
    const reaching = replay(c1p2, [{ set: 'train', to: 'half' }, { wait: 'settle' }]).state;
    expect(layers(render(c1p2, reaching, reaching)).fx).not.toContain('data-bubble-treasure');
  });

  test('the lid is drawn where the cart has taken it', () => {
    const c1p6 = pageById('c1p6')!;
    const start = initialState(c1p6);
    expect(render(c1p6, start, start)).not.toContain('data-rides=');
    const moved = withPartState(start, 'cart', 'platform');
    expect(render(c1p6, moved, moved)).toContain('data-rides="K" transform="translate(-36 0)"');
  });
});

describe('PageView thought bubble change of mind (#98, GDD § 2.2.6)', () => {
  const def = pageById('c0p2')!;
  let s = initialState(def);
  for (let i = 0; i < 2; i++) s = step(def, s, { t: 'none' }).state;
  const watching = s;
  const r = step(def, watching, { t: 'tap', id: 'cushion' });
  const wants = r.state;
  const renderK = (prev: SimState, state: SimState, opts: { reduced?: boolean; still?: boolean } = {}) =>
    layers(renderToStaticMarkup(createElement(PageView, { def, prev, state, ms: 50, tickMs: 500, reduced: opts.reduced ?? false, still: opts.still, events: r.events }))).fx;

  test('0-2: watching the TV, then the cushion shows the bead and he wants it', () => {
    expect(watching.baby.mode).toBe('watching');
    expect(wants.baby.target).toBe('bead');
  });

  test('the old icon pops, the new one inflates late, the spring wobbles, he barks', () => {
    const fx = renderK(watching, wants);
    expect(fx).toContain('data-bubble="want"');
    expect(fx).toContain('class="tb-pop"');
    expect(fx).toContain('class="tb-inflate tb-late"');
    expect(fx).toContain('class="tb-wobble"');
    // He turns back for it at once: wanting (moving), not reaching, so 「要！」 doesn't pulse
    expect(fx).not.toContain('class="tb-pulse"');
    expect(fx).toMatch(/data-bark="baby"[\s\S]*要！/);
  });

  test("0-2's tutorial spotlight (#106): a breathing glow round the bubble, still under reduced motion", () => {
    const lit = (reduced: boolean) =>
      layers(renderToStaticMarkup(createElement(PageView, { def, prev: watching, state: watching, ms: 50, tickMs: 500, reduced, affordance: { bubble: true } }))).fx;
    expect(lit(false)).toMatch(/data-bubble-spotlight=""><g class="tb-spot">/);
    expect(lit(true)).toContain('data-bubble-spotlight');
    expect(lit(true)).not.toContain('tb-spot');
    expect(renderK(watching, watching)).not.toContain('data-bubble-spotlight');
  });

  test('reduced motion: the same beats as fades, no wobble or pulse', () => {
    const fx = renderK(watching, wants, { reduced: true });
    expect(fx).toContain('class="tb-fade-out"');
    expect(fx).toContain('class="tb-fade-in tb-late"');
    expect(fx).not.toMatch(/tb-wobble|tb-pulse|tb-pop|tb-inflate/);
    expect(fx).toContain('class="tb-bark-fade"');
  });

  test('no change, no animation; a still draws only the settled bubble', () => {
    expect(renderK(wants, wants)).not.toMatch(/tb-pop|tb-wobble|tb-inflate/);
    expect(renderK(watching, wants, { still: true })).not.toMatch(/tb-pop|tb-wobble|tb-inflate|tb-pulse/);
  });

  test('the bubble grows against a small book so its text stays ≥ 20 screen px (R5)', () => {
    const at = (scale: number) => renderToStaticMarkup(createElement(PageView, { def, prev: wants, state: wants, ms: 0, tickMs: 500, scale }));
    expect(at(0.661)).toMatch(/scale\(1\.3[89]\d*\)/);
    expect(at(1)).toContain('scale(1)');
  });
});

describe('PageView gesture flags (#90)', () => {
  const def = pageById('c1p2')!;
  const s0 = initialState(def);
  const transformOf = (html: string, attr: string) => html.match(new RegExp(`${attr}[^>]*transform="([^"]*)"`))?.[1];

  test('a drag preview holds the tab between stops and the carriage follows with its riders', () => {
    const html = render(def, s0, s0, 0, false, { ...NO_GESTURE, preview: { part: 'train', index: 0.5 }, dragging: 'train' });
    expect(html).toContain('data-dragging=""');
    // Half way from out (lead node 60) to half (150): the carriage's lead rider at 105
    expect(transformOf(html, 'data-carriage="train"')).toBe('translate(79 430)');
    expect(transformOf(render(def, s0, s0), 'data-carriage="train"')).toBe('translate(34 430)');
  });

  test('locked parts are flagged and wobble (not under reduced motion); Mocha glares', () => {
    const flags: GestureFlags = { ...NO_GESTURE, locked: { part: 'train', serial: 3 } };
    const html = render(def, s0, s0, 0, false, flags);
    expect(html).toMatch(/data-locked=""[^>]*class="gx-wobble"|class="gx-wobble"[^>]*data-locked=""/);
    expect(html).toContain('data-glare=""');
    expect(render(def, s0, s0, 0, true, flags)).not.toContain('gx-wobble');
  });

  test('Baokaka watches the finger; hold-to-reveal outlines every touchable', () => {
    expect(render(def, s0, s0, 0, false, { ...NO_GESTURE, finger: [300, 200] })).toContain('data-watch="r"');
    expect(render(def, s0, s0, 0, false, { ...NO_GESTURE, finger: [0, 200] })).toContain('data-watch="l"');
    expect(render(def, s0, s0)).not.toContain('data-watch');
    const reveal = layers(render(def, s0, s0, 0, false, { ...NO_GESTURE, reveal: true })).hit;
    expect(reveal).toContain('data-reveal');
    expect((reveal.split('data-reveal')[1].match(/<(rect|circle)/g) ?? []).length).toBe(targetsOf(def, s0).length);
  });

  test('the page reports its part states and completion for tools', () => {
    expect(render(def, s0, s0)).toContain('data-parts="board=times train=out"');
    const done = replay(def, def.solution).state;
    expect(render(def, done, done)).toContain('data-done=""');
  });
});

describe('PageView character animations (#95)', () => {
  const def = pageById('c1p2')!;
  const s0 = initialState(def);
  const pose = (html: string, actor: 'baby' | 'mocha') => html.match(new RegExp(`data-actor="${actor}"[^>]*data-pose="([^"]*)"`))?.[1];

  test('idle sits; reaching reaches; a finger down is touch-watch (its own frame since #141)', () => {
    expect(pose(render(def, s0, s0), 'baby')).toBe('sit');
    let s = s0;
    for (let i = 0; i < 3; i++) s = step(def, s, { t: 'none' }).state;
    expect(pose(render(def, s, s), 'baby')).toBe('reach');
    const watching = render(def, s, s, 0, false, { ...NO_GESTURE, finger: [300, 200] });
    expect(pose(watching, 'baby')).toBe('touchWatch');
    expect(watching).toMatch(/data-sprite="baokaka\.touchwatch"/);
    expect(watching).not.toMatch(/data-fallback/);
  });

  test('Mocha hops along his step (jump frames) and turns toward where he goes; he glares while the finger is on a locked part', () => {
    const s1 = step(def, s0, { t: 'mocha', perch: 'pillar' }).state;
    const mid = render(def, s0, s1, 190);
    expect(pose(mid, 'mocha')).toBe('hop');
    expect(mid).toMatch(/data-sprite="mocha\.jump" data-frame="1" data-facing="l"/);
    expect(render(def, s0, s1, 500)).toMatch(/data-sprite="mocha\.jump" data-frame="2"/);
    expect(pose(render(def, s1, s1), 'mocha')).toBe('sit');
    const locked = { part: 'train', serial: 1 };
    expect(pose(render(def, s0, s0, 0, false, { ...NO_GESTURE, locked, finger: [100, 600] }), 'mocha')).toBe('glare');
    expect(pose(render(def, s0, s0, 0, false, { ...NO_GESTURE, locked }), 'mocha')).toBe('sit');
  });

  test('carried along by the train he giggles (ride-giggle, #141)', () => {
    let s = step(def, s0, { t: 'set', part: 'train', to: 'half' }).state;
    for (let i = 0; i < 6; i++) s = step(def, s, { t: 'none' }).state;
    const r = step(def, s, { t: 'set', part: 'train', to: 'out' });
    expect(r.events.some((e) => e.type === 'ride')).toBe(true);
    const html = render(def, s, r.state, 200);
    expect(pose(html, 'baby')).toBe('rideGiggle');
    expect(html).toMatch(/data-sprite="baokaka\.giggle"/);
  });

  test('in a box perch Mocha is drawn at the perch as his head and paws over the rim (#141)', () => {
    const boxed = { ...def, perches: def.perches.map((p) => (p.id === 'pillar' ? { ...p, hidesMocha: true } : p)) };
    const s1 = step(boxed, s0, { t: 'mocha', perch: 'pillar' }).state;
    const html = render(boxed, s1, s1);
    expect(pose(html, 'mocha')).toBe('inBox');
    expect(html).toMatch(/data-sprite="mocha\.inbox"/);
  });

  test('the eye-contact tick faces the camera from the landing on; the next tick pushes', () => {
    const lab = pageById('c0p3')!;
    const a = initialState(lab);
    const b = step(lab, a, { t: 'mocha', perch: 'table' }).state;
    const c = step(lab, b, { t: 'none' }).state;
    expect(b.mocha.stare).toBe('bead');
    expect(pose(render(lab, a, b, 100), 'mocha')).toBe('hop');
    expect(pose(render(lab, a, b, 450), 'mocha')).toBe('eyeContact');
    expect(render(lab, b, b)).toMatch(/data-sprite="mocha\.push" data-frame="0"/);
    expect(render(lab, b, c, 200)).toMatch(/data-sprite="mocha\.push" data-frame="1"/);
  });

  test('crying loops cry; a lit light nearby glows behind him', () => {
    const lab = pageById('c0p4')!;
    let s = step(lab, initialState(lab), { t: 'mocha', perch: 'basket' }).state;
    for (let i = 0; i < 2; i++) s = step(lab, s, { t: 'none' }).state;
    expect(s.baby.mode).toBe('crying');
    expect(pose(render(lab, s, s), 'baby')).toBe('cry');
    expect(render(lab, s, s)).not.toContain('data-lamp-glow');
    const lit: PageDef = { ...lab, attractors: [...lab.attractors, { id: 'lamp', kind: 'light', node: 'rug1' }] };
    const near = initialState(lit);
    expect(render(lit, near, near)).toMatch(/data-lamp-glow="" [^>]*fill="url\(#/);
  });
});

describe('decoys and still sliders (#116)', () => {
  const settle = (def: PageDef, ticks: number) => {
    let s = initialState(def);
    for (let i = 0; i < ticks; i++) s = step(def, s, { t: 'none' }).state;
    return s;
  };

  test('a decoy is drawn as itself, not as a bead, and his bubble shows it', async () => {
    const { bubbleShow } = await import('./talk/Talk');
    const { thoughtContent, decoyArt } = await import('./art/placeholders');
    for (const [id, decoy, art] of [['c3p3', 'moon', 'c3/moon'], ['c3p4', 'bell', 'c3/bell'], ['c3p6', 'glasses', 'c3/glasses']] as const) {
      const def = pageById(id)!;
      const s = settle(def, 4);
      expect(s.baby.target, id).toBe(decoy);
      const show = bubbleShow(def, s);
      expect(show, id).toMatchObject({ kind: 'want', decoy: art });
      expect(thoughtContent({ id: (x: string) => x, filters: false } as never, show!)).toContain(`data-bubble-decoy="${art}"`);
      const html = render(def, s, s);
      const item = html.slice(html.indexOf(`data-attractor="${decoy}"`), html.indexOf('</g>', html.indexOf(`data-attractor="${decoy}"`)));
      expect(item, id).not.toContain('<circle r="9"');  // the bead
      expect(decoyArt({ id: (x: string) => x, filters: false } as never, art)).not.toBe(decoyArt({ id: (x: string) => x, filters: false } as never));
    }
  });

  test('a slider nobody drives is printed art, never the marigold knob', () => {
    const def = pageById('c3p5')!;
    const html = render(def, initialState(def), initialState(def));
    for (const id of ['shelfB', 'shelfC']) {
      const at = html.indexOf(`data-part="${id}"`);
      expect(html.slice(at, html.indexOf('data-part=', at + 10)), id).not.toContain('data-grip');
    }
    for (const id of ['shelfA', 'shelfD']) {
      const at = html.indexOf(`data-part="${id}"`);
      expect(html.slice(at, html.indexOf('data-part=', at + 10)), id).toContain('data-grip');
    }
  });
});

describe('carried (抱抱, #120): he rides in the carrier\'s arms', () => {
  const learnt = replay(toyHug, [{ wait: 1 }]).state;
  const lifted = step(toyHug, learnt, { t: 'say', word: 'hug' }).state;
  const walked = step(toyHug, lifted, { t: 'none' }).state;
  const pose = { x: 0, y: 0, moving: false };

  test('carried on both sides of the tick, he follows her feet CARRY_LIFT up, tweened as her art is', () => {
    const end = carriedPose(toyHug, lifted, walked, pose, 10_000, false, 1);
    expect(end).toEqual({ x: 190 + CARRY_AHEAD, y: 430 - CARRY_LIFT, moving: true });
    const start = carriedPose(toyHug, lifted, walked, pose, 0, false, 0);
    expect(start).toMatchObject({ x: 110 + CARRY_AHEAD, y: 430 - CARRY_LIFT });
  });

  test('lifted over the pick-up tick and lowered over the set-down tick; untouched otherwise', () => {
    const at = { x: 110, y: 430, moving: false };
    expect(carriedPose(toyHug, learnt, lifted, at, 0, false, 0.5)).toMatchObject({ x: 110 + CARRY_AHEAD / 2, y: 430 - CARRY_LIFT / 2 });
    const down = step(toyHug, step(toyHug, walked, { t: 'none' }).state, { t: 'none' });
    expect(down.state.baby.mode).toBe('idle');
    expect(carriedPose(toyHug, step(toyHug, walked, { t: 'none' }).state, down.state, at, 0, false, 1)).toMatchObject({ x: 110, y: 430 });
    expect(carriedPose(toyHug, learnt, learnt, at, 0, false, 1)).toBe(at);
  });

  test('the carried page renders (the carried frame, in front of the carrier)', () => {
    const html = renderToStaticMarkup(createElement(PageView, { def: toyHug, prev: lifted, state: walked, ms: 200, tickMs: 500 }));
    expect(html).toContain('data-preset="carrier"');
  });
});
