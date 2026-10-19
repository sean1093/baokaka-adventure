import type { Cond, Id, PageDef, SimState } from './types';

/**
 * A part's current state. Pushable parts keep theirs in `SimState.pushables` (D-41), so a
 * `{ part, in }` condition reads either record; an unknown id has no state.
 */
export function partState(state: SimState, id: Id): string | undefined {
  return state.parts[id] ?? state.pushables[id];
}

/**
 * Evaluates a condition against the state (GDD § 3.2 `Cond`). Pure and total: references to
 * ids that don't exist are simply false (lint, #86, reports them). `all: []` is true and
 * `any: []` is false, as in logic. `def` is part of the signature for conditions that will need
 * page data; none of today's variants do.
 */
export function evalCond(def: PageDef, state: SimState, cond: Cond): boolean {
  if ('part' in cond) {
    const current = partState(state, cond.part);
    return current !== undefined && cond.in.includes(current);
  }
  if ('mochaAt' in cond) return state.mocha.perch === cond.mochaAt && state.mocha.path.length === 0;
  if ('babyAt' in cond) return state.baby.node === cond.babyAt;
  if ('landed' in cond) return state.pushables[cond.landed] === 'landed';
  if ('creature' in cond) return state.creatures[cond.creature] === cond.at;
  if ('consumed' in cond) return state.consumed.includes(cond.consumed);
  if ('flag' in cond) return state.flags.includes(cond.flag);
  if ('all' in cond) return cond.all.every((c) => evalCond(def, state, c));
  if ('any' in cond) return cond.any.some((c) => evalCond(def, state, c));
  return !evalCond(def, state, cond.not);
}

/** `evalCond` for optional conditions: an absent condition holds. */
export function holds(def: PageDef, state: SimState, cond: Cond | undefined): boolean {
  return cond === undefined || evalCond(def, state, cond);
}
