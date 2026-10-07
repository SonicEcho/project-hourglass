import { describe, expect, it } from 'vitest';
import { drawCards, refillHand, setPlan } from '../../src/core';
import { buildFolder, CARDS, HAND_SIZE } from '../../src/data';
import { ally, battle, eventsOf, execute, guard, planAll, withHand } from './helpers';

describe('手札とアルバム', () => {
  it('戦闘開始時に20枚の山札をシャッフルし、5枚配る', () => {
    const a = battle({ seed: 1 });
    const b = battle({ seed: 2 });
    expect(a.hand).toHaveLength(HAND_SIZE);
    expect(a.deck.length + a.hand.length).toBe(20);
    expect(a.hand.map((c) => c.uid)).not.toEqual(b.hand.map((c) => c.uid));
  });

  it('使ったスナップは捨て札へ。使わなかったスナップは残り、次のラウンドで5枚まで補充する', () => {
    let s = withHand(battle({ allies: [ally('hero')] }), [CARDS.sword, CARDS.fireChip, CARDS.iceChip, CARDS.recover, CARDS.wideShot]);
    const used = s.hand[0].uid;
    const kept = s.hand.slice(1).map((c) => c.uid);
    s = setPlan(s, 'hero', { type: 'card', cardUid: used, target: { kind: 'enemy', id: 'enemy0' } });
    s = execute(s);
    expect(s.round).toBe(2);
    expect(s.discard.some((c) => c.uid === used)).toBe(true);
    expect(s.hand).toHaveLength(HAND_SIZE);
    expect(s.hand.slice(0, 4).map((c) => c.uid)).toEqual(kept);
  });

  it('5枚以上ある時は補充しない', () => {
    const s = structuredClone(battle({}));
    drawCards(s, 2);
    refillHand(s);
    expect(s.hand).toHaveLength(7);
  });

  it('山札が尽きたら捨て札をシャッフルして山札に戻す', () => {
    const s = structuredClone(battle({}));
    s.discard = s.deck.splice(0, 13); // 山札2枚、捨て札13枚
    drawCards(s, 5);
    expect(s.hand).toHaveLength(10);
    expect(s.deck).toHaveLength(10);
    expect(s.discard).toHaveLength(0);
    expect(eventsOf(s, 'reshuffle')).toEqual([{ type: 'reshuffle', count: 13 }]);
  });

  it('山札も捨て札も空なら、引ける分だけ引く', () => {
    const s = battle({ deck: buildFolder().slice(0, 3) });
    expect(s.hand).toHaveLength(3);
  });

  it('スナップはMPを使わない', () => {
    let s = withHand(battle({ allies: [ally('hero')] }), [CARDS.sword]);
    s = execute(planAll(s, { hero: { type: 'card', cardUid: s.hand[0].uid, target: { kind: 'enemy', id: 'enemy0' } } }));
    expect(s.allies[0].mp).toBe(50);
  });

  it('防御だけのラウンドでは手札は変わらない（補充もしない）', () => {
    let s = battle({ allies: [ally('hero')] });
    const before = s.hand.map((c) => c.uid);
    s = execute(planAll(s, { hero: guard }));
    expect(s.hand.map((c) => c.uid)).toEqual(before);
  });
});
