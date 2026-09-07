import type { Sprite } from '../sprite';
import { C } from '../palette';

/**
 * The chip-stealing gull. Same greedy pose as before - wings half open, brows driven down,
 * a chip already clamped in the beak - but a white bird on a pale ground only survives if
 * it is shaded, so every form runs white on the lit side into C.grey on the shaded one,
 * with greyDeep flight feathers at the wing tips.
 */
export const GreedyGull: Sprite = () => {
  const wingL = 'M38,46 C22,42 10,54 14,72 C28,68 36,58 41,50 Z';
  const wingR = 'M56,46 C72,42 84,54 80,72 C66,68 58,58 53,50 Z';
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="greedyGull-body" x1="0.2" y1="0.05" x2="0.75" y2="1">
          <stop offset="0" stopColor={C.white} />
          <stop offset="0.68" stopColor={C.white} />
          <stop offset="1" stopColor={C.grey} />
        </linearGradient>
        <linearGradient id="greedyGull-wing" x1="0.55" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor={C.white} />
          <stop offset="0.62" stopColor={C.white} />
          <stop offset="1" stopColor={C.grey} />
        </linearGradient>
        <linearGradient id="greedyGull-tail" x1="0.9" y1="0" x2="0.1" y2="0.7">
          <stop offset="0" stopColor={C.grey} />
          <stop offset="1" stopColor={C.greyDeep} />
        </linearGradient>
        <clipPath id="greedyGull-body-clip">
          <ellipse cx={44} cy={60} rx={28} ry={26} />
        </clipPath>
        <clipPath id="greedyGull-head-clip">
          <circle cx={58} cy={26} r={20} />
        </clipPath>
        <clipPath id="greedyGull-wingL-clip">
          <path d={wingL} />
        </clipPath>
        <clipPath id="greedyGull-wingR-clip">
          <path d={wingR} />
        </clipPath>
      </defs>

      {/* Contact shadow under the webbed feet */}
      <ellipse cx={46} cy={93} rx={25} ry={4.4} fill={C.ink} opacity={0.18} />

      {/* Legs and webbed feet, outlined then filled so thin limbs still read */}
      <path d="M40,80 L36,88 M52,80 L56,88" stroke={C.ink} strokeWidth={9} strokeLinecap="round" fill="none" />
      <path d="M40,80 L36,88 M52,80 L56,88" stroke={C.sun} strokeWidth={5} strokeLinecap="round" fill="none" />
      <path d="M28,92 L46,92 L36,85 Z" fill={C.sun} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      <path d="M48,92 L66,92 L56,85 Z" fill={C.sun} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      <path d="M30,90 L44,90 M50,90 L64,90" stroke={C.sunDeep} strokeWidth={2.4} strokeLinecap="round" fill="none" />

      {/* Tail, cocked up behind the body */}
      <path d="M24,50 L4,60 L26,72 Z" fill="url(#greedyGull-tail)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <path d="M22,55 L8,60 M23,64 L9,61" stroke={C.greyDeep} strokeWidth={2.2} strokeLinecap="round" fill="none" />

      <ellipse cx={44} cy={60} rx={28} ry={26} fill="url(#greedyGull-body)" stroke={C.ink} strokeWidth={4} />
      <g clipPath="url(#greedyGull-body-clip)">
        {/* Belly shadow, then the shadow the head casts across the chest */}
        <path d="M16,74 Q44,66 76,54 L76,90 L14,90 Z" fill={C.grey} opacity={0.5} />
        <path d="M40,38 Q58,52 76,38 L78,45 Q58,58 38,45 Z" fill={C.grey} opacity={0.3} />
        <ellipse cx={31} cy={47} rx={13} ry={7.5} fill={C.white} opacity={0.9} transform="rotate(-25 31 47)" />
        {/* Breast feather edges */}
        <path d="M28,72 Q38,78 48,72 M34,80 Q42,84 50,80" stroke={C.greyDeep} strokeWidth={2} strokeLinecap="round" opacity={0.6} fill="none" />
      </g>

      {/* Half open wings: layered feathers, greyDeep at the tips, lit along the leading edge */}
      <path d={wingL} fill="url(#greedyGull-wing)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <g clipPath="url(#greedyGull-wingL-clip)">
        <path d="M8,58 L30,74 L6,82 Z" fill={C.greyDeep} />
        <path d="M17,66 L24,63 M17,59 L29,56 M19,52 L31,49" stroke={C.grey} strokeWidth={4.5} strokeLinecap="round" fill="none" />
        <path d="M37,49 C24,46 14,55 16,66" stroke={C.white} strokeWidth={4} strokeLinecap="round" opacity={0.5} fill="none" />
      </g>
      <path d={wingR} fill="url(#greedyGull-wing)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <g clipPath="url(#greedyGull-wingR-clip)">
        <path d="M86,58 L64,74 L88,82 Z" fill={C.greyDeep} />
        <path d="M77,66 L70,63 M77,59 L65,56 M75,52 L63,49" stroke={C.grey} strokeWidth={4.5} strokeLinecap="round" fill="none" />
        <path d="M57,49 C70,46 80,55 78,66" stroke={C.white} strokeWidth={3} strokeLinecap="round" opacity={0.3} fill="none" />
      </g>

      <circle cx={58} cy={26} r={20} fill="url(#greedyGull-body)" stroke={C.ink} strokeWidth={4} />
      <g clipPath="url(#greedyGull-head-clip)">
        {/* Under-chin shadow and the highlight on the crown */}
        <path d="M36,35 Q58,45 80,32 L80,50 L36,50 Z" fill={C.grey} opacity={0.42} />
        <ellipse cx={48} cy={15} rx={11} ry={6} fill={C.white} opacity={0.9} transform="rotate(-22 48 15)" />
        <path d="M40,20 Q46,10 58,8" stroke={C.white} strokeWidth={3} strokeLinecap="round" opacity={0.7} fill="none" />
      </g>

      {/* Beak: sun upper mandible, sunDeep lower, one hard highlight */}
      <polygon points="74,18 92,28 74,38" fill={C.sun} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      <path d="M74,28 L92,28 L74,38 Z" fill={C.sunDeep} />
      <path d="M74,28 L91,28" stroke={C.ink} strokeWidth={2} strokeLinecap="round" fill="none" />
      <path d="M77,21 L88,27" stroke={C.white} strokeWidth={2.6} strokeLinecap="round" opacity={0.5} fill="none" />

      {/* The stolen chip, still gripped at the tip */}
      <rect x={74} y={32} width={19} height={8} rx={3} fill={C.sand} stroke={C.ink} strokeWidth={3} transform="rotate(28 83.5 36)" />
      <rect x={75} y={36} width={17} height={3.4} rx={1.7} fill={C.sandDeep} transform="rotate(28 83.5 36)" />

      {/* Narrow sclera, sun iris, big pupil aimed at the food: greedy, not sleepy */}
      <ellipse cx={50} cy={27} rx={7} ry={5.5} fill={C.white} stroke={C.ink} strokeWidth={3} />
      <ellipse cx={65} cy={27} rx={7} ry={5.5} fill={C.white} stroke={C.ink} strokeWidth={3} />
      <circle cx={51.6} cy={27.8} r={4.2} fill={C.sun} />
      <circle cx={66.6} cy={27.8} r={4.2} fill={C.sun} />
      <circle cx={52} cy={28.2} r={2.8} fill={C.ink} />
      <circle cx={67} cy={28.2} r={2.8} fill={C.ink} />
      <circle cx={49.6} cy={25.4} r={1.7} fill={C.white} />
      <circle cx={64.6} cy={25.4} r={1.7} fill={C.white} />
      <path d="M43,15 L55,19" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <path d="M73,15 L61,19" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
    </svg>
  );
};

/**
 * A drifting jellyfish, and the most translucent thing in the game. The bell is a
 * white-to-plumDeep gradient laid down at partial opacity with the inner core showing
 * through it, and the tentacles are stroked with gradients - colour and outline both -
 * so they fade to nothing at the tips.
 */
export const Jellyfish: Sprite = () => {
  const tentacles = [
    'M16,54 Q8,66 18,76 Q26,84 18,90',
    'M33,61 Q26,72 35,81 Q43,88 35,90',
    'M50,60 Q44,72 52,80 Q60,88 50,90',
    'M67,60 Q60,72 68,80 Q76,87 68,90',
    'M84,54 Q92,66 82,76 Q74,84 82,90',
  ];
  const bell =
    'M8,52 C8,24 26,8 50,8 C74,8 92,24 92,52 C82,60 76,52 66,58 C58,63 50,56 40,60 C28,65 18,60 8,52 Z';
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="jellyfish-bell" x1="0.25" y1="0" x2="0.68" y2="1">
          <stop offset="0" stopColor={C.white} />
          <stop offset="0.4" stopColor={C.plum} />
          <stop offset="1" stopColor={C.plumDeep} />
        </linearGradient>
        <linearGradient id="jellyfish-tent" gradientUnits="userSpaceOnUse" x1="0" y1="52" x2="0" y2="92">
          <stop offset="0" stopColor={C.sky} />
          <stop offset="0.55" stopColor={C.sky} stopOpacity="0.7" />
          <stop offset="1" stopColor={C.skyDeep} stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id="jellyfish-tentInk" gradientUnits="userSpaceOnUse" x1="0" y1="52" x2="0" y2="92">
          <stop offset="0" stopColor={C.ink} />
          <stop offset="0.45" stopColor={C.ink} stopOpacity="0.7" />
          <stop offset="1" stopColor={C.ink} stopOpacity="0.18" />
        </linearGradient>
        <clipPath id="jellyfish-bell-clip">
          <path d={bell} />
        </clipPath>
      </defs>

      {/* Faint contact shadow: it hovers, so this one stays soft */}
      <ellipse cx={50} cy={96} rx={26} ry={3.2} fill={C.ink} opacity={0.12} />

      {tentacles.map((d, i) => (
        <path key={`ink${i}`} d={d} stroke="url(#jellyfish-tentInk)" strokeWidth={9} strokeLinecap="round" fill="none" />
      ))}
      {tentacles.map((d, i) => (
        <path key={i} d={d} stroke="url(#jellyfish-tent)" strokeWidth={5} strokeLinecap="round" fill="none" />
      ))}

      {/* Bell body, translucent enough that the tentacle roots show through it */}
      <path d={bell} fill="url(#jellyfish-bell)" opacity={0.9} />
      <g clipPath="url(#jellyfish-bell-clip)">
        {/* Inner core and canals, seen through the flesh */}
        <ellipse cx={50} cy={21} rx={16} ry={7} fill={C.plumDeep} opacity={0.35} />
        <ellipse cx={50} cy={20} rx={9} ry={3.6} fill={C.white} opacity={0.35} />
        <ellipse cx={20} cy={36} rx={6} ry={9} fill={C.plumDeep} opacity={0.28} transform="rotate(18 20 36)" />
        <ellipse cx={80} cy={36} rx={6} ry={9} fill={C.plumDeep} opacity={0.28} transform="rotate(-18 80 36)" />
        {/* Deep tone banked into the scalloped rim */}
        <path d="M8,48 C18,58 28,63 40,58 C50,54 58,61 66,56 C76,50 82,58 92,48 L92,68 L8,68 Z" fill={C.plumDeep} opacity={0.55} />
        {/* Translucent wash and specular on the lit shoulder of the bell */}
        <path d="M10,44 C10,20 26,10 46,10 C30,16 18,28 16,50 Z" fill={C.white} opacity={0.22} />
      </g>
      <ellipse cx={31} cy={20} rx={9} ry={5} fill={C.white} opacity={0.85} transform="rotate(-25 31 20)" />
      <ellipse cx={22} cy={31} rx={4} ry={2.2} fill={C.white} opacity={0.5} transform="rotate(-40 22 31)" />
      <path d={bell} fill="none" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />

      {/* Sleepy-smug face: droopy lids, low pupils, one raised corner on the mouth */}
      <path d="M26,25 L44,28" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <path d="M74,25 L56,28" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <ellipse cx={36} cy={37} rx={9.5} ry={7} fill={C.white} stroke={C.ink} strokeWidth={3} />
      <ellipse cx={64} cy={37} rx={9.5} ry={7} fill={C.white} stroke={C.ink} strokeWidth={3} />
      <circle cx={36} cy={39.4} r={5} fill={C.sky} />
      <circle cx={64} cy={39.4} r={5} fill={C.sky} />
      <circle cx={36} cy={40} r={3.2} fill={C.ink} />
      <circle cx={64} cy={40} r={3.2} fill={C.ink} />
      <circle cx={33.4} cy={36.4} r={1.8} fill={C.white} />
      <circle cx={61.4} cy={36.4} r={1.8} fill={C.white} />
      <path d="M27,36 Q36,29 45,36" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <path d="M55,36 Q64,29 73,36" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <path d="M38,51 Q48,58 62,48" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <path d="M39,54 Q48,60 61,51" stroke={C.plumDeep} strokeWidth={2.2} strokeLinecap="round" opacity={0.8} fill="none" />
    </svg>
  );
};

