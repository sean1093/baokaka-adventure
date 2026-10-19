/**
 * `src/popup/view/`: the thin React layer (GDD § 3.1, § 3.9). It renders sim state as layered SVG
 * (baked bitmaps from #96 on), interpolates between ticks and turns gestures into `Input`s; it
 * never mutates sim state.
 *
 * Landed (#89): `PageView.tsx` (the page renderer: layers per `layers.ts`, a pure function of
 * `(def, prev, state, ms)`), `PagePlayer.tsx` (the book frame, the HUD and bottom-bar slots, a
 * `PageSession` ticking it), `geometry.ts` (book scale, floor perspective), `interp.ts` (tweens,
 * rides, steps), `stage.ts` (ledges, ramps, rails, perch furniture and carriages from the walk
 * graph), `parts/` (one view per part preset), `actors/` (Baby, Mocha, Creature sprite slots) and `art/` (the registry and the placeholder stage).
 * Landed (#90): `gestures.ts` (hit testing, magnet, threshold, snap, rotary, debounce, palm,
 * hold-to-reveal; pure, no DOM) and `useGestures.ts` (the Pointer Events plumbing in `PagePlayer`).
 *
 * Landed (#97): `hud/` (TopHud, BottomBar), `screens/` (GameShell, Cover, Contents 目錄, PauseMenu,
 * the album / settings stubs, paper pieces and icons) and `transitions/pageTurn.ts` (the page fold
 * and the chapter turn).
 * Landed (#98): `talk/` (the thought bubble's change of mind, bark bubbles, subtitle bubbles and the
 * narration strip, placed off Baokaka and the goal; the queue is `game/talk.ts`).
 * Landed (#99): `words/` (the word ring, the word card, the big speech bubble's effect ring, the
 * 「要！」 poke and the first-use tutorial's hand).
 * Landed (#104): `screens/Settings.tsx` (設定, 長輩模式), `textSize.ts` (大字), `useTilt.ts`,
 * `useLowPower.ts`.
 * Planned (GDD § 3.5): `screens/` Ending.
 */
export { PageView } from './PageView';
export { PagePlayer } from './PagePlayer';
