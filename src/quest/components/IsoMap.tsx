import { memo, useMemo, type CSSProperties, type ReactNode } from 'react';
import { Ambient } from '../../art/fx/Ambient';
import { LightFixture, LightLayer } from '../../art/lights/LightLayer';
import { hasFixture } from '../../art/lights/lights';
import { UI } from '../../art/palette';
import { SceneClock, sceneRim } from '../../art/scene';
import { spriteMeta } from '../../art/sprite';
import { SPRITES } from '../../art/sprites';
import { Ground } from '../../art/tiles/Ground';
import { TILE_H, TILE_W, toScreen } from '../engine/iso';
import { mapClock } from '../engine/clock';
import { chestOpened, meets } from '../engine/path';
import type { SpriteName } from '../../art/types';
import type { GameMap, Tile } from '../engine/types';

/**
 * The isometric map, v2 (art direction § 8.4 *Map stack*). Inside one camera layer, back to front:
 *
 *   1. `Ground`: the whole ground as one memoised SVG, graded for the map's clock (§ 4.4).
 *   2. `Ambient`: up to six looping FX (leaves, ripples, fireflies…).
 *   3. The tap marker.
 *   4. Actors (decor, light fixtures, NPCs, chests, the party), each a feet-anchored sprite sorted
 *      back to front by c + r, the painter's order for a 2:1 projection (multi-tile props by their
 *      front-most tile). Characters get the scene's `--rim` and the half grade (`SceneClock`).
 *   5. `LightLayer`: every bloom, pool and wet reflection in one `screen`-blended SVG.
 *
 * The sky behind (`SkyLayer`) lives in screen space; `cameraShift` gives it the parallax offset.
 * Walking re-renders this component every frame, but the ground, ambient and light layers are
 * memoised on the map, and the camera moves them with a single `transform`.
 */

export type Actor = {
  key: string;
  /** What to draw: a sprite, or `render` for art that isn't a sprite (a light fixture) */
  sprite?: SpriteName;
  render?: ReactNode;
  /** Tile coordinates; fractional while walking */
  c: number;
  r: number;
  /** Painter's sort key (c + r) when it isn't the position: a multi-tile prop sorts by its front-most tile */
  depth?: number;
  /** Drawn height in tiles */
  size?: number;
  /** Box width as a share of its height (light fixtures are tall and thin); default 1 */
  aspect?: number;
  flip?: boolean;
  /** A bobbing idle, or the walk hop */
  motion?: 'idle' | 'walk' | 'none';
  /** Marker floating above the sprite: an NPC's talk dot, a chest's sparkle */
  badge?: ReactNode;
  /** Accessible name; required whenever the actor is tappable */
  label?: string;
  onClick?: () => void;
};

/** Default drawn heights, in tiles: party and NPCs at the map LOD's ~64 px (§ 8.3), ≈ 0.9 of a tile's width. */
export const ACTOR_SIZE = { hero: 0.92, follower: 0.84, npc: 0.92, escort: 0.7 } as const;

/** Feet-anchored placement: the sprite box sits with its bottom edge on the tile's lower corner. */
function actorBox(actor: Actor): { left: number; top: number; width: number; height: number } {
  const { x, y } = toScreen(actor.c, actor.r);
  const height = (actor.size ?? 1.3) * TILE_H * 2;
  const width = height * (actor.aspect ?? 1);
  return { left: x - width / 2, top: y + TILE_H / 2 - height, width, height };
}

/** Moved with `transform`, not `left`/`top`, so a walking actor never triggers layout. */
const actorStyle = (actor: Actor): CSSProperties => {
  const { left, top, width, height } = actorBox(actor);
  return { left: 0, top: 0, width, height, transform: `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)` };
};

/**
 * A tall tree in front of the hero would simply swallow them. Anything scenic that overlaps
 * whoever the camera is following, and sorts in front of them, goes see-through instead.
 */
function hides(actor: Actor, lead: Actor | undefined): boolean {
  if (!lead || actor.motion !== 'none' || (actor.size ?? 1.3) < 1.6) return false;
  if ((actor.depth ?? actor.c + actor.r) <= lead.c + lead.r) return false;
  const a = actorBox(actor);
  const b = actorBox(lead);
  // The head and shoulders are what matter: compare the upper half of the hero's box
  return a.left < b.left + b.width && a.left + a.width > b.left && a.top < b.top + b.height * 0.75 && a.top + a.height > b.top;
}

type Props = {
  map: GameMap;
  flags: readonly string[];
  actors: Actor[];
  /** Camera centre, in tiles */
  camera: { c: number; r: number };
  /** Viewport size in pixels */
  view: { w: number; h: number };
  /** Highlighted destination while the party walks there */
  marker?: Tile | null;
  /** Key of the actor the camera follows; tall scenery in front of them fades */
  focus?: string;
  onTapGround?: (tile: Tile) => void;
};

