import type { Sprite } from '../sprite';
import { C } from '../palette';

export const Bed: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <rect x={10} y={76} width={82} height={18} rx={4} fill={C.sand} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={10} y={12} width={18} height={68} rx={8} fill={C.sand} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={28} y={50} width={64} height={28} rx={10} fill={C.cream} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path
      d="M48,52 C54,46 64,46 68,50 C74,56 84,50 92,54 L92,78 L48,78 Z"
      fill={C.sky}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
  </svg>
);

export const MoonWindow: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <rect x={10} y={10} width={80} height={80} rx={12} fill={C.ink} />
    <rect x={19} y={19} width={62} height={62} rx={6} fill={C.skyDeep} />
    <rect x={46} y={19} width={8} height={62} fill={C.ink} />
    <rect x={19} y={46} width={62} height={8} fill={C.ink} />
    <circle cx={29} cy={32} r={9} fill={C.cream} stroke={C.ink} strokeWidth={4} />
    <circle cx={35} cy={28} r={8} fill={C.skyDeep} />
  </svg>
);

export const Star: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <polygon
      points="50,8 61.2,35.6 90.9,37.7 68.1,56.9 75.3,85.8 50,70 24.7,85.8 31.9,56.9 9.1,37.7 38.8,35.6"
      fill={C.sun}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
  </svg>
);

export const Blanket: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <path
      d="M10,72 C20,60 34,60 44,70 C52,78 66,78 74,70 C80,63 86,63 90,70 L90,93 L10,93 Z"
      fill={C.plum}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <path
      d="M16,50 C24,38 36,38 44,48 C50,56 62,56 68,48 C73,41 78,41 84,48 L84,68 L16,68 Z"
      fill={C.plum}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <path
      d="M22,28 C29,14 39,14 46,26 C51,33 61,33 66,26 C70,18 74,18 78,26 L78,46 L22,46 Z"
      fill={C.plum}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
  </svg>
);

export const Pillow: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <rect x={10} y={10} width={80} height={80} rx={28} fill={C.cream} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M22,50 Q50,58 78,50" stroke={C.grey} strokeWidth={4} strokeLinecap="round" fill="none" />
  </svg>
);

export const Slipper: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <path
      d="M10,70 C8,58 20,50 38,50 C60,50 84,54 90,66 C93,73 88,82 74,85 C55,89 28,88 16,80 C10,76 10,74 10,70 Z"
      fill={C.berry}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <path
      d="M52,56 C55,24 88,22 93,52 C96,62 90,68 84,65 C81,42 58,42 55,65 C49,67 48,60 52,56 Z"
      fill={C.cream}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
  </svg>
);
