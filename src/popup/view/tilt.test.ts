import { describe, expect, test } from 'vitest';
import { LAYERS, LAYER_Z, layerParallax } from './layers';
import { TILT_MAX_DEG, TILT_SHIFT_PX, layerShift, tiltFor } from './useTilt';

/** The gyro tilt (#104) and its per-layer parallax (#136; bible § 2.3). */

describe('tilt parallax', () => {
  test('the play plane and its hit layer stay put; the backdrop slides back, the foreground forward', () => {
    for (const id of ['floor', 'parts-near', 'creatures', 'actors', 'fx', 'hit'] as const) expect(layerParallax(id)).toBe(0);
    expect(layerParallax('backdrop')).toBeLessThan(layerParallax('cutouts'));
    expect(layerParallax('cutouts')).toBeLessThan(layerParallax('parts-mid'));
    expect(layerParallax('parts-mid')).toBeLessThan(0);
    expect(layerParallax('foreground')).toBeGreaterThan(0);
    // Every layer has a depth
    for (const id of LAYERS) expect(LAYER_Z[id]).toBeGreaterThanOrEqual(0);
  });

  test('at the full lean the furthest layer slides at most TILT_SHIFT_PX; at rest nothing moves', () => {
    const full = tiltFor(-100, 100);
    expect(full).toEqual({ x: TILT_MAX_DEG, y: TILT_MAX_DEG });
    const px = (s: string) => (s === '' ? [0, 0] : (s.match(/-?[\d.]+/g) ?? []).map(Number));
    for (const id of LAYERS) for (const v of px(layerShift(id, full))) expect(Math.abs(v)).toBeLessThanOrEqual(TILT_SHIFT_PX);
    for (const id of LAYERS) expect(layerShift(id, { x: 0, y: 0 })).toBe('');
    expect(layerShift('hit', full)).toBe('');
    // Leaning right (rotateY +) slides the backdrop left and the foreground right
    const [bx] = px(layerShift('backdrop', { x: 0, y: 3 }));
    const [fx] = px(layerShift('foreground', { x: 0, y: 3 }));
    expect(bx).toBeLessThan(0);
    expect(fx).toBeGreaterThan(0);
  });
});
