import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { POPUP as C } from '../../../art/palette';
import { REDUCE_MOTION_CLASS, ReducedMotionContext, usePrefersReducedMotion } from '../../../components/motion';
import { SOON_LINES, cardLines, chapterName, endLines, hasNextChapter, loadLines, UI } from '../../content';
import type { PageDef } from '../../core/types';
import { backdropImage } from '../../env/loader';
import { COVER, chapterStickers, holdsPage, opensChapter, isFirstLaunch, navigate, pageStickers, resumeTarget, treasuresFound, type NavAction, type NavState } from '../../game/nav';
import { ProgressStore, type PageResult } from '../../game/progress';
import type { TickSpeed } from '../../game/session';
import { EMPTY_TALK, MAX_PER_BEAT, advance, currentBeat, enqueue, type TalkQueue } from '../../game/talk';
import { registry as gameRegistry, type PageRegistry } from '../../pages';
import { autoHintMs } from '../affordance/ladder';
import { bookLayout } from '../geometry';
import { PagePlayer } from '../PagePlayer';
import { PAGE_VIEW_BOX } from '../geometry';
import { BOARD_H, CardTalk, ChapterBoard, boardScale } from '../hud/ChapterBoard';
import { CARD_OUT_MS, FIRST_SLAP_MS, SLAP_GAP_MS, StickerCard, cardMs } from '../hud/StickerCard';
import { CAMERA_ORIGIN, cameraTransform, playTurn, turnPlan, type TurnInterlude, type TurnKind, type TurnRun } from '../transitions/pageTurn';
import { Contents } from './Contents';
import { Cover } from './Cover';
import { PauseMenu } from './PauseMenu';
import { Quilt } from './paper';
import { Settings } from './Settings';
import { effectiveSettings, pulse } from '../../game/settings';
import { TextScaleContext, textSizeAttr } from '../textSize';
import '../textSize.css';
import { useLowPower } from '../useLowPower';
import { Album } from '../photo/Album';
import { albumHome, keptPhoto, spreadPage, type Shot } from '../../game/photo';
import type { Photo, SaveV1 } from '../../game/progress';
import { audioUnlocked, chapterTrack, playMusic, setVolumes, stopMusic, suspendAudio, unlockAudio } from '../../../shared/audio';
import { LIVE, SILENT, SoundContext, type SoundSink } from '../sound';
import './screens.css';

/**
 * 翻翻台北's screens and flow (GDD § 2.13; #97): one `ProgressStore` for the app (the save,
 * `popup.save.v1`), the navigation state machine (`game/nav.ts`) and the screens it shows — the
 * cover, a page in the book frame with its HUD and bottom bar, the pause menu, the 目錄 and the
 * album and the settings — plus the page fold and the chapter turn between pages.
 *
 * - Resume is one tap: the cover's 「繼續」 opens `save.current` (R7: ≤ 2).
 * - Opening the page makes it current in the save; completing it records the solve and turns to
 *   the next page (a chapter turn when the chapter changes); after the last registered page the
 *   目錄 opens.
 * - **Completion** (GDD § 2.8; #101): 「這個！」 and the sparkle, the page held `GRAB_HOLD_MS`, the
 *   pop-ups fold flat, then the **sticker card** (the turn's interlude: the page's three stickers
 *   slap on) until `cardMs` passes or a tap, then the leaf turns and the next page unfolds. The
 *   solve is saved at once with the attempt's stickers and moves; 淘氣 and 土地公 earned mid-page are
 *   saved the moment they are earned (`store.earnSticker`).
 * - **The chapter card** (GDD § 2.13, § 5.2; #102): a chapter turn drops the departure board in
 *   over the book on the quilt; once it has settled its lines (`cardLines`) play under it, a tap a
 *   beat, then it lifts away and the camera comes back in. Opening a chapter's first page from the
 *   cover or the 目錄 (「開始」 included) plays the same card first (a chapter open). A tap before
 *   the lines skips the whole turn. The new page's own intro waits for the turn to end.
 * - Any layer over a page (the menu, the 目錄, the settings) and a turn in progress hold the page's
 *   session (§ 2.6).
 * - **The chapter spread** (GDD § 2.9; #103): the photo taken on the spread is kept at once
 *   (`store.keepPhoto`); when the treasure is grabbed the album page opens over the book with the
 *   print flying in and the four notes popping on. 「再拍一次」 replays the 3-second moment;
 *   「放進相簿」 goes on to the sticker card and the chapter turn. The cover's 相簿 opens the
 *   album at the latest chapter with a photo (#113 adds the other chapters).
 * - **The chapter's end** (GDD § 4.3 1-6 notes; #107): after 「放進相簿」 the chapter-end lines
 *   (`endLines`) play over the finished spread, a tap a beat, as a modal; then the 抓周 tray's new
 *   slot fills (the HUD holds the coin back until then: `trayHold`), the sticker card shows, and
 *   the chapter turn brings the next chapter's card. While that chapter isn't built yet, the card is
 *   the next chapter's with 「未完待續」 on its split-flap row and `SOON_LINES` under it; then the 目錄.
 * - **Settings** (GDD § 2.11; #104, D-67): the 設定 screen (`Settings.tsx`) writes them through the
 *   store and they apply live, read through `effectiveSettings` (長輩模式 over the player's own
 *   values): tick speed, 大字 (`TextScaleContext` and `[data-text-size="big"]` on the root and on
 *   `<html>` for portalled sheets), 自動提示 (the hint nudge's delay), 左手模式, 減少動態 (null
 *   follows the OS), 震動 (pulses on a snap, a push and a sticker), the gyro tilt, and 長輩模式's
 *   extras on the page. Low power (`useLowPower`: frames over 20 ms for 2 s) drops the tilt and
 *   the confetti and halves the sparkles. 「重新開始」 (a 3-second hold) starts a new game with the
 *   same settings and goes to the cover.
 * - **Sound** (GDD § 2.12; #105, D-68): the first touch, click or key anywhere unlocks WebAudio (iOS);
 *   音效 / 音樂 set the two buses' volumes live (a 音效 change plays a click at the new volume); the
 *   chapter's music box loops under the page (the prologue's on the cover), switching at the turn
 *   and sleeping while the tab is hidden. The shell is the `SoundContext` for every screen in it:
 *   the page's cues, the turn's fold, leaf, fwump and chapter card, the sticker card's slaps, the
 *   shutter and the album's notes. A still is silent.
 */

