import type { EdgeDef, NodeDef, PageDef, PartDef } from '../types';

/**
 * Builders for the tiny pages the engine tests use (#84 onward). `page` fills every field a test
 * doesn't care about; Baokaka starts on the first node, facing right, and Mocha is off the page.
 */
export function page(p: Partial<PageDef> & Pick<PageDef, 'nodes' | 'edges'>): PageDef {
  return {
    id: 'toy',
    chapter: 0,
    index: 1,
    title: '玩具',
    difficulty: 1,
    backdrop: 'toy',
    parts: [],
    perches: [],
    attractors: [],
    creatures: [],
    baby: { start: p.nodes[0].id, facing: 'r' },
    mocha: { start: null },
    mischief: { text: '', when: { type: 'ride' } },
    tudigong: { x: 0, y: 0, hat: '' },
    solution: [],
    ...p,
  };
}

/** A node at (x, y). */
export const n = (id: string, x: number, y = 0, height: 0 | 1 | 2 = 0, more: Partial<NodeDef> = {}): NodeDef => ({ id, x, y, height, ...more });

/** A crawl edge (or `more.kind`). */
export const e = (a: string, b: string, more: Partial<EdgeDef> = {}): EdgeDef => ({ a, b, kind: 'crawl', ...more });

/** Nodes 'A', 'B', … 100 units apart on the line y = 0, chained by crawl edges. */
export const line = (ids: string) => ({
  nodes: [...ids].map((id, i) => n(id, i * 100)),
  edges: [...ids].slice(1).map((id, i) => e(ids[i], id)),
});

/** A part whose hit area is a 48×48 square centred on (x, y). */
export const part = (id: string, preset: PartDef['preset'], x: number, y: number, more: Partial<PartDef> = {}): PartDef => ({
  id,
  preset,
  hit: { x: x - 24, y: y - 24, w: 48, h: 48 },
  art: `toy/${id}`,
  ...more,
});
