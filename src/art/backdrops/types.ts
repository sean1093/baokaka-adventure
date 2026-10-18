import type { ReactElement } from 'react';
import type { StageTokens } from '../palette';

/**
 * The battle stage's data contract (art direction § 4.1 item 5, § 8.4 *Battle backdrops*).
 *
 * A stage is drawn in **stage units**: a 390×500 frame (the § 7.4 stage at 390×844) whose floor
 * meets the sky at `horizon`. The art is painted wider, from x = −110 to 500, so a phone of any
 * shape sees a full scene: the SVG scales to the stage's height and crops the sides (see
 * `STAGE_VIEW` in Stage.tsx). Layers, back to front:
 *
 *   sky (by the clock) → far (the landmark silhouette) → floor (perspective, reflection streaks)
 *   → mid (the architecture, standing on the floor) → lights (blooms and pools) → framers (left,
 *   right) → bokeh → vignette
 *
 * (§ 4.1 lists the floor after the framers; it is painted before the mid layer here because the
 * architecture stands on it.)
 */

/** What every piece is drawn with: the graded scenery tokens, the clock, unique ids and a seed. */
export type PieceProps = {
  /** `STAGE` graded for the clock (`gradeStage`) */
  t: StageTokens;
  time: string;
  horizon: number;
  /** Unique SVG ids for this mounted stage (`useSvgIds`) */
  id: (name: string) => string;
  /** Seed for `rng()` (per stage, time and piece): the same scene on every render */
  seed: number;
};

/** One drawn layer of a stage (a landmark, the architecture, one framer). Static: no animation, no state. */
export type StagePiece = (props: PieceProps) => ReactElement | null;

/** A light source: a bloom at (x, y), optionally a post under it and a pool on the floor. */
export type StageLight = {
  x: number;
  y: number;
  /** Bloom radius */
  r: number;
  /** `STAGE_LIGHT` / `LIGHTS` / `GLOW` colour of the bloom */
  color: string;
  /** A lamp post from the head down to the floor at this y */
  post?: number;
  /** The pool of light on the floor */
  pool?: { x: number; y: number; rx: number; ry: number; opacity?: number };
};

/** A soft vertical reflection streak on the wet floor, under a light (x is its centre). */
export type Reflection = { x: number; w: number; h: number; color: string; opacity?: number; y?: number };

/** An out-of-focus light in the foreground: a circle drawn soft at the frame's corners. */
export type Bokeh = { x: number; y: number; r: number; color: string; opacity?: number };

export type FloorKind = 'pave' | 'wood';

export type StageConfig = {
  key: string;
  /** Who reads the art lab: the place and what the backdrop shows */
  label: string;
  /** A fixed clock for this backdrop; without one the stage takes the map's clock */
  time?: string;
  /** `open`: the night sky of the clock. `room`: a dark interior wall (the window is the far piece). */
  sky: 'open' | 'room';
  /** Where the floor meets the sky (stage units from the top) */
  horizon: number;
  /** The moon's place in the sky, when it is up (default: upper left, clear of the foe plate) */
  moon?: { x: number; y: number };
  far: StagePiece;
  mid: StagePiece;
  framers: readonly [StagePiece, StagePiece];
  floor: { kind: FloorKind; reflections: readonly Reflection[] };
  lights: readonly StageLight[];
  bokeh: readonly Bokeh[];
};

/** A chapter chunk (`chNN.tsx`): its backdrops by key. */
export type BackdropModule = { BACKDROPS: Readonly<Record<string, StageConfig>> };
