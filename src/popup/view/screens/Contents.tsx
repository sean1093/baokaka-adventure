import { useMemo } from 'react';
import { POPUP as C, withAlpha } from '../../../art/palette';
import { useSvgIds } from '../../../art/useSvgIds';
import { kitCtx, kitDefs } from '../../art';
import { BONUS_CHAPTER, CHAPTERS, ENDING_CHAPTER, chapterInfo, chapterName, loadLine, SOON_LINES, stickersIn, UI } from '../../content';
import type { Id, PageDef } from '../../core/types';
import { MAP_SHEET } from '../../env/art/screens';
import { backdropImage, screenImage } from '../../env/loader';
import { stationOf } from '../../game/nav';
import { isChapterUnlocked, isUnlocked, type SaveV1 } from '../../game/progress';
import type { PageRegistry } from '../../pages';
import { deviceScale, frameUrl, spriteDef } from '../../sprites';
import { BackIcon, LockIcon } from './icons';
import { CREAM_CARD, cardShadow, useScreenReady } from './paper';
import { useTextScale } from '../textSize';

/**
 * The 目錄 (GDD § 2.13 item 2; popup art bible § 7; #97): the 月亮線 as a folded paper map.
 *
 * - **Stations are chapters** along a red ribbon: foil when every page is solved, cream when open,
 *   a blind-embossed navy dimple with a padlock when the line hasn't reached it. An open station
 *   shows its stickers collected (n/18; n/12 in the prologue). Baokaka's head marks the chapter of
 *   the page to resume.
 * - **Tap a station** for its page strip below the map: one card per page with its baked backdrop
 *   as the thumbnail, a ✓ and the 淘氣 / 土地公 stickers once solved, the red bookmark on the page
 *   to resume, and a padlock on pages not open yet. Tapping an open page plays it (a replay keeps
 *   its own designed words, D-55).
 * - **淘氣** (GDD § 2.8; #101): under the strip, each solved page's mischief — its 嘿 sticker (foil
 *   when earned, a pressed silhouette when not) and its text. Never before the page's first
 *   completion, so the first play has no clutter.
 * - **A locked station** answers 「月亮線還沒開到這裡。」 (§ 5.7).
 *
 * - **All eleven stations** (#113): each open one with its n/18 (n/12 in the prologue), each the
 *   line hasn't reached with its padlock and line. A chapter opens as its pages are registered.
 * - **「象山的日出」** (GDD § 2.8, § 5.7; #113): once every 土地公 is found, a postcard of the sunrise
 *   over 象山 is taped onto the map's free corner, a dotted gold branch running to it from 101.
 *   Tapped, its panel holds the bonus page's card (#135): tap it to play 番外 「象山的日出」.
 */

export interface ContentsProps {
  readonly save: SaveV1;
  readonly registry: PageRegistry;
  /** The chapter whose page strip shows */
  readonly chapter: number;
  /** A locked station just tapped: its line shows instead of the strip */
  readonly locked?: number;
  /** Every 土地公 found (§ 2.8): the 「象山的日出」 postcard is on the map (#113) */
  readonly bonus?: boolean;
  /** …and was tapped: its panel shows instead of a chapter's */
  readonly bonusOpen?: boolean;
  readonly onBonus?: () => void;
  /** The page 「繼續」 would open (the bookmark) */
  readonly resumeId: Id;
  /** The back button's word: 「封面」 from the cover, 「繼續」 over a page */
  readonly backLabel: string;
  readonly onBack: () => void;
  readonly onStation: (chapter: number) => void;
  readonly onPlay: (id: Id) => void;
}

/** Station centres on the map sheet (CSS px), in chapter order: a serpentine of four rows. */
export const STATIONS: readonly (readonly [number, number])[] = [
  [62, 62], [181, 62], [300, 62],
  [300, 158], [181, 158], [62, 158],
  [62, 254], [181, 254], [300, 254],
  [300, 350], [181, 350],
];

