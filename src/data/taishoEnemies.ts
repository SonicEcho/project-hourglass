import type { EnemyDef } from '../core/types';

// 大正の祭りの夜（段階91b。docs/script/3-matsuri.md）：大正十年の夏祭りの砂嵐と、2晩目の夜の端のボス「やぐらのぬし」。
// 1-1（平成の縁日）と物が重ならないよう、金魚・水風船・お面は使わない。弱点は物理・雷・火・氷の4つに散らす。
// 数値は自動対戦（npm run measure の「祭りの夜」）で測って決めた。目安は docs/design/battle.md の 13.

/** 提灯ノイズ：破れた提灯の群れ。氷が弱点（灯が消える）、火に強い */
export const LANTERN_NOISE: EnemyDef = {
  id: 'lanternNoise',
  name: '提灯ノイズ',
  stats: { hp: 300, atk: 20, mag: 32, def: 10, spd: 13 },
  weaknesses: ['ice'],
  resistances: ['fire'],
  actions: [
    { id: 'flicker', name: 'ゆらめく灯', target: 'allies', type: 'fire', power: 22, weight: 1.0 },
    { id: 'burn', name: '火の玉', target: 'ally', type: 'fire', power: 36, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'lanternPaper', uncommon: 'lanternFrame' },
};

/** 風車ノイズ：回り続ける風車。速い。物理が弱点（止めれば崩れる）、雷に強い */
export const PINWHEEL_NOISE: EnemyDef = {
  id: 'pinwheelNoise',
  name: '風車ノイズ',
  stats: { hp: 270, atk: 32, mag: 16, def: 10, spd: 22 },
  weaknesses: ['physical'],
  resistances: ['thunder'],
  actions: [
    { id: 'spin', name: 'から回り', target: 'ally', type: 'physical', power: 36, weight: 1.0 },
    { id: 'whirl', name: 'つむじ風', target: 'allies', type: 'physical', power: 22, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'pinwheelBlade', uncommon: 'pinwheelStick' },
};

/** 飴細工ノイズ：溶けかけた飴の鶴。打たれ強い。火が弱点（溶ける）、氷に強い */
export const CANDY_NOISE: EnemyDef = {
  id: 'candyNoise',
  name: '飴細工ノイズ',
  stats: { hp: 400, atk: 30, mag: 16, def: 20, spd: 8 },
  weaknesses: ['fire'],
  resistances: ['ice'],
  actions: [
    { id: 'sticky', name: '飴がらみ', target: 'ally', type: 'physical', power: 34, weight: 1.0 },
    { id: 'crane', name: '鶴の舞', target: 'allies', type: 'physical', power: 24, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'candyStick', uncommon: 'candyCrane' },
};

/** 蓄音機ノイズ：同じ曲をくり返すラッパ。全体攻撃。雷が弱点、物理に強い */
export const PHONOGRAPH_NOISE: EnemyDef = {
  id: 'phonographNoise',
  name: '蓄音機ノイズ',
  stats: { hp: 340, atk: 22, mag: 30, def: 16, spd: 10 },
  weaknesses: ['thunder'],
  resistances: ['physical'],
  actions: [
    { id: 'repeat', name: 'くり返しの歌', target: 'allies', type: 'magic', power: 24, weight: 1.0 },
    { id: 'scratch', name: '針飛び', target: 'ally', type: 'magic', power: 34, weight: 1.0 },
  ],
  ai: { type: 'random' },
  // レアは「百年前のレコード」（祭りの夜にずっと鳴っていた一枚。強い素材）
  dropTable: { common: 'recordNeedle', uncommon: 'phonographHorn', rare: 'oldRecord' },
};

/**
 * 2晩目のボス「やぐらのぬし」（夜の端）。盆踊りのやぐらと太鼓と、何百もの提灯が絡まった、百年分のすり切れ。
 * - 大太鼓：壊すと「打ち鳴らし」（全体）を封じる
 * - 提灯の綱：壊すと「灯の雨」（全体・火）を封じ、弱点「氷」が露出する
 * - 大技「くり返し」（全体・ため）はどの部位も使わない。夜を最初から始めようとする
 */
export const YAGURA_LORD: EnemyDef = {
  id: 'yaguraLord',
  name: 'やぐらのぬし',
  stats: { hp: 3800, atk: 44, mag: 44, def: 14, spd: 11 },
  weaknesses: [],
  resistances: [],
  parts: [
    { id: 'drum', name: '大太鼓', hp: 420, material: '太鼓の皮', drop: 'drumSkin' },
    { id: 'lanternRope', name: '提灯の綱', hp: 420, material: '提灯の綱', drop: 'lanternRope', revealsWeakness: ['ice'] },
  ],
  actions: [
    { id: 'chant', name: '音頭', target: 'ally', type: 'magic', power: 36, weight: 1.0 },
    { id: 'drumBeat', name: '打ち鳴らし', target: 'allies', type: 'physical', power: 38, weight: 1.0, requiresPart: 'drum' },
    { id: 'lanternRain', name: '灯の雨', target: 'allies', type: 'fire', power: 40, weight: 1.0, requiresPart: 'lanternRope' },
    { id: 'rewind', name: 'くり返し', target: 'allies', type: 'magic', power: 50, weight: 1.0, charge: true },
  ],
  ai: { type: 'boss', lowHpRatio: 0.5, allTargetInterval: 2 },
  // 倒すと必ず「ぬしの団扇」。部位を壊すと、その部位の素材も必ず落とす
  drops: ['lordFan'],
};

export const TAISHO_NOISES: EnemyDef[] = [LANTERN_NOISE, PINWHEEL_NOISE, CANDY_NOISE, PHONOGRAPH_NOISE];
