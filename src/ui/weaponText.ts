import type { EvolutionCondition, EvolutionDef, FragmentDef, ItemDef, WeaponData, WeaponParamKey } from '../core';
import { ELEMENT_LABEL } from './labels';
import { PART_COLOR_LABEL, STAT_LABEL, summarizePassives } from './naviText';

// 武器の表示用の文字（画面に依存しない。テストからも使う）

export const PARAM_LABEL: Record<WeaponParamKey, string> = { atk: '攻撃値', fire: '火', ice: '氷', thunder: '雷' };

/** 記憶の欠片を吸わせた時に上がるもの */
export function describeFragment(f: FragmentDef): string {
  return (Object.entries(f.gains) as [WeaponParamKey, number][]).map(([k, v]) => `${PARAM_LABEL[k]} +${v}`).join('、');
}

/** 素材・アイテムを時分解した時に手に入る記憶の欠片（例：「高揚×3、勇気×1」） */
export function describeItemFragments(data: WeaponData, item: ItemDef, sep = '、'): string {
  return Object.entries(item.fragments)
    .map(([id, n]) => `${data.fragments[id].name}×${n}`)
    .join(sep);
}

/** 素材・アイテムを時分解して全部吸わせた時に上がるものの合計 */
export function itemGains(data: WeaponData, item: ItemDef): Partial<Record<WeaponParamKey, number>> {
  const total: Partial<Record<WeaponParamKey, number>> = {};
  for (const [id, n] of Object.entries(item.fragments)) {
    for (const [k, v] of Object.entries(data.fragments[id].gains) as [WeaponParamKey, number][]) total[k] = (total[k] ?? 0) + v * n;
  }
  return total;
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
  if (boardExtension > 0) parts.push(`ブリッジが${boardExtension}マス伸びる`);
  return parts.join('。');
}
