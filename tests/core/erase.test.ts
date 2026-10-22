import { describe, expect, it } from 'vitest';
import type { BattleState, EnemyActionDef } from '../../src/core';
import { CARDS } from '../../src/data';
import { ally, battle, enemy, eventsOf, execute, guard, planAll, withHand } from './helpers';

// 露出（段階96。3章のカイ）：攻撃の後、まだ誰にも割り当てていない手札を1枚、その戦闘から消す
const expose: EnemyActionDef = { id: 'expose', name: '露出', target: 'ally', type: 'magic', power: 10, weight: 1.0, erasesCard: true };

function withExpose(): BattleState {
  const s = battle({ allies: [ally('hero', { spd: 50, hp: 999 })], enemies: [enemy('kai', { spd: 1 }, { actions: [expose] })] });
  return withHand(s, [CARDS.sword, CARDS.fireChip, CARDS.iceChip]);
}

describe('露出（段階96）', () => {
  it('攻撃の後、手札が1枚、捨て札にも山札にも戻らずに消える', () => {
    const before = withExpose();
    const total = (s: BattleState) => s.hand.length + s.deck.length + s.discard.length;
    const s = execute(planAll(before, { hero: guard }));
    const erased = eventsOf(s, 'cardErased');
    expect(erased).toHaveLength(1);
    expect(erased[0].enemyId).toBe('enemy0');
    expect(s.hand.some((c) => c.uid === erased[0].cardUid)).toBe(false);
    expect(s.discard.some((c) => c.uid === erased[0].cardUid)).toBe(false);
    expect(s.deck.some((c) => c.uid === erased[0].cardUid)).toBe(false);
    expect(total(s)).toBe(total(before) - 1);
  });

  it('手札が空なら、何も消さない', () => {
    const s0 = withExpose();
    const s = execute(planAll({ ...s0, hand: [], deck: [], discard: [] }, { hero: guard }));
    expect(eventsOf(s, 'cardErased')).toHaveLength(0);
  });
});
