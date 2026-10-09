import type { EvolutionCondition, EvolutionDef, FragmentDef, ItemDef, ItemRarity, WeaponData, WeaponParamKey } from '../core';
import { decomposeFragment } from '../core';
import { ELEMENT_LABEL } from './labels';
import { PART_COLOR_LABEL, STAT_LABEL, summarizePassives } from './naviText';

// 武器の表示用の文字（画面に依存しない。テストからも使う）

export const PARAM_LABEL: Record<WeaponParamKey, string> = { atk: '攻撃値', fire: '火', ice: '氷', thunder: '雷' };

/** 記憶の欠片を吸わせた時に上がるもの */
export function describeFragment(f: FragmentDef): string {
  return (Object.entries(f.gains) as [WeaponParamKey, number][]).map(([k, v]) => `${PARAM_LABEL[k]} +${v}`).join('、');
}

/** 能力値の上がり下がり（例：「氷+2、火−1」） */
export function describeGains(gains: Partial<Record<WeaponParamKey, number>>, short = false): string {
  return (Object.entries(gains) as [WeaponParamKey, number][])
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => `${short ? PARAM_SHORT[k] : PARAM_LABEL[k]}${v > 0 ? '+' : '−'}${Math.abs(v)}`)
    .join(short ? ' ' : '、');
}

export const PARAM_SHORT: Record<WeaponParamKey, string> = { atk: '攻', fire: '火', ice: '氷', thunder: '雷' };

export const RARITY_LABEL: Record<ItemRarity, string> = { common: 'いつも', uncommon: '珍しい', rare: 'レア', part: '部位', boss: 'ボス' };

/** 時分解した時の説明（例：「2つで 安堵の欠片 1つ」） */
export function describeDecompose(data: WeaponData, item: ItemDef): string {
  return `${data.decomposeCost}つで、記憶の欠片（${data.fragments[decomposeFragment(data, item.id)].name}）1つ`;
}

/** 進化の条件 */
export function describeCondition(c: EvolutionCondition | { kind: 'level'; min: number }, data?: WeaponData): string {
  if (c.kind === 'level') return `Lv${c.min}`;
  if (c.kind === 'param') return `${PARAM_LABEL[c.param]} ${c.min}以上`;
  if (c.kind === 'key') return `鍵：${data?.items[c.item]?.name ?? c.item}`;
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
