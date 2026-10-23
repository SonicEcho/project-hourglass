import type { Element } from '../core/types';
import type { EvolutionCondition, EvolutionDef, EvolutionStyleDef, FragmentDef, ItemDef, WeaponData, WeaponDef, WeaponParamKey } from '../core/weapon';
import { POUCH_MAX } from './constants';

// 武器ビルドアップ（段階9）。数値・名前はすべて仮

/**
 * 記憶の欠片（段階10）。記憶に宿る感情ごとの種類。盗まれるのは楽しい時間だけなので、前向きな感情だけ。
 * 1つで、その感情に対応するパラメータが1上がる
 */
export const FRAGMENTS = {
  courage: { id: 'courage', name: '勇気', gains: { atk: 1 } },
  elation: { id: 'elation', name: '高揚', gains: { fire: 1 } },
  relief: { id: 'relief', name: '安堵', gains: { ice: 1 } },
  wonder: { id: 'wonder', name: '驚嘆', gains: { thunder: 1 } },
} satisfies Record<string, FragmentDef>;

/**
 * 素材（敵が落とす）と通常アイテム（勝利の報酬）。
 * 段階27b：素材は武器に直接吸わせる（gains の分だけ上下する。吸わせ枠を1つ使う）。種類（rarity）は落とし物の確率と色分けに使う。
 * 通常アイテムは、今は戦闘で使えないので、時分解して記憶の欠片にするだけ（gains は欠片の種類を決めるだけ）。
 * 数値は docs/design/growth.md の 6-4（たたき台）
 */
