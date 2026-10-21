import { PRESET_ART, PRESET_DEFS, kitDefs, type KitCtx, type PartArtOptions, type PartPreset, type PresetArt } from '../../art';
import type { PageDef } from '../../core/types';
import { backdropImage, cutoutImage, partImage, type EnvImage, type PartImage } from '../../env/loader';
import { campusPoster, goose, magpie } from './campus';
import { backpacker, origamiPigeon, shushuCloud } from './creatures';
import { commuter, egret, jogger, painter, shiba, squirrel, sweeper, turtle } from './park';
import { origamiBird, placeholderBackdrop } from './placeholders';
import { crowdLegs, pachinkoUncle, passengers, strayDog } from './market';
import { nightHerons } from './airport';
import { pangolin, sleepingBear, teaFarmer } from './maokong';
import { eggBasket } from './beitou';
import { busker, dancers, karaokeKing } from './ximen';

/**
 * The art registry (GDD § 3.5, § 3.9): an art key → what draws it. In order:
 * 1. a **baked bitmap** (#96, `npm run bake:popup`; `env/loader.ts`): a backdrop, a part's bitmap
 *    per state (with its lifted drag variant), a cut-out;
 * 2. else a placeholder drawn live: a part to its preset's kit art (`src/popup/art/presets.ts`,
 *    #139), a backdrop to the chapter's placeholder stage, a creature to an origami bird, a cut-out
 *    to nothing. So M0/M1 pages already look like paper, not coloured cards, and an unknown key is
 *    never an error. Each missing key is logged once in dev builds, so the gap list is visible in
 *    the console.
 *
 * The in-game path calls this with a `filters: false` context (GDD § 3.9: no runtime SVG filters on
 * moving parts); PageLab may pass `filters: true` to preview the bake.
 */

/** Draws a page's backdrop (sky, standing cut-outs, floor page, gutter) in page units. */
export type BackdropArt = (ctx: KitCtx, def: Pick<PageDef, 'chapter'>) => string;
/** Draws a creature in its local space: feet at the origin, facing +x; `pos` is its current position key. */
export type CreatureArt = (ctx: KitCtx, pos?: string) => string;

/** Part art registered under an explicit key (e.g. 'c1/train-blue'). Empty until chapter art lands. */
const KEYED: Readonly<Record<string, PresetArt>> = {};
/** Backdrops by key (e.g. 'c1/hall-night'). Empty until #96 bakes them. */
const BACKDROPS: Readonly<Record<string, BackdropArt>> = {};
/** Creatures by key (#108: origami creatures and the paper-style cast, `creatures.ts`). */
const CREATURES: Readonly<Record<string, CreatureArt>> = {
  'common/pigeon': origamiPigeon,
  // 咻咻 (#128): the little cloud, raining up in its cloud or following them on the floor
  'common/shushu': shushuCloud,
  'c1/backpacker': backpacker,
  // 大安森林公園 (#115, `park.ts`): the paper-style cast and the origami animals
  'c2/commuter': commuter,
  'c2/sweeper': sweeper,
  'c2/jogger': jogger,
  'c2/painter': painter,
  'c2/dog': shiba,
  'c2/turtle': turtle,
  'c2/squirrel': squirrel,
  'c2/egret': egret,
  // 台灣大學 (#117, `campus.ts`): the ad poster's student, the goose of 醉月湖, 藍教授
  'c3/poster': campusPoster,
  'c3/goose': goose,
  'c3/magpie': magpie,
  // 西門町 (#119, `ximen.ts`): the dance crew, the busker, 走音天王
  'c4/dancers': dancers,
  'c4/busker': busker,
  'c4/karaoke-king': karaokeKing,
  // 士林夜市 (#122, `market.ts`): the dozing passengers, the crowd of legs, the 彈珠台阿伯, the stray dog
  'c5/passengers': passengers,
  'c5/crowd-legs': crowdLegs,
  'c5/pachinko-uncle': pachinkoUncle,
  'c5/stray-dog': strayDog,
  // 松山機場 (#124, `airport.ts`): the night herons roosting on 6-4's gangplank
  'c6/night-birds': nightHerons,
  // 貓空 (#126, `maokong.ts`): 7-1's night herons on the plaza (the same flock as 6-4's) and the
  // pangolin in the planter, 7-3's tea farmer, 7-6's 黑糖 asleep on the celery bed
  'c7/night-heron': (ctx, pos) => nightHerons(ctx, pos === 'sky' ? 'sky' : 'roost'),
  'c7/pangolin': pangolin,
  'c7/tea-farmer': teaFarmer,
  'c7/sleeping-bear': sleepingBear,
  // 北投 (#130, `beitou.ts`): 8-3's 溫泉阿嬤's basket of hot-spring eggs (she sits with her hat in its part)
  'c8/hot-spring-granny': eggBasket,
};

