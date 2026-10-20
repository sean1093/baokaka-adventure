import type { Id, PageDef } from '../../core/types';
import { themeOf } from './placeholders';

/**
 * How a backdrop dresses the live stage (#108). The stage (`stage.ts`, drawn by `placeholders.ts`)
 * reads the walk graph: every surface Baokaka crawls on is a paper ledge, every perch gets a piece
 * of furniture, and one foreground card frames a near corner. A page's own art (its baked backdrop,
 * `env/sources.ts`) knows what those things *are* on that page, so it names them here:
 *
 * - `ledge`: what the ledges are made of — 巧拼 foam play-mat tiles at home, the crib's mattress
 *   on its slatted side, a 板南線 car body on its bogies, the concourse's granite walkway boxes,
 *   the bento shop's tiled floor, or the default brick platform / rug;
 * - `ownPosts`: perches whose furniture the backdrop itself draws (a hand strap, the 抓周 table,
 *   a clock), so the stage draws no pillar or bench under them;
 * - `foreground`: the near-corner card (bible § 2.2), or none.
 *
 * Keyed by backdrop art key (`PageDef.backdrop`). The game reads this small table at runtime; the
 * drawings themselves are baked.
 */

/** What a page's ledges are made of. */
export type LedgeStyle = 'brick' | 'rug' | 'playmat' | 'crib' | 'carBody' | 'granite' | 'shopFloor' | 'balcony';

/** The near-corner foreground card. */
export type ForegroundCard = 'plant' | 'blocks' | 'luggage';

export interface StageDress {
  /** The ledges' material for every run, or per run by its feet line (first match by `y` ≤ `below`) */
  readonly ledge?: LedgeStyle | readonly { readonly below: number; readonly style: LedgeStyle }[];
  /** From this x on, a run is made of another material (0-4: the play-mat stops at the balcony door) */
  readonly ledgeSplit?: { readonly x: number; readonly style: LedgeStyle };
  /** Perch ids whose furniture the backdrop draws */
  readonly ownPosts?: readonly Id[];
  /** The foreground card; `null` for none */
  readonly foreground?: ForegroundCard | null;
}

/** The dress per backdrop key. A key without one keeps the placeholder stage's look. */
export const STAGE_DRESS: Readonly<Record<string, StageDress>> = {
  // 序章 home: the crib's mattress, then 巧拼 everywhere; a stack of ㄅㄆㄇ blocks in the corner
  'c0/nursery-night': { ledge: [{ below: 360, style: 'crib' }, { below: 999, style: 'playmat' }], foreground: 'blocks' },
  'c0/living-room': { ledge: 'playmat', foreground: 'blocks' },
  'c0/zhuazhou-corner': { ledge: 'playmat', ownPosts: ['sofaArm', 'table', 'shelf'], foreground: null },
  'c0/home-window': { ledge: 'playmat', ledgeSplit: { x: 292, style: 'balcony' }, ownPosts: ['sill', 'rod', 'trainRoof'], foreground: null },
  // 台北車站
  'c1/hall-night': { ledge: 'brick', foreground: 'luggage' },
};

const NONE: StageDress = {};

/** A page's dress (its backdrop key's), or the placeholder stage's defaults. */
export const dressOf = (def: Pick<PageDef, 'backdrop'>): StageDress => STAGE_DRESS[def.backdrop] ?? NONE;

/** The ledge material for a run at feet line `y`: the dress's, else brick in the city and a rug indoors. */
export function ledgeStyleOf(def: Pick<PageDef, 'backdrop' | 'chapter'>, y: number): LedgeStyle {
  const l = dressOf(def).ledge;
  if (typeof l === 'string') return l;
  const hit = l?.find((r) => y <= r.below);
  return hit?.style ?? (themeOf(def) === 'room' ? 'rug' : 'brick');
}

/** True when the backdrop draws perch `id`'s furniture itself. */
export const ownsPost = (def: Pick<PageDef, 'backdrop'>, id: Id): boolean => dressOf(def).ownPosts?.includes(id) ?? false;
