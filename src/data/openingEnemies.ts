import type { EnemyDef } from '../core/types';

// 4-2「早瀬の時間」：平成9年（1997年）の春、時計屋の開店の日の商店街の砂嵐と、坂の手前の番人、区画のボス（段階140a）。
// 名前は脚本の候補（docs/script/4-2.md の 3.・6.）。1-2（昭和63年の夏）の物とは変える。
// 段階149：早瀬を50代にしたので、開店の日を昭和55年から平成9年に動かし、1980年の物（ルービックキューブ・テーブルのゲーム機）を1997年の物に替えた。
// 素材の id は、セーブに入っているので前のまま（名前だけ替えた）。弱点は物理・雷・火・氷の4つに散らす。
// 数値は自動対戦（npm run measure の「4-2」の表。4-1 を通した後の育ち具合から始める）で測って決めた。目安は docs/design/battle.md の 13.

/** ハイパーヨーヨーノイズ：平成9年に大流行したヨーヨーが、糸を伸ばしたまま回り続ける。氷が弱点（冷えて糸が固まる）、火に強い */
export const YOYO_NOISE: EnemyDef = {
  id: 'yoyoNoise',
  name: 'ハイパーヨーヨーノイズ',
  stats: { hp: 330, atk: 32, mag: 20, def: 16, spd: 14 },
  weaknesses: ['ice'],
  resistances: ['fire'],
  actions: [
    { id: 'loop', name: 'ループ', target: 'ally', type: 'physical', power: 38, weight: 1.0 },
    { id: 'colorScatter', name: '光る回転', target: 'allies', type: 'magic', power: 24, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'cubeTile', uncommon: 'cubeCore' },
};

/** ポケベルノイズ：ポケットベルが、鳴りやまない数字の呼び出しを飛ばす。物理が弱点（小さな画面が割れる）、雷に強い */
export const PAGER_NOISE: EnemyDef = {
  id: 'pagerNoise',
  name: 'ポケベルノイズ',
  stats: { hp: 420, atk: 22, mag: 32, def: 18, spd: 8 },
  weaknesses: ['physical'],
  resistances: ['thunder'],
  actions: [
    { id: 'pixelShot', name: '呼び出し', target: 'allies', type: 'thunder', power: 26, weight: 1.0 },
    { id: 'gameOver', name: '0840（おはよう）', target: 'ally', type: 'magic', power: 38, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'gameButton', uncommon: 'gameGlass' },
};

/** 紙風船ノイズ：開店の日に配った紙風船が、ふわふわ集まる。速い。火が弱点（紙）、物理に強い（ふわりとかわす） */
export const PAPERBALLOON_NOISE: EnemyDef = {
  id: 'paperballoonNoise',
  name: '紙風船ノイズ',
  stats: { hp: 280, atk: 30, mag: 22, def: 10, spd: 24 },
  weaknesses: ['fire'],
  resistances: ['physical'],
  actions: [
    { id: 'bounce', name: 'ぽん', target: 'ally', type: 'physical', power: 36, weight: 1.0 },
    { id: 'drift', name: 'ふわり', target: 'allies', type: 'ice', power: 22, weight: 1.0 },
  ],
  ai: { type: 'random' },
  // レアは「赤い紙風船」（開店の日に、しずえさんが配った紙風船。強い素材）
  dropTable: { common: 'balloonPaper', uncommon: 'balloonMouth', rare: 'redBalloon' },
};

/** 鳩時計ノイズ：鳩が出たまま戻らない鳩時計。鳴き声が止まらない。雷が弱点（ぜんまいが跳ねる）、氷に強い */
export const CUCKOO_NOISE: EnemyDef = {
  id: 'cuckooNoise',
  name: '鳩時計ノイズ',
  stats: { hp: 320, atk: 20, mag: 34, def: 12, spd: 12 },
  weaknesses: ['thunder'],
  resistances: ['ice'],
  actions: [
    { id: 'cuckoo', name: 'ぽっぽう', target: 'allies', type: 'magic', power: 24, weight: 1.0 },
    { id: 'pendulum', name: '振り子', target: 'ally', type: 'physical', power: 36, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'cuckooBird', uncommon: 'cuckooWeight' },
};

/**
 * 坂の手前の番人「開店祝いの花輪ノイズ」（2晩目）。店の前に並んだ開店祝いの花輪が、ノイズで何重にも重なる。
 * 守りが固く、全体に「花吹雪」。弱点は火
 */
export const WREATH_NOISE: EnemyDef = {
  id: 'wreathNoise',
  name: '開店祝いの花輪ノイズ',
  stats: { hp: 1000, atk: 34, mag: 34, def: 26, spd: 10 },
  weaknesses: ['fire'],
  resistances: ['ice'],
  actions: [
    { id: 'petalStorm', name: '花吹雪', target: 'allies', type: 'magic', power: 28, weight: 1.0 },
    { id: 'wreathStand', name: '花輪の脚', target: 'ally', type: 'physical', power: 42, weight: 1.0 },
  ],
  ai: { type: 'random' },
  drops: ['wreathRibbon'],
};

/**
 * 区画のボス「シャッターのぬし」（4-2 の開店の日の店の中）。何度上げても、ガラガラと下りてくるシャッター。ノイズの中で何十枚も重なっている。
 * - 板：壊すと「おろす」（全体）を封じ、弱点「雷」が露出する（重なった板が弱点を隠す部位）
 * - 巻き上げ機：壊すと「巻きこみ」（強い単体攻撃）を封じる
 * - 大技「閉店」（全体・ため）はどの部位も使わない
 */
export const SHUTTER_LORD: EnemyDef = {
  id: 'shutterLord',
  name: 'シャッターのぬし',
  stats: { hp: 4100, atk: 50, mag: 48, def: 14, spd: 12 },
  weaknesses: [],
  resistances: [],
  parts: [
    { id: 'slats', name: '板', hp: 460, material: 'シャッターの板', drop: 'shutterSlat', revealsWeakness: ['thunder'] },
    { id: 'winch', name: '巻き上げ機', hp: 460, material: '巻き上げの歯車', drop: 'winchGear' },
  ],
  actions: [
    { id: 'rattle', name: 'ガラガラ', target: 'ally', type: 'magic', power: 36, weight: 1.0 },
    { id: 'windIn', name: '巻きこみ', target: 'ally', type: 'physical', power: 60, weight: 1.0, requiresPart: 'winch' },
    { id: 'pullDown', name: 'おろす', target: 'allies', type: 'physical', power: 42, weight: 1.0, requiresPart: 'slats' },
    { id: 'closing', name: '閉店', target: 'allies', type: 'physical', power: 56, weight: 1.0, charge: true },
  ],
  ai: { type: 'boss', lowHpRatio: 0.5, allTargetInterval: 2 },
  // 倒すと必ず「ぬしの合鍵」。部位を壊すと、その部位の素材も必ず落とす
  drops: ['lordShutterKey'],
};

export const OPENING_NOISES: EnemyDef[] = [YOYO_NOISE, PAGER_NOISE, PAPERBALLOON_NOISE, CUCKOO_NOISE];
