import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button, IconButton } from '../../components/Button';
import { Chip } from '../../components/Screen';
import type { PaletteName } from '../../art/types';
import { Home, Sparkle } from '../../components/icons';
import { playTone } from '../../shared/audio';
import { IsoMap, mapActors, type Actor } from '../components/IsoMap';
import { ChapterCard, Dialogue, InnPrompt } from '../components/Dialogue';
import { HERO_SPRITE, PartyPanel } from '../components/PartyPanel';
import { CHAPTER_TITLES, MAPS } from '../engine/maps';
import { adjacentTile, findPath, isBlocked, meets } from '../engine/path';
import type { QuestState } from '../engine/quest';
import type { Tile } from '../engine/types';

/** Tiles walked per second */
const SPEED = 3.4;
/** How far behind the leader each follower trails, in path steps */
const TRAIL = 2;

/** Backdrop behind the tiles: the light each place sits in. */
const SURROUND: Record<PaletteName, string> = {
  living: 'bg-gradient-to-b from-mochaDeep/90 to-ink',
  yard: 'bg-gradient-to-b from-sky/70 to-leafDeep/80',
  park: 'bg-gradient-to-b from-sky/70 to-leaf/60',
  market: 'bg-gradient-to-b from-sun/50 to-mochaDeep/80',
  beach: 'bg-gradient-to-b from-sky/80 to-sand',
  night: 'bg-gradient-to-b from-plum/70 to-ink',
};

type Walk = { c: number; r: number; flip: boolean; moving: boolean };
type Motion = { x: number; y: number; history: { c: number; r: number }[]; flip: boolean };

/**
 * Where the followers stand. While walking they retrace the leader's own tiles; standing still
 * they fan out diagonally behind, so nobody is ever hidden under the hero.
 */
function trailOf(s: Motion, party: number, moving: boolean): Walk[] {
  return Array.from({ length: Math.max(0, party - 1) }, (_, index) => {
    const walked = s.history[(index + 1) * TRAIL - 1];
    if (walked) return { c: walked.c, r: walked.r, flip: s.flip, moving };
    const step = (index + 1) * 0.85;
    return index % 2 === 0
      ? { c: s.x - step, r: s.y, flip: s.flip, moving }
      : { c: s.x, r: s.y - step, flip: s.flip, moving };
  });
}

type Props = {
  state: QuestState;
  onStep: (tile: Tile, facing: 'left' | 'right') => void;
  onInteract: (id: string) => void;
  onAdvance: () => void;
  onInn: (yes: boolean) => void;
  onMenu: () => void;
  onExit: () => void;
};


/**
 * The map screen. Tapping a tile walks there; tapping an NPC or a chest walks up and interacts.
 * The walk itself is animated here and reported to the reducer one tile at a time, so encounters,
 * triggers and exits all stay in the engine.
 */
