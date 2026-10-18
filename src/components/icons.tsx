import type { SVGProps } from 'react';

/**
 * The small icon set. Every icon is a 24x24 stroke drawing in currentColor, so it takes the
 * text colour of whatever it sits in. No icon font, no emoji.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const Icon = ({ size = 24, children, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

export const ChevronLeft = (props: IconProps) => (
  <Icon {...props}>
    <path d="M15 5l-7 7 7 7" />
  </Icon>
);

export const ChevronRight = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 5l7 7-7 7" />
  </Icon>
);

export const VolumeOn = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 10v4h3.5L12 18V6l-4.5 4H4z" fill="currentColor" stroke="none" />
    <path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" />
  </Icon>
);

export const VolumeOff = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 10v4h3.5L12 18V6l-4.5 4H4z" fill="currentColor" stroke="none" />
    <path d="M16 9.5l5 5M21 9.5l-5 5" />
  </Icon>
);

export const Play = (props: IconProps) => (
  <Icon {...props}>
    <path d="M8 5.5v13l10-6.5-10-6.5z" fill="currentColor" stroke="none" />
  </Icon>
);

export const Star = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8L12 3.5z" />
  </Icon>
);

export const Refresh = (props: IconProps) => (
  <Icon {...props}>
    <path d="M20 12a8 8 0 01-14.3 4.9M4 12a8 8 0 0114.3-4.9" />
    <path d="M20 5v4h-4M4 19v-4h4" />
  </Icon>
);

export const Home = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1v-9z" />
  </Icon>
);

export const Sparkle = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" fill="currentColor" stroke="none" />
    <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" fill="currentColor" stroke="none" />
  </Icon>
);

/** 攻擊: a toy block, the first thing 寶咖咖 throws */
export const Cube = (props: IconProps) => (
  <Icon {...props} strokeWidth={1.9}>
    <path d="M12 3.5l7.5 4v9L12 20.5l-7.5-4v-9L12 3.5z" />
    <path d="M4.5 7.5L12 11.5l7.5-4M12 11.5v9" />
  </Icon>
);

/** 防禦 */
export const Shield = (props: IconProps) => (
  <Icon {...props} strokeWidth={1.9}>
    <path d="M12 3.5l7 2.6v5.4c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6.1l7-2.6z" />
  </Icon>
);

/** 道具: a little cup with a lid (a drink, a snack box) */
export const Cup = (props: IconProps) => (
  <Icon {...props} strokeWidth={1.9}>
    <path d="M7 8h10l-1.2 11.2a1 1 0 01-1 .8H9.2a1 1 0 01-1-.8L7 8z" />
    <path d="M6 8h12M9 8l.6-3.5h4.8L15 8" />
  </Icon>
);

/** 才藝: a four-pointed sparkle star */
export const Talent = (props: IconProps) => (
  <Icon {...props} strokeWidth={1.9}>
    <path d="M12 3.5l2.2 6.3 6.3 2.2-6.3 2.2L12 20.5l-2.2-6.3L3.5 12l6.3-2.2L12 3.5z" />
  </Icon>
);

/** The menu: a drawstring pouch (百寶袋) */
export const Pouch = (props: IconProps) => (
  <Icon {...props} strokeWidth={2}>
    <path d="M9 5.5h6l-1.4 3c3 1.2 5.4 4.2 5.4 7.5 0 2.5-2 4-4.5 4h-5C7 20 5 18.5 5 16c0-3.3 2.4-6.3 5.4-7.5L9 5.5z" />
    <path d="M10.4 8.5h3.2" />
  </Icon>
);

export const Close = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

/**
 * The critical-HP mark (§ 3.3: shape plus colour): a bold exclamation, filled with currentColor.
 * Drawn as shapes rather than the ❗ emoji so it renders the same everywhere.
 */
export const Alert = (props: IconProps) => (
  <Icon {...props} stroke="none">
    <path d="M9.6 3.2h4.8l-1 11.2h-2.8l-1-11.2z" fill="currentColor" />
    <circle cx="12" cy="18.6" r="2.3" fill="currentColor" />
  </Icon>
);
