import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type MutableRefObject, type PointerEvent as ReactPointerEvent, type Ref } from 'react';
import { POPUP } from '../../art/palette';
import { useSvgIds } from '../../art/useSvgIds';
import { useReducedMotion } from '../../components/motion';
import { nodePos } from '../core/graph';
import { partLocked } from '../core/step';
import { cover, kitCtx, kitDefs, type KitCtx } from '../art';
import { chapterInfo, chapterLine as contentChapterLine } from '../content';
import type { SimEvent } from '../core/events';
import type { Id, Input, LineKey, PageDef, SimState, Word } from '../core/types';
import { loadLines, type TalkLine } from '../content/script';
import type { LearnKey } from '../content/words';
import { PageSession, type SessionFrame, type TickSpeed } from '../game/session';
import { EMPTY_TALK, MAX_PER_BEAT, advance, currentBeat, enqueue, firedLines, introLines, type TalkQueue } from '../game/talk';
import { cueKey, tutorialCue, type TutorialShow } from '../game/tutorial';
import { WORD_MOTIF, firstUseLine, learnLines, learnedNow, ringWords, tutorialShow, tutorialWord } from '../game/words';
import { FRESH_ATTEMPT, attemptResult, earnInAttempt, mischiefFired, type Attempt } from '../game/stickers';
import type { PageResult, Sticker } from '../game/progress';
import { usePagePreload } from '../sprites';
import { usePageArt } from '../env/loader';
import { nextPage } from '../pages';
import { chapterSky } from './art/placeholders';
import { bookLayout, toScreen, type BookLayout } from './geometry';
import { BottomBar, STICKER_POP_MS } from './hud/BottomBar';
import { TopHud } from './hud/TopHud';
import { wearsMarigold, type AffordanceFlags } from './affordance/look';
import { hintDisplay, type HintLevel } from './affordance/ladder';
import { useHintLadder } from './affordance/useHintLadder';
import { nextHint } from '../core/hint';
import { mochaNode } from '../core/mocha';
import { useIdleWiggle } from './affordance/useIdleWiggle';
import type { GestureEvent, GestureFlags } from './gestures';
import './gestures.css';
import { PART_SETTLE_MS } from './interp';
import { PageView, VIEW_BOX } from './PageView';
import { useGestures } from './useGestures';
import { barkLog, barksOf, talkScale, type BarkShow } from './talk';
import { sayingWord } from './actors';
import { WordCard, WordRing, ringSafeArea, wantPoke } from './words';
import { mochaInFrame, photoReady, type Shot } from '../game/photo';
import { PhotoMoment } from './photo/PhotoMoment';
import { pulse } from '../game/settings';
import { useTextScale } from './textSize';
import { useTilt } from './useTilt';
import { gestureSounds, stickerSounds, tickSounds, useSound } from './sound';

