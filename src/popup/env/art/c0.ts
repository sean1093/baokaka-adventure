import { POPUP as C, POPUP_HOME as H, POPUP_STAGE as S, mixHex } from '../../../art/palette';
import { depth, f1, pageBlock, pinholes, ref, skyline, softEllipse, type KitCtx } from '../../art';
import { FLOOR_BOTTOM, GUTTER_Y, PAGE_W, floorWiden } from '../../view/geometry';
import type { BackdropDraw, PartSource } from '../sources';
import { bookCues, bunting, calmMoon, floorPage, homeDefs, homeFloor, lin, paperFibres, shushuPeek, sleepingCat, standingPage, wainscot, wallpaper } from './common';

/**
 * 序章 home (#108; bible § 6 row 序): the prologue's four pages at 00:00, the night before the 度晬.
 * Warm wood, washi and 花布 under lamp amber; the indigo night at the windows; the street's little
 * 土地公 shrine lit across the lane. Baked by `npm run bake:popup`; the ledges (巧拼 play-mat tiles,
 * the crib's mattress) and perch furniture are the live stage, dressed by `view/art/dress.ts`.
 */

const BUNTING = [H.feltPink, H.matCream, H.feltBlue, H.feltMint, H.matLilac];

/** The page block under the floor page (a thick old book). */
const block = () => {
  const w = floorWiden(FLOOR_BOTTOM);
  return pageBlock(-w, PAGE_W + w, FLOOR_BOTTOM);
};

/**
 * A window onto the night lane: a sky, the far skyline, low houses across the street and the
 * little 土地公 shrine (a red-roofed niche with two lanterns) whose niche is centred on `shrine`.
 * Clipped to the glass; `extra` is drawn in the view (the moon, 咻咻).
 */
function nightLane(ctx: KitCtx, g: { x: number; y: number; w: number; h: number }, shrine: readonly [number, number], extra = '', seed = 7): string {
  const id = ctx.id(`lane${seed}`);
  const base = g.y + g.h;
  const sk = skyline(g.x - 6, g.x + g.w + 6, base - 24, seed, { minH: 10, maxH: 46, winP: 0.1, winOpacity: 0.55 });
  const [sx, sy] = shrine;
  // The houses across the lane: flat roofs with water tanks, an iron-grille balcony, a few lit windows
  const houses = `<path d="M${g.x - 4} ${base}V${sy - 4}h${f1(sx - g.x - 22)}v-8h10v8h4V${base}Z M${sx + 26} ${base}V${sy - 14}h${f1(g.x + g.w - sx - 22)}V${base}Z" fill="${H.street}"/>`
    + `<path d="M${sx + 34} ${sy - 4}h14v10h-14zM${g.x + 6} ${sy + 4}h12v9h-12z" fill="${ref(ctx, 'window')}" opacity=".7"/>`
    + `<path d="M${sx + 32} ${sy + 18}h22M${sx + 32} ${sy + 24}h22${Array.from({ length: 6 }, (_, i) => `M${sx + 33 + i * 4} ${sy + 16}v10`).join('')}" stroke="${H.streetLit}" stroke-width="1"/>`;
  // The shrine: a stone base, a cream niche lit warm, a curved red roof with upturned eaves, two lanterns
  const roof = `M${sx - 20} ${sy - 12}q6 -2 9 -8h22q3 6 9 8q-4 1 -6 3h-28q-2 -2 -6 -3z`;
  const shrineSvg = softEllipse(ctx, sx, sy, 26, 20, 'lamp', 0.22, 'blur8')
    + depth(ctx, 2, `<rect x="${sx - 15}" y="${sy - 9}" width="30" height="25" fill="${H.shrineWall}"/><rect x="${sx - 11}" y="${sy - 6}" width="22" height="19" rx="2" fill="${ref(ctx, 'window')}"/>`
      + `<path d="${roof}" fill="${H.shrineRoof}"/><path d="M${sx - 11} ${sy - 20}h22" stroke="${C.ochre}" stroke-width="1.2"/>`
      + `<rect x="${sx - 18}" y="${sy + 16}" width="36" height="5" fill="${mixHex(H.shrineWall, C.shadow, 0.3)}"/>`, `<path d="${roof}"/><rect x="${sx - 15}" y="${sy - 9}" width="30" height="30"/>`)
    + [sx - 18, sx + 18].map((lx) => `<path d="M${lx} ${sy - 9}v3" stroke="${C.printDark}" stroke-width=".8"/><ellipse cx="${lx}" cy="${sy - 2}" rx="3.2" ry="4" fill="${H.lantern}"/><ellipse cx="${lx - 1}" cy="${sy - 3}" rx="1" ry="1.6" fill="${C.lampHot}" opacity=".7"/>`).join('');
  const street = `<rect x="${g.x}" y="${base - 6}" width="${g.w}" height="6" fill="${H.streetLit}"/>`;
  return `<clipPath id="${id}"><rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}"/></clipPath>`
    + `<g clip-path="url(#${id})"><rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" fill="${ref(ctx, 'sky')}"/>`
    + pinholes(ctx, g.x, g.y, g.w, g.h * 0.6, Math.round(g.w / 6), seed + 2)
    + extra
    + `<path d="${sk.d}" fill="${mixHex(H.street, C.shadow, 0.25)}" opacity=".8"/>${sk.windows}`
    + houses + street + shrineSvg
    // The glass: a cool sheen and two diagonal glints
    + `<path d="M${g.x} ${g.y + g.h * 0.5}L${g.x + g.w * 0.45} ${g.y}H${g.x + g.w * 0.6}L${g.x} ${g.y + g.h * 0.8}Z" fill="${H.glass}" opacity=".08"/>`
    + `</g>`;
}

/** A wooden window frame round a glass rect, with muntins at `mx` / `my`, a sill below. */
function windowFrame(ctx: KitCtx, g: { x: number; y: number; w: number; h: number }, mx: number | null, my: number | null, sill = true): string {
  const t = 8;
  const outer = `M${g.x - t} ${g.y - t}h${g.w + 2 * t}v${g.h + 2 * t}h${-(g.w + 2 * t)}Z M${g.x} ${g.y}v${g.h}h${g.w}v${-g.h}Z`;
  const bars = (mx === null ? '' : `<rect x="${mx - 2.5}" y="${g.y}" width="5" height="${g.h}" fill="${H.teak}"/>`) + (my === null ? '' : `<rect x="${g.x}" y="${my - 2.5}" width="${g.w}" height="5" fill="${H.teak}"/>`);
  return depth(ctx, 2, `<path d="${outer}" fill="${ref(ctx, 'teakG')}" fill-rule="evenodd"/>${bars}`
    + `<path d="M${g.x - t} ${g.y - t + 0.6}h${g.w + 2 * t}" stroke="${C.cutRim}" stroke-width="1" opacity=".35"/>`
    + (sill ? `<rect x="${g.x - t - 8}" y="${g.y + g.h + t - 2}" width="${g.w + 2 * t + 16}" height="7" rx="2" fill="${H.wainscotLit}"/>` : ''), `<path d="${outer}" fill-rule="evenodd"/>`);
}

/** A tied-back 花布 curtain hanging from `top` at x, `w` wide and `h` long, gathered at `tie`; `dir` −1 mirrors. */
function tiedCurtain(ctx: KitCtx, x: number, top: number, w: number, h: number, tie: number, dir: 1 | -1): string {
  const d = `M0 0H${w}Q${w * 0.55} ${tie - top} ${w * 0.4} ${tie - top + 4}Q${w * 0.9} ${tie - top + 30} ${w * 0.8} ${h}H${-2}Q${w * 0.15} ${tie - top + 20} 0 0Z`;
  const pid = ctx.id(`curtPrint${f1(x)}`.replace('.', '_'));
  return `<defs><pattern id="${pid}" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="${H.floralGround}"/>`
    + `<circle cx="7" cy="7" r="4" fill="${H.floral}"/><circle cx="7" cy="7" r="1.6" fill="${H.floralLight}"/><path d="M12 9q4 -1 5 3q-4 1 -5 -3z" fill="${H.floralLeaf}"/>`
    + `<circle cx="17" cy="17" r="2.6" fill="${H.floralLight}" opacity=".8"/></pattern></defs>`
    + `<g transform="translate(${x} ${top}) scale(${dir} 1)">`
    + depth(ctx, 3, `<path d="${d}" fill="url(#${pid})"/><path d="M${w * 0.3} 4Q${w * 0.32} ${(tie - top) * 0.6} ${w * 0.42} ${tie - top}M${w * 0.6} 4Q${w * 0.55} ${(tie - top) * 0.6} ${w * 0.48} ${tie - top}" stroke="${C.shadow}" stroke-width="2" opacity=".25" fill="none"/>`
      + `<path d="${d}" fill="${C.shadow}" opacity=".18"/><rect x="${w * 0.28}" y="${tie - top}" width="${w * 0.3}" height="6" rx="3" fill="${C.ochre}"/>`, `<path d="${d}"/>`)
    + `</g>`;
}

