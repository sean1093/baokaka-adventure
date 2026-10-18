import { EVENTS } from './events';
import { ITEMS, MAX_LEVEL, XP_TABLE, addItem, heroStats, spellsFor } from './heroes';
import { meets } from './path';
import { UI } from './strings';
import { substitute } from './text';
import {
  HERO_ORDER,
  type ChoiceOption,
  type FoeId,
  type HeroId,
  type ItemId,
  type Line,
  type Run,
  type SpellId,
  type Step,
} from './types';

/** Where a script is: the steps it plays and how far it has got. */
export type Scene = { steps: Step[]; at: number };

/** Why the runner stopped. Everything except `done` waits for the player. */
export type Stop =
  | { kind: 'line'; line: Line }
  | { kind: 'chapter'; n: number; title: string; time?: string; label?: string }
  | { kind: 'choice'; prompt?: string; options: ChoiceOption[] }
  | { kind: 'battle'; foes: FoeId[]; boss: boolean }
  | { kind: 'shop'; stock: ItemId[] }
  | { kind: 'inn'; price: number }
  | { kind: 'ending' }
  | { kind: 'done' };

export type SceneResult = { run: Run; scene: Scene; stop: Stop };

export const fullHp = (run: Pick<Run, 'level' | 'equip'>, hero: HeroId): number => heroStats(hero, run.level, run.equip[hero]).hp;
export const fullMp = (run: Pick<Run, 'level' | 'equip'>, hero: HeroId): number => heroStats(hero, run.level, run.equip[hero]).mp;

/** Restores the whole party. Used by the inn, by 媽媽's hug, and after every level gained. */
export function healParty(run: Run): Run {
  const hp = { ...run.hp };
  const mp = { ...run.mp };
  for (const hero of HERO_ORDER) {
    hp[hero] = fullHp(run, hero);
    mp[hero] = fullMp(run, hero);
  }
  return { ...run, hp, mp };
}

/**
 * The `heal` step with a ratio: every hero, fallen or not, is raised to at least `ratio` of their
 * max HP and MP (rounded up), and never lowered. A ratio of 1 is the same as `healParty`.
 */
export function healPartyTo(run: Run, ratio: number): Run {
  const hp = { ...run.hp };
  const mp = { ...run.mp };
  for (const hero of HERO_ORDER) {
    hp[hero] = Math.max(hp[hero], Math.ceil(fullHp(run, hero) * ratio));
    mp[hero] = Math.max(mp[hero], Math.ceil(fullMp(run, hero) * ratio));
  }
  return { ...run, hp, mp };
}

/**
 * How many `goEvent` / `include` expansions one `runScene` call may make before giving up.
 * validate.ts rejects include cycles; this only keeps a bad `goEvent` loop from hanging the game.
 */
const MAX_JUMPS = 64;

/** Adds XP and walks the level table; every level gained heals the party and may teach a spell. */
export function gainXp(run: Run, amount: number): { run: Run; levels: number; learned: SpellId[] } {
  const before = run.level;
  let level = before;
  const xp = run.xp + amount;
  while (level < MAX_LEVEL && xp >= XP_TABLE[level]) level += 1;
  if (level === before) return { run: { ...run, xp }, levels: 0, learned: [] };

  const learned = run.party.flatMap((hero) =>
    spellsFor(hero, level)
      .filter((spell) => spell.level > before)
      .map((spell) => spell.id),
  );
  return { run: healParty({ ...run, xp, level }), levels: level - before, learned };
}

/**
 * Plays a script from `scene.at` until something needs the player. Pure: side effects are
 * folded into the returned run, so a scene replays identically.
 *
 * `goEvent` and `include` never recurse: they rewrite the step list in place. `goEvent` swaps the
 * rest of the scene for the target event; `include` splices the target in at the current index,
 * so the returned `scene.steps` may differ from the input and `at` always indexes into it.
 */
