import type { CSSProperties } from 'react';
import type { PageDef } from '../core/types';
import { WINDOW_STRIPS, frameKey, stripKey } from '../env/windowStrips';
import { cutoutImage } from '../env/loader';
import './windowStrip.css';

/**
 * The 月亮線 window strip (#193, D-104; bible § 6, the cars row): on a moving page-1 car, the view
 * outside slides past its windows — the only scrolling backdrop. Two baked bitmaps over the backdrop
 * (`env/art/strips.ts`, `env/windowStrips.ts`): the strip, repeated across the window band and moved left one period on a
 * CSS transform loop (one transformed group: counted in the animated budget), and the car's frame
 * over it with the windows cut out (frames, straps and the glass's sheen stay in front). Under
 * reduced motion (the OS's or 減少動態), in low-power mode and in a screenshot still
 * (`[data-still]`) it holds still, on the strip's first frame.
 */
/** The strip's clip inset from the band's edge (page units). */
const EDGE = 2;

export function WindowStrip({ def, reduced }: { def: Pick<PageDef, 'backdrop'>; reduced: boolean }) {
  const s = WINDOW_STRIPS[def.backdrop];
  const strip = s === undefined ? null : cutoutImage(stripKey(def.backdrop));
  const frame = s === undefined ? null : cutoutImage(frameKey(def.backdrop));
  if (s === undefined || strip === null || frame === null) return null;
  const { band, period: P } = s;
  const clip = `ws-${def.backdrop.replace(/[^a-z0-9]/gi, '_')}`;
  const copies = Math.ceil(band.w / P) + 1;
  const run = { animationDuration: `${s.seconds}s`, '--ws-period': `${-P}px` } as CSSProperties;
  return (
    <g data-window-strip={def.backdrop} pointerEvents="none">
      <clipPath id={clip}>
        {/* Inset from the frame's edge (the windows are well inside it), so no sliver of the view
            shows along the frame bitmap's soft edge */}
        <rect x={band.x + EDGE} y={band.y + EDGE} width={band.w - 2 * EDGE} height={band.h - 2 * EDGE} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <g data-anim="" className={reduced ? undefined : 'ws-run'} style={reduced ? undefined : run}>
          {Array.from({ length: copies }, (_, i) => (
            <image key={i} href={strip.url} x={band.x + i * P} y={band.y} width={P} height={band.h} preserveAspectRatio="none" />
          ))}
        </g>
      </g>
      <image href={frame.url} x={frame.box.x} y={frame.box.y} width={frame.box.w} height={frame.box.h} preserveAspectRatio="none" />
    </g>
  );
}
