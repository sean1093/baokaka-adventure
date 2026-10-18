import { TERRAIN, TILE_H, TILE_W, surfaceOf, terrainAt, toScreen } from '../../quest/engine/iso';
import type { GameMap, Material } from '../../quest/engine/types';
import { TILE_MATERIALS, saltOf, tileVariant, type TileMaterial } from './terrain';

/**
 * The geometry of a map's ground (art direction § 4.4 *Tile rules*, § 8.4): which tile symbol
 * goes where, the kerbs between materials, the raised walls and fences as merged runs, and the
 * diorama skirt. Pure, so it is computed once per map and tested without a browser; `Ground.tsx`
 * paints it into one SVG.
 *
 * World coordinates are `toScreen`'s: tile (0, 0) centred on the origin.
 */

const HW = TILE_W / 2;
const HH = TILE_H / 2;

/** How deep the diorama skirt hangs under the map's outer edges. */
export const SKIRT_DEPTH = 30;
/** Walls on the camera side of a room are cut down to a kerb, so they never hide the party. */
export const CUT_WALL_HEIGHT = 8;

type Pt = [number, number];
const n = (value: number) => Math.round(value * 10) / 10;
const poly = (points: Pt[]) => `M${points.map(([x, y]) => `${n(x)},${n(y)}`).join('L')}Z`;
const seg = (a: Pt, b: Pt) => `M${n(a[0])},${n(a[1])}L${n(b[0])},${n(b[1])}`;

export type GroundTile = { key: string; material: Material | 'door'; variant: number; x: number; y: number };

/** One raised group (full walls, cut walls), each painted faces first, then tops. Fences are `Fence`. */
export type WallGroup = {
  kind: 'wall' | 'cut';
  left: string;
  right: string;
  top: string;
  /** Lit lip along exposed cap edges */
  lit: string;
  /** Baseboard band and the trim line, on full walls */
  base: string;
  trim: string;
};

export type Fence = { posts: string; caps: string; rails: string; railsLit: string };

export type GroundGeometry = {
  /** The SVG's box in world pixels */
  box: { x: number; y: number; w: number; h: number };
  /** Every (material, variant) a tile uses, so only those symbols are defined */
  symbols: { material: Material | 'door'; variant: number }[];
  tiles: GroundTile[];
  /** Kerbs where two materials meet, per material (painted in that material's `lit`) */
  kerbs: { material: Material | 'door'; lit: string; shade: string }[];
  /** Shadow bands inside water along its banks, per liquid material */
  banks: { material: Material; d: string }[];
  skirt: { left: string; right: string; leftLow: string; rightLow: string; rim: string; line: string; strata: { tone: Material | 'door' | 'structure'; d: string }[] };
  walls: WallGroup[];
  fence: Fence;
};

type Surface = Material | 'door' | 'wall' | 'fence' | 'void';

export function surfaceAt(map: GameMap, c: number, r: number): Surface {
  return surfaceOf(terrainAt(map, c, r));
}

const isFloor = (surface: Surface) => surface !== 'void' && surface !== 'wall' && surface !== 'fence';

/** The material a floor surface is painted with (doors have their own threshold). */
export const materialOf = (surface: Surface): TileMaterial | undefined => (isFloor(surface) ? TILE_MATERIALS[surface as Material | 'door'] : undefined);

/**
 * How tall the raised tile at (c, r) is drawn: walls with floor in front of them (the back of the
 * room, toward the top of the screen) stand full height; walls whose room is behind them are cut
 * to a kerb; fences keep their railing height.
 */
export function raisedHeight(map: GameMap, c: number, r: number): number {
  const surface = surfaceAt(map, c, r);
  if (surface === 'fence') return TERRAIN.fence.height ?? 0;
  if (surface !== 'wall') return 0;
  const front = [surfaceAt(map, c, r + 1), surfaceAt(map, c + 1, r), surfaceAt(map, c + 1, r + 1)];
  return front.some(isFloor) ? (TERRAIN.wall.height ?? 0) : CUT_WALL_HEIGHT;
}

/** The four corners of tile (c, r)'s diamond at height h: top, right, bottom, left. */
function corners(c: number, r: number, h = 0): { top: Pt; right: Pt; bottom: Pt; left: Pt } {
  const { x, y } = toScreen(c, r);
  return { top: [x, y - HH - h], right: [x + HW, y - h], bottom: [x, y + HH - h], left: [x - HW, y - h] };
}

