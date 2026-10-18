import { describe, expect, test } from 'vitest';
import { startBattle } from './battle';
import { EVENTS } from './events';
import { FOES } from './foes';
import { ITEMS, heroStats, spellsFor } from './heroes';
import { MAPS } from './maps';
import { findPath } from './path';
import { applyVictory, freshRun, initialState, questReducer, runStarted, type QuestState } from './quest';
import { runScene } from './scene';
import type { FoeId, HeroId, Run, Tile } from './types';

const start = (): QuestState => initialState(freshRun(99), true);

/** Taps through dialogue until the script stops asking. */
function readAll(state: QuestState, limit = 60): QuestState {
  let current = state;
  for (let step = 0; step < limit; step += 1) {
    if (!current.line && !current.card) return current;
    current = questReducer(current, { type: 'advance' });
  }
  throw new Error('dialogue never ended');
}

/** Walks the party tile by tile, feeding the reducer one `step` per tile like the UI does. */
function walk(state: QuestState, to: Tile): QuestState {
  const path = findPath(MAPS[state.run.map], state.run.flags, state.run.pos, to);
  if (!path) throw new Error(`no path to ${to.c},${to.r}`);
  let current = state;
  for (const tile of path) {
    const facing = tile.c > current.run.pos.c || tile.r < current.run.pos.r ? 'right' : 'left';
    current = questReducer(current, { type: 'step', tile, facing });
    if (current.line || current.card || current.view.screen !== 'world') return current;
  }
  return current;
}

describe('starting a game', () => {
  test('a fresh run has not started', () => {
    expect(runStarted(freshRun(1))).toBe(false);
  });

  test('新遊戲 opens on the chapter card, then the prologue', () => {
    const state = questReducer(start(), { type: 'newGame', seed: 4 });
    expect(state.view).toEqual({ screen: 'world' });
    expect(state.card).toEqual({ n: 1, title: '娃娃不見了' });

    const first = questReducer(state, { type: 'advance' });
    expect(first.card).toBeNull();
    expect(first.line?.text).toContain('天亮了');

    const done = readAll(first);
    expect(done.scene).toBeNull();
    expect(done.run.chapter).toBe(1);
    expect(runStarted(done.run)).toBe(true);
  });
});

describe('walking the map', () => {
  const opened = () => readAll(questReducer(start(), { type: 'newGame', seed: 4 }));

  test('a step moves the party and counts toward an encounter', () => {
    const state = opened();
    const moved = questReducer(state, { type: 'step', tile: { c: 7, r: 5 }, facing: 'right' });
    expect(moved.run.pos).toEqual({ c: 7, r: 5 });
    expect(moved.run.steps).toBe(state.run.steps + 1);
  });

  test('a locked door plays its blocked line and does not move the party', () => {
    const state = walk(opened(), { c: 0, r: 6 });
    expect(state.line?.text).toContain('推不開');
    expect(state.run.map).toBe('home');
  });

  test('walking onto an exit changes map and fires that map intro once', () => {
    const cleared = opened();
    // 灰塵球 stands in the doorway until it is beaten, so the fight is the gate
    let state = { ...cleared, run: { ...cleared.run, flags: [...cleared.run.flags, 'dustDone'] } };
    state = walk(state, { c: 6, r: 10 });
    expect(state.run.map).toBe('yard');
    expect(state.run.pos).toEqual({ c: 8, r: 1 });
    expect(state.card).toEqual({ n: 2, title: '院子大冒險' });

    state = readAll(state);
    // Standing on the same tile again must not replay the intro
    const again = questReducer(state, { type: 'step', tile: { c: 8, r: 1 }, facing: 'right' });
    expect(again.card).toBeNull();
    expect(again.line).toBeNull();
  });

  test('the doorway is closed while 灰塵球 stands in it', () => {
    const state = opened();
    expect(findPath(MAPS.home, state.run.flags, state.run.pos, { c: 6, r: 10 })).toBeNull();
    expect(findPath(MAPS.home, [...state.run.flags, 'dustDone'], state.run.pos, { c: 6, r: 10 })).not.toBeNull();
  });

  test('no stepping while a line is up', () => {
    const state = walk(opened(), { c: 0, r: 6 });
    expect(questReducer(state, { type: 'step', tile: { c: 5, r: 6 }, facing: 'left' })).toBe(state);
  });
});

