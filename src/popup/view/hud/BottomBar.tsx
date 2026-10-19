import { useMemo, type ReactNode } from 'react';
import { POPUP as C, withAlpha } from '../../../art/palette';
import { useSvgIds } from '../../../art/useSvgIds';
import { kitCtx, kitDefs, ref, type KitCtx } from '../../art';
import { UI } from '../../content';
import { deviceScale, frameUrl, spriteDef } from '../../sprites';
import { BAR_H } from '../geometry';
import '../words/words.css';

/**
 * The bottom bar on the cover (GDD § 2.1; popup art bible § 7; #97): [寶咖咖's portrait → the word
 * ring] [提示] [重來] [選單], then the page's three stickers 解開 · 淘氣 · 土地公.
 *
 * - Each control is a cream card disc ≥ 56 px with an icon and a 20 px label under it, inside a
 *   ≥ 48 × 48 button (R4–R6). The portrait is the bar's only marigold ring, with a dashed marigold
 *   halo: it is a touchable (bible § 4).
 * - The stickers are blind-embossed navy dimples with a dashed gold ring when empty and foil discs
 *   with their icon when earned (✓, 嘿, a 土地公 hat); their names are their accessible names.
 * - During the first-use tutorial (#99) the portrait glows (`glow`: a breathing marigold halo).
 * - When a hint finds no way on from here (#100: the fallback's 重來 + step 1), 重來 glows the same way
 *   (`retryGlow`).
 * - **左手模式** (§ 2.11) mirrors the bar: the portrait on the right, the stickers on the left.
 *
 * Laid out in a 390 × 120 box, scaled like the HUD on narrow phones.
 */

export interface BottomBarProps {
  /** Earned on this page: 解開, 淘氣, 土地公 */
  readonly stickers?: readonly [boolean, boolean, boolean];
  readonly leftHand?: boolean;
  readonly scale?: number;
  /** The portrait glows (the first-use tutorial, #99) */
  readonly glow?: boolean;
  /** 重來 glows: the hint's way on starts over (#100) */
  readonly retryGlow?: boolean;
  /** Reduced motion: the glow holds still */
  readonly reduced?: boolean;
  readonly onPortrait?: () => void;
  readonly onHint?: () => void;
  readonly onRetry?: () => void;
  readonly onMenu?: () => void;
}

const NONE: readonly [boolean, boolean, boolean] = [false, false, false];

