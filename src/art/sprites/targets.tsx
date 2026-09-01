import type { Sprite } from '../sprite';
import { C } from '../palette';

export const Bottle: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <rect x={26} y={36} width={48} height={54} rx={16} fill={C.cream} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={40} y={20} width={20} height={18} rx={4} fill={C.cream} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <ellipse cx={50} cy={15} rx={13} ry={9} fill={C.sun} stroke={C.ink} strokeWidth={4} />
    <line x1={34} y1={56} x2={66} y2={56} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    <line x1={34} y1={72} x2={66} y2={72} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
  </svg>
);

export const Sock: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <path d="M22,20 L58,20 L58,50 Q58,60 70,60 L80,60 Q94,60 94,74 Q94,88 80,88 L36,88 Q22,88 22,74 Z" fill={C.sky} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={20} y={8} width={40} height={18} rx={8} fill={C.cream} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  </svg>
);

export const ClothBook: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <rect x={8} y={14} width={40} height={68} rx={6} fill={C.cream} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={52} y={14} width={40} height={68} rx={6} fill={C.cream} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={45} y={12} width={10} height={72} rx={4} fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <line x1={16} y1={32} x2={40} y2={32} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    <line x1={16} y1={44} x2={40} y2={44} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    <line x1={16} y1={56} x2={40} y2={56} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    <line x1={60} y1={32} x2={84} y2={32} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    <line x1={60} y1={44} x2={84} y2={44} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    <line x1={60} y1={56} x2={84} y2={56} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
  </svg>
);

export const Bucket: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <path d="M14,30 L86,30 L70,88 Q70,92 66,92 L34,92 Q30,92 30,88 Z" fill={C.sky} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M20,28 Q50,2 80,28" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
    <ellipse cx={50} cy={30} rx={36} ry={9} fill={C.sky} stroke={C.ink} strokeWidth={4} />
  </svg>
);

export const Spade: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <path d="M16,50 L84,50 L62,92 L38,92 Z" fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={44} y={12} width={12} height={42} rx={3} fill={C.sand} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={16} y={4} width={68} height={12} rx={6} fill={C.sand} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  </svg>
);

export const Dandelion: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <path d="M47,96 Q43,74 48,50 L52,50 Q57,74 53,96 Z" fill={C.leaf} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <line x1={59} y1={34} x2={74} y2={34} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
    <line x1={56.36} y1={40.36} x2={66.97} y2={50.97} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
    <line x1={50} y1={43} x2={50} y2={58} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
    <line x1={43.64} y1={40.36} x2={33.03} y2={50.97} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
    <line x1={41} y1={34} x2={26} y2={34} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
    <line x1={43.64} y1={27.64} x2={33.03} y2={17.03} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
    <line x1={50} y1={25} x2={50} y2={10} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
    <line x1={56.36} y1={27.64} x2={66.97} y2={17.03} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
    <line x1={59} y1={34} x2={74} y2={34} stroke={C.white} strokeWidth={3} strokeLinecap="round" />
    <line x1={56.36} y1={40.36} x2={66.97} y2={50.97} stroke={C.white} strokeWidth={3} strokeLinecap="round" />
    <line x1={50} y1={43} x2={50} y2={58} stroke={C.white} strokeWidth={3} strokeLinecap="round" />
    <line x1={43.64} y1={40.36} x2={33.03} y2={50.97} stroke={C.white} strokeWidth={3} strokeLinecap="round" />
    <line x1={41} y1={34} x2={26} y2={34} stroke={C.white} strokeWidth={3} strokeLinecap="round" />
    <line x1={43.64} y1={27.64} x2={33.03} y2={17.03} stroke={C.white} strokeWidth={3} strokeLinecap="round" />
    <line x1={50} y1={25} x2={50} y2={10} stroke={C.white} strokeWidth={3} strokeLinecap="round" />
    <line x1={56.36} y1={27.64} x2={66.97} y2={17.03} stroke={C.white} strokeWidth={3} strokeLinecap="round" />
    <circle cx={74} cy={34} r={5} fill={C.white} stroke={C.ink} strokeWidth={3} />
    <circle cx={66.97} cy={50.97} r={5} fill={C.white} stroke={C.ink} strokeWidth={3} />
    <circle cx={50} cy={58} r={5} fill={C.white} stroke={C.ink} strokeWidth={3} />
    <circle cx={33.03} cy={50.97} r={5} fill={C.white} stroke={C.ink} strokeWidth={3} />
    <circle cx={26} cy={34} r={5} fill={C.white} stroke={C.ink} strokeWidth={3} />
    <circle cx={33.03} cy={17.03} r={5} fill={C.white} stroke={C.ink} strokeWidth={3} />
    <circle cx={50} cy={10} r={5} fill={C.white} stroke={C.ink} strokeWidth={3} />
    <circle cx={66.97} cy={17.03} r={5} fill={C.white} stroke={C.ink} strokeWidth={3} />
    <circle cx={50} cy={34} r={11} fill={C.white} stroke={C.ink} strokeWidth={4} />
  </svg>
);

export const Ball: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <circle cx={50} cy={50} r={40} fill={C.cream} stroke={C.ink} strokeWidth={4} />
    <path d="M50,50 L50,10 A40,40 0 0 1 90,50 Z" fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M50,50 L50,90 A40,40 0 0 1 10,50 Z" fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  </svg>
);

export const SunHat: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <ellipse cx={50} cy={72} rx={46} ry={16} fill={C.sand} stroke={C.ink} strokeWidth={4} />
    <path d="M22,74 Q22,26 50,20 Q78,26 78,74 Z" fill={C.sand} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={24} y={60} width={52} height={12} rx={2} fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  </svg>
);

