/**
 * `src/popup/game/`: the glue between the simulation and the screens (GDD § 2.10, § 3.8).
 * Landed: `session.ts` (#89: the page runner — tick clock at 0.75/0.5/0.33 s, pause by reason with
 * a 150 ms resume grace, 4× fast-forward on long walks, queued inputs → `core/step`).
 * `progress.ts` (#93: `SaveV1` under `popup.save.v1` through `src/shared/storage.ts` — load, guard,
 * migrate, linear unlocks, stickers, photos, settings, owned vs per-page abilities, the live
 * `ProgressStore`, and retiring the RPG saves for #109).
 */
export * from './session';
export * from './progress';
export * from './nav';
