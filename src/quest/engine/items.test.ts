import { describe, expect, test } from 'vitest';
import { SPRITES } from '../../art/sprites';
import { ITEMS, ITEM_ORDER, MAX_ITEM_COUNT, STARTING_ITEMS, canWear } from './heroes';
import { freshRun } from './quest';
import { validateItems, validateSteps } from './validate';
import { HERO_ORDER, type HeroId, type ItemId, type ItemUse } from './types';

/**
 * Story bible § 6.1 *Consumables* and § 6.2 *Equipment*, one row per item in table order:
 * id, name, effect, price (0 = "—", a gift or quest reward), and the one hero who may wear it.
 */
const EXPECTED: [ItemId, string, ItemUse, number, HeroId?][] = [
  ['teaEgg', '茶葉蛋', { kind: 'hp', amount: 30 }, 8],
  ['pineappleCake', '鳳梨酥', { kind: 'hp', amount: 70 }, 20],
  ['chickenCutlet', '雞排', { kind: 'hp', amount: 160 }, 45],
  ['douhua', '豆花', { kind: 'mp', amount: 20 }, 15],
  ['bubbleTea', '珍珠奶茶', { kind: 'mp', amount: 45 }, 35],
  ['brownSugarMilk', '黑糖珍奶', { kind: 'mp', amount: 999 }, 80],
  ['braisedRice', '滷肉飯', { kind: 'hpAll', amount: 50 }, 40],
  ['mangoIce', '芒果冰', { kind: 'hpAll', amount: 130 }, 90],
  ['railBento', '鐵路便當', { kind: 'full' }, 60],
  ['meatBall', '肉圓', { kind: 'hp', amount: 110 }, 35],
  ['grassJellyTea', '仙草茶', { kind: 'mp', amount: 30 }, 25],
  ['mysteryFood', '神秘排隊美食', { kind: 'hpAll', amount: 999 }, 0],
  ['redTurtleCake', '紅龜粿', { kind: 'revive', ratio: 0.5 }, 40],
  ['bib', '口水巾', { kind: 'equip', bonus: { def: 3 } }, 25],
  ['flipFlops', '藍白拖', { kind: 'equip', bonus: { atk: 5 } }, 40],
  ['gradCap', '學士帽', { kind: 'equip', bonus: { mp: 15 } }, 60],
  ['helmet', '安全帽', { kind: 'equip', bonus: { def: 8 } }, 80],
  ['tigerShoes', '虎頭鞋', { kind: 'equip', bonus: { spd: 6 } }, 90],
  ['flowerVest', '花布背心', { kind: 'equip', bonus: { hp: 45 } }, 100],
  ['amulet', '平安符', { kind: 'equip', bonus: { luck: 10 } }, 0],
  ['neckPillow', '旅行頸枕', { kind: 'equip', bonus: { hp: 30, def: 5 } }, 85],
  ['raincoat', '機車雨衣', { kind: 'equip', bonus: { def: 12, hp: 25 } }, 180],
  ['plushCharm', '小熊吊飾', { kind: 'equip', bonus: { luck: 8, def: 4 } }, 0],
  ['travelerHat', '旅行者的帽子', { kind: 'equip', bonus: { spd: 8, def: 6 } }, 0],
  ['deliveryBag', '外送保溫袋', { kind: 'equip', bonus: { hp: 40, def: 6 } }, 0],
  ['luckyCat', '招財貓', { kind: 'equip', bonus: { luck: 20 } }, 0],
  ['moonPassCharm', '月亮線紀念票', { kind: 'equip', bonus: { spd: 6, mp: 20 } }, 0],
  ['bellCollar', '摩卡的鈴鐺項圈', { kind: 'equip', bonus: { spd: 10, luck: 12 } }, 0, 'mocha'],
  ['profGlasses', '藍教授的眼鏡', { kind: 'equip', bonus: { mp: 35, atk: 6 } }, 0, 'magpie'],
  ['courageScarf', '勇氣圍巾', { kind: 'equip', bonus: { hp: 80, def: 10 } }, 0, 'bear'],
  ['tigerHat', '阿嬤的虎頭帽', { kind: 'equip', bonus: { hp: 60, def: 8, luck: 8 } }, 0, 'baokaka'],
  ['pinwheel', '小風車', { kind: 'equip', bonus: { spd: 10, luck: 6 } }, 0],
  ['clerkVest', '店員背心', { kind: 'equip', bonus: { luck: 15, spd: 8 } }, 0],
  ['championBelt', '冠軍腰帶', { kind: 'equip', bonus: { atk: 12, hp: 60 } }, 0],
  ['goldAmulet', '金平安符', { kind: 'equip', bonus: { luck: 25, def: 6 } }, 0],
  ['earthCane', '土地公的拐杖', { kind: 'equip', bonus: { atk: 8, def: 8, spd: 5, luck: 10 } }, 0],
];

