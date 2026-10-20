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
export type LedgeStyle = 'brick' | 'rug' | 'playmat' | 'crib' | 'carBody' | 'carBodyXinyi' | 'granite' | 'shopFloor' | 'balcony' | 'parkPath' | 'boardwalk' | 'stage'
  | 'carBodySongshan' | 'campusPath' | 'lakeside' | 'gallery' | 'libraryFloor' | 'desk' | 'bookPage';

/** The near-corner foreground card. */
export type ForegroundCard = 'plant' | 'blocks' | 'luggage' | 'shrub' | 'azalea';

export interface StageDress {
  /** The ledges' material for every run, or per run by its feet line (first match by `y` ≤ `below`) */
  readonly ledge?: LedgeStyle | readonly { readonly below: number; readonly style: LedgeStyle }[];
  /** From this x on, a run is made of another material (0-4: the play-mat stops at the balcony door) */
  readonly ledgeSplit?: { readonly x: number; readonly style: LedgeStyle };
  /** Perch ids whose furniture the backdrop draws */
  readonly ownPosts?: readonly Id[];
  /** The foreground card; `null` for none */
  readonly foreground?: ForegroundCard | null;
  /**
   * How a conditional crossing shows while it is closed: the stage's `rail` (default), or `none`
   * when the backdrop's own art is the obstacle and a part is the way across (2-1's gap, which the
   * umbrella bridges; 2-6's stream, which the painted bridge pops up over)
   */
  readonly crossing?: 'rail' | 'none';
  /** Fireflies drifting live over the page (bible § 6: the only moving pinholes in the game), how many */
  readonly fireflies?: number;
}

/** The dress per backdrop key. A key without one keeps the placeholder stage's look. */
export const STAGE_DRESS: Readonly<Record<string, StageDress>> = {
  // 序章 home: the crib's mattress, then 巧拼 everywhere; a stack of ㄅㄆㄇ blocks in the corner
  'c0/nursery-night': { ledge: [{ below: 360, style: 'crib' }, { below: 999, style: 'playmat' }], foreground: 'blocks' },
  'c0/living-room': { ledge: 'playmat', foreground: 'blocks' },
  'c0/zhuazhou-corner': { ledge: 'playmat', ownPosts: ['sofaArm', 'table', 'shelf'], foreground: null },
  'c0/home-window': { ledge: 'playmat', ledgeSplit: { x: 292, style: 'balcony' }, ownPosts: ['sill', 'rod', 'trainRoof'], foreground: null },
  // 台北車站
  'c1/car': { ledge: 'carBody', ownPosts: ['strap1', 'strap2', 'rack'], foreground: null },
  'c1/hall-night': { ledge: 'brick', foreground: 'luggage' },
  'c1/gates': { ledge: 'granite', ownPosts: ['counter', 'ticketMachine', 'robotLid'], foreground: null },
  'c1/hall': { ledge: 'granite', ownPosts: ['clock', 'lightbox'], foreground: 'luggage' },
  'c1/bento-shop': { ledge: [{ below: 360, style: 'shopFloor' }, { below: 999, style: 'granite' }], ownPosts: ['counter', 'b1Shelf'], foreground: null },
  // The concourse's granite on the left page, the platform's brick on the right
  'c1/bento-spread': { ledge: 'granite', ledgeSplit: { x: 195, style: 'brick' }, ownPosts: ['clock'], foreground: null },
  // 大安森林公園 (#115): the 信義線 car's body, then the station's granite platform past the gap
  'c2/xinyi-car': { ledge: 'carBodyXinyi', ledgeSplit: { x: 222, style: 'granite' }, ownPosts: ['strap', 'priority', 'bench'], foreground: null, crossing: 'none' },
  // The bandshell's stage boards above the lawn's paths
  'c2/bandshell': { ledge: [{ below: 460, style: 'stage' }, { below: 999, style: 'parkPath' }], ownPosts: ['lamp', 'crate'], foreground: 'shrub', fireflies: 5 },
  'c2/bridge': { ledge: 'parkPath', ownPosts: ['bench', 'railing'], foreground: 'shrub', fireflies: 6 },
  'c2/tree': { ledge: 'parkPath', ownPosts: ['stump', 'westFork', 'eastFork'], foreground: 'shrub', fireflies: 6 },
  'c2/pond': { ledge: 'boardwalk', ownPosts: ['pavilion', 'stone'], foreground: null, fireflies: 6 },
  'c2/painter-spread': { ledge: 'parkPath', ownPosts: ['lamp', 'easel', 'parasol'], foreground: null, crossing: 'none', fireflies: 4 },
  // 台灣大學 (#117): the 松山新店線 car's body, then the station's granite platform past the doors
  'c3/green-car': { ledge: 'carBodySongshan', ledgeSplit: { x: 284, style: 'granite' }, ownPosts: ['strap'], foreground: null },
  // 椰林大道's walkway between the parked bikes (the bikes are the obstacle: no rail)
  'c3/palm-avenue': { ledge: 'campusPath', ownPosts: ['palm'], foreground: null, crossing: 'none' },
  // 醉月湖's promenade, the nest's hummock on the bank and stone steps down to it; an azalea in the corner
  'c3/lake': { ledge: 'lakeside', ownPosts: ['bench', 'rock'], foreground: 'azalea' },
  'c3/fu-bell': { ledge: 'campusPath', ownPosts: ['palm', 'pillar'], foreground: null },
  // The stacks' gallery at the back, the reading room's floor in front (the shelves are the obstacle)
  'c3/stacks': { ledge: [{ below: 400, style: 'gallery' }, { below: 999, style: 'libraryFloor' }], ownPosts: ['cart'], foreground: null, crossing: 'none' },
  // The desk, the giant book from x 112, the stack of books 藍教授 sits on (the bookmark page bridges the gap)
  'c3/book-spread': { ledge: 'desk', ledgeSplit: { x: 112, style: 'bookPage' }, ownPosts: ['lamp', 'catPage', 'near'], foreground: null, crossing: 'none' },
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
