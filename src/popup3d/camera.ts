import { GUTTER_Y, PAGE_W, type BookLayout } from '../popup/view/geometry';

/**
 * The 3D page stage's geometry (#225, the three.js spike): pure maths, no three.js, shared by the
 * stage, the bake (`scripts/bake-3d.ts`) and the tests.
 *
 * **World.** One unit is one page unit. x runs right with 0 at the page's centre; y up with 0 on the
 * floor page; z toward the reader with 0 at the gutter. The standing page is the plane z = 0 (page
 * y 0 at world y 360, the gutter at y 0); the floor page lies in y = 0 from z 0 to `FLOOR_DEPTH`.
 *
 * **The window.** The default eye looks straight down −z through the standing page as through a
 * window (an off-axis frustum), from `EYE` high above the floor and far in front of it. Seen from
 * there, the plane z = 0 is the 2D page exactly (same `bookLayout`), and the floor lines converge
 * on a vanishing point straight above the page centre. Moving the eye (tilt, the pointer, the
 * opening) keeps the window fixed on screen while everything in front of it shifts by its depth:
 * real parallax with a stable frame for the DOM overlays.
 *
 * **Cards.** A paper card standing on the floor is a vertical plane at some depth. Its 2D drawing
 * (page units) is mapped onto that plane along the default eye's rays, so from the default eye it
 * covers exactly the pixels it covers on the 2D page, at any depth: the depth only decides how it
 * moves when the eye moves. A card is placed by its `foot` (a page y ≥ the gutter): the page y
 * whose ray meets the floor at the card's depth, so a card's drawn bottom at its foot stands on the
 * floor. Cards lying on the floor (the track pit, the tab's slot) map each point to where its ray
 * meets the floor.
 */

/** The floor page's depth in world units (the gutter to the front edge, page y 360 → 650). */
export const FLOOR_DEPTH = 380;
/** The floor page's width (the standing page's). */
export const FLOOR_W = PAGE_W;
/** The floor page's front edge on the 2D page (`FLOOR_BOTTOM`). */
export const FLOOR_FRONT_Y = 650;
/** The default eye's height above the floor: the vanishing point of the floor's depth lines. */
export const EYE_H = 2000;
/** The default eye's distance from the standing page, so the floor's front edge lands on page y 650. */
export const EYE_Z = (FLOOR_DEPTH * (EYE_H + FLOOR_FRONT_Y - GUTTER_Y)) / (FLOOR_FRONT_Y - GUTTER_Y);

export type V3 = readonly [number, number, number];
export type P2 = readonly [number, number];

export const DEFAULT_EYE: V3 = [0, EYE_H, EYE_Z];

/** The ray scale of a card standing with its foot on page y `foot` (1 at the gutter, smaller toward the reader). */
export function footScale(foot: number): number {
  return EYE_H / (EYE_H + Math.max(0, foot - GUTTER_Y));
}

/** The world depth (z) of a card whose foot is on page y `foot`. */
export const footDepth = (foot: number): number => EYE_Z * (1 - footScale(foot));

/** A page point on the plane of a card standing at `foot`, in world space. */
export function standPoint([x, y]: P2, foot: number): V3 {
  const s = footScale(foot);
  return [(x - PAGE_W / 2) * s, EYE_H + (GUTTER_Y - y - EYE_H) * s, EYE_Z * (1 - s)];
}

/** A page point painted on the floor (where its ray meets y = 0), in world space. */
export const floorPoint = (p: P2): V3 => standPoint(p, Math.max(GUTTER_Y, p[1]));

/** The page point a world point on a card's plane (scale `s`) was mapped from. */
export function planeToPage([x, y]: readonly [number, number, ...number[]], s: number): P2 {
  return [x / s + PAGE_W / 2, GUTTER_Y - (EYE_H + (y - EYE_H) / s)];
}

/** The page point a world floor point (x, z) was mapped from. */
export function floorToPage(x: number, z: number): P2 {
  const s = 1 - z / EYE_Z;
  return [x / s + PAGE_W / 2, GUTTER_Y + EYE_H / s - EYE_H];
}

/** World units per page unit on the z = 0 window: the 2D layout's book scale is screen px per unit there. */
export interface Frustum {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

/**
 * The off-axis frustum (at `near`) of an eye looking down −z through the window: the viewport's
 * edges, mapped to the plane z = 0 by the 2D layout, seen from `eye`. With the default eye, every
 * point of z = 0 lands on the screen pixel the 2D page draws it on.
 */
export function windowFrustum(layout: BookLayout, eye: V3, near: number): Frustum {
  const wx = (px: number) => (px - layout.x) / layout.scale - PAGE_W / 2;
  const wy = (py: number) => GUTTER_Y - (py - layout.y) / layout.scale;
  const k = near / eye[2];
  return {
    left: (wx(0) - eye[0]) * k,
    right: (wx(layout.vw) - eye[0]) * k,
    top: (wy(0) - eye[1]) * k,
    bottom: (wy(layout.vh) - eye[1]) * k,
  };
}

/** Where a world point lands on screen (CSS px) for `eye` and the window `layout`. */
export function projectToScreen(layout: BookLayout, eye: V3, [x, y, z]: V3): P2 {
  // Intersect the ray eye → point with the window plane z = 0, then map by the 2D layout
  const t = eye[2] / (eye[2] - z);
  const wx = eye[0] + (x - eye[0]) * t;
  const wy = eye[1] + (y - eye[1]) * t;
  return [layout.x + (wx + PAGE_W / 2) * layout.scale, layout.y + (GUTTER_Y - wy) * layout.scale];
}

/**
 * The eye for a tilt (`tx`, `ty` in −1…1: right, down) and an opening progress `open` (0 closed,
 * 1 open): the tilt swings the eye across the window, the opening lowers it from high above.
 */
export const TILT_EYE = { x: 420, y: 200 } as const;
export function eyeFor(tx: number, ty: number, open = 1): V3 {
  const rise = (1 - open) * 2600;
  return [DEFAULT_EYE[0] + tx * TILT_EYE.x, DEFAULT_EYE[1] - ty * TILT_EYE.y + rise, DEFAULT_EYE[2] - (1 - open) * 900];
}
