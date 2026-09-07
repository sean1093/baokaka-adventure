import type { Sprite } from '../sprite';
import { C } from '../palette';

/**
 * Vendor, the market lady of the town square. Plump and cheerful, two heads tall:
 * a spotted berry headscarf knotted at the side, a cream apron over her sky blouse,
 * and both hands planted on her hips so her silhouette reads as "shopkeeper, ask me".
 */
export const Vendor: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* Shoes on the ground line; the skirt covers where they join */}
    <ellipse cx={36} cy={92} rx={9.5} ry={5.5} fill={C.berryDeep} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={64} cy={92} rx={9.5} ry={5.5} fill={C.berryDeep} stroke={C.ink} strokeWidth={4} />

    {/* Narrow bodice, then a bell skirt: the elbows need clear sky beside the waist */}
    <path d="M33,48 C28,52 28,60 30,70 L70,70 C72,60 72,52 67,48 Z" fill={C.sky} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path
      d="M30,66 L70,66 C78,72 84,82 84,90 L16,90 C16,82 22,72 30,66 Z"
      fill={C.sky}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />

    {/* Arms akimbo: an ink underlay under a sky stroke gives each bent arm its outline */}
    <path d="M33,54 Q8,64 31,72" stroke={C.ink} strokeWidth={12} strokeLinecap="round" fill="none" />
    <path d="M67,54 Q92,64 69,72" stroke={C.ink} strokeWidth={12} strokeLinecap="round" fill="none" />
    <path d="M33,54 Q8,64 31,72" stroke={C.sky} strokeWidth={7} strokeLinecap="round" fill="none" />
    <path d="M67,54 Q92,64 69,72" stroke={C.sky} strokeWidth={7} strokeLinecap="round" fill="none" />

    {/* Cream apron with its waist tie, over the skirt and under the hands */}
    <path d="M41,54 L59,54 L67,84 Q50,90 33,84 Z" fill={C.cream} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M35,66 Q50,71 65,66" stroke={C.sandDeep} strokeWidth={4} strokeLinecap="round" fill="none" />
    <circle cx={30} cy={74} r={6} fill={C.paper} stroke={C.ink} strokeWidth={3} />
    <circle cx={70} cy={74} r={6} fill={C.paper} stroke={C.ink} strokeWidth={3} />

    <circle cx={50} cy={26} r={23} fill={C.paper} stroke={C.ink} strokeWidth={4} />
    {/* Dark fringe; the scarf covers all but a band of it */}
    <path d="M29.8,15 Q50,33 70.2,15 Q50,24 29.8,15 Z" fill={C.ink} />

    {/* Headscarf, knotted off to one side */}
    <ellipse cx={77} cy={19} rx={7.5} ry={6.5} fill={C.berry} stroke={C.ink} strokeWidth={3} />
    <path d="M78,24 Q90,28 85,35 Q78,30 74,26 Z" fill={C.berry} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M29.8,15 A23,23 0 0 1 70.2,15 Q50,25 29.8,15 Z" fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={38} cy={12} r={2.4} fill={C.white} />
    <circle cx={50} cy={7} r={2.4} fill={C.white} />
    <circle cx={62} cy={12} r={2.4} fill={C.white} />
    <circle cx={44} cy={19} r={2.2} fill={C.white} />
    <circle cx={56} cy={19} r={2.2} fill={C.white} />

    <circle cx={35} cy={41} r={5.5} fill={C.berry} opacity={0.65} />
    <circle cx={65} cy={41} r={5.5} fill={C.berry} opacity={0.65} />
    <ellipse cx={41} cy={33} rx={4.4} ry={4.8} fill={C.ink} />
    <ellipse cx={59} cy={33} rx={4.4} ry={4.8} fill={C.ink} />
    <circle cx={39.4} cy={31} r={1.6} fill={C.white} />
    <circle cx={57.4} cy={31} r={1.6} fill={C.white} />
    <path d="M48,39 Q50,41 52,39" stroke={C.ink} strokeWidth={2.5} strokeLinecap="round" fill="none" />
    {/* Open smile */}
    <path d="M43,42 Q50,50 57,42 Z" fill={C.berryDeep} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
  </svg>
);

/**
 * Uncle, the douhua seller. An old man under a straw hat: white moustache above a big
 * open grin, sky shirt and grey trousers, one arm up mid-wave so he reads as friendly
 * from across the map.
 */
