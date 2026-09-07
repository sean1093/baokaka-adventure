import { ITEMS, MAX_LEVEL, XP_TABLE, addItem, heroStats, spellsFor } from './heroes';
import { HERO_ORDER, type FoeId, type HeroId, type ItemId, type Line, type Run, type SpellId, type Step } from './types';

/** Where a script is: the steps it plays and how far it has got. */
export type Scene = { steps: Step[]; at: number };

/** Why the runner stopped. Everything except `done` waits for the player. */
export type Stop =
  | { kind: 'line'; line: Line }
  | { kind: 'chapter'; n: number; title: string }
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
 */
export function runScene(run: Run, scene: Scene): SceneResult {
  let draft = run;
  let at = scene.at;

  while (at < scene.steps.length) {
    const step = scene.steps[at];
    const next = { steps: scene.steps, at };

    if ('text' in step) return { run: draft, scene: next, stop: { kind: 'line', line: step } };

    switch (step.do) {
      case 'chapter':
        draft = { ...draft, chapter: Math.max(draft.chapter, step.n) };
        return { run: draft, scene: next, stop: { kind: 'chapter', n: step.n, title: step.title } };

      case 'battle':
        return { run: draft, scene: next, stop: { kind: 'battle', foes: step.foes, boss: step.boss ?? false } };

      case 'shop':
        return { run: draft, scene: next, stop: { kind: 'shop', stock: step.stock } };

      case 'inn':
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

      case 'stickers':
        draft = { ...draft, stickers: Math.max(0, draft.stickers + step.amount) };
        break;

      case 'heal':
        draft = healParty(draft);
        break;

      case 'goto':
        draft = { ...draft, map: step.map, pos: { c: step.c, r: step.r }, steps: 0 };
        break;
    }
    at += 1;
  }

  return { run: draft, scene: { steps: scene.steps, at }, stop: { kind: 'done' } };
}

/** The lines the inn shows for the player's answer; the runner has no way to script these. */
export function innLines(run: Run, price: number, yes: boolean): { run: Run; lines: Line[] } {
  if (!yes) return { run, lines: [{ who: null, text: '「那下次再來喔。」' }] };
  if (run.stickers < price) return { run, lines: [{ who: null, text: `貼紙不夠，還差 ${price - run.stickers} 張。` }] };
  return {
    run: healParty({ ...run, stickers: run.stickers - price }),
    lines: [{ who: null, text: '呼……睡了一覺，全隊體力和真氣都滿了。' }],
  };
}

export const itemName = (item: ItemId): string => ITEMS[item].name;
