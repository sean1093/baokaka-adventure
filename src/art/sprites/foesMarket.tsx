import type { Sprite } from '../sprite';
import { C } from '../palette';

/**
 * The fish-stall crab. Wide flat shell, two oversized claws thrown up in a threat display,
 * eyes on short stalks and a hard V of eyebrows. Painted as hard chitin: a diagonal shell
 * gradient, a berryDeep band under the rim and two tight speculars across the carapace.
 * Thin limbs keep the ink-then-colour stroke trick, with a lit berry edge along the top.
 */
export const Crab: Sprite = () => {
  const legs =
    'M28,52 Q12,54 6,62 M26,68 Q10,74 6,84 M34,78 Q28,86 26,92 M72,52 Q88,54 94,62 M74,68 Q90,74 94,84 M66,78 Q72,86 74,92';
  const stalks = 'M42,46 L37,28 M58,46 L63,28';
  const arm = 'M-14,4 L-4,-16 L8,-10 L-2,10 Z';
  const pincer = 'M-12,-16 Q-16,-34 -2,-40 L2,-28 L14,-36 Q24,-24 14,-14 Q-4,-8 -12,-16 Z';
  // One claw drawing, shaded along its underside, so the mirrored copy is still lit from above.
  const claw = (
    <>
      <path d={arm} fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <g clipPath="url(#crab-arm-clip)">
        <path d="M8,-26 L30,-26 L30,26 L-17,26 Z" fill={C.berryDeep} />
        <ellipse cx={-7} cy={-5} rx={8} ry={2.1} fill={C.white} opacity={0.3} transform="rotate(-63 -7 -5)" />
      </g>
      <path d={pincer} fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <g clipPath="url(#crab-pincer-clip)">
        {/* Each plate shaded on its own: base of the claw, then the far jaw */}
        <path d="M-24,-24 L28,-17 L28,-4 L-24,-4 Z" fill={C.berryDeep} />
        <path d="M11,-40 L28,-32 L28,-12 L13,-16 Z" fill={C.berryDeep} opacity={0.5} />
        <ellipse cx={-6} cy={-33} rx={9} ry={3.2} fill={C.white} opacity={0.36} transform="rotate(-24 -6 -33)" />
        <ellipse cx={17} cy={-31} rx={5} ry={2} fill={C.white} opacity={0.26} transform="rotate(34 17 -31)" />
      </g>
      {/* Seam where the two jaws close */}
      <path d="M-9,-20 Q1,-24 10,-20" stroke={C.berryDeep} strokeWidth={2.4} strokeLinecap="round" fill="none" />
    </>
  );
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="crab-shell" x1="0.2" y1="0" x2="0.72" y2="1">
          <stop offset="0" stopColor={C.berry} />
          <stop offset="0.52" stopColor={C.berry} />
          <stop offset="1" stopColor={C.berryDeep} />
        </linearGradient>
        <clipPath id="crab-shell-clip">
          <ellipse cx={50} cy={62} rx={32} ry={21} />
        </clipPath>
        <clipPath id="crab-arm-clip">
          <path d={arm} />
        </clipPath>
        <clipPath id="crab-pincer-clip">
          <path d={pincer} />
        </clipPath>
      </defs>

      {/* Contact shadow, so the crab stands on the sand instead of floating over it */}
      <ellipse cx={50} cy={93} rx={31} ry={5} fill={C.ink} opacity={0.18} />

      {/* Legs: fat ink outline, berryDeep body, then a lit berry edge along the upper side */}
      <path d={legs} stroke={C.ink} strokeWidth={9.5} strokeLinecap="round" fill="none" />
      <path d={legs} stroke={C.berryDeep} strokeWidth={5.5} strokeLinecap="round" fill="none" />
      <g transform="translate(0,-1.4)">
        <path d={legs} stroke={C.berry} strokeWidth={2.6} strokeLinecap="round" fill="none" />
      </g>

      {/* Eye stalks, same three passes */}
      <path d={stalks} stroke={C.ink} strokeWidth={9} strokeLinecap="round" fill="none" />
      <path d={stalks} stroke={C.berryDeep} strokeWidth={5} strokeLinecap="round" fill="none" />
      <g transform="translate(-1.3,0)">
        <path d={stalks} stroke={C.berry} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      </g>

      <ellipse cx={50} cy={62} rx={32} ry={21} fill="url(#crab-shell)" stroke={C.ink} strokeWidth={4} />
      <g clipPath="url(#crab-shell-clip)">
        {/* Cel shadow: terminator runs down from the shaded right to the lit left */}
        <path d="M12,66 Q48,58 88,46 L88,88 L12,88 Z" fill={C.berryDeep} />
        {/* Hard speculars - chitin, not fur */}
        <ellipse cx={38} cy={51} rx={17} ry={4.6} fill={C.white} opacity={0.36} transform="rotate(-9 38 51)" />
        <ellipse cx={64} cy={48} rx={7} ry={2.4} fill={C.white} opacity={0.26} transform="rotate(14 64 48)" />
        {/* Lit notches along the shell rim */}
        <path d="M30,80 L30,75 M42,84 L42,79 M58,84 L58,79 M70,80 L70,75" stroke={C.berry} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      </g>
      {/* Carapace ridge, drawn in the shell's own deep tone rather than black */}
      <path d="M22,56 Q50,45 78,56" stroke={C.berryDeep} strokeWidth={3} strokeLinecap="round" fill="none" />
      {/* Wavy smirk */}
      <path d="M38,70 Q44,77 50,71 Q56,65 62,72" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />

      <g transform="translate(78,48) rotate(-18)">{claw}</g>
      <g transform="translate(22,48) scale(-1,1) rotate(-18)">{claw}</g>

      {/* Eyes: sclera, sun iris, ink pupil, highlight up-left, lid shadow across the top */}
      <circle cx={36} cy={24} r={9} fill={C.white} stroke={C.ink} strokeWidth={4} />
      <circle cx={64} cy={24} r={9} fill={C.white} stroke={C.ink} strokeWidth={4} />
      <circle cx={37} cy={25.5} r={5.6} fill={C.sun} />
      <circle cx={63} cy={25.5} r={5.6} fill={C.sun} />
      <ellipse cx={37} cy={29.5} rx={4} ry={1.6} fill={C.white} opacity={0.45} />
      <ellipse cx={63} cy={29.5} rx={4} ry={1.6} fill={C.white} opacity={0.45} />
      <circle cx={37.4} cy={26.4} r={3.2} fill={C.ink} />
      <circle cx={62.6} cy={26.4} r={3.2} fill={C.ink} />
      <circle cx={33.9} cy={21.6} r={2.3} fill={C.white} />
      <circle cx={60.9} cy={21.6} r={2.3} fill={C.white} />
      <path d="M28,21 Q36,15 44,21 M56,21 Q64,15 72,21" stroke={C.ink} strokeWidth={4} opacity={0.16} strokeLinecap="round" fill="none" />
      {/* Angry V brows, over the eyes so the lids read as lowered */}
      <path d="M26,12 L42,18 M74,12 L58,18" stroke={C.ink} strokeWidth={4} strokeLinecap="round" fill="none" />
    </svg>
  );
};

