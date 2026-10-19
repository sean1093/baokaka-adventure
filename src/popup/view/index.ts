/**
 * `src/popup/view/`: the thin React layer (GDD § 3.1, § 3.9). It renders sim state as layered SVG
 * plus baked bitmaps, interpolates between ticks and turns gestures into `Input`s; it never
 * mutates sim state.
 *
 * Planned (GDD § 3.5): `PageView.tsx` (layers, scaling, hit-testing, gestures), `parts/` (one view
 * per part preset), `actors/` (Baby, Mocha, Creature, Bubble standees), `hud/` (TopHud, BottomBar,
 * WordRing, HintLayer, StickerCard), `screens/` (Cover, 目錄, ChapterCard, Spread + photo, Album,
 * Settings, Ending) and `art/` (the kit port and the art registry, #139).
 */
export {};
