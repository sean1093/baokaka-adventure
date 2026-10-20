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

/** The album's page arrows (#113): a chevron with a page's turned-up corner behind it; `dir` 1 points to the next leaf. */
export const PageArrowIcon = ({ dir }: { dir: 1 | -1 }) => (
  <svg {...box} style={dir === 1 ? undefined : { transform: 'scaleX(-1)' }}>
    <path d="M7 7h15l7 7v15H7z" fill={C.foldLitHigh} stroke={C.pageEdge} strokeWidth={1.4} strokeLinejoin="round" />
    <path d="M22 7v7h7" fill={C.pageDark} stroke={C.pageEdge} strokeWidth={1.4} strokeLinejoin="round" />
    <path d="M14 11l8 7.5l-8 7.5" fill="none" {...ink} strokeWidth={3.4} />
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

// ——— The settings' icons (#104): one per row, the same ink line drawings ———

/** 長輩模式: 阿公's round reading glasses. */
export const ElderIcon = () => (
  <svg {...box}>
    <circle cx="10.5" cy="20" r="6.5" fill={C.foldLitHigh} {...ink} />
    <circle cx="25.5" cy="20" r="6.5" fill={C.foldLitHigh} {...ink} />
    <path d="M17 19.5q1 -2 2 0M4 18l-1.5 -6M32 18l1.5 -6" fill="none" {...ink} />
    <path d="M7.5 17.5q2 -2 4.5 -1M22.5 17.5q2 -2 4.5 -1" fill="none" stroke={C.gold} strokeWidth={1.6} strokeLinecap="round" />
  </svg>
);

/** 速度: a little paper speed dial, its needle near 慢. */
export const SpeedIcon = () => (
  <svg {...box}>
    <path d="M5 26a13 13 0 0 1 26 0z" fill={C.foldLitHigh} {...ink} />
    <path d="M9 21.5l2 1M18 11v2.4M27 21.5l-2 1M11.6 14.6l1.6 1.6M24.4 14.6l-1.6 1.6" fill="none" {...ink} strokeWidth={1.8} />
    <path d="M18 26l-6 -6" fill="none" stroke={C.seal} strokeWidth={2.8} strokeLinecap="round" />
    <circle cx="18" cy="26" r="2.6" fill={C.gold} stroke={C.ink} strokeWidth={1.4} />
  </svg>
);

/** 字的大小: a magnifying glass over a line of text. */
export const TextSizeIcon = () => (
  <svg {...box}>
    <path d="M4 9h13M4 15h8M4 21h7" fill="none" {...ink} strokeWidth={2.2} />
    <circle cx="21" cy="18" r="8" fill={C.foldLitHigh} {...ink} />
    <path d="M17 16h8M17 20.5h6" fill="none" {...ink} strokeWidth={3} />
    <path d="M27 24l5.5 5.5" fill="none" {...ink} strokeWidth={4} />
  </svg>
);

/** 自動提示: the bar's light bulb, with a little clock face for "after a while". */
export const AutoHintIcon = () => (
  <svg {...box}>
    <path d="M15 5a9 9 0 0 1 5.5 16.2V25h-11v-3.8A9 9 0 0 1 15 5z" fill={C.bulb} stroke={C.bulbInk} strokeWidth={2} strokeLinejoin="round" />
    <path d="M11 28.5h8M12.5 32h5" stroke={C.bulbInk} strokeWidth={2.2} strokeLinecap="round" />
    <circle cx="27" cy="25" r="6.5" fill={C.foldLitHigh} {...ink} strokeWidth={2} />
    <path d="M27 21.6V25l2.4 1.6" fill="none" {...ink} strokeWidth={1.8} />
  </svg>
);

/** 音效: a speaker with two sound waves. */
export const SoundIcon = () => (
  <svg {...box}>
    <path d="M5 14h6l8 -7v22l-8 -7H5z" fill={C.foldLitHigh} {...ink} />
    <path d="M23.5 13a7 7 0 0 1 0 10M27.5 9a12.5 12.5 0 0 1 0 18" fill="none" {...ink} />
  </svg>
);

/** 音樂: two beamed notes from 阿嬤's music box. */
export const MusicIcon = () => (
  <svg {...box}>
    <path d="M13 26V9l16 -4v17" fill="none" {...ink} />
    <path d="M13 13l16 -4" fill="none" {...ink} strokeWidth={4} />
    <ellipse cx="9.5" cy="26.5" rx="4.5" ry="3.5" fill={C.ink} />
    <ellipse cx="25.5" cy="22.5" rx="4.5" ry="3.5" fill={C.ink} />
  </svg>
);

/** 震動: a phone buzzing. */
export const VibrateIcon = () => (
  <svg {...box}>
    <rect x="11" y="5" width="14" height="26" rx="3" fill={C.foldLitHigh} {...ink} />
    <path d="M15.5 26.5h5" {...ink} strokeWidth={2} />
    <path d="M6.5 11l-2.5 3.5l2.5 3.5l-2.5 3.5l2.5 3.5M29.5 11l2.5 3.5l-2.5 3.5l2.5 3.5l-2.5 3.5" fill="none" stroke={C.seal} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** 減少動態: a paper leaf that holds still (its motion lines stopped by a bar). */
export const MotionIcon = () => (
  <svg {...box}>
    <path d="M9 28C9 15 17 7 29 7c0 12 -8 21 -20 21z" fill={C.foldLitHigh} {...ink} />
    <path d="M9 28l14 -14" fill="none" {...ink} strokeWidth={1.8} />
    <path d="M3 10h6M2 16h4" fill="none" stroke={C.inkSoft} strokeWidth={2} strokeLinecap="round" strokeDasharray="2 3" />
    <rect x="25" y="22" width="3.4" height="10" rx="1" fill={C.seal} />
    <rect x="30.5" y="22" width="3.4" height="10" rx="1" fill={C.seal} />
  </svg>
);

/** 左手模式: a left hand, palm out (the thumb on the right). */
export const LeftHandIcon = () => (
  <svg {...box}>
    <path
      d="M11 31c-3 -3 -5 -7 -5 -11v-7a2 2 0 0 1 4 0v5V8a2 2 0 0 1 4 0v9V6a2 2 0 0 1 4 0v11V8a2 2 0 0 1 4 0v12l3.5 -4a2.2 2.2 0 0 1 3.4 2.8L25 27c-2 3 -4 4 -7 4z"
      fill={C.foldLitHigh}
      {...ink}
      strokeWidth={2.2}
    />
  </svg>
);

/** 書本傾斜: the phone tilted, with a curved arrow. */
export const TiltIcon = () => (
  <svg {...box}>
    <rect x="12" y="6" width="13" height="23" rx="3" fill={C.foldLitHigh} {...ink} transform="rotate(14 18 18)" />
    <path d="M5 13a14 14 0 0 0 1.5 14" fill="none" stroke={C.seal} strokeWidth={2.4} strokeLinecap="round" />
    <path d="M3.5 23.5l3 4l4 -2.5" fill="none" stroke={C.seal} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** 重新開始: a round arrow on the red seal. */
export const ResetIcon = () => (
  <svg {...box}>
    <rect x="2" y="2" width="32" height="32" rx="7" fill={C.seal} />
    <rect x="4.5" y="4.5" width="27" height="27" rx="5" fill="none" stroke={C.sealHairline} strokeWidth={1} opacity={0.75} />
    <path d="M25 13a8.5 8.5 0 1 0 1.6 7.5" fill="none" stroke={C.sealGlyph} strokeWidth={3} strokeLinecap="round" />
    <path d="M26.5 7.5v6h-6" fill="none" stroke={C.sealGlyph} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** The chosen option's tick (a shape as well as a colour, § 2.11). */
export const CheckIcon = ({ size = 20, color = C.goldLight }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M4 10.5l4 4l8 -9" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
