import type { CSSProperties, ReactNode } from 'react';
import { C } from '../../art/palette';
import type { Battle, FxKind, Who } from '../engine/types';

/**
 * Battle effects, drawn the way a 仙劍-era RPG draws them: a 法陣 opens under the caster, the
 * screen washes with the element's colour, and the strike itself lands on each target.
 *
 * Everything is SVG in the shared palette — no bitmaps, no filters. Positions arrive as
 * fractions of the arena box, so this layer never needs to know the battle layout. The caller
 * mounts it with `key={battle.step}` so every action restarts the animations cleanly.
 */

export type Spot = { x: number; y: number };

/** Longest an effect stays on screen (ms). Keep in step with the keyframes in index.css. */
export const FX_MS = 700;

/** How wide one combatant is, as a fraction of the arena. Effects are sized against this. */
const SPRITE_WIDTH = 0.3;

/** The colour an element washes the screen with, and the colour its 法陣 burns. */
const TINT: Record<FxKind, string> = {
  slash: C.cream,
  claw: C.berry,
  impact: C.sun,
  blocks: C.sun,
  shout: C.cream,
  jet: C.sky,
  splash: C.sky,
  wave: C.sky,
  bubble: C.sky,
  heal: C.leaf,
  sparkle: C.gold,
  thud: C.sand,
  bolt: C.sun,
  dust: C.grey,
};

/** Which effects wash the whole arena rather than only their targets. */
const FULL_SCREEN: ReadonlySet<FxKind> = new Set(['wave', 'shout', 'bolt']);

const line = (d: string, colour: string, width: number, key?: string, opacity?: number) => (
  <path key={key} d={d} stroke={colour} strokeWidth={width} strokeLinecap="round" fill="none" opacity={opacity} />
);

/** A four-point star: the sparkle shape used by heals, revives and items. */
const star = (cx: number, cy: number, r: number, colour: string, key: string) => (
  <path
    key={key}
    d={`M${cx},${cy - r} Q${cx + r * 0.2},${cy - r * 0.2} ${cx + r},${cy} Q${cx + r * 0.2},${cy + r * 0.2} ${cx},${cy + r} Q${cx - r * 0.2},${cy + r * 0.2} ${cx - r},${cy} Q${cx - r * 0.2},${cy - r * 0.2} ${cx},${cy - r} Z`}
    fill={colour}
  />
);

type Glyph = { node: ReactNode; className: string; scale: number };

