import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 7-5 「大茶壺」 (a giant teapot over a pool of tea, at the tea house) · difficulty 4 ·
 * par 4. The teapot hangs over the pool on its stand: turn it (a 3-step **wheel**) and it tilts and
 * pours, or rights itself and the tea drains through the strainer — the pool's level (`tea`, a
 * **lift** that follows the teapot) is low, half or full. Two teacups float on it (nodes riding the
 * level); the big 茶海 cup between them is too heavy to float and sits on the bottom.
 *
 * Every step between levels is 22 units: a climb. Full, the floating cups are level with the left
 * bank and one step under the right terrace; half full, one step under the bank and one step over
 * the big cup; drained, they sit on the bottom beside it. So Baokaka crosses at half (bank → cup →
 * big cup → cup, three climbs) and steps up onto the terrace only when it's full. Mocha hops across
 * on the cups' handles, but they're wet whenever the cups float (C7): only when the pool is drained.
 *
 * Mocha starts on the tea tray by the bank, and Baokaka cuddles him there. Drain the pool; Mocha
 * hops across to the tea tins on the terrace; tilt the teapot half way, and Baokaka climbs down
 * into the cups after him; fill it, and his cup lifts him to the terrace, where the bead shows
 * among the tins. The 淘氣: fill the pool with Mocha watching from the tray (「……」).
 *
 * ```
 *   tray (Mocha) ─jump─ handle1 ─jump─ handle3 ─jump─ tins (Mocha, on the terrace)   (handles: wet unless drained)
 *                                                       C3 ═(full: climb)═ R1 ── R2 (bead, seen from the terrace)
 *   LA ── LB ═(full: crawl · half: climb)═ C1 ═(drained: crawl · half: climb)═ C2 (big cup) ═ C3
 *   teapot: 0 upright (drained) · 1 tilted (half) · 2 pouring (full)
 * ```
 */
const LEVEL = (...states: string[]) => ({ part: 'tea', in: states });
/** A floating cup's height per level. */
const FLOAT = (x: number) => ({ part: 'tea', pos: { low: [x, 486] as [number, number], mid: [x, 464] as [number, number], high: [x, 442] as [number, number] } });
const HANDLE = (x: number) => ({ part: 'tea', pos: { low: [x, 456] as [number, number], mid: [x, 434] as [number, number], high: [x, 412] as [number, number] } });
const ON_TERRACE = { any: [{ babyAt: 'R1' }, { babyAt: 'R2' }] };

export default definePage({
  id: 'c7p5', chapter: 7, index: 5, title: '大茶壺', difficulty: 4, backdrop: 'c7/giant-teapot',
  nodes: [
    // The left bank
    { id: 'LA', x: 34, y: 442, height: 1 }, { id: 'LB', x: 88, y: 442, height: 1 },
    // The pool: two floating cups and the big cup on the bottom between them
    { id: 'C1', x: 142, y: 442, height: 1, attach: FLOAT(142) },
    { id: 'C2', x: 204, y: 486, height: 0 },
    { id: 'C3', x: 266, y: 442, height: 1, attach: FLOAT(266) },
    // The right terrace, a step over the full pool
    { id: 'R1', x: 318, y: 420, height: 1 }, { id: 'R2', x: 366, y: 420, height: 1 },
    // Mocha's perches: the tea tray on the bank, the cups' handles, the tea tins on the terrace
    { id: 'trayTop', x: 56, y: 384, height: 2 },
    { id: 'handle1', x: 164, y: 412, height: 2, tags: ['wet'], attach: HANDLE(164) },
    { id: 'handle3', x: 288, y: 412, height: 2, tags: ['wet'], attach: HANDLE(288) },
    { id: 'tinsTop', x: 352, y: 352, height: 2 },
  ],
  edges: [
    { a: 'LA', b: 'LB', kind: 'crawl' },
    // Bank ↔ cup: level when full, a step down when half full, too deep when drained
    { a: 'LB', b: 'C1', kind: 'crawl', when: LEVEL('high') }, { a: 'LB', b: 'C1', kind: 'climb', when: LEVEL('mid') },
    // Cup ↔ big cup: level when drained, a step when half full, too high when full
    { a: 'C1', b: 'C2', kind: 'crawl', when: LEVEL('low') }, { a: 'C1', b: 'C2', kind: 'climb', when: LEVEL('mid') },
    { a: 'C2', b: 'C3', kind: 'crawl', when: LEVEL('low') }, { a: 'C2', b: 'C3', kind: 'climb', when: LEVEL('mid') },
    // Cup → terrace: a step up when full
    { a: 'C3', b: 'R1', kind: 'climb', when: LEVEL('high') },
    { a: 'R1', b: 'R2', kind: 'crawl' },
    { a: 'trayTop', b: 'handle1', kind: 'jump' }, { a: 'handle1', b: 'handle3', kind: 'jump' },
    { a: 'handle3', b: 'tinsTop', kind: 'jump' },
  ],
  parts: [
    // The giant teapot: turn it to tilt and pour (0 upright, 1 tilted, 2 pouring)
    { id: 'teapot', preset: 'wheel', states: ['0', '1', '2'], initial: '2', center: [204, 300], radius: 44,
      hit: { cx: 204, cy: 300, r: 44 }, art: 'c7/teapot' },
    // The pool's level follows the teapot: drained, half, full
    { id: 'tea', preset: 'lift', states: ['low', 'mid', 'high'], initial: 'high', hit: { x: 120, y: 446, w: 168, h: 60 }, art: 'c7/tea-pool',
      react: [
        { on: { type: 'partEnter', id: 'teapot', state: '0' }, to: 'low' },
        { on: { type: 'partEnter', id: 'teapot', state: '1' }, to: 'mid' },
        { on: { type: 'partEnter', id: 'teapot', state: '2' }, to: 'high' },
      ] },
  ],
  perches: [
    { id: 'tray', node: 'trayTop', reachNode: 'LA' },
    // The floating cups' handles: wet unless the pool is drained (C7)
    { id: 'handle1', node: 'handle1', reachNode: 'C1', blockedWhen: LEVEL('mid', 'high') },
    { id: 'handle3', node: 'handle3', reachNode: 'C3', blockedWhen: LEVEL('mid', 'high') },
    { id: 'tins', node: 'tinsTop', reachNode: 'R2' },
  ],
  creatures: [],
  // Among the tea tins on the terrace, seen from up there
  attractors: [{ id: 'bead', kind: 'shiny', node: 'R2', goal: true, visibleWhen: ON_TERRACE }],
  baby: { start: 'LB', facing: 'l' },
  mocha: { start: 'tray' },
  // The pool filled with Mocha watching from the tray: 「……」
  mischief: { text: '讓摩卡看著茶倒滿', when: { type: 'partEnter', id: 'tea', when: { all: [LEVEL('high'), { mochaAt: 'tray' }] } } },
  // Painted on the pool's bottom, seen once it's drained
  tudigong: { x: 236, y: 520, visibleWhen: LEVEL('low'), hat: '叢林帽' },
  solution: [
    { set: 'teapot', to: '0' }, { mocha: 'tins' }, { wait: 'settle' }, { set: 'teapot', to: '1' }, { wait: 'settle' },
    { set: 'teapot', to: '2' }, { wait: 'goal' },
  ],
  lines: {
    onEvent: [{ when: { type: 'partEnter', id: 'tea', when: { all: [LEVEL('high'), { mochaAt: 'tray' }] } }, line: 'c7p5.mocha.1' }],
  },
});
