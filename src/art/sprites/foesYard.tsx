import type { Sprite } from '../sprite';
import { C } from '../palette';

/**
 * Mosquito: fat striped abdomen, two pale wings swept back, and a needle for a nose.
 * The wings are the point of interest: a white-to-sky gradient held at low opacity with
 * C.skyDeep veins running from root to tip, so they read as gauze rather than paper.
 */
export const Mosquito: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id="mosquito-wing" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0" stopColor={C.white} />
        <stop offset="0.55" stopColor={C.white} />
        <stop offset="1" stopColor={C.sky} />
      </linearGradient>
      <radialGradient id="mosquito-head" cx="0.32" cy="0.28" r="0.85">
        <stop offset="0" stopColor={C.paper} />
        <stop offset="0.4" stopColor={C.grey} />
        <stop offset="1" stopColor={C.greyDeep} />
      </radialGradient>
      <linearGradient id="mosquito-abdomen" x1="0.2" y1="0" x2="0.7" y2="1">
        <stop offset="0" stopColor={C.plum} />
        <stop offset="1" stopColor={C.plumDeep} />
      </linearGradient>
      <clipPath id="mosquito-gaster">
        <ellipse cx={68} cy={60} rx={26} ry={18} transform="rotate(-15 68 60)" />
      </clipPath>
      <clipPath id="mosquito-skull">
        <circle cx={34} cy={42} r={23} />
      </clipPath>
    </defs>

    {/* Contact shadow where the spiky legs touch down */}
    <ellipse cx={66} cy={96} rx={28} ry={3.5} fill={C.ink} opacity={0.18} />

    {/* Wings behind everything, both anchored under the head so they read as attached.
        Each sits in its own rotated group so the veins tilt with the membrane. */}
    <g transform="rotate(-24 68 18)">
      <ellipse cx={68} cy={18} rx={20} ry={7.5} fill="url(#mosquito-wing)" opacity={0.82} stroke={C.ink} strokeWidth={4} />
      <path
        d="M51,17 Q66,12 86,15 M51,19.5 Q67,18.5 87,19 M53,22 Q67,24 84,22"
        stroke={C.skyDeep}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
        opacity={0.8}
      />
    </g>
    <g transform="rotate(6 68 40)">
      <ellipse cx={68} cy={40} rx={17} ry={7} fill="url(#mosquito-wing)" opacity={0.82} stroke={C.ink} strokeWidth={4} />
      <path
        d="M54,39 Q68,34 83,37 M54,41.5 Q68,40.5 84,41 M56,44 Q68,46 81,44"
        stroke={C.skyDeep}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
        opacity={0.8}
      />
    </g>

    {/* Spiky legs, drawn under the body so only the outer sections show */}
    <path d="M52,72 L46,86 L38,90" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M68,78 L70,90 L68,96" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M84,70 L92,80 L94,88" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />

    <ellipse cx={68} cy={60} rx={26} ry={18} transform="rotate(-15 68 60)" fill="url(#mosquito-abdomen)" stroke={C.ink} strokeWidth={4} />
    <g clipPath="url(#mosquito-gaster)">
      {/* Deep tone along the underside, highlight on the lit upper-left curve */}
      <ellipse cx={76} cy={72} rx={30} ry={14} transform="rotate(-15 76 72)" fill={C.plumDeep} />
      <ellipse cx={58} cy={49} rx={14} ry={5} transform="rotate(-15 58 49)" fill={C.white} opacity={0.28} />
    </g>
    {/* Bands across the abdomen, perpendicular to its axis, each with a shaded trailing edge */}
    <path d="M65,48 L71,72" stroke={C.grey} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M67.5,48.6 L73.5,72" stroke={C.greyDeep} strokeWidth={1.8} strokeLinecap="round" fill="none" />
    <path d="M78,46 L83,67" stroke={C.grey} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M80.3,46.6 L85,66" stroke={C.greyDeep} strokeWidth={1.8} strokeLinecap="round" fill="none" />

    {/* Proboscis: a tapered needle with a thin sheen so it reads as hard, not as a shadow */}
    <polygon points="20,52 24,56 5,87" fill={C.ink} />
    <path d="M21.5,53.5 L8,84" stroke={C.grey} strokeWidth={1.2} strokeLinecap="round" fill="none" opacity={0.7} />

    <circle cx={34} cy={42} r={23} fill="url(#mosquito-head)" stroke={C.ink} strokeWidth={4} />
    <g clipPath="url(#mosquito-skull)">
      {/* Bristly tufts on the shaded side of the head */}
      <path
        d="M50,58 Q56,52 57,44 M44,62 Q49,55 50,48 M55,48 Q59,42 58,36"
        stroke={C.greyDeep}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
      <path d="M15.5,35 A23,23 0 0 1 38.9,19.3 L38.4,25.4 A17,17 0 0 0 21.1,36.6 Z" fill={C.white} opacity={0.32} />
    </g>
    <ellipse cx={24} cy={29} rx={5.5} ry={3.4} transform="rotate(-38 24 29)" fill={C.white} opacity={0.4} />

    <path d="M18,29 L29,32" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" fill="none" />
    <path d="M49,29 L41,32" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" fill="none" />
    {/* Eyes: sclera, blood-red iris ring, ink pupil, highlight up-left */}
    <circle cx={25} cy={42} r={9} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={44} cy={44} r={9} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={25} cy={43} r={5.2} fill={C.wine} />
    <circle cx={44} cy={45} r={5.2} fill={C.wine} />
    <circle cx={25} cy={43} r={3.4} fill={C.ink} />
    <circle cx={44} cy={45} r={3.4} fill={C.ink} />
    <ellipse cx={25} cy={47} rx={2.8} ry={1.4} fill={C.white} opacity={0.42} />
    <ellipse cx={44} cy={49} rx={2.8} ry={1.4} fill={C.white} opacity={0.42} />
    <circle cx={22.4} cy={39.6} r={2} fill={C.white} />
    <circle cx={41.4} cy={41.6} r={2} fill={C.white} />
    {/* Little smirk: it already knows whose ankle it wants */}
    <path d="M28,58 Q34,63 40,57" fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
  </svg>
);

