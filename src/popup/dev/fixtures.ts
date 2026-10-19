import { initialState, replay, step } from '../core';
import type { SimEvent } from '../core/events';
import type { BabyMode, Id, LineKey, PageDef, SimState, SolutionStep } from '../core/types';
import type { LearnKey } from '../content/words';
import type { NavState } from '../game/nav';
import { completePage, earnSticker, encodeSave, freshSave, keepPhoto, ProgressStore, SAVE_KEY, updateSettings, type Photo, type SaveV1, type Sticker } from '../game/progress';
import type { PageRegistry } from '../pages';
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
    /** Play on the registry with the lab spread as 1-6 (#103) */
    readonly spread?: boolean;
  };
}

/** The saves the screen fixtures read (#97). */
const FRESH = freshSave();
/** 0-1 solved with both its stickers, 1-2 current with its 淘氣 already earned. */
const PLAYED = earnSticker(completePage(FRESH, 'c0p1', { mischief: true, tudigong: true, moves: 1 }), 'c1p2', 'mischief');
const LEFT_HANDED = updateSettings(PLAYED, { leftHand: true });
/** 大字 on (#104). */
const BIG_TEXT = updateSettings(PLAYED, { bigText: true });
/** 長輩模式 on over a player who chose 快 and no auto hints (#104): the held rows show 慢 and 15 秒. */
const ELDER_ON = updateSettings(updateSettings(PLAYED, { speed: 2, autoHint: 0 }), { elder: true });
const ON_PAGE: NavState = { base: { kind: 'page', id: 'c1p2', run: 0 }, layer: null };
/** 1-2 just completed: solved, its 淘氣 earned on the way, the 土地公 not found (#101). */
const C1P2_DONE = completePage(PLAYED, 'c1p2', { mischief: true, moves: 6 });
/** 0-1 solved without its 淘氣, 1-2 solved with it: the 目錄 shows each page's mischief (#101). */
const MISCHIEF_LIST = completePage(completePage(FRESH, 'c0p1', { tudigong: true }), 'c1p2', { mischief: true });
/** The album's fixtures (#103): a fixed time, so the stills never change. */
const SHOT_AT = Date.UTC(2026, 9, 19, 16, 20);
/** Chapter 1 with 1-2 solved (淘氣 too) and its photo kept: Frame A with 摩卡 in it. */
const ALBUM_A = keepPhoto(C1P2_DONE, 1, { frame: 'A', mocha: true, at: SHOT_AT });
/** A Frame B photo with 摩卡 in it, then retaken as a Frame C without him (the pool's notes). */
const ALBUM_B = keepPhoto(C1P2_DONE, 1, { frame: 'B', mocha: true, at: SHOT_AT });
const RETAKEN_C: Photo = { frame: 'C', mocha: false, at: SHOT_AT + 60_000 };
/** The lab spread's steps to the photo moment: the train to half, Mocha to the pillar (the pigeon flies), back to the bench (+M), the train to full. */
const TO_PHOTO: readonly SolutionStep[] = [{ set: 'train', to: 'half' }, { wait: 'settle' }, { mocha: 'pillar' }, { wait: 'settle' }, { mocha: 'bench' }, { wait: 'settle' }, { set: 'train', to: 'full' }];

