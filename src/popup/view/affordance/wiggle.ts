import { seeded } from '../../art/svg';
import type { Id } from '../../core/types';

/**
 * The idle wiggle scheduler (popup art bible § 4.1 idle, § 8): every touchable wiggles about every
 * 4 s ± 0.8 s, at random, staggered so the page never pulses in unison. Pure, with no clock: the
 * caller (`useIdleWiggle`) asks `nextAt()`, waits, and calls `due(now)` for the parts to wiggle;
 * tests drive it with a fake clock. Seeded, so a page wiggles the same way every visit.
 *
 * Stagger: a part's next wiggle is the moment in its 3.2–4.8 s window farthest from every other
 * part's scheduled wiggle (sampled every 50 ms), so wiggles never overlap while there is room.
 * The first round is spread evenly over one period, starting after `startMs`.
 */

export const WIGGLE_PERIOD_MS = 4000;
export const WIGGLE_JITTER_MS = 800;
/** How long one wiggle runs (bible § 8): the CSS animation's duration. */
export const WIGGLE_MS = 300;
const SAMPLE_MS = 50;

export interface WiggleOptions {
  readonly seed?: number;
  /** When the first round may start (ms on the caller's clock) */
  readonly startMs?: number;
  readonly periodMs?: number;
  readonly jitterMs?: number;
}

export class WiggleScheduler {
  private readonly at = new Map<Id, number>();
  private readonly rand: () => number;
  private readonly period: number;
  private readonly jitter: number;

  constructor(ids: readonly Id[], { seed = 1, startMs = 0, periodMs = WIGGLE_PERIOD_MS, jitterMs = WIGGLE_JITTER_MS }: WiggleOptions = {}) {
    this.rand = seeded(seed);
    this.period = periodMs;
    this.jitter = jitterMs;
    const n = Math.max(1, ids.length);
    ids.forEach((id, i) => {
      // One period split into n slots; each part lands somewhere in the middle of its slot
      const slot = this.period / n;
      this.at.set(id, startMs + slot * (i + 0.25 + this.rand() * 0.5));
    });
  }

  /** The parts it schedules. */
  get ids(): Id[] {
    return [...this.at.keys()];
  }

  /** When the next wiggle is due (Infinity with no parts). */
  nextAt(): number {
    let next = Infinity;
    for (const t of this.at.values()) next = Math.min(next, t);
    return next;
  }

  /** The parts due by `now` (earliest first); each is rescheduled 4 s ± 0.8 s on, staggered. */
  due(now: number): Id[] {
    const ready = [...this.at.entries()].filter(([, t]) => t <= now).sort((a, b) => a[1] - b[1]);
    for (const [id, t] of ready) this.at.set(id, this.pick(id, Math.max(t, now)));
    return ready.map(([id]) => id);
  }

  /** The time in `from`'s next window farthest from every other part's scheduled wiggle. */
  private pick(id: Id, from: number): number {
    const others = [...this.at.entries()].filter(([o]) => o !== id).map(([, t]) => t);
    const lo = from + this.period - this.jitter;
    const steps = Math.max(1, Math.round((2 * this.jitter) / SAMPLE_MS));
    // A random preference inside the window breaks ties, so a lone part still varies its rhythm
    const prefer = lo + this.rand() * 2 * this.jitter;
    let best = prefer;
    let bestScore = -Infinity;
    for (let i = 0; i <= steps; i++) {
      const t = lo + (i * 2 * this.jitter) / steps;
      const clear = others.length === 0 ? Infinity : Math.min(...others.map((o) => Math.abs(o - t)));
      // Room beyond one wiggle's length doesn't matter much; then stay near the random preference
      const score = Math.min(clear, WIGGLE_MS * 2) * 1000 - Math.abs(t - prefer);
      if (score > bestScore) {
        bestScore = score;
        best = t;
      }
    }
    return best;
  }
}
