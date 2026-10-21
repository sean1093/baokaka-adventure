import { useMemo, type CSSProperties } from 'react';
import { POPUP as C } from '../../../art/palette';
import { chapterInfo, chapterName, UI } from '../../content';
import type { TalkLine } from '../../content/script';
import { labelTab, speechCard, stripCard } from '../talk/art';
import { textEm, wrapText } from '../talk/place';
import { SPEAKER_INK } from '../talk/Talk';
import { useTextScale } from '../textSize';
import './chapterBoard.css';
import { TapMark } from './TapMark';

/**
 * The chapter card (GDD § 2.13 "the departure-board card", § 5.2; popup art bible § 7, § 2.4
 * proof C; #102): a cream card hung from the top of the screen on two strings, the chapter on a
 * red spine bar (「第一章」, set vertically like a book's spine), the chapter's title in red serif,
 * the time on a navy chip (atmosphere only: the night's clock, never a timer), the landmark in
 * 36 px serif, a 翻 seal, and the departure board's split-flap row 「下一站 台北車站」.
 *
 * The chapter turn (`transitions/pageTurn.ts`) drops it in, swings it and flips the board's tiles
 * (their `[data-flap]` halves) by the Web Animations API; drawn here it is settled, the tiles
 * flipped, so a still (and reduced motion) shows the finished card. `CardTalk` draws its lines
 * under it, one beat at a time.
 *
 * Every word is ≥ 20 px at ≥ 7:1 on its own paper (R5). It takes no touches: the shell's
 * full-screen tap layer advances the lines and skips the turn.
 */

/** The card's box, CSS px (the strings from the top of the screen to the card). */
export const BOARD_W = 320;
export const BOARD_H = 252;
const CARD = { x: 12, y: 60, w: 296, h: 184 } as const;
const SPINE_W = 38;
/** The inner column right of the spine */
const IN_X = CARD.x + SPINE_W + 14;
const IN_W = CARD.x + CARD.w - 14 - IN_X;
const BOARD_Y = CARD.y + 112;
const BOARD_ROW_H = 56;
/** Where the strings meet the card */
const EYELETS = [CARD.x + 19, CARD.x + CARD.w - 11] as const;
const EYELET_Y = CARD.y + 7;
const FLAP_LABEL_W = 70;
/** The strings reach this far above the box (the box itself sits a little below the screen's top) */
const STRING_TOP = 80;
const TILE_H = 40;

const SERIF = "'Noto Serif TC', serif";
const ROUND = "'Chiron GoRound TC', sans-serif";

/** The landmark's font size: 36 px (bible § 7), smaller only when a long name would crowd the seal. */
export function landmarkSize(landmark: string): number {
  return Math.min(36, Math.floor((IN_W - 46) / Math.max(1, textEm(landmark) + 0.12 * [...landmark].length)));
}

/** Room for the title left of the time chip: six characters at 22 px (6's 「飛機睡著的時候」 has seven, 10's 「離天空最近的地方」 eight). */
const TITLE_W = 148;

/** The title's font size: 22 px, smaller only when a long title would run under the time chip (#131). */
export function titleSize(title: string): number {
  return Math.min(22, Math.floor(TITLE_W / Math.max(1, [...title].length)) - 1);
}

/**
 * The title row at the board's scale `s` (#132): the title's size in CSS px and whether the time chip
 * moves up off the row. The title shrinks to its room beside the chip (`titleSize`), but never under
 * the smallest a word may be (R5: 20 px, 24 with 大字); a title that can't fit beside the chip at that
 * size (10's eight characters; 6's seven with 大字) lifts the chip onto the card's top edge (clipped on
 * like a luggage tag) and takes the whole row.
 */
export function titleLayout(title: string, s: number): { readonly px: number; readonly chipUp: boolean } {
  const min = s > 1 ? BIG_MIN_PX : MIN_PX;
  const n = Math.max(1, [...title].length);
  const px = Math.max(min, s * titleSize(title));
  // Each character takes its em plus the 1 px letter spacing
  if (n * (px + 1) <= s * TITLE_W) return { px, chipUp: false };
  return { px: Math.max(min, Math.min(s * 22, Math.floor((s * IN_W) / n) - 1)), chipUp: true };
}

