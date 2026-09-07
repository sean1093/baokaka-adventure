import { roll } from '../../shared/random';
import { battleStep, battleStickers, battleXp, startBattle } from './battle';
import { EVENTS } from './events';
import { FOES } from './foes';
import { ITEMS, STARTING_ITEMS, addItem, heroStats, isEquip, removeItem } from './heroes';
import { MAPS } from './maps';
import { chestOpened, meets } from './path';
import { fullHp, fullMp, gainXp, healParty, runScene, type Scene, type Stop } from './scene';
import {
  HERO_ORDER,
  type Battle,
  type BattleAction,
  type FoeId,
  type HeroId,
  type ItemId,
  type Line,
  type Run,
  type SpellId,
  type Step,
  type Tile,
} from './types';

/** After a defeat the party wakes at the map entrance with this much HP; nothing else is lost. */
const REVIVE_RATIO = 0.4;

export type VictorySummary = { xp: number; stickers: number; drops: ItemId[]; levels: number; learned: SpellId[]; level: number };

export type QuestView =
  | { screen: 'title' }
  | { screen: 'world' }
  | { screen: 'battle'; battle: Battle }
  | { screen: 'victory'; summary: VictorySummary }
  | { screen: 'defeat' }
  | { screen: 'shop'; stock: ItemId[] }
  | { screen: 'ending' };

export type QuestState = {
  view: QuestView;
  run: Run;
  /** The script playing over the world, if any */
  scene: Scene | null;
  /** The line currently on screen */
  line: Line | null;
  /** The chapter title card, shown until tapped */
  card: { n: number; title: string } | null;
  /** The inn question, waiting for an answer */
  inn: number | null;
  sound: boolean;
};

export type QuestAction =
  | { type: 'newGame'; seed: number }
  | { type: 'continue' }
  | { type: 'backToTitle' }
  /** The party finished walking into this tile */
  | { type: 'step'; tile: Tile; facing: 'left' | 'right' }
  /** The player tapped an NPC or a chest they are standing next to */
  | { type: 'interact'; id: string }
  /** Advance the dialogue / dismiss the chapter card */
  | { type: 'advance' }
  | { type: 'innAnswer'; yes: boolean }
  | { type: 'battle'; action: BattleAction }
  | { type: 'battleEnd' }
  | { type: 'victoryContinue' }
  | { type: 'retry' }
  | { type: 'buy'; item: ItemId }
  | { type: 'closeShop' }
  | { type: 'useItem'; item: ItemId; hero: HeroId }
  | { type: 'equip'; item: ItemId | null; hero: HeroId }
  | { type: 'toggleSound' }
  | { type: 'endingContinue' };

export function freshRun(seed = 1, cleared = false): Run {
  const level = 1;
  const base = { level, equip: { baokaka: null, mocha: null, duck: null } } as Pick<Run, 'level' | 'equip'>;
  const hp = {} as Record<HeroId, number>;
  const mp = {} as Record<HeroId, number>;
  for (const hero of HERO_ORDER) {
    hp[hero] = fullHp(base, hero);
    mp[hero] = fullMp(base, hero);
  }
  return {
    map: 'home',
    pos: MAPS.home.entry,
    facing: 'right',
    party: ['baokaka'],
    level,
    xp: 0,
    hp,
    mp,
    equip: { baokaka: null, mocha: null, duck: null },
    items: { ...STARTING_ITEMS },
    stickers: 0,
    flags: [],
    steps: 0,
    seed,
    chapter: 1,
    cleared,
  };
}

/** A run worth offering 繼續冒險 for: anything past the opening cutscene. */
export const runStarted = (run: Run): boolean => run.flags.length > 0 || run.xp > 0 || run.map !== 'home';

export const initialState = (run: Run, sound: boolean): QuestState => ({
  view: { screen: 'title' },
  run,
  scene: null,
  line: null,
  card: null,
  inn: null,
  sound,
});

const idle = (state: QuestState): QuestState => ({ ...state, scene: null, line: null, card: null, inn: null });

