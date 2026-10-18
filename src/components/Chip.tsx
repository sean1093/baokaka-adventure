import type { ReactNode } from 'react';

/**
 * Glass chips (art direction § 7.2): round-cornered navy glass with a gold hairline, serif text,
 * Fredoka numbers in gold. For the location and time on the map, the coin purse, tags.
 */
export const GlassChip = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <span className={`kit-glass inline-flex items-center gap-1.5 rounded px-3 py-1 font-serif text-label tracking-[0.06em] ${className}`}>{children}</span>
);

/** A number inside a chip or a label: Fredoka, gold. */
export const Num = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <span className={`font-num font-semibold tabular-nums tracking-normal text-gold-light ${className}`}>{children}</span>
);

/** A small inline tag (專用, 新, 已滿): gold hairline on navy, or solid gold. */
export const Tag = ({ children, tone = 'line', className = '' }: { children: ReactNode; tone?: 'line' | 'gold'; className?: string }) => (
  <span
    className={`inline-flex shrink-0 items-center rounded-sm px-1.5 py-px text-[12px] font-bold leading-snug tracking-[0.06em] ${
      tone === 'gold' ? 'bg-gradient-to-b from-gold-diamond to-gold text-primary-text' : 'border border-gold/60 text-gold-light'
    } ${className}`}
  >
    {children}
  </span>
);
