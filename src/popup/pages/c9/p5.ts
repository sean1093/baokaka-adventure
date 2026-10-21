import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 9-5 「淡江大橋」 (the 淡江大橋's single tower at the river mouth) · difficulty 4 ·
 * par 4. The bridge deck's walkway ends at a gap; across it is the tower's base, and on the tower's
 * maintenance ledge the bead (height 1: he can take it standing beside it, `reachHigh`). Over the gap
 * hangs the maintenance platform (a **lift**: `up` / `down`), lowered only by the tower's tune: three
 * of the stay cables, tapped like harp strings (each a **prop**: Sol, La, Do), playing the notes on the
 * maintenance box's plate — 生日快樂's first three, Sol Sol La (`tune`, a **section** the cables turn; a
 * note out of turn is simply not the next one: it never sets you back). Gulls roost on the cables, and
 * a cable with a gull on it won't ring (`lockedWhen`). High above, a little cloud circles the tower: 咻咻.
 *
 * The bead glints on the ledge: he crawls to the edge of the gap and reaches. 飛機！: the gulls lift off
 * the cables. Sol, Sol, La: the platform comes down. He crawls across onto the tower's base — and meets
 * 咻咻 (§ 5.2 ch9, the world held for each line: 「咻咻想飛出去……飛不出去。」 … 「一起！」「……不要！」
 * 「小雲哭著，往101飛走了。」「……追。」). Going on, he stands at the ledge and takes the bead; the cloud
 * flies off toward 101. The 淘氣: finish the song's first line — Sol, Do right after the plate's three
 * notes (a wrong note there goes back to the plate's end).
 *
 * ```
 *       (咻咻 circling the tower)                     cables: Sol · La · Do (gulls on them: 飛機！)
 *   lamp (Mocha) ─jump─ beam (Mocha, over the gap)    tune: Sol Sol La lowers the platform; then Sol Do: the 淘氣
 *   D1 (start) ── D2 ── D3 ═(down: crawl)═ L (platform) ═(down: crawl)═ T1 (meet 咻咻) ── T2 ·jump· ledge (bead, height 1)
 * ```
 */
const NOTES = ['still', 'hum'];
const DOWN = { part: 'lift', in: ['down'] };
const GULLS_ON = { creature: 'gulls', at: 'cables' };
/** A stay cable: tap it and it rings (each tap a note), unless a gull sits on it. */
const cable = (id: string, x: number, y: number) => ({
  id, preset: 'prop' as const, states: NOTES, hit: { x, y, w: 56, h: 56 }, lockedWhen: GULLS_ON, art: `c9/cable-${id === 'doh' ? 'do' : id}`,
});
/** A note played on cable `id` (any tap: the prop toggles). */
const NOTE = (id: string) => ({ type: 'partEnter' as const, id });
const TUNE = (...states: string[]) => ({ part: 'tune', in: states });
/**
 * The tune's steps on each note, `from` → `to` (states 0–5: notes of Sol Sol La Sol Do played so far).
 * Up to the plate's three a note out of turn changes nothing; after them, the 淘氣's two notes must
 * follow at once (a wrong one goes back to 3, the platform staying down). 5 stays.
 */
const STEPS: Readonly<Record<string, readonly [string, string][]>> = {
  sol: [['0', '1'], ['1', '2'], ['3', '4']],
  la: [['2', '3'], ['4', '3']],
  doh: [['4', '5']],
};
const tuneReactions = Object.entries(STEPS).flatMap(([note, steps]) => steps.map(([from, to]) => ({ on: NOTE(note), when: TUNE(from), to })));
/** The beat on reaching the tower's base (each line holds the world until it has been read). */
const MEET = { type: 'babyEnter' as const, id: 'T1' };
const BEAT = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `c9p5.shushu.${i}`);
const SONG = { type: 'partEnter' as const, id: 'tune', when: TUNE('5') };

export default definePage({
  id: 'c9p5', chapter: 9, index: 5, title: '淡江大橋', difficulty: 4, backdrop: 'c9/tamkang-bridge',
  nodes: [
    // The deck's walkway, to the gap
    { id: 'D1', x: 36, y: 470, height: 0 }, { id: 'D2', x: 92, y: 470, height: 0 }, { id: 'D3', x: 148, y: 470, height: 0 },
    // The maintenance platform: up under the tower's crossbeam, or down in the gap
    { id: 'L', x: 206, y: 470, height: 0, attach: { part: 'lift', pos: { up: [206, 330], down: [206, 470] } } },
    // The tower's base, and its maintenance ledge
    { id: 'T1', x: 264, y: 470, height: 0 }, { id: 'T2', x: 318, y: 470, height: 0 },
    { id: 'ledge', x: 364, y: 428, height: 1 },
    // Unconnected: the gulls' roost on the cables; where 咻咻 circles the tower
    { id: 'roost', x: 196, y: 238, height: 2 }, { id: 'cloud', x: 300, y: 170, height: 2 },
    // Mocha's perches: the deck's lamp, the crossbeam over the gap
    { id: 'lampTop', x: 40, y: 376, height: 2 }, { id: 'beamTop', x: 148, y: 384, height: 2 },
  ],
  edges: [
    { a: 'D1', b: 'D2', kind: 'crawl' }, { a: 'D2', b: 'D3', kind: 'crawl' },
    // Across the gap on the lowered platform
    { a: 'D3', b: 'L', kind: 'crawl', when: DOWN }, { a: 'L', b: 'T1', kind: 'crawl', when: DOWN },
    { a: 'T1', b: 'T2', kind: 'crawl' },
    // The maintenance ledge: a cat's hop (standing beside it, he can reach the bead)
    { a: 'T2', b: 'ledge', kind: 'jump' },
    { a: 'lampTop', b: 'beamTop', kind: 'jump' },
  ],
  parts: [
    // Three stay cables, long to short: Sol, La, Do
    cable('sol', 62, 250), cable('la', 134, 216), cable('doh', 206, 182),
    // The tower's tune, as the maintenance box hears it: its dial turns a notch per note of the line
    { id: 'tune', preset: 'section', states: ['0', '1', '2', '3', '4', '5'], hit: { x: 242, y: 356, w: 56, h: 56 }, art: 'c9/tune-dial',
      react: tuneReactions },
    // The maintenance platform: down when the plate's three notes are played, and it stays down
    { id: 'lift', preset: 'lift', states: ['up', 'down'], hit: { x: 178, y: 300, w: 56, h: 56 }, art: 'c9/maintenance-lift',
      react: [{ on: { type: 'partEnter', id: 'tune', state: '3' }, to: 'down' }] },
  ],
  perches: [
    { id: 'lamp', node: 'lampTop', reachNode: 'D1' },
    { id: 'beam', node: 'beamTop', reachNode: 'D3' },
  ],
  creatures: [
    // Gulls roosting on the cables: 飛機！ and they lift off (the next brings them back)
    { id: 'gulls', positions: { cables: 'roost', sky: 'offpage' }, initial: 'cables', blocks: false, winged: true, art: 'c9/gulls' },
    // 咻咻, circling the tower: as he goes on past the tower's base after their talk, it flies off toward 101
    { id: 'shushu', positions: { tower: 'cloud', gone: 'offpage' }, initial: 'tower', blocks: false,
      react: [{ on: { type: 'babyEnter', id: 'T2' }, to: 'gone' }], art: 'common/shushu' },
  ],
  // The bead on the tower's maintenance ledge
  attractors: [{ id: 'bead', kind: 'shiny', node: 'ledge', height: 1, goal: true }],
  baby: { start: 'D1', facing: 'r' },
  mocha: { start: 'lamp' },
  mischief: { text: '用鋼索彈出〈生日快樂〉的第一句', when: SONG },
  // High on the tower where the cables are anchored, seen once the gulls are up
  tudigong: { x: 350, y: 220, visibleWhen: { creature: 'gulls', at: 'sky' }, hat: '船長帽' },
  solution: [{ say: 'plane' }, { tap: 'sol' }, { tap: 'sol' }, { tap: 'la' }, { wait: 'goal' }],
  // The maintenance box's plate: the tune, Sol Sol La
  cutouts: [{ art: 'c9/tune-plate', x: 0, y: 0 }],
  lines: {
    onEvent: [
      // § 5.2 9-5: meeting 咻咻 at the tower's base
      ...BEAT.map((line) => ({ when: MEET, line, pause: true })),
      // 生日快樂 on the cables
      { when: SONG, line: 'c9p5.mocha.1' },
    ],
  },
});
