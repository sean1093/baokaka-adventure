import type { PlayMode, SpriteEvent, SpriteGroup } from './config';

/**
 * The sprite manifest contract (#94; Art v2 § 2.3, § 5; bible § 5, § 9.1): what
 * `npm run sync:sprites` writes to `sprites.gen.ts` and the game reads. Everything is in logical
 * pt (= page units: the page is 390 wide), measured from the baked frame's top-left. The baked
 * frame already carries the die-cut standee look (border, cut line, stacked shadow, easel tab), so
 * its box is the artist's box plus the border; every frame of a sprite shares that box.
 */

export type Scale = 2 | 3;
export type Facing = 'l' | 'r';
export type Pt2 = readonly [number, number];

export interface SpriteAnimDef {
  /** Indices into the sprite's `files`, in play order */
  readonly frames: readonly number[];
  readonly fps: number;
  readonly mode: PlayMode;
  /** Index into `frames` that reduced motion and stills hold */
  readonly hold: number;
  /** Named moments (frame = index into `frames`): footsteps, a landing */
  readonly events: readonly SpriteEvent[];
}

export interface SpriteDef {
  readonly kind: 'pose' | 'still';
  readonly char: 'baokaka' | 'mocha';
  /** The artist's label (poses.json) */
  readonly label: string;
  /** The baked frame's box */
  readonly size: Pt2;
  /** The foot contact point: positioned on the node point */
  readonly anchor: Pt2;
  /** The top of the head: where the thought bubble's spring attaches */
  readonly head: Pt2;
  readonly hand?: Pt2;
  /** The ground footprint's x extent (the floor contact ellipse) */
  readonly foot: Pt2;
  /** Drawn at this scale at map size (1 for gameplay poses; stills are portrait-sized) */
  readonly mapScale: number;
  readonly group: SpriteGroup;
  readonly noMirror: boolean;
  /** Per frame, the file stem under `src/popup/assets/sprites/` (add `@2x.webp` / `@3x.webp`) */
  readonly files: readonly string[];
  /** Per frame, the bytes of the @2x and @3x files */
  readonly bytes: readonly (readonly [number, number])[];
  /** `main` always; `key` for cycles with the artist's cheaper keyframe version */
  readonly anims: Readonly<Record<string, SpriteAnimDef>>;
  /** Hash of everything the bake read: the next sync re-bakes the sprite only when it changes */
  readonly source: string;
}

export interface FloorDef {
  /** The shared soft contact ellipse (bible § 5: blur 3, 50 %) */
  readonly file: string;
  readonly bytes: readonly [number, number];
  readonly size: Pt2;
  /** The ellipse's centre and radii inside the image, pt */
  readonly ellipse: { readonly cx: number; readonly cy: number; readonly rx: number; readonly ry: number };
  readonly source?: string;
}

export interface SpriteManifest {
  readonly version: 1;
  readonly floor: FloorDef;
  readonly sprites: Readonly<Record<string, SpriteDef>>;
}

/** Art v2 § 2.4: @2x for DPR ≤ 2, else @3x. */
export const pickScale = (dpr: number): Scale => (dpr > 2 ? 3 : 2);

/** The file name of a frame stem at a scale. */
export const frameFile = (stem: string, scale: Scale): string => `${stem}@${scale}x.webp`;

/** Whether a sprite drawn for `facing` is mirrored (frames face right; `noMirror` poses never flip). */
export const isMirrored = (sprite: Pick<SpriteDef, 'noMirror'>, facing: Facing): boolean => facing === 'l' && !sprite.noMirror;

/**
 * A point of the frame (anchor, head, hand) as drawn for `facing`, still in frame space: mirrored,
 * x becomes `size.x − x` (Art v2 § 5: `anchor_x' = size_pt[0] − anchor_x`).
 */
export function framePoint(sprite: Pick<SpriteDef, 'size' | 'noMirror'>, p: Pt2, facing: Facing): Pt2 {
  return isMirrored(sprite, facing) ? [sprite.size[0] - p[0], p[1]] : p;
}

