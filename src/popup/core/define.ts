import type { DefinePage, Id, NodeDef } from './types';

/**
 * The identity helper every page file wraps its data in (GDD § 3.4): it returns `def` unchanged
 * and exists so the object literal is checked against `PageDef` with full inference. Re-exported
 * by `src/popup/pages/`.
 */
export const definePage: DefinePage = (def) => def;

/**
 * A node riding a `loop` (GDD § 2.1: "attached nodes rotate around N positions"; #120): the
 * `attach` that puts the node on `slots[(seat + i) % N]` in the loop's i-th state, so one turn of
 * the crank moves every seat one slot along. A loop with N states has N slots; each riding node
 * takes its own `seat` (0 … N-1).
 */
export function loopAttach(part: Id, states: readonly string[], slots: readonly (readonly [number, number])[], seat: number): NonNullable<NodeDef['attach']> {
  if (slots.length !== states.length) throw new Error(`loop '${part}': ${states.length} states need ${states.length} slots, not ${slots.length}`);
  const pos: Record<string, [number, number]> = {};
  states.forEach((s, i) => {
    const [x, y] = slots[(seat + i) % slots.length];
    pos[s] = [x, y];
  });
  return { part, pos };
}
