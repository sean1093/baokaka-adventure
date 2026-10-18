import { SPRITES } from '../../art/sprites';
import { Button } from '../../components/Button';
import { GlassChip, Num } from '../../components/Chip';
import { Panel } from '../../components/Panel';
import { AppBar, Screen } from '../../components/Screen';
import { ListRow } from '../../components/Sheet';
import { ITEMS, MAX_ITEM_COUNT } from '../engine/heroes';
import { UI } from '../engine/strings';
import type { ItemId, Run } from '../engine/types';
import { ItemIcon } from './PartySheet';

const Vendor = SPRITES.vendor;

type Props = { stock: ItemId[]; run: Run; onBuy: (item: ItemId) => void; onClose: () => void };

/** The 銅板 shop. One row per item: art, name, what it does, and the price on a buy button. */
export const ShopScreen = ({ stock, run, onBuy, onClose }: Props) => (
  <Screen className="gap-3">
    <AppBar
      title="用銅板換東西"
      kicker="小店"
      onBack={onClose}
      backLabel="離開小店"
      right={
        <GlassChip className="rounded-full">
          {UI.coins} <Num>{run.coins}</Num>
        </GlassChip>
      }
    />

    {/* The shopkeeper speaks from a small panel, her backlight warm */}
    <Panel className="flex items-center gap-3 px-3 py-3">
      <span className="relative block h-[72px] w-[72px] shrink-0">
        <span aria-hidden="true" className="absolute inset-[-6px] block rounded-full bg-[radial-gradient(circle,theme(colors.backlight.warm/55%),transparent_68%)]" />
        <span className="relative block h-full w-full">
          <Vendor lod="battle" />
        </span>
      </span>
      <span className="relative min-w-0">
        <span className="kit-nameplate !static mb-1 inline-block !px-4 !py-0.5 !text-[15px]">老闆娘</span>
        <span className="block text-body leading-relaxed">「看看有沒有喜歡的，銅板夠就拿去。」</span>
      </span>
    </Panel>

    <div className="flex flex-col gap-2">
      {stock.map((item) => {
        const entry = ITEMS[item];
        const held = run.items[item] ?? 0;
        const broke = run.coins < entry.price;
        const full = held >= MAX_ITEM_COUNT;
        return (
          <ListRow key={item}>
            <ItemIcon item={item} size={48} />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span className="truncate font-serif text-[19px] font-black tracking-[0.06em]">{entry.name}</span>
                {held > 0 && <span className="shrink-0 text-caption text-mutedOnDark">有 <span className="font-num">{held}</span></span>}
              </span>
              <span className="line-clamp-2 block text-caption leading-snug text-mutedOnDark">{entry.blurb}</span>
            </span>
            {/* Secondary on purpose: a shop is a list of equal choices, with no one gold "next thing" */}
            <Button size="sm" variant="secondary" disabled={broke || full} label={full ? undefined : `買${entry.name}，${UI.coinCount(entry.price)}`} onClick={() => onBuy(item)} className="min-w-[76px] gap-1 !tracking-normal">
              {full ? (
                '滿了'
              ) : (
                <>
                  <Num className="text-[19px]">{entry.price}</Num>
                  <span className="text-[14px]">個</span>
                </>
              )}
            </Button>
          </ListRow>
        );
      })}
    </div>

    <Button size="lg" full variant="secondary" onClick={onClose}>
      不買了
    </Button>
  </Screen>
);
