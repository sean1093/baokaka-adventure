/**
 * `src/popup/pages/`: the pages, as data (GDD § 2.1, § 3.4). One folder per chapter (`c0/` …
 * `c10/`, `end/`) with one file per page built from part presets — no per-page code beyond at
 * most one custom reaction, which lint flags. This file becomes the ordered page registry;
 * `pages.test.ts` lints, replays and solves every page in CI.
 */
export { definePage } from '../core/define';
