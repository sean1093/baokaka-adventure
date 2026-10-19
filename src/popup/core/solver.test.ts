import { describe, expect, test } from 'vitest';
import { roll } from '../../shared/random';
import c0p4 from './fixtures/c0p4';
import c1p2 from './fixtures/c1p2';
import c1p3 from './fixtures/c1p3';
import { deadEnd, jam, loop, threeNode, trivial, unsolvable } from './fixtures/solver';
import { line, page, part } from './fixtures/toy';
import { replay } from './replay';
import {
  candidateInputs,
  DEFAULT_CAP,
  firesMischief,
  MAX_DEAD_ENDS,
  solve,
  solverKey,
  toSolutionSteps,
  tudigongVisible,
  type SolveResult,
} from './solver';
import { canonicalKey, initialState } from './state';
import { step } from './step';
import type { Input, PageDef, SimState } from './types';

/** Every reachable state of `def`, by a plain BFS over `candidateInputs` and `step` (independent of the solver's graph). */
function explore(def: PageDef, from: SimState = initialState(def), keyOf = (s: SimState) => solverKey(def, s)): Map<string, SimState> {
  const seen = new Map<string, SimState>([[keyOf(from), from]]);
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    for (const input of candidateInputs(def, queue[i])) {
      const next = step(def, queue[i], input).state;
      const key = keyOf(next);
      if (!seen.has(key)) {
        seen.set(key, next);
        queue.push(next);
      }
    }
  }
  return seen;
}

const isWait = (input: Input) => input.t === 'none';
const movesOf = (inputs: readonly Input[]) => inputs.filter((i) => !isWait(i)).length;

/** Runs `inputs` from `from`. */
function run(def: PageDef, inputs: readonly Input[], from: SimState = initialState(def)): SimState {
  return inputs.reduce((s, input) => step(def, s, input).state, from);
}

/** Follows `nextAction` from `from` until done; returns the inputs taken (throws after `limit` ticks). */
function follow(def: PageDef, result: SolveResult, from: SimState, limit = 500): Input[] {
  const taken: Input[] = [];
  let s = from;
  while (!s.done) {
    if (taken.length === limit) throw new Error(`nextAction did not reach done in ${limit} ticks`);
    const input = result.nextAction(s);
    if (input === null) throw new Error('nextAction returned null on a solvable state');
    taken.push(input);
    s = step(def, s, input).state;
  }
  return taken;
}

