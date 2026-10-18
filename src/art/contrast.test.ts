import { describe, expect, test } from 'vitest';
import { MIN_CONTRAST, TEXT_PAIRS, contrastRatio, luminance } from './contrast';
import { UI } from './palette';

describe('contrastRatio', () => {
  test('matches the WCAG reference values', () => {
    expect(luminance('#FFFFFF')).toBeCloseTo(1);
    expect(luminance('#000000')).toBe(0);
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21);
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
    expect(contrastRatio('#123456', '#123456')).toBe(1);
  });
});

describe('§ 3.3 contrast rules', () => {
  test.each(TEXT_PAIRS.map((pair) => [`${pair.text} on ${pair.on} (${pair.level}: ${pair.use})`, pair] as const))('%s', (_name, pair) => {
    expect(contrastRatio(UI[pair.text], UI[pair.on])).toBeGreaterThanOrEqual(MIN_CONTRAST[pair.level]);
  });

  test('body text is white on the panel at about 14:1 (art direction example)', () => {
    expect(contrastRatio(UI.inkOnDark, UI.panelTop)).toBeGreaterThan(14);
  });

  test('every pair names solid colours', () => {
    for (const pair of TEXT_PAIRS) {
      expect(UI[pair.text]).toMatch(/^#[0-9A-F]{6}$/);
      expect(UI[pair.on]).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});
