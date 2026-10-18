import { toScreen } from '../../quest/engine/iso';
import { STANDING_LIGHTS, type GameMap, type LightKind, type MapLight } from '../../quest/engine/types';
import { GLOW, LIGHTS, mixHex } from '../palette';
import { surfaceAt, materialOf } from '../tiles/ground';

/**
 * Light sources on a map (art direction § 2.7 *Light sources*, § 4.1, § 8.4): what each kind of
 * `GameMap.lights` entry draws. Every light gets a bloom where it glows, a pool on the ground under
 * it and, on wet or glossy ground, a soft reflection streak; all of it is painted in one
 * `mix-blend-mode: screen` layer (`LightLayer`). Lights are emissive: never graded.
 *
 * Pure, so the light layer's geometry is unit-tested.
 */

export type LightSpec = {
  /** The default colour (a neon sign or a window may override it) */
  color: string;
  /** Height of the glowing point above the tile centre, in pixels (0 = on the ground) */
  height: number;
  /** Bloom radius around the glowing point; 0 = none */
  bloom: number;
  /** Ground pool radii */
  pool: [number, number];
  poolOpacity: number;
  /** Reflection streak length on wet ground; 0 = none */
  streak: number;
};

/** Whether a light kind has a fixture drawn as a map actor (`STANDING_LIGHTS`, types.ts). */
export const hasFixture = (kind: LightKind): kind is 'lamp' | 'lantern' | 'neon' => STANDING_LIGHTS.includes(kind);

export const LIGHT_SPECS: Readonly<Record<LightKind, LightSpec>> = {
  lamp: { color: LIGHTS.lampMid, height: 50, bloom: 28, pool: [46, 17], poolOpacity: 0.7, streak: 52 },
  window: { color: LIGHTS.windowWarm, height: 26, bloom: 24, pool: [36, 13], poolOpacity: 0.45, streak: 30 },
  lantern: { color: GLOW.lantern, height: 36, bloom: 22, pool: [28, 11], poolOpacity: 0.5, streak: 36 },
  neon: { color: GLOW.neonPink, height: 40, bloom: 30, pool: [34, 12], poolOpacity: 0.55, streak: 60 },
  screen: { color: GLOW.screen, height: 16, bloom: 18, pool: [24, 9], poolOpacity: 0.4, streak: 26 },
  moon: { color: GLOW.moon, height: 0, bloom: 0, pool: [12, 4], poolOpacity: 0.85, streak: 0 },
};

/** Where a lamp's head sits relative to its post's foot (the shepherd's-crook arm reaches right). */
export const LAMP_HEAD = { dx: 9, dy: -LIGHT_SPECS.lamp.height };

/** A door's warm spill: added to every doorway so the way on reads at a glance. */
const DOOR_GLOW: LightSpec = { color: GLOW.door, height: 0, bloom: 0, pool: [30, 12], poolOpacity: 0.45, streak: 0 };

/** One light, resolved to world pixels and colours. */
export type PlacedLight = {
  key: string;
  kind: LightKind | 'door';
  x: number;
  y: number;
  /** The glowing point */
  gx: number;
  gy: number;
  color: string;
  /** The hot centre: the colour pushed toward white */
  core: string;
  spec: LightSpec;
  /** On wet ground: draw the streak */
  wet: boolean;
};

/** The map's lights plus the door glows, in world pixels. */
export function placeLights(map: GameMap): PlacedLight[] {
  const placed: PlacedLight[] = [];
  const add = (key: string, kind: LightKind | 'door', light: Pick<MapLight, 'c' | 'r' | 'color'>, spec: LightSpec) => {
    const { x, y } = toScreen(light.c, light.r);
    const color = light.color ?? spec.color;
    const material = materialOf(surfaceAt(map, Math.round(light.c), Math.round(light.r)));
    const dx = kind === 'lamp' ? LAMP_HEAD.dx : 0;
    placed.push({ key, kind, x: x + dx, y, gx: x + dx, gy: y - spec.height, color, core: mixHex(color, GLOW.moonCore, 0.6), spec, wet: Boolean(material?.wet) && spec.streak > 0 });
  };
  (map.lights ?? []).forEach((light, index) => add(`l${index}`, light.kind, light, LIGHT_SPECS[light.kind]));
  for (const exit of map.exits) add(`door${exit.c},${exit.r}`, 'door', exit, DOOR_GLOW);
  return placed;
}

/** The world box every light's bloom, pool and streak fits in. */
export function lightBox(lights: readonly PlacedLight[]): { x: number; y: number; w: number; h: number } | null {
  if (lights.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const light of lights) {
    const { bloom, pool, streak } = light.spec;
    minX = Math.min(minX, light.gx - bloom * 1.8, light.x - pool[0]);
    maxX = Math.max(maxX, light.gx + bloom * 1.8, light.x + pool[0]);
    minY = Math.min(minY, light.gy - bloom * 1.8, light.y - pool[1]);
    maxY = Math.max(maxY, light.y + pool[1], light.y + streak);
  }
  return { x: Math.floor(minX), y: Math.floor(minY), w: Math.ceil(maxX - minX), h: Math.ceil(maxY - minY) };
}
