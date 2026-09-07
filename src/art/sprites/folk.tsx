import type { Sprite } from '../sprite';
import { C } from '../palette';

/**
 * The folk of Baokaka's town: the third party member (Duck) plus the family and
 * neighbours he can talk to, drawn at the 仙劍 bar - cel shaded, in 古裝, light
 * always coming from the upper left.
 *
 * Every figure is built the same way so a scene can line them up. A head near
 * (50,29) with rx 22, shoulders at y 57, a sash at the waist, and a hem that
 * stops just above the shoes on y 94. Cloth is base colour + a `Deep` shadow
 * shape on the lower right + a low-opacity C.white sweep on the upper left, and
 * every fold line is the fill's own `Deep` tone rather than black. Sleeves are
 * cloth, not strokes: they leave the shoulder, widen at the cuff, and a C.skin
 * hand always comes out of the far end.
 */

/**
 * Duck, the third party member: the water-walker from Bathtub Island. Two-tone
 * yellow, a broad C.sunDeep bill, and a sand 斗笠 with woven ribs whose wine cord
 * runs down outside the cheeks so it never masks the face.
 */
export const Duck: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id="duck-body" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor={C.sun} />
        <stop offset="1" stopColor={C.sunDeep} />
      </linearGradient>
      <linearGradient id="duck-hat" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor={C.sand} />
        <stop offset="1" stopColor={C.sandDeep} />
      </linearGradient>
    </defs>

    {/* He is a water-walker, so the ground line is water: two rings of ripple */}
    <path d="M9,96 Q19,93 29,96 M71,96 Q81,93 91,96" stroke={C.sky} strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.55} />
    <path d="M16,91 Q22,89 28,91 M72,91 Q78,89 84,91" stroke={C.sky} strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.35} />

    {/* Webbed feet flat on the ground, drawn first so the belly hides the joins */}
    <path d="M42,85 Q24,87 13,95 Q28,98 47,95 Z" fill={C.sun} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
    <path d="M58,85 Q76,87 87,95 Q72,98 53,95 Z" fill={C.sun} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
    <path d="M22,93 L28,87 M33,95 L37,87 M78,93 L72,87 M67,95 L63,87" stroke={C.sunDeep} strokeWidth={2.2} strokeLinecap="round" fill="none" />

    {/* Tail feathers cocked up behind the right flank */}
    <path d="M74,64 Q88,58 92,66 Q85,71 77,73 Z" fill={C.sunDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M79,65 Q85,64 89,67" stroke={C.sun} strokeWidth={2} strokeLinecap="round" fill="none" />

    {/* Body: gradient base, hard shadow down the right flank, soft sheen up the left */}
    <ellipse cx={50} cy={72} rx={31} ry={21} fill="url(#duck-body)" stroke={C.ink} strokeWidth={4} />
    <path d="M74,62 Q80,76 70,86 Q59,93 43,91 Q64,88 70,77 Q74,69 74,62 Z" fill={C.sunDeep} />
    <ellipse cx={40} cy={64} rx={14} ry={7} fill={C.white} opacity={0.3} transform="rotate(-22 40 64)" />
    <path d="M32,78 Q50,86 68,78" stroke={C.sunDeep} strokeWidth={2.4} strokeLinecap="round" fill="none" />
    <path d="M34,84 Q40,80 46,84 Q52,80 58,84 Q64,80 68,84" stroke={C.sunDeep} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.5} />
    <path d="M70,60 Q75,70 72,80" stroke={C.sunDeep} strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.7} />
    <path d="M20,93 Q28,90 36,93 M64,93 Q72,90 80,93" stroke={C.sunDeep} strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.4} />
    <ellipse cx={49} cy={80} rx={17} ry={9} fill={C.sun} opacity={0.4} />
    <path d="M36,68 Q50,64 64,68" stroke={C.sunDeep} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.55} />

    {/* One folded wing, painted in the deeper yellow so it reads against the belly */}
    <path d="M27,58 Q17,70 23,84 Q35,81 34,65 Z" fill={C.sunDeep} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
    <path d="M26,79 Q31,81 33,76 M25,71 Q30,74 33,68" stroke={C.sun} strokeWidth={2.2} strokeLinecap="round" fill="none" />
    <path d="M24,75 Q29,77 32,71" stroke={C.sun} strokeWidth={2.2} strokeLinecap="round" fill="none" />
    <path d="M29,61 Q24,68 23,76" stroke={C.white} strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.3} />
    <path d="M35,62 Q37,72 35,82" stroke={C.sunDeep} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.6} />

    <circle cx={50} cy={38} r={21} fill="url(#duck-body)" stroke={C.ink} strokeWidth={4} />
    <path d="M71,38 A21,21 0 0 1 58,57.6 Q66,49 70,35 Z" fill={C.sunDeep} opacity={0.45} />
    <ellipse cx={38} cy={28} rx={10} ry={5} fill={C.white} opacity={0.32} transform="rotate(-25 38 28)" />

    {/* Big friendly eyes: sclera, sky iris with a lit lower rim, pupil, glint */}
    <path d="M31,27.5 Q38.5,24 45,26.5 M55,26.5 Q61.5,24 69,27.5" stroke={C.sunDeep} strokeWidth={2.4} strokeLinecap="round" fill="none" />
    <path d="M31,36 C33,29.5 44,29 46,36.5 C44,43.5 33,43 31,36 Z" fill={C.cream} />
    <path d="M69,36 C67,29.5 56,29 54,36.5 C56,43.5 67,43 69,36 Z" fill={C.cream} />
    <path d="M31,36 C33,29.5 44,29 46,36.5 C43,32.8 35,32.3 31,36 Z" fill={C.sunDeep} opacity={0.45} />
    <path d="M69,36 C67,29.5 56,29 54,36.5 C57,32.8 65,32.3 69,36 Z" fill={C.sunDeep} opacity={0.45} />
    <circle cx={38.5} cy={36.3} r={5} fill={C.skyDeep} />
    <circle cx={61.5} cy={36.3} r={5} fill={C.skyDeep} />
    <ellipse cx={38.5} cy={39} rx={3.2} ry={1.8} fill={C.sky} />
    <ellipse cx={61.5} cy={39} rx={3.2} ry={1.8} fill={C.sky} />
    <circle cx={38.5} cy={36.3} r={2.2} fill={C.ink} />
    <circle cx={61.5} cy={36.3} r={2.2} fill={C.ink} />
    <circle cx={36.3} cy={33.9} r={1.6} fill={C.white} />
    <circle cx={59.3} cy={33.9} r={1.6} fill={C.white} />
    <path d="M31,36 C33,29.5 44,29 46,36.5 M69,36 C67,29.5 56,29 54,36.5" stroke={C.ink} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M32.2,39.6 C35,42.6 43,42.2 46,36.5 M67.8,39.6 C65,42.6 57,42.2 54,36.5" stroke={C.ink} strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.5} />

    {/* Bill: wide enough to break the chin line, dark underside, lit top plate */}
    <path d="M33,45 Q50,41 67,45 Q68,57 50,61 Q32,57 33,45 Z" fill={C.sunDeep} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
    <path d="M34,45.5 Q50,41.5 66,45.5 Q50,51 34,45.5 Z" fill={C.sun} />
    <path d="M35,48.5 Q50,53 65,48.5" stroke={C.wineDeep} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.45} />
    <circle cx={42} cy={45.5} r={1.2} fill={C.ink} opacity={0.5} />
    <path d="M32,64 Q50,72 68,64" stroke={C.sunDeep} strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.6} />

    {/* Hat cord: two short ends dangling free of the brim tips, clear of the face */}
    <path d="M20,23 Q17.5,28 19,33 M80,23 Q82.5,28 81,33" stroke={C.wine} strokeWidth={2.4} strokeLinecap="round" fill="none" />
    <circle cx={19} cy={34.5} r={2.2} fill={C.wineDeep} />
    <circle cx={81} cy={34.5} r={2.2} fill={C.wineDeep} />

    {/* 斗笠: woven cone with a drooping brim that overhangs both temples */}
    <path
      d="M50,1 C43,4 34,9 28,15 Q17,18 14,21 Q50,28 86,21 Q83,18 72,15 C66,9 57,4 50,1 Z"
      fill="url(#duck-hat)"
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <path d="M50,3 Q40,10 32,17 M50,3 L50,20 M50,3 Q60,10 68,17" stroke={C.sandDeep} strokeWidth={1.8} strokeLinecap="round" fill="none" />
    <path d="M35,11 Q50,16 65,11 M22,21 Q50,27 78,21" stroke={C.sandDeep} strokeWidth={1.8} strokeLinecap="round" fill="none" />
    <path d="M50,3 Q45,11 41,19 M50,3 Q55,11 59,19" stroke={C.sandDeep} strokeWidth={1.5} strokeLinecap="round" fill="none" opacity={0.7} />
    <path d="M20,22 Q50,29 80,22" stroke={C.sand} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.5} />
    <path d="M46,3 Q36,9 29,16 L35,17 Q43,8 49,4 Z" fill={C.white} opacity={0.3} />
    <path d="M70,16 Q83,19 86,21 Q68,26 56,27 Q70,22 70,16 Z" fill={C.sandDeep} />
  </svg>
);

