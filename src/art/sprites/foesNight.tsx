import type { Sprite } from '../sprite';
import { C } from '../palette';

/**
 * A little sleep imp: floating blob, nightcap pulled down over the eyes, mid-yawn.
 * Being a ghost, the body is painted as light rather than as a solid: the fill and its
 * own outline both run through fading gradients, so the wavy hem dissolves into the
 * background while an inner glow keeps the top of the blob bright.
 */
export const SleepySprite: Sprite = () => {
  const snores = ['M76,78 L84,78 L76,86 L84,86', 'M78,54 L88,54 L78,64 L88,64', 'M80,26 L94,26 L80,40 L94,40'];
  const body =
    'M10,56 C10,32 24,20 39,20 C54,20 68,32 68,56 L68,84 C62,78 58,90 50,85 C43,81 39,91 31,86 C24,82 20,90 12,85 C10,83 10,80 10,74 Z';
  const cap = 'M18,32 C22,12 44,6 68,12 C60,20 54,24 48,28 Z';
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="sleepySprite-body" gradientUnits="userSpaceOnUse" x1="0" y1="20" x2="0" y2="91">
          <stop offset="0" stopColor={C.sky} />
          <stop offset="0.5" stopColor={C.sky} />
          <stop offset="0.82" stopColor={C.skyDeep} stopOpacity="0.8" />
          <stop offset="1" stopColor={C.skyDeep} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sleepySprite-edge" gradientUnits="userSpaceOnUse" x1="0" y1="20" x2="0" y2="91">
          <stop offset="0" stopColor={C.ink} />
          <stop offset="0.62" stopColor={C.ink} />
          <stop offset="1" stopColor={C.ink} stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id="sleepySprite-shade" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="0" y2="88">
          <stop offset="0" stopColor={C.skyDeep} stopOpacity="0.75" />
          <stop offset="1" stopColor={C.skyDeep} stopOpacity="0" />
        </linearGradient>
        <radialGradient id="sleepySprite-glow" cx="0.34" cy="0.28" r="0.5">
          <stop offset="0" stopColor={C.white} stopOpacity="0.5" />
          <stop offset="1" stopColor={C.white} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sleepySprite-cap" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0" stopColor={C.white} />
          <stop offset="0.55" stopColor={C.white} />
          <stop offset="1" stopColor={C.grey} />
        </linearGradient>
        <clipPath id="sleepySprite-body-clip">
          <path d={body} />
        </clipPath>
        <clipPath id="sleepySprite-cap-clip">
          <path d={cap} />
        </clipPath>
        <clipPath id="sleepySprite-pom-clip">
          <circle cx={70} cy={12} r={8} />
        </clipPath>
      </defs>

      {/* It hovers, so the contact shadow is only a hint */}
      <ellipse cx={39} cy={96} rx={22} ry={2.8} fill={C.ink} opacity={0.11} />

      {/* Ghost blob: fill, shading and outline all fade out along the hem */}
      <path d={body} fill="url(#sleepySprite-body)" />
      <g clipPath="url(#sleepySprite-body-clip)">
        <path d="M40,30 Q52,54 74,44 L74,94 L40,94 Z" fill="url(#sleepySprite-shade)" />
        <rect x={8} y={18} width={62} height={74} fill="url(#sleepySprite-glow)" />
        <path d="M16,74 Q26,80 34,74 M44,76 Q54,82 62,76" stroke={C.skyDeep} strokeWidth={2.2} strokeLinecap="round" opacity={0.5} fill="none" />
      </g>
      <path d={body} fill="none" stroke="url(#sleepySprite-edge)" strokeWidth={4} strokeLinejoin="round" />

      {/* Nightcap, flopping to the right, with its pom-pom on the tip */}
      <path d={cap} fill="url(#sleepySprite-cap)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <g clipPath="url(#sleepySprite-cap-clip)">
        <path d="M18,34 L50,29 L50,23 L18,27 Z" fill={C.grey} opacity={0.6} />
        <path d="M22,25 C28,14 42,9 58,11" stroke={C.white} strokeWidth={4} strokeLinecap="round" opacity={0.9} fill="none" />
        <path d="M52,26 Q60,20 66,14" stroke={C.greyDeep} strokeWidth={2.2} strokeLinecap="round" opacity={0.6} fill="none" />
      </g>
      <circle cx={70} cy={12} r={8} fill={C.berry} stroke={C.ink} strokeWidth={4} />
      <g clipPath="url(#sleepySprite-pom-clip)">
        <path d="M60,15 L82,7 L82,24 L60,24 Z" fill={C.berryDeep} />
        <ellipse cx={67} cy={9} rx={3.6} ry={2} fill={C.white} opacity={0.5} transform="rotate(-30 67 9)" />
      </g>

      {/* Inner ends of the brows ride high, which is what makes it smug rather than sad */}
      <path d="M19,37 L31,34" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <path d="M59,37 L47,34" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />

      {/* Half closed eyes: plum iris low under a heavy lid line */}
      <ellipse cx={28} cy={46} rx={9} ry={7} fill={C.white} stroke={C.ink} strokeWidth={3} />
      <ellipse cx={50} cy={46} rx={9} ry={7} fill={C.white} stroke={C.ink} strokeWidth={3} />
      <circle cx={28} cy={48.4} r={4.8} fill={C.plum} />
      <circle cx={50} cy={48.4} r={4.8} fill={C.plum} />
      <circle cx={28} cy={49} r={3.1} fill={C.ink} />
      <circle cx={50} cy={49} r={3.1} fill={C.ink} />
      <circle cx={25.6} cy={45.6} r={1.8} fill={C.white} />
      <circle cx={47.6} cy={45.6} r={1.8} fill={C.white} />
      <path d="M19,45 Q28,38 37,45" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <path d="M41,45 Q50,38 59,45" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />

      <ellipse cx={16} cy={58} rx={5} ry={3.5} fill={C.berry} opacity={0.35} />
      <ellipse cx={60} cy={58} rx={5} ry={3.5} fill={C.berry} opacity={0.35} />

      {/* Yawn */}
      <ellipse cx={38} cy={68} rx={12} ry={10} fill={C.wineDeep} stroke={C.ink} strokeWidth={3} />
      <ellipse cx={38} cy={74} rx={6} ry={3} fill={C.berry} />
      <path d="M30,64 Q38,60 46,64" stroke={C.white} strokeWidth={2} strokeLinecap="round" opacity={0.3} fill="none" />

      {/* zZ marks, each sitting on its own soft shadow */}
      {snores.map((d, i) => (
        <g key={i}>
          <path d={d} stroke={C.ink} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" opacity={0.18} transform="translate(2,2)" fill="none" />
          <path d={d} stroke={C.ink} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d={d} stroke={C.white} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      ))}
    </svg>
  );
};

