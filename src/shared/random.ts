/**
 * Seeded randomness shared by the games: a battle replays identically from its seed, and a
 * sudoku puzzle can be regenerated from one. mulberry32 is a few integer ops and plenty for dice.
 */

/** One draw: a value in [0, 1) and the seed to use for the next draw. Pure. */
export function roll(seed: number): { value: number; seed: number } {
  const next = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(next ^ (next >>> 15), 1 | next);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, seed: next };
}

/** A stateful generator over `roll`, for code that draws many times (generators, shuffles). */
export function rng(seed: number): () => number {
  let cursor = seed;
  return () => {
    const result = roll(cursor);
    cursor = result.seed;
    return result.value;
  };
}

/** Fisher-Yates in place with the given source. */
export function shuffle<T>(items: T[], random: () => number): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [items[index], items[swap]] = [items[swap], items[index]];
  }
  return items;
}
