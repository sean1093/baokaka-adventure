import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { UI as TOKENS, WORLD } from '../../art/palette';
import { SPRITES } from '../../art/sprites';
import { ChevronLeft } from '../../components/icons';
import { Dialogue } from '../components/Dialogue';
import { MRT_LINES, STATIONS, rideable, stationAt, stationUnlocked, type MapPos, type Station } from '../engine/mrt';
import { UI } from '../engine/strings';
import type { Line, Run } from '../engine/types';

/**
 * The 路線圖 (月亮線 travel screen, story bible § 3.1, art direction § 7.7): a stylised five-line
 * network on a navy panel. Lit dots are gold, the station you are at blinks, locked ones are grey
 * with 「?」, and a station lit since the last visit rings out with 「叮！」. Tap a lit dot to get
 * a confirm sheet; the reducer does the riding. Placeholder-quality until the UI kit (#12) and
 * polish (#56); the network itself is content in `mrt.ts`.
 */

/**
 * The drawing is 1000 units wide and as tall as the panel's shape allows (`aspect` = height /
 * width, measured), so the network fills the screen on a tall phone and on a short one alike.
 * Text and dots are sized in these units, so they scale with the width only.
 */
const W = 1000;
const PAD = 70;
const ASPECT = { min: 1.2, max: 2.1, initial: 1.7 } as const;
const project = (pos: MapPos, h: number) => ({ x: PAD + pos.x * (W - 2 * PAD), y: PAD + pos.y * (h - 2 * PAD) });
const points = (path: readonly MapPos[], h: number) =>
  path
    .map((pos) => {
      const { x, y } = project(pos, h);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

/** UI tokens (art direction § 3.1): the navy panel and gold. #12 moves the screen onto the UI kit. */
const NAVY = TOKENS.panelTop;
const NAVY_DEEP = TOKENS.panelBottom;
const GOLD = TOKENS.gold;
const GOLD_LIGHT = TOKENS.goldLight;
const GOLD_DEEP = TOKENS.goldDeep;
const INK_ON_DARK = TOKENS.inkOnDark;
const MUTED_ON_DARK = TOKENS.mutedOnDark;
const LOCKED = TOKENS.locked;
const WATER = WORLD.water;

/** Rivers under the lines (淡水河, 基隆河, 新店溪), so the network reads as a city at a glance. */
const RIVERS: readonly MapPos[][] = [
  [
    { x: 0.04, y: 0 },
    { x: 0.08, y: 0.18 },
    { x: 0.12, y: 0.36 },
    { x: 0.06, y: 0.52 },
    { x: 0.1, y: 0.7 },
    { x: 0.22, y: 0.8 },
    { x: 0.2, y: 0.9 },
    { x: 0.22, y: 1 },
  ],
  [
    { x: 0.12, y: 0.36 },
    { x: 0.3, y: 0.27 },
    { x: 0.5, y: 0.24 },
    { x: 0.66, y: 0.22 },
    { x: 0.82, y: 0.3 },
    { x: 1, y: 0.28 },
  ],
];

/** A fixed scatter of stars (a seeded layout, so screenshots never change). */
const STARS = Array.from({ length: 34 }, (_, index) => ({
  x: ((index * 7919) % 997) / 997,
  y: ((index * 104729) % 991) / 991,
  r: index % 5 === 0 ? 3.2 : 1.8,
}));

type Side = NonNullable<Station['label']>;
const sideOf = (station: Station): Side => station.label ?? (station.pos.x < 0.6 ? 'right' : 'left');

/** Where the two label lines sit relative to the dot, and how they are anchored. */
function labelLayout(side: Side): { dx: number; name: number; en: number; anchor: 'start' | 'middle' | 'end' } {
  switch (side) {
    case 'right':
      return { dx: 34, name: 4, en: 40, anchor: 'start' };
    case 'left':
      return { dx: -34, name: 4, en: 40, anchor: 'end' };
    case 'above':
      return { dx: 0, name: -70, en: -36, anchor: 'middle' };
    case 'below':
      return { dx: 0, name: 76, en: 110, anchor: 'middle' };
  }
}

type DotState = 'locked' | 'lit' | 'here';

type DotProps = { station: Station; state: DotState; fresh: boolean; h: number; onTap: () => void };

const StationDot = ({ station, state, fresh, h, onTap }: DotProps) => {
  const { x, y } = project(station.pos, h);
  const side = sideOf(station);
  const label = labelLayout(side);
  // Extras (the 「叮！」 tag, Baokaka's head) go on the side away from the label
  const away = side === 'left' ? 1 : -1;
  const lineColor = MRT_LINES[station.line].color;
  const name = state === 'locked' ? `${station.name}（還沒亮）` : state === 'here' ? `${station.name}（${UI.hereTag}）` : station.name;
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onTap();
    }
  };
  const Head = SPRITES.baokaka;

  return (
    <g role="button" tabIndex={0} aria-label={name} onClick={onTap} onKeyDown={onKey} className="cursor-pointer outline-none" data-station={station.key} data-state={state}>
      {/* The hit area: ≥ 44px at phone width, bigger than the dot */}
      <circle cx={x} cy={y} r={66} fill="transparent" />

      {state === 'locked' ? (
        <>
          <circle cx={x} cy={y} r={20} fill={LOCKED} stroke={NAVY_DEEP} strokeWidth={6} />
          <text x={x} y={y + 11} textAnchor="middle" fontSize={30} fontWeight={900} fill={MUTED_ON_DARK}>
            ?
          </text>
        </>
      ) : (
        <>
          <circle cx={x} cy={y} r={44} fill="url(#mrt-glow)" />
          {fresh && <circle className="mrt-ding" cx={x} cy={y} r={40} fill="none" stroke={GOLD_LIGHT} strokeWidth={6} />}
          <circle cx={x} cy={y} r={21} fill={GOLD_LIGHT} stroke={GOLD_DEEP} strokeWidth={6} />
          <circle cx={x} cy={y} r={9} fill={lineColor} />
        </>
      )}

      {state === 'here' && (
        <>
          <g className="mrt-here">
            <circle cx={x} cy={y} r={34} fill="none" stroke={GOLD_LIGHT} strokeWidth={5} />
            <circle cx={x} cy={y} r={46} fill="none" stroke={GOLD} strokeWidth={3} />
          </g>
          <foreignObject x={side === 'above' ? x + 40 : x + away * 58 - 33} y={y - 100} width={66} height={90} aria-hidden="true">
            <div style={{ width: '100%', height: '100%' }}>
              <Head />
            </div>
          </foreignObject>
        </>
      )}

      {fresh && state !== 'locked' && (
        <g className="mrt-ding-text" aria-hidden="true">
          <rect x={x + away * 64 - 46} y={y - 78} width={92} height={44} rx={22} fill={GOLD_LIGHT} />
          <text x={x + away * 64} y={y - 46} textAnchor="middle" fontSize={30} fontWeight={900} fill={NAVY}>
            叮！
          </text>
        </g>
      )}

      <g aria-hidden="true" textAnchor={label.anchor}>
        <text
          x={x + label.dx}
          y={y + label.name}
          fontSize={42}
          fontWeight={900}
          fill={state === 'locked' ? MUTED_ON_DARK : INK_ON_DARK}
          opacity={state === 'locked' ? 0.55 : 1}
          stroke={NAVY_DEEP}
          strokeWidth={10}
          paintOrder="stroke"
          style={{ fontFamily: "'Noto Serif TC', 'Noto Sans TC', serif" }}
        >
          {station.name}
        </text>
        <text
          x={x + label.dx}
          y={y + label.en}
          fontSize={29}
          fontWeight={600}
          fill={MUTED_ON_DARK}
          opacity={state === 'locked' ? 0.5 : 0.9}
          stroke={NAVY_DEEP}
          strokeWidth={8}
          paintOrder="stroke"
          style={{ fontFamily: "Fredoka, ui-rounded, system-ui, sans-serif" }}
        >
          {station.nameEn}
        </text>
      </g>
    </g>
  );
};

