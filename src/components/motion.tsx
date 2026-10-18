import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react';

/**
 * Reduced motion (art direction § 7.9): the OS setting OR'd with the in-game 「減少動態」 toggle.
 * CSS reads the toggle from `.reduce-motion` on <html> (set by QuestScreens) and the OS setting
 * from the media query; components that time things in JavaScript read this hook.
 */

/** The in-game toggle, provided by whoever owns the settings (QuestScreens). */
export const ReducedMotionContext = createContext(false);

const QUERY = '(prefers-reduced-motion: reduce)';

const subscribe = (onChange: () => void) => {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const query = window.matchMedia(QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

const prefers = () => typeof window !== 'undefined' && Boolean(window.matchMedia?.(QUERY).matches);

/** True when the OS asks for less motion. */
export const usePrefersReducedMotion = (): boolean => useSyncExternalStore(subscribe, prefers, () => false);

/** True when either the OS or the in-game toggle asks for less motion. */
export const useReducedMotion = (): boolean => {
  const toggle = useContext(ReducedMotionContext);
  const os = usePrefersReducedMotion();
  return toggle || os;
};

/** The class CSS keys the in-game toggle off; set on <html> so portalled sheets follow it too. */
export const REDUCE_MOTION_CLASS = 'reduce-motion';

/**
 * Keeps the last non-null `value` around for `ms` after it turns null, flagged `leaving`, so a
 * panel can play its exit animation (dialogue out, § 7.9) before it unmounts.
 */
export function usePresence<T>(value: T | null, ms: number): { value: T | null; leaving: boolean } {
  const present = value !== null;
  const last = useRef<T | null>(value);
  const [gone, setGone] = useState(!present);
  if (present) last.current = value;

  useEffect(() => {
    if (present) {
      setGone(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setGone(true), ms);
    return () => window.clearTimeout(timer);
  }, [present, ms]);

  if (present) return { value, leaving: false };
  return gone ? { value: null, leaving: false } : { value: last.current, leaving: true };
}
