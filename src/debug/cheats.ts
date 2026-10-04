import type { BattleState } from '../core';

// デバッグメニュー用の操作。戦闘の状態を受け取り、新しい状態を返す

/** 味方を全回復する（HP・MP。HPが0の味方も戻る） */
export function healAllAllies(state: BattleState): BattleState {
  const s = structuredClone(state);
  for (const a of s.allies) {
    a.hp = a.maxHp;
    a.mp = a.maxMp;
  }
  return s;
}

/** 指定した敵のHPを1にする（倒れている敵には効かない） */
export function setEnemyHpToOne(state: BattleState, enemyId: string): BattleState {
  const s = structuredClone(state);
  const e = s.enemies.find((x) => x.uid === enemyId);
  if (e && e.hp > 0) e.hp = 1;
  return s;
}
