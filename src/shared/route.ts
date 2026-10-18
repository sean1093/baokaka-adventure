/**
 * The site is one game, so routing is tiny (decisions.md D-13). `#/`, `#/quest` (kept so old
 * shared links still work) and any unknown hash all show the game. The hashes of the removed
 * mini-games (`#/find`, `#/sudoku`) are rewritten to `#/` in place, so the back button never
 * returns to a dead link. No router library.
 */
export type Route = 'game' | 'legacy';

const LEGACY: ReadonlySet<string> = new Set(['find', 'sudoku']);

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').replace(/\/+$/, '');
  return LEGACY.has(path) ? 'legacy' : 'game';
}

/**
 * Rewrites a retired hash to `#/` with `replaceState`: no new history entry, so back does not
 * bounce between the old link and the game.
 */
function redirectLegacyRoute(): void {
  if (parseRoute(window.location.hash) !== 'legacy') return;
  const { pathname, search } = window.location;
  window.history.replaceState(window.history.state, '', `${pathname}${search}#/`);
}

/** Tidies the URL on boot, and again if someone edits the hash to an old game while playing. */
export function installRouteRedirect(): void {
  redirectLegacyRoute();
  window.addEventListener('hashchange', redirectLegacyRoute);
}
