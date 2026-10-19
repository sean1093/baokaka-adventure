import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { POPUP, withAlpha } from '../../art/palette';
import { useSvgIds } from '../../art/useSvgIds';
import { useReducedMotion } from '../../components/motion';
import { nodePos } from '../core/graph';
import { bottomBar, cover, hudLabel, kitCtx, kitDefs, type KitCtx } from '../art';
import type { Input, PageDef, SimState } from '../core/types';
import { PageSession, type SessionFrame, type TickSpeed } from '../game/session';
import { chapterSky } from './art/placeholders';
import { BAR_H, HUD_H, bookLayout, toScreen, type BookLayout } from './geometry';
import type { GestureEvent } from './gestures';
import './gestures.css';
import { PART_SETTLE_MS } from './interp';
import { PageView, VIEW_BOX } from './PageView';
import { useGestures } from './useGestures';

/**
 * One page, played (GDD § 2.1 page anatomy; bible § 2.1, § 7): the navy-linen cover, the HUD slot
 * on top, the book in the middle at ≈ 0.91 scale, the bottom-bar slot on the cover, and a
 * `PageSession` ticking the simulation while `PageView` draws it.
 *
 * The HUD and the bottom bar are the kit's static look in their slots; #97 makes them live.
 * Gestures (#90, `useGestures`): the whole screen takes pointers; a finger down anywhere pauses
 * the world, taps and drags on the page become queued inputs, and tapping Baokaka opens the word
 * ring stub (a dimmed page and an empty ring; #99 fills it).
 *
 * Animation runs on `requestAnimationFrame` only while something moves (an actor mid-step, a part
 * mid-tween) and sleeps between ticks.
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

/** Chinese numerals for chapter lines (第一章 …). */
const NUMERALS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

/** The HUD's chapter line, e.g. 「第一章 · 第 2 頁 / 6」 (the prologue is 序章, 4 pages). */
export function chapterLine(def: Pick<PageDef, 'chapter' | 'index'>): string {
  const chapter = def.chapter === 0 ? '序章' : `第${NUMERALS[def.chapter] ?? def.chapter}章`;
  return `${chapter} · 第 ${def.index} 頁 / ${def.chapter === 0 ? 4 : 6}`;
}

export interface PagePlayerProps {
  readonly def: PageDef;
  readonly speed?: TickSpeed;
  /** Start from this state (a dev `tick=` jump, a resumed page) */
  readonly from?: SimState;
  /** Hold the clock (dev `paused=1`, screenshots) */
  readonly paused?: boolean;
  /** Inputs to feed one per tick (dev `demo=1` plays the authored solution) */
  readonly script?: readonly Input[];
  /** Hears gesture events: taps, nope, snaps, the word ring, the 土地公 (#97, #99, #101 listen) */
  readonly onGesture?: (event: GestureEvent) => void;
}

export function PagePlayer({ def, speed = 'normal', from, paused = false, script, onGesture }: PagePlayerProps) {
  const layout = useBookLayout();
  const session = useMemo(() => new PageSession(def, { speed, from }), [def, speed, from]);
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

  const reduced = useReducedMotion();
  const gestures = useGestures(def, session, layout, frame, ms, reduced, onGesture);

  const ids = useSvgIds('book');
  const ctx: KitCtx = useMemo(() => ({ ...kitCtx('book'), id: ids }), [ids]);
  const sky = chapterSky(def.chapter);
  const chrome = useMemo(() => {
    const defs = kitDefs(ctx, ['linen', 'vign', 'foil', 'coin', 'softShadow', 'softMarigold']);
    return {
      cover: defs + cover(ctx, layout.vw, layout.vh),
      hud: hudLabel(ctx, { title: sky.place, page: def.title, sub: chapterLine(def), time: sky.time }),
      bar: bottomBar(ctx, { y: 60 }),
    };
  }, [ctx, layout.vw, layout.vh, sky, def]);

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
  const hudScale = Math.min(1, layout.vw / 390);
  // The word ring stub circles Baokaka (#99 builds the ring itself)
  const babyAt = nodePos(def, frame.state, frame.state.baby.node);
  const ringAt = gestures.ring && babyAt ? toScreen(layout, [babyAt[0], babyAt[1] - 30]) : null;

  return (
    <main
      className="fixed inset-0 select-none overflow-hidden"
      style={{ background: POPUP.cover, touchAction: 'none', WebkitTouchCallout: 'none' }}
      lang="zh-Hant"
      data-popup-page={def.id}
      {...gestures.handlers}
    >
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true" dangerouslySetInnerHTML={{ __html: chrome.cover }} />
      <div style={block} aria-hidden="true" />
      <div style={page}>
        <PageView def={def} prev={frame.prev} state={frame.state} ms={ms} tickMs={frame.tickMs} scale={scale} reduced={reduced} gesture={gestures.flags} />
      </div>
      <svg
        className="absolute left-1/2 top-0 font-body"
        style={{ transform: 'translateX(-50%)' }}
        width={390 * hudScale}
        height={HUD_H * hudScale}
        viewBox={`0 0 390 ${HUD_H}`}
        role="img"
        aria-label={`${sky.place}「${def.title}」${chapterLine(def)}`}
        data-slot="hud"
        dangerouslySetInnerHTML={{ __html: chrome.hud }}
      />
      <svg
        className="absolute bottom-0 left-1/2 font-body"
        style={{ transform: 'translateX(-50%)' }}
        width={390 * hudScale}
        height={BAR_H * hudScale}
        viewBox={`0 0 390 ${BAR_H}`}
        aria-hidden="true"
        data-slot="bottom-bar"
        dangerouslySetInnerHTML={{ __html: chrome.bar }}
      />
      {ringAt && (
        <div className="pointer-events-none absolute inset-0" style={{ background: withAlpha(POPUP.shadow, 0.3) }} data-overlay="word-ring" aria-hidden="true">
          <svg className="absolute inset-0 h-full w-full">
            <circle cx={ringAt[0]} cy={ringAt[1]} r={84 * Math.max(0.75, scale)} fill="none" stroke={POPUP.marigold} strokeWidth={3} strokeDasharray="10 8" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </main>
  );
}