export const ITEMS = {
  // ---- 1-1 の縁日（段階27b） ----
  goldfishScale: { id: 'goldfishScale', name: '金魚のうろこ', kind: 'material', rarity: 'common', gains: { ice: 2, atk: 1 } },
  goldfishFin: { id: 'goldfishFin', name: '金魚のひれ', kind: 'material', rarity: 'uncommon', gains: { ice: 3, fire: -1 } },
  balloonShard: { id: 'balloonShard', name: '水風船のかけら', kind: 'material', rarity: 'common', gains: { thunder: 1, ice: 1 } },
  balloonRubber: { id: 'balloonRubber', name: '水風船のゴム', kind: 'material', rarity: 'uncommon', gains: { atk: 2, thunder: 1 } },
  maskShard: { id: 'maskShard', name: 'お面のかけら', kind: 'material', rarity: 'common', gains: { fire: 2, ice: -1 } },
  maskString: { id: 'maskString', name: 'お面のひも', kind: 'material', rarity: 'uncommon', gains: { fire: 2, atk: 2 } },
  cottonThread: { id: 'cottonThread', name: 'わたあめの糸', kind: 'material', rarity: 'common', gains: { thunder: 2, atk: -1 } },
  cottonStick: { id: 'cottonStick', name: 'わたあめの棒', kind: 'material', rarity: 'uncommon', gains: { thunder: 3, fire: 1 } },
  natsuTail: { id: 'natsuTail', name: 'なつの尾びれ', kind: 'material', rarity: 'rare', gains: { ice: 3, fire: 3, atk: 2 } },
  tornPoi: { id: 'tornPoi', name: '破れたポイ', kind: 'material', rarity: 'part', gains: { atk: 3 } },
  bowlShard: { id: 'bowlShard', name: '金魚鉢のかけら', kind: 'material', rarity: 'part', gains: { ice: 3, thunder: 1 } },
  lordGoldfish: { id: 'lordGoldfish', name: 'ぬしの金魚', kind: 'material', rarity: 'boss', gains: { fire: 2, ice: 2, thunder: 2 } },
  // ---- 1-2 の商店街（段階37）。2回目の進化（段階42）の前なので、今は武器の能力値を上げるだけ ----
  tinSpring: { id: 'tinSpring', name: 'ブリキのぜんまい', kind: 'material', rarity: 'common', gains: { thunder: 2, atk: 1 } },
  tinKey: { id: 'tinKey', name: 'ぜんまいの鍵', kind: 'material', rarity: 'uncommon', gains: { atk: 3, thunder: 1 } },
  phoneCord: { id: 'phoneCord', name: '黒電話のコード', kind: 'material', rarity: 'common', gains: { ice: 2, thunder: 1 } },
  phoneBell: { id: 'phoneBell', name: '黒電話のベル', kind: 'material', rarity: 'uncommon', gains: { ice: 3, fire: -1 } },
  ramuneGlass: { id: 'ramuneGlass', name: 'ラムネの瓶のかけら', kind: 'material', rarity: 'common', gains: { ice: 2, atk: 1 } },
  ramuneMarble: { id: 'ramuneMarble', name: 'ラムネのビー玉', kind: 'material', rarity: 'uncommon', gains: { atk: 2, ice: 2 } },
  sunsetMarble: { id: 'sunsetMarble', name: '夕焼けのビー玉', kind: 'material', rarity: 'rare', gains: { fire: 3, thunder: 3, atk: 2 } },
  menkoCard: { id: 'menkoCard', name: 'めんこ', kind: 'material', rarity: 'common', gains: { fire: 2, ice: -1 } },
  beigoma: { id: 'beigoma', name: 'ベーゴマ', kind: 'material', rarity: 'uncommon', gains: { fire: 2, atk: 2 } },
  bentSpoke: { id: 'bentSpoke', name: '曲がったスポーク', kind: 'material', rarity: 'part', gains: { atk: 3 } },
  rustyBell: { id: 'rustyBell', name: 'さびたベル', kind: 'material', rarity: 'part', gains: { thunder: 3, ice: 1 } },
  lordCarrier: { id: 'lordCarrier', name: 'ぬしの荷台', kind: 'material', rarity: 'boss', gains: { fire: 2, ice: 2, thunder: 2 } },
  // ---- 2-1 の町工場（段階39）。みおの進化の鍵（フィラメント・真空管のボルト）もここ ----
  wornGear: { id: 'wornGear', name: 'すり減った歯車', kind: 'material', rarity: 'common', gains: { atk: 2, thunder: 1 } },
  masterGear: { id: 'masterGear', name: '親歯車', kind: 'material', rarity: 'uncommon', gains: { atk: 3, ice: -1 } },
  rustyScrew: { id: 'rustyScrew', name: 'さびたネジ', kind: 'material', rarity: 'common', gains: { fire: 2, atk: 1 } },
  brassBolt: { id: 'brassBolt', name: '真鍮のボルト', kind: 'material', rarity: 'uncommon', gains: { fire: 3, thunder: -1 } },
  tubeGlass: { id: 'tubeGlass', name: '真空管のかけら', kind: 'material', rarity: 'common', gains: { thunder: 2, ice: 1 } },
  filament: { id: 'filament', name: 'フィラメント', kind: 'material', rarity: 'uncommon', gains: { thunder: 3, fire: 1 } },
  expoTicket: { id: 'expoTicket', name: '万博のきっぷ', kind: 'material', rarity: 'rare', gains: { fire: 3, ice: 3, thunder: 2 } },
  abacusBead: { id: 'abacusBead', name: 'そろばんの珠', kind: 'material', rarity: 'common', gains: { ice: 2, atk: 1 } },
  abacusFrame: { id: 'abacusFrame', name: 'そろばんの枠', kind: 'material', rarity: 'uncommon', gains: { ice: 3, fire: -1 } },
  chippedTool: { id: 'chippedTool', name: '欠けたバイト', kind: 'material', rarity: 'part', gains: { atk: 3 } },
  brokenBelt: { id: 'brokenBelt', name: '切れたベルト', kind: 'material', rarity: 'part', gains: { thunder: 2, fire: 2 } },
  lordGear: { id: 'lordGear', name: 'ぬしの歯車', kind: 'material', rarity: 'boss', gains: { fire: 2, ice: 2, thunder: 2 } },
  // ---- 2-2 の文化祭の高校（段階39b） ----
  phoneStrap: { id: 'phoneStrap', name: 'ケータイのストラップ', kind: 'material', rarity: 'common', gains: { ice: 2, atk: 1 } },
  ringtoneChip: { id: 'ringtoneChip', name: '着メロのチップ', kind: 'material', rarity: 'uncommon', gains: { ice: 3, thunder: -1 } },
  cassetteTape: { id: 'cassetteTape', name: 'のびたカセットテープ', kind: 'material', rarity: 'common', gains: { thunder: 2, atk: 1 } },
  boomboxDial: { id: 'boomboxDial', name: 'ラジカセのつまみ', kind: 'material', rarity: 'uncommon', gains: { thunder: 3, fire: -1 } },
  demoTape: { id: 'demoTape', name: 'ラストチャイムのデモテープ', kind: 'material', rarity: 'rare', gains: { fire: 3, ice: 2, thunder: 3 } },
  pendulumWeight: { id: 'pendulumWeight', name: '振り子のおもり', kind: 'material', rarity: 'common', gains: { atk: 2, ice: 1 } },
  tempoSpring: { id: 'tempoSpring', name: 'テンポのぜんまい', kind: 'material', rarity: 'uncommon', gains: { atk: 3, fire: -1 } },
  photoSticker: { id: 'photoSticker', name: '写真シール', kind: 'material', rarity: 'common', gains: { fire: 2, thunder: 1 } },
  glitterPen: { id: 'glitterPen', name: 'ラメのペン', kind: 'material', rarity: 'uncommon', gains: { fire: 3, ice: -1 } },
  tornSpeaker: { id: 'tornSpeaker', name: '破れたスピーカー', kind: 'material', rarity: 'part', gains: { thunder: 2, fire: 2 } },
  tangledCord: { id: 'tangledCord', name: '絡まったコード', kind: 'material', rarity: 'part', gains: { atk: 3 } },
  lordPick: { id: 'lordPick', name: 'ぬしのピック', kind: 'material', rarity: 'boss', gains: { fire: 2, ice: 2, thunder: 2 } },
  // ---- 2-3 の河川敷のグラウンド（段階40） ----
  ballSeam: { id: 'ballSeam', name: 'ボールの縫い目', kind: 'material', rarity: 'common', gains: { atk: 2, fire: 1 } },
  autographBall: { id: 'autographBall', name: 'サインボール', kind: 'material', rarity: 'uncommon', gains: { atk: 3, thunder: -1 } },
  megaphoneMouth: { id: 'megaphoneMouth', name: 'メガホンの口', kind: 'material', rarity: 'common', gains: { thunder: 2, atk: 1 } },
  cheerBand: { id: 'cheerBand', name: '応援のはちまき', kind: 'material', rarity: 'uncommon', gains: { thunder: 3, ice: -1 } },
  scorebook: { id: 'scorebook', name: '最後のスコアブック', kind: 'material', rarity: 'rare', gains: { fire: 3, ice: 3, thunder: 2 } },
  jugIce: { id: 'jugIce', name: '水筒の氷', kind: 'material', rarity: 'common', gains: { ice: 2, fire: 1 } },
  jugCap: { id: 'jugCap', name: '水筒のふた', kind: 'material', rarity: 'uncommon', gains: { ice: 3, atk: -1 } },
  petEgg: { id: 'petEgg', name: '電子ペットのたまご', kind: 'material', rarity: 'common', gains: { fire: 2, ice: 1 } },
  buttonCell: { id: 'buttonCell', name: 'ボタン電池', kind: 'material', rarity: 'uncommon', gains: { fire: 3, thunder: -1 } },
  scorePlate: { id: 'scorePlate', name: '得点板の札', kind: 'material', rarity: 'part', gains: { atk: 3 } },
  tornNet: { id: 'tornNet', name: '破れたネット', kind: 'material', rarity: 'part', gains: { ice: 2, thunder: 2 } },
  lordBat: { id: 'lordBat', name: 'ぬしのバット', kind: 'material', rarity: 'boss', gains: { fire: 2, ice: 2, thunder: 2 } },
  // ---- 3-1 の昭和41年の夏の村（段階88） ----
  fanBlade: { id: 'fanBlade', name: '扇風機の羽', kind: 'material', rarity: 'common', gains: { thunder: 2, atk: 1 } },
  fanTimer: { id: 'fanTimer', name: '首振りのつまみ', kind: 'material', rarity: 'uncommon', gains: { thunder: 3, ice: -1 } },
  coilAsh: { id: 'coilAsh', name: '蚊取り線香の灰', kind: 'material', rarity: 'common', gains: { ice: 2, fire: 1 } },
  coilStand: { id: 'coilStand', name: '線香立ての豚', kind: 'material', rarity: 'uncommon', gains: { ice: 3, fire: -1 } },
  radioDial: { id: 'radioDial', name: 'ラジオのダイヤル', kind: 'material', rarity: 'common', gains: { atk: 2, thunder: 1 } },
  radioEarphone: { id: 'radioEarphone', name: '片耳のイヤホン', kind: 'material', rarity: 'uncommon', gains: { atk: 3, ice: -1 } },
  payEnvelope: { id: 'payEnvelope', name: 'はじめての給料袋', kind: 'material', rarity: 'rare', gains: { fire: 3, ice: 2, thunder: 3 } },
  tableLeg: { id: 'tableLeg', name: 'ちゃぶ台の脚', kind: 'material', rarity: 'common', gains: { fire: 2, atk: 1 } },
  teacup: { id: 'teacup', name: '欠けた湯のみ', kind: 'material', rarity: 'uncommon', gains: { fire: 3, thunder: -1 } },
  postLetter: { id: 'postLetter', name: '仕送りの封筒', kind: 'material', rarity: 'uncommon', gains: { ice: 2, fire: 2 } },
  oldTicket: { id: 'oldTicket', name: '硬い切符', kind: 'material', rarity: 'rare', gains: { atk: 3, fire: 2, thunder: 2 } },
  chimneySoot: { id: 'chimneySoot', name: '煙突のすす', kind: 'material', rarity: 'part', gains: { thunder: 2, fire: 2 } },
  trainWheel: { id: 'trainWheel', name: '汽車の車輪', kind: 'material', rarity: 'part', gains: { atk: 3 } },
  lordWhistle: { id: 'lordWhistle', name: 'ぬしの汽笛', kind: 'material', rarity: 'boss', gains: { fire: 2, ice: 2, thunder: 2 } },
  // ---- 3-2 の平成31年3月、卒業式の帰り道（段階94） ----
  earphoneCord: { id: 'earphoneCord', name: 'イヤホンのコード', kind: 'material', rarity: 'common', gains: { thunder: 2, atk: 1 } },
  earbudTip: { id: 'earbudTip', name: 'イヤーピース', kind: 'material', rarity: 'uncommon', gains: { thunder: 3, ice: -1 } },
  selfieGrip: { id: 'selfieGrip', name: '自撮り棒の握り', kind: 'material', rarity: 'common', gains: { atk: 2, ice: 1 } },
  crackedLens: { id: 'crackedLens', name: '割れたレンズ', kind: 'material', rarity: 'uncommon', gains: { atk: 3, thunder: -1 } },
  tapiocaPearl: { id: 'tapiocaPearl', name: '黒い粒', kind: 'material', rarity: 'common', gains: { fire: 2, atk: 1 } },
  thickStraw: { id: 'thickStraw', name: '太いストロー', kind: 'material', rarity: 'uncommon', gains: { fire: 3, ice: -1 } },
  diplomaCap: { id: 'diplomaCap', name: '筒のふた', kind: 'material', rarity: 'common', gains: { ice: 2, fire: 1 } },
  flowerRibbon: { id: 'flowerRibbon', name: '卒業式の花のリボン', kind: 'material', rarity: 'uncommon', gains: { ice: 3, fire: -1 } },
  secondButton: { id: 'secondButton', name: '第二ボタン', kind: 'material', rarity: 'rare', gains: { atk: 3, fire: 2, ice: 3 } },
  blankCard: { id: 'blankCard', name: '余白の色紙', kind: 'material', rarity: 'uncommon', gains: { fire: 2, thunder: 2 } },
  lostTicket: { id: 'lostTicket', name: '使わなかった定期券', kind: 'material', rarity: 'rare', gains: { atk: 2, thunder: 3, ice: 2 } },
  alarmLamp: { id: 'alarmLamp', name: '警報機の赤い灯', kind: 'material', rarity: 'part', gains: { ice: 2, thunder: 2 } },
  barrierArm: { id: 'barrierArm', name: '遮断機の竿', kind: 'material', rarity: 'part', gains: { atk: 3 } },
  lordSignal: { id: 'lordSignal', name: 'ぬしの警報灯', kind: 'material', rarity: 'boss', gains: { fire: 2, ice: 2, thunder: 2 } },
  // ---- 3章のカイのリベンジ（段階96） ----
  frameShard: { id: 'frameShard', name: '枠のかけら', kind: 'material', rarity: 'part', gains: { thunder: 2, atk: 2 } },
  burntFilm: { id: 'burntFilm', name: '焼けたフィルム', kind: 'material', rarity: 'boss', gains: { fire: 2, ice: 2, thunder: 2 } },
  // ---- 大正の祭りの夜（段階91b） ----
  lanternPaper: { id: 'lanternPaper', name: '提灯の和紙', kind: 'material', rarity: 'common', gains: { ice: 2, atk: 1 } },
  lanternFrame: { id: 'lanternFrame', name: '提灯の骨', kind: 'material', rarity: 'uncommon', gains: { ice: 3, fire: -1 } },
  pinwheelBlade: { id: 'pinwheelBlade', name: '風車の羽根', kind: 'material', rarity: 'common', gains: { atk: 2, thunder: 1 } },
  pinwheelStick: { id: 'pinwheelStick', name: '風車の竹ひご', kind: 'material', rarity: 'uncommon', gains: { atk: 3, ice: -1 } },
  candyStick: { id: 'candyStick', name: '飴の棒', kind: 'material', rarity: 'common', gains: { fire: 2, ice: 1 } },
  candyCrane: { id: 'candyCrane', name: '飴細工の鶴', kind: 'material', rarity: 'uncommon', gains: { fire: 3, thunder: -1 } },
  recordNeedle: { id: 'recordNeedle', name: '蓄音機の針', kind: 'material', rarity: 'common', gains: { thunder: 2, fire: 1 } },
  phonographHorn: { id: 'phonographHorn', name: '蓄音機のラッパ', kind: 'material', rarity: 'uncommon', gains: { thunder: 3, atk: -1 } },
  oldRecord: { id: 'oldRecord', name: '百年前のレコード', kind: 'material', rarity: 'rare', gains: { fire: 3, ice: 2, thunder: 3 } },
  drumSkin: { id: 'drumSkin', name: '太鼓の皮', kind: 'material', rarity: 'part', gains: { atk: 3 } },
  lanternRope: { id: 'lanternRope', name: '提灯の綱', kind: 'material', rarity: 'part', gains: { ice: 2, fire: 2 } },
  lordFan: { id: 'lordFan', name: 'ぬしの団扇', kind: 'material', rarity: 'boss', gains: { fire: 2, ice: 2, thunder: 2 } },
  // ---- 試作の5戦の敵の素材（デバッグメニューの「試作の5戦」） ----
  slimeJelly: { id: 'slimeJelly', name: 'スライムゼリー', kind: 'material', rarity: 'common', gains: { fire: 2, atk: 1 } },
  frostFeather: { id: 'frostFeather', name: '霜の羽', kind: 'material', rarity: 'common', gains: { thunder: 2, ice: 1 } },
  hardFur: { id: 'hardFur', name: '硬い毛皮', kind: 'material', rarity: 'common', gains: { ice: 2, atk: 1 } },
  steelClaw: { id: 'steelClaw', name: '鋼の爪', kind: 'material', rarity: 'uncommon', gains: { atk: 3 } },
  // ---- ポーチの消費アイテム（勝利の報酬・宝箱。段階51。戦闘での効き目は pouch.ts。吸わせられず、時分解もできない） ----
  potion: { id: 'potion', name: 'ポーション', kind: 'item', gains: {}, max: POUCH_MAX },
  ether: { id: 'ether', name: 'エーテル', kind: 'item', gains: {}, max: POUCH_MAX },
  hiPotion: { id: 'hiPotion', name: 'ハイポーション', kind: 'item', gains: {}, max: POUCH_MAX },
} satisfies Record<string, ItemDef>;

