import { useRef, type PointerEvent as ReactPointerEvent } from 'react';

/**
 * The album's page flip by swipe (GDD § 2.9 「Swipe or tap arrows to flip pages」; #113). One finger,
 * horizontal, and optional: the arrows are always there. A second finger cancels the gesture (a
 * pinch is never a flip), and a mostly vertical move is the leaf scrolling, not a flip.
 */

/** How far the finger must travel across (CSS px) */
export const SWIPE_MIN_PX = 48;
/** …and how much more across than down */
export const SWIPE_RATIO = 1.5;
/** …within this long (a slow drag that ends far across still reads as a deliberate flip up to here) */
export const SWIPE_MAX_MS = 900;

/**
 * The flip a finger's travel asks for: +1 the next leaf (the finger moved left, the page is pulled
 * over like a book's), −1 the previous, 0 none.
 */
export function swipeDir(dx: number, dy: number, ms: number): 1 | -1 | 0 {
  if (ms > SWIPE_MAX_MS || Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < SWIPE_RATIO * Math.abs(dy)) return 0;
  return dx < 0 ? 1 : -1;
}

interface Track {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly t: number;
  /** A second finger came down: this gesture is not a swipe */
  cancelled: boolean;
}

/**
 * Pointer handlers for an element that flips on a one-finger swipe. The element should allow
 * vertical scrolling only (`touch-action: pan-y`), so a horizontal move reaches it as pointer events.
 */
export function useSwipe(onFlip: (dir: 1 | -1) => void, enabled = true) {
  const track = useRef<Track | null>(null);
  const flip = useRef(onFlip);
  flip.current = onFlip;
  const down = (e: ReactPointerEvent) => {
    if (!enabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (track.current !== null) {
      track.current.cancelled = true;
      return;
    }
    track.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, cancelled: false };
  };
  const up = (e: ReactPointerEvent) => {
    const t = track.current;
    if (t === null || t.id !== e.pointerId) return;
    track.current = null;
    if (t.cancelled) return;
    const dir = swipeDir(e.clientX - t.x, e.clientY - t.y, e.timeStamp - t.t);
    if (dir !== 0) flip.current(dir);
  };
  const cancel = (e: ReactPointerEvent) => {
    if (track.current?.id === e.pointerId) track.current = null;
  };
  return { onPointerDown: down, onPointerUp: up, onPointerCancel: cancel };
}
