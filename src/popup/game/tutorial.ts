import { NUDGE_LINES } from '../content/hints';
import type { Id, PageDef, SimState } from '../core/types';

/**
 * The prologue's scripted tutorials (GDD § 4.3 notes, § 6 risk 1; #106). Not the hint ladder (#100):
 * each is a fixed beat written for one page, shown on the page's first play only (until the save
 * marks it solved) and only after its situation has held for a while, so the player gets a moment
 * to find it alone:
 * - **0-1** 「嬰兒床」: after 4 s of him reaching with the rail still up, the ghost hand pulls the tab.
 * - **0-2** 「沙發山」: his thought bubble wears a spotlight once he settles at the TV, and keeps it
 *   while it flips to the bead and he crawls back ("his bubble shows what he wants").
 * - **0-3** 「摩卡起床」: after 4 s of him reaching under the table, the ghost hand taps the table's
 *   paw print (after Mocha's join lines: the page's talk must be read first).
 * - **1-5** 「便當店的電梯」 (#183, the AI playtest: stuck once the car was down): after 4 s of him
 *   reaching from the car at B1 with Mocha on its panel, Mocha taps his paw on the panel, shimmers
 *   once and says 「再按一次？」 — a nudge toward tapping him to press again, not the answer played out.
 *
 * Pure: `tutorialCue` says what the state calls for; `PagePlayer` keeps the clock (the cue must hold
 * for `afterMs` of unpaused time with nothing being said) and draws it through `affordance`.
 */

/**
 * What a tutorial shows: the ghost hand on a target (a hint key, `affordance.hint` level 2), the
 * bubble spotlight, or a nudge — the auto nudge's single shimmer on a target (level 0) with Mocha
 * cueing it (#183).
 */
export type TutorialShow =
  | { readonly kind: 'hand'; readonly key: string; readonly stop?: number }
  | { readonly kind: 'bubble' }
  | { readonly kind: 'nudge'; readonly key: string; readonly mocha: 'yawn' | 'look' | 'wait'; readonly line?: string };

export interface TutorialCue {
  readonly show: TutorialShow;
  /** How long the situation must hold before it shows (ms) */
  readonly afterMs: number;
}

/** GDD § 4.3: "after 4 s of reaching". */
export const TUTORIAL_DELAY_MS = 4000;
/** 0-2: the spotlight waits until the bubble has settled over the TV. */
export const BUBBLE_DELAY_MS = 1200;

interface Script {
  readonly show: TutorialShow;
  readonly afterMs: number;
  /** The situation it is for */
  readonly when: (state: SimState) => boolean;
}

const reaching = (state: SimState, target: Id) => state.baby.mode === 'reaching' && state.baby.target === target;

/** The tutorials, by page id. */
const SCRIPTS: Readonly<Record<Id, Script>> = {
  c0p1: {
    show: { kind: 'hand', key: 'crib-rail', stop: 1 },
    afterMs: TUTORIAL_DELAY_MS,
    when: (s) => reaching(s, 'bead') && s.parts['crib-rail'] === 'up',
  },
  c0p2: {
    show: { kind: 'bubble' },
    afterMs: BUBBLE_DELAY_MS,
    // Watching the TV (a note), then wanting the bead the cushion showed until he has it
    when: (s) => (s.baby.mode === 'watching' && s.baby.target === 'tvGlow') || (s.baby.target === 'bead' && (s.baby.mode === 'moving' || s.baby.mode === 'reaching')),
  },
  c0p3: {
    show: { kind: 'hand', key: 'perch:table' },
    afterMs: TUTORIAL_DELAY_MS,
    // Reaching for the bead on the table while Mocha is neither on the table nor on his way there
    when: (s) => reaching(s, 'bead') && s.pushables.bead === 'onPerch' && s.mocha.perch !== 'table' && s.mocha.to !== 'table',
  },
  c1p5: {
    show: { kind: 'nudge', key: 'mocha:mocha', mocha: 'wait', line: NUDGE_LINES.press },
    afterMs: TUTORIAL_DELAY_MS,
    when: (s) => reaching(s, 'bead') && s.baby.node === 'E' && s.parts.elevator === 'B1' && s.mocha.perch === 'carPanel' && s.mocha.path.length === 0,
  },
};

/** True when the page has a scripted tutorial. */
export const hasTutorial = (def: Pick<PageDef, 'id'>): boolean => def.id in SCRIPTS;

/** What the page's tutorial calls for in this state, or null (no tutorial, or not its moment). */
export function tutorialCue(def: Pick<PageDef, 'id'>, state: SimState): TutorialCue | null {
  const script = SCRIPTS[def.id];
  if (script === undefined || state.done || !script.when(state)) return null;
  return { show: script.show, afterMs: script.afterMs };
}

/** A stable key for a cue (the clock restarts when it changes). */
export const cueKey = (cue: TutorialCue | null): string => (cue === null ? '' : JSON.stringify(cue.show));
