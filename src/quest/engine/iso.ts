import type { GameMap, Terrain, Tile } from './types';

/** A diamond tile is 64 wide and 32 tall: the classic 2:1 isometric projection. */
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

export type TerrainStyle = {
  top: string;
  /** Second shade for a soft checkerboard; same as top when the ground should be flat */
  alt: string;
  /** The far edge of each tile, so the floor catches light instead of reading as a swatch */
  shade: string;
  walk: boolean;
  /** Raised as a block this many pixels (walls and fences) */
  height?: number;
  left?: string;
  right?: string;
};

export const TERRAIN: Record<Terrain, TerrainStyle> = {
  floor: { top: '#EAD4A8', alt: '#E4CC9C', shade: '#CDB185', walk: true },
  rug: { top: '#E3A28B', alt: '#DE9A82', shade: '#C4826C', walk: true },
  tile: { top: '#DCEBF2', alt: '#D1E4ED', shade: '#B9CEDA', walk: true },
  grass: { top: '#9CC58A', alt: '#93BD82', shade: '#78A468', walk: true },
  path: { top: '#D9BE8C', alt: '#D2B583', shade: '#B99A6A', walk: true },
  sand: { top: '#F0DEB0', alt: '#EAD6A4', shade: '#D6BE87', walk: true },
  cobble: { top: '#CFC3B3', alt: '#C6BAA9', shade: '#A79B8C', walk: true },
  dark: { top: '#5A5270', alt: '#544C69', shade: '#403A52', walk: true },
  blanket: { top: '#B497C2', alt: '#AB8DBA', shade: '#8E729C', walk: true },
  door: { top: '#B08A5E', alt: '#B08A5E', shade: '#8E6B44', walk: true },
  water: { top: '#7FB6D9', alt: '#77AED3', shade: '#5D97BE', walk: false },
  wall: { top: '#F3E3C3', alt: '#F3E3C3', shade: '#D9C29A', walk: false, height: 30, left: '#D9C29A', right: '#C4A97C' },
  fence: { top: '#D8B98A', alt: '#D8B98A', shade: '#C09C6A', walk: false, height: 14, left: '#C09C6A', right: '#A98653' },
  void: { top: 'transparent', alt: 'transparent', shade: 'transparent', walk: false },
};

export const terrainAt = (map: GameMap, c: number, r: number): Terrain => {
  const row = map.grid[r];
  if (!row || c < 0 || c >= row.length) return 'void';
  return map.legend[row[c]] ?? 'void';
};

export const sameTile = (a: Tile, b: Tile): boolean => a.c === b.c && a.r === b.r;

/** Whether a decor entry covers a tile */
export const covers = (entry: { c: number; r: number; w?: number; h?: number }, c: number, r: number): boolean =>
  c >= entry.c && c < entry.c + (entry.w ?? 1) && r >= entry.r && r < entry.r + (entry.h ?? 1);
