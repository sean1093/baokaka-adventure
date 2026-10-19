import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { POPUP as C } from '../../../art/palette';
import { ReducedMotionContext, usePrefersReducedMotion } from '../../../components/motion';
import { chapterInfo, chapterName, UI } from '../../content';
import type { PageDef } from '../../core/types';
import { backdropImage } from '../../env/loader';
import { COVER, holdsPage, isFirstLaunch, navigate, pageStickers, resumeTarget, treasuresFound, type NavAction, type NavState } from '../../game/nav';
import { ProgressStore, type PageResult } from '../../game/progress';
import type { TickSpeed } from '../../game/session';
import { registry as gameRegistry, type PageRegistry } from '../../pages';
import { autoHintMs } from '../affordance/ladder';
import { bookLayout } from '../geometry';
import { PagePlayer } from '../PagePlayer';
import { PAGE_VIEW_BOX } from '../geometry';
import { CARD_OUT_MS, StickerCard, cardMs } from '../hud/StickerCard';
import { playTurn, turnPlan, type TurnRun } from '../transitions/pageTurn';
import { Contents } from './Contents';
import { Cover } from './Cover';
import { PauseMenu } from './PauseMenu';
import { Quilt } from './paper';
import { StubScreen } from './StubScreen';
import './screens.css';

/**
 * 翻翻台北's screens and flow (GDD § 2.13; #97): one `ProgressStore` for the app (the save,
 * `popup.save.v1`), the navigation state machine (`game/nav.ts`) and the screens it shows — the
 * cover, a page in the book frame with its HUD and bottom bar, the pause menu, the 目錄 and the
 * album / settings stubs — plus the page fold and the chapter turn between pages.
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
 * - Any layer over a page (the menu, the 目錄, the settings) and a turn in progress hold the page's
 *   session (§ 2.6).
 * - Settings read from the save: tick speed (0/1/2 → slow/normal/fast), 左手模式, 減少動態 (null
 *   follows the OS), 自動提示 (the hint nudge's delay; 15 s in 長輩模式, #100). #104 builds the
 *   settings screen that changes them.
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
}

const SPEEDS: readonly TickSpeed[] = ['slow', 'normal', 'fast'];
/** After the goal is grabbed (「這個！」, the sparkle) the page holds this long before it folds (GDD § 2.8). */
export const GRAB_HOLD_MS = 900;

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