/** The board's tiles: one character each (Latin digits too, as on a real board), their width shared out. */
export function flapTiles(next: string): { readonly chars: readonly string[]; readonly w: number } {
  const chars = [...next];
  const room = IN_W - 16 - FLAP_LABEL_W;
  return { chars, w: Math.min(32, Math.floor(room / chars.length) - 3) };
}

/** The paper: two strings and their eyelets, the card's shadow, the stock with a deckled foot, the spine, the board. */
function cardArt(): string {
  const { x, y, w, h } = CARD;
  // The foot deckled by hand: a soft run of small teeth
  let foot = '';
  for (let i = 0; i <= 24; i++) foot += `L${(x + w - (i * w) / 24).toFixed(1)} ${(y + h + (i % 2 ? 1.6 : -0.6) + (i % 5 === 0 ? 0.8 : 0)).toFixed(1)}`;
  const paper = `M${x + 3} ${y}H${x + w - 3}Q${x + w} ${y} ${x + w} ${y + 3}V${y + h}${foot}L${x} ${y + h}V${y + 3}Q${x} ${y} ${x + 3} ${y}Z`;
  // Twine from above the screen's top edge (the card hangs from the night) to two foil eyelets
  const top = -STRING_TOP;
  const strings = EYELETS.map((ex, i) => `<path d="M${ex + (i ? 6 : -6)} ${top}L${ex} ${EYELET_Y}" stroke="${C.pageEdge}" stroke-width="1.6" stroke-linecap="round"/>`
    + `<path d="M${ex + (i ? 6 : -6)} ${top}L${ex} ${EYELET_Y}" stroke="${C.foldRidge}" stroke-width=".6" stroke-dasharray="2 3" opacity=".6"/>`).join('');
  const eyelets = EYELETS.map((ex) => `<circle cx="${ex}" cy="${EYELET_Y}" r="5.2" fill="${C.goldDeep}"/><circle cx="${ex}" cy="${EYELET_Y}" r="3.6" fill="${C.gold}"/><circle cx="${ex}" cy="${EYELET_Y}" r="1.8" fill="${C.ink}"/>`).join('');
  const boardX = IN_X - 6;
  const boardW = IN_W + 12;
  return `<path d="${paper}" fill="${C.shadow}" opacity=".42" transform="translate(4 7)"/>`
    + `<path d="${paper}" fill="${C.page}"/>`
    // The cut edge: a lit rim on top and left, a shade on the right
    + `<path d="M${x + 3} ${y + 0.8}H${x + w - 3}" stroke="${C.cutRim}" stroke-width="1.4"/>`
    + `<path d="M${x + w - 0.8} ${y + 3}V${y + h}" stroke="${C.pageDark}" stroke-width="1.4"/>`
    // A faint printed rule under the title row
    + `<path d="M${IN_X} ${y + 46}H${x + w - 14}" stroke="${C.pageEdge}" stroke-width="1"/>`
    // The red spine bar (the deep seal red keeps its cream lettering ≥ 7:1), a bright red band along its fold
    + `<path d="M${x + 3} ${y}H${x + SPINE_W}V${y + h + 0.6}H${x}V${y + 3}Q${x} ${y} ${x + 3} ${y}Z" fill="${C.sealDark}"/>`
    + `<path d="M${x + SPINE_W - 3.5} ${y}V${y + h + 0.6}" stroke="${C.seal}" stroke-width="5"/>`
    + `<path d="M${x + SPINE_W - 0.6} ${y}V${y + h}" stroke="${C.sealInk}" stroke-width="1.2"/>`
    + `<path d="M${x + SPINE_W - 6.5} ${y + 2}V${y + h - 2}" stroke="${C.sealHairline}" stroke-width=".7" opacity=".45"/>`
    // The departure board: navy, a gold frame, a hairline inside it
    + `<rect x="${boardX}" y="${BOARD_Y}" width="${boardW}" height="${BOARD_ROW_H}" rx="6" fill="${C.cover}"/>`
    + `<rect x="${boardX + 1}" y="${BOARD_Y + 1}" width="${boardW - 2}" height="${BOARD_ROW_H - 2}" rx="5" fill="none" stroke="${C.goldDeep}" stroke-width="2"/>`
    + `<rect x="${boardX + 4}" y="${BOARD_Y + 4}" width="${boardW - 8}" height="${BOARD_ROW_H - 8}" rx="3" fill="none" stroke="${C.gold}" stroke-width=".6" opacity=".55"/>`
    + `<circle cx="${boardX + 7}" cy="${BOARD_Y + BOARD_ROW_H / 2}" r="1.6" fill="${C.gold}"/><circle cx="${boardX + boardW - 7}" cy="${BOARD_Y + BOARD_ROW_H / 2}" r="1.6" fill="${C.gold}"/>`
    + strings + eyelets;
}

