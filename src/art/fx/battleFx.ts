import type { FxAccent, FxKind } from '../../quest/engine/types';
import { FX } from '../palette';

/**
 * Battle VFX planning (art direction § 7.9, § 7.10; issue #15), pure and React-free so it can be
 * unit tested. An action plays in three layers:
 *
 *   1. anticipation: a soft gold glyph ring under a casting hero, with that hero's emblem
 *      (block, paw, feather, moon), for the 120ms wind-up;
 *   2. impact: at the strike (120 + 90ms) the element's shape lands on each target, holds for the
 *      60ms hit-stop, then a ring spreads and 6–10 particles fly;
 *   3. resolution: the damage number (BattleScreen) rises once the impact has landed.
 *
 * Limits (§ 7.10, issue #15): a full-screen wash is ≤ 0.35 opacity and ≤ 200ms, at most two
 * flashes a second, at most 40 FX nodes in flight, transform/opacity only, no SVG filters.
 * `planFx` sizes the particles so the node budget holds for any number of targets.
 */

export type Spot = { x: number; y: number };

// ---------------------------------------------------------------------------------------------
// Timing (§ 7.9 "attack: anticipation 120ms → strike 90ms → hit-stop 60ms → recover 220ms")

export const ANTICIPATION_MS = 120;
export const STRIKE_MS = 90;
export const HIT_STOP_MS = 60;
export const RECOVER_MS = 220;
/** One attack, wind-up to rest (the lunge keyframes in battle.css and rig.css run this long) */
export const ATTACK_MS = ANTICIPATION_MS + STRIKE_MS + HIT_STOP_MS + RECOVER_MS;
/** When the strike connects: impacts, hurt reactions, the quake and damage numbers start here */
export const IMPACT_AT = ANTICIPATION_MS + STRIKE_MS;
/** Each further target lands this much later, so an all-target move ripples across the row */
export const TARGET_STAGGER_MS = 50;
/** The longest any FX node lives after its own start (keep in step with battleFx.css) */
export const FX_NODE_MS = 640;
/** Longest an effect stays on screen, from the action to the last particle fading */
export const FX_MS = IMPACT_AT + 3 * TARGET_STAGGER_MS + FX_NODE_MS;

/** A full-screen wash: ≤ 0.35 opacity and ≤ 200ms (§ 7.10) */
export const WASH_MAX_OPACITY = 0.3;
export const WASH_MS = 200;
/** At most two flashes per second: a flash may start only this long after the previous one */
export const FLASH_GAP_MS = 500;
/** Under reduced motion every FX is the impact shape, faded: in 120ms, held, out over 200ms */
export const STILL_FADE_MS = 200;

// ---------------------------------------------------------------------------------------------
// Budget

export const FX_NODE_BUDGET = 40;
export const PARTICLES_MIN = 6;
export const PARTICLES_MAX = 10;

/** How many separately animated shapes a kind's impact is made of (claw: three staggered arcs). */
export const SHAPE_NODES: Readonly<Record<FxKind, number>> = {
  blocks: 1,
  cry: 2,
  claw: 3,
  feather: 1,
  paw: 1,
  heal: 1,
  shield: 1,
  typhoon: 2,
  impact: 1,
  sparkle: 1,
  neon: 1,
  water: 1,
  steam: 1,
  dizzy: 1,
};

// ---------------------------------------------------------------------------------------------
// Look

/** The colour an element washes the stage with, and the tone of its ring. */
export const FX_TINT: Readonly<Record<FxKind, string>> = {
  blocks: FX.blockYellow,
  cry: FX.sound,
  claw: FX.pink,
  feather: FX.featherLight,
  paw: FX.pad,
  heal: FX.gold,
  shield: FX.bridge,
  typhoon: FX.storm,
  impact: FX.pinkLight,
  sparkle: FX.gold,
  neon: FX.neonCyan,
  water: FX.water,
  steam: FX.steam,
  dizzy: FX.star,
};

/** Kinds that wash the whole stage even on one target (big weather). Several targets always wash. */
export const WASHES_ALONE: ReadonlySet<FxKind> = new Set<FxKind>(['typhoon']);

/** What a hero's glyph ring carries (§ 7.10 / issue #15): 寶咖咖 a block, 摩卡 a paw, 阿藍 a feather, 黑糖 the moon. */
export type Emblem = 'block' | 'paw' | 'feather' | 'moon';

