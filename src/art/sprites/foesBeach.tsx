import type { Sprite } from '../sprite';
import { C } from '../palette';

/**
 * The chip-stealing gull. It reuses the white body of the friendly Seagull prop, so the
 * greed has to come from the pose: wings held half open, brows driven down into a hard
 * stare, and a chip already clamped in the beak.
 */
export const GreedyGull: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* Legs and webbed feet */}
    <line x1={40} y1={80} x2={36} y2={88} stroke={C.sun} strokeWidth={6} strokeLinecap="round" />
    <line x1={52} y1={80} x2={56} y2={88} stroke={C.sun} strokeWidth={6} strokeLinecap="round" />
    <path d="M28,92 L46,92 L36,85 Z" fill={C.sun} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M48,92 L66,92 L56,85 Z" fill={C.sun} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />

    {/* Tail, cocked up behind the body */}
    <path d="M24,50 L4,60 L26,72 Z" fill={C.grey} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />

    <ellipse cx={44} cy={60} rx={28} ry={26} fill={C.white} stroke={C.ink} strokeWidth={4} />

    {/* Half open wings. White on white needs help, so each one gets grey feather bars. */}
    <path d="M38,46 C22,42 10,54 14,72 C28,68 36,58 41,50 Z" fill={C.white} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M18,66 L23,64" stroke={C.grey} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M18,59 L28,57" stroke={C.grey} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M19,53 L29,51" stroke={C.grey} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M56,46 C72,42 84,54 80,72 C66,68 58,58 53,50 Z" fill={C.white} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M76,66 L71,64" stroke={C.grey} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M76,59 L66,57" stroke={C.grey} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M75,53 L65,51" stroke={C.grey} strokeWidth={5} strokeLinecap="round" fill="none" />

    <circle cx={58} cy={26} r={20} fill={C.white} stroke={C.ink} strokeWidth={4} />

    {/* Beak, then the stolen chip gripped at its tip */}
    <polygon points="74,18 92,28 74,38" fill={C.sun} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <rect
      x={74}
      y={32}
      width={19}
      height={8}
      rx={3}
      fill={C.sunDeep}
      stroke={C.ink}
      strokeWidth={3}
      strokeLinejoin="round"
      transform="rotate(28 83.5 36)"
    />

    {/* Narrow sclera plus a big pupil aimed at the food: greedy, not sleepy */}
    <ellipse cx={50} cy={27} rx={7} ry={5.5} fill={C.white} stroke={C.ink} strokeWidth={3} />
    <ellipse cx={65} cy={27} rx={7} ry={5.5} fill={C.white} stroke={C.ink} strokeWidth={3} />
    <circle cx={52} cy={28} r={4} fill={C.ink} />
    <circle cx={67} cy={28} r={4} fill={C.ink} />
    <circle cx={50.5} cy={26.5} r={1.8} fill={C.white} />
    <circle cx={65.5} cy={26.5} r={1.8} fill={C.white} />
    <path d="M43,15 L55,19" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
    <path d="M73,15 L61,19" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
  </svg>
);

/**
 * A drifting jellyfish. The tentacles are drawn twice - a fat ink pass, then a thinner
 * colour pass - which is how the other sprites fake an outline on a stroked shape.
 */
