/**
 * `src/popup/game/`: the glue between the simulation and the screens (GDD § 2.10, § 3.8).
 * Landed: `session.ts` (#89: the page runner — tick clock at 0.75/0.5/0.33 s, pause by reason with
 * a 150 ms resume grace, 4× fast-forward on long walks, queued inputs → `core/step`).
 * Planned: `progress.ts` (save, load and migrate `popup.save.v1` through `src/shared/storage.ts`).
 */
export * from './session';
