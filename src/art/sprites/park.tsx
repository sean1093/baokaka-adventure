import type { Sprite } from '../sprite';
import { C } from '../palette';

export const Bench: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <polygon points="80,16 92,24 92,60 80,52" fill={C.mochaDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <rect x={13} y={14} width={74} height={9} rx={3} fill={C.mochaDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={13} y={27} width={74} height={9} rx={3} fill={C.mochaDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={13} y={40} width={74} height={9} rx={3} fill={C.mochaDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={8} y={52} width={82} height={11} rx={3} fill={C.mochaDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={18} y={62} width={10} height={29} rx={2} fill={C.ink} />
    <rect x={64} y={62} width={10} height={29} rx={2} fill={C.ink} />
  </svg>
);

export const Slide: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <rect x={10} y={78} width={16} height={14} fill={C.grey} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={24} y={64} width={16} height={28} fill={C.grey} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={38} y={48} width={20} height={44} fill={C.grey} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M58,48 L72,48 L94,84 L94,92 L78,92 L58,56 Z" fill={C.sky} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <line x1={42} y1={48} x2={42} y2={28} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
    <line x1={58} y1={48} x2={58} y2={26} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
    <path d="M42,28 Q50,20 58,26" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
  </svg>
);

export const Cloud: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <rect x={10} y={50} width={80} height={32} rx={16} fill={C.white} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={30} cy={48} r={19} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={56} cy={38} r={26} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={78} cy={50} r={17} fill={C.white} stroke={C.ink} strokeWidth={4} />
  </svg>
);

export const Kite: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <polygon points="50,8 85,38 50,60 15,38" fill={C.plum} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <line x1={50} y1={4} x2={50} y2={64} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    <line x1={10} y1={38} x2={90} y2={38} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    <path d="M50,60 Q40,70 50,80 Q60,90 50,97" fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    <polygon points="37,68 43,72 37,76" fill={C.sun} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <polygon points="49,68 43,72 49,76" fill={C.sun} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <polygon points="52,85 58,89 52,93" fill={C.sun} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <polygon points="64,85 58,89 64,93" fill={C.sun} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
  </svg>
);

export const Bird: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <circle cx={38} cy={64} r={26} fill={C.sky} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={76} cy={39} r={17} fill={C.sky} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <polygon points="93,39 76,32 76,46" fill={C.sun} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <circle cx={80} cy={35} r={2.5} fill={C.ink} />
    <path d="M22,58 Q38,66 22,80" fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
  </svg>
);
