import { replay, toInput } from './replay';
import { candidateInputs, solve, solverKey } from './solver';
import { initialState } from './state';
import { step } from './step';
import type { Id, Input, PageDef, SimState } from './types';

/**
 * The hint source (GDD § 2.7, § 3.7; #100): the next useful action from the *current* state.
 *
 * 1. **The solver** from the current state, capped (`HINT_CAP` states, `HINT_TIME_MS` of the
 *    caller's clock) and stopping at the first goal, so its `nextAction` is exact: fewest moves,
 *    then fewest ticks (`none` = "wait"). `workers/hint.worker.ts` runs this off the main thread.
 * 2. **The stored solution**, when the solver gives up (cap, time, an error, a throw): the
 *    `solution` step whose part states match the current ones (`solutionAction`).
 * 3. **重來 + step 1** when nothing matches (`source: 'restart'`): the hint offers 重來, and
 *    level 3 restarts the page and plays the solution's first gesture.
 *
 * Pure: the clock is the caller's (the core never reads one). Nothing here is recorded anywhere —
 * a hint costs nothing (R8, § 2.7).
 */

/** GDD § 3.7: the runtime hint's state cap and time budget. */
export const HINT_CAP = 200_000;
export const HINT_TIME_MS = 300;

/** Where a hint's action came from. */
export type HintSource = 'solver' | 'solution' | 'restart';

/** The worker's answer (`{ pageId, state } → { action | null, source }`). */
export interface HintAnswer {
  /** The next useful input (`none` = wait), or null when the page is done. After `restart`, the solution's first gesture. */
  readonly action: Input | null;
  readonly source: HintSource;
}

export interface HintOptions {
  /** Most states the solver may explore (default `HINT_CAP`; 0 skips the solver: the fallback alone). */
  readonly cap?: number;
  /** Time budget in ms on `clock` (default `HINT_TIME_MS`; ignored without a clock). */
  readonly timeMs?: number;
  /** A millisecond clock (the worker passes `() => performance.now()`). */
  readonly clock?: () => number;
}

const NONE: Input = { t: 'none' };

/** One gesture of a page's stored solution, with the state it was played from. */
interface SolutionGesture {
  readonly input: Input;
  readonly before: SimState;
  /** The page had settled when the solution played it (a `wait: 'settle'` before it): wait for that again */
  readonly settled: boolean;
}

interface SolutionTrace {
  readonly gestures: readonly SolutionGesture[];
  /** The state after the last gesture's tick (from here the solution only waits) */
  readonly after: SimState | null;
  /** The parts any gesture drives (the relaxed match compares only these) */
  readonly driven: readonly Id[];
}

const traces = new WeakMap<PageDef, SolutionTrace>();

/** The page's solution replayed once, each gesture with the state it was played from. */
function trace(def: PageDef): SolutionTrace {
  let t = traces.get(def);
  if (t !== undefined) return t;
  const gestures: SolutionGesture[] = [];
  let after: SimState | null = null;
  try {
    let state = initialState(def);
    for (const tick of replay(def, def.solution).ticks) {
      const before = state;
      state = step(def, state, tick.input).state;
      if (tick.input.t !== 'none') {
        gestures.push({ input: tick.input, before, settled: !waitMoves(def, before) });
        after = state;
      }
    }
  } catch {
    // A broken solution (the page's tests say so): whatever replayed before the throw is still a guide
  }
  const driven = [...new Set(gestures.flatMap(({ input }) => (input.t === 'set' ? [input.part] : input.t === 'tap' ? [input.id] : [])))];
  t = { gestures, after, driven };
  traces.set(def, t);
  return t;
}

/** The solution's first gesture (step 1, played after 重來), or a wait for a solution of waits alone. */
export function restartAction(def: PageDef): Input {
  for (const s of def.solution) {
    const input = toInput(s);
    if (input !== null) return input;
  }
  return NONE;
}

const sameParts = (a: SimState, b: SimState, ids: readonly Id[]) => ids.every((id) => a.parts[id] === b.parts[id]);

const inputKey = (i: Input) => JSON.stringify(i);

/** Whether `input` does something from `state` a wait wouldn't (and is one the player could make now). */
function effective(def: PageDef, state: SimState, input: Input): boolean {
  if (!candidateInputs(def, state).some((c) => inputKey(c) === inputKey(input))) return false;
  try {
    return solverKey(def, step(def, state, input).state) !== solverKey(def, step(def, state, NONE).state);
  } catch {
    return false;
  }
}

/**
 * The stored-solution fallback (GDD § 2.7): the first solution gesture played from part states equal
 * to the current ones that still does something now (one already done — Mocha already on that
 * perch — is skipped), and only once the page has settled if the solution let it settle first
 * (until then: wait). Parts compare exactly first, then only the parts the solution drives (a spun
 * 床鈴 doesn't hide the way). A match with nothing left to do, or the part states the solution's
 * last gesture left, mean "wait" — while a wait still changes something. Null when nothing
 * matches (or the page has settled with nothing to do).
 */
export function solutionAction(def: PageDef, state: SimState): Input | null {
  if (state.done) return null;
  const { gestures, after, driven } = trace(def);
  const all = Object.keys(state.parts);
  // Waiting only helps while something is still moving: a settled page that matches nothing to do is lost
  const moving = waitMoves(def, state);
  for (const ids of [all, driven]) {
    const matches = gestures.filter((g) => sameParts(g.before, state, ids));
    const next = matches.find((g) => effective(def, state, g.input));
    if (next !== undefined) return next.settled && moving ? NONE : next.input;
    if (moving && (matches.length > 0 || (after !== null && sameParts(after, state, ids)))) return NONE;
  }
  return null;
}

/** Whether a wait changes anything (beyond the clock and the reach beat). */
function waitMoves(def: PageDef, state: SimState): boolean {
  try {
    return solverKey(def, step(def, state, NONE).state) !== solverKey(def, state);
  } catch {
    return false;
  }
}

/**
 * The next useful action from `state` (GDD § 2.7's hint source), never throwing: the solver, else
 * the stored solution step, else 重來 + step 1.
 */
export function nextHint(def: PageDef, state: SimState, opts: HintOptions = {}): HintAnswer {
  if (state.done) return { action: null, source: 'solver' };
  const cap = opts.cap ?? HINT_CAP;
  if (cap > 0) {
    try {
      const r = solve(def, state, { cap, timeMs: opts.clock ? (opts.timeMs ?? HINT_TIME_MS) : undefined, clock: opts.clock, stopAtGoal: true });
      // Only a search that reached the goal knows the way from its start (no second, uncapped solve)
      const action = r.solvable ? r.nextAction(state) : null;
      if (action !== null) return { action, source: 'solver' };
    } catch {
      // A page error mid-search: the fallback, silently (§ 2.7)
    }
  }
  return fallbackHint(def, state);
}

/** The hint without the solver (a worker that failed or timed out): the stored solution, else 重來 + step 1. */
export function fallbackHint(def: PageDef, state: SimState): HintAnswer {
  if (state.done) return { action: null, source: 'solution' };
  const action = solutionAction(def, state);
  return action !== null ? { action, source: 'solution' } : { action: restartAction(def), source: 'restart' };
}

/**
 * Plays a hint at level 3 ("show me", § 2.7) on `state`: the action as a real input — after
 * 重來 for a `restart` answer. What the session does, as a pure function (tests, the fixtures).
 */
export function applyHint(def: PageDef, state: SimState, answer: HintAnswer): SimState {
  if (answer.action === null) return state;
  const from = answer.source === 'restart' ? initialState(def) : state;
  return step(def, from, answer.action).state;
}
