import type { EnemyDef } from '../core/types';

export const SLIME: EnemyDef = {
  id: 'slime',
  name: 'スライム',
  stats: { hp: 140, atk: 14, mag: 8, def: 8, spd: 8 },
  weaknesses: ['fire'],
  resistances: ['physical'],
  actions: [{ id: 'tackle', name: '体当たり', target: 'ally', type: 'physical', power: 30, weight: 1.0 }],
  ai: { type: 'random' },
  // 倒すと落とす素材（段階9）
  drops: ['slimeJelly'],
};

export const FROST_BAT: EnemyDef = {
  id: 'frostBat',
  name: 'フロストバット',
  stats: { hp: 110, atk: 12, mag: 14, def: 8, spd: 18 },
  weaknesses: ['thunder'],
  resistances: ['ice'],
  actions: [
    { id: 'bite', name: '噛みつき', target: 'ally', type: 'physical', power: 25, weight: 1.0 },
    { id: 'chill', name: '冷気', target: 'ally', type: 'ice', power: 30, weight: 1.0 },
  ],
  ai: { type: 'random' },
  // 倒すと落とす素材（段階9）
  drops: ['frostFeather'],
};

export const ARMOR_DOG: EnemyDef = {
  id: 'armorDog',
  name: 'アーマードッグ',
  stats: { hp: 180, atk: 16, mag: 6, def: 16, spd: 10 },
  weaknesses: ['ice'],
  resistances: ['physical'],
  actions: [{ id: 'crunch', name: 'かみくだく', target: 'ally', type: 'physical', power: 35, weight: 1.0 }],
  ai: { type: 'random' },
  // 倒すと落とす素材（段階9）
  drops: ['hardFur'],
};

/** ボス「歪みの獣」 */
export const DISTORTED_BEAST: EnemyDef = {
  id: 'distortedBeast',
  name: '歪みの獣',
  // 段階7：星図で育てたパーティに合わせて上げた（段階5では HP 750、攻撃 18、魔力 15）
  // 段階8：ムーブメントの分だけさらに上げた（段階7では HP 1000、攻撃 21、魔力 18）
  // 段階9：武器の分だけさらに上げた（段階8では HP 1200、攻撃 24、魔力 21）
  stats: { hp: 1400, atk: 26, mag: 23, def: 12, spd: 11 },
  weaknesses: [],
  resistances: [],
  parts: [
    { id: 'rightArm', name: '右腕', hp: 220, material: '歪んだ腕殻' },
    { id: 'horn', name: '角', hp: 180, material: '歪みの角片', revealsWeakness: ['thunder'] },
  ],
  actions: [
    // 全体攻撃は大技：1回力をためてから放つ（ためている間に予告が出る）
    { id: 'sweep', name: '薙ぎ払い', target: 'allies', type: 'physical', power: 28, weight: 1.0, charge: true },
    { id: 'slam', name: '叩きつけ', target: 'ally', type: 'physical', power: 40, weight: 1.0, requiresPart: 'rightArm' },
    { id: 'roar', name: '歪みの咆哮', target: 'allies', type: 'magic', power: 32, weight: 1.0, requiresPart: 'horn', charge: true },
  ],
  ai: { type: 'boss', lowHpRatio: 0.5, allTargetInterval: 2 },
};
