import type { Sprite } from '../sprite';
import { C } from '../palette';

/**
 * Dust Bunny: seven lumps of different sizes overlap one ball, the way the Tree's crown
 * is built. Uneven placement is deliberate; a symmetric ring of lumps reads as a flower.
 */
export const DustBunny: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* Stray hairs; the lumps cover their roots */}
    <path d="M28,40 L10,22" stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M46,22 L41,5" stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M48,22 L60,6" stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" />

    <circle cx={24} cy={38} r={13} fill={C.grey} stroke={C.ink} strokeWidth={4} />
    <circle cx={18} cy={60} r={11} fill={C.grey} stroke={C.ink} strokeWidth={4} />
    <circle cx={34} cy={78} r={12} fill={C.grey} stroke={C.ink} strokeWidth={4} />
    <circle cx={62} cy={80} r={10} fill={C.grey} stroke={C.ink} strokeWidth={4} />
    <circle cx={80} cy={62} r={13} fill={C.grey} stroke={C.ink} strokeWidth={4} />
    <circle cx={76} cy={34} r={11} fill={C.grey} stroke={C.ink} strokeWidth={4} />
    <circle cx={46} cy={22} r={13} fill={C.grey} stroke={C.ink} strokeWidth={4} />
    <circle cx={50} cy={50} r={31} fill={C.grey} stroke={C.ink} strokeWidth={4} />

    {/* Caught lint: one pale fleck plus a speck of grit */}
    <ellipse cx={26} cy={62} rx={5} ry={2.4} fill={C.cream} transform="rotate(-25 26 62)" />
    <circle cx={74} cy={64} r={2.4} fill={C.ink} />

    {/* Brows angled down toward the middle: cheeky, not sweet */}
    <path d="M28,32 L41,35" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" fill="none" />
    <path d="M72,32 L59,35" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" fill="none" />
    <circle cx={35} cy={48} r={9.5} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={65} cy={48} r={9.5} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={36} cy={49} r={5} fill={C.ink} />
    <circle cx={64} cy={49} r={5} fill={C.ink} />
    <circle cx={33} cy={45} r={2.2} fill={C.white} />
    <circle cx={61} cy={45} r={2.2} fill={C.white} />

    {/* Wide grin with two little fangs */}
    <path d="M33,62 Q50,80 67,62 Z" fill={C.ink} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <polygon points="39,62 46,62 42.5,68" fill={C.white} />
    <polygon points="54,62 61,62 57.5,68" fill={C.white} />
  </svg>
);

/** Sock Monster: the Sock target grown a scowling face, dirt patches and a stink cloud. */
export const SockMonster: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* Stink wobbles rising off the cuff */}
    <path d="M20,15 C15,11 25,9 20,3" fill="none" stroke={C.leaf} strokeWidth={3} strokeLinecap="round" />
    <path d="M34,14 C29,10 39,8 34,3" fill="none" stroke={C.leaf} strokeWidth={3} strokeLinecap="round" />
    <path d="M48,15 C43,11 53,9 48,4" fill="none" stroke={C.leaf} strokeWidth={3} strokeLinecap="round" />

    {/* Upright sock: leg on the left, foot pointing right */}
    <path
      d="M16,30 L70,30 L70,52 Q70,64 84,64 Q96,64 96,78 Q96,92 82,92 L34,92 Q16,92 16,74 Z"
      fill={C.sky}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <path d="M78,66 Q84,78 78,90" fill="none" stroke={C.skyDeep} strokeWidth={3} strokeLinecap="round" />
    <rect x={12} y={16} width={62} height={18} rx={9} fill={C.cream} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />

    {/* Ground-in dirt */}
    <ellipse cx={28} cy={84} rx={6.5} ry={4.5} fill={C.sandDeep} />
    <ellipse cx={88} cy={76} rx={6} ry={5} fill={C.sandDeep} />

    {/* Face sits on the heel, the widest part of the sock */}
    <path d="M24,42 L38,47" stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M64,42 L50,47" stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" />
    <circle cx={32} cy={60} r={10} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={56} cy={60} r={10} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={33} cy={61} r={5} fill={C.ink} />
    <circle cx={57} cy={61} r={5} fill={C.ink} />
    <circle cx={30} cy={57} r={2} fill={C.white} />
    <circle cx={54} cy={57} r={2} fill={C.white} />
    <path d="M32,74 Q44,90 56,74 Z" fill={C.ink} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <polygon points="36,74 42,74 39,79" fill={C.white} />
    <polygon points="46,74 52,74 49,79" fill={C.white} />
  </svg>
);

/**
 * Block Golem, the living-room boss. Four raised arm blocks and a leg-block stance
 * push the silhouette to the edges of the box so it towers over the small foes.
 */
export const BlockGolem: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <rect x={20} y={78} width={24} height={18} rx={3} fill={C.sandDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={56} y={78} width={24} height={18} rx={3} fill={C.sandDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />

    {/* Torso: four toy cubes stacked two by two */}
    <rect x={28} y={38} width={22} height={20} rx={3} fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={50} y={38} width={22} height={20} rx={3} fill={C.sun} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={28} y={58} width={22} height={20} rx={3} fill={C.sky} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={50} y={58} width={22} height={20} rx={3} fill={C.leaf} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />

    {/* Studs first, so each raised block covers their lower half */}
    <rect x={9} y={9} width={8} height={8} rx={2} fill={C.plum} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <rect x={18} y={9} width={8} height={8} rx={2} fill={C.plum} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <rect x={74} y={9} width={8} height={8} rx={2} fill={C.plum} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <rect x={83} y={9} width={8} height={8} rx={2} fill={C.plum} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <rect x={6} y={16} width={22} height={22} rx={3} fill={C.plum} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={72} y={16} width={22} height={22} rx={3} fill={C.plum} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={6} y={38} width={22} height={22} rx={3} fill={C.sand} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={72} y={38} width={22} height={22} rx={3} fill={C.sand} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />

    {/* Head block, pale so the grumpy face reads at phone size */}
    <rect x={32} y={4} width={36} height={32} rx={4} fill={C.paper} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M36,11 L47,16" stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M64,11 L53,16" stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" />
    <circle cx={41} cy={19} r={7} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={59} cy={19} r={7} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={41} cy={20} r={4} fill={C.ink} />
    <circle cx={59} cy={20} r={4} fill={C.ink} />
    <circle cx={39} cy={17} r={1.8} fill={C.white} />
    <circle cx={57} cy={17} r={1.8} fill={C.white} />
    <path d="M41,32 Q50,26 59,32" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
  </svg>
);
