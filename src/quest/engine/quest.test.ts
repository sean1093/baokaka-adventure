import { describe, expect, test } from 'vitest';
import { EVENTS } from './events';
import { ITEMS, heroStats } from './heroes';
import { MAPS } from './maps';
import { findPath } from './path';
import { freshRun, initialState, questReducer, runStarted, type QuestState } from './quest';
import type { HeroId, Tile } from './types';

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
    expect(first.run.items.cookie).toBe(4);
    expect(first.run.stickers).toBe(20);

    const second = readAll(questReducer(first, { type: 'interact', id: 'grandma' }));
    expect(second.run.items.cookie).toBe(4);
    expect(second.run.stickers).toBe(20);
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
    expect(first.run.items.clothBook).toBe(1);
    expect(first.run.flags).toContain('chest:home-book');

    const second = questReducer(first, { type: 'interact', id: 'home-book' });
    expect(second.run.items.clothBook).toBe(1);
  });
});

describe('the shop', () => {
  const shopping = (): QuestState => {
    const state = readAll(questReducer(start(), { type: 'newGame', seed: 4 }));
    const rich = { ...state, run: { ...state.run, stickers: 100, map: 'park' as const, pos: MAPS.park.entry } };
    return questReducer(rich, { type: 'interact', id: 'uncle' });
  };

  test('opens with stock and charges stickers', () => {
    let state = readAll(shopping());
    expect(state.view.screen).toBe('shop');
    const before = state.run.stickers;
    state = questReducer(state, { type: 'buy', item: 'cookie' });
    expect(state.run.stickers).toBe(before - ITEMS.cookie.price);
    expect(state.run.items.cookie).toBe(3);
  });

  test('refuses when the stickers run out', () => {
    let state = readAll(shopping());
    state = { ...state, run: { ...state.run, stickers: 1 } };
    expect(questReducer(state, { type: 'buy', item: 'bottle' })).toBe(state);
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
      run: { ...state.run, stickers: 30, hp: { ...state.run.hp, baokaka: 3 }, map: 'market' as const, pos: MAPS.market.entry },
    };
    const asked = readAll(questReducer(hurt, { type: 'interact', id: 'uncle' }));
    expect(asked.inn).toBe(10);
    return questReducer(asked, { type: 'innAnswer', yes });
  };

  test('yes charges and heals', () => {
    const rested = resting(true);
    expect(rested.run.stickers).toBe(20);
    expect(rested.run.hp.baokaka).toBe(heroStats('baokaka', 1).hp);
  });

  test('no changes nothing', () => {
    const declined = resting(false);
    expect(declined.run.stickers).toBe(30);
    expect(declined.run.hp.baokaka).toBe(3);
  });
});

describe('items and equipment', () => {
  const ready = (): QuestState => {
    const state = readAll(questReducer(start(), { type: 'newGame', seed: 4 }));
    return { ...state, run: { ...state.run, items: { cookie: 1, shell: 1, sunHat: 1 }, hp: { ...state.run.hp, baokaka: 2 } } };
  };

  test('a cookie heals and is spent', () => {
    const used = questReducer(ready(), { type: 'useItem', item: 'cookie', hero: 'baokaka' });
    expect(used.run.hp.baokaka).toBe(27);
    expect(used.run.items.cookie).toBeUndefined();
  });

  test('a revive only works on someone who is down', () => {
    const state = ready();
    expect(questReducer(state, { type: 'useItem', item: 'shell', hero: 'baokaka' })).toBe(state);

    const down = { ...state, run: { ...state.run, hp: { ...state.run.hp, baokaka: 0 } } };
    const back = questReducer(down, { type: 'useItem', item: 'shell', hero: 'baokaka' });
    expect(back.run.hp.baokaka).toBeGreaterThan(0);
  });

  test('equipping moves the item out of the bag and raises the stat', () => {
    const worn = questReducer(ready(), { type: 'equip', item: 'sunHat', hero: 'baokaka' });
    expect(worn.run.equip.baokaka).toBe('sunHat');
    expect(worn.run.items.sunHat).toBeUndefined();
    expect(heroStats('baokaka', worn.run.level, 'sunHat').def).toBe(heroStats('baokaka', worn.run.level).def + 4);

    const off = questReducer(worn, { type: 'equip', item: null, hero: 'baokaka' });
    expect(off.run.equip.baokaka).toBeNull();
    expect(off.run.items.sunHat).toBe(1);
  });

  test('unequipping an HP bonus never leaves a hero above their maximum', () => {
    let state = ready();
    state = { ...state, run: { ...state.run, items: { blanket: 1 } } };
    state = questReducer(state, { type: 'equip', item: 'blanket', hero: 'baokaka' });
    state = { ...state, run: { ...state.run, hp: { ...state.run.hp, baokaka: heroStats('baokaka', state.run.level, 'blanket').hp } } };
    state = questReducer(state, { type: 'equip', item: null, hero: 'baokaka' });
    expect(state.run.hp.baokaka).toBe(heroStats('baokaka', state.run.level).hp);
  });

  test('a consumable cannot be worn', () => {
    const state = ready();
    expect(questReducer(state, { type: 'equip', item: 'cookie', hero: 'baokaka' })).toBe(state);
  });
});

describe('losing', () => {
  test('the party wakes at the entrance with some HP and keeps everything', () => {
    let state = readAll(questReducer(start(), { type: 'newGame', seed: 4 }));
    const party: HeroId[] = ['baokaka'];
    state = {
      ...state,
      view: { screen: 'defeat' },
      run: { ...state.run, party, hp: { ...state.run.hp, baokaka: 0 }, items: { cookie: 3 }, stickers: 15, pos: { c: 10, r: 8 } },
    };
    const back = questReducer(state, { type: 'retry' });
    expect(back.view).toEqual({ screen: 'world' });
    expect(back.run.pos).toEqual(MAPS.home.entry);
    expect(back.run.hp.baokaka).toBeGreaterThan(0);
    expect(back.run.items.cookie).toBe(3);
    expect(back.run.stickers).toBe(15);
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
