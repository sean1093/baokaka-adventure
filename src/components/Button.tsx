import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  onClick: () => void;
  /** primary = the one thing to do next; tonal = secondary; ghost = quiet; danger = destructive */
  variant?: 'primary' | 'tonal' | 'ghost' | 'danger';
  /** xl is the hidden-object game's 64px floor */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  full?: boolean;
  disabled?: boolean;
  /** Accessible name when the visible text is not enough (icon-only or abbreviated buttons) */
  label?: string;
  icon?: ReactNode;
  className?: string;
};

const VARIANT: Record<NonNullable<Props['variant']>, string> = {
  primary: 'bg-gradient-to-b from-sun to-sunDeep text-ink shadow-glow',
  tonal: 'bg-ink/[0.07] text-ink',
  ghost: 'bg-transparent text-ink/75',
  danger: 'bg-berry text-white shadow-card',
};

const SIZE: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-10 px-4 text-label gap-1.5',
  md: 'h-12 px-5 text-copy gap-2',
  lg: 'h-14 px-7 text-heading gap-2',
  xl: 'min-h-touch px-8 text-headline gap-2',
};

/**
 * The button. Pill shaped, presses down with a spring, and comes in four weights so a screen
 * reads at a glance: one primary, the rest tonal or ghost.
 */
export const Button = ({ children, onClick, variant = 'primary', size = 'md', full, disabled, label, icon, className = '' }: Props) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className={[
      'inline-flex select-none items-center justify-center whitespace-nowrap rounded-full font-bold',
      'transition-[transform,opacity,box-shadow] duration-150 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40',
      VARIANT[variant],
      SIZE[size],
      full ? 'w-full' : '',
      className,
    ].join(' ')}
  >
    {icon}
    {children}
  </button>
);

type IconButtonProps = {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'tonal' | 'ghost' | 'solid';
  size?: 'md' | 'lg';
  active?: boolean;
  disabled?: boolean;
  className?: string;
};

/** A round icon-only button; `label` is mandatory because there is no visible text. */
export const IconButton = ({ icon, label, onClick, variant = 'tonal', size = 'md', active, disabled, className = '' }: IconButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    aria-pressed={active}
    className={[
      'grid shrink-0 place-items-center rounded-full transition-[transform,background-color] duration-150 active:scale-90 disabled:pointer-events-none disabled:opacity-40',
      size === 'lg' ? 'h-14 w-14' : 'h-11 w-11',
      active ? 'bg-ink text-cream' : variant === 'solid' ? 'bg-surface text-ink shadow-card' : variant === 'ghost' ? 'text-ink/75' : 'bg-ink/[0.07] text-ink',
      className,
    ].join(' ')}
  >
    {icon}
  </button>
);
