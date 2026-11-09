import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from 'react';
import { usePrefersReducedMotion } from '../components/motion';
import { partLocked } from '../popup/core/step';
import { partState } from '../popup/core/cond';
import { compilePart } from '../popup/core/presets';
import { initialState, replay, step } from '../popup/core';
import type { SimEvent } from '../popup/core/events';
import type { Id, PageDef, SimState, SolutionStep } from '../popup/core/types';
import { loadLines, type TalkLine } from '../popup/content/script';
import { PageSession, TICK_MS, type SessionFrame, type TickSpeed } from '../popup/game/session';
import { loadSave } from '../popup/game/progress';
import { mischiefFired } from '../popup/game/stickers';
import { PagePlayer } from '../popup/view/PagePlayer';
import { bookLayout, type BookLayout, type Pt } from '../popup/view/geometry';
import { GestureTracker, NO_GESTURE, settlePreview, targetsOf, type GestureEffect, type GestureFlags, type GestureWorld, type PartPreview } from '../popup/view/gestures';
import { partProgress } from '../popup/view/interp';
import { parseViewport, readViewport, subscribeViewport } from '../popup/view/safeArea';
import { askTiltPermission } from '../popup/view/useTilt';
import { barkLog, barksOf, bubbleShow, type BarkShow } from '../popup/view/talk';
import { DEFAULT_EYE, eyeFor } from './camera';
import { FpsMeter } from './FpsMeter';
import { PAGES_3D } from './pages3d';
import { Stage3D, type ShadowMode } from './stage';
import './popup3d.css';

/**
 * The 3D page route (#225, the three.js spike; `popup3d.html#/popup3d?page=c1p2`): one page played on the real
 * simulation (`PageSession` → `step`) and the real gesture grammar (`GestureTracker`), drawn by
 * `Stage3D` in WebGL. Everything that is text stays DOM (option B): the title label, the thought
 * bubble, the barks and the subtitles, placed each frame by projecting their 3D anchors.
 *
 * - **Opening:** the book opens and the cards rise from the fold (2.4 s), then the clock starts.
 *   Reduced motion (the OS, or the game's 減少動態 from the save, or `&reduced=1`): no opening, no
 *   tilt, no hop arcs; the page fades in.
 * - **Tilt:** the pointer leans the eye on a mouse; on a phone the 傾斜 button asks for the gyro.
 *   The eye drifts a little on its own while nothing is touched, so the paper reads as paper.
 * - **Context loss:** the page waits for the context to come back and rebuilds; after 3 s without
 *   it, or with no WebGL at all, the 2D page takes over from the same state (`PagePlayer`).
 * - **Measuring:** `&fps=1` shows the frame meter (fps, frame time, draw calls, triangles,
 *   texture memory); `&shadows=map|blob|off`, `&dpr=N`. `window.__popup3d` exposes the stats,
 *   the touchables' on-screen sizes and the session for the spike's scripts.
 */

const OPEN_MS = 3200;
const LOST_FALLBACK_MS = 3000;

export interface Popup3DProps {
  readonly def: PageDef;
  readonly params: URLSearchParams;
}

interface Overlay {
  readonly frame: SessionFrame;
  readonly barks: readonly BarkShow[];
  readonly line: TalkLine | null;
  readonly tag: string | null;
}

/** WebGL at all? (A canvas that is never attached; the browser frees it.) */
function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return (c.getContext('webgl2') ?? c.getContext('webgl')) !== null;
  } catch {
    return false;
  }
}