describe('talking', () => {
  const opened = () => readAll(questReducer(start(), { type: 'newGame', seed: 4 }));

  test('摩卡貓 joins the party and sets its flag', () => {
    const after = readAll(questReducer(opened(), { type: 'interact', id: 'mochaNpc' }));
    expect(after.run.party).toEqual(['baokaka', 'mocha']);
    expect(after.run.flags).toContain('mochaJoined');
    expect(after.run.hp.mocha).toBe(heroStats('mocha', after.run.level).hp);
  });

  test('a joined hero cannot join twice', () => {
    let state = readAll(questReducer(opened(), { type: 'interact', id: 'mochaNpc' }));
    state = readAll(questReducer(state, { type: 'interact', id: 'mochaNpc' }));
    expect(state.run.party).toEqual(['baokaka', 'mocha']);
  });

  test('rules pick the first match, so 媽媽 changes what she says', () => {
    const before = readAll(questReducer(opened(), { type: 'interact', id: 'mom' }));
    expect(before.run.hp.baokaka).toBe(heroStats('baokaka', 1).hp);

    let joined = readAll(questReducer(opened(), { type: 'interact', id: 'mochaNpc' }));
    joined = { ...joined, run: { ...joined.run, hp: { ...joined.run.hp, baokaka: 5 } } };
    const hugged = readAll(questReducer(joined, { type: 'interact', id: 'mom' }));
    expect(hugged.run.hp.baokaka).toBe(heroStats('baokaka', 1).hp);
  });

  test('阿嬤 hands over her parcel exactly once', () => {
    const first = readAll(questReducer(opened(), { type: 'interact', id: 'grandma' }));
    expect(first.run.items.teaEgg).toBe(4);
    expect(first.run.coins).toBe(20);

    const second = readAll(questReducer(first, { type: 'interact', id: 'grandma' }));
    expect(second.run.items.teaEgg).toBe(4);
    expect(second.run.coins).toBe(20);
  });

  test('a scripted battle interrupts the script and resumes after the win', () => {
    let state = readAll(questReducer(opened(), { type: 'interact', id: 'dust' }));
    expect(state.view.screen).toBe('battle');
    expect(state.scene).not.toBeNull();

    if (state.view.screen !== 'battle') throw new Error('no battle');
    const won = { ...state, view: { screen: 'battle' as const, battle: { ...state.view.battle, phase: { kind: 'won' as const } } } };
    state = questReducer(won, { type: 'battleEnd' });
    expect(state.view.screen).toBe('victory');

    state = readAll(questReducer(state, { type: 'victoryContinue' }));
    expect(state.run.flags).toContain('dustDone');
    expect(state.view).toEqual({ screen: 'world' });
  });
});

describe('chests', () => {
  const opened = () => readAll(questReducer(start(), { type: 'newGame', seed: 4 }));

  test('open once and remember it', () => {
    const first = readAll(questReducer(opened(), { type: 'interact', id: 'home-book' }));
    expect(first.run.items.gradCap).toBe(1);
    expect(first.run.flags).toContain('chest:home-book');

    const second = questReducer(first, { type: 'interact', id: 'home-book' });
    expect(second.run.items.gradCap).toBe(1);
  });
});

