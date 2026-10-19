import { PRESET_ART, PRESET_DEFS, kitDefs, type KitCtx, type PartArtOptions, type PartPreset, type PresetArt } from '../../art';

/**
 * The art registry (GDD § 3.5, § 3.9): a part's `art` key → what draws it. Until a key has its own
 * art (chapter art issues) or a baked bitmap (#96), the part falls back to its preset's kit art
 * (`src/popup/art/presets.ts`, #139), so M0/M1 pages already look like paper, not coloured cards.
 *
 * The in-game path calls this with a `filters: false` context (GDD § 3.9: no runtime SVG filters on
 * moving parts); PageLab may pass `filters: true` to preview the bake.
 */

/** Art registered under an explicit key (e.g. 'c1/train-blue'). Empty until chapter art lands. */
const KEYED: Readonly<Record<string, PresetArt>> = {};

/** The art for a part: its key's own art if registered, otherwise its preset's default kit art. */
export function partArt(key: string, preset: PartPreset): PresetArt {
  return KEYED[key] ?? PRESET_ART[preset];
}

/** True when `key` has no art of its own yet (the part shows its preset's placeholder). */
export const isPlaceholder = (key: string): boolean => !(key in KEYED);

/** A part's art as a self-contained SVG fragment (its scoped defs plus the drawing). */
export function renderPart(ctx: KitCtx, key: string, preset: PartPreset, opts: PartArtOptions = {}): string {
  return kitDefs(ctx, PRESET_DEFS) + partArt(key, preset).draw(ctx, opts);
}
