import type { Sprite } from '../sprite';
import { C } from '../palette';

/**
 * Crumb thief. Plump grey body, purple neck patch, one wing thrown up mid-flap and a
 * stolen crumb still wedged in the beak. Both pupils are shoved over to the crumb side:
 * that sideways glance is what turns a pigeon into a mischief-maker.
 */
export const Pigeon: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* Fan tail, trailing down and back */}
    <path d="M28,72 L4,80 L8,92 L32,86 Z" fill={C.grey} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M28,79 L8,82 M28,82 L12,88" stroke={C.ink} strokeWidth={3} strokeLinecap="round" fill="none" />

    {/* Legs: an ink stroke under a C.sun stroke keeps thin limbs outlined like every other shape */}
    <path
      d="M43,78 L41,90 M33,93 L41,90 L49,93 M59,78 L61,90 M53,93 L61,90 L69,93"
      stroke={C.ink}
      strokeWidth={9}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M43,78 L41,90 M33,93 L41,90 L49,93 M59,78 L61,90 M53,93 L61,90 L69,93"
      stroke={C.sun}
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />

    <ellipse cx={46} cy={60} rx={30} ry={27} fill={C.grey} stroke={C.ink} strokeWidth={4} />

    {/* Wing thrown up mid-flap, with two feather seams */}
    <path d="M46,52 Q26,30 12,28 Q16,44 22,54 Q30,64 44,66 Z" fill={C.grey} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M18,36 Q24,48 32,58 M27,37 Q33,48 40,58" stroke={C.ink} strokeWidth={3} strokeLinecap="round" fill="none" />

    {/* Purple neck patch first, then the head sits on top of it */}
    <ellipse cx={54} cy={46} rx={18} ry={11} fill={C.plum} stroke={C.ink} strokeWidth={4} />
    <circle cx={60} cy={28} r={21} fill={C.grey} stroke={C.ink} strokeWidth={4} />

    {/* Beak, with the stolen crumb still in it */}
    <polygon points="76,24 93,32 76,40" fill={C.sun} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={84} y={34} width={12} height={9} rx={4} fill={C.sand} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />

    {/* One brow up, both eyes cut sideways at the crumb */}
    <path d="M44,18 Q50,13 57,18" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
    <path d="M60,15 Q67,10 74,16" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
    <circle cx={50} cy={27} r={7.5} fill={C.white} stroke={C.ink} strokeWidth={3} />
    <circle cx={67} cy={27} r={7.5} fill={C.white} stroke={C.ink} strokeWidth={3} />
    <circle cx={53} cy={28} r={4} fill={C.ink} />
    <circle cx={70} cy={28} r={4} fill={C.ink} />
  </svg>
);

/**
 * A runaway kite that grew a face. The diamond is tilted, the C.sun spars stay visible
 * behind the grin, and three bow ribbons trail off to the lower left so the sprite reads
 * as "just yanked out of somebody's hands".
 */
export const KiteGhost: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* Wavy string, drawn before the bows so the knots cover its kinks */}
    <path d="M50,70 Q46,78 38,76 Q28,74 24,82 Q20,90 12,88" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
    <path
      transform="translate(38,76) rotate(-20)"
      d="M0,0 L-9,-6 L-9,6 Z M0,0 L9,-6 L9,6 Z"
      fill={C.sky}
      stroke={C.ink}
      strokeWidth={3}
      strokeLinejoin="round"
    />
    <path
      transform="translate(24,82) rotate(-25)"
      d="M0,0 L-9,-6 L-9,6 Z M0,0 L9,-6 L9,6 Z"
      fill={C.sun}
      stroke={C.ink}
      strokeWidth={3}
      strokeLinejoin="round"
    />
    <path
      transform="translate(12,88) rotate(-20)"
      d="M0,0 L-8,-5 L-8,5 Z M0,0 L8,-5 L8,5 Z"
      fill={C.leaf}
      stroke={C.ink}
      strokeWidth={3}
      strokeLinejoin="round"
    />

    {/* Everything in this group tilts together, face included */}
    <g transform="rotate(12 56 38)">
      <polygon points="56,6 92,40 56,70 20,40" fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      {/* Spar frame, left showing around the face */}
      <path d="M56,11 L56,65 M24,40 L88,40" stroke={C.sun} strokeWidth={5} strokeLinecap="round" fill="none" />

      {/* Flat brow on the left, cocked brow on the right */}
      <path d="M38,25 L48,28" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <path d="M62,22 L72,26" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <circle cx={45} cy={38} r={9.5} fill={C.white} stroke={C.ink} strokeWidth={4} />
      <circle cx={67} cy={38} r={9.5} fill={C.white} stroke={C.ink} strokeWidth={4} />
      <circle cx={47} cy={39} r={4.5} fill={C.ink} />
      <circle cx={69} cy={39} r={4.5} fill={C.ink} />

      {/* Wide grin: flat top, bulging bottom, two teeth hanging off the lip */}
      <path d="M40,51 L71,51 Q56,70 40,51 Z" fill={C.berryDeep} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
      <rect x={48} y={51} width={6} height={5} rx={1.5} fill={C.white} />
      <rect x={58} y={51} width={6} height={5} rx={1.5} fill={C.white} />
    </g>
  </svg>
);

