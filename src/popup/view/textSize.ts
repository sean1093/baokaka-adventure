import { createContext, useContext } from 'react';

/**
 * 大字 (GDD § 2.11, R5; #104, D-67): every game text grows by 25 %, so the 20 px floor is 25 px
 * (R5 asks ≥ 24). The shell provides the scale (1, or `BIG_TEXT_SCALE`) and marks its root, and
 * `<html>` for portalled sheets, `[data-text-size="big"]`, which `check:ui` holds to 24 px.
 *
 * - Components that size text in code read `useTextScale()` and multiply (`tpx`).
 * - HTML text sized with Tailwind's `text-[Npx]` classes is grown by `textSize.css` under the
 *   attribute, so a screen that only uses those classes needs nothing else.
 */
export const TextScaleContext = createContext(1);

export const useTextScale = (): number => useContext(TextScaleContext);

/** A text size at the current scale, rounded to a tenth of a pixel. */
export const tpx = (px: number, scale: number): number => Math.round(px * scale * 10) / 10;

/** The root attribute's value for a scale (`check:ui` reads `[data-text-size="big"]`). */
export const textSizeAttr = (scale: number): 'big' | undefined => (scale > 1 ? 'big' : undefined);
