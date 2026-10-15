import { describe, expect, it } from 'vitest';
import { ally, attackOn, battle, enemy, eventsOf, execute, guard, planAll } from './helpers';

// 負け戦（段階40。2-3 のカイ）：決まったラウンドか、敵の HP が決まった割合を切った所で打ち切る。勝ちも全滅もない
describe('負け戦の打ち切り（段階40）', () => {
  it('決まったラウンドの終わりで打ち切る（次のラウンドは始まらない）', () => {
    let s = battle({ cutoff: { rounds: 2, enemyHpRatio: 0.5 } });
    s = execute(planAll(s, { hero: guard }));
    expect(s.outcome).toBe('ongoing');
    s = execute(planAll(s, { hero: guard }));
    expect(s.outcome).toBe('cutoff');
    expect(s.phase).toBe('ended');
    expect(s.round).toBe(2);
    expect(eventsOf(s, 'battleEnd')).toEqual([{ type: 'battleEnd', outcome: 'cutoff' }]);
  });

  it('敵の HP が決まった割合を切ったら、その場で打ち切る（倒しても勝ちにならない）', () => {
    let s = battle({ allies: [ally('hero', { atk: 999, spd: 50 })], enemies: [enemy('kai', { hp: 100, def: 0 })], cutoff: { rounds: 9, enemyHpRatio: 0.5 } });
    s = execute(planAll(s, { hero: attackOn('enemy0') }));
    expect(s.outcome).toBe('cutoff');
    expect(s.round).toBe(1);
  });

  it('仲間が全員倒れても、全滅ではなく打ち切り', () => {
    const strong = enemy('kai', { atk: 999, spd: 50 }, { actions: [{ id: 'cut', name: 'cut', target: 'allies', type: 'physical', power: 99, weight: 1 }] });
    let s = battle({ allies: [ally('hero', { hp: 10 })], enemies: [strong], cutoff: { rounds: 9, enemyHpRatio: 0.5 } });
    s = execute(planAll(s, { hero: guard }));
    expect(s.outcome).toBe('cutoff');
  });

  it('打ち切りのない戦闘は今までどおり（勝ち）', () => {
    let s = battle({ allies: [ally('hero', { atk: 999, spd: 50 })], enemies: [enemy('dummy', { hp: 10, def: 0 })] });
    s = execute(planAll(s, { hero: attackOn('enemy0') }));
    expect(s.outcome).toBe('victory');
  });
});
