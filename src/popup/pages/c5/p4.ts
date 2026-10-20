import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 5-4 「彈珠台」 (an old pachinko board in the night market's game arcade) ·
 * difficulty 3 · par 3. The bead is the board's ball, waiting in the launcher at the top: he sees
 * it and reaches up from the floor. Mocha leans on the launch knob (his weight on it, C4) and the
 * ball rattles down through the pegs — where it goes is up to two flipper **tabs**: the upper one
 * sends it into the left lane or the right; in the left lane the lower one sends it out into the
 * tray at his side, or into the jackpot hole in the middle. The right lane runs to the out-hole and
 * back to the launcher. Set both flippers, then send Mocha onto the knob; tap Mocha to launch again
 * (C4: a press again). The 淘氣: the jackpot — the 彈珠台阿伯 wakes up laughing (and pays the ball
 * back into the launcher).
 *
 * ```
 *              launcher (the bead; Mocha's knob launches it)
 *        flipA: l ─ left lane ─ flipB: l → tray (his side) · r → jackpot (back to the launcher on a launch)
 *               r ─ right lane → out-hole → launcher
 *   stool (Mocha) ─jump─ knob
 *   F1 ── F2 ── T (tray, the bead once it lands) ── F3
 * ```
 */
const LAUNCH = { type: 'partEnter', id: 'knob', state: 'down' } as const;
const IN_PLAY = { part: 'ball', in: ['start', 'jackpot'] };

export default definePage({
  id: 'c5p4', chapter: 5, index: 4, title: '彈珠台', difficulty: 3, backdrop: 'c5/pachinko',
  nodes: [
    { id: 'F1', x: 34, y: 486, height: 0 }, { id: 'F2', x: 96, y: 486, height: 0 },
    // The ball tray at the board's foot, on his side
    { id: 'T', x: 160, y: 470, height: 0 },
    { id: 'F3', x: 226, y: 486, height: 0 },
    // Where the ball can be: the launcher at the top, the jackpot hole (both out of reach)
    { id: 'launch', x: 330, y: 120, height: 2 }, { id: 'jackpotHole', x: 236, y: 300, height: 2 },
    { id: 'uncleSeat', x: 360, y: 440, height: 1 },   // unconnected: the 彈珠台阿伯's stool
    // Mocha's perches: a stool beside the board, the launch knob
    { id: 'stoolTop', x: 40, y: 380, height: 1 }, { id: 'knobTop', x: 330, y: 412, height: 1 },
  ],
  edges: [
    { a: 'F1', b: 'F2', kind: 'crawl' }, { a: 'F2', b: 'T', kind: 'crawl' }, { a: 'T', b: 'F3', kind: 'crawl' },
    { a: 'stoolTop', b: 'knobTop', kind: 'jump' },
  ],
  parts: [
    // The board, and where its bead-ball is (a tab nobody drives: printed art per state, drawn under the
    // flippers). Launched, the ball follows the flippers; the out-hole pays it back to the launcher
    { id: 'ball', preset: 'tab', states: ['start', 'jackpot', 'tray'], input: 'none', track: { from: [330, 120], to: [160, 470] },
      hit: { x: 150, y: 70, w: 230, h: 380 }, art: 'c5/pachinko-board',
      react: [
        { on: LAUNCH, when: { all: [IN_PLAY, { part: 'flipA', in: ['l'] }, { part: 'flipB', in: ['l'] }] }, to: 'tray' },
        { on: LAUNCH, when: { all: [IN_PLAY, { part: 'flipA', in: ['l'] }, { part: 'flipB', in: ['r'] }] }, to: 'jackpot' },
        { on: LAUNCH, when: { all: [IN_PLAY, { part: 'flipA', in: ['r'] }] }, to: 'start' },
      ] },
    // The upper flipper: left lane or right lane
    { id: 'flipA', preset: 'tab', states: ['l', 'r'], initial: 'r', input: 'drag-linear',
      track: { from: [252, 190], to: [300, 190] }, hit: { x: 244, y: 162, w: 64, h: 56 }, art: 'c5/flipper-upper' },
    // The lower flipper, in the left lane: out to the tray, or into the jackpot hole
    { id: 'flipB', preset: 'tab', states: ['l', 'r'], initial: 'r', input: 'drag-linear',
      track: { from: [172, 340], to: [220, 340] }, hit: { x: 164, y: 312, w: 64, h: 56 }, art: 'c5/flipper-lower' },
    // The launch knob: Mocha's weight on it fires the ball (and again each time he presses it)
    { id: 'knob', preset: 'button', hit: { x: 302, y: 400, w: 56, h: 56 }, art: 'c5/launch-knob' },
  ],
  perches: [
    { id: 'stool', node: 'stoolTop', reachNode: 'F1' },
    { id: 'knob', node: 'knobTop', reachNode: 'F3', onPart: 'knob' },
  ],
  creatures: [
    // The 彈珠台阿伯, dozing on his stool: the jackpot wakes him laughing
    { id: 'uncle', positions: { doze: 'uncleSeat', laugh: 'uncleSeat' }, initial: 'doze', blocks: false,
      react: [
        { on: { type: 'partEnter', id: 'ball', state: 'jackpot' }, to: 'laugh' },
        { on: { type: 'partEnter', id: 'ball' }, to: 'doze' },
      ], art: 'c5/pachinko-uncle' },
  ],
  attractors: [
    { id: 'bead', kind: 'shiny', node: 'launch', goal: true, nodeBy: { part: 'ball', map: { start: 'launch', jackpot: 'jackpotHole', tray: 'T' } } },
  ],
  baby: { start: 'F1', facing: 'r' },
  mocha: { start: 'stool' },
  mischief: { text: '讓彈珠掉進大獎洞', when: { type: 'partEnter', id: 'ball', when: { part: 'ball', in: ['jackpot'] } } },
  // Painted on the board behind the upper flipper, seen when it flips to the left
  tudigong: { x: 296, y: 216, visibleWhen: { part: 'flipA', in: ['l'] }, hat: '鴨舌帽' },
  solution: [{ set: 'flipA', to: 'l' }, { set: 'flipB', to: 'l' }, { mocha: 'knob' }, { wait: 'goal' }],
  lines: {
    onEvent: [
      // The jackpot: the 彈珠台阿伯 wakes up laughing
      { when: { type: 'partEnter', id: 'ball', when: { part: 'ball', in: ['jackpot'] } }, line: 'c5p4.uncle.1' },
    ],
  },
});
