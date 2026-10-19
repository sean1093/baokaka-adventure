import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { POPUP as C, withAlpha } from '../../../art/palette';
import { UI, WORD_LABEL } from '../../content';
import type { PageDef } from '../../core/types';
import { AUTO_SNAP_MS, PHOTO_LOOP_MS, approachAt, photoFrameAt, wowMeter, type Shot } from '../../game/photo';
import { useSpritesPreload } from '../../sprites';
import { PHOTO_H, PHOTO_SPRITES, PHOTO_W, PhotoScene } from './PhotoScene';
import { useTextScale } from '../textSize';
import './photo.css';

/**
 * The photo moment (GDD § 2.9 steps 1–4; bible § 7 "the shutter moment"; #103): over the paused
 * spread a paper camera slides down, its viewfinder on 寶咖咖's final approach in slow motion (a
 * 3 s loop, creeping in), the 「哇！」 meter beside it rising as his face lights up, peaking at the
 * grab, then easing; under it the big marigold 咔嚓 (a touchable). A tap takes the frame the loop
 * is at (`photoFrameAt`: A at the peak, B before, C after; +M when 摩卡 is in the frame); after 6 s
 * with no tap it snaps B itself. Flash, then `onSnap`. It is pure UI over the paused simulation.
 *
 * The same moment replays from the album's 「再拍一次」 (§ 2.9 step 7) with no page under it.
 *
 * Reduced motion: the camera fades in, no slow-motion zoom, the meter stands still at its peak
 * mark (the viewfinder's picture still changes as he approaches, grabs and chews).
 */

/** The flash lasts this long before the shot is handed over. */
export const FLASH_MS = 360;

export interface PhotoMomentProps {
  readonly chapter: number;
  /** The spread (its backdrop and `photoRect`) */
  readonly def?: Pick<PageDef, 'backdrop' | 'photoRect'>;
  /** 摩卡 is inside the frame (+M) */
  readonly mocha: boolean;
  readonly reduced: boolean;
  /** A screenshot still: the clock held at `at` */
  readonly still?: boolean;
  /** Visual QA: the moment's time, held (ms into the loop) */
  readonly at?: number;
  /** The width the camera may take (CSS px) */
  readonly vw: number;
  readonly onSnap: (shot: Shot) => void;
}

const BODY_PAD = 14;
const BAND_H = 50;
const METER_W = 56;
const SHUTTER = 108;

