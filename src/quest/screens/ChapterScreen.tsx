import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import { WorldBackdrop } from '../../art/backdrops';
import { SPRITES } from '../../art/sprites';
import { AppBar, Chip, Screen, SoundToggle } from '../../components/Screen';
import { ArrowLeft, ArrowRight } from '../../components/icons';
import { PartyPanel } from '../components/PartyPanel';
import { FOES } from '../engine/foes';
import { ITEMS } from '../engine/heroes';
import { WORLD_WIDTH, type Chapter, type Node, type Run } from '../engine/types';
import { WORLD_START_X } from '../engine/validate';

/** Feet line for everything that walks, as a fraction of the scene height */
const GROUND = 0.82;
/** Walking speed in screen-widths per second */
const SPEED = 0.85;
/** How close Baokaka must get to a stop for it to start */
const REACH = 0.14;
const PICK_REACH = 0.07;
/** The "!" moment between touching a stop and the battle or camp opening (ms) */
const ENCOUNTER_MS = 750;
/** Mocha Cat trails this far behind */
const CAT_GAP = 0.15;
const BAO_R = 0.13;
const CAT_R = 0.1;

/** Lines the small fry shout when the party gets close */
const GREETINGS = ['嘿嘿嘿，不准過！', '來打一場啊！', '這條路是我們的！'];

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;

type Walk = { x: number; cat: number; camera: number; facing: 1 | -1; moving: boolean };

type Props = {
  chapter: Chapter;
  run: Run;
  soundOn: boolean;
  onBegin: () => void;
  onPickup: (id: string) => void;
  onToggleSound: () => void;
  onBackToTitle: () => void;
};

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

/**
 * Positions a world entity inside a layer that is WORLD_WIDTH screens wide. Objects further
 * back (depth < 1) scroll slower; their layer x is pulled towards the screen centre so that an
 * author can still give the world x they line up with when the camera is centred on them.
 */
function worldStyle(x: number, foot: number, r: number, depth = 1): CSSProperties {
  const layerX = 0.5 + (x - 0.5) * depth;
  return {
    left: `${(layerX / WORLD_WIDTH) * 100}%`,
    bottom: `${(1 - foot) * 100}%`,
    width: `${((2 * r) / WORLD_WIDTH) * 100}%`,
  };
}

const nodeLabel = (node: Node): string => (node.kind === 'camp' ? '營地' : node.kind === 'boss' ? '頭目' : '搗蛋鬼');

/** Where Baokaka appears when the map opens: at the start, or just past the last thing he cleared. */
const spawnX = (chapter: Chapter, run: Run): number =>
  run.node === 0 ? WORLD_START_X : chapter.world.stops[run.node - 1] + 0.14;