/**
 * The bad-dream cloud. Same puffy cross silhouette, now built from overlapping lobes -
 * each with its own plumDeep underside - with a bright rim along the top and a bolt that
 * glows through a sun-to-gold gradient.
 */
export const NightmareCloud: Sprite = () => {
  const cloud =
    'M12,66 C0,58 2,40 14,38 C12,22 28,14 40,22 C46,8 70,10 72,26 C86,24 96,38 88,52 C94,62 86,72 78,68 C68,74 60,66 50,70 C40,74 32,66 24,70 C18,72 14,70 12,66 Z';
  // Lobe crescents: an arc across the underside of each puff, closed off above it.
  const lobes: Array<[number, number, number]> = [
    [20, 46, 14],
    [40, 32, 17],
    [63, 32, 17],
    [82, 45, 13],
    [30, 58, 12],
    [52, 58, 13],
    [73, 56, 11],
  ];
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="nightmareCloud-body" x1="0.25" y1="0" x2="0.7" y2="1">
          <stop offset="0" stopColor={C.plum} />
          <stop offset="1" stopColor={C.plumDeep} />
        </linearGradient>
        <linearGradient id="nightmareCloud-bolt" gradientUnits="userSpaceOnUse" x1="42" y1="66" x2="52" y2="96">
          <stop offset="0" stopColor={C.gold} />
          <stop offset="0.55" stopColor={C.sun} />
          <stop offset="1" stopColor={C.sunDeep} />
        </linearGradient>
        <radialGradient id="nightmareCloud-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.3" stopColor={C.sun} stopOpacity="0.4" />
          <stop offset="1" stopColor={C.sun} stopOpacity="0" />
        </radialGradient>
        <clipPath id="nightmareCloud-clip">
          <path d={cloud} />
        </clipPath>
      </defs>

      {/* Ground shadow far below the hovering cloud */}
      <ellipse cx={50} cy={97} rx={20} ry={2.6} fill={C.ink} opacity={0.14} />

      {/* Bolt first so its top tucks behind the cloud, glow first so it stays behind the bolt */}
      <ellipse cx={52} cy={80} rx={20} ry={19} fill="url(#nightmareCloud-glow)" />
      <polygon points="50,66 64,66 54,80 62,80 44,96 50,82 42,82" fill="url(#nightmareCloud-bolt)" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      <path d="M55,69 L50,78 M52,85 L47,92" stroke={C.white} strokeWidth={2} strokeLinecap="round" opacity={0.55} fill="none" />

      <path d={cloud} fill="url(#nightmareCloud-body)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <g clipPath="url(#nightmareCloud-clip)">
        {/* Storm built from puffs: base lobe, then a deep crescent under each one */}
        {lobes.map(([cx, cy, r]) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r={r} fill={C.plum} />
            <path
              d={`M${cx - 0.86 * r},${cy + 0.5 * r}A${r},${r} 0 0 0 ${cx + 0.86 * r},${cy + 0.5 * r}Q${cx},${cy + 0.2 * r} ${cx - 0.86 * r},${cy + 0.5 * r}Z`}
              fill={C.plumDeep}
            />
          </g>
        ))}
        {/* Heavy base and a bright rim along the top edge */}
        <path d="M0,64 Q50,74 100,60 L100,84 L0,84 Z" fill={C.plumDeep} opacity={0.55} />
        <path d="M14,42 C14,24 28,17 40,25 C48,11 66,13 70,27" stroke={C.white} strokeWidth={4} strokeLinecap="round" opacity={0.38} fill="none" />
        <path d="M78,30 C88,32 93,42 88,50" stroke={C.white} strokeWidth={3} strokeLinecap="round" opacity={0.2} fill="none" />
      </g>

      {/* Scowl: brows driven down into the eyes */}
      <path d="M22,28 L40,36" stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" />
      <path d="M78,28 L60,36" stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" />
      <ellipse cx={34} cy={42} rx={10} ry={8.5} fill={C.white} stroke={C.ink} strokeWidth={4} />
      <ellipse cx={66} cy={42} rx={10} ry={8.5} fill={C.white} stroke={C.ink} strokeWidth={4} />
      <circle cx={35.6} cy={43} r={5.8} fill={C.sun} />
      <circle cx={63.4} cy={43} r={5.8} fill={C.sun} />
      <circle cx={36.4} cy={43.6} r={3.6} fill={C.ink} />
      <circle cx={62.6} cy={43.6} r={3.6} fill={C.ink} />
      <circle cx={32.4} cy={39.2} r={2.2} fill={C.white} />
      <circle cx={60.4} cy={39.2} r={2.2} fill={C.white} />

      {/* Frowning open mouth: the arc bulges upward, so the flat edge is the bottom */}
      <path d="M38,66 h24 a12,12 0 0 0 -24,0 z" fill={C.wineDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      <path d="M41,63 Q50,58 59,63" stroke={C.berryDeep} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <polygon points="44,66 50,66 47,60" fill={C.white} />
      <polygon points="53,66 59,66 56,60" fill={C.white} />
    </svg>
  );
};

