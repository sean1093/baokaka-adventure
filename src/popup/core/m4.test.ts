import { describe, expect, test } from 'vitest';
import { REACH_HIGH_ENABLED, selectTarget } from './baby';
import type { SimEvent } from './events';
import { M4_TOYS, toy101, toyFerry, toyPinwheel, toySteam } from './fixtures/m4';
import { e, n, page, part } from './fixtures/toy';
import { lintPage } from './lint';
import { replay } from './replay';
import { reachableDecoys, solve, toSolutionSteps } from './solver';
import { initialState } from './state';
import { CascadeOverflowError, MAX_CASCADE, step, stepGrowth } from './step';
import type { Input, PageDef, SimState } from './types';

/**
 * The M4 engine I (#127): 咻—— and `blowable` parts in his facing cone, the 扶著站 growth
 * (`cruise` edges and `reachHigh`), and coupled sections — each on a toy page that is solver-green
 * by the same bar as a real page (`pages.test.ts`), plus the rules in detail on tiny pages.
 */

const NONE: Input = { t: 'none' };
const WHOOSH: Input = { t: 'say', word: 'whoosh' };
function run(def: PageDef, inputs: readonly Input[], from: SimState = initialState(def)): { state: SimState; events: SimEvent[] } {
  let s = from;
  const events: SimEvent[] = [];
  for (const input of inputs) {
    const r = step(def, s, input);
    events.push(...r.events);
    s = r.state;
  }
  return { state: s, events };
}
const waits = (k: number): Input[] => Array.from({ length: k }, () => NONE);

describe.each(M4_TOYS.map((def) => [def.id, def] as const))('toy page %s', (_id, def) => {
  const r = solve(def);

  test('lints clean, no warnings', () => {
    const lint = lintPage(def);
    expect(lint.errors.map((x) => x.message)).toEqual([]);
    expect(lint.warnings.map((x) => x.message)).toEqual([]);
  });

  test('the authored solution reaches done', () => {
    expect(replay(def, def.solution).state.done).toBe(true);
  });

  test('solver-green: complete, solvable, no dead ends, no soft traps, not trivial, 淘氣 and 土地公 reachable', () => {
    expect(r).toMatchObject({ complete: true, solvable: true, deadEndCount: 0, trivial: false, mischiefReachable: true, tudigongReachable: true });
    expect(r.softTraps().map((t) => toSolutionSteps([...t.path, t.move]))).toEqual([]);
    expect(r.decoysReachable).toEqual([]);
    expect(r.visibleTies).toEqual([]);
  });

  test('par is the designed one, and the state count is far under the cap', () => {
    expect(r.par).toBe(def.solution.filter((s) => !('wait' in s)).length);
    expect(r.statesExplored).toBeLessThan(2_000);
  });
});

// ——— 咻—— and blowables ———

