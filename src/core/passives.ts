import { PASSIVE_CAPS } from '../data/constants';
import type { DamageType, Element, PassiveEffect } from './types';

// 特性（ムーブメント・武器・ギア）の割合の計算（段階192：古い戦闘の battle.ts から、育成の画面が使う物だけを移した）

type PassiveOf<K extends PassiveEffect['kind']> = Extract<PassiveEffect, { kind: K }>;

function passivesOf<K extends PassiveEffect['kind']>(ally: { passives?: PassiveEffect[] }, kind: K): PassiveOf<K>[] {
  return (ally.passives ?? []).filter((p): p is PassiveOf<K> => p.kind === kind);
}

type RateKind = 'partBoost' | 'batonBoost' | 'comboBoost' | 'regen' | 'bug' | 'elementBoost';

/** 割合の特性の、上限をかける前の合計（elementBoost は element を指定する） */
export function passiveTotal(ally: { passives?: PassiveEffect[] }, kind: RateKind, element?: DamageType): number {
  return passivesOf(ally, kind)
    .filter((p) => p.kind !== 'elementBoost' || p.element === element)
    .reduce((sum, p) => sum + p.rate, 0);
}

/** 割合の特性の合計（段階54から、種類ごとの上限 PASSIVE_CAPS で止める。狂い（bug）は止めない） */
export function passiveRate(ally: { passives?: PassiveEffect[] }, kind: RateKind, element?: DamageType): number {
  const total = passiveTotal(ally, kind, element);
  return kind === 'bug' ? total : Math.min(total, PASSIVE_CAPS[kind]);
}

/** 上限に届いた割合の特性（段階54。武器の画面に「上限」と出す）。value は上限の値 */
export function cappedPassives(ally: { passives?: PassiveEffect[] }): { kind: keyof typeof PASSIVE_CAPS; element?: Element; value: number }[] {
  const out: { kind: keyof typeof PASSIVE_CAPS; element?: Element; value: number }[] = [];
  for (const el of ['fire', 'ice', 'thunder'] as Element[]) if (passiveTotal(ally, 'elementBoost', el) >= PASSIVE_CAPS.elementBoost) out.push({ kind: 'elementBoost', element: el, value: PASSIVE_CAPS.elementBoost });
  for (const kind of ['partBoost', 'comboBoost', 'regen', 'batonBoost'] as const) if (passiveTotal(ally, kind) >= PASSIVE_CAPS[kind]) out.push({ kind, value: PASSIVE_CAPS[kind] });
  if (passivesOf(ally, 'mpSave').reduce((sum, p) => sum + p.amount, 0) >= PASSIVE_CAPS.mpSave) out.push({ kind: 'mpSave', value: PASSIVE_CAPS.mpSave });
  if (passivesOf(ally, 'oneMoreDraw').reduce((sum, p) => sum + p.count, 0) >= PASSIVE_CAPS.oneMoreDraw) out.push({ kind: 'oneMoreDraw', value: PASSIVE_CAPS.oneMoreDraw });
  return out;
}

/** 狂いで、ラウンドの始めに減る HP（最大HP×狂いの割合の合計の切り捨て。段階126：ムーブメントの画面の予告も同じ計算を使う） */
export function bugHpLoss(maxHp: number, passives: PassiveEffect[] | undefined): number {
  return Math.floor(maxHp * passiveRate({ passives }, 'bug'));
}
