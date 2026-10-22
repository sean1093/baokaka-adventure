import { describe, expect, test } from 'vitest';
import { CAMEO_ROLE, CREDITS } from '../../content';
import type { Photo } from '../../game/progress';
import { creditSlides } from './Credits';

/** The credits over the album photos (GDD § 2.13 item 8; #135): the roll, card by card. */

const shot = (at: number): Photo => ({ frame: 'A', mocha: true, at });

describe('creditSlides', () => {
  test('the title, each kept chapter photo in order with a credit, the credits left over, the 抓周 photo last', () => {
    const slides = creditSlides({ 3: shot(3), 1: shot(1), 11: shot(11) });
    expect(slides[0]).toEqual({ kind: 'title' });
    const cards = slides.filter((s) => s.kind === 'card');
    expect(cards).toHaveLength(CREDITS.length);
    expect(cards.slice(0, 3).map((c) => (c.kind === 'card' ? c.chapter : -1))).toEqual([1, 3, null]);
    expect(cards.map((c) => (c.kind === 'card' ? c.credit?.role : ''))).toEqual(CREDITS.map((c) => c.role));
    expect(slides[slides.length - 1]).toEqual({ kind: 'end', photo: shot(11) });
    // The 背包客's cameo is one of the credits
    expect(CREDITS.some((c) => c.role === CAMEO_ROLE)).toBe(true);
  });

  test('a whole album: one card per chapter, every credit on a print, the dedication without a photo when the 抓周 photo is missing', () => {
    const photos = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, shot(i + 1)]));
    const slides = creditSlides(photos);
    expect(slides).toHaveLength(1 + 10 + 1);
    expect(slides.every((s) => s.kind !== 'card' || s.photo !== null)).toBe(true);
    expect(slides[slides.length - 1]).toEqual({ kind: 'end', photo: null });
  });
});