/** An open station's landmark medallion (#193, D-103): its radius on the map, CSS px. */
const MEDAL_R = 18;
/** The screen art key of a station's medallion (`env/art/vignettes.ts`). */
export const stationMedal = (chapter: number): string => `vignette-map-${chapter}`;
const medal = (chapter: number): string | undefined => screenImage(stationMedal(chapter))?.url;

/**
 * An open station drawn with its landmark (#193): the baked medallion (the landmark against the
 * chapter's night) in a ring — foil when every page is solved, cream with the ribbon's red edge
 * when open — and the chapter's number on a little foil tag at its shoulder.
 */
function StationMedal({ chapter, done, url }: { chapter: number; done: boolean; url: string }) {
  const r = MEDAL_R;
  return (
    <g data-station-medal={chapter}>
      <image href={url} x={-r - 1} y={-r - 1} width={2 * r + 2} height={2 * r + 2} />
      <circle r={r} fill="none" stroke={done ? C.goldDeep : C.ribbonDeep} strokeWidth={2.6} />
      <circle r={r - 2} fill="none" stroke={done ? C.goldLight : C.standeeCard} strokeWidth={1.4} opacity={0.9} />
      <g transform={`translate(${-r + 2} ${-r + 3})`}>
        <circle r={8.5} fill={done ? C.goldLight : C.standeeCard} stroke={done ? C.goldDeep : C.ribbonDeep} strokeWidth={1.6} />
        <text data-art-text="" y={chapter === 0 ? 4 : 4.4} textAnchor="middle" fontFamily={chapter === 0 ? "'Noto Serif TC'" : 'Fredoka'} fontWeight={chapter === 0 ? 900 : 700} fontSize={chapter === 0 ? 10 : chapter === 10 ? 10 : 12} fill={done ? C.foilInk : C.sealInk}>
          {chapter === 0 ? '序' : chapter}
        </text>
      </g>
    </g>
  );
}

/** The bonus postcard's place on the map: the serpentine's free slot, past 101 (#113). */
export const BONUS_AT: readonly [number, number] = [62, 350];

/** The 月亮線 ribbon through the stations, with a U-turn at each row's end. */
export const ROUTE = 'M62 62H300A48 48 0 0 1 300 158H62A48 48 0 0 0 62 254H300A48 48 0 0 1 300 350H181';

/** The route's length up to station `i` (straight runs of 119, U-turns of 48π). */
export function routeLength(i: number): number {
  const turn = Math.PI * 48;
  // Each row holds three stations two runs apart; a turn joins rows
  const row = Math.floor(i / 3);
  const inRow = i % 3;
  return row * (2 * 119 + turn) + inRow * 119;
}

/** The page id a chapter's page would have (`c1p2`); the registry decides whether it exists. */
export const pageIdOf = (chapter: number, index: number): Id => `c${chapter}p${index}`;

/** Stickers collected in a chapter: 解開, 淘氣 and 土地公 on each of its pages. */
export function collected(save: SaveV1, chapter: number): number {
  let n = 0;
  for (let i = 1; i <= chapterInfo(chapter).pages; i++) {
    const r = save.pages[pageIdOf(chapter, i)];
    n += (r?.solved ? 1 : 0) + (r?.mischief ? 1 : 0) + (r?.tudigong ? 1 : 0);
  }
  return n;
}

/** Every page of the chapter solved. */
export function chapterComplete(save: SaveV1, chapter: number): boolean {
  const { pages } = chapterInfo(chapter);
  return Array.from({ length: pages }, (_, i) => save.pages[pageIdOf(chapter, i + 1)]?.solved === true).every(Boolean);
}

type PageCard = { readonly index: number; readonly id: Id; readonly def?: PageDef; readonly open: boolean; readonly solved: boolean; readonly mischief: boolean; readonly tudigong: boolean; readonly title?: string; readonly mark?: string };