describe('the shop', () => {
  const shopping = (): QuestState => {
    const state = readAll(questReducer(start(), { type: 'newGame', seed: 4 }));
    const rich = { ...state, run: { ...state.run, coins: 100, map: 'park' as const, pos: MAPS.park.entry } };
    return questReducer(rich, { type: 'interact', id: 'uncle' });
  };

  test('opens with stock and charges coins', () => {
    let state = readAll(shopping());
    expect(state.view.screen).toBe('shop');
    const before = state.run.coins;
    state = questReducer(state, { type: 'buy', item: 'teaEgg' });
    expect(state.run.coins).toBe(before - ITEMS.teaEgg.price);
    expect(state.run.items.teaEgg).toBe(3);
  });

  test('refuses when the coins run out', () => {
    let state = readAll(shopping());
    state = { ...state, run: { ...state.run, coins: 1 } };
    expect(questReducer(state, { type: 'buy', item: 'pineappleCake' })).toBe(state);
  });

  test('a gift item is never sold, even if a stock lists it', () => {
    const state = readAll(shopping());
    const rigged = { ...state, view: { screen: 'shop' as const, stock: ['amulet' as const] } };
    expect(questReducer(rigged, { type: 'buy', item: 'amulet' })).toBe(rigged);
  });

  test('closing returns to the map', () => {
    const closed = readAll(questReducer(readAll(shopping()), { type: 'closeShop' }));
    expect(closed.view).toEqual({ screen: 'world' });
  });
});

describe('the inn', () => {
  const resting = (yes: boolean): QuestState => {
    const state = readAll(questReducer(start(), { type: 'newGame', seed: 4 }));
    const hurt = {
      ...state,
      run: { ...state.run, coins: 30, hp: { ...state.run.hp, baokaka: 3 }, map: 'market' as const, pos: MAPS.market.entry },
    };
    const asked = readAll(questReducer(hurt, { type: 'interact', id: 'uncle' }));
    expect(asked.inn).toBe(10);
    return questReducer(asked, { type: 'innAnswer', yes });
  };

  test('yes charges and heals', () => {
    const rested = resting(true);
    expect(rested.run.coins).toBe(20);
    expect(rested.run.hp.baokaka).toBe(heroStats('baokaka', 1).hp);
  });

  test('yes says so in the new words', () => {
    expect(resting(true).line?.text).toBe('呼……睡了一覺，體力和元氣都滿了。');
  });

  test('yes without enough coins says how many are missing', () => {
    const state = readAll(questReducer(start(), { type: 'newGame', seed: 4 }));
    const poor = { ...state, run: { ...state.run, coins: 3, map: 'market' as const, pos: MAPS.market.entry } };
    const asked = readAll(questReducer(poor, { type: 'interact', id: 'uncle' }));
    const refused = questReducer(asked, { type: 'innAnswer', yes: true });
    expect(refused.run.coins).toBe(3);
    expect(refused.line?.text).toBe('銅板不夠，還差 7 個。');
  });

  test('no changes nothing', () => {
    const declined = resting(false);
    expect(declined.run.coins).toBe(30);
    expect(declined.run.hp.baokaka).toBe(3);
  });
});