export type ArtKind = 'part' | 'backdrop' | 'creature' | 'cutout';

const reported = new Set<string>();

/** Notes (once per kind and key, dev builds only) that `key` has no art and shows a placeholder. */
export function noteFallback(kind: ArtKind, key: string): void {
  if (!import.meta.env.DEV) return;
  const k = `${kind}:${key}`;
  if (reported.has(k)) return;
  reported.add(k);
  console.info(`[art] no ${kind} art for '${key}' yet; drawing the placeholder`);
}

/** Forgets which fallbacks were logged (tests). */
export function resetFallbackLog(): void {
  reported.clear();
}

/** The live art for a part: its key's own art if registered, otherwise its preset's default kit art. */
export function partArt(key: string, preset: PartPreset): PresetArt {
  const own = KEYED[key];
  if (own === undefined && isPlaceholder(key)) noteFallback('part', key);
  return own ?? PRESET_ART[preset];
}

/** True when `key` has no art of its own yet (the part shows its preset's placeholder). */
export const isPlaceholder = (key: string): boolean => !(key in KEYED) && partImage(key, '') === null;

/**
 * A part's baked bitmap for a state (the first state's when the art has none for it; the lifted
 * variant while dragged, when baked), or null: the view then draws `partArt` live.
 */
export function partBitmap(key: string, state: string, lifted = false): PartImage | null {
  return partImage(key, state, { lifted });
}

/** A page's baked backdrop, or null (`backdropArt` draws the placeholder stage live). */
export function backdropBitmap(key: string): EnvImage | null {
  const img = backdropImage(key);
  if (img === null) noteFallback('backdrop', key);
  return img;
}

/** A standing cut-out's baked bitmap, or null (an unknown cut-out draws nothing, logged once in dev). */
export function cutoutBitmap(key: string): EnvImage | null {
  const img = cutoutImage(key);
  if (img === null) noteFallback('cutout', key);
  return img;
}

/** A part's art as a self-contained SVG fragment (its scoped defs plus the drawing). */
export function renderPart(ctx: KitCtx, key: string, preset: PartPreset, opts: PartArtOptions = {}): string {
  return kitDefs(ctx, PRESET_DEFS) + partArt(key, preset).draw(ctx, opts);
}

/** The art for a page's backdrop: its key's own, else the chapter's placeholder stage. */
export function backdropArt(key: string): BackdropArt {
  const own = BACKDROPS[key];
  if (own === undefined) noteFallback('backdrop', key);
  return own ?? placeholderBackdrop;
}

/** True when backdrop `key` has art of its own or a baked bitmap (PageLab's art-key report). */
export const hasBackdropArt = (key: string): boolean => key in BACKDROPS || backdropImage(key) !== null;

/** True when creature `key` has art of its own (PageLab's art-key report). */
export const hasCreatureArt = (key: string): boolean => key in CREATURES;

/** The art for a creature: its key's own, else the origami bird. */
export function creatureArt(key: string): CreatureArt {
  const own = CREATURES[key];
  if (own === undefined) noteFallback('creature', key);
  return own ?? origamiBird;
}