export const Uncle: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <ellipse cx={36} cy={93.5} rx={9.5} ry={4.5} fill={C.sandDeep} stroke={C.ink} strokeWidth={3.5} />
    <ellipse cx={64} cy={93.5} rx={9.5} ry={4.5} fill={C.sandDeep} stroke={C.ink} strokeWidth={3.5} />

    {/* Grey trousers, two legs cut from one shape */}
    <path
      d="M27,76 L73,76 L71,92 L55,92 L52,84 L48,84 L45,92 L29,92 Z"
      fill={C.grey}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    {/* Sky shirt */}
    <path
      d="M37,56 C29,60 26,70 26,80 L74,80 C74,70 71,60 63,56 Z"
      fill={C.sky}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    {/* Arms: one hanging, one raised in a wave */}
    <path d="M32,64 Q22,74 21,84" stroke={C.ink} strokeWidth={14} strokeLinecap="round" fill="none" />
    <path d="M68,62 Q80,56 86,46" stroke={C.ink} strokeWidth={14} strokeLinecap="round" fill="none" />
    <path d="M32,64 Q22,74 21,84" stroke={C.sky} strokeWidth={8} strokeLinecap="round" fill="none" />
    <path d="M68,62 Q80,56 86,46" stroke={C.sky} strokeWidth={8} strokeLinecap="round" fill="none" />
    <circle cx={20} cy={86} r={6.5} fill={C.paper} stroke={C.ink} strokeWidth={3} />
    <circle cx={88} cy={41} r={7.5} fill={C.paper} stroke={C.ink} strokeWidth={3.5} />
    <path d="M85,38 L85,44 M90,39 L90,45" stroke={C.ink} strokeWidth={2} strokeLinecap="round" fill="none" />

    <ellipse cx={27} cy={39} rx={4} ry={5.5} fill={C.paper} stroke={C.ink} strokeWidth={3} />
    <ellipse cx={73} cy={39} rx={4} ry={5.5} fill={C.paper} stroke={C.ink} strokeWidth={3} />
    <circle cx={50} cy={37} r={23} fill={C.paper} stroke={C.ink} strokeWidth={4} />

    {/* Straw hat: crown, band, then the wide brim over both */}
    <path d="M34,23 Q34,4 50,4 Q66,4 66,23 Z" fill={C.sand} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M38,16 Q50,21 62,16 L61,8 Q50,13 39,8 Z" fill={C.sandDeep} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    <ellipse cx={50} cy={22} rx={38} ry={8.5} fill={C.sand} stroke={C.ink} strokeWidth={4} />

    {/* Bushy brows sit just below the brim so they still read */}
    <path d="M37,33 Q42,30 47,33" stroke={C.grey} strokeWidth={4} strokeLinecap="round" fill="none" />
    <path d="M63,33 Q58,30 53,33" stroke={C.grey} strokeWidth={4} strokeLinecap="round" fill="none" />
    <ellipse cx={42} cy={38.5} rx={4} ry={4.4} fill={C.ink} />
    <ellipse cx={58} cy={38.5} rx={4} ry={4.4} fill={C.ink} />
    <circle cx={40.6} cy={36.8} r={1.5} fill={C.white} />
    <circle cx={56.6} cy={36.8} r={1.5} fill={C.white} />
    <circle cx={50} cy={43.5} r={3.4} fill={C.berry} opacity={0.5} />

    {/* Big grin with a strip of teeth, the moustache riding above it */}
    <path d="M44,52.5 Q50,59 56,52.5 Z" fill={C.ink} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M45.5,53 L54.5,53 L53.5,55.5 L46.5,55.5 Z" fill={C.white} />
    <path
      d="M34,46 Q42,41 50,45 Q58,41 66,46 Q58,53 50,48.5 Q42,53 34,46 Z"
      fill={C.white}
      stroke={C.ink}
      strokeWidth={2.5}
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * ToyBox, the treasure chest of this game: a domed berry lid with a gold latch and a
 * gold star on the front. The dome plus the two gold marks are what make it read as
 * "treasure" rather than "crate" at 60px.
 */
