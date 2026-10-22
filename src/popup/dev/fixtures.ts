import { initialState, replay, step } from '../core';
import type { SimEvent } from '../core/events';
import type { BabyMode, Id, LineKey, PageDef, SimState, SolutionStep } from '../core/types';
import type { LearnKey } from '../content/words';
import type { NavState } from '../game/nav';
import { completePage, earnSticker, encodeSave, freshSave, keepPhoto, ProgressStore, SAVE_KEY, updateSettings, type Photo, type SaveV1, type Sticker } from '../game/progress';
import { registry as gameRegistry, type PageRegistry } from '../pages';
import type { StorageLike } from '../../shared/storage';
import { labPageById } from './labPages';
import type { AffordanceFlags } from '../view/affordance/look';
import type { GestureFlags } from '../view/gestures';

/**
 * Visual QA fixtures for 翻翻台北 (#92; docs/project/README.md § 5): named, deterministic game
 * states, each rendered full screen at `#/pagelab?fixture=<name>&still=1` with no lab chrome.
 * `scripts/visual-check.mjs` screenshots every one at 390×844 and 375×667 and `scripts/ui-check.mjs`
 * runs the audience-rule checks (R5, R6, reduced motion, flashing) on each: **the fixture list is
 * the screenshot list.** Later UI issues add theirs (cover, word ring, hint hand, sticker card,
 * photo, album, settings, chapter card).
 *
 * A fixture is a page id plus a step list (the solution-step language: inputs and `wait`s),
 * replayed through `core/step` from the page's initial state, so it never drifts from the engine.
 * `expect` pins what the fixture is meant to show; `fixtures.test.ts` fails when the engine (or a
 * page edit) moves the state away from it, which is the cue to update the steps, not the
 * expectation.
 *
 * Dev only, like the rest of `dev/`.
 */

export interface PopupFixture {
  /** Kebab-case, unique among popup and art lab fixtures (it is the screenshot's file name) */
  readonly name: string;
  /** A registered page id, or a lab-only stage (`labPages.ts`) */
  readonly page: Id;
  /** Replayed from the page's initial state; empty is the page as it opens */
  readonly steps: readonly SolutionStep[];
  /** What a reviewer should see (shown in the fixture index) */
  readonly note: string;
  /** What the final state must show: Baokaka's mode and/or an event of the last tick */
  readonly expect?: { readonly mode?: BabyMode; readonly event?: SimEvent['type'] };
  /**
   * What the page shows on top of the state (#140): gesture flags as if a finger were doing them
   * (hold-to-reveal, a drag), and affordance flags (a hint level, done knots, 長輩模式).
   */
  readonly show?: {
    readonly gesture?: Partial<GestureFlags>;
    readonly affordance?: AffordanceFlags;
    /** Subtitle lines on the page (#98): script keys, shown as the opening beat (≤ 3 lines a beat) */
    readonly talk?: readonly LineKey[];
    /** Words (#99): the word ring open, a word card up, the 「要！」 poke of a tap on Baokaka */
    readonly words?: { readonly ring?: boolean; readonly card?: LearnKey; readonly poke?: boolean };
    /** The hint ladder at this level for the fixture's state (#100: 0 nudge, 1 where, 2 how), the hint computed by the solver */
    readonly hint?: 0 | 1 | 2;
    /** The sticker pop over the bar's tray, as if just earned (#101) */
    readonly sticker?: Sticker;
    /** The photo moment up over a spread (#103), its slow-motion clock at `at` ms into the loop */
    readonly photo?: { readonly at: number };
    /** The still drawn this many ms into the last tick, not at its end (#120: a climb step in flight) */
    readonly stepAt?: number;
  };
  /**
   * The still's motion look: `motion` (default) draws the idle cues of full motion, `reduced` the
   * reduced-motion ones (the static double outline). The screenshot browser runs with reduced
   * motion, so the still pins its look; live, the OS setting decides.
   */
  readonly look?: 'motion' | 'reduced';
  /**
   * 大字 (#104): the page drawn at the big text scale under `[data-text-size="big"]` (a screen
   * fixture reads it from its save instead). `#/pagelab?fixture=<name>&text=big` (and
   * `UI_TEXT=big npm run check:ui`) does the same for any fixture.
   */
  readonly big?: boolean;
  /** A specimen sheet drawn instead of the page (`page` and `steps` still name a valid frame) */
  readonly sheet?: 'affordance-states' | 'sprites-anchors';
  /**
   * A screen of the game shell instead of the bare page (#97): where the navigation starts and the
   * save it reads (a seeded in-memory store; the real save is never touched). `page` and `steps`
   * still name a valid frame (the page under a page screen is `nav`'s).
   */
  readonly screen?: {
    readonly nav: NavState;
    readonly save: SaveV1;
    /** The page folded flat under its sticker card (#101; the save says which stickers it shows) */
    readonly card?: boolean;
    /** The chapter card of this chapter (#102), settled over the book on the quilt, its first beat of lines under it */
    readonly chapterCard?: number;
    /** The album as it opens after a spread (#103), every note on; `retaken`: a second shot to choose from */
    readonly albumAfter?: { readonly chapter: number; readonly retaken?: Photo };
    /** The chapter-end lines of this chapter over its finished spread, their first beat (#107) */
    readonly endLinesOf?: number;
    /** The card of this chapter while it isn't built: 「未完待續」 on its row, its line under it (#107) */
    readonly soonCard?: number;
    /** An old RPG save was found and deleted at this boot: the cover's one-time note (#109) */
    readonly farewell?: boolean;
    /**
     * The pages the § 2.8 rewards need (#113): the registered pages' count shows the 「淘氣大王」
     * cover and 「象山的日出」 as if the book were finished (the game's 65 by default)
     */
    readonly rewardTotal?: number;
  };
}

/** The saves the screen fixtures read (#97). */
const FRESH = freshSave();
/** 0-1 solved with both its stickers, the rest of the prologue and 1-1 solved, 1-2 current with its 淘氣 already earned. */
const PROLOGUE = (['c0p2', 'c0p3', 'c0p4', 'c1p1'] as const).reduce((s, id) => completePage(s, id, { moves: id === 'c0p4' ? 2 : 1 }), completePage(FRESH, 'c0p1', { mischief: true, tudigong: true, moves: 1 }));
const PLAYED = earnSticker(PROLOGUE, 'c1p2', 'mischief');
const LEFT_HANDED = updateSettings(PLAYED, { leftHand: true });
/** 大字 on (#104). */
const BIG_TEXT = updateSettings(PLAYED, { bigText: true });
/** 長輩模式 on over a player who chose 快 and no auto hints (#104): the held rows show 慢 and 15 秒. */
const ELDER_ON = updateSettings(updateSettings(PLAYED, { speed: 2, autoHint: 0 }), { elder: true });
const ON_PAGE: NavState = { base: { kind: 'page', id: 'c1p2', run: 0 }, layer: null };
/** 1-2 just completed: solved, its 淘氣 earned on the way, the 土地公 not found (#101). */
const C1P2_DONE = completePage(PLAYED, 'c1p2', { mischief: true, moves: 6 });
/** 0-1 solved without its 淘氣, 0-2…1-1 solved, 1-2 solved with it: the 目錄 shows each page's mischief (#101). */
const MISCHIEF_LIST = completePage((['c0p2', 'c0p3', 'c0p4', 'c1p1'] as const).reduce((s, id) => completePage(s, id), completePage(FRESH, 'c0p1', { tudigong: true })), 'c1p2', { mischief: true });
/** Chapter 1 up to its spread: 1-2 done (as `C1P2_DONE`), 1-3…1-5 solved, 1-6 current (#107). */
const AT_SPREAD = (['c1p3', 'c1p4', 'c1p5'] as const).reduce((s, id) => completePage(s, id, { moves: 3 }), C1P2_DONE);
/** …and 1-6 solved, its Frame A photo with 摩卡 kept: the chapter's treasure in the tray (#107). */
const C1_DONE = keepPhoto(completePage(AT_SPREAD, 'c1p6', { moves: 4 }), 1, { frame: 'A', mocha: true, at: Date.UTC(2026, 9, 19, 16, 20) });
const ON_SPREAD: NavState = { base: { kind: 'page', id: 'c1p6', run: 0 }, layer: null };
/** At 2-6 (#114): chapter 1 and 2-1 … 2-5 solved; then chapter 2 done, the 畫筆 photo kept. */
const AT_SPREAD_C2 = (['c2p1', 'c2p2', 'c2p3', 'c2p4', 'c2p5'] as const).reduce((s, id) => completePage(s, id, { moves: 3 }), C1_DONE);
const C2_DONE = keepPhoto(completePage(AT_SPREAD_C2, 'c2p6', { moves: 4 }), 2, { frame: 'A', mocha: true, at: Date.UTC(2026, 9, 19, 16, 50) });
const ON_SPREAD_C2: NavState = { base: { kind: 'page', id: 'c2p6', run: 0 }, layer: null };
/** At 3-6 (#116): chapters 1–2 and 3-1 … 3-5 solved; then chapter 3 done, the 書 photo kept. */
const AT_SPREAD_C3 = (['c3p1', 'c3p2', 'c3p3', 'c3p4', 'c3p5'] as const).reduce((s, id) => completePage(s, id, { moves: 3 }), C2_DONE);
const C3_DONE = keepPhoto(completePage(AT_SPREAD_C3, 'c3p6', { moves: 4 }), 3, { frame: 'A', mocha: true, at: Date.UTC(2026, 9, 19, 17, 20) });
const ON_SPREAD_C3: NavState = { base: { kind: 'page', id: 'c3p6', run: 0 }, layer: null };
/** At 4-6 (#118): chapters 1–3 and 4-1 … 4-5 solved; then chapter 4 done, the 麥克風 photo kept. */
const AT_SPREAD_C4 = (['c4p1', 'c4p2', 'c4p3', 'c4p4', 'c4p5'] as const).reduce((s, id) => completePage(s, id, { moves: 3 }), C3_DONE);
const C4_DONE = keepPhoto(completePage(AT_SPREAD_C4, 'c4p6', { moves: 4 }), 4, { frame: 'A', mocha: true, at: Date.UTC(2026, 9, 19, 17, 50) });
const ON_SPREAD_C4: NavState = { base: { kind: 'page', id: 'c4p6', run: 0 }, layer: null };
// Chapter 5 (#121): every page before 5-6 done, then 5-6 with its photo
const AT_SPREAD_C5 = (['c5p1', 'c5p2', 'c5p3', 'c5p4', 'c5p5'] as const).reduce((s, id) => completePage(s, id, { moves: 3 }), C4_DONE);
const C5_DONE = keepPhoto(completePage(AT_SPREAD_C5, 'c5p6', { moves: 4 }), 5, { frame: 'A', mocha: true, at: Date.UTC(2026, 9, 19, 18, 20) });
const ON_SPREAD_C5: NavState = { base: { kind: 'page', id: 'c5p6', run: 0 }, layer: null };
// Chapter 6 (#123): every page before 6-6 done, then 6-6 with its photo
const AT_SPREAD_C6 = (['c6p1', 'c6p2', 'c6p3', 'c6p4', 'c6p5'] as const).reduce((s, id) => completePage(s, id, { moves: 4 }), C5_DONE);
const C6_DONE = keepPhoto(completePage(AT_SPREAD_C6, 'c6p6', { moves: 4 }), 6, { frame: 'A', mocha: true, at: Date.UTC(2026, 9, 19, 18, 50) });
const ON_SPREAD_C6: NavState = { base: { kind: 'page', id: 'c6p6', run: 0 }, layer: null };
// Chapter 7 (#125): every page before 7-6 done, then 7-6 with its photo
const AT_SPREAD_C7 = (['c7p1', 'c7p2', 'c7p3', 'c7p4', 'c7p5'] as const).reduce((s, id) => completePage(s, id, { moves: 4 }), C6_DONE);
const C7_DONE = keepPhoto(completePage(AT_SPREAD_C7, 'c7p6', { moves: 4 }), 7, { frame: 'A', mocha: true, at: Date.UTC(2026, 9, 19, 19, 30) });
const ON_SPREAD_C7: NavState = { base: { kind: 'page', id: 'c7p6', run: 0 }, layer: null };
// Chapter 8 (#129): every page before 8-6 done, then 8-6 with its photo
const AT_SPREAD_C8 = (['c8p1', 'c8p2', 'c8p3', 'c8p4', 'c8p5'] as const).reduce((s, id) => completePage(s, id, { moves: 4 }), C7_DONE);
const C8_DONE = keepPhoto(completePage(AT_SPREAD_C8, 'c8p6', { moves: 5 }), 8, { frame: 'A', mocha: true, at: Date.UTC(2026, 9, 19, 20, 0) });
const ON_SPREAD_C8: NavState = { base: { kind: 'page', id: 'c8p6', run: 0 }, layer: null };
// Chapter 9 (#131): every page before 9-6 done, then 9-6 with its photo
const AT_SPREAD_C9 = (['c9p1', 'c9p2', 'c9p3', 'c9p4', 'c9p5'] as const).reduce((s, id) => completePage(s, id, { moves: 4 }), C8_DONE);
const C9_DONE = keepPhoto(completePage(AT_SPREAD_C9, 'c9p6', { moves: 5 }), 9, { frame: 'A', mocha: true, at: Date.UTC(2026, 9, 19, 20, 40) });
const ON_SPREAD_C9: NavState = { base: { kind: 'page', id: 'c9p6', run: 0 }, layer: null };
// Chapter 10 (#133): every page before 10-6 done, then 10-6 with its photo
const AT_SPREAD_C10 = (['c10p1', 'c10p2', 'c10p3', 'c10p4', 'c10p5'] as const).reduce((s, id) => completePage(s, id, { moves: 4 }), C9_DONE);
const C10_DONE = keepPhoto(completePage(AT_SPREAD_C10, 'c10p6', { moves: 3 }), 10, { frame: 'A', mocha: true, at: Date.UTC(2026, 9, 19, 21, 10) });
const ON_SPREAD_C10: NavState = { base: { kind: 'page', id: 'c10p6', run: 0 }, layer: null };
/** The album's fixtures (#103): a fixed time, so the stills never change. */
const SHOT_AT = Date.UTC(2026, 9, 19, 16, 20);
/** Chapter 1 with 1-2 solved (淘氣 too) and its photo kept: Frame A with 摩卡 in it. */
const ALBUM_A = keepPhoto(C1P2_DONE, 1, { frame: 'A', mocha: true, at: SHOT_AT });
/** A Frame B photo with 摩卡 in it, then retaken as a Frame C without him (the pool's notes). */
const ALBUM_B = keepPhoto(C1P2_DONE, 1, { frame: 'B', mocha: true, at: SHOT_AT });
const RETAKEN_C: Photo = { frame: 'C', mocha: false, at: SHOT_AT + 60_000 };
/**
 * The whole album (#113): chapter 1 finished (its Frame A + 摩卡 photo), and photos already kept for
 * chapters 2 (Frame A + 摩卡) and 3 (Frame B, no 摩卡) — the save as it will read once those chapters
 * are built (a save keeps a chapter's photo whatever is registered; their stickers wait for their pages).
 */
const ALBUM_MULTI = keepPhoto(keepPhoto(C1_DONE, 2, { frame: 'A', mocha: true, at: SHOT_AT + 3_600_000 }), 3, { frame: 'B', mocha: false, at: SHOT_AT + 7_200_000 });
/** Every registered page solved with every sticker, chapter 1's photo kept (#113): with `rewardTotal` the size of the registry, both § 2.8 rewards show. */
const ALL_IDS = gameRegistry.pages.map((p) => p.id);
const EVERYTHING = keepPhoto(
  ALL_IDS.reduce((s: SaveV1, id) => completePage(s, id, { mischief: true, tudigong: true, moves: 2 }), FRESH),
  1,
  { frame: 'A', mocha: true, at: SHOT_AT },
);
const BOOK = ALL_IDS.length;
const ALBUM_AT = (leaf: number): NavState => ({ base: { kind: 'cover' }, layer: { kind: 'album', leaf } });
/** 1-6 up to its photo moment: the lid open (the pigeon swoops onto the cart), 嗶！ at the gate, the cart to the platform, Mocha onto its awning (the pigeon flies; +M). */
const TO_PHOTO: readonly SolutionStep[] = [{ tap: 'lid' }, { wait: 'settle' }, { say: 'beep' }, { wait: 'settle' }, { set: 'cart', to: 'platform' }, { wait: 1 }, { mocha: 'canopy' }];

