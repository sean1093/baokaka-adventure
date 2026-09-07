import { TERRAIN, covers, terrainAt } from './iso';
import type { GameMap, Tile } from './types';

const hasFlag = (flags: readonly string[], flag: string | undefined): boolean => flag === undefined || flags.includes(flag);

/** Story conditions on NPCs, exits and triggers: `when` must be set, `not` must be unset. */
export const meets = (flags: readonly string[], condition: { when?: string; not?: string }): boolean =>
  hasFlag(flags, condition.when) && (condition.not === undefined || !flags.includes(condition.not));

export const chestOpened = (flags: readonly string[], chestId: string): boolean => flags.includes(`chest:${chestId}`);

/** Terrain and decor: the parts of a map that never move. */
export function isSolid(map: GameMap, c: number, r: number): boolean {
  if (!TERRAIN[terrainAt(map, c, r)].walk) return true;
  return map.decor.some((entry) => entry.solid !== false && covers(entry, c, r));
}

/**
 * Everything standing in the way right now: solid ground plus visible NPCs and unopened chests.
 * `ignoreActors` asks the layout question instead — used by validate.ts, because an NPC blocking
 * a doorway is a story gate, not a level design mistake.
 */
export function isBlocked(map: GameMap, flags: readonly string[], c: number, r: number, ignoreActors = false): boolean {
  if (isSolid(map, c, r)) return true;
  if (ignoreActors) return false;
  for (const npc of map.npcs) if (npc.c === c && npc.r === r && meets(flags, npc)) return true;
  for (const chest of map.chests) if (chest.c === c && chest.r === r && !chestOpened(flags, chest.id)) return true;
  return false;
}

const NEIGHBOURS: readonly Tile[] = [
  { c: 1, r: 0 },
  { c: -1, r: 0 },
  { c: 0, r: 1 },
  { c: 0, r: -1 },
];

/**
 * Breadth-first path over walkable tiles, four-connected. Returns the tiles to step through
 * (excluding `from`, including `to`), or null when `to` cannot be reached. Maps are at most a
 * few hundred tiles, so a plain BFS is instant.
 */
export function findPath(map: GameMap, flags: readonly string[], from: Tile, to: Tile, ignoreActors = false): Tile[] | null {
  if (from.c === to.c && from.r === to.r) return [];
  if (isBlocked(map, flags, to.c, to.r, ignoreActors)) return null;

  const width = map.grid[0].length;
  const key = (tile: Tile) => tile.r * width + tile.c;
  const previous = new Map<number, number>();
  const queue: Tile[] = [from];
  previous.set(key(from), -1);

  while (queue.length > 0) {
    const current = queue.shift() as Tile;
    for (const step of NEIGHBOURS) {
      const next = { c: current.c + step.c, r: current.r + step.r };
      const id = key(next);
      if (previous.has(id) || isBlocked(map, flags, next.c, next.r, ignoreActors)) continue;
      previous.set(id, key(current));
      if (next.c === to.c && next.r === to.r) {
        const path: Tile[] = [];
        let cursor = id;
        while (cursor !== key(from)) {
          path.push({ c: cursor % width, r: Math.floor(cursor / width) });
          cursor = previous.get(cursor) as number;
        }
        return path.reverse();
      }
      queue.push(next);
    }
  }
  return null;
}

/** The walkable tile next to `target` that is closest to `from`, for walking up to an NPC or chest. */
export function adjacentTile(map: GameMap, flags: readonly string[], from: Tile, target: Tile): Tile | null {
  let best: { tile: Tile; length: number } | null = null;
  for (const step of NEIGHBOURS) {
    const tile = { c: target.c + step.c, r: target.r + step.r };
    if (isBlocked(map, flags, tile.c, tile.r)) continue;
    const path = findPath(map, flags, from, tile);
    if (path && (!best || path.length < best.length)) best = { tile, length: path.length };
  }
  return best?.tile ?? null;
}

export const isAdjacent = (a: Tile, b: Tile): boolean => Math.abs(a.c - b.c) + Math.abs(a.r - b.r) === 1;
