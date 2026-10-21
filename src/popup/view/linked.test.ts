import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { initialState, replay, step } from '../core';
import { toyParty, toySteps } from '../core/fixtures/linked';
import { linkNodes, nodePos } from '../core/graph';
import { MIN_HIT_UNITS } from './affordance/lint';
import { hintLine, hintTarget } from './affordance/ladder';
import { babyAnim, mochaState, MOCHA_STATE_ANIM, WALK_SWAY_DEG, walkSway } from './actors';
import { FLOOR_LIFT, FLOOR_R, GestureTracker, floorTargets, targetsOf, type GestureWorld } from './gestures';
import { LINK_SIDE, PageView } from './PageView';
import { tickSounds } from './sound';
import type { PageDef, SimState, SolutionStep } from '../core/types';

/**
 * Linked mode on the page (一起, 第一步; #128): the floor's touch targets and marks, Mocha walking
 * ahead of him, the wobbly walk, the plop and his first footprints, 咻咻, and the hints and sounds.
 */

beforeAll(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {});
});
afterAll(() => {
  vi.restoreAllMocks();
});

/** The state after `steps`, and the one before its last tick. */
function frame(def: PageDef, steps: readonly SolutionStep[]): { prev: SimState; state: SimState } {
  let prev = initialState(def);
  let state = prev;
  for (const t of replay(def, steps).ticks) {
    prev = state;
    state = step(def, state, t.input).state;
  }
  return { prev, state };
}

const render = (def: PageDef, prev: SimState, state: SimState, ms: number, extra: object = {}) =>
  renderToStaticMarkup(createElement(PageView, { def, prev, state, ms, tickMs: 500, reduced: false, ...extra }));

// toy-steps: at the rail's end, linked, Mocha walking across, he walking after
const LINKED: SolutionStep[] = [{ wait: 3 }, { say: 'together' }];
const linked = replay(toySteps, LINKED).state;

describe('the floor: what a finger can touch in linked mode', () => {
  test('every link node but Mocha’s own is a target; perches and Mocha are not', () => {
    const t = targetsOf(toySteps, linked);
    expect(t.filter((x) => x.kind === 'floor').map((x) => x.id)).toEqual(linkNodes(toySteps).filter((id) => id !== 'R2'));
    expect(t.some((x) => x.kind === 'perch' || x.kind === 'mocha')).toBe(false);
    expect(targetsOf(toySteps, replay(toySteps, [{ wait: 3 }]).state).some((x) => x.kind === 'floor')).toBe(false);
  });

  test('each floor circle is FLOOR_R, shrunk to half the gap to a neighbour, and ≥ 48 CSS px at 390 × 844 (requirement 2)', () => {
    for (const def of [toyParty, toySteps]) {
      const state = replay(def, def.solution.slice(0, def.solution.findIndex((s) => 'say' in s && s.say === 'together') + 1)).state;
      for (const tg of floorTargets(def, state)) {
        if (!('r' in tg.hit)) throw new Error('a circle');
        expect(tg.hit.r).toBeLessThanOrEqual(FLOOR_R);
        expect(tg.hit.r * 2, tg.id).toBeGreaterThanOrEqual(MIN_HIT_UNITS);
        const p = nodePos(def, state, tg.id)!;
        expect([tg.hit.cx, tg.hit.cy]).toEqual([p[0], p[1] - FLOOR_LIFT]);
      }
    }
  });

  test('a tap on a floor mark walks Mocha there', () => {
    const w: GestureWorld = { targets: targetsOf(toySteps, linked), scale: 1, states: () => [], stateIndex: () => 0, locked: () => false };
    const g = new GestureTracker();
    const g0 = nodePos(toySteps, linked, 'G')!;
    g.down(1, [g0[0], g0[1] - 6], 0, w);
    const up = g.up(1, [g0[0], g0[1] - 6], 60);
    expect(up.flatMap((e) => (e.type === 'input' ? [e.input] : []))).toEqual([{ t: 'floor', node: 'G' }]);
  });

  test('hints point at the floor mark; there is no line for it', () => {
    expect(hintTarget(toySteps, { t: 'floor', node: 'G' })).toEqual({ key: 'floor:G' });
    expect(hintLine(toySteps, { t: 'floor', node: 'G' })).toBeNull();
  });
});

