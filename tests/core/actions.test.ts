import { describe, expect, it } from 'vitest';
import { applyAction, createBattle, getActionError, startNextTurn } from '../../src/core';
import { CARDS, SKILLS } from '../../src/data';
import { ally, enemy, eventsOf, setup } from './helpers';

function battle(deck = Array(20).fill(CARDS.sword)) {
  return startNextTurn(
    createBattle(
      setup({
        deck,
        allies: [
          ally('hero', { spd: 50, mp: 10 }, [SKILLS.fire, SKILLS.shuffle, SKILLS.swap, SKILLS.careAll]),
          ally('akari', { hp: 100 }),
        ],
        enemies: [enemy('a'), enemy('b')],
      }),
    ),
  );
}

describe('魔法・スキル', () => {
  it('MPを払って使う。足りなければ使えない', () => {
    let s = battle();
    s = applyAction(s, { type: 'skill', skillId: 'fire', target: { kind: 'enemy', id: 'enemy0' } });
    expect(s.allies[0].mp).toBe(4);
    s = startNextTurn(s);
    expect(getActionError(s, { type: 'skill', skillId: 'fire', target: { kind: 'enemy', id: 'enemy0' } })).toBe('not enough MP');
  });

  it('対象が必要な行動は、対象がないと使えない', () => {
    const s = battle();
    expect(getActionError(s, { type: 'attack', target: { kind: 'ally', id: 'akari' } })).not.toBeNull();
    expect(getActionError(s, { type: 'skill', skillId: 'fire' })).not.toBeNull();
  });

  it('シャッフル: 手札をすべて捨て、5枚引き直す', () => {
    const s0 = battle();
    const old = s0.hand.map((c) => c.uid);
    const s = applyAction(s0, { type: 'skill', skillId: 'shuffle' });
    expect(s.hand).toHaveLength(5);
    expect(s.discard.map((c) => c.uid).sort()).toEqual([...old].sort());
    expect(s.hand.some((c) => old.includes(c.uid))).toBe(false);
  });

  it('すりかえ: 捨て札から選んだカードを1枚手札に加える', () => {
    let s = battle();
    s = applyAction(s, { type: 'card', cardUid: s.hand[0].uid, target: { kind: 'enemy', id: 'enemy0' } });
    s = startNextTurn(s);
    const picked = s.discard[0].uid;
    expect(getActionError(s, { type: 'skill', skillId: 'swap' })).not.toBeNull(); // 選ばないと使えない
    s = applyAction(s, { type: 'skill', skillId: 'swap', pickCardUid: picked });
    expect(s.hand.some((c) => c.uid === picked)).toBe(true);
    expect(s.discard.some((c) => c.uid === picked)).toBe(false);
  });

  it('ケアオール: 生きている味方全体を回復し、最大HPを超えない', () => {
    const s0 = battle();
    s0.allies[0].hp = 50;
    s0.allies[1].hp = 95;
    s0.allies[0].mp = 20;
    const s = applyAction(s0, { type: 'skill', skillId: 'careAll' });
    // 30 × 10 ÷ 20 = 15
    expect(s.allies.map((a) => a.hp)).toEqual([65, 100]);
    expect(eventsOf(s, 'heal')).toHaveLength(2);
  });
});

describe('カード', () => {
  it('ワイドショット: 敵全体にダメージ', () => {
    const s = battle(Array(20).fill(CARDS.wideShot));
    const after = applyAction(s, { type: 'card', cardUid: s.hand[0].uid });
    expect(eventsOf(after, 'damage').map((e) => e.targetId)).toEqual(['enemy0', 'enemy1']);
  });

  it('クイックステップ: 何もせず、待ち時間が短い（重さ0.4）', () => {
    const s = battle(Array(20).fill(CARDS.quickStep));
    const ct = s.allies[0].ct;
    const after = applyAction(s, { type: 'card', cardUid: s.hand[0].uid });
    expect(after.allies[0].ct).toBe(ct + 1); // ceil(100 ÷ 50 × 0.4) = 1
    expect(eventsOf(after, 'damage')).toHaveLength(0);
  });

  it('カードは使用者の能力値で計算する', () => {
    const s = battle(Array(20).fill(CARDS.recover));
    s.allies[0].mag = 40;
    s.allies[1].hp = 10;
    const after = applyAction(s, { type: 'card', cardUid: s.hand[0].uid, target: { kind: 'ally', id: 'akari' } });
    // 40 × 40 ÷ 20 = 80
    expect(eventsOf(after, 'heal')[0].amount).toBe(80);
  });
});

describe('状態を書き換えない', () => {
  it('applyAction は元の状態を変えずに新しい状態を返す', () => {
    const s = battle();
    const snapshot = structuredClone(s);
    applyAction(s, { type: 'attack', target: { kind: 'enemy', id: 'enemy0' } });
    expect(s).toEqual(snapshot);
  });
});
