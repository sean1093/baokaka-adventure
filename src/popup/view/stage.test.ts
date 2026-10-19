import { describe, expect, test } from 'vitest';
import { e, n, page } from '../core/fixtures/toy';
import { pageById } from '../pages';
import { PAGES } from '../pages';
import { foregroundBox, foregroundSlot, keepClear, stageOf, uncovered } from './stage';

/** The placeholder scenery derived from the walk graph (#89). */

const c1p2 = pageById('c1p2')!;
const c0p1 = pageById('c0p1')!;

describe('stage from the walk graph', () => {
  test('1-2: two platforms, the pillar and the bench, the train bridging the gap', () => {
    const s = stageOf(c1p2);
    expect(s.runs.map((r) => r.nodes)).toEqual([['L1', 'L2', 'L3'], ['R1', 'R2']]);
    expect(s.runs[0]).toMatchObject({ toLeft: true, x1: 164, y: 430 });
    expect(s.runs[1]).toMatchObject({ x0: 236, toRight: true });
    expect(s.posts.map((p) => [p.perch, p.kind, p.foot])).toEqual([['bench', 'bench', 424], ['pillar', 'pillar', 424]]);
    expect(s.carriages).toEqual([{ part: 'train', nodes: ['T1', 'T2'], x0: 60, x1: 230, y: 430, gap: [164, 236] }]);
    expect(s.crossings).toEqual([]);
  });

  test('0-1: the crib, the pillow and the rug; the crib rail blocks the crossing until the tab opens it', () => {
    const s = stageOf(c0p1);
    expect(s.runs.map((r) => [r.nodes, r.single])).toEqual([[['crib1', 'crib2'], false], [['pillow'], true], [['rug1', 'rug2'], false]]);
    expect(s.slopes.map((sl) => [sl.a, sl.b])).toEqual([['pillow', 'rug1']]);
    expect(s.crossings).toHaveLength(1);
    expect(s.crossings[0]).toMatchObject({ a: 'crib2', b: 'pillow', part: 'crib-rail', rail: [200, 330] });
    // The crib runs on to its rail
    expect(s.runs[0].x1).toBe(206);
  });

  test('0-4 (#106): the doorway is floor, not a carriage; the sill, rod and roof are wall shelves, the basket a basket', () => {
    const s = stageOf(pageById('c0p4')!);
    expect(s.runs.map((r) => r.nodes)).toEqual([['rug1', 'rug2', 'rug3', 'door', 'trainStep']]);
    expect(s.carriages).toEqual([]);
    expect(Object.fromEntries(s.posts.map((p) => [p.perch, p.kind]))).toEqual({ sill: 'shelf', basket: 'basket', rod: 'shelf', trainRoof: 'shelf' });
    // The basket's rim is the perch node; it stands on the rug
    expect(s.posts.find((p) => p.perch === 'basket')).toMatchObject({ x: 34, top: 420, foot: 480 });
  });

  test('0-3: the table is a bench on the rug; outdoors a high perch is still a pillar', () => {
    const s = stageOf(pageById('c0p3')!);
    expect(Object.fromEntries(s.posts.map((p) => [p.perch, p.kind]))).toEqual({ sofaArm: 'bench', table: 'bench', shelf: 'shelf' });
    expect(stageOf(c1p2).posts.find((p) => p.perch === 'pillar')?.kind).toBe('pillar');
  });

  test('unconnected nodes and cat-only edges draw no ledge', () => {
    const s = stageOf(page({ nodes: [n('A', 0), n('B', 100), n('C', 200, 0, 2), n('lone', 300)], edges: [e('A', 'B'), e('B', 'C', { kind: 'jump' })] }));
    expect(s.runs.flatMap((r) => r.nodes)).toEqual(['A', 'B']);
  });

  test('uncovered: the longest stretch no interval covers', () => {
    expect(uncovered(0, 100, [[-10, 30], [60, 120]])).toEqual([30, 60]);
    expect(uncovered(0, 100, [[-10, 120]])).toBeNull();
    expect(uncovered(0, 100, [])).toEqual([0, 100]);
  });
});

describe('the foreground card (bible § 2.2)', () => {
  const overlaps = (a: ReturnType<typeof foregroundBox>, b: ReturnType<typeof foregroundBox>) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

  test('never covers a touchable, a track or the walk graph, on any page', () => {
    for (const def of PAGES) {
      const slot = foregroundSlot(def);
      if (slot === null) continue;
      const box = foregroundBox(slot.x, slot.foot);
      for (const clear of keepClear(def)) expect(overlaps(box, clear), def.id).toBe(false);
    }
  });

  test('goes to the other corner, or nowhere, when a corner is busy', () => {
    const busyRight = page({ nodes: [n('A', 370, 600)], edges: [] });
    expect(foregroundSlot(busyRight)?.x).toBe(16);
    const busy = page({ nodes: [n('A', 370, 600), n('B', 20, 600)], edges: [] });
    expect(foregroundSlot(busy)).toBeNull();
  });
});
