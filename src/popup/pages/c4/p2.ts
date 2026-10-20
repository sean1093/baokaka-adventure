import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 4-2 「紅樓」 · difficulty 3 · par 3. 西門紅樓, the octagonal red-brick house, is an
 * 8-step **wheel** in the middle of the page, with three doorways round its eight faces and a little
 * lantern window in its roof. He crawls straight through it — but only when two doorways line up,
 * one facing the west plaza and one the east (states 2 and 6: faces 0 and 4 are opposite; face 3 is
 * a third doorway that never lines up with another). On the east side the bead sits in a shop behind
 * a rolled-down shutter, whose button is under a hanging lantern.
 *
 * Turn the house until the roof window faces the street lamp (state 4): Mocha jumps across, squeezes
 * through the window and out along the east eave, and knocks the lantern down onto the button — the
 * shutter rolls up. Turn the house again until the doorways line up, and he crawls through to the
 * bead. The 淘氣: spin 紅樓 a whole turn (eight steps) with Mocha sitting in the roof window.
 *
 * ```
 *   lamp (Mocha) ─jump (tower 4)─ window ─squeeze─ eave (pushes the lantern onto the button)
 *   W1 ── W2 ══(紅樓: doorways aligned, tower 2 or 6)══ E1 ── S (shutter) ── E2 (bead)
 * ```
 */
const TOWER = ['0', '1', '2', '3', '4', '5', '6', '7'];

export default definePage({
  id: 'c4p2', chapter: 4, index: 2, title: '紅樓', difficulty: 3, backdrop: 'c4/red-house',
  nodes: [
    // The west plaza
    { id: 'W1', x: 30, y: 486, height: 0 }, { id: 'W2', x: 84, y: 486, height: 0 },
    // The east side: the porch, the shop's shutter, the shop
    { id: 'E1', x: 268, y: 486, height: 0 },
    { id: 'S', x: 318, y: 486, height: 0, attach: { part: 'shutter', pos: { closed: [318, 486], open: [318, 486] } } },
    { id: 'E2', x: 364, y: 486, height: 0 },
    { id: 'btnSpot', x: 326, y: 398, height: 1 },     // unconnected: the shutter's button, where the lantern lands
    // Mocha's perches: the street lamp, the roof's lantern window, the east eave
    { id: 'lampTop', x: 34, y: 250, height: 2 }, { id: 'windowTop', x: 176, y: 196, height: 2 },
    { id: 'eaveTop', x: 262, y: 300, height: 2 },
  ],
  edges: [
    { a: 'W1', b: 'W2', kind: 'crawl' },
    // Through 紅樓: a doorway facing each way at once
    { a: 'W2', b: 'E1', kind: 'crawl', when: { part: 'tower', in: ['2', '6'] } },
    { a: 'E1', b: 'S', kind: 'crawl' }, { a: 'S', b: 'E2', kind: 'crawl' },
    // The roof window faces the lamp only in state 4
    { a: 'lampTop', b: 'windowTop', kind: 'jump', when: { part: 'tower', in: ['4'] } },
    { a: 'windowTop', b: 'eaveTop', kind: 'squeeze' },
  ],
  parts: [
    // 紅樓: turn it by its octagonal rim (a step a tap)
    { id: 'tower', preset: 'wheel', states: TOWER, initial: '0', center: [176, 380], radius: 74,
      hit: { cx: 176, cy: 380, r: 74 }, art: 'c4/red-house' },
    // The lantern on the east eave: Mocha knocks it down onto the shutter's button
    { id: 'lantern', preset: 'pushable', hit: { x: 262, y: 298, w: 56, h: 56 },
      fall: { path: [[290, 326], [312, 360], [326, 398]], fallTo: 'btnSpot', landSets: { part: 'button', to: 'down' } }, art: 'c4/lantern' },
    // The shutter's button: the landed lantern holds it down
    { id: 'button', preset: 'button', hit: { x: 298, y: 370, w: 56, h: 56 }, art: 'c4/shutter-button' },
    // The shop's shutter: rolls up on the button's press and stays up
    { id: 'shutter', preset: 'gate', hit: { x: 290, y: 400, w: 56, h: 100 },
      react: [{ on: { type: 'partEnter', id: 'button', state: 'down' }, to: 'open' }], art: 'c4/shutter' },
  ],
  perches: [
    { id: 'lamp', node: 'lampTop', reachNode: 'W1' },
    { id: 'window', node: 'windowTop', reachNode: 'W2' },
    { id: 'eave', node: 'eaveTop', reachNode: 'E1', push: 'lantern' },
  ],
  creatures: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'E2', goal: true }],
  baby: { start: 'W1', facing: 'r' },
  mocha: { start: 'lamp' },
  mischief: {
    text: '讓摩卡坐在屋頂上，把紅樓轉一整圈',
    when: { type: 'partEnter', id: 'tower', count: 8, when: { mochaAt: 'window' } },
  },
  // A fortune-teller in the third doorway, seen when it turns to the front
  tudigong: { x: 176, y: 420, visibleWhen: { part: 'tower', in: ['5'] }, hat: '算命墨鏡' },
  solution: [{ set: 'tower', to: '4' }, { mocha: 'eave' }, { wait: 'settle' }, { set: 'tower', to: '6' }, { wait: 'goal' }],
});
