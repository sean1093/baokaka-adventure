/**
 * The hint lines (GDD § 2.7, § 5.3), zh-Hant: at most one short line (≤ 12 characters) with a hint
 * of level 1 or more, said by Mocha in a bark bubble — always optional (the halo, the ghost hand
 * and Mocha's look carry the hint without reading, R5). Copied from § 5.3's list; a hint the list
 * has no line for (a tap on a prop, petting Mocha) shows none (D-63).
 */
export type HintLineKey = 'drag' | 'turn' | 'flap' | 'perch' | 'hide' | 'say' | 'wait';

export const HINT_LINES: Readonly<Record<HintLineKey, string>> = {
  drag: '拉拉看這裡',
  turn: '轉轉看',
  flap: '翻開看看',
  perch: '讓摩卡上去',
  hide: '藏起來看看？',
  say: '試試看說話',
  wait: '等等看。',
};

/** § 2.7: a hint line is at most this many characters. */
export const HINT_LINE_MAX = 12;
