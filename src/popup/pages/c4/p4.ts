import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 4-4 「夾娃娃機」 · difficulty 3 · par 3. Inside a giant claw machine: Baokaka on the
 * left ledge, the bead on the right one, a pit of plush toys between. The claw hangs over the prize
 * chute on the right (its home). The machine is dark until Mocha sits on the coin slot — the
 * 店員小哥 cameo (「叮咚～歡迎光臨！」) — and then it stays lit. Pull the claw's **tab** over to him and
 * pull the drop **lever**: the claw comes down over the ledge, he crawls in (it's the nearest he can
 * get to the bead), and — the running joke, the claw only ever works for 寶咖咖 — it grabs him, lifts
 * him and carries him home over the chute, where he crawls off to the bead. The 淘氣: send Mocha
 * into the plush pile and drop the claw on him (「……」).
 *
 * Two pull-tabs: the cart the claw hangs from (`clawX`, `x0` … `x2`) and the drop lever (`claw`,
 * `up` / `down`: where the claw is). His weight in the claw (`babyEnter hook`) closes it and lifts
 * it (the lever springs up); lifted with him inside, the cart runs home to `x2`. One way only
 * (his weight → lever → cart), so no reaction cycle.
 *
 * ```
 *          x0 ─── x1 ─── x2 (the claw's tab; home over the chute)
 *          hook (in the claw: in from L2 at x0 while down, out to R1 at x2)
 *   L1 ── L2 ┘       [plush pile: Mocha]       └── R1 ── R2 (bead)
 *   stool (Mocha) ─jump─ coin slot ─squeeze─ pile
 * ```
 */
export default definePage({
  id: 'c4p4', chapter: 4, index: 4, title: '夾娃娃機', difficulty: 3, backdrop: 'c4/claw-machine',
  nodes: [
    { id: 'L1', x: 34, y: 480, height: 0 }, { id: 'L2', x: 94, y: 480, height: 0 },
    // In the claw: it hangs from the cart, so it moves with the tab
    { id: 'hook', x: 290, y: 430, height: 1, attach: { part: 'clawX', pos: { x0: [140, 430], x1: [214, 430], x2: [290, 430] } } },
    { id: 'R1', x: 318, y: 480, height: 0 }, { id: 'R2', x: 366, y: 480, height: 0 },
    // Mocha's perches: a stool by the machine, the coin slot (right panel), the plush pile inside
    { id: 'stoolTop', x: 40, y: 396, height: 1 }, { id: 'coinTop', x: 352, y: 300, height: 2 },
    { id: 'pileTop', x: 214, y: 488, height: 1 },
  ],
  edges: [
    { a: 'L1', b: 'L2', kind: 'crawl' },
    { a: 'L2', b: 'hook', kind: 'crawl', when: { all: [{ part: 'clawX', in: ['x0'] }, { part: 'claw', in: ['down'] }] } },
    { a: 'hook', b: 'R1', kind: 'crawl', when: { part: 'clawX', in: ['x2'] } },
    { a: 'R1', b: 'R2', kind: 'crawl' },
    { a: 'stoolTop', b: 'coinTop', kind: 'jump' }, { a: 'coinTop', b: 'pileTop', kind: 'squeeze' },
  ],
  parts: [
    // The coin slot: Mocha's weight is the coin
    { id: 'coin', preset: 'button', hit: { x: 324, y: 296, w: 56, h: 56 }, art: 'c4/coin-slot' },
    // The claw's cart on the gantry: pull it along (only while the machine is on). Lifted with him
    // inside, it runs home over the chute
    { id: 'clawX', preset: 'tab', states: ['x0', 'x1', 'x2'], initial: 'x2', input: 'drag-linear',
      track: { from: [140, 150], to: [290, 150] }, hit: { x: 112, y: 124, w: 206, h: 56 },
      lockedWhen: { not: { part: 'machine', in: ['on'] } },
      react: [{ on: { type: 'partEnter', id: 'claw', state: 'up' }, when: { babyAt: 'hook' }, to: 'x2' }], art: 'c4/claw-cart' },
    // The claw's drop lever, on the pit's front rim (only while the machine is on): pulled down,
    // the claw comes down; his weight in it closes it and lifts it (the lever springs back up)
    { id: 'claw', preset: 'tab', states: ['up', 'down'], initial: 'up', input: 'drag-linear',
      track: { from: [178, 484], to: [178, 532] }, hit: { x: 150, y: 466, w: 56, h: 86 },
      lockedWhen: { not: { part: 'machine', in: ['on'] } },
      react: [{ on: { type: 'babyEnter', id: 'hook' }, to: 'up' }], art: 'c4/drop-lever' },
    // The machine's lights: on with the first coin, and on for good (listed last: the parts above
    // read it in their locks)
    { id: 'machine', preset: 'light', hit: { x: 120, y: 56, w: 200, h: 56 }, art: 'c4/machine-lights',
      react: [{ on: { type: 'partEnter', id: 'coin', state: 'down' }, to: 'on' }] },
  ],
  perches: [
    { id: 'stool', node: 'stoolTop', reachNode: 'L1' },
    // The coin slot, on the machine's right panel by the chute: under it is the bead's side
    { id: 'coinSlot', node: 'coinTop', reachNode: 'R1', onPart: 'coin' },
    { id: 'pile', node: 'pileTop', reachNode: 'L2' },
  ],
  creatures: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'R2', goal: true }],
  baby: { start: 'L1', facing: 'r' },
  mocha: { start: 'stool' },
  mischief: {
    text: '用夾子夾摩卡',
    when: { type: 'partEnter', id: 'claw', when: { all: [{ part: 'claw', in: ['down'] }, { part: 'clawX', in: ['x1'] }, { mochaAt: 'pile' }] } },
  },
  // A plush 土地公 in the pile, seen once the machine lights up
  tudigong: { x: 250, y: 500, visibleWhen: { part: 'machine', in: ['on'] }, hat: '算命墨鏡' },
  solution: [{ mocha: 'coinSlot' }, { wait: 1 }, { set: 'clawX', to: 'x0' }, { set: 'claw', to: 'down' }, { wait: 'goal' }],
  lines: {
    onEvent: [
      // The 店員小哥's chapter 4 cameo (§ 5.3): the coin goes in
      { when: { type: 'catArrive', id: 'coinSlot' }, line: 'c4p4.clerk.1' },
      { when: { type: 'catArrive', id: 'coinSlot' }, line: 'c4p4.clerk.2' },
      { when: { type: 'catArrive', id: 'coinSlot' }, line: 'c4p4.clerk.3' },
      // The running joke: it grabs him
      { when: { type: 'babyEnter', id: 'hook' }, line: 'c4p4.claw.1' },
      // The 淘氣: the claw on Mocha
      {
        when: { type: 'partEnter', id: 'claw', when: { all: [{ part: 'claw', in: ['down'] }, { part: 'clawX', in: ['x1'] }, { mochaAt: 'pile' }] } },
        line: 'c4p4.claw.2',
      },
    ],
  },
});
