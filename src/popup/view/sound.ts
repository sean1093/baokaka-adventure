import { createContext, useContext } from 'react';
import { motifVoices, playSfx, playVoices, voiceVoices, type MotifStyle, type SfxCue } from '../../shared/audio';
import type { SimEvent } from '../core/events';
import { mochaLinked, mochaNode } from '../core/mocha';
import type { Id, PageDef, PartDef, SimState, Word } from '../core/types';
import { WORD_MOTIF } from '../game/words';
import { sayingWord } from './actors/animMap';
import type { GestureEvent } from './gestures';
import { barksOf } from './talk/barks';

/**
 * 翻翻台北's sound map (GDD § 2.12, bible § 8; #105): which cue each moment of play sounds. Pure —
 * a tick's events and change of state (`tickSounds`), a gesture (`gestureSounds`) → `Sound`s — so
 * `sound.test.ts` checks every § 2.12 row; `playSound` hands them to the synth (`shared/audio.ts`).
 *
 * The screens reach the synth through `SoundContext` (`useSound`): the shell provides it while it
 * is live, and everything else (the art lab, PageLab, a still) gets the silent default. Every cue
 * has its visual (R9): nothing here is the only sign of anything, and the game plays the same muted.
 */

export type Sound =
  | { readonly cue: SfxCue; readonly delay?: number; readonly pitch?: number; readonly gain?: number }
  /** A word said: its motif (`WORD_MOTIF`) */
  | { readonly word: Word }
  /** A bark as voice blips: one per syllable; Baokaka high, Mocha low */
  | { readonly voice: number; readonly who: 'baby' | 'mocha'; readonly delay?: number };

/** How each word's motif is voiced (GDD § 2.12 word row: 嗶 beep-beep, 掰掰 waving, 不要 two low stomps …). */
export const MOTIF_STYLE: Readonly<Record<Word, MotifStyle>> = {
  beep: 'beep',
  bye: 'wave',
  no: 'stomp',
  wow: 'sweep',
  hug: 'warm',
  plane: 'whooshUp',
  whoosh: 'whoosh',
  together: 'chord',
};

/** Syllables in a line (one per Han character or bopomofo; punctuation and dashes are silent). */
export function syllables(text: string): number {
  return [...text].filter((ch) => /[ㄅ-ㄯ㐀-鿿]/u.test(ch)).length;
}

/** A part's sound as it reaches a stop (GDD § 2.12): a wheel's ratchet, a flap's flop, else a wooden click. */
export function stopCue(part: Pick<PartDef, 'preset'>): SfxCue {
  if (part.preset === 'wheel' || part.preset === 'loop') return 'ratchet';
  if (part.preset === 'flap') return 'flop';
  return 'click';
}

/** What fell when Mocha pushed it, by its art: a coin clinks, a pigeon flaps, the rest is paper. */
export function dropCue(art: string): SfxCue {
  if (/coin|token|ticket-coin|yuan/i.test(art)) return 'dropCoin';
  if (/pigeon|bird|feather/i.test(art)) return 'dropFlap';
  return 'dropPaper';
}

/** A creature's voice, by its art: a pigeon coos, a goose honks, a squirrel or a mouse chitters, the rest chirp. */
export function creatureCue(art: string): SfxCue {
  if (/pigeon|dove/i.test(art)) return 'coo';
  if (/goose|duck/i.test(art)) return 'honk';
  if (/squirrel|mouse|rat|monkey/i.test(art)) return 'chitter';
  return 'chirp';
}

/** Baby barks that have their own cue instead of plain voice blips. */
const BARK_CUE: Readonly<Partial<Record<string, SfxCue>>> = {
  wantWant: 'want',
  cry: 'cry',
  nope: 'mew',
  puff: 'puff',
};

/** Moods with no sound of their own: the stare is a silent beat (the scrape follows), the purr and the hint line are text. */
const SILENT_BARKS: ReadonlySet<string> = new Set(['word', 'stare', 'purr', 'hint']);

/**
 * The sounds of one tick (GDD § 2.12): the word said, the barks, the change of target and of mode,
 * Baokaka's and Mocha's steps, a push and what it drops, the creatures, the grab, the parts that
 * moved on their own. `moved` are the parts the player just set: their gesture already sounded
 * (`gestureSounds`), so the tick that applies it stays quiet for them.
 */