/** A small table lamp with a washi shade, lit (its warm glow kept small for the squint test). */
function tableLamp(ctx: KitCtx, x: number, foot: number, s = 1): string {
  const shade = `M${-14 * s} ${-34 * s}h${28 * s}l${6 * s} ${20 * s}h${-40 * s}z`;
  return softEllipse(ctx, x, foot - 26 * s, 34 * s, 26 * s, 'lamp', 0.2, 'blur18')
    + `<g transform="translate(${x} ${foot})">`
    + depth(ctx, 3, `<path d="M${-8 * s} 0q0 ${-8 * s} ${8 * s} ${-8 * s}q${8 * s} 0 ${8 * s} ${8 * s}z" fill="${H.teak}"/><rect x="${-1.6 * s}" y="${-16 * s}" width="${3.2 * s}" height="${9 * s}" fill="${H.teakDeep}"/>`
      + `<path d="${shade}" fill="${H.shade}"/><path d="${shade}" fill="${C.lampHot}" opacity=".55"/>`, `<path d="${shade}"/>`)
    + `<path d="M${-12 * s} ${-16 * s}h${24 * s}" stroke="${C.lampAmber}" stroke-width="1.4" opacity=".6"/>`
    + `</g>`;
}

/** A little paper bath duck on the floor (a toy left out), its foot at (x, y). */
function rubberDuck(ctx: KitCtx, x: number, y: number): string {
  const d = 'M-14 0q-4 -12 6 -14q-2 -12 10 -12q10 0 9 10q6 0 8 -3q2 10 -6 15q-6 4 -27 4z';
  return softEllipse(ctx, x, y + 1, 18, 3, 'shadow', 0.4)
    + `<g transform="translate(${x} ${y})">` + depth(ctx, 4, `<path d="${d}" fill="${H.matCream}"/><path d="M8 -20l7 1l-6 3z" fill="${H.feltPink}"/><circle cx="4" cy="-19" r="1.2" fill="${C.ink}"/>`
      + `<path d="M-8 -6q6 4 14 -2" stroke="${mixHex(H.matCream, C.shadow, 0.3)}" stroke-width="1.4" fill="none"/>`, `<path d="${d}"/>`) + `</g>`;
}

/** A soft cloth ball in pastel segments, resting at (x, y). */
function floorBall(ctx: KitCtx, x: number, y: number): string {
  const r = 12;
  return softEllipse(ctx, x + 2, y + 1, 14, 3, 'shadow', 0.4)
    + depth(ctx, 4, `<circle cx="${x}" cy="${y - r}" r="${r}" fill="${H.feltBlue}"/><path d="M${x - r} ${y - r}q${r} -8 ${2 * r} 0q${-r} 8 ${-2 * r} 0z" fill="${H.feltMint}"/>`
      + `<path d="M${x} ${y - 2 * r}q-8 ${r} 0 ${2 * r}q8 ${-r} 0 ${-2 * r}z" fill="${H.feltPink}"/><circle cx="${x - 4}" cy="${y - r - 5}" r="2.6" fill="${C.cutRim}" opacity=".45"/>`, `<circle cx="${x}" cy="${y - r}" r="${r}"/>`);
}

// ——— 0-1 「嬰兒床」 ———

/**
 * The nursery at midnight (0-1): rose washi wallpaper and a birthday bunting, the crib's head post
 * and its slatted back rail behind the mattress (the mattress itself is the live ledge), the
 * mobile's arm reaching over to (110, 104) where the `mobile` part hangs, a 花布 quilt over the
 * rail, a window on the lane with the 土地公 shrine lit across the street (his niche at (330,
 * 110)) and 咻咻 peeking from behind a roof, a dresser under the window where Mocha sleeps beside a
 * washi lamp, and moonlight spilling across the floorboards.
 */
const nursery: BackdropDraw = (ctx) => {
  const win = { x: 244, y: 34, w: 132, h: 168 };
  const view = nightLane(ctx, win, [330, 110], calmMoon(ctx, 270, 62, 13, { halo: 0.08 }) + shushuPeek(ctx, 360, 76, 0.8), 9);
  // The crib behind its mattress: the head post at the left, the back rail's slats (calm, low contrast)
  let slats = '';
  for (let x = 14; x < 200; x += 15) slats += `M${x} 268h6v62h-6z`;
  const crib = depth(ctx, 2, `<rect x="-12" y="258" width="214" height="9" rx="3" fill="${ref(ctx, 'pineG')}"/><path d="${slats}" fill="${mixHex(H.pineDeep, H.wallMid, 0.35)}"/>`
    + `<rect x="2" y="206" width="12" height="128" rx="3" fill="${ref(ctx, 'pineG')}"/><circle cx="8" cy="204" r="7" fill="${H.pine}"/>`
    + `<rect x="190" y="236" width="11" height="96" rx="3" fill="${ref(ctx, 'pineG')}"/><circle cx="195.5" cy="234" r="6" fill="${H.pine}"/>`, `<rect x="-12" y="258" width="214" height="76"/><rect x="2" y="198" width="12" height="136"/><rect x="190" y="228" width="11" height="104"/>`);
  // The 花布 quilt folded over the rail at the head end
  const quiltD = 'M18 254q22 -6 46 0l-2 52q-20 6 -42 0z';
  const quilt = depth(ctx, 3, `<path d="${quiltD}" fill="${H.floralGround}"/>`
    + [[30, 268], [50, 280], [34, 294], [54, 300]].map(([qx, qy], i) => `<circle cx="${qx}" cy="${qy}" r="${i % 2 ? 4 : 5.5}" fill="${i % 2 ? H.floralLight : H.floral}"/><circle cx="${qx}" cy="${qy}" r="1.8" fill="${H.floralLight}"/>`).join('')
    + `<path d="M40 262q4 -3 7 1q-4 2 -7 -1zM24 284q4 -3 7 1q-4 2 -7 -1z" fill="${H.floralLeaf}"/><path d="M18 254q22 -6 46 0" stroke="${C.cutRim}" stroke-width="1" opacity=".4" fill="none"/>`, `<path d="${quiltD}"/>`);
  // The mobile's arm: up from the head post, over to the hub the part hangs from
  const arm = depth(ctx, 3, `<path d="M8 206V112q0 -14 14 -14H104" stroke="${H.pine}" stroke-width="5" fill="none" stroke-linecap="round"/>`
    + `<path d="M8 206V112q0 -14 14 -14H104" stroke="${C.cutRim}" stroke-width="1" fill="none" opacity=".35" transform="translate(-1 -1)"/>`
    + `<circle cx="110" cy="100" r="7" fill="${H.pineDeep}"/><circle cx="110" cy="100" r="3" fill="${ref(ctx, 'foil')}"/>`, `<path d="M8 206V112q0 -14 14 -14H104" stroke="${C.shadow}" stroke-width="5" fill="none"/>`);
  // The dresser under the window: three drawers with brass knobs, Mocha asleep on it beside the lamp
  const dresser = depth(ctx, 2, `<rect x="252" y="240" width="122" height="120" rx="3" fill="${ref(ctx, 'teakG')}"/>`
    + `<rect x="246" y="234" width="134" height="9" rx="3" fill="${H.wainscotLit}"/>`
    + [262, 300, 338].map((y) => `<rect x="260" y="${y - 10}" width="106" height="30" rx="2" fill="${H.teak}" stroke="${H.teakDeep}" stroke-width="1.2"/><circle cx="313" cy="${y + 5}" r="2.6" fill="${ref(ctx, 'foil')}"/>`).join(''), `<rect x="246" y="234" width="134" height="126"/>`);
  const back = `<rect x="-20" y="0" width="${PAGE_W + 40}" height="${GUTTER_Y}" fill="${ref(ctx, 'homeWall')}"/>`
    + wallpaper(ctx, -20, 0, PAGE_W + 40, GUTTER_Y, 3)
    + `<rect x="-20" y="${GUTTER_Y - 9}" width="${PAGE_W + 40}" height="9" fill="${H.skirting}"/>`
    // A warm wash from the lamp, a cool one from the window
    + `<ellipse cx="350" cy="230" rx="120" ry="110" fill="${ref(ctx, 'warmPool')}" opacity=".55"/>`
    + bunting(ctx, -6, 22, 226, 30, 18, BUNTING)
    + view + windowFrame(ctx, win, 310, 140)
    + tiedCurtain(ctx, 234, 26, 26, 200, 120, 1) + tiedCurtain(ctx, 388, 26, 26, 200, 120, -1)
    + `<rect x="220" y="20" width="176" height="5" rx="2.5" fill="${ref(ctx, 'foil')}"/>`
    + dresser + tableLamp(ctx, 356, 234, 1) + sleepingCat(ctx, 300, 234, 0.95)
    + crib + quilt + arm
    + `<rect x="-20" y="${GUTTER_Y - 50}" width="${PAGE_W + 40}" height="50" fill="${ref(ctx, 'lampWash')}"/>`;
  // Moonlight through the window: a lilac parallelogram on the boards, crossed by the muntins' shadow
  const spill = `<path d="M196 384L300 384L262 560L118 560Z" fill="${ref(ctx, 'coolPool')}" opacity=".9"/>`
    + `<path d="M248 384L190 560M152 470L282 470" stroke="${H.boardSeam}" stroke-width="5" opacity=".14"/>`;
  return homeDefs(ctx) + standingPage(ctx, back)
    + homeFloor(ctx, [[330, 380, 150, 40, 'warm'], [90, 420, 130, 40, 'warm']]) + spill
    + rubberDuck(ctx, 52, 604) + floorBall(ctx, 236, 612)
    + bookCues(ctx) + block();
};

