import { describe, expect, test } from 'vitest';
import { ENDING_LEAF_CHAPTER } from '../../content/album';
import { registry as gameRegistry } from '../../pages';
import { spriteDef } from '../../sprites';
import { photoFrames, photoSprites } from './PhotoScene';

describe('the photo frames (#193)', () => {
  const spreads = [...new Set(gameRegistry.pages.filter((p) => p.spread).map((p) => p.chapter))].filter((c) => c !== ENDING_LEAF_CHAPTER);

  test('every chapter with a spread has its own frames A, B, C, drawn 1 : 1 in the photo, never mirrored', () => {
    expect(spreads.length).toBeGreaterThanOrEqual(10);
    for (const ch of spreads) {
      const id = photoFrames(ch);
      expect(id, `chapter ${ch}`).toBe(`baokaka.photo${ch}`);
      const def = spriteDef(id!);
      expect(def.files).toHaveLength(3);
      expect(def.group).toBe('ui');
      expect(def.noMirror).toBe(true);
    }
    expect(spriteDef('mocha.photo').files).toHaveLength(3);
  });

  test('a chapter without frames (the 抓周 pair, the lab) keeps the composite', () => {
    expect(photoFrames(ENDING_LEAF_CHAPTER)).toBeNull();
    expect(photoFrames(0)).toBeNull();
    expect(photoSprites([0])).toContain('baokaka.bounce');
  });

  test('a photo preloads only its own chapter\'s frames (and +M), not the composite', () => {
    expect(photoSprites([3]).sort()).toEqual(['baokaka.photo3', 'mocha.photo']);
    expect(photoSprites([3, 3, 5])).toHaveLength(3);
    expect(photoSprites([2, ENDING_LEAF_CHAPTER])).toEqual(expect.arrayContaining(['baokaka.photo2', 'mocha.photo', 'baokaka.hug', 'mocha.glare']));
  });
});
