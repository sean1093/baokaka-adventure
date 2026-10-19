import { describe, expect, test } from 'vitest';
import { initialState } from '../core/state';
import type { NodeDef } from '../core/types';
import { pageById } from '../pages';
import { copyTs, formatNodes, formatTracks, tsLiteral } from './copyTs';
import { moveNode, moveTrackEnd } from './labModel';

/** PageLab's 「Copy TS」 formatter (#91). */

/** Evaluates a TS/JS literal the formatter wrote (it only writes plain data). */
const evaluate = (src: string): unknown => new Function(`return (${src});`)();

describe('tsLiteral', () => {
  test.each<[unknown, string]>([
    ['a', "'a'"],
    ["it's", "'it\\'s'"],
    [3, '3'],
    [-1.5, '-1.5'],
    [true, 'true'],
    [null, 'null'],
    [[1, 2], '[1, 2]'],
    [{}, '{}'],
    [{ a: 1, 'b-c': 'x', u: undefined }, "{ a: 1, 'b-c': 'x' }"],
  ])('%j → %s', (value, out) => {
    expect(tsLiteral(value)).toBe(out);
  });

  test('round-trips nested page data', () => {
    const node: NodeDef = { id: 'T1', x: 0, y: 0, height: 0, attach: { part: 'train', pos: { out: [60, 430], half: [150, 430] } }, tags: ['wet'] };
    expect(evaluate(tsLiteral(node))).toEqual(node);
  });
});

describe('formatNodes / formatTracks', () => {
  const c1p2 = pageById('c1p2')!;

  test("1-2's nodes in the page file's style, and they evaluate back to the data", () => {
    const block = formatNodes(c1p2.nodes);
    expect(block.split('\n')[0]).toBe('  nodes: [');
    expect(block).toContain("    { id: 'L1', x: 40, y: 430, height: 0 },");
    expect(block).toContain("    { id: 'T1', x: 0, y: 0, height: 0, attach: { part: 'train', pos: { out: [60, 430], half: [150, 430], full: [190, 430] } } },");
    expect(block.endsWith('\n  ],')).toBe(true);
    expect(evaluate(`{${block}}`)).toEqual({ nodes: c1p2.nodes });
  });

  test('rounds dragged fractions to whole units', () => {
    expect(formatNodes([{ id: 'a', x: 10.4, y: 19.6, height: 1 }], '')).toBe("nodes: [\n  { id: 'a', x: 10, y: 20, height: 1 },\n],");
    expect(formatTracks([{ id: 'p', preset: 'tab', hit: { x: 0, y: 0, w: 48, h: 48 }, art: 'x', track: { from: [1.2, 2.5], to: [3, 4.49] } }], '')).toBe("// part 'p'\ntrack: { from: [1, 3], to: [3, 4] },");
  });

  test('one track line per part with a track', () => {
    expect(formatTracks(c1p2.parts)).toBe("  // part 'train'\n  track: { from: [80, 610], to: [200, 610] },");
    expect(formatTracks(c1p2.parts.filter((p) => p.id === 'board'))).toBe('');
  });
});

describe('copyTs after edits', () => {
  const c1p2 = pageById('c1p2')!;
  const s0 = initialState(c1p2);

  test('carries the moved node, the moved attach position for the current state and the moved track', () => {
    let def = moveNode(c1p2, s0, 'R2', [330.4, 425]);
    def = moveNode(def, s0, 'T1', [64, 431]);
    def = moveTrackEnd(def, 'train', 'to', [210, 612]);
    const ts = copyTs(def);
    expect(ts.split('\n')[0]).toContain('c1p2');
    expect(ts).toContain("{ id: 'R2', x: 330, y: 425, height: 0 }");
    expect(ts).toContain('pos: { out: [64, 431], half: [150, 430], full: [190, 430] }');
    expect(ts).toContain('track: { from: [80, 610], to: [210, 612] },');
  });

  test('a page with no tracks prints only its nodes', () => {
    const c0p1 = pageById('c0p1')!;
    const ts = copyTs({ ...c0p1, parts: c0p1.parts.map(({ track: _t, ...p }) => p) });
    expect(ts).not.toContain('track:');
    expect(ts).toContain('nodes: [');
  });
});
