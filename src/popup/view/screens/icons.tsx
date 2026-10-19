import { POPUP as C } from '../../../art/palette';

/**
 * The screens' icons (#97): ink line drawings with a touch of foil or seal red, in a 36 × 36 box.
 * Every button pairs one with its word (R5: an icon with every instruction).
 */

const box = { width: 36, height: 36, viewBox: '0 0 36 36', 'aria-hidden': true } as const;
const ink = { stroke: C.ink, strokeWidth: 2.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** 目錄: a folded route map with the 月亮線 ribbon and two stations. */
export const ContentsIcon = () => (
  <svg {...box}>
    <path d="M4 9l9 -4l10 4l9 -4v22l-9 4l-10 -4l-9 4z" fill={C.foldLitHigh} {...ink} />
    <path d="M13 5v22M23 9v22" fill="none" {...ink} strokeWidth={1.6} />
    <path d="M7 24q6 -10 13 -6t9 -8" fill="none" stroke={C.ribbon} strokeWidth={2.6} strokeLinecap="round" />
    <circle cx="7.5" cy="23.5" r="2.6" fill={C.gold} stroke={C.ink} strokeWidth={1.4} />
    <circle cx="28.5" cy="10.5" r="2.6" fill={C.gold} stroke={C.ink} strokeWidth={1.4} />
  </svg>
);

/** 相簿: an instant photo with a washi corner and a little moon in it. */
export const AlbumIcon = () => (
  <svg {...box}>
    <rect x="6" y="5" width="24" height="27" rx="2" fill={C.standeeCard} {...ink} transform="rotate(-6 18 18)" />
    <rect x="9.5" y="8.5" width="17" height="15" fill={C.nightCard} transform="rotate(-6 18 18)" />
    <circle cx="21" cy="13" r="3" fill={C.moon} transform="rotate(-6 18 18)" />
    <path d="M10 22l5 -5l4 4l3 -2l5 4" fill="none" stroke={C.gold} strokeWidth={1.6} transform="rotate(-6 18 18)" />
    <rect x="22" y="1.5" width="11" height="6" fill={C.washiPink} opacity={0.9} transform="rotate(30 27 4.5)" />
  </svg>
);

/** 設定: a paper gear with a brass pin. */
export const SettingsIcon = () => {
  const teeth = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return `M${(18 + Math.cos(a) * 9.5).toFixed(1)} ${(18 + Math.sin(a) * 9.5).toFixed(1)}L${(18 + Math.cos(a) * 14.5).toFixed(1)} ${(18 + Math.sin(a) * 14.5).toFixed(1)}`;
  }).join('');
  return (
    <svg {...box}>
      <path d={teeth} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
      <circle cx="18" cy="18" r="10.5" fill={C.foldLitHigh} {...ink} />
      <circle cx="18" cy="18" r="4" fill={C.gold} stroke={C.ink} strokeWidth={1.6} />
    </svg>
  );
};

/** ▶ continue (a play mark on a seal is the marigold button's; this is the menu's ink version). */
export const ResumeIcon = () => (
  <svg {...box}>
    <circle cx="18" cy="18" r="14" fill={C.foldLitHigh} {...ink} />
    <path d="M14 11l11 7l-11 7z" fill={C.seal} stroke={C.ink} strokeWidth={2} strokeLinejoin="round" />
  </svg>
);

/** 封面: the closed book with its gold title plate. */
export const CoverIcon = () => (
  <svg {...box}>
    <rect x="7" y="4" width="22" height="28" rx="3" fill={C.cover} stroke={C.ink} strokeWidth={2.4} />
    <path d="M10 30h18" stroke={C.foldLit} strokeWidth={2} />
    <rect x="11" y="10" width="14" height="7" rx="1" fill={C.gold} />
    <circle cx="18" cy="23" r="2" fill={C.gold} />
  </svg>
);

/** A paper arrow back (「返回」, 「封面」 on the 目錄). */
export const BackIcon = () => (
  <svg {...box}>
    <path d="M22 8L11 18l11 10" fill="none" {...ink} strokeWidth={3.4} />
  </svg>
);

/** A small padlock (locked stations and pages): a shape as well as a colour (§ 2.11). */
export const LockIcon = ({ size = 20, color = C.inkSoft }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M6 9V6.5a4 4 0 0 1 8 0V9" fill="none" stroke={color} strokeWidth={2} />
    <rect x="4" y="9" width="12" height="9" rx="2" fill={color} />
    <circle cx="10" cy="13.2" r="1.5" fill={C.page} />
  </svg>
);

/** 再拍一次: a little paper camera with a round-arrow over it (#103). */
export const RetakeIcon = () => (
  <svg {...box}>
    <rect x="4" y="13" width="28" height="18" rx="4" fill={C.foldLitHigh} {...ink} />
    <path d="M12 13l2.5 -3.5h7l2.5 3.5" fill="none" {...ink} />
    <circle cx="18" cy="22" r="5" fill={C.nightCard} {...ink} strokeWidth={2} />
    <path d="M25 6.5a8 8 0 0 0 -13 -1.2" fill="none" stroke={C.seal} strokeWidth={2.4} strokeLinecap="round" />
    <path d="M10.4 2.2l1.4 3.6l3.6 -1.2" fill="none" stroke={C.seal} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