export const POPUP_FIXTURES: readonly PopupFixture[] = [
  {
    name: 'spread-c1',
    page: 'c1p6',
    steps: [{ tap: 'lid' }, { wait: 'settle' }],
    note: '1-6 「台鐵便當」, chapter 1\'s spread (GDD § 2.9, § 4.3; #103, #107): the 390 × 560 page drawn as a centrefold, the spine\'s crease down its middle. The bento\'s lid is open: the 雞腿 (the chapter\'s treasure) shows on its foil light — and the pigeon has swooped onto the cart\'s step for it; Baokaka reaches at the closed exit gate.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'photo-moment',
    page: 'c1p6',
    steps: TO_PHOTO,
    show: { photo: { at: 1800 } },
    note: 'The photo moment on 1-6 (GDD § 2.9, bible § 7, #103, #107): Mocha landed on the cart\'s awning, the pigeon fled, and 2 edges from the 雞腿 the world pauses; the paper camera slides down over the spread and the marigold 咔嚓 rises under it. The viewfinder is at the peak: Frame A, arms up with the 雞腿 high, 摩卡 on the awning in the frame (+M); the 「哇！」 meter full at its star. Live, the 3 s slow-motion loop runs (B → A → C), and after 6 s it snaps B itself.',
  },
  {
    name: 'album-c1',
    page: 'c1p2',
    steps: [],
    screen: { nav: { base: { kind: 'cover' }, layer: { kind: 'album' } }, save: ALBUM_A },
    note: 'The album from the cover (GDD § 2.9, § 5.6, bible § 7, #103): 「寶咖咖一歲的相簿」 on 花磚 endpapers in the linen cover; 第一章 「便當的味道」 00:20; the Frame A + 摩卡 print with washi corners and 雞腿 written under it; 學會了 嗶！ big on its seal; the 6 × 3 sticker grid (1-2\'s 解開 and 淘氣); the four chapter 1 notes — 阿嬤 「嘴巴開開，雞腿比臉還大！」, 媽媽, 爸爸, 摩卡 「我在左下角。很帥。」; 返回 and 再拍一次.',
  },
  {
    name: 'spread-shell',
    page: 'c1p6',
    steps: [],
    screen: { nav: ON_SPREAD, save: AT_SPREAD },
    note: '1-6 in the game shell (#103, #107): play it live — the photo moment, the album page, 再拍一次, 放進相簿, the chapter-end lines, the tray\'s first coin, the sticker card, chapter 2\'s card with 「未完待續」, then the 目錄 (`check:play` scenario `photo-spread`).',
  },
  {
    name: 'chapter-end-c1',
    page: 'c1p6',
    steps: [],
    screen: { nav: ON_SPREAD, save: C1_DONE, endLinesOf: 1 },
    note: 'Chapter 1\'s end (GDD § 4.3 1-6 notes, § 5.2; #107): after the album, over the finished spread (dimmed), the end lines a tap a beat — the narration strip 「找到了！抓周寶物——雞腿。」, 阿嬤\'s 「雞腿，一世人呷好料。」, 寶咖咖\'s 「好吃！」; then 摩卡\'s 「那是阿嬤的，不能吃。」. Live, the last tap fills the 抓周 tray\'s first slot (the coin drops in, a foil ring flares).',
  },
  {
    name: 'spread-shell-c2',
    page: 'c2p6',
    steps: [],
    screen: { nav: ON_SPREAD_C2, save: AT_SPREAD_C2 },
    note: '2-6 in the game shell (#114): play it live — the flaps, Mocha on the parasol, 掰掰, the photo moment with the 畫筆, the album page, the chapter-end lines, the tray\'s second coin, the sticker card, chapter 3\'s card with 「未完待續」, then the 目錄 (`check:play` scenario `photo-spread-c2`).',
  },
  {
    name: 'chapter-end-c2',
    page: 'c2p6',
    steps: [],
    screen: { nav: ON_SPREAD_C2, save: C2_DONE, endLinesOf: 2 },
    note: 'Chapter 2\'s end (GDD § 5.2 2-6 end; #114): after the album, over the finished spread (dimmed), the narration strip 「找到了！抓周寶物——畫筆。」 and 摩卡\'s 「他說：『我要畫摩卡。』……好吧。」 Live, the last tap fills the 抓周 tray\'s second slot.',
  },
  {
    name: 'spread-shell-c3',
    page: 'c3p6',
    steps: [],
    screen: { nav: ON_SPREAD_C3, save: AT_SPREAD_C3 },
    note: '3-6 in the game shell (#116): play it live — the bookmark page, 不要！ to the glasses, the page turned, Mocha beside 藍教授, the photo moment with the 書, the album page, the chapter-end line, the tray\'s third coin, the sticker card, chapter 4\'s card with 「未完待續」, then the 目錄 (`check:play` scenario `photo-spread-c3`).',
  },
  {
    name: 'chapter-end-c3',
    page: 'c3p6',
    steps: [],
    screen: { nav: ON_SPREAD_C3, save: C3_DONE, endLinesOf: 3 },
    note: 'Chapter 3\'s end (GDD § 5.2 3-6 end; #116): after the album, over the finished spread (dimmed), the narration strip 「找到了！抓周寶物——書。」 Live, the tap fills the 抓周 tray\'s third slot.',
  },
  {
    name: 'spread-shell-c4',
    page: 'c4p6',
    steps: [],
    screen: { nav: ON_SPREAD_C4, save: AT_SPREAD_C4 },
    note: '4-6 in the game shell (#118): play it live — the shutter rolled up, 不要！ to the disco ball, Mocha onto the amp, 哇！ to the stage lights (the king sings, the lift rises), the photo moment with the 麥克風, the album page, the chapter-end line, the tray\'s fourth coin, the sticker card, chapter 5\'s card with 「未完待續」, then the 目錄 (`check:play` scenario `photo-spread-c4`).',
  },
  {
    name: 'chapter-end-c4',
    page: 'c4p6',
    steps: [],
    screen: { nav: ON_SPREAD_C4, save: C4_DONE, endLinesOf: 4 },
    note: 'Chapter 4\'s end (GDD § 5.2 4-6 end; #118): after the album, over the finished spread (dimmed), the narration strip 「找到了！抓周寶物——麥克風。」 Live, the tap fills the 抓周 tray\'s fourth slot.',
  },
  {
    name: 'spread-shell-c5',
    page: 'c5p6',
    steps: [],
    screen: { nav: ON_SPREAD_C5, save: AT_SPREAD_C5 },
    note: '5-6 in the game shell (#121): play it live — Mocha onto the sign, 不要！ to the griddle, 抱抱 the vendor over the counter, Mocha onto the tray stack (it sinks), the photo moment with the 蔥, the album page, the chapter-end lines, the tray\'s fifth coin, the sticker card, chapter 6\'s card with 「未完待續」, then the 目錄 (`check:play` scenario `photo-spread-c5`).',
  },
  {
    name: 'chapter-end-c5',
    page: 'c5p6',
    steps: [],
    screen: { nav: ON_SPREAD_C5, save: C5_DONE, endLinesOf: 5 },
    note: 'Chapter 5\'s end (GDD § 5.2 5-6 end; #121): after the album, over the finished spread (dimmed), the narration strip 「找到了！抓周寶物——蔥。」 and 摩卡\'s 「蔥抓餅……加蛋。……我什麼都沒說。」 Live, the last tap fills the 抓周 tray\'s fifth slot.',
  },
  {
    name: 'spread-shell-c6',
    page: 'c6p6',
    steps: [],
    screen: { nav: ON_SPREAD_C6, save: AT_SPREAD_C6 },
    note: '6-6 in the game shell (#123): play it live — 飛機！ (the pigeons fly out of the X-ray tray), 嗶！ from the tray (the scanner wakes), the belt turned to the far end, Mocha onto the counter (he pushes the 印章 off), the photo moment with the 印章, the album page, the chapter-end line, the tray\'s sixth coin, the sticker card, chapter 7\'s card, then 7-1 (`check:play` scenario `photo-spread-c6`).',
  },
  {
    name: 'chapter-end-c6',
    page: 'c6p6',
    steps: [],
    screen: { nav: ON_SPREAD_C6, save: C6_DONE, endLinesOf: 6 },
    note: 'Chapter 6\'s end (GDD § 5.2 6-6 end; #123): after the album, over the finished spread (dimmed), the narration strip 「找到了！抓周寶物——印章。」 Live, the tap fills the 抓周 tray\'s sixth slot.',
  },
  {
    name: 'spread-shell-c7',
    page: 'c7p6',
    steps: [],
    screen: { nav: ON_SPREAD_C7, save: AT_SPREAD_C7 },
    note: '7-6 in the game shell (#125): play it live — Mocha into the bamboo basket, 不要！ to the moon in the rain barrel (he looks round and cries: 黑糖 wakes, 「歹、歹勢，我睡在芹菜上了。」), 抱抱 the bear up the terrace walls, Mocha onto the fence post (the gate opens), the photo moment with the 芹菜, the album page, the chapter-end line, the tray\'s seventh coin, the sticker card, chapter 8\'s card with 「未完待續」, then the 目錄 (`check:play` scenario `photo-spread-c7`).',
  },
  {
    name: 'chapter-end-c7',
    page: 'c7p6',
    steps: [],
    screen: { nav: ON_SPREAD_C7, save: C7_DONE, endLinesOf: 7 },
    note: 'Chapter 7\'s end (GDD § 5.2 7-6 end; #125): after the album, over the finished spread (dimmed), the narration strip 「找到了！抓周寶物——芹菜。」 Live, the tap fills the 抓周 tray\'s seventh slot.',
  },
  {
    name: 'spread-shell-c8',
    page: 'c8p6',
    steps: [],
    screen: { nav: ON_SPREAD_C8, save: AT_SPREAD_C8 },
    note: '8-6 in the game shell (#129): play it live — slide the abacus\'s rods into a staircase (he climbs), 咻—— the steam off the counter, Mocha onto the bell (the 番台\'s window opens: 「歡迎光臨！大人五十，囡仔免錢。」), the photo moment with the 算盤, the album page, the chapter-end line, the tray\'s eighth coin, the sticker card, chapter 9\'s card with 「未完待續」, then the 目錄 (`check:play` scenario `photo-spread-c8`).',
  },
  {
    name: 'chapter-end-c8',
    page: 'c8p6',
    steps: [],
    screen: { nav: ON_SPREAD_C8, save: C8_DONE, endLinesOf: 8 },
    note: 'Chapter 8\'s end (GDD § 5.2 8-6 end; #129): after the album, over the finished spread (dimmed), the narration strip 「找到了！抓周寶物——算盤。」 Live, the tap fills the 抓周 tray\'s eighth slot.',
  },
  {
    name: 'spread-shell-c9',
    page: 'c9p6',
    steps: [],
    screen: { nav: ON_SPREAD_C9, save: AT_SPREAD_C9 },
    note: '9-6 in the game shell (#131): play it live — Mocha into the net basket at the quay (Baokaka crawls in after him), 咻—— twice (the sail swings the derrick round onto the deck), Mocha onto the wheelhouse, 飛機！ the gulls off the rail, the photo moment with the 聽診器, the album page, the chapter-end line, the tray\'s ninth coin, the sticker card, chapter 10\'s card with 「未完待續」, then the 目錄 (`check:play` scenario `photo-spread-c9`).',
  },
  {
    name: 'chapter-end-c9',
    page: 'c9p6',
    steps: [],
    screen: { nav: ON_SPREAD_C9, save: C9_DONE, endLinesOf: 9 },
    note: 'Chapter 9\'s end (GDD § 5.2 9-6 end; #131): after the album, over the finished spread (dimmed), the narration strip 「找到了！抓周寶物——聽診器。」 Live, the tap fills the 抓周 tray\'s ninth slot.',
  },
  {
    name: 'chapter-card-c10',
    page: 'c10p1',
    steps: [],
    screen: { nav: { base: { kind: 'page', id: 'c10p1', run: 0 }, layer: null }, save: C9_DONE, chapterCard: 10 },
    note: 'Chapter 10\'s card in the chapter turn (#133; it replaces `chapter-soon-c10`, chapter 10 being built): 第十章, 「離天空最近的地方」 (its eight characters take the whole title row and the time chip lifts onto the card\'s top edge, #132), 05:10, 台北101, 「下一站 台北101」; under it 廣播姊姊\'s 「下一站，台北101。」 and the narration 「101，是台北最高的地方。」 — the last two lines play on 10-1, as 101 comes into the window.',
  },
  {
    name: 'spread-shell-c10',
    page: 'c10p6',
    steps: [],
    screen: { nav: ON_SPREAD_C10, save: AT_SPREAD_C10 },
    note: '10-6 in the game shell (#133): play it live — he climbs to the deck\'s rail and cruises to its end, 一起 (Mocha hops down), the far side of the deck tapped (Mocha walks over and waits; 咻咻 comes down; the first steps, a held line each), 抱抱 (咻咻 lets go of the 金鎖片), the photo moment framing the steps, 抱抱 (咻咻 lets go of the 金鎖片), the album page, the four chapter-end lines, the sticker card (the 抓周 tray\'s nine coins are full already), then the 目錄 (`check:play` scenario `photo-spread-c10`).',
  },
  {
    name: 'chapter-end-c10',
    page: 'c10p6',
    steps: [],
    screen: { nav: ON_SPREAD_C10, save: C10_DONE, endLinesOf: 10 },
    note: 'Chapter 10\'s end (GDD § 5.2 10-6; #133): after the album, over the finished spread (dimmed), the first beat of the four end lines — Baokaka\'s 「一起。」 and Mocha\'s translation 「他說：『一起過生日。』」, then 「太陽，從山的後面出來了。」 and 廣播姊姊\'s 「本列車直達：寶咖咖的家。」. Live, the taps lead to the sticker card and the 目錄 (the tray\'s nine coins are chapters 1–9\'s).',
  },
  {
    name: 'album-c1-retake',
    page: 'c1p2',
    steps: [],
    screen: { nav: ON_PAGE, save: ALBUM_B, albumAfter: { chapter: 1, retaken: RETAKEN_C } },
    note: 'The album after the spread, retaken (§ 2.9 step 7, #103): the first shot (B, 摩卡 in) and the new one (C, chewing, no 摩卡) side by side, the new one chosen and printed big; the notes from the shared pool for chapter 1 Frame C (阿嬤 「怎麼拍，乖孫都古錐。」, 摩卡 out: 「大家手機裡，都是你的照片。」). 再拍一次 / 放進相簿.',
  },
  {
    name: 'album-multi',
    page: 'c1p2',
    steps: [],
    screen: { nav: ALBUM_AT(2), save: ALBUM_MULTI },
    note: 'The whole album, turned to chapter 2 (GDD § 2.9 album screen, #113): 第二章 「會揮手的公園」 00:50, its Frame A + 摩卡 print (the 畫筆 token until its art), 學會了 掰掰, its empty 0／18 grid (its pages aren\'t built), the chapter 2 notes (阿嬤 「會畫圖喔，以後當畫家！」 … 摩卡 「松鼠搶鏡頭。不予置評。」); under it the page arrows and the dots (the cover, 1–3 foil with their photos, 4–10 navy: not reached), 返回 and 再拍一次. Live: ‹ › or a one-finger swipe turn the leaf.',
  },
  {
    name: 'album-locked',
    page: 'c1p2',
    steps: [],
    screen: { nav: ALBUM_AT(4), save: ALBUM_MULTI },
    note: 'A chapter the 月亮線 hasn\'t reached (#113): 第四章 「霓虹燈睡著了」 01:50 as a placeholder — an empty print with a padlock and 「？」 under it, a blind-embossed 「？」 for the word, the empty 6 × 3 grid, and 「月亮線還沒開到這裡。」 where the notes go. Only 返回.',
  },
  {
    name: 'album-cover',
    page: 'c1p2',
    steps: [],
    screen: { nav: ALBUM_AT(0), save: C1_DONE },
    note: 'The album\'s cover, its first leaf (#113, bible § 7): the navy linen board with gold-foil frame and corner brackets, a die-cut round window with the latest photo (chapter 1\'s Frame A + 摩卡), 「寶咖咖 一歲的相簿」 stamped in foil, a foil moon. The dots: the cover ringed, chapter 1 foil.',
  },
  {
    name: 'album-cover-unlocked',
    page: 'c1p2',
    steps: [],
    screen: { nav: ALBUM_AT(0), save: EVERYTHING, rewardTotal: BOOK },
    note: 'The 「淘氣大王」 cover (GDD § 2.8, #113): every 淘氣 earned (here every registered page\'s, `rewardTotal` the registry\'s size; in the game all 65): a foil crown on the window, a ring of foil 嘿 stickers, 寶咖咖 laughing and 摩卡 smug in the window, the seal-red ribbon 「淘氣大王」 across it, the album\'s name in foil under it.',
  },
  {
    name: 'album-left-big',
    page: 'c1p2',
    steps: [],
    screen: { nav: ALBUM_AT(1), save: updateSettings(updateSettings(C1_DONE, { leftHand: true }), { bigText: true }) },
    note: 'The album with 大字 and 左手模式 (#113): chapter 1\'s page at the big text scale; the buttons mirrored (再拍一次 under the left thumb, 返回 right), the page arrows either side of the dots as always.',
  },
  {
    name: 'c0p1-start',
    page: 'c0p1',
    steps: [],
    note: '0-1 as it opens: Baokaka in the crib, the rail up, the mobile still.',
    expect: { mode: 'idle' },
  },
  {
    name: 'c1p2-reaching',
    page: 'c1p2',
    steps: [{ set: 'train', to: 'half' }, { wait: 'settle' }],
    note: '1-2: the train tab jammed at half by the pigeon; Baokaka rode it to the gap and reaches for the bead.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c1p2-riding',
    page: 'c1p2',
    steps: [{ set: 'train', to: 'half' }, { wait: 'settle' }, { set: 'train', to: 'out' }],
    note: '1-2: the train carries Baokaka back to out (a ride, the 淘氣 counter); live, the last tick replays.',
    expect: { event: 'ride' },
  },
  {
    name: 'c1p2-env',
    page: 'c1p2',
    steps: [{ tap: 'board' }, { wait: 1 }],
    note: '1-2 environment art (#96): the baked backdrop (grain, depth shadows), the baked split-flap board flipped to the 福德線, the 土地公 peeking from behind it; characters in the chapter half grade.',
  },
  {
    name: 'affordance-states',
    page: 'c1p2',
    steps: [],
    sheet: 'affordance-states',
    note: 'The touchable states side by side (bible § 4.1, #140): idle, hint L1 halo, hint L2 ghost hand, dragging, locked, done, hold-to-reveal, reduced motion.',
  },
  {
    name: 'sprites-anchors',
    page: 'c1p2',
    steps: [],
    sheet: 'sprites-anchors',
    note: 'The baked character sprites at map scale (#94): stills, heads and poses, mirrored pairs, with the frame box, foot anchor, head and footprint marked.',
  },
  {
    name: 'c1p2-hold-reveal',
    page: 'c1p2',
    steps: [],
    show: { gesture: { reveal: true } },
    note: '1-2 under a 600 ms hold on empty paper: every touchable, the prop and the perch get the dashed chalk outline (GDD § 2.6).',
  },
  {
    name: 'c1p2-dragging',
    page: 'c1p2',
    steps: [],
    show: { gesture: { dragging: 'train', preview: { part: 'train', index: 0.6 }, finger: [150, 612] } },
    note: '1-2: the train tab mid-drag, lifted to the next z over its dropped shadow; Baokaka watches the finger.',
  },
  {
    name: 'c1p2-reduced-motion',
    page: 'c1p2',
    steps: [],
    look: 'reduced',
    note: '1-2 under reduced motion: no idle wiggle, the touchable carries the static double outline instead.',
  },
  {
    name: 'c1p1-start',
    page: 'c1p1',
    steps: [{ wait: 4 }],
    note: '1-1 「月亮線，出發！」 (#107): inside the 板南線 car, the backpacker asleep across the aisle (his backpack blocks it), the bead under the 博愛座 beyond; Baokaka crawled up to him and reaches. Mocha on the first hand strap, the second strap and the luggage rack (the folded map on its edge) carry paw prints; the sway tab under the floor. Placeholder art until #108.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c1p1-awake',
    page: 'c1p1',
    steps: [{ mocha: 'rack' }, { wait: 2 }],
    show: { talk: ['c1p1.pack.1', 'c1p1.pack.2'] },
    note: '1-1: Mocha strap-hopped to the rack and pushed the map off; it landed on the backpacker\'s face, he woke and tucked his backpack in — 「Excuse me… where is 101?」, Mocha translates 「往前走，看到最高的就是。」 (§ 5.2 ch1).',
    expect: { event: 'land' },
  },
  {
    name: 'c1p3-robot',
    page: 'c1p3',
    steps: [{ mocha: 'counter' }, { wait: 'settle' }, { mocha: 'robotLid' }, { wait: 'settle' }, { say: 'beep' }],
    note: '1-3\'s 淘氣 (#107, D-70): Mocha rides the cleaning robot\'s lid, and Baokaka\'s 嗶！ at gate B sets it spinning with him on board — gate B opens too.',
    expect: { mode: 'saying', event: 'beep' },
  },
  {
    name: 'c1p4-turntable',
    page: 'c1p4',
    steps: [{ set: 'floor', to: '0' }, { wait: 'settle' }],
    note: '1-4 「大廳的棋盤」 (#107): the checkered turntable turned east–west; Baokaka crawled in to its fixed centre and reaches north for the bead past gate N. Turn it back while he sits on it.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c1p4-riding',
    page: 'c1p4',
    steps: [{ set: 'floor', to: '0' }, { wait: 1 }, { set: 'floor', to: '1' }],
    note: '1-4: turned back while he crawled onto the aisle seat, the disk carries him round to face gate N (a ride; live, the last tick replays).',
    expect: { event: 'ride' },
  },
  {
    name: 'c1p5-start',
    page: 'c1p5',
    steps: [{ wait: 4 }],
    note: '1-5 「便當店的電梯」 (#107): the cross-section, B1 below and the 便當店 on 1F above; the car up at 1F, so Baokaka reaches at the B1 door for the bead on the shop floor. Mocha on the shop counter (on its 叮咚 bell); paw prints in the car and on the B1 shelf.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c1p5-car-down',
    page: 'c1p5',
    steps: [{ mocha: 'carPanel' }, { wait: 'settle' }],
    note: '1-5: Mocha jumped into the car and sat on its panel: down it came, and Baokaka crawled in (the car is now nearest the bead). Tap Mocha to press again.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c1p5-clerk',
    page: 'c1p5',
    steps: [{ pet: true }],
    show: { talk: ['c1p5.clerk.1', 'c1p5.clerk.2', 'c1p5.clerk.3'] },
    note: '1-5: Mocha tapped on the shop counter rings its 叮咚 bell, and the 店員小哥 cameo answers — 「叮咚～歡迎光臨！」「……你怎麼在這裡？」「我們是連鎖的。」 (§ 5.2 ch1). Three rings are the 淘氣.',
  },
  {
    name: 'c1p6-spread',
    page: 'c1p6',
    steps: [{ wait: 3 }],
    note: '1-6 「台鐵便當」 as it opens (#107): the centrefold — the concourse and its exit gate on the left, the platform and the bento cart (its lid shut) on the right. Nothing shiny in sight, so Baokaka crawled to Mocha on the station clock and cuddles; the cart\'s slider under the floor.',
    expect: { mode: 'cuddling' },
  },
  // ——— Chapter 2 「會揮手的公園」 (#114; its art: #115) ———
  {
    name: 'c2p1-start',
    page: 'c2p1',
    steps: [{ wait: 4 }],
    note: '2-1 「信義線」 (#114): inside the 信義線 car at 大安森林公園, the doors shut; the bead at the platform\'s far end, past the gap. Baokaka crawled to the doors and reaches. Mocha on a hand strap; paw prints on the 博愛座 and on the platform bench, where a commuter sleeps beside his long umbrella.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c2p1-bridge',
    page: 'c2p1',
    steps: [{ wait: 'settle' }, { say: 'beep' }, { mocha: 'bench' }, { wait: 2 }],
    note: '2-1: his 嗶！ opened the doors; Mocha squeezed out to the bench and knocked the umbrella over: it lies across the gap, a bridge, and Baokaka has crawled over it onto the platform. The 土地公 shows on the platform\'s poster now the doors are open.',
    expect: { event: 'babyEnter' },
  },
  {
    name: 'c2p2-start',
    page: 'c2p2',
    steps: [{ wait: 4 }],
    note: '2-2 「露天音樂台」 (#114): the bandshell, its red curtain down (the bead is behind it, unseen). Mocha on the park lamp is the best thing on the page, so Baokaka crawled over and cuddles him; the spotlight\'s pool of light lies on the lawn, the spotlight\'s dial at the lawn\'s edge, the trap-door plate at the stage\'s front.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c2p2-clerk',
    page: 'c2p2',
    steps: [{ mocha: 'crate' }, { wait: 1 }],
    show: { talk: ['c2p2.clerk.1', 'c2p2.clerk.2', 'c2p2.clerk.3'] },
    note: '2-2: Mocha hid in the drinks stall\'s crate (C9) and the 店員小哥 cameo answers — 「叮咚～歡迎光臨！」「……又是你？」「我們是連鎖的。」 With Mocha out of sight, Baokaka turns to the spotlight\'s pool of light.',
  },
  {
    name: 'c2p2-curtain',
    page: 'c2p2',
    steps: [{ mocha: 'crate' }, { set: 'spot', to: 'trap' }, { wait: 5 }],
    note: '2-2: the spotlight aimed at the trap door led him onto the plate; his weight raised the curtain, the bead shone backstage and he crawled over and grabs it — 「這個！」 Light is a leash.',
  },
  {
    name: 'c2p3-start',
    page: 'c2p3',
    steps: [{ wait: 3 }],
    note: '2-3 「跑步的阿姨」 (#114): nothing shiny in sight, so Baokaka crawled to Mocha on the pond-side bench and cuddles; the jogger stretches on the little bridge, a dog sleeps on the path beyond it, a turtle on its rock in the pond.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c2p3-learn',
    page: 'c2p3',
    steps: [{ mocha: 'railing' }],
    show: { words: { card: 'bye' } },
    note: 'Learning 掰掰 (GDD § 5.4, #114): Mocha on the bridge\'s railing made the jogger laugh, wave 「掰掰～小寶貝！」 and jog off; Baokaka copied her. The word card 「掰掰：請讓一讓」 is taped over the dimmed page.',
    expect: { event: 'learn' },
  },
  {
    name: 'c2p4-start',
    page: 'c2p4',
    steps: [{ wait: 6 }],
    note: '2-4 「松鼠的樹」 (#114): the squirrel holds the bead in its paws up on the east branch; Baokaka crawled as near as he can under it and reaches. Mocha on the stump; paw prints on the trunk\'s two forks.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c2p4-herded',
    page: 'c2p4',
    steps: [{ mocha: 'eastFork' }, { wait: 'settle' }, { mocha: 'westFork' }, { wait: 'settle' }],
    note: '2-4: herded — Mocha on the east fork sent the squirrel to the west branch, then on the west fork down to the low branch over the roots, right in front of Baokaka, who reaches. Now 掰掰.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c2p5-start',
    page: 'c2p5',
    steps: [{ wait: 3 }],
    note: '2-5 「生態池」 (#114): the eco-pond, the great lily pad turned to the back with the egret standing on it; the bead on the far shore. Baokaka reaches from the near shore. Mocha on the pavilion rail; the stepping stone in the pond carries a paw print.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c2p5-puff',
    page: 'c2p5',
    steps: [{ wait: 3 }, { mocha: 'stone' }],
    note: '2-5: the stepping stone is splashed while the egret stamps on the pad (C7): tapping it, Mocha puffs up — 「不要。」 Not every problem needs the cat.',
    expect: { event: 'mochaPuff' },
  },
  {
    name: 'c2p5-aboard',
    page: 'c2p5',
    steps: [{ wait: 'settle' }, { say: 'bye' }, { set: 'pads', to: 'west' }, { wait: 'settle' }],
    note: '2-5: 掰掰 sent the egret off to the reeds and the pad was turned to the near shore: Baokaka crawled aboard and reaches for the far shore. Turn the pad east and it ferries him across.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c2p6-spread',
    page: 'c2p6',
    steps: [{ wait: 4 }],
    note: '2-6 「畫畫的阿伯」 as it opens (#114): the centrefold — the painter\'s canvas on its easel by the stream on the left, the painter asleep under his parasol with the 畫筆 in his hand and a squirrel on his hat on the right. The stream stops Baokaka; he reaches. The canvas\'s three painted flaps wait to pop up.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c2p6-portrait',
    page: 'c2p6',
    steps: [{ wait: 4 }, { tap: 'flapC' }],
    note: '2-6: the canvas\'s portrait corner popped up, and the 土地公 is painted into it in his 斗笠 (the page\'s secret sticker).',
  },
  {
    name: 'c2p6-bridges',
    page: 'c2p6',
    steps: [{ tap: 'flapA' }, { tap: 'flapB' }, { tap: 'flapC' }, { wait: 5 }],
    note: '2-6: all three canvas flaps popped up — the bridge over the stream (he crossed and reaches for the 畫筆), the branch to the parasol and the portrait corner, where the 土地公 is painted in. Three open is the 淘氣: the painting becomes Mocha\'s portrait.',
    expect: { mode: 'reaching' },
  },
  // ——— Chapter 3 「醉月湖的鵝」 (#116): placeholder art until #117 ———
  {
    name: 'c3p1-start',
    page: 'c3p1',
    steps: [{ wait: 3 }],
    note: '3-1 「綠線」 (#116): inside a 松山新店線 car at 公館, the doors shut, the bead at the platform\'s far end. 1-1\'s backpacker dozes against his huge backpack across the aisle: Baokaka crawled up to it and reaches. The ad poster on the platform wall.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c3p1-doors',
    page: 'c3p1',
    steps: [{ wait: 'settle' }, { say: 'bye' }, { wait: 'settle' }],
    note: '3-1: 掰掰 woke the backpacker; he sat up on a seat (「Excuse me… where is 101?」), and Baokaka crawled on to the shut doors and reaches. 嗶！ opens them.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c3p2-start',
    page: 'c3p2',
    steps: [{ wait: 2 }],
    note: '3-2 「椰林大道」 (#116): three parked bikes between the palms. The outer two stand across the path (their handlebar knobs to pull back into the rack); the 店員小哥\'s delivery bike, red box on its rack, is parked between them. Baokaka reaches for the bead at the avenue\'s end; Mocha on a palm top, a paw print on the delivery bike\'s seat.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c3p2-shoved',
    page: 'c3p2',
    steps: [{ wait: 2 }, { set: 'bikeA', to: 'rack' }, { wait: 3 }],
    note: '3-2: the first bike pulled back into the rack shoved the delivery bike out across the path (and the 土地公 peeks from behind its palm). Baokaka got one gap further and reaches again. Mocha on its seat would roll it back and hold it.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c3p2-clerk',
    page: 'c3p2',
    steps: [{ mocha: 'seat' }, { wait: 1 }],
    show: { talk: ['c3p2.clerk.1', 'c3p2.clerk.2', 'c3p2.clerk.3'] },
    note: '3-2: Mocha sits on the delivery bike\'s seat and the 店員小哥 cameo answers — 「叮咚～歡迎光臨！」「……連腳踏車也是你的？」「我們是連鎖的。」',
  },
  {
    name: 'c3p3-start',
    page: 'c3p3',
    steps: [{ wait: 3 }],
    note: '3-3 「醉月湖」 (#116): the moon\'s reflection on the lake is a decoy (drawn as itself, not as a bead); Baokaka crawled to the water\'s edge and reaches for it. The goose on her nest by the path; Mocha on the lakeside bench, a paw print on the rock by the nest.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c3p3-learn',
    page: 'c3p3',
    steps: [{ wait: 3 }, { mocha: 'rock' }],
    show: { words: { card: 'no' } },
    note: 'Learning 不要！ (GDD § 5.4, #116): Mocha on the rock beside the nest; the goose reared up 「嘎！不要過來！」 and Baokaka copied her. The word card 「不要！：換一個想要的」 is taped over the dimmed page.',
    expect: { event: 'learn' },
  },
  {
    name: 'c3p3-chase',
    page: 'c3p3',
    steps: [{ mocha: 'rock' }, { wait: 'settle' }, { say: 'no' }, { wait: 2 }],
    note: '3-3: 不要！ to the moon — he turned to Mocha, and passing the nest sent the goose charging off after Mocha; the bead shines in the nest beside him.',
  },
  {
    name: 'c3p4-start',
    page: 'c3p4',
    steps: [{ wait: 4 }],
    note: '3-4 「傅鐘」 (#116): the brass bell high in its tower is a decoy (drawn as itself); Baokaka sits at the tower\'s foot reaching up for it. Pigeons peck on the garden gate\'s plate; the bell-rope tab hangs by the tower; Mocha on a palm, a paw print on the gate\'s pillar.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c3p4-rung',
    page: 'c3p4',
    steps: [{ wait: 4 }, { set: 'rope', to: 'down' }, { mocha: 'pillar' }, { wait: 'settle' }],
    note: '3-4: the rope pulled, the bell rang and the pigeons flew up to the eaves (the 土地公 shows in the arch); Mocha waits on the gate\'s pillar. Baokaka still reaches for the bell: 不要！ gets him moving.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c3p5-start',
    page: 'c3p5',
    steps: [{ wait: 3 }],
    note: '3-5 「總圖書館」 (#116): four mobile shelves, every aisle shut; the end two have crank knobs on the rail, Mocha sleeps on top of the third. The returns desk splits the front: the bead is at the reading room\'s far end, and Baokaka reaches from the near side.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c3p5-aisle',
    page: 'c3p5',
    steps: [{ set: 'shelfD', to: 'e' }, { set: 'shelfA', to: 'e' }, { mocha: 'topB' }, { wait: 'settle' }, { set: 'shelfA', to: 'w' }, { wait: 2 }],
    note: '3-5: Mocha holds the second shelf while the first rolled back west — aisle 1 opened (the 土地公 reads on its floor) and Baokaka crawled into the back of the stacks, heading for aisle 3, open beside Mocha\'s old shelf.',
  },
  {
    name: 'c3p6-spread',
    page: 'c3p6',
    steps: [{ wait: 2 }],
    note: '3-6 「藍教授的書」 as it opens (#116): the centrefold — a giant open book on the desk, a stack of books on the right page where 藍教授 sits on the 書 in her reading glasses (a decoy, drawn as glasses). Baokaka sits on the giant book\'s right-hand page reaching for them; Mocha on the desk lamp. The bookmark, the page under him and the cat page are flaps.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c3p6-turned',
    page: 'c3p6',
    steps: [{ tap: 'flapA' }, { say: 'no' }, { wait: 'settle' }, { tap: 'flapB' }, { wait: 1 }],
    note: '3-6: 不要！ to the glasses sent him back across the book to reach up for Mocha, so the page he sat on could turn: it stands up as Mocha\'s bridge to 藍教授 (the 土地公 printed on it). The bookmark bridges the gap to the stack.',
    expect: { mode: 'reaching' },
  },
  // ——— Chapter 4 「霓虹燈睡著了」 (#118; its art #119) ———
  {
    name: 'c4p1-start',
    page: 'c4p1',
    steps: [{ wait: 3 }],
    note: '4-1 「板南線往西門」 (#118): inside a 板南線 car at 西門, the doors shut. The ad screen over the seats is a decoy (drawn as itself): Baokaka crawled under it and reaches up. Mocha on a hand strap, a paw print on the header over the doors.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c4p1-doors',
    page: 'c4p1',
    steps: [{ mocha: 'header' }, { wait: 'settle' }, { say: 'no' }, { wait: 'settle' }],
    note: '4-1: Mocha on the header over the doors, and 不要！ to the ad screen: Baokaka crawled to the shut doors and reaches up for Mocha — close enough for 嗶！.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c4p2-start',
    page: 'c4p2',
    steps: [{ wait: 2 }],
    note: '4-2 「紅樓」 (#118): the octagonal red house is a wheel; no two doorways line up, so Baokaka reaches for the bead in the shop behind the shutter on the far side. Mocha on the street lamp; the lantern hangs from the east eave over the shutter\'s button.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c4p2-window',
    page: 'c4p2',
    steps: [{ wait: 2 }, { set: 'tower', to: '4' }, { mocha: 'window' }, { wait: 1 }],
    note: '4-2: 紅樓 turned until its roof window faces the lamp (state 4): Mocha sits in the lantern window (the 淘氣 is a whole turn with him up there). The doorways still don\'t line up.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c4p2-shutter',
    page: 'c4p2',
    steps: [{ set: 'tower', to: '4' }, { mocha: 'eave' }, { wait: 'settle' }, { set: 'tower', to: '6' }, { wait: 2 }],
    note: '4-2: Mocha knocked the lantern onto the button and the shutter rolled up; 紅樓 turned until two doorways line up (state 6), and Baokaka crawled through it to the east side.',
  },
  {
    name: 'c4p3-start',
    page: 'c4p3',
    steps: [{ wait: 2 }],
    note: '4-3 「霓虹燈睡著了」 (#118): a dark alley, every sign asleep, Mocha hidden in a box: nothing to want, Baokaka looks about 「？」 — next tick he cries.',
    expect: { mode: 'looking' },
  },
  {
    name: 'c4p3-learn',
    page: 'c4p3',
    steps: [{ wait: 3 }],
    show: { words: { card: 'wow' } },
    note: 'Learning 哇！ (GDD § 5.4, #118): his cry flickered the first sign awake — 「哇！」. The word card 「哇！：燈亮起來」 is taped over the dimmed page.',
    expect: { event: 'learn' },
  },
  {
    name: 'c4p3-trail',
    page: 'c4p3',
    steps: [{ wait: 'settle' }, { say: 'wow' }, { wait: 'settle' }],
    note: '4-3: 哇！ under the first sign woke the second down the alley and put the first back to sleep; Baokaka crawled on and watches it. From here 哇！ reaches the third, round the corner.',
    expect: { mode: 'watching' },
  },
  {
    name: 'c4p3-shadow',
    page: 'c4p3',
    steps: [{ mocha: 'behind' }, { wait: 'settle' }, { say: 'wow' }, { wait: 1 }],
    note: '4-3\'s 淘氣 (#119): Mocha hid behind the second sign, and 哇！ lit it — his shadow, enormous, up the alley wall 「喵？」.',
  },
  {
    name: 'c4p4-start',
    page: 'c4p4',
    steps: [{ wait: 2 }],
    note: '4-4 「夾娃娃機」 (#118): inside the claw machine, dark until a coin goes in. Baokaka on the left ledge reaches for the bead across the plush pit; the claw hangs at home over the chute. Mocha on a stool, a paw print on the coin slot.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c4p4-clerk',
    page: 'c4p4',
    steps: [{ mocha: 'coinSlot' }, { wait: 1 }],
    show: { talk: ['c4p4.clerk.1', 'c4p4.clerk.2', 'c4p4.clerk.3'] },
    note: '4-4: Mocha sits on the coin slot, the machine lights up and the 店員小哥 cameo answers — 「叮咚～歡迎光臨！」「……夾娃娃機也是你們的？」「我們是連鎖的。」',
  },
  {
    name: 'c4p4-grabbed',
    page: 'c4p4',
    steps: [{ mocha: 'coinSlot' }, { wait: 1 }, { set: 'clawX', to: 'x0' }, { set: 'claw', to: 'down' }, { wait: 1 }],
    note: '4-4: the claw pulled over him and its lever pulled down; he crawled in, and it grabbed him (it only ever works for 寶咖咖) and carried him home over the chute.',
  },
  {
    name: 'c4p5-start',
    page: 'c4p5',
    steps: [{ wait: 2 }],
    note: '4-5 「街頭藝人」 (#118): a dance crew fills the street; past them the busker sits on his hat. Baokaka cuddles Mocha under the street lamp; the boombox sits silent on the speaker stack.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c4p5-arch',
    page: 'c4p5',
    steps: [{ mocha: 'crate' }, { wait: 'settle' }, { say: 'wow' }, { wait: 2 }],
    note: '4-5: Mocha on the amp crate brought him near; 哇！ started the boombox, the dancers froze into an arch over the street (the 土地公 in the crowd) — and the flashing boombox is a decoy: he reaches up for it at the stack\'s foot.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c4p6-spread',
    page: 'c4p6',
    steps: [{ wait: 2 }],
    note: '4-6 「走音天王」 as it opens (#118): the centrefold — the arcade door and the dance floor on the left, a karaoke stage behind a rolled-down shutter on the right. Baokaka cuddles Mocha on the arcade\'s sign.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c4p6-disco',
    page: 'c4p6',
    steps: [{ tap: 'shutter' }, { mocha: 'amp' }, { wait: 'settle' }],
    note: '4-6: the shutter rolled up — the stage, the karaoke screen (the 土地公 in its lyrics) and a disco ball over the dance floor, a decoy he crawled back under. Mocha on the amp at the back of the stage.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c4p6-sing',
    page: 'c4p6',
    steps: [{ tap: 'shutter' }, { mocha: 'amp' }, { wait: 'settle' }, { say: 'no' }, { wait: 'settle' }, { say: 'wow' }],
    show: { talk: ['c4p6.king.1', 'c4p6.king.2'] },
    note: '4-6: 不要！ to the disco ball took him onto the stage, under the lights; his 哇！ switched them on — the karaoke king sings 「這首歌，獻給一歲的你！」 (Mocha: 「……耳朵。我的耳朵。」) and the lift rises with the 麥克風.',
  },
  // ——— Chapter 5 「夜市抱抱」 (#121; its art #122) ———
  {
    name: 'c5p1-start',
    page: 'c5p1',
    steps: [{ wait: 3 }],
    note: '5-1 「往劍潭」 (#121): a 淡水信義線 car in the tunnel, its lights out. In the dark a dozing passenger\'s phone glows — a decoy (drawn as itself): Baokaka crawled under it and reaches up. Mocha on a hand strap, a paw print on the luggage rack at the far end.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c5p1-lights',
    page: 'c5p1',
    steps: [{ mocha: 'rack' }, { wait: 'settle' }, { say: 'no' }, { wait: 'settle' }, { say: 'wow' }],
    note: '5-1: Mocha on the rack, 不要！ to the phone — Baokaka crawled to the end of the car and reaches up for Mocha; his 哇！ switched the car\'s lights on: the passengers blink, the phone fades into the light and the bead shines by the door (the 土地公 on the route map).',
  },
  {
    name: 'c5p2-start',
    page: 'c5p2',
    steps: [{ wait: 2 }],
    note: '5-2 「射氣球攤」 (#121): the balloon-dart stall, its prize shelf dark. The empty balloon basket floats level with the shelf; Baokaka cuddles Mocha under the stall\'s pole. The knot of the balloon bunch is the 淘氣.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c5p2-clerk',
    page: 'c5p2',
    steps: [{ mocha: 'rim' }, { wait: 1 }],
    show: { talk: ['c5p2.clerk.1', 'c5p2.clerk.2', 'c5p2.clerk.3'] },
    note: '5-2: Mocha jumped into the balloon basket and his weight sank it to the ground; the 店員小哥 runs this stall too — 「叮咚～歡迎光臨！」「……射氣球也是你們的？」「我們是連鎖的。」',
  },
  {
    name: 'c5p2-risen',
    page: 'c5p2',
    steps: [{ mocha: 'rim' }, { wait: 'settle' }, { mocha: 'awning' }, { wait: 'settle' }],
    note: '5-2: Baokaka crawled into the basket after Mocha; Mocha jumped out onto the awning and, without his weight, the basket floated up with Baokaka to the prize shelf (Mocha is a weight). From up here 哇！ reaches the bulbs.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c5p2-loose',
    page: 'c5p2',
    steps: [{ tap: 'knot' }, { wait: 1 }],
    note: '5-2\'s 淘氣 (#122): the knot of the stall\'s spare bunch untied — every balloon floats off up the page (「飛走了～」); 咻咻 has already blown one loose over the stall.',
  },
  {
    name: 'c5p3-start',
    page: 'c5p3',
    steps: [{ wait: 1 }],
    note: '5-3 「抱抱」 (#121): a crowded lane of 士林夜市 — a wall of legs between Baokaka and the 雞排 stall, where the bead shines behind the counter. He crawled up to the crowd, beside the 夜市阿姨: 「來，阿姨抱！」',
    expect: { event: 'learn' },
  },
  {
    name: 'c5p3-learn',
    page: 'c5p3',
    steps: [{ wait: 1 }],
    show: { words: { card: 'hug' } },
    note: 'Learning 抱抱 (GDD § 5.4, #121): beside the 夜市阿姨 at the crowded lane — 「來，阿姨抱！」「抱抱！」 — the word card 「抱抱：大人載你走」 is taped over the dimmed page.',
    expect: { event: 'learn' },
  },
  {
    name: 'c5p3-carried',
    page: 'c5p3',
    steps: [{ wait: 1 }, { say: 'hug' }, { wait: 1 }],
    note: 'Carried (GDD § 2.4 抱抱, #120, on the real page since #121): the 夜市阿姨 walks the lane one edge a tick with him in her arms (the `carried` frame, legs dangling), over the crowd of legs that blocks his own crawl.',
    expect: { mode: 'carried' },
  },
  {
    name: 'c5p3-boss',
    page: 'c5p3',
    steps: [{ wait: 'settle' }, { say: 'hug' }, { wait: 'settle' }, { mocha: 'bell' }, { wait: 1 }],
    show: { talk: ['c5p3.boss.1', 'c5p3.boss.2'] },
    note: '5-3: the 阿姨 set him down by the 雞排 stall; Mocha sits on the counter\'s bell, and the 雞排老闆 comes to the counter — 「來了！要切嗎？要辣嗎？」 (Mocha: 「……他只要抱抱。」). 抱抱 now, and he lifts Baokaka over the counter.',
  },
  {
    name: 'c5p3-twirl',
    page: 'c5p3',
    steps: [{ wait: 'settle' }, { say: 'hug' }, { wait: 'settle' }, { say: 'hug' }, { wait: 1 }],
    note: '5-3\'s 淘氣 (#122): set down by the stall, 抱抱 again before the 老闆 is called and the 夜市阿姨 carries him back over the crowd — with a twirl (「轉圈圈～」, her 茄芷袋 flying out). The 老闆 is still in the back at the fryer.',
    expect: { mode: 'carried' },
  },
  {
    name: 'c5p4-start',
    page: 'c5p4',
    steps: [{ wait: 'settle' }],
    note: '5-4 「彈珠台」 (#121): an old pachinko board; the bead is its ball, in the launcher at the top, and Baokaka reaches up for it. Two flipper tabs on the board (both to the right), the launch knob, the 彈珠台阿伯 dozing on his stool. Mocha on a stool.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c5p4-jackpot',
    page: 'c5p4',
    steps: [{ set: 'flipA', to: 'l' }, { mocha: 'knob' }, { wait: 1 }],
    show: { talk: ['c5p4.uncle.1'] },
    note: '5-4\'s 淘氣: the upper flipper to the left, the lower still to the right — Mocha leaned on the knob and the ball rattled into the jackpot hole; the 彈珠台阿伯 wakes up laughing 「哈哈哈！大獎！……沒有獎品啦。」',
  },
  {
    name: 'c5p4-tray',
    page: 'c5p4',
    steps: [{ set: 'flipA', to: 'l' }, { set: 'flipB', to: 'l' }, { mocha: 'knob' }, { wait: 1 }],
    note: '5-4: both flippers to the left, and Mocha on the knob: the ball ran down the left lane and out into the tray at Baokaka\'s side; he crawls to it.',
  },
  {
    name: 'c5p5-start',
    page: 'c5p5',
    steps: [{ wait: 'settle' }],
    note: '5-5 「按摩椅」 (#121): two coin massage chairs, upright; the bead on the top shelf over them. Baokaka reaches up from the foot of the chairs, beside the sleepy 阿伯 (a carrier); a stray dog naps on the second chair. Mocha on the shop\'s sign, a coin on each chair\'s coin box.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c5p5-steps',
    page: 'c5p5',
    steps: [{ mocha: 'box1' }, { wait: 'settle' }, { mocha: 'box2' }, { wait: 'settle' }, { say: 'bye' }, { wait: 1 }],
    note: '5-5: Mocha knocked a coin into each chair\'s slot — they hum and recline, their backs steps up to the shelf — and 掰掰 sent the dog padding off. The way is clear: 抱抱 the 阿伯 now.',
  },
  {
    name: 'c5p6-spread',
    page: 'c5p6',
    steps: [{ wait: 2 }],
    note: '5-6 「蔥抓餅」 as it opens (#121): the centrefold — the lane in front of the 蔥抓餅 stall (left), the counter with its shining griddle, the stall behind it upstage with the vendor and a tall stack of trays (right). The griddle is a decoy: Baokaka crawled under it and reaches up.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c5p6-over',
    page: 'c5p6',
    steps: [{ mocha: 'sign' }, { wait: 'settle' }, { say: 'no' }, { wait: 'settle' }, { say: 'hug' }, { wait: 1 }],
    show: { talk: ['c5p6.vendor.1', 'c5p6.vendor.2'] },
    note: '5-6: Mocha on the stall\'s sign and 不要！ to the griddle brought him along the counter to the vendor; 抱抱, and she lifts him across the counter — 「小帥哥，要不要加蛋？」 (Mocha: 「……不要問我。」).',
  },
  {
    name: 'c5p6-trays',
    page: 'c5p6',
    steps: [{ mocha: 'sign' }, { wait: 'settle' }, { say: 'no' }, { wait: 'settle' }, { say: 'hug' }, { wait: 'settle' }, { mocha: 'trays' }, { wait: 2 }],
    note: '5-6: inside the stall, Mocha jumped onto the tray stack and his weight sank it: the 蔥 on the bottom tray comes into view, and Baokaka crawls to it (the photo moment is next).',
  },
  // ——— Chapter 6 「飛機睡著的時候」 (#123; its art #124) ———
  {
    name: 'c6p1-start',
    page: 'c6p1',
    steps: [{ wait: 2 }],
    note: '6-1 「文湖線前窗」 (#123): the front car of a driverless 文湖線 train, stopped at a junction in the dark — its big front window over the track, the track-switch tab under it (on the depot loop). Baokaka cuddles Mocha on a hand strap by the doors, where a cabin-crew 姊姊 dozes; a paw print on the dashboard.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c6p1-loop',
    page: 'c6p1',
    steps: [{ mocha: 'dash' }, { wait: 'settle' }, { say: 'beep' }],
    note: '6-1: Mocha on the dashboard brought Baokaka to the front window, and his 嗶！ started the driverless train — down the depot loop, the switch still on it (the 淘氣 counts three loops; the 土地公 waves from the depot\'s shed).',
    expect: { mode: 'saying', event: 'beep' },
  },
  {
    name: 'c6p1-airport',
    page: 'c6p1',
    steps: [{ mocha: 'dash' }, { wait: 'settle' }, { set: 'switch', to: 'airport' }, { say: 'beep' }, { wait: 'settle' }],
    note: '6-1: the switch thrown to the airport and 嗶！: the train ran into 松山機場 and the bead shines on the platform; Baokaka crawled to the doors and reaches up the step, beside the dozing 姊姊.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c6p1-crew',
    page: 'c6p1',
    steps: [{ mocha: 'dash' }, { wait: 'settle' }, { set: 'switch', to: 'airport' }, { say: 'beep' }, { wait: 'settle' }, { say: 'hug' }, { wait: 1 }],
    show: { talk: ['c6p1.crew.1'] },
    note: '6-1: 抱抱 — the cabin-crew 姊姊 wakes (「嗯……到機場了？姊姊抱你下車。」) and lifts him off the train onto the platform.',
    expect: { mode: 'carried' },
  },
  {
    name: 'c6p2-start',
    page: 'c6p2',
    steps: [{ wait: 'settle' }],
    note: '6-2 「行李轉盤」 (#123): the baggage carousel at night, switched off (its beacon dark); a suitcase on the back run, the bead on the floor past the far end. Baokaka reaches from the near end. Mocha on the carousel\'s island; paw prints behind the rubber curtain (the start button) and on a second suitcase.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c6p2-clerk',
    page: 'c6p2',
    steps: [{ wait: 'settle' }, { mocha: 'button' }, { wait: 1 }],
    show: { talk: ['c6p2.clerk.1', 'c6p2.clerk.2', 'c6p2.clerk.3'] },
    note: '6-2: Mocha squeezed through the rubber curtain onto the start button; the beacon spins — and the 店員小哥 minds the baggage hall too: 「叮咚～歡迎光臨！」「……行李轉盤也是你們的？」「我們是連鎖的。」',
  },
  {
    name: 'c6p2-aboard',
    page: 'c6p2',
    steps: [{ wait: 'settle' }, { mocha: 'button' }, { wait: 'settle' }, { set: 'belt', to: '2' }, { wait: 'settle' }],
    note: '6-2: the belt turned two slots brought the suitcase round to the near end, and Baokaka crawled onto it; one more turn and it carries him to the bead.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c6p3-start',
    page: 'c6p3',
    steps: [{ wait: 2 }],
    note: '6-3 「看飛機」 (#123): the airport\'s rooftop observation deck at night, a sleeping plane on the apron beyond the glass. A little gate shuts off the deck\'s far end, pigeons roosting on its push button. Baokaka cuddles Mocha on the bench by the stairs; a paw print on the window rail.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c6p3-learn',
    page: 'c6p3',
    steps: [{ wait: 2 }, { mocha: 'rail' }, { wait: 1 }],
    show: { words: { card: 'plane' } },
    note: 'Learning 飛機！ (GDD § 5.4, #123): Mocha on the window rail drew him to the glass; the sleeping plane\'s lights blinked, he pointed — 「飛……飛機！」 — and the word card 「飛機！：鳥都飛起來」 is taped over the dimmed page.',
    expect: { event: 'learn' },
  },
  {
    name: 'c6p3-gate',
    page: 'c6p3',
    steps: [{ mocha: 'rail' }, { wait: 'settle' }, { say: 'plane' }],
    note: '6-3: 飛機！ — the pigeons flew up off the gate\'s button, the gate swung open and the bead shines at the deck\'s end; the plane winked its lights (the 土地公 on its tail fin).',
    expect: { mode: 'saying', event: 'sky' },
  },
  {
    name: 'c6p4-start',
    page: 'c6p4',
    steps: [{ wait: 'settle' }],
    note: '6-4 「空橋」 (#123): the jet bridge from the gate lounge, pulled in, its cab stowed along the terminal; a flock of night birds roosts on the cab\'s gangplank, its end dragging on the apron. The bead shines in the A321\'s open door; Baokaka reaches from the bridge\'s end. The extend tab and the cab\'s wheel (locked while the birds roost).',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c6p4-swung',
    page: 'c6p4',
    steps: [{ wait: 'settle' }, { set: 'extend', to: 'out' }, { wait: 'settle' }, { say: 'plane' }, { set: 'swing', to: 'jet' }, { wait: 'settle' }],
    note: '6-4: the bridge pulled out (he crawled into the cab), 飛機！ sent the birds up — the plank tipped up and the cab swung free — and the cab is at the A321\'s door, the plank\'s end in the air. One more 飛機！ brings the birds back to tip it down onto the sill.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c6p4-cargo',
    page: 'c6p4',
    steps: [{ wait: 'settle' }, { set: 'extend', to: 'out' }, { wait: 'settle' }, { say: 'plane' }, { set: 'swing', to: 'cargo' }],
    note: '6-4\'s 淘氣: the jet bridge parked at the wrong plane — the 貨機 behind the A321 (the 土地公 in its window).',
  },
  {
    name: 'c6p5-start',
    page: 'c6p5',
    steps: [{ wait: 2 }],
    note: '6-5 「塔台」 (#123): the catwalk round the control tower\'s cab, at night. The signal searchlight throws its pool on the railing; pigeons doze on the catwalk round the crate of spare bulbs; the runway lights are out. Baokaka cuddles Mocha on the antenna mast. The radio on the sill is the 淘氣.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c6p5-radio',
    page: 'c6p5',
    steps: [{ wait: 2 }, { tap: 'radio' }],
    show: { talk: ['c6p5.tower.1', 'c6p5.tower.2'] },
    note: '6-5: the radio answers its first 「Over。」 with the tower\'s log (§ 5.2 6-5, the chapter\'s 咻咻 beat): 「剛剛有朵雲問：可以起飛嗎？」「我說不行。Over。」',
  },
  {
    name: 'c6p5-light',
    page: 'c6p5',
    steps: [{ say: 'plane' }, { mocha: 'crate' }, { wait: 'settle' }, { set: 'searchlight', to: 'far' }, { wait: 'settle' }],
    note: '6-5: 飛機！ lifted the pigeons off the catwalk, Mocha curled up in the crate (out of sight), and Baokaka followed the searchlight\'s pool to the catwalk\'s far end, where he reaches up for it — in 哇！\'s reach of the runway lights.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c6p5-runway',
    page: 'c6p5',
    steps: [{ say: 'plane' }, { mocha: 'crate' }, { wait: 'settle' }, { set: 'searchlight', to: 'far' }, { wait: 'settle' }, { say: 'wow' }, { wait: 1 }],
    note: '6-5 (#124): from the catwalk\'s far end his 哇！ reached the runway lights\' switch box — the whole runway far below lights up, white and amber edge lights converging on the dark, green across the threshold, the approach lights running in — and the bead glints by the door.',
  },
  {
    name: 'c6p6-spread',
    page: 'c6p6',
    steps: [{ wait: 2 }],
    note: '6-6 「海關的印章」 as it opens (#123): the centrefold — the queue (left), the X-ray machine and its belt across the middle, the customs officer\'s high counter (right) with the 印章 on its ink pad. Pigeons doze in the tray at the belt\'s mouth; Baokaka reaches up for the 印章 from the queue. Mocha on the rope post.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c6p6-xray',
    page: 'c6p6',
    steps: [{ say: 'plane' }, { wait: 'settle' }, { say: 'beep' }, { set: 'belt', to: '1' }],
    show: { talk: ['c6p6.xray.1'] },
    note: '6-6: 飛機！ sent the pigeons up, he climbed into the tray, 嗶！ woke the scanner, and the belt carries him into the X-ray tunnel — the screen shows his silhouette and a bottle (Mocha: 「X光說：寶寶一個，奶瓶一支。」).',
    expect: { event: 'ride' },
  },
  {
    name: 'c6p6-pushed',
    page: 'c6p6',
    steps: [{ say: 'plane' }, { wait: 'settle' }, { say: 'beep' }, { set: 'belt', to: '2' }, { wait: 'settle' }, { mocha: 'counter' }, { wait: 2 }],
    note: '6-6: off the belt under the counter, Mocha on the counter gave the camera his look and pushed the 印章 off; it landed beside Baokaka and he grabs it — 「這個！」 (in the game the photo moment frames this; the 土地公 in his 機場背心 on the passport-stamp poster).',
    expect: { event: 'grab' },
  },
  // ——— Chapter 7 「纜車上的月亮」 (#125; its art #126) ———
  {
    name: 'c7p1-start',
    page: 'c7p1',
    steps: [{ wait: 'settle' }],
    note: '7-1 「往動物園」 (#125): 動物園 station at the end of the 文湖線, the elevated platform. Baokaka crawled off under the zoo\'s lit panda sign at the platform\'s far end (a decoy) and reaches for it 「要！要！」. A zookeeper dozes at the top of the stairs; in the plaza below, night herons doze on the path to the zoo\'s gateway. Mocha on the bench; a paw print on the plaza\'s lamp post.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c7p1-stairs',
    page: 'c7p1',
    steps: [{ mocha: 'lamp' }, { wait: 'settle' }, { say: 'no' }, { wait: 'settle' }],
    note: '7-1: Mocha jumped down onto the plaza\'s lamp post, and 不要！ to the sign turned Baokaka round: he crawled to the top of the stairs beside the dozing keeper and reaches down for Mocha.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c7p1-keeper',
    page: 'c7p1',
    steps: [{ mocha: 'lamp' }, { wait: 'settle' }, { say: 'no' }, { wait: 'settle' }, { say: 'hug' }, { wait: 1 }],
    show: { talk: ['c7p1.keeper.1'] },
    note: '7-1: 抱抱 — the night-shift keeper wakes (「嗯……小朋友迷路了？叔叔抱你下樓。」) and carries him down the station\'s stairs.',
    expect: { mode: 'carried' },
  },
  {
    name: 'c7p1-herons',
    page: 'c7p1',
    steps: [{ mocha: 'lamp' }, { wait: 'settle' }, { say: 'no' }, { wait: 'settle' }, { say: 'hug' }, { wait: 'settle' }, { say: 'plane' }],
    note: '7-1: down in the plaza the bead glints in the zoo\'s gateway; 飛機！ lifts the night herons off the path (the 土地公 in his 叢林帽 on the gateway\'s arch).',
    expect: { mode: 'saying', event: 'sky' },
  },
  {
    name: 'c7p2-start',
    page: 'c7p2',
    steps: [{ wait: 'settle' }],
    note: '7-2 「纜車站」 (#125): the 貓空纜車\'s 動物園 station. The cable runs up over the zoo to the top station; the glass-floored 水晶車廂 waits at the bottom station and Baokaka has climbed into it (nearer the bead), reaching up for the bead past the top station\'s turnstile. The 店員小哥\'s shop cabin hangs at the top. The bullwheel\'s crank (bottom left); Mocha on the ticket booth.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c7p2-glass',
    page: 'c7p2',
    steps: [{ wait: 'settle' }, { mocha: 'cabinA' }],
    note: '7-2: a tap on the glass cabin\'s roof — Mocha won\'t set paw on a glass floor (C8): 「喵？」',
    expect: { event: 'mochaNope' },
  },
  {
    name: 'c7p2-clerk',
    page: 'c7p2',
    steps: [{ wait: 'settle' }, { set: 'cable', to: '2' }, { wait: 'settle' }, { mocha: 'cabinShop' }, { wait: 1 }],
    show: { talk: ['c7p2.clerk.1', 'c7p2.clerk.2', 'c7p2.clerk.3'] },
    note: '7-2: the crank turned two slots took the glass cabin (and Baokaka) up to the top station and brought the shop cabin down; Mocha jumped in — the 店員小哥\'s cameo: 「叮咚～歡迎光臨！」「……纜車也是你們的？」「行動分店。」',
  },
  {
    name: 'c7p2-docked',
    page: 'c7p2',
    steps: [{ wait: 'settle' }, { set: 'cable', to: '2' }, { wait: 'settle' }, { mocha: 'cabinShop' }, { wait: 'settle' }, { set: 'cable', to: '0' }],
    show: { talk: ['c7p2.clerk.4'] },
    note: '7-2: the shop cabin docked at the top with its customer aboard, and the 店員小哥 opens the turnstile (「貓空站到了，謝謝光臨！」); Baokaka crawls through to the bead.',
  },
  {
    name: 'c7p3-start',
    page: 'c7p3',
    steps: [{ wait: 2 }],
    note: '7-3 「茶園階梯」 (#125): 貓空\'s tea terraces at night, a 22-unit step up to each. Baokaka cuddles Mocha on the bench on the bottom path; a tea farmer picks tea on the first step. Paw prints on the farmer\'s stool and the tea shed\'s roof.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c7p3-learn',
    page: 'c7p3',
    steps: [{ mocha: 'shed' }, { wait: 'settle' }, { say: 'bye' }],
    show: { words: { card: 'climb' } },
    note: 'Learning 爬樓梯 (GDD § 5.4, #125): Mocha up on the tea shed drew Baokaka to the foot of the first step; 掰掰 — the farmer waved back and climbed up the terrace, Baokaka watched, grunted 「嘿！」 and copied him: the card 「爬樓梯：爬上一階」 is taped over the dimmed page.',
    expect: { event: 'learn' },
  },
  {
    name: 'c7p3-climb',
    page: 'c7p3',
    steps: [{ mocha: 'shed' }, { wait: 'settle' }, { say: 'bye' }, { wait: 1 }],
    show: { stepAt: 190 },
    note: '7-3: his first climb on a real terrace (D-83: the climb frames assume a 22-unit riser): the still is drawn mid-step, at the knee-over frame.',
    expect: { mode: 'moving' },
  },
  {
    name: 'c7p4-start',
    page: 'c7p4',
    steps: [{ wait: 'settle' }],
    note: '7-4 「水晶車廂」 (#125): inside the glass-floored gondola, three clouds drifting under the floor. Mocha is curled in his travel basket on the left bench (he won\'t look at a glass floor); the zoo\'s floodlight shines up through the left cloud\'s gap, and Baokaka climbed down onto the glass and sits in its pool of light. The right bench\'s seat is folded up.',
    expect: { mode: 'watching' },
  },
  {
    name: 'c7p4-tea',
    page: 'c7p4',
    steps: [{ tap: 'cloudR' }, { wait: 'settle' }],
    note: '7-4: the right cloud blown aside: a tea house\'s 黑糖珍奶 far below drew him to the right end of the glass, where he reaches down for it — under the cabin\'s reading lamp.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c7p4-lamp',
    page: 'c7p4',
    steps: [{ tap: 'cloudR' }, { wait: 'settle' }, { say: 'wow' }, { wait: 1 }],
    note: '7-4: 哇！ — the reading lamp came on, the glass floor turned into a mirror (the ground below is gone), and the bead glints on the luggage rack; he reaches up for it, the seat still folded.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c7p4-clouds',
    page: 'c7p4',
    steps: [{ wait: 'settle' }, { tap: 'cloudM' }, { tap: 'cloudR' }],
    show: { talk: ['c7p4.mocha.1'] },
    note: '7-4\'s 淘氣: every cloud blown aside — the zoo, the tea farm\'s shrine (the 土地公) and the tea house far below; Mocha looks down over the basket\'s rim and loafs in protest: 「……我不要往下看。」',
  },
  {
    name: 'c7p5-start',
    page: 'c7p5',
    steps: [{ wait: 2 }],
    note: '7-5 「大茶壺」 (#125): a giant teapot pouring over a pool of tea, two teacups floating on it, the big 茶海 cup on the bottom between them, the tea tins on a terrace across. Baokaka cuddles Mocha on the tea tray by the bank. The teapot\'s wheel.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c7p5-drained',
    page: 'c7p5',
    steps: [{ set: 'teapot', to: '0' }, { mocha: 'tins' }, { wait: 'settle' }],
    note: '7-5: the teapot set upright drained the pool (the 土地公 painted on its bottom); with the cups\' handles dry Mocha hopped across to the tea tins, and Baokaka reaches for him from the bank.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c7p5-cups',
    page: 'c7p5',
    steps: [{ set: 'teapot', to: '0' }, { mocha: 'tins' }, { wait: 'settle' }, { set: 'teapot', to: '1' }, { wait: 'settle' }],
    note: '7-5: the teapot tilted half way: the cups float a step under the bank and a step over the big cup, and Baokaka climbed across them to the far cup — a step under the terrace until the pool is full.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c7p5-watching',
    page: 'c7p5',
    steps: [{ wait: 2 }, { set: 'teapot', to: '1' }, { set: 'teapot', to: '2' }],
    show: { talk: ['c7p5.mocha.1'] },
    note: '7-5\'s 淘氣: the pool filled again with Mocha watching from the tray: 「……」',
  },
  {
    name: 'c7p6-spread',
    page: 'c7p6',
    steps: [{ wait: 'settle' }],
    note: '7-6 「菜園的芹菜」 as it opens (#125): the centrefold — a vegetable garden on the hill, the bottom path (left page) and two tall terrace walls up to the bamboo fence and the celery bed (right page), where 黑糖 the black bear sleeps. Baokaka reaches for the moon in the rain barrel at the wall\'s foot. Mocha on the scarecrow\'s hat.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c7p6-awake',
    page: 'c7p6',
    steps: [{ mocha: 'basket' }, { wait: 'settle' }, { say: 'no' }, { wait: 3 }],
    show: { talk: ['c7p6.bear.1', 'c7p6.bear.2'] },
    note: '7-6: Mocha in the bamboo basket and 不要！ to the moon: nothing left to want, Baokaka cried — and 黑糖 woke: 「歹、歹勢，我睡在芹菜上了。」「……熊也會說歹勢。」 The 芹菜 shows on its bed.',
    expect: { event: 'cry' },
  },
  {
    name: 'c7p6-carried',
    page: 'c7p6',
    steps: [{ mocha: 'basket' }, { wait: 'settle' }, { say: 'no' }, { wait: 'settle' }, { say: 'hug' }, { wait: 2 }],
    note: '7-6: 抱抱 — 黑糖 carries him up the tall terrace walls.',
    expect: { mode: 'carried' },
  },
  {
    name: 'c7p6-celery',
    page: 'c7p6',
    steps: [{ mocha: 'basket' }, { wait: 'settle' }, { say: 'no' }, { wait: 'settle' }, { say: 'hug' }, { wait: 'settle' }, { mocha: 'post' }, { wait: 'goal' }],
    note: '7-6: set down by the fence, Mocha onto the fence post lifted its latch, the gate swung open (the 土地公\'s little shrine in the corner), and Baokaka climbed the last step to the 芹菜 — 「這個！」 (in the game the photo moment frames this).',
    expect: { event: 'grab' },
  },
  // ——— Chapter 8 「熱呼呼的煙」 (#129; its art #130) ———
  {
    name: 'c8p1-start',
    page: 'c8p1',
    steps: [{ wait: 'settle' }],
    note: '8-1 「新北投支線」 (#129): the 新北投 branch line\'s hot-spring car. Baokaka climbed onto the middle seat under the stained-glass window (a decoy) and reaches for it 「要！要！」; his cushion keeps the dent. A 泡湯阿伯 dozes by his big wooden bath bucket in the aisle. Mocha on the luggage rack over the left bench; a paw print on the far rack.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c8p1-bucket',
    page: 'c8p1',
    steps: [{ mocha: 'rack2' }, { wait: 'settle' }, { say: 'no' }, { wait: 'settle' }],
    note: '8-1: Mocha up on the far luggage rack past the bucket, and 不要！ to the window turned Baokaka round: he climbed down to the dozing 阿伯 and reaches for Mocha over the bucket (the 土地公 in his 毛巾 beside Mocha on the rack).',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c8p1-uncle',
    page: 'c8p1',
    steps: [{ mocha: 'rack2' }, { wait: 'settle' }, { say: 'no' }, { wait: 'settle' }, { say: 'hug' }, { wait: 1 }],
    show: { talk: ['c8p1.uncle.1'] },
    note: '8-1: 抱抱 — the 泡湯阿伯 wakes (「嗯……要去泡湯喔？阿伯抱你過去。」) and lifts him over the bucket.',
    expect: { mode: 'carried' },
  },
  {
    name: 'c8p2-start',
    page: 'c8p2',
    steps: [{ wait: 2 }],
    note: '8-2 「地熱谷」 (#129): the steaming green pool of Thermal Valley. Baokaka cuddles Mocha on the boardwalk\'s lamp. Two vents in the pool, each with a valve on the front rim: the far one is on (its paper cloud floats high in the steam), the near one off (its cloud sits on the vent). A paw print on the rock by the far vent.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c8p2-steam',
    page: 'c8p2',
    steps: [{ wait: 2 }, { mocha: 'rockB' }],
    note: '8-2: a tap on the rock by the far vent while its steam is on — Mocha\'s fur puffs up: 「不要。」 (C7).',
    expect: { event: 'mochaPuff' },
  },
  {
    name: 'c8p2-rock',
    page: 'c8p2',
    steps: [{ set: 'valveB', to: 'off' }, { mocha: 'rockB' }, { wait: 'settle' }, { set: 'valveA', to: 'on' }, { wait: 'settle' }],
    note: '8-2: the far vent turned off (its cloud sank; the 土地公 in his 毛巾 soaks in its pool), Mocha jumped onto its rock, and the near vent turned on: its cloud rose level with the boardwalk and Baokaka crawled onto it, reaching for Mocha.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c8p2-across',
    page: 'c8p2',
    steps: [{ set: 'valveB', to: 'off' }, { mocha: 'rockB' }, { wait: 'settle' }, { set: 'valveA', to: 'on' }, { wait: 'settle' }, { set: 'valveB', to: 'on' }, { wait: 2 }],
    note: '8-2: the far vent back on — the steam came up under Mocha (he stays, fur on end) and lifted the far cloud: Baokaka climbed onto it beside him and sees the bead on the rocks.',
  },
  {
    name: 'c8p3-start',
    page: 'c8p3',
    steps: [{ wait: 2 }],
    note: '8-3 「呼呼」 (#129): the bath\'s boardwalk, a cloud of steam over it half way along. Baokaka cuddles Mocha on the bench\'s back; the 溫泉阿嬤 sits at the bench\'s end in her sun hat with a hot-spring egg. A paw print on the rock past the steam.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c8p3-learn',
    page: 'c8p3',
    steps: [{ mocha: 'rock' }, { wait: 1 }],
    show: { words: { card: 'whoosh' } },
    note: 'Learning 咻—— (GDD § 5.4, #129): Mocha past the steam drew Baokaka to its edge; the 溫泉阿嬤 blew on her egg (「蛋很燙，呼呼再吃。」) and he copied her: the card 「咻——：吹動輕的東西」 is taped over the dimmed page.',
    expect: { event: 'learn' },
  },
  {
    name: 'c8p3-whoosh',
    page: 'c8p3',
    steps: [{ mocha: 'rock' }, { wait: 'settle' }, { say: 'whoosh' }],
    note: '8-3: 咻—— — he blows the way he faces, and the steam over the boardwalk clears; the bead shows at its end.',
    expect: { mode: 'saying', event: 'whoosh' },
  },
  {
    name: 'c8p3-hat',
    page: 'c8p3',
    steps: [{ mocha: 'rock' }, { wait: 'settle' }, { mocha: 'bench' }, { wait: 'settle' }, { say: 'whoosh' }],
    show: { talk: ['c8p3.granny.1'] },
    note: '8-3\'s 淘氣: Mocha back on the bench, Baokaka crawled back to him facing the 阿嬤 — 咻—— blew her sun hat off: 「哎唷！我的帽子！」',
  },
  {
    name: 'c8p4-start',
    page: 'c8p4',
    steps: [{ wait: 2 }],
    note: '8-4 「北投圖書館」 (#129): the wooden library, two floors. Baokaka cuddles Mocha on the bookcase by the door downstairs; the book lift\'s tray waits at the bottom of its belt, the pinwheel sits in the window box outside the shut window (bottom left), and a paw print on the balcony rail upstairs.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c8p4-facing',
    page: 'c8p4',
    steps: [{ mocha: 'rail' }, { wait: 'settle' }, { tap: 'window' }],
    note: '8-4: Mocha up on the balcony rail: Baokaka climbed onto the book tray and reaches up and left for him — facing the pinwheel; the window is open (the 土地公 in his 毛巾 on the balcony).',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c8p4-riding',
    page: 'c8p4',
    steps: [{ mocha: 'rail' }, { wait: 'settle' }, { tap: 'window' }, { say: 'whoosh' }],
    note: '8-4: 咻—— through the open window — the pinwheel spins a quarter turn, and the belt carries the tray (and him) a slot up.',
    expect: { event: 'ride' },
  },
  {
    name: 'c8p5-start',
    page: 'c8p5',
    steps: [{ wait: 2 }],
    note: '8-5 「大浴池」 (#129): the old bathhouse\'s big bath, full, two wooden tubs floating side by side in the middle. Baokaka cuddles Mocha on the stack of bath stools by the near deck; the tap on the wall; the 店員小哥\'s shop counter across the bath (a paw print), the 土地公 soaking in the far corner.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c8p5-clerk',
    page: 'c8p5',
    steps: [{ set: 'tap', to: 'low' }, { mocha: 'counter' }, { wait: 1 }],
    show: { talk: ['c8p5.clerk.1', 'c8p5.clerk.2', 'c8p5.clerk.3'] },
    note: '8-5: the bath drained (the tubs sit on the bottom), Mocha hopped across the stepping stone to the shop counter — the 店員小哥\'s cameo: 「叮咚～歡迎光臨！」「……澡堂也是你們的？」「我們是連鎖的。」',
  },
  {
    name: 'c8p5-tub',
    page: 'c8p5',
    steps: [{ set: 'tap', to: 'low' }, { mocha: 'counter' }, { wait: 'settle' }, { set: 'tap', to: 'mid' }, { wait: 'settle' }, { set: 'tap', to: 'high' }, { wait: 'settle' }],
    note: '8-5: half full, the near tub came to the deck and he climbed in; full, it drifted out beside the far tub and he crawled across into it — reaching for Mocha until the far tub drifts to the far step.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c8p5-empty',
    page: 'c8p5',
    steps: [{ set: 'tap', to: 'low' }, { mocha: 'counter' }, { wait: 'settle' }, { set: 'tap', to: 'high' }],
    show: { talk: ['c8p5.mocha.1'] },
    note: '8-5\'s 淘氣: filled straight from empty, Mocha\'s tub (the paw print on its side) floats out to him with nobody in it: 「……我不坐。」',
  },
  {
    name: 'c8p6-spread',
    page: 'c8p6',
    steps: [{ wait: 'settle' }],
    note: '8-6 「澡堂的算盤」 as it opens (#129): the centrefold — the old bathhouse\'s front hall, a giant abacus leaning on the 番台\'s high counter, steam off the hot-water urn, the 算盤 glinting behind the cashier\'s shut window. Baokaka reaches for it from the foot of the abacus; the three rods\' handles at the bottom. Mocha on the stack of wooden buckets.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c8p6-stairs',
    page: 'c8p6',
    steps: [{ set: 'rodLow', to: '0' }, { set: 'rodMid', to: '1' }, { set: 'rodTop', to: '2' }, { wait: 'settle' }],
    note: '8-6: the rods slid into a staircase — bottom left, middle in the middle, top right — and he climbed it to the top rod, facing the counter, where the steam is in his way.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c8p6-bell',
    page: 'c8p6',
    steps: [{ set: 'rodLow', to: '0' }, { set: 'rodMid', to: '1' }, { set: 'rodTop', to: '2' }, { wait: 'settle' }, { say: 'whoosh' }, { mocha: 'bell' }, { wait: 1 }],
    show: { talk: ['c8p6.cashier.1', 'c8p6.cashier.2'] },
    note: '8-6: 咻—— blew the steam off the counter (the 土地公 on the urn), Mocha jumped onto the bell — it rang, and the cashier opened her window: 「歡迎光臨！大人五十，囡仔免錢。」「……貓呢？」',
  },
  {
    name: 'c8p6-one',
    page: 'c8p6',
    steps: [{ wait: 'settle' }, { set: 'rodLow', to: '1' }],
    show: { talk: ['c8p6.mocha.1'] },
    note: '8-6\'s 淘氣: 「1」 on the abacus — one bead on the bottom rod, none on the others: 「一。……一歲，生日快樂。」',
  },
  {
    name: 'c8p6-abacus',
    page: 'c8p6',
    steps: [{ set: 'rodLow', to: '0' }, { set: 'rodMid', to: '1' }, { set: 'rodTop', to: '2' }, { wait: 'settle' }, { say: 'whoosh' }, { mocha: 'bell' }, { wait: 'goal' }],
    note: '8-6: through the 番台\'s window to the 算盤 — 「這個！」 (in the game the photo moment frames this).',
    expect: { event: 'grab' },
  },
  // ——— Chapter 9 「河的盡頭是海」 (#131; its art #132) ———
  {
    name: 'c9p1-start',
    page: 'c9p1',
    steps: [{ wait: 'settle' }],
    note: '9-1 「往淡水」 (#131): the 淡水信義線 above ground at dawn. Baokaka climbed onto the bench at the near end to cuddle Mocha on the luggage rack; the window seat at the far end, its blind down, sparrows asleep along the sill; a paw print on the far rack.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c9p1-seat',
    page: 'c9p1',
    steps: [{ mocha: 'rack2' }, { wait: 'settle' }],
    note: '9-1: Mocha along the racks to the far one — Baokaka crawled down the car and climbed onto the window seat under him, facing the blind.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c9p1-blind',
    page: 'c9p1',
    steps: [{ mocha: 'rack2' }, { wait: 'settle' }, { say: 'whoosh' }, { wait: 2 }],
    note: '9-1: 咻—— — the blind flew up on the dawn (the river, the 關渡 bridge; the 土地公 in his 船長帽 on its arch), and the bead shines on the sill under the sleeping sparrows: he reaches 「要！要！」.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c9p1-sparrows',
    page: 'c9p1',
    steps: [{ mocha: 'rack2' }, { wait: 'settle' }, { say: 'whoosh' }, { wait: 2 }, { say: 'plane' }],
    note: '9-1: 飛機！ — the sparrows fly out of the window\'s open top, and the sill is clear.',
    expect: { mode: 'saying', event: 'sky' },
  },
  {
    name: 'c9p2-start',
    page: 'c9p2',
    steps: [{ wait: 2 }],
    note: '9-2 「淡水老街」 (#131): the old street before the shops open. Baokaka cuddles Mocha on the lamp at the lane\'s end. The 阿給 shop\'s shutter is up, the 鐵蛋 shop\'s down (the 阿婆 dozing at her counter up the step); the 背包客 sits on his backpack in the lane reading his map. A paw print on the 鐵蛋 shop\'s signboard.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c9p2-cat',
    page: 'c9p2',
    steps: [{ mocha: 'sign' }, { wait: 'settle' }],
    note: '9-2: Mocha onto the 鐵蛋 shop\'s signboard — Baokaka set off, but passing the 阿給 shop he saw its 招財貓 glinting (a decoy) and reaches for it.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c9p2-backpacker',
    page: 'c9p2',
    steps: [{ mocha: 'sign' }, { wait: 'settle' }, { tap: 'shutterA' }, { wait: 'settle' }],
    note: '9-2: the 阿給 shop\'s shutter pulled down — he turned back to Mocha, but the 背包客 sits in the lane: he reaches for Mocha past him.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c9p2-pack',
    page: 'c9p2',
    steps: [{ mocha: 'sign' }, { wait: 'settle' }, { tap: 'shutterA' }, { wait: 'settle' }, { say: 'bye' }],
    show: { talk: ['c9p2.pack.1', 'c9p2.pack.2'] },
    note: '9-2: 掰掰 — the 背包客 waves back and gets up (§ 5.3, his third time): 「Excuse me… where is 101?」, Mocha: 「你從淡水走過去？……加油。」',
    expect: { event: 'wave' },
  },
  {
    name: 'c9p2-counter',
    page: 'c9p2',
    steps: [{ mocha: 'sign' }, { wait: 'settle' }, { tap: 'shutterA' }, { wait: 'settle' }, { say: 'bye' }, { wait: 'settle' }, { tap: 'shutterB' }, { wait: 'settle' }],
    note: '9-2: up the step under Mocha, and the 鐵蛋 shop\'s shutter rolled up: the bead on the counter, a grown-up\'s step too high — he reaches beside the dozing 阿婆 (the 土地公 on the bench beside the 背包客).',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c9p2-granny',
    page: 'c9p2',
    steps: [{ mocha: 'sign' }, { wait: 'settle' }, { tap: 'shutterA' }, { wait: 'settle' }, { say: 'bye' }, { wait: 'settle' }, { tap: 'shutterB' }, { wait: 'settle' }, { say: 'hug' }, { wait: 1 }],
    show: { talk: ['c9p2.granny.1'] },
    note: '9-2: 抱抱 — the 鐵蛋阿婆 wakes (「來，阿婆抱你看鐵蛋。」) and lifts him onto her counter.',
    expect: { mode: 'carried' },
  },
  {
    name: 'c9p3-start',
    page: 'c9p3',
    steps: [{ wait: 'settle' }],
    note: '9-3 「渡輪」 (#131): the 淡水 ferry at its pier. The bead glints on the high bench at the stern; Baokaka crawled to the pier\'s 悠遊卡 gate and reaches. A coil of rope fills the deck half way along; Mocha on the ticket booth; paw prints on the railing over the rope and on the horn.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c9p3-rope',
    page: 'c9p3',
    steps: [{ wait: 'settle' }, { say: 'beep' }, { wait: 'settle' }],
    note: '9-3: 嗶！ opened the gate; he crawled aboard as far as the rope and reaches up and over it for the bead on the bench.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c9p3-learn',
    page: 'c9p3',
    steps: [{ wait: 'settle' }, { say: 'beep' }, { wait: 'settle' }, { mocha: 'rail' }],
    show: { words: { card: 'cruise' } },
    note: 'Learning 扶著站 (GDD § 5.4, #131): Mocha onto the railing over the rope — reaching up to him, Baokaka grabbed the rail and stood up (a star bubble; Mocha: 「站、站起來了！……我沒有哭。」): the card 「扶著站：搆到高的地方」 is taped over the dimmed page.',
    expect: { event: 'learn' },
  },
  {
    name: 'c9p3-bench',
    page: 'c9p3',
    steps: [{ wait: 'settle' }, { say: 'beep' }, { wait: 'settle' }, { mocha: 'rail' }, { wait: 'goal' }],
    note: '9-3: holding the rail he sidestepped past the rope, and standing at the stern he took the bead off the high bench — 「這個！」',
    expect: { event: 'grab' },
  },
  {
    name: 'c9p3-horn',
    page: 'c9p3',
    steps: [{ mocha: 'rail' }, { wait: 'settle' }, { mocha: 'horn' }, { wait: 1 }],
    show: { talk: ['c9p3.horn.1'] },
    note: '9-3\'s 淘氣: Mocha on the ferry\'s horn — it honks: 「……不是我按的。」',
  },
  {
    name: 'c9p4-start',
    page: 'c9p4',
    steps: [{ wait: 2 }],
    note: '9-4 「漁人碼頭」 (#131): Fisherman\'s Wharf at noon, the 情人橋 behind. Baokaka cuddles Mocha on the boardwalk\'s lamp; past it the boardwalk is shut but for a plank along the railing; the dinghy floats a step under its end; across the water the far pier with the 店員小哥\'s ice-cream kiosk (a paw print) and the mooring bollard. The sun dial on the boardwalk.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c9p4-clerk',
    page: 'c9p4',
    steps: [{ set: 'dial', to: 'dawn' }, { mocha: 'kiosk' }, { wait: 1 }],
    show: { talk: ['c9p4.clerk.1', 'c9p4.clerk.2', 'c9p4.clerk.3'] },
    note: '9-4: the sun to dawn — the tide went out (the dinghy on the mud, the stepping stones out), and Mocha hopped across to the kiosk: the 店員小哥\'s cameo, 「叮咚～歡迎光臨！」「……碼頭也是你們的？」「我們是連鎖的。」',
  },
  {
    name: 'c9p4-rail',
    page: 'c9p4',
    steps: [{ set: 'dial', to: 'dawn' }, { mocha: 'kiosk' }, { wait: 'settle' }],
    note: '9-4: Baokaka stood and cruised along the railing to the boardwalk\'s end, and reaches for Mocha across the water.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c9p4-dinghy',
    page: 'c9p4',
    steps: [{ set: 'dial', to: 'dawn' }, { mocha: 'kiosk' }, { wait: 'settle' }, { set: 'dial', to: 'noon' }, { wait: 'settle' }],
    note: '9-4: noon — the dinghy floated up to the boardwalk\'s end and he climbed in.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c9p4-bollard',
    page: 'c9p4',
    steps: [{ set: 'dial', to: 'dawn' }, { mocha: 'kiosk' }, { wait: 'settle' }, { set: 'dial', to: 'noon' }, { wait: 'settle' }, { set: 'dial', to: 'sunset' }, { wait: 'goal' }],
    note: '9-4: sunset — the flood drifted the dinghy across; he crawled onto the pier and, standing, took the bead off the bollard (the 土地公 on the 情人橋 in the sunset).',
    expect: { event: 'grab' },
  },
  {
    name: 'c9p5-start',
    page: 'c9p5',
    steps: [{ wait: 'settle' }],
    note: '9-5 「淡江大橋」 (#131): the bridge\'s single tower at the river mouth. The bead glints on the tower\'s maintenance ledge across a gap; Baokaka reaches from the deck\'s edge. Gulls roost on the three stay cables (Sol, La, Do), the maintenance platform hangs up under the crossbeam, and a little cloud circles the tower.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c9p5-gulls',
    page: 'c9p5',
    steps: [{ wait: 'settle' }, { say: 'plane' }],
    note: '9-5: 飛機！ — the gulls lift off the cables (the 土地公 on the crossbeam); now the cables ring.',
    expect: { mode: 'saying', event: 'sky' },
  },
  {
    name: 'c9p5-tune',
    page: 'c9p5',
    steps: [{ wait: 'settle' }, { say: 'plane' }, { tap: 'sol' }, { tap: 'sol' }, { tap: 'la' }],
    note: '9-5: Sol, Sol, La — 生日快樂\'s first three notes, as the maintenance box\'s plate shows: the platform comes down into the gap.',
    expect: { event: 'partEnter' },
  },
  {
    name: 'c9p5-shushu',
    page: 'c9p5',
    steps: [{ wait: 'settle' }, { say: 'plane' }, { tap: 'sol' }, { tap: 'sol' }, { tap: 'la' }, { wait: 2 }],
    show: { talk: ['c9p5.shushu.1', 'c9p5.shushu.2', 'c9p5.shushu.3'] },
    note: '9-5: across on the tower\'s base he meets 咻咻 (GDD § 5.2 9-5; the world held for each line): 「橋塔旁邊，一朵小雲在繞圈圈。」「咻咻想飛出去……飛不出去。」「台北是盆地。四邊都是山。」',
    expect: { event: 'babyEnter' },
  },
  {
    name: 'c9p5-song',
    page: 'c9p5',
    steps: [{ wait: 'settle' }, { say: 'plane' }, { tap: 'sol' }, { tap: 'sol' }, { tap: 'la' }, { tap: 'sol' }, { tap: 'doh' }],
    show: { talk: ['c9p5.mocha.1'] },
    note: '9-5\'s 淘氣: on past the plate\'s three, Sol and Do — 生日快樂\'s first line on the cables: 「生日快樂……明天才是啦。」',
  },
  {
    name: 'c9p6-spread',
    page: 'c9p6',
    steps: [{ wait: 'settle' }],
    note: '9-6 「碼頭的聽診器」 as it opens (#131): the centrefold — 淡水\'s fishing harbour at first light, the fishing boat moored on the right with its sail up and the 聽診器 on its mast, the derrick\'s net basket waiting at the quay. Baokaka cuddles Mocha on the quay\'s lamp; gulls doze on the boat\'s rail.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c9p6-basket',
    page: 'c9p6',
    steps: [{ mocha: 'basket' }, { wait: 'settle' }],
    note: '9-6: Mocha into the net basket — Baokaka crawled in after him, facing the boat\'s sail.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c9p6-deck',
    page: 'c9p6',
    steps: [{ mocha: 'basket' }, { wait: 'settle' }, { say: 'whoosh' }, { say: 'whoosh' }, { mocha: 'wheelhouse' }, { wait: 'settle' }],
    note: '9-6: 咻——, 咻—— — the sail filled and the boom swung the basket up and onto the deck; Mocha hopped onto the wheelhouse, and Baokaka climbed out and stands at the rail: the 聽診器 on the mast, the gulls in the way.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c9p6-circle',
    page: 'c9p6',
    steps: [{ mocha: 'basket' }, { wait: 'settle' }, { say: 'whoosh' }, { say: 'whoosh' }, { say: 'whoosh' }, { say: 'whoosh' }],
    note: '9-6\'s 淘氣: four 咻—— from the basket — round the whole circle, back at the quay.',
    expect: { event: 'ride' },
  },
  {
    name: 'c9p6-stethoscope',
    page: 'c9p6',
    steps: [{ mocha: 'basket' }, { wait: 'settle' }, { say: 'whoosh' }, { say: 'whoosh' }, { mocha: 'wheelhouse' }, { wait: 'settle' }, { say: 'plane' }, { wait: 'goal' }],
    note: '9-6: 飛機！ lifted the gulls off the rail; he sidestepped along it to the mast and reached up for the 聽診器 — 「這個！」 (in the game the photo moment frames this).',
    expect: { event: 'grab' },
  },
  // ——— Chapter 10 「離天空最近的地方」 (#133; its art #134) ———
  {
    name: 'c10p1-start',
    page: 'c10p1',
    steps: [{ wait: 'settle' }],
    note: '10-1 「信義線」 (#133): the 月亮線 toward 101. Baokaka cuddles Mocha on the luggage rack over him; the door to the next car is shut, a commuter sleeps there with his legs across the aisle, and birthday balloons bob against the front window. A paw print on the front rack.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c10p1-door',
    page: 'c10p1',
    steps: [{ mocha: 'rack2' }, { wait: 'settle' }],
    note: '10-1: Mocha along the racks to the front of the train — Baokaka set off after him and reaches at the shut door between the cars.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c10p1-commuter',
    page: 'c10p1',
    steps: [{ mocha: 'rack2' }, { wait: 'settle' }, { say: 'beep' }, { wait: 'settle' }],
    note: '10-1: 嗶！ slid the door open; the sleeping commuter\'s legs are across the aisle, and he reaches past them for Mocha.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c10p1-view',
    page: 'c10p1',
    steps: [{ mocha: 'rack2' }, { wait: 'settle' }, { say: 'beep' }, { wait: 'settle' }, { say: 'bye' }, { wait: 'settle' }, { say: 'whoosh' }],
    show: { talk: ['c10.intro.3', 'c10.intro.4'] },
    note: '10-1: 掰掰 (the commuter tucked his legs up; the 土地公 in his 清潔帽 asleep beside him), then 咻—— under the front window — the balloons float up and 101 is in the window: 「ㄅㄚ！」 「對，101。咻咻在最上面。」',
    expect: { event: 'partEnter' },
  },
  {
    name: 'c10p1-wow',
    page: 'c10p1',
    steps: [{ mocha: 'rack2' }, { wait: 'settle' }, { say: 'beep' }, { wait: 'settle' }, { say: 'bye' }, { wait: 'settle' }, { say: 'whoosh' }, { say: 'wow' }],
    show: { talk: ['c10p1.mocha.1'] },
    note: '10-1\'s 淘氣: 哇！ to 101 in the window — 「……他在跟101打招呼。」',
    expect: { event: 'wow' },
  },
  {
    name: 'c10p2-start',
    page: 'c10p2',
    steps: [{ wait: 'settle' }],
    note: '10-2 「37秒電梯」 (#133): 101\'s express elevator in cross-section. From the 5F ticket hall Baokaka reaches up the shaft for Mocha on the 89F gift shop\'s shelf; the car is up at 89F, the altitude dial over the shaft reads 89; the 清潔阿伯 mops by the window up there.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c10p2-car-down',
    page: 'c10p2',
    steps: [{ mocha: 'carPanel' }, { wait: 'settle' }],
    note: '10-2: Mocha into the car, onto its panel — the car took him down to 5F, and Baokaka crawled in to cuddle him.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c10p2-clerk',
    page: 'c10p2',
    steps: [{ mocha: 'carPanel' }, { wait: 'settle' }, { pet: true }],
    show: { talk: ['c10p2.clerk.1', 'c10p2.clerk.2', 'c10p2.clerk.3'] },
    note: '10-2: a tap on Mocha — the car went up with both of them (「三十七秒，從五樓到八十九樓。」), and the 店員小哥 greets them at 89F (§ 5.3, chapter 10): 「叮咚～歡迎光臨！」「……101也是你們的？」「我們在101也有分店。」',
    expect: { event: 'partEnter' },
  },
  {
    name: 'c10p2-window',
    page: 'c10p2',
    steps: [{ mocha: 'carPanel' }, { wait: 'settle' }, { pet: true }, { wait: 'settle' }],
    note: '10-2: the bead glints on the window ledge across the open floor; he crawled out as far as he can and reaches beside the 清潔阿伯 (the 土地公 in the gift shop\'s window).',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c10p2-carried',
    page: 'c10p2',
    steps: [{ mocha: 'carPanel' }, { wait: 'settle' }, { pet: true }, { wait: 'settle' }, { say: 'hug' }, { wait: 1 }],
    show: { talk: ['c10p2.uncle.1'] },
    note: '10-2: 抱抱 — the 清潔阿伯 lifts him (「來，阿伯抱你去窗邊看。」) and carries him across the floor to the window.',
    expect: { mode: 'carried' },
  },
  {
    name: 'c10p3-start',
    page: 'c10p3',
    steps: [{ wait: 'settle' }],
    note: '10-3 「八節」 (#133): up the outside of 101. Three of its sections turn, each with a balcony ledge; the bottom and top are in line, the middle turned left. Baokaka climbed onto the bottom ledge and reaches for the bead on the top one. The window-washer\'s crank turns the middle; Mocha on the gondola; paw prints on the bottom and top sections\' rims.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c10p3-held',
    page: 'c10p3',
    steps: [{ set: 'mid', to: '2' }, { mocha: 'rimTop' }, { wait: 'settle' }],
    note: '10-3: the crank turned right — all three sections turned with it; then Mocha onto the top section\'s rim: it holds still now.',
  },
  {
    name: 'c10p3-lined',
    page: 'c10p3',
    steps: [{ set: 'mid', to: '2' }, { mocha: 'rimTop' }, { wait: 'settle' }, { set: 'mid', to: '0' }, { mocha: 'rimLow' }, { wait: 'settle' }, { set: 'mid', to: '1' }, { wait: 1 }],
    note: '10-3: the crank back a step (the bottom came with it, the top held), Mocha onto the bottom\'s rim, the crank on a step (the top came with it): all three ledges in line, and he climbs.',
    expect: { event: 'babyEnter' },
  },
  {
    name: 'c10p3-smile',
    page: 'c10p3',
    steps: [{ mocha: 'rimTop' }, { wait: 'settle' }, { set: 'mid', to: '1' }, { mocha: 'rimLow' }, { wait: 'settle' }, { set: 'mid', to: '2' }],
    show: { talk: ['c10p3.mocha.1'] },
    note: '10-3\'s 淘氣: all three sections turned to the right — 「……整棟歪一邊。101在笑。」',
    expect: { event: 'partEnter' },
  },
  {
    name: 'c10p4-start',
    page: 'c10p4',
    steps: [{ wait: 'settle' }],
    note: '10-4 「阻尼球」 (#133): 101\'s tuned-mass damper, the great gold sphere hanging in the atrium. Baokaka reaches from the near balcony for the bead in the display on the far one; Mocha on the railing; paw prints on the cables\' mount and on the sphere.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c10p4-aboard',
    page: 'c10p4',
    steps: [{ wait: 'settle' }, { mocha: 'sphere' }, { wait: 'settle' }, { say: 'whoosh' }, { say: 'whoosh' }, { wait: 'settle' }],
    note: '10-4: Mocha onto the sphere, then 咻——, 咻—— — with the cat\'s weight it swung out to the far side and all the way back, and Baokaka climbed on beside Mocha.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c10p4-across',
    page: 'c10p4',
    steps: [{ wait: 'settle' }, { mocha: 'sphere' }, { wait: 'settle' }, { say: 'whoosh' }, { say: 'whoosh' }, { wait: 'settle' }, { say: 'whoosh' }, { say: 'whoosh' }, { wait: 'goal' }],
    note: '10-4: 咻——, 咻—— — out to the far side with him on it; he climbed off and took the bead from the display (the 土地公 on the damper\'s plaque).',
    expect: { event: 'grab' },
  },
  {
    name: 'c10p4-swing',
    page: 'c10p4',
    steps: [{ wait: 'settle' }, { mocha: 'sphere' }, { say: 'whoosh' }, { say: 'whoosh' }, { say: 'whoosh' }, { say: 'whoosh' }, { say: 'whoosh' }],
    show: { talk: ['c10p4.mocha.1'] },
    note: '10-4\'s 淘氣: five 咻—— in a row from the balcony — out, back, centre, out, back, Mocha riding every swing: 「……我暈了。」',
    expect: { event: 'partEnter' },
  },
  {
    name: 'c10p5-start',
    page: 'c10p5',
    steps: [{ wait: 'settle' }],
    show: { talk: ['c10p5.party.1', 'c10p5.party.2'] },
    note: '10-5 「咻咻的派對」 (#133): 101\'s roof terrace, 咻咻\'s sad party of blown-away things. 咻咻 cries rain from its cloud over the cake; a puddle on the floor; both of Mocha\'s perches are wet. Baokaka cuddles Mocha on the party lamp.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c10p5-learn',
    page: 'c10p5',
    steps: [{ wait: 1 }, { say: 'no' }, { wait: 3 }],
    show: { words: { card: 'together' } },
    note: 'Learning 一起 (GDD § 5.4, #133; the issue\'s `c10p3-learn` — 一起 is 10-5\'s): 不要！ to Mocha, the only thing he wanted — he cried under the crying cloud and said 「……一起。」 (Mocha: 「他說：『我們一起去。』」): the card 「一起：摩卡帶你走」 is taped over the dimmed page.',
    expect: { event: 'learn' },
  },
  {
    name: 'c10p5-puddle',
    page: 'c10p5',
    steps: [{ wait: 1 }, { say: 'no' }, { wait: 3 }, { say: 'together' }, { floor: 'P' }],
    note: '10-5: 一起 — Mocha hopped down beside him; the puddle tapped: Mocha walks through the water for him, Baokaka following, and 咻咻 comes down off its cloud.',
    expect: { mode: 'linked' },
  },
  {
    name: 'c10p5-hug',
    page: 'c10p5',
    steps: [{ wait: 1 }, { say: 'no' }, { wait: 3 }, { say: 'together' }, { floor: 'P' }, { wait: 'settle' }, { say: 'hug' }, { wait: 1 }],
    show: { talk: ['c10p5.hug.1', 'c10p5.hug.2'] },
    note: '10-5: 抱抱 — 咻咻 let go of the bead and he has it: 「……你們，來了？」「小雲放下珠珠，飄到更高的地方。」',
    expect: { event: 'grab' },
  },
  {
    name: 'c10p5-candles',
    page: 'c10p5',
    steps: [{ wait: 1 }, { say: 'no' }, { wait: 3 }, { say: 'together' }, { floor: 'Q1' }, { wait: 'settle' }, { floor: 'Q2' }, { wait: 'settle' }, { floor: 'Q3' }, { wait: 'settle' }, { floor: 'Q4' }, { wait: 'settle' }],
    show: { talk: ['c10p5.mocha.1'] },
    note: '10-5\'s 淘氣: led round 咻咻\'s table, all four corners — the cake\'s candles are lit: 「繞一圈。……蠟燭都亮了。」',
  },
  {
    name: 'c10p6-spread',
    page: 'c10p6',
    steps: [{ wait: 'settle' }],
    note: '10-6 「離天空最近的地方」 as it opens (#133): the centrefold — 101\'s outdoor observation deck at first light. Baokaka climbed to the railing and cruised to its end, and reaches for the 金鎖片 in 咻咻\'s cloud past the open deck; Mocha on the coin telescope.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c10p6-across',
    page: 'c10p6',
    steps: [{ wait: 'settle' }, { say: 'together' }, { floor: 'G' }, { wait: 2 }],
    show: { talk: ['c10p6.steps.1', 'c10p6.steps.2'] },
    note: '10-6: 一起, and the deck\'s far side tapped — Mocha walked across and waits there; 咻咻 came down beside him: 「沒有人說歡迎咻咻……」「寶咖咖放開了欄杆。」 (he learns 第一步).',
    expect: { event: 'learn' },
  },
  {
    name: 'c10p6-steps',
    page: 'c10p6',
    steps: [{ wait: 'settle' }, { say: 'together' }, { floor: 'G' }, { wait: 3 }],
    show: { talk: ['c10p6.steps.3'] },
    note: '10-6: the first wobbly step off the rail\'s end — 「一步。」 (the world held for each step\'s line).',
    expect: { event: 'babyEnter' },
  },
  {
    name: 'c10p6-lock',
    page: 'c10p6',
    steps: [{ wait: 'settle' }, { say: 'together' }, { floor: 'G' }, { wait: 'settle' }, { say: 'hug' }, { wait: 'goal' }],
    show: { talk: ['c10p6.hug.2', 'c10p6.hug.3'] },
    note: '10-6: three steps to Mocha (the photo moment framed them), then 抱抱 — 咻咻 let go of the 金鎖片 and floated up a little, calm: 「……抱抱？」「小雲，慢慢變白、變軟了。」 — and he has it back.',
    expect: { event: 'grab' },
  },
  {
    name: 'c0p2-start',
    page: 'c0p2',
    steps: [],
    note: '0-2 「沙發山」 as it opens (#106): Dad asleep on the sofa under his newspaper, the floor cushion at the sofa\'s foot (the bead is behind it, unseen), the TV\'s standby light; Baokaka on the rug. Placeholder environment art until #108.',
    expect: { mode: 'idle' },
  },
  {
    name: 'c0p2-watching',
    page: 'c0p2',
    steps: [{ wait: 2 }],
    note: '0-2: nothing shiny in sight, so he crawled to the TV and watches it, swaying (watch-sway, #141); his bubble is a music note.',
    expect: { mode: 'watching' },
  },
  {
    name: 'c0p2-bubble-tutorial',
    page: 'c0p2',
    steps: [{ wait: 2 }],
    show: { affordance: { bubble: true } },
    note: '0-2\'s scripted tutorial (#106, first play only): while he watches the TV, his thought bubble wears the pulsing marigold halo — "his bubble shows what he wants". Live, it comes back for the flip once the cushion shows the bead.',
    expect: { mode: 'watching' },
  },
  {
    name: 'c0p3-join',
    page: 'c0p3',
    steps: [],
    show: { talk: ['c0p3.join.1', 'c0p3.join.2', 'c0p3.join.3'] },
    note: '0-3 「摩卡起床」 as it opens (#106): Mocha wakes on the sofa arm and his join lines play (§ 5.2 P, first beat); the bead on the high 抓周 table, 阿嬤\'s 紅包 on the shelf, the paw prints on the table and the shelf (the first perches).',
    expect: { mode: 'idle' },
  },
  {
    name: 'c0p3-tutorial',
    page: 'c0p3',
    steps: [{ wait: 4 }],
    show: { affordance: { hint: { level: 2, key: 'perch:table' } } },
    note: '0-3\'s scripted tutorial (#106, first play only): after 4 s of reaching under the table, the ghost hand taps the table\'s paw print.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c0p3-eye-contact',
    page: 'c0p3',
    steps: [{ mocha: 'table' }],
    note: 'Mocha lands on the 抓周 table beside the bead and looks straight at the camera for a tick before the shove (C3; #95, #106).',
    expect: { event: 'mochaStare' },
  },
  {
    name: 'c0p3-envelope',
    page: 'c0p3',
    steps: [{ wait: 2 }, { mocha: 'shelf' }, { wait: 2 }],
    note: '0-3\'s 淘氣 (#106): Mocha pushed 阿嬤\'s 紅包 off the shelf and it landed beside Baokaka, who pats it — 「這個！」 (flavour: he still wants the bead).',
    expect: { event: 'land' },
  },
  {
    name: 'c0p4-start',
    page: 'c0p4',
    steps: [{ wait: 'settle' }],
    note: '0-4 「窗外的月亮線」 (#106): the curtain closed, Mocha on the windowsill; Baokaka crawled to him and cuddles. The laundry basket by the wall, the balcony door shut.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c0p4-mocha-inbox',
    page: 'c0p4',
    steps: [{ wait: 'settle' }, { mocha: 'basket' }],
    note: '0-4: Mocha hid in the laundry basket — only his head and paws show over the rim (in-box, #141) — and with nothing left to want Baokaka looks around, over his shoulder and far ahead (look L/R).',
    expect: { mode: 'looking' },
  },
  {
    name: 'c0p4-crying',
    page: 'c0p4',
    steps: [{ wait: 'settle' }, { mocha: 'basket' }, { wait: 2 }],
    note: 'Nothing to want: after looking for two ticks Baokaka cries 「哇——」 (GDD § 2.2.5); the cry opens the balcony door and wakes the 月亮線 train behind the curtain (#106).',
    expect: { mode: 'crying' },
  },
  {
    name: 'c0p4-train',
    page: 'c0p4',
    steps: [{ wait: 'settle' }, { mocha: 'basket' }, { wait: 2 }, { tap: 'curtain' }],
    note: '0-4 after the cry (#106): the curtain open on the lit 月亮線 train, the bead on its step, the door open; Baokaka crawls out to it. The 土地公 stands on the street below.',
    expect: { mode: 'moving' },
  },
  {
    name: 'c0p4-curtain-first',
    page: 'c0p4',
    steps: [{ wait: 'settle' }, { tap: 'curtain' }, { wait: 2 }],
    note: '0-4 with the curtain opened first (#183, the AI playtest\'s order trap): the 月亮線 train outside is dark and there is no bead on its step yet, so Baokaka still has only Mocha to want — hide him and he cries, and the cry lights the train and its bead.',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'c0p4-curtain-first-cry',
    page: 'c0p4',
    steps: [{ wait: 'settle' }, { tap: 'curtain' }, { wait: 2 }, { mocha: 'basket' }, { wait: 2 }],
    note: '0-4, curtain first then Mocha hidden (#183): nothing to want, he cries; the door opens and the lit train shows the bead on its step — the same aha in the other order.',
    expect: { mode: 'crying' },
  },
  {
    name: 'c1p5-nope',
    page: 'c1p5',
    steps: [{ mocha: 'carPanel' }, { wait: 'settle' }, { mocha: 'counter' }],
    note: '1-5 (#183): the car is down; a tap on the counter\'s paw print, which Mocha can\'t reach from B1 — he turns to look at it and says 「喵？」 while the paw shakes (GDD § 2.3; the shake is motion, so the still shows the bark and his look).',
    expect: { event: 'mochaNope' },
  },
  {
    name: 'c1p5-nudge',
    page: 'c1p5',
    steps: [{ mocha: 'carPanel' }, { wait: 'settle' }, { wait: 2 }],
    show: { affordance: { hint: { level: 0, key: 'mocha:mocha' }, mocha: 'wait' } },
    note: '1-5\'s first-play nudge (#183): 4 s after the car came down with them in it, Mocha taps his paw on the panel and shimmers once, and (live) says 「再按一次？」 — tap him to press again.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c1p3-hint-counter',
    page: 'c1p3',
    steps: [{ wait: 4 }],
    show: { hint: 1 },
    note: '1-3 at L1 (#183): the halo on the counter\'s paw print — over his thought bubble and every standee now, and the bubble keeps off it.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'c1p1-intro',
    page: 'c1p1',
    steps: [],
    show: { talk: ['rec.pa.ride.1', 'rec.pa.ride.2'] },
    note: '1-1 as it opens (#183): 廣播姊姊\'s two announcements keep off the strap and rack paw prints; the third strap, looped up with no ring, is plainly decoration. A tap anywhere reads them away.',
  },
  {
    name: 'c0p1-touch-watch',
    page: 'c0p1',
    steps: [],
    show: { gesture: { finger: [150, 250] } },
    note: '0-1 with a finger down on the page: the world pauses and Baokaka looks up at the finger (touch-watch, #141).',
  },
  {
    name: 'c1p2-mocha-glare',
    page: 'c1p2',
    steps: [],
    show: { gesture: { locked: { part: 'train', serial: 1 }, finger: [200, 520] } },
    note: '1-2 with a finger on a locked part: Mocha glares at it, ears back (#141), and Baokaka watches the finger.',
  },
  {
    name: 'cover-first',
    page: 'c0p1',
    steps: [],
    screen: { nav: { base: { kind: 'cover' }, layer: null }, save: FRESH },
    note: 'The cover on first launch (#97): the closed book on 阿嬤\'s table and quilt, Baokaka and Mocha beside it, only 「開始」.',
  },
  {
    name: 'cover-farewell',
    page: 'c0p1',
    steps: [],
    screen: { nav: { base: { kind: 'cover' }, layer: null }, save: FRESH, farewell: true },
    note: 'The first boot after the routing switch with an old RPG save (#109; GDD § 2.10): the save is gone, and a small paper note above 「開始」 says 「寶咖咖的新冒險開始了！」, once.',
  },
  {
    name: 'cover-continue',
    page: 'c1p2',
    steps: [],
    screen: { nav: { base: { kind: 'cover' }, layer: null }, save: PLAYED },
    note: 'The cover with a save (#97): 「繼續」 (one tap back to 1-2 「月台的縫」), then 目錄 / 相簿 / 設定.',
  },
  {
    name: 'contents-ch1',
    page: 'c1p2',
    steps: [],
    screen: { nav: { base: { kind: 'cover' }, layer: { kind: 'contents', chapter: 1 } }, save: PLAYED },
    note: 'The 目錄 (#97): the 月亮線 paper map (序 open and solved 3/12, 台北車站 open 1/18, the rest locked), chapter 1\'s page strip with the bookmark on 1-2.',
  },
  {
    name: 'contents-locked',
    page: 'c1p2',
    steps: [],
    screen: { nav: { base: { kind: 'cover' }, layer: { kind: 'contents', chapter: 1, locked: 4 } }, save: PLAYED },
    note: 'The 目錄 after tapping a station the line hasn\'t reached (西門町): 「月亮線還沒開到這裡。」',
  },
  {
    name: 'contents-all',
    page: 'c1p2',
    steps: [],
    screen: { nav: { base: { kind: 'cover' }, layer: { kind: 'contents', chapter: 1 } }, save: EVERYTHING, rewardTotal: BOOK },
    note: 'The 目錄 for the whole line (#113): all eleven stations — 序 12/12 and 台北車站 18/18 in foil (every page solved, every sticker), 大安森林 … 101 locked — and, every 土地公 found (`rewardTotal` the registry\'s size), the 「象山的日出」 postcard taped onto the map\'s free corner with a dotted gold branch from 101. Chapter 1\'s strip, all solved, with its 淘氣 list.',
  },
  {
    name: 'contents-bonus',
    page: 'c1p2',
    steps: [],
    screen: { nav: { base: { kind: 'cover' }, layer: { kind: 'contents', chapter: 1, bonus: true } }, save: EVERYTHING, rewardTotal: BOOK },
    note: 'The 「象山的日出」 postcard tapped (#113): ringed on the map; the panel names it and, until #135 builds the bonus page, says 「下一站還在畫……未完待續。」',
  },
  {
    name: 'page-hud',
    page: 'c1p2',
    steps: [],
    screen: { nav: ON_PAGE, save: PLAYED },
    note: '1-2 in the game shell (#97): the live HUD label (台北車站「月台的縫」, 第一章 · 第 2 頁 / 6, 00:20, the 抓周 tray) and the bottom bar with its 淘氣 sticker earned.',
  },
  {
    name: 'page-hud-left',
    page: 'c1p2',
    steps: [],
    screen: { nav: ON_PAGE, save: LEFT_HANDED },
    note: '1-2 in 左手模式 (#97): the bottom bar mirrored, the portrait on the right, the stickers on the left.',
  },
  {
    name: 'page-menu',
    page: 'c1p2',
    steps: [],
    screen: { nav: { base: { kind: 'page', id: 'c1p2', run: 0 }, layer: { kind: 'menu' } }, save: PLAYED },
    note: 'The pause menu over 1-2 (#97): 繼續 / 目錄 / 設定 / 封面 on the paper sheet; the page is held.',
  },
  {
    name: 'settings',
    page: 'c1p2',
    steps: [],
    screen: { nav: { base: { kind: 'cover' }, layer: { kind: 'settings' } }, save: PLAYED },
    note: '設定 (GDD § 2.11, § 5.7; #104): 長輩模式 first on its own card (關), then 速度 普通, 字的大小 標準, 自動提示 30秒, the 音效 80 % and 音樂 50 % sliders, 震動 開, 減少動態 / 左手模式 / 書本傾斜 關, and 「重新開始（按住三秒）」 at the bottom (scroll). The chosen option is navy with a ✓.',
  },
  {
    name: 'settings-elder',
    page: 'c1p2',
    steps: [],
    screen: { nav: { base: { kind: 'cover' }, layer: { kind: 'settings' } }, save: ELDER_ON },
    note: '設定 with 長輩模式 開 (#104) over a player who chose 快 and no auto hints: everything in 大字 (25 % larger), and 速度, 字的大小, 自動提示 held at 慢, 大字, 15秒 with a padlock and 「長輩模式幫你設好了」. Turning it off brings back 快 and 關.',
  },
  {
    name: 'page-big',
    page: 'c1p2',
    steps: [],
    screen: { nav: ON_PAGE, save: BIG_TEXT },
    note: '1-2 with 大字 (#104): the HUD\'s landmark 31 px and every other word 25 px (the chapter line and clock condensed to fit), the bar\'s labels 25 px; `check:ui` holds it to ≥ 24 px.',
  },
  {
    name: 'page-elder',
    page: 'c1p2',
    steps: [],
    screen: { nav: ON_PAGE, save: ELDER_ON },
    note: '1-2 in 長輩模式 (#104, bible § 9.3): 大字, the hold-to-reveal outlines always on (every touchable and prop dashed in chalk), the 28 px verb seals, and the perch markers bolder (bigger paws with an ink edge on a stronger halo).',
  },
  {
    name: 'subtitle-big',
    page: 'c1p2',
    steps: [],
    big: true,
    show: { talk: ['c1.intro.1', 'c1.intro.2', 'c1.intro.3'] },
    note: 'The three-line beat of `subtitle-3` in 大字 (#104): the bubbles and the narration strip grow 25 % so their text is ≥ 25 px, still clear of Baokaka and the bead.',
  },
  {
    name: 'c1p2-grab',
    page: 'c1p2',
    steps: [{ set: 'train', to: 'half' }, { wait: 'settle' }, { mocha: 'pillar' }, { set: 'train', to: 'full' }, { wait: 'goal' }],
    note: '1-2 completed (GDD § 2.8 step 1, #101): Baokaka grabs the bead — 「這個！」 and the foil sparkle burst where it lay (live: it flashes out once); the simulation stops, the page will fold.',
    expect: { mode: 'grabbing', event: 'grab' },
  },
  {
    name: 'sticker-card',
    page: 'c1p2',
    steps: [],
    screen: { nav: ON_PAGE, save: C1P2_DONE, card: true },
    note: 'The sticker card (GDD § 2.8, bible § 7; #101): 1-2 done and folded flat, the kraft card taped over it — 「月台的縫」, 解開 and 淘氣 slapped on (live: 200 ms apart, with a squash), 土地公 an empty dimple with his hat\'s silhouette, 「下一頁！」. A tap or 1.5 s turns the page.',
  },
  {
    name: 'chapter-card-p',
    page: 'c0p1',
    steps: [],
    screen: { nav: { base: { kind: 'page', id: 'c0p1', run: 0 }, layer: null }, save: FRESH, chapterCard: 0 },
    note: 'The prologue\'s chapter card (GDD § 2.13, § 5.2 P; bible § 7; #102): 「開始」 opens the book on the quilt and the departure board drops in on two strings — 序章 on the red spine, 「度晬前一晚」, 00:00, 家, the 翻 seal, the split-flap row 「下一站 家」 (live: it swings twice and the tiles flip in). Under it the first beat: 「明天，是寶咖咖一歲的生日。」「台灣話，叫做「度晬」。」 and 阿嬤\'s 「九樣寶物，長長久久。」; a tap is the next beat, then 0-1 opens on the rest.',
  },
  {
    name: 'chapter-card-c1',
    page: 'c1p2',
    steps: [],
    screen: { nav: ON_PAGE, save: PLAYED, chapterCard: 1 },
    note: 'Chapter 1\'s card in the chapter turn (#102): 第一章, 「便當的味道」, 00:20, 台北車站, 「下一站 台北車站」 on the split-flap tiles, over the book pulled back on the quilt; under it 廣播姊姊\'s 「下一站，台北車站。Next station…」, 摩卡\'s 「台北最大的車站。也最好迷路。」 and the narration strip. Tap through the lines and the card lifts away, the camera comes back in.',
  },
  {
    name: 'sticker-mischief',
    page: 'c1p2',
    steps: [{ set: 'train', to: 'half' }, { wait: 'settle' }, { set: 'train', to: 'out' }, { wait: 1 }, { set: 'train', to: 'half' }, { wait: 1 }, { set: 'train', to: 'out' }, { wait: 1 }, { set: 'train', to: 'half' }],
    show: { sticker: 'mischief' },
    note: '1-2 淘氣 (#101): the fourth ride on the train — 「嘿嘿，淘氣！」 pops on a kraft tag over the tray (live: the 嘿 sticker slaps on, the tag fades after 2 s), the page not finished.',
    expect: { event: 'ride' },
  },
  {
    name: 'sticker-tudigong',
    page: 'c1p2',
    steps: [{ tap: 'board' }, { wait: 1 }],
    show: { sticker: 'tudigong', talk: ['rec.uncle.tap'] },
    note: '1-2 土地公 (#101): the board flipped, he peeks from its corner; tapped, he says 「呵呵，囡仔，慢慢仔來。」 in his bubble and 「找到土地公！」 pops over the tray.',
  },
  {
    name: 'contents-mischief',
    page: 'c1p2',
    steps: [],
    screen: { nav: { base: { kind: 'cover' }, layer: { kind: 'contents', chapter: 1 } }, save: MISCHIEF_LIST },
    note: 'The 目錄 after 1-2\'s first completion (#101, GDD § 2.8): under the strip, the page\'s 淘氣 — its sticker and 「讓寶咖咖坐火車來回兩次」 — never shown before the page is solved.',
  },
  {
    name: 'bubble-reaching',
    page: 'c1p2',
    steps: [{ set: 'train', to: 'half' }, { wait: 4 }],
    note: '1-2: Baokaka at the gap reaching for the bead: the thought bubble shows the foil bead and 「要！」 (red serif, pulsing live), and he barks 「要！要！」 (#98).',
    expect: { mode: 'reaching', event: 'bark' },
  },
  {
    name: 'c0p2-change-of-mind',
    page: 'c0p2',
    steps: [{ wait: 2 }, { tap: 'cushion' }],
    note: 'The change of mind (GDD § 2.2.6, #98, #106): he watched the TV (a note) until the cushion showed the bead; the bubble flips to the bead and 「要！」 (live: the note pops, the bead inflates, the spring wobbles), he barks 「要！」 and turns back for it.',
    expect: { event: 'bark' },
  },
  {
    name: 'subtitle-3',
    page: 'c1p2',
    steps: [],
    show: { talk: ['c1.intro.1', 'c1.intro.2', 'c1.intro.3'] },
    note: 'A three-line beat (GDD § 2.13, § 5.1; #98): 廣播姊姊 from her paper loudspeaker, 摩卡 on a spring from his head, the narration on the paper strip at the top; none covers Baokaka or the bead. A tap advances.',
  },
  {
    name: 'c0p1-hint-how',
    page: 'c0p1',
    steps: [],
    show: { affordance: { hint: { level: 2, key: 'crib-rail' } } },
    note: '0-1 with hint L2: the rail tab glows (L1) and the vellum ghost hand pulls it down to its stop.',
  },
  {
    name: 'hint-nudge',
    page: 'c1p2',
    steps: [{ set: 'train', to: 'half' }, { wait: 'settle' }],
    show: { hint: 0 },
    note: 'Hint level 0, the auto nudge (GDD § 2.7, #100): after 30 s with no change Mocha stretches with a yawn and turns toward the next useful thing (the pillar); live, its paw print shimmers once (the still catches the shimmer at rest, invisible).',
    expect: { mode: 'reaching' },
  },
  {
    name: 'hint-level1',
    page: 'c1p2',
    steps: [{ set: 'train', to: 'half' }, { wait: 'settle' }],
    show: { hint: 1 },
    note: 'Hint level 1, "where" (GDD § 2.7, #100): stuck at the gap, the solver\'s next action is Mocha to the pillar — the paw print there glows and pulses, Mocha turns to look at it and says 「讓摩卡上去」.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'hint-ghost-hand',
    page: 'c1p2',
    steps: [{ set: 'train', to: 'half' }, { wait: 'settle' }, { mocha: 'pillar' }, { wait: 'settle' }],
    show: { hint: 2 },
    note: 'Hint level 2, "how" (#100): the pigeon gone, the vellum ghost hand drags the train tab from half to its last stop, the halo behind it and the dotted thread to the train; Mocha on the pillar looks at it: 「拉拉看這裡」.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'hint-wait',
    page: 'c1p2',
    steps: [{ set: 'train', to: 'half' }, { wait: 'settle' }, { mocha: 'pillar' }, { wait: 'settle' }, { set: 'train', to: 'full' }],
    show: { hint: 1 },
    note: 'Waiting as an action (GDD § 2.7, #100): the train at the far platform, the best next move is to wait — Mocha sits up on the pillar tapping his paw: 「等等看。」 No halo, no hand.',
  },
  {
    name: 'word-poke',
    page: 'c1p3',
    steps: [{ wait: 3 }],
    show: { words: { poke: true } },
    note: 'Before any word is learned (GDD § 6 risk 1, #99): tapping Baokaka shows 「要！」 with a chalk pointer to what he wants (the bead past the gates).',
    expect: { mode: 'reaching' },
  },
  {
    name: 'word-card-beep',
    page: 'c1p3',
    steps: [{ mocha: 'counter' }, { wait: 2 }],
    show: { words: { card: 'beep' } },
    note: 'The learn beat\'s word card (GDD § 5.4, #99): the card hit the reader, gate A opened and he copied it: 「嗶！：閘門開開」 with its seal, taped over the dimmed page; a tap puts it away.',
    expect: { event: 'learn' },
  },
  {
    name: 'word-ring-open',
    page: 'c1p3',
    steps: [{ mocha: 'counter' }, { wait: 'settle' }],
    show: { words: { ring: true } },
    note: 'The word ring (GDD § 2.4, bible § 7, #99): stuck at gate B he was tapped; 嗶！ (glowing: new) and 「好了」 fan round him on the volvelle band, the page dims 30 %, and the tutorial\'s ghost hand taps 嗶！.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'word-ring-full',
    page: 'lab-words',
    steps: [{ wait: 3 }],
    show: { words: { ring: true } },
    note: 'The full word ring (#99): all eight words in learning order from beside 「好了」 round over the top, each disc with its icon on its own seal colour; the ring closes the circle. Lab stage (every word available).',
    expect: { mode: 'reaching' },
  },
  {
    name: 'word-say-beep',
    page: 'c1p3',
    steps: [{ mocha: 'counter' }, { wait: 'settle' }, { say: 'beep' }],
    note: 'Saying 嗶！ (#99, #107): the big speech bubble, the word\'s 120-unit reach in its seal colour, gate B open and the cleaning robot spinning; Mocha\'s 「……閘門真的開了。」',
    expect: { mode: 'saying', event: 'beep' },
  },
  {
    name: 'word-ring-4',
    page: 'lab-ring4',
    steps: [{ wait: 4 }],
    show: { words: { ring: true } },
    note: 'The ring with M2\'s four words (GDD § 2.4, #112): 嗶！ 掰掰 不要！ 哇！ in learning order from beside 「好了」 on the thumb\'s side round to the top, 44° apart, each on its seal; reaching for the moon decoy, he was tapped. Lab stage (the moon toy page with every M2 word).',
    expect: { mode: 'reaching' },
  },
  {
    name: 'word-card-no',
    page: 'toy-moon',
    steps: [{ mocha: 'rock' }],
    show: { words: { card: 'no' } },
    note: 'The 不要！ learn beat\'s card (GDD § 5.4, #112): Mocha landed on the rock, the goose honked 「嘎！不要過來！」 and he copied it: 「不要！：換一個想要的」 with its seal, taped over the dimmed page. Toy page after 3-3.',
    expect: { event: 'learn' },
  },
  {
    name: 'word-say-no',
    page: 'toy-moon',
    steps: [{ mocha: 'rock' }, { wait: 'settle' }, { say: 'no' }],
    note: 'Saying 不要！ to the moon decoy (GDD § 2.4, #112): the big speech bubble and the small burst at him; next tick he turns from the moon to Mocha on the rock.',
    expect: { mode: 'saying' },
  },
  {
    name: 'm2-spotlight',
    page: 'toy-spotlight',
    steps: [{ set: 'spot', to: 'trap' }, { wait: 1 }],
    note: 'The spotlight toy page (#112, after 2-2): the wheel aims the light at the trap-door plate, he crawled into it and sits watching; his weight pressed the plate and the curtain rose on the bead.',
    expect: { mode: 'watching' },
  },
  {
    name: 'm2-squirrel-herded',
    page: 'toy-squirrel',
    steps: [{ mocha: 'fork' }, { wait: 'settle' }],
    note: 'The squirrel toy page (#112, after 2-4): Mocha on the fork scared the squirrel down to the low branch, where it sits on the bead; he reaches for it. Next: 掰掰.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'm2-squirrel-bye',
    page: 'toy-squirrel',
    steps: [{ mocha: 'fork' }, { wait: 'settle' }, { say: 'bye' }],
    note: 'Saying 掰掰 to the squirrel (GDD § 2.4, #112): its 160-unit reach in the word\'s seal colour; the squirrel waved and ran off the page, dropping the bead where it sat.',
    expect: { mode: 'saying', event: 'wave' },
  },
  {
    name: 'm2-moon-decoy',
    page: 'toy-moon',
    steps: [{ wait: 6 }],
    note: 'The moon decoy toy page (#112, after 3-3): the moon\'s reflection is a shiny he can never reach; he sits at the water\'s edge reaching for it, the goose on her nest past him.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'm3-balloon',
    page: 'toy-balloon',
    steps: [{ mocha: 'post' }],
    note: 'The balloon basket toy page (#120, after 5-2): a counterweight lift. Mocha jumped out of the basket onto the stall\'s post; without his weight the basket rose to the ledge, and Baokaka crawls off it toward the bead.',
    expect: { mode: 'moving' },
  },
  {
    name: 'word-card-hug',
    page: 'toy-hug',
    steps: [{ wait: 1 }],
    show: { words: { card: 'hug' } },
    note: 'The 抱抱 learn beat\'s card (GDD § 5.4, #120): beside the 夜市阿姨 at the crowded lane he learned 抱抱: 「抱抱：大人載你走」 with its seal, taped over the dimmed page. Toy page after 5-3.',
    expect: { event: 'learn' },
  },
  {
    name: 'word-say-hug',
    page: 'toy-hug',
    steps: [{ wait: 1 }, { say: 'hug' }],
    note: 'Saying 抱抱 next to a carrier (GDD § 2.4, #120): the big speech bubble, and the 夜市阿姨 lifts him into her arms (carried).',
    expect: { mode: 'carried', event: 'hug' },
  },
  {
    name: 'm3-carousel',
    page: 'toy-carousel',
    steps: [{ set: 'belt', to: '2' }],
    note: 'The baggage carousel toy page (#120, after 6-2): a loop with a crank. Two clicks of the crank carried his suitcase two slots round (a ride); one more and it reaches the far side.',
    expect: { event: 'ride' },
  },
  {
    name: 'word-card-plane',
    page: 'toy-plane',
    steps: [{ wait: 1 }],
    show: { words: { card: 'plane' } },
    note: 'The 飛機！ learn beat\'s card (GDD § 5.4, #120): on the observation deck the sleeping plane blinked and he pointed: 「飛機！：鳥都飛起來」. Toy page after 6-3.',
    expect: { event: 'learn' },
  },
  {
    name: 'word-say-plane',
    page: 'toy-plane',
    steps: [{ wait: 1 }, { say: 'plane' }],
    note: 'Saying 飛機！ (GDD § 2.4, #120): a whole-page word. The pigeons on the deck flew up off the page and the runway lights came on.',
    expect: { mode: 'saying', event: 'sky' },
  },
  {
    name: 'word-card-climb',
    page: 'toy-climb',
    steps: [{ wait: 1 }, { say: 'bye' }],
    show: { words: { card: 'climb' } },
    note: 'The 爬樓梯 learn beat\'s card (GDD § 5.4, #120): 掰掰 sent the tea farmer up the terrace and he copied him: 「爬樓梯：爬上一階」 (a growth stage: a star, no word). Toy page after 7-3.',
    expect: { event: 'learn' },
  },
  {
    name: 'climb-step',
    page: 'toy-climb',
    steps: [{ wait: 1 }, { say: 'bye' }, { wait: 1 }],
    show: { stepAt: 190 },
    note: 'A climb in flight (GDD § 2.5 爬樓梯, #120, #141): the still is drawn mid-step, at the knee-over frame, on the 22-unit riser the climb frames are drawn for.',
    expect: { mode: 'moving' },
  },
  {
    name: 'word-ring-6',
    page: 'lab-ring6',
    steps: [{ wait: 3 }],
    show: { words: { ring: true } },
    note: 'The ring with M3\'s six words (GDD § 2.4, #120): 嗶！ 掰掰 不要！ 哇！ 抱抱 飛機！ in learning order from beside 「好了」 round over the top, each on its seal. Lab stage (the deck toy page with every word to chapter 6).',
    expect: { mode: 'reaching' },
  },
  {
    name: 'word-card-whoosh',
    page: 'toy-steam',
    steps: [{ wait: 2 }],
    show: { words: { card: 'whoosh' } },
    note: 'The 咻—— learn beat\'s card (GDD § 5.4, #127): at the steam\'s edge he watched the 溫泉阿嬤 blow on her egg: 「咻——：吹動輕的東西」. Toy page after 8-3.',
    expect: { event: 'learn' },
  },
  {
    name: 'word-say-whoosh',
    page: 'toy-steam',
    steps: [{ wait: 3 }, { say: 'whoosh' }],
    note: 'Saying 咻—— (GDD § 2.4, #127): the 90° cone in his facing, radius 140. The steam over the boardwalk cleared and the 阿嬤\'s hat blew off with it, both in the cone.',
    expect: { mode: 'saying', event: 'whoosh' },
  },
  {
    name: 'whoosh-cone',
    page: 'toy-pinwheel',
    steps: [{ mocha: 'post' }, { wait: 3 }, { say: 'whoosh' }],
    note: 'Facing matters (GDD § 2.4, 8-4, #127): Mocha on the balcony post drew him round to face the pinwheel; 咻—— in his cone spun it, and the book lift came down with the bead. Said facing the shelf it does nothing.',
    expect: { mode: 'saying', event: 'whoosh' },
  },
  {
    name: 'word-card-cruise',
    page: 'toy-ferry',
    steps: [{ mocha: 'rail' }],
    show: { words: { card: 'cruise' } },
    note: 'The 扶著站 learn beat\'s card (GDD § 5.4, #127): reaching up to Mocha on the ferry\'s railing he pulled himself up: 「扶著站：搆到高的地方」 (a growth stage: a star, no word). Toy page after 9-3.',
    expect: { event: 'learn' },
  },
  {
    name: 'cruise-rail',
    page: 'toy-ferry',
    steps: [{ mocha: 'rail' }, { wait: 1 }],
    show: { stepAt: 150 },
    note: 'A cruise in flight (GDD § 2.5 扶著站, #127): standing, both hands on the railing, he sidesteps past the coil of rope — the still is drawn mid-step, on the reach-out frame.',
    expect: { mode: 'moving' },
  },
  {
    name: 'reach-high',
    page: 'toy-ferry',
    steps: [{ mocha: 'rail' }, { wait: 2 }],
    note: 'reachHigh (GDD § 2.5, #127): the bead sits on the high bench, which only a cat\'s hop joins to the deck; standing at the deck\'s end he grabs it from there.',
    expect: { mode: 'grabbing', event: 'grab' },
  },
  {
    name: 'm4-coupled',
    page: 'toy-101',
    steps: [{ mocha: 'rim' }, { set: 'low', to: '1' }],
    note: 'Coupled sections (GDD § 4.4 10-3, #127): each dial turns the middle section with it, so Mocha sits on the middle one (lockedByCat) to hold it; the bottom section turned alone into line and he climbed onto its ledge. Next: the top dial.',
    expect: { mode: 'moving' },
  },
  {
    name: 'word-ring-7',
    page: 'lab-ring7',
    steps: [{ wait: 3 }],
    show: { words: { ring: true } },
    note: 'The ring with the seven words to chapter 9 (GDD § 2.4, #127): 嗶！ 掰掰 不要！ 哇！ 抱抱 飛機！ 咻—— in learning order, each on its seal. Lab stage (the library toy page with every word but 一起).',
    expect: { mode: 'cuddling' },
  },
  {
    name: 'linked-mode',
    page: 'toy-party',
    steps: [{ wait: 1 }, { say: 'no' }, { wait: 'settle' }, { say: 'together' }, { floor: 'D' }, { wait: 1 }],
    show: { stepAt: 190 },
    note: 'Linked mode (GDD § 2.4 一起, 10-5, #128): both cried, he said 一起, and Mocha hopped down to him. Tapped across the room, Mocha walks the floor through 咻咻\'s puddle — for him — a step ahead, and he crawls along beside; every place a tap can lead them wears a paw-and-footprint mark, and 咻咻 (lonely) has come down off its cloud to follow them. Toy page.',
    expect: { mode: 'linked' },
  },
  {
    name: 'word-card-walk',
    page: 'toy-steps',
    steps: [{ wait: 3 }, { say: 'together' }, { floor: 'G' }, { wait: 2 }],
    show: { words: { card: 'walk' } },
    note: 'The 第一步 learn beat\'s card (GDD § 5.4, #128): at the rail\'s end, with Mocha waiting on the other side of the open deck, he lets go: 「第一步！」 (two footprints, no effect line). Toy page after 10-6.',
    expect: { event: 'learn' },
  },
  {
    name: 'first-steps',
    page: 'toy-steps',
    steps: [{ wait: 3 }, { say: 'together' }, { floor: 'G' }, { wait: 4 }],
    show: { stepAt: 200, talk: ['c10p6.steps.4'] },
    note: 'His first steps (GDD § 2.5 第一步, § 5.2 10-6, #128): off the rail and across the open deck to Mocha — the wobbly walk, arms out, swaying — a chalk footprint where each foot came down. The world holds for a line on every step (「兩步。」). Toy page.',
    expect: { mode: 'moving', event: 'babyEnter' },
  },
  {
    name: 'first-steps-plop',
    page: 'toy-steps',
    steps: [{ wait: 3 }, { say: 'together' }, { floor: 'G' }, { wait: 5 }],
    show: { talk: ['c10p6.steps.5', 'c10p6.steps.6'] },
    note: 'The third step lands (GDD § 2.5, #128): he sits down with a plop beside Mocha, who purrs; the two of them in one pool of light, 咻咻 just past them. 「三步。」「走、走路了……他在走路！」 Next: 抱抱. Toy page.',
    expect: { mode: 'linked', event: 'babyEnter' },
  },
];

