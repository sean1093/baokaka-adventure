/**
 * `src/popup/view/`: the thin React layer (GDD § 3.1, § 3.9). It renders sim state as layered SVG
 * (baked bitmaps from #96 on), interpolates between ticks and turns gestures into `Input`s; it
 * never mutates sim state.
 *
 * Landed (#89): `PageView.tsx` (the page renderer: layers per `layers.ts`, a pure function of
 * `(def, prev, state, ms)`), `PagePlayer.tsx` (the book frame, the HUD and bottom-bar slots, a
 * `PageSession` ticking it), `geometry.ts` (book scale, floor perspective), `interp.ts` (tweens,
 * rides, steps), `stage.ts` (ledges, ramps, rails, perch furniture and carriages from the walk
 * graph), `parts/` (one view per part preset), `actors/` (Baby, Mocha, Creature, Bubble sprite
 * slots) and `art/` (the registry and the placeholder stage).
 * Landed (#90): `gestures.ts` (hit testing, magnet, threshold, snap, rotary, debounce, palm,
 * hold-to-reveal; pure, no DOM) and `useGestures.ts` (the Pointer Events plumbing in `PagePlayer`).
 *
 * Planned (GDD § 3.5): `hud/` (TopHud, BottomBar, WordRing,
 * HintLayer, StickerCard; #97) and `screens/` (Cover, 目錄, ChapterCard, Spread + photo, Album,
 * Settings, Ending).
 */
export { PageView } from './PageView';
export { PagePlayer } from './PagePlayer';
