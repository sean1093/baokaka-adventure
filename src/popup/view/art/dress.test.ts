import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test, vi } from 'vitest';
import { kitCtx } from '../../art';
import { initialState } from '../../core';
import { ALL_PAGES as PAGES, pageById } from '../../pages';
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
    const pages = PAGES;
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
    for (const card of ['plant', 'blocks', 'luggage', 'shrub', 'azalea'] as const) expect(foregroundCard(ctx, card)).not.toMatch(/\bfilter=/);
  });

  test('chapter 2 (#115): a run wholly past the split takes the split\'s material; the park\'s paths, bridge, boardwalk and stage', () => {
    const ctx = kitCtx('t');
    const c2p1 = page('c2p1');
    const [car, platform] = stageOf(c2p1).runs;
    const dressed = (def: ReturnType<typeof page>, run: (typeof car)) => dressedLedge(ctx, run, (y) => ledgeStyleOf(def, y), 'city', dressOf(def).ledgeSplit);
    expect(dressed(c2p1, car)).toBe(styledLedge(ctx, car, 'carBodyXinyi', 'city'));
    expect(dressed(c2p1, platform)).toBe(styledLedge(ctx, platform, 'granite', 'city'));
    expect(ledgeStyleOf(page('c2p2'), 444)).toBe('stage');
    expect(ledgeStyleOf(page('c2p2'), 490)).toBe('parkPath');
    expect(ledgeStyleOf(page('c2p5'), 474)).toBe('boardwalk');
    // 2-3's bridge node is a single-node run: on a park path it is the little arched bridge
    const bridge = stageOf(page('c2p3')).runs.find((r) => r.single)!;
    expect(styledLedge(ctx, bridge, 'parkPath', 'city')).not.toBe(styledLedge(ctx, bridge, 'brick', 'city'));
  });

  test('chapter 2 (#115): the gap and the stream show no rail (the art is the obstacle); park pages carry drifting fireflies', () => {
    expect(draw('c2p1')).toContain('data-crossing="door-P1"></g>');
    expect(draw('c2p6')).toContain('data-crossing="L2-C1"></g>');
    // Elsewhere the stage's rail still stands at a closed crossing (0-1's crib)
    expect(draw('c0p1')).toMatch(/data-crossing="[^"]+"><g data-anim/);
    for (const id of ['c2p2', 'c2p3', 'c2p4', 'c2p5', 'c2p6']) expect(draw(id), id).toContain(`data-fireflies="${dressOf(page(id)).fireflies}"`);
    expect(draw('c2p1')).not.toContain('data-fireflies');
  });

  test('chapter 3 (#117): the campus\'s materials — car, walks, promenade and nest, gallery and floor, desk, book and stack', () => {
    const ctx = kitCtx('t');
    const c3p1 = page('c3p1');
    const [run] = stageOf(c3p1).runs;
    expect(ledgeStyleOf(c3p1, 470)).toBe('carBodySongshan');
    expect(dressOf(c3p1).ledgeSplit).toEqual({ x: 284, style: 'granite' });
    expect(dressedLedge(ctx, run, () => 'carBodySongshan', 'city', dressOf(c3p1).ledgeSplit)).toContain('clip-path');
    expect(ledgeStyleOf(page('c3p2'), 484)).toBe('campusPath');
    expect(ledgeStyleOf(page('c3p3'), 462)).toBe('lakeside');
    expect(ledgeStyleOf(page('c3p5'), 300)).toBe('gallery');
    expect(ledgeStyleOf(page('c3p5'), 500)).toBe('libraryFloor');
    // Single-node runs: 3-3's nest is a hummock on the bank, 3-6's stack under 藍教授 a pile of books
    const nest = stageOf(page('c3p3')).runs.find((r) => r.single)!;
    const stack = stageOf(page('c3p6')).runs.find((r) => r.single)!;
    expect(styledLedge(ctx, nest, 'lakeside', 'city')).not.toBe(styledLedge(ctx, nest, 'brick', 'city'));
    expect(styledLedge(ctx, stack, 'bookPage', 'city')).not.toBe(styledLedge(ctx, stack, 'brick', 'city'));
    // The bikes, the shelves and the bookmark gap are their own obstacles: no rail
    for (const id of ['c3p2', 'c3p5', 'c3p6']) expect(dressOf(page(id)).crossing, id).toBe('none');
    for (const id of ['c3p1', 'c3p2', 'c3p3', 'c3p4', 'c3p5', 'c3p6']) expect(draw(id), id).not.toMatch(/\bfilter=/);
  });
});