export type ItemId = keyof typeof ITEMS;

export type FragmentId = keyof typeof FRAGMENTS;

// ---- 進化ツリー（段階42。docs/design/growth.md の 8.）。名前・数値・条件はすべて仮 ----
// 1回目〜3回目の進化先と寄り道1本は作った。4回目より先は、まだ作っていない先（sealed。影と、一番先の言い伝えだけ見せる）。
// 段の形は 3 → 3 → 4 → 5 → 5 → 6（本道）＋寄り道1。2回目の鍵は次の区画の珍しい素材、3回目の鍵はさらに先の区画の素材

/** 型（8-1c）。row はブリッジ（縦の列）が下へ伸び、column は盤が右へ横に広がる。どの進化先も、2つの型を1つずつ */
const STYLES = {
  /** 烈：その属性のダメージ +10%（横。段階54で +15% から下げた） */
  fierce: (element: Element): EvolutionStyleDef => ({ name: '烈', passives: [{ kind: 'elementBoost', element, rate: 0.1 }], board: 'row' }),
  /** 剛：攻撃 +3（横） */
  might: { name: '剛', stats: { atk: 3 }, board: 'row' },
  /** 疾：速さ +2（横） */
  swift: { name: '疾', stats: { spd: 2 }, board: 'row' },
  /** 叡：魔力 +3（横） */
  sage: { name: '叡', stats: { mag: 3 }, board: 'row' },
  /** 結：コンボ +10%（横。段階54で +15% から下げた） */
  bond: { name: '結', passives: [{ kind: 'comboBoost', rate: 0.1 }], board: 'row' },
  /** 灯：ラウンドの始めに HP 3% 回復（縦） */
  ember: { name: '灯', passives: [{ kind: 'regen', rate: 0.03 }], board: 'column' },
  /** 砕：部位へのダメージ +20%（縦） */
  shatter: { name: '砕', passives: [{ kind: 'partBoost', rate: 0.2 }], board: 'column' },
  /** 先：最初のラウンドに先制（縦） */
  first: { name: '先', passives: [{ kind: 'startDash' }], board: 'column' },
  /** 静：MP の消費 −1（縦） */
  calm: { name: '静', passives: [{ kind: 'mpSave', amount: 1 }], board: 'column' },
  /** 堅：防御 +2（縦） */
  guard: { name: '堅', stats: { def: 2 }, board: 'column' },
  /** 継：バトンを受けた時 +20%（縦） */
  baton: { name: '継', passives: [{ kind: 'batonBoost', rate: 0.2 }], board: 'column' },
} satisfies Record<string, EvolutionStyleDef | ((element: Element) => EvolutionStyleDef)>;