// ——— 0-2 「沙發山」 ———

/** A round wall clock at midnight (both hands on twelve). */
function wallClock(ctx: KitCtx, x: number, y: number, r: number): string {
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return `M${f1(x + Math.sin(a) * r * 0.78)} ${f1(y - Math.cos(a) * r * 0.78)}L${f1(x + Math.sin(a) * r * 0.66)} ${f1(y - Math.cos(a) * r * 0.66)}`;
  }).join('');
  return depth(ctx, 2, `<circle cx="${x}" cy="${y}" r="${r + 4}" fill="${ref(ctx, 'teakG')}"/><circle cx="${x}" cy="${y}" r="${r}" fill="${C.page}"/>`, `<circle cx="${x}" cy="${y}" r="${r + 4}"/>`)
    + `<path d="${ticks}" stroke="${C.inkSoft}" stroke-width="1.4" stroke-linecap="round"/>`
    + `<path d="M${x} ${y}V${f1(y - r * 0.6)}M${x} ${y}V${f1(y - r * 0.42)}" stroke="${C.ink}" stroke-width="2.2" stroke-linecap="round"/>`
    + `<circle cx="${x}" cy="${y}" r="2" fill="${ref(ctx, 'foil')}"/>`;
}

/** A 春聯 diamond (斗方): red paper turned on its corner, its character in foil. */
function chunlian(ctx: KitCtx, x: number, y: number, s: number, glyph: string): string {
  const d = `M${x} ${y - s}L${x + s} ${y}L${x} ${y + s}L${x - s} ${y}Z`;
  return depth(ctx, 1, `<path d="${d}" fill="${H.almanacRed}"/><path d="${d}" fill="none" stroke="${C.ochre}" stroke-width="1" transform="translate(${f1(x * 0.12)} ${f1(y * 0.12)}) scale(.88)"/>`, `<path d="${d}"/>`)
    + `<text data-art-text="" x="${x}" y="${f1(y + s * 0.36)}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="${f1(s * 0.95)}" fill="${ref(ctx, 'foilH')}">${glyph}</text>`;
}

/** A washi pendant lamp hanging on its cord from the ceiling, lit (calm glow). */
function pendant(ctx: KitCtx, x: number, y: number): string {
  const shade = `M${x - 18} ${y + 22}q2 -20 18 -22q16 2 18 22z`;
  return `<path d="M${x} -4V${y}" stroke="${C.printDark}" stroke-width="1"/>`
    + softEllipse(ctx, x, y + 26, 46, 34, 'lamp', 0.16, 'blur18')
    + depth(ctx, 2, `<path d="${shade}" fill="${H.shade}"/><path d="${shade}" fill="${C.lampHot}" opacity=".45"/><path d="M${x - 18} ${y + 22}h36" stroke="${C.lampAmber}" stroke-width="1.6" opacity=".7"/>`, `<path d="${shade}"/>`);
}

/**
 * The family photo (0-2's 土地公 hides in it): a wooden frame hung on a string, a studio-blue print
 * with 阿嬤, 爸爸, 媽媽 holding Baokaka and Mocha in front — and a gap behind their heads at the
 * photo's centre, where the 土地公 (drawn live at (214, 168)) photobombs.
 */
function familyPhoto(ctx: KitCtx, cx: number, cy: number): string {
  const [w, h] = [70, 80];
  const [x, y] = [cx - w / 2, cy - h / 2 - 2];
  const id = ctx.id('photoClip');
  const person = (px: number, py: number, hair: string, body: string, s = 1) =>
    `<path d="M${px - 11 * s} ${py + 24 * s}q0 -16 ${11 * s} -17q${11 * s} 1 ${11 * s} 17z" fill="${body}"/><circle cx="${px}" cy="${py}" r="${7.5 * s}" fill="${S.skin}"/>`
    + `<path d="M${px - 7.5 * s} ${py - 1}q0 -8 ${7.5 * s} -8q${7.5 * s} 0 ${7.5 * s} 8q-3 -4 ${-7.5 * s} -4q${-4.5 * s} 0 ${-7.5 * s} 4z" fill="${hair}"/>`
    + `<circle cx="${px - 2.4 * s}" cy="${py + 1}" r=".9" fill="${C.ink}"/><circle cx="${px + 2.4 * s}" cy="${py + 1}" r=".9" fill="${C.ink}"/><path d="M${px - 2} ${py + 4}q2 1.6 4 0" stroke="${C.ink}" stroke-width=".8" fill="none"/>`;
  const print = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ref(ctx, 'photoBg')}"/>`
    + person(cx - 22, cy + 10, C.printLilac, H.zhuaRed, 0.9) // 阿嬤, silver hair, a red jacket
    + `<circle cx="${cx - 22}" cy="${cy}" r="3.4" fill="${C.printLilac}"/>`
    + person(cx + 20, cy + 6, H.dadHair, H.dadShirt) // 爸爸
    + person(cx + 2, cy + 16, H.dadHair, H.feltPink, 0.9) // 媽媽
    + `<circle cx="${cx + 8}" cy="${cy + 30}" r="5.4" fill="${S.skin}"/><path d="M${cx + 3} ${cy + 36}q5 -4 10 0v4h-10z" fill="${S.onesie}"/>` // Baokaka in her arms
    + `<path d="M${cx - 30} ${cy + 40}q2 -12 10 -12l2 -5l3 5h4l3 -5l2 5q6 2 6 12z" fill="${S.catFur}"/>` // Mocha
    + `<path d="M${x} ${y + h * 0.25}L${x + w * 0.4} ${y}H${x + w * 0.55}L${x} ${y + h * 0.4}Z" fill="${C.cutRim}" opacity=".12"/>`;
  return `<path d="M${cx - 18} ${y - 6}L${cx} ${y - 22}L${cx + 18} ${y - 6}" stroke="${C.printDark}" stroke-width=".9" fill="none"/><circle cx="${cx}" cy="${y - 22}" r="1.8" fill="${ref(ctx, 'foil')}"/>`
    + depth(ctx, 2, `<rect x="${x - 7}" y="${y - 7}" width="${w + 14}" height="${h + 14}" rx="2" fill="${ref(ctx, 'pineG')}"/>`
      + `<rect x="${x - 2}" y="${y - 2}" width="${w + 4}" height="${h + 4}" fill="${C.printWhite}"/>`, `<rect x="${x - 7}" y="${y - 7}" width="${w + 14}" height="${h + 14}"/>`)
    + `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><g clip-path="url(#${id})">${print}</g>`;
}

/**
 * 爸爸 asleep on the sofa (0-2): lying along the seat with his head on a cushion at the right end
 * (his face under the `newspaper` flap at (80–142, 274–312): opened, it shows him snoring), his
 * knees hooked over the left arm, one arm flopped down to the floor where the remote fell.
 */
function sleepingDad(ctx: KitCtx): string {
  // Lying on his back along the seat: shorts and bent knees at the left, the round tee'd belly rising in the middle
  const legs = [0, 7].map((o) => `<path d="M${32 - o} ${300 - o * 0.3}L${12 - o} ${276 - o * 0.4}" stroke="${o ? S.skinShade : S.skin}" stroke-width="10" stroke-linecap="round"/>`
    + `<path d="M${10 - o} ${280 - o * 0.4}q-4 -14 2 -18q6 -2 7 5q1 8 -3 13z" fill="${C.washi}" stroke="${mixHex(C.washi, C.shadow, 0.25)}" stroke-width=".8"/>`).reverse().join('');
  const shorts = `<path d="M18 306q-4 -14 10 -20h24l-2 24h-28q-4 -1 -4 -4z" fill="${H.dadShorts}"/><path d="M30 288l4 18" stroke="${mixHex(H.dadShorts, C.shadow, 0.3)}" stroke-width="1.4"/>`;
  const tee = `<path d="M48 310q-4 -26 22 -30q22 -2 34 6v24z" fill="${H.dadShirt}"/>`
    + `<path d="M58 286q16 -6 34 -2" stroke="${C.cutRim}" stroke-width="1.4" fill="none" opacity=".25"/>`
    + `<path d="M50 306h54" stroke="${H.dadShirtDeep}" stroke-width="2" opacity=".6"/>`;
  // His arm resting over his belly: a sleeve and a hand
  const arm = `<path d="M96 286q-14 2 -26 8" stroke="${H.dadShirtDeep}" stroke-width="9" stroke-linecap="round" fill="none"/>`
    + `<path d="M74 293q-10 4 -14 2" stroke="${S.skin}" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="58" cy="295" r="4.6" fill="${S.skin}"/>`;
  // The cushion under his head and his face (asleep, mouth open), drawn where the newspaper lies
  const head = `<rect x="94" y="282" width="52" height="24" rx="11" fill="${H.sheet}"/><path d="M98 300q24 6 46 -2" stroke="${H.sheetCheck}" stroke-width="2" fill="none"/>`
    + `<circle cx="116" cy="290" r="13" fill="${S.skin}"/><path d="M103 288q0 -14 13 -14q10 0 13 8q-8 -4 -15 -2q-6 2 -11 8z" fill="${H.dadHair}"/>`
    + `<path d="M106 292q2 1.8 4 0M118 292q2 1.8 4 0" stroke="${C.ink}" stroke-width="1.2" stroke-linecap="round" fill="none"/>`
    + `<ellipse cx="114" cy="299" rx="2.6" ry="2" fill="${C.ink}" opacity=".75"/><path d="M106 300q8 6 16 0" stroke="${H.stubble}" stroke-width="2" fill="none" opacity=".6"/>`
    + `<circle cx="104" cy="296" r="2.2" fill="${S.blush}" opacity=".55"/><circle cx="126" cy="296" r="2.2" fill="${S.blush}" opacity=".55"/>`;
  return depth(ctx, 3, legs + shorts + tee + head + arm, `<path d="M-26 268L146 280V312H-26Z"/>`)
    + `<text data-art-text="" x="146" y="262" font-family="Fredoka" font-weight="700" font-size="12" fill="${C.chalk}" opacity=".85">z</text>`
    + `<text data-art-text="" x="156" y="250" font-family="Fredoka" font-weight="700" font-size="16" fill="${C.chalk}" opacity=".9">Z</text>`;
}

