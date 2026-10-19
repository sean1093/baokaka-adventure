import { BABY_BARKS } from '../../content/barks';
import { attractorNode } from '../../core/baby';
import { nodePos } from '../../core/graph';
import { mochaNode } from '../../core/mocha';
import type { PageDef, SimState } from '../../core/types';
import type { Pt } from '../geometry';
import type { BarkShow } from '../talk/barks';

/**
 * Before he knows any word, tapping Baokaka shows a 「要！」 bubble pointing at what he wants
 * (GDD § 6 risk 1; #99) instead of the word ring: it answers the tap and teaches the rule at once.
 */

/** Where his current target is on the page (an attractor where it lies, or Mocha), or null. */
export function targetPoint(def: PageDef, state: SimState): Pt | null {
  const { target } = state.baby;
  if (target === null) return null;
  const node = target === 'mocha' ? mochaNode(def, state) : (() => {
    const a = def.attractors.find((x) => x.id === target);
    return a === undefined ? null : attractorNode(def, state, a);
  })();
  const p = node === null ? undefined : nodePos(def, state, node);
  // Attractors hover 14 units over their node (`AttractorItem`); point at the middle of the art
  return p === undefined ? null : [p[0], p[1] - (target === 'mocha' ? 24 : 16)];
}

/** The 「要！」 poke as a bark of his, with a pointer to his target when he has one. */
export function wantPoke(def: PageDef, state: SimState): BarkShow {
  const point = targetPoint(def, state);
  return { who: 'baby', bark: 'want', text: BABY_BARKS.want, tick: state.tick, ...(point ? { point } : {}) };
}
