import { describe, expect, it } from 'vitest';
import { chargingAction, declineExtra, runUntilInput } from '../../src/core';
import type { BattleState, EnemyActionDef } from '../../src/core';
import { DISTORTED_BEAST, SKILLS } from '../../src/data';
import { ally, attackOn, battle, eventsOf, execute, guard, planAll } from './helpers';

const sweep = DISTORTED_BEAST.actions.find((a) => a.id === 'sweep')!;
const slam = DISTORTED_BEAST.actions.find((a) => a.id === 'slam')!;
const roar = DISTORTED_BEAST.actions.find((a) => a.id === 'roar')!;

/** ボスの行動を限定した戦闘。ハルト（雷が使える）は速く、ボスより先に動く */
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

  it('ためをダウンで崩されたボスは怒り、立ち上がった次の行動で、ためずに大技を放つ（その間はダウンしない）', () => {
    const thunder = { type: 'skill', skillId: 'thunder', target: { kind: 'enemy', id: 'enemy0' } } as const;
    // 1ラウンド目：ためる
    let s = execute(planAll(bossWith([sweep]), { hero: guard }));
    s.enemies[0].weaknesses = ['thunder'];
    // 2ラウンド目：弱点でダウン → ためが解けて怒る。ボスは立ち上がりに使う
    s = runUntilInput(declineExtra(execute(planAll(s, { hero: thunder }))));
    expect(s.enemies[0].enraged).toBe(true);
    expect(eventsOf(s, 'standUp')).toHaveLength(1);
    // 3ラウンド目：また弱点を突いてもダウンしない。ボスは、ためずに薙ぎ払いを放つ
    const before = s.log.length;
    s = execute(planAll(s, { hero: thunder }));
    const round3 = s.log.slice(before);
    expect(round3.some((e) => e.type === 'down')).toBe(false);
    expect(round3.some((e) => e.type === 'charge')).toBe(false);
    expect(round3.filter((e) => e.type === 'enraged')).toEqual([{ type: 'enraged', enemyId: 'enemy0' }]);
    expect(round3.some((e) => e.type === 'action' && e.actionId === 'sweep')).toBe(true);
    expect(round3.some((e) => e.type === 'damage' && e.targetId === 'hero')).toBe(true);
    expect(s.enemies[0].enraged).toBe(false);
    // 4ラウンド目：怒りは解け、また普通にためる
    s = execute(planAll(s, { hero: guard }));
    expect(s.enemies[0].charging).toBe('sweep');
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

describe('アンコール（段階39b。2-2 のアンプのぬし）', () => {
  const encore: EnemyActionDef = { id: 'encore', name: 'アンコール', target: 'allies', type: 'magic', power: 0, weight: 1, charge: true, encore: true };

  it('まだ大技を放っていない時は選ばない', () => {
    const s = execute(planAll(bossWith([slam, encore]), { hero: guard }));
    expect(eventsOf(s, 'charge')).toHaveLength(0);
    expect(eventsOf(s, 'action').some((e) => e.actionId === 'slam')).toBe(true);
  });

  it('直前に放った大技をもう一度、ためてから放つ', () => {
    let s = execute(planAll(bossWith([sweep]), { hero: guard }));
    s = execute(planAll(s, { hero: guard }));
    expect(s.enemies[0].lastBigMove).toBe('sweep');
    s.enemies[0].actions = [sweep, encore];
    // 行動はでたらめに選ぶので、アンコールが出るまで進める（シードで決まる）
    let found = -1;
    for (let i = 0; i < 12 && found < 0; i++) {
      const before = s.log.length;
      s = execute(planAll(s, { hero: guard }));
      found = s.log.findIndex((e, j) => j >= before && e.type === 'charge' && e.name === 'アンコール：薙ぎ払い');
    }
    expect(found).toBeGreaterThan(-1);
    expect(s.log[found]).toEqual({ type: 'charge', enemyId: 'enemy0', actionId: 'sweep', name: 'アンコール：薙ぎ払い' });
    expect(chargingAction(s.enemies[0])?.id).toBe('sweep');
    const before2 = s.log.length;
    s = execute(planAll(s, { hero: guard }));
    expect(s.log.slice(before2).some((e) => e.type === 'action' && e.actionId === 'sweep')).toBe(true);
  });

  it('もう一度放つ大技の部位が壊れていたら、アンコールも使えない', () => {
    let s = execute(planAll(bossWith([roar]), { hero: guard }));
    s = execute(planAll(s, { hero: guard }));
    expect(s.enemies[0].lastBigMove).toBe('roar');
    s.enemies[0].actions = [roar, encore, slam];
    s.enemies[0].parts[1].hp = 1;
    s = execute(planAll(s, { hero: attackOn('enemy0', 'horn') }));
    expect(s.enemies[0].parts[1].broken).toBe(true);
    // 部位を壊すとよろけて延長になる（段階89）。追加行動は見送る
    s = runUntilInput(declineExtra(s));
    for (let i = 0; i < 4; i++) {
      const before = s.log.length;
      s = execute(planAll(s, { hero: guard }));
      expect(s.log.slice(before).some((e) => e.type === 'charge')).toBe(false);
    }
  });
});