/** Mom: a plum 襦裙 under a cream 披帛, black hair side-parted into a bun with a gold 簪, one hand waving. */
export const Mom: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id="mom-skirt" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor={C.plum} />
        <stop offset="1" stopColor={C.plumDeep} />
      </linearGradient>
      <linearGradient id="mom-sash" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.gold} />
        <stop offset="1" stopColor={C.goldDeep} />
      </linearGradient>
    </defs>

    {/* Hair behind the head, then the gathered bun and its gold pin */}
    <path d="M29,15 Q17,31 20,50 Q22,60 30,60 Q35,48 32,34 Z" fill={C.hairDeep} />
    <path d="M71,15 Q83,31 80,50 Q78,60 70,60 Q65,48 68,34 Z" fill={C.hairDeep} />
    <ellipse cx={46} cy={10} rx={13} ry={8.5} fill={C.hair} stroke={C.ink} strokeWidth={3} />
    <path d="M38,12 Q45,4 54,8" stroke={C.hairLight} strokeWidth={2.2} strokeLinecap="round" fill="none" />
    <path d="M36,10 L60,4" stroke={C.goldDeep} strokeWidth={4} strokeLinecap="round" fill="none" />
    <path d="M36,10 L60,4" stroke={C.gold} strokeWidth={2} strokeLinecap="round" fill="none" />
    <circle cx={62} cy={5} r={3} fill={C.gold} stroke={C.goldDeep} strokeWidth={1.5} />

    {/* Cloth shoes peeking out from under the hem */}
    <path d="M33,88 Q40,84 46,89 L47,93 Q39,95 32,93 Z" fill={C.wine} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M54,89 Q60,84 67,88 L68,93 Q61,95 53,93 Z" fill={C.wine} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M32,93 Q39,95 47,93 L47,95.5 Q39,97.5 32,95.5 Z" fill={C.wineDeep} stroke={C.ink} strokeWidth={2} strokeLinejoin="round" />
    <path d="M53,93 Q61,95 68,93 L68,95.5 Q61,97.5 53,95.5 Z" fill={C.wineDeep} stroke={C.ink} strokeWidth={2} strokeLinejoin="round" />

    {/* Wide sleeves, drawn before the gown so the shoulder joins vanish under it */}
    <path d="M40,58 Q27,63 22,73 Q18,81 26,83 Q34,82 34,74 Q36,66 44,62 Z" fill={C.plum} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M21,76 Q28,80 34,76 Q34,81 26,83 Q19,82 21,76 Z" fill={C.plumDeep} />
    <path d="M30,66 Q25,72 24,78" stroke={C.white} strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.3} />
    <circle cx={27} cy={86} r={5.2} fill={C.skin} stroke={C.ink} strokeWidth={3} />
    <path d="M26,83.5 L26,88.5" stroke={C.skinDeep} strokeWidth={1.6} strokeLinecap="round" fill="none" />

    <path d="M60,56 Q76,47 80,33 L88,37 Q88,51 82,59 Q73,66 61,65 Z" fill={C.plum} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M80,33 L88,37 Q88,45 85,50 L77,44 Z" fill={C.plumDeep} />
    <path d="M66,58 Q76,52 79,41" stroke={C.plumDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
    <circle cx={83} cy={28} r={5.5} fill={C.skin} stroke={C.ink} strokeWidth={3} />
    <path d="M80.3,26.5 L85.7,26" stroke={C.skinDeep} strokeWidth={1.6} strokeLinecap="round" fill="none" />

    {/* Neck, then the 襦 and the long skirt */}
    <path d="M44,42 L44,58 L56,58 L56,42 Z" fill={C.skin} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M44,44 L56,44 L56,52 Q50,49 44,50 Z" fill={C.skinDeep} />
    <path d="M35,72 L28,88 Q50,93 72,88 L65,72 Z" fill="url(#mom-skirt)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M44,73 Q42,82 40,90 M56,73 Q58,82 60,90" stroke={C.plumDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
    <path d="M36,74 Q33,81 31,87" stroke={C.white} strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.25} />
    <path d="M36,57 Q50,52 64,57 L67,74 L33,74 Z" fill={C.plum} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M58,54 L64,57 L67,74 L57,74 Z" fill={C.plumDeep} />

    {/* 交領 collar, cream 披帛 down the front, gold sash at the waist */}
    <path d="M41,55 L50,71 L61,54 L57,52 L50,63 L45,53 Z" fill={C.cream} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M42,63 L58,63 L62,88 Q50,91 38,88 Z" fill={C.cream} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M53,63 L58,63 L62,88 Q57,90 53,90 Z" fill={C.paper} />
    <path d="M47,66 L47,87 M50,68 L50,88" stroke={C.sand} strokeWidth={1.8} strokeLinecap="round" fill="none" />
    <path d="M33,70 Q50,76 67,70 L67,78 Q50,84 33,78 Z" fill="url(#mom-sash)" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M36,74 Q50,79 64,74" stroke={C.goldDeep} strokeWidth={1.8} strokeLinecap="round" fill="none" />

    {/* Face */}
    <ellipse cx={50} cy={29} rx={22} ry={21} fill={C.skin} stroke={C.ink} strokeWidth={4} />
    <path d="M69,39.5 A22,21 0 0 1 40.7,48 C55,47 65,42 69,39.5 Z" fill={C.skinDeep} opacity={0.55} />
    <path d="M31,21 Q50,16 69,21 Q50,28 31,21 Z" fill={C.skinDeep} opacity={0.4} />

    {/* Front hair: parted left of centre, tips pointed, forehead left bare */}
    <path
      d="M28,29 A22,21 0 0 1 72,29 C70,19 64,12 55,11 Q52,21 47,14 Q42,23 38,15 C32,17 29,22 28,29 Z"
      fill={C.hair}
    />
    <path d="M55,11 C64,12 70,19 72,29 Q68,20 60,15 Z" fill={C.hairDeep} />
    <path d="M45,13 Q36,18 32,26 M50,12 Q42,17 38,24" stroke={C.hairLight} strokeWidth={2.2} strokeLinecap="round" fill="none" />

    <ellipse cx={35} cy={39} rx={5.5} ry={3} fill={C.berry} opacity={0.3} />
    <ellipse cx={65} cy={39} rx={5.5} ry={3} fill={C.berry} opacity={0.3} />

    {/* Almond eyes: sclera, plum iris with a lit lower rim, pupil, glint, heavy upper lid */}
    <path d="M32,32 C34,25.5 45,25 47,32.5 C45,39.5 34,39 32,32 Z" fill={C.cream} />
    <path d="M68,32 C66,25.5 55,25 53,32.5 C55,39.5 66,39 68,32 Z" fill={C.cream} />
    <path d="M32,32 C34,25.5 45,25 47,32.5 C44,28.8 36,28.3 32,32 Z" fill={C.skinDeep} opacity={0.5} />
    <path d="M68,32 C66,25.5 55,25 53,32.5 C56,28.8 64,28.3 68,32 Z" fill={C.skinDeep} opacity={0.5} />
    <circle cx={39.5} cy={32.3} r={5} fill={C.plumDeep} />
    <circle cx={60.5} cy={32.3} r={5} fill={C.plumDeep} />
    <ellipse cx={39.5} cy={35} rx={3.2} ry={1.8} fill={C.plum} />
    <ellipse cx={60.5} cy={35} rx={3.2} ry={1.8} fill={C.plum} />
    <circle cx={39.5} cy={32.3} r={2.2} fill={C.ink} />
    <circle cx={60.5} cy={32.3} r={2.2} fill={C.ink} />
    <circle cx={37.3} cy={29.9} r={1.6} fill={C.white} />
    <circle cx={58.3} cy={29.9} r={1.6} fill={C.white} />
    <path d="M32,32 C34,25.5 45,25 47,32.5 M68,32 C66,25.5 55,25 53,32.5" stroke={C.ink} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M33.2,35.6 C36,38.6 44,38.2 47,32.5 M66.8,35.6 C64,38.6 56,38.2 53,32.5" stroke={C.ink} strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.5} />
    <path d="M31.5,23 Q39,19.5 46,22.5 M68.5,23 Q61,19.5 54,22.5" stroke={C.hair} strokeWidth={2.2} strokeLinecap="round" fill="none" />

    <path d="M50,37 L48,41 L51.5,41" stroke={C.skinDeep} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M45.5,44.5 Q50,48.5 54.5,44.5" stroke={C.ink} strokeWidth={2.2} strokeLinecap="round" fill="none" />
  </svg>
);

