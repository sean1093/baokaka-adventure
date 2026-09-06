import type { Sprite } from '../sprite';
import { C } from '../palette';

/** Mosquito: fat striped abdomen, two pale wings swept back, and a needle for a nose. */
export const Mosquito: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* Wings behind everything, both anchored under the head so they read as attached.
        The only place opacity is used, to keep them gauzy. */}
    <ellipse cx={68} cy={18} rx={20} ry={7.5} transform="rotate(-24 68 18)" fill={C.white} opacity={0.9} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={68} cy={40} rx={17} ry={7} transform="rotate(6 68 40)" fill={C.white} opacity={0.9} stroke={C.ink} strokeWidth={4} />

    {/* Spiky legs, drawn under the body so only the outer sections show */}
    <path d="M52,72 L46,86 L38,90" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M68,78 L70,90 L68,96" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M84,70 L92,80 L94,88" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />

    <ellipse cx={68} cy={60} rx={26} ry={18} transform="rotate(-15 68 60)" fill={C.plum} stroke={C.ink} strokeWidth={4} />
    {/* Bands across the abdomen, perpendicular to its axis */}
    <path d="M65,48 L71,72" stroke={C.grey} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M78,46 L83,67" stroke={C.grey} strokeWidth={5} strokeLinecap="round" fill="none" />

    {/* Proboscis: a tapered needle, drawn before the head so its base is tucked away */}
    <polygon points="20,52 24,56 5,87" fill={C.ink} />
    <circle cx={34} cy={42} r={23} fill={C.grey} stroke={C.ink} strokeWidth={4} />

    <path d="M18,29 L29,32" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" fill="none" />
    <path d="M49,29 L41,32" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" fill="none" />
    <circle cx={25} cy={42} r={9} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={44} cy={44} r={9} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={25} cy={43} r={5} fill={C.ink} />
    <circle cx={44} cy={45} r={5} fill={C.ink} />
    <circle cx={22} cy={39} r={2} fill={C.white} />
    <circle cx={41} cy={41} r={2} fill={C.white} />
    {/* Little smirk: it already knows whose ankle it wants */}
    <path d="M28,58 Q34,63 40,57" fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
  </svg>
);

/** Snail: eye stalks rise from behind the body, so they look rooted in the head. */
export const Snail: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* Stalks: thick ink line with a thinner green line on top gives an outlined stalk */}
    <path d="M22,58 Q12,44 14,30" fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
    <path d="M32,57 Q28,38 28,24" fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
    <path d="M22,58 Q12,44 14,30" fill="none" stroke={C.leaf} strokeWidth={4} strokeLinecap="round" />
    <path d="M32,57 Q28,38 28,24" fill="none" stroke={C.leaf} strokeWidth={4} strokeLinecap="round" />

    {/* Foot and raised head in one shape */}
    <path
      d="M92,86 Q92,90 86,90 L22,90 Q6,90 6,76 Q6,62 20,56 Q26,53 32,55 Q40,59 44,68 L80,68 Q92,68 92,86 Z"
      fill={C.leaf}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />

    <circle cx={62} cy={44} r={28} fill={C.sun} stroke={C.ink} strokeWidth={4} />
    {/* Shell whorl: half circles of growing radius, alternating sides */}
    <path
      d="M62,44 A4,4 0 0 1 62,52 A8,8 0 0 1 62,36 A12,12 0 0 1 62,60 A16,16 0 0 1 62,28 A20,20 0 0 1 62,68"
      fill="none"
      stroke={C.sunDeep}
      strokeWidth={5}
      strokeLinecap="round"
    />

    {/* Eyes on the stalks: heavy lids dropped over low pupils, sleepy and smug */}
    <circle cx={14} cy={28} r={7.5} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={28} cy={22} r={7.5} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={14} cy={30.5} r={2.8} fill={C.ink} />
    <circle cx={28} cy={24.5} r={2.8} fill={C.ink} />
    <path d="M7.5,24 Q14,29 20.5,24" fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    <path d="M21.5,18 Q28,23 34.5,18" fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    <path d="M12,74 Q20,80 28,72" fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
  </svg>
);

/**
 * Mole King, the yard boss. He is drawn first and the dirt mound goes over him, so he
 * reads as bursting up out of the ground; the paws then sit on top, gripping the dirt.
 */
export const MoleKing: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <ellipse cx={50} cy={64} rx={36} ry={24} fill={C.mocha} stroke={C.ink} strokeWidth={4} />
    {/* Tiny ears peek out from behind the head */}
    <circle cx={26} cy={20} r={7} fill={C.mochaDeep} stroke={C.ink} strokeWidth={4} />
    <circle cx={74} cy={20} r={7} fill={C.mochaDeep} stroke={C.ink} strokeWidth={4} />
    <circle cx={50} cy={36} r={27} fill={C.mocha} stroke={C.ink} strokeWidth={4} />

    <ellipse cx={50} cy={50} rx={19} ry={12} fill={C.paper} stroke={C.ink} strokeWidth={3} />
    {/* Buck teeth tuck under the nose */}
    <rect x={44} y={54} width={6} height={10} rx={1.5} fill={C.white} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <rect x={51} y={54} width={6} height={10} rx={1.5} fill={C.white} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <circle cx={50} cy={45} r={9} fill={C.berry} stroke={C.ink} strokeWidth={3} />

    {/* Boss brows: thicker than the small foes' and pressed down onto the eyes */}
    <path d="M30,20 L46,25" stroke={C.ink} strokeWidth={6} strokeLinecap="round" fill="none" />
    <path d="M70,20 L54,25" stroke={C.ink} strokeWidth={6} strokeLinecap="round" fill="none" />
    <circle cx={34} cy={33} r={9} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={66} cy={33} r={9} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={34} cy={34} r={4.8} fill={C.ink} />
    <circle cx={66} cy={34} r={4.8} fill={C.ink} />
    <circle cx={31} cy={31} r={2} fill={C.white} />
    <circle cx={63} cy={31} r={2} fill={C.white} />

    <path d="M34,17 L34,6 L42,12 L50,4 L58,12 L66,6 L66,17 Z" fill={C.sun} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />

    {/* Dirt mound in front of the body */}
    <path d="M4,96 C8,78 26,70 50,70 C74,70 92,78 96,96 Z" fill={C.sandDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <ellipse cx={44} cy={90} rx={6} ry={3.5} fill={C.sand} stroke={C.ink} strokeWidth={3} />
    <ellipse cx={58} cy={82} rx={5} ry={3} fill={C.sand} stroke={C.ink} strokeWidth={3} />

    <ellipse cx={22} cy={76} rx={13} ry={10} fill={C.mochaDeep} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={78} cy={76} rx={13} ry={10} fill={C.mochaDeep} stroke={C.ink} strokeWidth={4} />
    {/* Toe seams, kept inside the paws so they read as chunky digging mitts */}
    <path d="M15,78 L14,83" stroke={C.ink} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M22,80 L22,85" stroke={C.ink} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M29,78 L30,83" stroke={C.ink} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M85,78 L86,83" stroke={C.ink} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M78,80 L78,85" stroke={C.ink} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M71,78 L70,83" stroke={C.ink} strokeWidth={3} strokeLinecap="round" fill="none" />
  </svg>
);
