import { useEffect, useMemo, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { POPUP as C, withAlpha } from '../../../art/palette';
import { useSvgIds } from '../../../art/useSvgIds';
import { kitCtx, kitDefs, ref, type KitCtx } from '../../art';
import { UI } from '../../content';
import { WORD_LABEL } from '../../content/words';
import type { Word } from '../../core/types';
import { GhostHand } from '../affordance/Hints';
import type { Pt } from '../geometry';
import { ArtG, r2 } from '../parts/common';
import { wordSeal, WORD_SEAL } from './icons';
import { DISC, ringLayout, type RingLayout, type SafeArea } from './ringLayout';
import './words.css';

/**
 * The word ring (GDD § 2.4; popup art bible § 7; #99): Baokaka's learned words as paper discs
 * fanned round him like a volvelle, each with its icon on its own seal colour and its serif glyph,
 * and 「好了」 under him. One tap on a disc says the word (`onSay`); 「好了」 or a tap anywhere
 * else closes it with no effect (`onClose`). The page dims 30 % except a pool of light on Baokaka.
 * The world is paused while it is open (`PagePlayer` holds the `ring` reason).
 *
 * A modal dialog (`aria-modal`): the page under it is not read. Screen px, over the whole player. Discs are 72 px buttons (≥ 64 px; R6) with 20 px glyphs (R5).
 * The newly learned word glows until it is first said; the first-use tutorial's ghost hand taps
 * `hand`'s disc.
 */

export interface WordRingProps {
  /** Baokaka's middle on screen */
  readonly around: Pt;
  readonly words: readonly Word[];
  readonly safe: SafeArea;
  readonly leftHand?: boolean;
  /** The newly learned word, glowing until first said */
  readonly fresh?: Word | null;
  /** The tutorial's ghost hand taps this word's disc */
  readonly hand?: Word | null;
  readonly reduced: boolean;
  readonly onSay: (word: Word) => void;
  readonly onClose: () => void;
}

/** A cream paper disc (r 34) with its stacked shadow, a ring of `ring` colour. */
function discArt(ctx: KitCtx, ring: string): string {
  const r = DISC / 2 - 2;
  return `<circle cx="1.8" cy="3.4" r="${r}" fill="${C.shadow}" opacity=".5"/><circle cx="-1" cy="-1" r="${r}" fill="${C.cutRim}" opacity=".42"/>`
    + `<circle r="${r}" fill="${C.page}"/>`
    // The shade stays out at the rim, clear of the glyph (R5 contrast)
    + `<circle r="${r}" fill="url(#${ctx.id('wrShade')})"/>`
    + `<circle r="${r - 3}" fill="none" stroke="${ring}" stroke-width="2.4"/>`;
}

/**
 * The volvelle's paper wheel the discs ride on: a kraft ring round Baokaka with a cream inlay, a
 * printed scale every 10° and a dotted gold track through the discs' centres.
 */
function bandArt(ring: RingLayout): string {
  const R = ring.radius;
  const [cx, cy] = ring.center;
  const w = 30;
  const circle = (r: number, attrs: string) => `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}" fill="none" ${attrs}/>`;
  let ticks = '';
  for (let a = 0; a < 360; a += 10) {
    const c = Math.cos((a * Math.PI) / 180);
    const s = Math.sin((a * Math.PI) / 180);
    const r0 = R + w / 2 - 3;
    const r1 = r0 - (a % 30 === 0 ? 8 : 5);
    ticks += `M${r2(cx + c * r0)} ${r2(cy + s * r0)}L${r2(cx + c * r1)} ${r2(cy + s * r1)}`;
  }
  return `<g transform="translate(2 4)">${circle(R, `stroke="${C.shadow}" stroke-opacity=".3" stroke-width="${w}"`)}</g>`
    + circle(R, `stroke="${C.kraft}" stroke-width="${w}"`)
    + circle(R, `stroke="${C.page}" stroke-opacity=".45" stroke-width="${w - 10}"`)
    + circle(R + w / 2 - 0.5, `stroke="${C.kraftFiber}" stroke-opacity=".6" stroke-width="1"`)
    + circle(R - w / 2 + 0.5, `stroke="${C.kraftFiber}" stroke-opacity=".6" stroke-width="1"`)
    + `<path d="${ticks}" stroke="${C.kraftFiber}" stroke-opacity=".6" stroke-width="1.2" stroke-linecap="round"/>`
    + circle(R, `stroke="${C.gold}" stroke-width="1.8" stroke-dasharray="2 7" stroke-linecap="round"`);
}

const SERIF = "'Noto Serif TC', serif";

export function WordRing({ around, words, safe, leftHand = false, fresh = null, hand = null, reduced, onSay, onClose }: WordRingProps) {
  const ids = useSvgIds('ring');
  const ctx: KitCtx = useMemo(() => ({ ...kitCtx('ring'), id: ids }), [ids]);
  const ring = useMemo(() => ringLayout(around, words, { leftHand, safe }), [around[0], around[1], words.join(), leftHand, safe.x, safe.y, safe.w, safe.h]);
  const defs = useMemo(
    () => kitDefs(ctx, ['foil', 'softMarigold'], `<radialGradient id="${ctx.id('wrShade')}" cx=".5" cy=".42" r=".62"><stop offset=".88" stop-color="${C.pageDark}" stop-opacity="0"/><stop offset="1" stop-color="${C.pageDark}" stop-opacity=".5"/></radialGradient>`),
    [ctx],
  );
  const band = useMemo(() => bandArt(ring), [ring]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);

  const outside = (e: ReactPointerEvent) => {
    e.stopPropagation();
    onClose();
  };
  // The page dims 30 %, but for a pool of light on him
  const dim = withAlpha(C.shadow, 0.3);
  const pool: CSSProperties = {
    background: `radial-gradient(circle at ${r2(around[0])}px ${r2(around[1])}px, transparent 0, transparent 44px, ${dim} 70px)`,
  };
  const closeSlot = ring.slots[0];
  const handSlot = hand === null ? undefined : ring.slots.find((s) => s.kind === 'word' && s.word === hand);

  return (
    <div className="absolute inset-0" style={pool} role="dialog" aria-modal="true" aria-label={UI.bar.talk} data-word-ring={words.join(' ')} onPointerDown={outside}>
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <g dangerouslySetInnerHTML={{ __html: defs }} />
        <g className={reduced ? 'wr-fade' : 'wr-band'}>
          <ArtG html={band} />
        </g>
      </svg>
      {ring.slots.map((slot, i) => {
        const word = slot.kind === 'word' ? slot.word : null;
        const label = word === null ? UI.ring.close : WORD_LABEL[word];
        const turn: CSSProperties = { ['--from' as string]: `${closeSlot.deg}deg`, ['--to' as string]: `${slot.deg}deg`, ['--r' as string]: `${r2(ring.radius)}px` };
        const delay = { animationDelay: `${i * 45}ms` };
        const disc = (
          <button
            type="button"
            className={`kit-press absolute ${reduced ? 'wr-fade' : 'wr-pop'}`}
            style={{ left: -DISC / 2, top: -DISC / 2, width: DISC, height: DISC, borderRadius: '50%', WebkitTapHighlightColor: 'transparent', ...delay }}
            aria-label={label}
            data-word={word ?? 'close'}
            data-fresh={word !== null && word === fresh ? '' : undefined}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => (word === null ? onClose() : onSay(word))}
          >
            <svg width={DISC} height={DISC} viewBox={`${-DISC / 2} ${-DISC / 2} ${DISC} ${DISC}`} className="overflow-visible" aria-hidden="true">
              {word !== null && word === fresh && (
                <g data-fresh-glow="">
                  <circle r={DISC / 2 + 24} fill={ref(ctx, 'softMarigold')} className={reduced ? undefined : 'wr-glow'} />
                  <circle r={DISC / 2 + 4} fill="none" stroke={C.marigold} strokeWidth={2} strokeDasharray="3 4" />
                </g>
              )}
              <ArtG html={discArt(ctx, word === null ? C.gold : WORD_SEAL[word])} />
              {word === null ? (
                <text y={8} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={22} fill={C.ink}>
                  {label}
                </text>
              ) : (
                <>
                  <g transform="translate(0 -15)">
                    <ArtG html={wordSeal(word, 24)} />
                  </g>
                  {/* Three glyphs (飛機！, 咻——) are drawn a little narrower to stay inside the disc */}
                  <text y={17} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={20} fill={C.ink} textLength={[...label].length > 2 ? 50 : undefined} lengthAdjust="spacingAndGlyphs">
                    {label}
                  </text>
                </>
              )}
            </svg>
          </button>
        );
        // Placed on the ring: turned about its centre, counter-turned to stand upright
        return (
          <div key={word ?? 'close'} className="absolute" style={{ left: r2(ring.center[0]), top: r2(ring.center[1]), width: 0, height: 0 }}>
            <div className={reduced ? undefined : 'wr-turn'} style={{ transform: `rotate(${slot.deg}deg)`, ...turn, ...delay }}>
              <div className={reduced ? undefined : 'wr-upright'} style={{ transform: `translateX(${r2(ring.radius)}px) rotate(${-slot.deg}deg)`, ...turn, ...delay }}>
                {disc}
              </div>
            </div>
          </div>
        );
      })}
      {handSlot && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true" data-ring-hand={hand ?? undefined}>
          {/* Upside down, from above, its fingertip on the seal: the word's glyph stays readable */}
          <g transform={`translate(${r2(handSlot.at[0] + 2)} ${r2(handSlot.at[1] - 10)}) rotate(180)`}>
            <GhostHand gesture={{ kind: 'tap', at: [0, 0] }} reduced={reduced} />
          </g>
        </svg>
      )}
    </div>
  );
}
