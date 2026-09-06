import { Scene, placementStyle } from '../../art/Scene';
import { SPRITES } from '../../art/sprites';
import { BigButton } from '../../components/BigButton';
import { PartyPanel } from '../components/PartyPanel';
import { FOES } from '../engine/foes';
import type { Chapter, Node, Run } from '../engine/types';

const Baokaka = SPRITES.baokaka;
const MochaCat = SPRITES.mochaCat;

type Props = {
  chapter: Chapter;
  run: Run;
  soundOn: boolean;
  onBegin: () => void;
  onToggleSound: () => void;
  onBackToTitle: () => void;
};

const nodeLabel = (node: Node): string => (node.kind === 'camp' ? '營地' : node.kind === 'boss' ? '頭目' : '戰鬥');

const nodeSprite = (node: Node) =>
  node.kind === 'camp'
    ? SPRITES.pillow
    : SPRITES[FOES[node.foes.find((foe) => FOES[foe].boss) ?? node.foes[0]].sprite];

/** The between-battles screen: where the party is on the chapter's path, and how it is doing. */
export const ChapterScreen = ({ chapter, run, soundOn, onBegin, onToggleSound, onBackToTitle }: Props) => {
  const current = chapter.nodes[run.node];
  const bossNode = chapter.nodes.find((node) => node.kind === 'boss');
  const BossArt = bossNode && nodeSprite(bossNode);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 py-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-base font-bold text-ink/60">第 {chapter.id} 章</p>
          <h1 className="text-title font-bold leading-tight">{chapter.title}</h1>
        </div>
        <BigButton tone="quiet" onClick={onToggleSound} label={soundOn ? '關閉聲音' : '打開聲音'}>
          {soundOn ? '聲音 開' : '聲音 關'}
        </BigButton>
      </header>

      <Scene palette={chapter.palette} decor={chapter.decor} aspectRatio="3 / 2" className="rounded-3xl border-4 border-ink">
        <span className="absolute block" style={placementStyle({ sprite: 'baokaka', x: 0.22, y: 0.7, r: 0.15 })}>
          <Baokaka />
        </span>
        <span className="absolute block" style={placementStyle({ sprite: 'mochaCat', x: 0.42, y: 0.74, r: 0.12 })}>
          <MochaCat />
        </span>
        {BossArt && (
          <span className="absolute block" style={placementStyle({ sprite: 'star', x: 0.8, y: 0.62, r: 0.16, flip: true })}>
            <BossArt />
          </span>
        )}
      </Scene>

      <ol className="relative flex items-start justify-between">
        <span aria-hidden="true" className="absolute left-8 right-8 top-8 border-t-4 border-dashed border-ink/30" />
        {chapter.nodes.map((node, index) => {
          const Art = nodeSprite(node);
          const done = index < run.node;
          const active = index === run.node;
          return (
            <li key={index} className="relative flex flex-1 flex-col items-center gap-1">
              <span
                className={[
                  'grid h-16 w-16 place-items-center rounded-full border-4 border-ink',
                  done ? 'bg-leaf text-title font-bold text-white' : active ? 'bg-sun ring-4 ring-sun/50' : 'bg-white opacity-50',
                ].join(' ')}
              >
                {done ? (
                  '✓'
                ) : (
                  <span className="block h-11 w-11">
                    <Art />
                  </span>
                )}
              </span>
              <span className={`text-sm font-bold ${active ? '' : 'text-ink/60'}`}>{nodeLabel(node)}</span>
            </li>
          );
        })}
      </ol>

      <PartyPanel run={run} />

      <div className="flex flex-col items-center gap-3 pt-1">
        <BigButton onClick={onBegin}>
          {current?.kind === 'camp' ? '在營地休息' : current?.kind === 'boss' ? '挑戰頭目' : '出發戰鬥'}
        </BigButton>
        <BigButton tone="quiet" onClick={onBackToTitle}>
          回標題
        </BigButton>
      </div>
    </div>
  );
};