export const WorldScreen = ({ state, onStep, onInteract, onAdvance, onInn, onMenu, onExit }: Props) => {
  const { run, line, card, inn, sound } = state;
  const map = MAPS[run.map];

  const [box, setBox] = useState({ w: 360, h: 420 });
  const frame = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return;
    const measure = () => setBox({ w: element.clientWidth, h: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // The leader's smooth position, the trail the followers walk, and the camera all live in refs:
  // the animation loop writes them every frame and only publishes when something visibly changed.
  const [walk, setWalk] = useState<{ lead: Walk; trail: Walk[]; camera: { c: number; r: number } }>(() => ({
    lead: { c: run.pos.c, r: run.pos.r, flip: run.facing === 'left', moving: false },
    trail: [],
    camera: { c: run.pos.c, r: run.pos.r },
  }));
  const [target, setTarget] = useState<Tile | null>(null);

  const motion = useRef({
    x: run.pos.c,
    y: run.pos.r,
    path: [] as Tile[],
    history: [] as { c: number; r: number }[],
    flip: run.facing === 'left',
    camera: { c: run.pos.c, r: run.pos.r },
    pending: null as string | null,
  });

  const callbacks = useRef({ onStep, onInteract });
  callbacks.current = { onStep, onInteract };

  // A scene, a card or a screen change stops the party where it stands
  const frozen = Boolean(line || card || inn !== null);
  useEffect(() => {
    if (frozen) {
      motion.current.path = [];
      motion.current.pending = null;
      setTarget(null);
    }
  }, [frozen]);

  // The reducer can teleport the party (an exit, a defeat); snap the animation to wherever it says
  useEffect(() => {
    const state = motion.current;
    if (Math.abs(state.x - run.pos.c) > 1.2 || Math.abs(state.y - run.pos.r) > 1.2) {
      state.x = run.pos.c;
      state.y = run.pos.r;
      state.path = [];
      state.history = [];
      state.pending = null;
      state.camera = { c: run.pos.c, r: run.pos.r };
      setTarget(null);
      setWalk({ lead: { c: run.pos.c, r: run.pos.r, flip: state.flip, moving: false }, trail: [], camera: state.camera });
    }
  }, [run.pos, run.map]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const s = motion.current;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      let moved = false;
      const next = s.path[0];
      if (next) {
        const dx = next.c - s.x;
        const dy = next.r - s.y;
        const distance = Math.hypot(dx, dy);
        const stride = SPEED * dt;
        if (distance <= stride) {
          s.x = next.c;
          s.y = next.r;
          s.path.shift();
          s.history.unshift({ c: s.x, r: s.y });
          s.history.length = Math.min(s.history.length, 12);
          // Screen-left is -c/+r, so face by the isometric x delta
          if (dx - dy !== 0) s.flip = dx - dy < 0;
          callbacks.current.onStep({ c: next.c, r: next.r }, s.flip ? 'left' : 'right');
          if (s.path.length === 0) {
            setTarget(null);
            const pending = s.pending;
            s.pending = null;
            if (pending) callbacks.current.onInteract(pending);
          }
        } else {
          s.x += (dx / distance) * stride;
          s.y += (dy / distance) * stride;
          if (dx - dy !== 0) s.flip = dx - dy < 0;
        }
        moved = true;
      }

      const camera = s.camera;
      const ease = Math.min(1, dt * 6);
      camera.c += (s.x - camera.c) * ease;
      camera.r += (s.y - camera.r) * ease;
      const settling = Math.abs(s.x - camera.c) > 0.004 || Math.abs(s.y - camera.r) > 0.004;

      if (moved || settling) setWalk({ lead: { c: s.x, r: s.y, flip: s.flip, moving: moved }, trail: trailOf(s, run.party.length, moved), camera: { ...camera } });
      raf = requestAnimationFrame(tick);
    };

    // A hero joining changes the trail while nothing is moving, so publish once up front
    const s = motion.current;
    setWalk({ lead: { c: s.x, r: s.y, flip: s.flip, moving: false }, trail: trailOf(s, run.party.length, false), camera: { ...s.camera } });
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run.party.length]);

  const walkTo = (tile: Tile, then: string | null = null) => {
    if (frozen) return;
    const from = { c: Math.round(motion.current.x), r: Math.round(motion.current.y) };
    const path = findPath(map, run.flags, from, tile);
    if (!path || path.length === 0) {
      if (then) callbacks.current.onInteract(then);
      return;
    }
    motion.current.path = path;
    motion.current.pending = then;
    setTarget(tile);
    playTone('tap', sound);
  };

  const reach = (spot: Tile, id: string) => {
    const from = { c: Math.round(motion.current.x), r: Math.round(motion.current.y) };
    if (Math.abs(from.c - spot.c) + Math.abs(from.r - spot.r) <= 1) {
      callbacks.current.onInteract(id);
      return;
    }
    const beside = adjacentTile(map, run.flags, from, spot);
    if (beside) walkTo(beside, id);
  };

  const actors: Actor[] = mapActors(map, run.flags, (id) => {
    const npc = map.npcs.find((entry) => entry.id === id);
    const chest = map.chests.find((entry) => entry.id === id);
    const spot = npc ?? chest;
    if (spot) reach({ c: spot.c, r: spot.r }, id);
  });

  actors.push({
    key: 'lead',
    sprite: HERO_SPRITE[run.party[0]],
    c: walk.lead.c,
    r: walk.lead.r,
    size: 1.3,
    flip: walk.lead.flip,
    motion: walk.lead.moving ? 'walk' : 'none',
  });
  run.party.slice(1).forEach((hero, index) => {
    const spot = walk.trail[index] ?? walk.lead;
    actors.push({
      key: `follow${hero}`,
      sprite: HERO_SPRITE[hero],
      c: spot.c,
      r: spot.r,
      size: hero === 'duck' ? 1.0 : 1.15,
      flip: spot.flip,
      motion: spot.moving ? 'walk' : 'idle',
    });
  });

  // The doors of this map, marked so the way on is never a hunt
  const doors = map.exits.filter((exit) => meets(run.flags, exit) || !exit.blocked);

  return (
    <main className="screen-in mx-auto flex h-dvh w-full max-w-md flex-col gap-2 px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-[max(env(safe-area-inset-top),10px)]">
      <header className="flex items-center gap-2">
        <IconButton icon={<Home />} label="回遊戲選單" onClick={onExit} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-caption font-bold text-muted">
            第 {map.chapter} 章 · {CHAPTER_TITLES[map.chapter - 1]}
          </p>
          <h1 className="truncate text-heading font-extrabold leading-tight">{map.title}</h1>
        </div>
        <Button size="sm" variant="tonal" icon={<Sparkle size={18} />} onClick={onMenu}>
          隊伍
        </Button>
      </header>

      {/* The surround takes the map's own sky, so the world reads as a lit stage rather than a hole */}
      <div ref={frame} className={`relative min-h-0 flex-1 overflow-hidden rounded-3xl shadow-card ${SURROUND[map.palette]}`}>
        <IsoMap
          map={map}
          flags={run.flags}
          actors={actors}
          camera={walk.camera}
          view={box}
          marker={target}
          focus="lead"
          onTapGround={(tile) => {
            if (isBlocked(map, run.flags, tile.c, tile.r)) return;
            walkTo(tile);
          }}
        />

        {!frozen && doors.length > 0 && (
          <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1">
            {doors.map((exit) => (
              <Chip key={`${exit.to}${exit.c}${exit.r}`} tone="ink">
                往 {MAPS[exit.to].title}
              </Chip>
            ))}
          </div>
        )}

        {card && <ChapterCard n={card.n} title={card.title} onDismiss={onAdvance} />}
        {!card && line && <Dialogue line={line} onAdvance={onAdvance} />}
        {!card && !line && inn !== null && <InnPrompt price={inn} stickers={run.stickers} onAnswer={onInn} />}
      </div>

      <PartyPanel run={run} compact />
    </main>
  );
};