/**
 * An apple that jumped off the stall. The whole fruit - face, stem and leaf - is tilted in
 * one group so it reads as mid-roll, and the sand arcs on the right are the trail it left.
 * Waxy skin: a body gradient, a soft radial gloss up-left and a crisp shine streak.
 */
export const RollingApple: Sprite = () => {
  const body = 'M50,26 C62,10 86,16 86,44 C86,68 70,90 50,90 C30,90 14,68 14,44 C14,16 38,10 50,26 Z';
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="rollingApple-body" x1="0.15" y1="0.05" x2="0.8" y2="1">
          <stop offset="0" stopColor={C.berry} />
          <stop offset="0.5" stopColor={C.berry} />
          <stop offset="1" stopColor={C.berryDeep} />
        </linearGradient>
        <radialGradient id="rollingApple-gloss" cx="0.32" cy="0.24" r="0.44">
          <stop offset="0" stopColor={C.white} stopOpacity="0.5" />
          <stop offset="1" stopColor={C.white} stopOpacity="0" />
        </radialGradient>
        <clipPath id="rollingApple-clip">
          <path d={body} />
        </clipPath>
        <clipPath id="rollingApple-leaf-clip">
          <ellipse cx={66} cy={18} rx={13} ry={7.5} transform="rotate(-20 66 18)" />
        </clipPath>
      </defs>

      {/* Motion arcs behind it: this apple is rolling to the left */}
      <path d="M82,38 Q90,55 82,72" stroke={C.sand} strokeWidth={5} strokeLinecap="round" fill="none" />
      <path d="M90,46 Q96,55 90,64" stroke={C.sand} strokeWidth={5} strokeLinecap="round" fill="none" />
      {/* Contact shadow stays level with the ground while the fruit tilts */}
      <ellipse cx={44} cy={93} rx={27} ry={5} fill={C.ink} opacity={0.18} />

      <g transform="translate(-5,0) rotate(-14 50 55)">
        <path d={body} fill="url(#rollingApple-body)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        <g clipPath="url(#rollingApple-clip)">
          {/* Deep tone wrapping the lower right, then the soft gloss up-left */}
          <path d="M6,60 Q40,70 80,36 L96,36 L96,96 L6,96 Z" fill={C.berryDeep} opacity={0.88} />
          <rect x={12} y={8} width={76} height={84} fill="url(#rollingApple-gloss)" />
          {/* Skin flecks catching the light */}
          <path d="M29,36 Q27,44 30,52 M38,29 Q35,35 36,41" stroke={C.white} strokeWidth={2} opacity={0.28} strokeLinecap="round" fill="none" />
        </g>
        {/* Crisp shine: the giveaway that this skin is waxed */}
        <path d="M23,40 Q18,50 23,60" stroke={C.white} strokeWidth={4.5} strokeLinecap="round" opacity={0.85} fill="none" />
        <ellipse cx={32} cy={31} rx={6} ry={3.2} fill={C.white} opacity={0.5} transform="rotate(-40 32 31)" />

        {/* Eyes: sclera, sun iris, ink pupil, highlight up-left */}
        <circle cx={37} cy={46} r={10} fill={C.white} stroke={C.ink} strokeWidth={4} />
        <circle cx={63} cy={46} r={10} fill={C.white} stroke={C.ink} strokeWidth={4} />
        <circle cx={39.5} cy={47.5} r={6.2} fill={C.sun} />
        <circle cx={65.5} cy={47.5} r={6.2} fill={C.sun} />
        <ellipse cx={39.5} cy={52} rx={4.4} ry={1.7} fill={C.white} opacity={0.45} />
        <ellipse cx={65.5} cy={52} rx={4.4} ry={1.7} fill={C.white} opacity={0.45} />
        <circle cx={40} cy={48.4} r={3.6} fill={C.ink} />
        <circle cx={66} cy={48.4} r={3.6} fill={C.ink} />
        <circle cx={35.6} cy={43} r={2.4} fill={C.white} />
        <circle cx={61.6} cy={43} r={2.4} fill={C.white} />
        {/* One brow down, one brow up: the naughty look */}
        <path d="M26,30 L42,36" stroke={C.ink} strokeWidth={4} strokeLinecap="round" fill="none" />
        <path d="M58,28 L76,26" stroke={C.ink} strokeWidth={4} strokeLinecap="round" fill="none" />

        {/* Cheeky grin, two teeth left on the upper lip */}
        <path d="M34,64 L66,64 Q50,84 34,64 Z" fill={C.wineDeep} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
        <path d="M40,73 Q50,80 60,73" stroke={C.wine} strokeWidth={4} strokeLinecap="round" fill="none" />
        <rect x={41} y={64} width={6} height={6} rx={1.5} fill={C.white} />
        <rect x={53} y={64} width={6} height={6} rx={1.5} fill={C.white} />

        {/* Stem planted in the dimple, then the leaf over everything */}
        <path d="M50,26 Q51,14 57,10" stroke={C.ink} strokeWidth={9} strokeLinecap="round" fill="none" />
        <path d="M50,26 Q51,14 57,10" stroke={C.mochaDeep} strokeWidth={4.5} strokeLinecap="round" fill="none" />
        <path d="M49,24 Q50,13 56,9" stroke={C.mocha} strokeWidth={1.8} strokeLinecap="round" fill="none" />
        <ellipse cx={66} cy={18} rx={13} ry={7.5} fill={C.leaf} stroke={C.ink} strokeWidth={4} transform="rotate(-20 66 18)" />
        <g clipPath="url(#rollingApple-leaf-clip)">
          <path d="M52,23 L80,13 L86,32 L50,32 Z" fill={C.leafDeep} />
          <ellipse cx={61} cy={14} rx={7} ry={2} fill={C.white} opacity={0.32} transform="rotate(-20 61 14)" />
        </g>
        <path d="M55,22 L78,14" stroke={C.leafDeep} strokeWidth={2.2} strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
};

/**
 * Boss: the king of the fish stall, facing left and stretched right across the box so it
 * is the widest foe in the scene. Wet scales - body gradient, overlapping scale arcs, a
 * pale belly and translucent ray-lined fins - plus a gold crown for the boss beat.
 */
export const BigFish: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id="bigFish-body" x1="0.2" y1="0" x2="0.7" y2="1">
        <stop offset="0" stopColor={C.sky} />
        <stop offset="0.45" stopColor={C.sky} />
        <stop offset="1" stopColor={C.skyDeep} />
      </linearGradient>
      <linearGradient id="bigFish-belly" gradientUnits="userSpaceOnUse" x1="0" y1="60" x2="0" y2="80">
        <stop offset="0" stopColor={C.paper} stopOpacity="0.15" />
        <stop offset="0.45" stopColor={C.paper} stopOpacity="0.9" />
        <stop offset="1" stopColor={C.paper} />
      </linearGradient>
      <linearGradient id="bigFish-fin" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0" stopColor={C.sky} stopOpacity="0.95" />
        <stop offset="1" stopColor={C.skyDeep} stopOpacity="0.7" />
      </linearGradient>
      <linearGradient id="bigFish-crown" x1="0.1" y1="0" x2="0.6" y2="1">
        <stop offset="0" stopColor={C.gold} />
        <stop offset="1" stopColor={C.goldDeep} />
      </linearGradient>
      <clipPath id="bigFish-clip">
        <ellipse cx={52} cy={54} rx={36} ry={28} />
      </clipPath>
    </defs>

    {/* Contact shadow on the stall boards */}
    <ellipse cx={52} cy={92} rx={30} ry={4.6} fill={C.ink} opacity={0.16} />

    {/* Dorsal fin and two-lobed tail, behind the body so their bases stay hidden */}
    <path d="M56,28 L70,12 L82,36 Z" fill="url(#bigFish-fin)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M62,30 L69,15 M70,32 L73,17 M77,34 L77,21" stroke={C.skyDeep} strokeWidth={2.2} strokeLinecap="round" fill="none" />
    <path d="M78,54 L96,32 L90,54 L96,76 Z" fill="url(#bigFish-fin)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M82,50 L93,37 M82,52 L89,45 M82,58 L89,64 M82,60 L93,72" stroke={C.skyDeep} strokeWidth={2.2} strokeLinecap="round" fill="none" />

    <ellipse cx={52} cy={54} rx={36} ry={28} fill="url(#bigFish-body)" stroke={C.ink} strokeWidth={4} />
    <g clipPath="url(#bigFish-clip)">
      {/* Cel shadow along the flank, then overlapping scale arcs over the whole body */}
      <path d="M14,62 Q52,52 92,42 L92,86 L14,86 Z" fill={C.skyDeep} opacity={0.6} />
      {[0, 1, 2, 3].flatMap((row) =>
        [0, 1, 2, 3].map((col) => (
          <path
            key={`${row}-${col}`}
            d={`M${34 + col * 13},${30 + row * 11 + (col % 2) * 5.5} q6.5,5.5 0,11`}
            stroke={C.skyDeep}
            strokeWidth={2.4}
            strokeLinecap="round"
            opacity={0.55}
            fill="none"
          />
        )),
      )}
      {/* Rim light along the back: the boss reads brighter than the rest of the stall */}
      <path d="M28,38 Q46,27 68,29" stroke={C.white} strokeWidth={3.5} strokeLinecap="round" opacity={0.4} fill="none" />
    </g>

    {/* Pale belly, faded into the flank at the top and seamed with a skyDeep line */}
    <ellipse cx={52} cy={70} rx={24} ry={9.5} fill="url(#bigFish-belly)" />
    <path d="M29,69 Q52,59 75,69" stroke={C.skyDeep} strokeWidth={2.5} strokeLinecap="round" opacity={0.75} fill="none" />
    <path d="M35,75 Q52,80 69,75" stroke={C.sandDeep} strokeWidth={2} strokeLinecap="round" opacity={0.6} fill="none" />

    {/* Pectoral fin, flopped forward */}
    <path d="M40,64 Q26,78 44,80 Q48,72 44,63 Z" fill="url(#bigFish-fin)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M41,68 L35,77 M43,68 L42,79" stroke={C.skyDeep} strokeWidth={2.2} strokeLinecap="round" fill="none" />

    {/* Big pouty lips, sticking out past the head */}
    <path d="M8,54 Q14,42 30,50 L30,56 Q18,58 8,54 Z" fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M8,58 Q14,70 30,62 L30,56 Q18,54 8,58 Z" fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M10,61 Q17,68 28,62" stroke={C.berryDeep} strokeWidth={3.5} strokeLinecap="round" fill="none" />
    <path d="M12,50 Q18,47 26,51" stroke={C.white} strokeWidth={3} strokeLinecap="round" opacity={0.4} fill="none" />

    {/* Crown, rotated so its base follows the slope of the back */}
    <g transform="rotate(-17 41 26)">
      <polygon points="24,30 27,12 33,22 41,8 49,22 55,13 58,30" fill="url(#bigFish-crown)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <path d="M24,30 L58,30 L57,24 L25,24 Z" fill={C.goldDeep} />
      <path d="M27,14 L30,21 M41,10 L43,20" stroke={C.white} strokeWidth={2} strokeLinecap="round" opacity={0.5} fill="none" />
      <circle cx={32} cy={27} r={3} fill={C.berry} />
      <circle cx={41} cy={27} r={3.4} fill={C.berry} />
      <circle cx={50} cy={27} r={3} fill={C.berry} />
      <circle cx={31} cy={26} r={1} fill={C.white} />
      <circle cx={40} cy={26} r={1.2} fill={C.white} />
      <circle cx={49} cy={26} r={1} fill={C.white} />
    </g>

    {/* Glossy eyes: gold iris, ink pupil, heavy half-lids for the smug stare */}
    <circle cx={28} cy={44} r={9} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={48} cy={42} r={8.5} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={27} cy={46} r={5.6} fill={C.gold} />
    <circle cx={47} cy={44} r={5.4} fill={C.gold} />
    <circle cx={26.4} cy={46.8} r={3.2} fill={C.ink} />
    <circle cx={46.4} cy={44.8} r={3.1} fill={C.ink} />
    <circle cx={24.6} cy={42.6} r={2.2} fill={C.white} />
    <circle cx={44.6} cy={40.6} r={2.1} fill={C.white} />
    <path d="M20,41 L36,41 M41,39 L56,39" stroke={C.ink} strokeWidth={6} strokeLinecap="round" fill="none" />
    <path d="M18,33 L36,36 M40,32 L57,33" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />

    {/* Bubbles drifting up from the mouth, ringed in skyDeep rather than black */}
    <circle cx={9} cy={36} r={5} fill={C.white} stroke={C.skyDeep} strokeWidth={3} />
    <circle cx={15} cy={25} r={3.5} fill={C.white} stroke={C.skyDeep} strokeWidth={2.6} />
    <circle cx={8} cy={16} r={2.5} fill={C.white} stroke={C.skyDeep} strokeWidth={2.2} />
    <path d="M6,34 Q7,31 10,32" stroke={C.white} strokeWidth={1.8} strokeLinecap="round" fill="none" />
  </svg>
);