describe('items and equipment', () => {
  const ready = (): QuestState => {
    const state = readAll(questReducer(start(), { type: 'newGame', seed: 4 }));
    return { ...state, run: { ...state.run, items: { teaEgg: 1, redTurtleCake: 1, bib: 1 }, hp: { ...state.run.hp, baokaka: 2 } } };
  };

  test('a tea egg heals and is spent', () => {
    const used = questReducer(ready(), { type: 'useItem', item: 'teaEgg', hero: 'baokaka' });
    expect(used.run.hp.baokaka).toBe(32);
    expect(used.run.items.teaEgg).toBeUndefined();
  });

  test('a revive only works on someone who is down', () => {
    const state = ready();
    expect(questReducer(state, { type: 'useItem', item: 'redTurtleCake', hero: 'baokaka' })).toBe(state);

    const down = { ...state, run: { ...state.run, hp: { ...state.run.hp, baokaka: 0 } } };
    const back = questReducer(down, { type: 'useItem', item: 'redTurtleCake', hero: 'baokaka' });
    expect(back.run.hp.baokaka).toBeGreaterThan(0);
  });

  test('equipping moves the item out of the bag and raises the stat', () => {
    const worn = questReducer(ready(), { type: 'equip', item: 'bib', hero: 'baokaka' });
    expect(worn.run.equip.baokaka).toBe('bib');
    expect(worn.run.items.bib).toBeUndefined();
    expect(heroStats('baokaka', worn.run.level, 'bib').def).toBe(heroStats('baokaka', worn.run.level).def + 3);

    const off = questReducer(worn, { type: 'equip', item: null, hero: 'baokaka' });
    expect(off.run.equip.baokaka).toBeNull();
    expect(off.run.items.bib).toBe(1);
  });

  test('unequipping an HP bonus never leaves a hero above their maximum', () => {
    let state = ready();
    state = { ...state, run: { ...state.run, items: { flowerVest: 1 } } };
    state = questReducer(state, { type: 'equip', item: 'flowerVest', hero: 'baokaka' });
    state = { ...state, run: { ...state.run, hp: { ...state.run.hp, baokaka: heroStats('baokaka', state.run.level, 'flowerVest').hp } } };
    state = questReducer(state, { type: 'equip', item: null, hero: 'baokaka' });
    expect(state.run.hp.baokaka).toBe(heroStats('baokaka', state.run.level).hp);
  });

  test('a consumable cannot be worn', () => {
    const state = ready();
    expect(questReducer(state, { type: 'equip', item: 'teaEgg', hero: 'baokaka' })).toBe(state);
  });

  /** All four heroes in the party at level 10, every one hurt and low on 元氣. */
  const party = (items: Run['items']): QuestState => {
    const state = ready();
    const all: HeroId[] = ['baokaka', 'mocha', 'magpie', 'bear'];
    const hp = { baokaka: 5, mocha: 5, magpie: 5, bear: 0 };
    const mp = { baokaka: 1, mocha: 1, magpie: 1, bear: 1 };
    return { ...state, run: { ...state.run, party: all, level: 10, hp, mp, items } };
  };
  const max = (hero: HeroId) => heroStats(hero, 10);

  test('every kind of item use, with the new catalogue', () => {
    // hp: 鳳梨酥 +70, capped at the maximum
    let state = questReducer(party({ pineappleCake: 1 }), { type: 'useItem', item: 'pineappleCake', hero: 'baokaka' });
    expect(state.run.hp.baokaka).toBe(75);
    // hpAll: 滷肉飯 +50 to everyone standing; the hero who is down stays down
    state = questReducer(party({ braisedRice: 1 }), { type: 'useItem', item: 'braisedRice', hero: 'mocha' });
    expect([state.run.hp.baokaka, state.run.hp.mocha, state.run.hp.magpie, state.run.hp.bear]).toEqual([55, 55, 55, 0]);
    // hpAll 999: 神秘排隊美食 fills the standing party
    state = questReducer(party({ mysteryFood: 1 }), { type: 'useItem', item: 'mysteryFood', hero: 'mocha' });
    expect(state.run.hp.magpie).toBe(max('magpie').hp);
    expect(state.run.items.mysteryFood).toBeUndefined();
    // mp: 豆花 +20; 黑糖珍奶 999 fills MP to the maximum and no further
    state = questReducer(party({ douhua: 1 }), { type: 'useItem', item: 'douhua', hero: 'magpie' });
    expect(state.run.mp.magpie).toBe(21);
    state = questReducer(party({ brownSugarMilk: 1 }), { type: 'useItem', item: 'brownSugarMilk', hero: 'magpie' });
    expect(state.run.mp.magpie).toBe(max('magpie').mp);
    // full: 鐵路便當, one hero
    state = questReducer(party({ railBento: 1 }), { type: 'useItem', item: 'railBento', hero: 'mocha' });
    expect([state.run.hp.mocha, state.run.mp.mocha]).toEqual([max('mocha').hp, max('mocha').mp]);
    expect(state.run.hp.baokaka).toBe(5);
    // revive: 紅龜粿 wakes the hero at half HP
    state = questReducer(party({ redTurtleCake: 1 }), { type: 'useItem', item: 'redTurtleCake', hero: 'bear' });
    expect(state.run.hp.bear).toBe(Math.round(max('bear').hp * 0.5));
  });

  test('signature gear: only its owner can wear it', () => {
    const owners: [Run['equip'][HeroId] & string, HeroId][] = [
      ['bellCollar', 'mocha'],
      ['profGlasses', 'magpie'],
      ['courageScarf', 'bear'],
      ['tigerHat', 'baokaka'],
    ];
    for (const [item, owner] of owners) {
      const state = party({ [item]: 1 });
      for (const hero of state.run.party) {
        if (hero === owner) continue;
        expect(questReducer(state, { type: 'equip', item, hero }), `${item} on ${hero}`).toBe(state);
      }
      const worn = questReducer(state, { type: 'equip', item, hero: owner });
      expect(worn.run.equip[owner]).toBe(item);
      expect(worn.run.items[item]).toBeUndefined();
    }
    // Ordinary gear still fits anyone
    const pin = questReducer(party({ pinwheel: 1 }), { type: 'equip', item: 'pinwheel', hero: 'bear' });
    expect(pin.run.equip.bear).toBe('pinwheel');
  });
});

