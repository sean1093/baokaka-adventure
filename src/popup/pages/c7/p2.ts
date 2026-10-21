import { definePage, loopAttach } from '../../core/define';

/**
 * GDD § 4.4, page 7-2 「纜車站」 (the 貓空纜車's 動物園 station) · difficulty 3 · par 3. The cable
 * is a **loop** turned by its bullwheel (a crank): two cabins hang on it — the 水晶車廂 with its
 * glass floor, and an ordinary cabin that is the 店員小哥's 「行動分店」. One step of the crank
 * moves each cabin one slot along: the bottom station, up over the zoo, the top station (貓空), and
 * back down. The bead lies on the top station's platform, past the exit turnstile.
 *
 * Baokaka climbs into whichever cabin waits at the bottom station (it's nearer the bead) and rides
 * it up, but the turnstile stays shut: it's the 店員小哥 who opens it, for a customer, when his
 * shop docks at the top. Mocha is the customer — and he won't set paw on a glass floor (C8). So:
 * bring the shop cabin down, Mocha jumps in (the cameo: 「叮咚～歡迎光臨！」「……纜車也是你們的？」
 * 「行動分店。」), and turn it back up: it docks, the 店員小哥 opens the turnstile, and Baokaka crawls
 * through to the bead. Choose the cabin: Baokaka rides the glass one, Mocha the shop. The 淘氣: send
 * the glass cabin round its loop with nobody in it.
 *
 * ```
 *   U2 (bead) ── G (turnstile: opens when the shop docks with Mocha) ── U1 ── s2 (top station)
 *                                         s3 (down) ╱        ╲ s1 (up)
 *   booth (Mocha)  B1 ── B2 ── s0 (bottom station)
 *   cabins on the cable: A (glass, seat 0), shop (seat 2)    cable: 0 … 3 (a crank)
 * ```
 */
const CABLE = ['0', '1', '2', '3'];
/** The cable's slots: the bottom station, up over the zoo, the top station, back down. */
const SLOTS: [number, number][] = [[150, 470], [234, 385], [318, 300], [209, 360]];
/** Mocha's seat on each cabin's roof rail, over the cabin's floor. */
const ROOF: [number, number][] = SLOTS.map(([x, y]) => [x, y - 44]);
const AT = (state: string) => ({ part: 'cable', in: [state] });

export default definePage({
  id: 'c7p2', chapter: 7, index: 2, title: '纜車站', difficulty: 3, backdrop: 'c7/gondola-station',
  nodes: [
    // The bottom station's platform
    { id: 'B1', x: 36, y: 486, height: 0 }, { id: 'B2', x: 96, y: 486, height: 0 },
    // The two cabins on the cable: the glass one (seat 0: at the bottom station) and the shop (seat 2: at the top)
    { id: 'A', x: 150, y: 470, height: 0, attach: loopAttach('cable', CABLE, SLOTS, 0) },
    { id: 'shop', x: 318, y: 300, height: 0, attach: loopAttach('cable', CABLE, SLOTS, 2) },
    // The top station's platform, running back over the valley from where the cabins dock: the
    // turnstile gate, the bead past it
    { id: 'U1', x: 266, y: 300, height: 1 },
    { id: 'G', x: 220, y: 300, height: 1, attach: { part: 'gate', pos: { closed: [220, 300], open: [220, 300] } } },
    { id: 'U2', x: 172, y: 300, height: 1 },
    // Mocha's perches: the ticket booth's roof, each cabin's roof rail (the glass cabin's is glass: C8)
    { id: 'boothTop', x: 60, y: 392, height: 2 },
    { id: 'roofA', x: 150, y: 426, height: 2, tags: ['glass'], attach: loopAttach('cable', CABLE, ROOF, 0) },
    { id: 'roofShop', x: 318, y: 256, height: 2, attach: loopAttach('cable', CABLE, ROOF, 2) },
  ],
  edges: [
    { a: 'B1', b: 'B2', kind: 'crawl' },
    // Into a cabin at the bottom station; out of it at the top
    { a: 'B2', b: 'A', kind: 'crawl', when: AT('0') }, { a: 'B2', b: 'shop', kind: 'crawl', when: AT('2') },
    { a: 'A', b: 'U1', kind: 'crawl', when: AT('2') }, { a: 'shop', b: 'U1', kind: 'crawl', when: AT('0') },
    { a: 'U1', b: 'G', kind: 'crawl' }, { a: 'G', b: 'U2', kind: 'crawl' },
    // Mocha onto a cabin at the bottom station (and back off it)
    { a: 'boothTop', b: 'roofA', kind: 'jump', when: AT('0') }, { a: 'boothTop', b: 'roofShop', kind: 'jump', when: AT('2') },
  ],
  parts: [
    // The bullwheel: drag it round, and the cabins move one slot along per step
    { id: 'cable', preset: 'loop', states: CABLE, input: 'drag-rotary', center: [236, 524], radius: 30,
      hit: { cx: 236, cy: 524, r: 30 }, art: 'c7/bullwheel' },
    // The top station's turnstile: when the shop cabin docks with a customer aboard (Mocha), the
    // 店員小哥 lets him through — it swings open and stays open
    { id: 'gate', preset: 'gate', initial: 'closed', hit: { x: 192, y: 238, w: 56, h: 62 }, art: 'c7/turnstile',
      react: [{ on: { type: 'partEnter', id: 'cable', state: '0' }, when: { mochaAt: 'cabinShop' }, to: 'open' }] },
  ],
  perches: [
    { id: 'booth', node: 'boothTop', reachNode: 'B1' },
    { id: 'cabinA', node: 'roofA', reachNode: 'A' },
    { id: 'cabinShop', node: 'roofShop', reachNode: 'shop' },
  ],
  creatures: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'U2', goal: true }],
  // The cable itself, from the bottom station's bullwheel up to the top station's
  cutouts: [{ art: 'c7/cable', x: 0, y: 0 }],
  baby: { start: 'B1', facing: 'r' },
  mocha: { start: 'booth' },
  // Four turns of the crank with nobody in the glass cabin: round it goes, empty
  mischief: { text: '讓水晶車廂空空的繞一圈', when: { type: 'partEnter', id: 'cable', count: 4, when: { not: { babyAt: 'A' } } } },
  // On the zoo's treetops under the cable, seen while a cabin hangs over them
  tudigong: { x: 330, y: 430, visibleWhen: { part: 'cable', in: ['1', '3'] }, hat: '叢林帽' },
  solution: [
    { wait: 'settle' }, { set: 'cable', to: '2' }, { wait: 'settle' }, { mocha: 'cabinShop' }, { wait: 'settle' },
    { set: 'cable', to: '0' }, { wait: 'goal' },
  ],
  lines: {
    onEvent: [
      // The 店員小哥's chapter 7 cameo (§ 5.3): Mocha jumps into his gondola shop
      { when: { type: 'catArrive', id: 'cabinShop' }, line: 'c7p2.clerk.1' },
      { when: { type: 'catArrive', id: 'cabinShop' }, line: 'c7p2.clerk.2' },
      { when: { type: 'catArrive', id: 'cabinShop' }, line: 'c7p2.clerk.3' },
      // His shop docks at the top: he lets his customer through the turnstile
      { when: { type: 'partEnter', id: 'gate', when: { part: 'gate', in: ['open'] } }, line: 'c7p2.clerk.4' },
    ],
  },
});