describe('the item catalogue (story bible § 6)', () => {
  test('matches the bible tables: names, effects, prices and owners', () => {
    expect(Object.keys(ITEMS)).toEqual(EXPECTED.map(([id]) => id));
    for (const [id, name, use, price, only] of EXPECTED) {
      expect(ITEMS[id], id).toMatchObject({ id, name, use, price });
      expect(ITEMS[id].only, id).toBe(only);
    }
  });

  test('13 consumables, then 23 pieces of equipment, in menu order', () => {
    expect(ITEM_ORDER).toEqual(EXPECTED.map(([id]) => id));
    const kinds = ITEM_ORDER.map((item) => ITEMS[item].use.kind === 'equip');
    expect(kinds.filter((wear) => !wear)).toHaveLength(13);
    expect(kinds.filter(Boolean)).toHaveLength(23);
    expect(kinds.indexOf(true)).toBe(13);
  });

  test('every item has art, a name and a blurb; blurbs fit one dialogue line', () => {
    for (const item of Object.values(ITEMS)) {
      expect(SPRITES[item.sprite], item.id).toBeDefined();
      expect(item.blurb.length, item.id).toBeGreaterThan(0);
      expect(item.blurb.length, item.id).toBeLessThanOrEqual(40);
    }
  });

  test('a new run starts with two tea eggs; the bag still holds nine of a kind', () => {
    expect(STARTING_ITEMS).toEqual({ teaEgg: 2 });
    expect(freshRun(1).items).toEqual({ teaEgg: 2 });
    expect(MAX_ITEM_COUNT).toBe(9);
  });

  test('signature gear fits only its owner; ordinary gear fits anyone; food fits nobody', () => {
    const owners: [ItemId, HeroId][] = [
      ['bellCollar', 'mocha'],
      ['profGlasses', 'magpie'],
      ['courageScarf', 'bear'],
      ['tigerHat', 'baokaka'],
    ];
    for (const [item, owner] of owners) {
      for (const hero of HERO_ORDER) expect(canWear(hero, item), `${hero} ${item}`).toBe(hero === owner);
    }
    for (const hero of HERO_ORDER) {
      expect(canWear(hero, 'pinwheel')).toBe(true);
      expect(canWear(hero, 'teaEgg')).toBe(false);
    }
  });

  test('the item validator passes the catalogue and catches broken entries', () => {
    const ok: string[] = [];
    validateItems(ITEMS, ok);
    expect(ok).toEqual([]);

    const errors: string[] = [];
    validateItems(
      {
        a: { ...ITEMS.teaEgg, id: 'a' as ItemId, price: -1 },
        b: { ...ITEMS.teaEgg, id: 'b' as ItemId, only: 'mocha' },
        c: { ...ITEMS.bib, id: 'c' as ItemId, only: 'dragon' as HeroId },
        d: { ...ITEMS.bib, id: 'd' as ItemId, use: { kind: 'equip', bonus: {} } },
        e: { ...ITEMS.redTurtleCake, id: 'e' as ItemId, use: { kind: 'revive', ratio: 0 } },
      },
      errors,
    );
    expect(errors).toHaveLength(5);
  });

  test('the validator keeps gift items (price 0) out of shop stocks', () => {
    const errors: string[] = [];
    validateSteps('test', [{ do: 'shop', stock: ['teaEgg', 'amulet', 'tigerHat'] }], errors);
    expect(errors).toEqual([
      'test[0]: shop sells amulet, which has no price (a gift item)',
      'test[0]: shop sells tigerHat, which has no price (a gift item)',
    ]);
    const ok: string[] = [];
    validateSteps('test', [{ do: 'shop', stock: ['teaEgg', 'helmet'] }], ok);
    expect(ok).toEqual([]);
  });
});
