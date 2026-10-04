import {
  HEAL_DIVISOR,
  MIN_DAMAGE,
  RANDOM_MAX,
  RANDOM_MIN,
  RESIST_MULTIPLIER,
  WEAK_MULTIPLIER,
} from '../data/constants';
import type { Affinity, DamageType, Unit } from './types';

export function affinityMultiplier(affinity: Affinity): number {
  if (affinity === 'weak') return WEAK_MULTIPLIER;
  if (affinity === 'resist') return RESIST_MULTIPLIER;
  return 1;
}

/** 対象との相性。味方は相性を持たない。無属性の「魔法」は常に通常 */
export function affinityOf(target: Unit, type: DamageType): Affinity {
  if (target.side !== 'enemy' || type === 'magic') return 'normal';
  if (target.weaknesses.includes(type)) return 'weak';
  if (target.resistances.includes(type)) return 'resist';
  return 'normal';
}

/** 物理なら攻撃、属性（と魔法）なら魔力 */
export function attackStatOf(user: { atk: number; mag: number }, type: DamageType): number {
  return type === 'physical' ? user.atk : user.mag;
}

/** 0以上1未満の乱数を、ダメージの乱数倍率（0.9〜1.1）にする */
export function randomFactor(r: number): number {
  return RANDOM_MIN + r * (RANDOM_MAX - RANDOM_MIN);
}

export interface DamageParams {
  power: number;
  attack: number;
  defense: number;
  /** 乱数倍率（0.9〜1.1） */
  random: number;
  affinity: Affinity;
  /** バトン、防御などのその他の倍率をまとめたもの */
  multiplier?: number;
}

/**
 * ダメージ = 威力 × 攻撃(魔力) ÷ 防御 × 乱数 × 相性倍率 × その他の倍率
 * 小数点以下切り捨て、最低1
 */
export function calcDamage(p: DamageParams): number {
  const raw = ((p.power * p.attack) / p.defense) * p.random * affinityMultiplier(p.affinity) * (p.multiplier ?? 1);
  return Math.max(MIN_DAMAGE, Math.floor(raw));
}

/** 回復量 = 威力 × 魔力 ÷ 20 × その他の倍率（切り捨て） */
export function calcHeal(power: number, mag: number, multiplier = 1): number {
  return Math.floor(((power * mag) / HEAL_DIVISOR) * multiplier);
}
