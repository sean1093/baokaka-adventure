import { describe, expect, test } from 'vitest';
import { attractorNode, selectTarget } from './baby';
import { M2_TOYS, toyMoon, toySpotlight, toySquirrel } from './fixtures/m2';
import { lintPage } from './lint';
import { replay } from './replay';
import { reachableDecoys, solve, toSolutionSteps } from './solver';
import { initialState } from './state';
import { step } from './step';
import type { Input, PageDef, SimState } from './types';

/**
 * The M2 engine's toy pages (#112): each new behaviour — the spotlight (`nodeBy`), the squirrel
 * holding the bead (`heldBy`, 掰掰's `drop`), the moon decoy and 不要！ — on a complete page that is
 * solver-green by the same bar as a real page (`pages.test.ts`), plus the walkable-decoy and
 * visible-tie checks the solver gained for M2.
 */

const NONE: Input = { t: 'none' };
function run(def: PageDef, inputs: readonly Input[], from: SimState = initialState(def)): SimState {
  let s = from;
  for (const input of inputs) s = step(def, s, input).state;
  return s;
}
const waits = (n: number): Input[] => Array.from({ length: n }, () => NONE);
/** Waits from `from` until `pred` holds (at most 20 ticks). */
function until(def: PageDef, from: SimState, pred: (s: SimState) => boolean): SimState {
  let s = from;
  for (let i = 0; i < 20 && !pred(s); i++) s = step(def, s, NONE).state;
  expect(pred(s)).toBe(true);
  return s;
}

describe.each(M2_TOYS.map((def) => [def.id, def] as const))('toy page %s', (_id, def) => {
  const r = solve(def);

  test('lints clean, no warnings', () => {
    const lint = lintPage(def);
    expect(lint.errors.map((e) => e.message)).toEqual([]);
    expect(lint.warnings.map((e) => e.message)).toEqual([]);
  });

  test('the authored solution reaches done', () => {
    expect(replay(def, def.solution).state.done).toBe(true);
  });

  test('solver-green: complete, solvable, no dead ends, no soft traps, not trivial, 淘氣 and 土地公 reachable', () => {
    expect(r).toMatchObject({ complete: true, solvable: true, deadEndCount: 0, trivial: false, mischiefReachable: true, tudigongReachable: true });
    expect(r.softTraps().map((t) => toSolutionSteps([...t.path, t.move]))).toEqual([]);
  });

  test('no walkable decoy and no visible tie in any reachable state', () => {
    expect(r.decoysReachable).toEqual([]);
    expect(r.visibleTies).toEqual([]);
  });

  test('par is the designed one and the solution is the shortest', () => {
    expect(r.par).toBe(def.solution.filter((s) => !('wait' in s)).length);
  });
});

describe('toy-spotlight: light is a leash (nodeBy)', () => {
  test('the glow is where the spotlight points; he follows it onto the plate, and the curtain rises', () => {
    const s0 = initialState(toySpotlight);
    const glow = toySpotlight.attractors[0];
    expect(attractorNode(toySpotlight, s0, glow)).toBe('S1');
    expect(selectTarget(toySpotlight, s0)?.id).toBe('glow');
    const aimed = step(toySpotlight, s0, { t: 'set', part: 'spot', to: 'trap' }).state;
    expect(attractorNode(toySpotlight, aimed, glow)).toBe('T');
    const onPlate = until(toySpotlight, aimed, (s) => s.baby.node === 'T');
    expect(onPlate.baby).toMatchObject({ node: 'T', mode: 'watching' });
    expect(onPlate.parts).toMatchObject({ plate: 'down', curtain: 'open' });
    // The bead outranks the light: he leaves the plate (the curtain stays up) and grabs it
    expect(run(toySpotlight, waits(4), onPlate).done).toBe(true);
  });

  test('aimed at the sleeper in the wings, the light is out of reach: he reaches for it', () => {
    const s = run(toySpotlight, [{ t: 'set', part: 'spot', to: 'nap' }, ...waits(6)]);
    expect(s.baby).toMatchObject({ mode: 'reaching', target: 'glow' });
  });
});