/** The teal velvet sofa (0-2): a long back, two seat cushions, rolled arms, a skirt. */
function sofa(ctx: KitCtx): string {
  const back = 'M-20 300V238q0 -12 12 -12h174q12 0 12 12V300Z';
  const armL = 'M-24 342V274q0 -12 14 -12h14q14 0 14 12V342Z';
  const armR = 'M144 342V274q0 -12 14 -12h14q14 0 14 12V342Z';
  return depth(ctx, 2, `<path d="${back}" fill="${ref(ctx, 'sofaG')}"/>`
    + `<path d="M64 232V298M118 232V298" stroke="${H.sofaDeep}" stroke-width="2" opacity=".5"/>`
    + `<rect x="-6" y="300" width="156" height="34" rx="8" fill="${H.sofa}"/><path d="M72 302V332" stroke="${H.sofaDeep}" stroke-width="2"/>`
    + `<rect x="-14" y="330" width="196" height="22" rx="4" fill="${H.sofaDeep}"/>`
    + `<path d="M-12 352h6v8h-6zM172 352h6v8h-6z" fill="${H.teakDeep}"/>`, `<path d="${back}"/><rect x="-14" y="300" width="196" height="52"/>`)
    + depth(ctx, 3, `<path d="${armL}" fill="${ref(ctx, 'sofaG')}"/><path d="${armR}" fill="${ref(ctx, 'sofaG')}"/>`
      + `<path d="M-20 270q14 -8 34 0M148 270q14 -8 34 0" stroke="${C.cutRim}" stroke-width="1.2" opacity=".3" fill="none"/>`, `<path d="${armL}"/><path d="${armR}"/>`);
}

/** 阿嬤's little 抓周 table (red cloth, foil trim), its top at `top`, x0–x1. */
function zhuaTable(ctx: KitCtx, x0: number, x1: number, top: number, foot: number): string {
  const cloth = top + Math.min(40, (foot - top) * 0.55);
  const fringe = Array.from({ length: Math.floor((x1 - x0 - 8) / 8) }, (_, i) => `M${x0 + 6 + i * 8} ${cloth}v5`).join('');
  return depth(ctx, 3, `<path d="M${x0 + 10} ${cloth}V${foot}M${x1 - 10} ${cloth}V${foot}" stroke="${H.teakDeep}" stroke-width="6"/>`
    + `<path d="M${x0 - 4} ${top}H${x1 + 4}L${x1} ${cloth}H${x0}Z" fill="${H.zhuaRed}"/>`
    + `<rect x="${x0 - 6}" y="${top - 6}" width="${x1 - x0 + 12}" height="7" rx="2" fill="${ref(ctx, 'teakG')}"/>`
    + `<path d="M${x0} ${cloth - 5}H${x1}" stroke="${ref(ctx, 'foilH')}" stroke-width="2"/>`
    + `<path d="${fringe}" stroke="${C.ochre}" stroke-width="1.6" stroke-linecap="round"/>`
    + `<path d="M${x0 - 4} ${top + 1}H${x1 + 4}" stroke="${H.zhuaRedLight}" stroke-width="1.4" opacity=".7"/>`, `<path d="M${x0 - 6} ${top - 6}H${x1 + 6}V${foot}H${x0 - 6}Z"/>`);
}

/**
 * The living room (0-2): the teal sofa where 爸爸 sleeps (his face under the newspaper flap), the
 * family photo where the 土地公 photobombs at (214, 168), a midnight wall clock, a 春 diamond, a
 * washi pendant, Mocha asleep on 阿嬤's 抓周 table (GDD § 4.3), the low TV cabinet the `tv` part
 * stands on, the remote fallen on the floor and 爸爸's slippers.
 */
const livingRoom: BackdropDraw = (ctx) => {
  const back = wallpaper(ctx, -20, 0, PAGE_W + 40, GUTTER_Y, 5)
    + wainscot(ctx, 276)
    + `<ellipse cx="120" cy="120" rx="150" ry="120" fill="${ref(ctx, 'warmPool')}" opacity=".5"/>`
    + bunting(ctx, 150, 20, 400, 14, 16, BUNTING)
    + chunlian(ctx, 40, 96, 22, '春') + wallClock(ctx, 330, 92, 22) + pendant(ctx, 120, 34)
    + familyPhoto(ctx, 214, 168)
    + sofa(ctx) + sleepingDad(ctx)
    + zhuaTable(ctx, 196, 262, 322, 360) + sleepingCat(ctx, 226, 322, 0.82)
    // The TV cabinet (the `tv` part stands on its top at y 344)
    + depth(ctx, 2, `<rect x="276" y="344" width="122" height="18" fill="${ref(ctx, 'teakG')}"/><rect x="272" y="340" width="130" height="6" rx="2" fill="${H.wainscotLit}"/>`
      + `<path d="M318 346V362M356 346V362" stroke="${H.teakDeep}" stroke-width="1.2"/><circle cx="313" cy="353" r="1.6" fill="${ref(ctx, 'foil')}"/><circle cx="361" cy="353" r="1.6" fill="${ref(ctx, 'foil')}"/>`, `<rect x="272" y="340" width="130" height="22"/>`)
    + `<rect x="-20" y="${GUTTER_Y - 44}" width="${PAGE_W + 40}" height="44" fill="${ref(ctx, 'lampWash')}"/>`;
  const remote = depth(ctx, 4, `<rect x="56" y="376" width="26" height="9" rx="3" fill="${C.printDark}" transform="rotate(-8 69 380)"/><circle cx="62" cy="380" r="1.4" fill="${H.lantern}"/>`, `<rect x="56" y="376" width="26" height="9" rx="3" transform="rotate(-8 69 380)"/>`);
  const slipper = (x: number, y: number, rot: number) => `<g transform="translate(${x} ${y}) rotate(${rot})">${depth(ctx, 4, `<path d="M-16 0q0 -9 16 -9q16 0 16 9q0 7 -16 7q-16 0 -16 -7z" fill="${H.dadShirtDeep}"/><path d="M-4 -8q10 -1 14 6q-8 4 -14 2z" fill="${H.dadShirt}"/>`, `<path d="M-16 0q0 -9 16 -9q16 0 16 9q0 7 -16 7q-16 0 -16 -7z"/>`)}</g>`;
  return homeDefs(ctx) + `<defs>${lin(ctx, 'photoBg', [[0, H.feltBlue], [1, mixHex(H.feltBlue, C.shadow, 0.35)]])}</defs>`
    + standingPage(ctx, back)
    + homeFloor(ctx, [[110, 380, 160, 44, 'warm'], [330, 372, 110, 30, 'cool']]) + remote
    + slipper(150, 600, -10) + slipper(186, 606, 6)
    + bookCues(ctx) + block();
};

// ——— 0-3 「摩卡起床」 ———

/** The 農民曆 tear-off calendar on its nail (0-3's 土地公 is its picture, drawn live at the page's centre). */
function almanac(ctx: KitCtx, cx: number, top: number): string {
  const [w, h] = [58, 104];
  const x = cx - w / 2;
  return `<path d="M${cx - 16} ${top}L${cx} ${top - 12}L${cx + 16} ${top}" stroke="${C.printDark}" stroke-width=".9" fill="none"/><circle cx="${cx}" cy="${top - 12}" r="1.8" fill="${ref(ctx, 'foil')}"/>`
    + depth(ctx, 2, `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="2" fill="${H.almanac}"/><rect x="${x}" y="${top}" width="${w}" height="20" rx="2" fill="${H.almanacRed}"/>`
      + `<path d="M${x + 2} ${top + h - 2}h${w - 4}M${x + 2} ${top + h - 4.5}h${w - 4}" stroke="${mixHex(H.almanac, C.shadow, 0.2)}" stroke-width="1"/>`, `<rect x="${x}" y="${top}" width="${w}" height="${h}"/>`)
    + `<text data-art-text="" x="${cx}" y="${top + 14.5}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="11" fill="${ref(ctx, 'foilH')}" letter-spacing="2">農民曆</text>`
    + `<text data-art-text="" x="${cx}" y="${top + 34}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="700" font-size="9" fill="${H.almanacRed}">度晬</text>`
    + `<circle cx="${cx}" cy="${top + 50}" r="15" fill="${mixHex(H.almanac, H.zhuaRed, 0.12)}"/>`
    + `<text data-art-text="" x="${cx}" y="${top + 82}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="700" font-size="8.5" fill="${C.inkSoft}">宜 抓周</text>`
    + `<text data-art-text="" x="${cx}" y="${top + 94}" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="700" font-size="7" fill="${C.inkSoft}" opacity=".8">忌 晚睡</text>`;
}

