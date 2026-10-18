import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  onClick: () => void;
  /**
   * primary = the one gold thing to do next (one per screen); secondary = navy with a gold
   * hairline; text = a quiet link (逃跑 ›, 不買了)
   */
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
  disabled?: boolean;
  /** Accessible name when the visible text is not enough (icon-only or abbreviated buttons) */
  label?: string;
  icon?: ReactNode;
  className?: string;
};

/**
 * The button (art direction § 7.2). Every size is at least 44px tall; pressing moves it down 2px
 * and drops its glow for 80ms.
 */
export const Button = ({ children, onClick, variant = 'primary', size = 'md', full, disabled, label, icon, className = '' }: Props) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className={['kit-btn kit-press', `kit-btn--${variant}`, `kit-btn--${size}`, full ? 'w-full' : '', className].join(' ')}
  >
    {icon}
    {children}
  </button>
);

type IconButtonProps = {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
};

/** A round 44px glass button with a gold hairline; `label` is mandatory because there is no visible text. */
export const IconButton = ({ icon, label, onClick, active, disabled, className = '' }: IconButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    aria-pressed={active}
    className={`kit-icon-btn kit-press disabled:pointer-events-none disabled:opacity-40 ${className}`}
  >
    {icon}
  </button>
);

type CommandButtonProps = {
  label: string;
  /** The live sub-label: MP, item count, what it does */
  sub: string;
  icon: ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
};

/**
 * The battle command (§ 7.2): 70px tall, a 36px icon in a gold ring, a serif 21px label and a
 * 12px sub-label with live information.
 */
export const CommandButton = ({ label, sub, icon, onClick, primary, disabled }: CommandButtonProps) => (
  <button type="button" disabled={disabled} onClick={onClick} className={`kit-cmd kit-press ${primary ? 'kit-cmd--primary' : ''}`}>
    <span aria-hidden="true" className="kit-cmd__icon">
      {icon}
    </span>
    <span className="min-w-0">
      <span className="kit-cmd__label">{label}</span>
      <span className="kit-cmd__sub truncate">{sub}</span>
    </span>
  </button>
);

/** An on/off row: the label, then a gold switch. 48px tall, the whole row is the target. */
export const Switch = ({ label, hint, on, onToggle }: { label: string; hint?: string; on: boolean; onToggle: (on: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    onClick={() => onToggle(!on)}
    className="kit-press flex min-h-[48px] w-full items-center gap-3 text-left"
  >
    <span className="min-w-0 flex-1">
      <span className="block font-serif text-label tracking-[0.08em] text-inkOnDark">{label}</span>
      {hint && <span className="block text-caption text-mutedOnDark">{hint}</span>}
    </span>
    <span aria-hidden="true" className="kit-switch" />
  </button>
);
