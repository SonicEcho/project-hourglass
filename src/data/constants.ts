import type { ActionDef } from '../core/types';

// 戦闘ルールの数値。すべて仮。遊んで調整する

/** 行動順の予告で、まだ決まっていない行動（敵の行動など）に使う重さ */
export const DEFAULT_ACTION_WEIGHT = 1.0;

/** ラウンドの始めに手札をこの枚数まで補充する */
export const HAND_SIZE = 5;
/** アルバム（山札）の枚数。編集してもこの枚数ちょうどにする（段階41） */
export const ALBUM_SIZE = 20;
/** アルバムに入れられる、同じスナップの枚数の上限（段階41） */
export const ALBUM_COPY_MAX = 4;

/** 新しい戦闘のアルバム（段階163）：枚数・同じスナップの上限・クライマックスの上限（スペシャルは別に、仲間ごとに2枚） */
export const CHAIN_ALBUM = { size: 20, copyMax: 4, climaxMax: 3 };
/** 延長になった時に引く枚数 */
export const ONE_MORE_DRAW = 1;
/** 1ラウンドにチーム全体で使えるサポートスナップの枚数 */
export const SUPPORT_PER_ROUND = 1;
/**
 * 割合の特性の上限（段階54。docs/design/economy.md の 9-2）。武器・型・ギア・星図を合わせた合計に効く。超えた分は効かない。
 * elementBoost は属性ごと、mpSave は数（段階204：古い戦闘の batonBoost・oneMoreDraw は外した）
 */
export const PASSIVE_CAPS = { elementBoost: 0.8, partBoost: 1.0, comboBoost: 0.6, regen: 0.06, mpSave: 2 } as const;


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
/**
 * 古い戦闘の連携技のつながりゲージの最大（段階26の調整2）。段階204 で画面とゲージの増減はなくした。
 * セーブの読み込み（古い linkGauge をそろえる）だけが使う（段階205 でセーブから外す）
 */
export const LINK_GAUGE_MAX = 100;

/**
 * 敵の落とし物の確率（段階27b）。倒すと、この確率で表から1つ。残りは何も落とさない。
 * 体勢が崩れた敵（ダウン中・立ち上がったばかり）を倒すと、珍しい素材とレアが出やすい。
 * 段階74：1章を3晩の形にして敵が約90体になり、素材が余ったので、いつもの素材だけを減らした（いつもの 75%・30% → 25%・35%。
 * 進化の鍵になる珍しい素材とレアは今のまま。落とすのは、ふつう半分、体勢を崩すと4分の3）
 */
export const DROP_RATES = {
  normal: { common: 0.25, uncommon: 0.2, rare: 0.05 },
  offBalance: { common: 0.35, uncommon: 0.3, rare: 0.1 },
} as const;

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