/**
 * The 抓周 corner (0-3): the end of the teal sofa with its arm (Mocha's `sofaArm` perch at (36,
 * 400)), the wall shelf (`shelf`, its plank at y 236 where the 紅包 waits), the 農民曆 with the
 * 土地公 at (334, 196), a red 度晬 banner, and 阿嬤's 抓周 table (`table`, its top at y 372) with the
 * empty nine-slot tray — 咻咻 blew the treasures away — that the bead rolls off.
 */
const zhuazhouCorner: BackdropDraw = (ctx) => {
  // The 度晬 banner: a red cloth strip with foil characters, hung from two nails
  const banner = `<path d="M196 34q60 14 124 0" stroke="${C.printDark}" stroke-width=".8" fill="none"/>`
    + depth(ctx, 1, `<path d="M204 38q54 12 108 0v26q-54 12 -108 0z" fill="${H.zhuaRed}"/><path d="M204 64l-6 12l10 -6zM312 64l6 12l-10 -6z" fill="${H.zhuaRedDeep}"/>`, `<path d="M204 38q54 12 108 0v26q-54 12 -108 0z"/>`)
    + `<text data-art-text="" x="258" y="62" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="16" fill="${ref(ctx, 'foilH')}" letter-spacing="4">度晬快樂</text>`;
  const balloon = (x: number, y: number, c: string) => `<path d="M${x} ${y + 14}q-4 20 4 44" stroke="${C.pageEdge}" stroke-width=".8" fill="none" opacity=".7"/>`
    + depth(ctx, 2, `<ellipse cx="${x}" cy="${y}" rx="11" ry="14" fill="${c}"/><path d="M${x - 2} ${y + 14}h4l-2 3z" fill="${c}"/><ellipse cx="${x - 4}" cy="${y - 5}" rx="3" ry="4.5" fill="${C.cutRim}" opacity=".35"/>`, `<ellipse cx="${x}" cy="${y}" rx="11" ry="14"/>`);
  const shelf = depth(ctx, 3, `<path d="M118 244l10 0l-10 18zM182 244l-10 0l10 18z" fill="${H.teakDeep}"/><rect x="104" y="236" width="92" height="8" rx="1.5" fill="${ref(ctx, 'pineG')}"/>`
    + `<path d="M104 236.5h92" stroke="${C.cutRim}" stroke-width="1" opacity=".6"/>`, `<rect x="104" y="236" width="92" height="8"/>`)
    // A little potted succulent and a framed snapshot at the shelf's ends
    + depth(ctx, 3, `<path d="M108 236l2 -12h12l2 12z" fill="${C.kraft}"/><path d="M116 224q-6 -10 0 -14q6 4 0 14zM116 224q-10 -4 -10 -10q8 0 10 10zM116 224q10 -4 10 -10q-8 0 -10 10z" fill="${S.leafLight}"/>`, `<path d="M108 236l2 -12h12l2 12z"/>`)
    + depth(ctx, 3, `<rect x="178" y="212" width="18" height="24" fill="${ref(ctx, 'pineG')}"/><rect x="181" y="215" width="12" height="16" fill="${H.feltBlue}"/><circle cx="187" cy="221" r="3" fill="${S.skin}"/>`, `<rect x="178" y="212" width="18" height="24"/>`);
  const back = wallpaper(ctx, -20, 0, PAGE_W + 40, GUTTER_Y, 8)
    + wainscot(ctx, 300)
    + `<ellipse cx="250" cy="260" rx="170" ry="130" fill="${ref(ctx, 'warmPool')}" opacity=".45"/>`
    + banner + balloon(176, 60, H.feltPink) + balloon(344, 56, H.feltMint)
    + shelf + almanac(ctx, 334, 146)
    + `<rect x="-20" y="${GUTTER_Y - 44}" width="${PAGE_W + 40}" height="44" fill="${ref(ctx, 'lampWash')}"/>`;
  // On the floor page: the sofa's end and arm (Mocha's perch top at y 400), and the 抓周 table
  const sofaEnd = depth(ctx, 2, `<path d="M-30 470V346q0 -12 12 -12h48q12 0 12 12V470Z" fill="${ref(ctx, 'sofaG')}"/>`, `<path d="M-30 470V346q0 -12 12 -12h48q12 0 12 12V470Z"/>`)
    + depth(ctx, 3, `<path d="M6 472V410q0 -12 14 -12h32q14 0 14 12V472Z" fill="${ref(ctx, 'sofaG')}"/><path d="M8 406q26 -10 56 0" stroke="${C.cutRim}" stroke-width="1.2" opacity=".35" fill="none"/>`
      + `<rect x="-30" y="440" width="96" height="32" fill="${H.sofaDeep}" opacity=".55"/>`, `<path d="M6 472V410q0 -12 14 -12h32q14 0 14 12V472Z"/>`);
  // The empty nine-slot 抓周 tray on the table top (a red lacquer tray with foil rims)
  const tray = depth(ctx, 3, `<rect x="216" y="361" width="92" height="12" rx="4" fill="${H.zhuaRed}"/><rect x="216" y="361" width="92" height="3" rx="1.5" fill="${H.zhuaRedLight}"/>`
    + Array.from({ length: 9 }, (_, i) => `<ellipse cx="${222 + i * 10}" cy="368" rx="3.6" ry="2.2" fill="${H.zhuaRedDeep}" stroke="${ref(ctx, 'foil')}" stroke-width=".6"/>`).join(''), `<rect x="216" y="361" width="92" height="12"/>`);
  return homeDefs(ctx) + standingPage(ctx, back)
    + homeFloor(ctx, [[262, 400, 150, 48, 'warm'], [80, 390, 110, 30, 'warm']])
    + sofaEnd + zhuaTable(ctx, 204, 320, 374, 466) + tray
    + `<ellipse cx="262" cy="468" rx="64" ry="8" fill="${C.shadow}" opacity=".3"/>`
    + bookCues(ctx) + block();
};

// ——— 0-4 「窗外的月亮線」 ———

/**
 * The balcony window (0-4): the night beyond the glass — the 月亮線's glowing paper rail curving
 * through the sky over the rooftops, the moon, the city — the lane's 土地公 shrine in the transom
 * (his niche at (300, 122)), the curtain rod at y 164 (Mocha's `rod` perch) and, on the floor page,
 * the balcony's grey terrazzo with its white iron grille beyond the door. The small window at the
 * left has Mocha's sill at y 318. 咻咻 peeks over the rooftops.
 */
