import type { EnemyDef } from '../core/types';

// 3-1「はじめての仕送り」：昭和41年の夏、お盆の山あいの村の砂嵐と、門の番人、区画のボス（段階88）。
// 名前は脚本の候補（docs/script/3-1.md の 6.）。弱点は物理・雷・火・氷の4つに散らす。
// 数値は自動対戦（npm run measure の「3-1」の表。1-1〜2-3 を通した後の育ち具合から始める）で測って決めた。目安は docs/design/battle.md の 13.

/** 扇風機ノイズ：羽の欠けた扇風機。速い。雷が弱点（モーター）、氷に強い（風は冷たい） */
export const FAN_NOISE: EnemyDef = {
  id: 'fanNoise',
  name: '扇風機ノイズ',
  stats: { hp: 280, atk: 32, mag: 16, def: 11, spd: 22 },
  weaknesses: ['thunder'],
  resistances: ['ice'],
  actions: [
    { id: 'gust', name: '強風', target: 'allies', type: 'physical', power: 24, weight: 1.0 },
    { id: 'blade', name: '羽ばたき', target: 'ally', type: 'physical', power: 36, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'fanBlade', uncommon: 'fanTimer' },
};

/** 蚊取り線香ノイズ：渦巻きの煙。氷が弱点（火が消える）、火に強い */
export const COIL_NOISE: EnemyDef = {
  id: 'coilNoise',
  name: '蚊取り線香ノイズ',
  stats: { hp: 300, atk: 18, mag: 32, def: 10, spd: 13 },
  weaknesses: ['ice'],
  resistances: ['fire'],
  actions: [
    { id: 'smoke', name: 'けむり', target: 'allies', type: 'fire', power: 22, weight: 1.0 },
    { id: 'ember', name: '火の粉', target: 'ally', type: 'fire', power: 36, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'coilAsh', uncommon: 'coilStand' },
};

/** トランジスタラジオノイズ：ちよが組み立てたのと同じ形のラジオ。全体攻撃。物理が弱点（叩けば直る）、雷に強い */
export const RADIO_NOISE: EnemyDef = {
  id: 'radioNoise',
  name: 'トランジスタラジオノイズ',
  stats: { hp: 340, atk: 22, mag: 30, def: 14, spd: 10 },
  weaknesses: ['physical'],
  resistances: ['thunder'],
  actions: [
    { id: 'static', name: '雑音', target: 'allies', type: 'thunder', power: 24, weight: 1.0 },
    { id: 'tuning', name: '選局', target: 'ally', type: 'magic', power: 34, weight: 1.0 },
  ],
  ai: { type: 'random' },
  // レアは「はじめての給料袋」（ちよの初めての仕送り。強い素材）
  dropTable: { common: 'radioDial', uncommon: 'radioEarphone', rare: 'payEnvelope' },
};

/** ちゃぶ台ノイズ：脚の折れたちゃぶ台と茶わん。打たれ強い。火が弱点（木）、物理に強い */
export const TABLE_NOISE: EnemyDef = {
  id: 'tableNoise',
  name: 'ちゃぶ台ノイズ',
  stats: { hp: 400, atk: 30, mag: 14, def: 20, spd: 7 },
  weaknesses: ['fire'],
  resistances: ['physical'],
  actions: [
    { id: 'flip', name: 'ひっくり返し', target: 'allies', type: 'physical', power: 26, weight: 1.0 },
    { id: 'teacup', name: '湯のみ投げ', target: 'ally', type: 'physical', power: 34, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'tableLeg', uncommon: 'teacup' },
};

/**
 * 実家の門の番人「郵便ポストノイズ」（2晩目）。赤い丸ポストの形が崩れて、口から仕送りの封筒がこぼれている。
 * 守りが固く、全体に「手紙の雨」。弱点は氷（紙が湿る）
 */
export const POSTBOX_NOISE: EnemyDef = {
  id: 'postboxNoise',
  name: '郵便ポストノイズ',
  stats: { hp: 900, atk: 30, mag: 30, def: 24, spd: 9 },
  weaknesses: ['ice'],
  resistances: ['fire'],
  actions: [
    { id: 'letterRain', name: '手紙の雨', target: 'allies', type: 'magic', power: 26, weight: 1.0 },
    { id: 'stamp', name: '消印', target: 'ally', type: 'physical', power: 38, weight: 1.0 },
  ],
  ai: { type: 'random' },
  drops: ['postLetter'],
};

/**
 * 区画のボス「汽車のぬし」（3-1 の夕暮れの駅のホーム）。黒い汽車が煙と鉄の車輪の大きな影になって、ホームを塞いでいる。
 * - 煙突：壊すと「黒煙」（全体）を封じ、弱点「雷」が露出する（煙で弱点を隠す部位）
 * - 車輪：壊すと「突進」（強い単体攻撃）を封じる
 * - 大技「発車のベル」（全体・ため）はどの部位も使わない
 */
export const TRAIN_LORD: EnemyDef = {
  id: 'trainLord',
  name: '汽車のぬし',
  stats: { hp: 3800, atk: 44, mag: 44, def: 14, spd: 11 },
  weaknesses: [],
  resistances: [],
  parts: [
    { id: 'chimney', name: '煙突', hp: 400, material: '煙突のすす', drop: 'chimneySoot', revealsWeakness: ['thunder'] },
    { id: 'wheel', name: '車輪', hp: 400, material: '汽車の車輪', drop: 'trainWheel' },
  ],
  actions: [
    { id: 'whistle', name: '汽笛', target: 'ally', type: 'magic', power: 34, weight: 1.0 },
    { id: 'charge', name: '突進', target: 'ally', type: 'physical', power: 54, weight: 1.0, requiresPart: 'wheel' },
    { id: 'blackSmoke', name: '黒煙', target: 'allies', type: 'fire', power: 40, weight: 1.0, requiresPart: 'chimney' },
    { id: 'departBell', name: '発車のベル', target: 'allies', type: 'physical', power: 50, weight: 1.0, charge: true },
  ],
  ai: { type: 'boss', lowHpRatio: 0.5, allTargetInterval: 2 },
  // 倒すと必ず「ぬしの汽笛」。部位を壊すと、その部位の素材も必ず落とす
  drops: ['lordWhistle'],
};

export const VILLAGE_NOISES: EnemyDef[] = [FAN_NOISE, COIL_NOISE, RADIO_NOISE, TABLE_NOISE];
