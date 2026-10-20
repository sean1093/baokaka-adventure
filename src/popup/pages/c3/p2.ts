import { definePage } from '../../core/define';

/** The 店員小哥's delivery bike (the middle one) per state: across the path, or parked in the rack, */
const BIKE_B: Record<string, [number, number]> = { path: [190, 434], rack: [190, 384] };

/**
 * GDD § 4.4, page 3-2 「椰林大道」 · difficulty 3 · par 3. The landmark's signature mechanism: three
 * parked bikes between the palm trees, packed so tight that they shove each other. The bead lies
 * at the avenue's far end; the outer two bikes (`bikeA`, `bikeC`, sliders with a handlebar to pull)
 * stand across the path. Slide one back into the rack and it shoves the middle bike — the 店員小哥's
 * delivery bike, which has nothing to pull — out across the path instead. Mocha on its seat holds
 * it: shoved bikes don't budge under a cat, and as he lands his weight rolls it back into the rack
 * (`set`). His arrival is the chapter's 店員小哥 cameo. → *Sometimes Mocha's job is to stay still.*
 * The 淘氣: ring the delivery bike's bell five times — tap Mocha on the seat and he paws it (each
 * tap repeats his perch action).
 *
 * ```
 *   palm (Mocha) ─jump─ seat (on bikeB: holds it, rolls it back)
 *   S0 ══(bikeA rack)══ N1 ══(bikeB rack)══ N2 ══(bikeC rack)══ G (bead)
 * ```
 */
export default definePage({
  id: 'c3p2', chapter: 3, index: 2, title: '椰林大道', difficulty: 3, backdrop: 'c3/palm-avenue',
  nodes: [
    { id: 'S0', x: 36, y: 484, height: 0 }, { id: 'N1', x: 136, y: 484, height: 0 },
    { id: 'N2', x: 244, y: 484, height: 0 }, { id: 'G', x: 350, y: 484, height: 0 },
    // Mocha's perches: the top of a palm tree, the delivery bike's seat (it moves with the bike)
    { id: 'palmTop', x: 60, y: 250, height: 2 },
    { id: 'seatTop', x: 0, y: 0, height: 1, attach: { part: 'bikeB', pos: BIKE_B } },
  ],
  edges: [
    { a: 'S0', b: 'N1', kind: 'crawl', when: { part: 'bikeA', in: ['rack'] } },
    { a: 'N1', b: 'N2', kind: 'crawl', when: { part: 'bikeB', in: ['rack'] } },
    { a: 'N2', b: 'G', kind: 'crawl', when: { part: 'bikeC', in: ['rack'] } },
    { a: 'palmTop', b: 'seatTop', kind: 'jump' },
  ],
  parts: [
    // The outer bikes: pull them back into the rack by the handlebars
    { id: 'bikeA', preset: 'slider', states: ['path', 'rack'], initial: 'path', input: 'drag-linear',
      track: { from: [86, 500], to: [86, 420] }, hit: { x: 58, y: 404, w: 56, h: 112 }, art: 'c3/bike' },
    // The middle bike, the 店員小哥's: nothing to pull; its neighbours shove it out unless Mocha sits on it
    { id: 'bikeB', preset: 'slider', states: ['path', 'rack'], initial: 'rack', input: 'none',
      track: { from: [190, 500], to: [190, 420] }, hit: { x: 162, y: 404, w: 56, h: 112 }, art: 'c3/delivery-bike',
      react: [
        { on: { type: 'partEnter', id: 'bikeA', state: 'rack' }, when: { not: { mochaAt: 'seat' } }, to: 'path' },
        { on: { type: 'partEnter', id: 'bikeC', state: 'rack' }, when: { not: { mochaAt: 'seat' } }, to: 'path' },
      ] },
    { id: 'bikeC', preset: 'slider', states: ['path', 'rack'], initial: 'path', input: 'drag-linear',
      track: { from: [296, 500], to: [296, 420] }, hit: { x: 268, y: 404, w: 56, h: 112 }, art: 'c3/bike' },
  ],
  perches: [
    { id: 'palm', node: 'palmTop', reachNode: 'S0' },
    // On the delivery bike's seat: shoves can't move it, and his weight rolls it back into the rack
    { id: 'seat', node: 'seatTop', reachNode: 'N1', onPart: 'bikeB', set: { part: 'bikeB', to: 'rack' } },
  ],
  creatures: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'G', goal: true }],
  baby: { start: 'S0', facing: 'r' },
  mocha: { start: 'palm' },
  // His landing and every tap on him (the perch's `set` again) ring the delivery bike's bell
  mischief: { text: '讓摩卡按五次腳踏車的鈴', when: { type: 'partEnter', id: 'bikeB', count: 5, when: { mochaAt: 'seat' } } },
  // Behind the palm where the delivery bike was parked: seen when it is shoved out
  tudigong: { x: 214, y: 330, visibleWhen: { part: 'bikeB', in: ['path'] }, hat: '藍色校工帽' },
  solution: [{ mocha: 'seat' }, { wait: 'settle' }, { set: 'bikeA', to: 'rack' }, { set: 'bikeC', to: 'rack' }, { wait: 'goal' }],
  lines: {
    // The 店員小哥's chapter cameo (§ 5.3): Mocha sits on his delivery bike
    onEvent: [
      { when: { type: 'catArrive', id: 'seat' }, line: 'c3p2.clerk.1' },
      { when: { type: 'catArrive', id: 'seat' }, line: 'c3p2.clerk.2' },
      { when: { type: 'catArrive', id: 'seat' }, line: 'c3p2.clerk.3' },
    ],
  },
});