const homeWindow: BackdropDraw = (ctx) => {
  const left = { x: 86, y: 170, w: 108, h: 138 };
  const leftView = nightLane(ctx, left, [430, 290], calmMoon(ctx, 120, 204, 14, { halo: 0.08 }), 4);
  const transom = { x: 232, y: 94, w: 140, h: 56 };
  const glass = { x: 232, y: 174, w: 140, h: 178 };
  const transomView = nightLane(ctx, transom, [300, 122], '', 12);
  // The main glass: the moon-line rail (a ribbon of lit paper on little posts) and the city
  const gid = ctx.id('balconyGlass');
  const rail = `M${glass.x - 10} ${glass.y + 120}Q${glass.x + 60} ${glass.y + 60} ${glass.x + glass.w + 10} ${glass.y + 86}`;
  const sk = skyline(glass.x - 6, glass.x + glass.w + 6, glass.y + glass.h, 21, { minH: 20, maxH: 70, winP: 0.12, winOpacity: 0.6 });
  const glassView = `<clipPath id="${gid}"><rect x="${glass.x}" y="${glass.y}" width="${glass.w}" height="${glass.h}"/></clipPath><g clip-path="url(#${gid})">`
    + `<rect x="${glass.x}" y="${glass.y}" width="${glass.w}" height="${glass.h}" fill="${ref(ctx, 'sky')}"/>`
    + pinholes(ctx, glass.x, glass.y, glass.w, 90, 26, 31)
    + `<path d="${sk.d}" fill="${mixHex(H.street, C.shadow, 0.2)}"/>${sk.windows}`
    + softEllipse(ctx, glass.x + 70, glass.y + 92, 90, 18, 'lamp', 0.12, 'blur8')
    + `<path d="${rail}" stroke="${C.lamp}" stroke-width="3" fill="none" opacity=".75"/><path d="${rail}" stroke="${C.lampHot}" stroke-width="1" fill="none"/>`
    + shushuPeek(ctx, glass.x + 112, glass.y + 132, 0.75)
    + `<path d="M${glass.x} ${glass.y + glass.h * 0.5}L${glass.x + glass.w * 0.45} ${glass.y}H${glass.x + glass.w * 0.6}L${glass.x} ${glass.y + glass.h * 0.8}Z" fill="${H.glass}" opacity=".07"/></g>`;
  // The balcony frame: one teak frame round the transom and the glass, a transom bar
  const frame = depth(ctx, 2, `<path d="M222 84h160v278h-160Z M232 94v56h140v-56Z M232 174v178h140v-178Z" fill="${ref(ctx, 'teakG')}" fill-rule="evenodd"/>`
    + `<path d="M302 174v178" stroke="${H.teak}" stroke-width="4"/><path d="M222 84.6h160" stroke="${C.cutRim}" stroke-width="1" opacity=".35"/>`, `<path d="M222 84h160v278h-160Z M232 94v56h140v-56Z M232 174v178h140v-178Z" fill-rule="evenodd"/>`);
  const rod = depth(ctx, 3, `<rect x="212" y="164" width="178" height="5" rx="2.5" fill="${ref(ctx, 'foil')}"/><circle cx="212" cy="166.5" r="5" fill="${ref(ctx, 'foil')}"/><circle cx="390" cy="166.5" r="5" fill="${ref(ctx, 'foil')}"/>`, `<rect x="207" y="161" width="188" height="11"/>`);
  // The left window's sill (Mocha's `sill` perch, its top at y 318) and a little 花布 café curtain
  const sill = depth(ctx, 3, `<rect x="72" y="318" width="136" height="9" rx="2" fill="${H.wainscotLit}"/><path d="M80 327l8 10h112l8 -10z" fill="${H.teakDeep}"/>`
    + `<path d="M72 318.6h136" stroke="${C.cutRim}" stroke-width="1" opacity=".5"/>`, `<rect x="72" y="318" width="136" height="9"/>`);
  const back = wallpaper(ctx, -20, 0, PAGE_W + 40, GUTTER_Y, 11)
    + wainscot(ctx, 300, -20, 214)
    + `<ellipse cx="60" cy="250" rx="140" ry="120" fill="${ref(ctx, 'warmPool')}" opacity=".45"/>`
    + leftView + windowFrame(ctx, left, 140, null, false) + sill + tiedCurtain(ctx, 76, 160, 22, 150, 230, 1)
    + transomView + glassView + frame + rod
    + `<rect x="-20" y="${GUTTER_Y - 44}" width="${PAGE_W + 40}" height="44" fill="${ref(ctx, 'lampWash')}"/>`;
  // The floor: boards indoors, the balcony's terrazzo beyond x ≈ 232 (its edge converging on the VP)
  const k = (FLOOR_BOTTOM - GUTTER_Y) / (GUTTER_Y + 360);
  const bx = (x: number, y: number) => f1(x + (x - 195) * k * ((y - GUTTER_Y) / (FLOOR_BOTTOM - GUTTER_Y)));
  const tileId = ctx.id('terrazzoP');
  const balcony = `<defs><pattern id="${tileId}" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="${C.printLilac}"/><path d="M0 .5H22M.5 0V22" stroke="${C.printLilacDeep}" stroke-width="1" opacity=".6"/>`
    + `<circle cx="6" cy="8" r=".9" fill="${C.cutRim}" opacity=".5"/><circle cx="15" cy="15" r="1.1" fill="${C.printDark}" opacity=".35"/></pattern></defs>`
    + floorPage(ctx, `<path d="M232 ${GUTTER_Y}H420V${FLOOR_BOTTOM}H${bx(232, FLOOR_BOTTOM)}Z" fill="url(#${tileId})"/><path d="M232 ${GUTTER_Y}H420V${FLOOR_BOTTOM}H${bx(232, FLOOR_BOTTOM)}Z" fill="${C.shadow}" opacity=".28"/>`
      + `<path d="M232 ${GUTTER_Y}L${bx(232, FLOOR_BOTTOM)} ${FLOOR_BOTTOM}" stroke="${H.skirting}" stroke-width="4"/>`)
    // The iron grille along the balcony's far edge, potted plants in its corner
    + depth(ctx, 3, `<path d="M232 300H392M232 312H392" stroke="${C.cutRim}" stroke-width="2.4" opacity=".75"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${238 + i * 18} 300v66" stroke="${C.cutRim}" stroke-width="1.6" opacity=".6"/>`).join('')}`, `<rect x="232" y="298" width="160" height="68"/>`);
  return homeDefs(ctx) + standingPage(ctx, back)
    + homeFloor(ctx, [[96, 400, 150, 48, 'warm'], [300, 400, 110, 40, 'cool']]) + balcony
    + bookCues(ctx) + block();
};

export const C0_BACKDROPS: Readonly<Record<string, BackdropDraw>> = {
  'c0/nursery-night': nursery,
  'c0/living-room': livingRoom,
  'c0/zhuazhou-corner': zhuazhouCorner,
  'c0/home-window': homeWindow,
};


// ——— Parts (#108): one drawing per state, in the part's local space ———

/** The flap preset's card size for a hit area (FlapView: the hit less 22, at least 40 × 32). */
const flapSize = (hw: number, hh: number) => ({ w: Math.max(40, hw - 22), h: Math.max(32, hh - 22) });
/** The flap's marigold dog-ear corner (FlapView and the kit's `flap`: 22 units). */
const EAR = 22;

/**
 * A baked flap (#96, FlapView): its face for `closed` (`face`, clipped to the card with its cut
 * corner) and its back for `open` (`back`), each with the marigold dog-ear at the bottom-right — the
 * grip, the one marigold the part wears (the 翻 seal and the curl cue stay live). Local space: the
 * card's top-left at the origin, the hinge along y 0.
 */
function bakedFlap(w: number, h: number, face: (ctx: KitCtx) => string, back: (ctx: KitCtx) => string): PartSource {
  const card = `M0 0H${w}V${h - EAR}L${w - EAR} ${h}H0Z`;
  const ear = `M${w} ${h - EAR}L${w - EAR} ${h}L${f1(w - EAR * 0.35)} ${f1(h + EAR * 0.42)}Z`;
  return {
    preset: 'flap',
    states: ['closed', 'open'],
    hinge: 0,
    box: { x: -4, y: -4, w: w + 12, h: h + 16 },
    draw(ctx, state) {
      const clip = ctx.id(`flapClip${state}`);
      const body = state === 'open' ? back(ctx) : face(ctx);
      return `<clipPath id="${clip}"><path d="${card}"/></clipPath>`
        + depth(ctx, 3, `<g clip-path="url(#${clip})">${body}</g><path d="M2 1.2H${w - 2}" stroke="${C.cutRim}" stroke-width="1" opacity=".45"/>`, `<path d="${card}"/>`)
        + depth(ctx, 4, `<path data-grip="ear" d="${ear}" fill="${ref(ctx, 'tabG')}"/><path d="M${w - EAR} ${h}L${f1(w - EAR * 0.35)} ${f1(h + EAR * 0.42)}" stroke="${C.marigoldEdge}" stroke-width="1" opacity=".6"/>`, `<path d="${ear}"/>`);
    },
  };
}

/** A kraft flap back (bible § 3.1: the back sides of flaps are kraft) with its fibres. */
const kraftBack = (w: number, h: number, seed: number) => (ctx: KitCtx): string =>
  `<rect width="${w}" height="${h}" fill="${ref(ctx, 'kraft')}"/>` + paperFibres(0, 0, w, h, Math.round((w * h) / 120), C.kraftFiber, seed, 0.35);

/**
 * 0-1's crib mobile (a `prop`, tap to spin; the 淘氣): felt pieces — a moon, a star, a cloud and a
 * little fish — hanging on threads from the hub of the crib's arm (drawn in the backdrop at (110,
 * 100), 50 above the part's centre). `spin`: they swing out round the hub with motion arcs and a
 * music note.
 */
const cribMobile: PartSource = {
  preset: 'prop',
  states: ['still', 'spin'],
  box: { x: -52, y: -56, w: 104, h: 104 },
  draw(ctx, state) {
    const spin = state === 'spin';
    const hub = -50;
    const pieces: [number, number, string][] = spin
      ? [[-40, -4, 'moon'], [-14, 8, 'star'], [16, 2, 'cloud'], [40, -8, 'fish']]
      : [[-27, 10, 'moon'], [-9, 22, 'star'], [10, 16, 'cloud'], [28, 6, 'fish']];
    const piece = (x: number, y: number, kind: string) => {
      const d = kind === 'moon' ? `M${x + 3} ${y - 9}a9 9 0 1 0 6 15a7 7 0 1 1 -6 -15z`
        : kind === 'star' ? `M${x} ${y - 9}l2.6 6l6.4 .4l-5 4.2l1.6 6.4l-5.6 -3.6l-5.6 3.6l1.6 -6.4l-5 -4.2l6.4 -.4z`
          : kind === 'cloud' ? `M${x - 9} ${y + 5}q-5 0 -5 -5q0 -5 5 -5q1 -6 8 -6q6 0 8 5q6 0 6 6q0 5 -6 5z`
            : `M${x - 9} ${y}q6 -8 14 -2l5 -4v12l-5 -4q-8 6 -14 -2z`;
      const fill = kind === 'moon' ? C.ochre : kind === 'star' ? H.feltPink : kind === 'cloud' ? C.vellum : H.feltBlue;
      return `<path d="M${spin ? f1(x * 0.4) : x} ${hub + 4}L${x} ${y - 8}" stroke="${C.pageEdge}" stroke-width=".8" opacity=".9"/>`
        + depth(ctx, 3, `<path d="${d}" fill="${fill}"/><path d="${d}" fill="none" stroke="${C.standeeCard}" stroke-width=".9" stroke-dasharray="1.6 1.6" opacity=".8"/>`, `<path d="${d}"/>`)
        + (kind === 'fish' ? `<circle cx="${x - 4}" cy="${y - 1}" r="1" fill="${C.ink}"/>` : '');
    };
    const bar = spin ? `<ellipse cx="0" cy="${hub + 5}" rx="40" ry="5" fill="none" stroke="${H.pine}" stroke-width="2.2"/>`
      : `<path d="M-30 ${hub + 5}H30" stroke="${H.pine}" stroke-width="2.6" stroke-linecap="round"/><path d="M0 ${hub}V${hub + 5}" stroke="${H.pine}" stroke-width="2"/>`;
    const arcs = spin ? `<g stroke="${C.chalk}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"><path d="M-48 14q-6 -20 6 -32"/><path d="M48 -18q6 20 -6 30"/></g>`
      + `<g transform="translate(36 28)" fill="${C.chalk}"><path d="M0 0V-12l7 -2v10" stroke="${C.chalk}" stroke-width="1.4" fill="none"/><ellipse cx="-2" cy="0" rx="2.6" ry="2" /><ellipse cx="5" cy="-2" rx="2.6" ry="2"/></g>` : '';
    return bar + pieces.map(([x, y, k]) => piece(x, y, k)).join('') + arcs;
  },
};

/**
 * 0-2's TV (a `light`: its standby glow is what he watches, 「好看！」): a little flat screen on a
 * stand showing a sleepy moon-and-stars screensaver, its red standby lamp lit. Off: a dark screen
 * and an unlit lamp. Local origin at the hit centre (332, 317); the stand's foot at y +27.
 */
const tv: PartSource = {
  preset: 'light',
  states: ['off', 'on'],
  box: { x: -50, y: -44, w: 100, h: 80 },
  draw(ctx, state) {
    const on = state === 'on';
    const sid = ctx.id(`tvScreen${state}`);
    const screen = `<defs><linearGradient id="${sid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${on ? C.nightCard : C.printDark}"/><stop offset="1" stop-color="${on ? H.glass : C.nightInk}"/></linearGradient></defs>`;
    const glow = on ? softEllipse(ctx, 0, -4, 46, 34, 'lamp', 0.14, 'blur18') : '';
    const saver = on ? `<circle cx="-14" cy="-10" r="7" fill="${C.moon}"/><circle cx="-11" cy="-12" r="6" fill="${C.nightCard}"/>`
      + `<path d="M10 -16l1.2 2.6l2.8.3l-2.1 1.9l.6 2.8l-2.5 -1.5l-2.5 1.5l.6 -2.8l-2.1 -1.9l2.8 -.3z" fill="${C.pinhole}"/><circle cx="20" cy="-2" r="1.2" fill="${C.pinhole}"/><circle cx="2" cy="4" r="1" fill="${C.pinhole}"/>`
      + `<path d="M-30 10q15 -6 30 0t30 0" stroke="${C.vellum}" stroke-width="1.4" fill="none" opacity=".5"/>` : '';
    return screen + glow
      + depth(ctx, 3, `<path d="M-10 27l4 -10h12l4 10z" fill="${C.printDark}"/><rect x="-38" y="-30" width="76" height="48" rx="4" fill="${C.printDark}"/>`
        + `<rect x="-34" y="-26" width="68" height="38" rx="2" fill="url(#${sid})"/>${saver}`
        + `<path d="M-34 -26L-6 -26L-34 2Z" fill="${C.cutRim}" opacity=".06"/>`, `<rect x="-38" y="-30" width="76" height="48" rx="4"/><path d="M-10 27l4 -10h12l4 10z"/>`)
      + (on ? softEllipse(ctx, 31, 15, 4, 4, 'lamp', 0.5) : '')
      + `<circle cx="31" cy="15" r="1.8" fill="${on ? H.lantern : C.inkSoft}"/>`;
  },
};

/** 0-2's newspaper over 爸爸's face (a flap; the 淘氣): an unbranded evening paper — its masthead, a photo box and columns. */
const newspaper: PartSource = (() => {
  const { w, h } = flapSize(84, 60);
  const face = (_ctx: KitCtx) => {
    let cols = '';
    for (let c = 0; c < 3; c++) for (let r = 0; r < 5; r++) cols += `M${6 + c * 18} ${20 + r * 3.6}h${c === 2 && r > 2 ? 8 : 14}`;
    return `<rect width="${w}" height="${h}" fill="${H.news}"/>`
      + `<text data-art-text="" x="6" y="12" font-family="'Noto Serif TC'" font-weight="900" font-size="9" fill="${C.ink}">晚報</text>`
      + `<text data-art-text="" x="28" y="12" font-family="'Noto Serif TC'" font-weight="700" font-size="6.5" fill="${H.newsRed}">明天度晬</text>`
      + `<path d="M4 15H${w - 4}" stroke="${H.newsInk}" stroke-width=".8"/><path d="${cols}" stroke="${H.newsInk}" stroke-width="1.4" opacity=".7"/>`
      + `<path d="M0 ${h * 0.5}H${w}" stroke="${mixHex(H.news, C.shadow, 0.25)}" stroke-width="1"/>`
      + paperFibres(0, 0, w, h, 14, H.newsInk, 41, 0.2);
  };
  const back = (_ctx: KitCtx) => {
    let cols = '';
    for (let c = 0; c < 3; c++) for (let r = 0; r < 7; r++) cols += `M${6 + c * 18} ${6 + r * 3.8}h14`;
    return `<rect width="${w}" height="${h}" fill="${mixHex(H.news, C.shadow, 0.12)}"/><path d="${cols}" stroke="${H.newsInk}" stroke-width="1.4" opacity=".55"/>`
      + paperFibres(0, 0, w, h, 12, H.newsInk, 43, 0.2);
  };
  return bakedFlap(w, h, face, back);
})();

/** 0-2's floor cushion at the sofa's foot (a flap; open, it shows the bead): a tufted 花布 cushion with piping. */
const sofaCushion: PartSource = (() => {
  const { w, h } = flapSize(78, 70);
  const face = (ctx: KitCtx) => {
    const pid = ctx.id('cushionPrint');
    return `<defs><pattern id="${pid}" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="${H.floral}"/>`
      + `<circle cx="6" cy="6" r="3.6" fill="${H.floralLight}"/><circle cx="6" cy="6" r="1.4" fill="${C.ochre}"/><path d="M11 9q4 -1 5 3q-4 1 -5 -3z" fill="${H.floralLeaf}"/><circle cx="16" cy="16" r="2.2" fill="${H.floralLight}" opacity=".8"/></pattern></defs>`
      + `<rect width="${w}" height="${h}" fill="url(#${pid})"/>`
      + `<rect x="2.5" y="2.5" width="${w - 5}" height="${h - 5}" rx="6" fill="none" stroke="${H.floralGround}" stroke-width="2.4"/>`
      + `<path d="M${w / 2} 8V${h - 8}M8 ${h / 2}H${w - 8}" stroke="${C.shadow}" stroke-width="1.6" opacity=".18"/>`
      + `<circle cx="${w / 2}" cy="${h / 2}" r="3.4" fill="${H.floralGround}"/><circle cx="${w / 2 - 1}" cy="${h / 2 - 1}" r="1.2" fill="${H.floralLight}"/>`
      + `<ellipse cx="${w * 0.32}" cy="${h * 0.3}" rx="${w * 0.22}" ry="${h * 0.14}" fill="${C.cutRim}" opacity=".12"/>`;
  };
  return bakedFlap(w, h, face, kraftBack(w, h, 47));
})();

/**
 * 0-4's curtain over the balcony window (a flap): dusky indigo pleats with a small washi print, a
 * hem band and the rings at the rod. Open, it shows its cream lining folded up over the rod.
 */
const curtain: PartSource = (() => {
  const { w, h } = flapSize(148, 166);
  const face = (ctx: KitCtx) => {
    const pid = ctx.id('curtainPrint');
    let pleats = '';
    for (let x = 0; x < w; x += 18) pleats += `<rect x="${x}" y="0" width="9" height="${h}" fill="${C.shadow}" opacity=".16"/><rect x="${x + 9}" y="0" width="2" height="${h}" fill="${C.cutRim}" opacity=".08"/>`;
    return `<defs><pattern id="${pid}" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="${H.wallTop}"/><circle cx="4" cy="4" r="1.4" fill="${H.wallPrint}" opacity=".35"/><circle cx="12" cy="12" r="1" fill="${H.feltPink}" opacity=".4"/></pattern></defs>`
      + `<rect width="${w}" height="${h}" fill="url(#${pid})"/>${pleats}`
      + `<rect y="${h - 16}" width="${w}" height="10" fill="${H.floral}" opacity=".75"/><path d="M0 ${h - 16}H${w}" stroke="${C.ochre}" stroke-width="1"/>`
      + Array.from({ length: 8 }, (_, i) => `<circle cx="${8 + i * ((w - 16) / 7)}" cy="3" r="3" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width="1.2"/>`).join('');
  };
  const back = (_ctx: KitCtx) => {
    let pleats = '';
    for (let x = 0; x < w; x += 18) pleats += `<rect x="${x}" y="0" width="9" height="${h}" fill="${C.shadow}" opacity=".1"/>`;
    return `<rect width="${w}" height="${h}" fill="${C.washi}"/>${pleats}` + paperFibres(0, 0, w, h, 40, C.washiFiber, 53, 0.3);
  };
  return bakedFlap(w, h, face, back);
})();

/** A 紅包 (0-3's 淘氣, a pushable): a red envelope with a foil 福 and border, tilted a little. */
const redEnvelope: PartSource = {
  preset: 'pushable',
  states: ['onPerch'],
  box: { x: -20, y: -22, w: 40, h: 44 },
  draw(ctx) {
    const d = 'M-10 -14h20v28h-20z';
    return softEllipse(ctx, 1, 15, 11, 2.6, 'shadow', 0.4)
      + `<g transform="rotate(-8)">` + depth(ctx, 4, `<path d="${d}" fill="${H.envelope}"/><path d="M-10 -14l10 8l10 -8" fill="${mixHex(H.envelope, C.shadow, 0.2)}"/>`
        + `<rect x="-8" y="-12" width="16" height="24" fill="none" stroke="${ref(ctx, 'foil')}" stroke-width=".8"/>`
        + `<text data-art-text="" x="0" y="9" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="11" fill="${ref(ctx, 'foilH')}">福</text>`, `<path d="${d}"/>`) + `</g>`;
  },
};

/** 0-3's 金珠珠 on the 抓周 tray (a pushable Mocha knocks off): a foil bead on its red tassel thread. */
const beadBall: PartSource = {
  preset: 'pushable',
  states: ['onPerch'],
  box: { x: -18, y: -18, w: 36, h: 36 },
  draw(ctx) {
    return softEllipse(ctx, 0, 0, 16, 16, 'foil', 0.22, 'blur8') + softEllipse(ctx, 1, 11, 9, 2.4, 'shadow', 0.45)
      + `<path d="M6 6q6 4 4 10" stroke="${H.envelope}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
      + depth(ctx, 4, `<circle r="9" fill="${ref(ctx, 'coin')}"/>`, `<circle r="9"/>`)
      + `<circle r="6.4" fill="none" stroke="${C.coinRing}" stroke-width=".8" opacity=".6"/><circle cx="-3" cy="-3.2" r="2.6" fill="${C.foilShine}"/>`
      + sparkleAt(ctx, 11, -11, 4);
  },
};

