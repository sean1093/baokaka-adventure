import { useSyncExternalStore } from 'react';

/**
 * The collection is routed by URL hash so each game has a shareable link
 * (…/#/find, …/#/quest, …/#/sudoku) and the browser back button leaves a game. No router library:
 * three routes do not justify one.
 */
export type Route = 'hub' | 'find' | 'quest' | 'sudoku';

const HASHES: Record<Exclude<Route, 'hub'>, string> = { find: '#/find', quest: '#/quest', sudoku: '#/sudoku' };

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').replace(/\/+$/, '');
  return path === 'find' || path === 'quest' || path === 'sudoku' ? path : 'hub';
}

export function navigate(route: Route): void {
  window.location.hash = route === 'hub' ? '#/' : HASHES[route];
  window.scrollTo(0, 0);
}

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};

export const useRoute = (): Route =>
  useSyncExternalStore(subscribe, () => parseRoute(window.location.hash), () => 'hub');
