import { describe, expect, it } from 'vitest';
import { applyAction, createBattle, drawCards, refillHand, startNextTurn } from '../../src/core';
import { buildFolder, CARDS, HAND_SIZE } from '../../src/data';
import { ally, eventsOf, setup } from './helpers';

describe('手札とフォルダ', () => {
  it('戦闘開始時に20枚の山札をシャッフルする', () => {
    const a = createBattle(setup({ seed: 1 }));
    const b = createBattle(setup({ seed: 2 }));
    expect(a.deck).toHaveLength(20);
    expect(a.deck.map((c) => c.uid).sort((x, y) => x - y)).toEqual([...Array(20).keys()]);
    expect(a.deck.map((c) => c.uid)).not.toEqual(b.deck.map((c) => c.uid));
  });

  it('味方の手番の開始時に手札を5枚まで補充する', () => {
    let s = startNextTurn(createBattle(setup({ allies: [ally('hero', { spd: 50 })] })));
    expect(s.hand).toHaveLength(HAND_SIZE);
    expect(s.deck).toHaveLength(15);

    const card = s.hand.find((c) => c.card.target === 'self' || c.card.target === 'enemy')!;
    const target = card.card.target === 'enemy' ? { kind: 'enemy' as const, id: 'enemy0' } : undefined;
    s = applyAction(s, { type: 'card', cardUid: card.uid, target });
    expect(s.hand.length).toBeLessThan(HAND_SIZE + (card.card.id === 'draw' ? 2 : 0));
    expect(s.discard.some((c) => c.uid === card.uid)).toBe(true);

    s = startNextTurn(s);
    expect(s.turn?.actorId).toBe('hero');
    expect(s.hand.length).toBeGreaterThanOrEqual(HAND_SIZE);
  });

  it('5枚以上ある時は補充しない', () => {
    const s = structuredClone(createBattle(setup({})));
    drawCards(s, 7);
    refillHand(s);
    expect(s.hand).toHaveLength(7);
  });

  it('山札が尽きたら捨て札をシャッフルして山札に戻す', () => {
    const s = structuredClone(createBattle(setup({})));
    s.discard = s.deck.splice(0, 18); // 山札2枚、捨て札18枚
    drawCards(s, 5);
    expect(s.hand).toHaveLength(5);
    expect(s.deck).toHaveLength(15);
    expect(s.discard).toHaveLength(0);
    expect(eventsOf(s, 'reshuffle')).toEqual([{ type: 'reshuffle', count: 18 }]);
  });

  it('山札も捨て札も空なら、引ける分だけ引く', () => {
    const s = structuredClone(createBattle(setup({ deck: buildFolder().slice(0, 3) })));
    drawCards(s, 5);
    expect(s.hand).toHaveLength(3);
  });

  it('カードはMPを使わない。使ったカードは捨て札へ', () => {
    let s = startNextTurn(createBattle(setup({ deck: Array(20).fill(CARDS.sword), allies: [ally('hero', { spd: 50 })] })));
    const mp = s.allies[0].mp;
    const uid = s.hand[0].uid;
    s = applyAction(s, { type: 'card', cardUid: uid, target: { kind: 'enemy', id: 'enemy0' } });
    expect(s.allies[0].mp).toBe(mp);
    expect(s.hand.some((c) => c.uid === uid)).toBe(false);
    expect(s.discard.map((c) => c.uid)).toEqual([uid]);
  });

  it('手札にないカードは使えない', () => {
    const s = startNextTurn(createBattle(setup({ allies: [ally('hero', { spd: 50 })] })));
    const notInHand = s.deck[0].uid;
    expect(() => applyAction(s, { type: 'card', cardUid: notInHand, target: { kind: 'enemy', id: 'enemy0' } })).toThrow();
  });

  it('ドロー: 手札を2枚引く', () => {
    let s = startNextTurn(createBattle(setup({ deck: Array(20).fill(CARDS.draw), allies: [ally('hero', { spd: 50 })] })));
    s = applyAction(s, { type: 'card', cardUid: s.hand[0].uid });
    expect(s.hand).toHaveLength(6);
  });
});