export function buildGround(map: GameMap): GroundGeometry {
  const rows = map.grid.length;
  const cols = map.grid[0]?.length ?? 0;
  const salt = saltOf(map.id);
  const tiles: GroundTile[] = [];
  const used = new Map<string, { material: Material | 'door'; variant: number }>();
  const kerbs = new Map<Material | 'door', { lit: string; shade: string }>();
  const banks = new Map<Material, string>();
  const strata = new Map<Material | 'door' | 'structure', string>();
  let skirtLeft = '';
  let skirtRight = '';
  let skirtLeftLow = '';
  let skirtRightLow = '';
  let skirtRim = '';
  let skirtLine = '';
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const surface = surfaceAt(map, c, r);
      if (surface === 'void') continue;
      const { x, y } = toScreen(c, r);
      const k = corners(c, r);
      minX = Math.min(minX, x - HW);
      maxX = Math.max(maxX, x + HW);
      minY = Math.min(minY, y - HH - raisedHeight(map, c, r));
      maxY = Math.max(maxY, y + HH);

      const material = materialOf(surface);
      if (material) {
        const name = surface as Material | 'door';
        const variant = tileVariant(material, c, r, salt);
        used.set(`${name}:${variant}`, { material: name, variant });
        tiles.push({ key: `${c},${r}`, material: name, variant, x, y });

        // Kerbs on this tile's two far edges, where the neighbour is a different floor (§ 4.4)
        const far: [Surface, Pt, Pt][] = [
          [surfaceAt(map, c, r - 1), k.top, k.right],
          [surfaceAt(map, c - 1, r), k.left, k.top],
        ];
        for (const [other, a, b] of far) {
          if (!isFloor(other) || other === surface || name === 'door' || other === 'door') continue;
          const otherMaterial = materialOf(other);
          if (!otherMaterial || otherMaterial.ramp === material.ramp) continue;
          const kerb = kerbs.get(name) ?? { lit: '', shade: '' };
          kerb.shade += seg(a, b);
          kerb.lit += seg([a[0], a[1] + 1.2], [b[0], b[1] + 1.2]);
          kerbs.set(name, kerb);
          if (material.liquid && !otherMaterial.liquid) {
            // A shadow band inside the water along the bank
            const inset = (p: Pt): Pt => [p[0] + (x - p[0]) * 0.16, p[1] + (y - p[1]) * 0.16];
            banks.set(name as Material, (banks.get(name as Material) ?? '') + poly([a, b, inset(b), inset(a)]));
          }
        }
      }

      // The diorama skirt under outer edges (§ 4.4): a face wherever the ground ends
      const tone: Material | 'door' | 'structure' = material ? (surface as Material | 'door') : 'structure';
      if (surfaceAt(map, c, r + 1) === 'void') {
        skirtLeft += poly([k.left, k.bottom, [k.bottom[0], k.bottom[1] + SKIRT_DEPTH], [k.left[0], k.left[1] + SKIRT_DEPTH]]);
        skirtLeftLow += poly([
          [k.left[0], k.left[1] + SKIRT_DEPTH * 0.55],
          [k.bottom[0], k.bottom[1] + SKIRT_DEPTH * 0.55],
          [k.bottom[0], k.bottom[1] + SKIRT_DEPTH],
          [k.left[0], k.left[1] + SKIRT_DEPTH],
        ]);
        strata.set(tone, (strata.get(tone) ?? '') + poly([k.left, k.bottom, [k.bottom[0], k.bottom[1] + 5], [k.left[0], k.left[1] + 5]]));
        skirtRim += seg(k.left, k.bottom);
        skirtLine += seg([k.left[0], k.left[1] + 12], [k.bottom[0], k.bottom[1] + 12]);
        maxY = Math.max(maxY, k.bottom[1] + SKIRT_DEPTH);
      }
      if (surfaceAt(map, c + 1, r) === 'void') {
        skirtRight += poly([k.bottom, k.right, [k.right[0], k.right[1] + SKIRT_DEPTH], [k.bottom[0], k.bottom[1] + SKIRT_DEPTH]]);
        skirtRightLow += poly([
          [k.bottom[0], k.bottom[1] + SKIRT_DEPTH * 0.55],
          [k.right[0], k.right[1] + SKIRT_DEPTH * 0.55],
          [k.right[0], k.right[1] + SKIRT_DEPTH],
          [k.bottom[0], k.bottom[1] + SKIRT_DEPTH],
        ]);
        strata.set(tone, (strata.get(tone) ?? '') + poly([k.bottom, k.right, [k.right[0], k.right[1] + 5], [k.bottom[0], k.bottom[1] + 5]]));
        skirtRim += seg(k.bottom, k.right);
        skirtLine += seg([k.bottom[0], k.bottom[1] + 12], [k.right[0], k.right[1] + 12]);
        maxY = Math.max(maxY, k.bottom[1] + SKIRT_DEPTH);
      }
    }
  }

  const { walls, fence } = buildRaised(map);

  if (!Number.isFinite(minX)) {
    minX = 0;
    maxX = 0;
    minY = 0;
    maxY = 0;
  }
  const pad = 2;
  return {
    box: { x: Math.floor(minX - pad), y: Math.floor(minY - pad), w: Math.ceil(maxX - minX + pad * 2), h: Math.ceil(maxY - minY + pad * 2) },
    symbols: [...used.values()],
    tiles,
    kerbs: [...kerbs].map(([material, kerb]) => ({ material, ...kerb })),
    banks: [...banks].map(([material, d]) => ({ material, d })),
    skirt: { left: skirtLeft, right: skirtRight, leftLow: skirtLeftLow, rightLow: skirtRightLow, rim: skirtRim, line: skirtLine, strata: [...strata].map(([tone, d]) => ({ tone, d })) },
    walls,
    fence,
  };
}