/** One drawing plus the animation it plays. Every viewBox is 0 0 100 100. */
function glyphFor(kind: FxKind): Glyph {
  switch (kind) {
    // Two crossing sabre arcs with a bright core: the plain attack
    case 'slash':
      return {
        className: 'fx-slash',
        scale: 1.9,
        node: (
          <>
            <defs>
              <linearGradient id="fx-slash-edge" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor={C.white} stopOpacity="0.1" />
                <stop offset="0.5" stopColor={C.white} />
                <stop offset="1" stopColor={C.white} stopOpacity="0.1" />
              </linearGradient>
            </defs>
            {line('M10,76 Q46,10 92,26', C.ink, 17, 'a', 0.45)}
            {line('M10,76 Q46,10 92,26', 'url(#fx-slash-edge)', 9, 'b')}
            {line('M18,22 Q54,64 90,78', C.ink, 11, 'c', 0.35)}
            {line('M18,22 Q54,64 90,78', C.cream, 4.5, 'd')}
          </>
        ),
      };

    // Three rakes torn diagonally across the target, each tapering to a point
    case 'claw':
      return {
        className: 'fx-slash',
        scale: 1.8,
        node: (
          <g transform="rotate(-34 50 50)">
            {[0, 1, 2].map((i) => {
              const y = 30 + i * 20;
              const d = `M6,${y + 10} Q40,${y - 8} 94,${y}`;
              return (
                <g key={i}>
                  {line(d, C.ink, 13, `i${i}`, 0.4)}
                  {line(d, C.berry, 7, `c${i}`)}
                  {line(d, C.white, 2.5, `w${i}`, 0.85)}
                </g>
              );
            })}
          </g>
        ),
      };

    // A spiked starburst with a white-hot centre: heavy single-target blows
    case 'impact':
      return {
        className: 'fx-burst',
        scale: 2.1,
        node: (
          <>
            <defs>
              <radialGradient id="fx-impact-core">
                <stop offset="0" stopColor={C.white} />
                <stop offset="0.55" stopColor={C.sun} />
                <stop offset="1" stopColor={C.sunDeep} />
              </radialGradient>
            </defs>
            <path
              d="M50,0 L61,31 L94,18 L73,46 L100,60 L67,65 L76,98 L50,76 L24,98 L33,65 L0,60 L27,46 L6,18 L39,31 Z"
              fill="url(#fx-impact-core)"
              stroke={C.ink}
              strokeWidth={4}
              strokeLinejoin="round"
              opacity={0.95}
            />
            <circle cx={50} cy={52} r={15} fill={C.white} opacity={0.9} />
          </>
        ),
      };

    // Toy blocks bursting apart, each a shaded cube
    case 'blocks':
      return {
        className: 'fx-burst',
        scale: 1.9,
        node: (
          <>
            {[
              { x: 4, y: 14, c: C.berry, d: C.berryDeep, r: -20 },
              { x: 56, y: 4, c: C.sky, d: C.skyDeep, r: 24 },
              { x: 66, y: 52, c: C.leaf, d: C.leafDeep, r: -10 },
              { x: 12, y: 58, c: C.sun, d: C.sunDeep, r: 32 },
            ].map((b, i) => (
              <g key={i} transform={`rotate(${b.r} ${b.x + 14} ${b.y + 14})`}>
                <rect x={b.x} y={b.y} width={28} height={28} rx={5} fill={b.c} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
                <path d={`M${b.x + 28},${b.y + 4} v20 a5,5 0 0 1 -5,5 h-19 z`} fill={b.d} opacity={0.85} />
                <rect x={b.x + 5} y={b.y + 5} width={11} height={7} rx={3} fill={C.white} opacity={0.4} />
              </g>
            ))}
          </>
        ),
      };

    // Concentric shock rings: a shout, a wail, a snore
    case 'shout':
      return {
        className: 'fx-ring',
        scale: 2.8,
        node: (
          <>
            <circle cx={50} cy={50} r={20} fill="none" stroke={C.white} strokeWidth={9} opacity={0.95} />
            <circle cx={50} cy={50} r={32} fill="none" stroke={C.sun} strokeWidth={6} opacity={0.85} />
            <circle cx={50} cy={50} r={43} fill="none" stroke={C.white} strokeWidth={4} opacity={0.5} />
            <circle cx={50} cy={50} r={49} fill="none" stroke={C.sun} strokeWidth={2} opacity={0.3} />
          </>
        ),
      };

    // A tapered water jet fired in from the left
    case 'jet':
      return {
        className: 'fx-jet',
        scale: 2.2,
        node: (
          <>
            <defs>
              <linearGradient id="fx-jet-body" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor={C.sky} stopOpacity="0.25" />
                <stop offset="0.6" stopColor={C.sky} />
                <stop offset="1" stopColor={C.skyDeep} />
              </linearGradient>
            </defs>
            <path d="M-4,50 Q32,30 76,42 Q96,50 76,58 Q32,70 -4,50 Z" fill="url(#fx-jet-body)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
            {line('M10,48 Q42,40 68,46', C.white, 5, 'h', 0.85)}
            <circle cx={88} cy={38} r={5} fill={C.sky} stroke={C.ink} strokeWidth={3} />
            <circle cx={92} cy={62} r={4} fill={C.sky} stroke={C.ink} strokeWidth={3} />
          </>
        ),
      };

    // Droplets thrown outward from a wet centre
    case 'splash':
      return {
        className: 'fx-burst',
        scale: 2.0,
        node: (
          <>
            <defs>
              <radialGradient id="fx-splash-core">
                <stop offset="0" stopColor={C.white} />
                <stop offset="1" stopColor={C.sky} />
              </radialGradient>
            </defs>
            {[
              [50, 12, 13],
              [84, 36, 10],
              [72, 76, 11],
              [28, 82, 9],
              [14, 42, 12],
            ].map(([cx, cy, r], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r={r} fill={C.sky} stroke={C.ink} strokeWidth={4} />
                <circle cx={cx - r * 0.3} cy={cy - r * 0.35} r={r * 0.3} fill={C.white} opacity={0.65} />
              </g>
            ))}
            <circle cx={50} cy={50} r={12} fill="url(#fx-splash-core)" />
          </>
        ),
      };

    // A crest that sweeps the whole arena
    case 'wave':
      return {
        className: 'fx-sweep',
        scale: 1,
        node: (
          <>
            <defs>
              <linearGradient id="fx-wave-body" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={C.sky} />
                <stop offset="1" stopColor={C.skyDeep} />
              </linearGradient>
            </defs>
            <path d="M-10,70 Q14,30 38,58 Q60,84 82,48 Q98,22 112,56 L112,112 L-10,112 Z" fill="url(#fx-wave-body)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
            {line('M-10,84 Q18,56 40,76 Q64,98 86,64', C.white, 5, 'f', 0.8)}
            {line('M-10,96 Q22,74 46,90', C.white, 3, 'g', 0.5)}
          </>
        ),
      };

    // A bubble shell closing over the party
    case 'bubble':
      return {
        className: 'fx-ring',
        scale: 2.8,
        node: (
          <>
            <defs>
              <radialGradient id="fx-bubble-skin">
                <stop offset="0.62" stopColor={C.sky} stopOpacity="0.05" />
                <stop offset="0.92" stopColor={C.sky} stopOpacity="0.45" />
                <stop offset="1" stopColor={C.white} stopOpacity="0.85" />
              </radialGradient>
            </defs>
            <circle cx={50} cy={50} r={44} fill="url(#fx-bubble-skin)" stroke={C.white} strokeWidth={3} />
            <ellipse cx={34} cy={30} rx={11} ry={7} fill={C.white} opacity={0.8} transform="rotate(-30 34 30)" />
            <circle cx={64} cy={24} r={4} fill={C.white} opacity={0.6} />
          </>
        ),
      };

    // A green bloom with crosses floating up
    case 'heal':
      return {
        className: 'fx-rise',
        scale: 2.1,
        node: (
          <>
            <defs>
              <radialGradient id="fx-heal-glow">
                <stop offset="0" stopColor={C.leaf} stopOpacity="0.45" />
                <stop offset="1" stopColor={C.leaf} stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx={50} cy={60} r={44} fill="url(#fx-heal-glow)" />
            {[
              [50, 24, 14],
              [20, 48, 10],
              [80, 42, 11],
              [36, 74, 8],
            ].map(([cx, cy, s], i) => (
              <g key={i}>
                <path d={`M${cx - s},${cy} h${s * 2} M${cx},${cy - s} v${s * 2}`} stroke={C.leafDeep} strokeWidth={s * 0.62} strokeLinecap="round" fill="none" />
                <path d={`M${cx - s * 0.7},${cy} h${s * 1.4} M${cx},${cy - s * 0.7} v${s * 1.4}`} stroke={C.white} strokeWidth={s * 0.24} strokeLinecap="round" fill="none" opacity={0.8} />
              </g>
            ))}
          </>
        ),
      };

    // Golden stars drifting up: items, revives, sleep dust
    case 'sparkle':
      return {
        className: 'fx-rise',
        scale: 2.0,
        node: (
          <>
            <defs>
              <radialGradient id="fx-sparkle-glow">
                <stop offset="0" stopColor={C.gold} stopOpacity="0.5" />
                <stop offset="1" stopColor={C.gold} stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx={50} cy={50} r={44} fill="url(#fx-sparkle-glow)" />
            {star(50, 28, 23, C.gold, 'a')}
            {star(50, 28, 11, C.white, 'a2')}
            {star(19, 62, 13, C.goldDeep, 'b')}
            {star(81, 54, 15, C.gold, 'c')}
            {star(81, 54, 7, C.white, 'c2')}
          </>
        ),
      };

    // A struck lightning bolt
    case 'bolt':
      return {
        className: 'fx-flashglyph',
        scale: 2.4,
        node: (
          <>
            <defs>
              <linearGradient id="fx-bolt-body" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={C.white} />
                <stop offset="0.4" stopColor={C.sun} />
                <stop offset="1" stopColor={C.goldDeep} />
              </linearGradient>
            </defs>
            <path d="M60,-2 L24,54 L46,54 L34,102 L78,38 L54,38 L70,-2 Z" fill={C.sun} opacity={0.35} stroke={C.sun} strokeWidth={9} strokeLinejoin="round" />
            <path d="M60,-2 L24,54 L46,54 L34,102 L78,38 L54,38 L70,-2 Z" fill="url(#fx-bolt-body)" stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
          </>
        ),
      };

    // A dull body blow
    case 'thud':
      return {
        className: 'fx-burst',
        scale: 1.7,
        node: (
          <>
            <circle cx={50} cy={50} r={29} fill={C.cream} opacity={0.9} stroke={C.ink} strokeWidth={5} />
            <circle cx={42} cy={42} r={11} fill={C.white} opacity={0.7} />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <path key={a} d="M50,14 L50,-1" stroke={C.ink} strokeWidth={5} strokeLinecap="round" transform={`rotate(${a} 50 50)`} />
            ))}
          </>
        ),
      };

    // A puff of dust or feathers
    case 'dust':
      return {
        className: 'fx-puff',
        scale: 2.0,
        node: (
          <>
            {[
              [28, 60, 21],
              [55, 46, 25],
              [76, 63, 18],
            ].map(([cx, cy, r], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r={r} fill={C.grey} opacity={0.8} stroke={C.ink} strokeWidth={3.5} />
                <path d={`M${cx - r * 0.9},${cy + r * 0.3} a${r},${r} 0 0 0 ${r * 1.8},0 z`} fill={C.greyDeep} opacity={0.55} />
                <circle cx={cx - r * 0.35} cy={cy - r * 0.4} r={r * 0.28} fill={C.white} opacity={0.45} />
              </g>
            ))}
          </>
        ),
      };
  }
}

