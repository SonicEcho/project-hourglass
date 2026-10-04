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
} satisfies Record<string, SkillDef>;