export const ToyBox: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* Round feet, drawn first so the body hides their tops */}
    <circle cx={26} cy={88} r={6.5} fill={C.sandDeep} stroke={C.ink} strokeWidth={4} />
    <circle cx={74} cy={88} r={6.5} fill={C.sandDeep} stroke={C.ink} strokeWidth={4} />

    {/* Wooden body with planks and a base band */}
    <rect x={12} y={42} width={76} height={44} rx={4} fill={C.sand} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <line x1={26} y1={46} x2={26} y2={82} stroke={C.sandDeep} strokeWidth={4} strokeLinecap="round" />
    <line x1={74} y1={46} x2={74} y2={82} stroke={C.sandDeep} strokeWidth={4} strokeLinecap="round" />
    <rect x={12} y={78} width={76} height={8} fill={C.sandDeep} stroke={C.ink} strokeWidth={3} />

    {/* Domed lid, closed: the band across its foot is the shut seam */}
    <path d="M8,44 Q8,14 50,14 Q92,14 92,44 Z" fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M82,42 Q82,22 64,17" stroke={C.berryDeep} strokeWidth={5} strokeLinecap="round" fill="none" />
    <rect x={8} y={36} width={84} height={10} rx={3} fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />

    {/* Gold latch over the seam */}
    <rect x={44} y={35} width={12} height={13} rx={3} fill={C.sun} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />

    {/* Gold star on the front */}
    <polygon
      points="50,52 53.5,61.2 63.3,61.7 55.7,67.9 58.2,77.3 50,72 41.8,77.3 44.3,67.9 36.7,61.7 46.5,61.2"
      fill={C.sun}
      stroke={C.ink}
      strokeWidth={3}
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * ToyBoxOpen: the same chest with its lid tipped back, latch and all. The dark mouth,
 * the gold block of loot rising out of it and the ball behind are the three cues that
 * tell it apart from ToyBox at a glance.
 */
export const ToyBoxOpen: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* Lid tipped back and foreshortened; its front band and latch now face upward */}
    <g transform="rotate(-14 50 28)">
      <path d="M20,28 Q20,6 50,6 Q80,6 80,28 Z" fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <rect x={18} y={22} width={64} height={9} rx={3} fill={C.berryDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <rect x={44.5} y={20} width={11} height={12} rx={3} fill={C.sun} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    </g>

    <circle cx={26} cy={88} r={6.5} fill={C.sandDeep} stroke={C.ink} strokeWidth={4} />
    <circle cx={74} cy={88} r={6.5} fill={C.sandDeep} stroke={C.ink} strokeWidth={4} />

    <rect x={12} y={52} width={76} height={34} rx={4} fill={C.sand} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <line x1={26} y1={58} x2={26} y2={82} stroke={C.sandDeep} strokeWidth={4} strokeLinecap="round" />
    <line x1={74} y1={58} x2={74} y2={82} stroke={C.sandDeep} strokeWidth={4} strokeLinecap="round" />
    <rect x={12} y={78} width={76} height={8} fill={C.sandDeep} stroke={C.ink} strokeWidth={3} />

    {/* Open mouth of the chest */}
    <ellipse cx={50} cy={52} rx={38} ry={10} fill={C.mochaDeep} stroke={C.ink} strokeWidth={4} />

    {/* A ball tucked in beside the loot */}
    <circle cx={70} cy={45} r={10} fill={C.berry} stroke={C.ink} strokeWidth={4} />
    <path d="M60,42 Q70,38 80,42" stroke={C.white} strokeWidth={4.5} strokeLinecap="round" fill="none" />

    {/* Glowing loot with a highlight */}
    <rect x={24} y={37} width={44} height={20} rx={9} fill={C.sun} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={31} y={42} width={18} height={6} rx={3} fill={C.cream} />

    {/* Front half of the mouth, over the contents: this is what puts them inside the box */}
    <path d="M12,52 A38,10 0 0 0 88,52 Z" fill={C.mochaDeep} />
    <path d="M12,52 A38,10 0 0 0 88,52" fill="none" stroke={C.ink} strokeWidth={4} />
  </svg>
);

/**
 * Signpost: one arrow board on a wooden post, standing in a grass tuft. The face is left
 * blank on purpose - scene labels are drawn by the UI, never inside a sprite.
 */
export const Signpost: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <rect x={42} y={12} width={15} height={80} rx={4} fill={C.sand} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <line x1={47} y1={20} x2={47} y2={84} stroke={C.sandDeep} strokeWidth={3} strokeLinecap="round" />
    <line x1={53} y1={24} x2={53} y2={80} stroke={C.sandDeep} strokeWidth={3} strokeLinecap="round" />

    {/* Arrow board pointing right */}
    <polygon
      points="24,26 78,26 96,40 78,54 24,54"
      fill={C.paper}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <circle cx={31} cy={33} r={2.4} fill={C.sandDeep} />
    <circle cx={31} cy={47} r={2.4} fill={C.sandDeep} />

    {/* Grass tuft hiding the foot of the post */}
    <path
      d="M12,96 Q18,76 26,94 Q32,70 40,94 Q48,68 56,94 Q64,72 72,94 Q80,78 88,96 Z"
      fill={C.leaf}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <path d="M30,92 Q32,84 34,80" stroke={C.leafDeep} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M66,92 Q68,84 70,80" stroke={C.leafDeep} strokeWidth={3} strokeLinecap="round" fill="none" />
  </svg>
);

