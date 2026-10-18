import type { ReactNode } from 'react';
import { Bar, HP_NUMBER, StatBars, hpState } from './Bars';

/**
 * The battle's bottom panel (art direction § 7.4): the party strip, the prompt row (with 逃跑 or
 * 取消 as a text link on the right) and the 2×2 command grid. Dumb: the battle screen fills the
 * slots. The stage above it is #14.
 */

type Link = { label: string; onClick: () => void; disabled?: boolean };

type PanelProps = {
  /** The party cards (2×2) */
  party: ReactNode;
  /** 「寶咖咖要做什麼？」, 「要打哪一個？」, 「〈foe〉的回合」… */
  prompt: string;
  /** The text link on the prompt row: 逃跑 › at the root, 取消 while picking */
  link?: Link | null;
  /** The command grid, or the 才藝 / 道具 list that replaces it */
  children: ReactNode;
  /**
   * Tighter spacing, so the battle's 2×2 party strip, the prompt row and the commands fit the
   * § 7.4 panel height (346px at 390×844) while the commands stay 70px.
   */
  tight?: boolean;
};

export const CommandPanel = ({ party, prompt, link, children, tight = false }: PanelProps) => (
  <section
    aria-label="指令"
    data-command-panel=""
    className={`relative border-t border-gold bg-gradient-to-b from-panel-top to-panel-bottom text-inkOnDark shadow-[0_-10px_30px_rgb(0_0_0/0.6)] ${
      tight ? 'px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-3' : 'px-3.5 pb-[max(env(safe-area-inset-bottom),14px)] pt-4'
    }`}
  >
    {/* The fading gold hairline under the edge, and the diamond on it */}
    <span aria-hidden="true" className="kit-rule absolute inset-x-2.5 top-[5px] block" />
    <span aria-hidden="true" className="kit-diamond left-1/2 top-[-7px] h-3 w-3 -translate-x-1/2" style={{ transform: 'translateX(-50%) rotate(45deg)' }} />
    {party}
    <div className={`flex min-h-[44px] items-center justify-between gap-2 px-1 ${tight ? 'my-1' : 'mb-2.5 mt-3'}`}>
      <p className="truncate font-serif text-[18px] font-black tracking-[0.06em]" aria-live="polite">
        {prompt}
      </p>
      {link && (
        <button
          type="button"
          onClick={link.onClick}
          disabled={link.disabled}
          className="kit-btn kit-btn--text kit-press -mr-2 min-h-[44px] shrink-0 px-2 text-[15px] disabled:opacity-40"
        >
          {link.label} ›
        </button>
      )}
    </div>
    {children}
  </section>
);

/** The 2×2 command grid. */
export const CommandGrid = ({ children }: { children: ReactNode }) => <div className="grid grid-cols-2 gap-2.5">{children}</div>;

type CardProps = {
  name: string;
  /** The head inside the gold ring */
  portrait: ReactNode;
  hp: number;
  hpMax: number;
  mp: number;
  mpMax: number;
  /** Whose turn it is: gold border and glow */
  active?: boolean;
  /** Tappable as a target (an item, a heal) */
  onPick?: () => void;
  /**
   * `wide`: a 48px head beside the name and bars, with 「體力」「元氣」 spelled out (one or two
   * heroes per row). `narrow`: name over bars and bare numbers (three or four in a row); `head`
   * keeps a small head beside the name when there is room (three in a row).
   */
  layout?: 'wide' | 'narrow' | 'strip';
  head?: boolean;
  /** `strip` only: the head's size (48 by § 7.4; smaller on short phones, which also drop the number row) */
  headSize?: number;
};

/** The 48px gold-ringed head portrait (§ 7.4 party strip). */
export const HeadRing = ({ children, size = 48, dim = false }: { children: ReactNode; size?: number; dim?: boolean }) => (
  <span
    aria-hidden="true"
    className={`relative block shrink-0 overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_35%,theme(colors.command.top),theme(colors.panel.deep))] shadow-[0_0_0_1.5px_theme(colors.gold.DEFAULT),0_0_0_3px_theme(colors.panel.deep),0_0_0_4px_theme(colors.gold.DEFAULT/40%)] ${dim ? 'opacity-40 grayscale' : ''}`}
    style={{ width: size, height: size }}
  >
    {children}
  </span>
);

/** One party card: head, serif name, HP and MP bars with their numbers. */
export const PartyCard = ({ name, portrait, hp, hpMax, mp, mpMax, active = false, onPick, layout = 'wide', head = true, headSize = 48 }: CardProps) => {
  const short = headSize < 44;
  const content =
    layout === 'strip' ? (
      // The battle's 2×2 party strip (§ 7.4): gold-ringed head, serif name, two bars, the numbers
      <>
        <HeadRing size={headSize} dim={hp === 0}>
          {portrait}
        </HeadRing>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-1">
            <span className="truncate font-serif text-[15px] font-black leading-[18px] tracking-[0.05em]">{name}</span>
            {short && (
              <span className={`shrink-0 font-num text-[12px] font-semibold tabular-nums leading-none ${HP_NUMBER[hpState(hp, hpMax)]}`}>
                {hp}/{hpMax}
              </span>
            )}
          </span>
          {short ? (
            <span className="mt-1 block">
              <Bar value={hp} max={hpMax} kind="hp" />
              <Bar value={mp} max={mpMax} kind="mp" className="mt-[3px]" />
            </span>
          ) : (
            <StatBars hp={hp} hpMax={hpMax} mp={mp} mpMax={mpMax} className="mt-0.5 [&>span:last-child]:mt-[3px]" />
          )}
        </span>
      </>
    ) : layout === 'wide' ? (
      <>
        <HeadRing dim={hp === 0}>{portrait}</HeadRing>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-serif text-[16px] font-black leading-tight tracking-[0.06em]">{name}</span>
          <StatBars hp={hp} hpMax={hpMax} mp={mp} mpMax={mpMax} className="mt-1" />
        </span>
      </>
    ) : (
      <span className="block min-w-0 flex-1">
        <span className="mb-1.5 flex items-center gap-1.5">
          {head && (
            <HeadRing size={28} dim={hp === 0}>
              {portrait}
            </HeadRing>
          )}
          <span className="min-w-0 truncate font-serif text-[15px] font-black leading-tight tracking-[0.04em]">{name}</span>
        </span>
        <StatBars hp={hp} hpMax={hpMax} mp={mp} mpMax={mpMax} words={false} />
      </span>
    );
  const box = layout === 'strip' ? 'gap-1.5 px-1.5 py-[3px]' : layout === 'wide' ? 'min-h-[64px] gap-2.5 px-2.5 py-2' : 'min-h-[64px] gap-2.5 px-2 py-2';
  const classes = `kit-inset ${active ? 'kit-inset--on' : ''} flex min-w-0 items-center text-left ${box}`;
  if (onPick)
    return (
      <button type="button" onClick={onPick} aria-label={`給${name}`} className={`${classes} kit-press min-h-[44px] shadow-[0_0_0_2px_theme(colors.gold.light/70%)]`}>
        {content}
      </button>
    );
  return (
    <div className={classes} data-active={active ? '' : undefined}>
      {content}
    </div>
  );
};
