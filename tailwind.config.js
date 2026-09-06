/** Elderly-friendly UI rules live here; components never pick their own type scale or touch size. */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontSize: {
        // Minimum 20px, body copy 24px, line-height 1.6 (spec §8)
        base: ['20px', '1.6'],
        body: ['24px', '1.6'],
        title: ['34px', '1.3'],
        huge: ['44px', '1.2'],
      },
      spacing: {
        // Touch target floor: 64px
        touch: '64px',
      },
      colors: {
        // Mirrors src/art/palette.ts; the UI never invents a colour the sprites do not use
        ink: '#3B2A20',
        cream: '#FFF7E8',
        paper: '#F3E3C3',
        sun: '#F2A93B',
        leaf: '#5C9E63',
        sky: '#7FB6D9',
        berry: '#D9564F',
        mocha: '#A8703E',
        plum: '#8E6E9E',
        teal: '#3F8F88',
        grey: '#B9AFA4',
      },
    },
  },
  plugins: [],
};
