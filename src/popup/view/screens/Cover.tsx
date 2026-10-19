import { useMemo, useSyncExternalStore } from 'react';
import { POPUP as C } from '../../../art/palette';
import { chapterName, UI } from '../../content';
import { screenImage } from '../../env/loader';
import { COVER_SCENE } from '../../env/art/screens';
import { SpriteAnim, deviceScale, spriteUrls, floorUrl } from '../../sprites';
import { PaperButton, Quilt, SealIcon, useScreenReady } from './paper';
import { AlbumIcon, ContentsIcon, SettingsIcon } from './icons';

/**
 * The cover screen (GDD § 2.13 item 1; popup art bible § 7 cover screen; #97): the closed book
 * 《翻翻台北》 lying on 阿嬤's low table on the 花布 quilt, with 寶咖咖 and 摩卡 as standees beside it.
 *
 * - **Buttons:** 「繼續」 (big, the screen's one marigold card, with where it resumes underneath),
 *   then 「目錄」, 「相簿」, 「設定」 as cream cards. On first launch only 「開始」.
 * - **Resume in one tap** (R7, § 1.2): 「繼續」 opens the save's current page.
 * - The table and the book are one baked bitmap (`cover-scene`), the quilt another; the standees
 *   are the baked character frames; every word is live text on paper.
 */

export interface CoverProps {
  /** First launch: only 「開始」 */
  readonly first: boolean;
  /** Where 「繼續」 goes: the page's chapter and title */
  readonly resume: { readonly chapter: number; readonly title: string };
  readonly onResume: () => void;
  readonly onContents: () => void;
  readonly onAlbum: () => void;
  readonly onSettings: () => void;
  /** A still (screenshots): no idle motion */
  readonly still?: boolean;
  readonly reduced?: boolean;
}

/** The buttons' block under the scene (CSS px at 390 wide): 「繼續」 and the three cards, or 「開始」 alone. */
const BUTTONS_H = { first: 96, resume: 196 } as const;
/** Room between the scene and the buttons, and around the group. */
const GAP = 20;

const subscribeResize = (onChange: () => void) => {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
};
const readSize = () => `${window.innerWidth}x${window.innerHeight}`;

function useViewport(): [number, number] {
  const size = useSyncExternalStore(subscribeResize, readSize, () => '390x844');
  return useMemo(() => size.split('x').map(Number) as [number, number], [size]);
}

/** Baokaka sits at the book's lower left, Mocha at its lower right (scene units). */
const STANDEES = { baby: { x: 72, y: 412, scale: 1.25 }, mocha: { x: 334, y: 414, scale: 1.55 } } as const;

export function Cover({ first, resume, onResume, onContents, onAlbum, onSettings, still = false, reduced = false }: CoverProps) {
  const [vw, vh] = useViewport();
  const scene = screenImage('cover-scene');
  const frames = useMemo(() => {
    const s = deviceScale();
    const floor = floorUrl(s);
    return [...spriteUrls('baokaka.clap', s), ...spriteUrls('mocha.sit', s), ...(floor ? [floor] : [])];
  }, []);
  const ready = useScreenReady(['quilt', 'cover-scene'], frames);
  // The scene fits above the buttons: never wider than the phone, never taller than what is left
  const buttons = first ? BUTTONS_H.first : BUTTONS_H.resume;
  const k = Math.min(vw / 390, Math.max(0.5, (vh - buttons - 3 * GAP) / COVER_SCENE.h), 1.15);
  const sceneW = COVER_SCENE.w * k;
  const sceneH = COVER_SCENE.h * k;
  const idle = !still && !reduced;
  return (
    <main
      className="fixed inset-0 select-none overflow-hidden font-body"
      lang="zh-Hant"
      style={{ backgroundColor: C.quilt }}
      data-screen="cover"
      data-first={first ? '' : undefined}
      data-screen-ready={ready ? '' : undefined}
      aria-label="《翻翻台北》"
    >
      <Quilt />
      <div className="relative flex h-full flex-col items-center justify-center" style={{ gap: GAP, paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
      <div className="relative shrink-0" style={{ width: sceneW, height: sceneH }}>
        <svg width={sceneW} height={sceneH} viewBox={`0 0 ${COVER_SCENE.w} ${COVER_SCENE.h}`} role="img" aria-label="《翻翻台北》 Pop-Up Taipei" className="block overflow-visible">
          {scene && <image href={scene.url} width={COVER_SCENE.w} height={COVER_SCENE.h} preserveAspectRatio="none" />}
          <g className={idle ? 'cover-sway' : undefined} style={{ transformOrigin: '50% 100%' }}>
            <SpriteAnim sprite="baokaka.clap" x={STANDEES.baby.x} y={STANDEES.baby.y} scale={STANDEES.baby.scale} playing={idle} reduced={!idle} />
          </g>
          <SpriteAnim sprite="mocha.sit" facing="l" x={STANDEES.mocha.x} y={STANDEES.mocha.y} scale={STANDEES.mocha.scale} playing={false} />
        </svg>
      </div>
      <div className="flex w-full shrink-0 flex-col items-center gap-3 px-6" style={{ height: buttons }}>
        {first ? (
          <PaperButton tone="marigold" className="w-full max-w-[320px] py-4" onClick={onResume} testId="start" icon={<SealIcon size={48}><path d="M-6 -9L9 0L-6 9Z" fill={C.sealGlyph} /></SealIcon>}>
            <span className="block font-serif text-[34px] font-black leading-none tracking-[0.3em]">{UI.cover.start}</span>
          </PaperButton>
        ) : (
          <>
            <PaperButton
              tone="marigold"
              className="w-full max-w-[332px] py-3"
              onClick={onResume}
              testId="resume"
              label={`${UI.cover.resume}：${chapterName(resume.chapter)}「${resume.title}」`}
              icon={<SealIcon size={50}><path d="M-6 -9L9 0L-6 9Z" fill={C.sealGlyph} /></SealIcon>}
            >
              <span className="block font-serif text-[34px] font-black leading-[1.1] tracking-[0.3em]">{UI.cover.resume}</span>
              <span className="mt-1 block text-[20px] font-bold leading-[1.3]">
                {chapterName(resume.chapter)}「{resume.title}」
              </span>
            </PaperButton>
            <div className="grid w-full max-w-[332px] grid-cols-3 gap-3">
              <PaperButton className="flex-col justify-center gap-1 px-1 py-2" onClick={onContents} testId="contents" icon={<ContentsIcon />}>
                <span className="block text-center text-[20px] font-black tracking-[0.12em]">{UI.cover.contents}</span>
              </PaperButton>
              <PaperButton className="flex-col justify-center gap-1 px-1 py-2" onClick={onAlbum} testId="album" icon={<AlbumIcon />}>
                <span className="block text-center text-[20px] font-black tracking-[0.12em]">{UI.cover.album}</span>
              </PaperButton>
              <PaperButton className="flex-col justify-center gap-1 px-1 py-2" onClick={onSettings} testId="settings" icon={<SettingsIcon />}>
                <span className="block text-center text-[20px] font-black tracking-[0.12em]">{UI.cover.settings}</span>
              </PaperButton>
            </div>
          </>
        )}
      </div>
      </div>
    </main>
  );
}
