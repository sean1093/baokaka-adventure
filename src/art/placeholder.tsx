import type { CSSProperties } from 'react';
import { artUrl } from './defs';
import { silWidth } from './lod';
import { PLACEHOLDER } from './palette';
import { defineSprite, type SpriteComponent, type SpriteProps } from './sprite';
import { useSvgIds } from './useSvgIds';

/**
 * Placeholder sprites (decision D-14). Chapter content lands before its art, so content may add a
 * `SpriteName` backed by a placeholder:
 *
 *   gugu: registerPlaceholder('gugu', { kind: 'foe', label: '咕咕' }),
 *
 * It draws a neutral lavender-grey silhouette at the right footprint for its kind (an upright
 * NPC, a round foe, a big boss, a squat prop) with the label's first CJK character on a navy
 * plate, so a playtester can tell what stands there and that it isn't finished. `validate.ts`
 * lists every placeholder in `SPRITES` as a warning (`spriteWarnings()`), and the final QA issue
 * (#58) requires none.
 *
 * The character is HTML laid over the SVG (sprites never use `<text>`), sized with container
 * units so it scales with the sprite's box.
 */

export type PlaceholderKind = 'npc' | 'foe' | 'boss' | 'prop';

type Footprint = {
  /** The silhouette's path on the 200u canvas */
  readonly d: string;
  /** Contact shadow half-width */
  readonly shadow: number;
  /** Label plate centre and size */
  readonly plate: readonly [number, number, number];
};

const FOOTPRINTS: Record<PlaceholderKind, Footprint> = {
  // An adult NPC (§ 2.2: 4–5 heads, lighter chibi): round head on a tapered body
  npc: {
    d: 'M100,22 C114,22 124,32 124,46 C124,56 118,64 110,68 C126,72 138,84 140,104 L146,170 C147,180 140,186 130,186 L70,186 C60,186 53,180 54,170 L60,104 C62,84 74,72 90,68 C82,64 76,56 76,46 C76,32 86,22 100,22 Z',
    shadow: 46,
    plate: [100, 128, 46],
  },
  // A regular foe: a round body with two nubs
  foe: {
    d: 'M62,96 C58,82 66,74 76,80 C84,74 92,72 100,72 C108,72 116,74 124,80 C134,74 142,82 138,96 C154,108 162,126 160,146 C158,170 134,186 100,186 C66,186 42,170 40,146 C38,126 46,108 62,96 Z',
    shadow: 58,
    plate: [100, 134, 50],
  },
  // A boss fills the stage
  boss: {
    d: 'M44,58 C38,36 54,24 70,34 C80,26 90,22 100,22 C110,22 120,26 130,34 C146,24 162,36 156,58 C178,78 190,106 186,136 C182,166 150,188 100,188 C50,188 18,166 14,136 C10,106 22,78 44,58 Z',
    shadow: 84,
    plate: [100, 110, 64],
  },
  // A prop: a squat rounded block
  prop: {
    d: 'M58,96 L142,96 C152,96 158,102 158,112 L158,170 C158,180 152,186 142,186 L58,186 C48,186 42,180 42,170 L42,112 C42,102 48,96 58,96 Z',
    shadow: 64,
    plate: [100, 141, 46],
  },
};

/** The label's first CJK character (or its first character), shown on the plate. */
export const placeholderGlyph = (label: string): string => [...label].find((ch) => /\p{Script=Han}/u.test(ch)) ?? [...label][0] ?? '?';

/** The art itself (exported for the art lab); the registry uses `registerPlaceholder`. */
export const Placeholder = ({ name, kind, label, lod }: { name: string; kind: PlaceholderKind; label: string } & Pick<SpriteProps, 'lod'>) => {
  const id = useSvgIds('placeholder');
  const { d, shadow, plate } = FOOTPRINTS[kind];
  const [px, py, size] = plate;
  const glyph: CSSProperties = {
    left: `${px / 2}%`,
    top: `${py / 2}%`,
    transform: 'translate(-50%, -54%)',
    fontSize: `${(size / 200) * 66}cqmin`,
    color: PLACEHOLDER.glyph,
  };
  return (
    <span className="relative block h-full w-full" style={{ containerType: 'size' }} data-placeholder={name} title={`${label}（暫代圖）`}>
      <svg viewBox="0 0 200 200" className="block h-full w-full" aria-hidden="true">
        <defs>
          <path id={id('shape')} d={d} />
          <clipPath id={id('clip')}>
            <use href={`#${id('shape')}`} />
          </clipPath>
        </defs>
        <ellipse cx={100} cy={187} rx={shadow} ry={7} fill={artUrl('contact')} />
        <use href={`#${id('shape')}`} fill={PLACEHOLDER.line} stroke={PLACEHOLDER.line} strokeWidth={silWidth(lod) * 1.5} strokeLinejoin="round" />
        <g clipPath={`url(#${id('clip')})`}>
          <rect x={0} y={0} width={200} height={200} fill={PLACEHOLDER.cel} />
          <use href={`#${id('shape')}`} fill={PLACEHOLDER.body} transform="translate(-8 -7)" />
        </g>
        <rect x={px - size / 2} y={py - size / 2} width={size} height={size} rx={size * 0.22} fill={PLACEHOLDER.plate} stroke={PLACEHOLDER.plateEdge} strokeWidth={3} />
      </svg>
      <span aria-hidden="true" className="pointer-events-none absolute whitespace-nowrap font-body font-black leading-none" style={glyph}>
        {placeholderGlyph(label)}
      </span>
    </span>
  );
};

/**
 * A placeholder sprite for `name`, tagged so `spriteWarnings()` can list it. Put the result in
 * `SPRITES` under a new `SpriteName`; the art issue replaces it with the real sprite.
 */
export function registerPlaceholder(name: string, { kind, label }: { kind: PlaceholderKind; label: string }): SpriteComponent {
  const sprite = defineSprite({ kind, placeholder: { name, label } }, ({ lod }: SpriteProps) => <Placeholder name={name} kind={kind} label={label} lod={lod} />);
  Object.defineProperty(sprite, 'name', { value: `Placeholder(${name})` });
  return sprite;
}
