import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type Ref } from 'react';
import { POPUP } from '../../art/palette';
import { useSvgIds } from '../../art/useSvgIds';
import { useReducedMotion } from '../../components/motion';
import { nodePos } from '../core/graph';
import { partLocked } from '../core/step';
import { cover, kitCtx, kitDefs, type KitCtx } from '../art';
import { chapterInfo, chapterLine as contentChapterLine } from '../content';
import type { SimEvent } from '../core/events';
import type { Input, LineKey, PageDef, SimState, Word } from '../core/types';
import { loadLines } from '../content/script';
import type { LearnKey } from '../content/words';
import { PageSession, type SessionFrame, type TickSpeed } from '../game/session';
import { EMPTY_TALK, advance, currentBeat, enqueue, firedLines, introLines, type TalkQueue } from '../game/talk';
import { WORD_MOTIF, firstUseLine, learnLines, learnedNow, ringWords, tutorialShow, tutorialWord } from '../game/words';
import { usePagePreload } from '../sprites';
import { usePageArt } from '../env/loader';
import { nextPage } from '../pages';
import { chapterSky } from './art/placeholders';
import { bookLayout, toScreen, type BookLayout } from './geometry';
import { BottomBar } from './hud/BottomBar';
import { TopHud } from './hud/TopHud';
import { wearsMarigold, type AffordanceFlags } from './affordance/look';
import { useIdleWiggle } from './affordance/useIdleWiggle';
import type { GestureEvent, GestureFlags } from './gestures';
import './gestures.css';
import { PART_SETTLE_MS } from './interp';
import { PageView, VIEW_BOX } from './PageView';
import { useGestures } from './useGestures';
import { barkLog, barksOf, type BarkShow } from './talk';
import { sayingWord } from './actors';
import { WordCard, WordRing, ringSafeArea, wantPoke } from './words';

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
 * Images (#94, #96): the page preloads its chapter's baked character frames (`usePagePreload`)
 * and its own environment bitmaps (`usePageArt`, then the next page's backdrop) as it opens, and
 * marks itself `data-sprites="ready"` once both are decoded (screenshots wait for it).
 *
 * Touchable states (#140): the idle wiggle runs on its own timer (`useIdleWiggle`; off in a still,
 * under reduced motion and while a finger is down), and a tapped prop shakes. `affordance` passes
 * hints (#100), done knots and 長輩模式 through to the page.
 */

const subscribeResize = (onChange: () => void) => {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
};
const readSize = () => `${window.innerWidth}x${window.innerHeight}`;

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
  /** The page's stickers so far: 解開, 淘氣, 土地公 */
  readonly stickers?: readonly [boolean, boolean, boolean];
  /** 左手模式: the bottom bar mirrored */
  readonly leftHand?: boolean;
  readonly onHint?: () => void;
  readonly onRetry?: () => void;
  readonly onMenu?: () => void;
}

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
  /** The page was completed (its goal grabbed): called once per session */
  readonly onDone?: (state: SimState) => void;
  /** The HUD's and the bottom bar's state and buttons (#97) */
  readonly chrome?: PageChrome;
  /** Visual QA fixtures (#99): open the word ring, put a word card up, show the 「要！」 poke */
  readonly showWords?: { readonly ring?: boolean; readonly card?: LearnKey; readonly poke?: boolean };
  /** A word was said (its say tick): the word and its sound motif (`WORD_MOTIF`) for the audio (#105) */
  readonly onSay?: (word: Word, motif: readonly number[]) => void;
  /** The book's page box (the page fold and the chapter turn animate inside it, #97) */
  readonly pageRef?: Ref<HTMLDivElement>;
}

export function PagePlayer({ def, speed = 'normal', from, prev, events, talk: openLines, paused: pausedProp = false, still = false, script, onGesture, affordance, showGesture, reduced: reducedProp, hold = false, onDone, chrome: pageChrome, pageRef, showWords, onSay }: PagePlayerProps) {
  const layout = useBookLayout();
  const paused = pausedProp || still;
  const session = useMemo(() => new PageSession(def, { speed, from, prev: still ? undefined : prev, events }), [def, speed, from, prev, still, events]);
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

  // The page completes once per session
  const doneFired = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    doneFired.current = false;
  }, [session]);
  useEffect(() => {
    if (!frame.state.done || doneFired.current || still) return;
    doneFired.current = true;
    onDoneRef.current?.(frame.state);
  }, [frame.state, still]);

  // What is said (#98): the subtitle queue (the intro, then lines the page's events fire; a tap on a
  // bubble advances) and the barks of the last few ticks
  const [talk, setTalk] = useState<TalkQueue>(EMPTY_TALK);
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
  useEffect(() => {
    const open = openLines !== undefined ? loadLines(openLines) : from === undefined ? introLines(def) : [];
    setTalk(enqueue(EMPTY_TALK, open));
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
    if (lines.length > 0) setTalk((q) => enqueue(q, lines));
    setBarks((log) => barkLog(log, barksOf(frame.prev, frame.state, frame.events), frame.state.tick));
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
  const say = useCallback((word: Word) => {
    session.input({ t: 'say', word });
    setRingOpen(false);
  }, [session]);
  const closeRing = useCallback(() => setRingOpen(false), []);
  const cardDone = useCallback(() => setLearning(null), []);
  const onAdvance = useMemo(() => () => setTalk(advance), []);
  const talkView = useMemo(() => ({ beat: currentBeat(talk), serial: talk.serial, onAdvance }), [talk, onAdvance]);

  const osReduced = useReducedMotion();
  const reduced = reducedProp ?? osReduced;
  // The idle wiggle (bible § 4.1): quiet while a finger is down; a tapped prop shakes (bible § 4 props)
  const [fingerDown, setFingerDown] = useState(false);
  const locked = useMemo(() => def.parts.filter((p) => partLocked(def, frame.state, p.id)).map((p) => p.id), [def, frame.state]);
  const idle = useIdleWiggle(def, { enabled: !still && !reduced, quiet: fingerDown, excluded: locked });
  const onEvent = useMemo(
    () => (event: GestureEvent) => {
      if (event.type === 'tap' && event.target.kind === 'part' && !locked.includes(event.target.id)) {
        const part = def.parts.find((p) => p.id === event.target.id);
        if (part !== undefined && !wearsMarigold(part)) idle.poke(part.id);
      }
      if (event.type === 'wordRing') {
        // The ring, or before any word is learned, 「要！」 pointing at what he wants (GDD § 6 risk 1)
        const now = session.frame().state;
        if (!now.done && learnRef.current?.stage !== 'card') {
          if (ringWords(def, now).length > 0) setRingOpen(true);
          else setBarks((log) => barkLog(log, [wantPoke(def, now)], now.tick));
        }
      }
      onGesture?.(event);
    },
    [def, session, locked, idle.poke, onGesture],
  );
  const gestures = useGestures(def, session, layout, frame, ms, reduced, ringOpen, onEvent);
  const live = gestures.flags;
  const flags = showGesture ? { ...live, ...showGesture } : live;
  const down = live.finger !== null || live.dragging !== null;
  useEffect(() => setFingerDown(down), [down]);
  // The first-use tutorial (§ 2.4; 1-3): the portrait glows, the ghost hand taps him, then the word
  const tWord = useMemo(() => tutorialWord(def), [def]);
  const tutorial = tutorialShow({
    word: tWord,
    state: frame.state,
    used: tWord !== null && used.includes(tWord),
    busy: learning !== null,
    ringOpen,
  });
  const tutorialHint = tutorial.baby && !affordance?.hint;
  const pageAffordance = useMemo(
    () => ({ ...affordance, wiggle: idle.wiggle, ...(tutorialHint ? { hint: { level: 2 as const, key: 'baby:baby' } } : {}) }),
    [affordance, idle.wiggle, tutorialHint],
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
      {...gestures.handlers}
    >
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true" dangerouslySetInnerHTML={{ __html: chrome.cover }} />
      <div style={block} aria-hidden="true" />
      <div style={page} ref={pageRef} data-page-box="">
        <PageView def={def} prev={frame.prev} state={frame.state} ms={ms} tickMs={frame.tickMs} scale={scale} reduced={reduced} gesture={flags} affordance={pageAffordance} still={still} events={frame.events} barks={barks} talk={talkView} />
      </div>
      <TopHud
        landmark={chapterInfo(def.chapter).landmark}
        title={def.title}
        chapter={def.chapter}
        index={def.index}
        time={sky.time}
        coins={pageChrome?.coins ?? 0}
        scale={hudScale}
      />
      <BottomBar
        scale={hudScale}
        stickers={pageChrome?.stickers}
        leftHand={pageChrome?.leftHand}
        glow={tutorial.portrait}
        reduced={reduced}
        onPortrait={gestures.openRing}
        onHint={pageChrome?.onHint}
        onRetry={pageChrome?.onRetry}
        onMenu={pageChrome?.onMenu}
      />
      {ringAt && (
        <WordRing
          around={ringAt}
          words={words}
          safe={ringSafeArea(layout)}
          leftHand={pageChrome?.leftHand}
          fresh={fresh}
          hand={tutorial.disc}
          reduced={reduced}
          onSay={say}
          onClose={closeRing}
        />
      )}
      {learning?.stage === 'card' && <WordCard learn={learning.key} vw={layout.vw} cy={toScreen(layout, [195, 300])[1]} reduced={reduced} onDone={cardDone} />}
    </main>
  );
}