describe('咻—— (GDD § 2.4): blowables in the 90° cone of his facing advance one state', () => {
  test('toy-steam: learnt at the steam’s edge; it clears the steam and blows the 阿嬤’s hat off, and he crawls through', () => {
    const learnt = run(toySteam, waits(2));
    expect(learnt.events).toContainEqual(expect.objectContaining({ type: 'learn', word: 'whoosh' }));
    expect(learnt.state.baby).toMatchObject({ node: 'S3', facing: 'r' });
    expect(step(toySteam, learnt.state, NONE).state.baby.mode).toBe('reaching');
    const blown = step(toySteam, learnt.state, WHOOSH);
    expect(blown.state.parts).toEqual({ steam: 'clear', hat: 'off' });
    expect(blown.events.filter((x) => x.type === 'whoosh')).toEqual([expect.objectContaining({ facing: 'r', within: 140 })]);
    expect(run(toySteam, waits(3), blown.state).state.done).toBe(true);
  });

  test('toy-steam: a second 咻—— from past the steam blows only the hat back on (the 淘氣)', () => {
    const blown = run(toySteam, [...waits(2), WHOOSH, NONE]).state;
    expect(blown.baby.node).toBe('S4');
    const back = step(toySteam, blown, WHOOSH).state;
    // The steam is behind him now: only the hat, still ahead, is in the cone
    expect(back.parts).toEqual({ steam: 'clear', hat: 'on' });
  });

  test('without 咻—— the page cannot be solved', () => {
    expect(solve({ ...toySteam, learns: undefined }).solvable).toBe(false);
  });

  test('toy-pinwheel: facing matters — said facing away, the pinwheel stays put', () => {
    const away = step(toyPinwheel, initialState(toyPinwheel), WHOOSH);
    expect(away.state.baby.facing).toBe('r');
    expect(away.state.parts.pinwheel).toBe('0');
    expect(away.state.parts.books).toBe('up');
  });

  test('toy-pinwheel: Mocha draws him round to face it; then 咻—— spins it and the book lift comes down', () => {
    const round = run(toyPinwheel, [{ t: 'mocha', perch: 'post' }, ...waits(3)]).state;
    expect(round.baby).toMatchObject({ node: 'P1', mode: 'cuddling', facing: 'l' });
    const spun = step(toyPinwheel, round, WHOOSH).state;
    expect(spun.parts).toEqual({ pinwheel: '1', books: 'down' });
    // The bead shows in the basket: he turns and crawls to it
    expect(selectTarget(toyPinwheel, spun)?.id).toBe('bead');
  });

  test('toy-pinwheel: without Mocha’s perch by the pinwheel the page cannot be solved (he never faces it)', () => {
    const noPost: PageDef = { ...toyPinwheel, perches: toyPinwheel.perches.filter((p) => p.id !== 'post'), edges: toyPinwheel.edges.filter((x) => x.kind !== 'jump') };
    expect(solve(noPost).solvable).toBe(false);
  });

  test('a blowable with a whoosh reaction of its own ignores the built-in step; a blowable wraps', () => {
    const def = page({
      nodes: [n('A', 0), n('B', 100)],
      edges: [e('A', 'B')],
      parts: [
        part('wrap', 'blowable', 60, 0, { states: ['a', 'b'] }),
        part('own', 'blowable', 60, 10, { states: ['a', 'b', 'c'], react: [{ on: 'whoosh', to: 'c' }] }),
      ],
      words: ['whoosh'],
    });
    const once = step(def, initialState(def), WHOOSH).state;
    expect(once.parts).toEqual({ wrap: 'b', own: 'c' });
    expect(step(def, once, WHOOSH).state.parts).toEqual({ wrap: 'a', own: 'c' });
  });
});

// ——— 扶著站: cruise and reachHigh ———

describe('扶著站 (GDD § 2.5): cruise edges and reachHigh from growth 2', () => {
  test('reachHigh is on (M4); toy-ferry stops at the rope before he stands', () => {
    expect(REACH_HIGH_ENABLED).toBe(true);
    const stuck = run(toyFerry, waits(3)).state;
    expect(stuck.baby).toMatchObject({ node: 'D2', mode: 'reaching' });
    expect(stepGrowth(toyFerry, stuck)).toBe(1);
  });

  test('Mocha on the railing: he pulls up and learns 扶著站, cruises past the rope, and grabs the high bead from the deck', () => {
    const up = run(toyFerry, [{ t: 'mocha', perch: 'rail' }]);
    expect(up.events).toContainEqual(expect.objectContaining({ type: 'learn', growth: 2 }));
    expect(stepGrowth(toyFerry, up.state)).toBe(2);
    const cruised = step(toyFerry, up.state, NONE).state;
    expect(cruised.baby).toMatchObject({ node: 'D3', mode: 'moving' });
    const done = run(toyFerry, waits(2), cruised).state;
    // He never stands on the bench (only Mocha's hop joins it): he reached it from D4
    expect(done.baby.node).toBe('D4');
    expect(done.done).toBe(true);
  });

  test('without 扶著站 the page cannot be solved; with 扶著站 but no reachHigh he reaches at D4', () => {
    expect(solve({ ...toyFerry, learns: undefined }).solvable).toBe(false);
    const grown: PageDef = { ...toyFerry, baby: { ...toyFerry.baby, growth: 2 }, learns: undefined };
    const s = run(grown, waits(4)).state;
    expect(s.done).toBe(true);
    expect(selectTarget(grown, { ...s, done: false, consumed: [] }, { reachHigh: false })).toMatchObject({ approach: null });
  });

  test('a height-1 decoy next to a node he can walk to counts as reachable from growth 2 (the solver check)', () => {
    const def = page({
      nodes: [n('A', 0), n('B', 100), n('H', 200, -60, 1)],
      edges: [e('A', 'B'), e('B', 'H', { kind: 'jump' })],
      attractors: [{ id: 'moon', kind: 'shiny', node: 'H', height: 1, decoy: true }],
      baby: { start: 'A', facing: 'r', growth: 2 },
    });
    expect(reachableDecoys(def, initialState(def))).toEqual([['moon', 'H']]);
    expect(reachableDecoys({ ...def, baby: { ...def.baby, growth: 1 } }, initialState(def))).toEqual([]);
    const low: PageDef = { ...def, attractors: [{ ...def.attractors[0], height: 0 }] };
    expect(reachableDecoys(low, initialState(low))).toEqual([]);
  });
});