/** Dad: a 書生 in a sky 長衫 with a mocha sash, round glasses over sleepy lids, one hand up scratching his head. */
export const Dad: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id="dad-robe" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor={C.sky} />
        <stop offset="1" stopColor={C.skyDeep} />
      </linearGradient>
    </defs>

    {/* Hair behind the head, then the scholar's topknot in its wine band */}
    <path d="M32,20 Q25,30 26,42 Q28,48 33,47 Q34,36 34,28 Z" fill={C.hairDeep} />
    <path d="M68,20 Q75,30 74,42 Q72,48 67,47 Q66,36 66,28 Z" fill={C.hairDeep} />
    <ellipse cx={50} cy={7} rx={8.5} ry={6.5} fill={C.hair} stroke={C.ink} strokeWidth={3} />
    <path d="M45,4 Q50,1.5 55,4" stroke={C.hairLight} strokeWidth={2} strokeLinecap="round" fill="none" />
    <path d="M42,11 L58,11 L57,15.5 L43,15.5 Z" fill={C.wine} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M43,12.5 L57,12.5" stroke={C.wineDeep} strokeWidth={1.6} strokeLinecap="round" fill="none" />

    <path d="M32,88 Q40,84 47,88 L48,93 Q40,95.5 31,93 Z" fill={C.ink} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M53,88 Q60,84 68,88 L69,93 Q60,95.5 52,93 Z" fill={C.ink} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M31,93 Q40,95.5 48,93 L48,96 Q40,98 31,96 Z" fill={C.greyDeep} stroke={C.ink} strokeWidth={2} strokeLinejoin="round" />
    <path d="M52,93 Q60,95.5 69,93 L69,96 Q60,98 52,96 Z" fill={C.greyDeep} stroke={C.ink} strokeWidth={2} strokeLinejoin="round" />

    {/* Sleeves before the robe. The right arm turns a hard elbow instead of looping */}
    <path d="M38,58 Q26,63 21,74 Q17,83 26,85 Q34,84 34,75 Q36,66 43,62 Z" fill={C.sky} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M21,77 Q28,81 34,77 Q34,83 26,85 Q18,84 21,77 Z" fill={C.skyDeep} />
    <path d="M30,65 Q25,71 23,78" stroke={C.white} strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.3} />
    <circle cx={27} cy={88} r={5} fill={C.skin} stroke={C.ink} strokeWidth={3} />
    <path d="M26,68 Q22,74 21,79" stroke={C.skyDeep} strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.7} />
    <path d="M26,85.5 L26,90.5" stroke={C.skinDeep} strokeWidth={1.6} strokeLinecap="round" fill="none" />

    <path d="M62,52 L79,45 Q85,55 77,62 Q68,65 62,60 Z" fill={C.skyDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M60,54 L78,47 L83,31 L74,28 L70,43 L58,49 Z" fill={C.sky} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M74,28 L83,31 L81,38 L72,35 Z" fill={C.skyDeep} />
    <path d="M64,52 Q73,47 75,38" stroke={C.skyDeep} strokeWidth={2} strokeLinecap="round" fill="none" />

    {/* Long 長衫 with a crossed collar and a mocha sash */}
    <path d="M36,57 Q50,52 64,57 L70,88 Q50,93 30,88 Z" fill="url(#dad-robe)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M57,53 L64,57 L70,88 Q62,91 56,91 Z" fill={C.skyDeep} />
    <path d="M44,74 L42,90 M56,74 L58,90" stroke={C.skyDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
    <path d="M37,60 Q33,73 32,86" stroke={C.white} strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.28} />
    <path d="M44,42 L44,58 L56,58 L56,42 Z" fill={C.skin} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M44,44 L56,44 L56,52 Q50,49 44,50 Z" fill={C.skinDeep} />
    <path d="M39,78 Q50,82 61,78" stroke={C.skyDeep} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.6} />
    <path d="M32,84 Q50,89 68,84" stroke={C.skyDeep} strokeWidth={2.4} strokeLinecap="round" fill="none" />
    <path d="M41,55 L50,72 L61,54 L57,52 L50,64 L45,53 Z" fill={C.cream} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M33,70 L67,70 L67,78 L33,78 Z" fill={C.mochaDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M33,71 L67,71 L67,73.5 L33,73.5 Z" fill={C.mocha} />
    <path d="M62,78 L66,78 L67,90 L62,88 Z" fill={C.mochaDeep} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    {/* A rolled scroll tucked through the sash - he is a 書生 after all */}
    <path d="M28,72 L40,69 L41,74 L29,77 Z" fill={C.cream} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M28,72 L29,77 L31,76.5 L30,71.5 Z" fill={C.sand} />
    <path d="M33,70.5 L34,75.5 M36,70 L37,75" stroke={C.sandDeep} strokeWidth={1.4} strokeLinecap="round" fill="none" />

    {/* Face */}
    <ellipse cx={50} cy={29} rx={22} ry={21} fill={C.skin} stroke={C.ink} strokeWidth={4} />
    <path d="M69,39.5 A22,21 0 0 1 40.7,48 C55,47 65,42 69,39.5 Z" fill={C.skinDeep} opacity={0.55} />
    <path d="M31,21 Q50,16 69,21 Q50,28 31,21 Z" fill={C.skinDeep} opacity={0.4} />
    <path
      d="M28,29 A22,21 0 0 1 72,29 C71,19 64,13 57,13 Q53,20 50,14 Q45,21 41,14 C33,15 29,21 28,29 Z"
      fill={C.hair}
    />
    <path d="M57,13 C64,13 71,19 72,29 Q68,20 60,16 Z" fill={C.hairDeep} />
    <path d="M44,15 Q36,19 32,26" stroke={C.hairLight} strokeWidth={2.2} strokeLinecap="round" fill="none" />
    <path d="M60,13 Q70,7 74,13 Q66,12 62,17 Z" fill={C.hair} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />

    <ellipse cx={34} cy={41} rx={5} ry={2.8} fill={C.berry} opacity={0.28} />
    <ellipse cx={66} cy={41} rx={5} ry={2.8} fill={C.berry} opacity={0.28} />
    <path d="M31.5,23 Q39,19.5 46,23 M68.5,23 Q61,19.5 54,23" stroke={C.hair} strokeWidth={2.2} strokeLinecap="round" fill="none" />

    {/* Round glasses: white lens, sleepy lid across it, one diagonal glare */}
    <circle cx={39} cy={32} r={7.5} fill={C.white} stroke={C.ink} strokeWidth={2.2} />
    <circle cx={61} cy={32} r={7.5} fill={C.white} stroke={C.ink} strokeWidth={2.2} />
    <path d="M32.5,32 C34.5,26.5 43.5,26 45.5,32.5 C43.5,38.5 34.5,38 32.5,32 Z" fill={C.cream} />
    <path d="M67.5,32 C65.5,26.5 56.5,26 54.5,32.5 C56.5,38.5 65.5,38 67.5,32 Z" fill={C.cream} />
    <circle cx={39} cy={32.3} r={4.4} fill={C.skyDeep} />
    <circle cx={61} cy={32.3} r={4.4} fill={C.skyDeep} />
    <ellipse cx={39} cy={34.7} rx={2.8} ry={1.6} fill={C.sky} />
    <ellipse cx={61} cy={34.7} rx={2.8} ry={1.6} fill={C.sky} />
    <circle cx={39} cy={32.3} r={2} fill={C.ink} />
    <circle cx={61} cy={32.3} r={2} fill={C.ink} />
    <circle cx={37} cy={30.2} r={1.4} fill={C.white} />
    <circle cx={59} cy={30.2} r={1.4} fill={C.white} />
    <path d="M32.5,32 C34.5,26.5 43.5,26 45.5,32.5 M67.5,32 C65.5,26.5 56.5,26 54.5,32.5" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" fill="none" />
    <path d="M32.5,30 Q39,35.5 45.5,30 M54.5,30 Q61,35.5 67.5,30" stroke={C.ink} strokeWidth={3.2} strokeLinecap="round" fill="none" />
    <path d="M35,36.5 L43,28.5 M57,36.5 L65,28.5" stroke={C.white} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.5} />
    <circle cx={39} cy={32} r={7.5} fill="none" stroke={C.ink} strokeWidth={2.2} />
    <circle cx={61} cy={32} r={7.5} fill="none" stroke={C.ink} strokeWidth={2.2} />
    <path d="M46.5,32 L53.5,32 M31.5,31 L27,32 M68.5,31 L73,32" stroke={C.ink} strokeWidth={2} strokeLinecap="round" fill="none" />

    <path d="M50,38 L48,42 L51.5,42" stroke={C.skinDeep} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M45,45.5 Q50,49.5 55.5,45" stroke={C.ink} strokeWidth={2.2} strokeLinecap="round" fill="none" />

    {/* His hand lands last, on top of the hair it is scratching */}
    <circle cx={78} cy={25} r={5.5} fill={C.skin} stroke={C.ink} strokeWidth={3} />
    <path d="M75,23 L81,22 M75.5,26.5 L81,26" stroke={C.skinDeep} strokeWidth={1.6} strokeLinecap="round" fill="none" />
  </svg>
);