/** A fixture's page and its final frame: the state, and the state before the last tick. */
export interface FixtureFrame {
  readonly def: PageDef;
  readonly prev: SimState;
  readonly state: SimState;
  /** The last tick's events (none for an empty step list) */
  readonly events: readonly SimEvent[];
}

/** Replays a fixture. Throws on an unknown page (the unit test catches it first). */
export function fixtureFrame(fixture: PopupFixture): FixtureFrame {
  const def = labPageById(fixture.page);
  if (def === undefined) throw new Error(`popup fixture '${fixture.name}': no page '${fixture.page}'`);
  // `replay` expands the waits into one input per tick; stepping them again keeps the state before the last
  const { ticks } = replay(def, fixture.steps);
  let state = initialState(def);
  let prev = state;
  let events: readonly SimEvent[] = [];
  for (const tick of ticks) {
    prev = state;
    const r = step(def, state, tick.input);
    state = r.state;
    events = r.events;
  }
  return { def, prev, state, events };
}

/** An in-memory store seeded with a save (screen fixtures: the real `popup.save.v1` is never touched). */
export function fixtureStore(save: SaveV1, registry?: PageRegistry): ProgressStore {
  const data = new Map<string, string>([[SAVE_KEY, JSON.stringify(encodeSave(save))]]);
  const storage: StorageLike = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
  return new ProgressStore({ storage, visibility: null, registry });
}

export function popupFixture(name: string): PopupFixture | undefined {
  return POPUP_FIXTURES.find((f) => f.name === name);
}

/** The full-screen fixture view's parameters: `fixture=<name>`, `still=1` and `text=big` (大字, #104). */
export function fixtureParams(params: URLSearchParams): { fixture: string | null; still: boolean; big: boolean } {
  return { fixture: params.get('fixture') || null, still: params.get('still') === '1', big: params.get('text') === 'big' };
}
