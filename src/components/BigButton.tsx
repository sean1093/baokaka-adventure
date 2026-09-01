import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  onClick: () => void;
  /** quiet is for secondary actions such as the sound toggle */
  tone?: 'primary' | 'quiet';
  disabled?: boolean;
  label?: string;
};

/**
 * The only button in the game. The 64px touch floor and 24px type are locked in here,
 * so no screen invents its own sizes (spec §8).
 */
export const BigButton = ({ children, onClick, tone = 'primary', disabled, label }: Props) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className={[
      'min-h-touch min-w-touch rounded-3xl border-4 border-ink px-8 py-4',
      'text-body font-bold leading-none',
      'transition-transform active:translate-y-1 disabled:opacity-40',
      tone === 'primary' ? 'bg-sun shadow-[0_6px_0_#3B2A20]' : 'bg-cream shadow-[0_4px_0_#3B2A20]',
    ].join(' ')}
  >
    {children}
  </button>
);
