import { describe, expect, test } from 'vitest';
import { initialState, step, withPartState } from '../core';
import { pageById } from '../pages';
import { BACK_C, PART_OVERSHOOT, PART_SETTLE_MS, PART_TWEEN_MS, SNAP_SQUASH, drawnNodePos, easeInOut, easeOutBack, offpagePoint, partProgress, snapSquash, stepPose } from './interp';

/** Interpolation (#89, GDD § 3.9, bible § 8): easing, part tweens, rides and actor steps. */

const c1p2 = pageById('c1p2')!;

describe('easing', () => {
  test('ease-in-out runs 0 → 1, symmetric, flat at both ends', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
    expect(easeInOut(0.25) + easeInOut(0.75)).toBeCloseTo(1);
    expect(easeInOut(0.05)).toBeLessThan(0.01);
    expect(easeInOut(-1)).toBe(0);
    expect(easeInOut(2)).toBe(1);
  });

  test('the part ease-out overshoots by exactly 6 % and settles at 1', () => {
    let peak = 0;
    for (let i = 0; i <= 1000; i++) peak = Math.max(peak, easeOutBack(i / 1000));
    expect(peak).toBeCloseTo(1 + PART_OVERSHOOT, 3);
    expect(BACK_C).toBeGreaterThan(1.2);
    expect(easeOutBack(0)).toBeCloseTo(0);
    expect(easeOutBack(1)).toBe(1);
  });
});

describe('part tween', () => {
  test('250 ms with overshoot, instant under reduced motion', () => {
    expect(partProgress(0)).toBeCloseTo(0);
    expect(partProgress(PART_TWEEN_MS / 2)).toBeGreaterThan(0.8);
    expect(Math.max(...[150, 170, 190, 210].map((ms) => partProgress(ms)))).toBeGreaterThan(1);
    expect(partProgress(PART_TWEEN_MS)).toBe(1);
    expect(partProgress(10_000)).toBe(1);
    expect(partProgress(0, true)).toBe(1);
  });

  test('the 60 ms snap squash comes right after the tween lands', () => {
    expect(snapSquash(100)).toBe(1);
    expect(snapSquash(PART_TWEEN_MS + 30)).toBeCloseTo(SNAP_SQUASH);
    expect(snapSquash(PART_SETTLE_MS)).toBe(1);
    expect(snapSquash(PART_TWEEN_MS + 30, true)).toBe(1);
  });
});

describe('rides and steps', () => {
  const s0 = initialState(c1p2);
  const half = withPartState(s0, 'train', 'half');

  test('an attached node rides its part’s tween; a static node stays', () => {
    expect(drawnNodePos(c1p2, s0, half, 'T1', 0)).toEqual([60, 430]);
    expect(drawnNodePos(c1p2, s0, half, 'T1', PART_TWEEN_MS)).toEqual([150, 430]);
    const mid = drawnNodePos(c1p2, s0, half, 'T1', 100)!;
    expect(mid[0]).toBeGreaterThan(60);
    expect(mid[0]).toBeLessThan(150 * 1.06);
    expect(drawnNodePos(c1p2, s0, half, 'L1', 100)).toEqual([40, 430]);
    expect(drawnNodePos(c1p2, s0, half, 'T1', 0, true)).toEqual([150, 430]);
    expect(drawnNodePos(c1p2, s0, half, 'nope', 0)).toBeUndefined();
  });

  test('a step lerps ease-in-out from the old node to the new one with a small hop', () => {
    const s1 = step(c1p2, s0, { t: 'none' }).state; // L1 → L2
    expect(stepPose(c1p2, s0, s1, 'L1', 'L2', 0, 0)).toMatchObject({ x: 40, y: 430, moving: true });
    const mid = stepPose(c1p2, s0, s1, 'L1', 'L2', 0.5, 250)!;
    expect(mid.x).toBeCloseTo(65);
    expect(mid.y).toBeCloseTo(428);
    expect(stepPose(c1p2, s0, s1, 'L1', 'L2', 1, 500)).toEqual({ x: 90, y: 430, moving: false });
    expect(stepPose(c1p2, s0, s1, 'L1', 'L2', 0.5, 250, { reduced: true })).toEqual({ x: 90, y: 430, moving: false });
    expect(stepPose(c1p2, s0, s1, null, null, 0.5, 250)).toBeNull();
  });

  test('a rider on the train moves with the train, not with the tick', () => {
    const on = { ...withPartState(s0, 'train', 'half'), baby: { ...s0.baby, node: 'T1' } };
    const full = withPartState(on, 'train', 'full');
    const pose = stepPose(c1p2, on, full, 'T1', 'T1', 0.1, PART_TWEEN_MS);
    expect(pose).toEqual({ x: 190, y: 430, moving: false });
  });

  test('off the page is past the nearer side, a little up', () => {
    expect(offpagePoint([100, 400])[0]).toBeLessThan(0);
    expect(offpagePoint([300, 400])[0]).toBeGreaterThan(390);
    expect(offpagePoint([300, 400])[1]).toBeLessThan(400);
  });
});
