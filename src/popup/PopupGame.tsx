import type { CSSProperties } from 'react';
import { POPUP, withAlpha } from '../art/palette';

/**
 * 翻翻台北 Pop-Up Taipei, served at `#/popup` (unlinked) until the routing switch (#109) makes it
 * `#/`. For now a placeholder (#79): one cream page on the navy linen cover, with the title and
 * 「開發中」. The real screens (cover, 目錄, chapter card, page …) arrive in `view/screens/` (GDD
 * § 2.13). App lazy-loads this module so the RPG's bundle does not carry it.
 */

/** The cover: navy linen, a fine weave and a vignette (popup art bible § 7). */
const cover: CSSProperties = {
  backgroundColor: POPUP.cover,
  backgroundImage: [
    `radial-gradient(ellipse at 50% 42%, transparent 40%, ${withAlpha(POPUP.coverDark, 0.85)} 100%)`,
    `repeating-linear-gradient(0deg, ${withAlpha(POPUP.coverLight, 0.35)} 0 1px, transparent 1px 3px)`,
    `repeating-linear-gradient(90deg, ${withAlpha(POPUP.coverDark, 0.45)} 0 1px, transparent 1px 3px)`,
  ].join(','),
};

/** A cream page with its cut edge and an indigo (never black) shadow (bible § 2.2, § 3.2). */
const page: CSSProperties = {
  backgroundColor: POPUP.page,
  backgroundImage: `linear-gradient(180deg, ${POPUP.page} 0%, ${POPUP.page} 62%, ${POPUP.pageDark} 100%)`,
  color: POPUP.ink,
  boxShadow: [
    `inset 1px 1px 0 ${withAlpha(POPUP.cutRim, 0.42)}`,
    `inset -1px -1px 0 ${POPUP.pageEdge}`,
    `0 2px 3px ${withAlpha(POPUP.shadow, 0.45)}`,
    `0 18px 36px ${withAlpha(POPUP.shadow, 0.55)}`,
  ].join(','),
};

const foil: CSSProperties = { borderColor: withAlpha(POPUP.gold, 0.7) };

export default function PopupGame() {
  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center gap-8 px-6" style={cover} lang="zh-Hant">
      <div className="pointer-events-none absolute inset-3 rounded-panel border" style={foil} aria-hidden="true" />
      <section className="flex w-full max-w-[320px] -rotate-[0.6deg] flex-col items-center gap-3 rounded-[3px] px-6 py-12" style={page}>
        <h1 className="whitespace-nowrap font-serif text-chapter tracking-[0.06em]">《翻翻台北》</h1>
        <p className="font-num text-body tracking-[0.12em]">Pop-Up Taipei</p>
      </section>
      <p className="pl-[0.3em] font-serif text-title tracking-[0.3em]" style={{ color: POPUP.goldLight }}>
        開發中
      </p>
    </main>
  );
}
