import type { Sprite } from '../sprite';
import { C } from '../palette';

export const Sofa: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <rect x={10} y={22} width={80} height={42} rx={14} fill={C.sand} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={6} y={34} width={18} height={50} rx={9} fill={C.sand} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={76} y={34} width={18} height={50} rx={9} fill={C.sand} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={14} y={56} width={72} height={28} rx={10} fill={C.sand} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={26} y={30} width={20} height={20} rx={7} fill={C.sandDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={54} y={30} width={20} height={20} rx={7} fill={C.sandDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <line x1={50} y1={60} x2={50} y2={80} stroke={C.sandDeep} strokeWidth={3} strokeLinecap="round" />
  </svg>
);

export const CoffeeTable: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <rect x={8} y={28} width={84} height={16} rx={6} fill={C.mochaDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={18} y={44} width={13} height={42} rx={4} fill={C.mochaDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={69} y={44} width={13} height={42} rx={4} fill={C.mochaDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  </svg>
);

export const FloorLamp: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <ellipse cx={50} cy={90} rx={24} ry={7} fill={C.sandDeep} stroke={C.ink} strokeWidth={4} />
    <rect x={47} y={42} width={6} height={48} rx={3} fill={C.ink} />
    <polygon points="34,14 66,14 82,44 18,44" fill={C.paper} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  </svg>
);

export const PottedPlant: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <polygon points="24,68 76,68 68,92 32,92" fill={C.sandDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <ellipse cx={35} cy={45} rx={10} ry={22} transform="rotate(-25 35 45)" fill={C.leaf} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={65} cy={45} rx={10} ry={22} transform="rotate(25 65 45)" fill={C.leaf} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={50} cy={33} rx={11} ry={25} fill={C.leaf} stroke={C.ink} strokeWidth={4} />
    <line x1={27} y1={29} x2={43} y2={61} stroke={C.leafDeep} strokeWidth={3} strokeLinecap="round" />
    <line x1={73} y1={29} x2={57} y2={61} stroke={C.leafDeep} strokeWidth={3} strokeLinecap="round" />
    <line x1={50} y1={12} x2={50} y2={54} stroke={C.leafDeep} strokeWidth={3} strokeLinecap="round" />
  </svg>
);

export const WallClock: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <circle cx={50} cy={50} r={40} fill={C.cream} stroke={C.ink} strokeWidth={4} />
    <circle cx={50} cy={18} r={4} fill={C.ink} />
    <line x1={50} y1={50} x2={36} y2={42} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
    <line x1={50} y1={50} x2={71} y2={38} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
    <circle cx={50} cy={50} r={5} fill={C.ink} />
  </svg>
);

export const Rug: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <ellipse cx={50} cy={55} rx={42} ry={22} fill={C.paper} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={50} cy={55} rx={28} ry={13} fill="none" stroke={C.grey} strokeWidth={3} />
    <line x1={11} y1={47} x2={4} y2={47} stroke={C.grey} strokeWidth={3} strokeLinecap="round" />
    <line x1={8} y1={55} x2={1} y2={55} stroke={C.grey} strokeWidth={3} strokeLinecap="round" />
    <line x1={11} y1={63} x2={4} y2={63} stroke={C.grey} strokeWidth={3} strokeLinecap="round" />
    <line x1={89} y1={47} x2={96} y2={47} stroke={C.grey} strokeWidth={3} strokeLinecap="round" />
    <line x1={92} y1={55} x2={99} y2={55} stroke={C.grey} strokeWidth={3} strokeLinecap="round" />
    <line x1={89} y1={63} x2={96} y2={63} stroke={C.grey} strokeWidth={3} strokeLinecap="round" />
  </svg>
);