/**
 * One page, played (GDD § 2.1 page anatomy; bible § 2.1, § 7): the navy-linen cover, the HUD slot
 * on top, the book in the middle at ≈ 0.91 scale, the bottom-bar slot on the cover, and a
 * `PageSession` ticking the simulation while `PageView` draws it.
 *
 * The HUD and the bottom bar (#97, `hud/`) are live: the landmark, page title, chapter line, moon
 * clock and 抓周 tray on the paper label; the portrait (opens the word ring), 提示, 重來 and 選單
 * discs and the page's stickers on the cover, mirrored in 左手模式. `hold` holds the session while
 * a layer (the menu, the 目錄 …) is open over the page; `onDone` hears the page complete once.
 * Gestures (#90, `useGestures`): the whole screen takes pointers; a finger down anywhere pauses
 * the world, taps and drags on the page become queued inputs, and tapping Baokaka (or the portrait)
 * opens the word ring.
 *
 * Words (#99, GDD § 2.4, § 5.4; `game/words.ts`, `words/`): the ring offers the words the page
 * allows (`ringWords`; none yet → a 「要！」 bubble pointing at his target instead) and pauses the
 * world while open (`ring`); a word is said as a queued `say`, the ring closes, and on the say tick
 * the big speech bubble and the effect ring show (`onSay` hears it, with the word's motif, for the
 * audio). A `learn` event plays the learn beat: the source, Baokaka's and Mocha's lines through the
 * subtitle queue, then the word card (the world waits, `card`) until tapped. The first time a word
 * is said on a page Mocha's translation plays once. On the player's first word's page the first-use
 * tutorial runs: the portrait glows, the ghost hand taps Baokaka once he is stuck, then the word's
 * disc; the new word glows in the ring until it is first said.
 *
 * Animation runs on `requestAnimationFrame` only while something moves (an actor mid-step, a part
 * mid-tween) and sleeps between ticks.
 *
 * Settings (#104, GDD § 2.11; `game/settings.ts`): 大字 grows the HUD, the bar and the bubbles by
 * 25 % (`useTextScale`); 長輩模式 (`affordance.elder`) shows the hold-to-reveal outlines all the time,
 * with bolder perch markers, 28 px seals and the stronger hint halo; 震動 (`vibrate`) pulses on a
 * snap, Mocha's push and a sticker; `tilt` leans the page with the gyro; `lowPower` halves the
 * grab's sparkles.
 *
 * Stickers (#101, GDD § 2.8; `game/stickers.ts`): the page's 淘氣 predicate is matched against every
 * tick's events and awarded the tick it comes true; tapping the 土地公 (while his `visibleWhen`
 * holds) says 「呵呵，囡仔，慢慢仔來。」 in his subtitle bubble and earns his sticker. Either pops a tag
 * over the bar's tray (「嘿嘿，淘氣！」 / 「找到土地公！」) and is handed to `onSticker` at once (the
 * shell saves it); `onDone` gets the attempt's stickers and moves for `completePage`. A sticker is
 * earned once per attempt; the save never loses one.
 *
 * Sound (#105, GDD § 2.12; `sound.ts`): each tick's events sound through `tickSounds` (the word's
 * motif, the barks as voice blips, the ding, crawl, hops, the push and its drop, the creatures, the
 * grab), gestures through `gestureSounds` (the swish, the stop's click / ratchet / flop, the boop),
 * a wheel ratchets at every stop it passes under the finger, a sticker pops, 提示 rings. A part the
 * player just moved sounded on release, so its tick stays quiet for it. Outside a live shell (the
 * art lab, PageLab) and in a still the sink is silent.
 *
 * Images (#94, #96): the page preloads its chapter's baked character frames (`usePagePreload`)
 * and its own environment bitmaps (`usePageArt`, then the next page's backdrop) as it opens, and
 * marks itself `data-sprites="ready"` once both are decoded (screenshots wait for it).
 *
 * Touchable states (#140): the idle wiggle runs on its own timer (`useIdleWiggle`; off in a still,
 * under reduced motion and while a finger is down), and a tapped prop shakes. `affordance` passes
 * hints, done knots and 長輩模式 through to the page.
 *
 * Hints (#100, GDD § 2.7; `affordance/useHintLadder.ts`, `ladder.ts`): 提示 climbs the ladder —
 * where (the halo, Mocha looks, his line), how (the ghost hand; on the word ring, the word's disc),
 * show me (the hand, then the action played for real, again on every press) — from the hint
 * worker's next action for the state now; the player's own move resets it. With `chrome.autoHintMs`
 * the nudge (Mocha's yawn and look, a single shimmer) comes after that long without a change. A
 * lost page glows 重來. Fixtures pin a level with `showHint` (computed in-process).
 *
 * The photo moment (#103, GDD § 2.9; `game/photo.ts`, `photo/PhotoMoment.tsx`): on a spread, once
 * Baokaka is 2 edges from the treasure with a clear path (`photoReady`), the session pauses and the
 * paper camera comes down over the page; the shot (`onPhoto`: the frame, and +M when Mocha sits in
 * the `photoRect`) resumes it and he grabs the treasure. Should he reach it first (it came into
 * reach on the spot), the moment plays after the grab. A spread's `onDone` waits for its photo.
 */

/** Bubbles grown past this (大字 on a short phone, ≈ 1.6×) have room for one line a beat (#104). */
const BIG_BEAT_K = 1.4;

/** A part the player moved sounded on release; its tick within this long stays quiet for it (ms; > the slowest tick) */
const MOVED_MS = 1500;

/** Chapters where Mocha squints at the 土地公 on the first tap (GDD § 5.3: 4-x, 7-x, 10-x). */
const SQUINT_CHAPTERS: ReadonlySet<number> = new Set([4, 7, 10]);

const subscribeResize = (onChange: () => void) => {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
};
const readSize = () => `${window.innerWidth}x${window.innerHeight}`;

/**
 * The page's scripted tutorial (#106, `game/tutorial.ts`): what to show once its cue has held for
 * its delay while `live`; anything that changes the cue (or stops the page being live) restarts it.
 */
function useScriptedTutorial(def: PageDef, state: SimState, live: boolean): TutorialShow | null {
  const cue = tutorialCue(def, state);
  const key = live ? cueKey(cue) : '';
  const delay = cue?.afterMs ?? 0;
  const [shown, setShown] = useState<string>('');
  useEffect(() => {
    setShown('');
    if (key === '') return undefined;
    const t = window.setTimeout(() => setShown(key), delay);
    return () => window.clearTimeout(t);
  }, [key, delay]);
  return shown !== '' && shown === key && cue !== null ? cue.show : null;
}

/** The viewport, as a layout. */
function useBookLayout(): BookLayout {
  const size = useSyncExternalStore(subscribeResize, readSize, () => '390x844');
  return useMemo(() => {
    const [w, h] = size.split('x').map(Number);
    return bookLayout(w, h);
  }, [size]);
}

/** The HUD's chapter line, e.g. 「第一章 · 第 2 頁 / 6」 (the prologue is 序章, 4 pages). */
export function chapterLine(def: Pick<PageDef, 'chapter' | 'index'>): string {
  return contentChapterLine(def.chapter, def.index);
}

