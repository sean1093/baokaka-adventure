import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test, vi } from 'vitest';
import { kitCtx } from '../../art';
import { initialState } from '../../core';
import { pageById } from '../../pages';
import { PageView } from '../PageView';
import { stageOf } from '../stage';
import { STAGE_DRESS, dressOf, ledgeStyleOf, ownsPost } from './dress';
import { dressedLedge, foregroundCard, styledLedge } from './ledges';

/** #108: a page's own art dresses the live stage — its ledges' material, the furniture it draws itself, its corner card. */

vi.spyOn(console, 'info').mockImplementation(() => {});

const page = (id: string) => pageById(id)!;
const draw = (id: string) => {
  const def = page(id);
  const s = initialState(def);
  return renderToStaticMarkup(createElement(PageView, { def, prev: s, state: s, ms: 0, tickMs: 500 }));
};

describe('stage dress', () => {
  test('ledge materials by backdrop: the crib above the gutter and 巧拼 below on 0-1; brick and rugs by default', () => {
    expect(ledgeStyleOf(page('c0p1'), 330)).toBe('crib');
    expect(ledgeStyleOf(page('c0p1'), 440)).toBe('playmat');
    expect(ledgeStyleOf(page('c0p2'), 470)).toBe('playmat');
    expect(ledgeStyleOf({ backdrop: 'x/none', chapter: 1 }, 400)).toBe('brick');
    expect(ledgeStyleOf({ backdrop: 'x/none', chapter: 0 }, 400)).toBe('rug');
    expect(dressOf({ backdrop: 'x/none' })).toEqual({});
  });

  test('a backdrop that draws a perch\'s furniture removes the stage\'s post; others keep theirs', () => {
    const c0p3 = draw('c0p3');
    for (const id of ['sofaArm', 'table', 'shelf']) {
      expect(ownsPost(page('c0p3'), id)).toBe(true);
      expect(c0p3).not.toContain(`data-post="${id}"`);
    }
    // 0-4's laundry basket stays the stage's (Mocha's in-box frame sits on its rim at the node)
    expect(draw('c0p4')).toContain('data-post="basket"');
    expect(draw('c0p4')).not.toContain('data-post="sill"');
  });

  test('every owned post names a perch on a page that uses the backdrop', () => {
    const pages = ['c0p1', 'c0p2', 'c0p3', 'c0p4', 'c1p1', 'c1p2', 'c1p3', 'c1p4', 'c1p5', 'c1p6'].map(page);
    for (const [key, dress] of Object.entries(STAGE_DRESS)) {
      const perches = new Set(pages.filter((p) => p.backdrop === key).flatMap((p) => p.perches.map((x) => x.id)));
      for (const id of dress.ownPosts ?? []) expect(perches.has(id), `${key}: ${id}`).toBe(true);
    }
  });

  test('0-4\'s run turns from play-mat to balcony at the door; the corner card follows the dress', () => {
    const def = page('c0p4');
    const run = stageOf(def).runs.find((r) => r.y === 486)!;
    const ctx = kitCtx('t');
    const split = dressedLedge(ctx, run, (y) => ledgeStyleOf(def, y), 'room', dressOf(def).ledgeSplit);
    expect(split).toContain('clip-path');
    expect(split).toContain(styledLedge(ctx, run, 'balcony', 'room'));
    expect(draw('c0p1')).toContain('data-foreground="blocks"');
    expect(draw('c0p3')).not.toContain('data-foreground');
    for (const card of ['plant', 'blocks', 'luggage'] as const) expect(foregroundCard(ctx, card)).not.toMatch(/\bfilter=/);
  });
});
