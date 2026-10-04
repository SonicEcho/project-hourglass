import { describe, expect, it } from 'vitest';
import { applyAction, batonTargets, createBattle, getActionError, startNextTurn } from '../../src/core';
import { SKILLS } from '../../src/data';
import { ally, enemy, eventsOf, setup } from './helpers';

function battle() {
  return startNextTurn(
    createBattle(
      setup({
        allies: [
          ally('hero', { spd: 50 }, [SKILLS.fire]),
          ally('akari', { spd: 5, mag: 20 }, [SKILLS.care]),
          ally('mio', { spd: 5 }, []),
        ],
        enemies: [enemy('a', {}, { weaknesses: ['fire'] })],
      }),
    ),
  );
}

const fire = { type: 'skill' as const, skillId: 'fire', target: { kind: 'enemy' as const, id: 'enemy0' } };

describe('バトンタッチ', () => {
  it('ワンモア中でなければ選べない', () => {
    const s = battle();
    expect(getActionError(s, { type: 'baton', toAllyId: 'akari' })).not.toBeNull();
    expect(batonTargets(s)).toEqual([]);
  });

  it('ワンモア中に選ぶと、指定した仲間がすぐに手番を得る', () => {
    let s = applyAction(battle(), fire);
    expect(batonTargets(s).map((a) => a.uid)).toEqual(['akari', 'mio']);
    const akariCt = s.allies[1].ct;
    s = applyAction(s, { type: 'baton', toAllyId: 'akari' });
    expect(s.turn).toMatchObject({ actorId: 'akari', oneMoreActive: false, oneMoreUsed: false, batonChain: ['hero'] });
    expect(s.allies[1].batonBoost).toBe(true);
    expect(s.allies[1].ct).toBe(akariCt);
    expect(eventsOf(s, 'baton')).toEqual([{ type: 'baton', fromId: 'hero', toId: 'akari' }]);
  });

  it('受け取った仲間の次の行動は回復量が1.25倍', () => {
    let s = applyAction(battle(), fire);
    s = applyAction(s, { type: 'baton', toAllyId: 'akari' });
    s.allies[2].hp = 10;
    s = applyAction(s, { type: 'skill', skillId: 'care', target: { kind: 'ally', id: 'mio' } });
    // 50 × 20 ÷ 20 = 50 → ×1.25 = 62
    expect(eventsOf(s, 'heal')[0].amount).toBe(62);
    expect(s.allies[1].batonBoost).toBe(false);
    // 受け取った仲間の行動は通常の手番として待ち時間を加算する
    expect(eventsOf(s, 'action').at(-1)!.ct).toHaveLength(1);
  });

  it('受け取った仲間の次の行動はダメージが1.25倍', () => {
    const boosted = applyAction(applyAction(battle(), fire), { type: 'baton', toAllyId: 'mio' });
    const normal = structuredClone(boosted);
    normal.allies[2].batonBoost = false;
    const attack = { type: 'attack' as const, target: { kind: 'enemy' as const, id: 'enemy0' } };
    const b = eventsOf(applyAction(boosted, attack), 'damage').at(-1)!.amount;
    const n = eventsOf(applyAction(normal, attack), 'damage').at(-1)!.amount;
    expect(b).toBeGreaterThan(n);
    expect(b).toBeGreaterThanOrEqual(Math.floor(n * 1.25) - 1);
    expect(b).toBeLessThanOrEqual(Math.ceil(n * 1.25) + 1);
  });

  it('自分自身や、バトンを渡してきた仲間には渡せない', () => {
    let s = applyAction(battle(), fire);
    expect(getActionError(s, { type: 'baton', toAllyId: 'hero' })).not.toBeNull();
    s = applyAction(s, { type: 'baton', toAllyId: 'akari' });
    // akari が弱点を突いてワンモア → hero には渡し返せない
    s.allies[1].skills = [SKILLS.fire];
    s.enemies[0].down = false;
    s = applyAction(s, fire);
    expect(s.turn?.oneMoreActive).toBe(true);
    expect(batonTargets(s).map((a) => a.uid)).toEqual(['mio']);
  });

  it('HPが0の仲間には渡せない', () => {
    const s = applyAction(battle(), fire);
    s.allies[2].hp = 0;
    expect(getActionError(s, { type: 'baton', toAllyId: 'mio' })).not.toBeNull();
  });
});