export type ParticleShape = 'spark' | 'dot' | 'drop' | 'cube' | 'feather' | 'puff' | 'star' | 'note';
/** burst: out in all directions; rise: up and out (heals, steam); fall: drifting down (feathers, rain) */
export type ParticleMotion = 'burst' | 'rise' | 'fall';

type ParticleStyle = { shapes: readonly ParticleShape[]; colours: readonly string[]; motion: ParticleMotion };

export const PARTICLE_STYLE: Readonly<Record<FxKind, ParticleStyle>> = {
  blocks: { shapes: ['cube', 'spark', 'cube'], colours: [FX.blockRed, FX.blockBlue, FX.blockGreen, FX.blockYellow], motion: 'burst' },
  cry: { shapes: ['drop', 'note'], colours: [FX.sound, FX.core, FX.soundDeep], motion: 'burst' },
  claw: { shapes: ['spark', 'dot'], colours: [FX.pinkLight, FX.core, FX.pink], motion: 'burst' },
  feather: { shapes: ['feather', 'feather', 'dot'], colours: [FX.feather, FX.featherLight, FX.core], motion: 'fall' },
  paw: { shapes: ['puff', 'puff', 'dot'], colours: [FX.dust, FX.cream, FX.dustDeep], motion: 'burst' },
  heal: { shapes: ['star', 'star', 'dot'], colours: [FX.gold, FX.goldLight, FX.core], motion: 'rise' },
  shield: { shapes: ['spark', 'dot'], colours: [FX.bridgeLight, FX.bridge, FX.core], motion: 'rise' },
  typhoon: { shapes: ['drop', 'dot'], colours: [FX.rain, FX.storm, FX.core], motion: 'fall' },
  impact: { shapes: ['spark', 'dot', 'star'], colours: [FX.core, FX.pinkLight, FX.gold], motion: 'burst' },
  sparkle: { shapes: ['star', 'spark'], colours: [FX.gold, FX.goldLight, FX.core], motion: 'rise' },
  neon: { shapes: ['spark', 'dot'], colours: [FX.neonCyan, FX.neonPink, FX.zap], motion: 'burst' },
  water: { shapes: ['drop', 'drop', 'dot'], colours: [FX.water, FX.waterLight, FX.waterDeep], motion: 'burst' },
  steam: { shapes: ['puff', 'dot'], colours: [FX.steam, FX.steamDeep, FX.core], motion: 'rise' },
  dizzy: { shapes: ['star', 'dot'], colours: [FX.star, FX.goldLight, FX.core], motion: 'burst' },
};

/** One particle, in the 0..100 units of its target's box (centre 50,50). */
export type Particle = {
  shape: ParticleShape;
  colour: string;
  /** Where it ends up, relative to the centre */
  dx: number;
  dy: number;
  /** Turn over its flight (deg) */
  spin: number;
  /** Its own size (units) */
  size: number;
  /** Start after the impact (ms) */
  delay: number;
};

/** A small deterministic hash in [0, 1): the same action always throws the same particles. */
export function fxHash(...parts: number[]): number {
  let h = 2166136261;
  for (const part of parts) {
    h ^= Math.round(part * 1000);
    h = Math.imul(h, 16777619);
    h ^= h >>> 13;
  }
  return ((h >>> 0) % 10007) / 10007;
}

