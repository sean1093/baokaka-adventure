/**
 * The site is one game, 翻翻台北 Pop-Up Taipei, so routing is tiny (decisions.md D-13, D-72).
 * `#/`, `#/popup` (its address before the routing switch, #109), `#/quest` (the retired RPG's old
 * shared links) and any unknown hash all show the game. The hashes of the removed mini-games
 * (`#/find`, `#/sudoku`) are rewritten to `#/` in place, so the back button never returns to a dead
 * link. `#/artlab` (the RPG-era art lab, issue #4) and `#/pagelab` (翻翻台北's page editor, GDD
 * § 3.10) are dev-only: App only honours them in development builds, so in production they show the
 * game like any other unknown hash. Anything after `?` in the hash is a parameter, not part of the
 * route (the game reads its own, e.g. `#/?page=c1p2`). No router library.
 */
export type Route = 'game' | 'legacy' | 'artlab' | 'pagelab';

/** Dev routes whose hash path is their own name. */
const NAMED: ReadonlySet<Route> = new Set<Route>(['artlab', 'pagelab']);
const isNamed = (path: string): path is Route => (NAMED as ReadonlySet<string>).has(path);

const LEGACY: ReadonlySet<string> = new Set(['find', 'sudoku']);

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').replace(/\?.*$/, '').replace(/\/+$/, '');
  if (isNamed(path)) return path;
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
