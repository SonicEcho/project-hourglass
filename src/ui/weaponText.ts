import type { EvolutionCondition, EvolutionDef, FragmentDef, WeaponParamKey } from '../core';
import { ELEMENT_LABEL } from './labels';
import { PART_COLOR_LABEL, STAT_LABEL, summarizePassives } from './naviText';

// 武器の表示用の文字（画面に依存しない。テストからも使う）

export const PARAM_LABEL: Record<WeaponParamKey, string> = { atk: '攻撃値', fire: '火', ice: '氷', thunder: '雷' };

/** 断片を吸わせた時に上がるもの */
export function describeFragment(f: FragmentDef): string {
  return (Object.entries(f.gains) as [WeaponParamKey, number][]).map(([k, v]) => `${PARAM_LABEL[k]} +${v}`).join('、');
}

/** 進化の条件 */
export function describeCondition(c: EvolutionCondition | { kind: 'level'; min: number }): string {
  if (c.kind === 'level') return `Lv${c.min}`;
  if (c.kind === 'param') return `${PARAM_LABEL[c.param]} ${c.min}以上`;
  return `傾向が${PART_COLOR_LABEL[c.color]}`;
}

/** 進化先の効果 */
export function describeEvolution(evo: EvolutionDef, boardExtension: number): string {
  const parts: string[] = [];
  if (evo.attackElement) parts.push(`通常攻撃が${ELEMENT_LABEL[evo.attackElement]}になる`);
  parts.push(...summarizePassives(evo.passives ?? []));
  for (const [k, v] of Object.entries(evo.stats ?? {})) parts.push(`${STAT_LABEL[k as keyof typeof STAT_LABEL]} +${v}`);
  if (boardExtension > 0) parts.push(`盤のコマンドラインが${boardExtension}マス伸びる`);
  return parts.join('。');
}
