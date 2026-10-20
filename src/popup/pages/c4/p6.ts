import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 4-6 「走音天王」 · difficulty 4 · par 4 · treasure 麥克風: chapter 4's spread (§ 2.9).
 * A karaoke bar's stage behind a rolled-down shop **shutter** (a flap); in the middle of the stage a
 * trap **lift**, the 麥克風 below it. The stage lights are dark and the karaoke king waits in the wings.
 * Baokaka starts by the arcade door, cuddling Mocha on its sign.
 *
 * Roll the shutter up (tap it): the stage is open — and over the dance floor hangs a disco ball, a
 * **decoy**: he crawls back under it and reaches up. Mocha squeezes under the shutter onto the amp at
 * the back of the stage (he can't get behind it, so he can only get as near as the stage front).
 * 不要！ the disco ball: he crawls up onto the stage and reaches for Mocha — right under the lights.
 * His 哇！ switches them on: the karaoke king steps up and sings (「這首歌，獻給一歲的你！」 — Mocha:
 * 「……耳朵。我的耳朵。」), and the lift rises with the 麥克風 on it. **Photo moment** (Mocha on the amp
 * inside `photoRect`, +M) and he grabs it. The 淘氣: three songs — 哇！ the lights off and on again,
 * twice more, before he can grab it.
 *
 * ```
 *          disco ball (decoy, shutter open)      lights (哇！ from S2)   amp (Mocha; behind it: ampFoot)
 *   sign (Mocha) ─squeeze─ amp
 *   A1 ── A2 ── A3 ══(shutter open)══ S1 ── S2 ══(lift up)══ M (麥克風, rises with the lift)
 * ```
 */
const LIGHTS_ON = { part: 'lights', in: ['on'] };

export default definePage({
  id: 'c4p6', chapter: 4, index: 6, title: '走音天王', difficulty: 4, backdrop: 'c4/karaoke-spread',
  spread: true,
  // The stage: the lift, the amp (Mocha's +M) and the stage front
  photoRect: { x: 196, y: 290, w: 194, h: 250 },
  nodes: [
    // The arcade door and the dance floor (left page), the stage (right page)
    { id: 'A1', x: 30, y: 490, height: 0 }, { id: 'A2', x: 90, y: 490, height: 0 },
    { id: 'A3', x: 150, y: 490, height: 0 },
    { id: 'S1', x: 222, y: 470, height: 0 }, { id: 'S2', x: 284, y: 470, height: 0 },
    // On the trap lift: under the stage, then up level with it
    { id: 'M', x: 346, y: 470, height: 0, attach: { part: 'lift', pos: { down: [346, 540], up: [346, 470] } } },
    { id: 'discoTop', x: 110, y: 250, height: 2 },   // unconnected: the disco ball
    { id: 'ampFoot', x: 334, y: 420, height: 1 },    // unconnected: behind the amp
    { id: 'kingWings', x: 380, y: 400, height: 1 },  // unconnected: the karaoke king waits in the wings
    { id: 'kingStage', x: 316, y: 420, height: 1 },  // unconnected: and sings at the stand
    // Mocha's perches: the arcade's sign, the amp at the back of the stage
    { id: 'signTop', x: 40, y: 300, height: 2 }, { id: 'ampTop', x: 312, y: 370, height: 1 },
  ],
  edges: [
    { a: 'A1', b: 'A2', kind: 'crawl' }, { a: 'A2', b: 'A3', kind: 'crawl' },
    { a: 'A3', b: 'S1', kind: 'crawl', when: { part: 'shutter', in: ['open'] } },
    { a: 'S1', b: 'S2', kind: 'crawl' },
    { a: 'S2', b: 'M', kind: 'crawl', when: { part: 'lift', in: ['up'] } },
    // Mocha squeezes under the shutter, rolled up or not
    { a: 'signTop', b: 'ampTop', kind: 'squeeze' },
  ],
  parts: [
    // The shop's roll-up shutter over the stage
    { id: 'shutter', preset: 'flap', hit: { x: 196, y: 330, w: 72, h: 72 }, art: 'c4/stage-shutter' },
    // The stage lights: 哇！ from the stage front (S2, ≤ 160) switches them, and again
    { id: 'lights', preset: 'light', hit: { x: 282, y: 292, w: 56, h: 56 }, art: 'c4/stage-lights',
      react: [{ on: 'wow', to: 'toggle' }] },
    // The trap lift: up while the king sings, down when the lights go out
    { id: 'lift', preset: 'lift', states: ['down', 'up'], hit: { x: 318, y: 476, w: 56, h: 64 }, art: 'c4/stage-lift',
      react: [
        { on: { type: 'partEnter', id: 'lights', state: 'on' }, to: 'up' },
        { on: { type: 'partEnter', id: 'lights', state: 'off' }, to: 'down' },
      ] },
  ],
  perches: [
    { id: 'sign', node: 'signTop', reachNode: 'A1' },
    { id: 'amp', node: 'ampTop', reachNode: 'ampFoot' },
  ],
  creatures: [
    // The karaoke king: sings while the lights are on
    { id: 'king', positions: { wings: 'kingWings', sing: 'kingStage' }, initial: 'wings', blocks: false,
      react: [
        { on: { type: 'partEnter', id: 'lights', state: 'on' }, to: 'sing' },
        { on: { type: 'partEnter', id: 'lights', state: 'off' }, to: 'wings' },
      ], art: 'c4/karaoke-king' },
  ],
  attractors: [
    { id: 'disco', kind: 'shiny', node: 'discoTop', decoy: true, visibleWhen: { part: 'shutter', in: ['open'] }, art: 'c4/disco-ball' },
    { id: 'mic', kind: 'shiny', node: 'M', goal: true, visibleWhen: { part: 'lift', in: ['up'] } },
  ],
  baby: { start: 'A1', facing: 'r' },
  mocha: { start: 'sign' },
  mischief: { text: '讓走音天王連唱三首歌', when: { type: 'partEnter', id: 'lights', count: 3, when: LIGHTS_ON } },
  // In the front row of the karaoke screen's lyrics, seen once the shutter is up
  tudigong: { x: 236, y: 250, visibleWhen: { part: 'shutter', in: ['open'] }, hat: '算命墨鏡' },
  solution: [{ tap: 'shutter' }, { mocha: 'amp' }, { wait: 'settle' }, { say: 'no' }, { wait: 'settle' }, { say: 'wow' }, { wait: 'goal' }],
  lines: {
    onEvent: [
      // The lights come up and the king sings (§ 5.2 4-6)
      { when: { type: 'partEnter', id: 'lights', when: LIGHTS_ON }, line: 'c4p6.king.1' },
      { when: { type: 'partEnter', id: 'lights', when: LIGHTS_ON }, line: 'c4p6.king.2' },
    ],
  },
});