/** What the HUD and the bottom bar show besides the page itself (#97). */
export interface PageChrome {
  /** Treasures found: the 抓周 tray's coins */
  readonly coins?: number;
  /** The newest coin fills its slot (#107, the chapter's end): a serial that replays it */
  readonly trayFill?: number;
  /** The page's stickers so far: 解開, 淘氣, 土地公 */
  readonly stickers?: readonly [boolean, boolean, boolean];
  /** 左手模式: the bottom bar mirrored */
  readonly leftHand?: boolean;
  /** 提示 was pressed (the page runs the hint ladder itself; this hears it, e.g. for a sound) */
  readonly onHint?: () => void;
  /** The auto nudge's delay (`autoHintMs` of the settings), or null / absent when off */
  readonly autoHintMs?: number | null;
  readonly onRetry?: () => void;
  readonly onMenu?: () => void;
  /**
   * The playtest log (#110, `game/playtest.ts`; only with `debug=metrics`): the player's own moves,
   * taps on a locked part, taps on him, and each hint shown with its level (0 is the auto nudge)
   */
  readonly onTrace?: (trace: PageTrace) => void;
}

/** What the page tells the playtest log (#110) */
export type PageTrace = { readonly t: 'move' | 'nope' | 'ring' } | { readonly t: 'hint'; readonly level: HintLevel };

export interface PagePlayerProps {
  readonly def: PageDef;
  readonly speed?: TickSpeed;
  /** Start from this state (a dev `tick=` jump, a resumed page) */
  readonly from?: SimState;
  /**
   * The state before `from`'s latest tick (visual QA fixtures, #92): the page opens playing that
   * tick's tween. Ignored without `from`.
   */
  readonly prev?: SimState;
  /** The events of `from`'s latest tick (visual QA fixtures, #98: its barks show). Ignored without `from`. */
  readonly events?: readonly SimEvent[];
  /**
   * Lines to open the page with instead of its intro (visual QA fixtures, #98). Without it a page
   * started fresh (no `from`) plays its `lines.intro`.
   */
  readonly talk?: readonly LineKey[];
  /** Hold the clock (dev `paused=1`, screenshots) */
  readonly paused?: boolean;
  /**
   * A still for screenshots (PageLab `still=1`, #92): the clock held, the frame drawn at its tick's
   * end (`prev` is ignored), and every CSS animation and transition off (`data-still`), idle loops
   * included. Implies `paused`.
   */
  readonly still?: boolean;
  /**
   * A still drawn this many ms into its last tick instead of at its end (#120: a step in flight,
   * the climb's knee-over): `prev` is kept and the sprites show the step's frame at that point.
   */
  readonly stillAt?: number;
  /** Inputs to feed one per tick (dev `demo=1` plays the authored solution) */
  readonly script?: readonly Input[];
  /** Hears gesture events: taps, nope, snaps, the word ring, the 土地公 (#97, #99, #101 listen) */
  readonly onGesture?: (event: GestureEvent) => void;
  /** Hints, done knots, 長輩模式 (#140; #100 drives the hints) */
  readonly affordance?: AffordanceFlags;
  /** Visual QA fixtures (#140): gesture flags to show as if a finger were doing them (e.g. hold-to-reveal) */
  readonly showGesture?: Partial<GestureFlags>;
  /** Override the reduced-motion setting (visual QA stills pin the full-motion or the reduced look) */
  readonly reduced?: boolean;
  /** Hold the session: a layer (the menu, the 目錄, the settings) is open over the page (GDD § 2.6) */
  readonly hold?: boolean;
  /** The page was completed (its goal grabbed): called once per session, with the attempt's stickers and moves (#101) */
  readonly onDone?: (state: SimState, result: PageResult) => void;
  /** 淘氣 or 土地公 was earned just now, mid-page (#101): save it at once */
  readonly onSticker?: (sticker: Sticker) => void;
  /** Visual QA fixtures (#101): the sticker pop over the bar's tray, as if just earned */
  readonly showSticker?: Sticker;
  /** The HUD's and the bottom bar's state and buttons (#97) */
  readonly chrome?: PageChrome;
  /** Visual QA fixtures (#100): show the hint ladder at this level for the state (0 nudge, 1 where, 2 how) */
  readonly showHint?: Exclude<HintLevel, 3>;
  /** Visual QA fixtures (#99): open the word ring, put a word card up, show the 「要！」 poke */
  readonly showWords?: { readonly ring?: boolean; readonly card?: LearnKey; readonly poke?: boolean };
  /** A word was said (its say tick): the word and its sound motif (`WORD_MOTIF`) for the audio (#105) */
  readonly onSay?: (word: Word, motif: readonly number[]) => void;
  /** The book's page box (the page fold and the chapter turn animate inside it, #97) */
  readonly pageRef?: Ref<HTMLDivElement>;
  /** A spread's photo was taken (#103): the frame and +M, before he grabs the treasure */
  readonly onPhoto?: (shot: Shot) => void;
  /** Visual QA fixtures (#103): the photo moment up over the page, its clock at `at` ms */
  readonly showPhoto?: { readonly at: number };
  /** 震動 (§ 2.11, #104): short pulses on a snap, Mocha's push and a sticker */
  readonly vibrate?: boolean;
  /** The gyro tilt (bible § 2.3, #104): the page leans as the phone tilts */
  readonly tilt?: boolean;
  /** Low power (bible § 9.3, #104): half the sparkles */
  readonly lowPower?: boolean;
  /**
   * The page's scripted tutorial runs (0-1, 0-2, 0-3; #106, `game/tutorial.ts`): the shell passes
   * true until the save marks the page solved (first play only). Off by default (PageLab, stills).
   */
  readonly tutorials?: boolean;
}