/** The 法陣 that opens under a caster: two counter-rotating rune rings. */
const Sigil = ({ spot, tint }: { spot: Spot; tint: string }) => (
  <span
    aria-hidden="true"
    className="fx-sigil pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
    style={{ left: `${spot.x * 100}%`, top: `${spot.y * 100 + 7}%`, width: `${SPRITE_WIDTH * 165}%`, aspectRatio: '2 / 1' }}
  >
    <svg viewBox="0 0 100 50" className="h-full w-full">
      <g transform="translate(50 25) scale(1 0.42) translate(-50 -50)">
        <circle cx={50} cy={50} r={46} fill="none" stroke={tint} strokeWidth={3} opacity={0.9} />
        <circle cx={50} cy={50} r={38} fill="none" stroke={tint} strokeWidth={1.5} opacity={0.6} strokeDasharray="7 5" />
        <circle cx={50} cy={50} r={24} fill="none" stroke={tint} strokeWidth={2.5} opacity={0.8} />
        {/* An eight-pointed rune star inside the rings */}
        <path d="M50,8 L62,38 L92,50 L62,62 L50,92 L38,62 L8,50 L38,38 Z" fill="none" stroke={tint} strokeWidth={2} opacity={0.75} />
        <path d="M22,22 L78,78 M78,22 L22,78" stroke={tint} strokeWidth={1.5} opacity={0.45} />
      </g>
    </svg>
  </span>
);

