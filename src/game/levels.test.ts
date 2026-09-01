import { describe, expect, test } from 'vitest';
import { LEVELS } from './levels';
import { validateLevels } from './validate';

describe('the shipped level data', () => {
  test('passes every validation rule', () => {
    expect(validateLevels(LEVELS)).toEqual([]);
  });

  test('has 6 levels and 18 hidden objects', () => {
    expect(LEVELS).toHaveLength(6);
    expect(LEVELS.flatMap((level) => level.targets)).toHaveLength(18);
  });

  test('every level has a title and story text', () => {
    for (const level of LEVELS) {
      expect(level.title.length).toBeGreaterThan(0);
      expect(level.story.length).toBeGreaterThan(0);
    }
  });

  test('every target has a display name', () => {
    for (const target of LEVELS.flatMap((level) => level.targets)) {
      expect(target.name.length).toBeGreaterThan(0);
    }
  });

  test('every level has decor so the scene is never empty', () => {
    for (const level of LEVELS) {
      expect(level.decor.length).toBeGreaterThanOrEqual(6);
    }
  });
});
