import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { partState } from '../core/cond';
import { compilePart } from '../core/presets';
import { partLocked } from '../core/step';
import type { Id, PageDef, SimState } from '../core/types';
import type { PageSession } from '../game/session';
import type { BookLayout, Pt } from './geometry';
import {
  GestureTracker,
  HOLD_MS,
  NO_GESTURE,
  settlePreview,
  targetsOf,
  wrapIndex,
  type GestureEffect,
  type GestureEvent,
  type GestureFlags,
  type GestureWorld,
  type PartPreview,
} from './gestures';
import { partProgress } from './interp';

/**
 * The React plumbing for `gestures.ts` (GDD § 2.6): Pointer Events only (mouse, touch and pen take
 * the same path; no touch-specific code), client px → page units through the current book layout,
 * pointer capture so a drag keeps its part off the hit area, the 600 ms hold timer, and the
 * effects applied to the session — `pause('finger')` / `resume('finger')`, queued inputs, and the
 * word ring stub (`pause('ring')`, #99 builds the ring).
 *
 * A released drag's snapped stop is held (`settlePreview`) until the tick that applies its input,
 * then glides to where the state really landed, so the part never jumps back under the finger.
 */

interface Held {
  readonly part: Id;
  readonly index: number;
  /** The frame serial of the tick that applies the drag's input (inputs apply one per tick) */
  readonly applyAt: number;
}

export interface Gestures {
  /** What the view draws of the gesture, with the held preview folded in */
  readonly flags: GestureFlags;
  /** Spread on the full-screen element that receives pointers */
  readonly handlers: {
    onPointerDown(e: ReactPointerEvent<Element>): void;
    onPointerMove(e: ReactPointerEvent<Element>): void;
    onPointerUp(e: ReactPointerEvent<Element>): void;
    onPointerCancel(e: ReactPointerEvent<Element>): void;
  };
  /** The word ring stub is open (Baokaka was tapped) */
  readonly ring: boolean;
  /** Opens the word ring as a tap on Baokaka does (the bottom bar's portrait, #97) */
  readonly openRing: () => void;
}

const now = () => performance.now();

export function useGestures(
  def: PageDef,
  session: PageSession,
  layout: BookLayout,
  frame: { readonly serial: number; readonly state: SimState },
  ms: number,
  reduced: boolean,
  onGesture?: (event: GestureEvent) => void,
): Gestures {
  const tracker = useMemo(() => new GestureTracker(), [session]);
  const [flags, setFlags] = useState<GestureFlags>(NO_GESTURE);
  const [held, setHeld] = useState<Held | null>(null);
  const [ring, setRing] = useState(false);
  // Pointer handlers read the latest of these without re-binding
  const live = useRef({ layout, held, ring, onGesture });
  live.current = { layout, held, ring, onGesture };
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setFlags(NO_GESTURE);
    setHeld(null);
    setRing(false);
    return () => {
      if (holdTimer.current !== null) clearTimeout(holdTimer.current);
    };
  }, [tracker]);

  const states = useCallback((id: Id) => {
    const part = def.parts.find((p) => p.id === id);
    return part === undefined ? [] : compilePart(part).states;
  }, [def]);

  const world = useCallback((): GestureWorld => {
    const f = session.frame();
    const { ring: ringOpen, held: h, layout: l } = live.current;
    return {
      targets: ringOpen ? [] : targetsOf(def, f.state),
      scale: l.scale,
      hold: !ringOpen,
      states,
      stateIndex: (id) => {
        const list = states(id);
        if (h !== null && h.part === id && f.serial < h.applyAt) return wrapIndex(h.index, list.length);
        return Math.max(0, list.indexOf(partState(f.state, id) ?? ''));
      },
      locked: (id) => partLocked(def, f.state, id),
    };
  }, [def, session, states]);

  const apply = useCallback((fx: GestureEffect[]) => {
    for (const e of fx) {
      if (e.type === 'pause') session.pause('finger');
      else if (e.type === 'resume') session.resume('finger');
      else if (e.type === 'input') session.input(e.input);
      else {
        const ev = e.event;
        // The input was queued just before this event: it applies on the tick that drains the queue to it
        if (ev.type === 'snap') setHeld({ part: ev.part, index: ev.index, applyAt: session.frame().serial + session.queued });
        if (ev.type === 'dragStart') setHeld(null);
        if (ev.type === 'wordRing') {
          setRing(true);
          session.pause('ring');
        }
        live.current.onGesture?.(ev);
      }
    }
    setFlags(tracker.flags);
  }, [session, tracker]);

  const toPage = (e: ReactPointerEvent<Element>): Pt => {
    const l = live.current.layout;
    return [(e.clientX - l.x) / l.scale, (e.clientY - l.y) / l.scale];
  };

  const handlers = useMemo(
    () => ({
      onPointerDown(e: ReactPointerEvent<Element>) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // A synthetic or already-released pointer can't be captured; the gesture still works
        }
        const ringOpen = live.current.ring;
        apply(tracker.down(e.pointerId, toPage(e), now(), world()));
        if (ringOpen) {
          // Any touch closes the stub ring with no effect (GDD § 2.4: tapping outside closes it)
          setRing(false);
          session.resume('ring');
        }
        if (tracker.holdPending) {
          if (holdTimer.current !== null) clearTimeout(holdTimer.current);
          holdTimer.current = setTimeout(() => {
            holdTimer.current = null;
            apply(tracker.hold(now()));
          }, HOLD_MS);
        }
      },
      onPointerMove(e: ReactPointerEvent<Element>) {
        apply(tracker.move(e.pointerId, toPage(e)));
      },
      onPointerUp(e: ReactPointerEvent<Element>) {
        apply(tracker.up(e.pointerId, toPage(e), now()));
        if (tracker.points === 0 && holdTimer.current !== null) {
          clearTimeout(holdTimer.current);
          holdTimer.current = null;
        }
      },
      onPointerCancel(e: ReactPointerEvent<Element>) {
        apply(tracker.cancel(e.pointerId));
      },
    }),
    [apply, tracker, world, session],
  );

  // The held stop after a release: until its tick, then a glide to where the state landed
  let preview: PartPreview | null = flags.preview;
  if (flags.dragging === null && held !== null) {
    const part = def.parts.find((p) => p.id === held.part);
    const list = states(held.part);
    const actual = {
      index: Math.max(0, list.indexOf(partState(frame.state, held.part) ?? '')),
      count: list.length,
      wraps: part !== undefined && compilePart(part).input === 'drag-rotary',
    };
    preview = settlePreview(held, frame.serial, actual, partProgress(ms, reduced));
  }
  const settled = flags.dragging === null && held !== null && preview === null;
  useEffect(() => {
    if (settled) setHeld(null);
  }, [settled]);

  const openRing = useCallback(() => apply([{ type: 'event', event: { type: 'wordRing' } }]), [apply]);

  return { flags: preview === flags.preview ? flags : { ...flags, preview }, handlers, ring, openRing };
}