export function GameShell({ store: given, registry: reg = gameRegistry, initial = COVER, still = false, reduced: reducedProp, stickerCard = false }: GameShellProps) {
  const [store] = useState(() => given ?? new ProgressStore({ registry: reg }));
  useEffect(() => (given ? undefined : () => store.dispose()), [given, store]);
  const save = useSyncExternalStore(store.subscribe, store.get);
  const [nav, setNav] = useState<NavState>(initial);
  const go = useCallback((action: NavAction) => setNav((s) => navigate(s, action, store.get(), reg)), [store, reg]);

  const osReduced = usePrefersReducedMotion();
  const reduceSetting = save.settings.reduceMotion;
  const reduced = reducedProp ?? reduceSetting ?? osReduced;
  const speed = SPEEDS[save.settings.speed] ?? 'normal';

  const base = nav.base;
  const def: PageDef | undefined = base.kind === 'page' ? reg.pageById(base.id) : undefined;

  // Opening a page makes it the one to resume
  useEffect(() => {
    if (def && !still) store.openPage(def.id);
  }, [def, store, still]);

  // ——— The page fold and the chapter turn ———
  const bookRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
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
        cardTimers.current.push(window.setTimeout(end, cardMs(reduced)));
      }),
    [reduced],
  );
  useEffect(
    () => () => {
      window.clearTimeout(holdTimer.current);
      clearCardTimers();
      turnRef.current?.skip();
    },
    [],
  );

  const onDone = useCallback(
    (from: PageDef, result: PageResult) => {
      store.completePage(from.id, result);
      const next = reg.nextPage(from.id);
      setTurning(true);
      window.clearTimeout(holdTimer.current);
      holdTimer.current = window.setTimeout(() => {
        const book = bookRef.current, overlay = overlayRef.current, top = topRef.current;
        if (next === null || !book || !overlay || !top) {
          // The last page (or no book to turn): the card, then the 目錄
          void showCard(from.id).then(() => {
            setTurning(false);
            go({ t: 'next', id: next?.id ?? null });
          });
          return;
        }
        const [vw, vh] = readSize().split('x').map(Number);
        const layout = bookLayout(vw, vh);
        const kind = next.chapter !== from.chapter ? 'chapter' : 'fold';
        const info = chapterInfo(next.chapter);
        const run = playTurn(
          turnPlan(kind, reduced),
          { book, overlay, top, pageBox: () => pageBoxRef.current, scale: layout.scale, at: { x: layout.x + PAGE_VIEW_BOX.x * layout.scale, y: layout.y + PAGE_VIEW_BOX.y * layout.scale } },
          {
            fromBackdrop: backdropImage(from.backdrop)?.url ?? null,
            toBackdrop: backdropImage(next.backdrop)?.url ?? null,
            card: { chapter: chapterName(next.chapter), title: info.title, landmark: info.landmark, time: info.time },
          },
          () => go({ t: 'next', id: next.id }),
          { run: () => showCard(from.id) },
        );
        turnRef.current = run;
        void run.finished.then(() => {
          if (turnRef.current === run) turnRef.current = null;
          // Skipped mid-card: put the card away too
          clearCardTimers();
          setCard(null);
          setTurning(false);
        });
      }, GRAB_HOLD_MS);
    },
    [store, reg, go, reduced, showCard],
  );
  const onSticker = useCallback((id: string, sticker: 'mischief' | 'tudigong') => store.earnSticker(id, sticker), [store]);
  // A tap while the card is up turns the page on; any other tap in the turn skips it
  const onSkip = useCallback(() => {
    const c = cardRef.current;
    if (c !== null && !c.leaving) c.end();
    else if (c === null) turnRef.current?.skip();
  }, []);

  const chrome = useMemo(
    () =>
      def && {
        coins: treasuresFound(save),
        stickers: pageStickers(save, def.id),
        leftHand: save.settings.leftHand,
        onRetry: () => go({ t: 'retry' }),
        onMenu: () => go({ t: 'menu' }),
        // The hint ladder runs in the page (#100); the nudge comes after the 自動提示 setting's delay
        autoHintMs: autoHintMs(save.settings),
      },
    [def, save, go],
  );

  const resumeId = resumeTarget(save, reg);
  const resumeDef = reg.pageById(resumeId);
  const layer = nav.layer;
  // A full-screen layer (the 目錄, the album, the settings) covers the base: it is hidden (a page stays mounted, held)
  const covered = layer !== null && layer.kind !== 'menu';

  return (
    <ReducedMotionContext.Provider value={reduceSetting === true}>
      <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: C.quilt }} data-shell="" data-base={base.kind} data-layer-open={layer?.kind}>
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
            <div ref={bookRef} className="fixed inset-0" data-book="" data-size={size} data-folded={stickerCard ? '' : undefined} style={covered ? { visibility: 'hidden' } : undefined}>
              <PagePlayer
                key={`${def.id}-${base.run}`}
                def={def}
                speed={speed}
                still={still}
                reduced={reduced}
                hold={holdsPage(nav) || turning}
                onDone={(_, result) => onDone(def, result)}
                onSticker={(sticker) => onSticker(def.id, sticker)}
                chrome={chrome || undefined}
                pageRef={pageBoxRef}
              />
              <div ref={overlayRef} className="pointer-events-none absolute inset-0" data-turn-overlay="" />
            </div>
            <div ref={topRef} className="pointer-events-none fixed inset-0 z-30" aria-hidden="true" />
            {(card !== null || stickerCard) && (
              <CardLayer title={reg.pageById(card?.id ?? def.id)?.title ?? def.title} stickers={pageStickers(save, card?.id ?? def.id)} leaving={card?.leaving ?? false} reduced={reduced} still={still} />
            )}
            {turning && <button type="button" className="fixed inset-0 z-40 cursor-default opacity-0" aria-label={card ? UI.card.next : '跳過'} onClick={onSkip} data-turn-skip="" />}
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
        {(layer?.kind === 'album' || layer?.kind === 'settings') && (
          <div className="fixed inset-0 z-50">
            <StubScreen kind={layer.kind} onBack={() => go({ t: 'close' })} />
          </div>
        )}
      </div>
    </ReducedMotionContext.Provider>
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