/**
 * The SVG transform that draws the frame (an `<image>` at 0,0 of `size`) with its anchor on (x, y),
 * at `scale`, mirrored about the anchor for `facing: 'l'`, so the foot point never jumps.
 */
export function spriteTransform(sprite: Pick<SpriteDef, 'anchor' | 'noMirror'>, facing: Facing, x: number, y: number, scale = 1): string {
  const sx = isMirrored(sprite, facing) ? -scale : scale;
  return `matrix(${num(sx)} 0 0 ${num(scale)} ${num(x - sx * sprite.anchor[0])} ${num(y - scale * sprite.anchor[1])})`;
}

/** Applies `spriteTransform`'s matrix to a frame point (tests, bubble anchors). */
export function toPage(sprite: Pick<SpriteDef, 'anchor' | 'noMirror'>, facing: Facing, x: number, y: number, p: Pt2, scale = 1): Pt2 {
  const sx = isMirrored(sprite, facing) ? -scale : scale;
  return [x + sx * (p[0] - sprite.anchor[0]), y + scale * (p[1] - sprite.anchor[1])];
}

/** A point relative to the anchor (his feet at the origin), as drawn for `facing`. */
export function fromAnchor(sprite: Pick<SpriteDef, 'anchor' | 'noMirror'>, p: Pt2, facing: Facing = 'r', scale = 1): Pt2 {
  return toPage(sprite, facing, 0, 0, p, scale);
}

const num = (n: number): string => String(Math.round(n * 1000) / 1000);

/**
 * Checks a manifest's internal consistency (the test runs it on the committed one; the loader
 * trusts it). Returns the problems, empty when it is sound.
 */
export function validateManifest(m: SpriteManifest): string[] {
  const out: string[] = [];
  const inBox = (s: SpriteDef, p: Pt2, what: string, id: string, slack = 0) => {
    if (!(p[0] >= -slack && p[0] <= s.size[0] + slack && p[1] >= -slack && p[1] <= s.size[1] + slack)) out.push(`${id}: ${what} ${p.join(',')} outside the ${s.size.join('×')} box`);
  };
  if (m.version !== 1) out.push(`version ${String(m.version)}`);
  for (const [id, s] of Object.entries(m.sprites)) {
    if (!/^[a-z]+[.-][a-z0-9-]+$/.test(id)) out.push(`${id}: bad id`);
    if (!(s.size[0] > 0 && s.size[1] > 0)) out.push(`${id}: empty size`);
    if (s.files.length === 0) out.push(`${id}: no frames`);
    if (s.bytes.length !== s.files.length) out.push(`${id}: ${s.bytes.length} byte counts for ${s.files.length} frames`);
    if (new Set(s.files).size !== s.files.length) out.push(`${id}: duplicate frame files`);
    inBox(s, s.anchor, 'anchor', id);
    inBox(s, s.head, 'head', id);
    if (s.hand) inBox(s, s.hand, 'hand', id);
    if (!(s.foot[0] <= s.foot[1])) out.push(`${id}: foot extent reversed`);
    if (!(s.mapScale > 0)) out.push(`${id}: mapScale`);
    if (!s.anims.main) out.push(`${id}: no main animation`);
    for (const [name, a] of Object.entries(s.anims)) {
      const where = `${id}/${name}`;
      if (a.frames.length === 0) out.push(`${where}: no frames`);
      for (const f of a.frames) if (!(Number.isInteger(f) && f >= 0 && f < s.files.length)) out.push(`${where}: frame ${f} is not one of ${s.files.length}`);
      if (!(a.fps > 0 && a.fps <= 30)) out.push(`${where}: fps ${a.fps}`);
      if (!(a.hold >= 0 && a.hold < a.frames.length)) out.push(`${where}: hold ${a.hold}`);
      for (const e of a.events) if (!(e.frame >= 0 && e.frame < a.frames.length)) out.push(`${where}: event ${e.name} at frame ${e.frame}`);
    }
  }
  return out;
}
