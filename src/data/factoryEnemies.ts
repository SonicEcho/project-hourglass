import type { EnemyDef } from '../core/types';

// 2-1「親方の背中」：昭和44年の冬の町工場の砂嵐と、区画のボス（段階39）。
// 姿と弱点は脚本のたたき台（docs/script/M2.md の 2章の砂嵐の表）。2章は3人なので、弱点は雷・火・物理・氷の4つに散らす（雷はみおのサンダーの出番）。
// 敵が仲間の守りを固める行動はまだないので、そろばんノイズは守りの固い敵にした。
// 数値は自動対戦（npm run measure の「2-1」の表。1-1・1-2 を通した後の育ち具合から始める）で測って決める。目安は docs/design/battle.md の 13.

/** 歯車ノイズ：歯車とぜんまいが噛み合わずに回る塊。突進。雷が弱点（噛み合わせが狂う）、物理に強い */
export const GEAR_NOISE: EnemyDef = {
  id: 'gearNoise',
  name: '歯車ノイズ',
  stats: { hp: 310, atk: 26, mag: 14, def: 16, spd: 8 },
  weaknesses: ['thunder'],
  resistances: ['physical'],
  actions: [
    { id: 'gearRush', name: '歯車の突進', target: 'ally', type: 'physical', power: 40, weight: 1.0 },
    { id: 'gearGrind', name: '噛み合わせ', target: 'ally', type: 'physical', power: 30, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'wornGear', uncommon: 'masterGear' },
};

/** ネジノイズ：ネジとボルトの群れ。速い。火が弱点（焼き付く）、氷に強い */
export const SCREW_NOISE: EnemyDef = {
  id: 'screwNoise',
  name: 'ネジノイズ',
  stats: { hp: 200, atk: 23, mag: 16, def: 8, spd: 18 },
  weaknesses: ['fire'],
  resistances: ['ice'],
  actions: [
    { id: 'screwShot', name: 'ネジ飛ばし', target: 'ally', type: 'physical', power: 30, weight: 1.0 },
    { id: 'boltRain', name: 'ボルトの雨', target: 'allies', type: 'physical', power: 16, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'rustyScrew', uncommon: 'brassBolt' },
};

/** 真空管ノイズ：真空管ラジオがノイズで崩れた姿。全体に雷。物理が弱点（ガラスが割れる）、雷に強い */
export const TUBE_NOISE: EnemyDef = {
  id: 'tubeNoise',
  name: '真空管ノイズ',
  stats: { hp: 220, atk: 15, mag: 26, def: 9, spd: 11 },
  weaknesses: ['physical'],
  resistances: ['thunder'],
  actions: [
    { id: 'discharge', name: '放電', target: 'allies', type: 'thunder', power: 20, weight: 1.0 },
    { id: 'tubeGlow', name: '管のきらめき', target: 'ally', type: 'magic', power: 32, weight: 1.0 },
  ],
  ai: { type: 'random' },
  // レアは「万博のきっぷ」（ラジオが話していた、来年の大阪の万博。1-2 の夕焼けのビー玉と同じ、強い素材）
  dropTable: { common: 'tubeGlass', uncommon: 'filament', rare: 'expoTicket' },
};

/** そろばんノイズ：そろばんの珠が飛び散る。守りが固い。氷が弱点（珠が凍って止まる）、火に強い */
export const ABACUS_NOISE: EnemyDef = {
  id: 'abacusNoise',
  name: 'そろばんノイズ',
  stats: { hp: 235, atk: 19, mag: 20, def: 17, spd: 12 },
  weaknesses: ['ice'],
  resistances: ['fire'],
  actions: [
    { id: 'beadShot', name: '珠はじき', target: 'ally', type: 'physical', power: 30, weight: 1.0 },
    { id: 'beadStorm', name: '珠の雨', target: 'allies', type: 'magic', power: 18, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'abacusBead', uncommon: 'abacusFrame' },
};

/**
 * 区画のボス「旋盤のぬし」（2-1 の工場の中）。旋盤とベルトと削りくずが、ノイズで絡まって渦を巻いている。真ん中に小さな歯車の光。
 * - 刃物台：壊すと「削り出し」（強い単体攻撃）を封じる
 * - ベルト：壊すと「空回り」（全体の大技）を封じ、弱点「物理」が露出する（ハルトとみおの連携技クロスドライブの見せ場）
 * - 「削りくずの嵐」は部位を使わない大技。ためている間に、ダウンさせるか防御でしのぐ
 */
export const LATHE_LORD: EnemyDef = {
  id: 'latheLord',
  name: '旋盤のぬし',
  stats: { hp: 2700, atk: 48, mag: 48, def: 12, spd: 10 },
  weaknesses: [],
  resistances: [],
  parts: [
    { id: 'toolPost', name: '刃物台', hp: 350, material: '欠けたバイト', drop: 'chippedTool' },
    { id: 'belt', name: 'ベルト', hp: 370, material: '切れたベルト', drop: 'brokenBelt', revealsWeakness: ['physical'] },
  ],
  actions: [
    { id: 'shavings', name: '削りくず飛ばし', target: 'ally', type: 'physical', power: 34, weight: 1.0 },
    { id: 'carveOut', name: '削り出し', target: 'ally', type: 'physical', power: 50, weight: 1.0, requiresPart: 'toolPost' },
    { id: 'shavingStorm', name: '削りくずの嵐', target: 'allies', type: 'physical', power: 46, weight: 1.0, charge: true },
    { id: 'spinOut', name: '空回り', target: 'allies', type: 'magic', power: 44, weight: 1.0, charge: true, requiresPart: 'belt' },
  ],
  ai: { type: 'boss', lowHpRatio: 0.5, allTargetInterval: 2 },
  // 倒すと必ず「ぬしの歯車」。部位を壊すと、その部位の素材も必ず落とす
  drops: ['lordGear'],
};

export const FACTORY_NOISES: EnemyDef[] = [GEAR_NOISE, SCREW_NOISE, TUBE_NOISE, ABACUS_NOISE];