export interface GameShellProps {
  /** One store per app; a fixture passes a seeded one (it is not disposed here then) */
  readonly store?: ProgressStore;
  readonly registry?: PageRegistry;
  /** Where to start (fixtures); the cover by default */
  readonly initial?: NavState;
  /** A still for screenshots: no idle motion, the page held */
  readonly still?: boolean;
  /** Override reduced motion (visual QA stills pin a look) */
  readonly reduced?: boolean;
  /** Visual QA fixtures (#101): the page folded flat under its sticker card */
  readonly stickerCard?: boolean;
  /** Visual QA fixtures (#102): the chapter card of this chapter hanging over the book on the quilt, its first beat of lines under it */
  readonly chapterCard?: number;
  /** Visual QA fixtures (#103): the album as it opens after the spread, the print landed and every note on; `retaken` adds a second shot to choose from */
  readonly albumAfter?: { readonly chapter: number; readonly retaken?: Photo };
  /** Visual QA fixtures (#107): this chapter's end lines over its finished spread, their first beat */
  readonly endLinesOf?: number;
  /** Visual QA fixtures (#107): the card of this chapter, not built yet — 「未完待續」 on its row, its line under it */
  readonly soonCard?: number;
}

const SPEEDS: readonly TickSpeed[] = ['slow', 'normal', 'fast'];
/** After the goal is grabbed (「這個！」, the sparkle) the page holds this long before it folds (GDD § 2.8). */
export const GRAB_HOLD_MS = 900;
/** Events that may unlock WebAudio: the first that counts as a user activation wins (#105) */
const UNLOCK_EVENTS = ['pointerdown', 'pointerup', 'touchend', 'keydown'] as const;
/** The chapter card hangs this far below the safe area's top (#102) */
const BOARD_TOP = 14;

const subscribeResize = (onChange: () => void) => {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
};
const readSize = () => `${window.innerWidth}x${window.innerHeight}`;

/** The sticker card on screen: the page it is for, and how to end it (the turn goes on). */
interface CardShow {
  readonly id: string;
  readonly leaving: boolean;
  readonly end: () => void;
}

/** The chapter card on screen: its chapter, and whether that chapter isn't built yet (「未完待續」, #107). */
interface BoardShow {
  readonly chapter: number;
  readonly soon?: boolean;
}

/** The lines under a card: its chapter's (§ 5.2), or the 未完待續 line (#107). */
const boardLines = (b: BoardShow) => (b.soon ? SOON_LINES : cardLines(b.chapter));

/** After the chapter-end lines, the new coin fills the tray and holds this long before the sticker card (#107). */
export const TRAY_FILL_MS = 1300;

