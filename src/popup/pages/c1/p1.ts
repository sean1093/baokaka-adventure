import { definePage } from '../../core/define';

/**
 * GDD § 4.3, page 1-1 「月亮線，出發！」 (inside a 板南線 car) · difficulty 1 · par 1. Chapter 1's first
 * page: its card (§ 5.2 ch1) plays before it, then 廣播姊姊's ride announcements open the car. The
 * bead lies under the 博愛座 at the far end, but a backpacker sleeps across the aisle and his huge
 * backpack blocks it: Baokaka crawls up to the backpack and reaches. Mocha hops along the hand
 * straps to the luggage rack above him and pushes the folded map off (C3, a review of 0-3); it lands
 * on the backpacker's face, he wakes — 「Excuse me… where is 101?」, Mocha translates — and pulls
 * his backpack in (`land: map` → `tucked`). The `sway` pull-tab tilts the car: a pure toy, and the
 * 淘氣 when Mocha hangs from a strap while it swings him. Two straps, not § 4.3's three: a chapter's
 * first pages show at most three touchables plus perches (bible § 4.2; D-70).
 */
export default definePage({
  id: 'c1p1', chapter: 1, index: 1, title: '月亮線，出發！', difficulty: 1, backdrop: 'c1/car',
  nodes: [
    { id: 'door', x: 40, y: 470, height: 0 }, { id: 'aisle1', x: 110, y: 470, height: 0 }, { id: 'aisle2', x: 180, y: 470, height: 0 },
    { id: 'aisle3', x: 250, y: 470, height: 0 },     // where the sleeping backpacker's backpack lies across the aisle
    { id: 'priority', x: 330, y: 470, height: 0 },   // under the 博愛座 at the far end
    { id: 'packSeat', x: 268, y: 418, height: 0 },   // unconnected: the backpacker sat up, his backpack on his lap
    { id: 'packFace', x: 250, y: 410, height: 0 },   // unconnected: where the map lands (on his face)
    // Mocha's perches: two hand straps (a cat-jump chain) and the luggage rack above the backpacker
    { id: 'strap1', x: 84, y: 222, height: 2 }, { id: 'strap2', x: 184, y: 214, height: 2 },
    { id: 'rackTop', x: 286, y: 286, height: 1 },
  ],
  edges: [
    { a: 'door', b: 'aisle1', kind: 'crawl' }, { a: 'aisle1', b: 'aisle2', kind: 'crawl' }, { a: 'aisle2', b: 'aisle3', kind: 'crawl' },
    { a: 'aisle3', b: 'priority', kind: 'crawl' },
    { a: 'strap1', b: 'strap2', kind: 'jump' }, { a: 'strap2', b: 'rackTop', kind: 'jump' },
  ],
  parts: [
    // The folded city map on the rack's edge (C3): Mocha pushes it off and it lands on the sleeper's face
    { id: 'map', preset: 'pushable', hit: { cx: 286, cy: 278, r: 28 }, art: 'c1/map',
      fall: { path: [[286, 280], [270, 340], [252, 404]], fallTo: 'packFace' } },
    // The car's sway: a pull-tab that tilts the car left and right (a pure toy; GDD calls it a prop)
    { id: 'sway', preset: 'tab', states: ['left', 'level', 'right'], initial: 'level', input: 'drag-linear',
      track: { from: [96, 610], to: [216, 610] }, hit: { x: 50, y: 584, w: 212, h: 56 }, art: 'c1/sway' },
  ],
  perches: [
    { id: 'strap1', node: 'strap1', reachNode: 'aisle1' },
    { id: 'strap2', node: 'strap2', reachNode: 'aisle2' },
    { id: 'rack', node: 'rackTop', reachNode: 'aisle2', push: 'map' },
  ],
  creatures: [
    // Asleep, his backpack across the aisle; the map on his face wakes him and he tucks it in
    { id: 'backpacker', positions: { sleep: 'aisle3', tucked: 'packSeat' }, initial: 'sleep',
      react: [{ on: { type: 'land', id: 'map' }, to: 'tucked' }], art: 'c1/backpacker' },
  ],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'priority', goal: true }],
  baby: { start: 'door', facing: 'r' },
  mocha: { start: 'strap1' },
  mischief: {
    text: '讓摩卡吊在拉環上盪鞦韆',
    when: {
      type: 'partEnter', id: 'sway',
      when: { all: [{ part: 'sway', in: ['left', 'right'] }, { any: [{ mochaAt: 'strap1' }, { mochaAt: 'strap2' }] }] },
    },
  },
  tudigong: { x: 196, y: 136, hat: '' },   // the 「請讓座」 poster character in the car's advertising frame; always visible
  solution: [{ mocha: 'rack' }, { wait: 'goal' }],
  lines: {
    // 廣播姊姊's ride announcements open the car (GDD § 4.3 notes, § 5.3); the card already said 「下一站，台北車站」
    intro: ['rec.pa.ride.1', 'rec.pa.ride.2'],
    // The map wakes the backpacker: his question, and Mocha's translation (§ 5.2 ch1, § 5.3)
    onEvent: [
      { when: { type: 'land', id: 'map' }, line: 'c1p1.pack.1' },
      { when: { type: 'land', id: 'map' }, line: 'c1p1.pack.2' },
    ],
  },
});