/** A small foil sparkle. */
const sparkleAt = (ctx: KitCtx, x: number, y: number, r: number) => {
  const k = r * 0.16;
  return `<path d="M${x} ${y - r}Q${x + k} ${y - k} ${x + r} ${y}Q${x + k} ${y + k} ${x} ${y + r}Q${x - k} ${y + k} ${x - r} ${y}Q${x - k} ${y - k} ${x} ${y - r}Z" fill="${ref(ctx, 'foil')}"/>`;
};

/**
 * 0-4's balcony door (a gate his cry opens): an aluminium sliding door with a glass pane and a
 * grille. Closed, the pane fills the doorway; open, it has slid away behind the left jamb, and the
 * doorway shows the balcony. Local origin at the hit centre (262, 442); the sill at y +44.
 */
const balconyDoor: PartSource = {
  preset: 'gate',
  states: ['closed', 'open'],
  box: { x: -34, y: -56, w: 68, h: 106 },
  draw(ctx, state) {
    const open = state === 'open';
    const frame = mixHex(C.printDark, C.printLilac, 0.35);
    const jamb = `<path d="M-30 46V-52h60V46h-5V-47h-50V46Z" fill="${frame}"/><rect x="-32" y="44" width="64" height="5" rx="1.5" fill="${C.printDark}"/>`
      + `<path d="M-30 -51.4h60" stroke="${C.cutRim}" stroke-width="1" opacity=".35"/>`;
    const pane = (x: number, w: number) => `<rect x="${x}" y="-47" width="${w}" height="91" fill="${frame}"/>`
      + `<rect x="${x + 3.5}" y="-43" width="${w - 7}" height="83" fill="${H.glass}" opacity=".32"/>`
      + (w > 20 ? `<path d="M${x + 4} -6L${x + w * 0.62} -43H${x + w - 4}V-34L${x + 4} 8Z" fill="${C.cutRim}" opacity=".2"/><path d="M${x + 4} 22L${x + w - 4} 0V8L${x + 4} 30Z" fill="${C.cutRim}" opacity=".1"/>` : '')
      + `<rect x="${x + w - 8}" y="-6" width="3" height="16" rx="1.5" fill="${C.cutRim}" opacity=".8"/>`;
    const doorway = open ? `<rect x="-25" y="-47" width="50" height="91" fill="${C.shadow}" opacity=".12"/>` : '';
    return depth(ctx, 3, doorway + jamb + (open ? pane(-25, 13) : pane(-25, 50)), `<path d="M-32 49V-52h64V49Z"/>`);
  },
};

