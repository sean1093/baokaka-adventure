import { useState, type ReactNode } from 'react';
import { BACKLIGHT } from '../art/palette';
import { SPRITES } from '../art/sprites';
import { Bar, StatBars } from '../components/Bars';
import { Button, CommandButton, IconButton, Switch } from '../components/Button';
import { ChapterCard } from '../components/ChapterCard';
import { GlassChip, Num, Tag } from '../components/Chip';
import { CommandGrid, CommandPanel, HeadRing, PartyCard } from '../components/CommandPanel';
import { DepartureClock } from '../components/DepartureClock';
import { DialogueBox } from '../components/DialogueBox';
import { Cube, Cup, Home, Pouch, Shield, Talent } from '../components/icons';
import { Inset, Panel, PanelTitle } from '../components/Panel';
import { ListRow } from '../components/Sheet';
import { Bust } from '../quest/components/Dialogue';

/**
 * The art lab's UI kit section (`#/artlab?section=ui`): every kit component of #12 on its own, in
 * each of its states, so a change to one shows up in one screenshot (art direction § 7.2–7.9).
 * Dev-only. The game screens built from the kit are the fixtures.
 */

const Group = ({ title, note, children }: { title: string; note?: string; children: ReactNode }) => (
  <section className="flex flex-col gap-2" data-kit={title}>
    <h3 className="font-serif text-heading text-gold-light">
      {title}
      {note && <span className="ml-2 font-body text-caption text-mutedOnDark">{note}</span>}
    </h3>
    {children}
  </section>
);

const noop = () => {};

const Head = ({ sprite }: { sprite: 'baokaka' | 'mochaCat' }) => {
  const Art = SPRITES[sprite];
  return (
    <span className="absolute left-[-30%] top-[-8%] block h-[160%] w-[160%]">
      <Art lod="icon" />
    </span>
  );
};

/** A bar frozen just after a hit: the fill already down, the pale lag band still at the old value. */
const LagSample = () => (
  <span className="kit-bar">
    <span className="kit-bar__track">
      <span className="kit-bar__lag" style={{ width: '72%' }} data-instant="" />
      <span className="kit-bar__fill" style={{ width: '46%' }} />
    </span>
  </span>
);

/** A bar frozen mid-heal: the fill grown, the sparkle at its end. */
const HealSample = () => (
  <span className="kit-bar">
    <span className="kit-bar__track">
      <span className="kit-bar__lag" style={{ width: '80%' }} data-instant="" />
      <span className="kit-bar__fill" style={{ width: '80%' }} />
    </span>
    <span aria-hidden="true" className="kit-bar__spark" style={{ left: '80%', animation: 'none', opacity: 1, transform: 'rotate(45deg)' }} />
  </span>
);

