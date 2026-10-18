/**
 * Colour tokens: the only place a hex may appear (art direction § 3, § 8.2 rule 7).
 *
 * - `LINE`, `MATERIALS`, `EYES`, `RIM`: characters (§ 3.1, § 2.3–2.4). Materials come as ramps:
 *   `base` (lit), `cel` (the hard shadow band), `deep` (occlusion) and `line` (the thin interior
 *   line tint). Contours use `LINE.sil`.
 * - `WORLD`: night-painted surfaces (tiles, props, glass). These are graded by the clock.
 * - `LIGHTS`: things that glow (windows, lamps, 101's rim, city glow). Never graded: the city's
 *   lights stay warm all night.
 * - `UI`: the navy-glass and gold interface, mirrored into Tailwind (`tailwind.config.ts`).
 * - `MRT`: the five 月亮線 line colours.
 * - `SKY_KEYS` / `skyAt()` / `gradeTokens()` / `gradeCharacter()`: the night clock (§ 3.2).
 *
 * Pure TypeScript with no imports, so the Tailwind config, the engine and tests can all load it.
 */

// ---------------------------------------------------------------------------------------------
// Characters

/** Line and neutrals (§ 3.1). `ink` is UI text on light surfaces; `sil` is every character contour. */
export const LINE = {
  sil: '#5A2C34',
  ink: '#2E2235',
  inkOnDark: '#F4F2FF',
  mutedOnDark: '#BFC2EA',
  parchment: '#F3E6CC',
  contactShadow: '#1E1430',
} as const;

/**
 * One material's cel ramp. `deep` and `line` are absent where § 3.1 has none (the red string);
 * some ramps carry extra named tints (the hair's angel ring, the pajama's far limbs).
 */
export type Material = {
  readonly base: string;
  readonly cel: string;
  readonly deep?: string;
  readonly line?: string;
  readonly [tint: string]: string | undefined;
};

/** Character material ramps (§ 3.1 table), with the extra named tints the table lists beside them. */
export const MATERIALS = {
  skin: { base: '#FFE7D6', cel: '#F6C0AA', deep: '#E89E8C', line: '#C9786A' },
  /** 寶咖咖's hair; `ring`/`ringLight` are the angel-ring band and its bright streaks (§ 2.4) */
  hair: { base: '#6A4234', cel: '#46281F', deep: '#2E1913', line: '#2A1612', ring: '#8E5A46', ringLight: '#F0C4AC' },
  /** `far` is the pajama colour on far limbs, a step darker so depth reads */
  pajama: { base: '#FFD86A', cel: '#EFA846', deep: '#D6863A', line: '#B06A28', far: '#F4C458' },
  /** Collar, cuffs and footie soles */
  cream: { base: '#FFF6E6', cel: '#EBD3B4', deep: '#D6B48E', line: '#A8825E' },
  bearPatch: { base: '#B98058', cel: '#93603E', deep: '#744628', line: '#5A3420' },
  redString: { base: '#E5483E', cel: '#9E2A2A' },
  /** The 金鎖片 lock and Mocha's tag */
  gold: { base: '#FFD66A', cel: '#E0A83A', deep: '#B8822A', line: '#8A5E1E' },
  tabby: { base: '#D7975E', cel: '#AE6C3E', deep: '#8A5232', line: '#6E3A22', stripe: '#7A4628' },
  furCream: { base: '#FFF5E8', cel: '#EAD2B8', deep: '#D6B898', line: '#A8866A' },
  bandana: { base: '#4A8BDA', cel: '#2F62B0', deep: '#234A8A', line: '#1E3E78' },
  /**
   * Far-side ramps (§ 2.3 depth groups): limbs behind the body, a step darker so depth reads. The
   * § 3.1 table lists only the pajama's far base; the rest of both ramps come from the reference
   * generator (`_gen/anime2.py`, `pj2` and `fur2`).
   */
  pajamaFar: { base: '#F4C458', cel: '#DE9640', deep: '#C47634', line: '#A0602A' },
  tabbyFar: { base: '#C4844E', cel: '#9C5E34', deep: '#7A4628', line: '#5E3020' },
} as const satisfies Record<string, Material>;

export type MaterialName = keyof typeof MATERIALS;

/** `MATERIALS` with every tint as a plain hex string (what `gradeCharacter` returns). */
export type MaterialTokens = { readonly [K in MaterialName]: { readonly [F in keyof (typeof MATERIALS)[K]]: string } };

/** Iris gradients, dark top → mid → warm bottom (§ 2.5). */
export const EYES = {
  brown: ['#2E1A12', '#7A4628', '#D99A56'],
  cat: ['#2E4A12', '#86AE2A', '#ECEC72'],
} as const;

