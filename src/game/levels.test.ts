import { describe, expect, test } from 'vitest';
import { LEVELS } from './levels';
import { validateLevels } from './validate';

describe('實際關卡資料', () => {
  test('通過所有驗證規則', () => {
    expect(validateLevels(LEVELS)).toEqual([]);
  });

  test('有 6 關，共 18 個尋物點', () => {
    expect(LEVELS).toHaveLength(6);
    expect(LEVELS.flatMap((level) => level.targets)).toHaveLength(18);
  });

  test('每一關都有標題與劇情文字', () => {
    for (const level of LEVELS) {
      expect(level.title.length).toBeGreaterThan(0);
      expect(level.story.length).toBeGreaterThan(0);
    }
  });

  test('每個目標都有中文名稱，讓提示與「找到了」能唸出來', () => {
    for (const target of LEVELS.flatMap((level) => level.targets)) {
      expect(target.name.length).toBeGreaterThan(0);
    }
  });

  test('每一關都有背景裝飾，場景不會空空的', () => {
    for (const level of LEVELS) {
      expect(level.decor.length).toBeGreaterThanOrEqual(6);
    }
  });
});
