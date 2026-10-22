import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 9-2 「淡水老街」 (淡水's old street before the shops open) · difficulty 4 · par 4.
 * Two shopfronts along the lane, each with its rolling shutter (a **flap**): the 阿給 shop (near end)
 * and the 阿婆鐵蛋 shop (far end). The lane climbs a step up (a climb)
 * to the 鐵蛋 shop, where the 阿婆 dozes at her counter — too high for him (a grown-up's step:
 * `cruise`, 扶著站 is 9-3's). The 背包客 sits in the middle of the lane on his backpack, reading his
 * map. What he sees is what the shutters let him see: the 阿給 shop's shutter is up, and its 招財貓 in
 * the window glints (a **decoy**, seen from in front of the shop only); the bead is on the 鐵蛋
 * counter behind its shutter (seen at the shop, once that shutter is up).
 *
 * Mocha sits on the 鐵蛋 shop's signboard from the start (#137: the walk to him is the page, so there is
 * no opening hop): Baokaka sets off at once, but passing the 阿給 shop he sees the 招財貓 and reaches
 * for it. Pull its shutter down (or
 * 不要！): he turns back to Mocha, and the 背包客 is in the way. 掰掰: he waves back and gets up (「Excuse me… where is 101?」, Mocha: 「你從淡水走過去？……加油。」),
 * and Baokaka climbs up to the 鐵蛋 shop under Mocha. Open its shutter: the bead on the counter, out
 * of reach. 抱抱: the 阿婆 wakes and lifts him up (「來，阿婆抱你看鐵蛋。」). The 淘氣: both shutters up
 * at once.
 *
 * ```
 *                                                                     sign (Mocha, over the 鐵蛋 shop)
 *          招財貓 (decoy, behind shutter A; seen from X2–X4)
 *   X1 (start) ── X2 ── X3 ── X4 (背包客: 掰掰) ═climb═ X5 ── X6 (阿婆) ═(counter: cruise)═ C (bead, behind shutter B)
 *   granny: X6 → C (抱抱)
 * ```
 */
const UP = (shutter: string) => ({ part: shutter, in: ['open'] });
const AT = (...ids: string[]) => ({ any: ids.map((id) => ({ babyAt: id })) });
const ALL_UP = { all: [UP('shutterA'), UP('shutterB')] };

export default definePage({
  id: 'c9p2', chapter: 9, index: 2, title: '淡水老街', difficulty: 4, backdrop: 'c9/old-street',
  nodes: [
    // The lane, from the 阿給 shop up to the 鐵蛋 shop
    { id: 'X1', x: 36, y: 486, height: 0 }, { id: 'X2', x: 92, y: 486, height: 0 },
    { id: 'X3', x: 148, y: 486, height: 0 }, { id: 'X4', x: 204, y: 486, height: 0 },
    { id: 'X5', x: 260, y: 464, height: 1 }, { id: 'X6', x: 314, y: 464, height: 1 },
    // The 鐵蛋 shop's counter
    { id: 'C', x: 362, y: 420, height: 1 },
    // Unconnected: the 招財貓 in the 阿給 shop's window; the bench the 背包客 moves to
    { id: 'catAt', x: 170, y: 360, height: 2 }, { id: 'packBench', x: 196, y: 432, height: 0 },
    // Mocha's perch: the 鐵蛋 shop's signboard (the lane's iron lamp at the near end is scenery since #137)
    { id: 'signTop', x: 262, y: 352, height: 2 },
  ],
  edges: [
    { a: 'X1', b: 'X2', kind: 'crawl' }, { a: 'X2', b: 'X3', kind: 'crawl' }, { a: 'X3', b: 'X4', kind: 'crawl' },
    { a: 'X4', b: 'X5', kind: 'climb' }, { a: 'X5', b: 'X6', kind: 'crawl' },
    // Up onto the 鐵蛋 counter: a grown-up's step
    { a: 'X6', b: 'C', kind: 'cruise' },
  ],
  parts: [
    // The shops' rolling shutters: the 阿給 shop's starts up, the 鐵蛋 shop's down
    { id: 'shutterA', preset: 'flap', initial: 'open', hit: { x: 150, y: 300, w: 56, h: 56 }, art: 'c9/shutter' },
    { id: 'shutterB', preset: 'flap', hit: { x: 334, y: 340, w: 56, h: 56 }, art: 'c9/shutter' },
    // The 阿婆 dozing at her 鐵蛋 counter: 抱抱, and she lifts him up onto it
    { id: 'granny', preset: 'carrier', route: ['X6', 'C'], hit: { x: 286, y: 360, w: 56, h: 104 }, art: 'c9/iron-egg-granny' },
  ],
  perches: [{ id: 'sign', node: 'signTop', reachNode: 'X6' }],
  creatures: [
    // The 背包客 sitting on his backpack in the lane, reading his map: 掰掰, and he gets up onto the bench
    { id: 'backpacker', positions: { lane: 'X4', bench: 'packBench' }, initial: 'lane',
      react: [{ on: 'wave', to: 'bench' }], art: 'c1/backpacker' },
  ],
  attractors: [
    // The 阿給 shop's 招財貓 glinting in its window: a decoy, seen from in front of the shop while its shutter is up
    { id: 'luckyCat', kind: 'shiny', node: 'catAt', decoy: true, art: 'c9/lucky-cat', visibleWhen: { all: [UP('shutterA'), AT('X2', 'X3', 'X4')] } },
    // The bead on the 鐵蛋 counter, seen at the shop once its shutter is up
    { id: 'bead', kind: 'shiny', node: 'C', goal: true, visibleWhen: { all: [UP('shutterB'), AT('X5', 'X6', 'C')] } },
  ],
  baby: { start: 'X1', facing: 'r' },
  mocha: { start: 'sign' },
  mischief: { text: '兩家店的鐵門同時打開', when: { type: 'partEnter', when: ALL_UP } },
  // On the bench beside the 背包客, reading his map with him, once he has moved
  tudigong: { x: 160, y: 420, visibleWhen: { creature: 'backpacker', at: 'bench' }, hat: '船長帽' },
  solution: [
    { wait: 'settle' }, { tap: 'shutterA' }, { wait: 'settle' }, { say: 'bye' }, { wait: 'settle' },
    { tap: 'shutterB' }, { wait: 'settle' }, { say: 'hug' }, { wait: 'goal' },
  ],
  lines: {
    onEvent: [
      // The 背包客 gets up: his question (§ 5.3, 9-2), and Mocha's translation
      { when: { type: 'wave', when: { creature: 'backpacker', at: 'bench' } }, line: 'c9p2.pack.1' },
      { when: { type: 'wave', when: { creature: 'backpacker', at: 'bench' } }, line: 'c9p2.pack.2' },
      // The 阿婆 wakes to 抱抱 and lifts him onto her counter
      { when: { type: 'partEnter', id: 'granny', when: { part: 'granny', in: ['carrying@0'] } }, line: 'c9p2.granny.1' },
    ],
  },
});
