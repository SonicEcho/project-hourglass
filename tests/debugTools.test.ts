import { describe, expect, it } from 'vitest';
import { advanceToPlayerTurn, applyAction, createBattle } from '../src/core';
import { createEncounterSetup } from '../src/data';
import { formatBattleLog, formatLogEvent } from '../src/debug/battleLog';
import { healAllAllies, setEnemyHpToOne } from '../src/debug/cheats';

describe('デバッグ：チート', () => {
  it('味方を全回復する', () => {
    const s0 = createBattle(createEncounterSetup('battle1', 1));
    s0.allies[0].hp = 0;
    s0.allies[1].mp = 3;
    const s = healAllAllies(s0);
    expect(s.allies.map((a) => [a.hp, a.mp])).toEqual(s.allies.map((a) => [a.maxHp, a.maxMp]));
    expect(s0.allies[0].hp).toBe(0); // 元の状態は変えない
  });

  it('選んだ敵のHPを1にする。倒れた敵には効かない', () => {
    const s0 = createBattle(createEncounterSetup('battle1', 1));
    s0.enemies[2].hp = 0;
    const s = setEnemyHpToOne(setEnemyHpToOne(s0, 'enemy0'), 'enemy2');
    expect(s.enemies.map((e) => e.hp)).toEqual([1, 110, 0]);
  });
});

describe('デバッグ：戦闘ログ', () => {
  it('誰が何をして、何ダメージ、CTがどう動いたかを文字にする', () => {
    let s = advanceToPlayerTurn(createBattle(createEncounterSetup('battle2', 3)));
    const actor = s.turn!.actorId;
    s = applyAction(s, { type: 'attack', target: { kind: 'enemy', id: 'enemy0', partId: 'horn' } });
    const lines = formatBattleLog(s);
    expect(lines[0]).toBe('戦闘開始（シード 3）');
    expect(lines.some((l) => l.startsWith(`── ${s.allies.find((a) => a.uid === actor)!.name}の手番`))).toBe(true);
    expect(lines.some((l) => /：通常攻撃　CT \d+→\d+/.test(l))).toBe(true);
    expect(lines.some((l) => /歪みの獣（角）に 部位に\d+・本体に\d+ダメージ/.test(l))).toBe(true);
    expect(lines.some((l) => /^  5枚引いた（.+）$/.test(l))).toBe(true);
  });

  it('すべての出来事を文字にできる', () => {
    const s = createBattle(createEncounterSetup('battle1', 1));
    expect(formatLogEvent(s, { type: 'weaknessFound', enemyId: 'enemy0', element: 'fire' })).toBe('  スライムの弱点「火」が判明');
    expect(formatLogEvent(s, { type: 'battleEnd', outcome: 'defeat' })).toBe('戦闘終了：敗北');
    expect(formatLogEvent(s, { type: 'standUp', enemyId: 'enemy1', ct: [{ unitId: 'enemy1', before: 6, after: 12 }] })).toBe(
      'フロストバットは立ち上がった　CT 6→12',
    );
  });
});
