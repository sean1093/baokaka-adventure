import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 4-3 「霓虹燈睡著了」 · difficulty 2 · par 2 · **learn 哇！**. A dark alley off 西門町:
 * every neon sign asleep, Mocha curled up out of sight in a box, the bead somewhere round the
 * corner. With nothing to want he looks about, then cries 「哇——」, and the cry flickers the sign
 * above him awake — 「哇！」 (`learns`: 哇！, the § 5.4 learn beat and word card). Now his 哇！ lights
 * signs (radius 160): from under the first sign it wakes the second, further down the alley, and
 * puts the first back to sleep, so he crawls on to watch the new one; from there 哇！ wakes the
 * third, round the corner, and its glow shows the bead. A **trail of lights**: make your own leash.
 * The 淘氣: send Mocha behind the second sign and light it — his shadow, enormous on the wall.
 *
 * Only the first sign answers a cry, and only in the dark (every sign off): crying never lights the
 * trail for him, and 不要！ to a light only makes him cry until he wants it again.
 *
 * ```
 *   sign1 (cry, 哇！)      sign2 (哇！) [behind: Mocha]      sign3 (哇！): the bead shows
 *   S ─────────────────── N1 ──────────────────────────── N2 ── G (bead, round the corner)
 *   box (Mocha, hidden) ─jump─ behind (hidden behind sign2)
 * ```
 */
const SIGN_OFF = (id: string) => ({ part: id, in: ['off'] });

export default definePage({
  id: 'c4p3', chapter: 4, index: 3, title: '霓虹燈睡著了', difficulty: 2, backdrop: 'c4/neon-alley',
  nodes: [
    { id: 'S', x: 40, y: 484, height: 0 },           // under the first sign
    { id: 'N1', x: 154, y: 484, height: 0 },         // under the second
    { id: 'N2', x: 270, y: 484, height: 0 },         // under the third, at the corner
    { id: 'G', x: 350, y: 430, height: 0 },          // round the corner, where the bead is
    // Mocha's hiding places: a cardboard box, the back of the second sign
    { id: 'boxTop', x: 92, y: 420, height: 1 }, { id: 'behindTop', x: 176, y: 300, height: 2 },
  ],
  edges: [
    { a: 'S', b: 'N1', kind: 'crawl' }, { a: 'N1', b: 'N2', kind: 'crawl' }, { a: 'N2', b: 'G', kind: 'crawl' },
    { a: 'boxTop', b: 'behindTop', kind: 'jump' },
  ],
  parts: [
    // The first sign: his cry flickers it awake (only in the dark); 哇！ from right under it toggles it
    { id: 'sign1', preset: 'light', attractor: 'glow1', hit: { x: 14, y: 356, w: 56, h: 56 }, art: 'c4/neon-1',
      react: [
        { on: { type: 'cry', within: 120 }, when: { all: [SIGN_OFF('sign1'), SIGN_OFF('sign2'), SIGN_OFF('sign3')] }, to: 'on' },
        { on: { type: 'wow', within: 120 }, to: 'toggle' },
      ] },
    // The second and third: 哇！ toggles them (radius 160)
    { id: 'sign2', preset: 'light', attractor: 'glow2', hit: { x: 126, y: 356, w: 56, h: 56 }, art: 'c4/neon-2',
      react: [{ on: 'wow', to: 'toggle' }] },
    { id: 'sign3', preset: 'light', attractor: 'glow3', hit: { x: 244, y: 356, w: 56, h: 56 }, art: 'c4/neon-3',
      react: [{ on: 'wow', to: 'toggle' }] },
  ],
  perches: [
    // Both hide him (C9): this page's dark belongs to the lights
    { id: 'box', node: 'boxTop', reachNode: 'S', hidesMocha: true },
    { id: 'behind', node: 'behindTop', reachNode: 'N1', hidesMocha: true },
  ],
  creatures: [],
  attractors: [
    { id: 'glow1', kind: 'light', node: 'S', activeWhen: { part: 'sign1', in: ['on'] } },
    { id: 'glow2', kind: 'light', node: 'N1', activeWhen: { part: 'sign2', in: ['on'] } },
    { id: 'glow3', kind: 'light', node: 'N2', activeWhen: { part: 'sign3', in: ['on'] } },
    { id: 'bead', kind: 'shiny', node: 'G', goal: true, visibleWhen: { part: 'sign3', in: ['on'] } },
  ],
  baby: { start: 'S', facing: 'r' },
  mocha: { start: 'box' },
  learns: { word: 'wow', when: { part: 'sign1', in: ['on'] } },
  mischief: {
    text: '讓摩卡躲在招牌後面，再把招牌點亮',
    when: { type: 'partEnter', id: 'sign2', when: { all: [{ part: 'sign2', in: ['on'] }, { mochaAt: 'behind' }] } },
  },
  // The 淘氣's art (#119): Mocha's enormous shadow up the wall, while he hides behind the lit second sign
  cutouts: [{ art: 'c4/mocha-shadow', x: 186, y: 300, visibleWhen: { all: [{ part: 'sign2', in: ['on'] }, { mochaAt: 'behind' }] } }],
  // A fortune-teller's stool under the second sign, seen while it glows
  tudigong: { x: 206, y: 440, visibleWhen: { part: 'sign2', in: ['on'] }, hat: '算命墨鏡' },
  solution: [{ wait: 'settle' }, { say: 'wow' }, { wait: 'settle' }, { say: 'wow' }, { wait: 'goal' }],
});
