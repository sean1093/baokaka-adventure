import type { Sprite } from '../sprite';
import { C } from '../palette';

/**
 * The fish-stall crab. Wide flat shell, two oversized claws thrown up in a threat display,
 * eyes on short stalks and a hard V of eyebrows. Legs and stalks are drawn as a fat ink
 * stroke with a thinner berry stroke on top, so every thin limb still reads as outlined.
 */
export const Crab: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* Six little legs, three a side */}
    <path
      d="M28,52 Q12,54 6,62 M26,68 Q10,74 6,84 M34,78 Q28,86 26,92 M72,52 Q88,54 94,62 M74,68 Q90,74 94,84 M66,78 Q72,86 74,92"
      stroke={C.ink}
      strokeWidth={9}
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M28,52 Q12,54 6,62 M26,68 Q10,74 6,84 M34,78 Q28,86 26,92 M72,52 Q88,54 94,62 M74,68 Q90,74 94,84 M66,78 Q72,86 74,92"
      stroke={C.berry}
      strokeWidth={4}
      strokeLinecap="round"
      fill="none"
    />

    {/* Short eye stalks, same ink-then-berry trick */}
    <path d="M42,46 L37,28 M58,46 L63,28" stroke={C.ink} strokeWidth={9} strokeLinecap="round" fill="none" />
    <path d="M42,46 L37,28 M58,46 L63,28" stroke={C.berry} strokeWidth={4} strokeLinecap="round" fill="none" />

    <ellipse cx={50} cy={62} rx={32} ry={21} fill={C.berry} stroke={C.ink} strokeWidth={4} />
    <path d="M22,56 Q50,44 78,56" stroke={C.berryDeep} strokeWidth={4} strokeLinecap="round" fill="none" />
    {/* Wavy smirk */}
    <path d="M38,70 Q44,77 50,71 Q56,65 62,72" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />

    {/* Right claw: a stubby arm plus a pincer with a V notch bitten out of the top */}
    <g transform="translate(78,48) rotate(-18)">
      <path d="M-14,4 L-4,-16 L8,-10 L-2,10 Z" fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <path d="M-12,-16 Q-16,-34 -2,-40 L2,-28 L14,-36 Q24,-24 14,-14 Q-4,-8 -12,-16 Z" fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    </g>
    {/* Left claw: the same drawing mirrored */}
    <g transform="translate(22,48) scale(-1,1) rotate(-18)">
      <path d="M-14,4 L-4,-16 L8,-10 L-2,10 Z" fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <path d="M-12,-16 Q-16,-34 -2,-40 L2,-28 L14,-36 Q24,-24 14,-14 Q-4,-8 -12,-16 Z" fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    </g>

    <circle cx={36} cy={24} r={9} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={64} cy={24} r={9} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={37} cy={26} r={4.5} fill={C.ink} />
    <circle cx={63} cy={26} r={4.5} fill={C.ink} />
    {/* Angry V brows, drawn over the eyes so the lids look lowered */}
    <path d="M26,12 L42,18 M74,12 L58,18" stroke={C.ink} strokeWidth={4} strokeLinecap="round" fill="none" />
  </svg>
);

/**
 * An apple that jumped off the stall. The whole fruit - face, stem and leaf - is tilted in
 * one group so it reads as mid-roll, and the sand arcs on the right are the trail it left.
 */