/** The album over the book after a spread (#103): the chapter, and how to go on. */
interface AlbumAfter {
  readonly chapter: number;
  readonly photo: Photo | null;
  readonly mocha: boolean;
  readonly fresh: boolean;
  readonly retaken?: Photo;
  readonly go: () => void;
}

export function GameShell({ store: given, registry: reg = gameRegistry, initial = COVER, still = false, reduced: reducedProp, stickerCard = false, chapterCard, albumAfter, endLinesOf, soonCard }: GameShellProps) {
  const [store] = useState(() => given ?? new ProgressStore({ registry: reg }));
  useEffect(() => (given ? undefined : () => store.dispose()), [given, store]);
  const save = useSyncExternalStore(store.subscribe, store.get);
  const [nav, setNav] = useState<NavState>(initial);
  const go = useCallback((action: NavAction) => setNav((s) => navigate(s, action, store.get(), reg)), [store, reg]);

  const osReduced = usePrefersReducedMotion();
  const reduceSetting = save.settings.reduceMotion;
  const lowPower = useLowPower(!still);
  const settings = useMemo(() => effectiveSettings(save.settings, { osReduced, lowPower }), [save.settings, osReduced, lowPower]);
  const reduced = reducedProp ?? settings.reduceMotion;
  const speed = SPEEDS[settings.speed] ?? 'normal';
  const textSize = textSizeAttr(settings.textScale);
  const elderLook = useMemo(() => (settings.elder ? { elder: true } : undefined), [settings.elder]);
  // 大字 and 減少動態 on <html> too: the pause menu's sheet is portalled out of the shell
  useEffect(() => {
    const root = document.documentElement;
    if (textSize) root.setAttribute('data-text-size', textSize);
    else root.removeAttribute('data-text-size');
    root.classList.toggle(REDUCE_MOTION_CLASS, reduceSetting === true);
    return () => {
      root.removeAttribute('data-text-size');
      root.classList.remove(REDUCE_MOTION_CLASS);
    };
  }, [textSize, reduceSetting]);
  const vibrateRef = useRef(settings.vibrate);
  vibrateRef.current = settings.vibrate && !still;

  // ——— Sound (#105): unlocked by the first gesture, the volumes, the chapter's music box ———
  const sink: SoundSink = still ? SILENT : LIVE;
  const sinkRef = useRef(sink);
  sinkRef.current = sink;
  const [unlocked, setUnlocked] = useState(audioUnlocked);
  useEffect(() => {
    if (still) return undefined;
    const unlock = () => {
      if (unlockAudio()) setUnlocked(true);
    };
    const hide = () => suspendAudio(document.hidden);
    // A touch only counts as a user activation on its release (iOS Safari): listen to both ends
    for (const type of UNLOCK_EVENTS) window.addEventListener(type, unlock, true);
    document.addEventListener('visibilitychange', hide);
    return () => {
      for (const type of UNLOCK_EVENTS) window.removeEventListener(type, unlock, true);
      document.removeEventListener('visibilitychange', hide);
    };
  }, [still]);
  useEffect(() => setVolumes(settings.sfx, settings.music), [settings.sfx, settings.music]);

  const base = nav.base;
  const def: PageDef | undefined = base.kind === 'page' ? reg.pageById(base.id) : undefined;

  // The music box: the page's chapter (the prologue's on the cover); it changes as the turn swaps the page
  const track = still || !unlocked || settings.music <= 0 ? null : chapterTrack(def?.chapter ?? 0);
  useEffect(() => {
    if (track === null) stopMusic();
    else playMusic(track);
  }, [track]);
  useEffect(() => () => stopMusic(), []);

  // Opening a page makes it the one to resume
  useEffect(() => {
    if (def && !still) store.openPage(def.id);
  }, [def, store, still]);

  // ——— The page fold and the chapter turn ———
  const bookRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const boardLayerRef = useRef<HTMLDivElement>(null);
  const pageBoxRef = useRef<HTMLDivElement | null>(null);
  const turnRef = useRef<TurnRun | null>(null);
  const [turning, setTurning] = useState(false);
  const size = useSyncExternalStore(subscribeResize, readSize, () => '390x844');

  const holdTimer = useRef(0);
  // ——— The sticker card (#101): shown in the turn's interlude, over the folded page ———
  const [card, setCard] = useState<CardShow | null>(null);
  const cardRef = useRef(card);
  cardRef.current = card;
  const cardTimers = useRef<number[]>([]);
  const clearCardTimers = () => {
    cardTimers.current.forEach((t) => window.clearTimeout(t));
    cardTimers.current = [];
  };
  /** Shows the card for `id`; resolves when it has lifted away (after `cardMs`, or a tap: `end`). */
  const showCard = useCallback(
    (id: string) =>
      new Promise<void>((resolve) => {
        let ended = false;
        const end = () => {
          if (ended) return;
          ended = true;
          clearCardTimers();
          setCard((c) => (c === null ? c : { ...c, leaving: true }));
          cardTimers.current.push(
            window.setTimeout(() => {
              setCard(null);
              resolve();
            }, CARD_OUT_MS),
          );
        };
        setCard({ id, leaving: false, end });
        // 震動: the stickers slap on (§ 2.11); each slaps with a sound as it lands (§ 2.12)
        pulse('sticker', vibrateRef.current);
        pageStickers(store.get(), id).forEach((got, i) => {
          if (got) cardTimers.current.push(window.setTimeout(() => sinkRef.current([{ cue: 'slap', pitch: 1 + i * 0.08 }]), (reduced ? 0 : FIRST_SLAP_MS * 0.8) + i * SLAP_GAP_MS));
        });
        cardTimers.current.push(window.setTimeout(end, cardMs(reduced)));
      }),
    [reduced, store],
  );
  useEffect(
    () => () => {
      window.clearTimeout(holdTimer.current);
      clearCardTimers();
      turnRef.current?.skip();
    },
    [],
  );

  // ——— The chapter card (#102): the board hanging in a chapter turn, and its lines ———
  const fixtureBoard: BoardShow | null = chapterCard !== undefined ? { chapter: chapterCard } : soonCard !== undefined ? { chapter: soonCard, soon: true } : null;
  const [board, setBoard] = useState<BoardShow | null>(fixtureBoard);
  // 大字 (#104): the card's lines are bigger, so a beat holds 2 of them under the card
  const cardPerBeat = settings.textScale > 1 ? 2 : MAX_PER_BEAT;
  const cardPerBeatRef = useRef(cardPerBeat);
  cardPerBeatRef.current = cardPerBeat;
  const [cardTalk, setCardTalk] = useState<TalkQueue>(() => (fixtureBoard === null ? EMPTY_TALK : enqueue(EMPTY_TALK, loadLines(boardLines(fixtureBoard)), cardPerBeat)));
  const cardTalkRef = useRef(cardTalk);
  cardTalkRef.current = cardTalk;
  /** Resolves the turn's hold once the last beat is tapped away */
  const linesDone = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (currentBeat(cardTalk) !== null || linesDone.current === null) return;
    const done = linesDone.current;
    linesDone.current = null;
    done();
  }, [cardTalk]);
  const cardHold = useCallback(
    (shown: BoardShow): TurnInterlude => ({
      run: () =>
        new Promise<void>((resolve) => {
          const lines = loadLines(boardLines(shown));
          if (lines.length === 0) return resolve();
          linesDone.current = resolve;
          setCardTalk(enqueue(EMPTY_TALK, lines, cardPerBeatRef.current));
        }),
    }),
    [],
  );

  /**
   * Plays a turn to `next`: a page fold, a chapter turn (with the card) or a chapter open (`from`
   * null: the card over the book on the quilt). `swap` puts the new page in. `shown` overrides the
   * card (the 未完待續 card, #107); `finished` runs once the turn is over. False when there is no
   * book to turn.
   */
  const startTurn = useCallback(
    (kind: TurnKind, next: PageDef, from: PageDef | null, swap: () => void, interlude?: TurnInterlude, shown?: BoardShow, finished?: () => void): boolean => {
      const book = bookRef.current, overlay = overlayRef.current;
      if (!book || !overlay) return false;
      const [vw, vh] = readSize().split('x').map(Number);
      const layout = bookLayout(vw, vh);
      const withCard = kind !== 'fold';
      const boardShow = shown ?? { chapter: next.chapter };
      if (withCard) setBoard(boardShow);
      const run = playTurn(
        turnPlan(kind, reduced),
        { book, overlay, pageBox: () => pageBoxRef.current, scale: layout.scale, at: { x: layout.x + PAGE_VIEW_BOX.x * layout.scale, y: layout.y + PAGE_VIEW_BOX.y * layout.scale } },
        {
          fromBackdrop: from ? (backdropImage(from.backdrop)?.url ?? null) : null,
          toBackdrop: backdropImage(next.backdrop)?.url ?? null,
          card: withCard ? () => boardLayerRef.current?.querySelector<HTMLElement>('[data-chapter-board]') ?? null : undefined,
        },
        swap,
        { interlude, card: withCard ? cardHold(boardShow) : undefined, confetti: !settings.lowPower, sound: (cue, delayMs = 0) => sinkRef.current([{ cue, delay: delayMs / 1000 }]) },
      );
      turnRef.current = run;
      setTurning(true);
      void run.finished.then(() => {
        if (turnRef.current === run) turnRef.current = null;
        // Skipped mid-card: put the cards away too
        clearCardTimers();
        setCard(null);
        setBoard(null);
        linesDone.current = null;
        setCardTalk(EMPTY_TALK);
        setTurning(false);
        finished?.();
      });
      return true;
    },
    [reduced, cardHold, settings.lowPower],
  );

  // A chapter's first page opened from the cover or the 目錄 (not by a turn, not 重來): the card first
  const prevBase = useRef(base);
  const opening =
    base !== prevBase.current && base.kind === 'page' && !still && turnRef.current === null
    && !(prevBase.current.kind === 'page' && prevBase.current.id === base.id) && opensChapter(base.id, reg);
  useLayoutEffect(() => {
    prevBase.current = base;
    const opened = base.kind === 'page' ? reg.pageById(base.id) : undefined;
    if (opening && opened) startTurn('open', opened, null, () => undefined);
  }, [base, reg, opening, startTurn]);

  // ——— The chapter's end (#107): its lines over the finished spread, then the tray's new coin ———
  const [endTalk, setEndTalk] = useState<TalkQueue>(() => (endLinesOf === undefined ? EMPTY_TALK : enqueue(EMPTY_TALK, loadLines(endLines(endLinesOf)), cardPerBeat)));
  const endTalkRef = useRef(endTalk);
  endTalkRef.current = endTalk;
  // A fixture's end lines (#107) fill the tray when tapped through, as the game's do
  const endDone = useRef<(() => void) | null>(
    endLinesOf === undefined
      ? null
      : () => {
          setTrayHold(null);
          setTrayFill((n) => n + 1);
        },
  );
  useEffect(() => {
    if (currentBeat(endTalk) !== null || endDone.current === null) return;
    const done = endDone.current;
    endDone.current = null;
    done();
  }, [endTalk]);
  /** The HUD's coins held back until the chapter-end lines are read (null: the save's) */
  const [trayHold, setTrayHold] = useState<number | null>(() => (endLinesOf === undefined ? null : Math.max(0, treasuresFound(store.get()) - 1)));
  /** Counts tray fills: the newest coin replays its fill when it changes (0: none yet) */
  const [trayFill, setTrayFill] = useState(0);
  const endTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(endTimer.current), []);
  /**
   * The chapter's end after its album (#107): the end lines a tap a beat, then (when the treasure is
   * new) the tray's slot fills and holds a moment. Resolves when it's time for the sticker card.
   */
  const endChapter = useCallback(
    (chapter: number, newCoin: boolean) =>
      new Promise<void>((resolve) => {
        const fill = () => {
          if (!newCoin) return resolve();
          setTrayHold(null);
          setTrayFill((n) => n + 1);
          pulse('sticker', vibrateRef.current);
          sinkRef.current([{ cue: 'dropCoin', delay: 0.35 }, { cue: 'sparkle', delay: 0.45 }]);
          endTimer.current = window.setTimeout(resolve, reduced ? TRAY_FILL_MS / 2 : TRAY_FILL_MS);
        };
        const lines = loadLines(endLines(chapter));
        if (lines.length === 0) return fill();
        endDone.current = fill;
        setEndTalk(enqueue(EMPTY_TALK, lines, cardPerBeatRef.current));
      }),
    [reduced],
  );
  /** The chapter-end lines are up: a modal, a tap is the next beat */
  const ending = currentBeat(endTalk) !== null;

  // ——— The spread's photo and the album after it (#103) ———
  const shotRef = useRef<{ readonly id: string; readonly shot: Shot } | null>(null);
  const [after, setAfter] = useState<AlbumAfter | null>(() =>
    albumAfter === undefined ? null : { chapter: albumAfter.chapter, photo: store.get().photos[albumAfter.chapter] ?? null, mocha: false, fresh: false, retaken: albumAfter.retaken, go: () => undefined },
  );
  const onPhoto = useCallback(
    (from: PageDef, shot: Shot) => {
      shotRef.current = { id: from.id, shot };
      store.keepPhoto(from.chapter, keptPhoto(shot, Date.now()));
    },
    [store],
  );

  const onDone = useCallback(
    (from: PageDef, result: PageResult) => {
      const coinsBefore = treasuresFound(store.get());
      store.completePage(from.id, result);
      const newCoin = treasuresFound(store.get()) > coinsBefore;
      // The tray's new coin waits for the chapter's end (#107)
      if (newCoin) setTrayHold(coinsBefore);
      const next = reg.nextPage(from.id);
      setTurning(true);
      window.clearTimeout(holdTimer.current);
      const turnOn = () => {
        // The book's last chapter so far (#107): the next chapter's card reads 「未完待續」, then the 目錄
        if (next === null && from.spread && hasNextChapter(from.chapter)) {
          const soon = { chapter: from.chapter + 1, soon: true };
          if (startTurn('chapter', from, from, () => undefined, { run: () => showCard(from.id) }, soon, () => go({ t: 'next', id: null }))) return;
        }
        const kind = next !== null && next.chapter !== from.chapter ? 'chapter' : 'fold';
        if (next === null || !startTurn(kind, next, from, () => go({ t: 'next', id: next.id }), { run: () => showCard(from.id) })) {
          // The last page (or no book to turn): the card, then the 目錄
          void showCard(from.id).then(() => {
            setTurning(false);
            go({ t: 'next', id: next?.id ?? null });
          });
        }
      };
      const shot = shotRef.current?.id === from.id ? shotRef.current.shot : null;
      shotRef.current = null;
      holdTimer.current = window.setTimeout(() => {
        // A spread: the album page first (the photo flies in), then on
        if (from.spread && shot !== null) {
          setAfter({
            chapter: from.chapter,
            photo: store.get().photos[from.chapter] ?? null,
            mocha: shot.mocha,
            fresh: true,
            go: () => {
              setAfter(null);
              void endChapter(from.chapter, newCoin).then(turnOn);
            },
          });
        } else {
          // No album (no shot, a still): the tray's coin as the page completes
          if (newCoin) setTrayHold(null);
          turnOn();
        }
      }, GRAB_HOLD_MS);
    },
    [store, reg, go, showCard, startTurn, endChapter],
  );
  const onSticker = useCallback((id: string, sticker: 'mischief' | 'tudigong') => store.earnSticker(id, sticker), [store]);
  // A tap while the sticker card is up turns the page on; while the chapter card's lines play it is
  // the next beat; any other tap in the turn skips it
  const onSkip = useCallback(() => {
    const c = cardRef.current;
    if (c !== null && !c.leaving) c.end();
    else if (c !== null) return;
    else if (currentBeat(endTalkRef.current) !== null) setEndTalk(advance);
    else if (currentBeat(cardTalkRef.current) !== null) setCardTalk(advance);
    else turnRef.current?.skip();
  }, []);

  const chrome = useMemo(
    () =>
      def && {
        coins: trayHold ?? treasuresFound(save),
        trayFill,
        stickers: pageStickers(save, def.id),
        leftHand: save.settings.leftHand,
        onRetry: () => go({ t: 'retry' }),
        onMenu: () => go({ t: 'menu' }),
        // The hint ladder runs in the page (#100); the nudge comes after the 自動提示 setting's delay
        autoHintMs: autoHintMs(save.settings),
      },
    [def, save, go, trayHold, trayFill],
  );

  // 大字 (#104): the chapter card as large as the screen allows
  const boardK = boardScale(settings.textScale, Number(size.split('x')[0]));
  /** The chapter card's lines are up (#102) */
  const reading = board !== null && currentBeat(cardTalk) !== null;
  const resumeId = resumeTarget(save, reg);
  const resumeDef = reg.pageById(resumeId);
  const layer = nav.layer;
  // A full-screen layer (the 目錄, the album, the settings) covers the base: it is hidden (a page stays mounted, held)
  const covered = layer !== null && layer.kind !== 'menu';

  return (
    <ReducedMotionContext.Provider value={reduceSetting === true}>
      <SoundContext.Provider value={sink}>
        <TextScaleContext.Provider value={settings.textScale}>
          <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: C.quilt }} data-shell="" data-base={base.kind} data-layer-open={layer?.kind} data-text-size={textSize} data-elder={settings.elder ? '' : undefined}>
            {base.kind === 'cover' && !covered && (
              <Cover
                first={isFirstLaunch(save, reg)}
                resume={{ chapter: resumeDef?.chapter ?? 0, title: resumeDef?.title ?? '' }}
                onResume={() => go({ t: 'resume' })}
                onContents={() => go({ t: 'contents' })}
                onAlbum={() => go({ t: 'album' })}
                onSettings={() => go({ t: 'settings' })}
                still={still}
                reduced={reduced}
              />
            )}
            {def && base.kind === 'page' && (
              <>
                {/* The quilt under the book: seen when the camera pulls back in a chapter turn */}
                <Quilt />
                <div
                  ref={bookRef}
                  className="fixed inset-0"
                  data-book=""
                  data-size={size}
                  data-folded={stickerCard ? '' : undefined}
                  aria-hidden={reading || ending ? true : undefined}
                  // The chapter card's still: the camera pulled back to the book on the quilt
                  style={{ ...(covered ? { visibility: 'hidden' } : {}), ...(fixtureBoard !== null ? { transform: cameraTransform(true), transformOrigin: CAMERA_ORIGIN } : {}) }}
                >
                  <PagePlayer
                    key={`${def.id}-${base.run}`}
                    def={def}
                    speed={speed}
                    still={still}
                    reduced={reduced}
                    // A page that opens with its chapter card is held from its first frame (its intro waits for the card)
                    hold={holdsPage(nav) || turning || opening || fixtureBoard !== null || endLinesOf !== undefined}
                    onDone={(_, result) => onDone(def, result)}
                    onPhoto={(shot) => onPhoto(def, shot)}
                    onSticker={(sticker) => onSticker(def.id, sticker)}
                    chrome={chrome || undefined}
                    pageRef={pageBoxRef}
                    affordance={elderLook}
                    vibrate={settings.vibrate}
                    tilt={settings.tilt}
                    lowPower={settings.lowPower}
                    // The prologue's scripted tutorials (#106) play until the page is first solved
                    tutorials={save.pages[def.id]?.solved !== true}
                  />
                  <div ref={overlayRef} className="pointer-events-none absolute inset-0" data-turn-overlay="" />
                </div>
                {/* The chapter card hangs above the camera, never tilted; its lines under it */}
                {/* While its lines play, the card is a modal: the book under it is out of reach, a tap is the next beat */}
                <div
                  ref={boardLayerRef}
                  className={`pointer-events-none fixed inset-0 ${reading ? 'z-[45]' : 'z-30'}`}
                  data-board-layer=""
                  data-still={still ? '' : undefined}
                  role={reading ? 'dialog' : undefined}
                  aria-modal={reading ? true : undefined}
                  aria-label={reading && board !== null ? chapterName(board.chapter) : undefined}
                >
                  {board !== null && (
                    <ChapterBoard key={`${board.chapter}${board.soon ? '-soon' : ''}`} chapter={board.chapter} next={board.soon ? UI.chapterCard.soon : undefined} hidden={fixtureBoard === null} top={BOARD_TOP} scale={boardK} />
                  )}
                  <div className="absolute inset-x-0 flex justify-center" style={{ top: `calc(${BOARD_TOP + BOARD_H * boardK + 4}px + env(safe-area-inset-top))` }}>
                    <CardTalk beat={currentBeat(cardTalk)} serial={cardTalk.serial} width={Math.min(Number(size.split('x')[0]) - 24, 366)} reduced={reduced} />
                  </div>
                  {reading && <button type="button" className="pointer-events-auto absolute inset-0 cursor-default opacity-0" aria-label={UI.chapterCard.more} onClick={onSkip} data-card-next="" />}
                </div>
                {/* The chapter-end lines (#107): over the finished spread, a modal; a tap is the next beat */}
                {ending && def && (
                  <div className="fixed inset-0 z-[45] flex items-center justify-center" role="dialog" aria-modal={true} aria-label={chapterName(def.chapter)} data-end-layer="">
                    <div className="absolute inset-0" style={{ backgroundColor: C.nightInk, opacity: 0.34 }} data-end-scrim="" />
                    <div className="relative flex justify-center" style={{ width: '100%' }}>
                      <CardTalk beat={currentBeat(endTalk)} serial={endTalk.serial} width={Math.min(Number(size.split('x')[0]) - 24, 366)} reduced={reduced} />
                    </div>
                    <button type="button" className="absolute inset-0 cursor-default opacity-0" aria-label={UI.chapterCard.more} onClick={onSkip} data-end-next="" />
                  </div>
                )}
                {(card !== null || stickerCard) && (
                  <CardLayer title={reg.pageById(card?.id ?? def.id)?.title ?? def.title} stickers={pageStickers(save, card?.id ?? def.id)} leaving={card?.leaving ?? false} reduced={reduced} still={still} />
                )}
                {turning && !reading && <button type="button" className="fixed inset-0 z-40 cursor-default opacity-0" aria-label={card ? UI.card.next : UI.chapterCard.skip} onClick={onSkip} data-turn-skip="" />}
              </>
            )}
            <PauseMenu
              open={layer?.kind === 'menu'}
              onResume={() => go({ t: 'resume' })}
              onContents={() => go({ t: 'contents' })}
              onSettings={() => go({ t: 'settings' })}
              onCover={() => go({ t: 'cover' })}
            />
            {layer?.kind === 'contents' && (
              <div className="fixed inset-0 z-50">
                <Contents
                  save={save}
                  registry={reg}
                  chapter={layer.chapter}
                  locked={layer.locked}
                  resumeId={resumeId}
                  backLabel={base.kind === 'page' ? UI.menu.resume : UI.contents.back}
                  onBack={() => go({ t: 'close' })}
                  onStation={(chapter) => go({ t: 'station', chapter })}
                  onPlay={(id) => go({ t: 'play', id })}
                />
              </div>
            )}
            {after !== null && (
              <div className="fixed inset-0 z-50">
                <Album
                  chapter={after.chapter}
                  def={spreadPage(after.chapter, reg)}
                  photo={after.photo}
                  stickers={chapterStickers(save, after.chapter, reg)}
                  mode="after"
                  fresh={after.fresh}
                  mocha={after.mocha}
                  retaken={after.retaken}
                  reduced={reduced}
                  still={still}
                  onKeep={(photo) => store.keepPhoto(after.chapter, photo)}
                  onDone={after.go}
                />
              </div>
            )}
            {layer?.kind === 'album' && (
              <div className="fixed inset-0 z-50">
                <AlbumLayer save={save} reg={reg} reduced={reduced} still={still} onKeep={(chapter, photo) => store.keepPhoto(chapter, photo)} onBack={() => go({ t: 'close' })} />
              </div>
            )}
            {layer?.kind === 'settings' && (
              <div className="fixed inset-0 z-50">
                <Settings
                  settings={save.settings}
                  osReduced={osReduced}
                  still={still}
                  onChange={(patch) => {
                    store.updateSettings(patch);
                    // 音效: a click at the new volume
                    if (patch.sfx !== undefined) {
                      setVolumes(patch.sfx, store.get().settings.music);
                      sinkRef.current([{ cue: 'click' }]);
                    }
                  }}
                  onReset={() => {
                    store.reset();
                    go({ t: 'cover' });
                  }}
                  onBack={() => go({ t: 'close' })}
                />
              </div>
            )}
          </div>
        </TextScaleContext.Provider>
      </SoundContext.Provider>
    </ReducedMotionContext.Provider>
  );
}

