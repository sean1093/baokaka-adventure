import type { Sprite } from '../sprite';
import { C } from '../palette';

/**
 * Vendor, 老闆娘 of the market square. Round and generous: a knotted berry headscarf over a
 * three-tone fringe, a cross-collar sky 襦 with a wine sash and gold clasp, a cream 圍裙 over
 * the skirt, and both hands planted on her hips so the elbows cut two holes in the silhouette.
 */
export const Vendor: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id="vendor-skirt" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor={C.plum} />
        <stop offset="1" stopColor={C.plumDeep} />
      </linearGradient>
      <linearGradient id="vendor-scarf" x1="0.2" y1="0" x2="0.9" y2="1">
        <stop offset="0" stopColor={C.berry} />
        <stop offset="1" stopColor={C.berryDeep} />
      </linearGradient>
      <linearGradient id="vendor-apron" x1="0.2" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor={C.cream} />
        <stop offset="1" stopColor={C.paper} />
      </linearGradient>
    </defs>

    {/* Cloth shoes: pale sole slab under a brown upper, so they have thickness */}
    <rect x={28.5} y={90.5} width={17} height={5.5} rx={2.5} fill={C.paper} stroke={C.ink} strokeWidth={3} />
    <rect x={54.5} y={90.5} width={17} height={5.5} rx={2.5} fill={C.paper} stroke={C.ink} strokeWidth={3} />
    <path d="M30,91.5 Q30,84 37,84 Q44,84 44,91.5 Z" fill={C.mochaDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M56,91.5 Q56,84 63,84 Q70,84 70,91.5 Z" fill={C.mochaDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M32,90 Q32.5,86.5 35.5,85.5 M58,90 Q58.5,86.5 61.5,85.5" stroke={C.mocha} strokeWidth={2} strokeLinecap="round" fill="none" />

    {/* Long plum 襦裙 skirt: a different hue from the sky sleeves, so the arms read against it */}
    <path d="M33,62 Q27,73 24,87 L76,87 Q73,73 67,62 Z" fill="url(#vendor-skirt)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M63,63 Q69,74 70,87 L76,87 Q73,73 67,62 Z" fill={C.plumDeep} />
    <path d="M34,63 Q29,74 27,86 L32,86 Q34,74 38,64 Z" fill={C.white} opacity={0.22} />
    <path d="M42,66 Q40,77 39,86 M50,66 L50,86 M58,66 Q60,77 61,86" stroke={C.plumDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
    <path d="M25,83 Q50,87 75,83" stroke={C.plumDeep} strokeWidth={3} strokeLinecap="round" fill="none" />

    {/* Cross-collar top, shaded on her right, with the cream collar band laid over it */}
    <path d="M39,51 Q31,56 30,66 L70,66 Q69,56 61,51 Z" fill={C.sky} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M58,52 Q64,57 65,66 L70,66 Q69,56 61,51 Z" fill={C.skyDeep} />
    <path d="M41,53 Q35,57 34,65 L38,65 Q39,58 44,54 Z" fill={C.white} opacity={0.25} />
    <path d="M40,51 L50,64 L60,51 M50,64 Q55,62 57,58" stroke={C.ink} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" fill="none" />
    <path d="M40,51 L50,64 L60,51 M50,64 Q55,62 57,58" stroke={C.cream} strokeWidth={4.5} strokeLinejoin="round" strokeLinecap="round" fill="none" />

    {/* Waist 圍裙, short enough that the skirt still shows all round it */}
    <path d="M34,67 L66,67 Q69,77 67,82 Q50,85 33,82 Q31,77 34,67 Z" fill="url(#vendor-apron)" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M42,70 L41,81 M58,70 L59,81" stroke={C.sandDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
    <path d="M45,71 L55,71 L54,78 L46,78 Z" fill="none" stroke={C.sandDeep} strokeWidth={2.2} strokeLinejoin="round" />

    {/* Berry sash matching the scarf, with a gold clasp: it splits her top from her skirt */}
    <path d="M30,63 Q50,67.5 70,63 L70,70 Q50,74.5 30,70 Z" fill={C.berry} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
    <path d="M50,67.5 Q60,66 70,63 L70,70 Q60,73 50,74.5 Z" fill={C.berryDeep} />
    <rect x={45} y={63.5} width={10} height={8.5} rx={2.5} fill={C.gold} stroke={C.ink} strokeWidth={2.5} />
    <path d="M46.5,69.5 L53.5,69.5" stroke={C.goldDeep} strokeWidth={2.2} strokeLinecap="round" />

    {/* Arms akimbo: the elbow wings out past the skirt and the forearm drops to the hip, so a
        wedge of background opens between forearm, waist and upper arm on each side */}
    <path d="M39,58 Q25,59 14,66 M61,58 Q75,59 86,66" stroke={C.ink} strokeWidth={13} strokeLinecap="round" fill="none" />
    <path d="M39,58 Q25,59 14,66 M61,58 Q75,59 86,66" stroke={C.sky} strokeWidth={9} strokeLinecap="round" fill="none" />
    <path d="M17,64 Q15.5,65 14,66 M83,64 Q84.5,65 86,66" stroke={C.skyDeep} strokeWidth={9} strokeLinecap="round" fill="none" />
    <path d="M14,66 Q16,74 27,78 M86,66 Q84,74 73,78" stroke={C.ink} strokeWidth={9} strokeLinecap="round" fill="none" />
    <path d="M14,66 Q16,74 27,78 M86,66 Q84,74 73,78" stroke={C.skin} strokeWidth={5} strokeLinecap="round" fill="none" />
    <circle cx={29} cy={79} r={5.5} fill={C.skin} stroke={C.ink} strokeWidth={3} />
    <circle cx={71} cy={79} r={5.5} fill={C.skin} stroke={C.ink} strokeWidth={3} />
    <path d="M27,82.5 Q30,79.5 33.5,78.5 M73,82.5 Q70,79.5 66.5,78.5" stroke={C.skinDeep} strokeWidth={1.8} strokeLinecap="round" fill="none" />

    {/* Head: a skinDeep disc with the lit skin disc offset up-left leaves the shading crescent */}
    <ellipse cx={27.5} cy={36} rx={3} ry={4.5} fill={C.skin} stroke={C.ink} strokeWidth={3} />
    <ellipse cx={72.5} cy={36} rx={3} ry={4.5} fill={C.skin} stroke={C.ink} strokeWidth={3} />
    <circle cx={50} cy={30} r={23} fill={C.skinDeep} stroke={C.ink} strokeWidth={4} />
    <circle cx={48.4} cy={28.6} r={21.6} fill={C.skin} />
    <path d="M29,27 Q50,24.5 71,27 Q50,30 29,27 Z" fill={C.skinDeep} />

    {/* Fringe in three tones plus two loose strands, so the hairline is a shape not a helmet rim */}
    <path d="M28.1,23 Q50,16 71.9,23 Q67,27 61.5,23.5 Q55.5,29 50,23.5 Q44.5,29 38.5,23.5 Q33,27 28.1,23 Z" fill={C.hair} />
    <path d="M52,19 Q64,19.5 71.9,23 Q67,27 61.5,23.5 Q56,29 51,24 Z" fill={C.hairDeep} />
    <path d="M29,22.5 Q27,30 29.5,37 Q31.5,31 31,23 Z" fill={C.hair} />
    <path d="M71,22.5 Q73,30 70.5,37 Q68.5,31 69,23 Z" fill={C.hairDeep} />
    <path d="M33,20.5 Q40,17 48,18 M32,24 Q37,21.5 42,22" stroke={C.hairLight} strokeWidth={2} strokeLinecap="round" fill="none" />

    {/* Berry headscarf, then the tails and the knot tied off her left */}
    <path d="M28.1,23 A23,23 0 0 1 71.9,23 Q50,16 28.1,23 Z" fill="url(#vendor-scarf)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M33,17 Q39,11 46,9.5" stroke={C.white} strokeWidth={3.5} strokeLinecap="round" opacity={0.35} fill="none" />
    <path d="M75,27 Q87,32 84,40 Q76,34 71,28 Z" fill={C.berryDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <ellipse cx={75} cy={22} rx={7} ry={6} fill={C.berry} stroke={C.ink} strokeWidth={3} />
    <path d="M70.5,23.5 Q75,19.5 79.5,23.5" stroke={C.berryDeep} strokeWidth={2.2} strokeLinecap="round" fill="none" />
    <circle cx={37} cy={15} r={2.2} fill={C.cream} />
    <circle cx={50} cy={10} r={2.2} fill={C.cream} />
    <circle cx={62} cy={15} r={2.2} fill={C.cream} />

    {/* Face: fine hair brows, almond eyes with a mocha iris, soft cheeks, a laughing mouth */}
    <path d="M35,32.6 Q39.5,30 44.5,31.9 M65,32.6 Q60.5,30 55.5,31.9" stroke={C.hair} strokeWidth={2} strokeLinecap="round" fill="none" />
    <ellipse cx={35.5} cy={43} rx={5} ry={3} fill={C.berry} opacity={0.3} />
    <ellipse cx={64.5} cy={43} rx={5} ry={3} fill={C.berry} opacity={0.3} />
    <path d="M33.5,36.5 Q40,32 46.5,38.2 Q40,42.8 33.5,36.5 Z" fill={C.white} />
    <path d="M66.5,36.5 Q60,32 53.5,38.2 Q60,42.8 66.5,36.5 Z" fill={C.white} />
    <circle cx={40.3} cy={37.4} r={2.7} fill={C.mocha} />
    <circle cx={59.7} cy={37.4} r={2.7} fill={C.mocha} />
    <circle cx={40.5} cy={39} r={0.9} fill={C.sand} />
    <circle cx={59.5} cy={39} r={0.9} fill={C.sand} />
    <circle cx={40.3} cy={37.4} r={1.4} fill={C.ink} />
    <circle cx={59.7} cy={37.4} r={1.4} fill={C.ink} />
    <circle cx={39.1} cy={36.2} r={1.2} fill={C.white} />
    <circle cx={60.9} cy={36.2} r={1.2} fill={C.white} />
    <path d="M33.5,36.5 Q40,32 46.5,38.2 M66.5,36.5 Q60,32 53.5,38.2" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" fill="none" />
    <path d="M49,40.5 Q47.6,43.6 50.4,44" stroke={C.skinDeep} strokeWidth={1.8} strokeLinecap="round" fill="none" />
    <path d="M43,46 Q50,53 57,46 Z" fill={C.wine} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M44.5,46.7 L55.5,46.7 L54,49.2 L46,49.2 Z" fill={C.white} />
  </svg>
);

/**
 * Uncle, 阿伯 the douhua seller. A cone-crowned sand 斗笠 whose woven brim curves down at both
 * tips but leaves the whole face clear, white moustache above a big grin, cross-collar sky 短衫
 * belted in mocha, and his right arm bent up in a wave.
 */
export const Uncle: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id="uncle-hat" x1="0.2" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor={C.sand} />
        <stop offset="1" stopColor={C.sandDeep} />
      </linearGradient>
      <linearGradient id="uncle-shirt" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor={C.sky} />
        <stop offset="1" stopColor={C.skyDeep} />
      </linearGradient>
      <linearGradient id="uncle-trousers" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor={C.grey} />
        <stop offset="1" stopColor={C.greyDeep} />
      </linearGradient>
    </defs>

    {/* Cloth shoes on pale soles */}
    <rect x={32} y={91} width={16} height={5.5} rx={2.5} fill={C.paper} stroke={C.ink} strokeWidth={3} />
    <rect x={52} y={91} width={16} height={5.5} rx={2.5} fill={C.paper} stroke={C.ink} strokeWidth={3} />
    <path d="M33.5,92 Q33.5,86 40,86 Q46.5,86 46.5,92 Z" fill={C.mochaDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M53.5,92 Q53.5,86 60,86 Q66.5,86 66.5,92 Z" fill={C.mochaDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M35.5,90.5 Q36,87.5 39,87 M55.5,90.5 Q56,87.5 59,87" stroke={C.mocha} strokeWidth={2} strokeLinecap="round" fill="none" />

    {/* Loose grey trousers with a fold down each leg */}
    <path d="M32,74 L68,74 L66,89 L54,89 L51,82 L49,82 L46,89 L34,89 Z" fill="url(#uncle-trousers)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M63,74 L68,74 L66,89 L61,89 Q64,82 63,74 Z" fill={C.greyDeep} />
    <path d="M39,78 L38,87 M60,78 L60,87" stroke={C.greyDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
    <path d="M36,76 Q35,82 35.5,87" stroke={C.white} strokeWidth={2.5} strokeLinecap="round" opacity={0.3} fill="none" />

    {/* Cross-collar sky 短衫 */}
    <path d="M39,57 Q30,62 29,76 Q29,81 31,82 L69,82 Q71,81 71,76 Q70,62 61,57 Z" fill="url(#uncle-shirt)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M61,59 Q66,65 66,76 L66,82 L69,82 Q71,81 71,76 Q70,62 61,57 Z" fill={C.skyDeep} />
    <path d="M40,58 Q33,64 32,76 L35,76 Q36,64 42,59 Z" fill={C.white} opacity={0.25} />
    <path d="M40,58 L50,68 L60,58 M50,68 Q55,66 57,63" stroke={C.ink} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" fill="none" />
    <path d="M40,58 L50,68 L60,58 M50,68 Q55,66 57,63" stroke={C.cream} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" fill="none" />

    {/* Mocha 腰帶 with a gold clasp */}
    <path d="M29,70 Q50,73.5 71,70 L71,77 Q50,80.5 29,77 Z" fill={C.mocha} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M50,73.5 Q61,72 71,70 L71,77 Q61,79 50,80.5 Z" fill={C.mochaDeep} />
    <rect x={45.5} y={70} width={9} height={8} rx={2} fill={C.gold} stroke={C.ink} strokeWidth={2.5} />

    {/* Arms: a thick sleeve to a clearly outboard elbow, then a forearm no thinner than the wrist,
        so the raised hand stays welded to the limb instead of floating beside the brim */}
    <path d="M38,61 Q24,64 17,73 M62,60 Q76,62 83,70" stroke={C.ink} strokeWidth={15} strokeLinecap="round" fill="none" />
    <path d="M38,61 Q24,64 17,73 M62,60 Q76,62 83,70" stroke={C.sky} strokeWidth={11} strokeLinecap="round" fill="none" />
    <path d="M19,70.5 Q17.5,72 17,73 M81,67.5 Q82.5,69 83,70" stroke={C.skyDeep} strokeWidth={11} strokeLinecap="round" fill="none" />
    <path d="M17,73 Q18,80 21,83 M83,70 Q88,60 88,52" stroke={C.ink} strokeWidth={12} strokeLinecap="round" fill="none" />
    <path d="M17,73 Q18,80 21,83 M83,70 Q88,60 88,52" stroke={C.skin} strokeWidth={7} strokeLinecap="round" fill="none" />
    <circle cx={22} cy={85} r={6.5} fill={C.skin} stroke={C.ink} strokeWidth={3} />
    <circle cx={88} cy={47} r={6.5} fill={C.skin} stroke={C.ink} strokeWidth={3} />
    <path d="M19.5,87.5 Q22,84.5 25,84 M85,44.5 Q88,47.5 91,46 M85.5,48.5 Q88,50.5 90.5,49" stroke={C.skinDeep} strokeWidth={1.8} strokeLinecap="round" fill="none" />

    {/* Ears, then the head shaded by offsetting the lit disc up-left */}
    <ellipse cx={29} cy={46} rx={3.6} ry={5} fill={C.skin} stroke={C.ink} strokeWidth={3} />
    <ellipse cx={71} cy={46} rx={3.6} ry={5} fill={C.skin} stroke={C.ink} strokeWidth={3} />
    <circle cx={50} cy={41} r={20} fill={C.skinDeep} stroke={C.ink} strokeWidth={4} />
    <circle cx={48.6} cy={39.8} r={18.8} fill={C.skin} />
    <path d="M32,36 Q50,33.5 68,36 Q50,39 32,36 Z" fill={C.skinDeep} />

    {/* 斗笠: cone crown with a banded rim, then a woven brim curving down at both tips */}
    <path d="M35,29 Q37,11 50,8 Q63,11 65,29 Z" fill="url(#uncle-hat)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M57,10.5 Q62,15 64,29 L57,29 Q60,19 57,10.5 Z" fill={C.sandDeep} />
    <path d="M41,15 Q44,11 48,9.5" stroke={C.white} strokeWidth={3} strokeLinecap="round" opacity={0.45} fill="none" />
    <path d="M36,24.5 Q50,28 64,24.5 L62.5,19 Q50,22.5 37.5,19 Z" fill={C.sandDeep} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    <path
      d="M14,32 Q18,26 27,26.5 Q38,24 50,24.5 Q62,24 73,26.5 Q82,26 86,32 Q70,35 50,35 Q30,35 14,32 Z"
      fill="url(#uncle-hat)"
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <path d="M64,24.2 Q73,26.5 82,26 Q86,29 86,32 Q76,34 66,34.7 Q71,29 64,24.2 Z" fill={C.sandDeep} />
    <path d="M14,32 Q30,35 50,35 Q70,35 86,32 Q70,33.3 50,33.3 Q30,33.3 14,32 Z" fill={C.sandDeep} />
    <path d="M18,30 Q25,27.5 33,26.7 M82,30 Q75,27.5 67,26.7" stroke={C.sandDeep} strokeWidth={1.8} strokeLinecap="round" fill="none" />
    <path d="M22,27.8 L20.5,31.6 M29,26.4 L28.5,32.4 M71,26.4 L71.5,32.4 M78,27.8 L79.5,31.6" stroke={C.sandDeep} strokeWidth={1.6} strokeLinecap="round" fill="none" />

    {/* Face: white brows, warm narrowed eyes, crow's feet, then the grin under a trim moustache */}
    <path d="M33.5,41.5 Q39.5,38 45.5,40.8 M66.5,41.5 Q60.5,38 54.5,40.8" stroke={C.grey} strokeWidth={2.4} strokeLinecap="round" fill="none" />
    <path d="M33,44.5 Q40,39.8 47,46.8 Q40,50 33,44.5 Z" fill={C.white} />
    <path d="M67,44.5 Q60,39.8 53,46.8 Q60,50 67,44.5 Z" fill={C.white} />
    <circle cx={40.3} cy={45.4} r={2.5} fill={C.mocha} />
    <circle cx={59.7} cy={45.4} r={2.5} fill={C.mocha} />
    <circle cx={40.3} cy={45.4} r={1.3} fill={C.ink} />
    <circle cx={59.7} cy={45.4} r={1.3} fill={C.ink} />
    <circle cx={39.2} cy={44.4} r={1} fill={C.white} />
    <circle cx={58.6} cy={44.4} r={1} fill={C.white} />
    <path d="M33,44.5 Q40,39.8 47,46.8 M67,44.5 Q60,39.8 53,46.8" stroke={C.ink} strokeWidth={2.8} strokeLinecap="round" fill="none" />
    <path
      d="M31.6,43 L29.5,41.8 M31.4,45.5 L29.4,45.4 M31.6,48 L30.3,49.1 M68.4,43 L70.5,41.8 M68.6,45.5 L70.6,45.4 M68.4,48 L69.7,49.1"
      stroke={C.skinDeep}
      strokeWidth={2}
      strokeLinecap="round"
      fill="none"
    />
    <ellipse cx={36} cy={50} rx={4.2} ry={2.6} fill={C.berry} opacity={0.3} />
    <ellipse cx={64} cy={50} rx={4.2} ry={2.6} fill={C.berry} opacity={0.3} />
    <path d="M48.5,48.5 Q47,51.5 50.3,52" stroke={C.skinDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
    <path d="M42,55 Q50,62 58,55 Z" fill={C.wineDeep} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M43.5,55.6 L56.5,55.6 L55,57.8 L45,57.8 Z" fill={C.white} />
    <path d="M38,52 Q43.5,49.5 50,51.5 Q56.5,49.5 62,52 Q56.5,55 50,53 Q43.5,55 38,52 Z" fill={C.white} stroke={C.ink} strokeWidth={2.2} strokeLinejoin="round" />
    <path d="M40,52.8 Q44,54.4 49,53" stroke={C.grey} strokeWidth={1.5} strokeLinecap="round" fill="none" />
  </svg>
);

/**
 * ToyBox, the lacquered 木箱 of this game: a domed berry lid over a grained wooden body with
 * gold corner fittings, a gold latch and a gold star. The dome plus the gold marks are what
 * make it read as "treasure" rather than "crate" at 64px.
 */
export const ToyBox: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id="toybox-wood" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor={C.sand} />
        <stop offset="1" stopColor={C.sandDeep} />
      </linearGradient>
      <linearGradient id="toybox-lid" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor={C.berry} />
        <stop offset="1" stopColor={C.berryDeep} />
      </linearGradient>
    </defs>

    {/* Round feet, drawn first so the body hides their tops */}
    <circle cx={26} cy={88} r={6.5} fill={C.sandDeep} stroke={C.ink} strokeWidth={4} />
    <circle cx={74} cy={88} r={6.5} fill={C.sandDeep} stroke={C.ink} strokeWidth={4} />

    {/* Wooden body: gradient, shadow panel, highlight strip, grain */}
    <rect x={12} y={42} width={76} height={44} rx={4} fill="url(#toybox-wood)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M70,42 L84,42 Q88,42 88,46 L88,82 Q88,86 84,86 L70,86 Z" fill={C.sandDeep} />
    <rect x={15} y={45} width={5} height={38} fill={C.white} opacity={0.28} />
    <path d="M26,46 Q29,64 26,82 M42,46 Q45,64 42,82 M58,46 Q55,64 58,82 M74,46 Q71,64 74,82" stroke={C.sandDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
    <rect x={12} y={78} width={76} height={8} fill={C.sandDeep} stroke={C.ink} strokeWidth={3} />

    {/* Gold corner fittings */}
    <path d="M14,43 L27,43 L27,48 L19,48 L19,58 L14,58 Z" fill={C.gold} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M86,43 L73,43 L73,48 L81,48 L81,58 L86,58 Z" fill={C.gold} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M14,85 L27,85 L27,80 L19,80 L19,70 L14,70 Z" fill={C.goldDeep} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M86,85 L73,85 L73,80 L81,80 L81,70 L86,70 Z" fill={C.goldDeep} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />

    {/* Domed lid: the band across its foot is the shut seam */}
    <path d="M8,44 Q8,14 50,14 Q92,14 92,44 Z" fill="url(#toybox-lid)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M92,44 Q92,20 66,15.2 Q84,24 82,44 Z" fill={C.berryDeep} />
    <path d="M20,40 Q20,21 39,17" stroke={C.white} strokeWidth={4} strokeLinecap="round" opacity={0.35} fill="none" />
    <rect x={8} y={36} width={84} height={10} rx={3} fill={C.berryDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M12,39 L70,39" stroke={C.berry} strokeWidth={2.5} strokeLinecap="round" />

    {/* Gold latch over the seam */}
    <rect x={44} y={35} width={12} height={13} rx={3} fill={C.gold} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M45.5,45 L54.5,45" stroke={C.goldDeep} strokeWidth={2.5} strokeLinecap="round" />

    {/* Gold star on the front */}
    <polygon
      points="50,52 53.5,61.2 63.3,61.7 55.7,67.9 58.2,77.3 50,72 41.8,77.3 44.3,67.9 36.7,61.7 46.5,61.2"
      fill={C.gold}
      stroke={C.ink}
      strokeWidth={3}
      strokeLinejoin="round"
    />
    <path d="M50,58 L53,64.5 L50,71 L47,64.5 Z" fill={C.goldDeep} />
  </svg>
);

/**
 * ToyBoxOpen: the same lacquered chest with its lid tipped back. The dark mouth, the gold block
 * of loot rising out of it and the ball behind are the three cues that tell it apart at a glance.
 */
export const ToyBoxOpen: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id="toyboxopen-wood" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor={C.sand} />
        <stop offset="1" stopColor={C.sandDeep} />
      </linearGradient>
      <linearGradient id="toyboxopen-lid" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor={C.berry} />
        <stop offset="1" stopColor={C.berryDeep} />
      </linearGradient>
      <linearGradient id="toyboxopen-loot" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor={C.sun} />
        <stop offset="1" stopColor={C.goldDeep} />
      </linearGradient>
    </defs>

    {/* Lid tipped back and foreshortened; its front band and latch now face upward */}
    <g transform="rotate(-14 50 28)">
      <path d="M20,28 Q20,6 50,6 Q80,6 80,28 Z" fill="url(#toyboxopen-lid)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <path d="M80,28 Q80,11 62,7 Q74,14 72,28 Z" fill={C.berryDeep} />
      <path d="M28,25 Q28,12 41,9" stroke={C.white} strokeWidth={3.5} strokeLinecap="round" opacity={0.35} fill="none" />
      <rect x={18} y={22} width={64} height={9} rx={3} fill={C.berryDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <rect x={44.5} y={20} width={11} height={12} rx={3} fill={C.gold} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    </g>

    <circle cx={26} cy={88} r={6.5} fill={C.sandDeep} stroke={C.ink} strokeWidth={4} />
    <circle cx={74} cy={88} r={6.5} fill={C.sandDeep} stroke={C.ink} strokeWidth={4} />

    <rect x={12} y={52} width={76} height={34} rx={4} fill="url(#toyboxopen-wood)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M70,52 L84,52 Q88,52 88,56 L88,82 Q88,86 84,86 L70,86 Z" fill={C.sandDeep} />
    <rect x={15} y={56} width={5} height={26} fill={C.white} opacity={0.28} />
    <path d="M26,57 Q29,68 26,80 M42,57 Q45,68 42,80 M58,57 Q55,68 58,80 M74,57 Q71,68 74,80" stroke={C.sandDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
    <rect x={12} y={78} width={76} height={8} fill={C.sandDeep} stroke={C.ink} strokeWidth={3} />
    <path d="M14,85 L27,85 L27,80 L19,80 L19,72 L14,72 Z" fill={C.goldDeep} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M86,85 L73,85 L73,80 L81,80 L81,72 L86,72 Z" fill={C.goldDeep} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />

    {/* Open mouth of the chest */}
    <ellipse cx={50} cy={52} rx={38} ry={10} fill={C.mochaDeep} stroke={C.ink} strokeWidth={4} />

    {/* A ball tucked in beside the loot */}
    <circle cx={70} cy={45} r={10} fill={C.berry} stroke={C.ink} strokeWidth={4} />
    <path d="M70,35 A10,10 0 0 1 70,55 Q77,45 70,35 Z" fill={C.berryDeep} />
    <path d="M60,42 Q70,38 80,42" stroke={C.white} strokeWidth={4.5} strokeLinecap="round" fill="none" />

    {/* Glowing loot with a highlight */}
    <rect x={24} y={37} width={44} height={20} rx={9} fill="url(#toyboxopen-loot)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={31} y={42} width={18} height={6} rx={3} fill={C.cream} />

    {/* Front half of the mouth, over the contents: this is what puts them inside the box */}
    <path d="M12,52 A38,10 0 0 0 88,52 Z" fill={C.mochaDeep} />
    <path d="M18,56 A38,10 0 0 0 82,56 Z" fill={C.ink} opacity={0.35} />
    <path d="M12,52 A38,10 0 0 0 88,52" fill="none" stroke={C.ink} strokeWidth={4} />
  </svg>
);

/**
 * Signpost: one arrow board on a grained wooden post, standing in a grass tuft. The face is left
 * blank on purpose - scene labels are drawn by the UI, never inside a sprite.
 */
export const Signpost: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id="signpost-post" x1="0.1" y1="0" x2="0.9" y2="0.4">
        <stop offset="0" stopColor={C.sand} />
        <stop offset="1" stopColor={C.sandDeep} />
      </linearGradient>
      <linearGradient id="signpost-board" x1="0.15" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor={C.cream} />
        <stop offset="1" stopColor={C.sandDeep} />
      </linearGradient>
      <linearGradient id="signpost-grass" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor={C.leaf} />
        <stop offset="1" stopColor={C.leafDeep} />
      </linearGradient>
    </defs>

    <rect x={42} y={12} width={15} height={80} rx={4} fill="url(#signpost-post)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={51} y={16} width={5} height={72} fill={C.sandDeep} />
    <rect x={44} y={16} width={3} height={72} fill={C.white} opacity={0.3} />
    <path d="M48,18 Q50,44 48,70 Q47,80 48,86" stroke={C.sandDeep} strokeWidth={2} strokeLinecap="round" fill="none" />

    {/* Arrow board pointing right */}
    <polygon points="24,26 78,26 96,40 78,54 24,54" fill="url(#signpost-board)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M24,48 L78,48 L84,52.5 L78,54 L24,54 Z" fill={C.sandDeep} />
    <path d="M26,29.5 L76,29.5" stroke={C.white} strokeWidth={3} strokeLinecap="round" opacity={0.4} fill="none" />
    <path d="M28,36 L80,36 M28,43 L76,43" stroke={C.sandDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
    <circle cx={31} cy={33} r={2.6} fill={C.gold} stroke={C.ink} strokeWidth={2} />
    <circle cx={31} cy={47} r={2.6} fill={C.gold} stroke={C.ink} strokeWidth={2} />

    {/* Grass tuft hiding the foot of the post */}
    <path
      d="M12,96 Q18,76 26,94 Q32,70 40,94 Q48,68 56,94 Q64,72 72,94 Q80,78 88,96 Z"
      fill="url(#signpost-grass)"
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <path d="M56,94 Q64,72 72,94 Q80,78 88,96 Z" fill={C.leafDeep} />
    <path d="M20,92 Q22,82 24,78 M36,92 Q38,80 40,76 M52,92 Q54,78 56,74" stroke={C.leafDeep} strokeWidth={2.5} strokeLinecap="round" fill="none" />
    <path d="M16,93 Q19,84 22,80" stroke={C.white} strokeWidth={2.5} strokeLinecap="round" opacity={0.3} fill="none" />
  </svg>
);

/**
 * NapMat, the inn marker: a woven 蓆子 with a rolled bolster at its head and a quilt folded over
 * the foot. The star and the stroked zZ carry the "rest here" meaning at 64px, where the mat
 * alone would just be a rectangle.
 */
export const NapMat: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id="napmat-straw" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor={C.sand} />
        <stop offset="1" stopColor={C.sandDeep} />
      </linearGradient>
      <linearGradient id="napmat-quilt" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor={C.sky} />
        <stop offset="1" stopColor={C.skyDeep} />
      </linearGradient>
    </defs>

    {/* The mat, woven: warp and weft in sandDeep over a sand ground */}
    <g transform="rotate(-8 50 70)">
      <rect x={12} y={46} width={76} height={46} rx={12} fill="url(#napmat-straw)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <path d="M16,54 L84,54 M16,62 L84,62 M16,70 L84,70 M16,78 L84,78 M16,86 L84,86" stroke={C.sandDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
      <path d="M30,50 L30,89 M50,48 L50,90 M70,50 L70,89" stroke={C.sandDeep} strokeWidth={1.6} strokeLinecap="round" opacity={0.7} fill="none" />
      <path d="M18,50 L18,88" stroke={C.white} strokeWidth={3} strokeLinecap="round" opacity={0.3} fill="none" />
    </g>

    {/* Rolled bolster at the head of the mat, its coil showing on the near end */}
    <g transform="rotate(-8 50 60)">
      <rect x={24} y={50} width={52} height={18} rx={9} fill="url(#napmat-straw)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <path d="M52,50 L67,50 A9,9 0 0 1 67,68 L52,68 Z" fill={C.sandDeep} />
      <ellipse cx={31} cy={59} rx={5.5} ry={9} fill={C.sand} stroke={C.ink} strokeWidth={3} />
      <path d="M31,52 A7,7 0 1 1 30.9,52 M31,55.5 A3.5,3.5 0 1 1 30.9,55.5" stroke={C.sandDeep} strokeWidth={2} fill="none" />
      <path d="M40,53 L68,53" stroke={C.white} strokeWidth={3} strokeLinecap="round" opacity={0.32} fill="none" />
    </g>

    {/* Quilt over the foot of the mat, with its top edge folded back */}
    <g transform="rotate(-8 50 80)">
      <rect x={20} y={72} width={60} height={18} rx={8} fill="url(#napmat-quilt)" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      <path d="M56,72 L72,72 A8,8 0 0 1 80,80 L80,82 A8,8 0 0 1 72,90 L56,90 Z" fill={C.skyDeep} />
      <path d="M34,76 L34,88 M48,76 L48,88 M62,76 L62,88" stroke={C.skyDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
      <rect x={22} y={69} width={56} height={9} rx={4.5} fill={C.cream} stroke={C.ink} strokeWidth={3} />
      <path d="M56,69 L73.5,69 A4.5,4.5 0 0 1 73.5,78 L56,78 Z" fill={C.paper} />
    </g>

    {/* Sleepy zZ, ink underlay so the white reads on any floor colour */}
    <path d="M30,8 L48,8 L30,28 L48,28" stroke={C.ink} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M30,8 L48,8 L30,28 L48,28" stroke={C.white} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M12,28 L23,28 L12,40 L23,40" stroke={C.ink} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M12,28 L23,28 L12,40 L23,40" stroke={C.white} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />

    <polygon
      points="78,10 81.4,18.9 91,19.4 83.6,25.4 86,34.6 78,29.5 70,34.6 72.4,25.4 65,19.4 74.6,18.9"
      fill={C.gold}
      stroke={C.ink}
      strokeWidth={3}
      strokeLinejoin="round"
    />
    <path d="M78,16 L81,23 L78,29.5 L75,23 Z" fill={C.goldDeep} />
  </svg>
);

/**
 * Bathtub, the bath-time scene marker: a shaded porcelain clawfoot tub with a bright highlight
 * arc down its left side, sky water under the rim and three bubbles climbing out of it.
 */
export const Bathtub: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <defs>
      <linearGradient id="bathtub-shell" x1="0.15" y1="0" x2="0.9" y2="0.9">
        <stop offset="0" stopColor={C.white} />
        <stop offset="1" stopColor={C.grey} />
      </linearGradient>
      <linearGradient id="bathtub-rim" x1="0.15" y1="0" x2="0.9" y2="1">
        <stop offset="0" stopColor={C.white} />
        <stop offset="1" stopColor={C.grey} />
      </linearGradient>
      <linearGradient id="bathtub-water" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor={C.sky} />
        <stop offset="1" stopColor={C.skyDeep} />
      </linearGradient>
    </defs>

    {/* Claw feet, drawn first so the shell overlaps their tops */}
    <path d="M18,78 L34,78 L32,92 Q26,98 20,92 Z" fill={C.sandDeep} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
    <path d="M66,78 L82,78 L80,92 Q74,98 68,92 Z" fill={C.sandDeep} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
    <path d="M28,78 L34,78 L32,92 Q29,95.5 26.5,94.5 Q30,90 28,78 Z" fill={C.mochaDeep} />
    <path d="M76,78 L82,78 L80,92 Q77,95.5 74.5,94.5 Q78,90 76,78 Z" fill={C.mochaDeep} />
    <path d="M23,93 L23,97 M29,92 L29,96 M71,93 L71,97 M77,92 L77,96" stroke={C.ink} strokeWidth={2} strokeLinecap="round" fill="none" />

    {/* Porcelain shell: gradient body, a grey shadow flank, a bright specular on the left */}
    <path d="M11,40 C11,78 24,88 50,88 C76,88 89,78 89,40 Z" fill="url(#bathtub-shell)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M89,40 C89,78 76,88 50,88 L50,84 C72,84 84,74 84,40 Z" fill={C.grey} />
    <path d="M84,44 C84,70 72,80 54,82" stroke={C.greyDeep} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M20,46 C20,62 22,72 28,80" stroke={C.white} strokeWidth={5} strokeLinecap="round" fill="none" />

    {/* Rim, then the water sitting inside it */}
    <ellipse cx={50} cy={40} rx={39} ry={11} fill="url(#bathtub-rim)" stroke={C.ink} strokeWidth={4} />
    <ellipse cx={50} cy={41} rx={31} ry={7.6} fill="none" stroke={C.greyDeep} strokeWidth={3} />
    <ellipse cx={50} cy={41.5} rx={29} ry={6.4} fill="url(#bathtub-water)" stroke={C.skyDeep} strokeWidth={2.5} />
    <path d="M32,42 Q38,39.5 44,42 M56,41 Q62,38.5 68,41" stroke={C.white} strokeWidth={2} strokeLinecap="round" opacity={0.6} fill="none" />

    {/* Bubbles climbing out */}
    <circle cx={34} cy={26} r={6.5} fill={C.white} stroke={C.ink} strokeWidth={3} />
    <circle cx={53} cy={15} r={8} fill={C.white} stroke={C.ink} strokeWidth={3} />
    <circle cx={68} cy={29} r={5} fill={C.white} stroke={C.ink} strokeWidth={3} />
    <path d="M37,29 A6.5,6.5 0 0 1 31,30 Q37,27 37,23 Z" fill={C.sky} opacity={0.5} />
    <path d="M57,19 A8,8 0 0 1 49,21.5 Q57,18 57,12 Z" fill={C.sky} opacity={0.5} />
    <path d="M31,23 Q32,21 34,20.8 M49.5,12 Q51,9.5 53.5,9.2 M65.5,26.5 Q66.5,24.8 68,24.7" stroke={C.white} strokeWidth={2.2} strokeLinecap="round" fill="none" />
  </svg>
);