/** Grandma: a coiled grey bun with spiral lines, a leaf 對襟 jacket over a paper gown, closed laughing eyes. */
export const Grandma: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id="gran-coat" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor={C.leaf} />
        <stop offset="1" stopColor={C.leafDeep} />
      </linearGradient>
    </defs>

    {/* The coiled bun sits above the crown, its spiral drawn in the deeper grey */}
    <ellipse cx={50} cy={11} rx={12} ry={9.5} fill={C.grey} stroke={C.ink} strokeWidth={3.5} />
    <path d="M56,13 Q52,4 45,7 Q40,10 44,15 Q48,18 52,14" stroke={C.greyDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
    <path d="M45,11 Q50,8 54,11" stroke={C.greyDeep} strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.8} />
    <path d="M43,6 Q49,3 55,6" stroke={C.white} strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.6} />
    <path d="M50,20 Q62,19 62,12 Q62,7 56,5" stroke={C.greyDeep} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.7} />
    <path d="M40,14 L62,6" stroke={C.goldDeep} strokeWidth={3.5} strokeLinecap="round" fill="none" />
    <path d="M40,14 L62,6" stroke={C.gold} strokeWidth={1.8} strokeLinecap="round" fill="none" />
    <circle cx={63} cy={5.5} r={2.6} fill={C.jade} stroke={C.goldDeep} strokeWidth={1.5} />

    <path d="M32,86 Q40,82 47,86 L48,92 Q40,94.5 31,92 Z" fill={C.mochaDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M35,88 Q40,86 45,88 M55,88 Q60,86 65,88" stroke={C.ink} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.6} />
    <path d="M34,90 L46,90 M54,90 L66,90" stroke={C.sandDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
    <path d="M53,86 Q60,82 68,86 L69,92 Q60,94.5 52,92 Z" fill={C.mochaDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M31,92 Q40,94.5 48,92 L48,95 Q40,97 31,95 Z" fill={C.ink} />
    <path d="M52,92 Q60,94.5 69,92 L69,95 Q60,97 52,95 Z" fill={C.ink} />

    {/* Short round sleeves, bowed further out than Mom's - that bow is what reads as older */}
    <path d="M38,60 Q25,63 20,73 Q17,81 25,82 Q32,81 32,74 Q34,67 42,63 Z" fill={C.leaf} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M20,76 Q26,80 32,76 Q32,81 25,82 Q18,81 20,76 Z" fill={C.leafDeep} />
    <path d="M19,75 Q26,79 33,75" stroke={C.leafDeep} strokeWidth={2.4} strokeLinecap="round" fill="none" />
    <path d="M21,80 Q25,82 29,80.5" stroke={C.jade} strokeWidth={2.2} strokeLinecap="round" fill="none" />
    <circle cx={25} cy={85} r={5.2} fill={C.skin} stroke={C.ink} strokeWidth={3} />
    <path d="M24,82.5 L24,87.5" stroke={C.skinDeep} strokeWidth={1.6} strokeLinecap="round" fill="none" />
    <path d="M62,60 Q75,63 80,73 Q83,81 75,82 Q68,81 68,74 Q66,67 58,63 Z" fill={C.leaf} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M80,76 Q74,80 68,76 Q68,81 75,82 Q82,81 80,76 Z" fill={C.leafDeep} />
    <path d="M81,75 Q74,79 67,75" stroke={C.leafDeep} strokeWidth={2.4} strokeLinecap="round" fill="none" />
    <circle cx={75} cy={85} r={5.2} fill={C.skin} stroke={C.ink} strokeWidth={3} />
    <path d="M76,82.5 L76,87.5" stroke={C.skinDeep} strokeWidth={1.6} strokeLinecap="round" fill="none" />

    {/* Neck, paper gown, then the 對襟 jacket whose two front panels meet down the middle */}
    <path d="M45,44 L45,60 L55,60 L55,44 Z" fill={C.skin} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M45,46 L55,46 L55,54 Q50,51 45,52 Z" fill={C.skinDeep} />
    <path d="M39,58 Q50,54 61,58 L64,84 Q50,88 36,84 Z" fill={C.paper} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M50,60 L50,86" stroke={C.sandDeep} strokeWidth={1.8} strokeLinecap="round" fill="none" />
    <path d="M38,59 Q50,55 62,59 L69,82 Q60,85 55,85 L54,62 L46,62 L45,85 Q40,85 31,82 Z" fill="url(#gran-coat)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M56,60 Q61,58 62,59 L69,82 Q62,85 56,85 Z" fill={C.leafDeep} />
    <path d="M38,65 Q35,74 34,81" stroke={C.white} strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.28} />
    <path d="M41,68 Q39,77 38,83 M60,68 Q62,77 63,83" stroke={C.leafDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
    <path d="M46,62 L45,85 M54,62 L55,85" stroke={C.leafDeep} strokeWidth={2.6} strokeLinecap="round" fill="none" />
    <path d="M48,74 L52,74 M48,79 L52,79" stroke={C.goldDeep} strokeWidth={2.6} strokeLinecap="round" fill="none" />
    <path d="M38,82 Q50,86 62,82" stroke={C.sandDeep} strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.7} />
    <path d="M43,58 Q50,62 57,58" stroke={C.leafDeep} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M40,63 Q34,66 32,71 M60,63 Q66,66 68,71" stroke={C.leafDeep} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.8} />
    <path d="M44,60 L50,68 L57,59 L54,57 L50,63 L47,57 Z" fill={C.berry} stroke={C.ink} strokeWidth={2.2} strokeLinejoin="round" />
    <circle cx={50} cy={70} r={3.2} fill={C.berry} stroke={C.berryDeep} strokeWidth={1.6} />
    <path d="M33,86 Q50,90 67,86" stroke={C.leafDeep} strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.75} />
    <path d="M23,66 Q20,71 19,76 M77,66 Q80,71 81,76" stroke={C.leafDeep} strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.7} />

    {/* Face: a little larger and rounder than Mom's */}
    <ellipse cx={50} cy={31} rx={23} ry={21} fill={C.skin} stroke={C.ink} strokeWidth={4} />
    <path d="M70.9,41.5 A23,21 0 0 1 40.3,50 C56,49 66.5,44 70.9,41.5 Z" fill={C.skinDeep} opacity={0.55} />
    <path d="M30,23 Q50,18 70,23 Q50,30 30,23 Z" fill={C.skinDeep} opacity={0.4} />
    <path
      d="M27,31 A23,21 0 0 1 73,31 C71,21 63,15 50,15 C37,15 29,21 27,31 Z"
      fill={C.grey}
      stroke={C.ink}
      strokeWidth={3}
      strokeLinejoin="round"
    />
    <path d="M56,15 C64,16 71,21 73,31 Q69,22 59,18 Z" fill={C.greyDeep} />
    <path d="M45,17 Q36,21 32,28 M52,16 Q43,19 38,25" stroke={C.white} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.65} />
    <path d="M39,19 Q50,16 61,19" stroke={C.white} strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.5} />
    <path d="M31,29 Q40,24 50,23 Q60,24 69,29" stroke={C.greyDeep} strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.6} />

    <ellipse cx={33} cy={41} rx={6} ry={3.2} fill={C.berry} opacity={0.3} />
    <ellipse cx={67} cy={41} rx={6} ry={3.2} fill={C.berry} opacity={0.3} />

    {/* Closed laughing eyes, with three short crinkles at each outer corner */}
    <path d="M32,36 Q39.5,28 47,35 M68,36 Q60.5,28 53,35" stroke={C.ink} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M33,37.5 Q39.5,33 46,37 M67,37.5 Q60.5,33 54,37" stroke={C.skinDeep} strokeWidth={1.6} strokeLinecap="round" fill="none" />
    <path d="M30.8,34.6 L28.6,32.8 M30.6,37.8 L28.4,39.4" stroke={C.skinDeep} strokeWidth={1.5} strokeLinecap="round" fill="none" />
    <path d="M69.2,34.6 L71.4,32.8 M69.4,37.8 L71.6,39.4" stroke={C.skinDeep} strokeWidth={1.5} strokeLinecap="round" fill="none" />
    <path d="M31.5,26 Q39,22.5 46.5,25.5 M68.5,26 Q61,22.5 53.5,25.5" stroke={C.greyDeep} strokeWidth={2.4} strokeLinecap="round" fill="none" />

    <path d="M50,39 L48,43 L51.5,43" stroke={C.skinDeep} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M45,46.5 Q50,51.5 55,46.5" stroke={C.ink} strokeWidth={2.2} strokeLinecap="round" fill="none" />
    <path d="M47,49 Q50,50.5 53,49" stroke={C.skinDeep} strokeWidth={1.6} strokeLinecap="round" fill="none" />
    <path d="M43,44 Q39,45 37,47 M57,44 Q61,45 63,47" stroke={C.skinDeep} strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.6} />
  </svg>
);

