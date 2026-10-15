import type { EnemyDef } from '../core/types';

// 2-3「最後の打席」：平成10年の夏の河川敷のグラウンドの砂嵐と、区画のボス、返す直前のカイ（段階40）。
// 姿と弱点は脚本のたたき台（docs/script/M2.md の 2章の砂嵐の表）。弱点は物理・雷・火・氷の4つに散らす。
// 「仲間を回復する」「倒さないと仲間を呼ぶ」「ラウンドごとに攻撃が上がる（点差）」はまだ戦闘の仕組みにないので、
// 水筒は打たれ強い敵、電子ペットは速い敵、得点板は強い単体攻撃を封じる部位にした。
// 数値は自動対戦（npm run measure の「2-3」の表。1-1・1-2・2-1・2-2 を通した後の育ち具合から始める）で測って決めた。目安は docs/design/battle.md の 13.

/** ボールノイズ：野球のボールの群れ。速い。物理が弱点（打ち返す）、火に強い */
export const BALL_NOISE: EnemyDef = {
  id: 'ballNoise',
  name: 'ボールノイズ',
  stats: { hp: 260, atk: 30, mag: 14, def: 10, spd: 21 },
  weaknesses: ['physical'],
  resistances: ['fire'],
  actions: [
    { id: 'fastball', name: '剛速球', target: 'ally', type: 'physical', power: 36, weight: 1.0 },
    { id: 'bounce', name: 'イレギュラー', target: 'ally', type: 'physical', power: 30, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'ballSeam', uncommon: 'autographBall' },
};

/** メガホンノイズ：声援が怒号になったメガホン。全体攻撃。雷が弱点、物理に強い */
export const MEGAPHONE_NOISE: EnemyDef = {
  id: 'megaphoneNoise',
  name: 'メガホンノイズ',
  stats: { hp: 360, atk: 22, mag: 30, def: 18, spd: 9 },
  weaknesses: ['thunder'],
  resistances: ['physical'],
  actions: [
    { id: 'roar', name: '怒号', target: 'allies', type: 'magic', power: 24, weight: 1.0 },
    { id: 'jeer', name: 'やじ', target: 'ally', type: 'magic', power: 34, weight: 1.0 },
  ],
  ai: { type: 'random' },
  // レアは「最後のスコアブック」（ベンチの監督がつけていた1冊。強い素材）
  dropTable: { common: 'megaphoneMouth', uncommon: 'cheerBand', rare: 'scorebook' },
};

/** 水筒ノイズ：水筒と氷水。打たれ強い。火が弱点、氷に強い */
export const JUG_NOISE: EnemyDef = {
  id: 'jugNoise',
  name: '水筒ノイズ',
  stats: { hp: 380, atk: 22, mag: 22, def: 18, spd: 7 },
  weaknesses: ['fire'],
  resistances: ['ice'],
  actions: [
    { id: 'iceWater', name: '氷水かけ', target: 'allies', type: 'ice', power: 20, weight: 1.0 },
    { id: 'jugSwing', name: 'ふり回し', target: 'ally', type: 'physical', power: 34, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'jugIce', uncommon: 'jugCap' },
};

/** 電子ペットノイズ：小さな画面の生き物。速い。氷が弱点、雷に強い */
export const PET_NOISE: EnemyDef = {
  id: 'petNoise',
  name: '電子ペットノイズ',
  stats: { hp: 240, atk: 18, mag: 30, def: 9, spd: 19 },
  weaknesses: ['ice'],
  resistances: ['thunder'],
  actions: [
    { id: 'beep', name: 'ピコピコ', target: 'allies', type: 'thunder', power: 20, weight: 1.0 },
    { id: 'tantrum', name: 'かんしゃく', target: 'ally', type: 'magic', power: 34, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'petEgg', uncommon: 'buttonCell' },
};

/**
 * 区画のボス「スコアボードのぬし」（2-3 のホームベースの前）。得点板とバックネットと何百ものメガホンの巨体。数字が回り続ける。
 * - 得点板：壊すと「大量得点」（強い単体攻撃）を封じる
 * - バックネット：壊すと「ゲッツー」（全体）を封じ、弱点「氷」が露出する
 * - 大技「サヨナラ」（全体・ため）はどの部位も使わない
 */
export const SCOREBOARD_LORD: EnemyDef = {
  id: 'scoreboardLord',
  name: 'スコアボードのぬし',
  stats: { hp: 3500, atk: 42, mag: 42, def: 13, spd: 11 },
  weaknesses: [],
  resistances: [],
  parts: [
    { id: 'scoreboard', name: '得点板', hp: 380, material: '得点板の札', drop: 'scorePlate' },
    { id: 'backstop', name: 'バックネット', hp: 380, material: '破れたネット', drop: 'tornNet', revealsWeakness: ['ice'] },
  ],
  actions: [
    { id: 'cheerBlast', name: '大声援', target: 'ally', type: 'magic', power: 34, weight: 1.0 },
    { id: 'bigInning', name: '大量得点', target: 'ally', type: 'physical', power: 52, weight: 1.0, requiresPart: 'scoreboard' },
    { id: 'doublePlay', name: 'ゲッツー', target: 'allies', type: 'physical', power: 40, weight: 1.0, requiresPart: 'backstop' },
    { id: 'sayonara', name: 'サヨナラ', target: 'allies', type: 'physical', power: 48, weight: 1.0, charge: true },
  ],
  ai: { type: 'boss', lowHpRatio: 0.5, allTargetInterval: 2 },
  // 倒すと必ず「ぬしのバット」。部位を壊すと、その部位の素材も必ず落とす
  drops: ['lordBat'],
};

/**
 * カイ（段階40。2-3 の返す直前の負け戦）。時間保管局のアーカイバー。白い長いコートと、四角い枠の形の刃。
 * 勝てない強さにはせず、決まったラウンドか HP が半分を切った所で打ち切る（区画の戦闘の cutoff）。速く、手ごわい
 */
export const KAI: EnemyDef = {
  id: 'kai',
  name: 'カイ',
  stats: { hp: 1800, atk: 42, mag: 42, def: 16, spd: 30 },
  weaknesses: [],
  resistances: [],
  actions: [
    { id: 'frameCut', name: '切り取り', target: 'ally', type: 'physical', power: 46, weight: 1.0 },
    { id: 'frameRain', name: 'フレームの雨', target: 'allies', type: 'magic', power: 30, weight: 1.0 },
    { id: 'shutter', name: 'シャッター', target: 'allies', type: 'magic', power: 44, weight: 1.0, charge: true },
  ],
  ai: { type: 'random' },
};

export const RIVERSIDE_NOISES: EnemyDef[] = [BALL_NOISE, MEGAPHONE_NOISE, JUG_NOISE, PET_NOISE];
