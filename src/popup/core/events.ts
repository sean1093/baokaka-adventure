import type { EventType, Id } from './types';

/**
 * Events the simulation emits (GDD § 3.2 `EventType`, § 3.3). The tick (#84) logs them, the
 * cascade reacts to the § 3.2 ones, and the game layer listens to all of them (barks, sounds,
 * mischief). Baokaka's decision loop (#82) and Mocha (#83) emit what is here; #84 adds the rest
 * of the cascade's needs.
 */

/** Baokaka's automatic flavour lines (GDD § 2.2.1, § 2.2.3); the text is in `BARK_TEXT`. */
export type Bark = 'want' | 'meow' | 'milk' | 'pretty' | 'wantWant';

/** zh-Hant text of each bark (Baokaka's vocabulary, GDD § 5.1). */
export const BARK_TEXT: Readonly<Record<Bark, string>> = {
  want: '要！',
  meow: '喵喵！',
  milk: 'ㄋㄟㄋㄟ',
  pretty: '好看！',
  wantWant: '要！要！',
};

/**
 * Events with no simulation effect; only the view and audio react to them (GDD § 2.3, D-44):
 * - `bark`: one of Baokaka's flavour lines (`bark`).
 * - `mochaNope`: a tapped perch Mocha can't get to — no path, glass (C8), `blockedWhen`, or not a
 *   perch at all (C1). He looks at it, flicks his tail, 「喵？」; the marker wiggles.
 * - `mochaPuff`: a tapped perch that is wet or steamy (C7). His fur puffs up: 「不要。」
 * - `mochaStare`: the eye-contact beat before a push (C3), with a slow 「……」. `id` = the pushable.
 */
export type UiEventType = 'bark' | 'mochaNope' | 'mochaPuff' | 'mochaStare';

export interface SimEvent {
  type: EventType | UiEventType;
  /** The node, attractor, part or creature the event is about. */
  id?: Id;
  /** Origin in page units, for events with a radius (`cry`). */
  at?: readonly [number, number];
  /** Radius in page units, measured from `at`. */
  within?: number;
  /** For `bark`. */
  bark?: Bark;
  /** For `partEnter`: the state the part (`id`) entered — or entered again, for a re-press (D-44). */
  state?: string;
}