/**
 * Walls as merged runs (§ 4.4; fixes the old per-tile zigzag): a face is drawn only where the
 * neighbour in front is lower, so a run of wall tiles reads as one block, and each height group is
 * painted faces first, then tops. Fences become railings: a post per tile, rails to the next.
 */
function buildRaised(map: GameMap): { walls: WallGroup[]; fence: Fence } {
  const rows = map.grid.length;
  const cols = map.grid[0]?.length ?? 0;
  const full = TERRAIN.wall.height ?? 0;
  const groups: Record<WallGroup['kind'], WallGroup> = {
    wall: { kind: 'wall', left: '', right: '', top: '', lit: '', base: '', trim: '' },
    cut: { kind: 'cut', left: '', right: '', top: '', lit: '', base: '', trim: '' },
  };
  const fence: Fence = { posts: '', caps: '', rails: '', railsLit: '' };
  const height = (c: number, r: number) => (c < 0 || r < 0 || r >= rows || c >= cols ? 0 : raisedHeight(map, c, r));

  // Back to front, so within a group later (nearer) tiles paint over earlier ones
  const order: [number, number][] = [];
  for (let r = 0; r < rows; r += 1) for (let c = 0; c < cols; c += 1) order.push([c, r]);
  order.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));

  for (const [c, r] of order) {
    const surface = surfaceAt(map, c, r);
    const h = height(c, r);
    if (h === 0) continue;

    if (surface === 'fence') {
      const { x, y } = toScreen(c, r);
      const post = (px: number, py: number) =>
        poly([
          [px - 2.2, py],
          [px, py + 1.2],
          [px, py + 1.2 - h - 2],
          [px - 2.2, py - h - 2],
        ]) +
        poly([
          [px, py + 1.2],
          [px + 2.2, py],
          [px + 2.2, py - h - 2],
          [px, py + 1.2 - h - 2],
        ]);
      fence.posts += post(x, y);
      fence.caps += poly([
        [x - 2.2, y - h - 2],
        [x, y - h - 3.2],
        [x + 2.2, y - h - 2],
        [x, y - h - 0.8],
      ]);
      for (const [dc, dr] of [
        [1, 0],
        [0, 1],
      ] as const) {
        if (surfaceAt(map, c + dc, r + dr) !== 'fence') continue;
        const next = toScreen(c + dc, r + dr);
        for (const at of [h * 0.45, h]) {
          fence.rails += seg([x, y - at], [next.x, next.y - at]);
          fence.railsLit += seg([x, y - at - 1], [next.x, next.y - at - 1]);
        }
      }
      continue;
    }

    const group = h === full ? groups.wall : groups.cut;
    const k = corners(c, r);
    const front = { left: height(c, r + 1), right: height(c + 1, r) };
    const cap = corners(c, r, h);
    if (front.left < h) {
      group.left += poly([
        [k.left[0], k.left[1] - front.left],
        [k.bottom[0], k.bottom[1] - front.left],
        cap.bottom,
        cap.left,
      ]);
      group.lit += seg(cap.left, cap.bottom);
      if (group.kind === 'wall' && front.left === 0) {
        group.base += poly([k.left, k.bottom, [k.bottom[0], k.bottom[1] - 4], [k.left[0], k.left[1] - 4]]);
        group.trim += seg([k.left[0], k.left[1] - h * 0.62], [k.bottom[0], k.bottom[1] - h * 0.62]);
      }
    }
    if (front.right < h) {
      group.right += poly([
        [k.bottom[0], k.bottom[1] - front.right],
        [k.right[0], k.right[1] - front.right],
        cap.right,
        cap.bottom,
      ]);
      group.lit += seg(cap.bottom, cap.right);
      if (group.kind === 'wall' && front.right === 0) {
        group.base += poly([k.bottom, k.right, [k.right[0], k.right[1] - 4], [k.bottom[0], k.bottom[1] - 4]]);
        group.trim += seg([k.bottom[0], k.bottom[1] - h * 0.62], [k.right[0], k.right[1] - h * 0.62]);
      }
    }
    group.top += poly([cap.top, cap.right, cap.bottom, cap.left]);
    // The cap's far edges catch the light where nothing taller stands behind
    if (height(c, r - 1) < h) group.lit += seg(cap.top, cap.right);
    if (height(c - 1, r) < h) group.lit += seg(cap.left, cap.top);
  }

  return { walls: [groups.wall, groups.cut].filter((group) => group.top !== ''), fence };
}
