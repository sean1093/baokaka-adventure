import type { HTMLAttributes, ReactNode } from 'react';

/** The four gold corner diamonds of a major panel (art direction § 7.2). */
export const Diamonds = ({ only }: { only?: readonly ('tl' | 'tr' | 'bl' | 'br')[] }) => (
  <>
    {(only ?? (['tl', 'tr', 'bl', 'br'] as const)).map((corner) => (
      <span key={corner} aria-hidden="true" className={`kit-diamond kit-diamond--${corner}`} />
    ))}
  </>
);

type PanelProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  /** Gold diamond ornaments on the corners: for major panels (dialogue, result cards, sheets) */
  diamonds?: boolean;
  as?: 'section' | 'div' | 'header' | 'aside';
};

/**
 * The panel (§ 7.2): a navy glass gradient, a 1px gold border, an inner gold hairline inset 4px,
 * radius 6. Every piece of text over art sits on one of these or on a glass chip (§ 3.3).
 */
export const Panel = ({ children, diamonds = false, as: Tag = 'section', className = '', ...rest }: PanelProps) => (
  <Tag className={`kit-panel ${className}`} {...rest}>
    {diamonds && <Diamonds />}
    {children}
  </Tag>
);

/** A quieter surface inside a panel (list rows, party cards); `on` is the gold selection. */
export const Inset = ({ children, on = false, className = '', ...rest }: HTMLAttributes<HTMLDivElement> & { on?: boolean }) => (
  <div className={`kit-inset ${on ? 'kit-inset--on' : ''} ${className}`} {...rest}>
    {children}
  </div>
);

/** A small heading inside a panel: gold serif with wide tracking, then a fading gold rule. */
export const PanelTitle = ({ children, kicker, className = '' }: { children: ReactNode; kicker?: string; className?: string }) => (
  <div className={`text-center ${className}`}>
    {kicker && <p className="text-caption tracking-[0.3em] text-gold">{kicker}</p>}
    <h2 className="font-serif text-heading tracking-[0.12em] text-inkOnDark">{children}</h2>
    <div className="kit-rule mx-auto mt-2 w-40" />
  </div>
);
