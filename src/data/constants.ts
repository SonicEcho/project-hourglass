import type { ActionDef } from '../core/types';

// 戦闘ルールの数値。すべて仮。遊んで調整する

/** 行動順の予告で、まだ決まっていない行動（敵の行動など）に使う重さ */
export const DEFAULT_ACTION_WEIGHT = 1.0;

/** ラウンドの始めに手札をこの枚数まで補充する */
export const HAND_SIZE = 5;
/** ワンモアになった時に引く枚数 */
export const ONE_MORE_DRAW = 1;
/** 1ラウンドにチーム全体で使えるサポートカードの枚数 */
export const SUPPORT_PER_ROUND = 1;

/** ダメージの乱数幅 */
export const RANDOM_MIN = 0.9;
export const RANDOM_MAX = 1.1;
export const WEAK_MULTIPLIER = 1.5;
export const RESIST_MULTIPLIER = 0.5;
export const MIN_DAMAGE = 1;
/** 回復量 = 威力 × 魔力 ÷ HEAL_DIVISOR */
export const HEAL_DIVISOR = 20;
/** 防御中に受けるダメージの倍率 */
export const GUARD_DAMAGE_MULTIPLIER = 0.5;
/** バトンを受けた仲間の追加行動のダメージ・回復量の倍率 */
export const BATON_MULTIPLIER = 1.25;
/** 部位を狙った時に本体に入るダメージの割合 */
export const PART_BODY_RATIO = 0.5;

/** 全員共通の基本行動 */
export const BASIC_ATTACK: ActionDef = {
  id: 'attack',
  name: '通常攻撃',
  weight: 1.0,
  target: 'enemy',
  effects: [{ kind: 'damage', type: 'physical', power: 20 }],
};

export const GUARD: ActionDef = {
  id: 'guard',
  name: '防御',
  // 防御はラウンドの最初に効くので、重さは並び順に影響しない
  weight: 0.6,
  target: 'self',
  effects: [{ kind: 'guard' }],
};

/**
 * 重さの見せ方。重さが上限以下なら、その名前で表示する（上から順に判定）。
 * 行動の速さ = 速さ ÷ 重さ。重いほどラウンドの中で後回しになる
 */
export const WEIGHT_LABELS: { max: number; label: string }[] = [
  { max: 0.6, label: '軽い' },
  { max: 1.0, label: '普通' },
  { max: 1.3, label: '重い' },
  { max: Infinity, label: '超重い' },
];
