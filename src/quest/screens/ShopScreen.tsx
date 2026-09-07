import { SPRITES } from '../../art/sprites';
import { Button } from '../../components/Button';
import { AppBar, Chip, Screen } from '../../components/Screen';
import { ITEMS, MAX_ITEM_COUNT } from '../engine/heroes';
import type { ItemId, Run } from '../engine/types';

const Vendor = SPRITES.vendor;

type Props = { stock: ItemId[]; run: Run; onBuy: (item: ItemId) => void; onClose: () => void };

/** The sticker shop. One row per item: art, name, what it does, price and a buy button. */
export const ShopScreen = ({ stock, run, onBuy, onClose }: Props) => (
  <Screen className="gap-3">
    <AppBar title="用貼紙換東西" kicker="小店" onBack={onClose} backLabel="離開小店" right={<Chip tone="sun">貼紙 {run.stickers}</Chip>} />

    <section className="flex items-center gap-3 rounded-3xl bg-gradient-to-br from-sun/30 via-cream to-berry/15 p-4 shadow-card">
      <span className="block h-16 w-16 shrink-0">
        <Vendor />
      </span>
      <p className="text-copy font-bold leading-relaxed text-ink/80">「看看有沒有喜歡的，貼紙夠就拿去。」</p>
    </section>

    <div className="flex flex-col gap-2">
      {stock.map((item) => {
        const entry = ITEMS[item];
        const Art = SPRITES[entry.sprite];
        const held = run.items[item] ?? 0;
        const broke = run.stickers < entry.price;
        const full = held >= MAX_ITEM_COUNT;
        return (
          <div key={item} className="flex items-center gap-3 rounded-3xl bg-surface p-3 shadow-card">
            <span className="block h-12 w-12 shrink-0">
              <Art />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-1.5">
                <span className="truncate text-heading font-extrabold leading-tight">{entry.name}</span>
                {held > 0 && <span className="shrink-0 text-caption font-bold text-muted">有 {held}</span>}
              </span>
              <span className="block truncate text-caption leading-snug text-muted">{entry.blurb}</span>
            </span>
            <Button size="sm" variant={broke || full ? 'tonal' : 'primary'} disabled={broke || full} onClick={() => onBuy(item)}>
              {full ? '滿了' : `${entry.price} 張`}
            </Button>
          </div>
        );
      })}
    </div>

    <Button size="lg" full variant="tonal" onClick={onClose}>
      不買了
    </Button>
  </Screen>
);
