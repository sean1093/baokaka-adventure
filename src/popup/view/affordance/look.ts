import { PRESET_ART } from '../../art';
import { compilePart } from '../../core/presets';
import type { Id, PartDef, PartPreset } from '../../core/types';
import type { Pt } from '../geometry';

/**
 * How a touchable looks right now (popup art bible § 4.1 states), handed to each part view: its
 * idle wiggle, the drag's lift, the locked veil, the reduced-motion outline, 長輩模式 seals.
 */
export interface PartLook {
  /**
   * The current wiggle run (idle, or a prop answering a tap). The two names are the same
   * animation: switching between them restarts it without remounting the art.
   */
  readonly wiggle?: WigglePhase;
  /** Being dragged: lifted to the next z (1.04 scale, a 5-unit rise, the lifted shadow) */
  readonly lifted?: boolean;
  /** The player can't move it now (`lockedWhen`, Mocha sitting on it): darkened 35 % */
  readonly locked?: boolean;
  /** Reduced motion: no wiggle, a permanent double outline instead */
  readonly outline?: boolean;
  /** 長輩模式: 28 px seals */
  readonly elder?: boolean;
}

export type WigglePhase = 'a' | 'b';

/** How each preset wiggles (bible § 4.1): ±2° tabs, ±4° wheels, a 3-unit corner lift on flaps, a prop's shake. */
export type WiggleKind = 'tab' | 'wheel' | 'flap' | 'prop';

export const WIGGLE_KIND: Readonly<Record<PartPreset, WiggleKind>> = {
  tab: 'tab',
  slider: 'tab',
  wheel: 'wheel',
  loop: 'wheel',
  flap: 'flap',
  section: 'prop',
  gate: 'prop',
  button: 'prop',
  lift: 'prop',
  pushable: 'prop',
  light: 'prop',
  blowable: 'prop',
  carrier: 'prop',
  prop: 'prop',
};

/** The CSS classes for a wiggle run (`affordance.css`), or undefined when it isn't wiggling. */
export const wiggleClass = (kind: WiggleKind, phase: WigglePhase | undefined): string | undefined =>
  phase === undefined ? undefined : `aff-wig aff-wig-${kind}-${phase}`;

/**
 * Whether a part wears the reserved marigold, the seal, the grip and the direction cue (bible § 4):
 * a player-driven preset (tab, slider, wheel, flap; a loop with a crank) whose input isn't `none`.
 * Tap toys (`prop`, a tappable `light`) take touches too but stay unmarked discoveries.
 */
export function wearsMarigold(part: PartDef): boolean {
  const art = PRESET_ART[part.preset];
  return art.touchable !== false && compilePart(part).input !== 'none';
}

/** The ids of the parts that wear marigold on a page. */
export const marigoldParts = (parts: readonly PartDef[]): Id[] => parts.filter(wearsMarigold).map((p) => p.id);

/**
 * What the hint ladder (#100, `ladder.ts`) asks the page to show: level 0 (the auto nudge) makes
 * the target shimmer once, level 1 halos it ("where", pulsing for 3 s), level 2 adds the vellum
 * ghost hand doing the gesture ("how"). `key` is a target key (`targetsOf`: a part id,
 * `perch:<id>`, `mocha:mocha`…); `stop` is the state index a drag hint should end on (the next stop
 * by default).
 */
export interface HintShow {
  readonly level: 0 | 1 | 2;
  readonly key: string;
  readonly stop?: number;
}

/**
 * Mocha's part in a hint (GDD § 2.7): `yawn` (the nudge: the stretch pose, turned toward the hinted
 * target), `look` (turned toward it), `wait` (「等等看。」: sitting, tapping his paw). Only while he
 * is at rest on the page; a hop, a stare or a reaction wins.
 */
export type MochaCue = 'yawn' | 'look' | 'wait';

/** Affordance flags beyond the gesture's (`GestureFlags`): hints, idle wiggles, done knots, 長輩模式. */
export interface AffordanceFlags {
  readonly hint?: HintShow | null;
  /** Mocha's part in the hint (#100) */
  readonly mocha?: MochaCue | null;
  /** Each wiggling part's current run */
  readonly wiggle?: Readonly<Record<Id, WigglePhase>>;
  /** Parts showing the done check knot (bible § 4.1 done, optional per page: solved wheels on 101) */
  readonly done?: readonly Id[];
  readonly elder?: boolean;
}

export const NO_AFFORDANCE: AffordanceFlags = {};

/** A ghost hand's gesture, in page units (`GhostHand`). */
export type HandGesture =
  | { readonly kind: 'tap'; readonly at: Pt }
  | { readonly kind: 'drag'; readonly from: Pt; readonly to: Pt }
  | { readonly kind: 'turn'; readonly center: Pt; readonly radius: number; readonly degrees: number }
  | { readonly kind: 'lift'; readonly at: Pt; readonly rise: number };
