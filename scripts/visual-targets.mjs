/**
 * What `scripts/visual-check.mjs` screenshots. Each target is { name, hash, waitFor?, fullPage? }:
 * `hash` is appended to the base URL, `waitFor` is a CSS selector that must appear first, and
 * `fullPage` captures the whole scrollable page instead of the viewport.
 *
 * Every art lab fixture (src/artlab/fixtures.ts, ARTLAB_FIXTURES) is added automatically through
 * fixtureTarget(), read from the art lab's own index, and every 翻翻台北 visual QA fixture
 * (src/popup/dev/fixtures.ts, POPUP_FIXTURES; #92) through popupFixtureTarget(), read from
 * PageLab's `#/pagelab?section=fixtures`, so a new fixture needs no change here.
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
  {
    name: 'artlab-tokens',
    hash: '#/artlab?section=tokens&still=1',
    // The Tokens section shows the web fonts' load state; wait until all three are in
    waitFor: '[data-artlab-tokens] [data-font="Fredoka"][data-font-loaded="true"]',
    fullPage: true,
    artlab: true,
  },
  {
    name: 'artlab-rig',
    // The rig test figure at every LOD with its skeleton, the shared defs and the placeholders
    hash: '#/artlab?section=rig&skeleton=1&still=1',
    waitFor: '[data-artlab-rig] [data-budget="icon"]',
    fullPage: true,
    artlab: true,
  },
  {
    name: 'artlab-heroes',
    // 寶咖咖 and 摩卡貓 (#16): four LODs on three floors with skeletons, silhouettes, poses, expressions, tails, states, budgets
    hash: '#/artlab?section=heroes&skeleton=1&still=1',
    waitFor: '[data-artlab-heroes] [data-budget="mocha-loaf"]',
    fullPage: true,
    artlab: true,
  },
  {
    name: 'artlab-ui',
    // Every UI kit component in each state (#12): panels, buttons, bars, the dialogue box, the clock
    hash: '#/artlab?section=ui&still=1',
    waitFor: '[data-artlab-ui] [data-kit-dialogue] [data-dialogue-box]',
    fullPage: true,
    artlab: true,
  },
  {
    name: 'artlab-map',
    // The iso renderer v2 (#13): the test map at 00:00 / 03:00 / 05:15, the sky strip, every material
    hash: '#/artlab?section=map&still=1',
    waitFor: '[data-artlab-map] [data-material="carFloor"] [data-ground]',
    fullPage: true,
    artlab: true,
  },
  {
    name: 'artlab-stage',
    // The battle stage v2 (#14): every backdrop over its painted width, the generic ones at three times, both 布袋戲 frames
    hash: '#/artlab?section=stage&still=1',
    waitFor: '[data-artlab-stage] [data-stage-card="daan"][data-stage-ready]',
    fullPage: true,
    artlab: true,
  },
  {
    name: 'artlab-fx',
    // The battle VFX (#15): every FX kind and accent frozen at its impact frame, the glyph rings, all-target casts
    hash: '#/artlab?section=fx&still=1',
    waitFor: '[data-artlab-fx] [data-fx-all="claw"] [data-fx-target]',
    fullPage: true,
    artlab: true,
  },
  {
    name: 'kit-swatches',
    // 翻翻台北's paper kit port (#139): proof D rebuilt from src/popup/art, every part preset's default art, the kit.js proof
    hash: '#/pagelab?section=kit',
    waitFor: '[data-pagelab-kit] [data-kit-live] [data-kit-preset="prop"]',
    fullPage: true,
    artlab: true,
  },
  {
    name: 'popup-c0p1',
    // 翻翻台北 page 0-1 in the book frame (#89): the placeholder home stage, the crib rail closed, Baokaka reaching
    hash: '#/popup?page=c0p1&tick=2&paused=1',
    waitFor: '[data-popup-page="c0p1"] [data-actor="baby"][data-mode="reaching"]',
  },
  {
    name: 'popup-c1p2',
    // 翻翻台北 page 1-2 (#89; proof A's page): the station stage, the train tab at `out`, Mocha on the bench, the pigeon
    hash: '#/popup?page=c1p2&tick=3&paused=1',
    waitFor: '[data-popup-page="c1p2"] [data-actor="baby"][data-mode="reaching"]',
  },
];

/** The screenshot target for one art lab fixture. */
export const fixtureTarget = (name) => ({
  name,
  hash: `#/artlab?section=fixtures&only=${encodeURIComponent(name)}&still=1`,
  waitFor: `[data-artlab-fixture="${name}"] main`,
  artlab: true,
});

/** The screenshot target for one 翻翻台北 fixture: full screen, no lab chrome, held still (#92). */
export const popupFixtureTarget = (name) => ({
  name,
  hash: `#/pagelab?fixture=${encodeURIComponent(name)}&still=1`,
  waitFor: `[data-pagelab-fixture="${name}"] svg[data-page]`,
  artlab: true,
});

/** The fixture the --perf run walks around in. */
export const PERF_FIXTURE = 'world';
