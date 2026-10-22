import type { SafeInsets } from './geometry';

/**
 * The phone's safe-area insets (#136), read from `env(safe-area-inset-top / -bottom)` through a
 * probe element, as CSS px. `index.html` asks for `viewport-fit=cover`, so on a notched phone
 * (an installed app, or Safari in landscape) the page runs under the status bar and the home
 * indicator; the page's HUD and bottom bar are placed inside them (`bookLayout`). 0 where the
 * browser has none.
 */
export function readSafeInsets(): SafeInsets {
  if (typeof document === 'undefined' || document.body === null) return { top: 0, bottom: 0 };
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)';
  document.body.appendChild(probe);
  const style = getComputedStyle(probe);
  const px = (v: string) => Math.max(0, Math.round(Number.parseFloat(v) || 0));
  const out = { top: px(style.paddingTop), bottom: px(style.paddingBottom) };
  probe.remove();
  return out;
}

/** The last reading: `useSyncExternalStore` asks on every render, the probe runs only after a change. */
let cached: string | null = null;

/** Re-read on a resize or a turn of the phone (`useSyncExternalStore`). */
export function subscribeViewport(onChange: () => void): () => void {
  const changed = () => {
    cached = null;
    onChange();
  };
  window.addEventListener('resize', changed);
  window.addEventListener('orientationchange', changed);
  return () => {
    window.removeEventListener('resize', changed);
    window.removeEventListener('orientationchange', changed);
  };
}

/** The viewport and its insets as one string (a stable snapshot): `W x H | top | bottom`. */
export function readViewport(): string {
  const size = `${window.innerWidth}x${window.innerHeight}`;
  if (cached === null || !cached.startsWith(`${size}|`)) {
    const { top, bottom } = readSafeInsets();
    cached = `${size}|${top}|${bottom}`;
  }
  return cached;
}

export function parseViewport(key: string): { w: number; h: number; inset: SafeInsets } {
  const [size, top, bottom] = key.split('|');
  const [w, h] = size.split('x').map(Number);
  return { w, h, inset: { top: Number(top) || 0, bottom: Number(bottom) || 0 } };
}
