import { attractorNode } from '../core/baby';
import type { SimEvent } from '../core/events';
import { walkGraph } from '../core/graph';
import { mochaAttractorNode } from '../core/mocha';
import { initialState } from '../core/state';
import { step, stepGrowth } from '../core/step';
import type { Id, Input, PageDef, SimState } from '../core/types';

/**
 * The page runner (GDD § 3.5 `game/session.ts`, § 2.6, § 2.11): the tick clock that drives
 * `core/step`, with pause and resume for gestures and menus. The view reads `frame()` and
 * `elapsed()`; it never touches the state.
 *
 * - **Speed** (GDD § 2.11): a tick every 0.75 s (slow, 長輩模式), 0.5 s (normal) or 0.33 s (fast).
 * - **Pause** is counted by reason (a finger on the page, the menu, the word ring…): the clock
 *   runs only when no reason holds. While paused, `elapsed()` stands still, so the view freezes
 *   mid-step (touch pauses the world, GDD § 2.6).
 * - **Resume grace:** once the last reason lifts, the clock waits 150 ms before it runs again,
 *   so a finger lifting does not land on a tick.
 * - **Fast-forward:** while Baokaka walks a long way (more than 4 edges still to go on his path,
 *   moving, nothing queued), ticks run 4× faster: there is nothing to do but watch.
 * - **Inputs** queue and apply on the next tick, one per tick, in order (gestures arrive in #90).
 *
 * Time comes from an injectable `Clock`, so tests drive it by hand.
 */

export const TICK_MS = { slow: 750, normal: 500, fast: 330 } as const;
export type TickSpeed = keyof typeof TICK_MS;
export const RESUME_GRACE_MS = 150;
export const FAST_FORWARD = 4;
/** Fast-forward while more edges than this remain on Baokaka's path. */
export const LONG_PATH_EDGES = 4;

