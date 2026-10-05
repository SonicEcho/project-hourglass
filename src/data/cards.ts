import type { CardDef } from '../core/types';

export const CARDS = {
  sword: { id: 'sword', name: 'ソード', weight: 1.0, target: 'enemy', effects: [{ kind: 'damage', type: 'physical', power: 35 }] },
  heavyBlow: { id: 'heavyBlow', name: 'ヘビーブロウ', weight: 1.6, target: 'enemy', effects: [{ kind: 'damage', type: 'physical', power: 60 }] },
  fireChip: { id: 'fireChip', name: 'ファイアチップ', weight: 1.0, target: 'enemy', effects: [{ kind: 'damage', type: 'fire', power: 40 }] },
  iceChip: { id: 'iceChip', name: 'アイスチップ', weight: 1.0, target: 'enemy', effects: [{ kind: 'damage', type: 'ice', power: 40 }] },
  thunderChip: { id: 'thunderChip', name: 'サンダーチップ', weight: 1.0, target: 'enemy', effects: [{ kind: 'damage', type: 'thunder', power: 40 }] },
  wideShot: { id: 'wideShot', name: 'ワイドショット', weight: 1.2, target: 'enemies', effects: [{ kind: 'damage', type: 'physical', power: 20 }] },
  recover: { id: 'recover', name: 'リカバー', weight: 0.8, target: 'ally', effects: [{ kind: 'heal', power: 40 }] },
  // サポートカード：計画中にその場で使い、行動枠を使わない（1ラウンドにチーム全体で1枚まで）
  quickStep: { id: 'quickStep', name: 'クイックステップ', weight: 0, target: 'ally', support: true, effects: [{ kind: 'precede' }] },
  search: { id: 'search', name: 'サーチ', weight: 0, target: 'self', support: true, effects: [{ kind: 'search', count: 3 }] },
  breakArm: {
    id: 'breakArm',
    name: 'ブレイクアーム',
    weight: 1.0,
    target: 'enemy',
    effects: [{ kind: 'damage', type: 'physical', power: 30, partMultiplier: 2 }],
  },
  draw: { id: 'draw', name: 'ドロー', weight: 0, target: 'self', support: true, effects: [{ kind: 'draw', count: 2 }] },
} satisfies Record<string, CardDef>;

/** フォルダ（パーティ共通の山札）20枚の構成 */
export const FOLDER: { card: CardDef; count: number }[] = [
  { card: CARDS.sword, count: 3 },
  { card: CARDS.heavyBlow, count: 2 },
  { card: CARDS.fireChip, count: 2 },
  { card: CARDS.iceChip, count: 2 },
  { card: CARDS.thunderChip, count: 2 },
  { card: CARDS.wideShot, count: 2 },
  { card: CARDS.recover, count: 2 },
  { card: CARDS.quickStep, count: 1 },
  { card: CARDS.search, count: 1 },
  { card: CARDS.breakArm, count: 2 },
  { card: CARDS.draw, count: 1 },
];

/** フォルダを枚数分に展開する */
export function buildFolder(folder = FOLDER): CardDef[] {
  return folder.flatMap(({ card, count }) => Array.from({ length: count }, () => card));
}
