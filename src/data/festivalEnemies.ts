import type { EnemyDef } from '../core/types';

// 1-1「金魚の名前」：平成の終わりの縁日の砂嵐と、区画のボス（段階27）。
// 砂嵐は、その時間の中にあった物がノイズで崩れて混ざった姿（docs/STORY.md の 2-5）。名前は「物の名前＋ノイズ」（docs/NAMING.md）。
// 1章はハルト（火・物理）とあかり（氷・回復）の2人で戦うので、弱点は2人が突ける火・氷・物理を中心にする（わたあめだけ雷。サンダーボルトの出番）。
// 数値は自動対戦（npm run measure の「1-1」の表）で測って決める。目安は docs/design/battle.md の 13.

/** 金魚ノイズ：最初に出会う砂嵐。氷が弱点（凍る）、火は効きにくい（水の中） */
export const GOLDFISH_NOISE: EnemyDef = {
  id: 'goldfishNoise',
  name: '金魚ノイズ',
  stats: { hp: 130, atk: 13, mag: 8, def: 8, spd: 9 },
  weaknesses: ['ice'],
  resistances: ['fire'],
  actions: [{ id: 'finSlap', name: 'ひれ打ち', target: 'ally', type: 'physical', power: 28, weight: 1.0 }],
  ai: { type: 'random' },
  // 落とし物（段階27b）：いつも うろこ、珍しい ひれ、レア なつの尾びれ
  dropTable: { common: 'goldfishScale', uncommon: 'goldfishFin', rare: 'natsuTail' },
};

/** 水風船ノイズ：はずんで速い。物理が弱点（割れる）、氷は効きにくい */
export const BALLOON_NOISE: EnemyDef = {
  id: 'balloonNoise',
  name: '水風船ノイズ',
  stats: { hp: 100, atk: 12, mag: 13, def: 6, spd: 14 },
  weaknesses: ['physical'],
  resistances: ['ice'],
  actions: [
    { id: 'bounce', name: 'はねる', target: 'ally', type: 'physical', power: 24, weight: 1.0 },
    { id: 'splash', name: '水しぶき', target: 'ally', type: 'ice', power: 28, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'balloonShard', uncommon: 'balloonRubber' },
};

/** お面ノイズ：かたい。火が弱点（燃える）、物理は効きにくい */
export const MASK_NOISE: EnemyDef = {
  id: 'maskNoise',
  name: 'お面ノイズ',
  stats: { hp: 170, atk: 15, mag: 10, def: 14, spd: 10 },
  weaknesses: ['fire'],
  resistances: ['physical'],
  actions: [
    { id: 'headbutt', name: '頭突き', target: 'ally', type: 'physical', power: 34, weight: 1.0 },
    { id: 'glare', name: 'にらむ', target: 'ally', type: 'magic', power: 26, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'maskShard', uncommon: 'maskString' },
};

/** わたあめノイズ：ふわふわで物理が効きにくい。雷が弱点（静電気） */
export const COTTON_NOISE: EnemyDef = {
  id: 'cottonNoise',
  name: 'わたあめノイズ',
  stats: { hp: 120, atk: 10, mag: 15, def: 8, spd: 16 },
  weaknesses: ['thunder'],
  resistances: ['physical'],
  actions: [
    { id: 'tangle', name: 'からみつく', target: 'ally', type: 'physical', power: 22, weight: 1.0 },
    { id: 'sweetFog', name: 'あまい霧', target: 'allies', type: 'magic', power: 16, weight: 1.0 },
  ],
  ai: { type: 'random' },
  dropTable: { common: 'cottonThread', uncommon: 'cottonStick' },
};

/**
 * 区画のボス「金魚鉢のぬし」（1-1 の山場）。大きな金魚鉢の形のノイズの中で、金魚とポイと水風船が渦を巻いている。
 * 部位破壊と大技の予告を、ここで覚えてもらう。
 * - ポイの腕：壊すと「ポイすくい」（強い単体攻撃）を封じる
 * - 金魚鉢：壊すと「金魚の渦」（大技）を封じ、弱点「氷」が露出する（ダウン → 連携技の流れが作れる）
 * - 「大波」は部位を使わない大技。ためている間に、ダウンさせるか防御でしのぐ
 */
export const GOLDFISH_BOWL_LORD: EnemyDef = {
  id: 'goldfishBowlLord',
  name: '金魚鉢のぬし',
  stats: { hp: 1500, atk: 23, mag: 21, def: 10, spd: 9 },
  weaknesses: [],
  resistances: [],
  parts: [
    { id: 'poiArm', name: 'ポイの腕', hp: 150, material: '破れたポイ', drop: 'tornPoi' },
    { id: 'bowl', name: '金魚鉢', hp: 160, material: '金魚鉢のかけら', drop: 'bowlShard', revealsWeakness: ['ice'] },
  ],
  actions: [
    { id: 'waterShot', name: '水鉄砲', target: 'ally', type: 'ice', power: 30, weight: 1.0 },
    { id: 'poiScoop', name: 'ポイすくい', target: 'ally', type: 'physical', power: 42, weight: 1.0, requiresPart: 'poiArm' },
    { id: 'bigWave', name: '大波', target: 'allies', type: 'physical', power: 30, weight: 1.0, charge: true },
    { id: 'goldfishSwirl', name: '金魚の渦', target: 'allies', type: 'magic', power: 34, weight: 1.0, charge: true, requiresPart: 'bowl' },
  ],
  ai: { type: 'boss', lowHpRatio: 0.5, allTargetInterval: 2 },
  // 倒すと必ず「ぬしの金魚」。部位を壊すと、その部位の素材も必ず落とす
  drops: ['lordGoldfish'],
};

export const FESTIVAL_NOISES: EnemyDef[] = [GOLDFISH_NOISE, BALLOON_NOISE, MASK_NOISE, COTTON_NOISE];
