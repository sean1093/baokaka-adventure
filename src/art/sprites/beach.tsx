import type { Sprite } from '../sprite';
import { C } from '../palette';

export const SunDisc: Sprite = () => {
  const rays: Array<[number, number, number, number]> = [
    [78, 50, 93, 50],
    [69.8, 69.8, 80.4, 80.4],
    [50, 78, 50, 93],
    [30.2, 69.8, 19.6, 80.4],
    [22, 50, 7, 50],
    [30.2, 30.2, 19.6, 19.6],
    [50, 22, 50, 7],
    [69.8, 30.2, 80.4, 19.6],
  ];
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      {rays.map(([x1, y1, x2, y2]) => (
        <line key={`${x1}-${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.sunDeep} strokeWidth={6} strokeLinecap="round" />
      ))}
      <circle cx={50} cy={50} r={24} fill={C.sun} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    </svg>
  );
};

export const Wave: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <path
      d="M6,48 C22,30 38,30 50,48 C62,66 78,66 94,48 L94,70 C78,88 62,88 50,70 C38,52 22,52 6,70 Z"
      fill={C.skyDeep}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <circle cx={26} cy={40} r={5} fill={C.white} stroke={C.ink} strokeWidth={3} />
    <circle cx={50} cy={59} r={4} fill={C.white} stroke={C.ink} strokeWidth={3} />
    <circle cx={72} cy={77} r={5} fill={C.white} stroke={C.ink} strokeWidth={3} />
  </svg>
);

export const Sandcastle: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <rect x={8} y={55} width={24} height={35} fill={C.sandDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={8} y={48} width={6} height={8} fill={C.sandDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <rect x={17} y={48} width={6} height={8} fill={C.sandDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <rect x={26} y={48} width={6} height={8} fill={C.sandDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />

    <rect x={68} y={55} width={24} height={35} fill={C.sandDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={68} y={48} width={6} height={8} fill={C.sandDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <rect x={77} y={48} width={6} height={8} fill={C.sandDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <rect x={86} y={48} width={6} height={8} fill={C.sandDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />

    <rect x={36} y={35} width={28} height={55} fill={C.sandDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={36} y={28} width={7} height={8} fill={C.sandDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <rect x={46.5} y={28} width={7} height={8} fill={C.sandDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <rect x={57} y={28} width={7} height={8} fill={C.sandDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />

    <line x1={50} y1={28} x2={50} y2={14} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    <polygon points="50,14 64,19 50,24" fill={C.berry} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
  </svg>
);

export const BeachUmbrella: Sprite = () => {
  const pts: Array<[number, number]> = [
    [90, 44],
    [84.6, 24],
    [70, 9.4],
    [50, 4],
    [30, 9.4],
    [15.4, 24],
    [10, 44],
  ];
  const colors = [C.paper, C.berry, C.paper, C.berry, C.paper, C.berry];
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      {colors.map((fill, i) => (
        <polygon
          key={i}
          points={`50,44 ${pts[i][0]},${pts[i][1]} ${pts[i + 1][0]},${pts[i + 1][1]}`}
          fill={fill}
          stroke={C.ink}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      ))}
      <circle cx={50} cy={4} r={3} fill={C.ink} />
      <line x1={50} y1={44} x2={68} y2={95} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
    </svg>
  );
};

export const Starfish: Sprite = () => {
  const arms = [
    { ex: 50, ey: 31, rot: 180 },
    { ex: 68.1, ey: 44.1, rot: 252 },
    { ex: 61.2, ey: 65.4, rot: -36 },
    { ex: 38.8, ey: 65.4, rot: 36 },
    { ex: 31.9, ey: 44.1, rot: 108 },
  ];
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      {arms.map((arm, i) => (
        <ellipse
          key={i}
          cx={arm.ex}
          cy={arm.ey}
          rx={13}
          ry={25}
          fill={C.sun}
          stroke={C.ink}
          strokeWidth={4}
          strokeLinejoin="round"
          transform={`rotate(${arm.rot} ${arm.ex} ${arm.ey})`}
        />
      ))}
      <circle cx={50} cy={50} r={18} fill={C.sun} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <circle cx={44} cy={45} r={2.5} fill={C.sunDeep} />
      <circle cx={57} cy={46} r={2.5} fill={C.sunDeep} />
      <circle cx={50} cy={57} r={2.5} fill={C.sunDeep} />
      <circle cx={42} cy={56} r={2} fill={C.sunDeep} />
      <circle cx={59} cy={57} r={2} fill={C.sunDeep} />
    </svg>
  );
};

export const Seagull: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <circle cx={40} cy={60} r={30} fill={C.white} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={78} cy={38} r={17} fill={C.white} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <polygon points="95,38 78,32 78,45" fill={C.sun} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <circle cx={81} cy={34} r={2.5} fill={C.ink} />
    <path d="M18,54 Q40,32 58,50 Q40,64 18,54 Z" fill={C.grey} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
  </svg>
);