function pageCard(save: SaveV1, reg: PageRegistry, chapter: number, index: number, mark?: string): PageCard {
  const id = pageIdOf(chapter, index);
  const def = reg.pageById(id);
  const r = save.pages[id];
  return {
    index,
    id,
    def,
    open: def !== undefined && isUnlocked(save, id, reg),
    solved: r?.solved === true,
    mischief: r?.mischief === true,
    tudigong: r?.tudigong === true,
    title: def?.title ?? chapterInfo(chapter).pageTitles?.[index - 1],
    mark,
  };
}

/** A station's strip: its pages; 家 (the prologue's) ends with page E 「抓周」, the morning at home (#135). */
function pageCards(save: SaveV1, reg: PageRegistry, chapter: number): PageCard[] {
  const cards = Array.from({ length: chapterInfo(chapter).pages }, (_, i) => pageCard(save, reg, chapter, i + 1));
  if (chapter === 0 && reg.pageById(pageIdOf(ENDING_CHAPTER, 1)) !== undefined) cards.push(pageCard(save, reg, ENDING_CHAPTER, 1, chapterName(ENDING_CHAPTER)));
  return cards;
}

/** The 花磚 endpaper behind the 目錄 (bible § 3.1: the menu background), dimmed so the map leads. */
export function Endpaper() {
  const ids = useSvgIds('endpaper');
  const ctx = useMemo(() => ({ ...kitCtx('endpaper'), id: ids }), [ids]);
  return (
    <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
      <g dangerouslySetInnerHTML={{ __html: kitDefs(ctx, ['tiles', 'vign']) }} />
      <rect width="100%" height="100%" fill={`url(#${ctx.id('tiles')})`} />
      <rect width="100%" height="100%" fill={C.coverDark} opacity={0.58} />
      <rect width="100%" height="100%" fill={`url(#${ctx.id('vign')})`} />
    </svg>
  );
}

