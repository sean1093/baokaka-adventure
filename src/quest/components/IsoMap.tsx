import type { CSSProperties, ReactNode } from 'react';
import { SPRITES } from '../../art/sprites';
import { TERRAIN, TILE_H, TILE_W, terrainAt, toScreen } from '../engine/iso';
import { chestOpened, meets } from '../engine/path';
import type { SpriteName } from '../../art/types';
import type { GameMap, Tile } from '../engine/types';

/**
 * The isometric renderer. Ground is one absolutely positioned diamond per tile; everything that
 * stands on the ground (decor, NPCs, chests, the party) is a sprite anchored by its feet and
 * sorted back to front by c + r, which is the painter's order for a 2:1 projection.
 */

/** A diamond: the top face of one tile. */
const Diamond = ({ x, y, fill, dim }: { x: number; y: number; fill: string; dim: boolean }) => (
  <div
    className="absolute"
    style={{
      left: x - TILE_W / 2,
      top: y - TILE_H / 2,
      width: TILE_W,
      height: TILE_H,
      background: fill,
      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
      opacity: dim ? 0.55 : 1,
    }}
  />
);

/** A raised block: two side faces under the diamond, so walls and fences read as solid. */
const Block = ({ x, y, style }: { x: number; y: number; style: { top: string; left?: string; right?: string; height?: number } }) => {
  const height = style.height ?? 0;
  return (
    <>
      <div
        className="absolute"
        style={{
          left: x - TILE_W / 2,
          top: y,
          width: TILE_W / 2,
          height: TILE_H / 2 + height,
          background: style.left,
          clipPath: `polygon(0% 0%, 100% 50%, 100% 100%, 0% ${((TILE_H / 2) / (TILE_H / 2 + height)) * 100}%)`,
        }}
      />
      <div
        className="absolute"
        style={{
          left: x,
          top: y,
          width: TILE_W / 2,
          height: TILE_H / 2 + height,
          background: style.right,
          clipPath: `polygon(0% 50%, 100% 0%, 100% ${((TILE_H / 2) / (TILE_H / 2 + height)) * 100}%, 0% 100%)`,
        }}
      />
      <Diamond x={x} y={y - height} fill={style.top} dim={false} />
    </>
  );
};

export type Actor = {
  key: string;
  sprite: SpriteName;
  /** Tile coordinates; fractional while walking */
  c: number;
  r: number;
  /** Drawn height in tiles */
  size?: number;
  flip?: boolean;
  /** A bobbing idle, or the walk hop */
  motion?: 'idle' | 'walk' | 'none';
  /** Marker floating above the sprite: an NPC's talk dot, a chest's sparkle */
  badge?: ReactNode;
  /** Accessible name; required whenever the actor is tappable */
  label?: string;
  onClick?: () => void;
};

/** Feet-anchored placement: the sprite box sits with its bottom edge on the tile centre. */
function actorBox(actor: Actor): { left: number; top: number; size: number } {
  const { x, y } = toScreen(actor.c, actor.r);
  const size = (actor.size ?? 1.3) * TILE_H * 2;
  return { left: x - size / 2, top: y + TILE_H / 2 - size, size };
}

const actorStyle = (actor: Actor): CSSProperties => {
  const { left, top, size } = actorBox(actor);
  return { left, top, width: size, height: size };
};

/**
 * A tall tree in front of the hero would simply swallow them. Anything scenic that overlaps
 * whoever the camera is following, and sorts in front of them, goes see-through instead.
 */