/**
 * Small character details that are not a whole material ramp (§ 2.4–2.6), with the values the
 * reference generators use (`_gen/anime.py`, `_gen/anime2.py`).
 */
export const ACCENTS = {
  /** Sclera and speculars */
  white: '#FFFFFF',
  pupil: '#140A06',
  irisRing: '#2A140E',
  /** The eyelid shadow crescent (drawn at ~55% opacity) */
  lidShadow: '#1A0C08',
  /** Iris rays and the lower reflected-light arc in brown eyes */
  irisLight: '#F7D49A',
  lash: '#2E1A12',
  brow: '#8A5040',
  nose: '#D98A7A',
  mouth: '#A83E48',
  mouthLine: '#7A2A32',
  tongue: '#FF8F98',
  /** Blush: the radial gradient's colour and its three hatch strokes */
  blush: '#FF7F86',
  blushHatch: '#F06A74',
  /** The pajama's star print */
  star: '#FFF6DA',
  /** Footie soles: the grip strip in side view, the grip dots in sole view */
  soleStrip: '#FFF2DC',
  gripDot: '#F09A3A',
} as const;

/**
 * The stand-in sprite for art that isn't drawn yet (decision D-14): a neutral lavender-grey
 * silhouette with a navy label plate. Deliberately off-palette for characters, so a placeholder
 * can't be mistaken for finished art.
 */
export const PLACEHOLDER = {
  body: '#8E91BE',
  cel: '#6E71A0',
  line: '#4A4D7C',
  plate: '#161A4E',
  plateEdge: '#E8C77A',
  glyph: '#FFE9B0',
} as const;

/** Art lab overlays (dev only): the skeleton's bones and joints. */
export const DEV = {
  bone: '#FF2E7A',
  joint: '#FFFFFF',
} as const;

/**
 * Rim and highlight lights on characters (§ 2.4, § 3.2): `warm` on the lit cheek, `moon` on the
 * back edge, `lamp` near street lamps, then the pre-dawn `violet`, `dawn` and sunrise `gold`.
 */
export const RIM = {
  warm: '#FFF6EE',
  moon: '#CFEAFF',
  lamp: '#FFC890',
  violet: '#D8C8FF',
  dawn: '#FFD0B0',
  gold: '#FFE09A',
} as const;

// ---------------------------------------------------------------------------------------------
// World

/**
 * Night-painted surfaces (§ 3.1 *World*), as painted for 00:00. `gradeTokens(time)` re-grades
 * them for a map's clock; never use these raw on a map.
 */
export const WORLD = {
  grass: '#2E5A58',
  grassAlt: '#2A5452',
  brick: '#6E3A4E',
  brickAlt: '#683648',
  asphalt: '#2A2E58',
  water: '#24407E',
  /** Glass on the lit side, top → bottom */
  glassLit: '#3E5A9A',
  glassLitLow: '#2A3E78',
  /** Glass on the shaded side, top → bottom */
  glassShade: '#1C2858',
  glassShadeLow: '#141C44',
} as const;

export type WorldTokens = { readonly [K in keyof typeof WORLD]: string };

/** Light sources (§ 3.1 *World*). Emissive, so the night grade never touches them. */
export const LIGHTS = {
  windowWarm: '#FFD98A',
  windowPale: '#FFE9C0',
  windowCool: '#9AE0FF',
  /** Lamp bloom: core → mid → transparent */
  lampCore: '#FFE6B0',
  lampMid: '#FFC27A',
  rim101: '#8AF0E0',
  cityGlow: '#E88E8A',
  cityGlowWarm: '#FF9A7A',
} as const;

// ---------------------------------------------------------------------------------------------
// UI

/**
 * The anime-JRPG interface (§ 3.1 *UI*, § 7.2–7.6). Gradients are listed as their stops, top →
 * bottom or left → right. `panelTop`/`panelBottom` are the panel stops as solid colours, used to
 * check contrast; the panel itself is the translucent pair.
 */