/** The bar's icons, drawn in a disc's local space (centre 0, 0). */
const ICONS = {
  hint: `<path d="M0 -14a10.5 10.5 0 0 1 6.5 18.5V7h-13V4.5A10.5 10.5 0 0 1 0 -14z" fill="${C.bulb}" stroke="${C.bulbInk}" stroke-width="1.6"/><path d="M-5.5 11h11M-3.5 15h7" stroke="${C.bulbInk}" stroke-width="2" stroke-linecap="round"/>`,
  retry: `<path d="M9 -8A12 12 0 1 0 12 3M3 -13L11 -9L8 -1" fill="none" stroke="${C.ink}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  menu: `<path d="M-10 -7H10M-10 0H10M-10 7H10" stroke="${C.ink}" stroke-width="3.2" stroke-linecap="round"/>`,
} as const;

/** A cream card disc (r 28) with its stacked shadow, a ring and an icon. */
function discSvg(ctx: KitCtx, icon: string, ring: string, r = 28): string {
  return `<circle cx="1.5" cy="3" r="${r}" fill="${C.shadow}" opacity=".45"/><circle cx="-1" cy="-1" r="${r}" fill="${C.cutRim}" opacity=".42"/>`
    + `<circle r="${r}" fill="${C.page}"/><circle r="${r}" fill="url(#${ctx.id('discShade')})"/>`
    + `<circle r="${r - 2.5}" fill="none" stroke="${ring}" stroke-width="2.2"/>${icon}`;
}

function BarButton({ label, onClick, children, testId }: { label: string; onClick?: () => void; children: ReactNode; testId: string }) {
  return (
    <button
      type="button"
      className="kit-press flex w-[62px] flex-col items-center gap-[2px] pt-[4px]"
      style={{ minHeight: 96, WebkitTapHighlightColor: 'transparent' }}
      aria-label={label}
      data-bar={testId}
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {children}
      <span className="font-body text-[20px] font-black leading-[24px] tracking-[0.08em]" style={{ color: C.barLabel }}>
        {label}
      </span>
    </button>
  );
}

export function BottomBar({ stickers = NONE, leftHand = false, scale = 1, glow = false, retryGlow = false, reduced = false, onPortrait, onHint, onRetry, onMenu }: BottomBarProps) {
  const ids = useSvgIds('bar');
  const ctx: KitCtx = useMemo(() => ({ ...kitCtx('bar'), id: ids }), [ids]);
  const head = useMemo(() => {
    const def = spriteDef('baokaka-head-happy');
    return { url: frameUrl(def.files[0], deviceScale()), w: def.size[0], h: def.size[1] };
  }, []);
  const defs = useMemo(
    () => kitDefs(ctx, ['foil', 'softMarigold'], `<radialGradient id="${ctx.id('discShade')}" cx=".35" cy=".3" r=".8"><stop offset=".6" stop-color="${C.pageDark}" stop-opacity="0"/><stop offset="1" stop-color="${C.pageDark}" stop-opacity=".9"/></radialGradient>`),
    [ctx],
  );
  const disc = (icon: string, ring = ref(ctx, 'foil'), glowing = false) => (
    <svg width={64} height={64} viewBox="-32 -32 64 64" aria-hidden="true" className="overflow-visible" data-glow={glowing ? '' : undefined}>
      {glowing && <circle r={46} fill={`url(#${ctx.id('softMarigold')})`} className={reduced ? undefined : 'wr-portrait-glow'} />}
      <g dangerouslySetInnerHTML={{ __html: discSvg(ctx, icon, ring) }} />
    </svg>
  );
  const clip = ctx.id('portrait');
  const portrait = (
    <svg width={64} height={64} viewBox="-32 -32 64 64" aria-hidden="true" className="overflow-visible" data-glow={glow ? '' : undefined}>
      {glow && <circle r={46} fill={`url(#${ctx.id('softMarigold')})`} className={reduced ? undefined : 'wr-portrait-glow'} />}
      <circle r={34} fill={`url(#${ctx.id('softMarigold')})`} opacity={0.35} />
      <g dangerouslySetInnerHTML={{ __html: discSvg(ctx, '', C.marigold, 29) }} />
      <clipPath id={clip}>
        <circle r={25} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <circle r={25} fill={C.lampHot} />
        {head.url && <image href={head.url} x={-head.w * 0.3} y={-21} width={head.w * 0.6} height={head.h * 0.6} />}
      </g>
      <circle r={33.5} fill="none" stroke={C.marigold} strokeWidth={2} strokeDasharray="3 4" />
    </svg>
  );
  const earned = (i: number) => stickers[i] === true;
  const sticker = (i: number, label: string, icon: string) => (
    <g transform={`translate(${i * 34 + 17} 0)`} data-sticker={label} data-earned={earned(i) ? '' : undefined}>
      <circle r={14} fill={C.sticker} />
      <circle r={14} cy={1.2} fill="none" stroke={C.stickerRim} strokeWidth={1.2} />
      <circle r={14} cy={-1} fill="none" stroke={C.stickerDeep} strokeWidth={1.2} opacity={0.7} />
      {earned(i) ? (
        <>
          <circle r={12.5} fill={ref(ctx, 'foil')} />
          <g dangerouslySetInnerHTML={{ __html: icon }} />
        </>
      ) : (
        <circle r={10} fill="none" stroke={C.gold} strokeWidth={1.2} strokeDasharray="2.5 3" opacity={0.75} />
      )}
    </g>
  );
  const names = [UI.stickers.solved, UI.stickers.mischief, UI.stickers.tudigong];
  const got = names.filter((_, i) => earned(i));
  const buttons = [
    <BarButton key="talk" label={UI.bar.talk} onClick={onPortrait} testId="talk">
      {portrait}
    </BarButton>,
    <BarButton key="hint" label={UI.bar.hint} onClick={onHint} testId="hint">
      {disc(ICONS.hint)}
    </BarButton>,
    <BarButton key="retry" label={UI.bar.retry} onClick={onRetry} testId="retry">
      {disc(ICONS.retry, ref(ctx, 'foil'), retryGlow)}
    </BarButton>,
    <BarButton key="menu" label={UI.bar.menu} onClick={onMenu} testId="menu">
      {disc(ICONS.menu)}
    </BarButton>,
  ];
  const tray = (
    <svg
      key="stickers"
      width={104}
      height={44}
      viewBox="-1 -22 104 44"
      role="img"
      aria-label={`${UI.stickers.solved}・${UI.stickers.mischief}・${UI.stickers.tudigong}：${got.length > 0 ? got.join('、') : '0'}`}
      className="mb-[22px] shrink-0 overflow-visible"
      data-stickers={stickers.map((s) => (s ? 1 : 0)).join('')}
    >
      <rect x={-1} y={-21} width={104} height={42} rx={21} fill={withAlpha(C.stickerDeep, 0.55)} />
      {sticker(0, UI.stickers.solved, `<path d="M-6 0l4 4l8 -9" fill="none" stroke="${C.foilInk}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`)}
      {sticker(1, UI.stickers.mischief, `<text data-art-text="" y="5" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="13" fill="${C.foilInk}">嘿</text>`)}
      {sticker(2, UI.stickers.tudigong, `<path d="M-7 0a7 7 0 0 1 14 0z" fill="${C.hatRed}"/><path d="M-5 1q5 9 10 0z" fill="${C.standeeCard}"/>`)}
    </svg>
  );
  return (
    <div
      className="absolute bottom-0 left-1/2 select-none"
      style={{ width: 390, height: BAR_H, transform: `translateX(-50%) scale(${scale})`, transformOrigin: '50% 100%' }}
      data-slot="bottom-bar"
      data-left-hand={leftHand ? '' : undefined}
    >
      <svg width={0} height={0} className="absolute" aria-hidden="true">
        <g dangerouslySetInnerHTML={{ __html: defs }} />
      </svg>
      <nav className="flex h-full items-end justify-between px-[16px] pb-[14px]" style={{ flexDirection: leftHand ? 'row-reverse' : 'row' }} aria-label={UI.bar.menu}>
        <div className="flex items-end" style={{ flexDirection: leftHand ? 'row-reverse' : 'row' }}>
          {buttons}
        </div>
        {tray}
      </nav>
    </div>
  );
}
