import { describe, expect, it } from 'vitest';
import type { BattleState, PlayerAction } from '../../src/core';
import {
  applyExtra,
  capItems,
  createArmory,
  getBattleResult,
  getFragmentError,
  getPlanError,
  getAbsorbError,
  pouchFrom,
  pouchLeft,
  previewAction,
  spendItems,
} from '../../src/core';
import { ITEMS, POUCH_ITEMS, POUCH_MAX, POUCH_ORDER, POUCH_USES_PER_BATTLE, WEAPON_DATA } from '../../src/data';
import { pouchPlan } from '../../src/sim/autoBattle';
import { ally, attackOn, battle, enemy, eventsOf, execute, guard, planAll } from './helpers';

// ポーチ（段階51。docs/design/economy.md の 5-1）：戦闘の「その他」から使う消費アイテム
const potion = POUCH_ITEMS[ITEMS.potion.id];
const ether = POUCH_ITEMS[ITEMS.ether.id];
const use = (itemId: string, to: string): PlayerAction => ({ type: 'item', itemId, target: { kind: 'ally', id: to } });

function hurt(s: BattleState, id: string, hp: number, mp?: number): BattleState {
  const out = structuredClone(s);
  const a = out.allies.find((x) => x.uid === id)!;
  a.hp = hp;
  if (mp !== undefined) a.mp = mp;
  return out;
}