/** Folds a scene stop into the state: a line to read, a card, a battle, a shop, or back to walking. */
function settle(state: QuestState, run: Run, scene: Scene, stop: Stop): QuestState {
  const base = { ...state, run, scene, line: null, card: null, inn: null };
  switch (stop.kind) {
    case 'line':
      return { ...base, line: stop.line };
    case 'chapter':
      return { ...base, card: { n: stop.n, title: stop.title } };
    case 'battle':
      return { ...base, view: { screen: 'battle', battle: startBattle(run, stop.foes, run.seed, stop.boss) } };
    case 'shop':
      return { ...base, view: { screen: 'shop', stock: stop.stock } };
    case 'inn':
      return { ...base, inn: stop.price };
    case 'ending':
      return { ...base, scene: null, view: { screen: 'ending' } };
    case 'done':
      return { ...base, scene: null, view: { screen: 'world' } };
  }
}

/** Starts a script and plays it up to its first pause. */
function play(state: QuestState, steps: Step[], run = state.run): QuestState {
  const result = runScene(run, { steps, at: 0 });
  return settle(state, result.run, result.scene, result.stop);
}

/** Resumes the current script one step past where it stopped. */
function resume(state: QuestState, run = state.run): QuestState {
  if (!state.scene) return { ...idle(state), run };
  const result = runScene(run, { steps: state.scene.steps, at: state.scene.at + 1 });
  return settle(state, result.run, result.scene, result.stop);
}

/** The event fired by walking onto a tile: an exit, then a trigger. Nothing else moves the story. */
function tileEvent(run: Run): { steps: Step[]; run: Run } | null {
  const map = MAPS[run.map];
  const { c, r } = run.pos;

  for (const exit of map.exits) {
    if (exit.c !== c || exit.r !== r) continue;
    if (meets(run.flags, exit)) {
      const target = MAPS[exit.to];
      const moved: Run = { ...run, map: exit.to, pos: exit.at, steps: 0 };
      const intro = target.triggers.find((trigger) => trigger.c === exit.at.c && trigger.r === exit.at.r);
      if (intro && meets(moved.flags, intro) && !moved.flags.includes(`trigger:${intro.id}`)) {
        return { run: { ...moved, flags: [...moved.flags, `trigger:${intro.id}`] }, steps: EVENTS[intro.event] };
      }
      return { run: moved, steps: [] };
    }
    if (exit.blocked) return { run, steps: EVENTS[exit.blocked] };
  }

  for (const trigger of map.triggers) {
    if (trigger.c !== c || trigger.r !== r || !meets(run.flags, trigger)) continue;
    const key = `trigger:${trigger.id}`;
    if (trigger.once && run.flags.includes(key)) continue;
    return { run: trigger.once ? { ...run, flags: [...run.flags, key] } : run, steps: EVENTS[trigger.event] };
  }
  return null;
}

/** Rolls for a random encounter on the tile just entered. */
function encounter(run: Run): { run: Run; foes: FoeId[] } | null {
  const { encounters } = MAPS[run.map];
  if (!encounters) return null;
  const { zone, min, rate, groups } = encounters;
  const { c, r } = run.pos;
  if (zone && (c < zone.c0 || c > zone.c1 || r < zone.r0 || r > zone.r1)) return null;
  if (run.steps < min) return null;

  const first = roll(run.seed);
  if (first.value >= rate) return { run: { ...run, seed: first.seed }, foes: [] };
  const second = roll(first.seed);
  return { run: { ...run, seed: second.seed, steps: 0 }, foes: groups[Math.floor(second.value * groups.length)] };
}

/** Folds a won battle back into the run: HP, MP, items as they ended, plus XP, stickers and drops. */
export function applyVictory(run: Run, battle: Battle): { run: Run; summary: VictorySummary } {
  const hp = { ...run.hp };
  const mp = { ...run.mp };
  for (const hero of HERO_ORDER) {
    hp[hero] = battle.heroes[hero].hp;
    mp[hero] = battle.heroes[hero].mp;
  }

  let seed = run.seed;
  let items = battle.items;
  const drops: ItemId[] = [];
  for (const state of battle.foes) {
    const drop = FOES[state.foe].drop;
    if (!drop) continue;
    const result = roll(seed);
    seed = result.seed;
    if (result.value < drop.chance) {
      drops.push(drop.item);
      items = addItem(items, drop.item);
    }
  }

  const stickers = battleStickers(battle);
  const banked: Run = { ...run, hp, mp, items, seed, stickers: run.stickers + stickers };
  const xp = battleXp(battle);
  const { run: levelled, levels, learned } = gainXp(banked, xp);
  return { run: levelled, summary: { xp, stickers, drops, levels, learned, level: levelled.level } };
}