describe('the toy pages', () => {
  test('3-node page: par 1 (tap the latch), no dead ends, mischief and 土地公 reachable', () => {
    const r = solve(threeNode);
    expect(r).toMatchObject({
      solvable: true,
      complete: true,
      stop: null,
      par: 1,
      deadEnds: [],
      deadEndCount: 0,
      trivial: false,
      mischiefReachable: true,
      tudigongReachable: true,
      error: null,
      ms: null,
    });
    expect(movesOf(r.solution!)).toBe(1);
    expect(r.solution!.filter((i) => !isWait(i))).toEqual([{ t: 'tap', id: 'latch' }]);
    expect(run(threeNode, r.solution!).done).toBe(true);
    expect(r.statesExplored).toBe(explore(threeNode).size);
  });

  test('jam page: par 2 (open the latch, then drag the bridge down); a drag before that jams at mid', () => {
    const r = solve(jam);
    expect(r).toMatchObject({ solvable: true, par: 2, deadEndCount: 0, trivial: false, mischiefReachable: true, tudigongReachable: true });
    expect(r.solution!.filter((i) => !isWait(i))).toEqual([
      { t: 'tap', id: 'latch' },
      { t: 'set', part: 'bridge', to: 'down' },
    ]);
    // The jammed drag stops at mid: a real state, but not on a shortest solution.
    const jammed = step(jam, initialState(jam), { t: 'set', part: 'bridge', to: 'down' }).state;
    expect(jammed.parts.bridge).toBe('mid');
    expect(r.nextAction(jammed)).not.toEqual({ t: 'set', part: 'bridge', to: 'down' });
    expect(movesOf(follow(jam, r, jammed))).toBe(2);
  });

  test('dead-end page reports exactly the states where the rock left its shelf before the gate opened', () => {
    const r = solve(deadEnd);
    expect(r).toMatchObject({ solvable: true, complete: true, par: 1, trivial: false, mischiefReachable: true, tudigongReachable: true });
    const all = explore(deadEnd);
    const expected = [...all.values()].filter((s) => s.pushables.rock !== 'onPerch' && s.parts.gate === 'closed').map((s) => solverKey(deadEnd, s));
    expect(expected.length).toBeGreaterThan(0);
    expect(expected.length).toBeLessThanOrEqual(MAX_DEAD_ENDS);
    expect(r.deadEndCount).toBe(expected.length);
    expect(r.deadEnds.map((d) => d.key).sort()).toEqual(expected.sort());
    for (const d of r.deadEnds) {
      // The path replays to the state, which really has no way to the goal.
      expect(solverKey(deadEnd, run(deadEnd, d.path))).toBe(d.key);
      expect(solverKey(deadEnd, d.state)).toBe(d.key);
      expect(solve(deadEnd, d.state).solvable).toBe(false);
      expect(r.nextAction(d.state)).toBeNull();
    }
    // The first one is the moment of no return: Mocha knocks the rock off, fewest moves first.
    expect(toSolutionSteps(r.deadEnds[0].path)).toEqual([{ mocha: 'shelf2' }, { wait: 1 }]);
    expect(r.deadEnds[0].state.pushables.rock).toBe('falling');
    // Mocha staring at the rock is not yet a dead end: he can still be sent away.
    const staring = step(deadEnd, initialState(deadEnd), { t: 'mocha', perch: 'shelf2' }).state;
    expect(staring.mocha.stare).toBe('rock');
    expect(r.nextAction(staring)).toEqual({ t: 'mocha', perch: 'shelf1' });
  });

  test('every other reachable state of the dead-end page can still reach the goal', () => {
    const r = solve(deadEnd);
    const dead = new Set(r.deadEnds.map((d) => d.key));
    for (const [key, s] of explore(deadEnd)) {
      if (dead.has(key)) continue;
      expect(s.done || r.nextAction(s) !== null).toBe(true);
    }
  });

  test('a page solvable by waiting is trivial (par 0)', () => {
    const r = solve(trivial);
    expect(r).toMatchObject({ solvable: true, par: 0, trivial: true, deadEndCount: 0 });
    expect(r.solution!.every(isWait)).toBe(true);
    expect(r.nextAction(initialState(trivial))).toEqual({ t: 'none' });
  });

  test('a page whose goal is never reachable: unsolvable, every state a dead end', () => {
    const r = solve(unsolvable);
    expect(r).toMatchObject({ solvable: false, par: null, solution: null, trivial: false, mischiefReachable: false, tudigongReachable: false });
    expect(r.deadEndCount).toBe(r.statesExplored);
    expect(r.deadEnds[0].path).toEqual([]);
    expect(r.nextAction(initialState(unsolvable))).toBeNull();
  });

  test('a reaction loop is reported as a cascade overflow (GDD § 3.6 rule 12), with the path to it', () => {
    const r = solve(loop);
    expect(r).toMatchObject({ solvable: false, complete: false, stop: 'error', deadEndCount: null, deadEnds: [] });
    expect(r.error!.kind).toBe('cascadeOverflow');
    expect(r.error!.message).toContain("cascade overflow on page 'toyLoop'");
    expect(r.error!.path.at(-1)).toEqual({ t: 'tap', id: 'ping' });
  });

  test('other errors from step are not swallowed', () => {
    // A malformed reaction list throws a TypeError inside the cascade, not a CascadeOverflowError.
    const broken = page({ ...line('AB'), words: [], parts: [part('p', 'flap', 0, 0, { react: {} as never })] });
    expect(() => solve(broken)).toThrow(TypeError);
  });

  test('with 不要！ he can refuse the only bead and cry forever: the solver finds that soft-lock', () => {
    const talky = { ...trivial, words: undefined };
    const r = solve(talky);
    expect(r.solvable).toBe(true);
    expect(r.deadEndCount).toBeGreaterThan(0);
    expect(r.deadEnds[0].path.some((i) => i.t === 'say' && i.word === 'no')).toBe(true);
  });
});

