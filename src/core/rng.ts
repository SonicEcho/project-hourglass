import type { BattleState } from './types';

/**
 * シード付き乱数（mulberry32）。状態を受け取り [0以上1未満の値, 次の状態] を返す。
 */
export function nextRandom(state: number): [number, number] {
  const next = (state + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

/** 戦闘状態の乱数を1つ進めて値を返す（s を書き換える） */
export function random(s: BattleState): number {
  const [value, next] = nextRandom(s.rng);
  s.rng = next;
  return value;
}

/** 0以上 n 未満の整数 */
export function randomInt(s: BattleState, n: number): number {
  return Math.floor(random(s) * n);
}

export function randomPick<T>(s: BattleState, items: readonly T[]): T {
  if (items.length === 0) throw new Error('randomPick: empty list');
  return items[randomInt(s, items.length)];
}

/** Fisher-Yates でその場でシャッフルする */
export function shuffleInPlace<T>(s: BattleState, items: T[]): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(s, i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
}
