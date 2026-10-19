/**
 * `src/popup/core/`: the simulation (GDD § 3.1–3.8). Pure, deterministic TypeScript with no
 * React and no DOM — `step(state, input) → { state, events }`, replayable from
 * `(pageDef, inputs[])`, and 100 % unit-tested.
 *
 * Planned modules (GDD § 3.5): `types.ts` (the contract, § 3.2), `cond.ts`, `presets.ts`
 * (preset → FSM defaults), `graph.ts` (BFS, reach sets), `baby.ts` (Baokaka's decision loop),
 * `mocha.ts`, `words.ts`, `creatures.ts`, `step.ts` (the tick, § 3.3), `events.ts`, `solver.ts`
 * (BFS, dead ends, par, hints), `lint.ts` (§ 3.6) and `replay.ts`.
 *
 * The boundary is enforced by `boundary.test.ts`: files here may import only each other and
 * `src/shared/random.ts`, and may not touch DOM globals, the wall clock or `Math.random`.
 *
 * Landed so far: `types.ts`, `cond.ts`, `presets.ts`, `state.ts` (`initialState`, `canonicalKey`)
 * and `define.ts` (`definePage`), all from #80; `graph.ts` (node positions, open edges, blocked
 * nodes, BFS, reach sets, nearest reachable node) from #81;
 * `baby.ts` (Baokaka's decision loop) and the first `events.ts` (`SimEvent`, barks) from #82.
 */
export * from './types';
export * from './cond';
export * from './presets';
export * from './state';
export * from './graph';
export * from './events';
export * from './baby';
export { definePage } from './define';