export function Contents({ save, registry: reg, chapter, locked, bonus = false, bonusOpen = false, onBonus, resumeId, backLabel, onBack, onStation, onPlay }: ContentsProps) {
  const sheet = screenImage('map-sheet');
  const head = useMemo(() => {
    const def = spriteDef('baokaka-head-happy');
    return { url: frameUrl(def.files[0], deviceScale()), w: def.size[0], h: def.size[1] };
  }, []);
  // The open stations' landmark medallions (#193) load with the map
  const medals = useMemo(() => STATIONS.map((_, ch) => ch).filter((ch) => isChapterUnlocked(save, ch, reg) && screenImage(stationMedal(ch)) !== null).map(stationMedal), [save, reg]);
  const ready = useScreenReady(['map-sheet', ...medals], head.url ? [head.url] : []);
  // Page E is listed on 家's strip (#135): its bookmark is 家's station
  const resumeChapter = stationOf(reg.chapterOf(resumeId) ?? 0);
  // How far the line runs: to the furthest open station
  const reach = CHAPTERS.filter((c) => isChapterUnlocked(save, c.chapter, reg)).reduce((n, c) => Math.max(n, c.chapter), 0);
  const showBonus = bonus && bonusOpen;
  const shown = locked ?? chapter;
  const info = chapterInfo(shown);
  const cards = useMemo(() => pageCards(save, reg, chapter), [save, reg, chapter]);
  // The bonus page's card (#135): open once the postcard is (every 土地公)
  const bonusCards = useMemo(() => reg.bonus.map((def) => ({ ...pageCard(save, reg, def.chapter, def.index, chapterName(def.chapter)), open: bonus && isUnlocked(save, def.id, reg) })), [save, reg, bonus]);
  const total = routeLength(STATIONS.length - 1) + 119;
  const big = useTextScale() > 1;

  return (
    <main
      className="fixed inset-0 select-none overflow-y-auto overflow-x-hidden font-body"
      lang="zh-Hant"
      style={{ backgroundColor: C.coverDark, color: C.ink }}
      data-screen="contents"
      data-chapter={chapter}
      data-screen-ready={ready ? '' : undefined}
    >
      <Endpaper />
      <div className="relative mx-auto flex w-full max-w-[390px] flex-col items-center px-[14px] pb-6 pt-3">
        <header className="flex w-full items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            data-button="back"
            className="kit-press flex min-h-[56px] items-center gap-1 rounded-[12px] pl-1 pr-3"
            style={{ ...CREAM_CARD, WebkitTapHighlightColor: 'transparent' }}
          >
            <BackIcon />
            <span className="whitespace-nowrap text-[20px] font-black tracking-[0.1em]">{backLabel}</span>
          </button>
          <h1
            // 大字 (#104): a little less tracking, so the title stays on one line
            className={`ml-auto mr-auto -rotate-[0.8deg] whitespace-nowrap rounded-[3px] py-1 font-serif text-[30px] font-black ${big ? 'px-5 tracking-[0.25em]' : 'px-7 tracking-[0.4em]'}`}
            style={{ ...CREAM_CARD, boxShadow: cardShadow(0.8) }}
          >
            {UI.contents.title}
          </h1>
          <span className="w-[56px]" aria-hidden="true" />
        </header>

        {/* The paper map of the 月亮線 */}
        <div className="relative mt-3" style={{ width: MAP_SHEET.w, height: MAP_SHEET.h, maxWidth: '100%' }}>
          {sheet && <img src={sheet.url} alt="" width={MAP_SHEET.w} height={MAP_SHEET.h} className="absolute inset-0 block" draggable={false} />}
          <svg className="absolute inset-0" width={MAP_SHEET.w} height={MAP_SHEET.h} viewBox={`0 0 ${MAP_SHEET.w} ${MAP_SHEET.h}`} aria-hidden="true">
            {/* The line not open yet: a faint dotted ribbon */}
            <path d={ROUTE} fill="none" stroke={withAlpha(C.ribbonDeep, 0.35)} strokeWidth={5} strokeDasharray="2 7" strokeLinecap="round" />
            {/* The open line: a red ribbon with its fold and a stitched centre */}
            <g strokeDasharray={`${routeLength(reach)} ${total}`} fill="none" strokeLinecap="round">
              <path d={ROUTE} stroke={C.ribbonDeep} strokeWidth={10} transform="translate(.8 1.6)" opacity={0.45} />
              <path d={ROUTE} stroke={C.ribbon} strokeWidth={8} />
              <path d={ROUTE} stroke={C.cutRim} strokeWidth={1} strokeDasharray="3 4" opacity={0.6} />
            </g>
            {STATIONS.map(([x, y], ch) => {
              const open = isChapterUnlocked(save, ch, reg);
              const done = open && chapterComplete(save, ch);
              const selected = ch === shown && !showBonus;
              return (
                <g key={ch} transform={`translate(${x} ${y})`} data-station={ch} data-open={open ? '' : undefined} data-complete={done ? '' : undefined}>
                  {selected && <circle r={open && medal(ch) ? MEDAL_R + 6 : 24} fill="none" stroke={C.gold} strokeWidth={3} opacity={0.9} />}
                  <circle r={open && medal(ch) ? MEDAL_R : 16} cx={1} cy={2.5} fill={C.shadow} opacity={0.35} />
                  {open && medal(ch) ? (
                    <StationMedal chapter={ch} done={done} url={medal(ch)!} />
                  ) : open ? (
                    <>
                      <circle r={16} fill={done ? C.goldLight : C.standeeCard} stroke={done ? C.goldDeep : C.ribbonDeep} strokeWidth={2.4} />
                      <circle r={11.5} fill="none" stroke={done ? C.goldDeep : C.gold} strokeWidth={1.2} strokeDasharray={done ? undefined : '2 2.5'} />
                      <text data-art-text="" y={6.5} textAnchor="middle" fontFamily={ch === 0 ? "'Noto Serif TC'" : 'Fredoka'} fontWeight={ch === 0 ? 900 : 700} fontSize={ch === 0 ? 16 : 17} fill={done ? C.foilInk : C.sealInk}>
                        {ch === 0 ? '序' : ch}
                      </text>
                    </>
                  ) : (
                    <>
                      <circle r={16} fill={C.sticker} />
                      <circle r={16} cy={1.2} fill="none" stroke={C.stickerRim} strokeWidth={1.2} />
                      <g transform="translate(-8 -8) scale(.8)" dangerouslySetInnerHTML={{ __html: `<path d="M6 9V6.5a4 4 0 0 1 8 0V9" fill="none" stroke="${C.stickerLabel}" stroke-width="2"/><rect x="4" y="9" width="12" height="9" rx="2" fill="${C.stickerLabel}"/>` }} />
                    </>
                  )}
                  {ch === resumeChapter && head.url && (
                    <g transform="translate(13 -30) rotate(8)" data-here="">
                      <circle r={14} fill={C.standeeCard} stroke={C.standeeCut} strokeWidth={0.8} />
                      <clipPath id={`here-${ch}`}>
                        <circle r={12.5} />
                      </clipPath>
                      <image href={head.url} x={-head.w * 0.17} y={-12} width={head.w * 0.34} height={head.h * 0.34} clipPath={`url(#here-${ch})`} />
                    </g>
                  )}
                </g>
              );
            })}
            {bonus && <BonusPostcard selected={showBonus} />}
          </svg>
          {/* The stations as buttons: their names and sticker counts are live text on the map */}
          {STATIONS.map(([x, y], ch) => {
            const c = chapterInfo(ch);
            const open = isChapterUnlocked(save, ch, reg);
            return (
              <button
                key={ch}
                type="button"
                onClick={() => onStation(ch)}
                aria-label={`${chapterName(ch)} ${c.landmark}${open ? `，${UI.contents.collected} ${collected(save, ch)}／${stickersIn(ch)}` : ''}`}
                aria-pressed={ch === shown && !showBonus}
                data-button={`station-${ch}`}
                className="absolute flex flex-col items-center"
                style={{ left: x - 50, top: y - 22, width: 100, minHeight: 88, WebkitTapHighlightColor: 'transparent' }}
              >
                {/* Its icon is the station drawn on the map right here (its landmark medallion, or the lock) */}
                <span className="h-[40px]" aria-hidden="true" data-icon="" />
                <span className="whitespace-nowrap rounded-[4px] px-[3px] text-[20px] font-black leading-[24px]" style={{ color: C.ink, backgroundColor: withAlpha(C.page, 0.88) }}>
                  {c.station}
                </span>
                {/* An opaque chip: seal ink on the page is 7.5:1; through an 88 % chip the map dropped it to 6.9:1 */}
                {open && (
                  <span className="rounded-[4px] px-[3px] font-num text-[20px] font-semibold leading-[22px]" style={{ color: C.sealInk, backgroundColor: C.page }}>
                    {collected(save, ch)}/{stickersIn(ch)}
                  </span>
                )}
              </button>
            );
          })}
          {bonus && (
            <button
              type="button"
              onClick={onBonus}
              aria-pressed={showBonus}
              data-button="bonus"
              className="absolute flex flex-col items-center"
              style={{ left: BONUS_AT[0] - 54, top: BONUS_AT[1] - 30, width: 108, minHeight: 92, WebkitTapHighlightColor: 'transparent' }}
            >
              <span className="h-[50px]" aria-hidden="true" data-icon="" />
              <span className="whitespace-nowrap rounded-[4px] px-[3px] text-[20px] font-black leading-[24px]" style={{ color: C.ink, backgroundColor: withAlpha(C.page, 0.88) }}>
                {UI.bonus}
              </span>
            </button>
          )}
        </div>

        {/* The chapter's card: its name, the stickers collected, the page strip (or the locked line) */}
        {showBonus ? (
          /* 「象山的日出」 (#135): its page, to play — or, before it is built, the 未完待續 line */
          <section className="relative mt-3 w-full rounded-[10px] px-3 pb-3 pt-2" style={CREAM_CARD} data-panel="bonus" aria-live="polite">
            <h2 className="flex items-baseline gap-2">
              <span className="text-[20px] font-black" style={{ color: C.sealInk }}>
                {chapterName(BONUS_CHAPTER)}
              </span>
              <span className="font-serif text-[24px] font-black tracking-[0.06em]">{UI.bonus}</span>
            </h2>
            {bonusCards.length > 0 ? (
              <>
                <p className="text-[20px] font-bold" style={{ color: C.inkSoft }}>
                  {chapterInfo(BONUS_CHAPTER).landmark} · {chapterInfo(BONUS_CHAPTER).time}
                </p>
                <ol className="mt-2 flex gap-[4px]" data-strip="">
                  {bonusCards.map((card) => (
                    <li key={card.id}>
                      <PageThumb card={card} current={false} onPlay={onPlay} />
                    </li>
                  ))}
                </ol>
                <MischiefList cards={bonusCards} />
              </>
            ) : (
              <p className="mt-2 flex items-center gap-2 rounded-[8px] px-3 py-3 text-[20px] font-bold" style={{ backgroundColor: C.pageDark }} data-bonus-line="">
                <svg width={28} height={28} viewBox="-14 -14 28 28" aria-hidden="true" className="shrink-0">
                  <path d="M-11 5a11 11 0 0 1 22 0z" fill={C.gold} stroke={C.goldDeep} strokeWidth={1.2} />
                  <path d="M-13 6H13" stroke={C.ink} strokeWidth={2} strokeLinecap="round" />
                  <path d="M0 -12v3M-9 -8l2 2M9 -8l-2 2" stroke={C.goldDeep} strokeWidth={2} strokeLinecap="round" />
                </svg>
                {loadLine(SOON_LINES[0])?.text}
              </p>
            )}
          </section>
        ) : (
        <section className="relative mt-3 w-full rounded-[10px] px-3 pb-3 pt-2" style={CREAM_CARD} data-panel={shown} aria-live="polite">
          <h2 className="flex items-baseline gap-2">
            <span className="text-[20px] font-black" style={{ color: C.sealInk }}>
              {chapterName(shown)}
            </span>
            <span className="font-serif text-[24px] font-black tracking-[0.06em]">{info.title}</span>
          </h2>
          {locked !== undefined ? (
            <p className="mt-2 flex items-center gap-2 rounded-[8px] px-3 py-3 text-[20px] font-bold" style={{ backgroundColor: C.pageDark }} data-locked-line="">
              <LockIcon size={24} color={C.ink} />
              {UI.contents.locked}
            </p>
          ) : (
            <>
              <p className="text-[20px] font-bold" style={{ color: C.inkSoft }}>
                {info.landmark} · {UI.contents.collected} <span className="font-num font-semibold">{collected(save, shown)}／{stickersIn(shown)}</span>
              </p>
              <ol className="mt-2 flex justify-between gap-[4px]" data-strip="">
                {cards.map((card) => (
                  <li key={card.id}>
                    <PageThumb card={card} current={card.id === resumeId} onPlay={onPlay} />
                  </li>
                ))}
              </ol>
              <MischiefList cards={cards} />
            </>
          )}
        </section>
        )}
      </div>
    </main>
  );
}