describe('the c1p2 fixture (GDD § 3.4)', () => {
  const r = solve(c1p2);

  test('solvable, par 2, no dead ends, not trivial, mischief and 土地公 reachable', () => {
    expect(r).toMatchObject({
      solvable: true,
      complete: true,
      par: 2,
      deadEnds: [],
      deadEndCount: 0,
      trivial: false,
      mischiefReachable: true,
      tudigongReachable: true,
      error: null,
    });
    expect(run(c1p2, r.solution!).done).toBe(true);
    expect(movesOf(r.solution!)).toBe(2);
  });

  /** Whether `input` is the first step of a shortest solution from `s`: it costs what it saves. */
  const validFirstStep = (s: SimState, input: Input) => {
    const par = solve(c1p2, s, { stopAtGoal: true }).par!;
    const after = step(c1p2, s, input).state;
    const rest = after.done ? 0 : solve(c1p2, after, { stopAtGoal: true }).par!;
    return (isWait(input) ? 0 : 1) + rest === par;
  };

  test('nextAction from every state on the stored solution path is a valid first step of a shortest solution', () => {
    let s = initialState(c1p2);
    for (const input of r.solution!) {
      const next = r.nextAction(s)!;
      expect(next).not.toBeNull();
      expect(validFirstStep(s, next)).toBe(true);
      s = step(c1p2, s, input).state;
    }
    expect(s.done).toBe(true);
    expect(r.nextAction(s)).toBeNull();
  });

  test('… and on the page’s authored solution, replayed tick by tick', () => {
    const { ticks } = replay(c1p2, c1p2.solution);
    let s = initialState(c1p2);
    for (const t of ticks) {
      expect(validFirstStep(s, r.nextAction(s)!)).toBe(true);
      s = step(c1p2, s, t.input).state;
    }
    expect(s.done).toBe(true);
  });

  test('property: from 200 random reachable states, following nextAction reaches done in par moves', () => {
    let seed = 85;
    const rand = (n: number) => {
      const d = roll(seed);
      seed = d.seed;
      return Math.floor(d.value * n);
    };
    const all = [...explore(c1p2).values()];
    expect(all.length).toBe(r.statesExplored);
    for (let k = 0; k < 200; k++) {
      // A random walk of 0–30 random inputs from the start.
      let s = initialState(c1p2);
      for (let len = rand(31), i = 0; i < len && !s.done; i++) {
        const inputs = candidateInputs(c1p2, s);
        s = step(c1p2, s, inputs[rand(inputs.length)]).state;
      }
      const taken = follow(c1p2, r, s);
      expect(movesOf(taken)).toBe(s.done ? 0 : solve(c1p2, s, { stopAtGoal: true }).par);
    }
  });

  test('nextAction prefers the fewest ticks among shortest solutions, so it never waits in a loop', () => {
    // From the start: 3 ticks of waiting would not help, so it acts (or waits only while that is shorter).
    const taken = follow(c1p2, r, initialState(c1p2));
    expect(movesOf(taken)).toBe(2);
    expect(taken.length).toBeLessThanOrEqual(r.solution!.length);
  });
});

describe('the other fixtures', () => {
  test.each([
    ['1-3', c1p3],
    ['0-4', c0p4],
  ])('%s: solvable, no dead ends, not trivial, mischief and 土地公 reachable', (_, def) => {
    const r = solve(def);
    expect(r).toMatchObject({ solvable: true, deadEndCount: 0, trivial: false, mischiefReachable: true, tudigongReachable: true });
    expect(r.par).toBe(2);
    expect(run(def, r.solution!).done).toBe(true);
  });
});

