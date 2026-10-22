import { POPUP, POPUP_AIRPORT, POPUP_CHAPTER_CLOCK, POPUP_MAOKONG, POPUP_FOIL, POPUP_NEON, POPUP_STAGE, characterGrade, mixHex, multiplyHex, worldGrade, type PopupChapterSky, type Rgb } from '../../art/palette';

/**
 * The chapter grade (popup art bible § 3.3 colour clock; art direction § 3.2 `gradeTokens(time)`;
 * #96, D-59).
 *
 * The grade is a per-channel multiplier **baked into colours at build time**, never a runtime
 * filter. Readings, as D-27 set them for the RPG:
 * - **Environment** (`envGrade`): the pop-up palette (`POPUP`, `POPUP_STAGE`) is painted for the
 *   proofs' night, so the grade is relative to 00:00: identity at midnight, lifting toward the
 *   ungraded colours as dawn comes. `npm run bake:popup` multiplies every colour in a backdrop's
 *   SVG by it (`gradeSvg`), except what never takes a grade: lights (lamps, lit vellum, neon,
 *   pinholes, the moon), foil, the touchables' marigold and seal, chalk, the indigo shadow and
 *   the cut-edge rim, and the chapter's own sky (`keepColours`).
 * - **Characters** (`standeeGrade`): authored in daylight colours, they take **half** the table's
 *   grade, `1 − (1 − g) / 2` (≈ ×0.78 at midnight, none from 05:29), so they always pop.
 *   `npm run sync:sprites` bakes it into the print of each standee frame (the warm-white card,
 *   the cut line and the shadows are the paper's own night colours and stay as they are).
 * - **Touchables** are never graded: marigold is the brightest thing on the page by design.
 *
 * Chapters 0–2 (00:00–00:50) sit between the table's identical 00:00 and 01:00 rows, so the M1
 * slice's environment grade is identity and its characters share one variant.
 */

/** A chapter's place on the colour clock (the prologue's for unknown chapters, as `chapterSky`). */
const skyOf = (chapter: number): PopupChapterSky => POPUP_CHAPTER_CLOCK.find((s) => s.chapter === chapter) ?? POPUP_CHAPTER_CLOCK[0];

/** A chapter's clock time (`HH:MM`, GDD § 4.2; page E is 10:00). */
export const chapterTime = (chapter: number): string => skyOf(chapter).time;

/** The environment multiplier for a chapter (identity at midnight; D-27's `worldGrade`). */
export const envGrade = (chapter: number): Rgb => worldGrade(chapterTime(chapter));

/** The characters' multiplier for a chapter: half the table's grade (D-27's `characterGrade`). */
export const standeeGrade = (chapter: number): Rgb => characterGrade(chapterTime(chapter));

/** True when a multiplier changes nothing. */
export const isIdentity = (g: Rgb): boolean => g[0] === 1 && g[1] === 1 && g[2] === 1;

/**
 * A short, stable name for a multiplier (file paths, manifest keys): the three channels in
 * thousandths, e.g. `775-785-860` for ×(0.775, 0.785, 0.86).
 */
export const gradeKey = (g: Rgb): string => g.map((c) => String(Math.round(c * 1000)).padStart(3, '0')).join('-');

/** Colours the environment grade never touches (bible § 3.3: lights, touchables, shadow tint). */
const NEVER_GRADED: readonly string[] = [
  // Lights: lamps, lit vellum windows, neon, the moon, pinhole stars, lamp shades
  POPUP.lamp, POPUP.lampHot, POPUP.lampAmber, POPUP.windowTop, POPUP.windowMid, POPUP.neonPink, POPUP.neonCyan,
  POPUP_NEON.neonViolet, POPUP_NEON.neonRed,
  // The airfield's lights (#124): taxi amber, wing-tip red and green, the taxiways' blue, runway white
  POPUP_AIRPORT.taxiAmber, POPUP_AIRPORT.wingRed, POPUP_AIRPORT.wingGreen, POPUP_AIRPORT.taxiBlue, POPUP_AIRPORT.runwayWhite,
  // The gondolas' lit windows over 貓空 (#126)
  POPUP_MAOKONG.gondolaAmber,
  POPUP.moon, POPUP.moonRim, POPUP.pinhole, POPUP.bulb, POPUP_STAGE.lampShade,
  // Foil (it catches the light) and brass
  POPUP.gold, POPUP.goldLight, POPUP.goldDeep, POPUP.foilShine, POPUP.brassShine,
  ...Object.values(POPUP_FOIL).flatMap((stops) => stops.map(([, c]) => c)),
  // Touchables and affordances (bible § 4): marigold, the seal, chalk, the done knot, badges
  POPUP.marigold, POPUP.marigoldLight, POPUP.marigoldDeep, POPUP.marigoldEdge, POPUP.marigoldShine, POPUP.ridgeLight,
  POPUP.seal, POPUP.sealDark, POPUP.sealGlyph, POPUP.sealHairline, POPUP.chalk, POPUP.doneGreen, POPUP.lockBadge,
  // The light catching cut edges, and the indigo shadow tint (bible § 3.3: always the same indigo)
  POPUP.cutRim, POPUP.shadow, POPUP.vignette,
  // The standee card (the characters have their own half grade)
  POPUP.standeeCard, POPUP.standeeCut,
];

/**
 * The colours a chapter's backdrop keeps ungraded: `NEVER_GRADED` plus its sky (the colour clock
 * *is* the sky, bible § 3.3) and the stops `stageDefs` mixes from it.
 */
export function keepColours(chapter: number): ReadonlySet<string> {
  const sky = skyOf(chapter);
  const mixes = [0.3, 0.38, 0.42, 0.44, 0.62, 0.72].map((t) => mixHex(sky.top, sky.horizon, t));
  return new Set([...NEVER_GRADED, sky.top, sky.horizon, ...mixes].map((c) => c.toUpperCase()));
}

const HEX = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;

/**
 * Bakes a grade into an SVG string: every `#RGB` / `#RRGGBB` colour multiplied by `by`, except
 * those in `keep` (compared upper-case). Pure; identity grades return the input unchanged.
 */
/**
 * The inverse of the bake's grade for a chapter's backdrop (D-99, chapter 10): every colour the
 * bake would grade divided by the chapter's grade, so a drawing authored in **screen colours** lands
 * back on them after `gradeSvg`. Lets a chapter's backdrops and its parts (never graded) share one kit.
 */
export function ungradeSvg(svg: string, chapter: number): string {
  const g = envGrade(chapter);
  return gradeSvg(svg, [1 / g[0], 1 / g[1], 1 / g[2]], keepColours(chapter));
}

export function gradeSvg(svg: string, by: Rgb, keep: ReadonlySet<string> = new Set()): string {
  if (isIdentity(by)) return svg;
  return svg.replace(HEX, (match, hex: string) => {
    const full = `#${(hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex).toUpperCase()}`;
    return keep.has(full) ? match : multiplyHex(full, by);
  });
}
