import type { EnvBox } from './manifest';

/**
 * The 月亮線 window strips (#193, D-104): which page-1 cars are moving, where their windows are and
 * how fast the view passes. The game reads this (light: no art); the drawings are in
 * `art/strips.ts`, baked as two cut-outs per car (`stripKey`, `frameKey`). The cars standing at a
 * platform (2-1, 3-1, 4-1) have none: they are stopped.
 */
export interface WindowStripDef {
  readonly backdrop: string;
  readonly chapter: number;
  /** The window band (page units): the frame's box; the strip is clipped to it */
  readonly band: EnvBox;
  /** One period of the loop (page units) */
  readonly period: number;
  /** Seconds a period takes to slide past */
  readonly seconds: number;
}

export const WINDOW_STRIPS: Readonly<Record<string, WindowStripDef>> = Object.fromEntries(([
  { backdrop: 'c1/car', chapter: 1, band: { x: 66, y: 144, w: 308, h: 116 }, period: 360, seconds: 9 },
  { backdrop: 'c5/red-car', chapter: 5, band: { x: 2, y: 122, w: 388, h: 102 }, period: 240, seconds: 3.2 },
  { backdrop: 'c6/front-car', chapter: 6, band: { x: 202, y: 120, w: 104, h: 112 }, period: 300, seconds: 11 },
  { backdrop: 'c8/hot-spring-train', chapter: 8, band: { x: 2, y: 130, w: 388, h: 142 }, period: 420, seconds: 14 },
  { backdrop: 'c9/tamsui-line', chapter: 9, band: { x: 8, y: 130, w: 262, h: 138 }, period: 480, seconds: 18 },
  { backdrop: 'c10/xinyi-line', chapter: 10, band: { x: 6, y: 126, w: 286, h: 130 }, period: 420, seconds: 14 },
] satisfies WindowStripDef[]).map((s) => [s.backdrop, s]));

/** The cut-out keys of a car's strip and of its frame (the backdrop with the windows cut out). */
export const stripKey = (backdrop: string): string => `${backdrop}-strip`;
export const frameKey = (backdrop: string): string => `${backdrop}-frame`;

/** The cut-outs a backdrop's window strip draws (none for a backdrop without one). */
export const stripCutouts = (backdrop: string): readonly string[] => (WINDOW_STRIPS[backdrop] === undefined ? [] : [stripKey(backdrop), frameKey(backdrop)]);