export function questReducer(state: QuestState, action: QuestAction): QuestState {
  const { view, run } = state;

  switch (action.type) {
    case 'newGame': {
      // The party starts standing on the opening trigger, so mark it spent: it plays right here
      const opening = MAPS.home.triggers[0];
      const base = freshRun(action.seed, run.cleared);
      const fresh: Run = { ...base, flags: [`trigger:${opening.id}`] };
      return play({ ...idle(state), run: fresh, view: { screen: 'world' } }, EVENTS[opening.event], fresh);
    }

    case 'continue':
      return { ...idle(state), view: { screen: 'world' } };

    case 'backToTitle':
      return { ...idle(state), view: { screen: 'title' } };

    case 'step': {
      if (view.screen !== 'world' || state.scene || state.card) return state;
      const walked: Run = { ...run, pos: action.tile, facing: action.facing, steps: run.steps + 1 };
      const event = tileEvent(walked);
      if (event) return event.steps.length === 0 ? { ...state, run: event.run } : play(state, event.steps, event.run);

      const met = encounter(walked);
      if (!met) return { ...state, run: walked };
      if (met.foes.length === 0) return { ...state, run: met.run };
      return { ...state, run: met.run, view: { screen: 'battle', battle: startBattle(met.run, met.foes, met.run.seed, false) } };
    }

    case 'interact': {
      if (view.screen !== 'world' || state.scene || state.card) return state;
      const map = MAPS[run.map];

      const chest = map.chests.find((entry) => entry.id === action.id);
      if (chest) {
        if (chestOpened(run.flags, chest.id)) return state;
        const count = chest.count ?? 1;
        const opened: Run = {
          ...run,
          flags: [...run.flags, `chest:${chest.id}`],
          items: addItem(run.items, chest.item, count),
        };
        const suffix = count > 1 ? ` ×${count}` : '';
        return play(state, [{ who: null, text: `打開玩具箱，拿到 ${ITEMS[chest.item].name}${suffix}！` }], opened);
      }

      const npc = map.npcs.find((entry) => entry.id === action.id);
      if (!npc || !meets(run.flags, npc)) return state;
      const rule = npc.talk.find((entry) => meets(run.flags, entry));
      if (!rule) return state;
      return play(state, EVENTS[rule.event]);
    }

    case 'advance': {
      if (state.card) return state.line || state.scene ? resume({ ...state, card: null }) : { ...state, card: null };
      if (!state.line) return state;
      return resume(state);
    }

    case 'innAnswer': {
      if (state.inn === null) return state;
      const price = state.inn;
      if (!action.yes) return resume({ ...state, inn: null });
      if (run.stickers < price) {
        return { ...state, inn: null, line: { who: null, text: `貼紙不夠，還差 ${price - run.stickers} 張。` } };
      }
      const rested = healParty({ ...run, stickers: run.stickers - price });
      return { ...state, inn: null, run: rested, line: { who: null, text: '呼……睡了一覺，體力和真氣都滿了。' } };
    }

    case 'battle': {
      if (view.screen !== 'battle') return state;
      return { ...state, view: { screen: 'battle', battle: battleStep(view.battle, action.action) } };
    }

    case 'battleEnd': {
      if (view.screen !== 'battle') return state;
      const { battle } = view;
      if (battle.phase.kind === 'lost') return { ...state, view: { screen: 'defeat' } };
      if (battle.phase.kind === 'fled') {
        const fled = { ...run, seed: battle.seed, steps: 0, items: battle.items };
        const hp = { ...run.hp };
        const mp = { ...run.mp };
        for (const hero of HERO_ORDER) {
          hp[hero] = battle.heroes[hero].hp;
          mp[hero] = battle.heroes[hero].mp;
        }
        return { ...state, run: { ...fled, hp, mp }, view: { screen: 'world' } };
      }
      if (battle.phase.kind !== 'won') return state;
      const { run: won, summary } = applyVictory(run, battle);
      return { ...state, run: won, view: { screen: 'victory', summary } };
    }

    case 'victoryContinue': {
      if (view.screen !== 'victory') return state;
      // A scripted fight continues its script; a random one drops straight back onto the map
      return state.scene ? resume({ ...state, view: { screen: 'world' } }) : { ...state, view: { screen: 'world' } };
    }

    case 'retry': {
      const map = MAPS[run.map];
      const hp = { ...run.hp };
      const mp = { ...run.mp };
      for (const hero of HERO_ORDER) {
        hp[hero] = Math.max(1, Math.round(heroStats(hero, run.level, run.equip[hero]).hp * REVIVE_RATIO));
        mp[hero] = Math.max(mp[hero], Math.round(heroStats(hero, run.level, run.equip[hero]).mp * REVIVE_RATIO));
      }
      return {
        ...idle(state),
        run: { ...run, hp, mp, pos: map.entry, steps: 0 },
        view: { screen: 'world' },
      };
    }

    case 'buy': {
      if (view.screen !== 'shop' || !view.stock.includes(action.item)) return state;
      const price = ITEMS[action.item].price;
      if (run.stickers < price) return state;
      return { ...state, run: { ...run, stickers: run.stickers - price, items: addItem(run.items, action.item) } };
    }

    case 'closeShop':
      if (view.screen !== 'shop') return state;
      return resume({ ...state, view: { screen: 'world' } });

    case 'useItem': {
      const item = ITEMS[action.item];
      if ((run.items[action.item] ?? 0) === 0 || !run.party.includes(action.hero)) return state;
      const stats = heroStats(action.hero, run.level, run.equip[action.hero]);
      const down = run.hp[action.hero] === 0;
      if (item.use.kind === 'equip') return state;
      if (item.use.kind === 'revive' ? !down : down) return state;

      const hp = { ...run.hp };
      const mp = { ...run.mp };
      switch (item.use.kind) {
        case 'hp':
          hp[action.hero] = Math.min(stats.hp, hp[action.hero] + item.use.amount);
          break;
        case 'hpAll':
          for (const hero of run.party) if (hp[hero] > 0) hp[hero] = Math.min(heroStats(hero, run.level, run.equip[hero]).hp, hp[hero] + item.use.amount);
          break;
        case 'mp':
          mp[action.hero] = Math.min(stats.mp, mp[action.hero] + item.use.amount);
          break;
        case 'full':
          hp[action.hero] = stats.hp;
          mp[action.hero] = stats.mp;
          break;
        case 'revive':
          hp[action.hero] = Math.round(stats.hp * item.use.ratio);
          break;
      }
      return { ...state, run: { ...run, hp, mp, items: removeItem(run.items, action.item) } };
    }

    case 'equip': {
      if (!run.party.includes(action.hero)) return state;
      const worn = run.equip[action.hero];
      if (action.item !== null && (!isEquip(action.item) || (run.items[action.item] ?? 0) === 0)) return state;

      let items = run.items;
      if (action.item !== null) items = removeItem(items, action.item);
      if (worn) items = addItem(items, worn);

      const equip = { ...run.equip, [action.hero]: action.item };
      // Growing or shrinking the HP bonus must never leave a hero above their new maximum
      const hp = { ...run.hp };
      const mp = { ...run.mp };
      const stats = heroStats(action.hero, run.level, action.item);
      hp[action.hero] = Math.min(hp[action.hero], stats.hp);
      mp[action.hero] = Math.min(mp[action.hero], stats.mp);
      return { ...state, run: { ...run, equip, items, hp, mp } };
    }

    case 'toggleSound':
      return { ...state, sound: !state.sound };

    case 'endingContinue':
      return { ...idle(state), run: { ...run, cleared: true }, view: { screen: 'title' } };
  }
}
