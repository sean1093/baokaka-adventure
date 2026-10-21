import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 8-2 「地熱谷」 (Thermal Valley, the steaming green pool above 北投) · difficulty 3 ·
 * par 4. Between the boardwalk and the rocks on the far side lies the hot pool, with two steam vents
 * in it. Each vent has a valve on the pool's front rim (a two-step **wheel**: off / on), and over each
 * vent floats a paper cloud (a **lift**) that the steam holds up: on, the near cloud is level with the
 * boardwalk and the far one a step higher, a step under the rocks; off, a cloud sinks onto its vent,
 * out of reach. Baokaka crosses on the clouds — near cloud, far cloud, rocks — so both vents must
 * be on.
 *
 * Mocha is on the boardwalk's lamp, and Baokaka cuddles him there; nothing else is in sight (the
 * bead lies past the far vent's steam). The rock by the far vent is the one place Mocha can lure him
 * from — but it's in the steam while that vent is on (C7: he won't go, his fur puffs). So: turn the
 * far vent off, Mocha jumps onto its rock, and Baokaka reaches for him from the end of the boardwalk;
 * turn the near vent on (he crawls onto its cloud) and the far vent back on — the steam comes up
 * under Mocha (he stays put, fur on end) and lifts the far cloud: Baokaka climbs onto it beside him,
 * sees the bead on the rocks and climbs on. The 淘氣: puff Mocha's fur three times (turn the steam on
 * under him).
 *
 * ```
 *   lamp (Mocha) ────────jump──────── rockB (Mocha; in the steam while valveB is on: C7)
 *                                       B (far cloud: up 424 · down 512) ═climb═ R1 ── R2 (bead, seen from the cloud)
 *   L1 ── L2 ══(near cloud up: crawl)══ A (near cloud: up 446 · down 512) ═(both up: climb)═ B
 *   valveA → cloudA (starts off: down) · valveB → cloudB (starts on: up)
 * ```
 */
const UP = (lift: string) => ({ part: lift, in: ['up'] });
const ACROSS = { any: [{ babyAt: 'B' }, { babyAt: 'R1' }, { babyAt: 'R2' }] };
/** A cloud's lift: up while its vent's valve is on, down on the vent while it's off. */
const cloudLift = (id: string, valve: string, initial: 'up' | 'down', hitX: number) => ({
  id, preset: 'lift' as const, states: ['down', 'up'], initial, hit: { x: hitX, y: 420, w: 64, h: 92 }, art: 'c8/steam-cloud',
  react: [
    { on: { type: 'partEnter' as const, id: valve, state: 'on' }, to: 'up' },
    { on: { type: 'partEnter' as const, id: valve, state: 'off' }, to: 'down' },
  ],
});
const PUFF = { type: 'partEnter' as const, id: 'valveB', count: 3, when: { all: [{ part: 'valveB', in: ['on'] }, { mochaAt: 'rockB' }] } };

export default definePage({
  id: 'c8p2', chapter: 8, index: 2, title: '地熱谷', difficulty: 3, backdrop: 'c8/thermal-valley',
  nodes: [
    // The boardwalk
    { id: 'L1', x: 36, y: 446, height: 1 }, { id: 'L2', x: 92, y: 446, height: 1 },
    // The two paper clouds over the vents, held up by the steam
    { id: 'A', x: 152, y: 512, height: 1, attach: { part: 'cloudA', pos: { down: [152, 512], up: [152, 446] } } },
    { id: 'B', x: 232, y: 424, height: 1, attach: { part: 'cloudB', pos: { down: [232, 512], up: [232, 424] } } },
    // The rocks on the far side
    { id: 'R1', x: 300, y: 402, height: 1 }, { id: 'R2', x: 360, y: 402, height: 1 },
    // Mocha's perches: the boardwalk's lamp, the rock by the far vent
    { id: 'lampTop', x: 52, y: 368, height: 2 }, { id: 'rockTop', x: 278, y: 470, height: 2, tags: ['steam'] },
  ],
  edges: [
    { a: 'L1', b: 'L2', kind: 'crawl' },
    { a: 'L2', b: 'A', kind: 'crawl', when: UP('cloudA') },
    { a: 'A', b: 'B', kind: 'climb', when: { all: [UP('cloudA'), UP('cloudB')] } },
    { a: 'B', b: 'R1', kind: 'climb', when: UP('cloudB') },
    { a: 'R1', b: 'R2', kind: 'crawl' },
    { a: 'lampTop', b: 'rockTop', kind: 'jump' },
  ],
  parts: [
    // The vents' valves on the pool's front rim: turn one on, and its steam lifts its cloud
    { id: 'valveA', preset: 'wheel', states: ['off', 'on'], initial: 'off', center: [120, 530], radius: 30,
      hit: { cx: 120, cy: 530, r: 30 }, art: 'c8/valve' },
    { id: 'valveB', preset: 'wheel', states: ['off', 'on'], initial: 'on', center: [204, 530], radius: 30,
      hit: { cx: 204, cy: 530, r: 30 }, art: 'c8/valve' },
    cloudLift('cloudA', 'valveA', 'down', 120),
    cloudLift('cloudB', 'valveB', 'up', 200),
  ],
  perches: [
    { id: 'lamp', node: 'lampTop', reachNode: 'L1' },
    // The rock by the far vent: in the steam while the vent is on (C7)
    { id: 'rockB', node: 'rockTop', reachNode: 'B', blockedWhen: { part: 'valveB', in: ['on'] } },
  ],
  creatures: [],
  // The bead on the far rocks, behind the far vent's steam: seen from the far cloud
  attractors: [{ id: 'bead', kind: 'shiny', node: 'R2', goal: true, visibleWhen: ACROSS }],
  baby: { start: 'L1', facing: 'r' },
  mocha: { start: 'lamp' },
  // The steam comes up under Mocha three times: fur on end
  mischief: { text: '讓摩卡的毛炸開三次', when: PUFF },
  // Soaking in the far vent's pool, seen once its steam stops
  tudigong: { x: 262, y: 520, visibleWhen: { part: 'valveB', in: ['off'] }, hat: '毛巾' },
  solution: [
    { set: 'valveB', to: 'off' }, { mocha: 'rockB' }, { wait: 'settle' }, { set: 'valveA', to: 'on' }, { wait: 'settle' },
    { set: 'valveB', to: 'on' }, { wait: 'goal' },
  ],
  lines: {
    onEvent: [{ when: PUFF, line: 'c8p2.mocha.1' }],
  },
});
