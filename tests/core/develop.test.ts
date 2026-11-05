import { describe, expect, it } from 'vitest';
import { availableCombos, setPlan } from '../../src/core';
import { CARDS, COMBOS, SNAP_TRIAL_BATTLES, TRIAL_CARDS, TRIAL_COMBOS, TRIAL_DECK } from '../../src/data';
import { ally, battle, eventsOf, execute, guard, withHand } from './helpers';

// 現像（段階155）：手札に残すと、ラウンドの始めに段が進む（撮りたて → 現像 → 焼き付け）。使うと撮りたてに戻る
describe('現像（段階155）', () => {
  it('残した札は、次のラウンドの始めに1段ずつ進み、焼き付けで止まる。中身はその段の物になる', () => {
    let s = withHand(battle({ allies: [ally('hero')] }), [TRIAL_CARDS.bat, CARDS.sword, CARDS.sword, CARDS.sword, CARDS.sword]);
    const bat = s.hand[0].uid;
    s = execute(setPlan(s, 'hero', guard));
    let c = s.hand.find((x) => x.uid === bat)!;
    expect(c.stage).toBe(1);
    expect(c.card.effects[0]).toMatchObject({ kind: 'damage', power: 46 });
    expect(eventsOf(s, 'develop').map((e) => e.stage)).toEqual([1]);
    s = execute(setPlan(s, 'hero', guard));
    s = execute(setPlan(s, 'hero', guard));
    c = s.hand.find((x) => x.uid === bat)!;
    expect(c.stage).toBe(2);
    expect(c.card.name).toBe('金属バット（快音）');
    expect(c.card.weight).toBe(1.4);
  });

  it('使った札は、撮りたてに戻って捨て札へ行く', () => {
    let s = withHand(battle({ allies: [ally('hero')] }), [TRIAL_CARDS.bat, CARDS.sword, CARDS.sword, CARDS.sword, CARDS.sword]);
    const bat = s.hand[0].uid;
    s = execute(setPlan(s, 'hero', guard));
    s = execute(setPlan(s, 'hero', { type: 'card', cardUid: bat, target: { kind: 'enemy', id: 'enemy0' } }));
    const gone = s.discard.find((x) => x.uid === bat)!;
    expect(gone.stage ?? 0).toBe(0);
    expect(gone.card.effects[0]).toMatchObject({ power: 28 });
  });

  it('現像しない札は、残しても変わらない', () => {
    let s = withHand(battle({ allies: [ally('hero')] }), [CARDS.sword, CARDS.fireChip, CARDS.iceChip, CARDS.recover, CARDS.wideShot]);
    s = execute(setPlan(s, 'hero', guard));
    expect(s.hand.slice(0, 5).every((c) => c.stage === undefined)).toBe(true);
    expect(eventsOf(s, 'develop')).toHaveLength(0);
  });

  it('現像が進んでも、コンボの材料として使える（名前でなく id で数える）', () => {
    let s = withHand(battle({ allies: [ally('hero')], combos: [...COMBOS, ...TRIAL_COMBOS] }), [TRIAL_CARDS.bat, CARDS.sword, CARDS.fireChip, CARDS.iceChip, CARDS.recover]);
    s = execute(setPlan(s, 'hero', guard));
    expect(availableCombos(s, s.hand).map((c) => c.id)).toContain('tr_walkoff');
  });

  it('試しのアルバムは20枚、2枚のコンボの材料はアルバムにある', () => {
    expect(TRIAL_DECK).toHaveLength(20);
    const ids = new Set(TRIAL_DECK.map((c) => c.id));
    for (const c of TRIAL_COMBOS) {
      expect(c.cards).toHaveLength(2);
      for (const id of c.cards) expect(ids.has(id), `${c.name} の ${id}`).toBe(true);
    }
    expect(Object.keys(SNAP_TRIAL_BATTLES).length).toBeGreaterThan(0);
  });
});