export const POPUP_FIXTURES: readonly PopupFixture[] = [
  {
    name: 'spread-c1',
    page: 'lab-spread',
    steps: [{ set: 'train', to: 'half' }, { wait: 'settle' }],
    note: 'A chapter spread (GDD § 2.9, #103): the same 390 × 560 page drawn as a centrefold, the spine\'s crease down the middle of the standing and the floor page; the goal is the chapter\'s treasure, 雞腿, on its foil light. Lab stage (1-2 as a spread) until #107 builds 1-6.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'photo-moment',
    page: 'lab-spread',
    steps: TO_PHOTO,
    show: { photo: { at: 1800 } },
    note: 'The photo moment (GDD § 2.9, bible § 7, #103): 2 edges from the 雞腿 the world pauses, the paper camera slides down over the spread and the marigold 咔嚓 rises under it. The viewfinder is at the peak: Frame A, arms up with the 雞腿 high, 摩卡 on the bench in the frame (+M, bottom left); the 「哇！」 meter full at its star. Live, the 3 s slow-motion loop runs (B → A → C), the viewfinder creeps in, and after 6 s it snaps B itself.',
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
    page: 'lab-spread',
    steps: [],
    screen: { nav: { base: { kind: 'page', id: 'lab-spread', run: 0 }, layer: null }, save: C1P2_DONE, spread: true },
    note: 'The lab spread as 1-6 in the game shell (#103): play it live — the photo moment, the album page, 再拍一次, 放進相簿, the sticker card, then the 目錄 (`check:play` scenario `photo-spread`).',
  },
  {
    name: 'album-c1-retake',
    page: 'c1p2',
    steps: [],
    screen: { nav: ON_PAGE, save: ALBUM_B, albumAfter: { chapter: 1, retaken: RETAKEN_C } },
    note: 'The album after the spread, retaken (§ 2.9 step 7, #103): the first shot (B, 摩卡 in) and the new one (C, chewing, no 摩卡) side by side, the new one chosen and printed big; the notes from the shared pool for chapter 1 Frame C (阿嬤 「怎麼拍，乖孫都古錐。」, 摩卡 out: 「大家手機裡，都是你的照片。」). 再拍一次 / 放進相簿.',
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
    name: 'lab-eye-contact',
    page: 'lab-push',
    steps: [{ mocha: 'pillar' }],
    note: 'Mocha lands on the pillar beside a cup and looks straight at the camera for a tick (C3; #95). Lab stage: 1-2 with a cup, until #106 adds 0-3 (c0p3-eye-contact).',
    expect: { event: 'mochaStare' },
  },
  {
    name: 'lab-crying',
    page: 'lab-cry',
    steps: [{ wait: 3 }],
    note: 'Nothing to want: after looking for two ticks Baokaka cries (GDD § 2.2.5; #95). Lab stage: 0-1 with the bead hidden, until #106 adds 0-4 (c0p4-crying).',
    expect: { mode: 'crying' },
  },
  {
    name: 'lab-looking',
    page: 'lab-cry',
    steps: [{ wait: 1 }],
    note: 'Nothing to want yet: Baokaka looks around, over his shoulder and far ahead (look L/R, #141). Lab stage until #106 adds 0-4.',
    expect: { mode: 'looking' },
  },
  {
    name: 'lab-watching',
    page: 'lab-lamp',
    steps: [{ wait: 2 }],
    note: 'Baokaka sits at a night light and watches it, swaying (watch-sway, #141). Lab stage until #106 adds 0-2 (the TV).',
    expect: { mode: 'watching' },
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
    name: 'lab-mocha-inbox',
    page: 'lab-box',
    steps: [],
    note: 'Mocha in a box perch: only his head and paws show over the rim, in front of the box (in-box, #141). Lab stage until #106 adds 0-4 (the laundry basket).',
  },
  {
    name: 'cover-first',
    page: 'c0p1',
    steps: [],
    screen: { nav: { base: { kind: 'cover' }, layer: null }, save: FRESH },
    note: 'The cover on first launch (#97): the closed book on 阿嬤\'s table and quilt, Baokaka and Mocha beside it, only 「開始」.',
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
    name: 'lab-change-of-mind',
    page: 'lab-lamp',
    steps: [{ wait: 2 }, { tap: 'mobile' }],
    note: 'The change of mind (GDD § 2.2.6, #98): he watched the night light (a note) until the bead appeared; the bubble flips to the bead and 「要！」 (live: the note pops, the bead inflates, the spring wobbles) and he barks 「要！」. Lab stage until #106 adds 0-2 (c0p2-change-of-mind: the cushion).',
    expect: { mode: 'reaching', event: 'bark' },
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
    page: 'lab-gates',
    steps: [{ wait: 3 }],
    show: { words: { poke: true } },
    note: 'Before any word is learned (GDD § 6 risk 1, #99): tapping Baokaka shows 「要！」 with a chalk pointer to what he wants (the bead past the gates). Lab stage until #107 adds 1-3.',
    expect: { mode: 'reaching' },
  },
  {
    name: 'word-card-beep',
    page: 'lab-gates',
    steps: [{ mocha: 'counter' }, { wait: 2 }],
    show: { words: { card: 'beep' } },
    note: 'The learn beat\'s word card (GDD § 5.4, #99): the card hit the reader, gate A opened and he copied it: 「嗶！：閘門開開」 with its seal, taped over the dimmed page; a tap puts it away. Lab stage until #107 adds 1-3.',
    expect: { event: 'learn' },
  },
  {
    name: 'word-ring-open',
    page: 'lab-gates',
    steps: [{ mocha: 'counter' }, { wait: 'settle' }],
    show: { words: { ring: true } },
    note: 'The word ring (GDD § 2.4, bible § 7, #99): stuck at gate B he was tapped; 嗶！ (glowing: new) and 「好了」 fan round him on the volvelle band, the page dims 30 %, and the tutorial\'s ghost hand taps 嗶！. Lab stage until #107 adds 1-3.',
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
    page: 'lab-gates',
    steps: [{ mocha: 'counter' }, { wait: 'settle' }, { say: 'beep' }],
    note: 'Saying 嗶！ (#99): the big speech bubble, the word\'s 120-unit reach in its seal colour, gate B open and the robot spinning (the 淘氣); Mocha\'s 「……閘門真的開了。」 Lab stage until #107 adds 1-3.',
    expect: { mode: 'saying', event: 'beep' },
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
