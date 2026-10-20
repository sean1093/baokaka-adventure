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
