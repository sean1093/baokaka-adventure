import type { Sprite } from '../sprite';
import { C } from '../palette';

export const Crate: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <rect x={10} y={16} width={80} height={76} rx={3} fill={C.sand} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={10} y={16} width={80} height={11} rx={2} fill={C.sandDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={16} y={49.5} width={68} height={9} rx={2} fill={C.sandDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" transform="rotate(28 50 54)" />
    <rect x={16} y={49.5} width={68} height={9} rx={2} fill={C.sandDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" transform="rotate(-28 50 54)" />
  </svg>
);

export const FishStall: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <ellipse cx={50} cy={62} rx={44} ry={25} fill={C.grey} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <ellipse cx={36} cy={54} rx={17} ry={8.5} fill={C.skyDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <polygon points="20,54 8,46 8,62" fill={C.skyDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <circle cx={48} cy={54} r={2} fill={C.ink} />
    <ellipse cx={64} cy={72} rx={17} ry={8.5} fill={C.skyDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <polygon points="80,72 93,64 93,80" fill={C.skyDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <circle cx={50} cy={72} r={2} fill={C.ink} />
  </svg>
);

export const Lantern: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <line x1={50} y1={5} x2={50} y2={26} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
    <polygon points="35,24 65,24 90,78 10,78" fill={C.berryDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <ellipse cx={50} cy={78} rx={40} ry={9} fill={C.sun} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
  </svg>
);

export const Awning: Sprite = () => {
  const stripeX = [8, 20, 32, 44, 56, 68, 80];
  const stripeTop = [48, 36, 26, 20, 26, 36, 48];
  const baseline = 68;
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <path
        d="M8,68 Q14,76 20,68 Q26,76 32,68 Q38,76 44,68 Q50,76 56,68 Q62,76 68,68 Q74,76 80,68 Q86,76 92,68 L92,64 L8,64 Z"
        fill={C.paper}
        stroke={C.ink}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      {stripeX.map((x, i) => (
        <rect
          key={x}
          x={x}
          y={stripeTop[i]}
          width={12}
          height={baseline - stripeTop[i]}
          rx={3}
          fill={i % 2 === 0 ? C.paper : C.berryDeep}
          stroke={C.ink}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
};

export const Scale: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <polygon points="38,70 62,70 86,94 14,94" fill={C.sandDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={50} cy={54} r={28} fill={C.grey} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <ellipse cx={50} cy={24} rx={38} ry={10} fill={C.paper} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <line x1={50} y1={54} x2={64} y2={34} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
    <circle cx={50} cy={54} r={4} fill={C.ink} />
  </svg>
);

export const Apple: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <circle cx={49} cy={60} r={36} fill={C.berryDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={44} y={12} width={8} height={17} rx={3} fill={C.mochaDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" transform="rotate(-10 48 20)" />
    <path d="M50,24 Q66,15 71,30 Q60,37 49,26 Z" fill={C.leaf} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
  </svg>
);
