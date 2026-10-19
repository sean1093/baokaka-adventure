import { useMemo } from 'react';
import { POPUP as C } from '../../../art/palette';
import { useSvgIds } from '../../../art/useSvgIds';
import { kitCtx, kitDefs, ref, type KitCtx } from '../../art';
import { UI } from '../../content';
import { STICKER_ICON, STICKER_KINDS, STICKER_NAME } from './stickerArt';
import { useTextScale } from '../textSize';
import './stickers.css';

/**
 * The sticker card (GDD § 2.8 step 4; bible § 7 "after the page fold"; #101): a little kraft card
 * taped over the folded page, the page's title on a cream label, and its three stickers — 解開,
 * 淘氣, 土地公 — slapping onto their dimples with a squash, one at a time, 200 ms apart. A sticker
 * not earned yet stays an empty dimple with its silhouette. 「下一頁！」 at the foot. The shell holds
 * the turn while it is up: after `cardMs` or a tap the next page unfolds.
 *
 * Every word is ≥ 20 px on cream paper (R5); the card itself takes no touches (the shell's
 * full-screen tap layer does). Reduced motion: the card and the stickers fade in, nothing moves.
 */

/** The card drops in over this long; the first sticker lands after it. */
export const CARD_IN_MS = 320;
/** Bible § 7: the stickers slap on 200 ms apart. */
export const SLAP_GAP_MS = 200;
export const SLAP_MS = 280;
export const FIRST_SLAP_MS = 260;
/** GDD § 2.8: the card stays 1.5 s (after its stickers are on) unless tapped. */
export const CARD_HOLD_MS = 1500;
/** The card lifts away in this long. */
export const CARD_OUT_MS = 180;

/** How long the card stays before the page turns on by itself. */
export function cardMs(reduced: boolean): number {
  return reduced ? CARD_HOLD_MS : FIRST_SLAP_MS + (STICKER_KINDS.length - 1) * SLAP_GAP_MS + SLAP_MS + CARD_HOLD_MS;
}

export interface StickerCardProps {
  /** The page's title, 「月台的縫」 */
  readonly title: string;
  /** Earned on the page (after this completion): 解開, 淘氣, 土地公 */
  readonly stickers: readonly [boolean, boolean, boolean];
  readonly reduced?: boolean;
  /** Lifting away (the page turns on) */
  readonly leaving?: boolean;
  /** Width in CSS px (the card is drawn 300 wide) */
  readonly width?: number;
}

const W = 300;
const H = 248;
const SLOT_X = [64, 150, 236] as const;
const SLOT_Y = 118;

/** A strip of washi tape, plain (no filters on a moving thing, bible § 9). */
const tape = (x: number, y: number, rot: number, color: string) =>
  `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="-26" y="-8" width="52" height="16" fill="${color}" opacity=".86"/>`
  + `<path d="M-22 -6l2 12M-14 -6l2 12M-6 -6l2 12M2 -6l2 12M10 -6l2 12M18 -6l2 12" stroke="${C.standeeCard}" stroke-width="1" opacity=".3"/></g>`;

function cardArt(ctx: KitCtx, title: string): string {
  const fibre = ctx.id('kraftFibre');
  return `<defs><pattern id="${fibre}" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="9" height="9" fill="${C.kraft}"/><rect width="2" height="9" fill="${C.kraftFiber}" opacity=".11"/></pattern></defs>`
    // Its shadow on the page, the kraft stock, a lit top edge and a darker bottom
    + `<rect x="12" y="16" width="${W - 18}" height="${H - 20}" rx="7" fill="${C.shadow}" opacity=".5"/>`
    + `<rect x="6" y="8" width="${W - 12}" height="${H - 16}" rx="6" fill="url(#${fibre})"/>`
    + `<rect x="6" y="8" width="${W - 12}" height="${H - 16}" rx="6" fill="none" stroke="${C.kraftDark}" stroke-width="2"/>`
    + `<path d="M12 9.5H${W - 12}" stroke="${C.cutRim}" stroke-width="1.4" opacity=".55"/>`
    // The title on a cream label, its edge cut a little crooked
    + `<g transform="rotate(-.8 150 44)"><rect x="40" y="24" width="220" height="44" rx="3" fill="${C.page}"/>`
    + `<rect x="40" y="24" width="220" height="44" rx="3" fill="none" stroke="${C.pageEdge}" stroke-width="1.2"/>`
    + `<text x="150" y="55" text-anchor="middle" font-family="'Noto Serif TC', serif" font-weight="900" font-size="24" letter-spacing="2" fill="${C.sealInk}">「${title}」</text></g>`
    + tape(34, 18, -28, C.washiPink) + tape(W - 34, 18, 26, C.washiCeladon);
}

/** An icon in one flat ink: its silhouette pressed into the kraft. */
const silhouette = (icon: string) => icon.replace(/(fill|stroke)="#[0-9A-Fa-f]{6}"/g, `$1="${C.kraftFiber}"`);

