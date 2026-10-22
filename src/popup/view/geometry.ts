/**
 * The book frame and page geometry (GDD § 2.1 coordinates, § 3.9; popup art bible § 2.1).
 *
 * The page model is 390 × 560 units (one unit is one CSS px on a 390-wide phone). The book draws
 * a little more than that: the floor page runs on below 560 to its front edge (`FLOOR_BOTTOM`),
 * where pull tabs ride slots cut into it (proof A; 1-2's tab track sits at y 610), and the
 * page-block edges hang under that. Everything is scaled uniformly by one factor, ≈ 0.91 on a
 * 390-wide phone (354 px wide inside an 18 px navy-linen cover margin). Extra height on tall
 * phones goes to the cover, never the page. Hit areas are page units scaled by the same factor,
 * so the GDD's ≥ 48 px rule is checked after scaling (`hitScreenSize`).
 *
 * Pure functions, no DOM: the view and tests share them.
 */

export type Pt = readonly [number, number];

export const PAGE_W = 390;
export const PAGE_H = 560;
/** The top HUD slot (GDD § 2.1, bible § 7) */
export const HUD_H = 96;
/** The bottom bar slot on the cover (GDD § 2.1: ≈ 120 px) */
export const BAR_H = 120;
/** The cover margin left and right of the page at the reference width (bible § 2.1: 6–18 px) */
export const COVER_MARGIN = 18;
/** Never blow the page up past this on wide screens */
export const MAX_SCALE = 1.25;
/** Breathing room between the page and the HUD / the bottom bar, in screen px */
export const FRAME_GAP = 6;

/** Where the standing backdrop page meets the lying floor page (page units; proof A ≈ 357). */
export const GUTTER_Y = 360;
/** The floor page's front edge, below the 560 model: pull tabs live in the band above it. */
export const FLOOR_BOTTOM = 650;
/** The page-block edges (five lines, a thick old book) hang this far under the floor page. */
export const BLOCK_DEPTH = 14;
/** The drawn book, top to bottom, in page units */
export const BOOK_EXTENT = { top: 0, bottom: FLOOR_BOTTOM + BLOCK_DEPTH } as const;

/**
 * The page SVG's view box in page units: the page plus room for the floor page's widening and the
 * page block. The baked backdrop (#96) covers exactly this box.
 */
export const PAGE_VIEW_BOX = { x: -30, y: BOOK_EXTENT.top - 12, w: PAGE_W + 60, h: BOOK_EXTENT.bottom - BOOK_EXTENT.top + 24 } as const;

/** The floor perspective (bible § 2.1): ~6 % wider toward the reader every 250 units, VP high above centre. */
export const FLOOR_WIDEN = 0.06;
export const FLOOR_WIDEN_SPAN = 250;
export const VANISHING_POINT: Pt = [195, -360];
/** Box tops recede toward the vanishing point by 2 % (bible § 2.1 `tv`). */
export const TOP_RECEDE = 0.02;

export interface BookLayout {
  /** Viewport in CSS px */
  readonly vw: number;
  readonly vh: number;
  /** Page units → CSS px */
  readonly scale: number;
  /** Screen position of page unit (0, 0) */
  readonly x: number;
  readonly y: number;
  /** The top of the HUD slot: under the notch / status bar (the safe-area inset, #136) */
  readonly hudTop: number;
  /** The top of the bottom bar slot (above the home indicator) */
  readonly barTop: number;
}

/** The phone's safe-area insets in CSS px (`env(safe-area-inset-*)`; 0 on most browsers). */
export interface SafeInsets {
  readonly top: number;
  readonly bottom: number;
}

export const NO_INSETS: SafeInsets = { top: 0, bottom: 0 };

/**
 * Fits the book between the HUD and the bottom bar: as wide as the cover margin allows (≈ 0.91 at
 * 390), smaller when the viewport is short, centred in the leftover height (which is cover). The
 * HUD starts under the top safe-area inset and the bar ends over the bottom one (#136: with
 * `viewport-fit=cover`, an installed app on a notched phone draws under the status bar and the
 * home indicator).
 */
export function bookLayout(vw: number, vh: number, inset: SafeInsets = NO_INSETS): BookLayout {
  const extent = BOOK_EXTENT.bottom - BOOK_EXTENT.top;
  const room = vh - inset.top - inset.bottom;
  const byWidth = (vw - 2 * COVER_MARGIN) / PAGE_W;
  const byHeight = (room - HUD_H - BAR_H - 2 * FRAME_GAP) / extent;
  const scale = Math.max(0.1, Math.min(byWidth, byHeight, MAX_SCALE));
  const spare = Math.max(0, room - HUD_H - BAR_H - 2 * FRAME_GAP - extent * scale);
  return {
    vw,
    vh,
    scale,
    x: (vw - PAGE_W * scale) / 2,
    y: inset.top + HUD_H + FRAME_GAP + spare / 2 - BOOK_EXTENT.top * scale,
    hudTop: inset.top,
    barTop: vh - inset.bottom - BAR_H,
  };
}

/** A page point in screen px. */
export function toScreen(layout: BookLayout, [x, y]: Pt): Pt {
  return [layout.x + x * layout.scale, layout.y + y * layout.scale];
}

export type Hit = { x: number; y: number; w: number; h: number } | { cx: number; cy: number; r: number };

/** A hit area's on-screen size in px (GDD R6: ≥ 48 × 48 after the book scale). */
export function hitScreenSize(layout: BookLayout, hit: Hit): { w: number; h: number } {
  const [w, h] = 'r' in hit ? [hit.r * 2, hit.r * 2] : [hit.w, hit.h];
  return { w: w * layout.scale, h: h * layout.scale };
}

/** The floor page's half-widening at depth `y` (0 at the gutter, ≈ 6 % per 250 units below it). */
export function floorWiden(y: number): number {
  return Math.max(0, y - GUTTER_Y) * (FLOOR_WIDEN / FLOOR_WIDEN_SPAN) * (PAGE_W / 2);
}

/** The floor page outline (a trapezoid widening toward the reader), as a `d`. Art only. */
export function floorOutline(): string {
  const w = floorWiden(FLOOR_BOTTOM);
  return `M0 ${GUTTER_Y}H${PAGE_W}L${round1(PAGE_W + w)} ${FLOOR_BOTTOM}H${round1(-w)}Z`;
}

/**
 * A point moved toward the vanishing point by `t` (box tops, bible § 2.1). Art only: the walk
 * graph is never foreshortened, nodes stay in page units.
 */
export function towardVp([x, y]: Pt, t: number = TOP_RECEDE): Pt {
  return [round1(x + (VANISHING_POINT[0] - x) * t), round1(y + (VANISHING_POINT[1] - y) * t)];
}

export const round1 = (n: number): number => Math.round(n * 10) / 10;
