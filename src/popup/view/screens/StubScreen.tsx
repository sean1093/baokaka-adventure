import { POPUP as C } from '../../../art/palette';
import { UI } from '../../content';
import { AlbumIcon, BackIcon, SettingsIcon } from './icons';
import { CREAM_CARD, PaperButton, Quilt } from './paper';

/**
 * The settings until #104 builds them (#97, D-60): a cream card on the quilt with the screen's
 * name, one line, and the way back. The navigation to it is real, so #104 only replaces this
 * component. (The album was a stub until #103: `view/photo/Album.tsx`.)
 */

export function StubScreen({ kind, onBack }: { kind: 'album' | 'settings'; onBack: () => void }) {
  const title = kind === 'album' ? UI.cover.album : UI.cover.settings;
  return (
    <main className="fixed inset-0 flex select-none items-center justify-center px-6 font-body" lang="zh-Hant" style={{ backgroundColor: C.quilt }} data-screen={kind} data-screen-ready="">
      <Quilt />
      <section className="relative flex w-full max-w-[320px] -rotate-[0.8deg] flex-col items-center gap-4 rounded-[6px] px-6 py-8" style={CREAM_CARD}>
        {kind === 'album' ? <AlbumIcon /> : <SettingsIcon />}
        <h1 className="font-serif text-[30px] font-black tracking-[0.3em]">{title}</h1>
        <p className="text-[20px] font-bold" style={{ color: C.ink }}>
          {UI.stub.soon}
        </p>
        <PaperButton className="mt-2" onClick={onBack} testId="back" icon={<BackIcon />} style={{ outline: `1px solid ${C.pageEdge}` }}>
          <span className="text-[20px] font-black tracking-[0.1em]">{UI.stub.back}</span>
        </PaperButton>
      </section>
    </main>
  );
}
