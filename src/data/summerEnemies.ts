import type { EnemyDef } from '../core/types';

// 4-1「シロのいた夏」：平成30年の夏、田舎のおじいちゃんの家と田んぼと川の砂嵐と、あぜ道のお地蔵さまの前の番人、区画のボス（段階137a）。
// 名前は脚本の候補（docs/script/4-1.md の 3.・6.）。3-1（昭和の夏）の扇風機・蚊取り線香とは物を変え、扇風機の代わりに水鉄砲にした。
// 弱点は物理・雷・火・氷の4つに散らす。数値は自動対戦（npm run measure の「4-1」の表。3章を通した後の育ち具合から始める）で測って決めた。目安は docs/design/battle.md の 13.

/** 虫かごノイズ：緑のふたの、プラスチックの虫かご。中で羽音がする。火が弱点（溶ける）、物理に強い（はずむ） */
export const BUGCAGE_NOISE: EnemyDef = {
  id: 'bugcageNoise',
  name: '虫かごノイズ',
  stats: { hp: 320, atk: 32, mag: 18, def: 14, spd: 18 },
  weaknesses: ['fire'],
  resistances: ['physical'],
  actions: [
    { id: 'buzz', name: '羽音', target: 'allies', type: 'physical', power: 24, weight: 1.0 },
    { id: 'lidSnap', name: 'ふたばさみ', target: 'ally', type: 'physical', power: 38, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'cageMesh', uncommon: 'cageStrap' },
};

/** すいかノイズ：半分に切ったすいか。種をとばす。打たれ強い。物理が弱点（割れる）、氷に強い（冷えている） */
export const WATERMELON_NOISE: EnemyDef = {
  id: 'watermelonNoise',
  name: 'すいかノイズ',
  stats: { hp: 420, atk: 30, mag: 14, def: 18, spd: 8 },
  weaknesses: ['physical'],
  resistances: ['ice'],
  actions: [
    { id: 'seedShot', name: '種とばし', target: 'allies', type: 'physical', power: 26, weight: 1.0 },
    { id: 'roll', name: 'ごろごろ', target: 'ally', type: 'physical', power: 38, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'melonRind', uncommon: 'melonSeed' },
};

/** 花火の燃えかすノイズ：バケツに挿した手持ち花火の燃えかす。ときどき火の粉。魔力が高い。氷が弱点（湿気る）、火に強い */
export const FIREWORK_NOISE: EnemyDef = {
  id: 'fireworkNoise',
  name: '花火の燃えかすノイズ',
  stats: { hp: 300, atk: 18, mag: 34, def: 10, spd: 14 },
  weaknesses: ['ice'],
  resistances: ['fire'],
  actions: [
    { id: 'sparks', name: '火の粉', target: 'allies', type: 'fire', power: 24, weight: 1.0 },
    { id: 'smoke', name: 'けむり', target: 'ally', type: 'magic', power: 36, weight: 1.0 },
  ],
  ai: { type: 'random' },
  // レアは「線香花火の玉」（落ちる前の、まるい火の玉。強い素材）
  dropTable: { common: 'fireworkStick', uncommon: 'fireworkPaper', rare: 'sparklerBead' },
};

/** 水鉄砲ノイズ：ポンプ式の大きな水鉄砲。速い。雷が弱点（水が電気を通す）、火に強い（水） */
export const WATERGUN_NOISE: EnemyDef = {
  id: 'watergunNoise',
  name: '水鉄砲ノイズ',
  stats: { hp: 280, atk: 34, mag: 20, def: 10, spd: 24 },
  weaknesses: ['thunder'],
  resistances: ['fire'],
  actions: [
    { id: 'squirt', name: 'ぴゅっ', target: 'ally', type: 'ice', power: 36, weight: 1.0 },
    { id: 'pump', name: 'ポンプ連射', target: 'allies', type: 'physical', power: 22, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'pumpHandle', uncommon: 'waterTank' },
};

/**
 * あぜ道の番人「お地蔵さまの前の砂嵐」（2晩目）。お地蔵さまの前に供えられた風車と前掛けが、砂嵐になって道をふさぐ。
 * 守りが固く、全体に「風車」。弱点は雷
 */
export const JIZO_NOISE: EnemyDef = {
  id: 'jizoNoise',
  name: 'お地蔵さまの前の砂嵐',
  stats: { hp: 980, atk: 32, mag: 32, def: 24, spd: 10 },
  weaknesses: ['thunder'],
  resistances: ['physical'],
  actions: [
    { id: 'windmills', name: '風車', target: 'allies', type: 'magic', power: 26, weight: 1.0 },
    { id: 'bibSlap', name: '前掛け', target: 'ally', type: 'physical', power: 40, weight: 1.0 },
  ],
  ai: { type: 'random' },
  drops: ['jizoBib'],
};

/**
 * 区画のボス「川のぬし」（4-1 の川の浅瀬）。大きな麦わら帽子の形をしたノイズが、浅瀬の流れに乗ってくる。
 * - つば：壊すと「照り返し」（全体）を封じ、弱点「火」が露出する（日かげで弱点を隠す部位）
 * - 流れ：壊すと「鉄砲水」（強い単体攻撃）を封じる
 * - 大技「夏の大水」（全体・ため）はどの部位も使わない
 */
export const RIVER_LORD: EnemyDef = {
  id: 'riverLord',
  name: '川のぬし',
  stats: { hp: 4000, atk: 48, mag: 46, def: 14, spd: 12 },
  weaknesses: [],
  resistances: [],
  parts: [
    { id: 'brim', name: 'つば', hp: 440, material: '麦わらのつば', drop: 'hatBrim', revealsWeakness: ['fire'] },
    { id: 'current', name: '流れ', hp: 440, material: '川底の石', drop: 'riverStone' },
  ],
  actions: [
    { id: 'riverSplash', name: '水しぶき', target: 'ally', type: 'ice', power: 34, weight: 1.0 },
    { id: 'flashFlood', name: '鉄砲水', target: 'ally', type: 'physical', power: 58, weight: 1.0, requiresPart: 'current' },
    { id: 'glare', name: '照り返し', target: 'allies', type: 'thunder', power: 40, weight: 1.0, requiresPart: 'brim' },
    { id: 'summerFlood', name: '夏の大水', target: 'allies', type: 'physical', power: 54, weight: 1.0, charge: true },
  ],
  ai: { type: 'boss', lowHpRatio: 0.5, allTargetInterval: 2 },
  // 倒すと必ず「ぬしの麦わら帽子」。部位を壊すと、その部位の素材も必ず落とす
  drops: ['lordStrawHat'],
};

export const SUMMER_NOISES: EnemyDef[] = [BUGCAGE_NOISE, WATERMELON_NOISE, FIREWORK_NOISE, WATERGUN_NOISE];
