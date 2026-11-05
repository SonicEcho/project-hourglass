import { HAND_SIZE } from '../data/constants';
import { shuffleInPlace } from './rng';
import type { BattleState, CardDef, CardInstance } from './types';

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

/** 手札から指定したスナップを捨て札へ（現像が進んでいた札は、撮りたてに戻す。段階155） */
export function discardCards(s: BattleState, uids: number[]): void {
  if (uids.length === 0) return;
  const set = new Set(uids);
  const moved = s.hand.filter((c) => set.has(c.uid));
  s.hand = s.hand.filter((c) => !set.has(c.uid));
  s.discard.push(...moved.map(undevelop));
}

/** 撮りたてに戻す */
export function undevelop(c: CardInstance): CardInstance {
  if (!c.base) return c.stage ? { uid: c.uid, card: c.card } : c;
  return { uid: c.uid, card: c.base };
}

/** その段の中身（0 は撮りたて） */
export function stagedCard(base: CardDef, stage: number): CardDef {
  if (stage <= 0 || !base.develop) return base;
  const over = base.develop.stages[Math.min(stage, 2) - 1];
  return { ...base, ...over, id: base.id };
}

/**
 * 現像を進める（段階155）：ラウンドの始めに、手札に残っている現像する札の段を1つ進める（焼き付けで止まる）。
 * 新しく引く前に呼ぶ（引いたばかりの札は撮りたて）
 */
export function developHand(s: BattleState): void {
  s.hand = s.hand.map((c) => {
    const base = c.base ?? c.card;
    if (!base.develop) return c;
    const stage = Math.min(2, (c.stage ?? 0) + 1);
    if (stage === (c.stage ?? 0)) return c;
    s.log.push({ type: 'develop', cardUid: c.uid, name: base.name, stage });
    return { uid: c.uid, card: stagedCard(base, stage), stage, base };
  });
}
