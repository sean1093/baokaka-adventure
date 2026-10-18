import { memo, useMemo, type ReactNode } from 'react';
import { toScreen } from '../../quest/engine/iso';
import { AMBIENT_ELEMENTS, MAX_AMBIENT_ELEMENTS, type AmbientKind, type GameMap } from '../../quest/engine/types';
import { GLOW, gradeTiles } from '../palette';
import { materialOf, surfaceAt } from '../tiles/ground';
import { saltOf, tileHash } from '../tiles/terrain';
import './ambient.css';

/**
 * Ambient life on a map (art direction § 4.1 *Ambient FX*, § 8.5): at most six small looping
 * elements per map, moved by CSS `transform` and `opacity` only (no filters, nothing that
 * re-renders). `GameMap.ambient` names the kinds; this registry places and draws them. Ch1–2's
 * generic kinds are here (leaves, ripples, fireflies); the chapter art issues register the rest
 * (steam, lantern sway, mist, rain) the same way. Reduced motion stops every loop (ambient.css).
 */

/** One ambient element at a world position. `delay` staggers the loops so they never pulse together. */
export type AmbientSpot = { key: string; x: number; y: number; delay: number; node: ReactNode; className: string };

type Placer = (map: GameMap, count: number, time: string) => AmbientSpot[];

/** Seeded tiles of the map that satisfy `ok`, `count` of them, spread out by hash order. */
function pickTiles(map: GameMap, kind: string, count: number, ok: (c: number, r: number) => boolean): { c: number; r: number }[] {
  const salt = saltOf(`${map.id}:${kind}`);
  const tiles: { c: number; r: number; h: number }[] = [];
  for (let r = 0; r < map.grid.length; r += 1) for (let c = 0; c < map.grid[r].length; c += 1) if (ok(c, r)) tiles.push({ c, r, h: tileHash(c, r, salt) });
  tiles.sort((a, b) => a.h - b.h);
  return tiles.slice(0, count);
}

const walkable = (map: GameMap) => (c: number, r: number) => {
  const material = materialOf(surfaceAt(map, c, r));
  return Boolean(material && !material.liquid);
};

const liquid = (map: GameMap) => (c: number, r: number) => Boolean(materialOf(surfaceAt(map, c, r))?.liquid);

const placers: Partial<Record<AmbientKind, Placer>> = {
  /** Leaf whirls: a leaf drifts and spins across the ground, fading in and out */
  leaves: (map, count, time) => {
    const tone = gradeTiles(time).tiles.grass;
    return pickTiles(map, 'leaves', count, walkable(map)).map(({ c, r }, index) => {
      const { x, y } = toScreen(c, r);
      return {
        key: `leaf${index}`,
        x: x - 10,
        y: y - 14,
        delay: index * 2.6,
        className: 'amb-leaf',
        node: (
          <svg width="12" height="10" viewBox="0 0 12 10" aria-hidden="true">
            <path d="M1,8C2,3 6,1 11,1C10,5 7,9 1,8Z" fill={tone.accent} />
            <path d="M1.5,7.6C4,6 7,3.6 10,1.6" stroke={tone.line} strokeWidth={0.7} fill="none" />
          </svg>
        ),
      };
    });
  },
  /** Ripple rings spreading on water */
  ripples: (map, count, time) => {
    const tone = gradeTiles(time).tiles.water;
    return pickTiles(map, 'ripples', count, liquid(map)).map(({ c, r }, index) => {
      const { x, y } = toScreen(c, r);
      return {
        key: `ripple${index}`,
        x: x - 16,
        y: y - 6,
        delay: index * 1.4,
        className: 'amb-ripple',
        node: (
          <svg width="32" height="12" viewBox="0 0 32 12" aria-hidden="true">
            <ellipse cx="16" cy="6" rx="14" ry="5" fill="none" stroke={tone.mark} strokeWidth="1" />
            <ellipse cx="16" cy="6" rx="7" ry="2.4" fill="none" stroke={tone.mark} strokeWidth="0.8" opacity="0.6" />
          </svg>
        ),
      };
    });
  },
  /** Fireflies: warm-green points that wander and blink */
  fireflies: (map, count) =>
    pickTiles(map, 'fireflies', count, walkable(map)).map(({ c, r }, index) => {
      const { x, y } = toScreen(c, r);
      return {
        key: `firefly${index}`,
        x: x - 6,
        y: y - 30 - (index % 2) * 12,
        delay: index * 1.1,
        className: `amb-firefly amb-firefly--${index % 3}`,
        node: (
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <circle cx="6" cy="6" r="6" fill={GLOW.firefly} opacity="0.28" />
            <circle cx="6" cy="6" r="1.6" fill={GLOW.fireflyCore} />
          </svg>
        ),
      };
    }),
};

/** The ambient kinds that have art; the others are skipped until their chapter registers them. */
export const AMBIENT_REGISTRY: Readonly<Partial<Record<AmbientKind, Placer>>> = placers;

/** Every ambient element of a map, capped at `MAX_AMBIENT_ELEMENTS` in total (§ 8.5). */
export function ambientSpots(map: GameMap, time: string): AmbientSpot[] {
  const spots: AmbientSpot[] = [];
  for (const kind of map.ambient ?? []) {
    const place = AMBIENT_REGISTRY[kind];
    const room = MAX_AMBIENT_ELEMENTS - spots.length;
    if (!place || room <= 0) continue;
    spots.push(...place(map, Math.min(room, AMBIENT_ELEMENTS[kind]), time));
  }
  return spots;
}

const AmbientFx = ({ map, time }: { map: GameMap; time: string }) => {
  const spots = useMemo(() => ambientSpots(map, time), [map, time]);
  if (spots.length === 0) return null;
  return (
    <div aria-hidden="true" data-ambient={spots.length} className="pointer-events-none absolute left-0 top-0">
      {spots.map((spot) => (
        <span key={spot.key} className={`absolute block ${spot.className}`} style={{ left: spot.x, top: spot.y, animationDelay: `${-spot.delay}s` }}>
          {spot.node}
        </span>
      ))}
    </div>
  );
};

export const Ambient = memo(AmbientFx, (a, b) => a.map === b.map && a.time === b.time);
