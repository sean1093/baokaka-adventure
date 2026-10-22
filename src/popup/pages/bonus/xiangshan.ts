import { definePage } from '../../core/define';

/**
 * GDD § 4.4, the bonus page 「象山的日出」 · 番外 (chapter 12, #135) · difficulty 1 · post-game:
 * unlocked by all 65 土地公 stickers (§ 2.8), outside the book's linear order. The top of the 象山
 * trail at sunrise: the 六巨石 boulders on the right, 101 across the basin with the sun coming up
 * behind it, a gully between the trail's last step and the boulders. A gentle page: Baokaka sits on
 * a huge fallen leaf at the gully's edge, the 金珠珠 shining on the boulder across it.
 *
 * 咻咻 plays as a breeze: each 咻—— blows the leaf a stop across the gully (`blowable`: `near` ·
 * `mid` · `far`; from `far` it drifts back to `near`), carrying him with it; at the far side he
 * crawls off and climbs to the bead. The 淘氣: Mocha rides the leaf with him. The 土地公 waits on the
 * boulders with his walking stick (`登山帽`); when the bead is his, he stamps the 「台北走透透」 card:
 * 「呵呵，囡仔，慢慢仔大。」 (the end lines, `END_LINES[12]`).
 *
 * ```
 *   rock (Mocha)          leafTop (Mocha, riding)
 *   A1 ═(near)═ L@near ··· L@mid ··· L@far ═(far)═ B1 ─climb─ B2 (the boulder: the bead)
 *               [leaf: 咻—— from on it, facing right]
 * ```
 */
const DRIFT = ['near', 'mid', 'far'];
const at = (...s: string[]) => ({ part: 'leaf', in: s });

export default definePage({
  id: 'c12p1', chapter: 12, index: 1, title: '象山的日出', difficulty: 1, backdrop: 'bonus/xiangshan',
  nodes: [
    // The trail's last stone step
    { id: 'A1', x: 44, y: 462, height: 0 },
    // On the fallen leaf, drifting across the gully
    { id: 'L', x: 112, y: 462, height: 0, attach: { part: 'leaf', pos: { near: [112, 462], mid: [196, 478], far: [276, 462] } } },
    // The boulders' foot and the top of the boulder, where the bead shines in the first sun
    { id: 'B1', x: 334, y: 462, height: 0 }, { id: 'B2', x: 360, y: 430, height: 1 },
    // Mocha's perches: a rock by the trail, and riding the leaf
    { id: 'rockTop', x: 48, y: 384, height: 2 },
    { id: 'leafTop', x: 126, y: 418, height: 2, attach: { part: 'leaf', pos: { near: [126, 418], mid: [210, 434], far: [290, 418] } } },
  ],
  edges: [
    { a: 'A1', b: 'L', kind: 'crawl', when: at('near') },
    { a: 'L', b: 'B1', kind: 'crawl', when: at('far') },
    { a: 'B1', b: 'B2', kind: 'climb' },
    { a: 'rockTop', b: 'leafTop', kind: 'jump', when: at('near') },
  ],
  parts: [
    // The leaf: 咻—— blows it a stop on (from on it, facing right); from the far side it drifts back
    { id: 'leaf', preset: 'blowable', states: DRIFT, initial: 'near', hit: { x: 200, y: 448, w: 56, h: 56 }, art: 'bonus/leaf' },
  ],
  perches: [
    { id: 'rock', node: 'rockTop' },
    { id: 'leaf', node: 'leafTop', reachNode: 'L' },
  ],
  creatures: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'B2', goal: true }],
  baby: { start: 'L', facing: 'r', growth: 3 },
  mocha: { start: 'rock' },
  words: ['whoosh'],
  mischief: { text: '讓摩卡一起坐葉子', when: { type: 'catArrive', id: 'leaf' } },
  // On the boulders, leaning on his walking stick
  tudigong: { x: 330, y: 404, hat: '登山帽' },
  lines: { intro: [] },
  solution: [{ wait: 'settle' }, { say: 'whoosh' }, { say: 'whoosh' }, { wait: 'goal' }],
});
