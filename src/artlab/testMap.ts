import { GLOW } from '../art/palette';
import type { GameMap, Material, MapId, Terrain } from '../quest/engine/types';

/**
 * The art lab's iso test map (issue #13): 10×8 tiles of street, park, pond and night market, with
 * street lamps, a lantern, a lit window, two neon signs (the map is flagged `neon`, § 4.3), a moon
 * glint on the pond and every generic ambient FX. The art lab draws it at three clock times; the
 * validator test runs over it, so it doubles as an example of every new `GameMap` field.
 *
 *   B brick sidewalk  g grass  p gravel path  ~ pond water  A wet asphalt  Z zebra  S stall tile
 *   M checkered marble  # wall  D door
 */
const LEGEND: Record<string, Terrain> = {
  B: 'brickWalk',
  g: 'grass',
  p: 'gravel',
  '~': 'water',
  A: 'asphalt',
  Z: 'zebra',
  S: 'stallTile',
  M: 'marble',
  '#': 'wall',
  D: 'door',
};

export const TEST_MAP: GameMap = {
  id: 'artlabTest' as MapId,
  chapter: 1,
  title: '測試街區',
  palette: 'park',
  legend: LEGEND,
  grid: [
    '###D######',
    'BggggpgB~~',
    'BggppggB~~',
    'BgpgggBB~~',
    'AAAZZAAAAA',
    'AAAZZAAAAA',
    'BBBBBBBBBB',
    'SSSSSMMMMM',
  ],
  entry: { c: 3, r: 1 },
  decor: [
    { sprite: 'tree', c: 1, r: 1, size: 2.3 },
    { sprite: 'bench', c: 5, r: 3, size: 1.2 },
  ],
  npcs: [],
  chests: [],
  exits: [{ c: 3, r: 0, to: 'home', at: { c: 6, r: 5 } }],
  triggers: [],
  neon: true,
  lights: [
    { c: 7, r: 2, kind: 'lamp' },
    { c: 2, r: 6, kind: 'lamp' },
    { c: 9, r: 6, kind: 'lamp' },
    { c: 8, r: 1, kind: 'moon' },
    { c: 4, r: 7, kind: 'lantern' },
    { c: 6, r: 7, kind: 'neon' },
    { c: 8, r: 7, kind: 'neon', color: GLOW.neonCyan },
    { c: 1.5, r: 7.2, kind: 'window' },
  ],
  ambient: ['ripples', 'fireflies'],
};

/** The clock times the art lab shows the test map and every material at (issue #13 § 9). */
export const MAP_TIMES = ['00:00', '03:00', '05:15'] as const;

/** A 3×2 swatch map of one material, for the art lab's material sheet. */
export function swatchMap(material: Material): GameMap {
  return {
    id: `swatch-${material}` as MapId,
    chapter: 1,
    title: material,
    palette: 'park',
    legend: { m: material },
    grid: ['mmm', 'mmm'],
    entry: { c: 0, r: 0 },
    decor: [],
    npcs: [],
    chests: [],
    exits: [],
    triggers: [],
  };
}