describe('search options', () => {
  test('the default cap is 2,000,000 states', () => {
    expect(DEFAULT_CAP).toBe(2_000_000);
  });

  test('a cap stops the search: incomplete, dead ends unknown', () => {
    const r = solve(c1p2, undefined, { cap: 50 });
    expect(r).toMatchObject({ complete: false, stop: 'cap', deadEnds: [], deadEndCount: null });
    expect(r.statesExplored).toBeLessThan(200);
  });

  test('a time budget stops the search (with an injected clock); ms is read from that clock', () => {
    let t = 0;
    const clock = () => (t += 1);
    const r = solve(c1p2, undefined, { clock, timeMs: 10 });
    expect(r).toMatchObject({ complete: false, stop: 'time', deadEndCount: null });
    expect(r.ms).toBeGreaterThan(10);
    const timed = solve(threeNode, undefined, { clock: () => 7 });
    expect(timed.ms).toBe(0);
    expect(timed.complete).toBe(true);
  });

  test('stopAtGoal: par, a shortest solution and nextAction from the start, without the dead-end pass', () => {
    const r = solve(c1p2, undefined, { stopAtGoal: true });
    expect(r).toMatchObject({ solvable: true, complete: false, stop: 'goal', par: 2, deadEndCount: null });
    expect(r.statesExplored).toBeLessThan(solve(c1p2).statesExplored);
    expect(run(c1p2, r.solution!).done).toBe(true);
    expect(movesOf(follow(c1p2, r, initialState(c1p2)))).toBe(2);
  });

  test('a solve from a later state measures from there', () => {
    const half = run(c1p2, [{ t: 'set', part: 'train', to: 'half' }]);
    const r = solve(c1p2, half);
    expect(r.par).toBe(2);
    const there = run(c1p2, [{ t: 'mocha', perch: 'pillar' }, { t: 'none' }, { t: 'none' }]);
    expect(solve(c1p2, there).par).toBe(1);
    expect(solve(c1p2, run(c1p2, r.solution!, half)).par).toBe(0);
  });

  test('nextAction on a state the search never reached solves afresh from it', () => {
    const partial = solve(c1p2, undefined, { stopAtGoal: true });
    // Three moves in: past par, so the early-stopping search never expanded it.
    const far = run(c1p2, [{ t: 'tap', id: 'board' }, { t: 'set', part: 'train', to: 'half' }, { t: 'mocha', perch: 'pillar' }, { t: 'none' }, { t: 'none' }]);
    expect(partial.nextAction(far)).toEqual({ t: 'set', part: 'train', to: 'full' });
    expect(movesOf(follow(c1p2, partial, far))).toBe(1);
    // A dead state outside the search: the fresh solve finds nothing.
    const fresh = solve(deadEnd, undefined, { cap: 1 });
    const rocked = run(deadEnd, [{ t: 'mocha', perch: 'shelf2' }, { t: 'none' }, { t: 'none' }]);
    expect(fresh.nextAction(rocked)).toBeNull();
    // After a capped search, an expanded state with no known way out is solved afresh, not given up on.
    const tiny = solve(c1p2, undefined, { cap: 80 });
    expect(tiny.solvable).toBe(false);
    const near = run(c1p2, [{ t: 'mocha', perch: 'pillar' }, { t: 'none' }, { t: 'none' }]);
    expect(tiny.nextAction(near)).toEqual({ t: 'set', part: 'train', to: 'full' });
    // A done state needs nothing.
    expect(partial.nextAction({ ...far, done: true })).toBeNull();
  });
});

