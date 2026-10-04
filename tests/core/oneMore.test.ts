import { describe, expect, it } from 'vitest';
import { applyAction, createBattle, runEnemyTurn, startNextTurn } from '../../src/core';
import { SKILLS } from '../../src/data';
import { ally, enemy, eventsOf, setup } from './helpers';

const fire = (id: string) => ({ type: 'skill' as const, skillId: 'fire', target: { kind: 'enemy' as const, id } });

function battle() {
  return startNextTurn(
    createBattle(
      setup({
        allies: [ally('hero', { spd: 50 }, [SKILLS.fire, SKILLS.ice])],
        enemies: [enemy('a', {}, { weaknesses: ['fire'] }), enemy('b', {}, { weaknesses: ['fire'] })],
      }),
    ),
  );
}

describe('弱点・ダウン・ワンモア', () => {
  it('弱点を突くと敵がダウンし、同じ味方がもう1回行動できる', () => {
    const s = applyAction(battle(), fire('enemy0'));
    expect(s.enemies[0].down).toBe(true);
    expect(s.turn).toMatchObject({ actorId: 'hero', oneMoreActive: true, oneMoreUsed: true });
    expect(eventsOf(s, 'oneMore')).toHaveLength(1);
    expect(eventsOf(s, 'damage')[0].affinity).toBe('weak');
  });

  it('突いた弱点は判明する', () => {
    const before = battle();
    expect(before.enemies[0].knownWeaknesses).toEqual([]);
    const s = applyAction(before, fire('enemy0'));
    expect(s.enemies[0].knownWeaknesses).toEqual(['fire']);
    expect(s.enemies[1].knownWeaknesses).toEqual([]);
  });

  it('ワンモアの行動は待ち時間を加算しない', () => {
    let s = applyAction(battle(), fire('enemy0'));
    const ct = s.allies[0].ct;
    s = applyAction(s, { type: 'guard' });
    expect(s.allies[0].ct).toBe(ct);
    expect(s.turn).toBeNull();
  });

  it('1回の手番でワンモアは1度まで', () => {
    let s = applyAction(battle(), fire('enemy0'));
    s = applyAction(s, fire('enemy1'));
    expect(s.enemies[1].down).toBe(true);
    expect(s.turn).toBeNull();
    expect(eventsOf(s, 'oneMore')).toHaveLength(1);
  });

  it('次の手番では、またワンモアできる', () => {
    let s = applyAction(battle(), fire('enemy0'));
    s = applyAction(s, { type: 'guard' });
    s = startNextTurn(s);
    expect(s.turn?.actorId).toBe('hero');
    s = applyAction(s, fire('enemy1'));
    expect(s.turn?.oneMoreActive).toBe(true);
  });

  it('ダウン済みの敵の弱点を突いてもワンモアにならない', () => {
    const start = battle();
    start.enemies[0].down = true;
    const s = applyAction(start, fire('enemy0'));
    expect(s.turn).toBeNull();
    expect(eventsOf(s, 'down')).toHaveLength(0);
  });

  it('弱点でない攻撃ではダウンしない', () => {
    const s = applyAction(battle(), { type: 'skill', skillId: 'ice', target: { kind: 'enemy', id: 'enemy0' } });
    expect(s.enemies[0].down).toBe(false);
    expect(s.turn).toBeNull();
  });

  it('弱点で倒した敵はダウンせず、ワンモアにならない', () => {
    const start = battle();
    start.enemies[0].hp = 1;
    const s = applyAction(start, fire('enemy0'));
    expect(s.enemies[0].hp).toBe(0);
    expect(s.enemies[0].down).toBe(false);
    expect(s.turn).toBeNull();
  });

  it('ダウンした敵は、次の手番を立ち上がりに使い行動しない', () => {
    let s = applyAction(battle(), fire('enemy0'));
    s = applyAction(s, { type: 'guard' });
    s.allies[0].ct = 1000; // 敵の手番を先に来させる
    const from = s.log.length;
    const hpBefore = s.allies[0].hp;
    // 敵2体は同じ ct・同じ速さなので、登録順に enemy0 が先
    s = startNextTurn(s);
    expect(s.turn?.actorId).toBe('enemy0');
    const ctBefore = s.enemies[0].ct;
    s = runEnemyTurn(s);
    expect(eventsOf(s, 'standUp', from)).toEqual([
      { type: 'standUp', enemyId: 'enemy0', ct: [{ unitId: 'enemy0', before: ctBefore, after: ctBefore + 100 }] },
    ]);
    expect(eventsOf(s, 'action', from)).toHaveLength(0);
    expect(s.enemies[0].down).toBe(false);
    expect(s.allies[0].hp).toBe(hpBefore);
  });
});
