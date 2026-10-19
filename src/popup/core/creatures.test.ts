import { describe, expect, test } from 'vitest';
import { attractorNode, candidates } from './baby';
import { creatureNode, creaturePoint, findCreature, moveCreature, skyPosition } from './creatures';
import { line, n, page } from './fixtures/toy';
import { initialState } from './state';
import type { AttractorDef, CreatureDef } from './types';

const squirrel: CreatureDef = { id: 'squirrel', positions: { tree: 'B', away: 'C', gone: 'offpage' }, initial: 'tree', art: 'squirrel' };
const bead: AttractorDef = { id: 'bead', kind: 'shiny', node: 'B', heldBy: 'squirrel', goal: true };
const def = page({ ...line('ABC'), creatures: [squirrel], attractors: [bead, { id: 'acorn', kind: 'snack', node: 'A' }] });
const s0 = initialState(def);

describe('positions', () => {
  test('a creature stands on its position node; off the page it has none', () => {
    expect(findCreature(def, 'squirrel')).toBe(squirrel);
    expect(findCreature(def, 'nobody')).toBeUndefined();
    expect(creatureNode(def, s0, 'squirrel')).toBe('B');
    expect(creaturePoint(def, s0, 'squirrel')).toEqual([100, 0]);
    const gone = { ...s0, creatures: { squirrel: 'gone' } };
    expect(creatureNode(def, gone, 'squirrel')).toBeNull();
    expect(creaturePoint(def, gone, 'squirrel')).toBeUndefined();
    expect(creatureNode(def, s0, 'nobody')).toBeNull();
    expect(creatureNode(def, { ...s0, creatures: { squirrel: 'nowhere' } }, 'squirrel')).toBeNull();
  });
});

describe('moveCreature and drop', () => {
  test('moves to a known position; unknown positions and creatures change nothing', () => {
    expect(moveCreature(def, s0, 'squirrel', 'away').creatures.squirrel).toBe('away');
    expect(moveCreature(def, s0, 'squirrel', 'moon')).toBe(s0);
    expect(moveCreature(def, s0, 'squirrel', 'tree')).toBe(s0);
    expect(moveCreature(def, s0, 'nobody', 'away')).toBe(s0);
  });

  test('a drop lays the held attractor on the node the creature leaves, for good', () => {
    const away = moveCreature(def, s0, 'squirrel', 'away', 'bead');
    expect(away.dropped).toEqual({ bead: 'B' });
    expect(attractorNode(def, away, bead)).toBe('B');
    // Later moves (and later drops) leave it where it fell.
    const gone = moveCreature(def, away, 'squirrel', 'gone', 'bead');
    expect(gone.dropped).toEqual({ bead: 'B' });
    expect(attractorNode(def, gone, bead)).toBe('B');
    expect(candidates(def, gone).map((c) => c.id)).toContain('bead');
  });

  test('a drop can happen without a move (a `to` equal to where it is)', () => {
    expect(moveCreature(def, s0, 'squirrel', 'tree', 'bead').dropped).toEqual({ bead: 'B' });
  });

  test('without a drop, a held attractor travels with its creature and vanishes off the page', () => {
    const away = moveCreature(def, s0, 'squirrel', 'away');
    expect(away.dropped).toBeUndefined();
    expect(attractorNode(def, away, bead)).toBe('C');
    expect(attractorNode(def, moveCreature(def, s0, 'squirrel', 'gone'), bead)).toBeNull();
  });

  test('nothing drops that the creature does not hold, or while it is off the page', () => {
    expect(moveCreature(def, s0, 'squirrel', 'away', 'acorn').dropped).toBeUndefined();
    expect(moveCreature(def, s0, 'squirrel', 'away', 'ghost').dropped).toBeUndefined();
    const gone = { ...s0, creatures: { squirrel: 'gone' } };
    expect(moveCreature(def, gone, 'squirrel', 'tree', 'bead').dropped).toBeUndefined();
  });
});

describe('skyPosition (飛機！ built in)', () => {
  const bird = (positions: Record<string, string>, more: Partial<CreatureDef> = {}): CreatureDef => ({ id: 'b', positions, initial: 'perch', winged: true, art: 'b', ...more });
  test.each([
    ['ground → sky', bird({ perch: 'A', sky: 'offpage', away: 'B' }), 'perch', 'sky'],
    ['ground → away when there is no sky', bird({ perch: 'A', away: 'offpage' }), 'perch', 'away'],
    ['sky → ground', bird({ perch: 'A', sky: 'offpage' }), 'sky', 'perch'],
    ['any other position → ground', bird({ perch: 'A', away: 'B', nest: 'C' }), 'nest', 'perch'],
    ['no sky position', bird({ perch: 'A', nest: 'C' }), 'perch', null],
    ['not winged', bird({ perch: 'A', away: 'B' }, { winged: false }), 'perch', null],
    ['winged unset', bird({ perch: 'A', away: 'B' }, { winged: undefined }), 'perch', null],
  ] as const)('%s', (_, c, current, expected) => {
    expect(skyPosition(c, current)).toBe(expected);
  });
});

test('n() helper sanity: creature nodes use page coordinates', () => {
  const d = page({ nodes: [n('X', 7, 9)], edges: [], creatures: [{ id: 'c', positions: { p: 'X' }, initial: 'p', art: 'c' }] });
  expect(creaturePoint(d, initialState(d), 'c')).toEqual([7, 9]);
});
