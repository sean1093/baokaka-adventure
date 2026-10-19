import type { Config } from 'tailwindcss';
import { BACKLIGHT, MRT, POPUP, UI } from './src/art/palette';

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
      },
      borderRadius: {
        panel: '6px',
      },
      boxShadow: {
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
        primary: { top: UI.primaryTop, mid: UI.primaryMid, bottom: UI.primaryBottom, text: UI.primaryText, sub: UI.primarySub },
        command: { top: UI.commandTop, bottom: UI.commandBottom },
        hp: { from: UI.hpFrom, to: UI.hpTo, lowFrom: UI.hpLowFrom, lowTo: UI.hpLowTo, critFrom: UI.hpCritFrom, critTo: UI.hpCritTo, lag: UI.hpLag },
        mp: { from: UI.mpFrom, to: UI.mpTo },
        damage: { DEFAULT: UI.damage, stroke: UI.damageStroke },
        vermilion: UI.vermilion,
        amber: UI.amber,
        locked: UI.locked,
        board: { DEFAULT: UI.board, dot: UI.boardDot },
        scrim: UI.scrim,
        backlight: BACKLIGHT,
        line: MRT,
        // 翻翻台北 Pop-Up Taipei (popup art bible; #139): `bg-popup-cover`, `text-popup-ink`, …
        popup: POPUP,
      },
    },
  },
  plugins: [],
} satisfies Config;
