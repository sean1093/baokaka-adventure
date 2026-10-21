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
  | 'carBodySongshan' | 'campusPath' | 'lakeside' | 'gallery' | 'libraryFloor' | 'desk' | 'bookPage'
  | 'neonStreet' | 'arcadeShelf' | 'karaokeStage'
  | 'marketLane' | 'stallFloor' | 'stallShelf' | 'stallCounter'
  | 'carBodyWenhu' | 'terminalFloor' | 'deckBoards' | 'bridgeFloor' | 'catwalk'
  | 'zooPlatform' | 'zooPlaza' | 'gondolaDeck' | 'teaTerrace' | 'teaDeck' | 'chahai' | 'cabinBench' | 'cabinRack' | 'cabinGlass' | 'gardenPath' | 'gardenPathJar' | 'gardenTerrace';

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
  /** False when the backdrop draws what a carriage hangs over (4-4's claw over the plush pit, #119): no track pit */
  readonly trackPit?: boolean;
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
  // 西門町 (#119): the 板南線 car's body, then the platform's granite past the doors
  'c4/blue-car': { ledge: 'carBody', ledgeSplit: { x: 284, style: 'granite' }, ownPosts: ['strap', 'header'], foreground: null },
  // 紅樓's plaza: the pavements either side of the turning house (the house is the way across)
  'c4/red-house': { ledge: 'neonStreet', ownPosts: ['lamp', 'window', 'eave'], foreground: null, crossing: 'none' },
  'c4/neon-alley': { ledge: 'neonStreet', ownPosts: ['box', 'behind'], foreground: null },
  // Inside the claw machine: its prize shelves either side of the plush pit
  'c4/claw-machine': { ledge: 'arcadeShelf', ownPosts: ['stool', 'coinSlot', 'pile'], foreground: null, crossing: 'none', trackPit: false },
  'c4/street-dance': { ledge: 'neonStreet', ownPosts: ['lamp', 'crate', 'archMid', 'sign'], foreground: null },
  // The arcade's pavement on the left page, the karaoke stage on the right (the shutter is the way on)
  'c4/karaoke-spread': { ledge: 'neonStreet', ledgeSplit: { x: 196, style: 'karaokeStage' }, ownPosts: ['sign', 'amp'], foreground: null, crossing: 'none' },
  // 士林夜市 (#122): the 淡水信義線 car's body
  'c5/red-car': { ledge: 'carBodyXinyi', ownPosts: ['strap', 'rack'], foreground: null },
  // The prize shelf behind the dart counter over the lane (the basket is the way up: no rail)
  'c5/balloon-stall': { ledge: [{ below: 400, style: 'stallShelf' }, { below: 999, style: 'marketLane' }], ownPosts: ['pole', 'awning'], foreground: null, crossing: 'none' },
  // The lane, then the 雞排 stall's tiled floor past the counter (the counter is the backdrop's)
  'c5/market-lane': { ledge: 'marketLane', ledgeSplit: { x: 297, style: 'stallFloor' }, ownPosts: ['lantern', 'bell'], foreground: null, crossing: 'none' },
  'c5/pachinko': { ledge: 'stallFloor', ownPosts: ['stool', 'knob'], foreground: null },
  // The chairs' top shelf over the corner's tiled floor (the reclined chairs are the steps: no rail)
  'c5/massage-chairs': { ledge: [{ below: 400, style: 'stallShelf' }, { below: 999, style: 'stallFloor' }], ownPosts: ['sign', 'box1', 'box2', 'seat'], foreground: null, crossing: 'none' },
  // Inside the stall behind its counter (the inner ledge's face is the counter), the lane in front
  'c5/scallion-spread': { ledge: [{ below: 450, style: 'stallCounter' }, { below: 999, style: 'marketLane' }], ownPosts: ['lantern', 'sign', 'trays'], foreground: null, crossing: 'none' },
  // 松山機場 (#124): the 文湖線 car's body, then the station's terrazzo platform past the doors
  'c6/front-car': { ledge: 'carBodyWenhu', ledgeSplit: { x: 306, style: 'terminalFloor' }, ownPosts: ['dash', 'strap'], foreground: null, crossing: 'none' },
  // The hall's floor either side of the carousel (the belt is the way across: no rail)
  'c6/baggage-hall': { ledge: 'terminalFloor', ownPosts: ['island', 'button', 'caseB'], foreground: null, crossing: 'none' },
  'c6/observation-deck': { ledge: 'deckBoards', ownPosts: ['bench', 'rail'], foreground: null },
  // The lounge's floor, then the jet bridge's tunnel floor; the A321's sill (the plank is the way across)
  'c6/jet-bridge': { ledge: 'terminalFloor', ledgeSplit: { x: 118, style: 'bridgeFloor' }, ownPosts: ['roof', 'bridgeTop'], foreground: null, crossing: 'none', trackPit: false },
  'c6/tower-catwalk': { ledge: 'catwalk', ownPosts: ['antenna', 'crate'], foreground: null },
  // The customs hall's floor: the queue, and under the officer's counter (the belt is the way across)
  'c6/customs-spread': { ledge: 'terminalFloor', ownPosts: ['rope', 'hood', 'counter'], foreground: null, crossing: 'none' },
  // 貓空 (#126): 動物園 station's elevated platform, then the zoo's plaza down the stairs
  'c7/zoo-station': { ledge: [{ below: 450, style: 'zooPlatform' }, { below: 999, style: 'zooPlaza' }], ownPosts: ['bench', 'lamp'], foreground: null },
  // The gondola stations' decks (the cable is the way up: no rail)
  'c7/gondola-station': { ledge: 'gondolaDeck', ownPosts: ['booth'], foreground: null, crossing: 'none' },
  // The tea terraces: stepped box folds of clipped tea over stone walls
  'c7/tea-terraces': { ledge: [{ below: 470, style: 'teaTerrace' }, { below: 999, style: 'gardenPath' }], ownPosts: ['bench', 'stool', 'shed'], foreground: null },
  // Inside the 水晶車廂: the benches either end, the rack, the glass floor (the seat is the way up: no rail)
  'c7/crystal-cabin': { ledge: [{ below: 400, style: 'cabinRack' }, { below: 430, style: 'cabinBench' }, { below: 999, style: 'cabinGlass' }], ownPosts: ['basket'], foreground: null, crossing: 'none' },
  // The tea house's deck either side of the pool (the cups are the way across)
  'c7/giant-teapot': { ledge: [{ below: 470, style: 'teaDeck' }, { below: 999, style: 'chahai' }], ownPosts: ['tray', 'tins'], foreground: null, crossing: 'none' },
  // The garden's path, its terraces up to the celery bed (the bear is the way up)
  'c7/celery-garden': { ledge: [{ below: 470, style: 'gardenTerrace' }, { below: 999, style: 'gardenPathJar' }], ownPosts: ['scarecrow', 'basket', 'post'], foreground: null, crossing: 'none' },
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
