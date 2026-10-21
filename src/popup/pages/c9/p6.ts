import { definePage, loopAttach } from '../../core/define';

/**
 * GDD § 4.4, page 9-6 「碼頭的聽診器」 · difficulty 5 · par 5 · treasure 聽診器: chapter 9's spread
 * (§ 2.9). 淡水's fishing harbour at first light: the quay on the left, a fishing boat moored on the
 * right with its sail up, and the 聽診器 hanging on its mast. Between them swings the boat's derrick:
 * its boom carries a net basket round a circle (a **loop**, four stops: the quay, up over the water,
 * the boat's deck, down low over the water), and the boom swings only when the wind fills the sail —
 * the sail is a **blowable** (`coupled` to the loop: each 咻—— moves the basket a stop). From the
 * quay the sail is out of his breath's reach; from the basket, wherever it is, it's right ahead of him.
 * On deck, the way to the mast is the gunwale's rail, past the nets (a `cruise` edge), and gulls doze
 * on it (`winged`). The 聽診器 hangs on the mast at a standing reach (`reachHigh`, height 1), seen from
 * the deck only.
 *
 * He cuddles Mocha on the quay's lamp. Mocha into the net basket at the quay: Baokaka crawls in after
 * him, facing the boat. 咻——, 咻——: the boom swings the basket up over the water and onto the deck.
 * Mocha onto the wheelhouse roof: Baokaka climbs out onto the deck and stands at the rail, but the gulls
 * are on it. 飛機！: they lift off; he sidesteps along the rail to the mast, sees the 聽診器 and reaches
 * up for it. **Photo moment** (Mocha on the wheelhouse, inside `photoRect`, +M). The 淘氣: ride the
 * basket the whole circle round (four 咻—— with him aboard).
 *
 * ```
 *   lamp (Mocha) ─(basket at the quay: jump)─ rim (Mocha, in the basket) ─(basket on deck: jump)─ wheelhouse (Mocha)
 *                         B@1 (up over the water)
 *   Q1 (start) ── Q2 ── Q3 ═(0)═ B@0           B@2 ═(2: crawl)═ F1 (deck) ═cruise═ F2 (gulls: 飛機！) ·jump· mast (聽診器, height 1)
 *                         B@3 (down low)       [sail: 咻—— from the basket, any stop]
 * ```
 */
const BOOM = ['0', '1', '2', '3'];
/** The basket's stops: at the quay, up over the water, on the boat's deck, down low over the water. */
const SLOTS: [number, number][] = [[182, 446], [214, 396], [244, 424], [214, 474]];
const AT = (state: string) => ({ part: 'boom', in: [state] });
const ON_DECK = { any: [{ babyAt: 'F1' }, { babyAt: 'F2' }] };

export default definePage({
  id: 'c9p6', chapter: 9, index: 6, title: '碼頭的聽診器', difficulty: 5, backdrop: 'c9/fishing-harbour',
  spread: true,
  // The boat: the 聽診器 on the mast, Mocha on the wheelhouse
  photoRect: { x: 250, y: 290, w: 140, h: 180 },
  nodes: [
    // The quay, out to its steps
    { id: 'Q1', x: 36, y: 446, height: 1 }, { id: 'Q2', x: 86, y: 446, height: 1 }, { id: 'Q3', x: 136, y: 446, height: 1 },
    // The net basket on the derrick's boom, and its rim (Mocha's seat in it)
    { id: 'B', x: 182, y: 446, height: 1, attach: loopAttach('boom', BOOM, SLOTS, 0) },
    { id: 'rim', x: 196, y: 420, height: 2, attach: loopAttach('boom', BOOM, SLOTS.map(([x, y]) => [x + 14, y - 26]), 0) },
    // The boat's deck, its rail to the mast, and the 聽診器 on the mast
    { id: 'F1', x: 290, y: 424, height: 1 }, { id: 'F2', x: 344, y: 424, height: 1 },
    { id: 'mast', x: 322, y: 378, height: 1 },
    // Mocha's perches: the quay's lamp, the wheelhouse roof
    { id: 'lampTop', x: 44, y: 364, height: 2 }, { id: 'wheelhouseTop', x: 366, y: 344, height: 2 },
  ],
  edges: [
    { a: 'Q1', b: 'Q2', kind: 'crawl' }, { a: 'Q2', b: 'Q3', kind: 'crawl' },
    // Into the basket at the quay; out of it onto the deck
    { a: 'Q3', b: 'B', kind: 'crawl', when: AT('0') },
    { a: 'B', b: 'F1', kind: 'crawl', when: AT('2') },
    // Along the gunwale's rail past the nets, standing
    { a: 'F1', b: 'F2', kind: 'cruise' },
    // The mast: a cat's hop (standing beside it, he can reach the 聽診器)
    { a: 'F2', b: 'mast', kind: 'jump' },
    // Mocha: into the basket at the quay, out of it onto the wheelhouse on deck
    { a: 'lampTop', b: 'rim', kind: 'jump', when: AT('0') },
    { a: 'rim', b: 'wheelhouseTop', kind: 'jump', when: AT('2') },
  ],
  parts: [
    // The boat's sail: 咻—— fills it and the boom swings a stop. In his cone facing right from every
    // stop of the basket (≤ 125 units), from nowhere on the quay or the deck
    { id: 'sail', preset: 'blowable', states: BOOM, coupled: ['boom'], hit: { x: 270, y: 370, w: 60, h: 60 }, art: 'c9/sail' },
    // The derrick's boom, carrying the net basket round: only the sail drives it
    { id: 'boom', preset: 'loop', states: BOOM, input: 'none', hit: { x: 160, y: 370, w: 110, h: 120 }, art: 'c9/derrick' },
  ],
  perches: [
    { id: 'lamp', node: 'lampTop', reachNode: 'Q1' },
    // In the net basket, riding the boom
    { id: 'basket', node: 'rim', reachNode: 'B' },
    { id: 'wheelhouse', node: 'wheelhouseTop', reachNode: 'F2' },
  ],
  creatures: [
    // Gulls dozing on the rail by the mast: 飛機！ and they lift off (the next brings them back)
    { id: 'gulls', positions: { rail: 'F2', sky: 'offpage' }, initial: 'rail', winged: true, art: 'c9/gulls' },
  ],
  // The 聽診器 on the mast, seen from the deck
  attractors: [{ id: 'stethoscope', kind: 'shiny', node: 'mast', height: 1, goal: true, visibleWhen: ON_DECK }],
  baby: { start: 'Q1', facing: 'r' },
  mocha: { start: 'lamp' },
  // Four 咻—— with him aboard: the basket the whole circle round
  mischief: { text: '坐網籃繞港口一整圈', when: { type: 'partEnter', id: 'boom', count: 4, when: { babyAt: 'B' } } },
  // On the harbour light at the harbour mouth, seen once the gulls are up
  tudigong: { x: 150, y: 300, visibleWhen: { creature: 'gulls', at: 'sky' }, hat: '船長帽' },
  solution: [
    { mocha: 'basket' }, { wait: 'settle' }, { say: 'whoosh' }, { say: 'whoosh' }, { mocha: 'wheelhouse' }, { wait: 'settle' },
    { say: 'plane' }, { wait: 'goal' },
  ],
});
