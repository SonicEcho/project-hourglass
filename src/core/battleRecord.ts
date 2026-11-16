// 戦い方の記録（段階222。docs/milestones/M3_detours.md。武器の寄り道④の条件）。Phaser に依存しない。
// 物語の変数（vars）の `戦い方:<記録>:<仲間>` に、仲間ごとに覚える（セーブの形を変えない）。数えるのは、その戦闘に出ていた仲間の分
import type { ChainState } from './chain';
import { chainEnemyDef } from './chain';

/**
 * 記録の種類：
 * - bossParts：ぬし・ボスの部位を全部壊して勝った回数
 * - noFall：誰も倒れずに勝った回数
 * - pushMax：1つの戦闘で、その仲間が敵の予定を押した数の一番多い記録
 * - whiffMax：1つの戦闘で、敵の行動が空振りした数（ダウンしていて起きなかった・ラウンドの外へ押し出した）の一番多い記録
 */
export type BattleRecordId = 'bossParts' | 'noFall' | 'pushMax' | 'whiffMax';

export function battleRecordKey(record: BattleRecordId, charId: string): string {
  return `戦い方:${record}:${charId}`;
}

export function battleRecord(vars: Readonly<Record<string, string>>, record: BattleRecordId, charId: string): number {
  return Number(vars[battleRecordKey(record, charId)] ?? 0) || 0;
}

/** 部位のある戦闘で、部位を全部壊したか */
export function brokeAllParts(s: ChainState): boolean {
  const parts = s.enemies.filter((e) => chainEnemyDef(s, e.defId)?.part);
  return parts.length > 0 && parts.every((p) => p.hp <= 0 && !p.gone);
}

/** 勝った戦闘を記録に足す（負け・打ち切りは数えない） */
export function recordBattleStyle(vars: Readonly<Record<string, string>>, s: ChainState): Record<string, string> {
  if (s.outcome !== 'win') return { ...vars };
  const out: Record<string, string> = { ...vars };
  const t = s.tally;
  const add = (record: BattleRecordId, id: string, n: number) => (out[battleRecordKey(record, id)] = String(battleRecord(out, record, id) + n));
  const max = (record: BattleRecordId, id: string, n: number) => {
    if (n > battleRecord(out, record, id)) out[battleRecordKey(record, id)] = String(n);
  };
  const ids = [...new Set(s.allies.map((a) => a.defId))];
  for (const id of ids) {
    if (s.def.boss && brokeAllParts(s)) add('bossParts', id, 1);
    if (!t?.allyFell) add('noFall', id, 1);
    max('pushMax', id, t?.push[id] ?? 0);
    max('whiffMax', id, t?.whiffs ?? 0);
  }
  return out;
}
