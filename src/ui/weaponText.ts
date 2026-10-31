import type { EvolutionCondition, EvolutionDef, EvolutionStyleDef, FragmentDef, ItemDef, ItemRarity, WeaponData, WeaponParamKey } from '../core';
import { decomposeFragment } from '../core';
import { ELEMENT_LABEL } from './labels';
import { PART_COLOR_LABEL, STAT_LABEL, summarizePassives } from './naviText';

// 武器の表示用の文字（画面に依存しない。テストからも使う）

export const PARAM_LABEL: Record<WeaponParamKey, string> = { atk: '攻撃値', fire: '火', ice: '氷', thunder: '雷' };

/** 記憶の欠片を刻んだ時に上がるもの */
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
  if (c.kind === 'paramMax') return `${PARAM_LABEL[c.param]} ${c.max}以下`;
  return `傾向が${PART_COLOR_LABEL[c.color]}`;
}

/** 進化先の効果（盤に足すマスは型で決まるので、describeStyle に書く） */
export function describeEvolution(evo: EvolutionDef): string {
  const parts: string[] = [];
  if (evo.attackElement) parts.push(`通常攻撃が${ELEMENT_LABEL[evo.attackElement]}になる`);
  parts.push(...summarizePassives(evo.passives ?? []));
  for (const [k, v] of Object.entries(evo.stats ?? {})) parts.push(`${STAT_LABEL[k as keyof typeof STAT_LABEL]} +${v}`);
  return parts.join('。');
}

/** 型の効果（段階42。boardExtension が0なら、盤のことは書かない。段階100b：盤は下の行・右の列へ四角に広がる） */
export function describeStyle(style: EvolutionStyleDef, boardExtension: number): string {
  const parts: string[] = [...summarizePassives(style.passives ?? [])];
  for (const [k, v] of Object.entries(style.stats ?? {})) parts.push(`${STAT_LABEL[k as keyof typeof STAT_LABEL]} +${v}`);
  if (boardExtension > 0) parts.push(style.board === 'row' ? `盤の下に${boardExtension}マス増える（ブリッジの下から）` : `盤の右に${boardExtension}マス増える`);
  return `${style.name}：${parts.join('。')}`;
}

/**
 * 2段先の進化先の、伸びる方向（段階42。名前は伏せる。例：「火↑↑ 攻撃↑」）。
 * 能力値の条件は、一番大きいものを ↑↑、ほかを ↑。低いままにする条件は ↓、傾向は「傾向 黄」
 */
export function describeDirection(evo: EvolutionDef): string {
  const params = evo.conditions.flatMap((c) => (c.kind === 'param' ? [c] : []));
  const top = Math.max(0, ...params.map((c) => c.min));
  const parts = [...params].sort((a, b) => b.min - a.min).map((c) => `${PARAM_SHORT[c.param]}${c.min === top ? '↑↑' : '↑'}`);
  for (const c of evo.conditions) {
    if (c.kind === 'paramMax') parts.push(`${PARAM_SHORT[c.param]}↓`);
    if (c.kind === 'tendency') parts.push(`傾向 ${PART_COLOR_LABEL[c.color]}`);
  }
  return parts.join(' ');
}

/** 進化先の系統（ツリーのアイコン。通常攻撃の属性、なければ一番大きい能力値の条件、それもなければ物理） */
export function evolutionLine(evo: EvolutionDef): 'physical' | 'fire' | 'ice' | 'thunder' | 'support' {
  if (evo.attackElement && evo.attackElement !== 'physical') return evo.attackElement as 'fire' | 'ice' | 'thunder';
  const params = evo.conditions.flatMap((c) => (c.kind === 'param' ? [c] : []));
  if (evo.conditions.some((c) => c.kind === 'tendency')) return 'support';
  if (params.length === 0) return 'support';
  const top = params.reduce((a, b) => (b.min > a.min ? b : a));
  return top.param === 'atk' ? 'physical' : top.param;
}
