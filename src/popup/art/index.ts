/**
 * `src/popup/art/`: the TypeScript port of the pop-up paper kit (`docs/art/popup/src/kit.js`,
 * popup art bible § 10 item 1). Pure functions returning SVG strings, deterministic and id-scoped
 * (see `svg.ts`). PageLab previews them live with filters; the bake (#96) renders them to WebP;
 * the in-game path draws them without filters until baked bitmaps replace them.
 *
 * `kit.js` stays in `docs/art/popup/src/` as the artist's reference: when it changes, port the diff.
 */
export * from './svg';
export * from './defs';
export * from './paper';
export * from './touchables';
export * from './affordance';
export * from './color';
export * from './actors';
export * from './ui';
export * from './swatches';
export * from './presets';