export const UI = {
  panelTopGlass: 'rgba(22,26,78,.96)',
  panelBottomGlass: 'rgba(10,11,34,.99)',
  panelTop: '#161A4E',
  panelBottom: '#0A0B22',
  gold: '#E8C77A',
  goldLight: '#FFE9B0',
  goldDeep: '#C9A04A',
  inkOnDark: LINE.inkOnDark,
  mutedOnDark: LINE.mutedOnDark,
  ink: LINE.ink,
  parchment: LINE.parchment,
  /** The one primary button per screen (§ 7.2) */
  primaryTop: '#FFEFC0',
  primaryMid: '#F0C060',
  primaryBottom: '#D89A3A',
  primaryText: '#1A1440',
  /** Command buttons (§ 7.2) */
  commandTop: '#262E74',
  commandBottom: '#161B4C',
  /** Corner diamond ornaments (§ 7.2) */
  diamondLight: '#FFF2C8',
  hpFrom: '#3FC88A',
  hpTo: '#9AF0B8',
  hpLowFrom: '#F08A3A',
  hpLowTo: '#FFC27A',
  hpCritFrom: '#FF5A8A',
  hpCritTo: '#FF9AB8',
  mpFrom: '#4A8AF0',
  mpTo: '#9AC8FF',
  damage: '#FFFFFF',
  damageStroke: '#C2185B',
  /** The 布袋戲 proscenium on boss fights (§ 7.4) */
  vermilion: '#B5322F',
  /** Departure-board digits on the chapter card (§ 7.6) */
  amber: '#FFB84A',
  /** Locked 路線圖 stations and other disabled marks on navy */
  locked: '#5D6190',
  /** The sub-label on the gold primary button (MP cost, item count): a deep brown that reads on every stop */
  primarySub: '#3E2410',
  /** The departure board behind the chapter card's clock, darker than any panel, and its unlit dots */
  board: '#07081A',
  boardDot: '#2A2034',
  /** The dark scrim over the map behind dialogue and sheets (drawn translucent) */
  scrim: '#0A0820',
  /** The HP lag bar: the pale band that catches up after a hit (§ 7.3) */
  hpLag: '#FFF2E0',
} as const;

/**
 * Speaker backlights (§ 7.5): the soft radial glow behind a dialogue bust. Each speaker has one
 * (`SPEAKERS[id].color`, heroes in `HERO_BACKLIGHT`); the default is by role.
 */
export const BACKLIGHT = {
  /** Moonlit blue: the default for the cast at night, and 摩卡貓's cool reference glow */
  moon: '#A0BEFF',
  /** Lamp warm: family and townsfolk */
  warm: '#FFC98A',
  /** 寶咖咖's pajama gold */
  gold: '#FFE09A',
  /** Jade: 摩卡貓's eyes */
  jade: '#9AF0C0',
  /** Sky blue: 阿藍 */
  sky: '#8AD0FF',
  /** Amber: 黑糖 */
  amber: '#FFB870',
  /** Violet: mischief-makers, foes and bosses */
  violet: '#D0A8FF',
  /** Rose: 咻咻 and other wind spirits */
  rose: '#FF9AB8',
} as const;

export type Backlight = keyof typeof BACKLIGHT;

/** The five 月亮線 line colours (§ 4.2, MRT cars row): the real Taipei line colours. */
export const MRT = {
  red: '#E3002C',
  blue: '#0070BD',
  green: '#008659',
  orange: '#F8B61C',
  brown: '#C48C31',
} as const;

// ---------------------------------------------------------------------------------------------
// The night clock (§ 3.2)

export type Rgb = readonly [number, number, number];

/** Where the moon is (1 = high, 0 = on the horizon, below 0 = set) and how far dawn has come (0–1). */
export type SkyKey = {
  readonly time: string;
  readonly top: string;
  readonly mid: string;
  readonly horizon: string;
  readonly moon: number;
  readonly dawn: number;
  /** Per-channel multiplier on the environment, as in the § 3.2 table (1, 1, 1 = none) */
  readonly grade: Rgb;
  /** The rim light on characters */
  readonly rim: string;
  /** True where the table says "local": the location's own light colour (lamp, neon) wins over `rim` */
  readonly localRim: boolean;
};

