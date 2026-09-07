import type { Sprite } from '../sprite';
import { C } from '../palette';

/**
 * Mocha Cat, the tabby sword spirit. All three tabby markers stay - the forehead M, the flank
 * stripes and the ringed tail - but the fur is now cel shaded (mocha lit, mochaDeep on the
 * lower right, cream-to-sand belly and muzzle) and she wears a jade shoulder mantle with a
 * gold clasp, a jade streamer on the lit side and a gold bell corded to her tail tip.
 */
export const MochaCat: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      {/* Most of the fur stays in the lit tone, so the markings still have somewhere to read */}
      <linearGradient id="mochacat-fur" x1="0.1" y1="0" x2="0.9" y2="1">
        <stop offset="0" stopColor={C.mocha} />
        <stop offset="0.62" stopColor={C.mocha} />
        <stop offset="1" stopColor={C.mochaDeep} />
      </linearGradient>
      <linearGradient id="mochacat-light" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0" stopColor={C.cream} />
        <stop offset="1" stopColor={C.sand} />
      </linearGradient>
      <linearGradient id="mochacat-jade" x1="0.1" y1="0" x2="0.9" y2="1">
        <stop offset="0" stopColor={C.jade} />
        <stop offset="1" stopColor={C.jadeDeep} />
      </linearGradient>
      <linearGradient id="mochacat-gold" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor={C.gold} />
        <stop offset="1" stopColor={C.goldDeep} />
      </linearGradient>
    </defs>

    {/* Tail: a fat ink stroke with the fur laid over it, so a thin limb keeps one even outline.
        It leaves the right hip, S-bends and hooks at the tip, clear of the body. */}
    <path d="M70,89 C88,88 91,76 87,66 C84,60 84,55 86,50 C89,44 91,38 90,33 C89,30 88,29 86,30" stroke={C.ink} strokeWidth={14} strokeLinecap="round" fill="none" />
    <path d="M70,89 C88,88 91,76 87,66 C84,60 84,55 86,50 C89,44 91,38 90,33 C89,30 88,29 86,30" stroke={C.mocha} strokeWidth={9} strokeLinecap="round" fill="none" />
    {/* Shaded edge on the far side, lit edge on the near side */}
    <path d="M70,92 C90,91 94,76 90,66 C87,60 87,55 89,50 C92,44 94,38 93,33" stroke={C.mochaDeep} strokeWidth={2.6} strokeLinecap="round" fill="none" />
    <path d="M70,86 C85,85 88,76 84,66 C81,60 81,55 83,50 C86,44 88,38 87,33" stroke={C.white} strokeWidth={2.4} strokeLinecap="round" opacity={0.28} fill="none" />
    {/* Rings: a wide soft pass then a solid one, so each band has a feathered edge */}
    <path d="M82.5,66.6 L91.5,65.4 M80.1,58.2 L89.1,57 M84.6,44.3 L93.4,41.6" stroke={C.mochaDeep} strokeWidth={8.5} opacity={0.25} fill="none" />
    <path d="M82.5,66.6 L91.5,65.4 M80.1,58.2 L89.1,57 M84.6,44.3 L93.4,41.6" stroke={C.mochaDeep} strokeWidth={5} fill="none" />
    {/* Gold bell on a wine cord, knotted round the tail tip */}
    <path d="M80.5,27 C83,24.5 89,24.5 91.5,27" stroke={C.wine} strokeWidth={3.5} strokeLinecap="round" fill="none" />
    <circle cx={86} cy={21} r={5.5} fill="url(#mochacat-gold)" stroke={C.ink} strokeWidth={3} />
    <path d="M82,24 C83.4,26.6 88.6,26.6 90,24" stroke={C.goldDeep} strokeWidth={2.4} fill="none" />
    <path d="M82.4,18.6 C83.4,16.8 85,16.2 86.8,16.4" stroke={C.white} strokeWidth={2.2} strokeLinecap="round" opacity={0.6} fill="none" />
    <path d="M86,23.4 L86,26" stroke={C.ink} strokeWidth={2} strokeLinecap="round" fill="none" />

    {/* Haunches, sitting */}
    <path
      d="M22,90 C18,74 18,64 34,59 C40,56 60,56 66,59 C82,64 82,74 78,90 Z"
      fill="url(#mochacat-fur)"
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    {/* Cel shadow down the far flank, soft highlight up the lit flank */}
    <path d="M66,59 C82,64 82,74 78,90 L74,90 C77,77 77,66 66,59 Z" fill={C.mochaDeep} />
    <path d="M34,59 C24,63 20,70 21,79 L26,79 C25,71 28,65 37,62 Z" fill={C.white} opacity={0.22} />
    {/* Cream-to-sand belly */}
    <path d="M50,70 C59,70 64,75 63,81 C62,87 57,88 50,88 C43,88 38,87 37,81 C36,75 41,70 50,70 Z" fill="url(#mochacat-light)" />
    <path d="M40,84 C44,87 56,87 60,84" stroke={C.sandDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
    {/* Mackerel flank stripes, soft pass then solid */}
    <path
      d="M28,72 C25,77 25,82 27,86 M34,74 C31,79 31,83 33,87 M70,72 C73,77 73,82 71,86 M65,74 C68,79 68,83 66,87"
      stroke={C.mochaDeep}
      strokeWidth={8.5}
      strokeLinecap="round"
      opacity={0.22}
      fill="none"
    />
    <path
      d="M28,72 C25,77 25,82 27,86 M34,74 C31,79 31,83 33,87 M70,72 C73,77 73,82 71,86 M65,74 C68,79 68,83 66,87"
      stroke={C.mochaDeep}
      strokeWidth={5}
      strokeLinecap="round"
      fill="none"
    />
    {/* Front paws, kept as their own shapes so they read in front of the chest */}
    <ellipse cx={37.5} cy={88.5} rx={9.5} ry={6.5} fill="url(#mochacat-fur)" stroke={C.ink} strokeWidth={4} />
    <ellipse cx={62.5} cy={88.5} rx={9.5} ry={6.5} fill="url(#mochacat-fur)" stroke={C.ink} strokeWidth={4} />
    <ellipse cx={34.5} cy={86} rx={4.6} ry={2.3} fill={C.white} opacity={0.28} />
    <ellipse cx={59.5} cy={86} rx={4.6} ry={2.3} fill={C.white} opacity={0.28} />
    <path d="M34,84.5 L33.5,92 M41,84 L41,92 M59,84 L59,92 M66,84.5 L66.5,92" stroke={C.mochaDeep} strokeWidth={2.6} strokeLinecap="round" fill="none" />

    {/* Jade streamer with a swallowtail, fluttering out from under the mantle */}
    <path d="M30,66 C22,63 14,64 8,68 L13,71 L8,75 C16,77 24,76 29,74 C27,71 27,68.5 30,66 Z" fill="url(#mochacat-jade)" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M14,69.5 C19,70 24,72 27.5,73.5" stroke={C.jadeDeep} strokeWidth={2} strokeLinecap="round" fill="none" />

    {/* Ears peek out from behind the round head */}
    <polygon points="20,3 46,30 26,38" fill="url(#mochacat-fur)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <polygon points="80,3 54,30 74,38" fill="url(#mochacat-fur)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <polygon points="26,13 42,29 30,33" fill={C.berry} opacity={0.45} />
    <polygon points="74,13 58,29 70,33" fill={C.berry} opacity={0.45} />
    <circle cx={50} cy={42} r={27} fill="url(#mochacat-fur)" stroke={C.ink} strokeWidth={4} />
    <path d="M74,52 C71,63 62,69 50,69 C60,66 68,60 71,50 Z" fill={C.mochaDeep} />
    <path d="M28,32 C31,23 39,17 48,16 C39,19 33,25 31,33 Z" fill={C.white} opacity={0.2} />

    {/* The forehead M and the cheek stripes: the most recognisable tabby markings */}
    <path d="M39,26 L44,18 L50,25 L56,18 L61,26 M29,33 L26,41 M71,33 L74,41" stroke={C.mochaDeep} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" opacity={0.2} fill="none" />
    <path d="M39,26 L44,18 L50,25 L56,18 L61,26 M29,33 L26,41 M71,33 L74,41" stroke={C.mochaDeep} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Brow whiskers give her an opinion */}
    <path d="M30,29 C32,26.5 35,25.5 37,26 M70,29 C68,26.5 65,25.5 63,26" stroke={C.mochaDeep} strokeWidth={2.4} strokeLinecap="round" fill="none" />

    <ellipse cx={50} cy={54} rx={16} ry={11} fill="url(#mochacat-light)" />
    <path d="M35,56 C40,63 60,63 65,56" stroke={C.sandDeep} strokeWidth={2} strokeLinecap="round" fill="none" />

    {/* Almond green eyes: sclera, iris ring with a lit lower edge, slit pupil, highlight */}
    <path d="M28,33 C30,26 46,29 48,37 C46,44 30,42 28,33 Z" fill={C.white} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M72,33 C70,26 54,29 52,37 C54,44 70,42 72,33 Z" fill={C.white} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    <circle cx={38} cy={35.5} r={6.6} fill={C.leafDeep} />
    <circle cx={62} cy={35.5} r={6.6} fill={C.leafDeep} />
    <circle cx={38} cy={38} r={4} fill={C.leaf} />
    <circle cx={62} cy={38} r={4} fill={C.leaf} />
    <ellipse cx={38} cy={35.5} rx={2.6} ry={5.6} fill={C.ink} />
    <ellipse cx={62} cy={35.5} rx={2.6} ry={5.6} fill={C.ink} />
    <circle cx={34.9} cy={31.8} r={2.1} fill={C.white} />
    <circle cx={58.9} cy={31.8} r={2.1} fill={C.white} />
    <circle cx={41.4} cy={39.4} r={1.1} fill={C.white} opacity={0.8} />
    <circle cx={65.4} cy={39.4} r={1.1} fill={C.white} opacity={0.8} />
    <path d="M28,33 C30,26 46,29 48,37 M72,33 C70,26 54,29 52,37" stroke={C.ink} strokeWidth={3} strokeLinecap="round" fill="none" />

    {/* Nose, mouth, whisker dots, whiskers */}
    <path d="M45,48 L55,48 L50,55 Z" fill={C.berry} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M46.6,50.4 L53.4,50.4 L50,55 Z" fill={C.berryDeep} />
    <circle cx={47.4} cy={49.2} r={1.1} fill={C.white} opacity={0.7} />
    <path d="M50,55 C50,60 46,61 43,59.5 M50,55 C50,60 54,61 57,59.5" stroke={C.ink} strokeWidth={2.6} strokeLinecap="round" fill="none" />
    <circle cx={40} cy={50} r={1.05} fill={C.mochaDeep} />
    <circle cx={37.6} cy={53} r={1.05} fill={C.mochaDeep} />
    <circle cx={40} cy={56} r={1.05} fill={C.mochaDeep} />
    <circle cx={60} cy={50} r={1.05} fill={C.mochaDeep} />
    <circle cx={62.4} cy={53} r={1.05} fill={C.mochaDeep} />
    <circle cx={60} cy={56} r={1.05} fill={C.mochaDeep} />
    <path d="M35,51 C29,49 25,49 22.5,50 M35,56 C29,57 25,58 22,59 M65,51 C71,49 75,49 77.5,50 M65,56 C71,57 75,58 78,59" stroke={C.ink} strokeWidth={2.8} strokeLinecap="round" fill="none" />

    {/* Jade shoulder mantle, tucked under the chin, with a gold clasp */}
    <path
      d="M26,60 C34,66 42,69 50,69 C58,69 66,66 74,60 C76,66 74,72 68,74 C58,77 42,77 32,74 C26,72 24,66 26,60 Z"
      fill="url(#mochacat-jade)"
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <path d="M52,76.6 C62,75.8 70,73 73,68.5 C75,64.5 75,61 74,60 C73,67 68,72.5 58,75 Z" fill={C.jadeDeep} />
    <path d="M27,61.5 C29,66.5 34,70 40,72 C34,72 28,68.5 26,63.5 Z" fill={C.white} opacity={0.3} />
    <path d="M40,70.5 C41,73 41,75 40,76.4 M60,70.5 C60,73 60,75 61,76.4" stroke={C.jadeDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
    <circle cx={50} cy={72} r={4.4} fill="url(#mochacat-gold)" stroke={C.ink} strokeWidth={2.5} />
    <path d="M47,74 C48.5,75.6 51.5,75.6 53,74" stroke={C.goldDeep} strokeWidth={2} fill="none" />
    <circle cx={48.3} cy={70.4} r={1.2} fill={C.white} opacity={0.75} />
  </svg>
);

/**
 * Baokaka, the hero: a one year old swordsman. Round face, upright hair tufts and serious
 * almond eyes, in a teal 道袍 with a crossed collar and wide sleeves, a gold sash and a short
 * wine shoulder cape. Each arm leaves the shoulder from under the cape, bends at the elbow and
 * ends in a wide cuff plus a real hand. Deliberately no held prop: he is decor in every
 * hidden-object scene and a bright object in his fist would be mistaken for a target.
 */
export const Baokaka: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id="baokaka-robe" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor={C.teal} />
        <stop offset="1" stopColor={C.tealDeep} />
      </linearGradient>
      <linearGradient id="baokaka-cape" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor={C.wine} />
        <stop offset="1" stopColor={C.wineDeep} />
      </linearGradient>
      <linearGradient id="baokaka-sash" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor={C.gold} />
        <stop offset="1" stopColor={C.goldDeep} />
      </linearGradient>
      <linearGradient id="baokaka-skin" x1="0.15" y1="0" x2="0.9" y2="1">
        <stop offset="0" stopColor={C.skin} />
        <stop offset="1" stopColor={C.skinDeep} />
      </linearGradient>
      <linearGradient id="baokaka-hair" x1="0.2" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor={C.hair} />
        <stop offset="1" stopColor={C.hairDeep} />
      </linearGradient>
    </defs>

    {/* Arms: an ink stroke with the robe gradient over it, bent at the elbow. Rooted inside the
        torso, so the robe and cape cover the join and the limb grows out of the body. */}
    <path d="M39,57 L29,67 L20,76 M62,58 L75,66 L80,53" stroke={C.ink} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M39,57 L29,67 L20,76 M62,58 L75,66 L80,53" stroke="url(#baokaka-robe)" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M25,71 C27,73.5 29,74.5 31,74.5 M72,62 C74,63.5 75,65 75.5,66.5" stroke={C.tealDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
    {/* Wide 道袍 cuffs, broader than the upper arm, with the inside of the sleeve in shadow */}
    <ellipse cx={20} cy={76} rx={9.5} ry={6.5} transform="rotate(45 20 76)" fill="url(#baokaka-robe)" stroke={C.ink} strokeWidth={3.5} />
    <ellipse cx={18.6} cy={77.4} rx={8.6} ry={2.8} transform="rotate(45 18.6 77.4)" fill={C.tealDeep} />
    <ellipse cx={80} cy={53} rx={9.5} ry={6.5} transform="rotate(21 80 53)" fill="url(#baokaka-robe)" stroke={C.ink} strokeWidth={3.5} />
    <ellipse cx={80.7} cy={51.1} rx={8.6} ry={2.8} transform="rotate(21 80.7 51.1)" fill={C.tealDeep} />
    {/* Hands */}
    <circle cx={15.5} cy={81} r={5.5} fill="url(#baokaka-skin)" stroke={C.ink} strokeWidth={3} />
    <circle cx={84} cy={45} r={5.5} fill="url(#baokaka-skin)" stroke={C.ink} strokeWidth={3} />
    <path d="M11.8,82.6 C13.6,84.6 18,84.2 19.6,82.2 M80.4,43.6 C81.6,46.4 86,47 87.8,45.4" stroke={C.skinDeep} strokeWidth={2} strokeLinecap="round" fill="none" />

    {/* Trousers and cloth shoes: an upper plus a pale sole, so the foot has thickness */}
    <path d="M38,74 L36.4,86 M62,74 L63.6,86" stroke={C.ink} strokeWidth={12} strokeLinecap="round" fill="none" />
    <path d="M38,74 L36.4,86 M62,74 L63.6,86" stroke={C.cream} strokeWidth={7} strokeLinecap="round" fill="none" />
    <path d="M27,93 C27,87.5 31,85 36,85 C41,85 45,87.5 45,93 Z" fill="url(#baokaka-cape)" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M55,93 C55,87.5 59,85 64,85 C69,85 73,87.5 73,93 Z" fill="url(#baokaka-cape)" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M26,93 L46,93 C46,96.5 43,97 36,97 C29,97 26,96.5 26,93 Z" fill={C.cream} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M54,93 L74,93 C74,96.5 71,97 64,97 C57,97 54,96.5 54,93 Z" fill={C.cream} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />

    {/* The 道袍 itself */}
    <path
      d="M32,78 C32,68 33,59 37,55 C42,51 58,51 63,55 C67,59 68,68 68,78 C60,81 40,81 32,78 Z"
      fill="url(#baokaka-robe)"
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <path d="M63,55 C67,59 68,68 68,78 C64.6,79.6 61,80.4 57.6,80.8 C61.6,70 63,62 63,55 Z" fill={C.tealDeep} />
    <path d="M37,55 C33.6,59 32.6,66 32.4,74 L35.6,74 C35.6,66 36.6,59 40,56 Z" fill={C.white} opacity={0.22} />
    <path d="M36,64 C36,60.6 37,57 38.6,55.6 M64,64 C64,60.6 63,57 61.4,55.6 M39,80.6 C38.4,79 38.4,77.6 38.4,76 M61,80.6 C61.6,79 61.6,77.6 61.6,76" stroke={C.tealDeep} strokeWidth={2} strokeLinecap="round" fill="none" />

    {/* The cape's standing collar, rising behind the head so the wine reads as a cape
        rather than as a waistcoat: only the wings beside the jaw show. */}
    <path
      d="M50,45 C38,44 28,49.5 23.5,58 C30,55.5 38,54 50,54 C62,54 70,55.5 76.5,58 C72,49.5 62,44 50,45 Z"
      fill="url(#baokaka-cape)"
      stroke={C.ink}
      strokeWidth={3.5}
      strokeLinejoin="round"
    />
    <path d="M76.5,58 C74,52 69,47.6 63,45.6 C69,49 73,53 74.6,57.2 Z" fill={C.wineDeep} />
    <path d="M27,54 C30,50 34,47.4 39,46" stroke={C.white} strokeWidth={2.6} strokeLinecap="round" opacity={0.3} fill="none" />

    {/* Crossed collar, the giveaway of 古裝 */}
    <path
      d="M38,55 C41,60 45,63 50,66 C55,63 59,60 62,55 C59,54 56,57 50,60 C44,57 41,54 38,55 Z"
      fill={C.cream}
      stroke={C.ink}
      strokeWidth={3}
      strokeLinejoin="round"
    />
    <path d="M50,66 C55,63 59,60 62,55 C60,59 56,62.5 50,62.5 Z" fill={C.sandDeep} opacity={0.5} />
    <path d="M50,60 C53,58 56,56 57.5,54.5" stroke={C.sandDeep} strokeWidth={2.4} strokeLinecap="round" fill="none" />

    {/* Gold sash with a wrapped knot and two hanging 飄帶 */}
    <path d="M32.4,66 C41,68.6 59,68.6 67.6,66 L68.4,73.6 C59,76.4 41,76.4 31.6,73.6 Z" fill="url(#baokaka-sash)" stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
    <path d="M31.6,73.6 C41,76.4 59,76.4 68.4,73.6 L68.4,71.4 C59,74.2 41,74.2 31.6,71.4 Z" fill={C.goldDeep} />
    <path d="M33,67.4 C39,69.4 45,70.2 49,70.4 C43,70.8 36,70 32.6,69.4 Z" fill={C.white} opacity={0.32} />
    <path d="M47.2,75.6 C46,79.6 46,82 47.4,84 L50,83.2 C49.2,80.4 49.2,78.4 50,75.6 Z" fill="url(#baokaka-sash)" stroke={C.ink} strokeWidth={2.4} strokeLinejoin="round" />
    <path d="M51.8,75.6 C52.8,78.6 52.8,81.4 51.8,83.6 L54.2,82.4 C53.6,80 53.4,78 53.8,75.6 Z" fill="url(#baokaka-sash)" stroke={C.ink} strokeWidth={2.4} strokeLinejoin="round" />
    <path d="M45,66.2 C47,65.2 53,65.2 55,66.2 L55,75 C53,76.2 47,76.2 45,75 Z" fill="url(#baokaka-sash)" stroke={C.ink} strokeWidth={2.6} strokeLinejoin="round" />
    <path d="M46,70.6 C48,71.6 52,71.6 54,70.6" stroke={C.goldDeep} strokeWidth={2} fill="none" />

    {/* Short wine cape: the drapes reach out past the teal silhouette on both sides, so wine
        shows outside the body outline and the thing reads as a cape rather than a scarf. The
        lower edge, where each arm passes out from under the cloth, is wineDeep for depth. */}
    <path d="M48,53 C39,52 30,55 23,61 C19.5,63.5 22,67 27,65.5 C34,63.5 43,58.5 47,55 Z" fill="url(#baokaka-cape)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M52,53 C61,52 70,55 77,61 C80.5,63.5 78,67 73,65.5 C66,63.5 57,58.5 53,55 Z" fill="url(#baokaka-cape)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M23,61 C19.5,63.5 22,67 27,65.5 C34,63.5 43,58.5 47,55 L44,54.2 C39.5,58.6 32,62.4 26.4,63.8 C24.6,64.2 23.4,63.4 23.8,61.4 Z" fill={C.wineDeep} />
    <path d="M77,61 C80.5,63.5 78,67 73,65.5 C66,63.5 57,58.5 53,55 L56,54.2 C60.5,58.6 68,62.4 73.6,63.8 C75.4,64.2 76.6,63.4 76.2,61.4 Z" fill={C.wineDeep} />
    <path d="M47,54.6 C40.5,55.6 33,58.6 26.6,63.4" stroke={C.white} strokeWidth={3} strokeLinecap="round" opacity={0.3} fill="none" />
    <path d="M36,57 C35,59.6 33,62 30.6,63.8 M64,57 C65,59.6 67,62 69.4,63.8" stroke={C.wineDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
    <circle cx={50} cy={57} r={3.8} fill="url(#baokaka-sash)" stroke={C.ink} strokeWidth={2.4} />
    <path d="M47.6,58.8 C48.6,60 51.4,60 52.4,58.8" stroke={C.goldDeep} strokeWidth={1.8} fill="none" />

    {/* Head. Ears sit behind it so only the outer curve shows */}
    <ellipse cx={26} cy={40} rx={4} ry={5.5} fill="url(#baokaka-skin)" stroke={C.ink} strokeWidth={2.5} />
    <ellipse cx={74} cy={40} rx={4} ry={5.5} fill="url(#baokaka-skin)" stroke={C.ink} strokeWidth={2.5} />
    <ellipse cx={50} cy={32} rx={25} ry={23.5} fill="url(#baokaka-skin)" stroke={C.ink} strokeWidth={4} />
    <path d="M73,34 C72,45 63,55 50,55.4 C59,52 66,45 68,34 Z" fill={C.skinDeep} opacity={0.75} />
    <path d="M30,27 C36,23 44,25 50,24.5 C56,25 64,23 70,27 C64,29.5 56,28.5 50,28 C44,28.5 36,29.5 30,27 Z" fill={C.skinDeep} opacity={0.5} />
    <ellipse cx={33.5} cy={43} rx={5} ry={3.2} fill={C.berry} opacity={0.3} />
    <ellipse cx={66.5} cy={43} rx={5} ry={3.2} fill={C.berry} opacity={0.3} />

    {/* Almond eyes. A narrow lens lying down, iris filling nearly the whole opening so only
        two cream slivers show at the corners - a white disc with a dot in it reads as glasses. */}
    <path d="M33.7,36.6 C35.5,30.9 43.5,30.7 45.3,35.6 C43.5,41.3 35.5,41.5 33.7,36.6 Z" fill={C.cream} stroke={C.ink} strokeWidth={2} strokeLinejoin="round" />
    <path d="M66.3,36.6 C64.5,30.9 56.5,30.7 54.7,35.6 C56.5,41.3 64.5,41.5 66.3,36.6 Z" fill={C.cream} stroke={C.ink} strokeWidth={2} strokeLinejoin="round" />
    {/* Lid shadow, so the sclera slivers never read as bright glass */}
    <path d="M33.7,36.6 C35.5,30.9 43.5,30.7 45.3,35.6 C43.6,33.2 35.6,33.4 33.7,36.6 Z" fill={C.skinDeep} opacity={0.55} />
    <path d="M66.3,36.6 C64.5,30.9 56.5,30.7 54.7,35.6 C56.4,33.2 64.4,33.4 66.3,36.6 Z" fill={C.skinDeep} opacity={0.55} />
    <circle cx={39.5} cy={36.2} r={3.9} fill={C.mochaDeep} />
    <circle cx={60.5} cy={36.2} r={3.9} fill={C.mochaDeep} />
    <circle cx={39.5} cy={38.1} r={2} fill={C.mocha} />
    <circle cx={60.5} cy={38.1} r={2} fill={C.mocha} />
    <circle cx={39.5} cy={36.2} r={2.2} fill={C.ink} />
    <circle cx={60.5} cy={36.2} r={2.2} fill={C.ink} />
    <circle cx={37.9} cy={34.5} r={1.5} fill={C.white} />
    <circle cx={58.9} cy={34.5} r={1.5} fill={C.white} />
    {/* Heavy upper lid cutting into the top of the eye, plus an outer corner lash */}
    <path d="M33.7,36.6 C35.5,30.9 43.5,30.7 45.3,35.6 M66.3,36.6 C64.5,30.9 56.5,30.7 54.7,35.6" stroke={C.ink} strokeWidth={3.2} strokeLinecap="round" fill="none" />
    <path d="M33.7,36.6 L31.2,34.9 M66.3,36.6 L68.8,34.9" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" fill="none" />

    {/* Brows carry the whole expression: a serious little swordsman */}
    <path d="M32.5,27 C36,25 43,26 46,28.4 M67.5,27 C64,25 57,26 54,28.4" stroke={C.hair} strokeWidth={2.8} strokeLinecap="round" fill="none" />
    <path d="M48.6,41 C49.6,43.4 51,43.8 51.8,42.8" stroke={C.skinDeep} strokeWidth={2.2} strokeLinecap="round" fill="none" />
    <path d="M46.4,47.4 C48.4,50 51.6,50 53.6,47.4 Z" fill={C.wine} opacity={0.5} />
    <path d="M46,47.2 C48.2,50 51.8,50 54,47.2" stroke={C.ink} strokeWidth={2.8} strokeLinecap="round" fill="none" />

    {/* Hair in three tones: a mass with pointed tips, deep shadow on the far side, light
        strands on the lit side, and a hairline that leaves the forehead bare */}
    <path
      d="M24,41 C23,28 27,16 35,11 C35,5 41,3 43,9 C45,2 51,2 52,8 C55,2 61,3 61,10
         C65,5 70,7 69,14 C75,19 78,29 76,41 C73,31 67,23 60,22 C55,18 52,23 50,21.5
         C47,18 43,23 39,22.5 C33,24 27,30 24,41 Z"
      fill="url(#baokaka-hair)"
    />
    <path d="M76,41 C78,29 75,19 69,14 C72,23 72,32 70,38 C73,38.6 75,39.6 76,41 Z" fill={C.hairDeep} />
    <path d="M61,10 C63,13 64,16 64,19 C61,15 58,13 55,12 Z" fill={C.hairDeep} />
    <path d="M29,26 C29.5,19 33,13.5 39,10.5" stroke={C.hairLight} strokeWidth={2.4} strokeLinecap="round" fill="none" />
    <path d="M35,22 C36,17 40,12.5 45,10" stroke={C.hairLight} strokeWidth={1.9} strokeLinecap="round" fill="none" />
    <path d="M56,11.5 C60,14 63,18 64,23" stroke={C.hairLight} strokeWidth={1.7} strokeLinecap="round" opacity={0.6} fill="none" />
    {/* Wine hair tie on the top tuft */}
    <path d="M53,9 C57.5,5.5 62.5,5.5 66,8.5 C62,9.5 58,11.5 54.5,12.5 Z" fill="url(#baokaka-cape)" stroke={C.ink} strokeWidth={2} strokeLinejoin="round" />
    <path d="M44,10.5 C47,8.5 52,8.5 54.5,10.5 C52,12.8 47,12.8 44,10.5 Z" fill={C.wine} stroke={C.ink} strokeWidth={2} strokeLinejoin="round" />
  </svg>
);
