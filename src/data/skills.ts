import type { SkillDef } from '../core/types';

export const SKILLS = {
  fire: { id: 'fire', name: 'ファイア', mp: 6, weight: 1.0, target: 'enemy', effects: [{ kind: 'damage', type: 'fire', power: 40 }] },
  breakSlash: {
    id: 'breakSlash',
    name: 'ブレイクスラッシュ',
    mp: 5,
    weight: 1.2,
    target: 'enemy',
    effects: [{ kind: 'damage', type: 'physical', power: 30, partMultiplier: 2 }],
  },
  care: { id: 'care', name: 'ケア', mp: 5, weight: 0.8, target: 'ally', effects: [{ kind: 'heal', power: 50 }] },
  careAll: { id: 'careAll', name: 'ケアオール', mp: 12, weight: 1.2, target: 'allies', effects: [{ kind: 'heal', power: 30 }] },
  ice: { id: 'ice', name: 'アイス', mp: 6, weight: 1.0, target: 'enemy', effects: [{ kind: 'damage', type: 'ice', power: 40 }] },
  thunder: { id: 'thunder', name: 'サンダー', mp: 6, weight: 1.0, target: 'enemy', effects: [{ kind: 'damage', type: 'thunder', power: 40 }] },
  shuffle: { id: 'shuffle', name: 'シャッフル', mp: 3, weight: 0.5, target: 'self', effects: [{ kind: 'redraw', count: 5 }] },
  swap: { id: 'swap', name: 'すりかえ', mp: 4, weight: 0.5, target: 'self', effects: [{ kind: 'retrieve' }] },
  // ---- 星図で覚える魔法・スキル（段階7） ----
  fira: { id: 'fira', name: 'ファイラ', mp: 12, weight: 1.3, target: 'enemy', effects: [{ kind: 'damage', type: 'fire', power: 70 }] },
  blizzara: { id: 'blizzara', name: 'ブリザラ', mp: 12, weight: 1.3, target: 'enemy', effects: [{ kind: 'damage', type: 'ice', power: 70 }] },
  thundara: { id: 'thundara', name: 'サンダラ', mp: 12, weight: 1.3, target: 'enemy', effects: [{ kind: 'damage', type: 'thunder', power: 70 }] },
  doubleSlash: {
    id: 'doubleSlash',
    name: 'ダブルスラッシュ',
    mp: 8,
    weight: 1.2,
    target: 'enemy',
    effects: [
      { kind: 'damage', type: 'physical', power: 30 },
      { kind: 'damage', type: 'physical', power: 30 },
    ],
  },
  cure: { id: 'cure', name: 'ケアル', mp: 10, weight: 0.8, target: 'ally', effects: [{ kind: 'heal', power: 80 }] },
  inspiration: { id: 'inspiration', name: 'ひらめき', mp: 4, weight: 0.5, target: 'self', effects: [{ kind: 'draw', count: 2 }] },
} satisfies Record<string, SkillDef>;
