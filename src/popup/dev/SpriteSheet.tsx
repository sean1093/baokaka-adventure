import { POPUP, PAGELAB } from '../../art/palette';
import { SpriteAnim, spriteDef, spriteTransform, toPage, useSpritesPreload, type Facing, type SpriteId } from '../sprites';

/**
 * The `sprites-anchors` fixture (#94): the baked character sprites at map scale on the paper
 * night, each with its debug marks — the frame box (dashed), the foot anchor (a cross on the
 * floor line), the head (the bubble anchor, a ring) and the footprint under the floor ellipse.
 * Mirrored pairs stand beside each other so a reviewer sees the foot point hold still when a frame
 * flips. `SpriteMarks` is also PageLab's `anchors` overlay. Nothing on it is touchable, so it is
 * marked `data-specimen-hitless` (`check:ui` then doesn't insist on a hit layer).
 */

export function SpriteMarks({ sprite, facing = 'r', x, y, scale = 1 }: { sprite: SpriteId; facing?: Facing; x: number; y: number; scale?: number }) {
  const def = spriteDef(sprite);
  const s = scale * def.mapScale;
  const head = toPage(def, facing, x, y, def.head, s);
  const f0 = toPage(def, facing, x, y, [def.foot[0], def.anchor[1]], s)[0];
  const f1 = toPage(def, facing, x, y, [def.foot[1], def.anchor[1]], s)[0];
  const mark = (stroke: string, w: number, children: JSX.Element) => (
    <>
      <g stroke={PAGELAB.halo} strokeWidth={w + 2} fill="none" opacity={0.8}>
        {children}
      </g>
      <g stroke={stroke} strokeWidth={w} fill="none">
        {children}
      </g>
    </>
  );
  return (
    <g data-sprite-marks={sprite} pointerEvents="none">
      <g transform={spriteTransform(def, facing, x, y, s)}>
        <rect width={def.size[0]} height={def.size[1]} fill="none" stroke={PAGELAB.jump} strokeWidth={1 / s} strokeDasharray={`${3 / s} ${2 / s}`} />
      </g>
      {mark(PAGELAB.squeeze, 1.5, <line x1={f0} y1={y + 3} x2={f1} y2={y + 3} />)}
      {mark(PAGELAB.target, 1.6, <path d={`M${x - 5} ${y}H${x + 5}M${x} ${y - 5}V${y + 5}`} />)}
      {mark(PAGELAB.cruise, 1.6, <circle cx={head[0]} cy={head[1]} r={3.5} />)}
    </g>
  );
}

interface Cell {
  readonly sprite: SpriteId;
  readonly facing?: Facing;
  readonly x: number;
  readonly frame?: number;
}

/** Rows of the sheet: a caption, a floor line, the cells (x is the anchor's x). */
const ROWS: readonly { caption: string; en: string; h: number; cells: readonly Cell[] }[] = [
  {
    caption: '立繪・頭像',
    en: 'stills ⇄',
    h: 118,
    cells: [
      { sprite: 'baokaka-stand', x: 40 },
      { sprite: 'baokaka-stand', facing: 'l', x: 104 },
      { sprite: 'mocha-sit', x: 166 },
      { sprite: 'mocha-sit', facing: 'l', x: 214 },
      { sprite: 'baokaka-head-happy', x: 270 },
      { sprite: 'mocha-head-content', x: 322 },
    ],
  },
  {
    caption: '寶咖咖',
    en: 'crawl ⇄, reach, cry',
    h: 130,
    cells: [
      { sprite: 'baokaka.crawl', x: 50 },
      { sprite: 'baokaka.crawl', facing: 'l', x: 140 },
      { sprite: 'baokaka.reach', x: 228 },
      { sprite: 'baokaka.cry', facing: 'l', x: 310 },
    ],
  },
  {
    caption: '摩卡',
    en: 'sit ⇄, jump, loaf, push',
    h: 90,
    cells: [
      { sprite: 'mocha.sit', x: 28 },
      { sprite: 'mocha.sit', facing: 'l', x: 96 },
      { sprite: 'mocha.jump', x: 172 },
      { sprite: 'mocha.loaf', x: 252 },
      { sprite: 'mocha.push', facing: 'l', x: 327 },
    ],
  },
];

/** Every sprite the sheet draws (its preload). */
export const SHEET_SPRITES = [...new Set(ROWS.flatMap((r) => r.cells.map((c) => c.sprite)))];

export function SpritesAnchorsSheet({ still }: { still: boolean }) {
  const ready = useSpritesPreload(SHEET_SPRITES);
  return (
    <main className="min-h-dvh px-4 pb-6 pt-4 font-body" style={{ background: POPUP.cover, color: POPUP.goldLight }} data-sprites={ready ? 'ready' : 'loading'} data-specimen-hitless="">
      <h1 className="text-[22px] font-bold leading-tight">角色貼紙 · 錨點</h1>
      <p className="mb-2 text-[20px] leading-tight" style={{ color: POPUP.stickerLabel }}>
        ✚ 腳 · ○ 頭 · ━ 腳印
      </p>
      {ROWS.map((row) => (
        <figure key={row.caption} className="mb-2">
          <svg viewBox={`0 0 358 ${row.h}`} className="block h-auto w-full" data-page="sprites-anchors" role="img" aria-label={`${row.caption} ${row.en}`}>
            <rect width={358} height={row.h} rx={6} fill={POPUP.nightCardDeep} />
            <rect y={row.h - 16} width={358} height={16} rx={0} fill={POPUP.nightCard} />
            {row.cells.map((c, i) => (
              <SpriteAnim key={`a${i}`} sprite={c.sprite} facing={c.facing} x={c.x} y={row.h - 16} playing={!still} />
            ))}
            {row.cells.map((c, i) => (
              <SpriteMarks key={`m${i}`} sprite={c.sprite} facing={c.facing} x={c.x} y={row.h - 16} />
            ))}
          </svg>
          <figcaption className="text-[20px] leading-tight">
            {row.caption} <span style={{ color: POPUP.stickerLabel }}>{row.en}</span>
          </figcaption>
        </figure>
      ))}
    </main>
  );
}