/** A sticker's dimple pressed into the kraft, with its silhouette while it is empty. */
function dimple(i: number, earned: boolean): string {
  const x = SLOT_X[i];
  const icon = STICKER_ICON[STICKER_KINDS[i]];
  return `<g transform="translate(${x} ${SLOT_Y})">`
    + `<circle r="34" fill="${C.kraftDark}"/><circle r="34" cy="-1.5" fill="none" stroke="${C.kraftFiber}" stroke-width="2" opacity=".5"/>`
    + `<circle r="34" cy="1.5" fill="none" stroke="${C.cutRim}" stroke-width="1.4" opacity=".35"/>`
    + (earned ? '' : `<circle r="27" fill="none" stroke="${C.kraftFiber}" stroke-width="2" stroke-dasharray="4 5" opacity=".75"/><g transform="scale(2.1)" opacity=".42">${silhouette(icon)}</g>`)
    + `</g>`;
}

/** An earned sticker: a foil disc with its icon, big. */
function foil(ctx: KitCtx, i: number): string {
  const icon = STICKER_ICON[STICKER_KINDS[i]];
  return `<circle r="31" cy="2.5" fill="${C.shadow}" opacity=".35"/><circle r="30" fill="${ref(ctx, 'foil')}"/>`
    + `<circle r="27.5" fill="none" stroke="${C.goldDeep}" stroke-width="1.4" opacity=".8"/>`
    + `<path d="M-19 -15a24 24 0 0 1 22 -9" fill="none" stroke="${C.foilShine}" stroke-width="3" stroke-linecap="round" opacity=".75"/>`
    + `<g transform="scale(2.15)">${icon}</g>`;
}

export function StickerCard({ title, stickers, reduced = false, leaving = false, width = W }: StickerCardProps) {
  const ids = useSvgIds('stkcard');
  const ctx: KitCtx = useMemo(() => ({ ...kitCtx('stkcard'), id: ids }), [ids]);
  const art = useMemo(() => kitDefs(ctx, ['foil']) + cardArt(ctx, title), [ctx, title]);
  const slots = useMemo(() => STICKER_KINDS.map((_, i) => dimple(i, stickers[i])).join(''), [stickers]);
  const discs = useMemo(() => STICKER_KINDS.map((_, i) => foil(ctx, i)), [ctx]);
  const got = STICKER_KINDS.filter((_, i) => stickers[i]).map((k) => STICKER_NAME[k]);
  // 大字 (#104): the names and 「下一頁！」 grow 25 % on wider cream tags
  const k = useTextScale();
  const tagW = k > 1 ? 82 : 76;
  const nextW = k > 1 ? 146 : 118;
  return (
    <div
      className={`${reduced ? 'stk-card-fade' : 'stk-card'}${leaving ? ' stk-leaving' : ''}`}
      style={{ width, height: (width * H) / W }}
      role="status"
      aria-label={`「${title}」${got.join('、')}`}
      data-sticker-card={stickers.map((s) => (s ? 1 : 0)).join('')}
    >
      <svg width={width} height={(width * H) / W} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="block overflow-visible">
        <g transform={`rotate(-1.5 ${W / 2} ${H / 2})`}>
          <g dangerouslySetInnerHTML={{ __html: art + slots }} />
          {STICKER_KINDS.map((kind, i) =>
            stickers[i] ? (
              <g key={kind} transform={`translate(${SLOT_X[i]} ${SLOT_Y})`}>
                <g
                  className={reduced ? 'stk-fade' : 'stk-slap'}
                  style={{ animationDelay: `${(reduced ? 0 : FIRST_SLAP_MS) + i * SLAP_GAP_MS}ms` }}
                  data-card-sticker={kind}
                  dangerouslySetInnerHTML={{ __html: discs[i] }}
                />
              </g>
            ) : null,
          )}
          {STICKER_KINDS.map((kind, i) => (
            <g key={`${kind}-name`} transform={`translate(${SLOT_X[i]} ${SLOT_Y + 52})`}>
              <rect x={-tagW / 2} y={-15 * k} width={tagW} height={30 * k} rx={3} fill={C.page} />
              <text y={7 * k} textAnchor="middle" fontFamily="'Chiron GoRound TC', sans-serif" fontWeight={700} fontSize={20 * k} fill={stickers[i] ? C.ink : C.inkSoft}>
                {STICKER_NAME[kind]}
              </text>
            </g>
          ))}
          <g transform={`translate(${W - 26} ${H - 30})`}>
            <rect x={-nextW} y={-17 * k} width={nextW} height={32 * k} rx={3} fill={C.page} />
            <text x={-26} y={7 * k} textAnchor="end" fontFamily="'Noto Serif TC', serif" fontWeight={900} fontSize={20 * k} fill={C.ink}>
              {UI.card.next}
            </text>
            <path d="M-18 -7l10 7l-10 7z" fill={C.sealInk} />
          </g>
        </g>
      </svg>
    </div>
  );
}
