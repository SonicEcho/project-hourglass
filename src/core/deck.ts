import { HAND_SIZE } from '../data/constants';
import { shuffleInPlace } from './rng';
import type { BattleState, CardInstance } from './types';

/** 山札の上から1枚取る。山札が尽きたら捨て札をシャッフルして山札に戻す。どちらも空なら undefined */
function takeOne(s: BattleState): CardInstance | undefined {
  if (s.deck.length === 0) {
    if (s.discard.length === 0) return undefined;
    s.deck = s.discard;
    s.discard = [];
    shuffleInPlace(s, s.deck);
    s.log.push({ type: 'reshuffle', count: s.deck.length });
  }
  return s.deck.shift();
}

/** 山札の上から n 枚取り出す（手札には加えない）。サーチ用 */
export function takeFromDeck(s: BattleState, n: number): CardInstance[] {
  const out: CardInstance[] = [];
  for (let i = 0; i < n; i++) {
    const c = takeOne(s);
    if (!c) break;
    out.push(c);
  }
  return out;
}

/**
 * 手札を n 枚引く（s を書き換える）。山札が尽きたら捨て札をシャッフルして山札に戻す。
 * 山札も捨て札も空なら、引ける分だけ引く。
 */
export function drawCards(s: BattleState, n: number): void {
  const drawn = takeFromDeck(s, n);
  s.hand.push(...drawn);
  if (drawn.length > 0) s.log.push({ type: 'draw', cardUids: drawn.map((c) => c.uid) });
}

/** 手札を HAND_SIZE 枚まで補充する */
export function refillHand(s: BattleState): void {
  const need = HAND_SIZE - s.hand.length;
  if (need > 0) drawCards(s, need);
}

/** 手札から指定したカードを捨て札へ */
export function discardCards(s: BattleState, uids: number[]): void {
  if (uids.length === 0) return;
  const set = new Set(uids);
  const moved = s.hand.filter((c) => set.has(c.uid));
  s.hand = s.hand.filter((c) => !set.has(c.uid));
  s.discard.push(...moved);
}
