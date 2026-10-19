/**
 * The authoring table for the character sprites (#94): what `npm run sync:sprites`
 * (`scripts/sync-sprites.ts`) adds to the character artist's bake (`docs/art/v2/baked/poses.json`
 * and `manifest.json`) when it bakes the standee frames into `src/popup/assets/sprites/`.
 *
 * The artist owns the frames, sizes, foot anchors, fps and loop flags; this table owns the game's
 * readings of them: which chapter first needs a pose (lazy loading), how a non-cycle plays, the
 * frame reduced motion holds, events, the easel tab, poses that must not mirror, and hand-placed
 * `head` / `hand` points where the automatic ones (`scripts/sync-sprites.ts`) are wrong.
 * Points are in the artist's frame space (pt from the source frame's top-left, as `anchor_pt`).
 *
 * Changing this file changes the sprites' source hash, so the next sync re-bakes them.
 */

export type PlayMode = 'loop' | 'once' | 'pingpong';

/**
 * `0`: the core set every page preloads; `n`: first needed in chapter n (preloaded by chapter n's
 * pages and every later chapter's); `'ui'`: outside the pages (album, photo, ending).
 */
export type SpriteGroup = number | 'ui';

export interface SpriteEvent {
  readonly frame: number;
  readonly name: string;
}

export interface PoseConfig {
  readonly group?: SpriteGroup;
  /** How a multi-frame pose plays; default `loop` for the artist's cycles, `once` otherwise */
  readonly mode?: PlayMode;
  /** Override the artist's fps */
  readonly fps?: number;
  /** The frame (index into the pose's frames) reduced motion and stills hold; default 0 */
  readonly hold?: number;
  readonly events?: readonly SpriteEvent[];
  /** Bible § 5: the kraft fold-back easel tab behind the feet, on standing poses */
  readonly easel?: boolean;
  /** A pose that faces the reader (or reads wrong mirrored): never mirrored for `facing: 'l'` */
  readonly noMirror?: boolean;
  /** Bubble anchor (the top of the head), overriding the automatic one */
  readonly head?: readonly [number, number];
  /** Hand point (what he holds or reaches with), when a pose has a meaningful one */
  readonly hand?: readonly [number, number];
}

/** Per pose, keyed `<char>.<pose>` (poses.json `characters.<char>.<pose>`). Unlisted poses take the defaults. */
export const POSE_CONFIG: Readonly<Record<string, PoseConfig>> = {
  // ——— 寶咖咖 (bible § 5 growth: crawl / sit until Ch7; stand holding a rail from 9-3; walk only on 10-6).
  // Word poses join with their word (GDD § 4.1): 掰掰 ch2 (wave), 不要！ ch3 (refuse),
  // 飛機！ ch6 (wonder); 嗶！ (ch1) is `point`. He falls asleep only in the ending. ———
  'baokaka.crawl': { events: [{ frame: 0, name: 'step' }, { frame: 4, name: 'step' }] },
  'baokaka.clap': { mode: 'loop' },
  // Not in the prologue (GDD § 4.3: no words, snacks or rides there; D-58), so they join in chapter 1
  'baokaka.point': { group: 1 },
  'baokaka.eat': { group: 1 },
  // 抱抱 is also the cuddle frame (GDD § 2.2.1 cuddling Mocha, from the prologue on; #95), so it is core
  'baokaka.hug': {},
  'baokaka.wonder': { group: 6 },
  'baokaka.wave': { group: 2, mode: 'loop' },
  'baokaka.cry': { mode: 'loop' },
  'baokaka.refuse': { group: 3, mode: 'loop' },
  'baokaka.sleep': { group: 'ui', mode: 'once', hold: 1 },
  // No mode shows the bounce since ride-giggle has its own frame (#141): out of the core set
  'baokaka.bounce': { group: 'ui', mode: 'loop' },
  'baokaka.pull': { group: 9, easel: true },
  'baokaka.wobble': { group: 9, mode: 'loop', easel: true },
  'baokaka.walk': { group: 10, easel: true },
  'baokaka.zhuazhou': { group: 'ui' },
  // #141's frames. look, watch, touch-watch and the 2-frame reach show from the prologue on, so
  // they are core; ride-giggle from chapter 1 (the first ride); carried from chapter 5 (5-3, 抱抱);
  // climb from chapter 7 (7-3).
  'baokaka.reach': { mode: 'pingpong' },
  'baokaka.giggle': { group: 1 },
  'baokaka.look': { mode: 'loop', fps: 1.5 },
  'baokaka.watch': { mode: 'pingpong', fps: 1.5 },
  'baokaka.carried': { group: 5 },
  'baokaka.climb': { group: 7 },
  // ——— 摩卡 ———
  'mocha.walk': { group: 10, easel: true },
  'mocha.sit': { easel: true },
  'mocha.jump': { mode: 'once', hold: 1, events: [{ frame: 2, name: 'land' }] },
  // perch, stretch, sleep and rub are drawn but no game state shows them yet (#95's map): they
  // load with the album, not with every page, to make room for #141's frames (D-58)
  'mocha.perch': { group: 'ui', easel: true },
  'mocha.stretch': { group: 'ui' },
  'mocha.sleep': { group: 'ui' },
  'mocha.push': { mode: 'once', events: [{ frame: 1, name: 'push' }] },
  'mocha.lure': { mode: 'loop', easel: true },
  // No locked parts, gaps or water in the prologue: glare, squeeze and puff join in chapter 1
  'mocha.puff': { group: 1, easel: true },
  'mocha.squeeze': { group: 1 },
  'mocha.rub': { group: 'ui', easel: true },
  'mocha.glare': { group: 1, easel: true },
  // In a box: a head-and-paws frame cut flat at the rim, drawn in front of the box art
  'mocha.inbox': {},
  'mocha.album': { group: 'ui', noMirror: true, easel: true },
};

/**
 * The artist's single stills (`docs/art/v2/baked/manifest.json`): the standing reference and the
 * expression heads. They are not gameplay frames; they bake with the same standee look for the
 * album, dialogue and PageLab. `mapScale` draws them at map scale beside the poses (the stand at
 * the height of his standing pull pose, Mocha's sit at his sitting pose).
 */
export const STILL_CONFIG: Readonly<Record<string, { readonly mapScale: number; readonly noMirror?: boolean; readonly easel?: boolean }>> = {
  'baokaka-stand': { mapScale: 0.5, easel: true },
  'mocha-sit': { mapScale: 0.28, easel: true },
};
/** Heads draw at the scale of their character's stand. */
export const HEAD_MAP_SCALE = { baokaka: 0.5, mocha: 0.28 } as const;

/**
 * The standee bake (bible § 5, § 9.1): padding around the source frame for the 3.2 pt border, the
 * cut line and the stacked shadow, in pt (the crop then trims to what the filter drew).
 */
export const BAKE_PAD = { l: 8, t: 8, r: 8, b: 14 } as const;
/** WebP quality of the re-encode (Pillow, `method=6`; the artist bakes at 88). */
export const WEBP_QUALITY = 86;
/** WebP alpha quality: the border's edge and the soft shadow are smooth, so lossy alpha holds up. */
export const ALPHA_QUALITY = 65;
/** Output scales (Art v2 § 2.4: @2x for DPR ≤ 2, else @3x). */
export const SCALES = [2, 3] as const;
