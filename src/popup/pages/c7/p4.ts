import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 7-4 「水晶車廂」 (inside the glass-floored gondola) · difficulty 3 · par 3. The
 * cabin has a bench at each end, one step up from its glass floor; the right one is a folding seat,
 * folded up (a **flap**: tap it down), with a luggage rack one step over it. Under the glass, far
 * below, the night: three clouds drift under the floor (**flaps**: tap one to blow it aside, and
 * back), each over something on the ground — the zoo's floodlit path, whose light shines up through
 * the gap into a pool on the glass; the tea farm's little shrine, where the 土地公 sits; and a tea
 * house's 黑糖珍奶 on its terrace (a snack he can only reach down for).
 *
 * Mocha stays on the bench, curled in his travel basket (C9): he won't look at a glass floor, let
 * alone stand on one (C8). Baokaka climbs down into the pool of light and sits in it. Blow the right
 * cloud aside: the 珍奶 far below draws him to the right end of the glass, reaching down. The cabin
 * is dark: 哇！ there, under the reading lamp, and it comes on — the glass turns into a mirror (the
 * ground below is gone) and the bead glints on the rack, out of reach with the seat folded. Tap the
 * seat down, and he climbs the seat and the rack. The 淘氣: blow every cloud aside — Mocha looks down
 * over the basket's rim, and loafs in protest.
 *
 * ```
 *   basket (Mocha, hidden: he stays there)            lamp (哇！ from the right end)   K (rack: bead, seen with the lamp on)
 *   L (left bench) ═climb═ F1 (pool of light) ── F2 ── F3 (the glass floor) ═(seat down: climb)═ R ═climb═ K
 *   (far below)          cloudL: the zoo's path   cloudM: the shrine   cloudR: 珍奶
 * ```
 */
const OPEN = (part: string) => ({ part, in: ['open'] });
/** With the cabin lamp on, the glass floor is a mirror: nothing below shows. */
const DARK = { part: 'lamp', in: ['off'] };
const BELOW = (cloud: string) => ({ all: [OPEN(cloud), DARK] });
const ALL_OPEN = { all: [OPEN('cloudL'), OPEN('cloudM'), OPEN('cloudR')] };

export default definePage({
  id: 'c7p4', chapter: 7, index: 4, title: '水晶車廂', difficulty: 3, backdrop: 'c7/crystal-cabin',
  nodes: [
    // The left bench, the glass floor, the right folding seat and the luggage rack over it
    { id: 'L', x: 52, y: 418, height: 1 },
    { id: 'F1', x: 118, y: 440, height: 0, tags: ['glass'] }, { id: 'F2', x: 194, y: 440, height: 0, tags: ['glass'] },
    { id: 'F3', x: 270, y: 440, height: 0, tags: ['glass'] },
    { id: 'R', x: 330, y: 418, height: 1 }, { id: 'K', x: 362, y: 396, height: 1 },
    // Unconnected: the tea house far below the glass
    { id: 'teaHouse', x: 286, y: 546, height: 0 },
    // Mocha's perch: his travel basket on the left bench
    { id: 'basketTop', x: 30, y: 390, height: 1 },
  ],
  edges: [
    { a: 'L', b: 'F1', kind: 'climb' }, { a: 'F1', b: 'F2', kind: 'crawl' }, { a: 'F2', b: 'F3', kind: 'crawl' },
    // Up onto the folding seat once it's down, then up onto the rack
    { a: 'F3', b: 'R', kind: 'climb', when: OPEN('seat') }, { a: 'R', b: 'K', kind: 'climb' },
  ],
  parts: [
    // Three clouds under the glass floor: tap one to blow it aside (and back)
    { id: 'cloudL', preset: 'flap', initial: 'open', hit: { x: 90, y: 500, w: 56, h: 56 }, art: 'c7/cloud' },
    { id: 'cloudM', preset: 'flap', hit: { x: 166, y: 500, w: 56, h: 56 }, art: 'c7/cloud' },
    { id: 'cloudR', preset: 'flap', hit: { x: 258, y: 500, w: 56, h: 56 }, art: 'c7/cloud' },
    // The right bench's folding seat: tap it down (and up)
    { id: 'seat', preset: 'flap', hit: { x: 302, y: 406, w: 56, h: 56 }, art: 'c7/folding-seat' },
    // The reading lamp over the right bench: 哇！ (from the right end of the cabin) switches it
    { id: 'lamp', preset: 'light', hit: { x: 312, y: 290, w: 56, h: 56 }, art: 'c7/cabin-lamp',
      react: [{ on: 'wow', to: 'toggle' }] },
  ],
  perches: [
    // His travel basket: in it, he's out of sight (C9), and he stays there
    { id: 'basket', node: 'basketTop', reachNode: 'L', hidesMocha: true },
  ],
  creatures: [],
  attractors: [
    // The zoo's floodlight, shining up through the left cloud's gap into a pool on the glass
    { id: 'pool', kind: 'light', node: 'F1', visibleWhen: BELOW('cloudL') },
    // A tea house's 黑糖珍奶 far below: he can only reach down for it
    { id: 'milkTea', kind: 'snack', node: 'teaHouse', visibleWhen: BELOW('cloudR') },
    // The bead on the luggage rack, seen once the lamp is on
    { id: 'bead', kind: 'shiny', node: 'K', goal: true, visibleWhen: { part: 'lamp', in: ['on'] } },
  ],
  // The glass floor turns into a mirror while the reading lamp is on (#126: pure art)
  cutouts: [{ art: 'c7/glass-mirror', x: 0, y: 0, visibleWhen: { part: 'lamp', in: ['on'] } }],
  baby: { start: 'L', facing: 'r' },
  mocha: { start: 'basket' },
  mischief: { text: '把雲全部吹開，讓摩卡往下看', when: { type: 'partEnter', when: ALL_OPEN } },
  // At the tea farm's little shrine far below, seen through the middle cloud
  tudigong: { x: 194, y: 532, visibleWhen: BELOW('cloudM'), hat: '叢林帽' },
  solution: [{ tap: 'cloudR' }, { wait: 'settle' }, { say: 'wow' }, { tap: 'seat' }, { wait: 'goal' }],
  lines: {
    // Every cloud aside: Mocha looks down over the basket's rim, and loafs in protest
    onEvent: [{ when: { type: 'partEnter', when: ALL_OPEN }, line: 'c7p4.mocha.1' }],
  },
});