/**
 * Snail: eye stalks rise from behind the body, so they look rooted in the head.
 * The shell carries the drawing: a radial gradient turns the whorl into a cone, a hard
 * white streak sits on the upper-left rim, and the grooves get a lit sand edge each.
 */
export const Snail: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      <radialGradient id="snail-shell" cx="0.32" cy="0.26" r="0.88">
        <stop offset="0" stopColor={C.sand} />
        <stop offset="0.38" stopColor={C.sun} />
        <stop offset="1" stopColor={C.sunDeep} />
      </radialGradient>
      <linearGradient id="snail-flesh" x1="0.2" y1="0" x2="0.6" y2="1">
        <stop offset="0" stopColor={C.leaf} />
        <stop offset="0.55" stopColor={C.leaf} />
        <stop offset="1" stopColor={C.leafDeep} />
      </linearGradient>
      <clipPath id="snail-shellClip">
        <circle cx={62} cy={44} r={28} />
      </clipPath>
      <clipPath id="snail-footClip">
        <path d="M92,86 Q92,90 86,90 L22,90 Q6,90 6,76 Q6,62 20,56 Q26,53 32,55 Q40,59 44,68 L80,68 Q92,68 92,86 Z" />
      </clipPath>
    </defs>

    {/* Contact shadow: a snail is all belly, so it sits wide and low */}
    <ellipse cx={50} cy={92} rx={43} ry={4} fill={C.ink} opacity={0.18} />

    {/* Stalks: thick ink line, green core, jade highlight down the lit side */}
    <path d="M22,58 Q12,44 14,30" fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
    <path d="M32,57 Q28,38 28,24" fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
    <path d="M22,58 Q12,44 14,30" fill="none" stroke={C.leaf} strokeWidth={4} strokeLinecap="round" />
    <path d="M32,57 Q28,38 28,24" fill="none" stroke={C.leaf} strokeWidth={4} strokeLinecap="round" />
    <path d="M21,57 Q11,44 12.8,31" fill="none" stroke={C.jade} strokeWidth={1.6} strokeLinecap="round" opacity={0.9} />
    <path d="M31,56 Q27,38 26.9,25" fill="none" stroke={C.jade} strokeWidth={1.6} strokeLinecap="round" opacity={0.9} />

    {/* Foot and raised head in one shape */}
    <path
      d="M92,86 Q92,90 86,90 L22,90 Q6,90 6,76 Q6,62 20,56 Q26,53 32,55 Q40,59 44,68 L80,68 Q92,68 92,86 Z"
      fill="url(#snail-flesh)"
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <g clipPath="url(#snail-footClip)">
      {/* Deep underside where the foot presses down */}
      <path d="M0,80 Q40,87 100,78 L100,100 L0,100 Z" fill={C.leafDeep} />
      {/* Wet sheen: one broad glaze over the head hump, one long streak down the foot */}
      <path d="M9,73 Q13,61 24,55 Q30,52 35,56 Q26,58 19,65 Q15,69 14,75 Z" fill={C.white} opacity={0.35} />
      <path d="M38,73 Q64,70 90,74 L90,78 Q64,74 39,78 Z" fill={C.white} opacity={0.2} />
      <ellipse cx={20} cy={62} rx={4.5} ry={2.6} transform="rotate(-40 20 62)" fill={C.white} opacity={0.5} />
    </g>
    {/* Mantle crease where the shell sits on the body */}
    <path d="M44,69 Q62,74 82,69" fill="none" stroke={C.leafDeep} strokeWidth={2.5} strokeLinecap="round" />
    {/* Wet slime sheen where the foot presses out along the ground */}
    <path d="M20,87 Q50,84 78,87 Q50,89 20,87 Z" fill={C.jade} opacity={0.4} />

    <circle cx={62} cy={44} r={28} fill="url(#snail-shell)" stroke={C.ink} strokeWidth={4} />
    <g clipPath="url(#snail-shellClip)">
      {/* Cone shading: the lower-right half of the whorl falls away from the light */}
      <ellipse cx={74} cy={58} rx={27} ry={25} fill={C.sunDeep} opacity={0.4} />
      {/* Shell whorl: half circles of growing radius, alternating sides */}
      <path
        d="M62,44 A4,4 0 0 1 62,52 A8,8 0 0 1 62,36 A12,12 0 0 1 62,60 A16,16 0 0 1 62,28 A20,20 0 0 1 62,68"
        fill="none"
        stroke={C.sunDeep}
        strokeWidth={5}
        strokeLinecap="round"
      />
      {/* Lit edge on every groove, offset up-left, which is what makes the ridges pop */}
      <g transform="translate(-2.2,-2.2)">
        <path
          d="M62,44 A4,4 0 0 1 62,52 A8,8 0 0 1 62,36 A12,12 0 0 1 62,60 A16,16 0 0 1 62,28 A20,20 0 0 1 62,68"
          fill="none"
          stroke={C.sand}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.6}
        />
      </g>
      {/* Hard highlight streak along the upper-left rim */}
      <path d="M35.7,34.4 A28,28 0 0 1 66.9,16.4 L65.8,22.3 A22,22 0 0 0 41.3,36.5 Z" fill={C.white} opacity={0.42} />
    </g>
    <ellipse cx={47} cy={26} rx={6} ry={3.4} transform="rotate(-42 47 26)" fill={C.white} opacity={0.5} />

    {/* Eyes on the stalks: heavy lids dropped over low pupils, sleepy and smug */}
    <circle cx={14} cy={28} r={7.5} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={28} cy={22} r={7.5} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={14} cy={30} r={4.6} fill={C.sky} />
    <circle cx={28} cy={24} r={4.6} fill={C.sky} />
    <circle cx={14} cy={30.5} r={2.8} fill={C.ink} />
    <circle cx={28} cy={24.5} r={2.8} fill={C.ink} />
    <circle cx={12.2} cy={28.4} r={1.5} fill={C.white} />
    <circle cx={26.2} cy={22.4} r={1.5} fill={C.white} />
    <path d="M7.5,24 Q14,29 20.5,24" fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    <path d="M21.5,18 Q28,23 34.5,18" fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    <path d="M12,74 Q20,80 28,72" fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
  </svg>
);

