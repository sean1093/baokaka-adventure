import type { ReactElement } from 'react';

/**
 * 一個 sprite 就是一個填滿自己方框的 SVG。
 * 規約（所有 sprite 必須遵守，否則會在場景裡大小不一）：
 *   1. 根節點固定 <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
 *   2. 主體要撐到 viewBox 的 80% 以上，且不可超出 0..100（超出會被相鄰熱區裁切）
 *   3. 平塗色塊 + 深色描邊：stroke={C.ink} strokeWidth={4} strokeLinejoin="round"
 *   4. 只用 palette.ts 的顏色；不用漸層、不用濾鏡、不用外部字型
 *   5. 不放任何互動屬性（onClick / tabIndex）——點擊由外層 <button> 負責
 */
export type Sprite = () => ReactElement;
