import { describe, expect, test } from 'vitest';
import { SWIPE_MAX_MS, SWIPE_MIN_PX, swipeDir } from './swipe';

/** The album's one-finger swipe (#113). */
describe('swipeDir', () => {
  test.each([
    ['a quick flick left: the next leaf', -120, 10, 200, 1],
    ['a quick flick right: the previous leaf', 90, -12, 200, -1],
    ['just far enough', -SWIPE_MIN_PX, 0, 100, 1],
    ['too short', -SWIPE_MIN_PX + 1, 0, 100, 0],
    ['mostly down: the leaf scrolls', -80, 70, 200, 0],
    ['a tap', 2, 1, 80, 0],
    ['too slow', -200, 0, SWIPE_MAX_MS + 1, 0],
  ] as const)('%s', (_, dx, dy, ms, dir) => {
    expect(swipeDir(dx, dy, ms)).toBe(dir);
  });
});
