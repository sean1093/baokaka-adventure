import { useCallback, useSyncExternalStore } from 'react';
import { POPUP } from '../../art/palette';
import { hashParams } from '../../shared/route';
import { FixtureIndex, FixtureView } from './FixtureView';
import { fixtureParams } from './fixtures';
import { KitSection } from './KitSection';
import { LabWorkspace } from './LabWorkspace';
import { SpriteReport } from './SpriteReport';
import { labHash, parseLabParams, type LabParams } from './labParams';

/**
 * PageLab, `#/pagelab` (GDD § 3.10; dev builds only — App never loads this chunk in production).
 *
 * - The lab (#91, `LabWorkspace.tsx`): the page list with solver badges, the page with overlays,
 *   step/play controls and the input palette, the solver panel (in a worker), live lint,
 *   readability views and the art-key report, edit mode with 「Copy TS」, and the state inspector.
 *   Its settings live in the hash (`labParams.ts`), e.g. `#/pagelab?page=c1p2&overlay=nodes,edges&tick=12`.
 * - `section=kit` (#139): the paper kit port beside proof D and every part preset's default art.
 * - `section=sprites` (#95): the missing-frame report, GDD § 3.9's character frames ✓ / ✗ / later.
 * - Visual QA fixtures (#92, `fixtures.ts`): `fixture=<name>` shows one full screen with no lab
 *   chrome (`still=1` for screenshots), and `section=fixtures` lists them for the QA scripts.
 */

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};
const readHash = () => window.location.hash;

export default function PageLab() {
  const query = hashParams(useSyncExternalStore(subscribe, readHash));
  const params = parseLabParams(query);
  const section = params.section;
  const { fixture, still } = fixtureParams(query);

  // Settings changes rewrite the hash in place (no history entry per checkbox) and re-read it
  const setParams = useCallback(
    (patch: Partial<LabParams>) => {
      const next = labHash({ ...parseLabParams(hashParams(window.location.hash)), ...patch });
      const { pathname, search } = window.location;
      window.history.replaceState(window.history.state, '', `${pathname}${search}${next}`);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    },
    [],
  );

  if (fixture) return <FixtureView name={fixture} still={still} />;

  return (
    <main className="min-h-dvh font-body" style={{ backgroundColor: section === 'kit' ? POPUP.page : POPUP.cover, color: section === 'kit' ? POPUP.ink : POPUP.goldLight }} lang="zh-Hant">
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1 p-4">
        <h1 className="font-serif text-title">PageLab</h1>
        <p className="text-label">《翻翻台北》頁面工作台</p>
        <nav className="flex gap-3 text-caption">
          <a href="#/pagelab" style={{ color: 'inherit' }} aria-current={section ? undefined : 'page'}>
            頁面 lab
          </a>
          <a href="#/pagelab?section=kit" style={{ color: 'inherit' }} aria-current={section === 'kit' ? 'page' : undefined}>
            紙材套件 kit
          </a>
          <a href="#/pagelab?section=sprites" style={{ color: 'inherit' }} aria-current={section === 'sprites' ? 'page' : undefined}>
            角色影格 sprites
          </a>
          <a href="#/pagelab?section=fixtures" style={{ color: 'inherit' }} aria-current={section === 'fixtures' ? 'page' : undefined}>
            QA fixtures
          </a>
        </nav>
      </header>
      {section === 'kit' ? <KitSection /> : section === 'fixtures' ? <FixtureIndex /> : section === 'sprites' ? <SpriteReport /> : <LabWorkspace params={params} setParams={setParams} />}
    </main>
  );
}
