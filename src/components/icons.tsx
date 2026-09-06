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

export const ArrowLeft = (props: IconProps) => (
  <Icon {...props}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icon>
);

export const ArrowRight = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
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

export const Check = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
);

export const Lock = (props: IconProps) => (
  <Icon {...props}>
    <rect x={5} y={11} width={14} height={10} rx={3} />
    <path d="M8 11V8a4 4 0 018 0v3" />
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

export const Bulb = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z" />
  </Icon>
);

export const Pencil = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 20l4.5-1 10-10a2.1 2.1 0 00-3-3l-10 10L4 20z" />
    <path d="M13.5 7.5l3 3" />
  </Icon>
);

export const Eraser = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 16l8-8a2 2 0 013 0l4 4a2 2 0 010 3l-4 4H9l-5-5z" />
    <path d="M8 21h12" />
  </Icon>
);

export const Refresh = (props: IconProps) => (
  <Icon {...props}>
    <path d="M20 12a8 8 0 01-14.3 4.9M4 12a8 8 0 0114.3-4.9" />
    <path d="M20 5v4h-4M4 19v-4h4" />
  </Icon>
);

export const Shuffle = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 7h3.5c1.6 0 3 .8 3.9 2.1l1.2 1.8c.9 1.3 2.3 2.1 3.9 2.1H20M4 17h3.5c1.6 0 3-.8 3.9-2.1M16.5 13c.9-1.3 2.3-2.1 3.9-2.1" />
    <path d="M17 4l3 3-3 3M17 14l3 3-3 3" />
  </Icon>
);

export const Home = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1v-9z" />
  </Icon>
);

export const Flag = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 21V4M6 4h11l-2.5 4L17 12H6" />
  </Icon>
);

export const Swords = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 4l11 11M20 4L9 15M14 15l3 3M10 15l-3 3M17 18l2 2M7 18l-2 2" />
  </Icon>
);

export const Tent = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 20L12 5l9 15H3zM12 20v-7l-3 7M12 13l3 7" />
  </Icon>
);

export const Sparkle = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" fill="currentColor" stroke="none" />
    <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" fill="currentColor" stroke="none" />
  </Icon>
);

export const Clock = (props: IconProps) => (
  <Icon {...props}>
    <circle cx={12} cy={12} r={8.5} />
    <path d="M12 7.5V12l3 2" />
  </Icon>
);

export const Grid = (props: IconProps) => (
  <Icon {...props}>
    <rect x={4} y={4} width={16} height={16} rx={3} />
    <path d="M4 12h16M12 4v16" />
  </Icon>
);