describe('candidateInputs', () => {
  test('c1p2 at the start: wait, every train stop, a tap on each tappable, Mocha to the pillar, pet, every word', () => {
    expect(candidateInputs(c1p2, initialState(c1p2))).toEqual([
      { t: 'none' },
      { t: 'set', part: 'train', to: 'half' },
      { t: 'set', part: 'train', to: 'full' },
      { t: 'tap', id: 'train' },
      { t: 'tap', id: 'board' },
      { t: 'mocha', perch: 'pillar' },
      { t: 'pet' },
      ...(['beep', 'bye', 'no', 'wow', 'hug', 'plane', 'whoosh', 'together'] as const).map((word) => ({ t: 'say', word })),
    ]);
  });

  test('locked parts and pushables offer nothing; no mocha or pet when he isn’t on the page; words follow the page', () => {
    const def = page({
      ...line('AB'),
      words: ['beep'],
      parts: [
        part('locked', 'flap', 0, 0, { lockedWhen: { babyAt: 'A' } }),
        part('crank', 'loop', 0, 0, { states: ['0', '1'], input: 'tap-cycle' }),
        part('box', 'pushable', 0, 0, { fall: { path: [], fallTo: 'B' } }),
        part('sign', 'gate', 0, 0),
      ],
    });
    expect(candidateInputs(def, initialState(def))).toEqual([{ t: 'none' }, { t: 'tap', id: 'crank' }, { t: 'say', word: 'beep' }]);
  });

  test('the learned word joins once learned', () => {
    const s = initialState(c1p3);
    expect(candidateInputs(c1p3, s).filter((i) => i.t === 'say')).toEqual([]);
    const learnedState = { ...s, counters: { ...s.counters, '!learned': 1 } };
    expect(candidateInputs(c1p3, learnedState).filter((i) => i.t === 'say')).toEqual([{ t: 'say', word: 'beep' }]);
  });

  test('travelling Mocha can be redirected but not petted; a staring Mocha can’t be petted', () => {
    const s = initialState(c1p2);
    const travelling = { ...s, mocha: { perch: null, path: ['bench', 'pillarTop'], to: 'pillar' } };
    const t = candidateInputs(c1p2, travelling);
    expect(t).toContainEqual({ t: 'mocha', perch: 'bench' });
    expect(t).not.toContainEqual({ t: 'mocha', perch: 'pillar' });
    expect(t).not.toContainEqual({ t: 'pet' });
    const staring = run(deadEnd, [{ t: 'mocha', perch: 'shelf2' }]);
    expect(candidateInputs(deadEnd, staring)).not.toContainEqual({ t: 'pet' });
  });

  test('carried or linked: no words; linked: a floor input per floor node; done: nothing', () => {
    const s = initialState(c1p2);
    const carried = { ...s, baby: { ...s.baby, mode: 'carried' as const } };
    expect(candidateInputs(c1p2, carried).some((i) => i.t === 'say')).toBe(false);
    const linked = { ...s, baby: { ...s.baby, mode: 'linked' as const, linked: true } };
    const floors = candidateInputs(c1p2, linked).filter((i) => i.t === 'floor');
    expect(floors).toEqual(['L1', 'L2', 'L3', 'T1', 'T2', 'R1', 'R2', 'gapSlot'].map((node) => ({ t: 'floor', node })));
    expect(candidateInputs(c1p2, { ...s, done: true })).toEqual([]);
  });
});

describe('solverKey', () => {
  test('ignores the clock and the reach beat; sorts sets and records; follows data order for parts', () => {
    const s = initialState(c1p2);
    const k = solverKey(c1p2, s);
    expect(solverKey(c1p2, { ...s, tick: 99, baby: { ...s.baby, reachTicks: 3 } })).toBe(k);
    const a = { ...s, consumed: ['x', 'y'], flags: ['f', 'g'], counters: { a: 1, b: 2 }, dropped: { p: 'L1', q: 'L2' }, baby: { ...s.baby, refused: ['m', 'n'] } };
    const b = { ...s, consumed: ['y', 'x'], flags: ['g', 'f'], counters: { b: 2, a: 1 }, dropped: { q: 'L2', p: 'L1' }, baby: { ...s.baby, refused: ['n', 'm'] } };
    expect(solverKey(c1p2, a)).toBe(solverKey(c1p2, b));
    expect(solverKey(c1p2, { ...s, parts: { board: 'still', train: 'out' } })).toBe(solverKey(c1p2, { ...s, parts: { train: 'out', board: 'still' } }));
  });

  test('tells apart every field that matters', () => {
    const s = initialState(deadEnd);
    const variants: SimState[] = [
      s,
      { ...s, parts: { gate: 'open' } },
      { ...s, pushables: { ...s.pushables, rock: 'landed' } },
      { ...s, baby: { ...s.baby, node: 'B' } },
      { ...s, baby: { ...s.baby, mode: 'crying' } },
      { ...s, baby: { ...s.baby, facing: 'l' } },
      { ...s, baby: { ...s.baby, refused: ['bead'] } },
      { ...s, baby: { ...s.baby, lookCount: 1 } },
      { ...s, baby: { ...s.baby, target: 'bead' } },
      { ...s, baby: { ...s.baby, carriedBy: { id: 'cart', k: 0 } } },
      { ...s, baby: { ...s.baby, carriedBy: { id: 'cart', k: 1 } } },
      { ...s, baby: { ...s.baby, linked: true } },
      { ...s, mocha: { perch: null, path: ['home', 'shelf1'], to: 'shelf1' } },
      { ...s, mocha: { perch: 'home', path: [], stare: 'rock' } },
      { ...s, mocha: { perch: 'home', path: [], floorNode: 'A' } },
      { ...s, mocha: { perch: null, path: [] } },
      { ...s, consumed: ['bead'] },
      { ...s, flags: ['bead'] },
      { ...s, dropped: { bead: 'A' } },
      { ...s, dropped: {} },
      { ...s, counters: { land: 1 } },
      { ...s, done: true },
    ];
    expect(new Set(variants.map((v) => solverKey(deadEnd, v))).size).toBe(variants.length);
  });

  test('distinct exactly when canonicalKey (without tick and reach beat) is distinct, on every reachable state of the fixtures', () => {
    const canonical = (s: SimState) => canonicalKey({ ...s, tick: 0, baby: { ...s.baby, reachTicks: 0 } });
    for (const def of [c1p2, c0p4, c1p3, deadEnd]) {
      // Explored by solverKey, no two states share a canonical key (it isn't finer)…
      const bySolver = [...explore(def).values()];
      expect(new Set(bySolver.map(canonical)).size).toBe(bySolver.length);
      // … and explored by canonical key, no two states share a solverKey (it isn't coarser).
      const byCanon = [...explore(def, initialState(def), canonical).values()];
      expect(new Set(byCanon.map((s) => solverKey(def, s))).size).toBe(byCanon.length);
      expect(byCanon.length).toBe(bySolver.length);
    }
  });
});