export const Cookie: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <path d="M50,18 Q56,38 86,54 C86,74 70,90 50,90 C30,90 14,74 14,54 C14,34 30,18 50,18 Z" fill={C.sandDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={34} cy={42} r={5} fill={C.ink} />
    <circle cx={55} cy={74} r={5} fill={C.ink} />
    <circle cx={28} cy={66} r={4.5} fill={C.ink} />
    <circle cx={66} cy={68} r={4.5} fill={C.ink} />
  </svg>
);

export const Banana: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <g transform="translate(38,15) rotate(-40)"><path d="M0,0 C27,17 27,51 0,68 Q6,51 10,34 Q6,17 0,0 Z" fill={C.sun} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" /></g>
    <g transform="translate(52,12) rotate(-3)"><path d="M0,0 C27,17 27,51 0,68 Q6,51 10,34 Q6,17 0,0 Z" fill={C.sun} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" /></g>
    <g transform="translate(65,15) rotate(32)"><path d="M0,0 C27,17 27,51 0,68 Q6,51 10,34 Q6,17 0,0 Z" fill={C.sun} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" /></g>
    <ellipse cx={50} cy={13} rx={16} ry={8} fill={C.mochaDeep} stroke={C.ink} strokeWidth={4} />
  </svg>
);

export const DriedFish: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <ellipse cx={38} cy={50} rx={30} ry={24} fill={C.grey} stroke={C.ink} strokeWidth={4} />
    <path d="M62,50 L94,28 L78,50 L94,72 Z" fill={C.grey} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M16,38 Q38,30 58,38" fill="none" stroke={C.white} strokeWidth={3} strokeLinecap="round" />
    <circle cx={20} cy={42} r={5} fill={C.ink} />
  </svg>
);

export const CoinPurse: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <path d="M14,52 Q14,20 50,18 Q86,20 86,52 Q86,88 50,90 Q14,88 14,52 Z" fill={C.plum} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M22,34 Q50,28 78,34" fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    <line x1={36} y1={29} x2={36} y2={37} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    <line x1={50} y1={27} x2={50} y2={35} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    <line x1={64} y1={29} x2={64} y2={37} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
    <rect x={38} y={12} width={24} height={12} rx={6} fill={C.sand} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  </svg>
);

export const Shell: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <path d="M50,88 L12,32 L27,39 L30,23 L42,35 L50,20 L58,35 L70,23 L73,39 L88,32 Z" fill={C.paper} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <line x1={50} y1={88} x2={12} y2={32} stroke={C.sandDeep} strokeWidth={3} strokeLinecap="round" />
    <line x1={50} y1={88} x2={30} y2={23} stroke={C.sandDeep} strokeWidth={3} strokeLinecap="round" />
    <line x1={50} y1={88} x2={50} y2={20} stroke={C.sandDeep} strokeWidth={3} strokeLinecap="round" />
    <line x1={50} y1={88} x2={70} y2={23} stroke={C.sandDeep} strokeWidth={3} strokeLinecap="round" />
    <line x1={50} y1={88} x2={88} y2={32} stroke={C.sandDeep} strokeWidth={3} strokeLinecap="round" />
    <circle cx={50} cy={88} r={5} fill={C.sandDeep} stroke={C.ink} strokeWidth={3} />
  </svg>
);

export const Flask: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <rect x={24} y={30} width={52} height={58} rx={16} fill={C.leaf} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M64,18 Q88,18 88,40 Q88,54 70,56" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
    <rect x={36} y={12} width={28} height={22} rx={7} fill={C.cream} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  </svg>
);

export const ToyBoat: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <path d="M10,62 L90,62 L76,86 Q76,90 72,90 L28,90 Q24,90 24,86 Z" fill={C.berry} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={47} y={16} width={6} height={48} fill={C.ink} />
    <path d="M50,16 L50,58 L82,50 Z" fill={C.cream} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  </svg>
);

export const ComfortDoll: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <rect x={18} y={50} width={64} height={40} rx={12} fill={C.cream} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={26} cy={16} r={11} fill={C.sun} stroke={C.ink} strokeWidth={4} />
    <circle cx={74} cy={16} r={11} fill={C.sun} stroke={C.ink} strokeWidth={4} />
    <circle cx={50} cy={36} r={28} fill={C.sun} stroke={C.ink} strokeWidth={4} />
    <circle cx={40} cy={36} r={4} fill={C.ink} />
    <circle cx={60} cy={36} r={4} fill={C.ink} />
    <path d="M40,46 Q50,53 60,46" fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
  </svg>
);

export const NightLight: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <rect x={36} y={78} width={28} height={14} rx={4} fill={C.sand} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={50} cy={50} r={32} fill={C.cream} stroke={C.ink} strokeWidth={4} />
    <line x1={33} y1={21} x2={27} y2={10} stroke={C.sun} strokeWidth={5} strokeLinecap="round" />
    <line x1={67} y1={21} x2={73} y2={10} stroke={C.sun} strokeWidth={5} strokeLinecap="round" />
    <line x1={84} y1={50} x2={96} y2={50} stroke={C.sun} strokeWidth={5} strokeLinecap="round" />
    <line x1={67} y1={79} x2={73} y2={90} stroke={C.sun} strokeWidth={5} strokeLinecap="round" />
    <line x1={33} y1={79} x2={27} y2={90} stroke={C.sun} strokeWidth={5} strokeLinecap="round" />
    <line x1={16} y1={50} x2={4} y2={50} stroke={C.sun} strokeWidth={5} strokeLinecap="round" />
  </svg>
);
