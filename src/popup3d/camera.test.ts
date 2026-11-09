import { describe, expect, test } from 'vitest';
import { bookLayout, toScreen } from '../popup/view/geometry';
import { pageById } from '../popup/pages';
import { CARDS } from './cards.gen';
import { DEFAULT_EYE, EYE_H, FLOOR_DEPTH, FLOOR_FRONT_Y, eyeFor, floorPoint, floorToPage, footDepth, footScale, planeToPage, projectToScreen, standPoint, windowFrustum } from './camera';
import { PAGES_3D } from './pages3d';

/**
 * The 3D stage's geometry (#225): seen from the default eye every card lands on the pixels the 2D
 * page draws it on, whatever its depth; the inverse maps (a finger on a plane → page units) undo
 * the forward ones; and every baked card is staged.
 */

const close = (a: readonly number[], b: readonly number[], eps = 1e-6) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], -Math.log10(eps)));

describe('the window camera', () => {
  test('a card stands with its foot on the floor, deeper toward the reader', () => {
    expect(footScale(360)).toBe(1);
    expect(footDepth(360)).toBe(0);
    expect(standPoint([100, 482], 482)[1]).toBeCloseTo(0, 9);
    expect(footDepth(FLOOR_FRONT_Y)).toBeCloseTo(FLOOR_DEPTH, 9);
    expect(footDepth(400)).toBeLessThan(footDepth(482));
  });

  test('from the default eye, any plane shows the 2D page exactly (390 × 844 and 375 × 667)', () => {
    for (const [w, h] of [[390, 844], [375, 667]]) {
      const layout = bookLayout(w, h);
      for (const p of [[0, 0], [195, 240], [320, 416], [60, 610]] as const) {
        for (const foot of [360, 404, 482, 640]) close(projectToScreen(layout, DEFAULT_EYE, standPoint(p, foot)), toScreen(layout, p), 1e-6);
        if (p[1] >= 360) close(projectToScreen(layout, DEFAULT_EYE, floorPoint(p)), toScreen(layout, p), 1e-6);
      }
    }
  });

  test('a moved eye keeps the standing page still and slides the near cards (parallax)', () => {
    const layout = bookLayout(390, 844);
    const eye = eyeFor(1, 0);
    close(projectToScreen(layout, eye, standPoint([100, 100], 360)), toScreen(layout, [100, 100]), 1e-6);
    const near = projectToScreen(layout, eye, standPoint([100, 600], 640));
    expect(Math.abs(near[0] - toScreen(layout, [100, 600])[0])).toBeGreaterThan(20);
  });

  test('the inverse maps undo the forward ones', () => {
    const s = footScale(487);
    close(planeToPage(standPoint([140, 430], 487), s), [140, 430]);
    const f = floorPoint([80, 610]);
    close(floorToPage(f[0], f[2]), [80, 610]);
  });

  test('the frustum is the viewport through the window', () => {
    const layout = bookLayout(390, 844);
    const f = windowFrustum(layout, DEFAULT_EYE, 40);
    expect(f.left).toBeLessThan(0);
    expect(f.right).toBeGreaterThan(0);
    // The eye is far above the page: the window's top and bottom are both below its line of sight
    expect(f.top).toBeLessThan(0);
    expect(f.bottom).toBeLessThan(f.top);
    expect(EYE_H).toBeGreaterThan(1000);
  });
});

describe('the cards of 1-2', () => {
  const def = pageById('c1p2')!;
  const cards = CARDS.c1p2;
  const cfg = PAGES_3D.c1p2;

  test('one standing page and one floor, every standing card staged at a foot', () => {
    expect(cards.filter((c) => c.kind === 'back')).toHaveLength(1);
    expect(cards.filter((c) => c.kind === 'floor')).toHaveLength(1);
    for (const c of cards.filter((x) => x.kind === 'stand')) {
      const foot = cfg.stands[c.id] ?? (c.id.startsWith('board') ? cfg.stands.board : undefined);
      expect(foot, c.id).toBeGreaterThanOrEqual(360);
    }
  });

  test('every touchable part has a plane, and the 2D page budget of art holds', () => {
    for (const p of def.parts) expect(cfg.partPlane[p.id], p.id).toBeDefined();
    const bytes = cards.reduce((n, c) => n + c.bytes, 0);
    expect(bytes).toBeLessThan(350 * 1024);
  });
});
