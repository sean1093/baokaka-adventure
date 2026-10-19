import { initialState, replay, step } from '../core';
import type { SimEvent } from '../core/events';
import type { BabyMode, Id, LineKey, PageDef, SimState, SolutionStep } from '../core/types';
import type { LearnKey } from '../content/words';
import type { NavState } from '../game/nav';
import { completePage, earnSticker, encodeSave, freshSave, ProgressStore, SAVE_KEY, updateSettings, type SaveV1 } from '../game/progress';
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
  };
  /**
   * The still's motion look: `motion` (default) draws the idle cues of full motion, `reduced` the
   * reduced-motion ones (the static double outline). The screenshot browser runs with reduced
   * motion, so the still pins its look; live, the OS setting decides.
   */
  readonly look?: 'motion' | 'reduced';
  /** A specimen sheet drawn instead of the page (`page` and `steps` still name a valid frame) */
  readonly sheet?: 'affordance-states' | 'sprites-anchors';
  /**
   * A screen of the game shell instead of the bare page (#97): where the navigation starts and the
   * save it reads (a seeded in-memory store; the real save is never touched). `page` and `steps`
   * still name a valid frame (the page under a page screen is `nav`'s).
   */
  readonly screen?: { readonly nav: NavState; readonly save: SaveV1 };
}

/** The saves the screen fixtures read (#97). */
const FRESH = freshSave();
/** 0-1 solved with both its stickers, 1-2 current with its 淘氣 already earned. */
const PLAYED = earnSticker(completePage(FRESH, 'c0p1', { mischief: true, tudigong: true, moves: 1 }), 'c1p2', 'mischief');
const LEFT_HANDED = updateSettings(PLAYED, { leftHand: true });
const ON_PAGE: NavState = { base: { kind: 'page', id: 'c1p2', run: 0 }, layer: null };

export const POPUP_FIXTURES: readonly PopupFixture[] = [
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
export function fixtureStore(save: SaveV1): ProgressStore {
  const data = new Map<string, string>([[SAVE_KEY, JSON.stringify(encodeSave(save))]]);
  const storage: StorageLike = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
  return new ProgressStore({ storage, visibility: null });
}

export function popupFixture(name: string): PopupFixture | undefined {
  return POPUP_FIXTURES.find((f) => f.name === name);
}

/** The full-screen fixture view's parameters: `fixture=<name>` and `still=1`. */
export function fixtureParams(params: URLSearchParams): { fixture: string | null; still: boolean } {
  return { fixture: params.get('fixture') || null, still: params.get('still') === '1' };
}
