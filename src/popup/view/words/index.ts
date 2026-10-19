/**
 * `view/words/` (#99; GDD § 2.4, § 5.4; popup art bible § 7): the word ring (`WordRing.tsx`, laid
 * out by `ringLayout.ts`), the word card (`WordCard.tsx`), the say effect ring (`SayFx.tsx`), each
 * word's icon and seal colour (`icons.ts`) and the 「要！」 poke's target (`poke.ts`). The state
 * behind them (the ring's words, the learn beat, the tutorial) is `game/words.ts`.
 */
export * from './ringLayout';
export * from './icons';
export * from './poke';
export { WordRing, type WordRingProps } from './WordRing';
export { WordCard, CARD_W, CARD_H } from './WordCard';
export { SayRing, sayRadius, BURST_R, PAGE_R } from './SayFx';
