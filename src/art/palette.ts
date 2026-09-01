/** The shared palette. Sprites may only use these colours, which keeps all 54 drawings consistent. */
export const C = {
  ink: '#3B2A20',      // Outlines and dark detail
  cream: '#FFF7E8',    // Lightest background
  paper: '#F3E3C3',    // Light objects
  sun: '#F2A93B',      // Warm yellow
  sunDeep: '#E08A22',  // Warm yellow shadow
  berry: '#D9564F',    // Red
  berryDeep: '#B23F3A',
  leaf: '#5C9E63',     // Green
  leafDeep: '#3F7A48',
  sky: '#7FB6D9',      // Blue
  skyDeep: '#4E8FBA',
  mocha: '#A8703E',    // Mocha Cat's fur
  mochaDeep: '#7E5029',
  plum: '#8E6E9E',     // Purple
  sand: '#E8CE9A',     // Sand and wood
  sandDeep: '#C9A96A',
  white: '#FFFFFF',
  grey: '#B9AFA4',
} as const;
