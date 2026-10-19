/**
 * Colour tokens: the only place a hex may appear (art direction § 3, § 8.2 rule 7).
 *
 * - `LINE`, `MATERIALS`, `EYES`, `RIM`: characters (§ 3.1, § 2.3–2.4). Materials come as ramps:
 *   `base` (lit), `cel` (the hard shadow band), `deep` (occlusion) and `line` (the thin interior
 *   line tint). Contours use `LINE.sil`.
 * - `WORLD`: night-painted surfaces (tiles, props, glass). These are graded by the clock.
 * - `LIGHTS`, `GLOW`: things that glow (windows, lamps, lanterns, neon, 101's rim, city glow).
 *   Never graded: the city's lights stay warm all night.
 * - `TILES`, `STRUCTURE`, `FIXTURE`, `SKY_ART`: the iso map's ground materials, walls and skirt,
 *   light fixtures and sky art (§ 2.7, § 4.4), graded per clock by `gradeTiles()`.
 * - `UI`: the navy-glass and gold interface, mirrored into Tailwind (`tailwind.config.ts`).
 * - `MRT`: the five 月亮線 line colours.
 * - `POPUP`, `POPUP_FOIL`, `POPUP_CHAPTER_CLOCK`: 翻翻台北's pop-up book (popup art bible): cover,
 *   page, ink, marigold touchables, seal, light, paper stocks, standees, UI; foils; colour clock.
 * - `POPUP_STAGE`: the page renderer's placeholder stage (floors, ledges, facade, stand-in characters).
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
  /** 寶咖咖's toy block (積木, `block()` in the generator): front, side (cel), top and the lit edge */
  toyBlock: { base: '#F0564A', cel: '#B23436', top: '#FFB2A2', shine: '#FFC4B8', star: '#FFF6E6' },
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
  /** Tears: the welling line along the lower lid and the drop on the cheek (淚汪汪, 哇哇大哭) */
  tear: '#BFE8FF',
  tearLine: '#7AB8E0',
  /** Surprise and laugh marks beside the face */
  markRed: '#F06A74',
} as const;

/**
 * 摩卡貓's face and props (§ 5.2), with the reference generator's values (`_gen/anime.py`
 * `mocha_head`/`cat_eye`, `_gen/anime2.py` `mc_sit`). His fur, bib and bandana ramps are the
 * `tabby`, `furCream` and `bandana` materials.
 */
