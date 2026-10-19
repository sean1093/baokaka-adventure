import type { CSSProperties, ReactNode } from 'react';
import { POPUP as C, withAlpha } from '../../../art/palette';
import { useFramesReady } from '../../sprites';
import { screenImage } from '../../env/loader';

/**
 * Paper UI pieces the screens share (#97; popup art bible § 7: "every UI element is a physical
 * object belonging to the book"). Text sits on paper or on the navy cover, never on art.
 *
 * - `PaperButton`: a die-cut card button. `marigold` is the screen's one big touchable (the cover's
 *   「繼續」), a marigold card with a red seal (bible § 4: paper you can play with is golden and
 *   stamped); `cream` is a quiet cream card. Both carry an icon and ≥ 20 px text at ≥ 7:1, are ≥ 48 px
 *   tall, and press down 2 px (`kit-press`, the kit's press, reduced-motion safe).
 * - `Quilt`: 阿嬤's 花布 behind a screen (a baked bitmap, drawn `cover`).
 * - `useScreenReady`: true once a screen's bitmaps are decoded (screenshots wait for
 *   `data-screen-ready`).
 */

export const cardShadow = (lift = 1): string =>
  [
    `inset 1px 1px 0 ${withAlpha(C.cutRim, 0.55)}`,
    `inset -1px -1px 0 ${withAlpha(C.shadow, 0.18)}`,
    `${f(1 * lift)}px ${f(2 * lift)}px 0 ${withAlpha(C.shadow, 0.45)}`,
    `${f(3 * lift)}px ${f(7 * lift)}px ${f(12 * lift)}px ${withAlpha(C.shadow, 0.4)}`,
  ].join(',');

const f = (n: number) => Math.round(n * 10) / 10;

export const CREAM_CARD: CSSProperties = {
  backgroundColor: C.page,
  backgroundImage: `linear-gradient(170deg, ${C.foldLitHigh} 0%, ${C.page} 55%, ${C.pageDark} 100%)`,
  color: C.ink,
  boxShadow: cardShadow(),
};

export const MARIGOLD_CARD: CSSProperties = {
  backgroundColor: C.marigold,
  backgroundImage: `linear-gradient(175deg, ${C.marigoldLight} 0%, ${C.marigold} 48%, ${C.marigoldDeep} 100%)`,
  color: C.ink,
  boxShadow: [`inset 0 0 0 1.5px ${withAlpha(C.marigoldEdge, 0.55)}`, `inset 0 0 0 3.5px ${withAlpha(C.marigoldShine, 0.45)}`, cardShadow(1.3)].join(','),
};

export interface PaperButtonProps {
  readonly tone?: 'marigold' | 'cream';
  readonly icon: ReactNode;
  readonly children: ReactNode;
  readonly onClick?: () => void;
  readonly label?: string;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly testId?: string;
}

export function PaperButton({ tone = 'cream', icon, children, onClick, label, className = '', style, testId }: PaperButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      data-button={testId}
      className={`kit-press relative flex min-h-[56px] items-center gap-3 rounded-[12px] px-4 text-left ${className}`}
      style={{ ...(tone === 'marigold' ? MARIGOLD_CARD : CREAM_CARD), WebkitTapHighlightColor: 'transparent', ...style }}
    >
      <span aria-hidden="true" className="flex shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}

/** The red seal (印章) as an icon: a stamped square with a white glyph or a mark inside. */
export function SealIcon({ size = 40, children }: { size?: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="-20 -20 40 40" aria-hidden="true">
      <rect x={-18} y={-18} width={36} height={36} rx={7} fill={C.seal} />
      <rect x={-15} y={-15} width={30} height={30} rx={5} fill="none" stroke={C.sealHairline} strokeWidth={1} opacity={0.75} />
      {children}
    </svg>
  );
}

/** 阿嬤's 花布 quilt behind a screen, filling it (the bitmap is 430 × 932, drawn `cover`). */
export function Quilt({ className = '' }: { className?: string }) {
  const img = screenImage('quilt');
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 ${className}`}
      style={{
        backgroundColor: C.quilt,
        backgroundImage: img ? `url(${img.url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: '50% 30%',
      }}
    />
  );
}

/** True once these screen bitmaps and sprite frames are decoded (or failed: the screen goes on). */
export function useScreenReady(screens: readonly string[], frames: readonly string[] = []): boolean {
  const urls = [...screens.map((k) => screenImage(k)?.url).filter((u): u is string => u !== undefined), ...frames];
  return useFramesReady(urls);
}
