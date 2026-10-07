import type { NaviPartDef, PartColor, PassiveEffect, Stats } from '../core';
import { ELEMENT_LABEL } from './labels';

// ムーブメントの表示用の文字（画面に依存しない。テストからも使う）

export const STAT_LABEL: Record<keyof Stats, string> = { hp: 'HP', mp: 'MP', atk: '攻撃', mag: '魔力', def: '防御', spd: '速さ' };

export const PART_COLOR_LABEL: Record<PartColor, string> = { red: '赤', blue: '青', green: '緑', yellow: '黄' };

const pct = (rate: number) => `${Math.round(rate * 100)}%`;

/** 特性の説明 */
export function describePassive(p: PassiveEffect): string {
  switch (p.kind) {
    case 'elementBoost':
      return `${ELEMENT_LABEL[p.element]}のダメージ +${pct(p.rate)}`;
    case 'partBoost':
      return `部位へのダメージ +${pct(p.rate)}`;
    case 'oneMoreDraw':
      return `延長の時に引く枚数 +${p.count}`;
    case 'batonBoost':
      return `バトンを受けた時の倍率 +${p.rate}（1.25 → ${1.25 + p.rate}）`;
    case 'comboBoost':
      return `自分が使うコンボのダメージ・回復量 +${pct(p.rate)}`;
    case 'regen':
      return `ラウンドの始めに最大HPの${pct(p.rate)}を回復`;
    case 'mpSave':
      return `魔法・スキルのMP消費 −${p.amount}（最低1）`;
    case 'startDash':
      return '戦闘の最初のラウンド、行動が先制になる';
    case 'bug':
      return `狂い：ラウンドの始めに最大HPの${pct(p.rate)}を失う`;
  }
}

/** ギアの効果の説明 */
export function describePart(def: NaviPartDef): string {
  if (def.kind === 'stat') {
    return (Object.entries(def.stats) as [keyof Stats, number][]).map(([k, v]) => `${STAT_LABEL[k]} +${v}`).join('、');
  }
  return describePassive(def.effect);
}

/** ギアの種類と、効く条件 */
export function partKindText(def: NaviPartDef): string {
  return def.kind === 'stat' ? '能力値ギア（ムーブメントのどこに置いても効く）' : '効果ギア（ブリッジに乗っている時だけ効く）';
}

/** 同じ特性をまとめて「×2」のように書く */
export function summarizePassives(passives: PassiveEffect[]): string[] {
  const out: { text: string; n: number }[] = [];
  for (const p of passives) {
    const text = describePassive(p);
    const found = out.find((o) => o.text === text);
    if (found) found.n++;
    else out.push({ text, n: 1 });
  }
  return out.map((o) => (o.n > 1 ? `${o.text} ×${o.n}` : o.text));
}
