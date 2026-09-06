import type { SpriteName } from '../../art/types';
import type { Size, Symbols } from './types';

/** The nine toys, in value order; a 4x4 board uses the first four, a 6x6 the first six. */
export const SYMBOLS: readonly { sprite: SpriteName; name: string }[] = [
  { sprite: 'ball', name: '皮球' },
  { sprite: 'bottle', name: '奶瓶' },
  { sprite: 'cookie', name: '餅乾' },
  { sprite: 'toyBoat', name: '小船' },
  { sprite: 'sock', name: '襪子' },
  { sprite: 'comfortDoll', name: '娃娃' },
  { sprite: 'banana', name: '香蕉' },
  { sprite: 'shell', name: '貝殼' },
  { sprite: 'apple', name: '蘋果' },
];

export const symbolName = (symbols: Symbols, value: number): string =>
  symbols === 'digits' ? String(value) : SYMBOLS[value - 1].name;

export const SIZE_LABELS: Record<Size, { name: string; blurb: string }> = {
  4: { name: '小櫃子', blurb: '4×4，一下就收好' },
  6: { name: '中櫃子', blurb: '6×6，剛剛好' },
  9: { name: '大櫃子', blurb: '9×9，慢慢來' },
};

export const UNIT_LABELS = { row: '這一橫列', col: '這一直行', box: '這一區' } as const;