export function PagePlayer({ def, speed = 'normal', from, prev, events, talk: openLines, paused: pausedProp = false, still = false, stillAt, script, onGesture, affordance, showGesture, reduced: reducedProp, hold = false, onDone, chrome: pageChrome, pageRef, showWords, showHint, onSay, onSticker, showSticker, onPhoto, showPhoto, vibrate = false, tilt = false, lowPower = false, tutorials = false }: PagePlayerProps) {
  const layout = useBookLayout();
  const paused = pausedProp || still;
  const midStep = still && stillAt !== undefined;
  const session = useMemo(() => new PageSession(def, { speed, from, prev: still && !midStep ? undefined : prev, events }), [def, speed, from, prev, still, midStep, events]);
  const [frame, setFrame] = useState<SessionFrame>(() => session.frame());
  const [ms, setMs] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    setFrame(session.frame());
    setMs(0);
    // Animate until everything the latest tick started has landed, then sleep until the next tick
    const loop = () => {
      const now = session.elapsed();
      setMs(now);
      const busy = !session.paused && now < Math.max(session.frame().tickMs, PART_SETTLE_MS);
      raf.current = busy ? requestAnimationFrame(loop) : 0;
    };
    const wake = () => {
      if (raf.current === 0) raf.current = requestAnimationFrame(loop);
    };
    const off = session.subscribe((f) => {
      setFrame(f);
      wake();
    });
    if (paused) session.pause('dev');
    for (const input of script ?? []) session.input(input);
    session.start();
    wake();
    return () => {
      off();
      session.dispose();
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [session, paused, script]);

  // A layer over the page holds the world; closing it resumes where it was
  useEffect(() => {
    if (!hold) return undefined;
    session.pause('layer');
    return () => session.resume('layer');
  }, [session, hold]);

  // Sound (#105): the shell's sink (silent in a still), and the parts the player just moved
  const sink = useSound();
  const soundRef = useRef(sink);
  soundRef.current = still ? () => undefined : sink;
  const movedRef = useRef(new Map<Id, number>());

  // Stickers (#101): what this attempt earned, and the pop over the tray
  const attemptRef = useRef<Attempt>(FRESH_ATTEMPT);
  const [pop, setPop] = useState<{ readonly sticker: Sticker; readonly serial: number } | null>(showSticker ? { sticker: showSticker, serial: 0 } : null);
  const onStickerRef = useRef(onSticker);
  onStickerRef.current = onSticker;
  const vibrateRef = useRef(vibrate);
  vibrateRef.current = vibrate && !still;
  const earn = useCallback((sticker: Sticker) => {
    if (attemptRef.current[sticker]) return;
    attemptRef.current = earnInAttempt(attemptRef.current, sticker);
    setPop((p) => ({ sticker, serial: (p?.serial ?? 0) + 1 }));
    pulse('sticker', vibrateRef.current);
    soundRef.current(stickerSounds(sticker));
    onStickerRef.current?.(sticker);
  }, []);
  useEffect(() => {
    attemptRef.current = FRESH_ATTEMPT;
  }, [session]);
  useEffect(() => {
    if (pop === null || still) return undefined;
    const t = window.setTimeout(() => setPop(null), STICKER_POP_MS);
    return () => window.clearTimeout(t);
  }, [pop, still]);
  useEffect(() => {
    if (!still && mischiefFired(def, frame.prev, frame.state, frame.events)) earn('mischief');
  }, [def, frame, still, earn]);

  // The photo moment (#103): up once per session on a spread, the world held under it
  const [moment, setMoment] = useState<{ readonly mocha: boolean } | null>(() => (showPhoto ? { mocha: mochaInFrame(def, session.frame().state) } : null));
  const shotRef = useRef<Shot | null>(null);
  const onPhotoRef = useRef(onPhoto);
  onPhotoRef.current = onPhoto;
  useEffect(() => {
    shotRef.current = null;
  }, [session]);
  useEffect(() => {
    if (still || moment !== null || shotRef.current !== null || !def.spread) return;
    if (photoReady(def, frame.state) || frame.state.done) setMoment({ mocha: mochaInFrame(def, frame.state) });
  }, [def, frame, still, moment]);
  useEffect(() => {
    if (moment === null) return undefined;
    session.pause('photo');
    return () => session.resume('photo');
  }, [session, moment]);
  const snapped = useCallback((shot: Shot) => {
    shotRef.current = shot;
    setMoment(null);
    onPhotoRef.current?.(shot);
  }, []);

  // The page completes once per session (a spread once its photo is taken)
  const doneFired = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    doneFired.current = false;
  }, [session]);
  useEffect(() => {
    if (!frame.state.done || doneFired.current || still || moment !== null || (def.spread && shotRef.current === null)) return;
    doneFired.current = true;
    onDoneRef.current?.(frame.state, attemptResult({ ...attemptRef.current, moves: session.moves }));
  }, [def, frame.state, still, session, moment]);

  // What is said (#98): the subtitle queue (the intro, then lines the page's events fire; a tap
  // anywhere on the page advances, #183) and the barks of the last few ticks
  const [talk, setTalk] = useState<TalkQueue>(EMPTY_TALK);
  // 大字 on a small book (#104): the bubbles grow so much that a beat holds one line, not 3
  const textScale = useTextScale();
  const perBeatRef = useRef(MAX_PER_BEAT);
  perBeatRef.current = textScale > 1 && talkScale(layout.scale, textScale) > BIG_BEAT_K ? 1 : MAX_PER_BEAT;
  const [barks, setBarks] = useState<readonly BarkShow[]>([]);
  // Words (#99): the ring, the learn beat in progress, the words said on this page
  const [ringOpen, setRingOpen] = useState(false);
  const [learning, setLearning] = useState<{ readonly key: LearnKey; readonly stage: 'lines' | 'card' } | null>(null);
  const [used, setUsed] = useState<readonly Word[]>([]);
  const learnRef = useRef(learning);
  learnRef.current = learning;
  const usedRef = useRef(used);
  usedRef.current = used;
  const onSayRef = useRef(onSay);
  onSayRef.current = onSay;
  // The opening lines wait while the page is held at its start (a turn bringing it in, #102: the
  // chapter card's lines play first)
  const holdRef = useRef(hold);
  holdRef.current = hold;
  const pendingIntro = useRef<readonly TalkLine[] | null>(null);
  useEffect(() => {
    if (hold || pendingIntro.current === null) return;
    const lines = pendingIntro.current;
    pendingIntro.current = null;
    setTalk((q) => enqueue(q, lines, perBeatRef.current));
  }, [hold]);
  useEffect(() => {
    const open = openLines !== undefined ? loadLines(openLines) : from === undefined ? introLines(def) : [];
    pendingIntro.current = holdRef.current ? open : null;
    setTalk(pendingIntro.current === null ? enqueue(EMPTY_TALK, open, perBeatRef.current) : EMPTY_TALK);
    setBarks(showWords?.poke ? [wantPoke(def, session.frame().state)] : []);
    setRingOpen(showWords?.ring === true);
    const card = showWords?.card;
    learnRef.current = card === undefined ? null : { key: card, stage: 'card' };
    setLearning(learnRef.current);
    usedRef.current = [];
    setUsed([]);
  }, [session, def, from, openLines, showWords?.ring, showWords?.card, showWords?.poke]);
  useEffect(() => {
    const lines = firedLines(def, frame.prev, frame.state, frame.events);
    // The learn beat (§ 5.4): its lines now, the word card once they have been read
    const learnt = learnedNow(frame.events);
    if (learnt !== null && learnRef.current?.key !== learnt) {
      learnRef.current = { key: learnt, stage: 'lines' };
      setLearning(learnRef.current);
      lines.push(...loadLines(learnLines(learnt)));
    }
    // A word said: its one-time translation on this page, and the audio's motif
    const word = sayingWord(frame.prev, frame.state, frame.events);
    if (word !== null) {
      if (!usedRef.current.includes(word)) {
        usedRef.current = [...usedRef.current, word];
        setUsed(usedRef.current);
        const joke = firstUseLine(def, word);
        if (joke !== null) lines.push(...loadLines([joke]));
      }
      onSayRef.current?.(word, WORD_MOTIF[word]);
    }
    if (lines.length > 0) setTalk((q) => enqueue(q, lines, perBeatRef.current));
    setBarks((log) => barkLog(log, barksOf(frame.prev, frame.state, frame.events), frame.state.tick));
    // 震動: Mocha's push lands (§ 2.11)
    if (frame.events.some((e) => e.type === 'push')) pulse('push', vibrateRef.current);
    // Its sounds (§ 2.12): the parts the player moved in the last 1.5 s already sounded on release
    if (frame.state.tick !== frame.prev.tick) {
      const now = performance.now();
      const moved = new Set<Id>();
      for (const [id, at] of movedRef.current) if (now - at < MOVED_MS) moved.add(id);
      for (const e of frame.events) if (e.type === 'partEnter' && e.id !== undefined) movedRef.current.delete(e.id);
      soundRef.current(tickSounds(def, frame.prev, frame.state, frame.events, moved));
    }
  }, [def, frame]);
  // The learn beat's lines read (or none): the word card comes up
  useEffect(() => {
    if (learning?.stage !== 'lines') return;
    const keys = new Set(learnLines(learning.key));
    if (!talk.beats.some((b) => b.some((l) => keys.has(l.key)))) setLearning({ key: learning.key, stage: 'card' });
  }, [learning, talk]);
  // The ring and the card hold the world while they are up (GDD § 2.4)
  useEffect(() => {
    if (!ringOpen) return undefined;
    session.pause('ring');
    return () => session.resume('ring');
  }, [session, ringOpen]);
  const carding = learning?.stage === 'card';
  useEffect(() => {
    if (!carding) return undefined;
    session.pause('card');
    return () => session.resume('card');
  }, [session, carding]);
  const closeRing = useCallback(() => setRingOpen(false), []);
  const cardDone = useCallback(() => setLearning(null), []);
  const onAdvance = useMemo(() => () => setTalk(advance), []);
  // The photo moment is a modal over the page (#183: a line left up under it was stranded under the
  // HUD): the beat waits under it and comes back after the shot
  const momentUp = moment !== null;
  const talkView = useMemo(() => ({ beat: momentUp ? null : currentBeat(talk), serial: talk.serial, onAdvance }), [talk, onAdvance, momentUp]);

  const osReduced = useReducedMotion();
  const reduced = reducedProp ?? osReduced;

  // The hint ladder (#100): 提示 climbs it, the player's own move resets it; level 3 plays the action
  const ladder = useHintLadder({
    def,
    session,
    state: frame.state,
    enabled: !still,
    autoMs: pageChrome?.autoHintMs ?? null,
    held: hold || ringOpen || learning !== null || moment !== null,
    reduced,
    onPlay: (action) => {
      if (action.t === 'say') setRingOpen(false);
    },
  });
  const { acted, press: pressHint } = ladder;
  // A fixture pins a level (computed here, in-process: no worker in a still)
  const pinned = useMemo(() => (showHint === undefined ? null : hintDisplay(def, nextHint(def, session.frame().state), showHint)), [def, session, showHint]);
  const hintShown = pinned ?? ladder.display;
  const hintSerial = pinned === null ? ladder.serial : -1;
  // Mocha says the hint's line (§ 5.3) in his bark bubble, when he is on the page
  useEffect(() => {
    const line = hintShown.line;
    const now = session.frame().state;
    if (line === null || mochaNode(def, now) === null) return;
    setBarks((log) => barkLog(log, [{ who: 'mocha', bark: 'hint', text: line, tick: now.tick }], now.tick));
  }, [def, session, hintShown.line, hintSerial]);
  // 提示 or the nudge shows a hint: the soft bell with its shimmer (§ 2.12)
  const hintRung = useRef(ladder.serial);
  const traceRef = useRef(pageChrome?.onTrace);
  traceRef.current = pageChrome?.onTrace;
  useEffect(() => {
    if (ladder.serial === hintRung.current) return;
    hintRung.current = ladder.serial;
    soundRef.current([{ cue: 'hint' }]);
    traceRef.current?.({ t: 'hint', level: ladder.level });
  }, [ladder.serial, ladder.level]);
  const onHint = useCallback(() => {
    pressHint();
    pageChrome?.onHint?.();
  }, [pressHint, pageChrome]);

  const say = useCallback(
    (word: Word) => {
      acted();
      traceRef.current?.({ t: 'move' });
      session.input({ t: 'say', word });
      setRingOpen(false);
    },
    [session, acted],
  );
  // The idle wiggle (bible § 4.1): quiet while a finger is down; a tapped prop shakes (bible § 4 props)
  const [fingerDown, setFingerDown] = useState(false);
  const locked = useMemo(() => def.parts.filter((p) => partLocked(def, frame.state, p.id)).map((p) => p.id), [def, frame.state]);
  const idle = useIdleWiggle(def, { enabled: !still && !reduced, quiet: fingerDown, excluded: locked });
  const onEvent = useMemo(
    () => (event: GestureEvent) => {
      // The player's own move (a part, a perch, Mocha; a drag landing on a stop) puts the hint ladder back to rest
      if ((event.type === 'tap' && (event.target.kind === 'part' || event.target.kind === 'perch' || event.target.kind === 'mocha')) || event.type === 'snap') {
        acted();
        traceRef.current?.({ t: 'move' });
      }
      if (event.type === 'nope' || event.type === 'wordRing') traceRef.current?.({ t: event.type === 'nope' ? 'nope' : 'ring' });
      if (event.type === 'snap') pulse('snap', vibrateRef.current);
      // Its sound now, on release (§ 2.12); the tick that applies it stays quiet for that part
      if (event.type === 'snap') movedRef.current.set(event.part, performance.now());
      if (event.type === 'tap' && event.target.kind === 'part' && !locked.includes(event.target.id)) movedRef.current.set(event.target.id, performance.now());
      soundRef.current(gestureSounds(def, event));
      if (event.type === 'tap' && event.target.kind === 'part' && !locked.includes(event.target.id)) {
        const part = def.parts.find((p) => p.id === event.target.id);
        if (part !== undefined && !wearsMarigold(part)) idle.poke(part.id);
      }
      if (event.type === 'wordRing') {
        // The ring, or before any word is learned, 「要！」 pointing at what he wants (GDD § 6 risk 1)
        const now = session.frame().state;
        // Carried (抱抱, #120) he is busy being carried: words wait until she sets him down
        if (!now.done && now.baby.mode !== 'carried' && learnRef.current?.stage !== 'card') {
          if (ringWords(def, now).length > 0) setRingOpen(true);
          else setBarks((log) => barkLog(log, [wantPoke(def, now)], now.tick));
        }
      }
      if (event.type === 'tudigong') {
        // 「呵呵，囡仔，慢慢仔來。」 (§ 5.3) — once in the queue however often he is tapped; Mocha squints
        // at him the first time on chapters 4, 7 and 10
        const first = !attemptRef.current.tudigong;
        const keys = ['rec.uncle.tap', ...(first && SQUINT_CHAPTERS.has(def.chapter) && mochaNode(def, session.frame().state) !== null ? ['rec.mocha.squint'] : [])];
        setTalk((q) => (q.beats.some((b) => b.some((l) => l.key === 'rec.uncle.tap')) ? q : enqueue(q, loadLines(keys), perBeatRef.current)));
        earn('tudigong');
      }
      onGesture?.(event);
    },
    [def, session, locked, idle.poke, onGesture, acted, earn],
  );
  const gestures = useGestures(def, session, layout, frame, ms, reduced, ringOpen, onEvent);
  // A tap anywhere on the page while a subtitle beat is up reads it on (#183: the AI playtest only
  // found that a tap on the line itself did). A pointer that comes down while a beat is up is a
  // reader: if it lifts as a tap, the gesture is cancelled (no input, nothing pressed, the world
  // resumes) and the beat moves on; if it turned into a drag, it plays on the page as usual and the
  // line stays. A gesture already under way when a line arrives is never a reader. The bar, the
  // ring, the word card and the photo moment keep their own taps (they stop propagation).
  const talkUpRef = useRef(false);
  talkUpRef.current = currentBeat(talk) !== null;
  const draggingRef = useRef<Id | null>(null);
  draggingRef.current = gestures.flags.dragging;
  const readers = useRef(new Set<number>());
  const pageHandlers = useMemo(() => {
    const g = gestures.handlers;
    return {
      onPointerDown(e: ReactPointerEvent<Element>) {
        if (talkUpRef.current) readers.current.add(e.pointerId);
        g.onPointerDown(e);
      },
      onPointerMove: g.onPointerMove,
      onPointerUp(e: ReactPointerEvent<Element>) {
        if (readers.current.delete(e.pointerId) && draggingRef.current === null && talkUpRef.current) {
          g.onPointerCancel(e);
          setTalk(advance);
          return;
        }
        g.onPointerUp(e);
      },
      onPointerCancel(e: ReactPointerEvent<Element>) {
        readers.current.delete(e.pointerId);
        g.onPointerCancel(e);
      },
    };
  }, [gestures.handlers]);
  const live = gestures.flags;
  // 長輩模式: the hold-to-reveal outlines are always on (§ 2.11 "hold-to-show-parts always on")
  const elder = affordance?.elder === true;
  const shown = showGesture ? { ...live, ...showGesture } : live;
  const flags = elder && !shown.reveal ? { ...shown, reveal: true } : shown;
  const down = live.finger !== null || live.dragging !== null;
  useEffect(() => setFingerDown(down), [down]);
  // A wheel under the finger ratchets at every stop it passes (§ 2.12 wheel step)
  const dragStop = useRef<{ readonly part: Id; readonly stop: number } | null>(null);
  const preview = live.preview;
  useEffect(() => {
    if (preview === null) {
      dragStop.current = null;
      return;
    }
    const stop = Math.round(preview.index);
    const was = dragStop.current;
    dragStop.current = { part: preview.part, stop };
    if (was === null || was.part !== preview.part || was.stop === stop) return;
    const p = def.parts.find((x) => x.id === preview.part);
    if (p?.preset === 'wheel' || p?.preset === 'loop') soundRef.current([{ cue: 'ratchet' }]);
  }, [def, preview]);
  // The first-use tutorial (§ 2.4; 1-3): the portrait glows, the ghost hand taps him, then the word
  const tWord = useMemo(() => tutorialWord(def), [def]);
  const tutorial = tutorialShow({
    word: tWord,
    state: frame.state,
    used: tWord !== null && used.includes(tWord),
    busy: learning !== null,
    ringOpen,
  });
  // The prologue's scripted tutorial (#106): its cue must hold for its delay, live, with nothing said
  const scripted = useScriptedTutorial(def, frame.state, tutorials && !still && !paused && !hold && !ringOpen && learning === null && moment === null && currentBeat(talk) === null);
  // A scripted nudge's line (1-5, #183): Mocha says it once as the nudge shows
  const nudgeLine = scripted?.kind === 'nudge' ? scripted.line ?? null : null;
  useEffect(() => {
    const now = session.frame().state;
    if (nudgeLine === null || mochaNode(def, now) === null) return;
    setBarks((log) => barkLog(log, [{ who: 'mocha', bark: 'hint', text: nudgeLine, tick: now.tick }], now.tick));
  }, [def, session, nudgeLine]);
  const scriptedHand = scripted?.kind === 'hand' ? { level: 2 as const, key: scripted.key, stop: scripted.stop } : scripted?.kind === 'nudge' ? { level: 0 as const, key: scripted.key } : null;
  // What the page shows: a fixture's own flags, else the ladder's hint, else a tutorial's hand
  const hintShow = affordance?.hint ?? hintShown.show ?? scriptedHand ?? (tutorial.baby ? { level: 2 as const, key: 'baby:baby' } : null);
  const mochaCue = affordance?.mocha ?? hintShown.mocha ?? (hintShown.show === null && scripted?.kind === 'nudge' ? scripted.mocha : null);
  const bubble = affordance?.bubble ?? scripted?.kind === 'bubble';
  const pageAffordance = useMemo(
    () => ({ ...affordance, wiggle: idle.wiggle, hint: hintShow, mocha: mochaCue, bubble }),
    [affordance, idle.wiggle, hintShow, mochaCue, bubble],
  );

  // The page's character frames (#94) and environment bitmaps (#96): preloaded and decoded as it
  // opens (placeholders until then); once they are in, the next page's backdrop is preloaded too
  const spritesReady = usePagePreload(def.chapter);
  const next = useMemo(() => nextPage(def.id), [def.id]);
  const artReady = usePageArt(def, next);

  const ids = useSvgIds('book');
  const ctx: KitCtx = useMemo(() => ({ ...kitCtx('book'), id: ids }), [ids]);
  const sky = chapterSky(def.chapter);
  const chrome = useMemo(() => {
    const defs = kitDefs(ctx, ['linen', 'vign', 'foil', 'coin', 'softShadow', 'softMarigold']);
    return {
      cover: defs + cover(ctx, layout.vw, layout.vh),
    };
  }, [ctx, layout.vw, layout.vh]);

  const { scale } = layout;
  const page: CSSProperties = {
    position: 'absolute',
    left: layout.x + VIEW_BOX.x * scale,
    top: layout.y + VIEW_BOX.y * scale,
    // Tilt parallax (bible § 2.3, #136) will lean this container; perspective lives here only
    perspective: '1200px',
  };
  // The dark book block behind the page (the boards' thickness), like proof A
  const block: CSSProperties = {
    position: 'absolute',
    left: layout.x - 12 * scale,
    top: layout.y - 8 * scale,
    width: (390 + 24) * scale,
    height: (VIEW_BOX.h - 8) * scale,
    borderRadius: 8 * scale,
    background: POPUP.coverDark,
    boxShadow: `0 ${6 * scale}px ${18 * scale}px ${POPUP.vignette}`,
  };
  // The HUD and the bar keep their 390 box (and their 20 px text, R5) down to 360 px wide, overhanging a few px of cover
  const hudScale = Math.min(1, layout.vw / 360);
  // The gyro tilt leans the page box (never while held: a turn reads its layers)
  const boxRef = useRef<HTMLDivElement | null>(null);
  const setBox = useCallback(
    (el: HTMLDivElement | null) => {
      boxRef.current = el;
      if (typeof pageRef === 'function') pageRef(el);
      else if (pageRef) (pageRef as MutableRefObject<HTMLDivElement | null>).current = el;
    },
    [pageRef],
  );
  useTilt(boxRef, tilt && !still && !hold && !reduced);
  // The word ring opens round Baokaka's middle; the word card hangs over the middle of the page
  const babyAt = nodePos(def, frame.state, frame.state.baby.node);
  const ringAt = ringOpen ? toScreen(layout, babyAt ? [babyAt[0], babyAt[1] - 26] : [195, 400]) : null;
  const words = useMemo(() => ringWords(def, frame.state), [def, frame.state]);
  const fresh = def.learns?.word !== undefined && words.includes(def.learns.word) && !used.includes(def.learns.word) ? def.learns.word : null;

  return (
    <main
      className="fixed inset-0 select-none overflow-hidden"
      style={{ background: POPUP.cover, touchAction: 'none', WebkitTouchCallout: 'none' }}
      lang="zh-Hant"
      data-popup-page={def.id}
      data-still={still ? '' : undefined}
      data-sprites={spritesReady && artReady ? 'ready' : 'loading'}
      data-hint-level={ladder.level}
      data-hint-source={ladder.answer?.source}
      {...pageHandlers}
    >
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true" dangerouslySetInnerHTML={{ __html: chrome.cover }} />
      <div style={block} aria-hidden="true" />
      <div style={page} ref={setBox} data-page-box="">
        <PageView def={def} prev={frame.prev} state={frame.state} ms={midStep ? stillAt : ms} tickMs={frame.tickMs} scale={scale} reduced={reduced} gesture={flags} affordance={pageAffordance} still={still && !midStep} events={frame.events} barks={barks} talk={talkView} textScale={textScale} lowPower={lowPower} />
      </div>
      <TopHud
        landmark={chapterInfo(def.chapter).landmark}
        title={def.title}
        chapter={def.chapter}
        index={def.index}
        time={sky.time}
        coins={pageChrome?.coins ?? 0}
        fill={pageChrome?.trayFill}
        scale={hudScale}
        textScale={textScale}
      />
      <BottomBar
        scale={hudScale}
        textScale={textScale}
        stickers={pageChrome?.stickers}
        leftHand={pageChrome?.leftHand}
        glow={tutorial.portrait}
        retryGlow={hintShown.retry}
        reduced={reduced}
        onPortrait={gestures.openRing}
        onHint={onHint}
        onRetry={pageChrome?.onRetry}
        onMenu={pageChrome?.onMenu}
        pop={pop}
      />
      {ringAt && (
        <WordRing
          around={ringAt}
          words={words}
          safe={ringSafeArea(layout)}
          leftHand={pageChrome?.leftHand}
          fresh={fresh}
          hand={tutorial.disc ?? hintShown.ringWord}
          reduced={reduced}
          onSay={say}
          onClose={closeRing}
        />
      )}
      {learning?.stage === 'card' && <WordCard learn={learning.key} vw={layout.vw} cy={toScreen(layout, [195, 300])[1]} reduced={reduced} onDone={cardDone} />}
      {moment !== null && <PhotoMoment chapter={def.chapter} def={def} mocha={moment.mocha} reduced={reduced} still={still} at={showPhoto?.at} vw={layout.vw} onSnap={snapped} />}
    </main>
  );
}