// ——— Coupled sections ———

/** Three wheels in a row, 4 turns each; `more` overrides the defaults. */
function gears(coupled: Record<string, string[]>, more: Partial<PageDef> = {}): PageDef {
  const states = ['0', '1', '2', '3'];
  return page({
    nodes: [n('A', 0), n('p', 200, -100, 2), n('q', 300, -100, 2)],
    edges: [e('p', 'q', { kind: 'jump' })],
    parts: ['a', 'b', 'c'].map((id, i) => part(id, 'wheel', 100 * i, 100, { states, coupled: coupled[id], lockedByCat: true })),
    perches: [{ id: 'p', node: 'p' }, { id: 'q', node: 'q', onPart: 'b' }],
    mocha: { start: 'p' },
    ...more,
  });
}

describe('coupled sections (GDD § 2.1, 10-3): turning one turns its neighbour', () => {
  const set = (part: string, to: string): Input => ({ t: 'set', part, to });

  test('a turn turns the coupled parts the same number of steps, the same way, wrapping', () => {
    const def = gears({ b: ['a', 'c'] });
    const r = step(def, initialState(def), set('b', '3'));
    expect(r.state.parts).toEqual({ a: '3', b: '3', c: '3' });
    expect(r.events.filter((x) => x.type === 'partEnter').map((x) => [x.id, x.state])).toEqual([['b', '3'], ['a', '3'], ['c', '3']]);
    const back = step(def, { ...r.state, parts: { a: '1', b: '3', c: '2' } }, { t: 'tap', id: 'b' }).state;
    expect(back.parts).toEqual({ a: '2', b: '0', c: '3' });
  });

  test('one hop: a coupled turn drives nothing further, so a mutual coupling never loops', () => {
    const chain = gears({ a: ['b'], b: ['a', 'c'], c: ['b'] });
    expect(step(chain, initialState(chain), set('a', '1')).state.parts).toEqual({ a: '1', b: '1', c: '0' });
    expect(step(chain, initialState(chain), set('c', '2')).state.parts).toEqual({ a: '0', b: '2', c: '2' });
  });

  test('a locked neighbour (Mocha on it) holds still and the turn slips past it', () => {
    const def = gears({ a: ['b'], c: ['b'] });
    const sat = step(def, initialState(def), { t: 'mocha', perch: 'q' }).state;
    expect(sat.mocha.perch).toBe('q');
    const r = step(def, sat, set('a', '2'));
    expect(r.state.parts).toEqual({ a: '2', b: '0', c: '0' });
    // The locked part itself refuses the player's turn as before
    expect(step(def, sat, set('b', '1')).events).toContainEqual({ type: 'locked', id: 'b' });
  });

  test('a neighbour whose stateWhen forbids the new state holds still too', () => {
    const def = gears({ a: ['b'] });
    const guarded: PageDef = { ...def, parts: def.parts.map((p) => (p.id === 'b' ? { ...p, stateWhen: { '1': { flag: 'never' } } } : p)) };
    expect(step(guarded, initialState(guarded), set('a', '1')).state.parts).toEqual({ a: '1', b: '0', c: '0' });
    expect(step(guarded, initialState(guarded), set('a', '2')).state.parts).toEqual({ a: '2', b: '2', c: '0' });
  });

  test('event-driven turns couple too: a reaction (or 咻——) that turns a part turns its neighbour', () => {
    const def = page({
      nodes: [n('A', 0)],
      edges: [],
      parts: [
        part('mill', 'blowable', 60, 0, { states: ['0', '1', '2', '3'], coupled: ['belt'] }),
        part('belt', 'loop', 300, 0, { states: ['0', '1', '2', '3'] }),
      ],
      words: ['whoosh'],
    });
    expect(step(def, initialState(def), WHOOSH).state.parts).toEqual({ mill: '1', belt: '1' });
  });

  test('requirement 2: coupling plus a reaction that answers it overflows the cascade (> 32 events) and throws', () => {
    // a's turn turns b (coupling); b's partEnter turns a again (a reaction): a → b → a → …
    const def = gears({ a: ['b'] });
    const looping: PageDef = {
      ...def,
      perches: [],
      mocha: { start: null },
      parts: def.parts.map(({ lockedByCat: _free, ...p }) => (p.id === 'a' ? { ...p, react: [{ on: { type: 'partEnter', id: 'b' }, to: 'next' }] } : p)),
    };
    expect(() => step(looping, initialState(looping), set('a', '1'))).toThrow(CascadeOverflowError);
    expect(() => step(looping, initialState(looping), set('a', '1'))).toThrow(/more than 32 events/);
    expect(MAX_CASCADE).toBe(32);
    expect(lintPage(looping).errors.map((x) => x.code)).toContain('L12-cascade-loop');
    // The solver reports it as a page error, not a crash
    expect(solve(looping).error?.kind).toBe('cascadeOverflow');
  });

  test('toy-101: the dials each turn the middle; Mocha holds it so both line up, and he climbs', () => {
    // Without Mocha the bottom dial drags the middle out of line
    expect(step(toy101, initialState(toy101), set('low', '1')).state.parts).toEqual({ low: '1', mid: '2', top: '0' });
    const sat = step(toy101, initialState(toy101), { t: 'mocha', perch: 'rim' }).state;
    const low = step(toy101, sat, set('low', '1')).state;
    expect(low.parts).toEqual({ low: '1', mid: '1', top: '0' });
    expect(low.baby.node).toBe('L');
    const held = run(toy101, [NONE, set('top', '1')], low).state;
    expect(held.parts).toEqual({ low: '1', mid: '1', top: '1' });
    expect(run(toy101, waits(2), held).state.done).toBe(true);
  });

  test('toy-101: without Mocha the middle always turns by low + top, so the ledges never all line up', () => {
    expect(solve({ ...toy101, mocha: { start: null }, perches: [] , edges: toy101.edges.filter((x) => x.kind !== 'jump') }).solvable).toBe(false);
  });
});