/**
 * The board's scale with 大字 (#104): 25 % larger, or as large as the screen's width allows (8 px
 * either side); the words that would still be under 24 px are held at 24 (`--min-text`). 1 without.
 */
export function boardScale(textScale: number, vw: number): number {
  if (textScale <= 1) return 1;
  return Math.max(1, Math.min(textScale, (vw - 16) / BOARD_W));
}

/** The smallest word on the board (R5), and with 大字. */
const MIN_PX = 20;
const BIG_MIN_PX = 24;

export interface ChapterBoardProps {
  readonly chapter: number;
  /** The board's scale (`boardScale`); 1 by default */
  readonly scale?: number;
  /** Hidden until the turn drops it (the turn shows it); a still draws it shown */
  readonly hidden?: boolean;
  /** How far below the screen's top the box hangs (the safe area, a little air) */
  readonly top?: number;
  /**
   * The split-flap row's words instead of the chapter's 「下一站」 stop: 「未完待續」 on the card of a
   * chapter not built yet, after the last one that is (#107)
   */
  readonly next?: string;
}

export function ChapterBoard({ chapter, hidden = false, top = 0, scale: s = 1, next }: ChapterBoardProps) {
  const info = chapterInfo(chapter);
  const big = s > 1;
  const u = (n: number) => n * s;
  const vars = { '--s': s, '--min-text': big ? `${BIG_MIN_PX}px` : '0px' } as CSSProperties;
  const name = chapterName(chapter);
  const art = useMemo(() => cardArt(), []);
  const nextText = next ?? info.next;
  const tiles = flapTiles(nextText);
  const lm = landmarkSize(info.landmark);
  const title = titleLayout(info.title, s);
  // The chip's top: on the title row, or lifted to straddle the card's top edge (大字, a long title)
  const chipTop = title.chipUp ? CARD.y - 22 : CARD.y + 12;
  return (
    <div
      className="cb-card"
      style={{ ...vars, top: `calc(${top}px + env(safe-area-inset-top))`, width: u(BOARD_W), height: u(BOARD_H), marginLeft: -u(BOARD_W) / 2, visibility: hidden ? 'hidden' : undefined }}
      role="status"
      aria-label={`${name} ${info.title}，${info.time}，${info.landmark}，${UI.chapterCard.next} ${nextText}`}
      data-chapter-board={chapter}
      data-card-soon={next !== undefined ? '' : undefined}
    >
      <div className="cb-tilt" aria-hidden="true">
        <svg width={u(BOARD_W)} height={u(BOARD_H + STRING_TOP)} viewBox={`0 ${-STRING_TOP} ${BOARD_W} ${BOARD_H + STRING_TOP}`} style={{ top: -u(STRING_TOP) }} className="absolute left-0 top-0 block overflow-visible" dangerouslySetInnerHTML={{ __html: art }} />
        {/* The spine: the chapter, set vertically */}
        <span className="cb-spine" style={{ left: u(CARD.x), top: u(CARD.y), width: u(SPINE_W - 5), height: u(CARD.h), fontFamily: SERIF, color: C.sealGlyph }}>
          <span className="cb-run">{name}</span>
        </span>
        <span className="cb-text" style={{ left: u(IN_X), top: u(CARD.y + 12), fontFamily: SERIF, fontSize: title.px, fontWeight: 900, color: C.sealInk, letterSpacing: 1 }} data-card-title="">
          {info.title}
        </span>
        <span className="cb-chip" style={{ right: u(BOARD_W - CARD.x - CARD.w + 24), top: u(chipTop), background: C.cover, color: C.goldLight, boxShadow: title.chipUp ? `0 1.5px 0 ${C.coverDark}, 0 3px 6px ${C.shadow}66` : undefined }} data-card-time="" data-chip-up={title.chipUp ? '' : undefined}>
          <span className="cb-run">{info.time}</span>
        </span>
        <span className="cb-text" style={{ left: u(IN_X - 2), top: u(CARD.y + 52), fontFamily: SERIF, fontSize: u(lm), lineHeight: `${u(50)}px`, fontWeight: 900, color: C.ink, letterSpacing: 2 }} data-card-landmark="">
          {info.landmark}
        </span>
        <span className="cb-seal" style={{ right: u(BOARD_W - CARD.x - CARD.w + 14), top: u(CARD.y + 60), background: C.sealDark, color: C.sealGlyph, fontFamily: SERIF, boxShadow: `inset 0 0 0 2.5px ${C.seal}, 0 1.5px 0 ${C.sealInk}` }}>
          {/* The 翻 seal is a stamp in the picture (bible § 4), not words to read */}
          <span className="cb-run" data-art-text="">
            翻
          </span>
        </span>
        {/* The departure board's row: 「下一站」 and one split-flap tile per character */}
        <span className="cb-row" style={{ left: u(IN_X), top: u(BOARD_Y), width: u(IN_W), height: u(BOARD_ROW_H) }} data-card-next={nextText}>
          <span className="cb-label" style={{ width: u(FLAP_LABEL_W), fontFamily: ROUND, color: C.sealGlyph }}>
            {UI.chapterCard.next}
          </span>
          {tiles.chars.map((ch, i) => (
            <span key={i} className="cb-tile" style={{ width: u(tiles.w), height: u(TILE_H) }}>
              <span className="cb-half cb-top" style={{ background: C.coverLight }}>
                <span className="cb-glyph" style={{ color: C.goldLight, fontFamily: ROUND }}>{ch}</span>
              </span>
              <span className="cb-half cb-bot" style={{ background: C.nightInk }} />
              <span className="cb-half cb-top cb-flap" style={{ background: C.coverLight }} data-flap="top" data-flap-index={i} />
              <span className="cb-half cb-bot cb-flap" style={{ background: C.nightInk }} data-flap="bottom" data-flap-index={i}>
                <span className="cb-glyph" style={{ color: C.goldLight, fontFamily: ROUND }}>{ch}</span>
              </span>
              <span className="cb-hinge" style={{ background: C.vignette }} />
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

// ——— The card's lines ———

const TALK_F = 21;
const PAD = 12;
const LH = 1.32;
/** The names 寶咖咖 and 摩卡 wear here: on the card they hang from no one (on the page their bubbles hang from them) */
const OFF_PAGE_LABEL: Partial<Record<TalkLine['who'], string>> = { baby: '寶咖咖', mocha: '摩卡' };

/** One line laid out: narration on a washi strip, speech on a die-cut card with its speaker's tab. `f`: the text size (大字: × 1.25, #104). */
export function cardLineLayout(line: TalkLine, maxW: number, f = TALK_F): { rows: string[]; label: string | null; w: number; h: number } {
  const label = line.who === 'nar' ? null : (line.label ?? OFF_PAGE_LABEL[line.who] ?? null);
  const rows = wrapText(line.text, (maxW - 2 * PAD - 8) / f);
  const textW = Math.max(...rows.map(textEm)) * f;
  const labelW = label === null ? 0 : textEm(label) * f + 24 + 18;
  const w = Math.min(maxW, Math.max(textW + 2 * PAD + 8, labelW, 96));
  // The tab rises over the card's top edge and hangs into it: room for both, so it never sits on the text
  const tab = label === null ? 0 : labelH(f);
  return { rows, label, w, h: rows.length * f * LH + 2 * PAD + tab };
}

/** The speaker's tab: tall enough for its name's whole text box. */
const labelH = (f: number) => f + 14;

export interface CardTalkProps {
  /** The beat on the card (≤ 3 lines), or null */
  readonly beat: readonly TalkLine[] | null;
  /** Counts beats: a new beat replays the entrances */
  readonly serial: number;
  /** The column's width, CSS px */
  readonly width: number;
  readonly reduced: boolean;
}

/**
 * The chapter card's lines (GDD § 5.2; bible § 7 "narration lines are tap-through subtitles below
 * it"): the beat under the card, each line springing in after the one before. The shell's tap
 * layer advances them; the last tap lets the card lift away.
 */
export function CardTalk({ beat, serial, width, reduced }: CardTalkProps) {
  if (beat === null || beat.length === 0) return null;
  return (
    <div className="cb-talk" style={{ width }} data-card-talk={serial}>
      {beat.map((line, i) => (
        <CardLine key={`${serial}:${i}`} line={line} maxW={width} delay={i * 180} reduced={reduced} />
      ))}
      {/* The lines wait for a tap: a bobbing ▼ under them says so (#183) */}
      <div className="cb-tap" key={`tap:${serial}`}>
        <TapMark delay={reduced ? 0 : beat.length * 180 + 300} />
      </div>
    </div>
  );
}

const M = 10;

function CardLine({ line, maxW, delay, reduced }: { line: TalkLine; maxW: number; delay: number; reduced: boolean }) {
  // 大字 (#104): the lines' text grows 25 %
  const f = TALK_F * useTextScale();
  const LABEL_H = labelH(f);
  const { rows, label, w, h } = useMemo(() => cardLineLayout(line, maxW - 2 * M, f), [line, maxW, f]);
  // The card starts under the tab's rise; the text sits below the part of the tab hanging inside it
  const rise = label === null ? 0 : LABEL_H * 0.55;
  const inside = label === null ? 0 : LABEL_H - rise;
  const box = { x: M, y: M + rise, w, h: h - rise };
  const art = useMemo(() => {
    if (label === null) return stripCard(box);
    return speechCard(box, 12) + labelTab(M + 12, M, textEm(label) * f + 24, LABEL_H, SPEAKER_INK[line.who]);
  }, [label, w, h, line.who, f]);
  const lh = f * LH;
  const top = box.y + inside + (box.h - inside - rows.length * lh) / 2;
  return (
    <svg
      width={w + 2 * M}
      height={h + 2 * M}
      viewBox={`0 0 ${w + 2 * M} ${h + 2 * M}`}
      className="block overflow-visible"
      data-card-line={line.who}
    >
      <g className={reduced ? 'cb-line-fade' : label === null ? 'cb-line-strip' : 'cb-line'} style={{ animationDelay: `${delay}ms` }}>
        <g dangerouslySetInnerHTML={{ __html: art }} />
        {label !== null && (
          <text x={M + 24} y={M + LABEL_H / 2 + f * 0.36} fontFamily={SERIF} fontWeight={900} fontSize={f} fill={C.sealGlyph} stroke={SPEAKER_INK[line.who]} strokeWidth={3} paintOrder="stroke" strokeLinejoin="round">
            {label}
          </text>
        )}
        {rows.map((row, i) => (
          <text
            key={i}
            x={box.x + box.w / 2}
            y={top + lh * i + lh * 0.5 + f * 0.36}
            textAnchor="middle"
            fontFamily={SERIF}
            fontStyle={label === null ? 'italic' : undefined}
            fontWeight={label === null ? 600 : 700}
            fontSize={f}
            fill={C.ink}
            // On a speech card the speaker's tab can sit inside a short row's box: a halo in the card's white keeps it ≥ 7:1 (#108)
            stroke={label === null ? undefined : C.standeeCard}
            strokeWidth={label === null ? undefined : 3}
            paintOrder={label === null ? undefined : 'stroke'}
            strokeLinejoin="round"
          >
            {row}
          </text>
        ))}
      </g>
    </svg>
  );
}
