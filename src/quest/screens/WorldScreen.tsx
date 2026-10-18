import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LIGHTS, UI as UI_TOKENS, withAlpha } from '../../art/palette';
import { SkyLayer } from '../../art/sky/SkyLayer';
import { IconButton } from '../../components/Button';
import { ChapterCard } from '../../components/ChapterCard';
import { GlassChip, Num } from '../../components/Chip';
import { Home, Pouch } from '../../components/icons';
import { usePresence, useReducedMotion } from '../../components/motion';
import { playTone } from '../../shared/audio';
import { ACTOR_SIZE, IsoMap, cameraShift, mapActors, type Actor } from '../components/IsoMap';
import { TalkBox, linePage, type Talk } from '../components/Dialogue';
import { HERO_SPRITE, PartyPanel } from '../components/PartyPanel';
import { mapClock } from '../engine/clock';
import { CHAPTER_TITLES, MAPS } from '../engine/maps';
import { adjacentTile, findPath, isBlocked, meets, restingSpot } from '../engine/path';
import { FOLLOWERS, activeFollower, type Follower } from '../engine/progress';
import type { QuestState } from '../engine/quest';
import { stationAt } from '../engine/mrt';
import { UI } from '../engine/strings';
import { RIDE_TO, type Tile } from '../engine/types';

/** The world's vignette and corner bokeh: one static gradient stack, painted once. */
const VIGNETTE = [
  `radial-gradient(circle at 6% 74%, ${withAlpha(LIGHTS.lampMid, 0.22)} 0, ${withAlpha(LIGHTS.lampMid, 0)} 34px)`,
  `radial-gradient(circle at 95% 68%, ${withAlpha(LIGHTS.windowCool, 0.18)} 0, ${withAlpha(LIGHTS.windowCool, 0)} 26px)`,
  `radial-gradient(ellipse 88% 62% at 50% 48%, ${withAlpha(UI_TOKENS.scrim, 0)} 52%, ${withAlpha(UI_TOKENS.scrim, 0.55)} 100%)`,
].join(', ');

/** Tiles walked per second */
const SPEED = 3.4;
/** How far behind the leader each follower trails, in path steps */
const TRAIL = 2;

/** How long the talk box takes to slide away (art direction § 7.9 *Dialogue in/out*). */
const TALK_OUT_MS = 240;
/** The map → map iris (§ 7.9). */
const IRIS_MS = 400;

type Walk = { c: number; r: number; flip: boolean; moving: boolean };
type Motion = { x: number; y: number; history: { c: number; r: number }[]; flip: boolean; escort: Tile[] };

/** How many walked tiles the escort lags the leader: one tile behind the last hero (who trails at `(party - 1) * TRAIL - 1`). */
const escortLag = (party: number): number => Math.max(1, (party - 1) * TRAIL);

/**
 * Where the escort follower stands: the oldest tile of its own queue, which starts on a free tile
 * beside the party (`restingSpot`) and then takes every tile the leader walks, so it retraces the
 * party's path one tile behind the last hero and never cuts through walls. Right after a map
 * change it waits on that tile until the party has walked far enough for it to fall in behind.
 */
function escortOf(s: Motion, party: number, moving: boolean): Walk {
  const [at, next] = s.escort;
  // Face where it is about to step, like the leader does
  const dx = next ? next.c - at.c - (next.r - at.r) : 0;
  const flip = dx !== 0 ? dx < 0 : s.flip;
  // While its queue is still filling it stands and waits; once full, it steps with the party
  return { c: at.c, r: at.r, flip, moving: moving && s.escort.length > escortLag(party) };
}

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
  onChoose: (index: number) => void;
  onMenu: () => void;
  onExit: () => void;
  /** Escort table; the art lab passes its own, the game uses the content's */
  followers?: readonly Follower[];
};


/**
 * The map screen. Tapping a tile walks there; tapping an NPC or a chest walks up and interacts.
 * The walk itself is animated here and reported to the reducer one tile at a time, so encounters,
 * triggers and exits all stay in the engine.
 */
