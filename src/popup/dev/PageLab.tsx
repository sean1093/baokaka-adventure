import { POPUP } from '../../art/palette';

/**
 * PageLab, `#/pagelab` (GDD § 3.10; dev builds only — App never loads this chunk in production).
 * A placeholder (#79): the page list, overlays, step/play controls, solver panel, editor and
 * state inspector arrive with #91 (and its fixtures with #92).
 */
export default function PageLab() {
  return (
    <main className="min-h-dvh p-4 font-body" style={{ backgroundColor: POPUP.page, color: POPUP.ink }} lang="zh-Hant">
      <h1 className="font-serif text-title">PageLab</h1>
      <p className="text-label">《翻翻台北》頁面工作台 · 開發中</p>
      <p className="mt-2 text-caption">#/pagelab · dev builds only</p>
    </main>
  );
}
