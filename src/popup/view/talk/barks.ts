import { BABY_BARKS, MOCHA_BARKS, type BabyBark, type MochaBark } from '../../content/barks';
import type { SimEvent } from '../../core/events';
import type { SimState } from '../../core/types';

/**
 * Bark bubbles (GDD § 2.2.1, § 2.3; #98): which automatic line each character says on a tick, read
 * from the tick's events and the change of mode. At most one bark per speaker per tick; the first
 * match below wins.
 *
 * Baokaka: the engine's `bark` (on choosing a target, and 「要！要！」 while reaching), 好吃！ on
 * `eat`, 哇—— when he starts crying. Mocha: 「……」 at the stare before a push, 「喵？」 at an
 * unreachable perch, 「不要。」 at water or steam, 「喵。」 on arrival, 「呼嚕嚕……」 when Baokaka
 * starts cuddling him.
 */

export interface BarkShow {
  readonly who: 'baby' | 'mocha';
  readonly bark: BabyBark | MochaBark;
  readonly text: string;
  /** The tick it was said on (a bark lasts a little longer than its tick, `BARK_TICKS`) */
  readonly tick: number;
}

/** A bark stays on the page for its tick and the next two (its bubble fades out by then). */
export const BARK_TICKS = 3;

export function barksOf(prev: SimState, state: SimState, events: readonly SimEvent[]): BarkShow[] {
  const out: BarkShow[] = [];
  const baby = (bark: BabyBark): BarkShow => ({ who: 'baby', bark, text: BABY_BARKS[bark], tick: state.tick });
  const mocha = (bark: MochaBark): BarkShow => ({ who: 'mocha', bark, text: MOCHA_BARKS[bark], tick: state.tick });

  const said = events.find((e) => e.type === 'bark' && e.bark !== undefined)?.bark;
  if (said !== undefined) out.push(baby(said));
  else if (events.some((e) => e.type === 'eat')) out.push(baby('yum'));
  else if (state.baby.mode === 'crying' && prev.baby.mode !== 'crying') out.push(baby('cry'));

  const has = (type: SimEvent['type']) => events.some((e) => e.type === type);
  if (has('mochaStare')) out.push(mocha('stare'));
  else if (has('mochaNope')) out.push(mocha('nope'));
  else if (has('mochaPuff')) out.push(mocha('puff'));
  else if (has('catArrive')) out.push(mocha('arrive'));
  else if (state.baby.mode === 'cuddling' && state.baby.target === 'mocha' && prev.baby.mode !== 'cuddling') out.push(mocha('purr'));
  return out;
}

/**
 * The barks on the page after a tick: the log so far plus this tick's, keeping only each speaker's
 * latest and dropping any older than `BARK_TICKS` ticks. `PagePlayer` keeps the log across ticks.
 */
export function barkLog(log: readonly BarkShow[], fresh: readonly BarkShow[], tick: number): BarkShow[] {
  const latest = new Map<BarkShow['who'], BarkShow>();
  for (const b of [...log, ...fresh]) if (tick - b.tick < BARK_TICKS && b.tick <= tick) latest.set(b.who, b);
  return [...latest.values()];
}
