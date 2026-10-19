import { POPUP as C } from '../../../art/palette';
import { Sheet } from '../../../components/Sheet';
import { UI } from '../../content';
import { ContentsIcon, CoverIcon, ResumeIcon, SettingsIcon } from './icons';
import { PaperButton } from './paper';

/**
 * The pause menu, 「選單」 (#97): 繼續 / 目錄 / 設定 / 封面, on the kit's bottom sheet in its paper
 * tone. The page under it is held while it is open (GDD § 2.6); tapping the scrim is 繼續.
 */

export interface PauseMenuProps {
  readonly open: boolean;
  readonly onResume: () => void;
  readonly onContents: () => void;
  readonly onSettings: () => void;
  readonly onCover: () => void;
}

export function PauseMenu({ open, onResume, onContents, onSettings, onCover }: PauseMenuProps) {
  const label = 'text-[20px] font-black tracking-[0.14em]';
  return (
    <Sheet open={open} onClose={onResume} title={UI.bar.menu} tone="paper">
      <div className="flex flex-col gap-3 font-body" data-screen="menu" data-screen-ready="">
        <PaperButton tone="marigold" className="py-2" onClick={onResume} testId="menu-resume" icon={<ResumeIcon />}>
          <span className={`${label} text-[24px]`}>{UI.menu.resume}</span>
        </PaperButton>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'contents', text: UI.menu.contents, icon: <ContentsIcon />, on: onContents },
            { key: 'settings', text: UI.menu.settings, icon: <SettingsIcon />, on: onSettings },
            { key: 'cover', text: UI.menu.cover, icon: <CoverIcon />, on: onCover },
          ].map((b) => (
            <PaperButton key={b.key} className="flex-col justify-center gap-1 px-1 py-2" style={{ outline: `1px solid ${C.pageEdge}` }} onClick={b.on} testId={`menu-${b.key}`} icon={b.icon}>
              <span className={`block text-center ${label}`}>{b.text}</span>
            </PaperButton>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
