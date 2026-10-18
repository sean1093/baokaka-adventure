import type { ReactNode } from 'react';
import { ChevronLeft, VolumeOff, VolumeOn } from './icons';
import { IconButton } from './Button';

type ScreenProps = {
  children: ReactNode;
  /** Vertically centre the content (title and result pages) */
  center?: boolean;
  className?: string;
};

/** The page frame: phone-width column, safe-area padding, and the fade-up entrance. */
export const Screen = ({ children, center, className = '' }: ScreenProps) => (
  <main
    className={[
      'kit-box-in mx-auto flex w-full max-w-md flex-col gap-4 px-4',
      'pb-[max(env(safe-area-inset-bottom),20px)] pt-[max(env(safe-area-inset-top),14px)]',
      'min-h-dvh',
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

/** The top bar: a round back button, a gold kicker over a serif title, and whatever belongs on the right. */
export const AppBar = ({ title, kicker, onBack, backLabel = '返回', right }: AppBarProps) => (
  <header className="flex items-center gap-3">
    {onBack && <IconButton icon={<ChevronLeft size={22} />} label={backLabel} onClick={onBack} />}
    <div className="min-w-0 flex-1">
      {kicker && <p className="truncate text-caption tracking-[0.3em] text-gold">{kicker}</p>}
      <h1 className="truncate font-serif text-heading tracking-[0.1em] text-inkOnDark">{title}</h1>
    </div>
    {right}
  </header>
);

/** The sound switch used on every screen that makes noise. Text-free, so it needs a label. */
export const SoundToggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <IconButton icon={on ? <VolumeOn size={22} /> : <VolumeOff size={22} />} label={on ? '關閉聲音' : '打開聲音'} onClick={onToggle} active={!on} />
);
