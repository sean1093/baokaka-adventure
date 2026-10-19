import { describe, expect, test } from 'vitest';
import { CHAPTER_MS, FOLD_EACH_MS, FOLD_GROUPS, FOLD_MS, FOLD_STAGGER_MS, POPUP_LAYERS, REDUCED_MS, RISE_EACH_MS, RISE_GROUPS, STAGGER_MS, turnPlan } from './pageTurn';
import { LAYERS } from '../layers';

/** The page fold and the chapter turn's timelines (#97), pinned to popup art bible § 2.4 and § 8. */

describe('turnPlan', () => {
  test('the page fold follows the § 2.4 table: settle 0–150, fold 150–600, leaf 600–900, rise 900–1500', () => {
    const p = turnPlan('fold', false);
    expect(p.fold).toEqual({ start: 150, each: FOLD_EACH_MS, stagger: FOLD_STAGGER_MS });
    expect(p.leaf).toEqual({ start: 600, duration: 300 });
    expect(p.swapAt).toBe(600);
    expect(p.rise.start).toBe(900);
    expect(p.end).toBe(1500);
    expect(p.camera).toBeNull();
    expect(p.card).toBeNull();
    // Every pop-up has folded by the time the leaf falls; every one has risen by the end
    expect(p.fold!.start + (FOLD_GROUPS.length - 1) * p.fold!.stagger + p.fold!.each).toBeLessThanOrEqual(FOLD_MS.foldEnd);
    expect(p.rise.start + (RISE_GROUPS.length - 1) * p.rise.stagger + p.rise.each).toBeLessThanOrEqual(p.end);
  });

  test('§ 8: a fold is 220 ms, a rise 320 ms, staggered 60 ms', () => {
    expect([FOLD_EACH_MS, RISE_EACH_MS, STAGGER_MS]).toEqual([220, 320, 60]);
  });

  test('the chapter turn: ≈ 2.4 s, a camera out and back in, a slower leaf, the card', () => {
    const p = turnPlan('chapter', false);
    expect(p.end).toBe(CHAPTER_MS.end);
    expect(p.end).toBeGreaterThanOrEqual(2200);
    expect(p.end).toBeLessThanOrEqual(2600);
    expect(p.camera).not.toBeNull();
    expect(p.camera!.outEnd).toBeLessThan(p.leaf!.start);
    expect(p.camera!.inStart).toBeGreaterThanOrEqual(p.rise.start);
    // The leaf is slower than the page fold's 300 ms
    expect(p.leaf!.duration).toBeGreaterThan(turnPlan('fold', false).leaf!.duration * 2);
    expect(p.swapAt).toBe(p.leaf!.start);
    expect(p.card).not.toBeNull();
    expect(p.card!.leave).toBeLessThan(p.end);
    // The card waits for any interlude at the swap (the sticker card, #101) before it drops
    expect(p.card!.start).toBeGreaterThan(p.swapAt);
    expect(p.card!.start).toBeLessThan(p.card!.leave);
  });

  test('reduced motion: a 0.25 s cross-fade, no fold, no leaf, no camera, no card', () => {
    for (const kind of ['fold', 'chapter'] as const) {
      const p = turnPlan(kind, true);
      expect(p).toMatchObject({ reduced: true, swapAt: 0, fold: null, leaf: null, camera: null, card: null, end: REDUCED_MS });
      expect(REDUCED_MS).toBe(250);
    }
  });

  test('the folding layers are page layers, near first, and never the backdrop or the hit layer', () => {
    for (const id of POPUP_LAYERS) expect(LAYERS).toContain(id);
    expect(POPUP_LAYERS).not.toContain('backdrop');
    expect(POPUP_LAYERS).not.toContain('hit');
    // Near first: each group folds before the groups drawn under it
    const depth = (ids: readonly string[]) => Math.max(...ids.map((id) => LAYERS.indexOf(id as (typeof LAYERS)[number])));
    const order = FOLD_GROUPS.map(depth);
    expect([...order].sort((a, b) => b - a)).toEqual(order);
    // The rise lifts the same layers, the standees last
    expect([...RISE_GROUPS.flat()].sort()).toEqual([...POPUP_LAYERS].sort());
    expect(RISE_GROUPS[RISE_GROUPS.length - 1]).toContain('actors');
  });
});
