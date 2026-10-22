import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 10-4 「阻尼球」 · difficulty 4 · par 5. Inside 101 at 88F: the tuned-mass damper,
 * a great gold sphere hanging on its cables in the open atrium between the near viewing balcony and
 * the far one. Nobody can push 660 tonnes, but it sways in the wind: the damper is a **blowable**
 * pendulum (`left` · `centre` · `right`: each 咻—— swings it one stop on, and from the right it swings
 * all the way back to the left). Too light without a cat, it won't swing out to the far side: `right`
 * only with Mocha riding on top (`stateWhen`, "Mocha's weight lets it reach the far side"). He can
 * climb on at the near balcony (with it at the left) and off at the far one (at the right), where the
 * bead lies in the damper's display.
 *
 * He reaches for the bead across the atrium from the near balcony; 咻—— does nothing — the sphere
 * strains and stays. Mocha onto the sphere (by way of the cables' mount): 咻——, it swings out to the far
 * side with the cat; 咻—— again, and it swings all the way back to him; he climbs on beside Mocha.
 * 咻——, 咻——: centre, and out to the far balcony; he climbs off and takes the bead. The 淘氣: five
 * swings (one more than the way across takes).
 *
 * ```
 *                    mount (Mocha, the cables' mount over the centre) ─(centre: jump)─ sphere (Mocha, riding)
 *   railA (Mocha) ─(left: jump)─ sphere
 *   A1 (start) ── A2 ═(left)═ S@left ··· S@centre ··· S@right ═(right)═ B1 ── B2 (the display: bead)
 *                            [damper: 咻—— from A2 or the sphere, facing right; right only with Mocha aboard]
 * ```
 */
const SWING = ['left', 'centre', 'right'];
const at = (...s: string[]) => ({ part: 'damper', in: s });
/** Five swings (the 淘氣): one more than the way across takes */
const SWUNG_FIVE = { type: 'partEnter' as const, id: 'damper', count: 5 };

export default definePage({
  id: 'c10p4', chapter: 10, index: 4, title: '阻尼球', difficulty: 4, backdrop: 'c10/damper',
  nodes: [
    // The near viewing balcony
    { id: 'A1', x: 40, y: 456, height: 0 }, { id: 'A2', x: 96, y: 456, height: 0 },
    // On top of the sphere, swinging across the atrium
    { id: 'S', x: 150, y: 456, height: 0, attach: { part: 'damper', pos: { left: [150, 456], centre: [210, 476], right: [270, 456] } } },
    // The far balcony and the damper's display case
    { id: 'B1', x: 326, y: 456, height: 0 }, { id: 'B2', x: 368, y: 432, height: 1 },
    // Mocha's perches: the near balcony's railing, the cables' mount over the centre, riding the sphere
    { id: 'railTop', x: 60, y: 372, height: 2 }, { id: 'mountTop', x: 210, y: 300, height: 2 },
    { id: 'sphereTop', x: 158, y: 412, height: 2, attach: { part: 'damper', pos: { left: [158, 412], centre: [218, 432], right: [278, 412] } } },
  ],
  edges: [
    { a: 'A1', b: 'A2', kind: 'crawl' },
    { a: 'A2', b: 'S', kind: 'crawl', when: at('left') },
    { a: 'S', b: 'B1', kind: 'crawl', when: at('right') },
    { a: 'B1', b: 'B2', kind: 'climb' },
    { a: 'railTop', b: 'sphereTop', kind: 'jump', when: at('left') },
    { a: 'mountTop', b: 'sphereTop', kind: 'jump', when: at('centre') },
    { a: 'railTop', b: 'mountTop', kind: 'jump' },
  ],
  parts: [
    // The damper: 咻—— swings it a stop (in his cone facing right from A2 and from on top, ≤ 140);
    // out to the far side only with Mocha's weight on it
    { id: 'damper', preset: 'blowable', states: SWING, initial: 'centre', stateWhen: { right: { mochaAt: 'sphere' } },
      hit: { x: 202, y: 446, w: 56, h: 56 }, art: 'c10/damper' },
  ],
  perches: [
    { id: 'rail', node: 'railTop', reachNode: 'A1' },
    { id: 'mount', node: 'mountTop' },
    { id: 'sphere', node: 'sphereTop', reachNode: 'S' },
  ],
  creatures: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'B2', goal: true }],
  baby: { start: 'A1', facing: 'r' },
  mocha: { start: 'rail' },
  mischief: { text: '讓阻尼球盪五下', when: SWUNG_FIVE },
  // On the far balcony's damper plaque, seen once the sphere has swung out there
  tudigong: { x: 352, y: 360, visibleWhen: at('right'), hat: '清潔帽' },
  solution: [
    { wait: 'settle' }, { mocha: 'sphere' }, { wait: 'settle' },
    { say: 'whoosh' }, { say: 'whoosh' }, { wait: 'settle' }, { say: 'whoosh' }, { say: 'whoosh' }, { wait: 'goal' },
  ],
  lines: {
    onEvent: [{ when: SWUNG_FIVE, line: 'c10p4.mocha.1' }],
  },
});
