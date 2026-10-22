import type { PartPreset } from '../core/types';

/**
 * The page's layers, back to front: GDD § 3.9's order with the popup bible § 2.2 tunnel-book depths
 * mapped onto it (decision D-50).
 *
 * | Layer        | GDD § 3.9                 | Bible z | What                                                     |
 * |--------------|---------------------------|---------|----------------------------------------------------------|
 * | `backdrop`   | 1 baked backdrop           | z0–z2   | sky, pinholes, moon, clouds, skyline, landmark (V-fold), floor page, gutter, page block |
 * | `strip`      | (1, #193)                  | z0      | a moving 月亮線 car's window strip: the view sliding past, under the car's frame |
 * | `cutouts`    | 2 standing cut-outs        | z2      | track pits, the 土地公 when shown                        |
 * | `parts-mid`  | 4 parts (z3)               | z3      | carriages (the train), sections, lifts, loops: behind the ledges they run past |
 * | `floor`      | 3 floor plane              | z4      | the gameplay ledges, ramps, crossing rails, perch furniture |
 * | `parts-near` | 4 parts (z4)               | z4      | touchables and the rest, attractors                       |
 * | `creatures`  | 5 creatures                | as ledge| origami pigeons, geese…, a park page's drifting fireflies |
 * | `actors`     | 6 Baokaka and Mocha        | as ledge| the standees                                              |
 * | `fx`         | 7 bubbles and effects      | as owner| the thought bubble, barks, then perch paws (and a perch's hint halo), subtitles, the ghost hand |
 * | `foreground` | (bible § 2.2)              | z5      | one card in a near corner, never over a touchable or the walk graph |
 * | `hit`        | 8 hit layer                | —       | invisible shapes from each part's `hit`                   |
 *
 * GDD § 3.9 draws the floor before every part; the bible's z table puts mid parts (z3, the train)
 * behind the near ledges (z4) they slide past, so parts split around the floor by their z.
 */
export const LAYERS = ['backdrop', 'strip', 'cutouts', 'parts-mid', 'floor', 'parts-near', 'creatures', 'actors', 'fx', 'foreground', 'hit'] as const;
export type LayerId = (typeof LAYERS)[number];

/** Layers whose content moves between ticks (what the animated-node budget counts). */
export const ANIMATED_LAYERS: ReadonlySet<LayerId> = new Set<LayerId>(['strip', 'parts-mid', 'floor', 'parts-near', 'creatures', 'actors', 'fx']);

export type Z = 0 | 1 | 2 | 3 | 4 | 5;

/** Each preset's tunnel-book depth (bible § 2.2): z3 sits behind the ledges, z4 in front. */
export const PRESET_Z: Readonly<Record<PartPreset, Z>> = {
  tab: 4,
  slider: 4,
  wheel: 4,
  flap: 4,
  section: 3,
  gate: 4,
  button: 4,
  lift: 3,
  loop: 3,
  pushable: 4,
  light: 4,
  blowable: 4,
  carrier: 4,
  prop: 4,
};

/** Tilt parallax per depth (bible § 2.3; the tilt itself is polish, #136). */
export const PARALLAX: Readonly<Record<Z, number>> = { 0: 0, 1: 0.15, 2: 0.3, 3: 0.5, 4: 0.7, 5: 1 };

/** Each layer's depth (the table above). */
export const LAYER_Z: Readonly<Record<LayerId, Z>> = {
  backdrop: 0,
  strip: 0,
  cutouts: 2,
  'parts-mid': 3,
  floor: 4,
  'parts-near': 4,
  creatures: 4,
  actors: 4,
  fx: 4,
  foreground: 5,
  hit: 4,
};

/**
 * A layer's tilt parallax (#136), as a share of `TILT_SHIFT_PX`: its depth's `PARALLAX` relative to
 * the play plane (z4: the ledges, the touchables, the characters and the hit layer), which stays
 * where the gestures' maths puts it. The backdrop slides the other way, the foreground card a
 * little further; between them the pop-ups separate as the book leans.
 */
export const layerParallax = (id: LayerId): number => PARALLAX[LAYER_Z[id]] - PARALLAX[4];

/** GDD § 3.9: at most this many animated DOM/SVG nodes on a page. */
export const ANIMATED_NODE_BUDGET = 150;
