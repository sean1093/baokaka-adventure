import type { ReactElement } from 'react';

/**
 * A sprite is one SVG that fills its own box.
 * Every sprite must follow these rules, or scenes end up with mismatched sizes:
 *   1. The root is always <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
 *   2. The subject fills at least 80% of the viewBox and never leaves 0..100
 *   3. Flat fills with a dark outline: stroke={C.ink} strokeWidth={4} strokeLinejoin="round"
 *   4. Only palette.ts colours; no gradients, no filters, no external fonts
 *   5. No interactive attributes (onClick / tabIndex); the wrapping <button> handles taps
 */
export type Sprite = () => ReactElement;
