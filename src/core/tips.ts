import type { ExploreState } from './explore';

// 初めての人向けの説明（段階30）。どの場面で、どの説明を出すかを決める。Phaser に依存しない。
// 説明の文は src/data/tips.ts。見た説明の id はセーブとは別に覚える（はじめからやり直しても、もう出さない）

export type TipGroup = 'battle' | 'explore' | 'growth';

export interface TipDef {
  id: string;
  group: TipGroup;
  title: string;
  body: string;
}

/** 出したい説明（triggers）のうち、まだ見ていないものを、説明の並び順で1つ。なければ null */
export function nextTip(tips: TipDef[], seen: readonly string[], triggers: readonly string[]): TipDef | null {
  return tips.find((t) => triggers.includes(t.id) && !seen.includes(t.id)) ?? null;
}

/** 見たことにする（重ならないように足す） */
export function markTipSeen(seen: readonly string[], id: string): string[] {
  return seen.includes(id) ? [...seen] : [...seen, id];
}

/** 保存された文字から、見た説明の id を読む。壊れていたら空 */
export function parseSeenTips(text: string | null): string[] {
  if (!text) return [];
  try {
    const raw: unknown = JSON.parse(text);
    return Array.isArray(raw) ? [...new Set(raw.filter((v): v is string => typeof v === 'string'))] : [];
  } catch {
    return [];
  }
}

export function serializeSeenTips(seen: readonly string[]): string {
  return JSON.stringify(seen);
}


/** 探索で、今の場面に合う説明の id。atCheckpoint：チェックポイントに立っている。hunting：記憶をたどっている（段階45） */
export function exploreTipTriggers(state: ExploreState, ctx: { atCheckpoint: boolean; hunting?: boolean }): string[] {
  const out = ['explore_basic'];
  if (ctx.hunting) out.push('explore_hunt');
  if (ctx.atCheckpoint) out.push('explore_checkpoint');
  if (state.koma > 0) out.push('explore_koma');
  return out;
}