/** One effect drawn over one target. */
const Burst = ({ kind, spot, delay }: { kind: FxKind; spot: Spot; delay: number }) => {
  const { node, className, scale } = glyphFor(kind);
  // `scale` is relative to one combatant, not to the arena: a strike is roughly sprite-sized.
  // Width drives the box and `aspectRatio` keeps it square, so a tall arena never stretches it.
  const style: CSSProperties = {
    left: `${spot.x * 100}%`,
    top: `${spot.y * 100}%`,
    width: `${scale * SPRITE_WIDTH * 100}%`,
    aspectRatio: '1',
    animationDelay: `${delay}ms`,
  };
  return (
    <span aria-hidden="true" className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 ${className}`} style={style}>
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {node}
      </svg>
    </span>
  );
};

type Props = {
  battle: Battle;
  /** Where a combatant stands, in fractions of the arena box */
  spot: (who: Who) => Spot | null;
};

/**
 * Reads the events of the current step and stages them: 法陣 under the caster, a colour wash
 * over the arena for anything big, then the strike on each target.
 */
export const BattleFx = ({ battle, spot }: Props) => {
  const act = battle.events.find((event) => event.kind === 'act');
  if (!act || act.kind !== 'act' || !act.fx) return null;
  const fx = act.fx;
  const tint = TINT[fx];

  // The effect lands on whoever the step touched; a move that touched nobody lands on the actor
  const landed = battle.events.flatMap((event) =>
    event.kind === 'hit' || event.kind === 'heal' || event.kind === 'revive' ? [event.who] : [],
  );
  const targets = landed.length > 0 ? landed : [act.who];

  const seen = new Set<string>();
  const spots: Spot[] = [];
  for (const who of targets) {
    const id = who.side === 'hero' ? `h${who.hero}` : `f${who.slot}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const where = spot(who);
    if (where) spots.push(where);
  }

  const caster = spot(act.who);
  const wash = FULL_SCREEN.has(fx) || spots.length > 1;

  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {act.arcane && caster && <Sigil spot={caster} tint={tint} />}

      {wash && <span className="fx-wash absolute inset-0 block" style={{ background: tint }} />}

      {fx === 'wave' ? (
        <span className="fx-sweep absolute inset-0 block">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
            {glyphFor('wave').node}
          </svg>
        </span>
      ) : (
        spots.map((where, index) => <Burst key={index} kind={fx} spot={where} delay={index * 70} />)
      )}
    </span>
  );
};
