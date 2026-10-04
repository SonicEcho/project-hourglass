import type { BattleState, CtChange, LogEvent } from '../core';
import { findUnit } from '../core';
import { ELEMENT_LABEL } from '../ui/labels';

// 戦闘ログ（誰が何をして、何ダメージ、CTがどう動いたか）を文字にする

function name(s: BattleState, id: string): string {
  return findUnit(s, id)?.name ?? id;
}

function cardName(s: BattleState, uid: number): string {
  const c = [...s.deck, ...s.hand, ...s.discard].find((x) => x.uid === uid);
  return c?.card.name ?? `#${uid}`;
}

function partName(s: BattleState, enemyId: string, partId: string): string {
  return s.enemies.find((e) => e.uid === enemyId)?.parts.find((p) => p.id === partId)?.name ?? partId;
}

function ctText(s: BattleState, changes: CtChange[], single: boolean): string {
  if (changes.length === 0) return '（CT変化なし）';
  return changes.map((c) => `${single ? '' : name(s, c.unitId)}CT ${c.before}→${c.after}`).join('、');
}

export function formatLogEvent(s: BattleState, e: LogEvent): string {
  switch (e.type) {
    case 'battleStart':
      return `戦闘開始（シード ${e.seed}）`;
    case 'turnStart':
      return `── ${name(s, e.actorId)}の手番（CT ${e.ct}）`;
    case 'action':
      return `${name(s, e.actorId)}：${e.name}　${ctText(s, e.ct, e.ct.length === 1)}`;
    case 'damage': {
      const target = e.partId ? `${name(s, e.targetId)}（${partName(s, e.targetId, e.partId)}）` : name(s, e.targetId);
      const part = e.partAmount !== undefined ? ` 部位に${e.partAmount}・本体に${e.amount}` : ` ${e.amount}`;
      const tag = e.affinity === 'weak' ? ' WEAK' : e.affinity === 'resist' ? ' 耐性' : '';
      return `  ${target}に${part}ダメージ${tag}（残りHP ${e.hpAfter}）`;
    }
    case 'heal':
      return `  ${name(s, e.targetId)}が${e.amount}回復（HP ${e.hpAfter}）`;
    case 'weaknessFound':
      return `  ${name(s, e.enemyId)}の弱点「${ELEMENT_LABEL[e.element]}」が判明`;
    case 'down':
      return `  ${name(s, e.enemyId)}がダウン`;
    case 'standUp':
      return `${name(s, e.enemyId)}は立ち上がった　${ctText(s, e.ct, true)}`;
    case 'oneMore':
      return `  ONE MORE（${name(s, e.actorId)}）`;
    case 'baton':
      return `${name(s, e.fromId)}→${name(s, e.toId)} バトンタッチ`;
    case 'guard':
      return `  ${name(s, e.actorId)}は防御`;
    case 'partBreak':
      return `  ${name(s, e.enemyId)}の${partName(s, e.enemyId, e.partId)}を破壊`;
    case 'defeated':
      return `  ${name(s, e.unitId)}は倒れた`;
    case 'draw':
      return `  ${e.cardUids.length}枚引いた（${e.cardUids.map((u) => cardName(s, u)).join('、')}）`;
    case 'discardHand':
      return `  手札${e.cardUids.length}枚を捨てた`;
    case 'retrieve':
      return `  捨て札から${cardName(s, e.cardUid)}を手札へ`;
    case 'reshuffle':
      return `  捨て札${e.count}枚をシャッフルして山札へ`;
    case 'battleEnd':
      return `戦闘終了：${e.outcome === 'victory' ? '勝利' : '敗北'}`;
  }
}

export function formatBattleLog(s: BattleState): string[] {
  return s.log.map((e) => formatLogEvent(s, e));
}
