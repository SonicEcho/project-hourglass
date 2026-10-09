import type { BattleState, LogEvent } from '../core';
import { findUnit } from '../core';
import { ELEMENT_LABEL } from '../ui/labels';

// 戦闘ログ（ラウンドごとに、誰が何をして、何ダメージか）を文字にする

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

function names(s: BattleState, ids: string[]): string {
  return ids.map((id) => name(s, id)).join('と');
}

export function formatLogEvent(s: BattleState, e: LogEvent): string {
  switch (e.type) {
    case 'battleStart':
      return `戦闘開始（シード ${e.seed}）`;
    case 'roundStart':
      return `══ ラウンド ${e.round}`;
    case 'roundEnd':
      return `── ラウンド ${e.round} 終わり`;
    case 'action':
      return `${e.extra ? '★追加行動 ' : ''}${names(s, e.actorIds)}：${e.name}`;
    case 'cancel':
      return `${names(s, e.actorIds)}の行動は取り消し（${e.reason === 'dead' ? '先に倒れた' : 'MPが足りない'}）`;
    case 'support':
      return `サポート：${e.name}${e.targetId ? `（${name(s, e.targetId)}）` : ''}`;
    case 'search':
      return `  サーチ：${e.shownUids.map((u) => cardName(s, u)).join('、')}から${cardName(s, e.pickedUid)}を手札へ`;
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
      return `${name(s, e.enemyId)}は立ち上がった（行動できない）`;
    case 'charge':
      return `${name(s, e.enemyId)}は力をためている（次の行動で${e.name}）`;
    case 'chargeBroken':
      return `  ${name(s, e.enemyId)}のためが解けた（${e.reason === 'down' ? 'ダウン' : '部位破壊で封じた'}）`;
    case 'enraged':
      return `${name(s, e.enemyId)}は怒っている（ためずに攻撃）`;
    case 'linkReady':
      return '  つながりゲージが満タン（連携技を使える）';
    case 'oneMore':
      return `  Extend（${name(s, e.actorId)}）`;
    case 'baton':
      return `${name(s, e.fromId)}→${name(s, e.toId)} バトンタッチ`;
    case 'guard':
      return `  ${name(s, e.actorId)}は防御`;
    case 'passiveHp':
      return e.source === 'bug'
        ? `  ${name(s, e.allyId)}は狂いで${-e.amount}ダメージ（HP ${e.hpAfter}）`
        : `  ${name(s, e.allyId)}はファーストエイドで${e.amount}回復（HP ${e.hpAfter}）`;
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
