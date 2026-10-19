/**
 * `view/talk/` (#98): everything said on the page. The thought bubble (GDD § 2.2.6), bark bubbles
 * (`barks.ts`), subtitle bubbles and the narration strip (§ 2.13, § 5.1), placed so they never
 * cover Baokaka or the goal (`place.ts`, `layout.ts`), drawn in paper (`art.ts`, `Talk.tsx`,
 * `talk.css`). The subtitle queue itself is `game/talk.ts`; the lines are `content/script.ts`.
 */
export * from './place';
export * from './barks';
export * from './layout';
export { BarkBubble, SPEAKER_INK, Subtitles, ThoughtBubble, bubbleShow, showKey } from './Talk';