export interface Clock {
  now(): number;
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

const systemClock: Clock = {
  now: () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/** What the view draws: the state before and after the latest tick, and that tick's events. */
export interface SessionFrame {
  readonly def: PageDef;
  readonly prev: SimState;
  readonly state: SimState;
  readonly events: readonly SimEvent[];
  /** Length of the current tick in ms (shorter while fast-forwarding) */
  readonly tickMs: number;
  /** Bumps on every tick (and reset), for subscribers */
  readonly serial: number;
}

export interface SessionOptions {
  speed?: TickSpeed;
  clock?: Clock;
  /** Start from this state instead of the page's initial state (PageLab, a resumed save) */
  from?: SimState;
}

/** Edges left on Baokaka's path to his target now, or 0 when he has none or can't get there. */
export function pathEdgesLeft(def: PageDef, state: SimState): number {
  const { target, node, mode } = state.baby;
  if (target === null || mode !== 'moving') return 0;
  let goal: Id | null;
  if (target === 'mocha') goal = mochaAttractorNode(def, state);
  else {
    const a = def.attractors.find((x) => x.id === target);
    goal = a === undefined ? null : attractorNode(def, state, a);
  }
  if (goal === null) return 0;
  const path = walkGraph(def, state, { who: 'baby', growth: stepGrowth(def, state) }).bfs(node, goal);
  return path === null ? 0 : path.length - 1;
}

/** True while ticks should run 4× faster: a long walk with nothing queued. */
export function fastForward(def: PageDef, state: SimState, queued: number): boolean {
  return queued === 0 && !state.done && pathEdgesLeft(def, state) > LONG_PATH_EDGES;
}

export class PageSession {
  readonly def: PageDef;
  private readonly clock: Clock;
  private speed: TickSpeed;
  private current: SessionFrame;
  private readonly queue: Input[] = [];
  private readonly listeners = new Set<(frame: SessionFrame) => void>();
  private readonly reasons = new Set<string>();
  /** ms of the current tick that ran before the latest pause */
  private banked = 0;
  /** Clock time the clock last started running, or null while paused / stopped */
  private runningSince: number | null = null;
  private timer: unknown = null;
  private graceTimer: unknown = null;
  private started = false;

  constructor(def: PageDef, { speed = 'normal', clock = systemClock, from }: SessionOptions = {}) {
    this.def = def;
    this.clock = clock;
    this.speed = speed;
    const state = from ?? initialState(def);
    this.current = { def, prev: state, state, events: [], tickMs: TICK_MS[speed], serial: 0 };
  }

  /** The latest frame. */
  frame(): SessionFrame {
    return this.current;
  }

  /** ms into the current tick, standing still while paused. */
  elapsed(): number {
    return this.banked + (this.runningSince === null ? 0 : this.clock.now() - this.runningSince);
  }

  /** True while the clock is not running (paused, in the resume grace, or not started). */
  get paused(): boolean {
    return this.runningSince === null;
  }

  /** The reasons currently pausing the clock. */
  pauseReasons(): string[] {
    return [...this.reasons].sort();
  }

  subscribe(listener: (frame: SessionFrame) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Starts the clock (once). The first tick comes one tick length later. */
  start(): void {
    if (this.started) return;
    this.started = true;
    if (this.reasons.size === 0) this.run();
  }

  /** Stops the clock for good (unmount). */
  dispose(): void {
    this.started = false;
    this.halt();
    this.cancelGrace();
    this.listeners.clear();
  }

  /** Pauses the world for `reason` (a finger down, a menu). Re-entrant per reason. */
  pause(reason = 'user'): void {
    this.reasons.add(reason);
    this.cancelGrace();
    this.halt();
  }

  /** Lifts `reason`; when none remain, the clock runs again after the 150 ms grace. */
  resume(reason = 'user'): void {
    if (!this.reasons.delete(reason) || this.reasons.size > 0 || !this.started) return;
    this.cancelGrace();
    this.graceTimer = this.clock.setTimeout(() => {
      this.graceTimer = null;
      if (this.reasons.size === 0 && this.started) this.run();
    }, RESUME_GRACE_MS);
  }

  setSpeed(speed: TickSpeed): void {
    this.speed = speed;
    this.retime();
  }

  /** Queues an input for the next tick (gestures, words, Mocha commands; #90 onward). */
  input(input: Input): void {
    this.queue.push(input);
    this.retime(); // a queued input ends a fast-forward at once
  }

  /** Runs one tick now (the clock's own ticks, PageLab's 「一格」). */
  tick(): SessionFrame {
    const running = this.runningSince !== null;
    this.halt();
    const input = this.queue.shift() ?? { t: 'none' };
    const { state, events } = step(this.def, this.current.state, input);
    this.current = { def: this.def, prev: this.current.state, state, events, tickMs: this.tickLength(state), serial: this.current.serial + 1 };
    this.banked = 0;
    if (running) this.run();
    for (const listener of [...this.listeners]) listener(this.current);
    return this.current;
  }

  /** Back to the page's start (重來), keeping the clock's run state. */
  reset(from: SimState = initialState(this.def)): void {
    const running = this.runningSince !== null;
    this.halt();
    this.queue.length = 0;
    this.banked = 0;
    this.current = { def: this.def, prev: from, state: from, events: [], tickMs: TICK_MS[this.speed], serial: this.current.serial + 1 };
    for (const listener of [...this.listeners]) listener(this.current);
    if (running) this.run();
  }

  /** Recomputes the current tick's length (speed or queue changed), keeping the time already run. */
  private retime(): void {
    const running = this.runningSince !== null;
    this.halt();
    this.current = { ...this.current, tickMs: this.tickLength(this.current.state) };
    if (running) this.run();
  }

  private tickLength(state: SimState): number {
    const base = TICK_MS[this.speed];
    return fastForward(this.def, state, this.queue.length) ? base / FAST_FORWARD : base;
  }

  /** Starts the clock; after the page is done it only keeps time (the last frame plays out). */
  private run(): void {
    this.runningSince = this.clock.now();
    if (!this.current.state.done) this.schedule();
  }

  private schedule(): void {
    const left = Math.max(0, this.current.tickMs - this.elapsed());
    this.timer = this.clock.setTimeout(() => {
      this.timer = null;
      this.tick();
    }, left);
  }

  /** Stops the timer and banks the elapsed time. */
  private halt(): void {
    if (this.timer !== null) this.clock.clearTimeout(this.timer);
    this.timer = null;
    if (this.runningSince !== null) this.banked = this.elapsed();
    this.runningSince = null;
  }

  private cancelGrace(): void {
    if (this.graceTimer !== null) this.clock.clearTimeout(this.graceTimer);
    this.graceTimer = null;
  }
}
