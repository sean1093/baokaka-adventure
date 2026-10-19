import { useMemo } from 'react';
import { POPUP as C } from '../../../art/palette';
import { useSvgIds } from '../../../art/useSvgIds';
import { clockChip, hudPaper, hudTape, kitCtx, kitDefs, trayCoins, type KitCtx } from '../../art';
import { chapterLine } from '../../content';
import { HUD_H } from '../geometry';

/**
 * The top HUD (GDD § 2.1 page anatomy; popup art bible § 7; #97): the cream deckled paper label
 * taped onto the cover with pink and celadon washi, turned −0.6°, holding the landmark (serif 900),
 * the page title 「…」 in seal ink, the chapter line 「第一章 · 第 2 頁 / 6」, the moon clock chip
 * (atmosphere only: the chapter's time, never a timer, R3) and the 9-slot 抓周 tray (a foil coin per
 * treasure found).
 *
 * Every word is ≥ 20 px at 7:1 (R5): the kit proof's 12–19 px labels were the #92 waiver. To make
 * room, the 「抓周」 caption is the tray's accessible name only, and a row too long for the label
 * (a long landmark plus a long page title) is condensed with `textLength` rather than shrunk.
 *
 * Drawn in a 390 × 96 box, scaled to the screen's width on narrow phones (the caller's `scale`).
 * With 大字 (`textScale` 1.25, #104) every word is 25 % larger (the landmark 31 px, the rest 25 px);
 * the chapter line and the clock are condensed to keep clear of the tray and the moon.
 */

export interface TopHudProps {
  /** The landmark, e.g. 台北車站 */
  readonly landmark: string;
  /** The page title, e.g. 月台的縫 */
  readonly title: string;
  readonly chapter: number;
  /** The page's number in its chapter */
  readonly index: number;
  /** The moon clock, `HH:MM` */
  readonly time: string;
  /** Treasures found: foil coins in the tray (0–9) */
  readonly coins: number;
  /** Moon (night) or sun (dawn, page E) */
  readonly moon?: boolean;
  /** The HUD's scale (≤ 1 on phones narrower than 390) */
  readonly scale?: number;
  /** 大字 (#104): 1, or 1.25 */
  readonly textScale?: number;
}

/** Row 1's room: from the label's text inset to the clock chip. */
const ROW_X = 32;
const ROW_END = 262;
const LANDMARK_PX = 25;
const TITLE_PX = 20;
/** Row 2 (the chapter line) ends before the tray */
const SUB_END = 240;

/** A rough width of a run (CJK glyphs are 1 em, Latin and digits about 0.6 em, spaces 0.3 em). */
export function runWidth(text: string, px: number, spacing = 0): number {
  let ems = 0;
  for (const ch of text) ems += /[　-鿿＀-￯「」，！]/.test(ch) ? 1 : ch === ' ' ? 0.3 : 0.6;
  return ems * px + spacing * [...text].length;
}

export function TopHud({ landmark, title, chapter, index, time, coins, moon = true, scale = 1, textScale = 1 }: TopHudProps) {
  const ids = useSvgIds('hud');
  const ctx: KitCtx = useMemo(() => ({ ...kitCtx('hud'), id: ids }), [ids]);
  const art = useMemo(
    () => ({
      defs: kitDefs(ctx, ['foil', 'coin']),
      paper: hudPaper(ctx, { x: 14, y: 10, w: 362, h: 80 }),
      chip: clockChip(ctx, 96, moon),
      tray: trayCoins(ctx, Math.max(0, Math.min(9, coins)), 13, 5.2),
      tape: hudTape(ctx, 390, 86),
    }),
    [ctx, moon, coins],
  );
  const sub = chapterLine(chapter, index);
  const k = textScale;
  const landmarkPx = LANDMARK_PX * k;
  const titlePx = TITLE_PX * k;
  const subPx = 20 * k;
  const row = runWidth(landmark, landmarkPx, 1) + 4 + runWidth(`「${title}」`, titlePx);
  const fit = row > ROW_END - ROW_X ? ROW_END - ROW_X : undefined;
  const subW = runWidth(sub, subPx);
  const subFit = subW > SUB_END - ROW_X - 1 ? SUB_END - ROW_X - 1 : undefined;
  // The clock's digits: 20 px fit beside the moon; at 25 px they are condensed into the same room
  const timeFit = k > 1 ? 54 : undefined;
  return (
    <svg
      className="absolute left-1/2 top-0 font-body"
      style={{ transform: 'translateX(-50%)' }}
      width={390 * scale}
      height={HUD_H * scale}
      viewBox={`0 0 390 ${HUD_H}`}
      role="img"
      aria-label={`${landmark}「${title}」${sub}，${time}，抓周寶物 ${coins} / 9`}
      data-slot="hud"
    >
      <g dangerouslySetInnerHTML={{ __html: art.defs }} />
      <g transform="rotate(-.6 195 50)">
        <g dangerouslySetInnerHTML={{ __html: art.paper }} />
        <text x={ROW_X} y={45} textLength={fit} lengthAdjust={fit ? 'spacingAndGlyphs' : undefined} fill={C.ink} fontWeight={900}>
          <tspan fontFamily="'Noto Serif TC'" fontSize={landmarkPx} letterSpacing={1}>
            {landmark}
          </tspan>
          <tspan fontSize={titlePx} fontWeight={700} fill={C.sealInk} dx={4}>
            「{title}」
          </tspan>
        </text>
        <text x={ROW_X + 1} y={k > 1 ? 80 : 77} fontSize={subPx} fontWeight={700} fill={C.inkSoft} textLength={subFit} lengthAdjust={subFit ? 'spacingAndGlyphs' : undefined}>
          {sub}
        </text>
        <g transform="translate(268 17)">
          <g dangerouslySetInnerHTML={{ __html: art.chip }} />
          <text x={k > 1 ? 65 : 62} y={k > 1 ? 26.5 : 24.5} textAnchor="middle" fontFamily="Fredoka" fontWeight={600} fontSize={20 * k} fill={C.goldLight} textLength={timeFit} lengthAdjust={timeFit ? 'spacingAndGlyphs' : undefined}>
            {time}
          </text>
        </g>
        <g transform="translate(250 70)" data-tray={coins} dangerouslySetInnerHTML={{ __html: art.tray }} />
      </g>
      <g dangerouslySetInnerHTML={{ __html: art.tape }} />
    </svg>
  );
}