/**
 * The 「象山的日出」 postcard (#113): taped onto the map's free corner, tilted, the sun coming up
 * behind 象山's hump with the city's lights below; a dotted gold branch runs to it from 101.
 */
function BonusPostcard({ selected }: { selected: boolean }) {
  const [x, y] = BONUS_AT;
  const [tx] = STATIONS[10];
  const w = 62;
  const h = 46;
  return (
    <g data-bonus="">
      <path d={`M${tx - 18} ${y}H${x + w / 2 + 6}`} fill="none" stroke={C.goldDeep} strokeWidth={3} strokeDasharray="1 6" strokeLinecap="round" />
      <g transform={`translate(${x} ${y - 6}) rotate(-5)`}>
        {selected && <rect x={-w / 2 - 6} y={-h / 2 - 6} width={w + 12} height={h + 12} rx={6} fill="none" stroke={C.gold} strokeWidth={3} opacity={0.9} />}
        <rect x={-w / 2 + 1.5} y={-h / 2 + 3} width={w} height={h} rx={2} fill={C.shadow} opacity={0.35} />
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={2} fill={C.standeeCard} />
        <clipPath id="bonus-pic">
          <rect x={-w / 2 + 3} y={-h / 2 + 3} width={w - 6} height={h - 6} />
        </clipPath>
        <g clipPath="url(#bonus-pic)">
          <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={C.peonyLight} />
          <rect x={-w / 2} y={-h / 2} width={w} height={h * 0.35} fill={C.nightCard} opacity={0.85} />
          <circle cx={6} cy={2} r={9} fill={C.goldLight} stroke={C.gold} strokeWidth={1.5} />
          <path d={`M${-w / 2} 8Q-12 -9 0 1Q8 6 14 3Q20 0 ${w / 2} 6V${h / 2}H${-w / 2}Z`} fill={C.sticker} />
          <path d={`M${-w / 2} 13H${w / 2}V${h / 2}H${-w / 2}Z`} fill={C.stickerDeep} />
          <path d="M16 13V-3h2V13M21 13V4h2V13" fill={C.stickerDeep} />
          <g fill={C.lamp}>
            <circle cx={-18} cy={15.5} r={0.9} /><circle cx={-11} cy={16} r={0.9} /><circle cx={-3} cy={15.5} r={0.9} /><circle cx={7} cy={16} r={0.9} /><circle cx={14} cy={15.5} r={0.9} />
          </g>
        </g>
        <rect x={-10} y={-h / 2 - 5} width={22} height={9} fill={C.washiCeladon} opacity={0.85} transform="rotate(4)" />
      </g>
    </g>
  );
}