/**
 * Mole King, the yard boss. He is drawn first and the dirt mound goes over him, so he
 * reads as bursting up out of the ground; the paws then sit on top, gripping the dirt.
 * Fur is shaded in three steps (C.sand catchlight, C.mocha body, C.mochaDeep tufts) and
 * the tin crown is now proper metal: gold face, goldDeep right flank, one berry jewel.
 */
export const MoleKing: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      <radialGradient id="moleKing-aura" cx="0.5" cy="0.44" r="0.52">
        <stop offset="0.36" stopColor={C.gold} stopOpacity={0} />
        <stop offset="0.68" stopColor={C.gold} stopOpacity={0.26} />
        <stop offset="1" stopColor={C.gold} stopOpacity={0} />
      </radialGradient>
      <radialGradient id="moleKing-fur" cx="0.34" cy="0.26" r="0.88">
        <stop offset="0" stopColor={C.mocha} />
        <stop offset="0.5" stopColor={C.mocha} />
        <stop offset="1" stopColor={C.mochaDeep} />
      </radialGradient>
      <linearGradient id="moleKing-crown" x1="0.1" y1="0" x2="0.9" y2="0.8">
        <stop offset="0" stopColor={C.gold} />
        <stop offset="0.6" stopColor={C.gold} />
        <stop offset="1" stopColor={C.goldDeep} />
      </linearGradient>
      <linearGradient id="moleKing-dirt" x1="0.2" y1="0" x2="0.5" y2="1">
        <stop offset="0" stopColor={C.sandDeep} />
        <stop offset="1" stopColor={C.mochaDeep} />
      </linearGradient>
      <clipPath id="moleKing-skull">
        <circle cx={50} cy={36} r={27} />
      </clipPath>
      <clipPath id="moleKing-trunk">
        <ellipse cx={50} cy={64} rx={36} ry={24} />
      </clipPath>
      <clipPath id="moleKing-moundClip">
        <path d="M4,96 C8,78 26,70 50,70 C74,70 92,78 96,96 Z" />
      </clipPath>
    </defs>

    {/* Boss glow behind the king, plus the shadow his mound casts */}
    <rect x={0} y={0} width={100} height={100} fill="url(#moleKing-aura)" />
    <ellipse cx={50} cy={96} rx={49} ry={4} fill={C.ink} opacity={0.18} />

    <ellipse cx={50} cy={64} rx={36} ry={24} fill="url(#moleKing-fur)" stroke={C.ink} strokeWidth={4} />
    <g clipPath="url(#moleKing-trunk)">
      <ellipse cx={68} cy={74} rx={34} ry={22} fill={C.mochaDeep} opacity={0.6} />
      <ellipse cx={28} cy={52} rx={18} ry={7} transform="rotate(-16 28 52)" fill={C.white} opacity={0.14} />
    </g>

    {/* Tiny ears peek out from behind the head */}
    <circle cx={26} cy={20} r={7} fill={C.mochaDeep} stroke={C.ink} strokeWidth={4} />
    <circle cx={74} cy={20} r={7} fill={C.mochaDeep} stroke={C.ink} strokeWidth={4} />
    <path d="M22,17 A5,5 0 0 1 29,16 M70,17 A5,5 0 0 1 77,16" stroke={C.white} strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.3} />

    <circle cx={50} cy={36} r={27} fill="url(#moleKing-fur)" stroke={C.ink} strokeWidth={4} />
    <g clipPath="url(#moleKing-skull)">
      {/* Shaded cheek, sunlit brow ridge, then fur tufts on the dark side */}
      <ellipse cx={64} cy={50} rx={26} ry={24} fill={C.mochaDeep} opacity={0.5} />
      <ellipse cx={36} cy={22} rx={16} ry={9} transform="rotate(-24 36 22)" fill={C.sand} opacity={0.32} />
      <path d="M23.9,29 A27,27 0 0 1 52.4,9.1 L51.8,15.1 A21,21 0 0 0 29.7,30.6 Z" fill={C.white} opacity={0.3} />
      <path
        d="M70,52 Q76,45 76,36 M63,58 Q69,51 70,42 M74,40 Q79,33 77,26 M56,60 Q62,54 63,46 M70,26 Q75,20 73,13"
        stroke={C.mochaDeep}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
    </g>

    {/* Lit muzzle: paper pad, white on the top curve, sand shade tucked under */}
    <ellipse cx={50} cy={50} rx={19} ry={12} fill={C.paper} stroke={C.ink} strokeWidth={3} />
    <path d="M34,52 Q50,64 66,52 Q50,60 34,52 Z" fill={C.sandDeep} opacity={0.55} />
    <ellipse cx={44} cy={45} rx={10} ry={3.6} transform="rotate(-12 44 45)" fill={C.white} opacity={0.55} />

    {/* Buck teeth tuck under the nose, each with a shaded right face */}
    <rect x={44} y={54} width={6} height={10} rx={1.5} fill={C.white} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <rect x={51} y={54} width={6} height={10} rx={1.5} fill={C.white} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M48.2,55.5 H49 V62.5 H48.2 Z M55.2,55.5 H56 V62.5 H55.2 Z" fill={C.sandDeep} opacity={0.7} />

    <circle cx={50} cy={45} r={9} fill={C.berry} stroke={C.ink} strokeWidth={3} />
    <path d="M43,49 A9,9 0 0 0 57,49 A7,7 0 0 1 43,49 Z" fill={C.berryDeep} />
    <ellipse cx={46.5} cy={41.5} rx={3.2} ry={2.1} transform="rotate(-32 46.5 41.5)" fill={C.white} opacity={0.6} />

    {/* Boss brows: thicker than the small foes' and pressed down onto the eyes */}
    <path d="M30,20 L46,25" stroke={C.ink} strokeWidth={6} strokeLinecap="round" fill="none" />
    <path d="M70,20 L54,25" stroke={C.ink} strokeWidth={6} strokeLinecap="round" fill="none" />
    <circle cx={34} cy={33} r={9} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={66} cy={33} r={9} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={34} cy={34} r={6.4} fill={C.sun} />
    <circle cx={66} cy={34} r={6.4} fill={C.sun} />
    <circle cx={34} cy={34} r={3.9} fill={C.ink} />
    <circle cx={66} cy={34} r={3.9} fill={C.ink} />
    <ellipse cx={34} cy={38.4} rx={3} ry={1.5} fill={C.white} opacity={0.42} />
    <ellipse cx={66} cy={38.4} rx={3} ry={1.5} fill={C.white} opacity={0.42} />
    <circle cx={31.2} cy={30.6} r={2} fill={C.white} />
    <circle cx={63.2} cy={30.6} r={2} fill={C.white} />

    {/* Metal crown: gold face, deep flank on the right, a berry jewel with a glint */}
    <path
      d="M34,17 L34,6 L42,12 L50,4 L58,12 L66,6 L66,17 Z"
      fill="url(#moleKing-crown)"
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <path d="M60,11 L65.5,6.5 L65.5,16.5 L60,16.5 Z" fill={C.goldDeep} />
    <path d="M34.5,6.8 L39.5,10.6 L39.5,16.5 L34.5,16.5 Z" fill={C.white} opacity={0.45} />
    <path d="M36,16 H64" stroke={C.goldDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
    <circle cx={50} cy={14} r={3.4} fill={C.berry} stroke={C.ink} strokeWidth={2.5} />
    <circle cx={48.8} cy={12.8} r={1.1} fill={C.white} />

    {/* Dirt mound in front of the body, lit along the crest */}
    <path d="M4,96 C8,78 26,70 50,70 C74,70 92,78 96,96 Z" fill="url(#moleKing-dirt)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <g clipPath="url(#moleKing-moundClip)">
      <path d="M4,96 C8,78 26,70 50,70 C74,70 92,78 96,96 L90,96 C86,80 71,76 50,76 C29,76 14,80 10,96 Z" fill={C.sand} opacity={0.42} />
      <ellipse cx={50} cy={106} rx={54} ry={22} fill={C.mochaDeep} opacity={0.45} />
    </g>
    <ellipse cx={44} cy={90} rx={6} ry={3.5} fill={C.sand} stroke={C.ink} strokeWidth={3} />
    <ellipse cx={58} cy={82} rx={5} ry={3} fill={C.sand} stroke={C.ink} strokeWidth={3} />
    <ellipse cx={44.6} cy={91} rx={5} ry={2.2} fill={C.sandDeep} opacity={0.75} />
    <ellipse cx={58.6} cy={83} rx={4.2} ry={1.9} fill={C.sandDeep} opacity={0.75} />
    <ellipse cx={42} cy={88.4} rx={2.2} ry={1} fill={C.white} opacity={0.55} />
    <ellipse cx={56.2} cy={80.6} rx={1.9} ry={0.9} fill={C.white} opacity={0.55} />

    <ellipse cx={22} cy={76} rx={13} ry={10} fill={C.mochaDeep} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={78} cy={76} rx={13} ry={10} fill={C.mochaDeep} stroke={C.ink} strokeWidth={4} />
    {/* Lit knuckles on top of each mitt, so the paws stop reading as flat holes */}
    <path d="M12,73 Q22,64 32,73 Q22,68 12,73 Z M68,73 Q78,64 88,73 Q78,68 68,73 Z" fill={C.mocha} opacity={0.85} />
    <ellipse cx={18} cy={70.5} rx={6} ry={2.2} transform="rotate(-12 18 70.5)" fill={C.white} opacity={0.28} />
    <ellipse cx={74} cy={70.5} rx={6} ry={2.2} transform="rotate(-12 74 70.5)" fill={C.white} opacity={0.28} />
    {/* Toe seams, kept inside the paws so they read as chunky digging mitts */}
    <path
      d="M15,78 L14,83 M22,80 L22,85 M29,78 L30,83 M85,78 L86,83 M78,80 L78,85 M71,78 L70,83"
      stroke={C.ink}
      strokeWidth={3}
      strokeLinecap="round"
      fill="none"
    />
    {/* Claw tips catching the light at the front edge of the mitts */}
    <path
      d="M13.6,83.6 L15,82 L16,84 Z M21.4,85.6 L23,84.4 L23.4,86.6 Z M29.6,83.6 L31.4,82.6 L31.2,85 Z
         M86.4,83.6 L85,82 L84,84 Z M78.6,85.6 L77,84.4 L76.6,86.6 Z M70.4,83.6 L68.6,82.6 L68.8,85 Z"
      fill={C.sand}
    />
  </svg>
);