const param = (p: WeaponParamKey, min: number): EvolutionCondition => ({ kind: 'param', param: p, min });
const key = (item: ItemId): EvolutionCondition => ({ kind: 'key', item });

/**
 * まだ作っていない先（4回目〜一番先）。from から枝ごとに2段の影を重ね、一番先に言い伝えの節を付ける。
 * branches は枝ごとの、一番先の言い伝えの一覧（2つあれば、一番先で2つに分かれる）
 */
function beyond(from: string, branches: string[][]): EvolutionDef[] {
  return branches.flatMap((legends, b) => {
    const t4 = `${from}_${b + 1}a`;
    const t5 = `${from}_${b + 1}b`;
    return [
      { id: t4, name: '', from, sealed: true, conditions: [] },
      { id: t5, name: '', from: t4, sealed: true, conditions: [] },
      ...legends.map((legend, k) => ({ id: `${from}_${b + 1}c${k + 1}`, name: '', from: t5, sealed: true, legend, conditions: [] })),
    ];
  });
}

const sword: WeaponDef = {
  id: 'recordSword',
  name: '記録の剣',
  owner: 'hero',
  evolutions: [
    // 1回目（段階27b）：進化の条件は「能力値＋鍵の素材」（鍵は 1-1 の雑魚の珍しい素材）
    {
      id: 'flameBlade',
      name: 'フレイムブレード',
      conditions: [param('fire', 12), key('maskString')],
      attackElement: 'fire',
      stats: { atk: 3 },
      styles: [STYLES.fierce('fire'), STYLES.ember],
    },
    {
      id: 'breakEdge',
      name: 'ブレイクエッジ',
      conditions: [param('atk', 12), key('balloonRubber')],
      stats: { atk: 4 },
      passives: [{ kind: 'partBoost', rate: 0.3 }],
      styles: [STYLES.might, STYLES.shatter],
    },
    {
      id: 'frostBlade',
      name: 'フロストブレード',
      conditions: [param('ice', 12), key('goldfishFin')],
      attackElement: 'ice',
      stats: { atk: 3 },
      styles: [STYLES.fierce('ice'), STYLES.guard],
    },
    // 2回目（鍵は 1-2 の珍しい素材・部位）
    { id: 'crimsonBlade', name: '紅蓮の刃', from: 'flameBlade', conditions: [param('fire', 24), key('beigoma')], attackElement: 'fire', stats: { atk: 4 }, styles: [STYLES.might, STYLES.ember] },
    { id: 'crushEdge', name: 'クラッシュエッジ', from: 'breakEdge', conditions: [param('atk', 24), key('tinKey')], stats: { atk: 5 }, passives: [{ kind: 'partBoost', rate: 0.2 }], styles: [STYLES.swift, STYLES.shatter] },
    { id: 'glacierBlade', name: '氷河の刃', from: 'frostBlade', conditions: [param('ice', 24), key('phoneBell')], attackElement: 'ice', stats: { atk: 4, def: 1 }, styles: [STYLES.might, STYLES.guard] },
    // 寄り道：ブレイクエッジから。雷を低いままにして、刃こぼれを抱えたまま先手を取る剣
    {
      id: 'strayEdge',
      name: '迷い刃',
      from: 'breakEdge',
      detour: true,
      conditions: [{ kind: 'paramMax', param: 'thunder', max: 2 }, key('bentSpoke')],
      stats: { atk: 3, spd: 3 },
      passives: [{ kind: 'startDash' }],
      styles: [STYLES.swift, STYLES.guard],
    },
    // 3回目（鍵は 2-1・2-2 の素材）
    { id: 'blazeBlade', name: '煌炎の剣', from: 'crimsonBlade', conditions: [param('fire', 36), key('glitterPen')], attackElement: 'fire', stats: { atk: 5 }, passives: [{ kind: 'elementBoost', element: 'fire', rate: 0.1 }], styles: [STYLES.fierce('fire'), STYLES.first] },
    { id: 'sunsetBlade', name: '落陽の剣', from: 'crimsonBlade', conditions: [param('fire', 24), param('atk', 24), key('brokenBelt')], stats: { atk: 6 }, passives: [{ kind: 'partBoost', rate: 0.2 }], styles: [STYLES.might, STYLES.shatter] },
    { id: 'grandEdge', name: 'グランドエッジ', from: 'crushEdge', conditions: [param('atk', 36), key('tempoSpring')], stats: { atk: 6 }, passives: [{ kind: 'partBoost', rate: 0.2 }], styles: [STYLES.might, STYLES.first] },
    { id: 'auroraBlade', name: '極光の剣', from: 'glacierBlade', conditions: [param('ice', 36), key('ringtoneChip')], attackElement: 'ice', stats: { atk: 5 }, passives: [{ kind: 'elementBoost', element: 'ice', rate: 0.1 }], styles: [STYLES.fierce('ice'), STYLES.ember] },
    // 4回目より先（まだ作っていない）
    ...beyond('blazeBlade', [['夜明けの色を、刃に閉じこめたという'], ['燃えつきた祭りの灯を、もう一度ともしたという']]),
    ...beyond('sunsetBlade', [['沈む日を斬って、一日を一刻だけ伸ばしたという']]),
    ...beyond('grandEdge', [['砂の山を一振りで割り、道を開いたという', '砕いたものを、元の形に組み直したという']]),
    ...beyond('auroraBlade', [['凍った時間の上を、音もなく歩いたという']]),
  ],
};

