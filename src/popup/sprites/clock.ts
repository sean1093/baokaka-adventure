import type { SpriteAnimDef } from './manifest';

/**
 * Frame timing for sprite animations (#94): pure maths over elapsed time, plus one shared
 * `requestAnimationFrame` clock that every playing `SpriteAnim` subscribes to (one rAF for the
 * whole page, running only while something plays).
 */

/** Frame steps elapsed (the count of frame durations, from 0). */
export const stepAt = (anim: Pick<SpriteAnimDef, 'fps'>, elapsedMs: number): number => Math.max(0, Math.floor((elapsedMs * anim.fps) / 1000 + 1e-9));

/** Index into `anim.frames` shown at step `n`. */
export function frameOfStep(anim: Pick<SpriteAnimDef, 'frames' | 'mode'>, n: number): number {
  const len = anim.frames.length;
  if (len <= 1) return 0;
  switch (anim.mode) {
    case 'loop':
      return n % len;
    case 'pingpong': {
      const period = 2 * len - 2;
      const k = n % period;
      return k < len ? k : period - k;
    }
    case 'once':
      return Math.min(n, len - 1);
  }
}

export interface AnimFrame {
  /** Index into `anim.frames` */
  readonly index: number;
  /** The sprite frame (index into the sprite's `files`) */
  readonly frame: number;
  /** A `once` animation has shown its last frame for a full frame's time */
  readonly done: boolean;
}

/**
 * What an animation shows `elapsedMs` after it started. `reduced` (reduced motion, stills) holds
 * the key frame and is done at once.
 */
export function frameAt(anim: SpriteAnimDef, elapsedMs: number, reduced = false): AnimFrame {
  if (reduced) return { index: anim.hold, frame: anim.frames[anim.hold], done: true };
  const n = stepAt(anim, elapsedMs);
  const index = frameOfStep(anim, n);
  return { index, frame: anim.frames[index], done: anim.mode === 'once' && n >= anim.frames.length };
}

/**
 * Events crossed going from step `from` (exclusive) to step `to` (inclusive), in order. Step 0's
 * events fire on the first call (`from` = −1). A `once` animation's events fire once.
 */
export function eventsBetween(anim: SpriteAnimDef, from: number, to: number): string[] {
  if (anim.events.length === 0 || to <= from) return [];
  const out: string[] = [];
  const last = anim.mode === 'once' ? Math.min(to, anim.frames.length - 1) : to;
  // A long stall (a background tab) must not replay hundreds of footsteps: at most one cycle
  const start = Math.max(from + 1, last - anim.frames.length + 1);
  for (let n = start; n <= last; n++) {
    const index = frameOfStep(anim, n);
    for (const e of anim.events) if (e.frame === index) out.push(e.name);
  }
  return out;
}

// ——— The shared clock ———

type Tick = (now: number) => void;

export interface SpriteClock {
  now(): number;
  subscribe(tick: Tick): () => void;
}

/** A clock over `requestAnimationFrame`: one frame callback for every subscriber, none when idle. */
export function rafClock(raf = (cb: FrameRequestCallback) => requestAnimationFrame(cb), cancel = (id: number) => cancelAnimationFrame(id), now = () => performance.now()): SpriteClock {
  const subs = new Set<Tick>();
  let id = 0;
  const loop = (t: number) => {
    id = 0;
    for (const s of [...subs]) s(t);
    if (subs.size > 0) id = raf(loop);
  };
  return {
    now,
    subscribe(tick) {
      subs.add(tick);
      if (id === 0) id = raf(loop);
      return () => {
        subs.delete(tick);
        if (subs.size === 0 && id !== 0) {
          cancel(id);
          id = 0;
        }
      };
    },
  };
}

/** A clock you advance by hand (tests). */
export function manualClock(start = 0): SpriteClock & { advance(ms: number): void } {
  let t = start;
  const subs = new Set<Tick>();
  return {
    now: () => t,
    subscribe(tick) {
      subs.add(tick);
      return () => subs.delete(tick);
    },
    advance(ms) {
      t += ms;
      for (const s of [...subs]) s(t);
    },
  };
}

let shared: SpriteClock | null = null;
/** The page's one sprite clock (lazily created, so server rendering and tests never touch rAF). */
export function spriteClock(): SpriteClock {
  shared ??= rafClock();
  return shared;
}
