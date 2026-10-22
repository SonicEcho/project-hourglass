import { parseSeenTips, serializeSeenTips } from '../core';
import { browserStorage } from './storage';

// オートを出す「一度勝った敵の組み合わせ」（段階105。core/hunt.ts の formationKey）。
// 見た説明と同じく、セーブとは別に端末に覚える（はじめからやり直しても、知っている敵はオートで進められる）

const AUTO_WON_KEY = 'restopia.autoWon';
let won: string[] | null = null;

/** 勝ったことのある敵の組み合わせ */
export function wonFormations(): string[] {
  if (!won) won = parseSeenTips(browserStorage().read(AUTO_WON_KEY));
  return won;
}

/** 敵の組み合わせに勝ったことを覚える */
export function markFormationWon(key: string): void {
  const list = wonFormations();
  if (list.includes(key)) return;
  won = [...list, key];
  browserStorage().write(AUTO_WON_KEY, serializeSeenTips(won));
}