export const Jellyfish: Sprite = () => {
  const tentacles = [
    'M16,54 Q8,66 18,76 Q26,84 18,90',
    'M33,61 Q26,72 35,81 Q43,88 35,90',
    'M50,60 Q44,72 52,80 Q60,88 50,90',
    'M67,60 Q60,72 68,80 Q76,87 68,90',
    'M84,54 Q92,66 82,76 Q74,84 82,90',
  ];
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      {tentacles.map((d, i) => (
        <path key={`ink${i}`} d={d} stroke={C.ink} strokeWidth={9} strokeLinecap="round" fill="none" />
      ))}
      {tentacles.map((d, i) => (
        <path key={i} d={d} stroke={C.sky} strokeWidth={5} strokeLinecap="round" fill="none" />
      ))}

      {/* Bell, with a scalloped rim that hides where the tentacles attach */}
      <path
        d="M8,52 C8,24 26,8 50,8 C74,8 92,24 92,52 C82,60 76,52 66,58 C58,63 50,56 40,60 C28,65 18,60 8,52 Z"
        fill={C.plum}
        stroke={C.ink}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <ellipse cx={31} cy={20} rx={9} ry={5} fill={C.white} transform="rotate(-25 31 20)" />

      {/* Sleepy-smug face: droopy lids, low pupils, one raised corner on the mouth */}
      <path d="M26,25 L44,28" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <path d="M74,25 L56,28" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <ellipse cx={36} cy={37} rx={9.5} ry={7} fill={C.white} stroke={C.ink} strokeWidth={3} />
      <ellipse cx={64} cy={37} rx={9.5} ry={7} fill={C.white} stroke={C.ink} strokeWidth={3} />
      <circle cx={36} cy={40} r={4} fill={C.ink} />
      <circle cx={64} cy={40} r={4} fill={C.ink} />
      <path d="M27,36 Q36,29 45,36" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <path d="M55,36 Q64,29 73,36" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <path d="M38,51 Q48,58 62,48" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" fill="none" />
    </svg>
  );
};

/**
 * Boss. The imposing part is the width: a huge round head under a pirate bandana with
 * six arms sweeping the whole floor of the box, all under one heavy unibrow.
 */
export const Octopus: Sprite = () => {
  // Every arm curls the same way, so six arms read as one wave instead of a tangle.
  const arms: Array<{ d: string; suckers: Array<[number, number]> }> = [
    { d: 'M18,54 C10,66 12,82 24,84 C30,85 30,79 26,77', suckers: [[14, 73], [18, 81]] },
    { d: 'M31,63 C25,74 28,86 39,86 C44,86 44,80 40,78', suckers: [[29, 79], [33, 85]] },
    { d: 'M44,68 C40,80 44,90 54,88 C58,87 58,81 54,79', suckers: [[44, 83], [49, 88]] },
    { d: 'M57,68 C55,80 60,90 69,87 C73,86 72,80 68,78', suckers: [[59, 83], [64, 87]] },
    { d: 'M70,63 C68,76 74,86 83,82 C86,80 85,75 81,74', suckers: [[72, 79], [78, 83]] },
    { d: 'M81,54 C88,64 94,76 88,84 C85,88 81,86 82,82', suckers: [[89, 70], [90, 79]] },
  ];
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      {arms.map((arm, i) => (
        <g key={i}>
          <path d={arm.d} stroke={C.ink} strokeWidth={12} strokeLinecap="round" fill="none" />
          <path d={arm.d} stroke={C.berryDeep} strokeWidth={7} strokeLinecap="round" fill="none" />
          {arm.suckers.map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2.4} fill={C.sand} />
          ))}
        </g>
      ))}

      <ellipse cx={50} cy={38} rx={38} ry={32} fill={C.berry} stroke={C.ink} strokeWidth={4} />

      {/* Pirate bandana: knot and two loose ends on the left */}
      <polygon points="12,28 4,32 12,37" fill={C.sun} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      <polygon points="13,33 6,45 17,40" fill={C.sun} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
      <path
        d="M14,32 C16,12 32,4 50,4 C68,4 84,12 86,32 C60,20 40,20 14,32 Z"
        fill={C.sun}
        stroke={C.ink}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <circle cx={14} cy={30} r={7} fill={C.sun} stroke={C.ink} strokeWidth={4} />

      {/* One heavy unibrow does all the grumpy work */}
      <path d="M22,38 Q50,30 78,38" stroke={C.ink} strokeWidth={6} strokeLinecap="round" fill="none" />
      <circle cx={33} cy={50} r={10} fill={C.white} stroke={C.ink} strokeWidth={4} />
      <circle cx={67} cy={50} r={10} fill={C.white} stroke={C.ink} strokeWidth={4} />
      <circle cx={35} cy={51} r={5.5} fill={C.ink} />
      <circle cx={69} cy={51} r={5.5} fill={C.ink} />
      <circle cx={29} cy={46} r={2.5} fill={C.white} />
      <circle cx={63} cy={46} r={2.5} fill={C.white} />
      <path d="M36,60 Q44,54 51,61 Q58,68 66,60" stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" fill="none" />
    </svg>
  );
};
