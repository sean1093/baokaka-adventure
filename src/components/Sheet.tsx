import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** A small gold line above the title */
  kicker?: string;
  children: ReactNode;
};

/**
 * The bottom sheet (art direction § 7.8): a navy panel rising from the bottom edge with a gold top
 * rule and corner diamonds, over a dark scrim (no live blur: § 7.5 *Background*). Portalled to
 * <body> so no ancestor transform can trap it; tapping the scrim closes it.
 */
export const Sheet = ({ open, onClose, title, kicker, children }: Props) => {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button type="button" aria-label="關閉" onClick={onClose} className="kit-fade-in absolute inset-0 bg-scrim/70" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="kit-panel kit-sheet-in relative w-full max-w-md rounded-b-none border-x-0 border-b-0 px-4 pb-[max(env(safe-area-inset-bottom),18px)] pt-5"
      >
        <span aria-hidden="true" className="kit-diamond left-1/2 top-[-7px] h-3 w-3" style={{ transform: 'translateX(-50%) rotate(45deg)' }} />
        {(title || kicker) && (
          <header className="mb-3 text-center">
            {kicker && <p className="text-caption tracking-[0.3em] text-gold">{kicker}</p>}
            {title && <h2 className="font-serif text-heading tracking-[0.14em] text-inkOnDark">{title}</h2>}
            <div className="kit-rule mx-auto mt-2 w-40" />
          </header>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
};

type RowProps = {
  children: ReactNode;
  /** The gold selection border and glow */
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  label?: string;
};

/**
 * A list row (§ 7.8): at least 64px, a quiet inset surface, gold border plus glow when selected.
 * With `onClick` it is a button; otherwise a plain container (its own buttons inside).
 */
export const ListRow = ({ children, selected = false, onClick, disabled, className = '', label }: RowProps) => {
  const classes = `kit-inset ${selected ? 'kit-inset--on' : ''} flex min-h-[64px] w-full items-center gap-3 px-3 py-2 text-left ${className}`;
  if (!onClick) return <div className={classes}>{children}</div>;
  return (
    <button type="button" aria-pressed={selected} aria-label={label} disabled={disabled} onClick={onClick} className={`${classes} kit-press disabled:opacity-40`}>
      {children}
    </button>
  );
};