describe('toy-squirrel: herd, then wave (heldBy, drop)', () => {
  const bead = toySquirrel.attractors[0];

  test('the held bead is where the squirrel is; up on the branch 掰掰 does nothing', () => {
    const s = run(toySquirrel, waits(4));
    expect(attractorNode(toySquirrel, s, bead)).toBe('high');
    expect(s.baby).toMatchObject({ mode: 'reaching', target: 'bead', node: 'G3' });
    const said = run(toySquirrel, [{ t: 'say', word: 'bye' }], s);
    expect(said.creatures.squirrel).toBe('high');
    expect(said.dropped).toBeUndefined();
  });

  test('Mocha on the fork scares it down, where it sits on the bead; 掰掰 makes it drop the bead and run', () => {
    const herded = run(toySquirrel, [{ t: 'mocha', perch: 'fork' }, ...waits(4)]);
    expect(herded.creatures.squirrel).toBe('low');
    expect(attractorNode(toySquirrel, herded, bead)).toBe('low');
    expect(herded.baby).toMatchObject({ mode: 'reaching', node: 'G3' });
    const waved = step(toySquirrel, herded, { t: 'say', word: 'bye' }).state;
    expect(waved.creatures.squirrel).toBe('away');
    expect(waved.dropped).toEqual({ bead: 'low' });
    expect(run(toySquirrel, waits(2), waved).done).toBe(true);
  });

  test('without 掰掰 the page cannot be solved: the wave is the key', () => {
    expect(solve({ ...toySquirrel, words: [] }).solvable).toBe(false);
  });
});

describe('toy-moon: the decoy and 不要！', () => {
  test('he fixates on the moon and reaches for it forever: a decoy is never reachable', () => {
    const s = run(toyMoon, waits(8));
    expect(s.baby).toMatchObject({ mode: 'reaching', target: 'moon', node: 'L2' });
    expect(reachableDecoys(toyMoon, s)).toEqual([]);
  });

  test('Mocha on the rock teaches 不要！ (the goose honks); said to the moon, he turns to Mocha and passes the goose', () => {
    const taught = run(toyMoon, [{ t: 'mocha', perch: 'rock' }, ...waits(2)]);
    expect(taught.counters['!learned']).toBe(1);
    const said = step(toyMoon, taught, { t: 'say', word: 'no' }).state;
    expect(said.baby.refused).toEqual(['moon']);
    const passing = until(toyMoon, said, (s) => s.baby.node === 'L3');
    expect(passing.baby.target).toBe('mocha');
    expect(passing.creatures.goose).toBe('chase');
    // The bead under her is out: it outranks Mocha
    expect(step(toyMoon, passing, NONE).state.baby).toMatchObject({ node: 'nest', target: 'bead' });
    expect(run(toyMoon, waits(3), passing).done).toBe(true);
  });

  test('without 不要！ the page cannot be solved', () => {
    expect(solve({ ...toyMoon, learns: undefined }).solvable).toBe(false);
  });

  test('a refused moon with nothing else to want: two cries, then the moon again (D-75), not a dead end', () => {
    const lonely: PageDef = { ...toyMoon, words: ['no'], learns: undefined, mocha: { start: null } };
    const s = run(lonely, [...waits(3), { t: 'say', word: 'no' }, ...waits(6)]);
    expect(s.baby).toMatchObject({ mode: 'reaching', target: 'moon', refused: [] });
  });
});

describe('the solver checks decoys and ties over every reachable state (#112)', () => {
  test('a decoy he can walk to is reported, with the way there', () => {
    // A jetty to the moon's reflection, lowered by a tab: the decoy turns walkable once it is down
    const jetty: PageDef = {
      ...toyMoon,
      parts: [{ id: 'jetty', preset: 'tab', states: ['up', 'down'], hit: { x: 20, y: 490, w: 60, h: 60 }, art: 'toy/jetty' }],
      edges: [...toyMoon.edges, { a: 'L2', b: 'lake', kind: 'crawl', when: { part: 'jetty', in: ['down'] } }],
    };
    expect(reachableDecoys(jetty, initialState(jetty))).toEqual([]);
    const r = solve(jetty);
    expect(r.decoysReachable).toHaveLength(1);
    expect(r.decoysReachable[0]).toMatchObject({ id: 'moon', node: 'lake' });
    expect(toSolutionSteps(r.decoysReachable[0].path)).toEqual([{ set: 'jetty', to: 'down' }]);
    // He still never grabs it (the engine treats decoys as unreachable): he reaches from its edge
    const s = run(jetty, [{ t: 'set', part: 'jetty', to: 'down' }, ...waits(6)]);
    expect(s.consumed).toEqual([]);
  });

  test('a tie that only shows mid-page (a second spotlight aimed level with the first) is reported', () => {
    // A footlight whose glow sits two edges from S2, like the spotlight's once both point there
    const tied: PageDef = {
      ...toySpotlight,
      parts: [...toySpotlight.parts, { id: 'foot', preset: 'wheel', states: ['off', 'left'], center: [40, 520], radius: 30, hit: { cx: 40, cy: 520, r: 30 }, art: 'toy/foot' }],
      attractors: [...toySpotlight.attractors, { id: 'glow2', kind: 'light', node: 'wings', nodeBy: { part: 'foot', map: { left: 'S1' } } }],
    };
    expect(lintPage(tied).warnings.map((w) => w.code)).not.toContain('L14-visible-tie');
    const r = solve(tied);
    expect(r.visibleTies.length).toBeGreaterThan(0);
    expect([...r.visibleTies[0].ids].sort()).toEqual(['glow', 'glow2']);
  });
});