export const UiKitSection = () => {
  const [hp, setHp] = useState(84);
  const [cardKey, setCardKey] = useState(0);
  return (
    <section data-artlab-ui="" className="flex max-w-[420px] flex-col gap-6">
      <h2 className="text-heading font-extrabold">UI kit v2 <span className="text-caption text-mutedOnDark">(#12, § 7.2–7.9)</span></h2>

      <Group title="Panel" note="§ 7.2: gold border, inner hairline, diamonds">
        <Panel diamonds className="px-5 py-4">
          <PanelTitle kicker="KICKER">面板標題</PanelTitle>
          <p className="relative mt-3 text-body">文字一律放在面板或玻璃上。</p>
        </Panel>
        <div className="grid grid-cols-2 gap-2">
          <Inset className="px-3 py-2 text-label">Inset</Inset>
          <Inset on className="px-3 py-2 text-label">
            Inset (selected)
          </Inset>
        </div>
      </Group>

      <Group title="Buttons" note="primary, secondary, text, pressed, disabled; 44px+">
        <Button size="lg" full onClick={noop}>
          繼續冒險
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button size="md" variant="secondary" onClick={noop}>
            從頭開始
          </Button>
          <button type="button" data-pressed="" className="kit-btn kit-press kit-btn--primary kit-btn--md">
            按下去
          </button>
          <Button size="sm" variant="text" onClick={noop}>
            逃跑 ›
          </Button>
          <Button size="sm" variant="secondary" disabled onClick={noop}>
            不能按
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <IconButton icon={<Home size={22} />} label="Home" onClick={noop} />
          <IconButton icon={<Pouch size={22} />} label="Menu" onClick={noop} active />
          <GlassChip>
            大安森林公園 <Num>00:24</Num>
          </GlassChip>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tag>摩卡專用</Tag>
          <Tag tone="gold">新</Tag>
          <GlassChip className="rounded-full">
            銅板 <Num>46</Num>
          </GlassChip>
        </div>
      </Group>

      <Group title="Command buttons" note="70px, icon in a gold ring, live sub-label">
        <CommandGrid>
          <CommandButton primary icon={<Cube size={20} />} label="攻擊" sub="丟積木" onClick={noop} />
          <CommandButton icon={<Talent size={20} />} label="才藝" sub="元氣 3" onClick={noop} />
          <CommandButton icon={<Cup size={20} />} label="道具" sub="4 樣" onClick={noop} />
          <CommandButton icon={<Shield size={20} />} label="防禦" sub="減傷一半" onClick={noop} disabled />
        </CommandGrid>
      </Group>

      <Group title="Bars" note="§ 7.3: ok, low < 40%, critical < 20% (pulse + mark), lag, heal">
        <Panel className="flex flex-col gap-3 px-4 py-3">
          <StatBars hp={hp} hpMax={100} mp={9} mpMax={20} />
          <StatBars hp={31} hpMax={90} mp={14} mpMax={20} />
          <StatBars hp={12} hpMax={90} mp={2} mpMax={20} />
          <div className="relative grid grid-cols-2 gap-3 text-caption text-mutedOnDark">
            <span>
              after a hit <LagSample />
            </span>
            <span>
              heal <HealSample />
            </span>
          </div>
          <div className="relative flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setHp((value) => Math.max(0, value - 23))}>
              -23
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setHp((value) => Math.min(100, value + 30))}>
              +30
            </Button>
            <Bar value={hp} max={100} kind="hp" className="flex-1 self-center" />
          </div>
        </Panel>
      </Group>

      <Group title="Command panel" note="§ 7.4: party strip, prompt row, 2×2 grid">
        <div className="overflow-hidden rounded-panel">
          <CommandPanel
            prompt="寶咖咖要做什麼？"
            link={{ label: '逃跑', onClick: noop }}
            party={
              <div className="grid grid-cols-2 gap-2">
                <PartyCard name="寶咖咖" portrait={<Head sprite="baokaka" />} hp={84} hpMax={100} mp={9} mpMax={20} active />
                <PartyCard name="摩卡貓" portrait={<Head sprite="mochaCat" />} hp={31} hpMax={90} mp={14} mpMax={20} />
              </div>
            }
          >
            <CommandGrid>
              <CommandButton primary icon={<Cube size={20} />} label="攻擊" sub="丟積木" onClick={noop} />
              <CommandButton icon={<Talent size={20} />} label="才藝" sub="元氣 3" onClick={noop} />
              <CommandButton icon={<Cup size={20} />} label="道具" sub="4 樣" onClick={noop} />
              <CommandButton icon={<Shield size={20} />} label="防禦" sub="減傷一半" onClick={noop} />
            </CommandGrid>
          </CommandPanel>
        </div>
      </Group>

      <Group title="Lists and switches" note="§ 7.8: 64px rows, gold selection">
        <ListRow>
          <HeadRing size={44}>
            <Head sprite="baokaka" />
          </HeadRing>
          <span className="min-w-0 flex-1 font-serif text-label">一般列</span>
        </ListRow>
        <ListRow selected onClick={noop}>
          <HeadRing size={44}>
            <Head sprite="mochaCat" />
          </HeadRing>
          <span className="min-w-0 flex-1 font-serif text-label">選中的列</span>
        </ListRow>
        <Inset className="px-3">
          <Switch label="減少動態" hint="開" on onToggle={noop} />
          <Switch label="聲音" hint="關" on={false} onToggle={noop} />
        </Inset>
      </Group>

      <Group title="Dialogue box" note="§ 7.5: typing frozen at 700ms, the rest ghosted at 20%">
        <div className="relative h-[460px] overflow-hidden rounded-panel bg-gradient-to-b from-command-top to-panel-deep" data-kit-dialogue="">
          <DialogueBox
            text="「風是往這邊吹的。【寶物】應該掉在附近。草地上會有搗蛋鬼。」"
            speaker={{ name: '摩卡貓', color: BACKLIGHT.jade }}
            portrait={<Bust sprite="mochaCat" />}
            page={{ index: 1, count: 4 }}
            frozenAt={700}
            onAdvance={noop}
          />
        </div>
      </Group>

      <Group title="Departure clock" note="§ 7.6: dot-matrix digits, split-flap">
        <div className="flex justify-center">
          <DepartureClock time="03:40" next="士林夜市" />
        </div>
      </Group>

      <Group title="Chapter card" note="§ 7.6 at 04:30; tap to replay">
        <div className="relative h-[560px] overflow-hidden rounded-panel">
          <ChapterCard key={cardKey} kicker="第 11 章" title="北投的熱呼呼" time="04:30" next="新北投" onDismiss={() => setCardKey((key) => key + 1)} />
        </div>
      </Group>
    </section>
  );
};
