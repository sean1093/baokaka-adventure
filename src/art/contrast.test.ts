import { describe, expect, test } from 'vitest';
import { CHAPTER_CLOCK } from '../quest/engine/clock';
import { CARD_SCRIM, MIN_CONTRAST, POPUP_TEXT_PAIRS, TEXT_PAIRS, contrastRatio, luminance } from './contrast';
import { POPUP, UI, mixHex, skyAt, withAlpha } from './palette';

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

describe('翻翻台北 POPUP contrast (GDD § 1.3: every text ≥ 7:1)', () => {
  test.each(POPUP_TEXT_PAIRS.map((pair) => [`${pair.text} on ${pair.on} (${pair.use})`, pair] as const))('%s', (_name, pair) => {
    expect(contrastRatio(POPUP[pair.text], POPUP[pair.on])).toBeGreaterThanOrEqual(MIN_CONTRAST.body);
  });

  test('every POPUP token is a solid colour', () => {
    for (const hex of Object.values(POPUP)) expect(hex).toMatch(/^#[0-9A-F]{6}$/);
  });

  test('the page and the cover both carry text', () => {
    const surfaces = new Set(POPUP_TEXT_PAIRS.map((pair) => pair.on));
    expect(surfaces).toContain('page');
    expect(surfaces).toContain('cover');
  });
});

test('withAlpha appends a two-digit alpha', () => {
  expect(withAlpha('#0A0820', 0.62)).toBe('#0A08209E');
  expect(withAlpha('#FFFFFF', 0)).toBe('#FFFFFF00');
  expect(withAlpha('#FFFFFF', 2)).toBe('#FFFFFFFF');
});

describe('chapter card text over the sky (§ 7.6, § 3.3)', () => {
  // Every chapter clock, the labelled cards' 05:30 (the 05:29 sky) and the in-between keys
  const times = [...Object.values(CHAPTER_CLOCK), '04:30', '05:29', '05:30'];

  test.each(times)('the title reads at %s on the card scrim', (time) => {
    const sky = skyAt(time);
    // The text sits between the top and mid stops; the lighter of the two is the worst case
    for (const behind of [sky.top, sky.mid]) {
      expect(contrastRatio(UI.inkOnDark, mixHex(behind, UI.scrim, CARD_SCRIM))).toBeGreaterThanOrEqual(MIN_CONTRAST.body);
    }
  });
});