/** The keys of the § 3.2 table, in time order. Every other minute interpolates between two of them. */
export const SKY_KEYS: readonly SkyKey[] = [
  { time: '00:00', top: '#0A1034', mid: '#1A2A6A', horizon: '#3A3A86', moon: 1, dawn: 0, grade: [0.55, 0.57, 0.72], rim: RIM.moon, localRim: false },
  { time: '01:00', top: '#0B1238', mid: '#1E2E70', horizon: '#4A4A96', moon: 0.9, dawn: 0, grade: [0.55, 0.57, 0.72], rim: RIM.moon, localRim: false },
  { time: '02:00', top: '#0C1440', mid: '#26307A', horizon: '#6A5AA4', moon: 0.6, dawn: 0, grade: [0.58, 0.58, 0.74], rim: RIM.moon, localRim: true },
  { time: '03:00', top: '#101848', mid: '#2E3684', horizon: '#8A6AB0', moon: 0.32, dawn: 0, grade: [0.6, 0.6, 0.75], rim: RIM.moon, localRim: true },
  { time: '04:00', top: '#16205A', mid: '#3A3F92', horizon: '#A878B8', moon: 0.1, dawn: 0, grade: [0.64, 0.63, 0.78], rim: RIM.moon, localRim: true },
  { time: '04:30', top: '#1E2A66', mid: '#4A4A9E', horizon: '#C88AB8', moon: -0.1, dawn: 0, grade: [0.7, 0.68, 0.8], rim: RIM.violet, localRim: false },
  { time: '05:00', top: '#2A3274', mid: '#6A5AA8', horizon: '#E8A0A8', moon: -0.2, dawn: 0.35, grade: [0.78, 0.74, 0.84], rim: RIM.violet, localRim: false },
  { time: '05:15', top: '#3A3A80', mid: '#8A6AAE', horizon: '#F4B49A', moon: -0.3, dawn: 0.65, grade: [0.86, 0.8, 0.86], rim: RIM.dawn, localRim: false },
  { time: '05:29', top: '#4A5AA0', mid: '#E8A0A0', horizon: '#FFD27A', moon: -0.4, dawn: 1, grade: [1, 1, 1], rim: RIM.gold, localRim: false },
];

/** The sky at one minute: the same fields as a key, with `time` normalised to `HH:MM`. */
export type Sky = SkyKey;