/** The world box of a map's tiles, with headroom above for walls and tall sprites. */
function bounds(map: GameMap): { left: number; right: number; top: number; bottom: number } {
  const cols = map.grid[0].length;
  const rows = map.grid.length;
  return {
    left: -((rows - 1) * TILE_W) / 2 - TILE_W / 2,
    right: ((cols - 1) * TILE_W) / 2 + TILE_W / 2,
    top: -TILE_H * 2.4,
    bottom: ((cols + rows - 2) * TILE_H) / 2 + TILE_H,
  };
}

/**
 * Where the world layer sits so the camera tile is centred, clamped so the map edge never
 * pulls empty space into view. A map smaller than the viewport is centred instead.
 */
export function cameraOrigin(map: GameMap, camera: { c: number; r: number }, view: { w: number; h: number }): { x: number; y: number } {
  const { left, right, top, bottom } = bounds(map);
  const focus = toScreen(camera.c, camera.r);
  const axis = (centre: number, size: number, low: number, high: number): number => {
    const span = high - low;
    if (span <= size) return (size - span) / 2 - low;
    return Math.min(-low, Math.max(size - high, size / 2 - centre));
  };
  return { x: axis(focus.x, view.w, left, right), y: axis(focus.y, view.h, top, bottom) };
}

/**
 * How far the camera has moved from the map's resting framing, in pixels: the sky's parallax
 * input (`SkyLayer` `shift`). Zero for a map that fits the view.
 */
export function cameraShift(map: GameMap, camera: { c: number; r: number }, view: { w: number; h: number }): { x: number; y: number } {
  const { left, right, top, bottom } = bounds(map);
  const origin = cameraOrigin(map, camera, view);
  const centred = { x: view.w / 2 - (left + right) / 2, y: view.h / 2 - (top + bottom) / 2 };
  return { x: centred.x - origin.x, y: centred.y - origin.y };
}

/** The soft gold diamond ring on the tile the party is walking to (pulses 1.2 s; still under reduced motion). */
const TapMarker = memo(({ tile }: { tile: Tile }) => {
  const { x, y } = toScreen(tile.c, tile.r);
  const hw = TILE_W / 2 - 6;
  const hh = TILE_H / 2 - 3;
  const ring = `M0,${-hh}L${hw},0L0,${hh}L${-hw},0Z`;
  return (
    <svg
      aria-hidden="true"
      data-marker=""
      className="pointer-events-none absolute"
      style={{ left: x - TILE_W / 2, top: y - TILE_H / 2, width: TILE_W, height: TILE_H }}
      viewBox={`${-TILE_W / 2} ${-TILE_H / 2} ${TILE_W} ${TILE_H}`}
    >
      <g className="iso-marker">
        <path d={ring} fill={UI.goldLight} fillOpacity={0.14} stroke={UI.gold} strokeOpacity={0.35} strokeWidth={5} strokeLinejoin="round" />
        <path d={ring} fill="none" stroke={UI.goldLight} strokeWidth={1.6} strokeLinejoin="round" />
        <path d={`M0,${-hh * 0.35}L${hw * 0.35},0L0,${hh * 0.35}L${-hw * 0.35},0Z`} fill={UI.goldLight} opacity={0.8} />
      </g>
    </svg>
  );
});

/** The contact shadow under a legacy sprite (option D sprites draw their own, § 8.2). */
const ContactShadow = ({ width, height }: { width: number; height: number }) => (
  <span
    aria-hidden="true"
    className="pointer-events-none absolute block"
    style={{
      left: width * 0.2,
      width: width * 0.6,
      top: height - TILE_H / 2 - height * 0.07,
      height: height * 0.16,
      background: `radial-gradient(closest-side, ${UI.scrim}99, ${UI.scrim}00)`,
    }}
  />
);

