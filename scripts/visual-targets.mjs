/**
 * What `scripts/visual-check.mjs` screenshots. Each target is { name, hash, waitFor?, fullPage? }:
 * `hash` is appended to the base URL, `waitFor` is a CSS selector that must appear first, and
 * `fullPage` captures the whole scrollable page instead of the viewport.
 *
 * Every art lab fixture (src/artlab/fixtures.ts, ARTLAB_FIXTURES) is added automatically through
 * fixtureTarget(), read from the art lab's own index, so a new fixture needs no change here.
 */

export const VIEWPORTS = [
  { name: '390x844', width: 390, height: 844 },
  { name: '375x667', width: 375, height: 667 },
];

export const TARGETS = [
  { name: 'title', hash: '#/', waitFor: 'main' },
  {
    name: 'artlab-sprites-night',
    // One size keeps the full sheet a sane height; open the lab without `size` to see all four
    hash: '#/artlab?section=sprites&bg=night&size=64&still=1',
    waitFor: '[data-sprite]',
    fullPage: true,
    artlab: true,
  },
];

/** The screenshot target for one art lab fixture. */
export const fixtureTarget = (name) => ({
  name,
  hash: `#/artlab?section=fixtures&only=${encodeURIComponent(name)}&still=1`,
  waitFor: `[data-artlab-fixture="${name}"] main`,
  artlab: true,
});

/** The fixture the --perf run walks around in. */
export const PERF_FIXTURE = 'world';