const rod: WeaponDef = {
  id: 'prayerRod',
  name: '祈りの杖',
  owner: 'akari',
  evolutions: [
    { id: 'iceRod', name: 'アイスロッド', conditions: [param('ice', 12), key('goldfishFin')], attackElement: 'ice', stats: { mag: 3 }, styles: [STYLES.fierce('ice'), STYLES.calm] },
    {
      id: 'healingRod',
      name: '癒しの杖',
      conditions: [param('ice', 6), param('fire', 6), key('cottonStick')],
      stats: { mp: 10 },
      passives: [{ kind: 'regen', rate: 0.03 }],
      styles: [STYLES.sage, STYLES.ember],
    },
    { id: 'flameRod', name: 'フレイムロッド', conditions: [param('fire', 12), key('maskString')], attackElement: 'fire', stats: { mag: 3 }, styles: [STYLES.fierce('fire'), STYLES.calm] },
    // 2回目
    { id: 'sleetRod', name: '氷雨の杖', from: 'iceRod', conditions: [param('ice', 24), key('ramuneMarble')], attackElement: 'ice', stats: { mag: 4 }, styles: [STYLES.sage, STYLES.calm] },
    {
      id: 'mercyRod',
      name: '慈雨の杖',
      from: 'healingRod',
      conditions: [param('ice', 16), param('fire', 16), key('rustyBell')],
      stats: { mp: 10, mag: 2 },
      passives: [{ kind: 'regen', rate: 0.01 }],
      styles: [STYLES.sage, STYLES.guard],
    },
    { id: 'heatRod', name: '陽炎の杖', from: 'flameRod', conditions: [param('fire', 24), key('beigoma')], attackElement: 'fire', stats: { mag: 4 }, styles: [STYLES.fierce('fire'), STYLES.guard] },
    // 寄り道：アイスロッドから。火を低いままにして、少ない力で長く祈り続ける杖
    {
      id: 'dewRod',
      name: 'しずくの杖',
      from: 'iceRod',
      detour: true,
      conditions: [{ kind: 'paramMax', param: 'fire', max: 2 }, key('phoneCord')],
      stats: { mp: 12 },
      passives: [{ kind: 'mpSave', amount: 1 }],
      styles: [STYLES.sage, STYLES.ember],
    },
    // 3回目
    { id: 'moonRod', name: '雪月の杖', from: 'sleetRod', conditions: [param('ice', 36), key('abacusFrame')], attackElement: 'ice', stats: { mag: 5 }, passives: [{ kind: 'elementBoost', element: 'ice', rate: 0.1 }], styles: [STYLES.fierce('ice'), STYLES.ember] },
    {
      id: 'blessRod',
      name: '祝福の杖',
      from: 'mercyRod',
      conditions: [param('ice', 24), param('fire', 24), key('lordGear')],
      stats: { mp: 12, mag: 3 },
      passives: [{ kind: 'regen', rate: 0.01 }],
      styles: [STYLES.bond, STYLES.baton],
    },
    { id: 'sunnyRod', name: '陽だまりの杖', from: 'mercyRod', conditions: [param('fire', 24), param('thunder', 16), key('boomboxDial')], attackElement: 'fire', stats: { mag: 4 }, passives: [{ kind: 'regen', rate: 0.01 }], styles: [STYLES.sage, STYLES.first] },
    { id: 'ringRod', name: '炎環の杖', from: 'heatRod', conditions: [param('fire', 36), key('glitterPen')], attackElement: 'fire', stats: { mag: 5 }, passives: [{ kind: 'elementBoost', element: 'fire', rate: 0.1 }], styles: [STYLES.sage, STYLES.ember] },
    ...beyond('moonRod', [['月の光で、なくした名前を照らしたという'], ['降る雪の一粒ずつに、誰かの声が入っていたという']]),
    ...beyond('blessRod', [['祈った人の数だけ、小さな花が咲いたという']]),
    ...beyond('sunnyRod', [['冬の日なたを、そのまま持ち歩いたという', '日が落ちても、手のひらだけは温かかったという']]),
    ...beyond('ringRod', [['燃える輪の中では、誰も泣かなかったという']]),
  ],
};

