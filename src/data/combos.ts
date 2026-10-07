import type { ComboDef } from '../core/types';

/**
 * コンボ（手札のスナップの組み合わせで出す大技）。
 * 必要なスナップが手札にそろうと使える。使うとそのスナップはすべて捨て札へ。
 */
export const COMBOS: ComboDef[] = [
  {
    id: 'elementBurst',
    name: 'エレメントバースト',
    cards: ['fireChip', 'iceChip', 'thunderChip'],
    weight: 1.5,
    target: 'enemies',
    // 敵ごとに一番効く属性（弱点があれば弱点）で攻撃する
    effects: [{ kind: 'damage', type: 'fire', power: 40, bestOf: ['fire', 'ice', 'thunder'] }],
  },
  {
    id: 'tripleSword',
    name: 'トリプルソード',
    cards: ['sword', 'sword', 'sword'],
    weight: 1.5,
    target: 'enemy',
    effects: [
      { kind: 'damage', type: 'physical', power: 35, ignoreResist: true },
      { kind: 'damage', type: 'physical', power: 35, ignoreResist: true },
      { kind: 'damage', type: 'physical', power: 35, ignoreResist: true },
    ],
  },
  {
    id: 'breakCrush',
    name: 'ブレイククラッシュ',
    cards: ['breakArm', 'breakArm'],
    weight: 1.3,
    target: 'enemy',
    effects: [{ kind: 'damage', type: 'physical', power: 50, partMultiplier: 3 }],
  },
  {
    id: 'healCircle',
    name: 'ヒールサークル',
    cards: ['recover', 'recover'],
    weight: 1.0,
    target: 'allies',
    effects: [{ kind: 'heal', power: 45 }],
  },
];
