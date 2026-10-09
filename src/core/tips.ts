import { availableCombos, batonTargets, linkReady, planPool } from './battle';
import type { ExploreState } from './explore';
import type { BattleState } from './types';

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

/**
 * 戦闘で、今の場面に合う説明の id（操作を待っている時に呼ぶ）。
 * autoAvailable：オートの説明を出してよいか（雑魚戦で、最初の戦闘ではない時。画面の側で決める）
 */
export function battleTipTriggers(s: BattleState, ctx: { autoAvailable: boolean }): string[] {
  const out: string[] = [];
  if (s.phase === 'plan') out.push('battle_plan');
  if (s.log.some((e) => e.type === 'weaknessFound' || e.type === 'down')) out.push('battle_weak');
  if (s.phase === 'extra') out.push('battle_extend');
  if (s.phase === 'extra' && batonTargets(s).length > 0) out.push('battle_baton');
  if (s.phase === 'plan' && s.allies.some((a) => a.hp > 0 && availableCombos(s, planPool(s, a.uid)).length > 0)) out.push('battle_combo');
  if (s.enemies.some((e) => e.hp > 0 && (e.parts.length > 0 || e.charging))) out.push('battle_boss');
  if (s.phase === 'plan' && s.links.length > 0 && linkReady(s)) out.push('battle_link');
  if (s.phase === 'plan' && ctx.autoAvailable) out.push('battle_auto');
  return out;
}

/** 探索で、今の場面に合う説明の id。atCheckpoint：チェックポイントに立っている */
export function exploreTipTriggers(state: ExploreState, ctx: { atCheckpoint: boolean }): string[] {
  const out = ['explore_basic'];
  if (ctx.atCheckpoint) out.push('explore_checkpoint');
  if (state.koma > 0) out.push('explore_koma');
  return out;
}