// ——— Lint ———

describe('lint (§ 3.6) for coupling', () => {
  const codes = (def: PageDef) => lintPage(def).errors.map((x) => x.code);

  test('coupled parts are turning presets with the same number of states, never itself or twice', () => {
    expect(codes(gears({ b: ['a', 'c'] }))).not.toContain('L03-coupled');
    expect(codes(gears({ b: ['b'] }))).toContain('L03-coupled');
    expect(codes(gears({ b: ['a', 'a'] }))).toContain('L03-coupled');
    expect(codes(gears({ b: ['nope'] }))).toContain('L01-unknown-ref');
    const odd = gears({ b: ['a'] });
    expect(codes({ ...odd, parts: odd.parts.map((p) => (p.id === 'a' ? { ...p, states: ['0', '1'] } : p)) })).toContain('L03-coupled');
    expect(codes({ ...odd, parts: [...odd.parts, part('t', 'tab', 300, 300, { states: ['0', '1', '2', '3'], coupled: ['a'] })] })).toContain('L03-coupled');
    expect(codes({ ...odd, parts: [...odd.parts, part('t', 'lift', 300, 300, { states: ['0', '1', '2', '3'] })], })).not.toContain('L03-coupled');
    expect(codes(gears({ b: ['t'] }, { parts: [...gears({}).parts.map((p) => (p.id === 'b' ? { ...p, coupled: ['t'] } : p)), part('t', 'lift', 300, 300, { states: ['0', '1', '2', '3'] })] }))).toContain('L03-coupled');
  });

  test('a mutual coupling alone is no cascade cycle (one hop); coupled through a reaction it is', () => {
    const mutual = gears({ a: ['b'], b: ['a'] });
    expect(lintPage(mutual).warnings.map((x) => x.code)).not.toContain('L12-cascade-cycle');
    expect(lintPage(mutual).errors.map((x) => x.code)).not.toContain('L12-cascade-loop');
  });
});
