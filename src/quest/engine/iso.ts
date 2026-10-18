import type { GameMap, LegacyTerrain, Material, Structure, Terrain, Tile } from './types';

/** A diamond tile is 72 wide and 36 tall: the classic 2:1 isometric projection (art direction § 4.4). */
export const TILE_W = 72;
export const TILE_H = 36;

/** Centre of tile (c, r) in world pixels; tile (0, 0) is at the origin. */
export const toScreen = (c: number, r: number): { x: number; y: number } => ({
  x: ((c - r) * TILE_W) / 2,
  y: ((c + r) * TILE_H) / 2,
});

/** The tile under a world pixel. Fractional for interpolation; round to land on a tile. */
export const toTile = (x: number, y: number): { c: number; r: number } => ({
  c: (x / (TILE_W / 2) + y / (TILE_H / 2)) / 2,
  r: (y / (TILE_H / 2) - x / (TILE_W / 2)) / 2,
});

/** How a terrain behaves: whether it can be walked on, and how tall it stands (walls, fences). */
export type TerrainRule = {
  walk: boolean;
  /** Raised as a block this many pixels; the art draws it as merged runs (src/art/tiles) */
  height?: number;
};

const FLOOR: TerrainRule = { walk: true };

/**
 * Every terrain's rule. Materials are walkable unless they are water; how each one looks lives in
 * `src/art/tiles/terrain.ts` (`TILE_MATERIALS`), so the engine stays free of colours.
 */
export const TERRAIN: Record<Terrain, TerrainRule> = {
  grass: FLOOR,
  gravel: FLOOR,
  brickWalk: FLOOR,
  asphalt: FLOOR,
  zebra: FLOOR,
  water: { walk: false },
  marble: FLOOR,
  undergroundTile: FLOOR,
  wood: FLOOR,
  rug: FLOOR,
  playMat: FLOOR,
  oldBrick: FLOOR,
  stoneSlab: FLOOR,
  planks: FLOOR,
  stallTile: FLOOR,
  grate: FLOOR,
  apron: FLOOR,
  runway: FLOOR,
  teaSoil: FLOOR,
  wetStone: FLOOR,
  deck: FLOOR,
  jadeWater: { walk: false },
  seawall: FLOOR,
  polished: FLOOR,
  carpet: FLOOR,
  deckGrate: FLOOR,
  granite: FLOOR,
  carFloor: FLOOR,
  door: FLOOR,
  wall: { walk: false, height: 34 },
  fence: { walk: false, height: 14 },
  void: { walk: false },
  // Legacy names (until #21), walking like the material they are drawn as
  floor: FLOOR,
  tile: FLOOR,
  path: FLOOR,
  sand: FLOOR,
  cobble: FLOOR,
  dark: FLOOR,
  blanket: FLOOR,
};

/**
 * What each pre-redesign terrain is drawn as (decision D-30). #21 replaces the old maps and then
 * these names go.
 */
export const TERRAIN_ALIAS: Readonly<Record<LegacyTerrain, Material>> = {
  floor: 'wood',
  tile: 'undergroundTile',
  path: 'gravel',
  sand: 'gravel',
  cobble: 'stoneSlab',
  dark: 'carpet',
  blanket: 'playMat',
};

/** The material a terrain is drawn with, or the structure it is. */
export function surfaceOf(terrain: Terrain): Material | Structure {
  return Object.prototype.hasOwnProperty.call(TERRAIN_ALIAS, terrain) ? TERRAIN_ALIAS[terrain as LegacyTerrain] : (terrain as Material | Structure);
}

export const terrainAt = (map: GameMap, c: number, r: number): Terrain => {
  const row = map.grid[r];
  if (!row || c < 0 || c >= row.length) return 'void';
  return map.legend[row[c]] ?? 'void';
};

export const sameTile = (a: Tile, b: Tile): boolean => a.c === b.c && a.r === b.r;

/** Whether a decor entry covers a tile */
export const covers = (entry: { c: number; r: number; w?: number; h?: number }, c: number, r: number): boolean =>
  c >= entry.c && c < entry.c + (entry.w ?? 1) && r >= entry.r && r < entry.r + (entry.h ?? 1);
