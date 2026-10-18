import { useCallback, useId } from 'react';

/**
 * Unique SVG ids for one mounted sprite (art direction § 8.2 rule 6). Two copies of a sprite on
 * screen (four heroes, three of the same foe, the art lab's grid) must never share a clipPath or
 * gradient id, or the second copy silently paints with the first one's geometry.
 *
 * `const id = useSvgIds('mocha'); <clipPath id={id('head')}>… clipPath={`url(#${id('head')})`}`
 *
 * Built on React's `useId()`, with its colons removed: `:r3:` is a valid id but not a valid
 * `url(#…)` reference without escaping. Stable across renders and between server and client.
 */
export function useSvgIds(prefix: string): (name: string) => string {
  const base = `${prefix}-${useId().replace(/:/g, '')}`;
  return useCallback((name: string) => `${base}-${name}`, [base]);
}
