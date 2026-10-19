import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { POPUP as C, withAlpha } from '../../../art/palette';
import { useSvgIds } from '../../../art/useSvgIds';
import { kitCtx, kitDefs, ref, type KitCtx } from '../../art';
import { UI } from '../../content';
import { deviceScale, frameUrl, spriteDef } from '../../sprites';
import { BAR_H } from '../geometry';
import { STICKER_ICON, STICKER_KINDS, STICKER_NAME } from './stickerArt';
import type { Sticker } from '../../game/progress';
import '../words/words.css';
import './stickers.css';

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
 * - **A sticker earned mid-page** (#101, GDD § 2.8) slaps onto its dimple with a squash, and a kraft
 *   tag pops up over the tray: 「嘿嘿，淘氣！」 or 「找到土地公！」 (`pop`, keyed by its serial).
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
  /** The pop over the tray: the sticker just earned, and a serial that replays it (#101) */
  readonly pop?: { readonly sticker: Sticker; readonly serial: number } | null;
}

const NONE: readonly [boolean, boolean, boolean] = [false, false, false];

/** How long the sticker pop stays over the tray (its CSS animation fades it out by then). */
export const STICKER_POP_MS = 2000;

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

export function BottomBar({ stickers = NONE, leftHand = false, scale = 1, glow = false, retryGlow = false, reduced = false, onPortrait, onHint, onRetry, onMenu, pop = null }: BottomBarProps) {
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
  // A sticker earned while the bar is up slaps on (not the ones the page opened with)
  const seen = useRef(stickers);
  const [slapped, setSlapped] = useState<readonly boolean[]>(NONE);
  useEffect(() => {
    const was = seen.current;
    seen.current = stickers;
    if (stickers.some((s, i) => s && !was[i])) setSlapped(stickers.map((s, i) => s && !was[i]));
  }, [stickers]);
  const sticker = (i: number, label: string, icon: string) => (
    <g key={label} transform={`translate(${i * 34 + 17} 0)`} data-sticker={label} data-earned={earned(i) ? '' : undefined}>
      <circle r={14} fill={C.sticker} />
      <circle r={14} cy={1.2} fill="none" stroke={C.stickerRim} strokeWidth={1.2} />
      <circle r={14} cy={-1} fill="none" stroke={C.stickerDeep} strokeWidth={1.2} opacity={0.7} />
      {earned(i) ? (
        <g className={slapped[i] ? (reduced ? 'stk-fade' : 'stk-slap') : undefined}>
          <circle r={12.5} fill={ref(ctx, 'foil')} />
          <g dangerouslySetInnerHTML={{ __html: icon }} />
        </g>
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
      {STICKER_KINDS.map((kind, i) => sticker(i, STICKER_NAME[kind], STICKER_ICON[kind]))}
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
      {pop && <StickerPop key={pop.serial} sticker={pop.sticker} leftHand={leftHand} reduced={reduced} />}
    </div>
  );
}

/**
 * The pop over the tray when 淘氣 or 土地公 is earned (GDD § 2.8, § 5.3; #101): a kraft tag taped
 * above the stickers, a foil disc with the sticker's icon and the line on a cream label, popping up
 * with a little overshoot and fading after ≈ 2 s (a fade only, with reduced motion). A still shows it.
 */
function StickerPop({ sticker, leftHand, reduced }: { sticker: Sticker; leftHand: boolean; reduced: boolean }) {
  const text = UI.stickerPop[sticker];
  return (
    <div
      className={`pointer-events-none absolute flex items-center gap-[8px] rounded-[6px] py-[6px] pl-[6px] pr-[6px] ${reduced ? 'stk-pop-fade' : 'stk-pop'}`}
      style={{
        bottom: 106,
        [leftHand ? 'left' : 'right']: 12,
        background: `repeating-linear-gradient(35deg, ${withAlpha(C.kraftFiber, 0.1)} 0 2px, transparent 2px 7px), ${C.kraft}`,
        boxShadow: `0 3px 0 ${withAlpha(C.shadow, 0.35)}, 0 8px 18px ${withAlpha(C.shadow, 0.45)}`,
        transformOrigin: leftHand ? '20% 100%' : '80% 100%',
      }}
      role="status"
      data-sticker-pop={sticker}
    >
      <svg width={34} height={34} viewBox="-17 -17 34 34" aria-hidden="true" className="shrink-0 overflow-visible">
        <circle r={15.5} cy={1.5} fill={C.kraftDark} />
        <circle r={14} fill={C.goldLight} stroke={C.goldDeep} strokeWidth={1.2} />
        <g transform="scale(1.05)" dangerouslySetInnerHTML={{ __html: STICKER_ICON[sticker] }} />
      </svg>
      <span className="whitespace-nowrap rounded-[3px] px-[8px] py-[2px] font-body text-[20px] font-black leading-[26px] tracking-[0.04em]" style={{ background: C.page, color: C.ink }}>
        {text}
      </span>
      <span className="absolute -top-[7px] left-1/2 h-[14px] w-[46px] -translate-x-1/2 rotate-[-3deg]" style={{ background: withAlpha(C.washiCeladon, 0.85) }} aria-hidden="true" />
    </div>
  );
}