describe('losing', () => {
  test('the party wakes at the entrance with some HP and keeps everything', () => {
    let state = readAll(questReducer(start(), { type: 'newGame', seed: 4 }));
    const party: HeroId[] = ['baokaka'];
    state = {
      ...state,
      view: { screen: 'defeat' },
      run: { ...state.run, party, hp: { ...state.run.hp, baokaka: 0 }, items: { teaEgg: 3 }, coins: 15, pos: { c: 10, r: 8 } },
    };
    const back = questReducer(state, { type: 'retry' });
    expect(back.view).toEqual({ screen: 'world' });
    expect(back.run.pos).toEqual(MAPS.home.entry);
    expect(back.run.hp.baokaka).toBeGreaterThan(0);
    expect(back.run.items.teaEgg).toBe(3);
    expect(back.run.coins).toBe(15);
  });
});

describe('the ending', () => {
  test('marks the run cleared and returns to the title', () => {
    let state = readAll(questReducer(start(), { type: 'newGame', seed: 4 }));
    state = questReducer({ ...state, scene: { steps: EVENTS['night.boss'], at: 0 } }, { type: 'endingContinue' });
    expect(state.run.cleared).toBe(true);
    expect(state.view).toEqual({ screen: 'title' });
    expect(state.scene).toBeNull();
  });
});

describe('sound', () => {
  test('toggles and nothing else changes', () => {
    const state = start();
    const muted = questReducer(state, { type: 'toggleSound' });
    expect(muted.sound).toBe(false);
    expect(muted.run).toBe(state.run);
  });
});

describe('applyVictory', () => {
  const win = (foes: FoeId[], boss: boolean) => {
    const run = freshRun(7);
    const battle = startBattle(run, foes, run.seed, boss);
    return applyVictory(run, { ...battle, phase: { kind: 'won' } });
  };

  test('banks the coins the foes carried', () => {
    const { run, summary } = win(['dustBunny', 'sockMonster'], false);
    expect(summary.coins).toBe(FOES.dustBunny.coins + FOES.sockMonster.coins);
    expect(run.coins).toBe(summary.coins);
    expect(summary.boss).toBeNull();
  });

  test('names the boss for 「〈boss名〉不暈了！」', () => {
    const boss = (Object.keys(FOES) as FoeId[]).find((foe) => FOES[foe].boss);
    if (!boss) throw new Error('no boss in the content');
    expect(win([boss], true).summary.boss).toBe(boss);
  });
});

describe('joining', () => {
  const joinAt = (run: Run, hero: HeroId): Run => runScene(run, { steps: [{ do: 'join', hero }], at: 0 }).run;

  test('heroes line up in the order they join, ending in HERO_ORDER for the story', () => {
    let run = freshRun(1);
    run = joinAt(run, 'mocha');
    run = joinAt(run, 'magpie');
    run = joinAt(run, 'bear');
    expect(run.party).toEqual(['baokaka', 'mocha', 'magpie', 'bear']);
  });

  test('the old story joins 阿藍 then 黑糖, so every hero is playable', () => {
    const joins = Object.values(EVENTS).flatMap((steps) => steps.flatMap((step) => ('do' in step && step.do === 'join' ? [step.hero] : [])));
    expect(joins).toEqual(['mocha', 'magpie', 'bear']);
  });

  test('黑糖 joining at Lv10 knows his first three skills, at full HP and 元氣', () => {
    const run = joinAt({ ...freshRun(1), party: ['baokaka', 'mocha', 'magpie'], level: 10 }, 'bear');
    expect(spellsFor('bear', run.level).map((spell) => spell.id)).toEqual(['pawPat', 'groundPound', 'sugarHug']);
    expect(run.hp.bear).toBe(heroStats('bear', 10).hp);
    expect(run.mp.bear).toBe(heroStats('bear', 10).mp);
  });

  test('阿藍 joining at Lv3 knows 羽毛雨 only', () => {
    const run = joinAt({ ...freshRun(1), party: ['baokaka', 'mocha'], level: 3 }, 'magpie');
    expect(run.party).toContain('magpie');
    expect(spellsFor('magpie', run.level).map((spell) => spell.id)).toEqual(['featherRain']);
  });
});

