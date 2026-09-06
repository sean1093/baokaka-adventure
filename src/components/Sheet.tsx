import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/**
 * A bottom sheet for confirmations and summaries. Portalled to <body> so no ancestor transform
 * can trap it; tapping the dimmed backdrop closes it.
 */
export const Sheet = ({ open, onClose, title, children }: Props) => {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button type="button" aria-label="關閉" onClick={onClose} className="fade-in absolute inset-0 bg-ink/35 backdrop-blur-[2px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="sheet-in relative w-full max-w-md rounded-t-4xl bg-surface px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-3 shadow-float"
      >
        <span aria-hidden="true" className="mx-auto mb-4 block h-1.5 w-12 rounded-full bg-ink/15" />
        {title && <h2 className="mb-3 text-center text-headline font-extrabold">{title}</h2>}
        {children}
      </div>
    </div>,
    document.body,
  );
};
