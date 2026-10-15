import type { EnemyDef } from '../core/types';

// 2-2「最後の文化祭」：平成18年の秋の高校の砂嵐と、区画のボス（段階39b）。
// 姿と弱点は脚本のたたき台（docs/script/M2.md の 2章の砂嵐の表）。2-1 と同じく、弱点は氷・雷・物理・火の4つに散らす。
// 「着信音で混乱させる」「1ラウンドに2回動く」「目くらまし」はまだ戦闘の仕組みにないので、ガラケーは全体攻撃、メトロノームはとても速い敵、写真シールは速く打たれ弱い敵にした。
// 数値は自動対戦（npm run measure の「2-2」の表。1-1・1-2・2-1 を通した後の育ち具合から始める）で測って決めた。目安と測った結果は docs/design/battle.md の 13.

/** ガラケーノイズ：折りたたみの携帯電話の群れ。着信音で全体を攻める。氷が弱点、雷に強い */
export const FLIP_PHONE_NOISE: EnemyDef = {
  id: 'flipPhoneNoise',
  name: 'ガラケーノイズ',
  stats: { hp: 280, atk: 20, mag: 29, def: 10, spd: 13 },
  weaknesses: ['ice'],
  resistances: ['thunder'],
  actions: [
    { id: 'ringtone', name: '着信音', target: 'allies', type: 'magic', power: 20, weight: 1.0 },
    { id: 'flipSnap', name: 'ぱかっと噛みつき', target: 'ally', type: 'physical', power: 32, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'phoneStrap', uncommon: 'ringtoneChip' },
};

/** ラジカセノイズ：ラジカセとカセットテープ。音の全体攻撃。雷が弱点、物理に強い */
export const BOOMBOX_NOISE: EnemyDef = {
  id: 'boomboxNoise',
  name: 'ラジカセノイズ',
  stats: { hp: 380, atk: 27, mag: 25, def: 17, spd: 8 },
  weaknesses: ['thunder'],
  resistances: ['physical'],
  actions: [
    { id: 'bassBlast', name: '重低音', target: 'allies', type: 'magic', power: 22, weight: 1.0 },
    { id: 'tapeWhip', name: 'テープのむち', target: 'ally', type: 'physical', power: 36, weight: 1.0 },
  ],
  ai: { type: 'random' },
  // レアは「ラストチャイムのデモテープ」（けんたたちが録った1本。強い素材）
  dropTable: { common: 'cassetteTape', uncommon: 'boomboxDial', rare: 'demoTape' },
};

/** メトロノームノイズ：振り子が高速で揺れる。とても速い。物理が弱点（振り子が折れる）、氷に強い */
export const METRONOME_NOISE: EnemyDef = {
  id: 'metronomeNoise',
  name: 'メトロノームノイズ',
  stats: { hp: 265, atk: 28, mag: 15, def: 9, spd: 22 },
  weaknesses: ['physical'],
  resistances: ['ice'],
  actions: [
    { id: 'tick', name: '振り子打ち', target: 'ally', type: 'physical', power: 30, weight: 1.0 },
    { id: 'tempoUp', name: 'テンポアップ', target: 'ally', type: 'physical', power: 36, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'pendulumWeight', uncommon: 'tempoSpring' },
};

/** 写真シールノイズ：貼られたシールがはがれて舞う。速いが打たれ弱い。火が弱点（シールが溶ける）、氷に強い */
export const STICKER_NOISE: EnemyDef = {
  id: 'stickerNoise',
  name: '写真シールノイズ',
  stats: { hp: 220, atk: 18, mag: 27, def: 7, spd: 17 },
  weaknesses: ['fire'],
  resistances: ['ice'],
  actions: [
    { id: 'flash', name: 'フラッシュ', target: 'allies', type: 'magic', power: 18, weight: 1.0 },
    { id: 'stickOn', name: 'ぺたり', target: 'ally', type: 'magic', power: 30, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'photoSticker', uncommon: 'glitterPen' },
};

/**
 * 区画のボス「アンプのぬし」（2-2 の体育館のステージ）。アンプとスピーカーとコードが、ノイズで絡まって塔になっている。床に切れた弦が一本。
 * - スピーカー：壊すと「大音量」（全体の大技）を封じる。大音量をアンコールされる前に壊すか
 * - コード：壊すと「からみつき」（強い単体攻撃）を封じ、弱点「火」が露出する
 * - 「ハウリング」は部位を使わない大技。「アンコール」は直前に放った大技をもう一度（段階39b。core の encore）。
 *   部位を壊す順番を考えさせる（スピーカーを先に壊すと大音量のアンコールがなくなり、コードを先に壊すと弱点を突ける）
 */
export const AMP_LORD: EnemyDef = {
  id: 'ampLord',
  name: 'アンプのぬし',
  stats: { hp: 3500, atk: 46, mag: 46, def: 12, spd: 11 },
  weaknesses: [],
  resistances: [],
  parts: [
    { id: 'speaker', name: 'スピーカー', hp: 380, material: '破れたスピーカー', drop: 'tornSpeaker' },
    { id: 'cord', name: 'コード', hp: 360, material: '絡まったコード', drop: 'tangledCord', revealsWeakness: ['fire'] },
  ],
  actions: [
    { id: 'feedback', name: '音の壁', target: 'ally', type: 'magic', power: 34, weight: 1.0 },
    { id: 'entangle', name: 'からみつき', target: 'ally', type: 'physical', power: 50, weight: 1.0, requiresPart: 'cord' },
    { id: 'fullVolume', name: '大音量', target: 'allies', type: 'magic', power: 44, weight: 1.0, charge: true, requiresPart: 'speaker' },
    { id: 'howling', name: 'ハウリング', target: 'allies', type: 'thunder', power: 42, weight: 1.0, charge: true },
    { id: 'encore', name: 'アンコール', target: 'allies', type: 'magic', power: 0, weight: 1.0, charge: true, encore: true },
  ],
  ai: { type: 'boss', lowHpRatio: 0.5, allTargetInterval: 2 },
  // 倒すと必ず「ぬしのピック」。部位を壊すと、その部位の素材も必ず落とす
  drops: ['lordPick'],
};

export const SCHOOL_NOISES: EnemyDef[] = [FLIP_PHONE_NOISE, BOOMBOX_NOISE, METRONOME_NOISE, STICKER_NOISE];
