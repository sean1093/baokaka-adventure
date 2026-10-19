import { useEffect, type RefObject } from 'react';

/**
 * The gyro tilt (popup art bible § 2.3; #104): with the 書本傾斜 setting on (never in 長輩模式,
 * under reduced motion or in low power: `effectiveSettings`), the page leans a little as the
 * phone tilts — at most ±3° about each axis, eased, from the attitude the phone had when it
 * started. It writes the page box's `transform` directly (no re-render a frame) and clears it
 * when off. Per-layer parallax (`translate` by depth) is #136's.
 */

/** The page leans at most this far (bible § 2.3). */
export const TILT_MAX_DEG = 3;
/** Degrees of lean per degree of phone tilt: 20° of phone gives the full 3°. */
export const TILT_GAIN = 0.15;

/** The lean for a phone attitude relative to its start (degrees), clamped to ±3°. */
export function tiltFor(dBeta: number, dGamma: number): { readonly x: number; readonly y: number } {
  const clamp = (v: number) => Math.max(-TILT_MAX_DEG, Math.min(TILT_MAX_DEG, Number.isFinite(v) ? v : 0));
  return { x: clamp(-dBeta * TILT_GAIN), y: clamp(dGamma * TILT_GAIN) };
}

/**
 * iOS asks before it shares the gyro, and only from a tap: call this from the toggle's tap.
 * Resolves whether the tilt may run (true where no permission is needed).
 */
export async function askTiltPermission(): Promise<boolean> {
  const api = typeof window === 'undefined' ? undefined : (window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> } | undefined);
  if (api === undefined) return false;
  if (typeof api.requestPermission !== 'function') return true;
  try {
    return (await api.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

export function useTilt(target: RefObject<HTMLElement | null>, enabled: boolean): void {
  useEffect(() => {
    const el = target.current;
    if (!enabled || el === null || typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return undefined;
    let start: { beta: number; gamma: number } | null = null;
    let goal = { x: 0, y: 0 };
    const now = { x: 0, y: 0 };
    let raf = 0;
    const ease = () => {
      now.x += (goal.x - now.x) * 0.15;
      now.y += (goal.y - now.y) * 0.15;
      el.style.transform = `perspective(1200px) rotateX(${now.x.toFixed(2)}deg) rotateY(${now.y.toFixed(2)}deg)`;
      raf = Math.abs(goal.x - now.x) + Math.abs(goal.y - now.y) > 0.01 ? requestAnimationFrame(ease) : 0;
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      start ??= { beta: e.beta, gamma: e.gamma };
      goal = tiltFor(e.beta - start.beta, e.gamma - start.gamma);
      if (raf === 0) raf = requestAnimationFrame(ease);
    };
    window.addEventListener('deviceorientation', onTilt);
    return () => {
      window.removeEventListener('deviceorientation', onTilt);
      cancelAnimationFrame(raf);
      el.style.transform = '';
    };
  }, [target, enabled]);
}
