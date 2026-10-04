import { describe, expect, it } from 'vitest';
import {
  advanceToPlayerTurn,
  applyAction,
  createBattle,
  getActionError,
  getTurnForecast,
  runEnemyTurn,
  startNextTurn,
} from '../../src/core';
import { CARDS } from '../../src/data';
import { ally, enemy, eventsOf, setup } from './helpers';

describe('勝敗', () => {
  it('敵を全滅させると勝利', () => {
    const s0 = startNextTurn(
      createBattle(setup({ allies: [ally('hero', { spd: 50 })], enemies: [enemy('a', { hp: 1 }), enemy('b', { hp: 1 })] })),
    );
    let s = applyAction(s0, { type: 'attack', target: { kind: 'enemy', id: 'enemy0' } });
    expect(s.outcome).toBe('ongoing');
    expect(eventsOf(s, 'defeated')).toEqual([{ type: 'defeated', unitId: 'enemy0' }]);
    s = advanceToPlayerTurn(s);
    s = applyAction(s, { type: 'attack', target: { kind: 'enemy', id: 'enemy1' } });
    expect(s.outcome).toBe('victory');
    expect(s.turn).toBeNull();
    expect(eventsOf(s, 'battleEnd')).toEqual([{ type: 'battleEnd', outcome: 'victory' }]);
    expect(() => startNextTurn(s)).toThrow();
  });

  it('倒した敵は狙えず、行動順から外れる', () => {
    let s = startNextTurn(
      createBattle(setup({ allies: [ally('hero', { spd: 50 })], enemies: [enemy('a', { hp: 1 }), enemy('b')] })),
    );
    s = applyAction(s, { type: 'attack', target: { kind: 'enemy', id: 'enemy0' } });
    expect(getTurnForecast(s).some((e) => e.id === 'enemy0')).toBe(false);
    s = startNextTurn(s);
    expect(getActionError(s, { type: 'attack', target: { kind: 'enemy', id: 'enemy0' } })).not.toBeNull();
  });

  it('味方3人のHPがすべて0になると敗北', () => {
    let s = createBattle(
      setup({
        allies: [ally('hero', { hp: 1, spd: 1 }), ally('akari', { hp: 1, spd: 1 }), ally('mio', { hp: 1, spd: 1 })],
        enemies: [
          enemy('e', { spd: 99, atk: 99 }, { actions: [{ id: 'all', name: 'all', target: 'allies', type: 'physical', power: 50, weight: 1 }] }),
        ],
      }),
    );
    s = advanceToPlayerTurn(s);
    expect(s.outcome).toBe('defeat');
    expect(s.allies.every((a) => a.hp === 0)).toBe(true);
    expect(eventsOf(s, 'battleEnd')).toEqual([{ type: 'battleEnd', outcome: 'defeat' }]);
  });

  it('HPが0になった味方は行動順から外れ、敵の対象にもならない', () => {
    let s = createBattle(
      setup({
        allies: [ally('hero', { hp: 999, spd: 5 }), ally('mio', { hp: 999, spd: 6 })],
        enemies: [enemy('e', { spd: 50 })],
      }),
    );
    s.allies[1].hp = 0;
    expect(getTurnForecast(s).some((e) => e.id === 'mio')).toBe(false);
    for (let i = 0; i < 10; i++) {
      s = startNextTurn(s);
      if (s.turn?.actorId !== 'enemy0') break;
      s = runEnemyTurn(s);
    }
    const targets = eventsOf(s, 'damage').map((e) => e.targetId);
    expect(targets.length).toBeGreaterThan(0);
    expect(targets.every((t) => t === 'hero')).toBe(true);
    expect(eventsOf(s, 'turnStart').some((e) => e.actorId === 'mio')).toBe(false);
  });

  it('HPが0の味方は回復できない（試作では蘇生手段なし）', () => {
    const s = startNextTurn(
      createBattle(setup({ deck: Array(20).fill(CARDS.recover), allies: [ally('hero', { spd: 50 }), ally('mio')] })),
    );
    s.allies[1].hp = 0;
    expect(getActionError(s, { type: 'card', cardUid: s.hand[0].uid, target: { kind: 'ally', id: 'mio' } })).not.toBeNull();
    expect(getActionError(s, { type: 'card', cardUid: s.hand[0].uid, target: { kind: 'ally', id: 'hero' } })).toBeNull();
  });
});