/** The 直接到站 switch: a labelled pill with a knob, 44px tall. */
const SkipSwitch = ({ on, onToggle }: { on: boolean; onToggle: (on: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    onClick={() => onToggle(!on)}
    className="flex h-11 shrink-0 items-center gap-2 rounded-full border px-3 text-label font-bold transition-colors"
    style={{ borderColor: on ? GOLD : 'rgba(232,199,122,0.4)', background: on ? 'rgba(232,199,122,0.18)' : 'rgba(255,255,255,0.04)', color: on ? GOLD_LIGHT : MUTED_ON_DARK }}
  >
    {UI.skipRides}
    <span aria-hidden="true" className="relative inline-block h-5 w-9 rounded-full transition-colors" style={{ background: on ? GOLD : LOCKED }}>
      <span
        className="absolute top-0.5 h-4 w-4 rounded-full transition-[left]"
        style={{ left: on ? 18 : 2, background: on ? NAVY : INK_ON_DARK }}
      />
    </span>
  </button>
);

/** 「搭乘月亮線前往〈站名〉？」 with the station's line, and 搭乘 / 先不要. */
const ConfirmSheet = ({ station, onYes, onNo }: { station: Station; onYes: () => void; onNo: () => void }) => {
  const line = MRT_LINES[station.line];
  const open = rideable(station);
  return (
    <div className="sheet-in absolute inset-x-0 bottom-0 z-20 px-3 pb-3">
      <div
        role="dialog"
        aria-label={UI.rideAsk(station.name)}
        className="rounded-2xl border p-4 shadow-float"
        style={{ borderColor: GOLD, background: `linear-gradient(180deg, rgba(22,26,78,0.97), rgba(10,11,34,0.99))` }}
      >
        <p className="flex items-center gap-2 text-caption font-bold" style={{ color: MUTED_ON_DARK }}>
          <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full" style={{ background: line.color }} />
          {line.name} · {station.nameEn}
        </p>
        <p className="mt-1 text-heading font-extrabold leading-snug" style={{ color: INK_ON_DARK }}>
          {UI.rideAsk(station.name)}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={!open}
            onClick={onYes}
            className="h-12 flex-1 rounded-full text-copy font-extrabold shadow-glow transition-transform active:translate-y-0.5 disabled:opacity-40"
            style={{ background: `linear-gradient(180deg, ${TOKENS.primaryTop}, ${TOKENS.primaryMid} 55%, ${TOKENS.primaryBottom})`, color: TOKENS.primaryText }}
          >
            {UI.rideYes}
          </button>
          <button
            type="button"
            onClick={onNo}
            className="h-12 flex-1 rounded-full border text-copy font-bold"
            style={{ borderColor: 'rgba(232,199,122,0.45)', color: GOLD_LIGHT }}
          >
            {UI.rideNo}
          </button>
        </div>
      </div>
    </div>
  );
};

type Props = {
  run: Run;
  /** Stations lit for the first time this opening: they play 「叮！」 */
  fresh: readonly string[];
  /** A narration line over the map (mrt.newStation, mrt.locked) */
  note: Line | null;
  skipRides: boolean;
  onRide: (station: string) => void;
  onClose: () => void;
  onAdvance: () => void;
  onSkipRides: (on: boolean) => void;
  /** The station to mark 「你在這裡」; defaults to the current map's (the art lab overrides it until station maps exist) */
  here?: string;
};

export const TravelScreen = ({ run, fresh, note, skipRides, onRide, onClose, onAdvance, onSkipRides, here: hereKey }: Props) => {
  const [picked, setPicked] = useState<Station | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState<number>(ASPECT.initial);
  const h = Math.round(W * aspect);

  useLayoutEffect(() => {
    const node = panel.current;
    if (!node) return;
    const measure = () => {
      const { width, height } = node.getBoundingClientRect();
      if (width > 0 && height > 0) setAspect(Math.min(ASPECT.max, Math.max(ASPECT.min, height / width)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const here = hereKey === undefined ? stationAt(run.map) : STATIONS.find((station) => station.key === hereKey);

  // TODO(#55): playSfx('gate') here, the 「嗶」 of the gate opening onto the 路線圖
  useEffect(() => setPicked(null), [note]);

  const stateOf = (station: Station): DotState => (station.key === here?.key ? 'here' : stationUnlocked(run, station) ? 'lit' : 'locked');
  const tap = (station: Station) => {
    if (note) return;
    const state = stateOf(station);
    if (state === 'here') return;
    // The reducer answers a locked tap with mrt.locked; a lit one asks first
    if (state === 'locked') onRide(station.key);
    else setPicked(station);
  };

  // Draw the locked dots first and the lit ones on top, so a gold dot is never under a grey label
  const order = [...STATIONS].sort((a, b) => Number(stateOf(a) !== 'locked') - Number(stateOf(b) !== 'locked'));

  return (
    <div className="min-h-dvh w-full" style={{ background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)` }}>
      <main className="screen-in mx-auto flex h-dvh w-full max-w-md flex-col gap-3 px-4 pb-[max(env(safe-area-inset-bottom),14px)] pt-[max(env(safe-area-inset-top),12px)]">
        <header className="flex items-center gap-3">
          <button
            type="button"
            aria-label={UI.travelLeave}
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border"
            style={{ borderColor: 'rgba(232,199,122,0.5)', color: GOLD_LIGHT }}
          >
            <ChevronLeft />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-caption font-bold tracking-[0.3em]" style={{ color: GOLD }}>
              {UI.travelKicker}
            </p>
            <h1 className="truncate text-heading font-extrabold leading-tight" style={{ color: INK_ON_DARK }}>
              {UI.travelTitle}
            </h1>
          </div>
          <SkipSwitch on={skipRides} onToggle={onSkipRides} />
        </header>

        <div
          ref={panel}
          className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border"
          style={{ borderColor: 'rgba(232,199,122,0.55)', background: 'radial-gradient(120% 80% at 50% 40%, rgba(46,52,120,0.55), rgba(10,11,34,0.2))' }}
        >
          <svg viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" role="group" aria-label={UI.travelTitle}>
            <defs>
              <radialGradient id="mrt-glow">
                <stop offset="0%" stopColor={GOLD_LIGHT} stopOpacity={0.55} />
                <stop offset="100%" stopColor={GOLD_LIGHT} stopOpacity={0} />
              </radialGradient>
            </defs>

            <g aria-hidden="true">
              {STARS.map((star, index) => (
                <circle key={index} cx={star.x * W} cy={star.y * h} r={star.r} fill={INK_ON_DARK} opacity={0.35} />
              ))}
              {RIVERS.map((river, index) => (
                <polyline key={index} points={points(river, h)} fill="none" stroke={WATER} strokeOpacity={0.45} strokeWidth={40} strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </g>

            <g aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round">
              {Object.entries(MRT_LINES).map(([id, line]) =>
                line.paths.map((path, index) => <polyline key={`${id}-case-${index}`} points={points(path, h)} stroke={NAVY_DEEP} strokeWidth={28} />),
              )}
              {Object.entries(MRT_LINES).map(([id, line]) =>
                line.paths.map((path, index) => <polyline key={`${id}-${index}`} points={points(path, h)} stroke={line.color} strokeWidth={16} />),
              )}
            </g>

            {order.map((station) => (
              <StationDot key={station.key} station={station} state={stateOf(station)} fresh={fresh.includes(station.key)} h={h} onTap={() => tap(station)} />
            ))}
          </svg>

          {here && (
            <p
              className="pointer-events-none absolute left-2 top-2 flex items-center gap-1.5 rounded-full border px-3 py-1 text-caption font-bold"
              style={{ borderColor: 'rgba(232,199,122,0.5)', background: 'rgba(10,11,34,0.7)', color: MUTED_ON_DARK }}
            >
              <span aria-hidden="true" className="mrt-here inline-block h-2 w-2 rounded-full" style={{ background: GOLD_LIGHT }} />
              {UI.hereTag}
              <span style={{ color: INK_ON_DARK }}>{here.name}</span>
            </p>
          )}
        </div>

        {/* The five lines, so a grandparent can match a colour to a name */}
        <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1" aria-label="路線">
          {Object.entries(MRT_LINES).map(([id, line]) => (
            <li key={id} className="flex items-center gap-1.5 text-caption font-bold" style={{ color: MUTED_ON_DARK }}>
              <span aria-hidden="true" className="inline-block h-1.5 w-4 rounded-full" style={{ background: line.color }} />
              {line.name}
            </li>
          ))}
        </ul>
      </main>

      {picked && !note && (
        <div className="fixed inset-0 z-20 mx-auto max-w-md">
          <button type="button" aria-label={UI.rideNo} className="absolute inset-0 bg-black/30" onClick={() => setPicked(null)} />
          <ConfirmSheet
            station={picked}
            onYes={() => {
              // TODO(#55): playSfx('chime'), the door chime as the ride starts
              setPicked(null);
              onRide(picked.key);
            }}
            onNo={() => setPicked(null)}
          />
        </div>
      )}

      {note && (
        <div className="fixed inset-0 z-20 mx-auto max-w-md">
          <Dialogue line={note} onAdvance={onAdvance} />
        </div>
      )}
    </div>
  );
};
