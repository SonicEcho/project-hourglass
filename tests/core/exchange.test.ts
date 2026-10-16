import { describe, expect, it } from 'vitest';
import type { ExchangeGood } from '../../src/core';
import { createArmory, exchange, exchangedKey, exchangeGoods, fragmentTotal, getExchangeError, payFragments } from '../../src/core';
import { areaCommonItems, AREAS, EXCHANGE_GOODS, FRAGMENTS, ITEMS, NAVI_PARTS, POUCH_MAX, WEAPON_DATA } from '../../src/data';

// 交換所（段階52。docs/design/economy.md の 5-2）
const ORDER = Object.keys(FRAGMENTS);
const potion: ExchangeGood = { id: 'pouch_potion', kind: 'item', ref: 'potion', price: 1 };
const gear: ExchangeGood = { id: 'gear_x', kind: 'gear', ref: 'mpMemory', price: 3, once: true, chapter: 2 };
const mat: ExchangeGood = { id: 'mat_x', kind: 'item', ref: 'goldfishScale', price: 1, area: 'a11' };

describe('交換所（段階52）', () => {
  it('並ぶ物：返した区画の素材だけ、章の品物は章が来てから（章が分からなければ絞らない）', () => {
    const goods = [potion, mat, gear];
    expect(exchangeGoods(goods, { returned: [], chapter: 1 }).map((g) => g.id)).toEqual(['pouch_potion']);
    expect(exchangeGoods(goods, { returned: ['a11'], chapter: 2 }).map((g) => g.id)).toEqual(['pouch_potion', 'mat_x', 'gear_x']);
    expect(exchangeGoods(goods, { returned: [] }).map((g) => g.id)).toEqual(['pouch_potion', 'gear_x']);
  });

  it('払い方：多く持っている種類から1つずつ（同じ数なら並びの順）。足りなければ null', () => {
    expect(payFragments({ courage: 1, elation: 3, relief: 3 }, 3, ORDER)).toEqual({ courage: 1, elation: 1, relief: 2 });
    expect(payFragments({ courage: 1 }, 2, ORDER)).toBeNull();
    expect(fragmentTotal({ courage: 2, wonder: 5 })).toBe(7);
  });

  it('交換すると欠片が減り、物が増える。1回だけの品物は2回目はできない。ポーチが満タンなら交換できない', () => {
    let a = { ...createArmory(WEAPON_DATA), fragments: { courage: 4 } };
    let vars: Record<string, string> = {};
    let r = exchange(potion, a, vars, ORDER, POUCH_MAX);
    expect(r.armory.items.potion).toBe(1);
    expect(r.armory.fragments.courage).toBe(3);
    expect(r.gear).toBeUndefined();
    r = exchange(gear, r.armory, r.vars, ORDER);
    expect(r.gear).toBe('mpMemory');
    expect(r.armory.fragments.courage).toBe(0);
    expect(r.vars[exchangedKey('gear_x')]).toBe('1');
    expect(getExchangeError(gear, { ...r.armory, fragments: { courage: 9 } }, r.vars)).toBe('already exchanged');
    expect(getExchangeError(potion, r.armory, r.vars, POUCH_MAX)).toBe('not enough fragments');
    a = { ...a, items: { potion: POUCH_MAX } };
    vars = {};
    expect(getExchangeError(potion, a, vars, POUCH_MAX)).toBe('pouch is full');
    expect(() => exchange(potion, a, vars, ORDER, POUCH_MAX)).toThrow('pouch is full');
  });

  it('データ：id が重ならない。並ぶ物は実在し、進化の鍵（レア・部位・ぬし）を並べない。素材は区画の「いつもの」素材', () => {
    const ids = EXCHANGE_GOODS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of EXCHANGE_GOODS) {
      if (g.kind === 'gear') expect(NAVI_PARTS[g.ref as keyof typeof NAVI_PARTS], g.id).toBeDefined();
      else {
        const it = WEAPON_DATA.items[g.ref];
        expect(it, g.id).toBeDefined();
        expect(it.kind === 'item' || it.rarity === 'common', g.id).toBe(true);
      }
      if (g.area) expect(AREAS[g.area], g.id).toBeDefined();
      expect(g.price).toBeGreaterThan(0);
    }
    expect(areaCommonItems('a11')).toContain(ITEMS.goldfishScale.id);
    expect(areaCommonItems('nowhere')).toEqual([]);
    // ポーション 1、ハイポーション 2、エーテル 2（5-2 の目安）
    expect(['pouch_potion', 'pouch_hiPotion', 'pouch_ether'].map((id) => EXCHANGE_GOODS.find((g) => g.id === id)?.price)).toEqual([1, 2, 2]);
  });
});
