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
  test('a valid level reports no errors', () => {
    expect(validateLevel(level())).toEqual([]);
  });

  test('rejects a level without exactly 3 targets', () => {
    const errors = validateLevel(level({ targets: [target({ id: 'a' }), target({ id: 'b', x: 0.8 })] }));
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('3');
  });

  test('rejects duplicate target ids', () => {
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

  test('rejects a hotspot below the touch minimum', () => {
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

  test('rejects horizontally overlapping targets', () => {
    const errors = validateLevel(
      level({
        targets: [
          target({ id: 'a', x: 0.3, y: 0.2, r: 0.11 }),
          target({ id: 'b', x: 0.45, y: 0.2, r: 0.11 }),
          target({ id: 'c', x: 0.4, y: 0.75 }),
        ],
      }),
    );
    expect(errors.join()).toContain('overlapping');
  });

  test('rejects vertical overlap once converted to width units', () => {
    // dy = 0.15 converts to 0.15 * 4/3 = 0.2 in width units, which is under r+r = 0.22
    const errors = validateLevel(
      level({
        targets: [
          target({ id: 'a', x: 0.3, y: 0.2, r: 0.11 }),
          target({ id: 'b', x: 0.3, y: 0.35, r: 0.11 }),
          target({ id: 'c', x: 0.75, y: 0.75 }),
        ],
      }),
    );
    expect(errors.join()).toContain('overlapping');
  });

  test('accepts vertical spacing that is just wide enough', () => {
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

  test('rejects a target past the right edge', () => {
    const errors = validateLevel(
      level({
        targets: [
          target({ id: 'a', x: 0.95, y: 0.2, r: 0.11 }),
          target({ id: 'b', x: 0.3, y: 0.35 }),
          target({ id: 'c', x: 0.4, y: 0.75 }),
        ],
      }),
    );
    expect(errors.join()).toContain('outside');
  });

  test('applies the 3/4 conversion when checking the bottom edge', () => {
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
    expect(errors.join()).toContain('outside');
  });

  test('rejects non-finite coordinates', () => {
    const errors = validateLevel(
      level({
        targets: [
          target({ id: 'a', x: Number.NaN, y: 0.2 }),
          target({ id: 'b', x: 0.75, y: 0.35 }),
          target({ id: 'c', x: 0.4, y: 0.75 }),
        ],
      }),
    );
    expect(errors.join()).toContain('non-finite');
  });
});

describe('validateLevels', () => {
  test('accepts ids that start at 1 and increase by 1', () => {
    expect(validateLevels([level({ id: 1 }), level({ id: 2 })])).toEqual([]);
  });

  test('rejects ids that do not start at 1', () => {
    expect(validateLevels([level({ id: 2 })]).join()).toContain('id');
  });

  test('rejects a gap in the level ids', () => {
    expect(validateLevels([level({ id: 1 }), level({ id: 3 })]).join()).toContain('id');
  });

  test('prefixes a level error with the level it came from', () => {
    const broken = level({ id: 2, targets: [target()] });
    expect(validateLevels([level({ id: 1 }), broken]).join()).toContain('level 2');
  });
});
