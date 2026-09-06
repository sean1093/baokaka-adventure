import type { Sprite } from '../sprite';
import { C } from '../palette';

/**
 * A little sleep imp: floating blob, nightcap pulled down over the eyes, mid-yawn.
 * The snores drift up the right side, which is why the body sits left of centre.
 * The "z" glyphs are zig-zag paths, drawn twice, because sprites may not use <text>.
 */
export const SleepySprite: Sprite = () => {
  const snores = ['M76,78 L84,78 L76,86 L84,86', 'M78,54 L88,54 L78,64 L88,64', 'M80,26 L94,26 L80,40 L94,40'];
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      {/* Ghost blob with a wavy hem */}
      <path
        d="M10,56 C10,32 24,20 39,20 C54,20 68,32 68,56 L68,84 C62,78 58,90 50,85 C43,81 39,91 31,86 C24,82 20,90 12,85 C10,83 10,80 10,74 Z"
        fill={C.sky}
        stroke={C.ink}
        strokeWidth={4}
        strokeLinejoin="round"
      />

      {/* Nightcap, flopping to the right, with its pom-pom on the tip */}
      <path d="M18,32 C22,12 44,6 68,12 C60,20 54,24 48,28 Z" fill={C.white} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <circle cx={70} cy={12} r={8} fill={C.berry} stroke={C.ink} strokeWidth={4} />

      {/* Inner ends of the brows ride high, which is what makes it smug rather than sad */}
      <path d="M19,37 L31,34" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <path d="M59,37 L47,34" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />

      {/* Half closed eyes: low pupils under a heavy lid line */}
      <ellipse cx={28} cy={46} rx={9} ry={7} fill={C.white} stroke={C.ink} strokeWidth={3} />
      <ellipse cx={50} cy={46} rx={9} ry={7} fill={C.white} stroke={C.ink} strokeWidth={3} />
      <circle cx={28} cy={49} r={4} fill={C.ink} />
      <circle cx={50} cy={49} r={4} fill={C.ink} />
      <path d="M19,45 Q28,38 37,45" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <path d="M41,45 Q50,38 59,45" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />

      <ellipse cx={16} cy={58} rx={5} ry={3.5} fill={C.berry} />
      <ellipse cx={60} cy={58} rx={5} ry={3.5} fill={C.berry} />

      {/* Yawn */}
      <ellipse cx={38} cy={68} rx={12} ry={10} fill={C.berryDeep} stroke={C.ink} strokeWidth={3} />
      <ellipse cx={38} cy={74} rx={6} ry={3} fill={C.berry} />

      {snores.map((d, i) => (
        <path key={`ink${i}`} d={d} stroke={C.ink} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ))}
      {snores.map((d, i) => (
        <path key={i} d={d} stroke={C.white} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ))}
    </svg>
  );
};

/**
 * The bad-dream cloud. Puffy and cross, with one little bolt dangling underneath -
 * threatening enough to read as an enemy, small enough to stay funny.
 */
export const NightmareCloud: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* Bolt first so its top tucks behind the cloud */}
    <polygon
      points="50,66 64,66 54,80 62,80 44,96 50,82 42,82"
      fill={C.sun}
      stroke={C.ink}
      strokeWidth={3}
      strokeLinejoin="round"
    />

    <path
      d="M12,66 C0,58 2,40 14,38 C12,22 28,14 40,22 C46,8 70,10 72,26 C86,24 96,38 88,52 C94,62 86,72 78,68 C68,74 60,66 50,70 C40,74 32,66 24,70 C18,72 14,70 12,66 Z"
      fill={C.plum}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    {/* Shading: contour lines along the underside lumps, not blush */}
    <path d="M14,58 Q22,70 32,62" stroke={C.grey} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M86,58 Q78,70 68,62" stroke={C.grey} strokeWidth={5} strokeLinecap="round" fill="none" />

    {/* Scowl: brows driven down into the eyes */}
    <path d="M22,28 L40,36" stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M78,28 L60,36" stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" />
    <ellipse cx={34} cy={42} rx={10} ry={8.5} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={66} cy={42} rx={10} ry={8.5} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={37} cy={44} r={5} fill={C.ink} />
    <circle cx={63} cy={44} r={5} fill={C.ink} />
    <circle cx={32} cy={39} r={2.2} fill={C.white} />
    <circle cx={61} cy={39} r={2.2} fill={C.white} />

    {/* Frowning open mouth: the arc bulges upward, so the flat edge is the bottom */}
    <path d="M38,66 h24 a12,12 0 0 0 -24,0 z" fill={C.berryDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <polygon points="44,66 50,66 47,60" fill={C.white} />
    <polygon points="53,66 59,66 56,60" fill={C.white} />
  </svg>
);

