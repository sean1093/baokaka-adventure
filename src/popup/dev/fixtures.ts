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
    name: 'chapter-soon-c2',
    page: 'c1p6',
    steps: [],
    screen: { nav: ON_SPREAD, save: C1_DONE, soonCard: 2 },
    note: 'The next chapter\'s card while it isn\'t built (#107, D-70): chapter 1 done, the chapter turn drops chapter 2\'s card over the book on the quilt — 第二章, 「會揮手的公園」, 00:50, 大安森林公園 — with 「下一站 未完待續」 on its split-flap row and 「下一站還在畫……未完待續。」 under it; a tap lifts it away and the 目錄 opens.',
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
