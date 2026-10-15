import type { EnemyDef } from '../core/types';

// 1-2「夕暮れの二人乗り」：昭和の終わりの商店街の砂嵐と、区画のボス（段階37）。
// 姿と弱点は脚本のたたき台（docs/script/M2.md の 4.）。1章は2人なので、弱点は火・氷・物理・雷の4つに散らす（雷はサンダーボルトの出番）。
// 数値は自動対戦（npm run measure の「1-2」の表。1-1 を通した後の育ち具合から始める）で測って決める。目安は docs/design/battle.md の 13.

/** ブリキノイズ：ブリキのロボットとぜんまい。かたい。雷が弱点（さびたブリキ）、物理に強い */
export const TIN_NOISE: EnemyDef = {
  id: 'tinNoise',
  name: 'ブリキノイズ',
  stats: { hp: 190, atk: 16, mag: 9, def: 15, spd: 8 },
  weaknesses: ['thunder'],
  resistances: ['physical'],
  actions: [
    { id: 'windUpPunch', name: 'ぜんまいパンチ', target: 'ally', type: 'physical', power: 36, weight: 1.0 },
    { id: 'tinMarch', name: 'ブリキの行進', target: 'ally', type: 'physical', power: 28, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'tinSpring', uncommon: 'tinKey' },
};

/** 黒電話ノイズ：黒電話とコード。ベルで全体を揺さぶる。氷が弱点（鳴りやまないベルを冷やす）、火に強い */
export const PHONE_NOISE: EnemyDef = {
  id: 'phoneNoise',
  name: '黒電話ノイズ',
  stats: { hp: 150, atk: 12, mag: 16, def: 9, spd: 11 },
  weaknesses: ['ice'],
  resistances: ['fire'],
  actions: [
    { id: 'cordWhip', name: 'コードのむち', target: 'ally', type: 'physical', power: 28, weight: 1.0 },
    { id: 'ringRing', name: 'ジリリリ', target: 'allies', type: 'magic', power: 18, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'phoneCord', uncommon: 'phoneBell' },
};

/** ラムネノイズ：ラムネの瓶とビー玉。速い。物理が弱点（瓶が割れる）、氷に強い（冷えている） */
export const RAMUNE_NOISE: EnemyDef = {
  id: 'ramuneNoise',
  name: 'ラムネノイズ',
  stats: { hp: 120, atk: 14, mag: 14, def: 7, spd: 16 },
  weaknesses: ['physical'],
  resistances: ['ice'],
  actions: [
    { id: 'marbleShot', name: 'ビー玉はじき', target: 'ally', type: 'physical', power: 26, weight: 1.0 },
    { id: 'fizz', name: 'しゅわしゅわ', target: 'ally', type: 'ice', power: 30, weight: 1.0 },
  ],
  ai: { type: 'random' },
  // レアは夕焼けのビー玉（1-1 の「なつの尾びれ」と同じ、強い素材）
  dropTable: { common: 'ramuneGlass', uncommon: 'ramuneMarble', rare: 'sunsetMarble' },
};

/** めんこノイズ：めんことベーゴマが舞う紙の群れ。火が弱点（紙）、物理に強い */
export const MENKO_NOISE: EnemyDef = {
  id: 'menkoNoise',
  name: 'めんこノイズ',
  stats: { hp: 140, atk: 13, mag: 15, def: 10, spd: 13 },
  weaknesses: ['fire'],
  resistances: ['physical'],
  actions: [
    { id: 'menkoSlap', name: 'めんこ打ち', target: 'ally', type: 'physical', power: 30, weight: 1.0 },
    { id: 'beigomaSpin', name: 'ベーゴマの渦', target: 'ally', type: 'magic', power: 30, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'menkoCard', uncommon: 'beigoma' },
};

/**
 * 区画のボス「自転車のぬし」（1-2 の坂の上。1章の山場）。何台もの自転車と車輪とベルがノイズで絡まった渦。真ん中に荷台の影。
 * - 前輪：壊すと「突っ走り」（強い単体攻撃）を封じる
 * - ベル：壊すと「けたたましいベル」（全体の大技）を封じ、弱点「雷」が露出する（1-1 の金魚鉢のぬしの氷と違う属性。サンダーボルトの出番）
 * - 「夕焼けの坂」は部位を使わない大技。ためている間に、ダウンさせるか防御でしのぐ
 */
export const BICYCLE_LORD: EnemyDef = {
  id: 'bicycleLord',
  name: '自転車のぬし',
  stats: { hp: 1300, atk: 28, mag: 30, def: 11, spd: 10 },
  weaknesses: [],
  resistances: [],
  parts: [
    { id: 'frontWheel', name: '前輪', hp: 190, material: '曲がったスポーク', drop: 'bentSpoke' },
    { id: 'bell', name: 'ベル', hp: 200, material: 'さびたベル', drop: 'rustyBell', revealsWeakness: ['thunder'] },
  ],
  actions: [
    { id: 'spokeSpin', name: 'スポークの渦', target: 'ally', type: 'physical', power: 32, weight: 1.0 },
    { id: 'dash', name: '突っ走り', target: 'ally', type: 'physical', power: 46, weight: 1.0, requiresPart: 'frontWheel' },
    { id: 'sunsetSlope', name: '夕焼けの坂', target: 'allies', type: 'physical', power: 48, weight: 1.0, charge: true },
    { id: 'loudBell', name: 'けたたましいベル', target: 'allies', type: 'magic', power: 46, weight: 1.0, charge: true, requiresPart: 'bell' },
  ],
  ai: { type: 'boss', lowHpRatio: 0.5, allTargetInterval: 2 },
  // 倒すと必ず「ぬしの荷台」。部位を壊すと、その部位の素材も必ず落とす
  drops: ['lordCarrier'],
};

export const SHOWA_NOISES: EnemyDef[] = [TIN_NOISE, PHONE_NOISE, RAMUNE_NOISE, MENKO_NOISE];