// みおの武器（段階38）：前から大事にしているトランプが、光るカードになったもの。みおの呼び名は「ジョーカーズ」（docs/NAMING.md）。id は前の名前のまま
const cards: WeaponDef = {
  id: 'throwCards',
  name: '切り札のトランプ',
  owner: 'mio',
  evolutions: [
    // 1回目（段階39）：鍵は 2-1 の雑魚の珍しい素材。トリックカードは、ムーブメントの開いた2章から加わるので、ギアの傾向のまま（はめ方で目指す進化先）
    { id: 'thunderCards', name: 'サンダーカード', conditions: [param('thunder', 12), key('filament')], attackElement: 'thunder', stats: { spd: 2 }, styles: [STYLES.fierce('thunder'), STYLES.first] },
    {
      id: 'trickCards',
      name: 'トリックカード',
      conditions: [{ kind: 'tendency', color: 'yellow' }],
      stats: { spd: 1 },
      passives: [{ kind: 'oneMoreDraw', count: 1 }],
      styles: [STYLES.bond, STYLES.baton],
    },
    { id: 'flameCards', name: 'フレイムカード', conditions: [param('fire', 12), key('brassBolt')], attackElement: 'fire', stats: { spd: 1 }, styles: [STYLES.fierce('fire'), STYLES.first] },
    // 2回目（鍵は 2-2 の素材）
    { id: 'boltCards', name: '稲妻のカード', from: 'thunderCards', conditions: [param('thunder', 24), key('boomboxDial')], attackElement: 'thunder', stats: { spd: 3, atk: 2 }, styles: [STYLES.might, STYLES.first] },
    {
      id: 'mirageCards',
      name: '幻のカード',
      from: 'trickCards',
      conditions: [{ kind: 'tendency', color: 'yellow' }, key('tornSpeaker')],
      stats: { spd: 2 },
      passives: [{ kind: 'comboBoost', rate: 0.2 }],
      styles: [STYLES.bond, STYLES.first],
    },
    { id: 'sparkCards', name: '火花のカード', from: 'flameCards', conditions: [param('fire', 24), key('glitterPen')], attackElement: 'fire', stats: { spd: 2, atk: 2 }, styles: [STYLES.might, STYLES.ember] },
    // 寄り道：サンダーカードから。火を低いままにして、仲間につなぐことだけを考えるカード
    {
      id: 'oldMaidCards',
      name: 'ばば抜きのカード',
      from: 'thunderCards',
      detour: true,
      conditions: [{ kind: 'paramMax', param: 'fire', max: 2 }, key('photoSticker')],
      stats: { spd: 2 },
      passives: [
        { kind: 'comboBoost', rate: 0.3 },
        { kind: 'batonBoost', rate: 0.25 },
      ],
      styles: [STYLES.swift, STYLES.guard],
    },
    // 3回目（鍵は 2-3 の素材）
    { id: 'raijinCards', name: '雷神のカード', from: 'boltCards', conditions: [param('thunder', 36), key('cheerBand')], attackElement: 'thunder', stats: { spd: 3, atk: 3 }, passives: [{ kind: 'elementBoost', element: 'thunder', rate: 0.1 }], styles: [STYLES.fierce('thunder'), STYLES.baton] },
    {
      id: 'magicianCards',
      name: '奇術師のカード',
      from: 'mirageCards',
      conditions: [{ kind: 'tendency', color: 'yellow' }, param('thunder', 20), key('scorePlate')],
      stats: { spd: 3 },
      passives: [{ kind: 'batonBoost', rate: 0.25 }],
      styles: [STYLES.swift, STYLES.baton],
    },
    {
      id: 'jesterCards',
      name: '道化のカード',
      from: 'mirageCards',
      conditions: [{ kind: 'tendency', color: 'yellow' }, param('atk', 24), key('autographBall')],
      stats: { atk: 4, spd: 2 },
      passives: [{ kind: 'comboBoost', rate: 0.2 }],
      styles: [STYLES.might, STYLES.shatter],
    },
    { id: 'fireworkCards', name: '花火のカード', from: 'sparkCards', conditions: [param('fire', 36), key('buttonCell')], attackElement: 'fire', stats: { spd: 2, atk: 3 }, passives: [{ kind: 'elementBoost', element: 'fire', rate: 0.1 }], styles: [STYLES.fierce('fire'), STYLES.shatter] },
    ...beyond('raijinCards', [['雷を一枚のカードにして、空へ返したという'], ['鳴りやんだ拍手を、もう一度呼んだという']]),
    ...beyond('magicianCards', [['引いたカードが、いつも見たい景色だったという']]),
    ...beyond('jesterCards', [['笑わせたあとで、そっと忘れ物を返したという', 'ばらまいたカードが、町じゅうの灯になったという']]),
    ...beyond('fireworkCards', [['夜空に、一度きりの花を咲かせたという']]),
  ],
};

