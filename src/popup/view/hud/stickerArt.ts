import { POPUP as C } from '../../../art/palette';
import { UI } from '../../content';
import type { Sticker } from '../../game/progress';

/**
 * The page's three stickers (GDD § 2.8; bible § 7): their names and their icons on a foil disc —
 * ✓ for 解開, 嘿 for 淘氣, a 土地公 hat — drawn in a disc's local space (centre 0, 0) for a disc of
 * radius 12.5; scale the group for bigger discs. Shared by the bottom bar's tray, its sticker pop and
 * the sticker card (#97, #101).
 */

export type StickerKind = 'solved' | Sticker;

/** In the bar's order: 解開, 淘氣, 土地公. */
export const STICKER_KINDS: readonly StickerKind[] = ['solved', 'mischief', 'tudigong'];

export const STICKER_NAME: Readonly<Record<StickerKind, string>> = {
  solved: UI.stickers.solved,
  mischief: UI.stickers.mischief,
  tudigong: UI.stickers.tudigong,
};

export const STICKER_ICON: Readonly<Record<StickerKind, string>> = {
  solved: `<path d="M-6 0l4 4l8 -9" fill="none" stroke="${C.foilInk}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  mischief: `<text data-art-text="" y="5" text-anchor="middle" font-family="'Noto Serif TC'" font-weight="900" font-size="13" fill="${C.foilInk}">嘿</text>`,
  tudigong: `<path d="M-7 0a7 7 0 0 1 14 0z" fill="${C.hatRed}"/><path d="M-5 1q5 9 10 0z" fill="${C.standeeCard}"/>`,
};
