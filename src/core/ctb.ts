import { CT_BASE } from '../data/constants';

/** 行動の後に加算する待ち時間 = ceil(100 ÷ 速さ × 重さ) */
export function ctDelay(spd: number, weight: number): number {
  // 1.1 * 100 = 110.00000000000001 のような誤差で切り上がらないようにする
  return Math.ceil((CT_BASE / spd) * weight - 1e-9);
}

export interface CtEntry {
  id: string;
  side: 'ally' | 'enemy';
  spd: number;
  ct: number;
}

/**
 * 行動順の比較。CTが小さい者が先。同じなら味方優先、その次は速さの高い順。
 * それでも同じなら並び順（味方 → 敵の登録順）を保つ。
 */
export function compareTurnOrder(a: CtEntry, b: CtEntry): number {
  if (a.ct !== b.ct) return a.ct - b.ct;
  if (a.side !== b.side) return a.side === 'ally' ? -1 : 1;
  return b.spd - a.spd;
}

/** 次に行動する者。entries は並び順を保ったまま渡す */
export function pickNext<T extends CtEntry>(entries: readonly T[]): T | undefined {
  let best: T | undefined;
  for (const e of entries) {
    if (!best || compareTurnOrder(e, best) < 0) best = e;
  }
  return best;
}
