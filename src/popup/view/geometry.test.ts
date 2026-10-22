import { describe, expect, test } from 'vitest';
import { PAGES } from '../pages';
import { BAR_H, BOOK_EXTENT, COVER_MARGIN, FLOOR_BOTTOM, GUTTER_Y, HUD_H, PAGE_W, bookLayout, floorWiden, hitScreenSize, toScreen, towardVp } from './geometry';

/** The book frame (#89; bible § 2.1): ≈ 0.91 scale at 390, extra height to the cover, hit areas scaled. */

describe('book layout', () => {
  test('at 390 × 844 the page is 354 px wide (≈ 0.91) inside the 18 px cover margin', () => {
    const l = bookLayout(390, 844);
    expect(l.scale).toBeCloseTo(354 / 390, 4);
    expect(PAGE_W * l.scale).toBeCloseTo(354);
    expect(l.x).toBeCloseTo(COVER_MARGIN);
    // The book sits between the HUD and the bottom bar
    expect(toScreen(l, [0, BOOK_EXTENT.top])[1]).toBeGreaterThanOrEqual(HUD_H);
    expect(toScreen(l, [0, BOOK_EXTENT.bottom])[1]).toBeLessThanOrEqual(844 - BAR_H);
  });

  test('extra height on tall phones goes to the cover, never the page', () => {
    const a = bookLayout(390, 844);
    const b = bookLayout(390, 1000);
    expect(b.scale).toBe(a.scale);
    expect(b.y).toBeGreaterThan(a.y);
  });

  test('a short phone shrinks the whole book uniformly', () => {
    const l = bookLayout(375, 667);
    expect(l.scale).toBeLessThan(0.91);
    expect(toScreen(l, [0, BOOK_EXTENT.bottom])[1]).toBeLessThanOrEqual(667 - BAR_H + 1);
    expect(l.x).toBeGreaterThanOrEqual(COVER_MARGIN);
  });

  test('the safe-area insets keep the HUD under the notch and the bar over the home indicator (#136)', () => {
    const inset = { top: 47, bottom: 34 };
    const l = bookLayout(390, 844, inset);
    expect(l.hudTop).toBe(47);
    expect(l.barTop).toBe(844 - 34 - BAR_H);
    expect(toScreen(l, [0, BOOK_EXTENT.top])[1]).toBeGreaterThanOrEqual(47 + HUD_H);
    expect(toScreen(l, [0, BOOK_EXTENT.bottom])[1]).toBeLessThanOrEqual(l.barTop);
    expect(l.scale).toBeLessThan(bookLayout(390, 844).scale);
    expect(bookLayout(390, 844)).toMatchObject({ hudTop: 0, barTop: 844 - BAR_H });
  });

  test('every part on every page has a hit area ≥ 48 × 48 px after the book scale at 390 × 844 (GDD R6)', () => {
    const l = bookLayout(390, 844);
    for (const def of PAGES) {
      for (const part of def.parts) {
        const { w, h } = hitScreenSize(l, part.hit);
        expect(Math.min(w, h), `${def.id}/${part.id}`).toBeGreaterThanOrEqual(48);
      }
    }
  });
});

describe('floor perspective (art only)', () => {
  test('the floor widens ≈ 6 % per 250 units below the gutter', () => {
    expect(floorWiden(GUTTER_Y)).toBe(0);
    expect((2 * floorWiden(GUTTER_Y + 250)) / PAGE_W).toBeCloseTo(0.06);
    expect(floorWiden(FLOOR_BOTTOM)).toBeGreaterThan(floorWiden(500));
  });

  test('box tops recede 2 % toward the vanishing point high above centre', () => {
    const [x, y] = towardVp([95, 430]);
    expect(x).toBeCloseTo(97);
    expect(y).toBeCloseTo(430 - 0.02 * 790, 0);
  });
});
