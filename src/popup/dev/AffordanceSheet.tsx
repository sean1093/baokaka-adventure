import { useMemo, type ReactNode } from 'react';
import { POPUP } from '../../art/palette';
import { useSvgIds } from '../../art/useSvgIds';
import { useReducedMotion } from '../../components/motion';
import { PRESET_DEFS, checkKnot, kitCtx, kitDefs, pawBadge, pinholes, type KitCtx } from '../art';
import type { PartDef } from '../core/types';
import { GhostHand, HintHalo } from '../view/affordance/Hints';
import type { PartLook } from '../view/affordance/look';
import { useIdleWiggle } from '../view/affordance/useIdleWiggle';
import '../view/affordance/affordance.css';
import '../view/gestures.css';
import { ArtG } from '../view/parts/common';
import { TabView } from '../view/parts/TabView';
import { WheelView } from '../view/parts/WheelView';

/**
 * The `affordance-states` fixture (#140; popup art bible § 4.1, proof D row 5): one touchable in
 * every state, side by side, drawn by the real part views and hint components, so a reviewer (and
 * the visual check) sees the whole state language in one screen. Live, the idle cell wiggles and
 * the hint cells pulse and play the hand; as a still, everything rests.
 */

/** A two-stop tab on a short track, centred in a 210 × 92 cell. */
const TAB: PartDef = { id: 'tab', preset: 'tab', states: ['out', 'in'], initial: 'out', input: 'drag-linear', track: { from: [56, 50], to: [118, 50] }, hit: { x: 2, y: 14, w: 182, h: 72 }, art: 'sheet/tab' };
/** A four-step wheel, for the done knot (bible § 4.1 done: solved wheels on 101). */
const WHEEL: PartDef = { id: 'wheel', preset: 'wheel', states: ['n', 'e', 's', 'w'], initial: 'n', input: 'drag-rotary', center: [105, 50], radius: 28, hit: { cx: 105, cy: 50, r: 36 }, art: 'sheet/wheel' };
/** The tab card's box at its first stop (halo, badge). */
const CARD = { x: 8, y: 30, w: 96, h: 40 };
const VIEW = { x: -16, y: 0, w: 222, h: 108 };

function Cell({ label, en, children, hit, index }: { label: string; en: string; children: (ctx: KitCtx) => ReactNode; hit: PartDef['hit']; index: number }) {
  const ids = useSvgIds(`aff${index}`);
  const ctx: KitCtx = useMemo(() => ({ ...kitCtx('aff'), id: ids }), [ids]);
  const back = useMemo(
    () => kitDefs(ctx, PRESET_DEFS) + `<rect x="${VIEW.x}" y="${VIEW.y}" width="${VIEW.w}" height="${VIEW.h}" rx="6" fill="${POPUP.nightCardDeep}"/>` + pinholes(ctx, VIEW.x, VIEW.y, VIEW.w, VIEW.h, 14, 30 + index),
    [ctx, index],
  );
  const shape = 'r' in hit ? <circle cx={hit.cx} cy={hit.cy} r={hit.r} /> : <rect x={hit.x} y={hit.y} width={hit.w} height={hit.h} rx={8} />;
  return (
    <figure className="flex flex-col gap-1" data-affordance-state={en}>
      <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} className="block h-auto w-full" data-page="affordance-states" role="img" aria-label={`${label} ${en}`}>
        <ArtG html={back} />
        {children(ctx)}
        <g data-layer="hit" fill="transparent" pointerEvents="none">
          {'r' in hit ? <circle cx={hit.cx} cy={hit.cy} r={hit.r} data-hit={en} /> : <rect x={hit.x} y={hit.y} width={hit.w} height={hit.h} data-hit={en} />}
        </g>
        {en === 'hold-to-reveal' && (
          <g data-reveal="" fill="none" stroke={POPUP.chalk} strokeWidth={2} strokeDasharray="6 4" strokeLinecap="round">
            {shape}
          </g>
        )}
      </svg>
      <figcaption className="font-body text-[20px] leading-tight" style={{ color: POPUP.goldLight }}>
        {label} <span style={{ color: POPUP.stickerLabel }}>{en}</span>
      </figcaption>
    </figure>
  );
}

export function AffordanceSheet({ still, reduced: reducedProp }: { still: boolean; reduced?: boolean }) {
  const os = useReducedMotion();
  const reduced = reducedProp ?? os;
  const idle = useIdleWiggle({ id: 'affordance-states', parts: [TAB] }, { enabled: !still && !reduced });
  const tab = (ctx: KitCtx, look: PartLook = {}, preview?: number) => (
    <TabView part={TAB} ctx={ctx} from="out" to="out" ms={1e6} reduced={reduced} linked={false} preview={preview} look={look} />
  );
  const halo = (ctx: KitCtx) => <HintHalo ctx={ctx} shape={{ hit: CARD }} reduced={reduced} />;
  const cells: { label: string; en: string; hit?: PartDef['hit']; draw: (ctx: KitCtx) => ReactNode }[] = [
    { label: '待機', en: 'idle', draw: (ctx) => tab(ctx, { wiggle: reduced ? undefined : idle.wiggle.tab }) },
    { label: '提示一', en: 'hint L1', draw: (ctx) => <>{halo(ctx)}{tab(ctx)}</> },
    {
      label: '提示二',
      en: 'hint L2',
      draw: (ctx) => (
        <>
          {halo(ctx)}
          {tab(ctx)}
          <GhostHand gesture={{ kind: 'drag', from: [56, 50], to: [118, 50] }} reduced={reduced} />
        </>
      ),
    },
    { label: '拖曳', en: 'dragging', draw: (ctx) => tab(ctx, { lifted: true }, 0.55) },
    {
      label: '鎖住',
      en: 'locked',
      draw: (ctx) => (
        <g data-locked="" className={still || reduced ? undefined : 'gx-wobble'}>
          {tab(ctx, { locked: true })}
          <ArtG html={pawBadge(CARD.x + CARD.w - 6, CARD.y + 2)} />
        </g>
      ),
    },
    {
      label: '完成',
      en: 'done',
      hit: WHEEL.hit,
      draw: (ctx) => (
        <>
          <WheelView part={WHEEL} ctx={ctx} from="e" to="e" ms={1e6} reduced={reduced} linked={false} />
          <ArtG html={checkKnot(105 - 30, 50 - 28)} />
        </>
      ),
    },
    { label: '長按顯示', en: 'hold-to-reveal', draw: (ctx) => tab(ctx) },
    { label: '減少動態', en: 'reduced motion', draw: (ctx) => tab(ctx, { outline: true }) },
  ];
  return (
    <main className="min-h-dvh px-4 pb-4 pt-3 font-body" style={{ backgroundColor: POPUP.cover }} lang="zh-Hant" data-still={still ? '' : undefined} data-affordance-sheet="">
      <h1 className="mb-2 font-serif text-[22px] font-black" style={{ color: POPUP.goldLight }}>
        機關狀態 <span className="font-body text-[20px] font-medium" style={{ color: POPUP.stickerLabel }}>touchable states</span>
      </h1>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {cells.map((c, i) => (
          <Cell key={c.en} index={i} label={c.label} en={c.en} hit={c.hit ?? TAB.hit}>
            {c.draw}
          </Cell>
        ))}
      </div>
    </main>
  );
}
