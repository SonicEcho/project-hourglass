import { describe, expect, it } from 'vitest';
import { applyAction, createBattle, startNextTurn } from '../../src/core';
import type { BattleState, CardDef } from '../../src/core';
import { CARDS, COMBOS, HAND_MAX, HAND_SIZE, SKILLS } from '../../src/data';
import { ally, enemy, eventsOf, setup } from './helpers';

/** 山札を指定の順にして戦闘を始める（味方2人、敵は遅い） */
function battle(deck: CardDef[]): BattleState {
  const filler = Array(20 - deck.length).fill(CARDS.quickStep);
  const s = createBattle(
    setup({
      deck: [...deck, ...filler],
      combos: COMBOS,
      allies: [ally('hero', { spd: 50 }, [SKILLS.fire]), ally('mio', { spd: 5 })],
      enemies: [enemy('a', {}, { weaknesses: ['fire'] }), enemy('b')],
    }),
  );
  s.deck.sort((x, y) => x.uid - y.uid);
  return startNextTurn(s);
}

const uids = (s: BattleState) => s.hand.map((c) => c.uid);
const attack = { type: 'attack' as const, target: { kind: 'enemy' as const, id: 'enemy1' } };

describe('手札の入れ替え', () => {
  it('戦闘開始時は5枚', () => {
    expect(battle([]).hand).toHaveLength(HAND_SIZE);
  });

  it('カードを使った手番の後は、次の手番で手札をすべて捨てて5枚引き直す', () => {
    let s = battle([CARDS.sword]);
    const before = uids(s);
    s = applyAction(s, { type: 'card', cardUid: s.hand[0].uid, target: { kind: 'enemy', id: 'enemy1' } });
    expect(s.handRefreshPending).toBe(true);
    const from = s.log.length;
    s = startNextTurn(s);
    expect(s.turn?.actorId).toBe('hero');
    expect(s.hand).toHaveLength(HAND_SIZE);
    expect(uids(s).some((u) => before.includes(u))).toBe(false);
    expect(eventsOf(s, 'discardHand', from)).toHaveLength(1);
    expect(s.handRefreshPending).toBe(false);
  });

  it('カードを使わなかった手番の後は、手札を残して1枚引く', () => {
    let s = battle([]);
    const before = uids(s);
    s = applyAction(s, attack);
    s = startNextTurn(s);
    expect(s.hand).toHaveLength(HAND_SIZE + 1);
    expect(uids(s).slice(0, HAND_SIZE)).toEqual(before);
  });

  it('残して引き足すのは上限7枚まで', () => {
    let s = battle([]);
    for (let i = 0; i < 5; i++) {
      s = applyAction(s, { type: 'guard' });
      s = startNextTurn(s);
    }
    expect(s.turn?.actorId).toBe('hero');
    expect(s.hand).toHaveLength(HAND_MAX);
  });

  it('ワンモアで手番が続く間は、同じ手札を使い続けられる', () => {
    let s = battle([CARDS.fireChip, CARDS.sword]);
    s = applyAction(s, { type: 'card', cardUid: s.hand[0].uid, target: { kind: 'enemy', id: 'enemy0' } });
    expect(s.turn?.oneMoreActive).toBe(true);
    expect(s.hand).toHaveLength(HAND_SIZE - 1);
    s = applyAction(s, { type: 'card', cardUid: s.hand[0].uid, target: { kind: 'enemy', id: 'enemy1' } });
    expect(s.discard).toHaveLength(2);
    s = startNextTurn(s);
    expect(s.hand).toHaveLength(HAND_SIZE);
    expect(s.discard).toHaveLength(2 + 3);
  });

  it('バトンを受けた仲間は、同じ手札のまま行動する', () => {
    let s = battle([CARDS.fireChip]);
    s = applyAction(s, { type: 'card', cardUid: s.hand[0].uid, target: { kind: 'enemy', id: 'enemy0' } });
    const hand = uids(s);
    s = applyAction(s, { type: 'baton', toAllyId: 'mio' });
    expect(s.turn?.actorId).toBe('mio');
    expect(uids(s)).toEqual(hand);
  });

  it('ドローは使っても手札を入れ替えない', () => {
    let s = battle([CARDS.draw]);
    s = applyAction(s, { type: 'card', cardUid: s.hand[0].uid });
    expect(s.handRefreshPending).toBe(false);
    expect(s.hand).toHaveLength(HAND_SIZE + 1);
    const hand = uids(s);
    s = startNextTurn(s);
    expect(uids(s).slice(0, hand.length)).toEqual(hand);
    expect(s.hand).toHaveLength(HAND_MAX);
  });

  it('コンボを使った後も手札を入れ替える', () => {
    let s = battle([CARDS.recover, CARDS.recover]);
    s = applyAction(s, { type: 'combo', comboId: 'healCircle' });
    expect(s.handRefreshPending).toBe(true);
  });

  it('魔法・スキルだけなら手札は入れ替わらない', () => {
    let s = battle([]);
    const before = uids(s);
    s = applyAction(s, { type: 'skill', skillId: 'fire', target: { kind: 'enemy', id: 'enemy1' } });
    expect(s.handRefreshPending).toBe(false);
    s = startNextTurn(s);
    expect(uids(s).slice(0, HAND_SIZE)).toEqual(before);
  });
});