/**
 * Final boss, and the end of the story: oversized crown, cape and belly, eyes still shut,
 * pillow still held. The bulk is what sells him, so the body carries a full gradient with
 * a rim light along the top, the cape darkens into wineDeep, the crown is real gold with
 * jewels, and a faint aura sits behind the whole mass.
 */
export const SnoreKing: Sprite = () => {
  const snores = ['M85,49 L94,49 L85,58 L94,58', 'M82,29 L93,29 L82,40 L93,40', 'M78,5 L94,5 L78,21 L94,21'];
  const cape =
    'M22,44 C4,54 2,76 6,90 C16,84 22,94 32,90 C42,86 50,94 58,90 C68,86 74,94 84,90 C88,76 84,54 66,44 Z';
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="snoreKing-aura" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.62" stopColor={C.gold} stopOpacity="0.5" />
          <stop offset="1" stopColor={C.gold} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="snoreKing-body" x1="0.22" y1="0.05" x2="0.75" y2="1">
          <stop offset="0" stopColor={C.plum} />
          <stop offset="0.45" stopColor={C.plum} />
          <stop offset="1" stopColor={C.plumDeep} />
        </linearGradient>
        <linearGradient id="snoreKing-cape" x1="0.25" y1="0" x2="0.7" y2="1">
          <stop offset="0" stopColor={C.berry} />
          <stop offset="0.62" stopColor={C.berry} />
          <stop offset="1" stopColor={C.wineDeep} />
        </linearGradient>
        <linearGradient id="snoreKing-crown" x1="0.15" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor={C.gold} />
          <stop offset="0.6" stopColor={C.gold} />
          <stop offset="1" stopColor={C.goldDeep} />
        </linearGradient>
        <clipPath id="snoreKing-body-clip">
          <ellipse cx={45} cy={60} rx={34} ry={33} />
        </clipPath>
        <clipPath id="snoreKing-cape-clip">
          <path d={cape} />
        </clipPath>
        <clipPath id="snoreKing-pillow-clip">
          <rect x={70} y={72} width={24} height={18} rx={8} />
        </clipPath>
      </defs>

      {/* Faint aura: the last boss glows before he even wakes up */}
      <ellipse cx={48} cy={52} rx={48} ry={46} fill="url(#snoreKing-aura)" />
      {/* Heavy contact shadow under all that bulk */}
      <ellipse cx={45} cy={94} rx={40} ry={5.4} fill={C.ink} opacity={0.2} />

      {/* Cape behind the body, with a scalloped gold-trimmed hem */}
      <path d={cape} fill="url(#snoreKing-cape)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <g clipPath="url(#snoreKing-cape-clip)">
        <path d="M12,78 Q45,92 78,76 L78,96 L12,96 Z" fill={C.wineDeep} opacity={0.35} />
        <path d="M26,48 Q22,70 26,88 M50,46 Q52,70 50,92 M72,48 Q76,70 72,88" stroke={C.wineDeep} strokeWidth={2.6} strokeLinecap="round" opacity={0.75} fill="none" />
        <path d="M20,48 Q12,62 10,80" stroke={C.white} strokeWidth={3} strokeLinecap="round" opacity={0.25} fill="none" />
      </g>
      <path d="M6,87 C16,81 22,91 32,87 C42,83 50,91 58,87 C68,83 74,91 84,87" stroke={C.gold} strokeWidth={3.4} strokeLinecap="round" fill="none" />

      <ellipse cx={45} cy={60} rx={34} ry={33} fill="url(#snoreKing-body)" stroke={C.ink} strokeWidth={4} />
      <g clipPath="url(#snoreKing-body-clip)">
        <path d="M8,68 Q45,56 84,42 L84,96 L8,96 Z" fill={C.plumDeep} opacity={0.7} />
        <ellipse cx={30} cy={44} rx={15} ry={9} fill={C.white} opacity={0.22} transform="rotate(-30 30 44)" />
        {/* Rim light along the top of the mass */}
        <path d="M16,50 Q26,31 48,28" stroke={C.white} strokeWidth={4.5} strokeLinecap="round" opacity={0.5} fill="none" />
        {/* Belly folds */}
        <path d="M18,74 Q45,83 72,72" stroke={C.plumDeep} strokeWidth={2.6} strokeLinecap="round" fill="none" />
      </g>

      {/* Nightrobe hem across the belly */}
      <path d="M20,82 C25,89 34,92 45,92 C56,92 65,89 70,82 Z" fill={C.skyDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      <path d="M23,84 C28,88 36,90 45,90" stroke={C.sky} strokeWidth={2.4} strokeLinecap="round" opacity={0.7} fill="none" />

      {/* The cape collar, thrown over one shoulder */}
      <path d="M13,48 C6,60 8,72 14,76 C22,70 24,58 22,46 Z" fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <path d="M15,51 C9,61 10,71 15,75" stroke={C.gold} strokeWidth={2.6} strokeLinecap="round" fill="none" />
      <path d="M20,50 C19,60 18,68 15,74" stroke={C.wineDeep} strokeWidth={2.6} strokeLinecap="round" fill="none" />

      {/* Pillow tucked under the other arm, low enough that the arm does not hide it */}
      <g transform="rotate(12 82 81)">
        <rect x={70} y={72} width={24} height={18} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        <g clipPath="url(#snoreKing-pillow-clip)">
          <path d="M66,84 Q82,90 98,82 L98,94 L66,94 Z" fill={C.sandDeep} opacity={0.55} />
          <ellipse cx={78} cy={77} rx={7} ry={3} fill={C.white} opacity={0.7} transform="rotate(-10 78 77)" />
        </g>
        <path d="M74,82 Q82,86 90,80" stroke={C.greyDeep} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      </g>
      <ellipse cx={72} cy={68} rx={11} ry={8.5} fill={C.plum} stroke={C.ink} strokeWidth={4} transform="rotate(20 72 68)" />
      <ellipse cx={74} cy={70} rx={8} ry={5} fill={C.plumDeep} opacity={0.45} transform="rotate(20 74 70)" />
      <ellipse cx={68} cy={64} rx={4.5} ry={2.2} fill={C.white} opacity={0.3} transform="rotate(20 68 64)" />

      {/* Real gold crown: deep base band, jewels, speculars down the spikes */}
      <polygon points="24,34 30,12 38,24 45,4 52,24 60,12 66,34" fill="url(#snoreKing-crown)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <path d="M24,34 L66,34 L64,28 L26,28 Z" fill={C.goldDeep} />
      <path d="M26,31 L64,31" stroke={C.gold} strokeWidth={1.6} strokeLinecap="round" opacity={0.8} fill="none" />
      <path d="M30,15 L33,23 M45,7 L46,21 M60,15 L58,23" stroke={C.white} strokeWidth={2.2} strokeLinecap="round" opacity={0.45} fill="none" />
      <circle cx={33} cy={29} r={4} fill={C.berry} />
      <circle cx={45} cy={29} r={4.5} fill={C.berry} />
      <circle cx={57} cy={29} r={4} fill={C.berry} />
      <path d="M30,30 Q33,34 36,30 M41.5,30 Q45,35 48.5,30 M54,30 Q57,34 60,30" stroke={C.berryDeep} strokeWidth={2} strokeLinecap="round" fill="none" />
      <circle cx={31.6} cy={27.4} r={1.1} fill={C.white} />
      <circle cx={43.5} cy={27.3} r={1.3} fill={C.white} />
      <circle cx={55.6} cy={27.4} r={1.1} fill={C.white} />

      {/* Brows are angled slashes: two more wide arcs would merge with the shut eyes */}
      <path d="M24,38 L38,42" stroke={C.ink} strokeWidth={5.5} strokeLinecap="round" fill="none" />
      <path d="M66,38 L52,42" stroke={C.ink} strokeWidth={5.5} strokeLinecap="round" fill="none" />
      <path d="M25,54 Q33,61 41,54" stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" />
      <path d="M49,54 Q57,61 65,54" stroke={C.ink} strokeWidth={5} strokeLinecap="round" fill="none" />
      <path d="M27,58 Q33,63 39,58 M51,58 Q57,63 63,58" stroke={C.plumDeep} strokeWidth={2.2} strokeLinecap="round" fill="none" />

      {/* Snoring mouth, wide open */}
      <ellipse cx={45} cy={71} rx={15} ry={9.5} fill={C.wineDeep} stroke={C.ink} strokeWidth={3} />
      <ellipse cx={45} cy={76} rx={8} ry={3.5} fill={C.berry} />
      <path d="M35,68 Q45,64 55,68" stroke={C.white} strokeWidth={2.2} strokeLinecap="round" opacity={0.3} fill="none" />

      {/* zZ marks, each sitting on its own soft shadow */}
      {snores.map((d, i) => (
        <g key={i}>
          <path d={d} stroke={C.ink} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" opacity={0.18} transform="translate(2,2)" fill="none" />
          <path d={d} stroke={C.ink} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d={d} stroke={C.white} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      ))}
    </svg>
  );
};