/** One page in the strip: the page as a little card (its baked backdrop), its number under it. */
function PageThumb({ card, current, onPlay }: { card: PageCard; current: boolean; onPlay: (id: Id) => void }) {
  const W = 48;
  const H = 66;
  const bg = card.def ? backdropImage(card.def.backdrop) : null;
  // The backdrop covers the page's view box (x −30…420 in page units): show the page itself
  const k = W / 390;
  const thumb = card.open && bg !== null
    ? { backgroundImage: `url(${bg.url})`, backgroundSize: `${bg.box.w * k}px ${bg.box.h * k}px`, backgroundPosition: `${bg.box.x * k}px ${bg.box.y * k}px`, backgroundColor: C.nightCard }
    : { backgroundColor: C.kraft, backgroundImage: `repeating-linear-gradient(35deg, ${withAlpha(C.kraftFiber, 0.12)} 0 2px, transparent 2px 7px)` };
  return (
    <button
      type="button"
      disabled={!card.open}
      onClick={() => onPlay(card.id)}
      aria-label={`${card.mark ?? card.index}${card.title ? `「${card.title}」` : ''}${card.solved ? '，解開' : ''}${card.open ? '' : '，還沒開'}`}
      data-page-card={card.id}
      data-solved={card.solved ? '' : undefined}
      data-current={current ? '' : undefined}
      className="kit-press flex min-w-[48px] flex-col items-center gap-[6px]"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <span className="relative block rounded-[3px]" data-icon="" style={{ width: W, height: H, ...thumb, boxShadow: cardShadow(0.45), outline: `1.5px solid ${card.open ? C.standeeCard : C.kraftDark}`, outlineOffset: -1.5 }}>
        {!card.open && (
          <span className="absolute inset-0 flex items-center justify-center">
            <LockIcon size={22} color={C.ink} />
          </span>
        )}
        {current && (
          <svg className="absolute -top-[4px] right-[5px]" width="12" height="26" viewBox="0 0 12 26" aria-hidden="true" data-bookmark="">
            <path d="M0 0H12V26L6 20L0 26Z" fill={C.ribbon} />
            <path d="M0 0H12V4H0Z" fill={C.ribbonDeep} opacity={0.6} />
          </svg>
        )}
        {card.solved && (
          <svg className="absolute -bottom-[6px] -right-[6px]" width="40" height="22" viewBox="0 0 40 22" aria-hidden="true" data-stickers-earned="">
            {card.tudigong && (
              <g transform="translate(9 11)">
                <circle r={8.5} fill={C.goldLight} stroke={C.goldDeep} strokeWidth={1} />
                <path d="M-5 0a5 5 0 0 1 10 0z" fill={C.hatRed} />
              </g>
            )}
            {card.mischief && (
              <g transform="translate(19 11)">
                <circle r={8.5} fill={C.goldLight} stroke={C.goldDeep} strokeWidth={1} />
                <path d="M-4 -1q4 5 8 0" fill="none" stroke={C.foilInk} strokeWidth={1.8} strokeLinecap="round" />
              </g>
            )}
            <g transform="translate(30 11)">
              <circle r={9.5} fill={C.doneGreen} stroke={C.standeeCard} strokeWidth={1.6} />
              <path d="M-4.5 0l3 3l6 -6.5" fill="none" stroke={C.standeeCard} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </svg>
        )}
      </span>
      <span className={`${card.mark ? 'font-body font-black' : 'font-num font-semibold'} whitespace-nowrap text-[20px] leading-[24px]`} style={{ color: C.ink }}>
        {card.mark ?? card.index}
      </span>
    </button>
  );
}

