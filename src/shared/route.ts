/**
 * The site is one game, so routing is tiny (decisions.md D-13). `#/`, `#/quest` (kept so old
 * shared links still work) and any unknown hash all show the game. The hashes of the removed
 * mini-games (`#/find`, `#/sudoku`) are rewritten to `#/` in place, so the back button never
 * returns to a dead link. `#/artlab` is the dev-only art lab (issue #4); App only honours it in
 * development builds, so in production it shows the game like any other unknown hash. Anything
 * after `?` in the hash is a parameter, not part of the route. No router library.
 */
export type Route = 'game' | 'legacy' | 'artlab';

const LEGACY: ReadonlySet<string> = new Set(['find', 'sudoku']);

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').replace(/\?.*$/, '').replace(/\/+$/, '');
  if (path === 'artlab') return 'artlab';
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

/** The parameters after `?` in the hash, e.g. `#/artlab?bg=night` -> { bg: 'night' }. */
export function hashParams(hash: string): URLSearchParams {
  const at = hash.indexOf('?');
  return new URLSearchParams(at < 0 ? '' : hash.slice(at + 1));
}