/** The cover's 相簿 (#103): the latest chapter with a photo (or chapter 1's empty page), to look at or retake. */
function AlbumLayer({ save, reg, reduced, still, onKeep, onBack }: { save: SaveV1; reg: PageRegistry; reduced: boolean; still: boolean; onKeep: (chapter: number, photo: Photo) => void; onBack: () => void }) {
  const [chapter] = useState(() => albumHome(save.photos));
  return (
    <Album
      chapter={chapter}
      def={spreadPage(chapter, reg)}
      photo={save.photos[chapter] ?? null}
      stickers={chapterStickers(save, chapter, reg)}
      mode="browse"
      reduced={reduced}
      still={still}
      onKeep={(photo) => onKeep(chapter, photo)}
      onDone={onBack}
    />
  );
}

/**
 * The sticker card's layer (#101): over the book's middle (the folded page), above the turn's
 * chapter-card layer, below the full-screen tap layer. Its width keeps the 300 px card on narrow
 * phones (R5: its 20 px words never shrink below 360 px wide).
 */
function CardLayer({ title, stickers, leaving, reduced, still }: { title: string; stickers: readonly [boolean, boolean, boolean]; leaving: boolean; reduced: boolean; still: boolean }) {
  const size = useSyncExternalStore(subscribeResize, readSize, () => '390x844');
  const [vw, vh] = size.split('x').map(Number);
  const layout = bookLayout(vw, vh);
  const width = 300 * Math.min(1, vw / 360);
  // Centred on the standing page, a little above the gutter
  const cy = layout.y + 300 * layout.scale;
  return (
    <div className="pointer-events-none fixed inset-x-0 z-[35] flex justify-center" style={{ top: cy - (width * 248) / 300 / 2 }} data-still={still ? '' : undefined} data-card-layer="">
      <StickerCard title={title} stickers={stickers} leaving={leaving} reduced={reduced} width={width} />
    </div>
  );
}
