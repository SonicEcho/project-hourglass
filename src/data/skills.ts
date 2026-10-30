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
  // 段階71：ケアは「軽い回復」（回復は小さいが、重さが軽くラウンドの早い順番で動く。敵より先に間に合う）、ケアルは「重い回復」（遅いが大きく回復する）
  care: { id: 'care', name: 'ケア', mp: 4, weight: 0.4, target: 'ally', effects: [{ kind: 'heal', power: 45 }] },
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
  cure: { id: 'cure', name: 'ケアル', mp: 10, weight: 1.0, target: 'ally', effects: [{ kind: 'heal', power: 90 }] },
  inspiration: { id: 'inspiration', name: 'ひらめき', mp: 4, weight: 0.5, target: 'self', effects: [{ kind: 'draw', count: 2 }] },
  // ---- 小夜子が最初から持つ技（段階91a。物理と部位破壊が得意。docs/CONCEPT.md の仲間の表） ----
  // 兜割り：部位を狙うと部位に3倍（ブレイクスラッシュの2倍より重い）。月払い：薙刀で敵全体を払う
  kabutoWari: { id: 'kabutoWari', name: '兜割り', mp: 6, weight: 1.3, target: 'enemy', effects: [{ kind: 'damage', type: 'physical', power: 32, partMultiplier: 3 }] },
  tsukiBarai: { id: 'tsukiBarai', name: '月払い', mp: 10, weight: 1.3, target: 'enemies', effects: [{ kind: 'damage', type: 'physical', power: 26 }] },
  // ---- 早瀬が最初から持つ技（段階140a。属性魔法の職人。docs/CONCEPT.md の仲間の表、docs/script/4-2.md） ----
  // 焼き入れ・冷却・通電：火・氷・雷を一つずつ（ファイアたちより少し強く、少し重い）。ショート：雷で敵全体（機械の中を走る火花）
  yakiire: { id: 'yakiire', name: '焼き入れ', mp: 7, weight: 1.1, target: 'enemy', effects: [{ kind: 'damage', type: 'fire', power: 46 }] },
  reikyaku: { id: 'reikyaku', name: '冷却', mp: 7, weight: 1.1, target: 'enemy', effects: [{ kind: 'damage', type: 'ice', power: 46 }] },
  tsuden: { id: 'tsuden', name: '通電', mp: 7, weight: 1.1, target: 'enemy', effects: [{ kind: 'damage', type: 'thunder', power: 46 }] },
  short: { id: 'short', name: 'ショート', mp: 12, weight: 1.4, target: 'enemies', effects: [{ kind: 'damage', type: 'thunder', power: 26 }] },
} satisfies Record<string, SkillDef>;
