import type { EnemyDef } from '../core/types';

// 3-2「言えなかった卒業式」：平成31年3月、卒業式の帰り道の砂嵐と、商店街の端の番人、区画のボス（段階94）。
// 名前は脚本の候補（docs/script/3-2.md の 6.）。2-2（平成18年の高校）とは物を変える。弱点は物理・雷・火・氷の4つに散らす。
// 数値は自動対戦（npm run measure の「3-2」の表。1-1〜祭りの夜を通した後の育ち具合から始める）で測って決めた。目安は docs/design/battle.md の 13.

/** イヤホンノイズ：絡まった有線のイヤホンのコード。縛りつける。雷が弱点（電気の通り道）、氷に強い */
export const EARPHONE_NOISE: EnemyDef = {
  id: 'earphoneNoise',
  name: 'イヤホンノイズ',
  stats: { hp: 300, atk: 30, mag: 22, def: 12, spd: 18 },
  weaknesses: ['thunder'],
  resistances: ['ice'],
  actions: [
    { id: 'tangle', name: 'からまる', target: 'ally', type: 'physical', power: 36, weight: 1.0 },
    { id: 'feedback', name: '音もれ', target: 'allies', type: 'thunder', power: 22, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'earphoneCord', uncommon: 'earbudTip' },
};

/** 自撮り棒ノイズ：伸び縮みする棒の先に、割れた画面。速い。物理が弱点（折れやすい）、雷に強い */
export const SELFIE_NOISE: EnemyDef = {
  id: 'selfieNoise',
  name: '自撮り棒ノイズ',
  stats: { hp: 280, atk: 34, mag: 14, def: 10, spd: 24 },
  weaknesses: ['physical'],
  resistances: ['thunder'],
  actions: [
    { id: 'extend', name: 'のびる', target: 'ally', type: 'physical', power: 38, weight: 1.0 },
    { id: 'flash', name: 'フラッシュ', target: 'allies', type: 'thunder', power: 22, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'selfieGrip', uncommon: 'crackedLens' },
};

/** タピオカノイズ：ぷるぷるの黒い粒と、太いストロー。打たれ強い。火が弱点（溶ける）、物理に強い（弾む） */
export const TAPIOCA_NOISE: EnemyDef = {
  id: 'tapiocaNoise',
  name: 'タピオカノイズ',
  stats: { hp: 400, atk: 28, mag: 16, def: 20, spd: 8 },
  weaknesses: ['fire'],
  resistances: ['physical'],
  actions: [
    { id: 'pearlShot', name: '粒とばし', target: 'allies', type: 'physical', power: 26, weight: 1.0 },
    { id: 'slurp', name: '吸いこみ', target: 'ally', type: 'physical', power: 34, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'tapiocaPearl', uncommon: 'thickStraw' },
};

/** 卒業証書の筒ノイズ：ふたの外れた筒から、白い紙があふれる。魔力が高い。氷が弱点（紙が湿る）、火に強い */
export const DIPLOMA_NOISE: EnemyDef = {
  id: 'diplomaNoise',
  name: '卒業証書の筒ノイズ',
  stats: { hp: 320, atk: 18, mag: 32, def: 12, spd: 12 },
  weaknesses: ['ice'],
  resistances: ['fire'],
  actions: [
    { id: 'pokon', name: 'ぽこっ', target: 'ally', type: 'magic', power: 36, weight: 1.0 },
    { id: 'paperStorm', name: '紙吹雪', target: 'allies', type: 'fire', power: 22, weight: 1.0 },
  ],
  ai: { type: 'random' },
  // レアは「第二ボタン」（とうやが最後まで外さなかったボタン。強い素材）
  dropTable: { common: 'diplomaCap', uncommon: 'flowerRibbon', rare: 'secondButton' },
};

/**
 * 商店街の端の番人「寄せ書きの色紙ノイズ」（2晩目）。色紙が何十枚も渦を巻いて重なる。
 * どの色紙にも「元気で」「またね」と同じ言葉ばかり。守りが固く、全体に「寄せ書き」。弱点は火（紙）
 */
export const YOSEGAKI_NOISE: EnemyDef = {
  id: 'yosegakiNoise',
  name: '寄せ書きの色紙ノイズ',
  stats: { hp: 950, atk: 30, mag: 32, def: 24, spd: 10 },
  weaknesses: ['fire'],
  resistances: ['ice'],
  actions: [
    { id: 'messages', name: '寄せ書き', target: 'allies', type: 'magic', power: 26, weight: 1.0 },
    { id: 'cardEdge', name: '色紙のふち', target: 'ally', type: 'physical', power: 40, weight: 1.0 },
  ],
  ai: { type: 'random' },
  drops: ['blankCard'],
};

/**
 * 区画のボス「踏切のぬし」（3-2 の夕暮れの踏切）。警報機の赤い灯りが何十にも重なって点滅し、上がらない遮断機が何本も伸びている。
 * - 警報機：壊すと「警報」（全体）を封じ、弱点「氷」が露出する（音で弱点を隠す部位）
 * - 遮断機：壊すと「遮断」（強い単体攻撃）を封じる
 * - 大技「通過電車」（全体・ため）はどの部位も使わない
 */
export const CROSSING_LORD: EnemyDef = {
  id: 'crossingLord',
  name: '踏切のぬし',
  stats: { hp: 3900, atk: 46, mag: 44, def: 14, spd: 12 },
  weaknesses: [],
  resistances: [],
  parts: [
    { id: 'alarm', name: '警報機', hp: 420, material: '警報機の赤い灯', drop: 'alarmLamp', revealsWeakness: ['ice'] },
    { id: 'barrier', name: '遮断機', hp: 420, material: '遮断機の竿', drop: 'barrierArm' },
  ],
  actions: [
    { id: 'whistleWind', name: '風圧', target: 'ally', type: 'magic', power: 34, weight: 1.0 },
    { id: 'shut', name: '遮断', target: 'ally', type: 'physical', power: 56, weight: 1.0, requiresPart: 'barrier' },
    { id: 'alarmBell', name: '警報', target: 'allies', type: 'thunder', power: 40, weight: 1.0, requiresPart: 'alarm' },
    { id: 'passingTrain', name: '通過電車', target: 'allies', type: 'physical', power: 52, weight: 1.0, charge: true },
  ],
  ai: { type: 'boss', lowHpRatio: 0.5, allTargetInterval: 2 },
  // 倒すと必ず「ぬしの警報灯」。部位を壊すと、その部位の素材も必ず落とす
  drops: ['lordSignal'],
};

export const GRAD_NOISES: EnemyDef[] = [EARPHONE_NOISE, SELFIE_NOISE, TAPIOCA_NOISE, DIPLOMA_NOISE];
