import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 10-3 「八節」 · difficulty 5 · par 5: the chapter's hardest pure puzzle. Up the
 * outside of 101: of its eight stacked sections, three on this page turn (`section` parts, three
 * turns each: left, centre, right), each with a balcony ledge that turns with it. With all three
 * turned to the centre the ledges stack straight up — a way to climb to the bead on the top one.
 * Only the middle section has a crank (a **wheel**, the window-washer's), and it is **coupled** to
 * both its neighbours: turn it and the sections above and below turn with it, the same way, the same
 * number of steps. Mocha sitting on the rim of the bottom or the top section holds it still
 * (`lockedByCat`), and the middle turns past it (the clutch slips, D-91). Built on #127's `toy-101`.
 *
 * The bottom and top sections start in line and the middle one out (`1 · 0 · 1`): one turn of the
 * crank can't mend that — it turns all three. Turn the crank to the right (`0 · 2 · 0`); Mocha onto
 * the top section's rim; the crank back a step (the bottom comes with it: `1 · 0 · 0`); Mocha onto the
 * bottom section's rim; the crank a step on (the top comes with it: `1 · 1 · 1`). The ledges line up
 * and he climbs to the bead. The 淘氣: turn all three sections to the same side — the 101 smiles.
 *
 * ```
 *   beam (Mocha, the window-washer's gondola)
 *        T (the top section's ledge: bead)   ·  · · rimTop (Mocha: holds the top)
 *        M (the middle's ledge)                   crank ⟳ (turns the middle, and its neighbours)
 *        L (the bottom section's ledge)      ·  · · rimLow (Mocha: holds the bottom)
 *   F1 (start) ── F2 ── F (the tower's foot) ═climb (each when the sections below are in line)═ L ═ M ═ T
 * ```
 */
const TURN = ['0', '1', '2'];
/** A ledge on a section: where it is in each of the section's turns (in line at '1', the centre). */
const ledge = (part: string, y: number): { part: string; pos: Record<string, [number, number]> } => ({
  part,
  pos: { '0': [140, y], '1': [210, y], '2': [280, y] },
});
const IN_LINE = (...ids: string[]) => ({ all: ids.map((id) => ({ part: id, in: ['1'] })) });
const SAME_SIDE = { any: ['0', '2'].map((s) => ({ all: ['low', 'mid', 'top'].map((id) => ({ part: id, in: [s] })) })) };

export default definePage({
  id: 'c10p3', chapter: 10, index: 3, title: '八節', difficulty: 5, backdrop: 'c10/tower-sections',
  nodes: [
    // The terrace at the tower's foot
    { id: 'F1', x: 40, y: 486, height: 0 }, { id: 'F2', x: 120, y: 486, height: 0 }, { id: 'F', x: 210, y: 486, height: 0 },
    // The sections' ledges, turning with them
    { id: 'L', x: 210, y: 430, height: 1, attach: ledge('low', 430) },
    { id: 'M', x: 140, y: 374, height: 1, attach: ledge('mid', 374) },
    { id: 'T', x: 210, y: 318, height: 1, attach: ledge('top', 318) },
    // Mocha: the window-washer's gondola, the bottom and top sections' rims
    { id: 'beamTop', x: 62, y: 196, height: 2 },
    { id: 'rimLowTop', x: 344, y: 420, height: 2 }, { id: 'rimTopTop', x: 344, y: 300, height: 2 },
  ],
  edges: [
    { a: 'F1', b: 'F2', kind: 'crawl' }, { a: 'F2', b: 'F', kind: 'crawl' },
    { a: 'F', b: 'L', kind: 'climb', when: IN_LINE('low') },
    { a: 'L', b: 'M', kind: 'climb', when: IN_LINE('low', 'mid') },
    // The last ledge only with the whole column in line
    { a: 'M', b: 'T', kind: 'climb', when: IN_LINE('low', 'mid', 'top') },
    { a: 'beamTop', b: 'rimLowTop', kind: 'jump' }, { a: 'beamTop', b: 'rimTopTop', kind: 'jump' },
  ],
  parts: [
    // The bottom and top sections: no crank of their own; the middle turns them, unless Mocha sits on them
    { id: 'low', preset: 'section', states: TURN, initial: '1', lockedByCat: true, hit: { x: 182, y: 402, w: 56, h: 56 }, art: 'c10/tower-section' },
    // The middle section's crank: turns it, and its neighbours with it
    { id: 'mid', preset: 'wheel', states: TURN, initial: '0', coupled: ['low', 'top'], center: [66, 374], radius: 26,
      hit: { cx: 66, cy: 374, r: 30 }, art: 'c10/section-crank' },
    { id: 'top', preset: 'section', states: TURN, initial: '1', lockedByCat: true, hit: { x: 182, y: 290, w: 56, h: 56 }, art: 'c10/tower-section' },
  ],
  perches: [
    { id: 'beam', node: 'beamTop', reachNode: 'F1' },
    { id: 'rimLow', node: 'rimLowTop', reachNode: 'F', onPart: 'low' },
    { id: 'rimTop', node: 'rimTopTop', reachNode: 'F', onPart: 'top' },
  ],
  creatures: [],
  attractors: [{ id: 'bead', kind: 'shiny', node: 'T', goal: true }],
  baby: { start: 'F1', facing: 'r' },
  mocha: { start: 'beam' },
  // A pure puzzle (§ 4.4): no words up the tower's face. With all seven offered the page explored
  // 13,340 states (a refusal or a cry in every alignment) for nothing the puzzle uses; without, 667
  words: [],
  mischief: { text: '讓101的三節轉到同一邊', when: { type: 'partEnter', when: SAME_SIDE } },
  // In a window of the top section, seen when it is turned to the left
  tudigong: { x: 150, y: 270, visibleWhen: { part: 'top', in: ['0'] }, hat: '清潔帽' },
  // Mocha on the gondola first (already there at the start): a hint from a rim he sat on too early takes him back
  solution: [
    { mocha: 'beam' }, { set: 'mid', to: '2' }, { mocha: 'rimTop' }, { wait: 'settle' }, { set: 'mid', to: '0' },
    { mocha: 'rimLow' }, { wait: 'settle' }, { set: 'mid', to: '1' }, { wait: 'goal' },
  ],
  lines: {
    onEvent: [{ when: { type: 'partEnter', when: SAME_SIDE }, line: 'c10p3.mocha.1' }],
  },
});