describe('progress: the 圖鑑 and derived flags in the reducer', () => {
  const STAMPS = ['daan', 'ntu', 'station', 'ximen', 'longshan', 'dadaocheng', 'shilin', 'airport', 'maokong', 'bitan', 'beitou', 'yangming', 'tamsui', 'tower'].map(
    (map) => `stamp_${map}`,
  );

  /** A fight on the home map, with the run carrying `run` overrides, ended in `phase`. */
  const fought = (foes: FoeId[], phase: 'won' | 'lost' | 'fled', run: Partial<Run> = {}): QuestState => {
    const base = readAll(questReducer(start(), { type: 'newGame', seed: 4 }));
    const withRun = { ...base, run: { ...base.run, ...run } };
    const battle = startBattle(withRun.run, foes, withRun.run.seed, false);
    return questReducer({ ...withRun, view: { screen: 'battle', battle: { ...battle, phase: { kind: phase } } } }, { type: 'battleEnd' });
  };

  test('a victory records every foe of the fight once, in order, and keeps earlier ones', () => {
    const state = fought(['sockMonster', 'dustBunny', 'sockMonster'], 'won', { seenFoes: ['dustBunny'] });
    expect(state.view.screen).toBe('victory');
    expect(state.run.seenFoes).toEqual(['dustBunny', 'sockMonster']);
  });

  test('fleeing or losing records nothing', () => {
    expect(fought(['sockMonster'], 'fled').run.seenFoes).toEqual([]);
    expect(fought(['sockMonster'], 'lost').run.seenFoes).toEqual([]);
  });

  test('beating the last missing foe sets bestiaryAll', () => {
    const all = Object.keys(FOES) as FoeId[];
    const almost = all.filter((foe) => foe !== 'snoreKing');
    expect(fought(['dustBunny'], 'won', { seenFoes: almost }).run.flags).not.toContain('bestiaryAll');
    expect(fought(['snoreKing'], 'won', { seenFoes: almost }).run.flags).toContain('bestiaryAll');
  });

  test('a victory settles derived flags', () => {
    expect(fought(['dustBunny'], 'won', { flags: STAMPS }).run.flags).toContain('allStamps');
  });

  test('opening a chest settles derived flags', () => {
    const base = readAll(questReducer(start(), { type: 'newGame', seed: 4 }));
    const state = readAll(questReducer({ ...base, run: { ...base.run, flags: [...base.run.flags, ...STAMPS] } }, { type: 'interact', id: 'home-book' }));
    expect(state.run.flags).toContain('chest:home-book');
    expect(state.run.flags).toContain('allStamps');
  });

  test('a flag step settles derived flags, and the clerk points count up', () => {
    const clerks = ['daan', 'ntu', 'station', 'ximen'].map((map) => ({ do: 'flag' as const, flag: `clerk_${map}` }));
    const four = runScene(freshRun(1), { steps: clerks, at: 0 }).run;
    expect(four.flags).toContain('clerkAny');
    expect(four.flags).not.toContain('clerk5');
    const five = runScene(four, { steps: [{ do: 'flag', flag: 'clerk_longshan' }], at: 0 }).run;
    expect(five.flags).toContain('clerk5');
    expect(five.flags).not.toContain('clerk10');
  });
});
