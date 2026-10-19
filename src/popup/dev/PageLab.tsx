import { useSyncExternalStore } from 'react';
import { POPUP } from '../../art/palette';
import { hashParams } from '../../shared/route';
import { KitSection } from './KitSection';

/**
 * PageLab, `#/pagelab` (GDD § 3.10; dev builds only — App never loads this chunk in production).
 * Sections so far: `section=kit` (#139), the paper kit port beside proof D and every part preset's
 * default art. The page list, overlays, step/play controls, solver panel, editor and state
 * inspector arrive with #91 (and its fixtures with #92).
 */

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};
const readHash = () => window.location.hash;

export default function PageLab() {
  const section = hashParams(useSyncExternalStore(subscribe, readHash)).get('section');
  return (
    <main className="min-h-dvh font-body" style={{ backgroundColor: POPUP.page, color: POPUP.ink }} lang="zh-Hant">
      <header className="p-4">
        <h1 className="font-serif text-title">PageLab</h1>
        <p className="text-label">《翻翻台北》頁面工作台 · 開發中</p>
        <nav className="mt-2 flex gap-3 text-caption">
          <a href="#/pagelab" style={{ color: POPUP.ink }} aria-current={section ? undefined : 'page'}>
            總覽
          </a>
          <a href="#/pagelab?section=kit" style={{ color: POPUP.ink }} aria-current={section === 'kit' ? 'page' : undefined}>
            紙材套件 kit
          </a>
        </nav>
      </header>
      {section === 'kit' ? <KitSection /> : <p className="px-4 text-caption">#/pagelab · dev builds only</p>}
    </main>
  );
}