/**
 * 0-4's paper 月亮線 train (a `light` his cry wakes): the cab end of a navy paper train with a cream
 * band, a gold moon on its nose, a pantograph and a little step — asleep with dark windows, or awake
 * with its windows and headlamp lit and 「月亮線」 glowing on its sign. Local origin at the hit centre
 * (342, 413): its roof (Mocha's `trainRoof` at y 330) is at −83, its step (y 486) at +73.
 */
const moonTrain: PartSource = {
  preset: 'light',
  states: ['off', 'on'],
  box: { x: -52, y: -104, w: 104, h: 186 },
  draw(ctx, state) {
    const on = state === 'on';
    const body = 'M-44 64V-58q0 -22 22 -24h50q16 0 18 16V64Z';
    const win = (x: number, y: number, w: number, h: number) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${on ? ref(ctx, 'window') : mixHex(C.nightCard, C.shadow, 0.3)}"/>`;
    return (on ? softEllipse(ctx, 0, -10, 60, 70, 'lamp', 0.16, 'blur18') : '')
      // The pantograph and the glowing rail it rides
      + `<path d="M-30 -82l-8 -12h20l-8 12" stroke="${C.printDark}" stroke-width="1.6" fill="none"/><path d="M-42 -94h28" stroke="${C.printDark}" stroke-width="2"/>`
      + depth(ctx, 3, `<path d="${body}" fill="${H.trainBody}"/><path d="M-44 -66q2 -16 22 -16h50q16 0 18 16Z" fill="${H.trainRoof}"/>`
        + `<rect x="-44" y="20" width="90" height="12" fill="${H.trainBand}"/><rect x="-44" y="33" width="90" height="2.4" fill="${C.ochre}"/>`
        + win(-36, -54, 30, 40) + win(2, -54, 34, 40)
        + `<path d="M-36 -54h30v40h-30zM2 -54h34v40h-34z" fill="none" stroke="${C.printDark}" stroke-width="1.2"/>`
        + `<rect x="-22" y="-76" width="46" height="12" rx="2" fill="${C.printDark}"/>`
        + `<circle cx="-24" cy="4" r="7" fill="${on ? C.lampHot : C.printLilacDeep}"/><circle cx="-24" cy="4" r="4" fill="${on ? C.lamp : C.printDark}"/>`
        + `<path d="M24 -2a10 10 0 1 1 -6 18a8 8 0 1 0 6 -18z" fill="${ref(ctx, 'foil')}"/>`
        + `<rect x="-20" y="48" width="40" height="8" rx="2" fill="${H.trainRoof}"/>`
        + `<path d="M-44 -58q0 -22 22 -24" stroke="${C.cutRim}" stroke-width="1.2" opacity=".4" fill="none"/>`, `<path d="${body}"/>`)
      + `<text data-art-text="" x="1" y="-67" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="8.5" fill="${on ? C.lamp : C.printLilacDeep}" letter-spacing="1">月亮線</text>`
      // The step and the bogie on the moon-line rail
      + depth(ctx, 4, `<rect x="-26" y="66" width="30" height="5" rx="1.5" fill="${C.printLilac}"/>`, `<rect x="-26" y="66" width="30" height="5"/>`)
      + `<circle cx="-26" cy="66" r="7" fill="${C.printDark}"/><circle cx="30" cy="66" r="7" fill="${C.printDark}"/>`
      + (on ? softEllipse(ctx, -24, 4, 12, 12, 'lamp', 0.5) : '');
  },
};

export const C0_PARTS: Readonly<Record<string, PartSource>> = {
  'c0/crib-mobile': cribMobile,
  'c0/tv': tv,
  'c0/newspaper': newspaper,
  'c0/sofa-cushion': sofaCushion,
  'c0/curtain': curtain,
  'c0/red-envelope': redEnvelope,
  'c0/bead-ball': beadBall,
  'c0/balcony-door': balconyDoor,
  'c0/moon-train': moonTrain,
};
