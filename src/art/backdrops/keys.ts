/**
 * Battle backdrop keys (art direction § 8.4 *Battle backdrops*), without any drawing code, so the
 * engine's validator can check `GameMap.backdrop` without pulling React or the art into it.
 *
 * Every key names the chapter chunk that draws it: `ch01` → `./ch01.tsx`, loaded with `import()`
 * the first time a battle (or the world screen's preload) asks for one of its keys. The generic
 * stages ship in the main bundle, so a battle can always draw at once.
 */

/** The stages every map without its own backdrop falls back to (open sky, or a room for `interior` maps). */
export const GENERIC_BACKDROP = 'generic';
export const GENERIC_ROOM_BACKDROP = 'genericRoom';
export const GENERIC_BACKDROPS: readonly string[] = [GENERIC_BACKDROP, GENERIC_ROOM_BACKDROP];

/**
 * Chapter backdrops: key → the chapter whose chunk draws it. Each chapter art issue adds its
 * locations here and to its `chNN.tsx` (keys must match; `backdrops.test.ts` checks both ways).
 */
export const BACKDROP_CHAPTER: Readonly<Record<string, number>> = {
  /** 大安森林公園, the 露天音樂台 band-shell at 00:20 (§ 4.2): the template config */
  daan: 1,
};

/** Is `key` a backdrop the game can draw (a generic stage or a chapter one)? */
export const isBackdrop = (key: string): boolean =>
  GENERIC_BACKDROPS.includes(key) || Object.prototype.hasOwnProperty.call(BACKDROP_CHAPTER, key);

/** The backdrop a map's battles use: its own key when known, else the generic stage for its kind. */
export function backdropFor(map: { backdrop?: string; interior?: boolean }): string {
  if (map.backdrop && isBackdrop(map.backdrop)) return map.backdrop;
  return map.interior ? GENERIC_ROOM_BACKDROP : GENERIC_BACKDROP;
}
