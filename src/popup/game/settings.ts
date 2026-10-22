import type { Settings } from './progress';

/**
 * Settings as the game reads them (GDD § 2.11; popup art bible § 2.3, § 9.3; #104, D-67). Pure: no
 * DOM, no clock.
 *
 * - **長輩模式 is a view over the player's own settings, never a write.** `Settings` keeps what the
 *   player chose for 速度, 字的大小 and 自動提示; with `elder` on, `effectiveSettings` reads 慢, 大字
 *   and 15 秒 instead, plus the elder extras (hold-to-show-parts always on, bolder perch markers,
 *   28 px seals, the stronger hint halo, no gyro tilt). Turning it off therefore restores exactly
 *   what the player had, with nothing to snapshot. While it is on, changes to the settings it holds
 *   are dropped (`elderPatch`), and the settings screen shows those rows locked.
 * - **減少動態** follows the system until the player sets it (`reduceMotion: null`).
 * - **Low power** (bible § 9.3): `FrameWatch` turns it on once the mean frame time stays over 20 ms
 *   for 2 s; then tilt and confetti are dropped and the sparkles halved. It turns off once after
 *   10 s of smooth frames (#136), and the second time it stays on.
 * - **震動**: `HAPTICS` holds the short pulses for a snap, a push and a sticker.
 */

/** What 長輩模式 sets (§ 2.11): speed 慢, 大字, auto-hint at 15 s. */
export const ELDER: Readonly<Pick<Settings, 'speed' | 'bigText' | 'autoHint'>> = Object.freeze({ speed: 0, bigText: true, autoHint: 15 });

/** The settings 長輩模式 holds while it is on (their rows are locked on the settings screen). */
export const ELDER_HELD: readonly (keyof typeof ELDER)[] = ['speed', 'bigText', 'autoHint'];

/** 大字: every game text grows by 25 % (§ 2.11), so the 20 px floor becomes 25 px (R5 asks ≥ 24). */
export const BIG_TEXT_SCALE = 1.25;

/** The settings as the game plays them, with 長輩模式, the system's reduced motion and low power applied. */
export interface EffectiveSettings {
  readonly speed: 0 | 1 | 2;
  readonly bigText: boolean;
  /** The text scale: 1, or `BIG_TEXT_SCALE` with 大字 */
  readonly textScale: number;
  /** Seconds before the auto nudge, 0 = off */
  readonly autoHint: 0 | 15 | 30;
  readonly sfx: number;
  readonly music: number;
  readonly vibrate: boolean;
  readonly reduceMotion: boolean;
  readonly leftHand: boolean;
  /** The gyro tilt: asked for, and not in 長輩模式, reduced motion or low power */
  readonly tilt: boolean;
  /** 長輩模式's extras (bible § 9.3): the hold-to-reveal outlines always shown, bolder perch markers, 28 px seals, the stronger L1 halo */
  readonly elder: boolean;
  /** Low power (bible § 9.3): no confetti, half the sparkles (and no tilt) */
  readonly lowPower: boolean;
}

export interface Environment {
  /** The system asks for less motion (`prefers-reduced-motion`) */
  readonly osReduced: boolean;
  /** `FrameWatch` latched */
  readonly lowPower?: boolean;
}

export function effectiveSettings(s: Settings, env: Environment): EffectiveSettings {
  const held = s.elder ? ELDER : s;
  const reduceMotion = s.reduceMotion ?? env.osReduced;
  const lowPower = env.lowPower === true;
  return {
    speed: held.speed,
    bigText: held.bigText,
    textScale: held.bigText ? BIG_TEXT_SCALE : 1,
    autoHint: held.autoHint,
    sfx: s.sfx,
    music: s.music,
    vibrate: s.vibrate,
    reduceMotion,
    leftHand: s.leftHand,
    tilt: s.tilt === true && !s.elder && !reduceMotion && !lowPower,
    elder: s.elder,
    lowPower,
  };
}

/**
 * A settings change as it may apply: while 長輩模式 is on and the patch doesn't turn it off, its
 * changes to the settings 長輩模式 holds are dropped (the player's own values stay for when it is
 * turned off). Everything else passes as given.
 */
export function elderPatch(s: Settings, patch: Partial<Settings>): Partial<Settings> {
  if (!s.elder || patch.elder === false) return patch;
  const out: Partial<Settings> = { ...patch };
  for (const key of ELDER_HELD) delete out[key];
  return out;
}

