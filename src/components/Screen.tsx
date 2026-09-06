import type { ReactNode } from 'react';
import { ChevronLeft, VolumeOff, VolumeOn } from './icons';
import { IconButton } from './Button';

type ScreenProps = {
  children: ReactNode;
  /** Vertically centre the content (title and result pages) */
  center?: boolean;
  /** Lock to the viewport height instead of scrolling (the battle and the hidden-object scene) */
  fixed?: boolean;
  className?: string;
};

/** The page frame: phone-width column, safe-area padding, and the slide-up entrance. */
export const Screen = ({ children, center, fixed, className = '' }: ScreenProps) => (
  <main
    className={[
      'screen-in mx-auto flex w-full max-w-md flex-col gap-4 px-4',
      'pb-[max(env(safe-area-inset-bottom),20px)] pt-[max(env(safe-area-inset-top),12px)]',
      fixed ? 'h-dvh' : 'min-h-dvh',
      center ? 'justify-center' : '',
      className,
    ].join(' ')}
  >
    {children}
  </main>
);

type AppBarProps = {
  title: string;
  kicker?: string;
  onBack?: () => void;
  backLabel?: string;
  right?: ReactNode;
};

/** The top bar: a back circle, a two-line title block, and whatever belongs on the right. */
export const AppBar = ({ title, kicker, onBack, backLabel = '返回', right }: AppBarProps) => (
  <header className="flex items-center gap-3">
    {onBack && <IconButton icon={<ChevronLeft />} label={backLabel} onClick={onBack} />}
    <div className="min-w-0 flex-1">
      {kicker && <p className="truncate text-caption font-bold text-muted">{kicker}</p>}
      <h1 className="truncate text-heading font-extrabold leading-tight">{title}</h1>
    </div>
    {right}
  </header>
);

/** The sound switch used on every screen that makes noise. Text-free, so it needs a label. */
export const SoundToggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <IconButton icon={on ? <VolumeOn /> : <VolumeOff />} label={on ? '關閉聲音' : '打開聲音'} onClick={onToggle} active={!on} />
);

type CardProps = { children: ReactNode; className?: string; tone?: 'surface' | 'tonal' | 'accent' };

/** A raised surface. `tonal` sits on the background without a shadow; `accent` is the warm one. */
export const Card = ({ children, className = '', tone = 'surface' }: CardProps) => (
  <section
    className={[
      'rounded-3xl',
      tone === 'surface' ? 'bg-surface shadow-card' : tone === 'tonal' ? 'bg-ink/[0.05]' : 'bg-gradient-to-br from-sun/40 via-cream to-sky/30 shadow-card',
      className,
    ].join(' ')}
  >
    {children}
  </section>
);

/** A small rounded label: status, counts, tags. */
export const Chip = ({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: 'neutral' | 'leaf' | 'sun' | 'berry' | 'sky' | 'ink'; className?: string }) => (
  <span
    className={[
      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-caption font-bold',
      tone === 'leaf'
        ? 'bg-leaf/15 text-leafDeep'
        : tone === 'sun'
          ? 'bg-sun/25 text-mochaDeep'
          : tone === 'berry'
            ? 'bg-berry/15 text-berryDeep'
            : tone === 'sky'
              ? 'bg-sky/25 text-skyDeep'
              : tone === 'ink'
                ? 'bg-ink text-cream'
                : 'bg-ink/[0.07] text-ink/80',
      className,
    ].join(' ')}
  >
    {children}
  </span>
);
