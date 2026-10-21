import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 6-1 「文湖線前窗」 (the front car of a driverless 文湖線 train) · difficulty 3 · par 4.
 * The chapter's ride page. There is no driver: the train waits at a junction in the dark, its
 * front window a big pane over the track. A track-switch **tab** under the window picks the
 * branch — the depot loop (it comes straight back round to the junction) or the airport — and the
 * driverless train is a robot: 嗶！ said near its front panel starts it (and brings it back off the
 * loop). The window shows where it is (`train`, a printed state part: the scene re-folds).
 *
 * Mocha is on a hand strap by the doors, and Baokaka cuddles him there, out of 嗶！'s reach of the
 * front panel. Mocha onto the dashboard lures him to the window; switch to the airport, 嗶！: the
 * train runs into 松山機場 station and the bead shines on the platform. A gap and a step up lie
 * between the car's floor and the platform (a grown-up's step, `climb`, D-84): he crawls to the
 * doors and reaches. A cabin-crew 姊姊 dozes by the doors on her way to work — 抱抱, and she wakes
 * and carries him off the train. The 淘氣: take the depot loop three times.
 *
 * ```
 *   dash (Mocha) ─────jump───── strap (Mocha)
 *   C1 ── C2 ── C3 ── C4 ── D (doors; 姊姊 dozes) ═(train at the airport: climb)═ P1 ── P2 (bead)
 *   train (front panel): 嗶！ from C1 … C3       姊姊: D → P1 (抱抱)
 *   switch: loop → the depot loop and back · airport → 松山機場
 * ```
 */
const AT_AIRPORT = { part: 'train', in: ['airport'] };

export default definePage({
  id: 'c6p1', chapter: 6, index: 1, title: '文湖線前窗', difficulty: 3, backdrop: 'c6/front-car',
  nodes: [
    // The car's floor, from the front window (left) to the doors (right)
    { id: 'C1', x: 40, y: 480, height: 0 }, { id: 'C2', x: 100, y: 480, height: 0 },
    { id: 'C3', x: 160, y: 480, height: 0 }, { id: 'C4', x: 220, y: 480, height: 0 },
    { id: 'D', x: 280, y: 480, height: 0 },
    // The platform, a step up past the doors (seen once the train pulls in)
    { id: 'P1', x: 330, y: 452, height: 1 }, { id: 'P2', x: 368, y: 452, height: 1 },
    // Mocha's perches: the dashboard under the front window, a hand strap by the doors
    { id: 'dashTop', x: 70, y: 372, height: 2 }, { id: 'strapTop', x: 226, y: 250, height: 2 },
  ],
  edges: [
    { a: 'C1', b: 'C2', kind: 'crawl' }, { a: 'C2', b: 'C3', kind: 'crawl' }, { a: 'C3', b: 'C4', kind: 'crawl' },
    { a: 'C4', b: 'D', kind: 'crawl' },
    // Off the train: a gap and a step up, a grown-up's step (the 姊姊 lifts him over)
    { a: 'D', b: 'P1', kind: 'climb', when: AT_AIRPORT },
    { a: 'P1', b: 'P2', kind: 'crawl' },
    { a: 'dashTop', b: 'strapTop', kind: 'jump' },
  ],
  parts: [
    // The track switch under the front window: which branch the train takes at the junction
    { id: 'switch', preset: 'tab', states: ['loop', 'airport'], initial: 'loop', input: 'drag-linear',
      track: { from: [60, 538], to: [150, 538] }, hit: { x: 26, y: 504, w: 158, h: 56 }, art: 'c6/track-switch' },
    // The driverless train (a robot): 嗶！ near its front panel starts it down the switched branch,
    // and brings it back off the depot loop. Printed per state in the front window (nobody drives it)
    { id: 'train', preset: 'tab', states: ['junction', 'loop', 'airport'], initial: 'junction', input: 'none',
      track: { from: [80, 300], to: [200, 300] }, hit: { x: 40, y: 390, w: 80, h: 60 }, art: 'c6/front-window',
      react: [
        { on: 'beep', when: { all: [{ part: 'train', in: ['junction'] }, { part: 'switch', in: ['airport'] }] }, to: 'airport' },
        { on: 'beep', when: { all: [{ part: 'train', in: ['junction'] }, { part: 'switch', in: ['loop'] }] }, to: 'loop' },
        { on: 'beep', when: { part: 'train', in: ['loop'] }, to: 'junction' },
        // Thrown while it runs the loop, the switch sends it on round onto the airport branch
        { on: { type: 'partEnter', id: 'switch', state: 'airport' }, when: { part: 'train', in: ['loop'] }, to: 'airport' },
      ] },
    // A cabin-crew 姊姊 dozing by the doors on her way to work: 抱抱, and she carries him off the train
    { id: 'crew', preset: 'carrier', route: ['D', 'P1'], hit: { x: 252, y: 378, w: 56, h: 102 }, art: 'c6/sleepy-crew' },
  ],
  perches: [
    { id: 'dash', node: 'dashTop', reachNode: 'C1' },
    // By the doors: under it he is out of 嗶！'s reach of the front panel
    { id: 'strap', node: 'strapTop', reachNode: 'C4' },
  ],
  creatures: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'P2', goal: true, visibleWhen: AT_AIRPORT }],
  baby: { start: 'D', facing: 'l' },
  mocha: { start: 'strap' },
  // Round the depot loop and back, three times
  mischief: { text: '坐機廠環線繞三圈', when: { type: 'partEnter', id: 'train', count: 3, when: { part: 'train', in: ['loop'] } } },
  // Waving from the depot's maintenance shed, seen through the front window on the loop
  tudigong: { x: 150, y: 262, visibleWhen: { part: 'train', in: ['loop'] }, hat: '機場背心' },
  solution: [
    { mocha: 'dash' }, { wait: 'settle' }, { set: 'switch', to: 'airport' }, { say: 'beep' }, { wait: 'settle' },
    { say: 'hug' }, { wait: 'goal' },
  ],
  lines: {
    // 廣播姊姊's next ride line (§ 5.3, cycling on from 5-1's)
    intro: ['rec.pa.ride.1'],
    // The 姊姊 wakes to 抱抱 and lifts him off the train
    onEvent: [{ when: { type: 'partEnter', id: 'crew', when: { part: 'crew', in: ['carrying@0'] } }, line: 'c6p1.crew.1' }],
  },
});
