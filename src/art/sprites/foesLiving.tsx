import type { Sprite } from '../sprite';
import { C } from '../palette';

/**
 * Dust Bunny: seven lumps of different sizes overlap one ball, the way the Tree's crown
 * is built. Uneven placement is deliberate; a symmetric ring of lumps reads as a flower.
 * Every lump reuses one radial gradient, so each shades as its own little sphere and the
 * whole clump reads as fuzz with depth rather than a grey blob.
 */
export const DustBunny: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      {/* Ball: pale where the light lands at the upper left, deep grey opposite */}
      <radialGradient id="dustBunny-ball" cx="0.34" cy="0.26" r="0.86">
        <stop offset="0" stopColor={C.paper} />
        <stop offset="0.42" stopColor={C.grey} />
        <stop offset="1" stopColor={C.greyDeep} />
      </radialGradient>
      {/* Shared by all seven lumps; objectBoundingBox units give each its own falloff */}
      <radialGradient id="dustBunny-lump" cx="0.33" cy="0.28" r="0.84">
        <stop offset="0" stopColor={C.grey} />
        <stop offset="1" stopColor={C.greyDeep} />
      </radialGradient>
      <clipPath id="dustBunny-body">
        <circle cx={50} cy={50} r={31} />
      </clipPath>
    </defs>

    {/* Contact shadow: without it the clump floats off the carpet */}
    <ellipse cx={50} cy={95} rx={29} ry={4.5} fill={C.ink} opacity={0.18} />

    {/* Stray hairs; the lumps cover their roots */}
    <path d="M28,40 L10,22" stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M46,22 L41,5" stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M48,22 L60,6" stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" />

    {/* Fuzz spikes poking out of the gaps between the lumps, shaded so they sit under the ball */}
    <path
      d="M22,44 L5,48 L21,55 Z M30,75 L12,83 L20,66 Z M68,79 L86,86 L79,69 Z M82,40 L96,47 L84,57 Z"
      fill={C.greyDeep}
      stroke={C.ink}
      strokeWidth={3.5}
      strokeLinejoin="round"
    />

    <circle cx={24} cy={38} r={13} fill="url(#dustBunny-lump)" stroke={C.ink} strokeWidth={4} />
    <circle cx={18} cy={60} r={11} fill="url(#dustBunny-lump)" stroke={C.ink} strokeWidth={4} />
    <circle cx={34} cy={78} r={12} fill="url(#dustBunny-lump)" stroke={C.ink} strokeWidth={4} />
    <circle cx={62} cy={80} r={10} fill="url(#dustBunny-lump)" stroke={C.ink} strokeWidth={4} />
    <circle cx={80} cy={62} r={13} fill="url(#dustBunny-lump)" stroke={C.ink} strokeWidth={4} />
    <circle cx={76} cy={34} r={11} fill="url(#dustBunny-lump)" stroke={C.ink} strokeWidth={4} />
    <circle cx={46} cy={22} r={13} fill="url(#dustBunny-lump)" stroke={C.ink} strokeWidth={4} />
    {/* Pale rim on the two lumps that catch the light */}
    <path
      d="M13.5,34 A13,13 0 0 1 26,25.5 M35.5,17.5 A13,13 0 0 1 48,9.5"
      stroke={C.white}
      strokeWidth={3.5}
      strokeLinecap="round"
      opacity={0.42}
      fill="none"
    />

    <circle cx={50} cy={50} r={31} fill="url(#dustBunny-ball)" stroke={C.ink} strokeWidth={4} />

    <g clipPath="url(#dustBunny-body)">
      {/* Tufted fuzz following the curve of the shaded side */}
      <path
        d="M64,74 Q72,66 74,56 M55,79 Q61,71 62,60 M74,58 Q78,50 77,42"
        stroke={C.greyDeep}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      {/* Rim light along the upper-left curve */}
      <path d="M20.1,42 A31,31 0 0 1 51.1,19 L50.9,25 A25,25 0 0 0 25.9,43.5 Z" fill={C.white} opacity={0.34} />
    </g>
    {/* Specular pop on the top-left shoulder of the ball */}
    <ellipse cx={32} cy={30} rx={6.5} ry={4} transform="rotate(-38 32 30)" fill={C.white} opacity={0.26} />

    {/* Caught lint: one pale fleck plus a speck of grit */}
    <ellipse cx={26} cy={64} rx={5} ry={2.4} fill={C.cream} transform="rotate(-25 26 64)" />
    <circle cx={74} cy={66} r={2.4} fill={C.ink} />

    {/* Brows angled down toward the middle: cheeky, not sweet */}
    <path d="M28,32 L41,35" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" fill="none" />
    <path d="M72,32 L59,35" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" fill="none" />

    {/* Eyes: sclera, amber iris ring, ink pupil, highlight up-left */}
    <circle cx={35} cy={48} r={9.5} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={65} cy={48} r={9.5} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={36} cy={49} r={6} fill={C.sun} />
    <circle cx={64} cy={49} r={6} fill={C.sun} />
    <circle cx={36} cy={49} r={3.6} fill={C.ink} />
    <circle cx={64} cy={49} r={3.6} fill={C.ink} />
    <ellipse cx={36} cy={53.2} rx={3} ry={1.5} fill={C.white} opacity={0.4} />
    <ellipse cx={64} cy={53.2} rx={3} ry={1.5} fill={C.white} opacity={0.4} />
    <circle cx={33.2} cy={45.6} r={2.3} fill={C.white} />
    <circle cx={61.2} cy={45.6} r={2.3} fill={C.white} />

    {/* Wide grin with two little fangs; wine throat instead of a flat ink hole */}
    <path d="M33,62 Q50,80 67,62 Z" fill={C.wineDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M42,68 Q50,78 58,68 Z" fill={C.wine} />
    <polygon points="39,62 46,62 42.5,68" fill={C.white} />
    <polygon points="54,62 61,62 57.5,68" fill={C.white} />
  </svg>
);