describe('the page drawn linked', () => {
  test('floor marks on the floor (not the perch paws); Mocha drawn after him, LINK_SIDE ahead', () => {
    const { prev, state } = frame(toySteps, [...LINKED, { wait: 1 }]);
    const html = render(toySteps, prev, state, 500);
    expect(html.match(/data-affordance="floor"/g)).toHaveLength(floorTargets(toySteps, state).length);
    expect(html).not.toContain('data-affordance="perch"');
    expect(html.indexOf('data-floor-marks')).toBeLessThan(html.indexOf('data-layer="actors"'));
    expect(html.indexOf('data-actor="baby"')).toBeLessThan(html.indexOf('data-actor="mocha"'));
    const node = nodePos(toySteps, state, 'R2')!;
    // Beside him on one node, he purrs
    expect(html).toContain(`data-actor="mocha" data-pose="purr" data-anim="" transform="translate(${node[0] + LINK_SIDE} ${node[1]})`);
    // Together on one node: the pool of light under them; 咻咻 is down off its cloud, a white cloud
    expect(html).toContain('data-together=""');
    expect(html).toContain('data-creature="shushu"');
  });

  test('Mocha walks the floor (a stride, no hop); he walks the wobbly walk, sways, and leaves footprints', () => {
    const across = [...LINKED, { floor: 'G' }, { wait: 2 }];
    const walking = frame(toySteps, [...across, { wait: 1 }]);
    const html = render(toySteps, walking.prev, walking.state, 150);
    expect(html).toContain('data-actor="baby" data-mode="moving" data-pose="walk"');
    expect(html).toContain('data-footprint=""');
    const mid = frame(toySteps, [...LINKED, { floor: 'G' }]);
    expect(render(toySteps, mid.prev, mid.state, 150)).toContain('data-actor="mocha" data-pose="walk"');
    // The trail of earlier steps stays
    const later = frame(toySteps, [...across, { wait: 2 }]);
    const trail = render(toySteps, later.prev, later.state, 0, { trail: [['R2', 'S1']] });
    expect(trail.match(/data-footprint=""/g)!.length).toBeGreaterThanOrEqual(2);
  });

  test('the last step lands in the plop, and Mocha purrs beside him', () => {
    const { prev, state } = frame(toySteps, [...LINKED, { floor: 'G' }, { wait: 5 }]);
    expect(state.baby).toMatchObject({ node: 'G', mode: 'linked' });
    const landed = render(toySteps, prev, state, 500);
    expect(landed).toContain('data-pose="plop"');
    expect(landed).toContain('class="bk-plop"');
    expect(landed).toContain('data-actor="mocha" data-pose="purr"');
    expect(render(toySteps, prev, state, 100)).toContain('data-pose="walk"');
  });

  test('a rain puddle on 10-5’s wet floor node', () => {
    const html = render(toyParty, replay(toyParty, []).state, replay(toyParty, []).state, 0);
    expect(html.match(/data-puddle=""/g)).toHaveLength(1);
  });
});

describe('animations and sounds', () => {
  test('linked he sits with Mocha; a walk step’s end is the plop; Mocha’s linked step is a walk', () => {
    expect(babyAnim({ mode: 'linked', edge: null, growth: 3 }).sprite).toBe('baokaka.sit');
    expect(babyAnim({ mode: 'linked', edge: 'walk', growth: 3, plop: true }).gdd).toBe('plop');
    expect(babyAnim({ mode: 'moving', edge: 'walk', growth: 3, plop: true }).gdd).toBe('walk');
    expect(babyAnim({ mode: 'linked', edge: 'crawl', growth: 3 }).gdd).toBe('crawl');
    expect(mochaState({ travelling: true, linked: true, edge: 'walk' })).toBe('walk');
    expect(mochaState({ travelling: true, linked: false, edge: null })).toBe('hop');
    expect(MOCHA_STATE_ANIM.walk.sprite).toBe('mocha.walk');
  });

  test('walkSway: two sways a stride, upright at both ends, none under reduced motion', () => {
    expect(walkSway(0, 1)).toBe(0);
    expect(walkSway(1, 1)).toBe(0);
    expect(walkSway(0.25, 1)).toBeCloseTo(WALK_SWAY_DEG * (1 - 0.125));
    expect(walkSway(0.75, 1)).toBeLessThan(0);
    expect(walkSway(0.25, 1, true)).toBe(0);
  });

  test('Mocha pads along the floor, softer than his hops', () => {
    const { prev, state } = frame(toySteps, [...LINKED, { floor: 'G' }]);
    expect(tickSounds(toySteps, prev, state, [])).toContainEqual({ cue: 'thump', gain: 0.45 });
  });
});
