/**
 * Design tokens for the whole collection. Screens compose these; they never invent sizes,
 * colours or shadows of their own. The hidden-object game keeps its elderly floor (20px copy,
 * 64px targets) by using the larger steps of the same scale.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontSize: {
        caption: ['13px', { lineHeight: '1.4' }],
        label: ['15px', { lineHeight: '1.4' }],
        copy: ['17px', { lineHeight: '1.55' }],
        heading: ['20px', { lineHeight: '1.3' }],
        headline: ['24px', { lineHeight: '1.25' }],
        display: ['32px', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        hero: ['40px', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
      },
      spacing: {
        // Touch target floor for the hidden-object game
        touch: '64px',
      },
      borderRadius: {
        '4xl': '32px',
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(59, 42, 32, 0.22)',
        float: '0 24px 48px -16px rgba(59, 42, 32, 0.35)',
        glow: '0 12px 28px -10px rgba(224, 138, 34, 0.75)',
        inset: 'inset 0 2px 6px rgba(59, 42, 32, 0.12)',
      },
      colors: {
        // Mirrors src/art/palette.ts; the UI never invents a colour the sprites do not use
        ink: '#3B2A20',
        cream: '#FFF7E8',
        paper: '#F3E3C3',
        sun: '#F2A93B',
        sunDeep: '#E08A22',
        leaf: '#5C9E63',
        leafDeep: '#3F7A48',
        sky: '#7FB6D9',
        skyDeep: '#4E8FBA',
        berry: '#D9564F',
        berryDeep: '#B23F3A',
        mocha: '#A8703E',
        mochaDeep: '#7E5029',
        plum: '#8E6E9E',
        teal: '#3F8F88',
        sand: '#E8CE9A',
        sandDeep: '#C9A96A',
        grey: '#B9AFA4',
        // UI-only neutrals
        surface: '#FFFDF9',
        bg: '#FAF1E0',
        muted: '#7A6553',
      },
    },
  },
  plugins: [],
};