const ActorView = ({ actor, faded }: { actor: Actor; faded: boolean }) => {
  const Art = actor.sprite ? SPRITES[actor.sprite] : undefined;
  // The same element every frame, so React skips the sprite's SVG while the actor walks
  const art = useMemo(() => (Art ? <Art lod="map" /> : null), [Art]);
  const motion = actor.motion === 'walk' ? 'walk' : actor.motion === 'idle' ? 'idle' : '';
  const box = actorBox(actor);
  // The outer box never moves within itself, so its hit area is stable; the bob and the flip get
  // a span each, because both want the transform property to themselves.
  const content = (
    <>
      {Art && !spriteMeta(Art) && <ContactShadow width={box.width} height={box.height} />}
      <span className={`block h-full w-full transition-opacity duration-200 ${motion} ${faded ? 'opacity-40' : ''}`}>
        <span className="block h-full w-full" style={actor.flip ? { transform: 'scaleX(-1)' } : undefined}>
          {art ?? actor.render}
        </span>
      </span>
      {actor.badge}
    </>
  );
  return actor.onClick ? (
    <button
      type="button"
      data-actor={actor.key}
      onClick={(event) => {
        event.stopPropagation();
        actor.onClick?.();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      aria-label={actor.label}
      className="absolute"
      style={actorStyle(actor)}
    >
      {content}
    </button>
  ) : (
    <div data-actor={actor.key} className="pointer-events-none absolute" style={actorStyle(actor)}>
      {content}
    </div>
  );
};

export const IsoMap = ({ map, actors, camera, view, marker, focus, onTapGround }: Props) => {
  const { x: originX, y: originY } = cameraOrigin(map, camera, view);
  const lead = actors.find((actor) => actor.key === focus);
  const time = mapClock(map);
  const sorted = [...actors].sort((a, b) => (a.depth ?? a.c + a.r) - (b.depth ?? b.c + b.r));

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      data-iso-map={map.id}
      onPointerDown={(event) => {
        if (!onTapGround) return;
        const box = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - box.left - originX;
        const y = event.clientY - box.top - originY;
        const c = Math.round((x / (TILE_W / 2) + y / (TILE_H / 2)) / 2);
        const r = Math.round((y / (TILE_H / 2) - x / (TILE_W / 2)) / 2);
        onTapGround({ c, r });
      }}
    >
      <div className="absolute left-0 top-0" style={{ transform: `translate3d(${originX.toFixed(1)}px, ${originY.toFixed(1)}px, 0)`, willChange: 'transform' }}>
        <div className="absolute left-0 top-0" style={{ willChange: 'transform' }}>
          <Ground map={map} time={time} />
        </div>
        <Ambient map={map} time={time} />
        {marker && <TapMarker tile={marker} />}
        <SceneClock.Provider value={time}>
          <div className="absolute left-0 top-0" style={{ ['--rim' as string]: sceneRim(time, map.neon) }}>
            {sorted.map((actor) => (
              <ActorView key={actor.key} actor={actor} faded={hides(actor, lead)} />
            ))}
          </div>
        </SceneClock.Provider>
        <LightLayer map={map} />
      </div>
    </div>
  );
};

/** The actors a map contributes: decor, visible NPCs and unopened chests. */
export function mapActors(map: GameMap, flags: readonly string[], onTalk: (id: string) => void): Actor[] {
  const time = mapClock(map);
  const actors: Actor[] = map.decor.map((entry, index) => ({
    key: `d${index}`,
    sprite: entry.sprite,
    // Multi-tile decor is drawn from the middle of its footprint and sorts by its front-most tile
    c: entry.c + ((entry.w ?? 1) - 1) / 2,
    r: entry.r + ((entry.h ?? 1) - 1) / 2,
    depth: entry.c + (entry.w ?? 1) - 1 + entry.r + (entry.h ?? 1) - 1,
    size: entry.size ?? 1.4,
    flip: entry.flip,
    motion: 'none',
  }));

  // What lamps, lanterns and neon signs hang on (their glow is in the light layer)
  (map.lights ?? []).forEach((light, index) => {
    if (!hasFixture(light.kind)) return;
    actors.push({
      key: `light${index}`,
      render: <LightFixture kind={light.kind} color={light.color} time={time} />,
      c: light.c,
      r: light.r,
      size: 80 / (TILE_H * 2),
      aspect: 0.5,
      depth: light.c + light.r,
      motion: 'none',
    });
  });

  for (const npc of map.npcs) {
    if (!meets(flags, npc)) continue;
    actors.push({
      key: `n${npc.id}`,
      sprite: npc.sprite,
      c: npc.c,
      r: npc.r,
      size: ACTOR_SIZE.npc,
      flip: npc.flip,
      motion: 'idle',
      label: npc.name,
      onClick: () => onTalk(npc.id),
      badge: <span aria-hidden="true" className="pop-dot absolute left-1/2 top-0 block h-3 w-3 -translate-x-1/2 rounded-full bg-gold-light shadow-[0_0_0_2px_theme(colors.panel.deep),0_0_10px_theme(colors.gold.DEFAULT)]" />,
    });
  }

  for (const chest of map.chests) {
    const open = chestOpened(flags, chest.id);
    actors.push({
      key: `c${chest.id}`,
      sprite: open ? 'toyBoxOpen' : 'toyBox',
      c: chest.c,
      r: chest.r,
      size: 1.1,
      motion: 'none',
      label: open ? undefined : '玩具箱',
      onClick: open ? undefined : () => onTalk(chest.id),
    });
  }

  return actors;
}