/**
 * Boss: the crow who runs the park. Fill and outline are both C.ink, so the shape has to
 * be carried by C.grey rim light, the C.sun beak and claws, the C.berry bandana and the
 * big white eyes. Wings span the full width to make it the widest foe in the scene.
 */
export const CrowBoss: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* Claws: a fat ink stroke under a C.sun stroke, so thin limbs still get an outline */}
    <path
      d="M42,82 L40,93 M32,96 L40,93 L48,96 M58,82 L60,93 M52,96 L60,93 L68,96"
      stroke={C.ink}
      strokeWidth={9}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M42,82 L40,93 M32,96 L40,93 L48,96 M58,82 L60,93 M52,96 L60,93 L68,96"
      stroke={C.sun}
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />

    {/* Wings spread the full width, with three feather tips on each trailing edge.
        Ink fill with a C.grey outline: the fill carries the shape on pale scenes and the
        outline carries it on dark ones, which an ink-on-ink crow cannot do. */}
    <path d="M46,54 Q26,30 4,30 Q12,42 8,50 Q20,52 20,62 Q30,58 30,70 Q40,62 48,66 Z" fill={C.ink} stroke={C.grey} strokeWidth={4} strokeLinejoin="round" />
    <path d="M54,54 Q74,30 96,30 Q88,42 92,50 Q80,52 80,62 Q70,58 70,70 Q60,62 52,66 Z" fill={C.ink} stroke={C.grey} strokeWidth={4} strokeLinejoin="round" />

    <ellipse cx={50} cy={68} rx={26} ry={22} fill={C.ink} stroke={C.grey} strokeWidth={4} />
    <circle cx={50} cy={34} r={22} fill={C.ink} stroke={C.grey} strokeWidth={4} />
    {/* Wing seams, so the spread reads as feathers rather than one flat slab */}
    <path d="M22,40 Q28,50 30,60 M78,40 Q72,50 70,60" stroke={C.grey} strokeWidth={3} strokeLinecap="round" fill="none" />

    {/* Gang bandana, knot flapping out to the right */}
    <path d="M70,20 L88,14 L84,26 Z M70,26 L86,32 L76,35 Z" fill={C.berry} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M28,24 Q50,10 72,24 Q50,30 28,24 Z" fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />

    <circle cx={39} cy={41} r={9} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={61} cy={41} r={9} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={41} cy={42} r={4.5} fill={C.ink} />
    <circle cx={59} cy={42} r={4.5} fill={C.ink} />

    {/* Heavy brows over the eyes: ink slab plus a grey edge so they read on the dark head */}
    <path d="M28,31 L47,38 M72,31 L53,38" stroke={C.ink} strokeWidth={8} strokeLinecap="round" fill="none" />
    <path d="M28,31 L47,38 M72,31 L53,38" stroke={C.grey} strokeWidth={2.5} strokeLinecap="round" fill="none" />

    <polygon points="41,50 59,50 50,65" fill={C.sun} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <line x1={42} y1={53} x2={58} y2={53} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
  </svg>
);