describe('dropping the reach beat from the key is sound', () => {
  test('on c1p2, states that differ only in baby.reachTicks have the same successors for every input', () => {
    const withBeat = explore(c1p2, initialState(c1p2), (s) => canonicalKey({ ...s, tick: 0 }));
    const groups = new Map<string, SimState[]>();
    for (const s of withBeat.values()) {
      const k = solverKey(c1p2, s);
      groups.set(k, [...(groups.get(k) ?? []), s]);
    }
    expect(withBeat.size).toBeGreaterThan(groups.size);
    for (const [, states] of groups) {
      if (states.length < 2) continue;
      const successors = (s: SimState) => candidateInputs(c1p2, s).map((i) => solverKey(c1p2, step(c1p2, s, i).state));
      const first = successors(states[0]);
      for (const s of states.slice(1)) expect(successors(s)).toEqual(first);
    }
  });
});

describe('helpers', () => {
  test('firesMischief reads the capped counter; tudigongVisible its condition (absent: always)', () => {
    const s = initialState(c1p2);
    expect(firesMischief(c1p2, s)).toBe(false);
    expect(firesMischief(c1p2, { ...s, counters: { ride: 4 } })).toBe(true);
    expect(tudigongVisible(c1p2, s)).toBe(false);
    expect(tudigongVisible(c1p2, { ...s, parts: { ...s.parts, board: 'flip' } })).toBe(true);
    expect(tudigongVisible(trivial, initialState(trivial))).toBe(true);
  });

  test('toSolutionSteps folds waits and maps every gesture', () => {
    expect(
      toSolutionSteps([
        { t: 'none' },
        { t: 'none' },
        { t: 'set', part: 'train', to: 'half' },
        { t: 'tap', id: 'board' },
        { t: 'mocha', perch: 'pillar' },
        { t: 'pet' },
        { t: 'say', word: 'beep' },
        { t: 'none' },
      ]),
    ).toEqual([{ wait: 2 }, { set: 'train', to: 'half' }, { tap: 'board' }, { mocha: 'pillar' }, { pet: true }, { say: 'beep' }, { wait: 1 }]);
    expect(() => toSolutionSteps([{ t: 'floor', node: 'A' }])).toThrow(/floor/);
  });

  test('a solution folded to steps replays to done', () => {
    const r = solve(c1p2);
    expect(replay(c1p2, toSolutionSteps(r.solution!)).state.done).toBe(true);
  });
});