export function Popup3D({ def, params }: Popup3DProps) {
  const cfg = PAGES_3D[def.id];
  const osReduced = usePrefersReducedMotion();
  const reduced = useMemo(() => params.get('reduced') === '1' || (loadSave().settings.reduceMotion ?? osReduced), [params, osReduced]);
  const shadows = (['map', 'blob', 'off'].includes(params.get('shadows') ?? '') ? params.get('shadows') : 'map') as ShadowMode;
  const maxDpr = Math.max(1, Math.min(3, Number(params.get('dpr')) || 2));
  const showFps = params.get('fps') === '1';
  const speedParam = params.get('speed');
  const speed: TickSpeed = speedParam !== null && speedParam in TICK_MS ? (speedParam as TickSpeed) : 'normal';

  const [fallback, setFallback] = useState<{ from?: SimState } | null>(() => (cfg === undefined || !hasWebGL() ? {} : null));
  const [lost, setLost] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [ready, setReady] = useState(false);
  const [tilt, setTilt] = useState(false);
  const viewport = useSyncExternalStore(subscribeViewport, readViewport, () => '390x844|0|0');
  const layout: BookLayout = useMemo(() => {
    const { w, h, inset } = parseViewport(viewport);
    return bookLayout(w, h, inset);
  }, [viewport]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<Stage3D | null>(null);
  const session = useMemo(() => new PageSession(def, { speed }), [def, speed]);
  const tracker = useMemo(() => new GestureTracker(), []);
  const flagsRef = useRef<GestureFlags>(NO_GESTURE);
  const heldRef = useRef<{ part: Id; index: number; applyAt: number } | null>(null);
  const planeRef = useRef<'floor' | number | 'window'>('window');
  // `&tilt=x,y` (−1…1) holds the eye there (screenshots); `&still=1` stops the idle breath
  const fixed = (params.get('tilt') ?? '').split(',').map(Number);
  const still = params.get('still') === '1';
  // `&open=0.4` holds the opening there (screenshots of the pop-up rising)
  const holdOpen = params.get('open') === null ? null : Math.max(0, Math.min(1, Number(params.get('open')) || 0));
  const tiltRef = useRef({ x: fixed[0] || 0, y: fixed[1] || 0, gx: fixed[0] || 0, gy: fixed[1] || 0 });
  const openStart = useRef<number | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(() => ({ frame: session.frame(), barks: [], line: null, tag: null }));
  const bubbleRef = useRef<HTMLDivElement>(null);
  const barkRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => session.dispose(), [session]);

  // The tick → the overlays' content (barks, the 淘氣 tag, the done card)
  useEffect(() => session.subscribe((frame) => {
    setOverlay((o) => {
      if (frame.serial === o.frame.serial) return o;
      const fresh = barksOf(frame.prev, frame.state, frame.events);
      const tag = mischiefFired(def, frame.prev, frame.state, frame.events) ? '嘿嘿，淘氣！' : o.tag;
      return { ...o, frame, barks: barkLog(o.barks, fresh, frame.state.tick), tag };
    });
  }), [session, def]);

  // ——— The stage: built once per generation (a context restore rebuilds it) ———
  useEffect(() => {
    if (fallback !== null || cfg === undefined) return undefined;
    const canvas = canvasRef.current!;
    const stage = new Stage3D(canvas, def, cfg, { shadows, maxDpr });
    let alive = true;
    let raf = 0;
    stage.resize(layout);
    stage.setView(reduced ? DEFAULT_EYE : eyeFor(0, 0, 0), reduced ? 1 : 0);
    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      session.pause('context');
      setLost(true);
    };
    const onRestored = () => {
      setLost(false);
      setGeneration((g) => g + 1);
    };
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    stage.build().then(() => {
      if (!alive) return;
      stageRef.current = stage;
      setReady(true);
      openStart.current = generation > 0 || reduced ? -OPEN_MS : performance.now();
      if (generation > 0) session.resume('context');
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        tickRef.current(stage, now);
      };
      raf = requestAnimationFrame(loop);
    }, () => alive && setFallback({ from: session.frame().state }));
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      if (stageRef.current === stage) stageRef.current = null;
      stage.dispose();
    };
    // The stage reads the layout through `resize` below; rebuilding on a resize would reload every card
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def, cfg, fallback, generation, shadows, maxDpr]);

  useEffect(() => stageRef.current?.resize(layout), [layout, ready]);

  // No context back in time: the 2D page takes over where the 3D one stood
  useEffect(() => {
    if (!lost) return undefined;
    const t = setTimeout(() => setFallback({ from: session.frame().state }), LOST_FALLBACK_MS);
    return () => clearTimeout(t);
  }, [lost, session]);

  /** One animation frame: the opening, the eye, the stage, the overlays' positions. */
  const frameTick = (stage: Stage3D, now: number) => {
    const start = openStart.current ?? now;
    const open = holdOpen ?? Math.min(1, (now - start) / OPEN_MS);
    if (open >= 1 && !startedRef.current) {
      startedRef.current = true;
      session.start();
    }
    // The eye: a pointer / gyro lean eased in, and a slow breath while nothing is touched
    const tl = tiltRef.current;
    tl.x += (tl.gx - tl.x) * 0.08;
    tl.y += (tl.gy - tl.y) * 0.08;
    const idle = reduced || still || flagsRef.current.finger !== null ? 0 : 1;
    const bx = reduced ? 0 : tl.x + idle * 0.16 * Math.sin(now / 2900);
    const by = reduced ? 0 : tl.y + idle * 0.1 * Math.sin(now / 3700 + 1);
    stage.setView(reduced ? DEFAULT_EYE : eyeFor(bx, by, smoothOpen(Math.min(1, open / 0.8))), open);
    const pinned = pinRef.current;
    const f = pinned ?? session.frame();
    const ms = pinned?.ms ?? session.elapsed();
    const held = heldRef.current;
    let preview: PartPreview | null = flagsRef.current.preview;
    if (flagsRef.current.dragging === null && held !== null) {
      const part = def.parts.find((p) => p.id === held.part)!;
      const list = compilePart(part).states;
      preview = settlePreview(held, f.serial, { index: Math.max(0, list.indexOf(partState(f.state, held.part) ?? '')), count: list.length, wraps: false }, partProgress(ms, reduced));
      if (preview === null) heldRef.current = null;
    }
    const t0 = performance.now();
    stage.update({ prev: f.prev, state: f.state, events: f.events, ms, tickMs: f.tickMs, reduced, preview, dragging: flagsRef.current.dragging, finger: flagsRef.current.finger, now });
    const t1 = performance.now();
    stage.render();
    stage.noteCpu(t1 - t0, performance.now() - t1);
    placeOverlays(stage, open);
    meterRef.current?.(now, stage);
  };
  /** A frame pinned by the spike's scripts (`__popup3d.show`): the same states as the 2D fixtures */
  const pinRef = useRef<(Pick<SessionFrame, 'prev' | 'state' | 'events' | 'tickMs' | 'serial'> & { ms: number }) | null>(null);
  const tickRef = useRef(frameTick);
  tickRef.current = frameTick;
  const startedRef = useRef(false);
  const meterRef = useRef<((now: number, stage: Stage3D) => void) | null>(null);
  const bindMeter = useCallback((fn: (now: number, stage: Stage3D) => void) => {
    meterRef.current = fn;
  }, []);

  const placeOverlays = (stage: Stage3D, open: number) => {
    const a = stage.anchors();
    const put = (el: HTMLElement | null, p: Pt | null) => {
      if (el === null) return;
      if (p === null || open < 1) {
        el.style.visibility = 'hidden';
        return;
      }
      el.style.visibility = 'visible';
      el.style.transform = `translate(${p[0].toFixed(1)}px, ${p[1].toFixed(1)}px)`;
    };
    put(bubbleRef.current, a.baby);
    for (const [who, el] of Object.entries(barkRefs.current)) put(el, who === 'mocha' ? a.mocha : a.baby);
    put(lineRef.current, a.tudigong);
  };

  // ——— Gestures: raycast to a target's plane, then the 2D grammar in that plane's page units ———
  const world = useCallback((targets: GestureWorld['targets']): GestureWorld => {
    const f = session.frame();
    const states = (id: Id) => {
      const part = def.parts.find((p) => p.id === id);
      return part === undefined ? [] : compilePart(part).states;
    };
    return {
      targets,
      scale: layout.scale,
      hold: false,
      states,
      stateIndex: (id) => {
        const h = heldRef.current;
        if (h !== null && h.part === id && f.serial < h.applyAt) return h.index;
        return Math.max(0, states(id).indexOf(partState(f.state, id) ?? ''));
      },
      locked: (id) => partLocked(def, f.state, id),
    };
  }, [def, session, layout]);

  const windowPage = (e: ReactPointerEvent): Pt => [(e.clientX - layout.x) / layout.scale, (e.clientY - layout.y) / layout.scale];

  const apply = (fx: GestureEffect[]) => {
    for (const e of fx) {
      if (e.type === 'pause') session.pause('finger');
      else if (e.type === 'resume') session.resume('finger');
      else if (e.type === 'input') session.input(e.input);
      else {
        const ev = e.event;
        if (ev.type === 'snap') heldRef.current = { part: ev.part, index: ev.index, applyAt: session.frame().serial + session.queued };
        if (ev.type === 'dragStart') heldRef.current = null;
        if (ev.type === 'tudigong') setOverlay((o) => ({ ...o, line: loadLines(['rec.uncle.tap'])[0] ?? null, tag: '找到土地公！' }));
      }
    }
    flagsRef.current = tracker.flags;
  };

  const isLive = () => ready && !lost && openStart.current !== null && performance.now() - openStart.current >= OPEN_MS;
  const handlers = {
    onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
      const stage = stageRef.current;
      if (stage === null || !isLive() || (e.pointerType === 'mouse' && e.button !== 0)) return;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // A synthetic pointer can't be captured; the gesture still works
      }
      const hit = stage.pick(e.clientX, e.clientY);
      planeRef.current = hit?.plane ?? 'window';
      const f = session.frame();
      apply(tracker.down(e.pointerId, hit?.page ?? windowPage(e), performance.now(), world(hit ? [hit.target] : targetsOf(def, f.state))));
    },
    onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
      const stage = stageRef.current;
      // A mouse leans the eye toward the pointer (never while a button is down)
      if (e.pointerType === 'mouse' && e.buttons === 0 && !reduced && !still) {
        tiltRef.current.gx = Math.max(-1, Math.min(1, (e.clientX / layout.vw) * 2 - 1));
        tiltRef.current.gy = Math.max(-1, Math.min(1, (e.clientY / layout.vh) * 2 - 1));
      }
      if (stage === null) return;
      const plane = planeRef.current;
      const p = plane === 'window' ? windowPage(e) : stage.pageOn(e.clientX, e.clientY, plane);
      if (p !== null) apply(tracker.move(e.pointerId, p));
    },
    onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
      const stage = stageRef.current;
      const plane = planeRef.current;
      const p = stage === null || plane === 'window' ? windowPage(e) : stage.pageOn(e.clientX, e.clientY, plane) ?? windowPage(e);
      apply(tracker.up(e.pointerId, p, performance.now()));
    },
    onPointerCancel(e: ReactPointerEvent<HTMLDivElement>) {
      apply(tracker.cancel(e.pointerId));
    },
  };

  // The gyro (after the 傾斜 tap: iOS asks first)
  useEffect(() => {
    if (!tilt || reduced) return undefined;
    let base: { b: number; g: number } | null = null;
    const on = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      base ??= { b: e.beta, g: e.gamma };
      tiltRef.current.gx = Math.max(-1, Math.min(1, (e.gamma - base.g) / 20));
      tiltRef.current.gy = Math.max(-1, Math.min(1, (e.beta - base.b) / 20));
    };
    window.addEventListener('deviceorientation', on);
    return () => window.removeEventListener('deviceorientation', on);
  }, [tilt, reduced]);

  const restart = () => {
    session.reset();
    heldRef.current = null;
    setOverlay({ frame: session.frame(), barks: [], line: null, tag: null });
  };

  // The spike's scripts read these
  useEffect(() => {
    (window as unknown as { __popup3d?: unknown }).__popup3d = {
      stats: () => stageRef.current?.stats() ?? null,
      touchables: () => stageRef.current?.touchables() ?? [],
      ready: () => stageRef.current !== null && openStart.current !== null && performance.now() - openStart.current >= OPEN_MS,
      session,
      layout: () => layout,
      stage: () => stageRef.current,
      loseContext: () => stageRef.current?.renderer.getContext().getExtension('WEBGL_lose_context'),
      /** Pins the frame after `steps` (a PageLab fixture's), `ms` into its last tick; the clock holds */
      show: (steps: SolutionStep[], ms = 0) => {
        session.pause('pinned');
        const r = replay(def, steps);
        let state = initialState(def);
        let prev = state;
        let events: readonly SimEvent[] = [];
        for (const t of r.ticks) {
          const next = step(def, state, t.input);
          prev = state;
          state = next.state;
          events = next.events;
        }
        const frame = { prev, state, events, tickMs: TICK_MS[speed], serial: 1000 + r.ticks.length, ms };
        pinRef.current = frame;
        setOverlay({ frame: { ...frame, def }, barks: barksOf(prev, state, events), line: null, tag: null });
      },
    };
  }, [session, layout, def, speed]);

  if (fallback !== null) {
    return (
      <div data-popup3d="fallback">
        <PagePlayer def={def} from={fallback.from} speed={speed} />
        {cfg === undefined && <div className="p3d-note">這一頁還沒有立體的：先看平面的。</div>}
      </div>
    );
  }

  const { frame } = overlay;
  const show = bubbleShow(def, frame.state);
  const bead = def.attractors.find((x) => x.goal);
  return (
    <div className="p3d-root" data-popup3d={ready ? 'ready' : 'loading'} data-popup-page={def.id} data-tick={frame.state.tick} data-done={frame.state.done ? '' : undefined} data-reduced={reduced ? '' : undefined}>
      <div className="p3d-stage" style={{ opacity: ready ? 1 : 0 }} {...handlers}>
        <canvas ref={canvasRef} className="p3d-canvas" aria-label={`${def.title}（立體紙頁）`} role="img" />
      </div>
      <header className="p3d-label" style={{ top: layout.hudTop + 10 }}>
        <div className="p3d-title">
          <span className="p3d-landmark">台北車站</span>
          <span className="p3d-name">「{def.title}」</span>
        </div>
        <div className="p3d-sub">第一章 · 第 {def.index} 頁 · 立體試作</div>
      </header>
      {/* What is said: DOM, placed on projected 3D anchors each frame */}
      <div className="p3d-talk" aria-live="polite">
        {show !== null && (
          <div ref={bubbleRef} className="p3d-anchor" style={{ visibility: 'hidden' }}>
            <div className="p3d-thought" data-thought={show.kind}>
              {show.kind === 'want' ? (
                <>
                  <span className="p3d-bead" aria-label={bead?.id ?? '珠珠'} />
                  {show.reach && <b>要！</b>}
                </>
              ) : show.kind === 'text' ? (
                <b>{show.text}</b>
              ) : show.kind === 'heart' ? (
                <svg className="p3d-heart" viewBox="0 0 24 24" width="24" height="24" aria-label="開心">
                  <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" fill="#e0566e" />
                </svg>
              ) : (
                <b>…</b>
              )}
            </div>
          </div>
        )}
        {overlay.barks.map((b) => (
          <div key={`${b.who}:${b.tick}`} ref={(el) => (barkRefs.current[b.who] = el)} className="p3d-anchor" style={{ visibility: 'hidden' }}>
            <div className={`p3d-bark p3d-bark-${b.who}`}>{b.text}</div>
          </div>
        ))}
        {overlay.line !== null && (
          <div ref={lineRef} className="p3d-anchor" style={{ visibility: 'hidden' }}>
            <button type="button" className="p3d-line" onClick={() => setOverlay((o) => ({ ...o, line: null }))}>
              <span className="p3d-who">土地公</span>
              {overlay.line.text}
            </button>
          </div>
        )}
      </div>
      {overlay.tag !== null && <div className="p3d-tag" style={{ bottom: layout.vh - layout.barTop + 8 }}>{overlay.tag}</div>}
      {frame.state.done && (
        <div className="p3d-done" style={{ top: layout.y + 520 * layout.scale }}>
          <div className="p3d-done-card">
            <b>拿到了！</b>
            <span>{frame.state.tick} 步 · 立體試作</span>
            <button type="button" onClick={restart}>再玩一次</button>
          </div>
        </div>
      )}
      <nav className="p3d-bar" style={{ top: layout.barTop + 14 }}>
        <button type="button" className="p3d-disc" onClick={restart} aria-label="重來">
          <svg viewBox="0 0 24 24" aria-hidden="true" data-icon="">
            <path d="M5 12a7 7 0 1 0 2-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M4 4v5h5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>重來</span>
        </button>
        {!reduced && (
          <button type="button" className="p3d-disc" aria-pressed={tilt} aria-label="傾斜" onClick={async () => setTilt(!tilt && (await askTiltPermission()))}>
            <svg viewBox="0 0 24 24" aria-hidden="true" data-icon="">
              <rect x="7" y="3" width="10" height="18" rx="2" transform="rotate(-14 12 12)" fill="none" stroke="currentColor" strokeWidth="2.2" />
            </svg>
            <span>傾斜</span>
          </button>
        )}
        <a className="p3d-disc" href={`${import.meta.env.BASE_URL}#/popup?page=${def.id}`} aria-label="平面">
          <svg viewBox="0 0 24 24" aria-hidden="true" data-icon="">
            <rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2.2" />
          </svg>
          <span>平面</span>
        </a>
      </nav>
      {lost && <div className="p3d-lost">紙頁重新摺好中…</div>}
      {showFps && <FpsMeter bind={bindMeter} />}
    </div>
  );
}

const smoothOpen = (t: number) => 1 - Math.pow(1 - t, 3);