/** `count` particles for one target, spread evenly around the circle with seeded jitter. */
export function particlesFor(kind: FxKind, count: number, seed: number): Particle[] {
  const style = PARTICLE_STYLE[kind];
  const out: Particle[] = [];
  for (let i = 0; i < count; i += 1) {
    const jitter = fxHash(seed, i, 1);
    const reach = 0.62 + fxHash(seed, i, 2) * 0.38;
    let angle = ((i + jitter * 0.6) / count) * Math.PI * 2 - Math.PI / 2;
    let dx = Math.cos(angle) * 52 * reach;
    let dy = Math.sin(angle) * 46 * reach;
    if (style.motion === 'rise') {
      // A fountain: spread sideways, all of it drifting up
      angle = ((i + 0.5) / count - 0.5) * Math.PI * 0.9;
      dx = Math.sin(angle) * 46 * reach;
      dy = -28 - 30 * reach + Math.abs(dx) * 0.3;
    } else if (style.motion === 'fall') {
      // A shower: thrown out a little, then drifting down
      dx = Math.cos(angle) * 52 * reach;
      dy = 14 + Math.abs(Math.sin(angle)) * 30 * reach;
    }
    out.push({
      shape: style.shapes[i % style.shapes.length],
      colour: style.colours[i % style.colours.length],
      dx: Math.round(dx * 10) / 10,
      dy: Math.round(dy * 10) / 10,
      spin: Math.round((fxHash(seed, i, 3) - 0.5) * 240),
      size: Math.round((6 + fxHash(seed, i, 4) * 5) * 10) / 10,
      delay: Math.round(fxHash(seed, i, 5) * 60),
    });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// The plan

export type FxInput = {
  kind: FxKind;
  accent?: FxAccent;
  /** The casting hero's spot and emblem; null for a swing, an item or a foe's move */
  caster: { spot: Spot; emblem: Emblem } | null;
  /** Where the effect lands, in stage fractions, de-duplicated */
  spots: readonly Spot[];
  /** Whether a flash (the wash) may play this step (the two-per-second limit) */
  flash: boolean;
  /** Seeds the particle scatter (the battle step) */
  seed: number;
};

export type FxTargetPlan = {
  spot: Spot;
  delay: number;
  particles: Particle[];
  /** The shield only: how far apart the outermost heroes stand (stage fractions) */
  span?: number;
};

export type FxPlan = {
  kind: FxKind;
  accent: FxAccent | null;
  anticipation: { spot: Spot; emblem: Emblem } | null;
  /** The wash colour, or null for none */
  wash: string | null;
  targets: FxTargetPlan[];
  /** FX nodes this plan puts in flight (each separately animated element) */
  nodes: number;
};

/** Nodes every target costs besides its particles: its shape(s), its ring and an accent. */
export const nodesPerTarget = (kind: FxKind, accent: boolean): number => SHAPE_NODES[kind] + 1 + (accent ? 1 : 0);

/** The particles each target gets so the whole action stays within FX_NODE_BUDGET. */
export function particleCount(kind: FxKind, targets: number, fixed: number, accent: boolean): number {
  if (targets <= 0) return 0;
  const room = Math.floor((FX_NODE_BUDGET - fixed) / targets) - nodesPerTarget(kind, accent);
  return Math.max(0, Math.min(PARTICLES_MAX, room));
}

/** Total nodes of a plan: glyph ring + emblem, the wash, then each target's pieces. */
export function countNodes(plan: Pick<FxPlan, 'kind' | 'accent' | 'anticipation' | 'wash' | 'targets'>): number {
  const fixed = (plan.anticipation ? 2 : 0) + (plan.wash ? 1 : 0);
  return fixed + plan.targets.reduce((sum, target) => sum + nodesPerTarget(plan.kind, plan.accent !== null) + target.particles.length, 0);
}

export function planFx(input: FxInput): FxPlan {
  const { kind, caster, flash, seed } = input;
  const accent = input.accent ?? null;
  // The shield is one arch over the whole party: centred on it, standing on the front row, `span` wide
  const xs = input.spots.map((spot) => spot.x);
  const shieldSpan = xs.length > 0 ? Math.max(...xs) - Math.min(...xs) : 0;
  const spots: Spot[] =
    kind === 'shield' && input.spots.length > 0
      ? [{ x: (Math.max(...xs) + Math.min(...xs)) / 2, y: Math.max(...input.spots.map((spot) => spot.y)) }]
      : [...input.spots];
  const anticipation = caster ? { spot: caster.spot, emblem: caster.emblem } : null;
  const wash = flash && (spots.length > 1 || WASHES_ALONE.has(kind)) ? FX_TINT[kind] : null;
  const fixed = (anticipation ? 2 : 0) + (wash ? 1 : 0);
  const count = particleCount(kind, spots.length, fixed, accent !== null);
  const targets = spots.map((spot, index) => ({
    spot,
    delay: IMPACT_AT + index * TARGET_STAGGER_MS,
    particles: particlesFor(kind, count, seed * 7 + index),
    ...(kind === 'shield' ? { span: shieldSpan } : {}),
  }));
  const plan = { kind, accent, anticipation, wash, targets };
  return { ...plan, nodes: countNodes(plan) };
}

/**
 * Whether a flash may play now, given when the last one did (the two-per-second limit, § 7.10).
 * `last` is null before the first flash of a fight.
 */
export const flashAllowed = (now: number, last: number | null): boolean => last === null || now - last >= FLASH_GAP_MS;
