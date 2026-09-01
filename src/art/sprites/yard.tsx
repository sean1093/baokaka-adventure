import type { Sprite } from '../sprite';
import { C } from '../palette';

export const Tree: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <rect x={43} y={52} width={14} height={38} rx={4} fill={C.mochaDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={32} cy={48} r={22} fill={C.leaf} stroke={C.ink} strokeWidth={4} />
    <circle cx={68} cy={48} r={22} fill={C.leaf} stroke={C.ink} strokeWidth={4} />
    <circle cx={50} cy={28} r={25} fill={C.leaf} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={50} cy={53} rx={15} ry={6} fill={C.leafDeep} />
  </svg>
);

export const Fence: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <rect x={6} y={42} width={88} height={8} rx={2} fill={C.sandDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={6} y={68} width={88} height={8} rx={2} fill={C.sandDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <polygon points="10,90 10,35 22,18 34,35 34,90" fill={C.sand} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <polygon points="38,90 38,35 50,18 62,35 62,90" fill={C.sand} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <polygon points="66,90 66,35 78,18 90,35 90,90" fill={C.sand} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  </svg>
);

export const FlowerPot: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <polygon points="26,68 74,68 65,94 35,94" fill={C.sandDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <line x1={50} y1={68} x2={50} y2={26} stroke={C.leaf} strokeWidth={8} strokeLinecap="round" />
    <ellipse cx={50} cy={14} rx={8} ry={12} transform="rotate(0 50 26)" fill={C.plum} stroke={C.ink} strokeWidth={3} />
    <ellipse cx={50} cy={14} rx={8} ry={12} transform="rotate(72 50 26)" fill={C.plum} stroke={C.ink} strokeWidth={3} />
    <ellipse cx={50} cy={14} rx={8} ry={12} transform="rotate(144 50 26)" fill={C.plum} stroke={C.ink} strokeWidth={3} />
    <ellipse cx={50} cy={14} rx={8} ry={12} transform="rotate(216 50 26)" fill={C.plum} stroke={C.ink} strokeWidth={3} />
    <ellipse cx={50} cy={14} rx={8} ry={12} transform="rotate(288 50 26)" fill={C.plum} stroke={C.ink} strokeWidth={3} />
    <circle cx={50} cy={26} r={7} fill={C.sun} stroke={C.ink} strokeWidth={3} />
  </svg>
);

export const WateringCan: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <rect x={14} y={36} width={52} height={48} rx={18} fill={C.grey} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <ellipse cx={40} cy={36} rx={27} ry={8} fill={C.grey} stroke={C.ink} strokeWidth={4} />
    <polygon points="60,42 90,10 97,13 68,48" fill={C.ink} />
    <path d="M20 36 Q42 0 64 36" fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
  </svg>
);

export const Butterfly: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <ellipse cx={32} cy={62} rx={16} ry={14} transform="rotate(15 32 62)" fill={C.plum} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={68} cy={62} rx={16} ry={14} transform="rotate(-15 68 62)" fill={C.plum} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={26} cy={32} rx={22} ry={18} transform="rotate(-20 26 32)" fill={C.plum} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={74} cy={32} rx={22} ry={18} transform="rotate(20 74 32)" fill={C.plum} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={50} cy={60} rx={6} ry={20} fill={C.ink} />
    <ellipse cx={50} cy={36} rx={5} ry={10} fill={C.ink} />
    <circle cx={50} cy={22} r={6} fill={C.ink} />
    <line x1={46} y1={18} x2={36} y2={6} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    <line x1={54} y1={18} x2={64} y2={6} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    <circle cx={36} cy={6} r={2.5} fill={C.ink} />
    <circle cx={64} cy={6} r={2.5} fill={C.ink} />
  </svg>
);

export const Stone: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <path
      d="M14 62 C12.2 38.5 12.2 38.5 28 19 C49.9 9 49.9 9 73 16 C88.3 30.8 88.3 30.8 88 53 C80 77.5 80 77.5 60 89 C32.6 83.3 32.6 83.3 14 62 Z"
      fill={C.grey}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <path d="M34 22 Q50 13 66 20" fill="none" stroke={C.white} strokeWidth={3} strokeLinecap="round" />
  </svg>
);
