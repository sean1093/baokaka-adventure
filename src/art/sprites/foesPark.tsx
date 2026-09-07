import type { Sprite } from '../sprite';
import { C } from '../palette';

/**
 * Crumb thief. Plump grey body, iridescent neck patch, one wing thrown up mid-flap and a
 * stolen crumb still wedged in the beak. Both pupils are shoved over to the crumb side:
 * that sideways glance is what turns a pigeon into a mischief-maker. The wing is built as
 * layered primaries, each edged in C.greyDeep, and the neck runs plum into jade so it
 * shifts colour the way a real pigeon's does.
 */
export const Pigeon: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      <radialGradient id="pigeon-body" cx="0.34" cy="0.24" r="0.88">
        <stop offset="0" stopColor={C.paper} />
        <stop offset="0.38" stopColor={C.grey} />
        <stop offset="1" stopColor={C.greyDeep} />
      </radialGradient>
      <linearGradient id="pigeon-wing" x1="0.1" y1="0" x2="0.6" y2="1">
        <stop offset="0" stopColor={C.grey} />
        <stop offset="0.55" stopColor={C.grey} />
        <stop offset="1" stopColor={C.greyDeep} />
      </linearGradient>
      <linearGradient id="pigeon-neck" x1="0" y1="0.1" x2="1" y2="0.9">
        <stop offset="0" stopColor={C.plum} />
        <stop offset="0.32" stopColor={C.plum} />
        <stop offset="0.58" stopColor={C.jade} />
        <stop offset="1" stopColor={C.plumDeep} />
      </linearGradient>
      <clipPath id="pigeon-trunk">
        <ellipse cx={46} cy={60} rx={30} ry={27} />
      </clipPath>
      <clipPath id="pigeon-wingClip">
        <path d="M46,52 Q26,30 12,28 Q16,44 22,54 Q30,64 44,66 Z" />
      </clipPath>
      <clipPath id="pigeon-skull">
        <circle cx={60} cy={28} r={21} />
      </clipPath>
    </defs>

    {/* Contact shadow under the feet */}
    <ellipse cx={51} cy={96} rx={27} ry={3.5} fill={C.ink} opacity={0.18} />

    {/* Fan tail, trailing down and back */}
    <path d="M28,72 L4,80 L8,92 L32,86 Z" fill="url(#pigeon-wing)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M28,79 L8,82 M28,82 L12,88" stroke={C.greyDeep} strokeWidth={2.8} strokeLinecap="round" fill="none" />
    <path d="M27,76 L7,79.5" stroke={C.white} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.35} />

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
    <path d="M42.5,80 L40.5,88 M58.5,80 L60.5,88" stroke={C.sunDeep} strokeWidth={1.6} strokeLinecap="round" fill="none" />

    <ellipse cx={46} cy={60} rx={30} ry={27} fill="url(#pigeon-body)" stroke={C.ink} strokeWidth={4} />
    <g clipPath="url(#pigeon-trunk)">
      {/* Belly and right flank fall away from the light */}
      <ellipse cx={60} cy={74} rx={30} ry={24} fill={C.greyDeep} opacity={0.6} />
      <ellipse cx={44} cy={37} rx={14} ry={6} transform="rotate(-14 44 37)" fill={C.white} opacity={0.25} />
      {/* Breast feather strokes */}
      <path d="M52,84 Q58,76 58,66 M64,80 Q68,72 66,64" stroke={C.greyDeep} strokeWidth={2.2} strokeLinecap="round" fill="none" />
    </g>

    {/* Wing thrown up mid-flap: gradient slab, scalloped primaries along the trailing edge */}
    <path d="M46,52 Q26,30 12,28 Q16,44 22,54 Q30,64 44,66 Z" fill="url(#pigeon-wing)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <g clipPath="url(#pigeon-wingClip)">
      <path
        d="M12,28 Q16,44 22,54 Q30,64 44,66 Q39,58 33,58 Q27,57 25,49 Q20,41 18,29 Z"
        fill={C.greyDeep}
      />
      {/* Feather seams in the fill's own deep tone, each with a lit upper edge */}
      <path d="M18,36 Q24,48 32,58 M27,37 Q33,48 40,58 M13,32 Q17,43 24,53" stroke={C.greyDeep} strokeWidth={2.6} strokeLinecap="round" fill="none" />
      <path d="M19.6,34.6 Q25.6,46.6 33.6,56.6 M28.6,35.6 Q34.6,46.6 41.6,56.6" stroke={C.white} strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.4} />
      {/* Rim light on the leading edge */}
      <path d="M46,52 Q26,30 12,28 L14,33 Q28,35 45,57 Z" fill={C.white} opacity={0.3} />
    </g>

    {/* Iridescent neck patch first, then the head sits on top of it */}
    <ellipse cx={54} cy={46} rx={18} ry={11} fill={C.plum} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={54} cy={46} rx={16} ry={9} fill="url(#pigeon-neck)" opacity={0.7} />
    <path d="M40,48 Q54,55 68,48" fill="none" stroke={C.plumDeep} strokeWidth={2.2} strokeLinecap="round" opacity={0.8} />
    <ellipse cx={48} cy={42} rx={7} ry={2.6} transform="rotate(-10 48 42)" fill={C.white} opacity={0.3} />

    <circle cx={60} cy={28} r={21} fill="url(#pigeon-body)" stroke={C.ink} strokeWidth={4} />
    <g clipPath="url(#pigeon-skull)">
      <ellipse cx={70} cy={40} rx={20} ry={18} fill={C.greyDeep} opacity={0.5} />
      <path d="M41.2,22 A21,21 0 0 1 62.9,8.1 L62.5,14.2 A15,15 0 0 0 46.9,23.9 Z" fill={C.white} opacity={0.32} />
      <path d="M46,44 Q52,48 60,49" stroke={C.greyDeep} strokeWidth={2.2} strokeLinecap="round" fill="none" />
    </g>

    {/* Beak, with the stolen crumb still in it */}
    <polygon points="76,24 93,32 76,40" fill={C.sun} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M77,32 L91,32 L77,39 Z" fill={C.sunDeep} />
    <path d="M78,27 L87,30.5 L78,30.5 Z" fill={C.white} opacity={0.5} />
    <rect x={84} y={34} width={12} height={9} rx={4} fill={C.sand} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M86,40 Q90,43 94,40 Q90,42 86,40 Z" fill={C.sandDeep} />
    <path d="M86,36.5 H92" stroke={C.white} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.6} />

    {/* One brow up, both eyes cut sideways at the crumb */}
    <path d="M44,18 Q50,13 57,18" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
    <path d="M60,15 Q67,10 74,16" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
    <circle cx={50} cy={27} r={7.5} fill={C.white} stroke={C.ink} strokeWidth={3} />
    <circle cx={67} cy={27} r={7.5} fill={C.white} stroke={C.ink} strokeWidth={3} />
    <circle cx={53} cy={28} r={5} fill={C.sun} />
    <circle cx={70} cy={28} r={5} fill={C.sun} />
    <circle cx={53} cy={28} r={3} fill={C.ink} />
    <circle cx={70} cy={28} r={3} fill={C.ink} />
    <circle cx={51} cy={25.6} r={1.7} fill={C.white} />
    <circle cx={68} cy={25.6} r={1.7} fill={C.white} />
  </svg>
);

