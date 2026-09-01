/** 長輩 UI 規則集中在這裡，元件不自行決定字級與觸控尺寸。 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontSize: {
        // 最小 20px，主文 24px，行高 1.6（spec §8）
        base: ['20px', '1.6'],
        body: ['24px', '1.6'],
        title: ['34px', '1.3'],
        huge: ['44px', '1.2'],
      },
      spacing: {
        // 觸控目標下限 64px
        touch: '64px',
      },
      colors: {
        ink: '#3B2A20',
        cream: '#FFF7E8',
        sun: '#F2A93B',
        leaf: '#5C9E63',
        sky: '#7FB6D9',
        berry: '#D9564F',
        mocha: '#A8703E',
      },
    },
  },
  plugins: [],
};