// 小夜子の武器（段階91a。docs/script/3-matsuri.md）：月の簪が変わる薙刀「月影」。3章の途中から加わるので、Lv5 から始める（startExp）。
// 鍵は、1回目が 3-1 の村の珍しい素材、2回目が 3-1 の部位・番人の素材、3回目が 3-1 のレア・ぬしの素材（3章から加わるので、ほかの仲間より先の区画の素材にはしない）
const naginata: WeaponDef = {
  id: 'moonNaginata',
  name: '月影',
  owner: 'sayoko',
  startExp: 26,
  evolutions: [
    {
      id: 'crescentNaginata',
      name: '三日月',
      conditions: [param('atk', 12), key('radioEarphone')],
      stats: { atk: 4 },
      passives: [{ kind: 'partBoost', rate: 0.3 }],
      styles: [STYLES.might, STYLES.shatter],
    },
    { id: 'heatNaginata', name: '陽炎の薙刀', conditions: [param('fire', 12), key('teacup')], attackElement: 'fire', stats: { atk: 3 }, styles: [STYLES.fierce('fire'), STYLES.first] },
    { id: 'frostNaginata', name: '霜月の薙刀', conditions: [param('ice', 12), key('coilStand')], attackElement: 'ice', stats: { atk: 3 }, styles: [STYLES.fierce('ice'), STYLES.guard] },
    // 2回目
    { id: 'fullMoonNaginata', name: '満月', from: 'crescentNaginata', conditions: [param('atk', 24), key('trainWheel')], stats: { atk: 5 }, passives: [{ kind: 'partBoost', rate: 0.2 }], styles: [STYLES.might, STYLES.first] },
    { id: 'lanternNaginata', name: '灯籠の薙刀', from: 'heatNaginata', conditions: [param('fire', 24), key('chimneySoot')], attackElement: 'fire', stats: { atk: 4 }, styles: [STYLES.fierce('fire'), STYLES.ember] },
    { id: 'frostMoonNaginata', name: '霜夜の薙刀', from: 'frostNaginata', conditions: [param('ice', 24), key('postLetter')], attackElement: 'ice', stats: { atk: 4, def: 1 }, styles: [STYLES.might, STYLES.guard] },
    // 寄り道：三日月から。雷を低いままにして、誰より先に踏みこむ薙刀
    {
      id: 'hazyMoonNaginata',
      name: '朧月',
      from: 'crescentNaginata',
      detour: true,
      conditions: [{ kind: 'paramMax', param: 'thunder', max: 2 }, key('tableLeg')],
      stats: { atk: 3, spd: 3 },
      passives: [{ kind: 'startDash' }],
      styles: [STYLES.swift, STYLES.guard],
    },
    // 3回目
    { id: 'harvestMoonNaginata', name: '名月', from: 'fullMoonNaginata', conditions: [param('atk', 36), key('lordWhistle')], stats: { atk: 6 }, passives: [{ kind: 'partBoost', rate: 0.2 }], styles: [STYLES.might, STYLES.shatter] },
    { id: 'moonlitNaginata', name: '月下の薙刀', from: 'fullMoonNaginata', conditions: [param('atk', 24), param('fire', 16), key('fanTimer')], stats: { atk: 5, spd: 1 }, passives: [{ kind: 'startDash' }], styles: [STYLES.swift, STYLES.first] },
    { id: 'eveNaginata', name: '宵宮の薙刀', from: 'lanternNaginata', conditions: [param('fire', 36), key('payEnvelope')], attackElement: 'fire', stats: { atk: 5 }, passives: [{ kind: 'elementBoost', element: 'fire', rate: 0.1 }], styles: [STYLES.fierce('fire'), STYLES.first] },
    { id: 'snowMoonNaginata', name: '雪月花', from: 'frostMoonNaginata', conditions: [param('ice', 36), key('oldTicket')], attackElement: 'ice', stats: { atk: 5 }, passives: [{ kind: 'elementBoost', element: 'ice', rate: 0.1 }], styles: [STYLES.fierce('ice'), STYLES.ember] },
    // 4回目より先（まだ作っていない）
    ...beyond('harvestMoonNaginata', [['欠けない月の下で、百の夜を一度に終わらせたという'], ['月を斬って、ふたつの夜に分けたという']]),
    ...beyond('moonlitNaginata', [['月の影だけを踏んで、誰にも気づかれずに歩いたという']]),
    ...beyond('eveNaginata', [['祭りの灯をひとつずつ、持ち主の家へ届けたという', '消えた提灯に、もう一度だけ火をともしたという']]),
    ...beyond('snowMoonNaginata', [['冷えた夜の端を、そっと縫い合わせたという']]),
  ],
};

