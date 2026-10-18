import type { GameMap } from './types';

/**
 * The one night's clock (decision D-16; art direction § 3.2). A map's clock picks its sky, its
 * environment grade and the rim light on characters (`skyAt` / `gradeTokens` in art/palette.ts).
 */

/** The clock on each chapter card: the story bible's chapter headings (D-16). */
export const CHAPTER_CLOCK: Readonly<Record<number, string>> = {
  1: '00:00',
  2: '00:40',
  3: '01:10',
  4: '01:35',
  5: '02:00',
  6: '02:25',
  7: '02:50',
  8: '03:15',
  9: '03:40',
  10: '04:05',
  11: '04:25',
  12: '04:45',
  13: '05:00',
  14: '05:15',
};

/**
 * Maps whose clock differs from their chapter card (art direction § 4.2 *Location table*, by the
 * map ids planned there). A map that sets `time` itself wins; sub-maps and ride cars not listed
 * here use their chapter's time.
 */
export const LOCATION_CLOCK: Readonly<Record<string, string>> = {
  daan: '00:15',
  maokong: '03:55',
  xinyi: '05:10',
  summit: '05:20',
};

/** A map's clock: its own `time`, else the § 4.2 location time, else its chapter card's time. */
export function mapClock(map: Pick<GameMap, 'id' | 'chapter' | 'time'>): string {
  return map.time ?? LOCATION_CLOCK[map.id] ?? CHAPTER_CLOCK[map.chapter] ?? CHAPTER_CLOCK[1];
}
