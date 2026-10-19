import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { initialState, replay, step, withPartState } from '../core';
import type { PageDef, SimState } from '../core/types';
import { PAGES, pageById } from '../pages';
import { compilePart } from '../core/presets';
import { NO_GESTURE, targetsOf, type GestureFlags } from './gestures';
import { ANIMATED_LAYERS, ANIMATED_NODE_BUDGET, LAYERS, type LayerId } from './layers';
import { PageView } from './PageView';

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

  test('Baokaka lerps between nodes over the tick', () => {
    const s1 = step(def, s0, { t: 'none' }).state;
    const at = (ms: number) => transformOf(render(def, s0, s1, ms), 'data-actor="baby"');
    expect(at(0)).toContain('translate(40 430)');
    expect(at(500)).toContain('translate(90 430)');
    expect(at(250)).toMatch(/translate\(65 428/);
  });

  test('the train tab slides with the part tween and the carriage carries its riders', () => {
    const half = withPartState(s0, 'train', 'half');
    const html0 = render(def, s0, half, 0);
    const html1 = render(def, s0, half, 400);
    expect(html1).not.toBe(html0);
    expect(transformOf(html1, 'data-carriage="train"')).toBe('translate(124 430)');
    expect(transformOf(html0, 'data-carriage="train"')).toBe('translate(34 430)');
  });

  test('reduced motion swaps at once', () => {
    const s1 = step(def, s0, { t: 'none' }).state;
    expect(transformOf(render(def, s0, s1, 0, true), 'data-actor="baby"')).toContain('translate(90 430)');
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