export function tickSounds(def: PageDef, prev: SimState, state: SimState, events: readonly SimEvent[], moved: ReadonlySet<Id> = new Set()): Sound[] {
  const out: Sound[] = [];
  const has = (type: SimEvent['type']) => events.some((e) => e.type === type);

  // A word said: its motif
  const word = sayingWord(prev, state, events);
  if (word !== null) out.push({ word });

  // Target change: the rising ding (his bark follows it)
  const targeted = state.baby.target !== null && state.baby.target !== prev.baby.target;
  if (targeted) out.push({ cue: 'ding' });

  // Barks (the bubbles' own choice, `barksOf`): voice blips, or their own cue
  for (const b of barksOf(prev, state, events)) {
    if (SILENT_BARKS.has(b.bark)) continue;
    const cue = BARK_CUE[b.bark];
    if (cue !== undefined) out.push({ cue });
    else if (b.who === 'baby' && b.bark !== 'cry') out.push({ voice: syllables(b.text), who: 'baby', delay: targeted ? 0.24 : 0 });
    else if (b.who === 'mocha' && b.bark === 'arrive') out.push({ voice: 1, who: 'mocha' });
  }
  // Crying without the 哇—— bubble (the cry event of a page's own reaction): the same soft glide
  if (has('cry') && !out.some((s) => 'cue' in s && s.cue === 'cry')) out.push({ cue: 'cry' });

  // Looking: the questioning up-glide as he starts looking about
  if (state.baby.mode === 'looking' && prev.baby.mode !== 'looking') out.push({ cue: 'look' });

  // Crawl: pat-pat for each step he takes on his own (not riding, not carried)
  if (state.baby.node !== prev.baby.node && !state.baby.carriedBy && !has('ride') && state.baby.mode !== 'carried') out.push({ cue: 'patpat' });

  // Mocha hops: a soft thump each node, and as he lands; linked (#128) he pads along the floor, softer
  const was = mochaNode(def, prev);
  const now = mochaNode(def, state);
  const padding = mochaLinked(prev) && mochaLinked(state);
  if (now !== null && now !== was) out.push({ cue: 'thump', gain: padding ? 0.45 : state.mocha.path.length === 0 ? 1.2 : 0.8 });

  // A push: the slow scrape; what lands: its material's drop
  if (has('push')) out.push({ cue: 'scrape' });
  for (const e of events) {
    if (e.type !== 'land') continue;
    const part = def.parts.find((p) => p.id === e.id);
    out.push({ cue: dropCue(part?.art ?? '') });
  }

  // Creatures react: their short synth voice
  for (const c of def.creatures) {
    if (state.creatures[c.id] !== prev.creatures[c.id]) out.push({ cue: creatureCue(c.art) });
  }

  // The goal grabbed (or any treasure): the sparkle arpeggio
  if (has('grab')) out.push({ cue: 'sparkle' });

  // Parts that moved without the player's hand (a reaction, Mocha's weight, an event): their stop sound
  for (const e of events) {
    if (e.type !== 'partEnter' || e.id === undefined || moved.has(e.id)) continue;
    const part = def.parts.find((p) => p.id === e.id);
    if (part !== undefined && part.preset !== 'pushable') out.push({ cue: stopCue(part) });
  }

  // A locked part, or a stop it can't reach: the low boop (with the wobble and Mocha's glare)
  if (has('locked') || has('jam') || has('strain')) out.push({ cue: 'boop' });
  return out;
}

/** The sound of a gesture (GDD § 2.12): the swish as a drag starts, the stop as it snaps or a tap moves it, the boop on a locked part. */
export function gestureSounds(def: PageDef, event: GestureEvent): Sound[] {
  const part = (id: Id) => def.parts.find((p) => p.id === id);
  switch (event.type) {
    case 'dragStart': {
      const p = part(event.part);
      return p === undefined || p.preset === 'wheel' || p.preset === 'loop' ? [] : [{ cue: 'swish' }];
    }
    case 'snap': {
      const p = part(event.part);
      return p === undefined ? [] : [{ cue: stopCue(p) }];
    }
    case 'tap': {
      if (event.target.kind !== 'part') return [];
      const p = part(event.target.id);
      return p === undefined ? [] : [{ cue: stopCue(p) }];
    }
    case 'nope':
      return [{ cue: 'boop' }];
    default:
      return [];
  }
}

/** A sticker earned mid-page (GDD § 2.12 sticker row): the pop over the tray, then 「嘿嘿」 (淘氣) or the bell (土地公). */
export function stickerSounds(sticker: 'mischief' | 'tudigong'): Sound[] {
  return [{ cue: 'pop' }, sticker === 'mischief' ? { cue: 'hehe', delay: 0.12 } : { cue: 'bell', delay: 0.08 }];
}

/** Plays one sound now (a no-op until a gesture unlocks audio, and at 音效 0). */
export function playSound(s: Sound): void {
  if ('cue' in s) playSfx(s.cue, { delay: s.delay, pitch: s.pitch, gain: s.gain });
  else if ('word' in s) playVoices(motifVoices(WORD_MOTIF[s.word], MOTIF_STYLE[s.word]));
  else playVoices(voiceVoices(s.voice, s.who === 'mocha' ? 0.62 : 1), { delay: s.delay });
}

/** Where sounds go: the synth in a live shell, nowhere elsewhere. Timed sounds are timed by their screen (its timers stop with it). */
export type SoundSink = (sounds: readonly Sound[]) => void;

/** The silent sink: the art lab, PageLab and stills never make a sound. */
export const SILENT: SoundSink = () => undefined;

/** The live sink: every sound to the synth (in dev, also to `window.__popupSounds` when a QA script set it up). */
export const LIVE: SoundSink = (sounds) => {
  if (import.meta.env.DEV) (window as { __popupSounds?: Sound[] }).__popupSounds?.push(...sounds);
  sounds.forEach(playSound);
};

export const SoundContext = createContext<SoundSink>(SILENT);

/** The sound sink for this screen (silent outside a live shell). */
export const useSound = (): SoundSink => useContext(SoundContext);
