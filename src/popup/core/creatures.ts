import { nodePos, type Point } from './graph';
import type { CreatureDef, Id, PageDef, SimState } from './types';

/**
 * Creatures (GDD § 2.1, § 3.3 phase 4): small NPCs that stand on named positions, block the node
 * they're on (`graph.ts`), and move when an event reaches them. Decisions in D-45.
 *
 * - **Positions.** `positions` maps a name to a node or `'offpage'`. An off-page creature has no
 *   place on the page: only whole-page events (飛機！) reach it.
 * - **Reactions** (`react`, run by the cascade in `step.ts`): the first reaction whose event,
 *   radius (from the event origin to the creature's node) and `when` match moves it to `to`.
 * - **Drop** (§ 2.4 掰掰): a reaction with `drop` first lays the `heldBy` attractor it holds on the
 *   creature's current node (`SimState.dropped`, read by `baby.ts`'s `attractorNode`); it stays
 *   there, wherever the creature goes. Dropping is once: a dropped attractor is never held again.
 * - **Winged** (§ 2.4 飛機！, built in): a `winged` creature with no `sky` reaction of its own
 *   toggles between its ground position (`initial`) and its sky position (`sky`, else `away`).
 * - **Scared by Mocha** (C6) is Mocha's arrival action (`mocha.ts`).
 *
 * Moves happen as the cascade processes the event (no event of their own; the view diffs
 * positions), so phase 4 has nothing left to apply until `lonely` creatures follow the pair (#128).
 */

export function findCreature(def: PageDef, id: Id): CreatureDef | undefined {
  return def.creatures.find((c) => c.id === id);
}

/** The node a creature stands on, or null when it is off the page (or unknown). */
export function creatureNode(def: PageDef, state: SimState, id: Id): Id | null {
  const c = findCreature(def, id);
  const pos = state.creatures[id];
  const node = c === undefined || pos === undefined ? undefined : c.positions[pos];
  return node === undefined || node === 'offpage' ? null : node;
}

/** Where a creature is, in page units, or undefined when it is off the page. */
export function creaturePoint(def: PageDef, state: SimState, id: Id): Point | undefined {
  const node = creatureNode(def, state, id);
  return node === null ? undefined : nodePos(def, state, node);
}

/**
 * 飛機！'s built-in toggle for a `winged` creature: from its ground position (`initial`) to its sky
 * position (`sky`, else `away`), and from anywhere else back to the ground. Null when it isn't
 * winged or has no sky position.
 */
export function skyPosition(c: CreatureDef, current: string): string | null {
  if (c.winged !== true) return null;
  const sky = 'sky' in c.positions ? 'sky' : 'away' in c.positions ? 'away' : null;
  if (sky === null) return null;
  return current === c.initial ? sky : c.initial;
}

/**
 * Moves creature `id` to position `to` (ignored when it has no such position). With `drop`, first
 * lays that attractor on the creature's node — only if the creature holds it (`heldBy`), hasn't
 * dropped it yet, and stands on the page.
 */
export function moveCreature(def: PageDef, state: SimState, id: Id, to: string, drop?: Id): SimState {
  const c = findCreature(def, id);
  if (c === undefined) return state;
  let s = state;
  if (drop !== undefined && s.dropped?.[drop] === undefined) {
    const held = def.attractors.find((a) => a.id === drop)?.heldBy === id;
    const node = creatureNode(def, s, id);
    if (held && node !== null) s = { ...s, dropped: { ...s.dropped, [drop]: node } };
  }
  if (!(to in c.positions) || s.creatures[id] === to) return s;
  return { ...s, creatures: { ...s.creatures, [id]: to } };
}