function hides(actor: Actor, lead: Actor | undefined): boolean {
  if (!lead || actor.motion !== 'none' || (actor.size ?? 1.3) < 1.6) return false;
  if (actor.c + actor.r <= lead.c + lead.r) return false;
  const a = actorBox(actor);
  const b = actorBox(lead);
  // The head and shoulders are what matter: compare the upper half of the hero's box
  return a.left < b.left + b.size && a.left + a.size > b.left && a.top < b.top + b.size * 0.75 && a.top + a.size > b.top;
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

/**
 * Where the world layer sits so the camera tile is centred, clamped so the map edge never
 * pulls empty space into view. A map smaller than the viewport is centred instead.
 */
function origin(map: GameMap, camera: { c: number; r: number }, view: { w: number; h: number }): { x: number; y: number } {
  const cols = map.grid[0].length;
  const rows = map.grid.length;
  // Half a tile of margin, plus headroom above for tall sprites and the raised wall blocks
  const left = -((rows - 1) * TILE_W) / 2 - TILE_W / 2;
  const right = ((cols - 1) * TILE_W) / 2 + TILE_W / 2;
  const top = -TILE_H * 2.4;
  const bottom = ((cols + rows - 2) * TILE_H) / 2 + TILE_H;

  const focus = toScreen(camera.c, camera.r);
  const axis = (centre: number, size: number, low: number, high: number): number => {
    const span = high - low;
    if (span <= size) return (size - span) / 2 - low;
    return Math.min(-low, Math.max(size - high, size / 2 - centre));
  };
  return { x: axis(focus.x, view.w, left, right), y: axis(focus.y, view.h, top, bottom) };
}

export const IsoMap = ({ map, actors, camera, view, marker, focus, onTapGround }: Props) => {
  const { x: originX, y: originY } = origin(map, camera, view);
  const lead = actors.find((actor) => actor.key === focus);

  const ground: ReactNode[] = [];
  const blocks: ReactNode[] = [];
  for (let r = 0; r < map.grid.length; r += 1) {
    for (let c = 0; c < map.grid[r].length; c += 1) {
      const terrain = terrainAt(map, c, r);
      if (terrain === 'void') continue;
      const style = TERRAIN[terrain];
      const { x, y } = toScreen(c, r);
      if (style.height) blocks.push(<Block key={`b${c},${r}`} x={x} y={y} style={style} />);
      else ground.push(<Diamond key={`g${c},${r}`} x={x} y={y} fill={(c + r) % 2 === 0 ? style.top : style.alt} dim={false} />);
    }
  }

  const sorted = [...actors].sort((a, b) => a.c + a.r - (b.c + b.r));

  return (
    <div
      className="absolute inset-0 overflow-hidden"
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
      <div className="absolute" style={{ left: originX, top: originY, willChange: 'transform' }}>
        {ground}
        {marker && (
          <div
            className="pointer-events-none absolute"
            style={{
              left: toScreen(marker.c, marker.r).x - TILE_W / 2,
              top: toScreen(marker.c, marker.r).y - TILE_H / 2,
              width: TILE_W,
              height: TILE_H,
            }}
          >
            <div className="marker h-full w-full rounded-[50%] border-2 border-cream/90 bg-cream/25" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
          </div>
        )}
        {blocks}
        {sorted.map((actor) => {
          const Art = SPRITES[actor.sprite];
          const motion = actor.motion === 'walk' ? 'walk' : actor.motion === 'idle' ? 'idle' : '';
          const faded = hides(actor, lead);
          // The outer box never moves, so its hit area is stable; the bob and the flip get a
          // span each, because both want the transform property to themselves.
          const content = (
            <>
              <span className={`block h-full w-full transition-opacity duration-200 ${motion} ${faded ? 'opacity-40' : ''}`}>
                <span className="block h-full w-full" style={actor.flip ? { transform: 'scaleX(-1)' } : undefined}>
                  <Art />
                </span>
              </span>
              {actor.badge}
            </>
          );
          return actor.onClick ? (
            <button
              key={actor.key}
              type="button"
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
            <div key={actor.key} className="pointer-events-none absolute" style={actorStyle(actor)}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** The actors a map contributes: decor, visible NPCs and unopened chests. */
export function mapActors(map: GameMap, flags: readonly string[], onTalk: (id: string) => void): Actor[] {
  const actors: Actor[] = map.decor.map((entry, index) => ({
    key: `d${index}`,
    sprite: entry.sprite,
    // Multi-tile decor is drawn from the middle of its footprint
    c: entry.c + ((entry.w ?? 1) - 1) / 2,
    r: entry.r + ((entry.h ?? 1) - 1) / 2,
    size: entry.size ?? 1.4,
    flip: entry.flip,
    motion: 'none',
  }));

  for (const npc of map.npcs) {
    if (!meets(flags, npc)) continue;
    actors.push({
      key: `n${npc.id}`,
      sprite: npc.sprite,
      c: npc.c,
      r: npc.r,
      size: 1.3,
      flip: npc.flip,
      motion: 'idle',
      label: npc.name,
      onClick: () => onTalk(npc.id),
      badge: <span aria-hidden="true" className="pop-dot absolute left-1/2 top-0 block h-3 w-3 -translate-x-1/2 rounded-full bg-sun ring-2 ring-ink/70" />,
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