/** Kid: the neighbour girl in 雙髻 - two buns on berry ribbons with trailing streamers - over a sun 襦裙. */
export const Kid: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id="kid-skirt" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor={C.sun} />
        <stop offset="1" stopColor={C.sunDeep} />
      </linearGradient>
    </defs>

    {/* Ribbon streamers trailing behind each bun */}
    <path d="M27,20 Q17,32 20,45 Q23,50 27,47 Q22,35 31,25 Z" fill={C.berry} stroke={C.ink} strokeWidth={2.2} strokeLinejoin="round" />
    <path d="M73,20 Q83,32 80,45 Q77,50 73,47 Q78,35 69,25 Z" fill={C.berry} stroke={C.ink} strokeWidth={2.2} strokeLinejoin="round" />
    <path d="M25,26 Q21,35 22,44 M75,26 Q79,35 78,44" stroke={C.berryDeep} strokeWidth={1.8} strokeLinecap="round" fill="none" />

    {/* Hair behind the head, then the two 雙髻 buns and their berry bands */}
    <path d="M31,18 Q22,30 24,44 Q26,52 32,51 Q34,38 34,28 Z" fill={C.hairDeep} />
    <path d="M69,18 Q78,30 76,44 Q74,52 68,51 Q66,38 66,28 Z" fill={C.hairDeep} />
    <ellipse cx={31} cy={13} rx={10} ry={9} fill={C.hair} stroke={C.ink} strokeWidth={3} />
    <ellipse cx={69} cy={13} rx={10} ry={9} fill={C.hair} stroke={C.ink} strokeWidth={3} />
    <path d="M37,7 Q41,13 36,20 Q29,23 24,19 Q33,19 35,13 Q36,10 35,7 Z" fill={C.hairDeep} />
    <path d="M63,7 Q59,13 64,20 Q71,23 76,19 Q67,19 65,13 Q64,10 65,7 Z" fill={C.hairDeep} />
    <path d="M24,9 Q31,5.5 38,9 M23,14.5 Q30,11.5 36,15.5" stroke={C.hairLight} strokeWidth={2} strokeLinecap="round" fill="none" />
    <path d="M76,9 Q69,5.5 62,9 M77,14.5 Q70,11.5 64,15.5" stroke={C.hairLight} strokeWidth={2} strokeLinecap="round" fill="none" />

    <path d="M33,88 Q40,84 47,88 L48,93 Q40,95.5 32,93 Z" fill={C.berry} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M53,88 Q60,84 67,88 L68,93 Q60,95.5 52,93 Z" fill={C.berry} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M32,93 Q40,95.5 48,93 L48,95.5 Q40,97.5 32,95.5 Z" fill={C.berryDeep} stroke={C.ink} strokeWidth={2} strokeLinejoin="round" />
    <path d="M52,93 Q60,95.5 68,93 L68,95.5 Q60,97.5 52,95.5 Z" fill={C.berryDeep} stroke={C.ink} strokeWidth={2} strokeLinejoin="round" />

    {/* Both sleeves thrown open in greeting; each ends in a bell-shaped cuff */}
    <path d="M40,58 Q28,56 19,61 L13,68 Q11,75 18,76 Q25,75 24,68 Q30,64 43,63 Z" fill={C.sun} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M13,70 Q19,74 24,70 Q25,75 18,76 Q11,75 13,70 Z" fill={C.sunDeep} />
    <circle cx={16} cy={80} r={5.2} fill={C.skin} stroke={C.ink} strokeWidth={3} />
    <path d="M15,77.5 L15,82.5" stroke={C.skinDeep} strokeWidth={1.6} strokeLinecap="round" fill="none" />
    <path d="M60,58 Q72,56 81,61 L87,68 Q89,75 82,76 Q75,75 76,68 Q70,64 57,63 Z" fill={C.sun} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M87,70 Q81,74 76,70 Q75,75 82,76 Q89,75 87,70 Z" fill={C.sunDeep} />
    <circle cx={84} cy={80} r={5.2} fill={C.skin} stroke={C.ink} strokeWidth={3} />
    <path d="M85,77.5 L85,82.5" stroke={C.skinDeep} strokeWidth={1.6} strokeLinecap="round" fill="none" />

    {/* Neck, sun 襦裙, white collar, berry sash */}
    <path d="M45,43 L45,58 L55,58 L55,43 Z" fill={C.skin} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M45,45 L55,45 L55,53 Q50,50 45,51 Z" fill={C.skinDeep} />
    <path d="M37,70 L31,88 Q50,92 69,88 L63,70 Z" fill="url(#kid-skirt)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M44,71 L42,90 M56,71 L58,90" stroke={C.sunDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
    <path d="M38,72 Q35,80 34,87" stroke={C.white} strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.3} />
    <path d="M38,57 Q50,53 62,57 L65,72 L35,72 Z" fill={C.sun} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M57,54 L62,57 L65,72 L56,72 Z" fill={C.sunDeep} />
    <path d="M42,55 L50,70 L60,54 L56,52 L50,62 L46,53 Z" fill={C.white} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M35,68 Q50,73 65,68 L65,75 Q50,80 35,75 Z" fill={C.berry} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M37,72 Q50,76 63,72" stroke={C.berryDeep} strokeWidth={1.8} strokeLinecap="round" fill="none" />

    {/* Face */}
    <ellipse cx={50} cy={29} rx={22} ry={21} fill={C.skin} stroke={C.ink} strokeWidth={4} />
    <path d="M69,39.5 A22,21 0 0 1 40.7,48 C55,47 65,42 69,39.5 Z" fill={C.skinDeep} opacity={0.5} />
    <path d="M31,22 Q50,17 69,22 Q50,29 31,22 Z" fill={C.skinDeep} opacity={0.4} />
    <path
      d="M28,29 A22,21 0 0 1 72,29 C71,19 65,13 58,13 Q54,22 51,15 L50,12 L49,15 Q46,22 42,13 C35,13 29,20 28,29 Z"
      fill={C.hair}
    />
    <path d="M58,13 C65,13 71,19 72,29 Q68,20 60,16 Z" fill={C.hairDeep} />
    <path d="M45,15 Q36,19 32,27 M40,14 Q34,18 31,23" stroke={C.hairLight} strokeWidth={2.2} strokeLinecap="round" fill="none" />
    {/* Each 髻 is gathered out of the fringe and tied at the root, not stuck on the side */}
    <path d="M43,21 Q38,18 33,16 M57,21 Q62,18 67,16" stroke={C.hair} strokeWidth={8} strokeLinecap="round" fill="none" />
    <path d="M43,20 Q38,17.5 34,15.8 M57,20 Q62,17.5 66,15.8" stroke={C.hairLight} strokeWidth={1.8} strokeLinecap="round" fill="none" />
    <ellipse cx={38} cy={18.5} rx={5.5} ry={3} fill={C.berry} stroke={C.ink} strokeWidth={2} transform="rotate(115 38 18.5)" />
    <ellipse cx={62} cy={18.5} rx={5.5} ry={3} fill={C.berry} stroke={C.ink} strokeWidth={2} transform="rotate(65 62 18.5)" />
    <path d="M36.2,16 Q39,18.5 37.2,21 M63.8,16 Q61,18.5 62.8,21" stroke={C.berryDeep} strokeWidth={1.5} strokeLinecap="round" fill="none" />

    <ellipse cx={34} cy={39.5} rx={6} ry={3.2} fill={C.berry} opacity={0.3} />
    <ellipse cx={66} cy={39.5} rx={6} ry={3.2} fill={C.berry} opacity={0.3} />
    <circle cx={31} cy={38.5} r={0.9} fill={C.mocha} opacity={0.8} />
    <circle cx={34.3} cy={41} r={0.9} fill={C.mocha} opacity={0.8} />
    <circle cx={37.4} cy={39} r={0.9} fill={C.mocha} opacity={0.8} />
    <circle cx={69} cy={38.5} r={0.9} fill={C.mocha} opacity={0.8} />
    <circle cx={65.7} cy={41} r={0.9} fill={C.mocha} opacity={0.8} />
    <circle cx={62.6} cy={39} r={0.9} fill={C.mocha} opacity={0.8} />

    {/* Wide laughing eyes */}
    <path d="M32,32 C34,25.5 45,25 47,32.5 C45,39.5 34,39 32,32 Z" fill={C.cream} />
    <path d="M68,32 C66,25.5 55,25 53,32.5 C55,39.5 66,39 68,32 Z" fill={C.cream} />
    <path d="M32,32 C34,25.5 45,25 47,32.5 C44,28.8 36,28.3 32,32 Z" fill={C.skinDeep} opacity={0.5} />
    <path d="M68,32 C66,25.5 55,25 53,32.5 C56,28.8 64,28.3 68,32 Z" fill={C.skinDeep} opacity={0.5} />
    <circle cx={39.5} cy={32.3} r={5} fill={C.mochaDeep} />
    <circle cx={60.5} cy={32.3} r={5} fill={C.mochaDeep} />
    <ellipse cx={39.5} cy={35} rx={3.2} ry={1.8} fill={C.mocha} />
    <ellipse cx={60.5} cy={35} rx={3.2} ry={1.8} fill={C.mocha} />
    <circle cx={39.5} cy={32.3} r={2.2} fill={C.ink} />
    <circle cx={60.5} cy={32.3} r={2.2} fill={C.ink} />
    <circle cx={37.3} cy={29.9} r={1.7} fill={C.white} />
    <circle cx={58.3} cy={29.9} r={1.7} fill={C.white} />
    <path d="M32,32 C34,25.5 45,25 47,32.5 M68,32 C66,25.5 55,25 53,32.5" stroke={C.ink} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M33.2,35.6 C36,38.6 44,38.2 47,32.5 M66.8,35.6 C64,38.6 56,38.2 53,32.5" stroke={C.ink} strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.5} />
    <path d="M32,23 Q39,19.5 46,22.5 M68,23 Q61,19.5 54,22.5" stroke={C.hair} strokeWidth={2} strokeLinecap="round" fill="none" />

    <path d="M50,37 L48.5,40 L51,40" stroke={C.skinDeep} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M43,43 Q50,52 57,43 Z" fill={C.wineDeep} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M45,44.5 L55,44.5" stroke={C.white} strokeWidth={2.6} strokeLinecap="round" fill="none" />
    <path d="M49,49.5 Q50.5,50.5 52,49" stroke={C.berry} strokeWidth={2.2} strokeLinecap="round" fill="none" />
  </svg>
);

