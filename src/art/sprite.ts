import type { ReactElement } from 'react';

/**
 * A sprite is one SVG that fills its own box.
 *
 * The bar is 仙劍奇俠傳-era 2D character art: shaded, costumed, readable at a glance. Not a flat
 * colouring-book fill. Every sprite must follow these rules, or scenes end up mismatched:
 *
 *   1. The root is always <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
 *   2. The subject fills at least 80% of the viewBox and never leaves 0..100
 *   3. Silhouette outline stroke={C.ink} strokeWidth={4} strokeLinejoin="round"; interior lines are
 *      thinner (2-3) and use the fill's `Deep` tone rather than pure ink, so the drawing reads as
 *      painted rather than as line art
 *   4. Cel shading, light from the upper left: every form gets its base colour, a `Deep` shadow
 *      shape on the lower right, and a soft C.white highlight (opacity 0.2-0.45) on the upper left
 *   5. Only palette.ts colours. Gradients are allowed and encouraged for cloth, water, metal and
 *      glow, but every stop must be a palette colour. No filters, no bitmaps, no external fonts,
 *      no <text>, no ids that could collide across sprites (prefix any id with the sprite name)
 *   6. No interactive attributes (onClick / tabIndex); the wrapping <button> handles taps
 */
export type Sprite = () => ReactElement;
