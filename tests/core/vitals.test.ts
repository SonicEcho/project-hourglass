import { describe, expect, it } from 'vitest';
import { createBattle, vitalsAfter } from '../../src/core';
import { ally, setup } from './helpers';

// 区画の中の戦闘は、前の戦闘で残った HP・MP から始まる（段階32b 調整3）
describe('HP・MP の持ち越し', () => {
  it('書いた仲間は持ち越した HP・MP から、書いていない仲間は全回復で始まる。最大を超える分はそろえる', () => {
    const s = createBattle(
      setup({ allies: [ally('hero', { hp: 100, mp: 20 }), ally('akari', { hp: 80, mp: 30 })], vitals: { hero: { hp: 35, mp: 999 } } }),
    );
    expect(s.allies.map((a) => [a.uid, a.hp, a.mp])).toEqual([
      ['hero', 35, 20],
      ['akari', 80, 30],
    ]);
  });

  it('持ち越した HP が0以下でも、1で始まる', () => {
    const s = createBattle(setup({ allies: [ally('hero', { hp: 100 })], vitals: { hero: { hp: 0, mp: 0 } } }));
    expect([s.allies[0].hp, s.allies[0].mp]).toEqual([1, 0]);
  });

  it('戦闘の終わりの HP・MP を返す。倒れたまま勝った仲間は HP 1', () => {
    const s = createBattle(setup({ allies: [ally('hero'), ally('akari')] }));
    s.allies[0].hp = 42;
    s.allies[0].mp = 7;
    s.allies[1].hp = 0;
    expect(vitalsAfter(s)).toEqual({ hero: { hp: 42, mp: 7 }, akari: { hp: 1, mp: 50 } });
  });
});