/** Whether a settings row is held by 長輩模式 right now (shown locked, with the elder value). */
export const heldByElder = (s: Settings, key: keyof Settings): boolean => s.elder && (ELDER_HELD as readonly string[]).includes(key);

// ---------------------------------------------------------------------------------------------
// Low power (bible § 9.3)

export const LOW_POWER = {
  /** A frame slower than this is a slow frame */
  frameMs: 20,
  /** … for this long, on average */
  windowMs: 2000,
  /** A gap this long (a background tab, a pause) starts the measure over */
  gapMs: 250,
  /** Low power ends (#136) once the frames of this long average under `recoverFrameMs` … */
  recoverMs: 10_000,
  recoverFrameMs: 17.5,
  /** … with at most this share of them slow */
  recoverSlowShare: 0.1,
  /** It ends this many times a session at most; the next time it stays on (no flapping) */
  recoveries: 1,
} as const;

/**
 * Watches frame times and turns low power on once the frames of the last `windowMs` average more
 * than `frameMs` and most of them are slower than it (a sustained slowdown, not one stall). Feed it
 * each frame's duration.
 *
 * It recovers (#136): while low power is on it keeps watching, and once a full `recoverMs` of
 * frames (with low power's lighter page) averages under `recoverFrameMs` with few slow ones, it
 * turns off: a phone that struggled through one heavy moment (a page fold, a cold cache, a burst of
 * background work) gets its full page back. It turns off at most `recoveries` times a session; the
 * next slowdown keeps it on for good, so a phone on the edge never flips back and forth.
 */
export class FrameWatch {
  private readonly frames: number[] = [];
  private total = 0;
  /** Frames in the window slower than `frameMs` */
  private slow = 0;
  private on = false;
  private recovered = 0;

  get low(): boolean {
    return this.on;
  }

  /** Whether it is on for good (it has recovered as often as it may) */
  get latched(): boolean {
    return this.on && this.recovered >= LOW_POWER.recoveries;
  }

  private reset() {
    this.frames.length = 0;
    this.total = 0;
    this.slow = 0;
  }

  /** One frame of `dt` ms. Returns whether low power is on. */
  push(dt: number): boolean {
    if (this.latched) return true;
    if (!Number.isFinite(dt) || dt <= 0) return this.on;
    if (dt >= LOW_POWER.gapMs) {
      this.reset();
      return this.on;
    }
    this.frames.push(dt);
    this.total += dt;
    if (dt > LOW_POWER.frameMs) this.slow++;
    // Keep just the last window (the longer recovery window while on)
    const windowMs = this.on ? LOW_POWER.recoverMs : LOW_POWER.windowMs;
    while (this.frames.length > 1 && this.total - this.frames[0] >= windowMs) {
      const old = this.frames.shift() ?? 0;
      this.total -= old;
      if (old > LOW_POWER.frameMs) this.slow--;
    }
    if (this.total < windowMs) return this.on;
    const mean = this.total / this.frames.length;
    if (!this.on) {
      // Sustained, not a stall: the window's mean is over the limit and so are most of its frames
      if (mean > LOW_POWER.frameMs && this.slow * 2 > this.frames.length) {
        this.on = true;
        this.reset();
      }
    } else if (mean < LOW_POWER.recoverFrameMs && this.slow <= this.frames.length * LOW_POWER.recoverSlowShare) {
      this.on = false;
      this.recovered++;
      this.reset();
    }
    return this.on;
  }
}

// ---------------------------------------------------------------------------------------------
// 震動 (§ 2.11: short pulses on snap, push, sticker)

export type Haptic = 'snap' | 'push' | 'sticker';

/** `navigator.vibrate` patterns (ms): a tick for a snap, a nudge for Mocha's push, a double tap for a sticker. */
export const HAPTICS: Readonly<Record<Haptic, number | readonly number[]>> = Object.freeze({
  snap: 12,
  push: 22,
  sticker: [16, 60, 16],
});

/** What can vibrate (`navigator`, or a fake in tests). */
export interface Vibrator {
  vibrate?: (pattern: number | number[]) => boolean;
}

/** One pulse, when 震動 is on and the device can. Never throws. Returns whether it was sent. */
export function pulse(kind: Haptic, on: boolean, device: Vibrator | null = typeof navigator === 'undefined' ? null : navigator): boolean {
  if (!on || device === null || typeof device.vibrate !== 'function') return false;
  const pattern = HAPTICS[kind];
  try {
    return device.vibrate(typeof pattern === 'number' ? pattern : [...pattern]) !== false;
  } catch {
    return false;
  }
}