/**
 * NapMat, the inn marker: a sky mat seen from a low angle, a cream pillow lying on it
 * and a blanket folded back over its foot. The star and the stroked zZ carry the "rest
 * here" meaning at 60px, where the mat alone would just be a blue rectangle.
 */
export const NapMat: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <rect
      x={12}
      y={46}
      width={76}
      height={46}
      rx={12}
      fill={C.sky}
      stroke={C.ink}
      strokeWidth={4}
      transform="rotate(-8 50 70)"
    />
    {/* Pillow lying on the mat, well inside its head end */}
    <rect
      x={24}
      y={51}
      width={52}
      height={17}
      rx={8}
      fill={C.cream}
      stroke={C.ink}
      strokeWidth={4}
      transform="rotate(-8 50 60)"
    />
    {/* Blanket over the foot of the mat, with its top edge folded back */}
    <rect
      x={20}
      y={72}
      width={60}
      height={18}
      rx={8}
      fill={C.skyDeep}
      stroke={C.ink}
      strokeWidth={3}
      transform="rotate(-8 50 81)"
    />
    <rect
      x={22}
      y={70}
      width={56}
      height={8}
      rx={4}
      fill={C.cream}
      stroke={C.ink}
      strokeWidth={3}
      transform="rotate(-8 50 74)"
    />

    {/* Sleepy zZ, ink underlay so the white reads on any floor colour */}
    <path d="M30,8 L48,8 L30,28 L48,28" stroke={C.ink} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M30,8 L48,8 L30,28 L48,28" stroke={C.white} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M12,28 L23,28 L12,40 L23,40" stroke={C.ink} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M12,28 L23,28 L12,40 L23,40" stroke={C.white} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />

    <polygon
      points="78,10 81.4,18.9 91,19.4 83.6,25.4 86,34.6 78,29.5 70,34.6 72.4,25.4 65,19.4 74.6,18.9"
      fill={C.sun}
      stroke={C.ink}
      strokeWidth={3}
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Bathtub, the bath-time scene marker: a white clawfoot tub with sky water and three
 * bubbles climbing out of it. Grey does the shading so the shell stays white against
 * the cream backgrounds.
 */
export const Bathtub: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* Claw feet, drawn first so the shell overlaps their tops */}
    <path d="M18,78 L34,78 L32,92 Q26,98 20,92 Z" fill={C.sandDeep} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
    <path d="M66,78 L82,78 L80,92 Q74,98 68,92 Z" fill={C.sandDeep} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
    <path d="M23,93 L23,97 M29,92 L29,96" stroke={C.ink} strokeWidth={2} strokeLinecap="round" fill="none" />
    <path d="M71,93 L71,97 M77,92 L77,96" stroke={C.ink} strokeWidth={2} strokeLinecap="round" fill="none" />

    {/* Shell */}
    <path
      d="M11,40 C11,78 24,88 50,88 C76,88 89,78 89,40 Z"
      fill={C.white}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <path d="M78,52 C78,72 68,82 52,84" stroke={C.grey} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M22,52 C22,60 23,66 26,72" stroke={C.grey} strokeWidth={4} strokeLinecap="round" fill="none" />

    {/* Rim, then the water sitting inside it */}
    <ellipse cx={50} cy={40} rx={39} ry={11} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={50} cy={41} rx={31} ry={7.6} fill="none" stroke={C.grey} strokeWidth={3} />
    <ellipse cx={50} cy={41.5} rx={29} ry={6.4} fill={C.sky} stroke={C.skyDeep} strokeWidth={2.5} />

    <circle cx={34} cy={26} r={6.5} fill={C.white} stroke={C.ink} strokeWidth={3} />
    <circle cx={53} cy={15} r={8} fill={C.white} stroke={C.ink} strokeWidth={3} />
    <circle cx={68} cy={29} r={5} fill={C.white} stroke={C.ink} strokeWidth={3} />
  </svg>
);