/**
 * Sock Monster: the Sock target grown a scowling face, dirt patches and a stink cloud.
 * The knit is carried by a ribbed cuff and rows of C.skyDeep stitches; the crook where the
 * leg meets the foot takes the deepest fold shadow, which is what makes it read as cloth.
 */
export const SockMonster: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id="sockMonster-knit" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor={C.sky} />
        <stop offset="0.6" stopColor={C.sky} />
        <stop offset="1" stopColor={C.skyDeep} />
      </linearGradient>
      <clipPath id="sockMonster-body">
        <path d="M16,30 L70,30 L70,52 Q70,64 84,64 Q96,64 96,78 Q96,92 82,92 L34,92 Q16,92 16,74 Z" />
      </clipPath>
      <clipPath id="sockMonster-cuffClip">
        <rect x={12} y={16} width={62} height={18} rx={9} />
      </clipPath>
    </defs>

    {/* Contact shadow under the sole */}
    <ellipse cx={56} cy={95} rx={35} ry={4} fill={C.ink} opacity={0.18} />

    {/* Stink: a soft green haze with three wobbles thinning as they rise */}
    <ellipse cx={34} cy={9} rx={25} ry={9} fill={C.leaf} opacity={0.14} />
    <path d="M20,15 C15,11 25,9 20,3" fill="none" stroke={C.leaf} strokeWidth={3} strokeLinecap="round" opacity={0.85} />
    <path d="M34,14 C29,10 39,8 34,3" fill="none" stroke={C.leaf} strokeWidth={3} strokeLinecap="round" opacity={0.62} />
    <path d="M48,15 C43,11 53,9 48,4" fill="none" stroke={C.leaf} strokeWidth={3} strokeLinecap="round" opacity={0.45} />
    <circle cx={27} cy={5} r={1.8} fill={C.leaf} opacity={0.5} />
    <circle cx={42} cy={7} r={1.5} fill={C.leaf} opacity={0.38} />

    {/* Upright sock: leg on the left, foot pointing right */}
    <path
      d="M16,30 L70,30 L70,52 Q70,64 84,64 Q96,64 96,78 Q96,92 82,92 L34,92 Q16,92 16,74 Z"
      fill="url(#sockMonster-knit)"
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />

    <g clipPath="url(#sockMonster-body)">
      {/* Cel shadow: the whole right flank plus the ankle crook it folds into */}
      <path d="M60,26 Q64,44 69,54 Q74,66 88,68 L100,68 L100,26 Z" fill={C.skyDeep} opacity={0.85} />
      {/* Sole shadow, curving up into the heel */}
      <path d="M12,74 Q14,98 36,98 L86,98 Q100,98 100,72 Q97,86 84,86 L36,86 Q22,86 20,72 Z" fill={C.skyDeep} />
      {/* Highlight down the lit left edge and across the top of the foot */}
      <path d="M20,32 Q22,58 25,80 L33,77 Q30,56 29,32 Z" fill={C.white} opacity={0.3} />
      <path d="M40,72 Q56,68 72,70 L72,75 Q56,73 41,77 Z" fill={C.white} opacity={0.18} />
      {/* Knit stitches: chevron rows on the shin and over the toe */}
      <path
        d="M21,36 l4,4 l4,-4 M31,36 l4,4 l4,-4 M41,36 l4,4 l4,-4 M51,36 l4,4 l4,-4 M61,36 l4,4 l4,-4
           M75,72 l4,4 l4,-4 M75,82 l4,4 l4,-4 M85,77 l4,4 l4,-4"
        stroke={C.skyDeep}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity={0.75}
      />
    </g>
    {/* Ankle fold and heel crease, in the fill's own deep tone rather than black */}
    <path d="M66,50 Q70,63 82,66" fill="none" stroke={C.skyDeep} strokeWidth={3} strokeLinecap="round" />
    <path d="M78,66 Q84,78 78,90" fill="none" stroke={C.skyDeep} strokeWidth={3} strokeLinecap="round" />

    {/* Ribbed cuff: cream knit with blue ribbing, lit on the roll and shaded underneath */}
    <rect x={12} y={16} width={62} height={18} rx={9} fill={C.cream} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <g clipPath="url(#sockMonster-cuffClip)">
      <path d="M12,28 L74,28 L74,34 L12,34 Z" fill={C.sandDeep} opacity={0.38} />
      <path
        d="M20,15 L20,35 M27,15 L27,35 M34,15 L34,35 M41,15 L41,35 M48,15 L48,35 M55,15 L55,35 M62,15 L62,35 M69,15 L69,35"
        stroke={C.skyDeep}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
        opacity={0.55}
      />
      <path d="M14,17 L72,17 L72,21 L14,21 Z" fill={C.white} opacity={0.4} />
    </g>
    <path d="M14,34 Q43,37 72,34" fill="none" stroke={C.sandDeep} strokeWidth={2} strokeLinecap="round" />

    {/* Ground-in dirt, each smudge with a lit top and a darker core */}
    <ellipse cx={28} cy={84} rx={6.5} ry={4.5} fill={C.sandDeep} />
    <ellipse cx={27} cy={82.5} rx={4.5} ry={2.4} fill={C.sand} opacity={0.6} />
    <ellipse cx={88} cy={76} rx={6} ry={5} fill={C.sandDeep} />
    <ellipse cx={87} cy={74.5} rx={4} ry={2.4} fill={C.sand} opacity={0.6} />
    <circle cx={33} cy={88} r={1.6} fill={C.mochaDeep} opacity={0.7} />
    <circle cx={83} cy={81} r={1.5} fill={C.mochaDeep} opacity={0.7} />

    {/* Face sits on the heel, the widest part of the sock */}
    <path d="M24,42 L38,47" stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M64,42 L50,47" stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" />
    <circle cx={32} cy={60} r={10} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={56} cy={60} r={10} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={33} cy={61} r={6.3} fill={C.sun} />
    <circle cx={57} cy={61} r={6.3} fill={C.sun} />
    <circle cx={33} cy={61} r={3.8} fill={C.ink} />
    <circle cx={57} cy={61} r={3.8} fill={C.ink} />
    <ellipse cx={33} cy={65.4} rx={3} ry={1.5} fill={C.white} opacity={0.4} />
    <ellipse cx={57} cy={65.4} rx={3} ry={1.5} fill={C.white} opacity={0.4} />
    <circle cx={30} cy={57.4} r={2.2} fill={C.white} />
    <circle cx={54} cy={57.4} r={2.2} fill={C.white} />

    <path d="M32,74 Q44,90 56,74 Z" fill={C.wineDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M38,79 Q44,87 50,79 Z" fill={C.wine} />
    <polygon points="36,74 42,74 39,79" fill={C.white} />
    <polygon points="46,74 52,74 49,79" fill={C.white} />
  </svg>
);