export const WEAPON_DATA: WeaponData = {
  weapons: { [sword.id]: sword, [rod.id]: rod, [cards.id]: cards, [naginata.id]: naginata },
  fragments: FRAGMENTS,
  items: ITEMS,
  // 経験値 4 で Lv2、8 で Lv3（1人が戦闘1回で行動するのは3回前後なので、だいたい戦闘3つで Lv3）。
  // 段階42：2回目・3回目の進化のために Lv7 まで伸ばした（だいたい1つの区画で2レベル）
  levelExp: [4, 8, 16, 26, 38, 52],
  // 1回目は Lv3、2回目は Lv5、3回目より先は Lv7
  evolveLevels: [3, 5, 7],
  elementRate: 0.02,
  boardExtension: 2,
  // 段階27b：吸わせ枠（累計）。Lv1 で6、Lv2 で12、Lv3 で18。段階42：Lv4 から1レベルで4つずつ
  slotsPerLevel: [6, 12, 18, 22, 26, 30, 34],
  // 時分解は、素材・アイテム2つで記憶の欠片1つ（要らない素材の整理。素材のまま吸わせる方が強い）
  decomposeCost: 2,
  fragmentFor: { atk: FRAGMENTS.courage.id, fire: FRAGMENTS.elation.id, ice: FRAGMENTS.relief.id, thunder: FRAGMENTS.wonder.id },
};

/**
 * 時分解を出したことを覚える物語の変数（段階100c）。武器の画面の時分解は、どれかの武器の吸わせ枠が初めていっぱいになった時か、
 * 交換所を初めて開いた時（ペトラが時分解を教える）の、早い方から出す
 */
export const DECOMPOSE_VAR = '武器:時分解';
