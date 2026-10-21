import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 7-1 「往動物園」 (動物園 station, the end of the 文湖線) · difficulty 3 · par 4.
 * The chapter's ride page: the train has stopped at the end of the line and Baokaka crawls out
 * onto the elevated platform. A review of three words. Over the platform's far end hangs the zoo's
 * panda sign, lit and glittering (a **decoy**: a shiny he can never grab), and he crawls off under
 * it and reaches 「要！要！」. The way down is the station's stairs — a grown-up's step (`climb`,
 * D-84: 爬樓梯 is 7-3's) — where a night-shift zookeeper (a **carrier**) dozes at the top.
 *
 * Mocha onto the lamp post down in the plaza: he is out of reach down there, so once Baokaka
 * refuses the sign (不要！) he crawls to the top of the stairs and reaches down for Mocha, never
 * arriving, so the refusal holds. 抱抱: the keeper wakes and carries him down. From the plaza the
 * bead glints in the zoo's gateway, but a flock of night herons dozes on the path (`winged`):
 * 飛機！, and they lift off. The sign can't be seen from the plaza and the bead can't be seen from
 * the platform (`babyAt`), so the two shinies never tie. The 淘氣: 掰掰 to the pangolin asleep in
 * the planter under the stairs — he curls up into a ball.
 *
 * ```
 *   bench (Mocha) ─────────────jump────────────── lamp (Mocha, in the plaza)
 *   sign (decoy, over the platform's end)
 *   P0 ── P1 ── D (start) ── P3 ── S (the keeper dozes) ═(climb: the stairs)═ Z1 ── Z2 (herons) ── Z3 (bead)
 *   keeper: S → Z1 (抱抱)              pangolin: asleep in the planter (掰掰: curls up)
 * ```
 */
const PLAZA = ['Z1', 'Z2', 'Z3'];
const IN_PLAZA = { any: PLAZA.map((id) => ({ babyAt: id })) };

export default definePage({
  id: 'c7p1', chapter: 7, index: 1, title: '往動物園', difficulty: 3, backdrop: 'c7/zoo-station',
  nodes: [
    // The elevated platform, from its far end (left) to the top of the stairs (right)
    { id: 'P0', x: 30, y: 420, height: 1 }, { id: 'P1', x: 80, y: 420, height: 1 },
    { id: 'D', x: 130, y: 420, height: 1 }, { id: 'P3', x: 180, y: 420, height: 1 },
    { id: 'S', x: 226, y: 420, height: 1 },
    // The plaza at the foot of the stairs, to the zoo's gateway
    { id: 'Z1', x: 262, y: 494, height: 0 }, { id: 'Z2', x: 316, y: 494, height: 0 },
    { id: 'Z3', x: 366, y: 494, height: 0 },
    // Unconnected: the panda sign over the platform's end, the pangolin's planter under the stairs
    { id: 'signAt', x: 44, y: 300, height: 2 }, { id: 'planter', x: 214, y: 528, height: 0 },
    // Mocha's perches: the platform bench, the lamp post down in the plaza
    { id: 'benchTop', x: 96, y: 364, height: 2 }, { id: 'lampTop', x: 286, y: 380, height: 2 },
  ],
  edges: [
    { a: 'P0', b: 'P1', kind: 'crawl' }, { a: 'P1', b: 'D', kind: 'crawl' }, { a: 'D', b: 'P3', kind: 'crawl' },
    { a: 'P3', b: 'S', kind: 'crawl' },
    // Down the station's stairs: a grown-up's step (he can't climb yet; the keeper carries him)
    { a: 'S', b: 'Z1', kind: 'climb' },
    { a: 'Z1', b: 'Z2', kind: 'crawl' }, { a: 'Z2', b: 'Z3', kind: 'crawl' },
    { a: 'benchTop', b: 'lampTop', kind: 'jump' },
  ],
  parts: [
    // The night-shift zookeeper dozing at the top of the stairs: 抱抱, and he carries him down
    { id: 'keeper', preset: 'carrier', route: ['S', 'Z1'], hit: { x: 198, y: 316, w: 56, h: 104 }, art: 'c7/zookeeper' },
  ],
  perches: [
    { id: 'bench', node: 'benchTop', reachNode: 'P1' },
    // Down in the plaza: from the platform he can only reach for him from the top of the stairs
    { id: 'lamp', node: 'lampTop', reachNode: 'Z1' },
  ],
  creatures: [
    // Night herons dozing on the plaza's path: 飛機！ lifts them off (and the next one brings them back)
    { id: 'herons', positions: { path: 'Z2', sky: 'offpage' }, initial: 'path', winged: true, art: 'c7/night-heron' },
    // A pangolin asleep in the planter: 掰掰 and he curls up into a ball (and uncurls)
    {
      id: 'pangolin', positions: { asleep: 'planter', curled: 'planter' }, initial: 'asleep', blocks: false,
      react: [
        { on: 'wave', when: { creature: 'pangolin', at: 'asleep' }, to: 'curled' },
        { on: 'wave', when: { creature: 'pangolin', at: 'curled' }, to: 'asleep' },
      ],
      art: 'c7/pangolin',
    },
  ],
  attractors: [
    // The zoo's panda sign, lit and glittering: a decoy, seen from the platform only
    { id: 'sign', kind: 'shiny', node: 'signAt', decoy: true, art: 'c7/panda-sign', visibleWhen: { not: IN_PLAZA } },
    // The bead in the zoo's gateway, seen from the plaza only
    { id: 'bead', kind: 'shiny', node: 'Z3', goal: true, visibleWhen: IN_PLAZA },
  ],
  baby: { start: 'D', facing: 'l' },
  mocha: { start: 'bench' },
  // 掰掰 to the sleeping pangolin: he curls up into a ball
  mischief: { text: '對睡覺的穿山甲說掰掰', when: { type: 'wave', when: { creature: 'pangolin', at: 'curled' } } },
  // On the zoo's gateway arch, seen once the herons lift off
  tudigong: { x: 352, y: 408, visibleWhen: { creature: 'herons', at: 'sky' }, hat: '叢林帽' },
  solution: [
    { mocha: 'lamp' }, { wait: 'settle' }, { say: 'no' }, { wait: 'settle' }, { say: 'hug' }, { wait: 'settle' },
    { say: 'plane' }, { wait: 'goal' },
  ],
  lines: {
    // 廣播姊姊's next ride line (§ 5.3, cycling on from 6-1's)
    intro: ['rec.pa.ride.2'],
    // The keeper wakes to 抱抱 and carries him down the stairs
    onEvent: [{ when: { type: 'partEnter', id: 'keeper', when: { part: 'keeper', in: ['carrying@0'] } }, line: 'c7p1.keeper.1' }],
  },
});