export const CAT = {
  /** Inner ear: near ear lit, far ear in shade; the pale tufts */
  earInner: '#F4A6A4',
  earInnerFar: '#E58E92',
  earTuft: '#FFF2E6',
  /** Warm rim on the lit cheek */
  furRim: '#F8D2A2',
  /** Eye: sclera, iris ring, rays, slit pupil, lid shadow, the lower reflected light */
  sclera: '#FFFDF6',
  irisRing: '#24380E',
  irisLight: '#F4F49A',
  pupil: '#120A06',
  lidShadow: '#1A2A08',
  reflect: '#FBFFB0',
  /** Nose leather and its line, the mouth line */
  nose: '#F0848C',
  noseLine: '#A84A54',
  mouthLine: '#6E2A2A',
  blush: '#FF8A8A',
  whisker: '#FFFBF2',
  /** Toe-bean splits on the white socks */
  pawSplit: '#B8987A',
  /** Bandana polka dots and the lit hem */
  bandanaDot: '#FFF5E2',
  bandanaLight: '#9CC4FF',
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
  /** Foes and bosses in battle (§ 6.1 *Foe rim light*) */
  foe: '#D3A8FF',
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

/**
 * Extra light colours for `GameMap.lights` kinds (§ 2.7, § 4.2): red lanterns, neon tubes (only
 * where § 4.3 allows), cool screens and moonlight pools. Emissive, never graded, like `LIGHTS`.
 */
export const GLOW = {
  lanternCore: '#FFD0A0',
  lantern: '#FF8A5A',
  neonPink: '#FF5FA2',
  neonCyan: '#4FD1C5',
  screen: '#9AE0FF',
  moonCore: '#FFF8E6',
  moon: '#DDE6FF',
  /** A door's warm spill, so the way on reads at a glance */
  door: '#FFC98A',
  /** Fireflies (ambient FX): a soft halo and a bright point */
  firefly: '#C8FF8A',
  fireflyCore: '#F4FFD0',
} as const;

/**
 * One ground material's night ramp (§ 4.4), painted for 00:00 like `WORLD` and graded with it
 * (`gradeTiles`). `base`/`alt` are the two fills a seeded hash picks between, `lit` the 1px
 * top-left edge and kerbs, `line` dark marks (joints, seams), `mark`/`accent` light marks (grass
 * blades, lane paint, ripples), `deep` the band on the diorama skirt under the material.
 */
export type TileRamp = {
  readonly base: string;
  readonly alt: string;
  readonly lit: string;
  readonly line: string;
  readonly mark: string;
  readonly accent: string;
  readonly deep: string;
};

/**
 * The § 4.4 tile materials (grass, brick and asphalt are the § 3.1 *World* values; water's base is
 * `WORLD.water`). Every `Material` in the engine has a ramp here, plus the door threshold.
 */
export const TILES = {
  grass: { base: '#2E5A58', alt: '#2A5452', lit: '#5A9A8A', line: '#1E3E40', mark: '#4E8A7A', accent: '#6AAE92', deep: '#1E3A3A' },
  gravel: { base: '#4A4664', alt: '#46425F', lit: '#8A86AA', line: '#34304C', mark: '#6A6688', accent: '#5A5678', deep: '#2E2A44' },
  brickWalk: { base: '#6E3A4E', alt: '#683648', lit: '#B0687A', line: '#4A2638', mark: '#8A4C60', accent: '#5A5470', deep: '#4A2638' },
  asphalt: { base: '#2A2E58', alt: '#282C54', lit: '#5A6098', line: '#1A1C3E', mark: '#C8CCE8', accent: '#3A4278', deep: '#1A1C3E' },
  zebra: { base: '#2A2E58', alt: '#2A2E58', lit: '#5A6098', line: '#1A1C3E', mark: '#C8CCE8', accent: '#9EA4CC', deep: '#1A1C3E' },
  water: { base: '#24407E', alt: '#223C78', lit: '#7AA8E8', line: '#14285A', mark: '#AFCFFF', accent: '#5A88D0', deep: '#14285A' },
  marble: { base: '#24253C', alt: '#8E90AE', lit: '#C8CCE8', line: '#16172A', mark: '#B8BAD4', accent: '#5E6080', deep: '#1E1E34' },
  undergroundTile: { base: '#3C4864', alt: '#3A4560', lit: '#7A88A8', line: '#283048', mark: '#56648A', accent: '#4A587A', deep: '#222A40' },
  wood: { base: '#5E4048', alt: '#5A3C45', lit: '#9A747A', line: '#3E2832', mark: '#74525A', accent: '#4A3038', deep: '#3A2430' },
  rug: { base: '#6A3A5A', alt: '#663757', lit: '#A86A8A', line: '#4A2440', mark: '#C89A6A', accent: '#8A4E72', deep: '#3E2236' },
  playMat: { base: '#3E5A7E', alt: '#574A7E', lit: '#8A9ACA', line: '#2A3458', mark: '#6A7AAA', accent: '#7A5A8E', deep: '#262E4E' },
  oldBrick: { base: '#6A3C42', alt: '#64383E', lit: '#A8686A', line: '#46262C', mark: '#80484E', accent: '#5E5468', deep: '#422428' },
  stoneSlab: { base: '#4A4A64', alt: '#464660', lit: '#8A8AAA', line: '#30304A', mark: '#5E5E7C', accent: '#3E3E58', deep: '#2C2C44' },
  planks: { base: '#4E3A46', alt: '#4A3642', lit: '#8A6A76', line: '#2E2028', mark: '#64505A', accent: '#3A2A34', deep: '#2A1E26' },
  stallTile: { base: '#4A3E5C', alt: '#463A58', lit: '#8A7EA6', line: '#32283E', mark: '#5E5274', accent: '#6A5A3E', deep: '#2C2438' },
  grate: { base: '#363A56', alt: '#343852', lit: '#7A80A6', line: '#1E2238', mark: '#4E5476', accent: '#262A42', deep: '#1E2238' },
  apron: { base: '#464A6C', alt: '#44486A', lit: '#868AAE', line: '#30324E', mark: '#C8A84A', accent: '#3A3E5E', deep: '#2C2E48' },
  runway: { base: '#2A2C4E', alt: '#282A4A', lit: '#5A5E8E', line: '#1A1C36', mark: '#C8CCE8', accent: '#4A6AC8', deep: '#1A1C36' },
  teaSoil: { base: '#4A3A40', alt: '#46363C', lit: '#84686E', line: '#30242A', mark: '#2E5A48', accent: '#3E7A5A', deep: '#2C2026' },
  wetStone: { base: '#3E4662', alt: '#3A425E', lit: '#7A88AE', line: '#262C44', mark: '#5A6A8E', accent: '#6A7EA8', deep: '#242A40' },
  deck: { base: '#5A4450', alt: '#56404C', lit: '#967880', line: '#3A2A32', mark: '#6E5660', accent: '#44323C', deep: '#34262E' },
  jadeWater: { base: '#1E6A6A', alt: '#1C6464', lit: '#6ACCB8', line: '#0E4448', mark: '#8AE0C8', accent: '#3E9A8E', deep: '#0E3E42' },
  seawall: { base: '#4E5068', alt: '#4A4C64', lit: '#8C8EA8', line: '#34364C', mark: '#626480', accent: '#3E405A', deep: '#2E3046' },
  polished: { base: '#4A4A6E', alt: '#48486A', lit: '#9A9AC4', line: '#30304E', mark: '#6A6A96', accent: '#8A8AB8', deep: '#2C2C48' },
  carpet: { base: '#5A2E4A', alt: '#562C46', lit: '#965A7A', line: '#3E1E32', mark: '#7A3E60', accent: '#C89A6A', deep: '#36182C' },
  deckGrate: { base: '#3A3E56', alt: '#383C54', lit: '#7E84A6', line: '#22263A', mark: '#50567A', accent: '#2C3046', deep: '#22263A' },
  granite: { base: '#545670', alt: '#50526C', lit: '#9496B4', line: '#3A3C54', mark: '#6E7090', accent: '#3E4058', deep: '#34364E' },
  carFloor: { base: '#3E4258', alt: '#3C4056', lit: '#7E84A0', line: '#282C40', mark: '#52566E', accent: '#C8A030', deep: '#262A3E' },
  /** A doorway's threshold: warm boards with the way-out chevron */
  door: { base: '#6A4A44', alt: '#66463F', lit: '#B08A6E', line: '#44302C', mark: '#86604E', accent: '#FFC27A', deep: '#3E2A28' },
} as const satisfies Record<string, TileRamp>;

export type TileName = keyof typeof TILES;

/**
 * Raised structure (§ 4.4): plaster walls (interiors and courtyards) and fence railings, plus the
 * diorama skirt under the map's outer edges (§ 4.4 *Tile rules*). Painted for 00:00, graded.
 */
export const STRUCTURE = {
  wallTop: '#574868',
  wallTopLit: '#A898C8',
  /** The face toward screen-left catches the key light (upper-left); the right face is in shade */
  wallLeft: '#40365A',
  wallRight: '#2C2646',
  wallTrim: '#5E5080',
  wallBase: '#241E36',
  fencePost: '#3A2E42',
  fenceRail: '#5E4E62',
  fenceLit: '#A08EA0',
  skirtLeftTop: '#4A3A5E',
  skirtLeftBottom: '#2A2040',
  skirtRightTop: '#2E2444',
  skirtRightBottom: '#1A1430',
  skirtLine: '#6A5A86',
  /** The lit rim along the diorama's top edge */
  skirtRim: '#AFC0FF',
  shadow: '#0A0820',
} as const;

/** Light fixtures that stand on the map (street lamps, lantern posts, neon signs): graded like props. */
export const FIXTURE = {
  post: '#20243E',
  postLit: '#4A5080',
  head: '#2A2E4E',
  lanternBody: '#C8383A',
  lanternDeep: '#8A2028',
  lanternCap: '#3A2A2E',
  signBack: '#1A1A36',
} as const;

/**
 * The anime-film sky (§ 2.7), beside the clock's gradient (`skyAt`): stars, the moon and sun,
 * clouds lit from below by the city, the skyline, and the floor of night under the diorama.
 * `ridge`, `skyline*` and `floor*` are scenery and get the world grade; the rest is light.
 */
export const SKY_ART = {
  star: '#FFFFFF',
  starHalo: '#CFE0FF',
  milky: '#C8B8FF',
  moon: '#FFF8E6',
  moonCrater: '#EDE2C8',
  moonHalo: '#DDE6FF',
  moonHaloOuter: '#9AB0FF',
  sun: '#FFE09A',
  sunCore: '#FFF6D8',
  cloudTop: '#2A3474',
  cloudMid: '#5A5AA4',
  cloudUnder: '#E8A8C0',
  cloudLobe: '#7A84D0',
  cloudLobeLight: '#A8B4F0',
  cloudRim: '#FFC8D8',
  cloudEdge: '#C8D4FF',
  ridge: '#2A2C66',
  skyline: '#1E1E4E',
  skylineNear: '#15153C',
  haze: '#C87AA0',
  bokehPink: '#FF9AB0',
  bokehGold: '#FFE6A0',
  floorTop: '#3A2A62',
  floorMid: '#1E1844',
  floorBottom: '#0E0B26',
  /** Interiors: the dark room the map floats in, and its faint warm and moon-blue glows */
  roomTop: '#161838',
  roomBottom: '#07081A',
  roomGlow: '#3A2E5E',
} as const;


/**
 * Battle stage scenery (§ 2.7, § 4.1 item 5, § 8.4 *Battle backdrops*), painted for 00:00 like
 * `WORLD` and graded with it (`gradeStage`): the floors, the generic framers and the chapter
 * set-pieces (大安's band-shell and banyans are the template). Light on them is `STAGE_LIGHT`.
 */
export const STAGE = {
  /** Paving: wet slabs, top (by the horizon) → bottom (by the camera), joints, the wet sheen */
  paveTop: '#4A3C70',
  paveMid: '#2A2452',
  paveBottom: '#121030',
  paveJoint: '#16122E',
  paveLine: '#8C7CB4',
  paveSheen: '#A898D8',
  /** Grass verges and the park's tree line on the horizon */
  lawn: '#1E3C48',
  lawnDeep: '#122630',
  treeLine: '#14243A',
  treeLineRim: '#3E5C88',
  /** A wooden floor (the generic room) */
  woodTop: '#5A3A4E',
  woodMid: '#3A2440',
  woodBottom: '#1A1026',
  woodJoint: '#160C1E',
  woodLine: '#9A7088',
  /** The room: wall, skirting, window frame, curtains */
  wallTop: '#1E1C44',
  wallBottom: '#2E2650',
  skirting: '#16122C',
  frame: '#2A2448',
  frameLit: '#7A72B0',
  curtain: '#3A2A5E',
  curtainFold: '#241A42',
  curtainLit: '#6A5AA0',
  furniture: '#141230',
  furnitureRim: '#5A5290',
  /** Foreground framers: tree silhouettes (near black navy) with a moonlit rim */
  leaf: '#121A40',
  leafMid: '#1C2A5C',
  leafLit: '#2E4282',
  leafRim: '#7C9AE6',
  /** Leaf edges catching the warm stage light from below */
  leafWarm: '#A86A7A',
  trunk: '#141030',
  trunkMid: '#221C4A',
  trunkRim: '#7474BC',
  root: '#2A2452',
  rootLit: '#5A5A9E',
  /** Street furniture: lamp posts, railings, hedges */
  post: '#1A1C3A',
  postRim: '#5A5E98',
  hedge: '#142438',
  hedgeRim: '#3E6290',
  /** Distant city and the far ridge */
  city: '#1C1C4C',
  cityNear: '#141440',
  /** 台北101 on the horizon: body, the lit edge, the shaded edge */
  tower: '#1E2456',
  towerLit: '#3A4A8E',
  towerShade: '#12163C',
  /** 大安's 露天音樂台: the white shell lit from below, its ribs, the stage it stands on */
  shellRim: '#F4EEFF',
  shellTop: '#4E4888',
  shellMid: '#9A90CC',
  shellLow: '#E8DCF0',
  shellRib: '#C4B8E8',
  shellRibShade: '#6A62A0',
  shellOuter: '#2A2658',
  stageTop: '#5A5290',
  stageFace: '#221E48',
  stageFaceLow: '#14122E',
  stageLip: '#B8ACE0',
  step: '#3A3470',
} as const;

/** Emissive stage light (§ 2.7): uplights, footlights, fireflies, bokeh. Never graded. */
export const STAGE_LIGHT = {
  uplight: '#FFE2B0',
  uplightCore: '#FFF6E0',
  foot: '#FFD08A',
  shellGlow: '#FFE8C8',
  firefly: '#D8FF9A',
  towerLight: '#FFE6A0',
  towerTip: '#FF8A8A',
  moonShaft: '#C8D8FF',
  vignette: '#05051A',
  /** The faint violet aura behind every foe, and the gold bloom bosses add (§ 6.1, § 6.3) */
  aura: '#B88AFF',
  auraBoss: '#FFD27A',
} as const;

/**
 * The 布袋戲 proscenium (§ 7.4 *Boss fights*, borrowed from option B; decision D-08/D-31): the
 * vermilion frame, its deep and lit edges, the scalloped valance, gold studs and the inner gold
 * rules. UI art: never graded.
 */
export const FRAME = {
  vermilion: '#B5322F',
  vermilionDeep: '#7A1A1E',
  vermilionLit: '#D8504A',
  valance: '#E8553D',
  valanceDeep: '#A8302A',
  valanceLit: '#FF8A6A',
  stud: '#FFD670',
  studLit: '#FFF4C8',
  studDeep: '#B8862A',
  gold: '#E8C77A',
  goldLit: '#FFF2C8',
  goldDeep: '#9A7430',
  shadow: '#1A0610',
  tassel: '#FFB84A',
} as const;

/**
 * Battle VFX (§ 7.10, issue #15): emissive, never graded. Soft and toy-like (battles are tantrums,
 * not violence): gold for the glyph ring and heals, white-pink for impacts, the toy-block primaries,
 * 阿藍's cobalt feathers, the bridge cyan, 咻咻's storm greys. Solid objects (blocks, feathers, the
 * paw) take the character contour `LINE.sil` so they sit with the cast.
 */
export const FX = {
  core: '#FFFFFF',
  cream: '#FFF6E6',
  gold: '#FFD66A',
  goldLight: '#FFF1B8',
  goldDeep: '#E8A93A',
  /** Impacts and claw arcs: a warm pink-white, never red */
  pink: '#FF8FB8',
  pinkLight: '#FFD8E8',
  pinkDeep: '#E0609A',
  blockRed: '#F26B5E',
  blockRedDeep: '#C4473F',
  blockBlue: '#4F95E6',
  blockBlueDeep: '#2F66B8',
  blockGreen: '#5CC58E',
  blockGreenDeep: '#3A966A',
  blockYellow: '#FFD24A',
  blockYellowDeep: '#E09A2E',
  /** 哇哇大哭's sound rings and tears */
  sound: '#BDE6FF',
  soundDeep: '#6FB6F0',
  feather: '#3F74DC',
  featherLight: '#9CC2FF',
  featherDeep: '#2448A0',
  featherHood: '#26244A',
  /** 熊掌: the paw pad and the dust it kicks up */
  pad: '#FFE3C2',
  padDeep: '#E8B98A',
  dust: '#E2D2BE',
  dustDeep: '#B39C84',
  moon: '#FFF2C4',
  moonDeep: '#F2C25A',
  bridge: '#A8E4FF',
  bridgeLight: '#EAF8FF',
  bridgeDeep: '#4FA4E6',
  storm: '#C8D4E8',
  stormDeep: '#8A9AC0',
  rain: '#CFEAFF',
  neonPink: '#FF5FA2',
  neonCyan: '#5FE6DA',
  zap: '#FFF07A',
  water: '#82D8F6',
  waterDeep: '#3F9FDC',
  waterLight: '#E8FAFF',
  steam: '#F4F2FF',
  steamDeep: '#C9C6E6',
  star: '#FFE27A',
  starDeep: '#F0B43A',
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
  /** Gold: 阿嬤 and other warm elders */
  gold: '#FFE09A',
  /** Butter: 寶咖咖's footie pajamas (#16) */
  butter: '#FFE27A',
  /** Tabby orange: 摩卡貓's fur (#16) */
  tabby: '#F2A868',
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
// 翻翻台北 Pop-Up Taipei

/**
 * The pop-up book's tokens (popup art bible § 3, § 4, § 7; `docs/art/popup/src/kit.js` `C` and the
 * colours its helpers and proof D inline). The TS kit port in `src/popup/art/` (#139) reads every
 * colour from here; `tailwind.config.ts` mirrors the group as `popup-*`. Every value is a solid
 * `#RRGGBB`; multi-stop foils live in `POPUP_FOIL` and the chapter colour clock in
 * `POPUP_CHAPTER_CLOCK`. Text pairs (≥ 7:1) and graphic pairs (≥ 3:1) live in `contrast.ts`.
 *
 * Two deliberate departures from kit.js, both for GDD R5 (decisions D-40): `inkSoft` is darker
 * (kit `#5B4A5E` is 6.6:1 on the page) and red text on paper uses `sealInk`, not the seal red.
 */
export const POPUP = {
  /** Navy linen cover: the screen around the book, and the bottom bar */
  cover: '#1B2052',
  coverDark: '#121638',
  coverLight: '#2A3170',
  /** The vignette at the cover's corners */
  vignette: '#05061A',
  /** Gold foil trim on the cover */
  gold: '#E8C77A',
  goldLight: '#FFE9B0',
  goldDeep: '#B8893A',
  /** The cream page and its shaded band and cut edge */
  page: '#F3E6CC',
  pageDark: '#E2D0AE',
  pageEdge: '#D8C59F',
  /** The paper core catching light on a cut edge, drawn at 42 % on the top-left (bible § 2.2) */
  cutRim: '#FFF8E8',
  /** Text printed on paper */
  ink: '#2E2235',
  /** Secondary text on paper (sub-labels, the HUD's 第N章 line) */
  inkSoft: '#4A3A4E',
  /** Indigo shadow: shadows are never black (bible § 2.2) */
  shadow: '#140C34',

  // Touchables (bible § 4): the reserved marigold card, never night-graded
  marigold: '#FFC23A',
  marigoldLight: '#FFE38C',
  marigoldDeep: '#E39A17',
  marigoldEdge: '#A9650C',
  /** The inner hairline on a marigold card */
  marigoldShine: '#FFF6D6',
  /** The light rib of a ridged grip */
  ridgeLight: '#FFF3C2',
  /** The red verb seal (印章) and its pressed edge */
  seal: '#D8342A',
  sealDark: '#9E1F18',
  /** The white serif glyph on a seal, and the seal's inner hairline */
  sealGlyph: '#FFF4EA',
  sealHairline: '#FFE7D8',
  /** Red text printed on paper (the HUD's 「page title」): seal red darkened to 7:1 */
  sealInk: '#8C1A14',
  /** Chalk: Mocha's perch paw, hold-to-reveal outlines, captions on night card */
  chalk: '#FFF7E0',
  /** Brass split-pin and foil highlights */
  brassShine: '#FFF8DC',
  foilShine: '#FFFBEA',
  /** The small green check knot on a solved part (bible § 4.1 done) */
  doneGreen: '#3FA86A',
  /** The paw badge on a locked part */
  lockBadge: '#3A2E66',

  // Light on paper (bible § 3.3)
  lamp: '#FFD98A',
  lampHot: '#FFF3CF',
  lampAmber: '#FFB45A',
  /** Lit vellum window: top → middle → bottom with `lampAmber` */
  windowTop: '#FFF1C4',
  windowMid: '#FFD27A',
  neonPink: '#FF6FAE',
  neonCyan: '#7FF3FF',
  moon: '#FFF4D2',
  moonRim: '#CFEAFF',
  /** Pinhole stars: light through needle holes in the backdrop */
  pinhole: '#FFF3C8',

  // Paper stocks (bible § 3.1, proof D row 1)
  /** Night card stock: the 2-stop gradient of a night backdrop */
  nightCard: '#2E3482',
  nightCardDeep: '#1A2464',
  /** Night card at its darkest (the light-recipe tiles) */
  nightInk: '#141A40',
  kraft: '#C49A6C',
  kraftDark: '#A97E52',
  kraftFiber: '#6E4A2A',
  washi: '#F6EEE2',
  washiFiber: '#B9A88E',
  /** The two washi tapes on the HUD label */
  washiPink: '#E9A9A0',
  washiCeladon: '#9CC9C2',
  /** Fibres in the cream page */
  pageFiber: '#A88A5E',
  /** Vellum (tracing paper): a lilac-white sheet at 45–72 % */
  vellum: '#ECE8FA',
  /** Glassine sheen streaks */
  glassine: '#E8E4F8',
  glassineDeep: '#D8D2F0',
  corrugated: '#B98A5E',
  corrugatedDark: '#A37448',
  corrugatedLight: '#D8AE80',
  corrugatedLip: '#C9A070',
  /** 花磚 endpaper: navy tile, gold diamond, rose dots */
  tile: '#1E2558',
  tileRose: '#C8546A',
  /** Folds: lit and shaded faces of a crease (proof D row 2) */
  foldLit: '#E9DCC0',
  foldLitHigh: '#F8EEDA',
  foldShade: '#B9A888',
  foldShadeHigh: '#D6C6A6',
  foldRidge: '#8A7656',
  foldValley: '#7A6646',
  foldAo: '#3A2C1A',
  /** Printed (non-touchable) parts: grey-lilac card (bible § 6, 101's fixed sections) */
  printLilac: '#9A96C0',
  printLilacDeep: '#6E6A9C',
  /** Printed ochre: decorative yellows are desaturated so marigold stays reserved (bible § 4) */
  ochre: '#9A8650',
  ochreDark: '#8A7848',
  /** Printed dark tyre/ink on night card */
  printDark: '#2A2346',
  /** A plum flap face (proof D) */
  flapFace: '#6A4A9A',
  /** Stacked-depth demo cards z0 → z4 (proof D row 2) */
  depth0: '#3A4290',
  depth1: '#4A52A0',
  depth2: '#6068B4',
  depth3: '#7C82C6',
  depth4: '#A0A4DA',
  /** A moonlit facade on the light-recipe tile */
  moonFacade: '#5A5E9A',
  /** A lit shopfront on the light-recipe tile */
  lampFacade: '#4E3A5A',

  // Characters in the paper world (bible § 5)
  /** The warm-white die-cut border of a standee (never pure white) */
  standeeCard: '#FBF6EC',
  /** The mauve-grey cut line outside the border */
  standeeCut: '#8F8296',
  /** The fold-back easel tab behind the feet */
  easel: '#D9CDBB',
  /** The coiled wire of a thought bubble, and its shadow */
  wire: '#E9E4F4',
  wireShadow: '#1A1238',

  // UI on the cover (bible § 7)
  /** Labels under the bottom-bar discs */
  barLabel: '#F4EEDC',
  /** Sticker dimples: navy, their lit and dark rims, their labels */
  sticker: '#2B3274',
  stickerRim: '#4A54A8',
  stickerDeep: '#0A0C26',
  stickerLabel: '#C9CBEF',
  /** The sticker icons' ink on foil */
  foilInk: '#7A5410',
  /** Blind-embossed paper dimples (empty 抓周 slots) */
  dimpleLight: '#FFF7E6',
  dimpleShade: '#B7A07A',
  /** The coin's engraved ring */
  coinRing: '#9A6A22',
  /** The hint bulb icon */
  bulb: '#FFD27A',
  bulbInk: '#8A5E1E',
  /** The 土地公 sticker's hat */
  hatRed: '#C8342C',
} as const;

/**
 * The page renderer's placeholder stage (#89, `src/popup/view/art/placeholders.ts`): what a page
 * shows until its own baked backdrop, ledges and character frames land (#94, #96). Values follow
 * proof A (台北車站) and the bible § 6 chapter palettes. Decorative yellows are ochre, never
 * marigold (bible § 4: the tactile strip, the 土地公's hat band).
 */
export const POPUP_STAGE = {
  // City floor page: printed checker (contrast kept low, bible § 11 proof A note) and night shade
  floorCard: '#D6C6B4',
  floorCheck: '#9A90AE',
  floorShade: '#1A1440',
  // City landmark facade (a pop-up box standing in front of the backdrop)
  facadeTop: '#8A7790',
  facadeMid: '#B89A8C',
  facadeLow: '#E8C394',
  facadeRecess: '#4E3A5A',
  roofTop: '#5A3446',
  roofLow: '#3A2236',
  roofTile: '#7A4A5A',
  roofRidge: '#C9A04A',
  drumTop: '#7C6A86',
  drumLow: '#9C8590',
  lampPost: '#2A2346',
  lampShade: '#FFE7A8',
  // City ledges: brick platforms with a printed top and an ochre tactile strip
  brickTop: '#B85A4E',
  brickLow: '#8A3E40',
  brickMortar: '#6E2E36',
  brickSide: '#5E2A3A',
  platTop: '#B8A6A4',
  platTopNear: '#D9C3A6',
  platEdge: '#8C7C8E',
  // The track pit and rails under a carriage
  pit: '#1C1840',
  rail: '#7A7FA8',
  sleeper: '#4A4878',
  // A carriage (the card a tab or slider moves, e.g. the train): cream card, a line stripe
  carriageTop: '#F4EEE0',
  carriageLow: '#C9C2C8',
  carriageStripe: '#2F5FB0',
  carriageNose: '#2A3366',
  // Perch furniture: pillar card and a wooden bench
  pillarLit: '#D8BFA0',
  pillarMid: '#C2A88E',
  pillarShade: '#8E7A86',
  pillarCap: '#E2CBA8',
  benchSeat: '#6A4A3A',
  benchBack: '#7A5644',
  benchLeg: '#4A3028',
  // The room (序章 home): plum wallpaper, wood wainscot and floor, a rose rug, curtains
  wallTop: '#3A2C5A',
  wallLow: '#5A3E66',
  wallStripe: '#6A4E78',
  wainscot: '#6A4232',
  wood: '#8A5A3A',
  woodDark: '#5E3A26',
  woodLight: '#A87452',
  rugTop: '#C77C7C',
  rugLow: '#9A5458',
  rugStitch: '#F2D6C8',
  curtain: '#7A5A9A',
  curtainDeep: '#563C78',
  // Foreground card: a potted plant
  leaf: '#2E5A4A',
  leafLight: '#4A7A5E',
  // Placeholder characters (vector standees until the v2 frames are baked, #94)
  skin: '#F6D2B8',
  skinShade: '#E8B49A',
  blush: '#EE9A92',
  hair: '#3A2A2E',
  onesie: '#F4DFA0',
  onesieShade: '#D9BE7E',
  diaper: '#FBF6EC',
  catFur: '#9A8C7E',
  catFurDark: '#5E544C',
  catBelly: '#E8DFD2',
  catEye: '#8CB860',
  catCollar: '#3A6AB0',
  catNose: '#D98A8A',
  // Origami creatures
  pigeon: '#E6E2F2',
  pigeonShade: '#B7B0D0',
  pigeonBeak: '#D9825A',
} as const;

/** One gradient stop: offset in [0, 1] and a `#RRGGBB` colour. */
export type GradientStop = readonly [offset: number, color: string];

/**
 * Foil gradients (bible § 3.1 燙金 / 銀箔): the only things allowed to sparkle. `gold` is the
 * diagonal foil, `goldH` the horizontal trim, `coin` the radial coin, `silver` the cool metal.
 */
export const POPUP_FOIL = {
  gold: [[0, '#8A5E1E'], [0.22, '#FFE9A8'], [0.34, '#C9963A'], [0.55, '#FFF6D2'], [0.7, '#B8822A'], [1, '#FFE08A']],
  goldH: [[0, '#9A6A22'], [0.3, '#FFEDB0'], [0.5, '#C9963A'], [0.75, '#FFF4CC'], [1, '#A87A2A']],
  coin: [[0, '#FFF6D2'], [0.45, '#F2C860'], [1, '#A87A2A']],
  silver: [[0, '#6E7AA8'], [0.3, '#F2F6FF'], [0.5, '#9AA6CC'], [0.75, '#FFFFFF'], [1, '#7A86B4']],
} as const satisfies Record<string, readonly GradientStop[]>;

/** One chapter on the pop-up colour clock: its sky from top to horizon at its time. */
export type PopupChapterSky = {
  /** 0 = 序 (prologue), 1–10 = the chapters, 11 = page E (抓周) */
  readonly chapter: number;
  /** The label on the colour-script strip: 序, 1 … 10, E */
  readonly label: string;
  readonly place: string;
  /** `HH:MM` (GDD § 4.2) */
  readonly time: string;
  readonly top: string;
  readonly horizon: string;
  readonly feeling: string;
};

/**
 * The chapter colour clock (bible § 3.3 table: art direction § 3.2 re-keyed to GDD chapter times).
 * Backdrops bake this sky into their colours at build time; it is never a runtime filter.
 */
export const POPUP_CHAPTER_CLOCK: readonly PopupChapterSky[] = [
  { chapter: 0, label: '序', place: '家', time: '00:00', top: '#0A1034', horizon: '#3A3A86', feeling: 'warm lamp interior, cool window' },
  { chapter: 1, label: '1', place: '台北車站', time: '00:20', top: '#0B1238', horizon: '#40408E', feeling: 'deep navy, amber windows' },
  { chapter: 2, label: '2', place: '大安森林公園', time: '00:50', top: '#0B1238', horizon: '#4A4A96', feeling: 'green-black canopies, fireflies' },
  { chapter: 3, label: '3', place: '台灣大學', time: '01:20', top: '#0C1440', horizon: '#5A4E9C', feeling: 'cool lake, warm library' },
  { chapter: 4, label: '4', place: '西門町', time: '01:50', top: '#0C1440', horizon: '#6A5AA4', feeling: 'magenta and cyan neon spill' },
  { chapter: 5, label: '5', place: '士林夜市', time: '02:20', top: '#0E1644', horizon: '#7A62AA', feeling: 'the hottest, warmest page: bulbs and steam' },
  { chapter: 6, label: '6', place: '松山機場', time: '02:50', top: '#101848', horizon: '#8A6AB0', feeling: 'runway blues, amber taxi lights' },
  { chapter: 7, label: '7', place: '貓空', time: '03:30', top: '#141C50', horizon: '#9A70B4', feeling: 'mountain mist (vellum layers), gondola lights' },
  { chapter: 8, label: '8', place: '北投', time: '04:00', top: '#16205A', horizon: '#A878B8', feeling: 'steam vellum, wooden warmth' },
  { chapter: 9, label: '9', place: '淡水 / 淡江大橋', time: '04:40', top: '#1E2A66', horizon: '#C88AB8', feeling: 'the first violet light, sea glassine' },
  { chapter: 10, label: '10', place: '台北101', time: '05:10', top: '#3A3A80', horizon: '#F4B49A', feeling: 'dawn peach, gold rim' },
  { chapter: 11, label: 'E', place: '家 (抓周)', time: '10:00', top: '#8EC8E8', horizon: '#FFF0C8', feeling: 'the only daytime page' },
];

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

type GradedTiles = { tiles: TileTokens; structure: StructureTokens; scenery: SceneryTokens; fixture: FixtureTokens };
const tileCache = new Map<string, GradedTiles>();
const stageCache = new Map<string, StageTokens>();

export type StageTokens = { readonly [K in keyof typeof STAGE]: string };

/** `STAGE` with the night grade for a clock time baked in (§ 3.2). Pure; memoised per time. */
export function gradeStage(time: string): StageTokens {
  const hit = stageCache.get(time);
  if (hit) return hit;
  const graded = gradeRecord({ ...STAGE }, worldGrade(time)) as StageTokens;
  stageCache.set(time, graded);
  return graded;
}

export type TileTokens = { readonly [K in TileName]: { readonly [F in keyof TileRamp]: string } };
export type StructureTokens = { readonly [K in keyof typeof STRUCTURE]: string };
export type FixtureTokens = { readonly [K in keyof typeof FIXTURE]: string };
export type SceneryTokens = { readonly ridge: string; readonly skyline: string; readonly skylineNear: string; readonly floorTop: string; readonly floorMid: string; readonly floorBottom: string };

const gradeRecord = <T extends Record<string, string>>(record: T, by: Rgb): T =>
  Object.freeze(Object.fromEntries(Object.entries(record).map(([name, hex]) => [name, multiplyHex(hex, by)]))) as T;

/**
 * The tile materials, structure, light fixtures and sky scenery for a clock time, with the same world grade as
 * `gradeTokens` baked in (§ 3.2: pre-baked, never a filter). Pure; memoised per time.
 */
export function gradeTiles(time: string): GradedTiles {
  const hit = tileCache.get(time);
  if (hit) return hit;
  const by = worldGrade(time);
  const tiles = Object.freeze(Object.fromEntries(Object.entries(TILES).map(([name, ramp]) => [name, gradeRecord(ramp, by)]))) as TileTokens;
  const { ridge, skyline, skylineNear, floorTop, floorMid, floorBottom } = SKY_ART;
  const graded = Object.freeze({
    tiles,
    structure: gradeRecord({ ...STRUCTURE }, by),
    scenery: gradeRecord({ ridge, skyline, skylineNear, floorTop, floorMid, floorBottom }, by),
    fixture: gradeRecord({ ...FIXTURE }, by),
  });
  tileCache.set(time, graded);
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