const CLOCK = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** `HH:MM` → minutes after midnight. Throws on anything else, so a typo in content fails loudly. */
export function clockMinutes(time: string): number {
  const match = CLOCK.exec(time);
  if (!match) throw new Error(`not a clock time (HH:MM): ${JSON.stringify(time)}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

const channels = (hex: string): Rgb => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const toHex = (rgb: Rgb): string =>
  `#${rgb.map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Mixes two `#RRGGBB` colours in sRGB; `t` 0 → `a`, 1 → `b`. */
export function mixHex(a: string, b: string, t: number): string {
  const [ca, cb] = [channels(a), channels(b)];
  return toHex([lerp(ca[0], cb[0], t), lerp(ca[1], cb[1], t), lerp(ca[2], cb[2], t)]);
}

/** A `#RRGGBB` colour with an alpha in [0, 1], as `#RRGGBBAA` (for gradients built from tokens). */
export function withAlpha(hex: string, alpha: number): string {
  return `${hex}${Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, '0').toUpperCase()}`;
}

/** Multiplies each channel of a `#RRGGBB` colour (clamped to 255). */
export function multiplyHex(hex: string, by: Rgb): string {
  const c = channels(hex);
  return toHex([c[0] * by[0], c[1] * by[1], c[2] * by[2]]);
}

const round3 = (value: number) => Math.round(value * 1000) / 1000;
const KEY_MINUTES = SKY_KEYS.map((key) => clockMinutes(key.time));
const skyCache = new Map<number, Sky>();

/**
 * The sky for a clock time. Exact at the keys; linear between them (colours mixed in sRGB, the
 * rim's "local" flag taken from the earlier key). The night ends at 05:29: later times (the 10:00
 * party, the post-game sunrise) get the 05:29 sky, which has no grade. Memoised per minute.
 */
export function skyAt(time: string): Sky {
  const minutes = clockMinutes(time);
  const hit = skyCache.get(minutes);
  if (hit) return hit;

  const last = SKY_KEYS.length - 1;
  let next = KEY_MINUTES.findIndex((at) => at >= minutes);
  if (next === -1) next = last;
  let sky: Sky;
  if (KEY_MINUTES[next] === minutes || (next === last && minutes > KEY_MINUTES[last])) {
    sky = { ...SKY_KEYS[next], time };
  } else {
    const [a, b] = [SKY_KEYS[next - 1], SKY_KEYS[next]];
    const t = (minutes - KEY_MINUTES[next - 1]) / (KEY_MINUTES[next] - KEY_MINUTES[next - 1]);
    sky = {
      time,
      top: mixHex(a.top, b.top, t),
      mid: mixHex(a.mid, b.mid, t),
      horizon: mixHex(a.horizon, b.horizon, t),
      moon: round3(lerp(a.moon, b.moon, t)),
      dawn: round3(lerp(a.dawn, b.dawn, t)),
      grade: [round3(lerp(a.grade[0], b.grade[0], t)), round3(lerp(a.grade[1], b.grade[1], t)), round3(lerp(a.grade[2], b.grade[2], t))],
      rim: mixHex(a.rim, b.rim, t),
      localRim: a.localRim,
    };
  }
  Object.freeze(sky);
  skyCache.set(minutes, sky);
  return sky;
}

const MIDNIGHT_GRADE = SKY_KEYS[0].grade;

/**
 * The multiplier `gradeTokens` applies to `WORLD` at a time. The § 3.1 world colours are already
 * painted for 00:00 (they are what the reference art uses at midnight), so the table's grade is
 * taken relative to the 00:00 row: identity at midnight, lifting toward the ungraded colours as
 * dawn comes (decision D-27).
 */
export function worldGrade(time: string): Rgb {
  const grade = skyAt(time).grade;
  return [round3(grade[0] / MIDNIGHT_GRADE[0]), round3(grade[1] / MIDNIGHT_GRADE[1]), round3(grade[2] / MIDNIGHT_GRADE[2])];
}

/**
 * The multiplier for characters at a time: half the table's grade (1 − (1 − g) / 2), so they are
 * dimmed by the night a little but always pop off the ground. Character materials are authored
 * in daylight colours, so this applies to `MATERIALS` directly.
 */
export function characterGrade(time: string): Rgb {
  const grade = skyAt(time).grade;
  return [round3(1 - (1 - grade[0]) / 2), round3(1 - (1 - grade[1]) / 2), round3(1 - (1 - grade[2]) / 2)];
}

const worldCache = new Map<string, WorldTokens>();
const characterCache = new Map<string, MaterialTokens>();

/**
 * `WORLD` with the night grade for a clock time baked in: plain hex strings, for the memoised
 * map ground and props (never a CSS filter or blend layer, § 3.2 and § 8.5). Pure; memoised per
 * time, so the same time returns the same frozen object.
 */
export function gradeTokens(time: string): WorldTokens {
  const hit = worldCache.get(time);
  if (hit) return hit;
  const by = worldGrade(time);
  const graded = Object.freeze(Object.fromEntries(Object.entries(WORLD).map(([name, hex]) => [name, multiplyHex(hex, by)])) as WorldTokens);
  worldCache.set(time, graded);
  return graded;
}

/**
 * `MATERIALS` at half the night grade (every hex field of every ramp). Pure; memoised per time.
 */
export function gradeCharacter(time: string): MaterialTokens {
  const hit = characterCache.get(time);
  if (hit) return hit;
  const by = characterGrade(time);
  const graded = Object.freeze(
    Object.fromEntries(
      Object.entries(MATERIALS).map(([name, ramp]) => [
        name,
        Object.freeze(Object.fromEntries(Object.entries(ramp).map(([field, hex]) => [field, multiplyHex(hex, by)]))),
      ]),
    ),
  ) as MaterialTokens;
  characterCache.set(time, graded);
  return graded;
}

// ---------------------------------------------------------------------------------------------
// Legacy

/**
 * @deprecated legacy sprite colour. The warm daytime palette of the old 仙俠 sprites; they keep
 * using it until #11 and #16+ redraw them in option D, then this goes. New code uses the tokens above.
 */
export const C = {
  ink: '#3B2A20', // Outlines and dark detail
  cream: '#FFF7E8', // Lightest background
  paper: '#F3E3C3', // Light objects
  sun: '#F2A93B', // Warm yellow
  sunDeep: '#E08A22',
  berry: '#D9564F', // Red
  berryDeep: '#B23F3A',
  leaf: '#5C9E63', // Green
  leafDeep: '#3F7A48',
  sky: '#7FB6D9', // Blue
  skyDeep: '#4E8FBA',
  mocha: '#A8703E', // Mocha Cat's fur
  mochaDeep: '#7E5029',
  plum: '#8E6E9E', // Purple
  plumDeep: '#6B4E7A',
  teal: '#3F8F88',
  tealDeep: '#2E6B66',
  sand: '#E8CE9A', // Sand and wood
  sandDeep: '#C9A96A',
  white: '#FFFFFF',
  grey: '#B9AFA4',
  greyDeep: '#8C8177',

  // Skin, in two tones so a face can be shaded
  skin: '#F7DDC2',
  skinDeep: '#DFBB98',
  // Hair reads as near-black but is warmer than the outline, so ink lines stay visible on it
  hair: '#2B1E19',
  hairDeep: '#1C1310',
  hairLight: '#4E392E',
  // 仙俠 costume accents
  jade: '#6FB2A0',
  jadeDeep: '#3F8272',
  gold: '#E8C15A',
  goldDeep: '#B8923A',
  wine: '#9B3F4A',
  wineDeep: '#6E2A34',
} as const;