export function PhotoMoment({ chapter, def, mocha, reduced, still = false, at, vw, onSnap }: PhotoMomentProps) {
  const held = still;
  const start = at ?? 0;
  const [ms, setMs] = useState(start);
  const [flash, setFlash] = useState(false);
  const snapped = useRef(false);
  const t0 = useRef(0);
  const onSnapRef = useRef(onSnap);
  onSnapRef.current = onSnap;
  const ready = useSpritesPreload(PHOTO_SPRITES);

  // The slow-motion clock: from the moment the camera is up (rAF), unless held for a still
  useEffect(() => {
    if (held) return undefined;
    t0.current = performance.now() - start;
    let raf = requestAnimationFrame(function loop(now) {
      setMs(now - t0.current);
      raf = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(raf);
  }, [held, start]);

  const snap = useCallback((shot: Shot) => {
    if (snapped.current) return;
    snapped.current = true;
    setFlash(true);
    window.setTimeout(() => onSnapRef.current(shot), FLASH_MS);
  }, []);
  // § 2.9: no tap in 6 s → Frame B
  useEffect(() => {
    if (held) return undefined;
    const t = window.setTimeout(() => snap({ frame: 'B', mocha }), AUTO_SNAP_MS);
    return () => window.clearTimeout(t);
  }, [held, mocha, snap]);

  const frame = photoFrameAt(ms);
  const meter = reduced ? 1 : wowMeter(ms);
  const width = Math.min(vw - 24, 366);
  const finder = width - 2 * BODY_PAD - METER_W;
  const finderH = (finder * PHOTO_H) / PHOTO_W;
  const height = BAND_H + finderH + 2 * BODY_PAD;
  const body = useMemo(() => cameraArt(width, height, finder, finderH), [width, height, finder, finderH]);
  // The zoom restarts with the loop so it keeps time with him (one key per loop)
  const loop = Math.floor(ms / PHOTO_LOOP_MS);

  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  return (
    <div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5"
      style={{ background: withAlpha(C.shadow, 0.5) }}
      role="dialog"
      aria-modal="true"
      aria-label={UI.photo.shutter}
      data-photo-moment={frame}
      data-photo-mocha={mocha ? '' : undefined}
      data-photo-ready={ready ? '' : undefined}
      onPointerDown={stop}
    >
      <div className={reduced ? 'ph-fade' : 'ph-in'} style={{ width, height, position: 'relative' }}>
        <svg className="absolute inset-0 overflow-visible" width={width} height={height} aria-hidden="true" dangerouslySetInnerHTML={{ __html: body }} />
        {/* The viewfinder: his final approach, slowly zooming in */}
        <div className="absolute overflow-hidden" style={{ left: BODY_PAD, top: BAND_H + BODY_PAD, width: finder, height: finderH, borderRadius: 4 }}>
          <div key={loop} className={reduced || held ? undefined : 'ph-zoom'} style={{ width: finder, height: finderH }}>
            <PhotoScene chapter={chapter} def={def} frame={frame} mocha={mocha} approach={approachAt(ms)} width={finder} />
          </div>
          <Brackets w={finder} h={finderH} />
        </div>
        <WowMeter x={BODY_PAD + finder + 8} y={BAND_H + BODY_PAD} h={finderH} level={meter} />
      </div>
      <button
        type="button"
        className={`kit-press relative flex flex-col items-center justify-center rounded-full ${reduced ? 'ph-fade' : 'ph-shutter-in'}`}
        style={SHUTTER_STYLE}
        aria-label={UI.photo.shutter}
        data-shutter=""
        onPointerDown={stop}
        onClick={() => snap({ frame: photoFrameAt(ms), mocha })}
      >
        <svg width={40} height={30} viewBox="-20 -15 40 30" aria-hidden="true">
          <rect x={-18} y={-10} width={36} height={24} rx={5} fill={C.ink} />
          <path d="M-8 -10l3 -5h10l3 5z" fill={C.ink} />
          <circle cy={2} r={8} fill={C.marigoldLight} />
          <circle cy={2} r={5} fill={C.ink} />
          <circle cx={-2} cy={0} r={1.6} fill={C.marigoldShine} />
        </svg>
        <span className="font-serif text-[24px] font-black leading-none tracking-[0.12em]" style={{ color: C.ink }}>
          {UI.photo.shutter}
        </span>
      </button>
      {flash && <div className={`pointer-events-none fixed inset-0 ${reduced ? 'ph-fade' : 'ph-flash'}`} style={{ background: C.printWhite, opacity: reduced ? 0.7 : undefined }} data-photo-flash="" />}
    </div>
  );
}

const SHUTTER_STYLE: CSSProperties = {
  width: SHUTTER,
  height: SHUTTER,
  gap: 2,
  backgroundColor: C.marigold,
  backgroundImage: `radial-gradient(circle at 38% 30%, ${C.marigoldLight} 0%, ${C.marigold} 52%, ${C.marigoldDeep} 100%)`,
  boxShadow: [
    `inset 0 0 0 2px ${withAlpha(C.marigoldEdge, 0.6)}`,
    `inset 0 0 0 6px ${withAlpha(C.marigoldShine, 0.45)}`,
    `0 0 0 5px ${C.cameraBody}`,
    `0 0 0 7px ${withAlpha(C.gold, 0.8)}`,
    `3px 8px 16px ${withAlpha(C.shadow, 0.55)}`,
  ].join(','),
  WebkitTapHighlightColor: 'transparent',
};

/** Chalk corner marks in the viewfinder. */
function Brackets({ w, h }: { w: number; h: number }) {
  const k = 18;
  const i = 8;
  const d = `M${i} ${i + k}V${i}H${i + k}M${w - i - k} ${i}H${w - i}V${i + k}M${w - i} ${h - i - k}V${h - i}H${w - i - k}M${i + k} ${h - i}H${i}V${h - i - k}`;
  return (
    <svg className="pointer-events-none absolute inset-0" width={w} height={h} aria-hidden="true">
      <path d={d} fill="none" stroke={C.chalk} strokeWidth={2.4} strokeLinecap="round" opacity={0.85} />
      <circle cx={w / 2} cy={h / 2} r={3} fill="none" stroke={C.chalk} strokeWidth={1.6} opacity={0.6} />
    </svg>
  );
}

/** The 「哇！」 meter: a paper thermometer, its magenta ink rising to the star at the peak. */
function WowMeter({ x, y, h, level }: { x: number; y: number; h: number; level: number }) {
  // 大字 (#104): the label grows 25 %, on a taller tag that overhangs the tube a little
  const k = useTextScale();
  const labelH = 34 * k;
  const wide = k > 1 ? 8 : 0;
  const tubeTop = labelH + 8;
  const tubeH = h - tubeTop;
  const w = METER_W - 14;
  return (
    <div className="absolute" style={{ left: x, top: y, width: w, height: h }} data-wow-meter={level.toFixed(2)}>
      <svg width={w} height={h} className="overflow-visible" aria-hidden="true">
        <rect x={-wide} y={0} width={w + 2 * wide} height={labelH} rx={4} fill={C.page} />
        <text x={w / 2} y={24 * k} textAnchor="middle" fontFamily="'Noto Serif TC', serif" fontWeight={900} fontSize={20 * k} fill={C.sealInk}>
          {WORD_LABEL.wow}
        </text>
        <rect x={w / 2 - 11} y={tubeTop} width={22} height={tubeH} rx={11} fill={C.cameraEdge} />
        <rect x={w / 2 - 8} y={tubeTop + 3} width={16} height={tubeH - 6} rx={8} fill={C.page} />
        <g transform={`translate(0 ${tubeTop + tubeH - 3}) scale(1 ${-level * ((tubeH - 6) / tubeH)})`}>
          <rect x={w / 2 - 8} y={0} width={16} height={tubeH} rx={8} fill={C.wordWow} />
        </g>
        {[0.25, 0.5, 0.75].map((k) => (
          <path key={k} d={`M${w / 2 - 8} ${tubeTop + 3 + (tubeH - 6) * (1 - k)}h5`} stroke={C.ink} strokeOpacity={0.4} strokeWidth={1.4} />
        ))}
        {/* The peak: a foil star at the top of the tube */}
        <path d={star(w / 2, tubeTop + 2, 9)} fill={C.gold} stroke={C.goldDeep} strokeWidth={1} opacity={level > 0.97 ? 1 : 0.55} />
      </svg>
    </div>
  );
}

const star = (cx: number, cy: number, r: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
};

/** The paper camera's body: black card with a lit edge, a lens and a vellum flash in the top band, the viewfinder window cut out. */
function cameraArt(w: number, h: number, finder: number, finderH: number): string {
  const fx = BODY_PAD;
  const fy = BAND_H + BODY_PAD;
  return `<rect x="5" y="8" width="${w}" height="${h}" rx="16" fill="${C.shadow}" opacity=".55"/>`
    + `<rect width="${w}" height="${h}" rx="16" fill="${C.cameraBody}"/>`
    + `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="15" fill="none" stroke="${C.cameraEdge}" stroke-width="2"/>`
    + `<path d="M14 2.5H${w - 14}" stroke="${C.cutRim}" stroke-width="1.2" opacity=".35"/>`
    // The top band: a cream label strip with the lens and the flash window
    + `<rect x="${BODY_PAD}" y="10" width="${w - 2 * BODY_PAD}" height="${BAND_H - 18}" rx="6" fill="${C.page}"/>`
    + `<rect x="${BODY_PAD}" y="${BAND_H - 14}" width="${w - 2 * BODY_PAD}" height="6" fill="${C.wordWow}" opacity=".85"/>`
    + `<rect x="${BODY_PAD}" y="${BAND_H - 8}" width="${w - 2 * BODY_PAD}" height="4" fill="${C.wordBeep}" opacity=".85"/>`
    + `<g transform="translate(${BODY_PAD + 26} ${BAND_H / 2 - 2})"><circle r="17" fill="${C.cameraBody}"/><circle r="14" fill="none" stroke="${C.gold}" stroke-width="2.2"/><circle r="9" fill="${C.nightInk}"/><circle cx="-3" cy="-3" r="3" fill="${C.moonRim}" opacity=".8"/></g>`
    + `<rect x="${w - BODY_PAD - 58}" y="15" width="44" height="20" rx="3" fill="${C.vellum}" opacity=".9"/><path d="M${w - BODY_PAD - 54} 19h36M${w - BODY_PAD - 54} 25h36M${w - BODY_PAD - 54} 31h36" stroke="${C.glassineDeep}" stroke-width="1.2"/>`
    + `<g transform="translate(${w / 2} ${BAND_H / 2 - 4}) rotate(-4)"><rect x="-14" y="-12" width="28" height="24" rx="4" fill="${C.seal}"/><text data-art-text="" y="7" text-anchor="middle" font-family="'Noto Serif TC', serif" font-weight="900" font-size="17" fill="${C.sealGlyph}">翻</text></g>`
    // The viewfinder window, cut into the card: its dark bevel
    + `<rect x="${fx - 4}" y="${fy - 4}" width="${finder + 8}" height="${finderH + 8}" rx="7" fill="${C.nightInk}"/>`
    + `<path d="M${fx - 3} ${fy + finderH + 3.5}H${fx + finder + 3}" stroke="${C.cutRim}" stroke-width="1" opacity=".3"/>`;
}
