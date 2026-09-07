/**
 * The shared palette. Sprites may only use these colours, which keeps every drawing consistent.
 *
 * Most hues come as a pair: the base and a `Deep` shade. Cel shading means picking the base for
 * the lit side and the `Deep` for the side away from the light (upper-left), plus `C.white` at
 * low opacity for the highlight. Never invent a hex.
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