/**
 * Boss. Same imposing width - a huge round head under a pirate bandana with six arms
 * sweeping the floor of the box, all under one heavy unibrow - now painted as rubber:
 * a mantle gradient, arms that darken as they fall away from the light, shaded suckers
 * on every underside, and a gold earring plus a faint gold aura for the boss beat.
 */
export const Octopus: Sprite = () => {
  // Every arm curls the same way, so six arms read as one wave instead of a tangle.
  const arms: Array<{ d: string; suckers: Array<[number, number]> }> = [
    { d: 'M18,54 C10,66 12,82 24,84 C30,85 30,79 26,77', suckers: [[13, 64], [14, 73], [18, 81]] },
    { d: 'M31,63 C25,74 28,86 39,86 C44,86 44,80 40,78', suckers: [[27, 71], [29, 79], [33, 85]] },
    { d: 'M44,68 C40,80 44,90 54,88 C58,87 58,81 54,79', suckers: [[42, 75], [44, 83], [49, 88]] },
    { d: 'M57,68 C55,80 60,90 69,87 C73,86 72,80 68,78', suckers: [[57, 75], [59, 83], [64, 87]] },
    { d: 'M70,63 C68,76 74,86 83,82 C86,80 85,75 81,74', suckers: [[70, 71], [72, 79], [78, 83]] },
    { d: 'M81,54 C88,64 94,76 88,84 C85,88 81,86 82,82', suckers: [[85, 62], [89, 70], [90, 79]] },
  ];
  const bandana = 'M14,32 C16,12 32,4 50,4 C68,4 84,12 86,32 C60,20 40,20 14,32 Z';
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="octopus-aura" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.5" stopColor={C.gold} stopOpacity="0.4" />
          <stop offset="1" stopColor={C.gold} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="octopus-mantle" x1="0.22" y1="0" x2="0.72" y2="1">
          <stop offset="0" stopColor={C.berry} />
          <stop offset="0.45" stopColor={C.berry} />
          <stop offset="1" stopColor={C.berryDeep} />
        </linearGradient>
        <linearGradient id="octopus-arm" gradientUnits="userSpaceOnUse" x1="0" y1="52" x2="0" y2="90">
          <stop offset="0" stopColor={C.berry} />
          <stop offset="1" stopColor={C.berryDeep} />
        </linearGradient>
        <linearGradient id="octopus-band" x1="0.15" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor={C.sun} />
          <stop offset="1" stopColor={C.sunDeep} />
        </linearGradient>
        <clipPath id="octopus-head-clip">
          <ellipse cx={50} cy={38} rx={38} ry={32} />
        </clipPath>
        <clipPath id="octopus-band-clip">
          <path d={bandana} />
        </clipPath>
      </defs>

      {/* Faint aura, so the boss out-reads the little foes beside it */}
      <ellipse cx={50} cy={50} rx={48} ry={48} fill="url(#octopus-aura)" />
      {/* Heavy contact shadow: this thing has weight */}
      <ellipse cx={50} cy={91} rx={36} ry={5.4} fill={C.ink} opacity={0.18} />

      {arms.map((arm, i) => (
        <g key={i}>
          <path d={arm.d} stroke={C.ink} strokeWidth={12.5} strokeLinecap="round" fill="none" />
          <path d={arm.d} stroke="url(#octopus-arm)" strokeWidth={7.5} strokeLinecap="round" fill="none" />
          {arm.suckers.map(([cx, cy]) => (
            <g key={`${cx}-${cy}`}>
              <circle cx={cx} cy={cy} r={2.7} fill={C.sandDeep} />
              <circle cx={cx - 0.6} cy={cy - 0.7} r={1.8} fill={C.sand} />
            </g>
          ))}
        </g>
      ))}

      <ellipse cx={50} cy={38} rx={38} ry={32} fill="url(#octopus-mantle)" stroke={C.ink} strokeWidth={4} />
      <g clipPath="url(#octopus-head-clip)">
        {/* Cel shadow across the shaded cheek, then the wet highlight on the lit one */}
        <path d="M10,48 Q50,36 92,26 L92,74 L10,74 Z" fill={C.berryDeep} opacity={0.55} />
        <ellipse cx={26} cy={42} rx={14} ry={9} fill={C.white} opacity={0.2} transform="rotate(-30 26 42)" />
        <ellipse cx={22} cy={36} rx={6} ry={2.6} fill={C.white} opacity={0.42} transform="rotate(-38 22 36)" />
        {/* Rubbery skin: a few deep speckles on the shaded side */}
        <circle cx={72} cy={52} r={1.8} fill={C.berryDeep} opacity={0.7} />
        <circle cx={79} cy={45} r={1.5} fill={C.berryDeep} opacity={0.7} />
        <circle cx={68} cy={60} r={1.4} fill={C.berryDeep} opacity={0.6} />
        <circle cx={82} cy={54} r={1.3} fill={C.berryDeep} opacity={0.6} />
      </g>

      {/* Pirate bandana: knot and two loose ends on the left, gold trim along the brim */}
      <polygon points="12,28 4,32 12,37" fill={C.sun} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      <polygon points="13,33 6,45 17,40" fill={C.sun} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      <path d="M8,31 L11,34 M10,37 L14,38" stroke={C.sunDeep} strokeWidth={2.2} strokeLinecap="round" fill="none" />
      <path d={bandana} fill="url(#octopus-band)" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <g clipPath="url(#octopus-band-clip)">
        <path d="M86,32 C60,20 40,20 14,32 L14,26 C40,14 60,14 86,26 Z" fill={C.gold} />
        <path d="M86,32 C60,20 40,20 14,32 L14,29 C40,17 60,17 86,29 Z" fill={C.goldDeep} opacity={0.55} />
        <path d="M24,26 C30,12 40,8 52,7" stroke={C.white} strokeWidth={4} strokeLinecap="round" opacity={0.35} fill="none" />
        <path d="M72,10 Q82,18 84,30" stroke={C.sunDeep} strokeWidth={3} strokeLinecap="round" opacity={0.8} fill="none" />
      </g>
      <circle cx={14} cy={30} r={7} fill={C.sun} stroke={C.ink} strokeWidth={4} />
      <circle cx={12} cy={28} r={2.6} fill={C.white} opacity={0.4} />

      {/* Gold earring hanging off the widest point of the head */}
      <circle cx={11} cy={45} r={6} fill="none" stroke={C.ink} strokeWidth={5.5} />
      <circle cx={11} cy={45} r={6} fill="none" stroke={C.gold} strokeWidth={3.6} />
      <circle cx={9} cy={42} r={1.3} fill={C.white} opacity={0.7} />

      {/* One heavy unibrow does all the grumpy work */}
      <path d="M22,38 Q50,30 78,38" stroke={C.ink} strokeWidth={6} strokeLinecap="round" fill="none" />
      <circle cx={33} cy={50} r={10} fill={C.white} stroke={C.ink} strokeWidth={4} />
      <circle cx={67} cy={50} r={10} fill={C.white} stroke={C.ink} strokeWidth={4} />
      <circle cx={34} cy={51} r={6.4} fill={C.jade} />
      <circle cx={68} cy={51} r={6.4} fill={C.jade} />
      <ellipse cx={34} cy={55.5} rx={4.4} ry={1.7} fill={C.white} opacity={0.45} />
      <ellipse cx={68} cy={55.5} rx={4.4} ry={1.7} fill={C.white} opacity={0.45} />
      <circle cx={34.6} cy={51.6} r={3.8} fill={C.ink} />
      <circle cx={68.6} cy={51.6} r={3.8} fill={C.ink} />
      <circle cx={30} cy={46.6} r={2.5} fill={C.white} />
      <circle cx={64} cy={46.6} r={2.5} fill={C.white} />
      <path d="M36,60 Q44,54 51,61 Q58,68 66,60" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" fill="none" />
      <path d="M37,63 Q44,58 51,64 Q58,70 65,63" stroke={C.berryDeep} strokeWidth={2.4} strokeLinecap="round" fill="none" />
    </svg>
  );
};
