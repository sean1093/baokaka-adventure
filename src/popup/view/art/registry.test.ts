import { afterEach, describe, expect, test, vi } from 'vitest';
import { PRESET_ART } from '../../art';
import { backdropArt, creatureArt, noteFallback, partArt, resetFallbackLog } from './registry';
import { origamiBird, placeholderBackdrop } from './placeholders';

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
    expect(creatureArt('common/pigeon')).toBe(origamiBird);
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