/**
 * A runaway kite that grew a face. The diamond is tilted, the C.sun spars stay visible
 * behind the grin, and three bow ribbons trail off to the lower left so the sprite reads
 * as "just yanked out of somebody's hands". Each of the four sail panels takes a different
 * tone so the paper reads as taut cloth over a frame, and a white halo behind it plus a
 * translucent sheen across it are what make it a ghost rather than a toy.
 */
export const KiteGhost: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      <radialGradient id="kiteGhost-halo" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0.42" stopColor={C.white} stopOpacity={0.6} />
        <stop offset="0.72" stopColor={C.sky} stopOpacity={0.22} />
        <stop offset="1" stopColor={C.sky} stopOpacity={0} />
      </radialGradient>
      <linearGradient id="kiteGhost-sailFill" x1="0.15" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor={C.berry} />
        <stop offset="0.55" stopColor={C.berry} />
        <stop offset="1" stopColor={C.berryDeep} />
      </linearGradient>
      <clipPath id="kiteGhost-sail">
        <polygon points="56,6 92,40 56,70 20,40" />
      </clipPath>
    </defs>

    {/* Ghost glow, and the soft shadow it still casts on the path below */}
    <ellipse cx={54} cy={40} rx={44} ry={38} fill="url(#kiteGhost-halo)" />
    <ellipse cx={52} cy={96} rx={25} ry={3.5} fill={C.ink} opacity={0.18} />

    {/* Wavy string, drawn before the bows so the knots cover its kinks */}
    <path d="M50,70 Q46,78 38,76 Q28,74 24,82 Q20,90 12,88" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
    <path d="M50,68.5 Q46,76.5 38,74.5 Q28,72.5 24,80.5 Q20,88.5 12,86.5" stroke={C.white} strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.5} />
    <g transform="translate(38,76) rotate(-20)">
      <path d="M0,0 L-9,-6 L-9,6 Z M0,0 L9,-6 L9,6 Z" fill={C.sky} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      <path d="M0,0 L-9,6 L-4,3 Z M0,0 L9,6 L4,3 Z" fill={C.skyDeep} />
      <path d="M-1,-1 L-8,-4.5 L-4,-2 Z M1,-1 L8,-4.5 L4,-2 Z" fill={C.white} opacity={0.45} />
    </g>
    <g transform="translate(24,82) rotate(-25)">
      <path d="M0,0 L-9,-6 L-9,6 Z M0,0 L9,-6 L9,6 Z" fill={C.sun} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      <path d="M0,0 L-9,6 L-4,3 Z M0,0 L9,6 L4,3 Z" fill={C.sunDeep} />
      <path d="M-1,-1 L-8,-4.5 L-4,-2 Z M1,-1 L8,-4.5 L4,-2 Z" fill={C.white} opacity={0.45} />
    </g>
    <g transform="translate(12,88) rotate(-20)">
      <path d="M0,0 L-8,-5 L-8,5 Z M0,0 L8,-5 L8,5 Z" fill={C.leaf} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      <path d="M0,0 L-8,5 L-3.5,2.5 Z M0,0 L8,5 L3.5,2.5 Z" fill={C.leafDeep} />
      <path d="M-1,-1 L-7,-3.8 L-3.5,-1.8 Z M1,-1 L7,-3.8 L3.5,-1.8 Z" fill={C.white} opacity={0.45} />
    </g>

    {/* Everything in this group tilts together, face included */}
    <g transform="rotate(12 56 38)">
      <polygon points="56,6 92,40 56,70 20,40" fill="url(#kiteGhost-sailFill)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <g clipPath="url(#kiteGhost-sail)">
        {/* Four panels, each turned a different way to the light */}
        <path d="M56,6 L56,40 L20,40 Z" fill={C.white} opacity={0.22} />
        <path d="M56,6 L92,40 L56,40 Z" fill={C.berryDeep} opacity={0.22} />
        <path d="M20,40 L56,40 L56,70 Z" fill={C.berryDeep} opacity={0.42} />
        <path d="M56,40 L92,40 L56,70 Z" fill={C.berryDeep} opacity={0.78} />
        {/* Creases pulled from the hub out to the corners: taut cloth, not card */}
        <path
          d="M56,40 L38,23 M56,40 L74,23 M56,40 L38,55 M56,40 L74,55"
          stroke={C.berryDeep}
          strokeWidth={1.6}
          strokeLinecap="round"
          fill="none"
          opacity={0.55}
        />
        {/* Rim light on the two edges facing the light */}
        <path d="M56,7 L21,40 L26,40 L56,13 Z" fill={C.white} opacity={0.3} />
        {/* Translucent sheen sweeping across the paper */}
        <path d="M30,52 L62,4 L72,4 L40,58 Z" fill={C.white} opacity={0.14} />
      </g>

      {/* Spar frame, left showing around the face; spine crease on either side of it */}
      <path d="M58,11 L58,65 M25,42 L88,42" stroke={C.berryDeep} strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.6} />
      <path d="M56,11 L56,65 M24,40 L88,40" stroke={C.sun} strokeWidth={5} strokeLinecap="round" fill="none" />
      <path d="M57.4,13 L57.4,63 M27,41.4 L86,41.4" stroke={C.sunDeep} strokeWidth={1.6} strokeLinecap="round" fill="none" />
      <path d="M54.6,14 L54.6,62 M27,38.6 L86,38.6" stroke={C.white} strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.45} />

      {/* Flat brow on the left, cocked brow on the right */}
      <path d="M38,25 L48,28" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <path d="M62,22 L72,26" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <circle cx={45} cy={38} r={9.5} fill={C.white} stroke={C.ink} strokeWidth={4} />
      <circle cx={67} cy={38} r={9.5} fill={C.white} stroke={C.ink} strokeWidth={4} />
      <circle cx={47} cy={39} r={6.2} fill={C.sun} />
      <circle cx={69} cy={39} r={6.2} fill={C.sun} />
      <circle cx={47} cy={39} r={3.8} fill={C.ink} />
      <circle cx={69} cy={39} r={3.8} fill={C.ink} />
      <ellipse cx={47} cy={43.2} rx={3} ry={1.5} fill={C.white} opacity={0.42} />
      <ellipse cx={69} cy={43.2} rx={3} ry={1.5} fill={C.white} opacity={0.42} />
      <circle cx={44.4} cy={35.8} r={2.2} fill={C.white} />
      <circle cx={66.4} cy={35.8} r={2.2} fill={C.white} />

      {/* Wide grin: flat top, bulging bottom, two teeth hanging off the lip */}
      <path d="M40,51 L71,51 Q56,70 40,51 Z" fill={C.wineDeep} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M46,60 Q55,68 63,59 Q55,63 46,60 Z" fill={C.wine} />
      <rect x={48} y={51} width={6} height={5} rx={1.5} fill={C.white} />
      <rect x={58} y={51} width={6} height={5} rx={1.5} fill={C.white} />
      <path d="M53,52 H54 V55.5 H53 Z M63,52 H64 V55.5 H63 Z" fill={C.sandDeep} opacity={0.6} />
    </g>
  </svg>
);

