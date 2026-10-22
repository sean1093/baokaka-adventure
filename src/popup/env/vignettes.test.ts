import { describe, expect, test } from 'vitest';
import { CHAPTERS, ENDING_CHAPTER } from '../content';
import { cardVignette } from '../view/hud/ChapterBoard';
import { stationMedal } from '../view/screens/Contents';
import { kitCtx } from '../art';
import { VIGNETTE_ART, VIGNETTE_CARD, VIGNETTE_MAP, VIGNETTE_CHAPTERS } from './art/vignettes';
import { ENV_MANIFEST } from './env.gen';
import { screenImage } from './loader';

describe('the landmark vignettes (#193)', () => {
  test('every chapter of the night (and 家) has its card cut-out and its 目錄 medallion, baked', () => {
    expect(VIGNETTE_CHAPTERS).toEqual(CHAPTERS.map((c) => c.chapter));
    for (const ch of VIGNETTE_CHAPTERS) {
      const card = ENV_MANIFEST.screens[`vignette-card-${ch}`];
      const map = ENV_MANIFEST.screens[stationMedal(ch)];
      expect(card?.box, `card ${ch}`).toEqual(VIGNETTE_CARD);
      expect(map?.box, `map ${ch}`).toEqual(VIGNETTE_MAP);
      expect(screenImage(stationMedal(ch))).not.toBeNull();
    }
  });

  test('they are small (a card ≤ 10 KB, a medallion ≤ 4 KB) and carry no lettering', () => {
    for (const ch of VIGNETTE_CHAPTERS) {
      expect(ENV_MANIFEST.screens[`vignette-card-${ch}`].bytes).toBeLessThanOrEqual(10 * 1024);
      expect(ENV_MANIFEST.screens[stationMedal(ch)].bytes).toBeLessThanOrEqual(4 * 1024);
    }
    const ctx = kitCtx('t', { filters: true });
    for (const src of Object.values(VIGNETTE_ART)) expect(src.draw(ctx)).not.toMatch(/<text/);
  });

  test('the card of 尾聲 shows home again; a chapter without one shows none', () => {
    expect(cardVignette(1)).toBe(screenImage('vignette-card-1')?.url);
    expect(cardVignette(ENDING_CHAPTER)).toBe(cardVignette(0));
    expect(cardVignette(99)).toBeNull();
  });
});