export const WorldScreen = ({ state, onStep, onInteract, onAdvance, onInn, onChoose, onMenu, onExit, followers = FOLLOWERS }: Props) => {
  const { run, line, card, choice, inn, sound, scene } = state;
  const map = MAPS[run.map];
  const clock = mapClock(map);
  const follower = activeFollower(run.flags, followers);
  // No parallax under reduced motion (§ 7.9): the OS setting or 「減少動態」
  const reducedMotion = useReducedMotion();

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
  const [arrival] = useState(() => restingSpot(map, run.flags, run.pos));
  const [walk, setWalk] = useState<{ lead: Walk; trail: Walk[]; escort: Walk; camera: { c: number; r: number } }>(() => ({
    lead: { c: run.pos.c, r: run.pos.r, flip: run.facing === 'left', moving: false },
    trail: [],
    escort: { ...arrival, flip: run.facing === 'left', moving: false },
    camera: { c: run.pos.c, r: run.pos.r },
  }));
  const [target, setTarget] = useState<Tile | null>(null);

  const motion = useRef({
    x: run.pos.c,
    y: run.pos.r,
    map: run.map,
    path: [] as Tile[],
    history: [] as { c: number; r: number }[],
    escort: [arrival],
    flip: run.facing === 'left',
    camera: { c: run.pos.c, r: run.pos.r },
    pending: null as string | null,
  });

  const callbacks = useRef({ onStep, onInteract });
  callbacks.current = { onStep, onInteract };

  // A new map opens with an iris on the party (who stands at the centre of the view)
  const [iris, setIris] = useState(0);
  const shownMap = useRef(run.map);
  useEffect(() => {
    if (shownMap.current === run.map) return undefined;
    shownMap.current = run.map;
    setIris((count) => count + 1);
    const timer = window.setTimeout(() => setIris(0), IRIS_MS + 50);
    return () => window.clearTimeout(timer);
  }, [run.map]);

  // The talk box: a line, a choice or the inn question, kept for its exit animation
  const talkNow: Talk | null = card
    ? null
    : line
      ? { kind: 'line', line, page: scene ? linePage(scene.steps, scene.at) : undefined }
      : choice
        ? { kind: 'choice', prompt: choice.prompt, options: choice.options }
        : inn !== null
          ? { kind: 'inn', price: inn, coins: run.coins }
          : null;
  const talk = usePresence(talkNow, TALK_OUT_MS);

  // A scene, a card or a screen change stops the party where it stands
  const frozen = Boolean(line || card || choice || inn !== null);
  useEffect(() => {
    if (frozen) {
      motion.current.path = [];
      motion.current.pending = null;
      setTarget(null);
    }
  }, [frozen]);

  // The reducer can teleport the party (an exit, a defeat); snap the animation to wherever it says.
  // A new map always snaps, even when the arrival tile happens to sit near the old position. The
  // escort restarts beside the party; run.flags is read only at that moment, so it is not a dep.
  useEffect(() => {
    const state = motion.current;
    if (state.map !== run.map || Math.abs(state.x - run.pos.c) > 1.2 || Math.abs(state.y - run.pos.r) > 1.2) {
      state.map = run.map;
      state.x = run.pos.c;
      state.y = run.pos.r;
      state.path = [];
      state.history = [];
      state.escort = [restingSpot(MAPS[run.map], run.flags, run.pos)];
      state.pending = null;
      state.camera = { c: run.pos.c, r: run.pos.r };
      setTarget(null);
      setWalk({ lead: { c: run.pos.c, r: run.pos.r, flip: state.flip, moving: false }, trail: [], escort: escortOf(state, run.party.length, false), camera: state.camera });
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
          s.escort.push({ c: s.x, r: s.y });
          while (s.escort.length > escortLag(run.party.length) + 1) s.escort.shift();
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

      if (moved || settling) {
        setWalk({ lead: { c: s.x, r: s.y, flip: s.flip, moving: moved }, trail: trailOf(s, run.party.length, moved), escort: escortOf(s, run.party.length, moved), camera: { ...camera } });
      }
      raf = requestAnimationFrame(tick);
    };

    // A hero joining changes the trail while nothing is moving, so publish once up front
    const s = motion.current;
    setWalk({ lead: { c: s.x, r: s.y, flip: s.flip, moving: false }, trail: trailOf(s, run.party.length, false), escort: escortOf(s, run.party.length, false), camera: { ...s.camera } });
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
    size: ACTOR_SIZE.hero,
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
      size: ACTOR_SIZE.follower,
      flip: spot.flip,
      motion: spot.moving ? 'walk' : 'idle',
    });
  });

  // An escort (the pigeon chick, 小籠包, the calf) toddles along one tile behind the last hero
  if (follower) {
    actors.push({
      key: 'escort',
      sprite: follower.sprite,
      c: walk.escort.c,
      r: walk.escort.r,
      size: ACTOR_SIZE.escort,
      flip: walk.escort.flip,
      motion: walk.escort.moving ? 'walk' : 'idle',
    });
  }

  // The doors of this map, marked so the way on is never a hunt
  const doors = map.exits.filter((exit) => meets(run.flags, exit) || !exit.blocked);

  return (
    <main className="kit-fade-in relative mx-auto h-dvh w-full max-w-md overflow-hidden">
      {/* The map fills the screen; behind it, the sky of this map's hour with parallax (§ 2.7, § 8.4) */}
      <div ref={frame} className="absolute inset-0">
        <SkyLayer
          time={clock}
          interior={map.interior}
          width={box.w}
          height={box.h}
          shift={cameraShift(map, walk.camera, box)}
          still={reducedMotion}
        />
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

        {/* A vignette: the edges fall into the night, with soft foreground bokeh in the lower corners (§ 2.7 Depth) */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: VIGNETTE }} />
      </div>

      {/* HUD: home, where and when, the menu (§ 7.2 glass chips) */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start gap-2.5 px-3 pt-[max(env(safe-area-inset-top),12px)]">
        <IconButton icon={<Home size={22} />} label="回到標題" onClick={onExit} className="pointer-events-auto" />
        <div className="kit-glass min-w-0 flex-1 rounded px-3.5 pb-1.5 pt-1" data-hud="">
          <p className="truncate text-caption tracking-[0.08em] text-mutedOnDark">
            第 {map.chapter} 章 · {CHAPTER_TITLES[map.chapter - 1]}
          </p>
          <h1 className="flex items-baseline gap-2 font-serif text-[19px] font-black leading-tight tracking-[0.1em]">
            <span className="truncate">{map.title}</span>
            <Num className="shrink-0 text-[13px]">{clock}</Num>
          </h1>
        </div>
        <IconButton icon={<Pouch size={22} />} label="隊伍和百寶袋" onClick={onMenu} className="pointer-events-auto" />
      </header>

      {!frozen && doors.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-[calc(max(env(safe-area-inset-top),12px)+64px)] z-10 flex flex-wrap gap-1.5 px-3">
          {doors.map((exit) => (
            <GlassChip key={`${exit.to}${exit.c}${exit.r}`} className="text-[14px]">
              <span aria-hidden="true" className="text-gold">›</span>往 {exit.to === RIDE_TO ? (run.rideTo ? (stationAt(run.rideTo)?.name ?? MAPS[run.rideTo].title) : UI.travelTitle) : MAPS[exit.to].title}
            </GlassChip>
          ))}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-10 px-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        <PartyPanel run={run} />
      </div>

      {iris > 0 && (
        <div key={iris} aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          <span className="kit-iris" style={{ ['--x' as string]: '50%', ['--y' as string]: '50%' }} />
        </div>
      )}

      {talk.value && <TalkBox talk={talk.value} leaving={talk.leaving} onAdvance={onAdvance} onChoose={onChoose} onInn={onInn} />}
      {card && <ChapterCard key={`${card.n}${card.label ?? ''}${card.title}`} kicker={card.label ?? `第 ${card.n} 章`} title={card.title} time={card.time} next={card.next} onDismiss={onAdvance} />}
    </main>
  );
};
