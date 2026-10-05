import { describe, expect, it } from 'vitest';
import { chargingAction, declineExtra, runUntilInput } from '../../src/core';
import type { BattleState, EnemyActionDef } from '../../src/core';
import { DISTORTED_BEAST, SKILLS } from '../../src/data';
import { ally, attackOn, battle, eventsOf, execute, guard, planAll } from './helpers';

const sweep = DISTORTED_BEAST.actions.find((a) => a.id === 'sweep')!;
const slam = DISTORTED_BEAST.actions.find((a) => a.id === 'slam')!;
const roar = DISTORTED_BEAST.actions.find((a) => a.id === 'roar')!;

/** ボスの行動を限定した戦闘。主人公（雷が使える）は速く、ボスより先に動く */
function bossWith(actions: EnemyActionDef[]): BattleState {
  return battle({
    allies: [ally('hero', { spd: 50, hp: 999, mag: 16 }, [SKILLS.thunder])],
    enemies: [{ ...DISTORTED_BEAST, stats: { ...DISTORTED_BEAST.stats, spd: 1 }, actions }],
  });
}

describe('ボスの大技の予告（ため）', () => {
  it('全体攻撃は、まず力をためる（そのラウンドは攻撃しない）', () => {
    const s = execute(planAll(bossWith([sweep]), { hero: guard }));
    expect(eventsOf(s, 'charge')).toEqual([{ type: 'charge', enemyId: 'enemy0', actionId: 'sweep', name: '薙ぎ払い' }]);
    expect(eventsOf(s, 'damage')).toHaveLength(0);
    expect(chargingAction(s.enemies[0])?.id).toBe('sweep');
  });

  it('次の自分の行動で、ためていた大技を放つ', () => {
    let s = execute(planAll(bossWith([sweep]), { hero: guard }));
    s = execute(planAll(s, { hero: guard }));
    expect(eventsOf(s, 'action').filter((e) => e.actorIds[0] === 'enemy0').map((e) => e.actionId)).toEqual(['sweep']);
    expect(eventsOf(s, 'damage').some((d) => d.targetId === 'hero')).toBe(true);
    expect(s.enemies[0].charging).toBeNull();
  });

  it('単体攻撃（叩きつけ）はためずにすぐ使う', () => {
    const s = execute(planAll(bossWith([slam]), { hero: guard }));
    expect(eventsOf(s, 'charge')).toHaveLength(0);
    expect(eventsOf(s, 'action').some((e) => e.actionId === 'slam')).toBe(true);
  });

  it('ためている間にダウンさせると、ためが解けて大技は来ない', () => {
    let s = execute(planAll(bossWith([sweep]), { hero: guard }));
    s.enemies[0].weaknesses = ['thunder'];
    s = execute(planAll(s, { hero: { type: 'skill', skillId: 'thunder', target: { kind: 'enemy', id: 'enemy0' } } }));
    expect(eventsOf(s, 'chargeBroken')).toEqual([{ type: 'chargeBroken', enemyId: 'enemy0', reason: 'down' }]);
    s = runUntilInput(declineExtra(s));
    expect(eventsOf(s, 'standUp')).toHaveLength(1);
    expect(eventsOf(s, 'action').some((e) => e.actionId === 'sweep')).toBe(false);
  });

  it('ためている大技の部位を壊すと、その場でためが解ける', () => {
    let s = execute(planAll(bossWith([roar]), { hero: guard }));
    expect(s.enemies[0].charging).toBe('roar');
    s.enemies[0].actions = [roar, slam];
    s.enemies[0].parts[1].hp = 1;
    s = execute(planAll(s, { hero: attackOn('enemy0', 'horn') }));
    expect(eventsOf(s, 'chargeBroken')).toEqual([{ type: 'chargeBroken', enemyId: 'enemy0', reason: 'sealed' }]);
    expect(eventsOf(s, 'action').some((e) => e.actionId === 'roar')).toBe(false);
  });
});
