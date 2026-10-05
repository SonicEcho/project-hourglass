import { describe, expect, it } from 'vitest';
import { getPlanError, getRoundOrder, startExecution, step } from '../../src/core';
import { CARDS, SKILLS } from '../../src/data';
import { ally, attackOn, battle, enemy, eventsOf, execute, guard, planAll, withHand } from './helpers';

describe('勝敗', () => {
  it('敵を全滅させると勝利', () => {
    const s = execute(planAll(battle({ allies: [ally('hero'), ally('mio')], enemies: [enemy('a', { hp: 1 }), enemy('b', { hp: 1 })] }), {
      hero: attackOn('enemy0'),
      mio: attackOn('enemy1'),
    }));
    expect(s.outcome).toBe('victory');
    expect(s.phase).toBe('ended');
    expect(eventsOf(s, 'battleEnd')).toEqual([{ type: 'battleEnd', outcome: 'victory' }]);
  });

  it('味方のHPがすべて0になると敗北', () => {
    const s = execute(
      planAll(
        battle({
          allies: [ally('hero', { hp: 1 }), ally('mio', { hp: 1 })],
          enemies: [enemy('e', { spd: 99, atk: 99 }, { actions: [{ id: 'all', name: 'all', target: 'allies', type: 'physical', power: 50, weight: 1 }] })],
        }),
        { hero: guard, mio: guard },
      ),
    );
    expect(s.outcome).toBe('defeat');
    expect(eventsOf(s, 'battleEnd')).toEqual([{ type: 'battleEnd', outcome: 'defeat' }]);
  });

  it('倒した敵は狙えず、行動順から外れる', () => {
    const s = execute(planAll(battle({ allies: [ally('hero')], enemies: [enemy('a', { hp: 1 }), enemy('b')] }), { hero: attackOn('enemy0') }));
    expect(getRoundOrder(s).some((e) => e.ids.includes('enemy0'))).toBe(false);
    expect(getPlanError(s, 'hero', attackOn('enemy0'))).not.toBeNull();
  });

  it('狙っていた敵が先に倒れていたら、残っている敵に向け直す', () => {
    const s = execute(
      planAll(battle({ allies: [ally('hero', { spd: 20 }), ally('mio', { spd: 10 })], enemies: [enemy('a', { hp: 1 }), enemy('b')] }), {
        hero: attackOn('enemy0'),
        mio: attackOn('enemy0'),
      }),
    );
    const mioHit = eventsOf(s, 'damage').find((d) => d.sourceId === 'mio')!;
    expect(mioHit.targetId).toBe('enemy1');
  });

  it('自分の番の前にHPが0になった味方の行動は取り消し、カードは手札に残る', () => {
    let s = withHand(
      battle({
        allies: [ally('hero', { hp: 1, spd: 1 }), ally('mio', { hp: 999, spd: 1 })],
        enemies: [enemy('e', { spd: 99, atk: 99 }, { actions: [{ id: 'all', name: 'all', target: 'allies', type: 'physical', power: 50, weight: 1 }] })],
      }),
      [CARDS.sword],
    );
    const uid = s.hand[0].uid;
    s = execute(planAll(s, { hero: { type: 'card', cardUid: uid, target: { kind: 'enemy', id: 'enemy0' } }, mio: guard }));
    expect(eventsOf(s, 'cancel')).toEqual([{ type: 'cancel', actorIds: ['hero'], reason: 'dead' }]);
    expect(s.hand.some((c) => c.uid === uid)).toBe(true);
    expect(getRoundOrder(s).some((e) => e.ids.includes('hero'))).toBe(false);
  });

  it('回復の対象が先に倒れていたら何も起きない（試作では蘇生手段なし）', () => {
    let s = battle({
      allies: [ally('akari', { spd: 1, mag: 20 }, [SKILLS.care]), ally('mio', { hp: 1, spd: 1 })],
      enemies: [enemy('e', { spd: 99, atk: 99 }, { actions: [{ id: 'all', name: 'all', target: 'allies', type: 'physical', power: 5, weight: 1 }] })],
    });
    s.allies[0].hp = 999;
    s = startExecution(planAll(s, { akari: { type: 'skill', skillId: 'care', target: { kind: 'ally', id: 'mio' } }, mio: guard }));
    while (s.phase === 'execute' && s.round === 1) s = step(s);
    expect(s.allies[1].hp).toBe(0);
    expect(eventsOf(s, 'heal')).toHaveLength(0);
  });
});
