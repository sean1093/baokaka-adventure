import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 6-3 「看飛機」 (the observation deck) · difficulty 2 · par 2 · **learn 飛機！**. The
 * airport's rooftop deck at night: a long window rail over the apron, where a plane sleeps with
 * its lights low. The deck's far end is behind a little gate whose big push button is covered in
 * roosting pigeons (`gate`: shut while they sit on it); the bead is out there, out of sight.
 *
 * Baokaka cuddles Mocha on the bench by the stairs. Send Mocha up onto the window rail: he crawls
 * after him to the glass, the sleeping plane's lights blink, and he points — 「飛……飛機！」 (§ 5.4,
 * `learns: babyAt R`; Mocha: 「不會說爸爸，先會說飛機。」). Say it: the pigeons fly up off the
 * button (`winged`), the gate swings open and there is the bead; he crawls through. Every 飛機！
 * toggles them (they come back and the gate shuts), and the plane winks its lights at each one.
 * The 淘氣: say 飛機！ five times.
 *
 * ```
 *   bench (Mocha) ─jump─ rail (Mocha, on the window rail)        the sleeping plane (outside)
 *   E1 ── E2 ── R (at the glass: learn) ── G (gate; pigeons on its button) ── D1 ── D2 (bead)
 * ```
 */
const GATE_OPEN = { part: 'gate', in: ['open'] };

export default definePage({
  id: 'c6p3', chapter: 6, index: 3, title: '看飛機', difficulty: 2, backdrop: 'c6/observation-deck',
  nodes: [
    // The deck: the stairs' end (left), the window rail, the gate, the deck's far end
    { id: 'E1', x: 40, y: 484, height: 0 }, { id: 'E2', x: 100, y: 484, height: 0 },
    { id: 'R', x: 170, y: 484, height: 0 },
    { id: 'G', x: 240, y: 484, height: 0, attach: { part: 'gate', pos: { closed: [240, 484], open: [240, 484] } } },
    { id: 'D1', x: 300, y: 484, height: 0 }, { id: 'D2', x: 358, y: 484, height: 0 },
    { id: 'button', x: 262, y: 420, height: 1 },     // unconnected: the gate's push button, where the pigeons roost
    // Mocha's perches: the bench by the stairs, the window rail
    { id: 'benchTop', x: 64, y: 410, height: 1 }, { id: 'railTop', x: 176, y: 372, height: 2 },
  ],
  edges: [
    { a: 'E1', b: 'E2', kind: 'crawl' }, { a: 'E2', b: 'R', kind: 'crawl' }, { a: 'R', b: 'G', kind: 'crawl' },
    { a: 'G', b: 'D1', kind: 'crawl' }, { a: 'D1', b: 'D2', kind: 'crawl' },
    { a: 'benchTop', b: 'railTop', kind: 'jump' },
  ],
  parts: [
    // The deck gate: it swings open when the pigeons lift off its button, and shuts when they land
    { id: 'gate', preset: 'gate', initial: 'closed', hit: { x: 216, y: 400, w: 56, h: 84 }, art: 'c6/deck-gate',
      react: [{ on: 'sky', to: 'toggle' }] },
    // The sleeping plane's lights: it winks them at every 飛機！ (event-driven: nothing to tap)
    { id: 'jet', preset: 'light', hit: { x: 250, y: 250, w: 120, h: 60 }, art: 'c6/plane-lights',
      react: [{ on: 'sky', to: 'toggle' }] },
  ],
  perches: [
    { id: 'bench', node: 'benchTop', reachNode: 'E1' },
    { id: 'rail', node: 'railTop', reachNode: 'R' },
  ],
  creatures: [
    // Pigeons roosting on the gate's push button: 飛機！ lifts them off, and the next one brings them back
    { id: 'pigeons', positions: { button: 'button', sky: 'offpage' }, initial: 'button', blocks: false, winged: true, art: 'common/pigeon' },
  ],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'D2', goal: true, visibleWhen: GATE_OPEN }],
  baby: { start: 'E2', facing: 'l' },
  mocha: { start: 'bench' },
  // He learns 飛機！ at the glass, where the sleeping plane blinks
  learns: { word: 'plane', when: { babyAt: 'R' } },
  mischief: { text: '說五次飛機！', when: { type: 'sky', count: 5 } },
  // On the sleeping plane's tail fin, seen while it has its lights on
  tudigong: { x: 330, y: 228, visibleWhen: { part: 'jet', in: ['on'] }, hat: '機場背心' },
  solution: [{ mocha: 'rail' }, { wait: 'settle' }, { say: 'plane' }, { wait: 'goal' }],
});