/**
 * Final boss. Everything is oversized - crown, cape, belly - but the eyes stay shut and
 * he keeps hold of his pillow, so he reads as unbeatably sleepy rather than mean.
 */
export const SnoreKing: Sprite = () => {
  const snores = ['M85,49 L94,49 L85,58 L94,58', 'M82,29 L93,29 L82,40 L93,40', 'M78,5 L94,5 L78,21 L94,21'];
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      {/* Cape behind the body, with a scalloped hem: this is what widens the silhouette */}
      <path
        d="M22,44 C4,54 2,76 6,90 C16,84 22,94 32,90 C42,86 50,94 58,90 C68,86 74,94 84,90 C88,76 84,54 66,44 Z"
        fill={C.berry}
        stroke={C.ink}
        strokeWidth={4}
        strokeLinejoin="round"
      />

      <ellipse cx={45} cy={60} rx={34} ry={33} fill={C.plum} stroke={C.ink} strokeWidth={4} />
      {/* Nightrobe hem across the belly */}
      <path d="M20,82 C25,89 34,92 45,92 C56,92 65,89 70,82 Z" fill={C.skyDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />

      {/* The cape collar, thrown over one shoulder */}
      <path d="M13,48 C6,60 8,72 14,76 C22,70 24,58 22,46 Z" fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />

      {/* Pillow tucked under the other arm, low enough that the arm does not hide it */}
      <g transform="rotate(12 82 81)">
        <rect x={70} y={72} width={24} height={18} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        <path d="M74,82 Q82,86 90,80" stroke={C.grey} strokeWidth={3} strokeLinecap="round" fill="none" />
      </g>
      <ellipse cx={72} cy={68} rx={11} ry={8.5} fill={C.plum} stroke={C.ink} strokeWidth={4} transform="rotate(20 72 68)" />

      <polygon
        points="24,34 30,12 38,24 45,4 52,24 60,12 66,34"
        fill={C.sun}
        stroke={C.ink}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <circle cx={33} cy={29} r={4} fill={C.berry} />
      <circle cx={45} cy={29} r={4.5} fill={C.berry} />
      <circle cx={57} cy={29} r={4} fill={C.berry} />

      {/* Brows are angled slashes: two more wide arcs would merge with the shut eyes */}
      <path d="M24,38 L38,42" stroke={C.ink} strokeWidth={5.5} strokeLinecap="round" fill="none" />
      <path d="M66,38 L52,42" stroke={C.ink} strokeWidth={5.5} strokeLinecap="round" fill="none" />
      <path d="M25,54 Q33,61 41,54" stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" />
      <path d="M49,54 Q57,61 65,54" stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" />

      {/* Snoring mouth, wide open */}
      <ellipse cx={45} cy={71} rx={15} ry={9.5} fill={C.berryDeep} stroke={C.ink} strokeWidth={3} />
      <ellipse cx={45} cy={76} rx={8} ry={3.5} fill={C.berry} />

      {snores.map((d, i) => (
        <path key={`ink${i}`} d={d} stroke={C.ink} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ))}
      {snores.map((d, i) => (
        <path key={i} d={d} stroke={C.white} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ))}
    </svg>
  );
};
