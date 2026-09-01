import { describe, expect, test } from 'vitest';
import type { Level, Target } from './types';
import { validateLevel, validateLevels } from './validate';

const target = (over: Partial<Target> = {}): Target => ({
  id: 't1',
  name: '奶瓶',
  sprite: 'bottle',
  x: 0.25,
  y: 0.25,
  r: 0.11,
  ...over,
});

const level = (over: Partial<Level> = {}): Level => ({
  id: 1,
  title: '摩卡貓躲在客廳',
  palette: 'living',
  decor: [],
  targets: [
    target({ id: 'a', x: 0.2, y: 0.2 }),
    target({ id: 'b', x: 0.75, y: 0.35 }),
    target({ id: 'c', x: 0.4, y: 0.75 }),
  ],
  story: '找到了！',
  ...over,
});

describe('validateLevel', () => {
  test('合法的關卡沒有任何錯誤', () => {
    expect(validateLevel(level())).toEqual([]);
  });

  test('目標不是 3 個就報錯', () => {
    const errors = validateLevel(level({ targets: [target({ id: 'a' }), target({ id: 'b', x: 0.8 })] }));
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('3');
  });

  test('目標 id 重複就報錯', () => {
    const errors = validateLevel(
      level({
        targets: [
          target({ id: 'same', x: 0.2, y: 0.2 }),
          target({ id: 'same', x: 0.75, y: 0.35 }),
          target({ id: 'c', x: 0.4, y: 0.75 }),
        ],
      }),
    );
    expect(errors.join()).toContain('same');
  });

  test('熱區小於觸控下限就報錯', () => {
    const errors = validateLevel(
      level({
        targets: [
          target({ id: 'a', x: 0.2, y: 0.2, r: 0.08 }),
          target({ id: 'b', x: 0.75, y: 0.35 }),
          target({ id: 'c', x: 0.4, y: 0.75 }),
        ],
      }),
    );
    expect(errors.join()).toContain('0.09');
  });

  test('兩個目標水平重疊就報錯', () => {
    const errors = validateLevel(
      level({
        targets: [
          target({ id: 'a', x: 0.3, y: 0.2, r: 0.11 }),
          target({ id: 'b', x: 0.45, y: 0.2, r: 0.11 }),
          target({ id: 'c', x: 0.4, y: 0.75 }),
        ],
      }),
    );
    expect(errors.join()).toContain('重疊');
  });

  test('垂直距離換算後重疊也要報錯', () => {
    // dy = 0.15 → 換算成寬度比例是 0.15 × 4/3 = 0.2，小於 r+r = 0.22
    const errors = validateLevel(
      level({
        targets: [
          target({ id: 'a', x: 0.3, y: 0.2, r: 0.11 }),
          target({ id: 'b', x: 0.3, y: 0.35, r: 0.11 }),
          target({ id: 'c', x: 0.75, y: 0.75 }),
        ],
      }),
    );
    expect(errors.join()).toContain('重疊');
  });

  test('垂直距離剛好夠就不報錯', () => {
    // dy = 0.18 → 0.24 > 0.22
    expect(
      validateLevel(
        level({
          targets: [
            target({ id: 'a', x: 0.3, y: 0.2, r: 0.11 }),
            target({ id: 'b', x: 0.3, y: 0.38, r: 0.11 }),
            target({ id: 'c', x: 0.75, y: 0.75 }),
          ],
        }),
      ),
    ).toEqual([]);
  });

  test('目標超出右邊界就報錯', () => {
    const errors = validateLevel(
      level({
        targets: [
          target({ id: 'a', x: 0.95, y: 0.2, r: 0.11 }),
          target({ id: 'b', x: 0.3, y: 0.35 }),
          target({ id: 'c', x: 0.4, y: 0.75 }),
        ],
      }),
    );
    expect(errors.join()).toContain('超出');
  });

  test('垂直超出下邊界要用 3/4 換算後判斷', () => {
    // y + r × 3/4 = 0.95 + 0.0825 > 1
    const errors = validateLevel(
      level({
        targets: [
          target({ id: 'a', x: 0.2, y: 0.95, r: 0.11 }),
          target({ id: 'b', x: 0.75, y: 0.35 }),
          target({ id: 'c', x: 0.4, y: 0.6 }),
        ],
      }),
    );
    expect(errors.join()).toContain('超出');
  });

  test('座標不是有限數字就報錯', () => {
    const errors = validateLevel(
      level({
        targets: [
          target({ id: 'a', x: Number.NaN, y: 0.2 }),
          target({ id: 'b', x: 0.75, y: 0.35 }),
          target({ id: 'c', x: 0.4, y: 0.75 }),
        ],
      }),
    );
    expect(errors.join()).toContain('數字');
  });
});

describe('validateLevels', () => {
  test('id 從 1 開始連續就沒有錯誤', () => {
    expect(validateLevels([level({ id: 1 }), level({ id: 2 })])).toEqual([]);
  });

  test('id 沒有從 1 開始就報錯', () => {
    expect(validateLevels([level({ id: 2 })]).join()).toContain('id');
  });

  test('id 跳號就報錯', () => {
    expect(validateLevels([level({ id: 1 }), level({ id: 3 })]).join()).toContain('id');
  });

  test('個別關卡的錯誤會標出是哪一關', () => {
    const broken = level({ id: 2, targets: [target()] });
    expect(validateLevels([level({ id: 1 }), broken]).join()).toContain('第 2 關');
  });
});