/**
 * Block Golem, the living-room boss. Four raised arm blocks and a leg-block stance
 * push the silhouette to the edges of the box so it towers over the small foes.
 * Every brick gets a lit top face and an L of its own Deep tone down the right and bottom,
 * so the stack reads as moulded plastic cubes; the gold crown studs mark it as the boss.
 */
export const BlockGolem: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      <radialGradient id="blockGolem-aura" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0.34" stopColor={C.gold} stopOpacity={0} />
        <stop offset="0.66" stopColor={C.gold} stopOpacity={0.26} />
        <stop offset="1" stopColor={C.gold} stopOpacity={0} />
      </radialGradient>
    </defs>

    {/* Boss glow, so it out-reads the small foes at a glance */}
    <rect x={0} y={0} width={100} height={100} fill="url(#blockGolem-aura)" />
    <ellipse cx={50} cy={96} rx={44} ry={4.5} fill={C.ink} opacity={0.18} />

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

    {/* Right-and-bottom shadow faces, one path per Deep tone */}
    <path d="M36,80 H42 V94 H22 V88 H36 Z M72,80 H78 V94 H58 V88 H72 Z" fill={C.mochaDeep} opacity={0.75} />
    <path d="M42,40 H48 V56 H30 V50 H42 Z" fill={C.berryDeep} />
    <path d="M64,40 H70 V56 H52 V50 H64 Z" fill={C.sunDeep} />
    <path d="M42,60 H48 V76 H30 V70 H42 Z" fill={C.skyDeep} />
    <path d="M64,60 H70 V76 H52 V70 H64 Z" fill={C.leafDeep} />
    <path
      d="M20,18 H26 V36 H8 V30 H20 Z M86,18 H92 V36 H74 V30 H86 Z M14.5,10 H16.5 V17 H14.5 Z M23.5,10 H25.5 V17 H23.5 Z
         M79.5,10 H81.5 V17 H79.5 Z M88.5,10 H90.5 V17 H88.5 Z"
      fill={C.plumDeep}
    />
    <path d="M20,40 H26 V58 H8 V52 H20 Z M86,40 H92 V58 H74 V52 H86 Z M60,6 H66 V34 H34 V28 H60 Z" fill={C.sandDeep} />

    {/* Lit top faces: the flat plastic surface every brick turns to the light */}
    <path
      d="M22,80 H36 V84 H22 Z M58,80 H72 V84 H58 Z M30,40 H42 V44 H30 Z M52,40 H64 V44 H52 Z
         M30,60 H42 V64 H30 Z M52,60 H64 V64 H52 Z M8,18 H20 V22 H8 Z M74,18 H86 V22 H74 Z
         M8,40 H20 V44 H8 Z M74,40 H86 V44 H74 Z M34,6 H60 V10 H34 Z
         M10.5,10.5 H14 V12.8 H10.5 Z M19.5,10.5 H23 V12.8 H19.5 Z M75.5,10.5 H79 V12.8 H75.5 Z M84.5,10.5 H88 V12.8 H84.5 Z"
      fill={C.white}
      opacity={0.3}
    />
    {/* Sharper sheen right on the top edge, the way moulded plastic catches light */}
    <path
      d="M22,80 H36 V81.4 H22 Z M58,80 H72 V81.4 H58 Z M30,40 H42 V41.4 H30 Z M52,40 H64 V41.4 H52 Z
         M30,60 H42 V61.4 H30 Z M52,60 H64 V61.4 H52 Z M8,18 H20 V19.4 H8 Z M74,18 H86 V19.4 H74 Z
         M8,40 H20 V41.4 H8 Z M74,40 H86 V41.4 H74 Z"
      fill={C.white}
      opacity={0.4}
    />

    {/* Gold seam trim marking the waist */}
    <path d="M30,58 H70" stroke={C.gold} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M31,59.8 H69" stroke={C.goldDeep} strokeWidth={1.6} strokeLinecap="round" fill="none" />

    {/* Crown studs: gold bricks pressed onto the head */}
    <rect x={33.5} y={1.5} width={10} height={7.5} rx={2.5} fill={C.gold} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    <rect x={45} y={1.5} width={10} height={7.5} rx={2.5} fill={C.gold} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    <rect x={56.5} y={1.5} width={10} height={7.5} rx={2.5} fill={C.gold} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M40,3 H42 V8 H40 Z M51.5,3 H53.5 V8 H51.5 Z M63,3 H65 V8 H63 Z" fill={C.goldDeep} />
    <path d="M35.5,3 H40 V5.4 H35.5 Z M47,3 H51.5 V5.4 H47 Z M58.5,3 H63 V5.4 H58.5 Z" fill={C.white} opacity={0.55} />

    <path d="M36,11 L47,16" stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M64,11 L53,16" stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" />
    <circle cx={41} cy={19} r={7} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={59} cy={19} r={7} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={41} cy={20} r={4.4} fill={C.sky} />
    <circle cx={59} cy={20} r={4.4} fill={C.sky} />
    <circle cx={41} cy={20} r={2.7} fill={C.ink} />
    <circle cx={59} cy={20} r={2.7} fill={C.ink} />
    <ellipse cx={41} cy={23} rx={2.2} ry={1.1} fill={C.white} opacity={0.45} />
    <ellipse cx={59} cy={23} rx={2.2} ry={1.1} fill={C.white} opacity={0.45} />
    <circle cx={39} cy={17.2} r={1.8} fill={C.white} />
    <circle cx={57} cy={17.2} r={1.8} fill={C.white} />
    <path d="M41,32 Q50,26 59,32" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
  </svg>
);
