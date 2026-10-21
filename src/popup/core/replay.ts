import type { SimEvent } from './events';
import { canonicalKey, initialState } from './state';
import { step } from './step';
import type { Input, PageDef, SimState, SolutionStep } from './types';

/**
 * Replays a `SolutionStep[]` (GDD § 3.2, § 3.7: every page's intended `solution` must reach `done`
 * in tests). Each gesture step is one tick with that input; waits are ticks with no input:
 * - `{ wait: n }`: n ticks.
 * - `{ wait: 'settle' }`: until a tick changes nothing but the clock and the reach beat
 *   (`baby.reachTicks`), at most `SETTLE_CAP` ticks — then it throws (the page never settles).
 * - `{ wait: 'goal' }`: until `done`, at most `GOAL_CAP` ticks — then it throws.
 * Pure: the same page and steps always give the same states and events.
 */

/** Most ticks a `settle` wait may take. */
export const SETTLE_CAP = 200;
/** Most ticks a `goal` wait may take. */
export const GOAL_CAP = 500;

/** One tick of a replay. */
export interface ReplayTick {
  /** The tick number the step ran on (the state's `tick` before it). */
  readonly tick: number;
  readonly input: Input;
  readonly events: SimEvent[];
}

export interface ReplayResult {
  readonly state: SimState;
  readonly ticks: ReplayTick[];
}

/** The input a gesture step stands for, or null for a wait. */
export function toInput(s: SolutionStep): Input | null {
  if ('set' in s) return { t: 'set', part: s.set, to: s.to };
  if ('mocha' in s) return { t: 'mocha', perch: s.mocha };
  if ('pet' in s) return { t: 'pet' };
  if ('say' in s) return { t: 'say', word: s.say };
  if ('tap' in s) return { t: 'tap', id: s.tap };
  if ('floor' in s) return { t: 'floor', node: s.floor };
  return null;
}

/** The state without the clock and the reach beat: equal keys mean "nothing happened". */
function settleKey(state: SimState): string {
  return canonicalKey({ ...state, tick: 0, baby: { ...state.baby, reachTicks: 0 } });
}

const NONE: Input = { t: 'none' };

/** Runs `steps` on `def` from `from` (default: the page's initial state). */
export function replay(def: PageDef, steps: readonly SolutionStep[], from: SimState = initialState(def)): ReplayResult {
  const ticks: ReplayTick[] = [];
  let state = from;
  const tick = (input: Input) => {
    const r = step(def, state, input);
    ticks.push({ tick: state.tick, input, events: r.events });
    state = r.state;
  };

  steps.forEach((s, i) => {
    const input = toInput(s);
    if (input !== null) return tick(input);
    const wait = (s as { wait: number | 'settle' | 'goal' }).wait;
    if (typeof wait === 'number') {
      for (let k = 0; k < wait; k++) tick(NONE);
    } else if (wait === 'settle') {
      for (let k = 0; ; k++) {
        if (k === SETTLE_CAP) throw new Error(`replay of page '${def.id}': step ${i} (wait settle) did not settle in ${SETTLE_CAP} ticks`);
        const before = settleKey(state);
        tick(NONE);
        if (settleKey(state) === before) break;
      }
    } else {
      for (let k = 0; !state.done; k++) {
        if (k === GOAL_CAP) throw new Error(`replay of page '${def.id}': step ${i} (wait goal) did not reach the goal in ${GOAL_CAP} ticks`);
        tick(NONE);
      }
    }
  });
  return { state, ticks };
}