/**
 * Boss: the crow who runs the park. The plumage is C.hair over C.hairDeep with a C.grey
 * outline, so the shape survives on both pale and dark scenes; what makes it read as
 * glossy black rather than a hole in the screen is the C.hairLight feather strokes and the
 * grey rim light along every leading edge. The plum aura behind the wing span, the gold
 * sheen on the beak and the C.berry bandana are the boss beats.
 */
export const CrowBoss: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      <radialGradient id="crowBoss-aura" cx="0.5" cy="0.48" r="0.5">
        <stop offset="0.36" stopColor={C.plum} stopOpacity={0} />
        <stop offset="0.7" stopColor={C.plum} stopOpacity={0.34} />
        <stop offset="1" stopColor={C.plum} stopOpacity={0} />
      </radialGradient>
      <linearGradient id="crowBoss-plume" x1="0.2" y1="0" x2="0.7" y2="1">
        <stop offset="0" stopColor={C.hairLight} />
        <stop offset="0.35" stopColor={C.hair} />
        <stop offset="1" stopColor={C.hairDeep} />
      </linearGradient>
      <linearGradient id="crowBoss-band" x1="0.1" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor={C.berry} />
        <stop offset="0.6" stopColor={C.berry} />
        <stop offset="1" stopColor={C.berryDeep} />
      </linearGradient>
      <clipPath id="crowBoss-trunk">
        <ellipse cx={50} cy={68} rx={26} ry={22} />
      </clipPath>
      <clipPath id="crowBoss-skull">
        <circle cx={50} cy={34} r={22} />
      </clipPath>
    </defs>

    {/* Boss aura behind the wing span, and the shadow under the claws */}
    <rect x={0} y={0} width={100} height={100} fill="url(#crowBoss-aura)" />
    <ellipse cx={50} cy={97} rx={30} ry={3} fill={C.ink} opacity={0.18} />

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
    <path d="M41.5,84 L39.5,91 M57.5,84 L59.5,91" stroke={C.sunDeep} strokeWidth={1.6} strokeLinecap="round" fill="none" />

    {/* Wings spread the full width, with three feather tips on each trailing edge.
        Gradient plumage under a C.grey outline: the fill carries the shape on pale scenes
        and the outline carries it on dark ones, which an ink-on-ink crow cannot do. */}
    <path d="M46,54 Q26,30 4,30 Q12,42 8,50 Q20,52 20,62 Q30,58 30,70 Q40,62 48,66 Z" fill="url(#crowBoss-plume)" stroke={C.grey} strokeWidth={4} strokeLinejoin="round" />
    <path d="M54,54 Q74,30 96,30 Q88,42 92,50 Q80,52 80,62 Q70,58 70,70 Q60,62 52,66 Z" fill="url(#crowBoss-plume)" stroke={C.grey} strokeWidth={4} strokeLinejoin="round" />
    {/* Gloss strokes: the only thing that makes black feathers read as feathers */}
    <path
      d="M44,58 Q30,46 13,37 M42,62 Q30,54 18,49 M40,66 Q31,62 23,59
         M56,58 Q70,46 87,37 M58,62 Q70,54 82,49 M60,66 Q69,62 77,59"
      stroke={C.hairLight}
      strokeWidth={2.6}
      strokeLinecap="round"
      fill="none"
    />
    {/* Rim light along both leading edges */}
    <path d="M44,52 Q26,32 7,31 M56,52 Q74,32 93,31" stroke={C.grey} strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.6} />
    {/* Wing seams, so the spread reads as feathers rather than one flat slab */}
    <path d="M22,40 Q28,50 30,60 M78,40 Q72,50 70,60" stroke={C.grey} strokeWidth={3} strokeLinecap="round" fill="none" />

    <ellipse cx={50} cy={68} rx={26} ry={22} fill="url(#crowBoss-plume)" stroke={C.grey} strokeWidth={4} />
    <g clipPath="url(#crowBoss-trunk)">
      <ellipse cx={62} cy={78} rx={26} ry={20} fill={C.hairDeep} opacity={0.75} />
      <ellipse cx={34} cy={62} rx={9} ry={12} transform="rotate(20 34 62)" fill={C.grey} opacity={0.16} />
      <path d="M38,84 Q44,76 42,64 M50,88 Q54,78 51,66 M62,82 Q65,74 60,64" stroke={C.hairLight} strokeWidth={2.4} strokeLinecap="round" fill="none" />
    </g>
    <path d="M27,74 Q26,62 34,54" stroke={C.grey} strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.55} />

    <circle cx={50} cy={34} r={22} fill="url(#crowBoss-plume)" stroke={C.grey} strokeWidth={4} />
    <g clipPath="url(#crowBoss-skull)">
      <ellipse cx={63} cy={46} rx={22} ry={20} fill={C.hairDeep} opacity={0.7} />
      <ellipse cx={34} cy={38} rx={8} ry={11} transform="rotate(20 34 38)" fill={C.grey} opacity={0.18} />
      <path d="M31,30 Q29,38 32,47 M69,30 Q71,38 68,47" stroke={C.hairLight} strokeWidth={2.4} strokeLinecap="round" fill="none" />
    </g>
    <path d="M28.5,38 Q27.6,30 31,23" stroke={C.grey} strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.55} />

    {/* Gang bandana, knot flapping out to the right, pinned with a gold stud */}
    <path d="M70,20 L88,14 L84,26 Z M70,26 L86,32 L76,35 Z" fill="url(#crowBoss-band)" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M28,24 Q50,10 72,24 Q50,30 28,24 Z" fill="url(#crowBoss-band)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M30,25.6 Q50,31 70,25.6 Q50,28.4 30,25.6 Z" fill={C.berryDeep} />
    <path d="M34,22 Q44,15 54,14.5" stroke={C.white} strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.45} />
    <path d="M44,19 Q46,23 45,26 M56,17 Q57,22 56,26" stroke={C.berryDeep} strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.7} />
    <circle cx={68} cy={23} r={3.2} fill={C.gold} stroke={C.ink} strokeWidth={2.2} />
    <circle cx={67} cy={22} r={1} fill={C.white} />

    {/* Eyes: sclera, gold iris ring, ink pupil, highlight up-left */}
    <circle cx={39} cy={41} r={9} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={61} cy={41} r={9} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={41} cy={42} r={6} fill={C.sun} />
    <circle cx={59} cy={42} r={6} fill={C.sun} />
    <circle cx={41} cy={42} r={3.6} fill={C.ink} />
    <circle cx={59} cy={42} r={3.6} fill={C.ink} />
    <ellipse cx={41} cy={46.2} rx={2.8} ry={1.4} fill={C.white} opacity={0.42} />
    <ellipse cx={59} cy={46.2} rx={2.8} ry={1.4} fill={C.white} opacity={0.42} />
    <circle cx={38.4} cy={38.8} r={2} fill={C.white} />
    <circle cx={56.4} cy={38.8} r={2} fill={C.white} />

    {/* Heavy brows over the eyes: ink slab plus a grey edge so they read on the dark head */}
    <path d="M28,31 L47,38 M72,31 L53,38" stroke={C.ink} strokeWidth={8} strokeLinecap="round" fill="none" />
    <path d="M28,31 L47,38 M72,31 L53,38" stroke={C.grey} strokeWidth={2.5} strokeLinecap="round" fill="none" />

    {/* Beak: sun base, deep underside, a gold sheen streak and one white glint */}
    <polygon points="41,50 59,50 50,65" fill={C.sun} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M50,51 L57.5,51 L50,63.5 Z" fill={C.sunDeep} />
    <path d="M43,52 L49,52 L47.5,60 Z" fill={C.gold} />
    <path d="M44,52.8 L47,52.8 L46.2,57.5 Z" fill={C.white} opacity={0.6} />
    <line x1={42} y1={53} x2={58} y2={53} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
  </svg>
);