describe('ポーチ（段階51）', () => {
  it('データ：3種類（ポーション・ハイポーション・エーテル）。1種類3個まで、1戦に3回まで。どれも味方1人に、決まった量を戻す', () => {
    expect(POUCH_ORDER).toEqual(['potion', 'hiPotion', 'ether']);
    expect(POUCH_MAX).toBe(3);
    expect(POUCH_USES_PER_BATTLE).toBe(3);
    for (const id of POUCH_ORDER) {
      expect(POUCH_ITEMS[id].target).toBe('ally');
      expect(POUCH_ITEMS[id].effects.every((e) => e.kind === 'restore')).toBe(true);
      expect(WEAPON_DATA.items[id]).toMatchObject({ kind: 'item', max: POUCH_MAX });
    }
  });

  it('持っている数から、戦闘に持ち込む物を作る（持っていない物は入れない）', () => {
    const p = pouchFrom(POUCH_ITEMS, POUCH_ORDER, { ether: 2, potion: 1, hiPotion: 0, goldfishScale: 4 });
    expect(p.map((x) => [x.item.id, x.count, x.used])).toEqual([
      ['potion', 1, 0],
      ['ether', 2, 0],
    ]);
  });

  it('ポーションで HP が戻り、数が減る（最大を超えない）。武器の経験値には数えない', () => {
    let s = battle({ allies: [ally('hero'), ally('akari')], pouch: [{ item: potion, count: 2, used: 0 }] });
    s = hurt(s, 'akari', 30);
    s = execute(planAll(s, { hero: use('potion', 'akari'), akari: guard }));
    expect(s.allies[1].hp).toBeGreaterThanOrEqual(30 + 50 - 30); // 敵の攻撃の分を引いても回復している
    expect(eventsOf(s, 'heal')[0]).toMatchObject({ targetId: 'akari', amount: 50, hpAfter: 80 });
    expect(s.pouch[0]).toMatchObject({ count: 1, used: 1 });
    expect(s.pouchUsesLeft).toBe(POUCH_USES_PER_BATTLE - 1);
    const r = getBattleResult(s);
    expect(r.pouchUsed).toEqual({ potion: 1 });
    expect(r.actionCounts.hero).toBe(0);
    // 最大を超える分は戻らない
    let full = battle({ allies: [ally('hero')], pouch: [{ item: potion, count: 1, used: 0 }] });
    full = hurt(full, 'hero', 90);
    full = execute(planAll(full, { hero: use('potion', 'hero') }));
    expect(eventsOf(full, 'heal')[0].amount).toBe(10);
  });

  it('エーテルで MP が戻る。予告にも出る', () => {
    let s = battle({ allies: [ally('hero')], pouch: [{ item: ether, count: 1, used: 0 }] });
    s = hurt(s, 'hero', 100, 5);
    expect(previewAction(s, 'hero', use('ether', 'hero')).targets).toEqual([{ unitId: 'hero', kind: 'mp', min: 12, max: 12, affinity: 'normal' }]);
    s = execute(planAll(s, { hero: use('ether', 'hero') }));
    expect(eventsOf(s, 'mpRestore')[0]).toMatchObject({ targetId: 'hero', amount: 12, mpAfter: 17 });
  });

  it('予約した分も数える：残り1個なら2人目は選べない。選び直す仲間の予約は空く', () => {
    let s = battle({ allies: [ally('hero'), ally('akari')], pouch: [{ item: potion, count: 1, used: 0 }] });
    s = planAll(s, { hero: use('potion', 'akari') });
    expect(pouchLeft(s, 'potion')).toEqual({ count: 0, uses: POUCH_USES_PER_BATTLE - 1 });
    expect(getPlanError(s, 'akari', use('potion', 'hero'))).toBe('no items left');
    expect(getPlanError(s, 'hero', use('potion', 'hero'))).toBeNull();
    // 持っていない物・倒れた仲間には使えない
    expect(getPlanError(s, 'akari', use('ether', 'hero'))).toBe('unknown item');
    const down = hurt(battle({ allies: [ally('hero'), ally('akari')], pouch: [{ item: potion, count: 1, used: 0 }] }), 'akari', 0);
    expect(getPlanError(down, 'hero', use('potion', 'akari'))).toBe('target ally is not available');
  });

  it('1つの戦闘で使えるのは決まった回数まで', () => {
    let s = battle({ allies: [ally('hero'), ally('akari')], pouch: [{ item: potion, count: 3, used: 0 }], pouchUses: 1 });
    s = planAll(s, { hero: use('potion', 'hero') });
    expect(getPlanError(s, 'akari', use('potion', 'akari'))).toBe('pouch uses are used up');
    s = execute(planAll(s, { akari: guard }));
    expect(getPlanError(s, 'hero', use('potion', 'hero'))).toBe('pouch uses are used up');
    expect(s.pouch[0].count).toBe(2);
  });

  it('番が来る前に相手が倒れたら、使わずに残る', () => {
    const fast = enemy('fast', { spd: 99, atk: 999 }, { actions: [{ id: 'all', name: 'all', target: 'allies', type: 'physical', power: 10, weight: 1.0 }] });
    let s = battle({ allies: [ally('hero', { hp: 9999 }), ally('akari')], enemies: [fast], pouch: [{ item: potion, count: 1, used: 0 }] });
    s = hurt(s, 'akari', 1);
    s = execute(planAll(s, { hero: use('potion', 'akari'), akari: guard }));
    expect(eventsOf(s, 'cancel')).toEqual([{ type: 'cancel', actorIds: ['hero'], reason: 'target' }]);
    expect(s.pouch[0]).toMatchObject({ count: 1, used: 0 });
    expect(getBattleResult(s).pouchUsed).toEqual({});
  });

  it('延長の追加行動でも使える', () => {
    const weak = enemy('weak', { hp: 9999 }, { weaknesses: ['physical'] });
    let s = battle({ allies: [ally('hero'), ally('akari')], enemies: [weak], pouch: [{ item: potion, count: 1, used: 0 }] });
    s = hurt(s, 'akari', 20);
    s = execute(planAll(s, { hero: attackOn('enemy0'), akari: guard }));
    expect(s.phase).toBe('extra');
    s = applyExtra(s, use('potion', 'akari'));
    expect(eventsOf(s, 'heal').at(-1)).toMatchObject({ targetId: 'akari', amount: 50 });
    expect(s.pouch[0].count).toBe(0);
  });

  it('武器に吸わせられず、時分解もできない。持てる数を超えた分は捨て、捨てた物を返す。使った分を減らす', () => {
    let a = createArmory(WEAPON_DATA);
    a = { ...a, items: { potion: 5, ether: 2, goldfishScale: 9 } };
    expect(getAbsorbError(WEAPON_DATA, a, 'hero', 'potion')).toBe('only materials can be absorbed');
    expect(getFragmentError(WEAPON_DATA, a, 'potion')).toBe('only materials can be decomposed');
    const capped = capItems(WEAPON_DATA, a);
    expect(capped.armory.items).toEqual({ potion: 3, ether: 2, goldfishScale: 9 });
    expect(capped.overflow).toEqual(['potion', 'potion']);
    expect(capItems(WEAPON_DATA, capped.armory).armory).toBe(capped.armory);
    expect(spendItems(capped.armory, { potion: 2, ether: 5 }).items).toMatchObject({ potion: 1, ether: 0 });
  });
});

describe('自動対戦のポーチの方針（段階51）', () => {
  it('HP が3割を切った仲間に、まだ行動を決めていない仲間がポーションを使う。MP がない仲間は自分にエーテル', () => {
    const fire = { id: 'fire', name: 'fire', mp: 5, weight: 1.0, target: 'enemy' as const, effects: [{ kind: 'damage' as const, type: 'fire' as const, power: 10 }] };
    let s = battle({
      allies: [ally('hero'), ally('akari', {}, [fire])],
      pouch: [
        { item: potion, count: 1, used: 0 },
        { item: ether, count: 1, used: 0 },
      ],
    });
    s = hurt(hurt(s, 'hero', 20), 'akari', 100, 0);
    const planned = pouchPlan(s);
    expect(planned.plans.map((p) => [p.actorIds[0], p.action])).toEqual([
      ['hero', use('potion', 'hero')],
      ['akari', use('ether', 'akari')],
    ]);
    // 誰も困っていなければ何も決めない
    expect(pouchPlan(battle({ allies: [ally('hero')], pouch: [{ item: potion, count: 1, used: 0 }] })).plans).toEqual([]);
  });
});
