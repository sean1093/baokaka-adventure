import type { Rgb } from '../../art/palette';
import type { PartPreset } from '../core/types';

/**
 * The environment bitmaps' contract (#96; popup art bible § 9.1; GDD § 3.9): what
 * `npm run bake:popup` (`scripts/bake-popup.ts`) writes to `src/popup/env/env.gen.ts` next to the
 * WebP files in `src/popup/assets/env/`, and what the game reads. Every box is in page units (one
 * unit is one CSS px on a 390-wide phone); every file is baked at `ENV_SCALE` px per unit.
 *
 * - **Backdrops** (z0–z2: sky, skyline, landmark, floor page, gutter, page block, grain): one
 *   bitmap per art key, drawn at `box` (the page's view box: the page, the floor page's
 *   widening and the page block). Graded with its chapter's environment grade.
 * - **Parts:** one bitmap per state (and per lifted state for parts the finger drags), with the
 *   cut-edge rim and stacked shadow baked in. `box` is the art in the part's local space (the same
 *   space as the kit's `PRESET_ART[preset].box`); rotary parts turn about `pivot`, flaps fold
 *   about `hinge` (a local y). Never graded (touchables are never graded; printed parts are lit by
 *   their own page).
 * - **Cut-outs** (GDD § 3.9 layer 2): a static bitmap a page places with `PageDef.cutouts`; `box`
 *   in its local space, the origin where the page puts it. Graded with its chapter.
 */

/** px per page unit in every environment bitmap (bible § 9.1: WebP @2x). */
export const ENV_SCALE = 2;

/** A rectangle in page units. */
export interface EnvBox {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** One baked WebP: its path under `src/popup/assets/env/` (no extension) and its size in bytes. */
export interface EnvFile {
  readonly file: string;
  readonly bytes: number;
}

export interface BackdropEntry extends EnvFile {
  readonly chapter: number;
  /** The environment grade baked in (identity for chapters 0–2) */
  readonly grade: Rgb;
  readonly box: EnvBox;
  /** A hash of everything the bake read (idempotence) */
  readonly source: string;
}

export interface PartEntry {
  /** The preset this art was drawn for (the bake lints touchables against the grandparent rule) */
  readonly preset: PartPreset;
  readonly box: EnvBox;
  /** Rotary parts (`wheel`, `section`): the turning point in local units */
  readonly pivot?: readonly [number, number];
  /** Flaps: the fold line's local y */
  readonly hinge?: number;
  /** One bitmap per state; a state not listed draws the first listed one */
  readonly states: Readonly<Record<string, EnvFile>>;
  /** Draggable parts: the same states lifted over a dropped shadow (bible § 4.1, § 9.1) */
  readonly lifted?: Readonly<Record<string, EnvFile>>;
  readonly source: string;
}

export interface CutoutEntry extends EnvFile {
  readonly chapter: number;
  readonly grade: Rgb;
  readonly box: EnvBox;
  readonly source: string;
}

export interface EnvManifest {
  readonly version: 1;
  readonly scale: typeof ENV_SCALE;
  readonly backdrops: Readonly<Record<string, BackdropEntry>>;
  readonly parts: Readonly<Record<string, PartEntry>>;
  readonly cutouts: Readonly<Record<string, CutoutEntry>>;
}

/** The file name of a baked bitmap (`ENV_SCALE` is in the name, as the sprites' `@2x`). */
export const envFile = (stem: string): string => `${stem}@${ENV_SCALE}x.webp`;

/** Presets the finger drags: their art gets a lifted variant (bible § 4.1 drag state). */
export const DRAGGED: ReadonlySet<PartPreset> = new Set<PartPreset>(['tab', 'slider', 'wheel', 'flap']);

/** Every file a manifest names. */
export function manifestFiles(m: EnvManifest): EnvFile[] {
  return [
    ...Object.values(m.backdrops),
    ...Object.values(m.parts).flatMap((p) => [...Object.values(p.states), ...Object.values(p.lifted ?? {})]),
    ...Object.values(m.cutouts),
  ];
}

const isBox = (b: EnvBox | undefined) => b !== undefined && [b.x, b.y, b.w, b.h].every(Number.isFinite) && b.w > 0 && b.h > 0;

/** Problems with a manifest (empty when sound): bad boxes, empty state sets, missing pivots, lifted gaps. */
export function validateEnvManifest(m: EnvManifest): string[] {
  const out: string[] = [];
  if (m.scale !== ENV_SCALE) out.push(`scale ${m.scale} is not ${ENV_SCALE}`);
  for (const [key, b] of Object.entries(m.backdrops)) if (!isBox(b.box)) out.push(`backdrop ${key}: bad box`);
  for (const [key, c] of Object.entries(m.cutouts)) if (!isBox(c.box)) out.push(`cutout ${key}: bad box`);
  for (const [key, p] of Object.entries(m.parts)) {
    if (!isBox(p.box)) out.push(`part ${key}: bad box`);
    if (Object.keys(p.states).length === 0) out.push(`part ${key}: no states`);
    if ((p.preset === 'wheel' || p.preset === 'section') && p.pivot === undefined) out.push(`part ${key}: a rotary part needs a pivot`);
    if (p.preset === 'flap' && p.hinge === undefined) out.push(`part ${key}: a flap needs a hinge`);
    if (DRAGGED.has(p.preset)) {
      for (const s of Object.keys(p.states)) if (p.lifted?.[s] === undefined) out.push(`part ${key}: no lifted variant of '${s}'`);
    } else if (p.lifted !== undefined) out.push(`part ${key}: a ${p.preset} is never dragged, so it has no lifted variant`);
  }
  return out;
}