export function runScene(run: Run, scene: Scene): SceneResult {
  let draft = run;
  let steps = scene.steps;
  let at = scene.at;
  let jumps = 0;

  while (at < steps.length) {
    const step = steps[at];
    const next = { steps, at };

    if ('text' in step) {
      const text = substitute(step.text, draft);
      return { run: draft, scene: next, stop: { kind: 'line', line: text === step.text ? step : { ...step, text } } };
    }

    switch (step.do) {
      case 'chapter': {
        // A labelled card (尾聲, 番外) is not a numbered chapter, so it never moves the counter
        if (step.label === undefined) draft = { ...draft, chapter: Math.max(draft.chapter, step.n) };
        const stop: Stop = { kind: 'chapter', n: step.n, title: step.title };
        if (step.time !== undefined) stop.time = step.time;
        if (step.label !== undefined) stop.label = step.label;
        return { run: draft, scene: next, stop };
      }

      case 'choice': {
        const stop: Stop = { kind: 'choice', options: step.options };
        if (step.prompt !== undefined) stop.prompt = substitute(step.prompt, draft);
        return { run: draft, scene: next, stop };
      }

      case 'goEvent':
        jumps += 1;
        if (jumps > MAX_JUMPS) return { run: draft, scene: next, stop: { kind: 'done' } };
        steps = EVENTS[step.event] ?? [];
        at = 0;
        continue;

      case 'include':
        if (meets(draft.flags, step)) {
          jumps += 1;
          if (jumps > MAX_JUMPS) return { run: draft, scene: next, stop: { kind: 'done' } };
          steps = [...steps.slice(0, at), ...(EVENTS[step.event] ?? []), ...steps.slice(at + 1)];
          continue;
        }
        break;

      case 'battle':
        return { run: draft, scene: next, stop: { kind: 'battle', foes: step.foes, boss: step.boss ?? false } };

      case 'shop':
        return { run: draft, scene: next, stop: { kind: 'shop', stock: step.stock } };

      case 'inn':
        // A free bench, slide or floor: no question, no payment line, just the rest
        if (step.price === 0) return { run: healParty(draft), scene: next, stop: { kind: 'line', line: { who: null, text: UI.innFree } } };
        return { run: draft, scene: next, stop: { kind: 'inn', price: step.price } };

      case 'ending':
        return { run: { ...draft, cleared: true }, scene: next, stop: { kind: 'ending' } };

      case 'join':
        if (!draft.party.includes(step.hero)) {
          draft = {
            ...draft,
            party: [...draft.party, step.hero],
            hp: { ...draft.hp, [step.hero]: fullHp(draft, step.hero) },
            mp: { ...draft.mp, [step.hero]: fullMp(draft, step.hero) },
          };
        }
        break;

      case 'flag':
        if (!draft.flags.includes(step.flag)) draft = { ...draft, flags: [...draft.flags, step.flag] };
        break;

      case 'give':
        draft = { ...draft, items: addItem(draft.items, step.item, step.count ?? 1) };
        break;

      case 'coins':
        draft = { ...draft, coins: Math.max(0, draft.coins + step.amount) };
        break;

      case 'heal':
        draft = step.ratio === undefined ? healParty(draft) : healPartyTo(draft, step.ratio);
        break;

      case 'goto':
        draft = { ...draft, map: step.map, pos: { c: step.c, r: step.r }, steps: 0 };
        break;
    }
    at += 1;
  }

  return { run: draft, scene: { steps, at }, stop: { kind: 'done' } };
}

/** The lines the inn shows for the player's answer; the runner has no way to script these. */
export function innLines(run: Run, price: number, yes: boolean): { run: Run; lines: Line[] } {
  if (!yes) return { run, lines: [{ who: null, text: UI.innDeclined }] };
  if (run.coins < price) return { run, lines: [{ who: null, text: UI.innShort(price - run.coins) }] };
  return {
    run: healParty({ ...run, coins: run.coins - price }),
    lines: [{ who: null, text: UI.innRested }],
  };
}

export const itemName = (item: ItemId): string => ITEMS[item].name;
