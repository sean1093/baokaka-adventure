import type { EventType, Id } from './types';

/**
 * Events the simulation emits (GDD § 3.2 `EventType`, § 3.3). The tick (#84) logs them, the
 * cascade reacts to the § 3.2 ones, and the game layer listens to all of them (barks, sounds,
 * mischief). This file starts with what Baokaka's decision loop (#82) emits; #84 adds the rest
 * of the cascade's needs (e.g. Mocha's `mochaNope`).
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

/** Events with no simulation effect; only the view and audio react to them. */
export type UiEventType = 'bark';

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
}