/** Dog: a white dog sitting, a mocha patch and floppy ear on one side, berry collar with a gold bell. */
export const Dog: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id="dog-coat" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor={C.white} />
        <stop offset="1" stopColor={C.paper} />
      </linearGradient>
      <linearGradient id="dog-bell" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor={C.gold} />
        <stop offset="1" stopColor={C.goldDeep} />
      </linearGradient>
    </defs>

    {/* Tail up behind the body, shaded on its underside */}
    <path d="M73,76 Q93,68 88,50" stroke={C.ink} strokeWidth={15} strokeLinecap="round" fill="none" />
    <path d="M73,76 Q93,68 88,50" stroke={C.white} strokeWidth={9} strokeLinecap="round" fill="none" />
    <path d="M78,76 Q92,69 89,56" stroke={C.paper} strokeWidth={4} strokeLinecap="round" fill="none" />

    {/* Sitting haunches and front paws */}
    <ellipse cx={50} cy={74} rx={26} ry={21} fill="url(#dog-coat)" stroke={C.ink} strokeWidth={4} />
    <path d="M72,64 Q79,78 68,89 Q57,95 44,93 Q64,90 70,78 Q73,70 72,64 Z" fill={C.paper} />
    <path d="M64,68 Q76,72 76,82 Q70,88 62,86 Q70,80 64,68 Z" fill={C.mocha} opacity={0.9} />
    <path d="M70,72 Q76,76 75,82" stroke={C.mochaDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
    <path d="M26,70 Q23,76 25,82 Q22,86 26,89" stroke={C.paper} strokeWidth={2.4} strokeLinecap="round" fill="none" />
    <path d="M38,84 Q42,79 46,84 Q50,79 54,84" stroke={C.paper} strokeWidth={2.4} strokeLinecap="round" fill="none" />
    <ellipse cx={38} cy={64} rx={13} ry={7} fill={C.white} opacity={0.7} transform="rotate(-20 38 64)" />
    <ellipse cx={37} cy={90} rx={9} ry={6} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={63} cy={90} rx={9} ry={6} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={37} cy={93} rx={4} ry={2.4} fill={C.paper} />
    <ellipse cx={63} cy={93} rx={4} ry={2.4} fill={C.paper} />
    <path d="M34,87 L34,93 M40,87 L40,93 M60,87 L60,93 M66,87 L66,93" stroke={C.grey} strokeWidth={1.8} strokeLinecap="round" fill="none" />
    <path d="M30,93.5 L29,96 M44,93.5 L45,96 M56,93.5 L55,96 M70,93.5 L71,96" stroke={C.ink} strokeWidth={2} strokeLinecap="round" fill="none" />

    {/* Floppy ears; the mocha one is on the same side as the patch */}
    <path d="M30,20 Q11,25 11,45 Q13,55 25,51 Q20,34 32,25 Z" fill={C.mocha} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
    <path d="M14,40 Q14,50 24,50 Q25,52 25,51 Q13,55 11,45 Q11,42 14,40 Z" fill={C.mochaDeep} />
    <path d="M18,30 Q16,40 18,48" stroke={C.mochaDeep} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.6} />
    <path d="M16,28 Q12,35 12,43" stroke={C.sand} strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.45} />
    <path d="M70,20 Q87,25 86,44 Q84,53 75,50 Q80,34 68,25 Z" fill={C.white} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
    <path d="M85,38 Q85,49 76,49 Q75,51 75,50 Q84,53 86,44 Z" fill={C.paper} />

    <circle cx={50} cy={38} r={26} fill="url(#dog-coat)" stroke={C.ink} strokeWidth={4} />
    <path d="M74,30 A26,26 0 0 1 40,62.6 Q64,58 73,34 Z" fill={C.paper} />
    <ellipse cx={38.5} cy={32.5} rx={12.5} ry={11.5} fill={C.mocha} />
    <path d="M44,25 Q51,32 48,42 Q44,44 39,44 Q49,38 44,25 Z" fill={C.mochaDeep} opacity={0.7} />
    <path d="M46,13 Q50,7 55,13 Q51,13 48,17 Z" fill={C.white} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />

    <circle cx={38} cy={34} r={8.5} fill={C.white} stroke={C.ink} strokeWidth={3.5} />
    <circle cx={62} cy={34} r={8.5} fill={C.white} stroke={C.ink} strokeWidth={3.5} />
    <circle cx={38.5} cy={35} r={5} fill={C.mochaDeep} />
    <circle cx={62.5} cy={35} r={5} fill={C.mochaDeep} />
    <ellipse cx={38.5} cy={37.6} rx={3.2} ry={1.8} fill={C.mocha} />
    <ellipse cx={62.5} cy={37.6} rx={3.2} ry={1.8} fill={C.mocha} />
    <circle cx={38.5} cy={35} r={2.4} fill={C.ink} />
    <circle cx={62.5} cy={35} r={2.4} fill={C.ink} />
    <circle cx={36} cy={32} r={2} fill={C.white} />
    <circle cx={60} cy={32} r={2} fill={C.white} />
    <path d="M31,23 Q35,21 39,23 M69,23 Q65,21 61,23" stroke={C.mochaDeep} strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.75} />
    <path d="M26,44 Q22,48 22,53 M74,44 Q78,48 78,53" stroke={C.paper} strokeWidth={2.4} strokeLinecap="round" fill="none" />
    <path d="M30,52 Q27,56 28,60 M70,52 Q73,56 72,60" stroke={C.paper} strokeWidth={2.2} strokeLinecap="round" fill="none" />

    {/* Muzzle, nose, and the tongue hanging past the lip */}
    <ellipse cx={50} cy={52} rx={16} ry={11.5} fill={C.cream} stroke={C.ink} strokeWidth={3.5} />
    <path d="M62,48 Q66,58 54,63 Q46,65 40,62 Q58,60 61,48 Z" fill={C.sand} opacity={0.7} />
    <path d="M50,40 L50,44" stroke={C.sandDeep} strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.6} />
    <ellipse cx={50} cy={45} rx={5.5} ry={4} fill={C.ink} />
    <ellipse cx={48} cy={43.6} rx={2} ry={1.2} fill={C.grey} opacity={0.7} />
    <circle cx={40} cy={49} r={1.1} fill={C.mochaDeep} opacity={0.55} />
    <circle cx={43} cy={52} r={1.1} fill={C.mochaDeep} opacity={0.55} />
    <circle cx={40} cy={54.5} r={1.1} fill={C.mochaDeep} opacity={0.55} />
    <circle cx={60} cy={49} r={1.1} fill={C.mochaDeep} opacity={0.55} />
    <circle cx={57} cy={52} r={1.1} fill={C.mochaDeep} opacity={0.55} />
    <circle cx={60} cy={54.5} r={1.1} fill={C.mochaDeep} opacity={0.55} />
    <path d="M50,49 Q50,55 43,53 M50,49 Q50,55 57,53" stroke={C.ink} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M45,55 Q50,53 55,55 Q55,67 50,67 Q45,67 45,55 Z" fill={C.berry} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M50,56 L50,64" stroke={C.berryDeep} strokeWidth={2} strokeLinecap="round" fill="none" />

    {/* Berry collar with a gold bell */}
    <path d="M27,64 Q50,77 73,64" stroke={C.ink} strokeWidth={11} strokeLinecap="round" fill="none" />
    <path d="M27,64 Q50,77 73,64" stroke={C.berry} strokeWidth={6.5} strokeLinecap="round" fill="none" />
    <path d="M30,68 Q50,78 70,68" stroke={C.berryDeep} strokeWidth={2.2} strokeLinecap="round" fill="none" />
    <circle cx={50} cy={77} r={5.5} fill="url(#dog-bell)" stroke={C.ink} strokeWidth={2.5} />
    <path d="M45.5,78.5 Q50,81.5 54.5,78.5" stroke={C.goldDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
    <circle cx={50} cy={80} r={1.4} fill={C.ink} />
    <circle cx={47.6} cy={74.8} r={1.5} fill={C.white} opacity={0.8} />
    <path d="M64,69 L71,66" stroke={C.goldDeep} strokeWidth={4.5} strokeLinecap="round" fill="none" />
    <path d="M64,69 L71,66" stroke={C.gold} strokeWidth={2.4} strokeLinecap="round" fill="none" />
    <circle cx={31} cy={67} r={2.2} fill={C.gold} stroke={C.goldDeep} strokeWidth={1.4} />
  </svg>
);
