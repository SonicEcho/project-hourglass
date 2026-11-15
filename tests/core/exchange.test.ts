import { describe, expect, it } from 'vitest';
import type { ExchangeGood } from '../../src/core';
import { createArmory, exchange, exchangedKey, exchangeGoods, fragmentTotal, getExchangeError, payFragments } from '../../src/core';
import { areaCommonItems, AREAS, CHAIN_ENEMY_SNAPS, CHAIN_SNAPS, DIG_TOOLS, EXCHANGE_GOODS, FRAGMENTS, ITEMS, NAVI_PARTS, WEAPON_DATA } from '../../src/data';

// 交換所（段階52。docs/design/economy.md の 5-2）
const ORDER = Object.keys(FRAGMENTS);
// 持てる数のある品物（段階204 で消費アイテムはなくした。仕組みはスナップの持てる数でも使う）
const MAX = 3;
const potion: ExchangeGood = { id: 'item_capped', kind: 'item', ref: 'capped', price: 1 };
const gear: ExchangeGood = { id: 'gear_x', kind: 'gear', ref: 'mpMemory', price: 3, once: true, chapter: 2 };
const mat: ExchangeGood = { id: 'mat_x', kind: 'item', ref: 'goldfishScale', price: 1, area: 'a11' };

describe('交換所（段階52）', () => {
  it('並ぶ物：返した区画の素材だけ、章の品物は章が来てから（章が分からなければ絞らない）', () => {
    const goods = [potion, mat, gear];
    expect(exchangeGoods(goods, { returned: [], chapter: 1 }).map((g) => g.id)).toEqual(['item_capped']);
    expect(exchangeGoods(goods, { returned: ['a11'], chapter: 2 }).map((g) => g.id)).toEqual(['item_capped', 'mat_x', 'gear_x']);
    expect(exchangeGoods(goods, { returned: [] }).map((g) => g.id)).toEqual(['item_capped', 'gear_x']);
  });

  it('払い方：多く持っている種類から1つずつ（同じ数なら並びの順）。足りなければ null', () => {
    expect(payFragments({ courage: 1, elation: 3, relief: 3 }, 3, ORDER)).toEqual({ courage: 1, elation: 1, relief: 2 });
    expect(payFragments({ courage: 1 }, 2, ORDER)).toBeNull();
    expect(fragmentTotal({ courage: 2, wonder: 5 })).toBe(7);
  });

  it('交換すると欠片が減り、物が増える。1回だけの品物は2回目はできない。持てる数まで持っていたら交換できない', () => {
    let a = { ...createArmory(WEAPON_DATA), fragments: { courage: 4 } };
    let vars: Record<string, string> = {};
    let r = exchange(potion, a, vars, ORDER, MAX);
    expect(r.armory.items.capped).toBe(1);
    expect(r.armory.fragments.courage).toBe(3);
    expect(r.gear).toBeUndefined();
    r = exchange(gear, r.armory, r.vars, ORDER);
    expect(r.gear).toBe('mpMemory');
    expect(r.armory.fragments.courage).toBe(0);
    expect(r.vars[exchangedKey('gear_x')]).toBe('1');
    expect(getExchangeError(gear, { ...r.armory, fragments: { courage: 9 } }, r.vars)).toBe('already exchanged');
    expect(getExchangeError(potion, r.armory, r.vars, MAX)).toBe('not enough fragments');
    a = { ...a, items: { capped: MAX } };
    vars = {};
    expect(getExchangeError(potion, a, vars, MAX)).toBe('pouch is full');
    expect(() => exchange(potion, a, vars, ORDER, MAX)).toThrow('pouch is full');
  });

  it('データ：id が重ならない。並ぶ物は実在し、進化の鍵（レア・部位・ぬし）を並べない。素材は区画の「いつもの」素材', () => {
    const ids = EXCHANGE_GOODS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of EXCHANGE_GOODS) {
      if (g.kind === 'gear') expect(NAVI_PARTS[g.ref as keyof typeof NAVI_PARTS], g.id).toBeDefined();
      else if (g.kind === 'snap') expect(CHAIN_SNAPS[g.ref], g.id).toBeDefined();
      // 段階214：砂の底の道具
      else if (g.kind === 'digTool') expect(DIG_TOOLS[g.ref as keyof typeof DIG_TOOLS], g.id).toBeDefined();
      else {
        const it = WEAPON_DATA.items[g.ref];
        expect(it, g.id).toBeDefined();
        expect(it.kind === 'material' && it.rarity === 'common', g.id).toBe(true);
      }
      if (g.area) expect(AREAS[g.area], g.id).toBeDefined();
      expect(g.price).toBeGreaterThan(0);
    }
    expect(areaCommonItems('a11')).toContain(ITEMS.goldfishScale.id);
    expect(areaCommonItems('nowhere')).toEqual([]);
    // 段階204：ポーチの消費アイテムは並べない
    expect(EXCHANGE_GOODS.some((g) => g.id.startsWith('pouch_'))).toBe(false);
  });
});

describe('交換所のスナップ（段階177）', () => {
  it('弱めの札だけ。2章から基本の札、3章から少し強い札。レア・クライマックス・敵のスナップは並べない', () => {
    const snaps = EXCHANGE_GOODS.filter((g) => g.kind === 'snap');
    expect(snaps.length).toBeGreaterThan(0);
    for (const g of snaps) {
      const m = CHAIN_SNAPS[g.ref];
      expect(m.type === 'finish').toBe(false);
      expect(Object.values(CHAIN_ENEMY_SNAPS)).not.toContain(g.ref);
      expect(g.chapter).toBeGreaterThanOrEqual(2);
    }
  });
  it('交換すると増えるスナップを返す。同じ札は上限まで', () => {
    const g = EXCHANGE_GOODS.find((x) => x.kind === 'snap')!;
    const armory = { weapons: {}, items: {}, fragments: { f: 10 } };
    expect(exchange(g, armory, {}, ['f'], 4, 1).snap).toBe(g.ref);
    expect(getExchangeError(g, armory, {}, 4, 4)).toBe('too many copies');
  });
});

describe('交換所：砂の底の道具（段階214）', () => {
  it('2章から並び、記憶の欠片で買える。持てる数を超えると買えない', () => {
    const tools = EXCHANGE_GOODS.filter((g) => g.kind === 'digTool');
    expect(tools.map((g) => g.ref).sort()).toEqual(Object.keys(DIG_TOOLS).sort());
    for (const g of tools) expect(g.chapter).toBe(2);
    const armory = { ...createArmory(WEAPON_DATA), fragments: { [Object.keys(FRAGMENTS)[0]]: 10 } };
    const g = tools[0];
    const r = exchange(g, armory, {}, Object.keys(FRAGMENTS), 9, 0);
    expect(r.digTool).toBe(g.ref);
    expect(fragmentTotal(r.armory.fragments)).toBe(10 - g.price);
    expect(getExchangeError(g, armory, {}, 9, 9)).toBe('too many copies');
  });
});
