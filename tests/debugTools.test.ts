import { describe, expect, it } from 'vitest';
import { createBattle, runUntilInput, setPlan, startExecution } from '../src/core';
import { createEncounterSetup } from '../src/data';
import { formatBattleLog, formatLogEvent } from '../src/debug/battleLog';
import { healAllAllies, setEnemyHpToOne } from '../src/debug/cheats';
import { weightLabel } from '../src/ui/labels';

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
  it('ラウンドごとに、誰が何をして、何ダメージかを文字にする', () => {
    let s = createBattle(createEncounterSetup('battle2', 3));
    s = setPlan(s, 'hero', { type: 'attack', target: { kind: 'enemy', id: 'enemy0', partId: 'horn' } });
    s = setPlan(s, 'akari', { type: 'guard' });
    s = setPlan(s, 'mio', { type: 'guard' });
    s = runUntilInput(startExecution(s));
    const lines = formatBattleLog(s);
    expect(lines[0]).toBe('戦闘開始（シード 3）');
    expect(lines).toContain('══ ラウンド 1');
    expect(lines.some((l) => /^  5枚引いた（.+）$/.test(l))).toBe(true);
    expect(lines).toContain('主人公：通常攻撃');
    expect(lines.some((l) => /歪みの獣（角）に 部位に\d+・本体に\d+ダメージ/.test(l))).toBe(true);
    expect(lines).toContain('── ラウンド 1 終わり');
  });

  it('すべての出来事を文字にできる', () => {
    const s = createBattle(createEncounterSetup('battle1', 1));
    expect(formatLogEvent(s, { type: 'weaknessFound', enemyId: 'enemy0', element: 'fire' })).toBe('  スライムの弱点「火」が判明');
    expect(formatLogEvent(s, { type: 'battleEnd', outcome: 'defeat' })).toBe('戦闘終了：敗北');
    expect(formatLogEvent(s, { type: 'standUp', enemyId: 'enemy1' })).toBe('フロストバットは立ち上がった（行動できない）');
    expect(formatLogEvent(s, { type: 'action', actorIds: ['hero', 'mio'], actionId: 'crossDrive', name: 'クロスドライブ', extra: false })).toBe(
      '主人公とみお：クロスドライブ',
    );
    expect(formatLogEvent(s, { type: 'action', actorIds: ['akari'], actionId: 'care', name: 'ケア', extra: true })).toBe('★追加行動 あかり：ケア');
    expect(formatLogEvent(s, { type: 'cancel', actorIds: ['mio'], reason: 'dead' })).toBe('みおの行動は取り消し（先に倒れた）');
  });
});

describe('重さの表示', () => {
  it('重さを軽い・普通・重い・超重いで表す', () => {
    expect([0.4, 0.5, 0.6, 0.8, 1.0, 1.2, 1.3, 1.5, 1.6].map(weightLabel)).toEqual([
      '軽い',
      '軽い',
      '軽い',
      '普通',
      '普通',
      '重い',
      '重い',
      '超重い',
      '超重い',
    ]);
  });
});
