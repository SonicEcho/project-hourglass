import { HAND_SIZE } from '../data/constants';
import { shuffleInPlace } from './rng';
import type { BattleState } from './types';

/**
 * 手札を n 枚引く（s を書き換える）。山札が尽きたら捨て札をシャッフルして山札に戻す。
 * 山札も捨て札も空なら、引ける分だけ引く。
 */
export function drawCards(s: BattleState, n: number): void {
  const drawn: number[] = [];
  for (let i = 0; i < n; i++) {
    if (s.deck.length === 0) {
      if (s.discard.length === 0) break;
      s.deck = s.discard;
      s.discard = [];
      shuffleInPlace(s, s.deck);
      s.log.push({ type: 'reshuffle', count: s.deck.length });
    }
    const card = s.deck.shift()!;
    s.hand.push(card);
    drawn.push(card.uid);
  }
  if (drawn.length > 0) s.log.push({ type: 'draw', cardUids: drawn });
}

/** 手札を HAND_SIZE 枚まで補充する */
export function refillHand(s: BattleState): void {
  const need = HAND_SIZE - s.hand.length;
  if (need > 0) drawCards(s, need);
}

/** 手札をすべて捨て札へ */
export function discardHand(s: BattleState): void {
  if (s.hand.length === 0) return;
  s.log.push({ type: 'discardHand', cardUids: s.hand.map((c) => c.uid) });
  s.discard.push(...s.hand);
  s.hand = [];
}
