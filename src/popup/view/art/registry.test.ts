import { afterEach, describe, expect, test, vi } from 'vitest';
import { PRESET_ART, kitCtx } from '../../art';
import { backdropArt, creatureArt, noteFallback, partArt, resetFallbackLog } from './registry';
import { origamiPigeon } from './creatures';
import { origamiBird, placeholderBackdrop } from './placeholders';
import { lintMarkup } from '../affordance/lint';

/** The art registry's fallbacks (#89): unknown keys draw the placeholder and are logged once in dev. */

afterEach(() => {
  vi.restoreAllMocks();
  resetFallbackLog();
});

describe('art registry fallback', () => {
  test('unknown keys fall back to the preset art, the placeholder stage and the origami bird', () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    expect(partArt('c1/train-blue', 'tab')).toBe(PRESET_ART.tab);
    expect(backdropArt('c1/hall-night')).toBe(placeholderBackdrop);
    expect(creatureArt('c9/nobody')).toBe(origamiBird);
  });

  test('creatures with their own art (#108): the origami pigeon, the backpacker drawn per position', () => {
    expect(creatureArt('common/pigeon')).toBe(origamiPigeon);
    const ctx = kitCtx('t');
    const asleep = creatureArt('c1/backpacker')(ctx, 'sleep');
    const awake = creatureArt('c1/backpacker')(ctx, 'tucked');
    expect(asleep).not.toBe(awake);
    expect(asleep).toContain('>Z<');
    expect(asleep + awake).not.toMatch(/\bfilter=/);
  });

  test('chapter 2\'s cast and creatures (#115): own art, drawn per position, no filters, never marigold', () => {
    const ctx = kitCtx('t');
    const byPos: Record<string, string[]> = {
      'c2/commuter': ['sleep'], 'c2/sweeper': ['nap'], 'c2/jogger': ['stretch', 'away'], 'c2/painter': ['sleep', 'nodding'],
      'c2/dog': ['sleep', 'away'], 'c2/turtle': ['rest', 'waving'], 'c2/squirrel': ['east', 'low', 'away', 'hat', 'tree'], 'c2/egret': ['pad', 'reeds'],
    };
    for (const [key, positions] of Object.entries(byPos)) {
      expect(creatureArt(key), key).not.toBe(origamiBird);
      const drawn = positions.map((pos) => creatureArt(key)(ctx, pos));
      for (const svg of drawn) {
        expect(svg, key).not.toMatch(/\bfilter=/);
        expect(lintMarkup(svg, { page: key, touchable: () => false, expected: [], where: key }), key).toEqual([]);
      }
    }
    // Positions that look different do: the jogger runs off, the turtle waves, the painter nods, the squirrel naps on the hat
    for (const [key, a, b] of [['c2/jogger', 'stretch', 'away'], ['c2/turtle', 'rest', 'waving'], ['c2/painter', 'sleep', 'nodding'], ['c2/squirrel', 'east', 'hat']]) {
      expect(creatureArt(key)(ctx, a), key).not.toBe(creatureArt(key)(ctx, b));
    }
  });

  test('chapter 3\'s cast and creatures (#117): own art, drawn per position, no filters, never marigold', () => {
    const ctx = kitCtx('t');
    const byPos: Record<string, string[]> = { 'c3/poster': ['still', 'waving'], 'c3/goose': ['nest', 'honk', 'chase'], 'c3/magpie': ['book', 'away'] };
    for (const [key, positions] of Object.entries(byPos)) {
      expect(creatureArt(key), key).not.toBe(origamiBird);
      const drawn = positions.map((pos) => creatureArt(key)(ctx, pos));
      for (const svg of drawn) {
        expect(svg, key).not.toMatch(/\bfilter=/);
        expect(lintMarkup(svg, { page: key, touchable: () => false, expected: [], where: key }), key).toEqual([]);
      }
      expect(new Set(drawn).size, key).toBe(positions.length);
    }
  });

  test('chapter 4\'s cast (#119): own art, drawn per position, no filters, never marigold', () => {
    const ctx = kitCtx('t');
    const byPos: Record<string, string[]> = { 'c4/dancers': ['dance', 'arch'], 'c4/busker': ['sit', 'bow'], 'c4/karaoke-king': ['wings', 'sing'] };
    for (const [key, positions] of Object.entries(byPos)) {
      expect(creatureArt(key), key).not.toBe(origamiBird);
      const drawn = positions.map((pos) => creatureArt(key)(ctx, pos));
      for (const svg of drawn) {
        expect(svg, key).not.toMatch(/\bfilter=/);
        expect(lintMarkup(svg, { page: key, touchable: () => false, expected: [], where: key }), key).toEqual([]);
      }
      expect(new Set(drawn).size, key).toBe(positions.length);
    }
  });

  test('chapter 5\'s cast (#122): own art, drawn per position, no filters, never marigold', () => {
    const ctx = kitCtx('t');
    const byPos: Record<string, string[]> = { 'c5/passengers': ['doze', 'blink'], 'c5/crowd-legs': ['crowd'], 'c5/pachinko-uncle': ['doze', 'laugh'], 'c5/stray-dog': ['nap', 'away'] };
    for (const [key, positions] of Object.entries(byPos)) {
      expect(creatureArt(key), key).not.toBe(origamiBird);
      const drawn = positions.map((pos) => creatureArt(key)(ctx, pos));
      for (const svg of drawn) {
        expect(svg, key).not.toMatch(/\bfilter=/);
        expect(lintMarkup(svg, { page: key, touchable: () => false, expected: [], where: key }), key).toEqual([]);
      }
      expect(new Set(drawn).size, key).toBe(positions.length);
    }
  });

  test('chapter 6\'s cast and riders (#124): own art, no filters, never marigold', async () => {
    const { riderArt } = await import('./riders');
    const ctx = kitCtx('t');
    expect(creatureArt('c6/night-birds')).not.toBe(origamiBird);
    const drawn = ['roost', 'sky'].map((pos) => creatureArt('c6/night-birds')(ctx, pos));
    for (const [key, node] of [['c6/carousel-belt', 'S'], ['c6/carousel-belt', 'caseB'], ['c6/xray-belt', 'T']] as const) {
      const art = riderArt(key, node);
      expect(art, `${key} ${node}`).not.toBeNull();
      drawn.push(art!(ctx));
    }
    expect(riderArt('c6/carousel-belt', 'nope')).toBeNull();
    for (const svg of drawn) {
      expect(svg).not.toMatch(/\bfilter=/);
      expect(lintMarkup(svg, { page: 'c6', touchable: () => false, expected: [], where: 'c6' })).toEqual([]);
    }
    expect(new Set(drawn).size).toBe(drawn.length);
  });

  test('chapter 7\'s cast and riders (#126): own art, no filters, never marigold; riders from the shared module', async () => {
    const { riderArt } = await import('./riders');
    const ctx = kitCtx('t');
    const drawn: string[] = [];
    for (const [key, positions] of [['c7/night-heron', ['path', 'sky']], ['c7/pangolin', ['asleep', 'curled']], ['c7/tea-farmer', ['step', 'up']], ['c7/sleeping-bear', ['bed']]] as const) {
      expect(creatureArt(key), key).not.toBe(origamiBird);
      for (const pos of positions) drawn.push(creatureArt(key)(ctx, pos));
    }
    // Awake (the carrier), the sleeping bear's creature draws nothing off the page
    expect(creatureArt('c7/sleeping-bear')(ctx, 'up')).toBe('');
    for (const [key, node] of [['c7/bullwheel', 'A'], ['c7/bullwheel', 'shop'], ['c6/carousel-belt', 'S']] as const) {
      const art = riderArt(key, node);
      expect(art, `${key} ${node}`).not.toBeNull();
      drawn.push(art!(ctx));
    }
    expect(riderArt('c7/bullwheel', 'nope')).toBeNull();
    for (const svg of drawn) {
      expect(svg).not.toMatch(/\bfilter=/);
      expect(lintMarkup(svg, { page: 'c7', touchable: () => false, expected: [], where: 'c7' })).toEqual([]);
    }
    expect(new Set(drawn).size).toBe(drawn.length);
  });

  test('chapter 8\'s cast and riders (#130): own art, no filters, never marigold', async () => {
    const { riderArt } = await import('./riders');
    const { bathUncleArt, grannyFigure } = await import('./beitou');
    const ctx = kitCtx('t');
    expect(creatureArt('c8/hot-spring-granny'), 'c8/hot-spring-granny').not.toBe(origamiBird);
    const drawn = [creatureArt('c8/hot-spring-granny')(ctx, 'bench'), grannyFigure(ctx), grannyFigure(ctx, true)];
    for (const look of ['idle', 'carrying', 'back', 'done'] as const) drawn.push(bathUncleArt(ctx, look));
    const tray = riderArt('c8/book-belt', 'T');
    expect(tray).not.toBeNull();
    drawn.push(tray!(ctx));
    for (const svg of drawn) {
      expect(svg).not.toMatch(/\bfilter=/);
      expect(lintMarkup(svg, { page: 'c8', touchable: () => false, expected: [], where: 'c8' })).toEqual([]);
    }
    expect(new Set(drawn).size).toBe(drawn.length);
  });

  test('each missing key is logged once (per kind) in dev', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    partArt('x/one', 'flap');
    partArt('x/one', 'flap');
    backdropArt('x/one');
    noteFallback('creature', 'x/two');
    noteFallback('creature', 'x/two');
    expect(info).toHaveBeenCalledTimes(3);
    expect(info.mock.calls[0][0]).toContain("'x/one'");
  });
});
