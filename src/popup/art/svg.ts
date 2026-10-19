import { roll } from '../../shared/random';

/**
 * The plumbing every kit helper shares (popup art bible § 9.1; port of `docs/art/popup/src/kit.js`).
 *
 * Every helper is a pure function that returns an SVG string: same arguments, same string, so a
 * bake (#96) is reproducible and a snapshot test pins each helper. Randomness is seeded through
 * `src/shared/random.ts`; nothing reads the clock or `Math.random`.
 *
 * A `KitCtx` carries the two things a helper cannot know on its own:
 * - `id(name)`: the document-unique id for a shared def (`url(#…)`), so two kit drawings on one
 *   page never paint with each other's gradients (the `useSvgIds` rule, art direction § 8.2 rule 6).
 *   React callers build it from `useSvgIds`; tests and the bake use `kitCtx(scope)`.
 * - `filters`: whether SVG filters are allowed. **Only PageLab's live preview and the bake set it**
 *   (GDD § 3.9, bible § 9.1). With `filters: false` (the default, and the in-game path) helpers draw
 *   the same paper with flat stand-ins: offset silhouettes for the stacked shadow, radial gradients
 *   for blurs, no grain, no deckle. `filters: false` output never contains a `filter` attribute.
 */
export type KitCtx = {
  readonly id: (name: string) => string;
  readonly filters: boolean;
};

/** A context for one SVG document (or one bake); `scope` must be unique per document. */
export function kitCtx(scope: string, { filters = false }: { filters?: boolean } = {}): KitCtx {
  return { id: (name) => `${scope}-${name}`, filters };
}

/** `url(#scoped-id)` for a shared def. */
export const ref = (ctx: KitCtx, name: string): string => `url(#${ctx.id(name)})`;

/** ` filter="url(#…)"` when filters are allowed, otherwise nothing. */
export const filterAttr = (ctx: KitCtx, name: string): string => (ctx.filters ? ` filter="${ref(ctx, name)}"` : '');

/** One decimal place, as kit.js `f1` (keeps strings short and stable). */
export const f1 = (n: number): number => Math.round(n * 10) / 10;

/** Two decimal places, for small radii and opacities. */
export const f2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * A seeded stream of values in [0, 1) built on `roll` (mulberry32). The stream is local to the
 * call, so a helper called twice with one seed draws the same shapes. Seed 0 is treated as 1, as
 * kit.js did.
 */
export function seeded(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    const next = roll(state);
    state = next.seed;
    return next.value;
  };
}

/** `translate(x y)` with rounded numbers. */
export const translate = (x: number, y: number): string => `translate(${f1(x)} ${f1(y)})`;