export const ChapterScreen = ({ chapter, run, soundOn, onBegin, onPickup, onToggleSound, onBackToTitle }: Props) => {
  const { stops, pickups, decor } = chapter.world;
  const current = chapter.nodes[run.node];
  const stopX = stops[run.node];
  const start = spawnX(chapter, run);

  const [walk, setWalk] = useState<Walk>({ x: start, cat: start - CAT_GAP, camera: clamp(start - 0.5, 0, WORLD_WIDTH - 1), facing: 1, moving: false });
  const [encounter, setEncounter] = useState(false);
  const [toast, setToast] = useState<{ x: number; text: string; key: number } | null>(null);

  // Everything the animation loop reads lives in refs, so a re-render never restarts it
  const state = useRef<Walk & { target: number | null; dir: number; frozen: boolean; taken: string[] }>({
    ...walk,
    target: null,
    dir: 0,
    frozen: false,
    taken: [],
  });
  const callbacks = useRef({ onBegin, onPickup, picked: run.picked, stopX, pickups });
  callbacks.current = { onBegin, onPickup, picked: run.picked, stopX, pickups };

  useEffect(() => {
    let frame = 0;
    let encounterTimer = 0;
    let last = performance.now();

    const step = (now: number) => {
      const s = state.current;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      let dir = s.dir;
      if (dir === 0 && s.target !== null) {
        const gap = s.target - s.x;
        if (Math.abs(gap) < 0.01) s.target = null;
        else dir = Math.sign(gap);
      }
      const moving = dir !== 0 && !s.frozen;
      if (moving) {
        s.x = clamp(s.x + dir * SPEED * dt, 0.05, WORLD_WIDTH - 0.05);
        s.facing = dir > 0 ? 1 : -1;
      }
      s.cat += (s.x - s.facing * CAT_GAP - s.cat) * Math.min(1, dt * 5);
      const cameraTarget = clamp(s.x - 0.5, 0, WORLD_WIDTH - 1);
      s.camera += (cameraTarget - s.camera) * Math.min(1, dt * 9);

      const { onBegin: begin, onPickup: pick, picked, stopX: stop, pickups: ground } = callbacks.current;
      if (!s.frozen && Math.abs(s.x - stop) < REACH) {
        s.frozen = true;
        s.target = null;
        setEncounter(true);
        encounterTimer = window.setTimeout(begin, ENCOUNTER_MS);
      }
      for (const pickup of ground) {
        if (!picked.includes(pickup.id) && !s.taken.includes(pickup.id) && Math.abs(s.x - pickup.x) < PICK_REACH) {
          s.taken.push(pickup.id);
          pick(pickup.id);
          setToast({ x: pickup.x, text: `+ ${ITEMS[pickup.item].name}`, key: now });
        }
      }

      const settling =
        Math.abs(s.cat - (s.x - s.facing * CAT_GAP)) > 0.002 || Math.abs(cameraTarget - s.camera) > 0.001;
      if (moving || moving !== s.moving || settling) {
        s.moving = moving;
        setWalk({ x: s.x, cat: s.cat, camera: s.camera, facing: s.facing, moving });
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);

    const keys = (down: boolean) => (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'a') state.current.dir = down ? -1 : state.current.dir === -1 ? 0 : state.current.dir;
      if (event.key === 'ArrowRight' || event.key === 'd') state.current.dir = down ? 1 : state.current.dir === 1 ? 0 : state.current.dir;
    };
    const onKeyDown = keys(true);
    const onKeyUp = keys(false);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(encounterTimer);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const hold = (dir: number) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    state.current.dir = dir;
    state.current.target = null;
  };
  const release = () => {
    state.current.dir = 0;
  };

  const walkTo = (event: MouseEvent<HTMLDivElement>) => {
    if (state.current.frozen) return;
    const box = event.currentTarget.getBoundingClientRect();
    state.current.target = state.current.camera + (event.clientX - box.left) / box.width;
  };

  const near = Math.abs(walk.x - stopX) < 0.55;
  const hint = encounter
    ? '碰上了！'
    : near
      ? current.kind === 'camp'
        ? '前面有營地，走過去休息一下。'
        : current.kind === 'boss'
          ? '頭目就在前面……小心！'
          : '前面有搗蛋鬼擋路！'
      : `往右走，去找${nodeLabel(current)}。`;

  const layers = [...new Set(decor.map((entry) => entry.depth ?? 1))].sort((a, b) => a - b);

  return (
    <Screen className="gap-3">
      <AppBar
        kicker={`第 ${chapter.id} 章`}
        title={chapter.title}
        onBack={onBackToTitle}
        backLabel="回標題"
        right={<SoundToggle on={soundOn} onToggle={onToggleSound} />}
      />

      <div
        className="relative h-[min(calc(100vw-2rem),40dvh)] overflow-hidden rounded-3xl shadow-card"
        onClick={walkTo}
      >
        <WorldBackdrop palette={chapter.palette} />

        {layers.map((depth) => (
          <div
            key={depth}
            className="pointer-events-none absolute inset-y-0 left-0"
            style={{ width: `${WORLD_WIDTH * 100}%`, transform: `translateX(${(-walk.camera * depth) / WORLD_WIDTH * 100}%)` }}
          >
            {decor
              .filter((entry) => (entry.depth ?? 1) === depth)
              .map((entry, index) => {
                const Art = SPRITES[entry.sprite];
                return (
                  <span key={`${entry.sprite}-${index}`} className="absolute block -translate-x-1/2" style={worldStyle(entry.x, entry.foot, entry.r, depth)}>
                    <span className={`block aspect-square w-full ${entry.flip ? '-scale-x-100' : ''}`}>
                      <Art />
                    </span>
                  </span>
                );
              })}
          </div>
        ))}

        <div
          className="pointer-events-none absolute inset-y-0 left-0"
          style={{ width: `${WORLD_WIDTH * 100}%`, transform: `translateX(${(-walk.camera / WORLD_WIDTH) * 100}%)` }}
        >
          {pickups
            .filter((pickup) => !run.picked.includes(pickup.id))
            .map((pickup) => {
              const Art = SPRITES[ITEMS[pickup.item].sprite];
              return (
                <span key={pickup.id} className="absolute block -translate-x-1/2" style={worldStyle(pickup.x, 0.86, 0.055)}>
                  <span className="idle block aspect-square w-full rounded-full bg-white/60 p-0.5">
                    <Art />
                  </span>
                </span>
              );
            })}

          {chapter.nodes.map((node, index) => {
            const x = stops[index];
            const cleared = index < run.node;
            const isCurrent = index === run.node;
            if (node.kind === 'camp') {
              const Pillow = SPRITES.pillow;
              return (
                <span key={index} className="absolute block -translate-x-1/2" style={worldStyle(x, GROUND + 0.02, 0.11)}>
                  <span className={`block aspect-square w-full ${cleared ? 'opacity-50' : ''}`}>
                    <Pillow />
                  </span>
                  <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-surface/90 px-2 text-caption font-bold leading-5 shadow-card">
                    {cleared ? '休息過了' : '營地'}
                  </span>
                  {isCurrent && near && !encounter && <Bubble>躺一下吧～</Bubble>}
                </span>
              );
            }
            if (cleared) {
              const Star = SPRITES.star;
              return (
                <span key={index} className="absolute block -translate-x-1/2 opacity-70" style={worldStyle(x, 0.88, 0.04)}>
                  <span className="block aspect-square w-full">
                    <Star />
                  </span>
                </span>
              );
            }
            const spread = node.foes.length === 1 ? [0] : node.foes.length === 2 ? [-0.08, 0.08] : [-0.14, 0, 0.14];
            return node.foes.map((foeId, slot) => {
              const foe = FOES[foeId];
              const Art = SPRITES[foe.sprite];
              const r = foe.boss ? 0.17 : 0.11;
              const speaks = isCurrent && near && !encounter && slot === 0;
              return (
                <span key={`${index}-${slot}`} className="absolute block -translate-x-1/2" style={worldStyle(x + spread[slot], GROUND, r)}>
                  <span className="idle block aspect-square w-full" style={{ animationDelay: `${(index * 3 + slot) * 400}ms` }}>
                    <Art />
                  </span>
                  {slot === 0 && (
                    <span className={`absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-full px-2 text-caption font-bold leading-5 shadow-card ${node.kind === 'boss' ? 'bg-berry text-white' : 'bg-surface/90'}`}>
                      {node.kind === 'boss' ? '頭目' : `搗蛋鬼 ×${node.foes.length}`}
                    </span>
                  )}
                  {speaks && <Bubble>{node.kind === 'boss' ? foe.taunt : GREETINGS[index % GREETINGS.length]}</Bubble>}
                </span>
              );
            });
          })}

          <span className="absolute block -translate-x-1/2" style={worldStyle(walk.cat, GROUND, CAT_R)}>
            <span className={`block aspect-square w-full ${walk.facing === -1 ? '-scale-x-100' : ''} ${walk.moving ? 'walk' : ''}`}>
              <MochaCat />
            </span>
          </span>

          <span className="absolute block -translate-x-1/2" style={worldStyle(walk.x, GROUND, BAO_R)}>
            <span className={`block aspect-square w-full ${walk.moving ? 'walk' : ''}`}>
              <Baokaka />
            </span>
            {encounter && (
              <span className="pop absolute bottom-full left-1/2 mb-1 -translate-x-1/2 rounded-full bg-sun px-2.5 text-headline font-extrabold leading-9 shadow-card">
                !
              </span>
            )}
          </span>

          {toast && (
            <span
              key={toast.key}
              onAnimationEnd={() => setToast(null)}
              className="float-up absolute whitespace-nowrap rounded-full bg-leaf px-2.5 text-label font-bold leading-7 text-white shadow-card"
              style={{ left: `${(toast.x / WORLD_WIDTH) * 100}%`, bottom: `${(1 - GROUND) * 100 + 18}%` }}
            >
              {toast.text}
            </span>
          )}
        </div>

        <span className="absolute right-3 top-3">
          <Chip tone="ink">
            第 {run.node + 1} / {chapter.nodes.length} 站
          </Chip>
        </span>
      </div>

      <p className="text-center text-label font-bold text-muted">{hint}</p>

      <div className="flex gap-3">
        <button
          type="button"
          aria-label="往左走"
          onPointerDown={hold(-1)}
          onPointerUp={release}
          onPointerCancel={release}
          onContextMenu={(event) => event.preventDefault()}
          className="flex h-16 flex-1 touch-none select-none items-center justify-center gap-2 rounded-full bg-surface text-heading font-extrabold shadow-card transition-transform duration-150 active:scale-[0.96] active:bg-sun/40"
        >
          <ArrowLeft />
          往左
        </button>
        <button
          type="button"
          aria-label="往右走"
          onPointerDown={hold(1)}
          onPointerUp={release}
          onPointerCancel={release}
          onContextMenu={(event) => event.preventDefault()}
          className="flex h-16 flex-1 touch-none select-none items-center justify-center gap-2 rounded-full bg-gradient-to-b from-sun to-sunDeep text-heading font-extrabold shadow-glow transition-transform duration-150 active:scale-[0.96]"
        >
          往右
          <ArrowRight />
        </button>
      </div>

      <PartyPanel run={run} compact />
    </Screen>
  );
};

/**
 * A speech bubble above whoever is talking; it hangs off the entity wrapper so it scrolls with
 * it, and grows to the LEFT because the party always approaches from the left.
 */
const Bubble = ({ children }: { children: string | undefined }) => (
  <span className="pop absolute bottom-full right-0 mb-8 w-max max-w-[200px] rounded-2xl bg-surface px-3 py-1.5 text-left text-label font-bold leading-snug shadow-float">
    {children}
  </span>
);
