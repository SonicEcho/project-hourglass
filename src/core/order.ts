/** 行動の速さ = 速さ ÷ 重さ。大きいほど先に動く */
export function actionSpeed(spd: number, weight: number): number {
  return weight > 0 ? spd / weight : Number.POSITIVE_INFINITY;
}

/**
 * ラウンドの中の並び順を決める要素
 * - tier: 0 防御、1 先制（クイックステップ・連携技）、2 それ以外
 * - speed: 行動の速さ
 * - side / spd: 同じ速さの時は味方が先、その次は速さ（能力値）の高い順
 * - index: それでも同じなら登録順（味方 → 敵）
 */
export interface OrderKey {
  tier: number;
  speed: number;
  side: 'ally' | 'enemy';
  spd: number;
  index: number;
}

export function compareOrder(a: OrderKey, b: OrderKey): number {
  if (a.tier !== b.tier) return a.tier - b.tier;
  if (a.speed !== b.speed) return b.speed - a.speed;
  if (a.side !== b.side) return a.side === 'ally' ? -1 : 1;
  if (a.spd !== b.spd) return b.spd - a.spd;
  return a.index - b.index;
}
