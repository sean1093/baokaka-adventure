import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  onClick: () => void;
  /** quiet 用在次要動作，例如音效開關 */
  tone?: 'primary' | 'quiet';
  disabled?: boolean;
  label?: string;
};

/**
 * 全遊戲唯一的按鈕。觸控目標下限 64px、字級 24px 都鎖在這裡，
 * 各畫面不自行決定尺寸（spec §8）。
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
