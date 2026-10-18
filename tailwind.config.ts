import type { Config } from 'tailwindcss';
import { C, LEGACY_UI, MRT, UI } from './src/art/palette';

/**
 * Design tokens for the game. Screens compose these; they never invent sizes, colours or
 * shadows of their own. Colours come from src/art/palette.ts (the only place a hex lives), so
 * the UI and the art can never drift apart (art direction § 3.1, § 7).
 */

/** Body and dialogue, names and titles, numbers and Latin (art direction § 7.1). */
const FALLBACK = ["'PingFang TC'", "'Noto Sans TC'", 'system-ui', 'sans-serif'];

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        body: ["'Chiron GoRound TC'", ...FALLBACK],
        serif: ["'Noto Serif TC'", "'Chiron GoRound TC'", ...FALLBACK],
        num: ['Fredoka', "'Chiron GoRound TC'", ...FALLBACK],
      },
      fontSize: {
        // § 7.1 type scale (px / weight)
        caption: ['14px', { lineHeight: '1.4', fontWeight: '700' }],
        label: ['16px', { lineHeight: '1.4', fontWeight: '700' }],
        body: ['18px', { lineHeight: '1.55', fontWeight: '700' }],
        dialogue: ['21px', { lineHeight: '1.7', fontWeight: '700' }],
        button: ['21px', { lineHeight: '1.2', fontWeight: '900', letterSpacing: '0.1em' }],
        heading: ['22px', { lineHeight: '1.3', fontWeight: '900' }],
        title: ['28px', { lineHeight: '1.2', fontWeight: '900' }],
        chapter: ['36px', { lineHeight: '1.15', fontWeight: '900' }],
        logo: ['52px', { lineHeight: '1.05', fontWeight: '900' }],
        // Legacy sizes of the pre-D screens; #12 moves them onto the scale above
        copy: ['17px', { lineHeight: '1.55' }],
        headline: ['24px', { lineHeight: '1.25' }],
        display: ['32px', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        hero: ['40px', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        panel: '6px',
        '4xl': '32px',
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(59, 42, 32, 0.22)',
        float: '0 24px 48px -16px rgba(59, 42, 32, 0.35)',
        glow: '0 12px 28px -10px rgba(224, 138, 34, 0.75)',
        inset: 'inset 0 2px 6px rgba(59, 42, 32, 0.12)',
        gold: `0 0 14px ${UI.gold}73`, // 45 % alpha
      },
      transitionDuration: {
        // § 7.9 motion tokens; the same values are CSS variables in src/index.css
        instant: '80ms',
        quick: '160ms',
        base: '240ms',
        slow: '400ms',
        scene: '600ms',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(.2,.8,.2,1)',
        pop: 'cubic-bezier(.34,1.56,.64,1)',
      },
      colors: {
        // Option D UI (§ 3.1 UI, § 7.2–7.6)
        panel: { top: UI.panelTopGlass, bottom: UI.panelBottomGlass, solid: UI.panelTop, deep: UI.panelBottom },
        gold: { DEFAULT: UI.gold, light: UI.goldLight, deep: UI.goldDeep, diamond: UI.diamondLight },
        inkOnDark: UI.inkOnDark,
        mutedOnDark: UI.mutedOnDark,
        parchment: UI.parchment,
        primary: { top: UI.primaryTop, mid: UI.primaryMid, bottom: UI.primaryBottom, text: UI.primaryText },
        command: { top: UI.commandTop, bottom: UI.commandBottom },
        hp: { from: UI.hpFrom, to: UI.hpTo, lowFrom: UI.hpLowFrom, lowTo: UI.hpLowTo, critFrom: UI.hpCritFrom, critTo: UI.hpCritTo },
        mp: { from: UI.mpFrom, to: UI.mpTo },
        damage: { DEFAULT: UI.damage, stroke: UI.damageStroke },
        vermilion: UI.vermilion,
        amber: UI.amber,
        locked: UI.locked,
        line: MRT,

        // Legacy colours of the pre-D screens, kept so they stay readable until #12 restyles
        // them; nothing new uses these.
        ink: C.ink,
        cream: C.cream,
        paper: C.paper,
        sun: C.sun,
        sunDeep: C.sunDeep,
        leaf: C.leaf,
        leafDeep: C.leafDeep,
        sky: C.sky,
        skyDeep: C.skyDeep,
        berry: C.berry,
        berryDeep: C.berryDeep,
        mocha: C.mocha,
        mochaDeep: C.mochaDeep,
        plum: C.plum,
        teal: C.teal,
        sand: C.sand,
        sandDeep: C.sandDeep,
        grey: C.grey,
        surface: LEGACY_UI.surface,
        bg: LEGACY_UI.bg,
        muted: LEGACY_UI.muted,
      },
    },
  },
  plugins: [],
} satisfies Config;
