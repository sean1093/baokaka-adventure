import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 2-2 「露天音樂台」 (the open-air bandshell) · difficulty 2 · par 2. The landmark's
 * signature mechanism: a spotlight **wheel** moves a light attractor (`nodeBy`). The curtain is
 * down, so the bead behind it is hidden, and Mocha on the park lamp is the best thing on the page:
 * Baokaka crawls over and cuddles him. A light is worth less than Mocha (§ 2.2.1), so first Mocha
 * hides in the crate behind the 店員小哥's drinks stall (C9; his chapter cameo, § 5.3). With
 * nothing better to want, Baokaka follows the spotlight: aim it at the trap door, his weight on
 * the plate raises the curtain, and the bead outranks the light. → *Light is a leash.*
 * The 淘氣: shine the spotlight on the 掃地阿伯 asleep up in the wings.
 *
 * ```
 *   lamp ─jump─ crate (box)                       wings (阿伯, the spot's 'nap')
 *   L1 ── L2 ── S1 ── S2 ── S3 ── S4 (bead, behind the curtain)
 *                      │
 *                      T (trap-door plate → curtain up)
 *   spot: lawn → L2 · trap → T · stage → S3 · nap → wings
 * ```
 */
export default definePage({
  id: 'c2p2', chapter: 2, index: 2, title: '露天音樂台', difficulty: 2, backdrop: 'c2/bandshell',
  nodes: [
    // The lawn in front of the bandshell, then the stage and backstage
    { id: 'L1', x: 36, y: 490, height: 0 }, { id: 'L2', x: 96, y: 490, height: 0 },
    { id: 'S1', x: 156, y: 444, height: 0 }, { id: 'S2', x: 216, y: 444, height: 0 },
    { id: 'S3', x: 276, y: 444, height: 0 }, { id: 'S4', x: 340, y: 444, height: 0 },
    // The trap-door plate at the stage's front edge, below S2
    { id: 'T', x: 222, y: 496, height: 0, attach: { part: 'plate', pos: { up: [222, 496], down: [222, 496] } } },
    // Up in the wings, where the 掃地阿伯 naps: the spotlight can find him, Baokaka can't
    { id: 'wings', x: 330, y: 250, height: 1 },
    // Mocha's perches: the park lamp, the drinks stall's crate
    { id: 'lampTop', x: 44, y: 300, height: 2 }, { id: 'crateTop', x: 186, y: 372, height: 1 },
  ],
  edges: [
    { a: 'L1', b: 'L2', kind: 'crawl' }, { a: 'L2', b: 'S1', kind: 'crawl' }, { a: 'S1', b: 'S2', kind: 'crawl' },
    { a: 'S2', b: 'S3', kind: 'crawl' }, { a: 'S3', b: 'S4', kind: 'crawl' }, { a: 'S2', b: 'T', kind: 'crawl' },
    { a: 'lampTop', b: 'crateTop', kind: 'jump' },
  ],
  parts: [
    // The spotlight on its stand at the lawn's edge: turn it to aim the pool of light
    { id: 'spot', preset: 'wheel', states: ['lawn', 'trap', 'stage', 'nap'], initial: 'lawn', input: 'drag-rotary',
      center: [176, 540], radius: 30, hit: { cx: 176, cy: 540, r: 30 }, art: 'c2/spotlight' },
    { id: 'plate', preset: 'button', hit: { x: 194, y: 470, w: 56, h: 56 }, art: 'c2/plate' },
    // The stage curtain rises on the plate's press and stays up (event-driven: nothing to tap)
    { id: 'curtain', preset: 'lift', states: ['down', 'up'], hit: { x: 300, y: 300, w: 84, h: 160 },
      react: [{ on: { type: 'partEnter', id: 'plate', state: 'down' }, to: 'up' }], art: 'c2/curtain' },
  ],
  perches: [
    { id: 'lamp', node: 'lampTop', reachNode: 'L1' },
    // The 店員小哥's crate: Mocha curls up inside and is out of sight (C9)
    { id: 'crate', node: 'crateTop', reachNode: 'L2', hidesMocha: true },
  ],
  creatures: [{ id: 'sweeper', positions: { nap: 'wings' }, initial: 'nap', blocks: false, art: 'c2/sweeper' }],
  attractors: [
    { id: 'glow', kind: 'light', node: 'L2', nodeBy: { part: 'spot', map: { lawn: 'L2', trap: 'T', stage: 'S3', nap: 'wings' } } },
    { id: 'bead', kind: 'shiny', node: 'S4', goal: true, visibleWhen: { part: 'curtain', in: ['up'] } },
  ],
  baby: { start: 'S1', facing: 'l' },
  mocha: { start: 'lamp' },
  mischief: { text: '把聚光燈照在睡覺的掃地阿伯', when: { type: 'partEnter', id: 'spot', when: { part: 'spot', in: ['nap'] } } },
  // In the back row of the bandshell, seen only in the spotlight
  tudigong: { x: 250, y: 330, visibleWhen: { part: 'spot', in: ['stage'] }, hat: '斗笠' },
  solution: [{ mocha: 'crate' }, { set: 'spot', to: 'trap' }, { wait: 'goal' }],
  lines: {
    // The 店員小哥's chapter cameo (§ 5.3): Mocha climbs into his crate
    onEvent: [
      { when: { type: 'catArrive', id: 'crate' }, line: 'c2p2.clerk.1' },
      { when: { type: 'catArrive', id: 'crate' }, line: 'c2p2.clerk.2' },
      { when: { type: 'catArrive', id: 'crate' }, line: 'c2p2.clerk.3' },
    ],
  },
});