/** The chapter's 淘氣, for its solved pages only (GDD § 2.8: shown after the first completion). */
function MischiefList({ cards }: { cards: readonly PageCard[] }) {
  const rows = cards.filter((c) => c.solved && c.def !== undefined);
  if (rows.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-col gap-[6px] border-t-[1.5px] border-dashed pt-2" style={{ borderColor: C.pageEdge }} aria-label={UI.contents.mischief} data-mischief-list="">
      {rows.map((card) => (
        <li key={card.id} className="flex items-center gap-2" data-mischief={card.id} data-earned={card.mischief ? '' : undefined}>
          <svg width={30} height={30} viewBox="-15 -15 30 30" aria-hidden="true" className="shrink-0">
            {card.mischief ? (
              <>
                <circle r={13} fill={C.goldLight} stroke={C.goldDeep} strokeWidth={1.2} />
                <text data-art-text="" y={5} textAnchor="middle" fontFamily="'Noto Serif TC'" fontWeight={900} fontSize={14} fill={C.foilInk}>
                  嘿
                </text>
              </>
            ) : (
              <>
                <circle r={13} fill={C.pageDark} />
                <circle r={10.5} fill="none" stroke={C.dimpleShade} strokeWidth={1.4} strokeDasharray="2.5 3" />
                <text data-art-text="" y={5} textAnchor="middle" fontFamily="'Noto Serif TC'" fontWeight={900} fontSize={14} fill={C.dimpleShade}>
                  嘿
                </text>
              </>
            )}
          </svg>
          <span className="whitespace-nowrap font-num text-[20px] font-semibold leading-[24px]" style={{ color: C.ink }}>
            {card.mark ?? card.index}
          </span>
          <span className="text-[20px] font-bold leading-[24px]" style={{ color: card.mischief ? C.ink : C.inkSoft }}>
            <span className="sr-only">{`${UI.contents.mischief}：`}</span>
            {card.def!.mischief.text}
          </span>
        </li>
      ))}
    </ul>
  );
}