export const RollingApple: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* Motion arcs behind it: this apple is rolling to the left */}
    <path d="M82,38 Q90,55 82,72" stroke={C.sand} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M90,46 Q96,55 90,64" stroke={C.sand} strokeWidth={5} strokeLinecap="round" fill="none" />

    <g transform="translate(-5,0) rotate(-14 50 55)">
      <path
        d="M50,26 C62,10 86,16 86,44 C86,68 70,90 50,90 C30,90 14,68 14,44 C14,16 38,10 50,26 Z"
        fill={C.berry}
        stroke={C.ink}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      {/* Shine on the shaded side */}
      <path d="M22,42 Q18,50 22,58" stroke={C.white} strokeWidth={4} strokeLinecap="round" fill="none" />

      <circle cx={37} cy={46} r={10} fill={C.white} stroke={C.ink} strokeWidth={4} />
      <circle cx={63} cy={46} r={10} fill={C.white} stroke={C.ink} strokeWidth={4} />
      <circle cx={40} cy={48} r={5} fill={C.ink} />
      <circle cx={66} cy={48} r={5} fill={C.ink} />
      {/* One brow down, one brow up: the naughty look */}
      <path d="M26,30 L42,36" stroke={C.ink} strokeWidth={4} strokeLinecap="round" fill="none" />
      <path d="M58,28 L76,26" stroke={C.ink} strokeWidth={4} strokeLinecap="round" fill="none" />

      {/* Cheeky grin with two teeth left on the upper lip */}
      <path d="M34,64 L66,64 Q50,84 34,64 Z" fill={C.ink} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
      <rect x={41} y={64} width={6} height={6} rx={1.5} fill={C.white} />
      <rect x={53} y={64} width={6} height={6} rx={1.5} fill={C.white} />

      {/* Stem planted in the dimple, then the leaf on top of everything */}
      <path d="M50,26 Q51,14 57,10" stroke={C.ink} strokeWidth={9} strokeLinecap="round" fill="none" />
      <path d="M50,26 Q51,14 57,10" stroke={C.mochaDeep} strokeWidth={4.5} strokeLinecap="round" fill="none" />
      <ellipse cx={66} cy={18} rx={13} ry={7.5} fill={C.leaf} stroke={C.ink} strokeWidth={4} transform="rotate(-20 66 18)" />
    </g>
  </svg>
);

/**
 * Boss: the king of the fish stall, facing left and stretched right across the box so it
 * is the widest foe in the scene. The crown base is tilted to sit flat on the sloping
 * back, and the lids are heavy chords across the eyes to make the stare look smug.
 */
export const BigFish: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* Dorsal fin and two-lobed tail, both behind the body so their bases are hidden */}
    <path d="M56,28 L70,12 L82,36 Z" fill={C.skyDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M78,54 L96,32 L90,54 L96,76 Z" fill={C.skyDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />

    <ellipse cx={52} cy={54} rx={36} ry={28} fill={C.sky} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={52} cy={70} rx={26} ry={11} fill={C.white} stroke={C.ink} strokeWidth={3} />
    {/* Scale seams */}
    <path d="M58,40 Q64,54 58,68 M70,44 Q75,54 70,64" stroke={C.skyDeep} strokeWidth={4} strokeLinecap="round" fill="none" />
    {/* Pectoral fin, flopped forward */}
    <path d="M40,64 Q26,78 44,80 Q48,72 44,63 Z" fill={C.skyDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />

    {/* Big pouty lips, sticking out past the head */}
    <path d="M8,54 Q14,42 30,50 L30,56 Q18,58 8,54 Z" fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M8,58 Q14,70 30,62 L30,56 Q18,54 8,58 Z" fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />

    {/* Crown, rotated so its base follows the slope of the back */}
    <g transform="rotate(-17 41 26)">
      <polygon points="24,30 27,12 33,22 41,8 49,22 55,13 58,30" fill={C.sun} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    </g>

    <circle cx={28} cy={44} r={9} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={48} cy={42} r={8.5} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={26} cy={47} r={4.5} fill={C.ink} />
    <circle cx={46} cy={45} r={4.5} fill={C.ink} />
    {/* Heavy half-lids plus brows sloping down and out: arrogant, not angry */}
    <path d="M20,41 L36,41 M41,39 L56,39" stroke={C.ink} strokeWidth={6} strokeLinecap="round" fill="none" />
    <path d="M18,33 L36,36 M40,32 L57,33" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />

    {/* Bubbles drifting up from the mouth */}
    <circle cx={9} cy={36} r={5} fill={C.white} stroke={C.ink} strokeWidth={3} />
    <circle cx={15} cy={25} r={3.5} fill={C.white} stroke={C.ink} strokeWidth={3} />
    <circle cx={8} cy={16} r={2.5} fill={C.white} stroke={C.ink} strokeWidth={3} />
  </svg>
);
