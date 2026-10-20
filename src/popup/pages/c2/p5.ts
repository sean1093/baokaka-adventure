import { definePage } from '../../core/define';

/** Where the lily pad sits per wheel state (clockwise round the pond's centre). */
const PAD: Record<string, [number, number]> = { west: [150, 478], north: [206, 422], east: [262, 478], south: [206, 534] };

/**
 * GDD § 4.4, page 2-5 「生態池」 (the eco-pond) · difficulty 3 · par 3. The bead lies on the far shore.
 * A great lily pad turns round the pond like a ferry (a **wheel**: `west`, `north`, `east`,
 * `south`); at `west` Baokaka can crawl on, at `east` off. An egret stands on the pad, blocking it,
 * and stamps in the shallows, so the stepping stone is wet and Mocha won't go near it (C7: 「不要。」)
 * — the stone is where he would scare the egret off. Baokaka's 掰掰 does it instead: the egret
 * waves a wing and flaps off to the reeds. Then turn the pad west, he crawls on, turn it east, he
 * rides across, crawls off and grabs the bead. → *Not every problem needs the cat.*
 * The 淘氣: give the egret four rides on the pad.
 *
 * ```
 *   pavilion ─jump─ stone (wet while the egret is on the pad)
 *   W1 ── W2 ══(pad at west)══ pad ══(pad at east)══ E1 ── E2 (bead)
 *                          (egret)
 * ```
 */
export default definePage({
  id: 'c2p5', chapter: 2, index: 5, title: '生態池', difficulty: 3, backdrop: 'c2/pond',
  nodes: [
    { id: 'W1', x: 36, y: 474, height: 0 }, { id: 'W2', x: 96, y: 474, height: 0 },
    { id: 'pad', x: 0, y: 0, height: 0, attach: { part: 'pads', pos: PAD } },
    { id: 'E1', x: 318, y: 474, height: 0 }, { id: 'E2', x: 362, y: 474, height: 0 },
    { id: 'reeds', x: 354, y: 380, height: 1 },   // unconnected: where the egret flaps off to
    // Mocha's perches: the pavilion's rail, the stepping stone in the pond
    { id: 'pavilionTop', x: 52, y: 330, height: 2 },
    { id: 'stoneTop', x: 112, y: 528, height: 1, tags: ['wet'] },
  ],
  edges: [
    { a: 'W1', b: 'W2', kind: 'crawl' },
    { a: 'W2', b: 'pad', kind: 'crawl', when: { part: 'pads', in: ['west'] } },
    { a: 'pad', b: 'E1', kind: 'crawl', when: { part: 'pads', in: ['east'] } },
    { a: 'E1', b: 'E2', kind: 'crawl' },
    { a: 'pavilionTop', b: 'stoneTop', kind: 'jump' },
  ],
  parts: [
    { id: 'pads', preset: 'wheel', states: ['west', 'north', 'east', 'south'], initial: 'north', input: 'drag-rotary',
      center: [206, 478], radius: 56, hit: { cx: 206, cy: 478, r: 76 }, art: 'c2/lily-pad' },
  ],
  perches: [
    { id: 'pavilion', node: 'pavilionTop', reachNode: 'W1' },
    // Splashed while the egret stamps on the pad beside it (C7)
    { id: 'stone', node: 'stoneTop', reachNode: 'W2', blockedWhen: { creature: 'egret', at: 'pad' } },
  ],
  creatures: [
    { id: 'egret', positions: { pad: 'pad', reeds: 'reeds' }, initial: 'pad',
      fleesFromCat: { nearPerches: ['stone'], to: 'reeds' },
      react: [{ on: 'wave', when: { creature: 'egret', at: 'pad' }, to: 'reeds' }], art: 'c2/egret' },
  ],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'E2', goal: true }],
  baby: { start: 'W1', facing: 'r' },
  mocha: { start: 'pavilion' },
  mischief: { text: '讓白鷺鷥坐著蓮葉轉四次', when: { type: 'partEnter', id: 'pads', count: 4, when: { creature: 'egret', at: 'pad' } } },
  // Fishing under the far lilies, seen when the pad swings to the front
  tudigong: { x: 150, y: 540, visibleWhen: { part: 'pads', in: ['south'] }, hat: '斗笠' },
  solution: [{ wait: 'settle' }, { say: 'bye' }, { set: 'pads', to: 'west' }, { wait: 'settle' }, { set: 'pads', to: 'east' }, { wait: 'goal' }],
});
