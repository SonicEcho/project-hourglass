import type { FragmentDef, ItemDef, WeaponData, WeaponDef } from '../core/weapon';

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
  // ---- 試作の5戦の敵の素材（デバッグメニューの「試作の5戦」） ----
  slimeJelly: { id: 'slimeJelly', name: 'スライムゼリー', kind: 'material', rarity: 'common', gains: { fire: 2, atk: 1 } },
  frostFeather: { id: 'frostFeather', name: '霜の羽', kind: 'material', rarity: 'common', gains: { thunder: 2, ice: 1 } },
  hardFur: { id: 'hardFur', name: '硬い毛皮', kind: 'material', rarity: 'common', gains: { ice: 2, atk: 1 } },
  steelClaw: { id: 'steelClaw', name: '鋼の爪', kind: 'material', rarity: 'uncommon', gains: { atk: 3 } },
  // ---- 通常アイテム（勝利の報酬・宝箱） ----
  potion: { id: 'potion', name: 'ポーション', kind: 'item', gains: { atk: 1 } },
  ether: { id: 'ether', name: 'エーテル', kind: 'item', gains: { fire: 1 } },
  hiPotion: { id: 'hiPotion', name: 'ハイポーション', kind: 'item', gains: { atk: 1 } },
} satisfies Record<string, ItemDef>;

export type ItemId = keyof typeof ITEMS;

export type FragmentId = keyof typeof FRAGMENTS;

const sword: WeaponDef = {
  id: 'recordSword',
  name: '記録の剣',
  owner: 'hero',
  evolutions: [
    // 段階27b：進化の条件は「能力値＋鍵の素材」（鍵は 1-1 の雑魚の珍しい素材）
    {
      id: 'flameBlade',
      name: 'フレイムブレード',
      conditions: [
        { kind: 'param', param: 'fire', min: 6 },
        { kind: 'key', item: 'maskString' },
      ],
      attackElement: 'fire',
      stats: { atk: 3 },
    },
    {
      id: 'breakEdge',
      name: 'ブレイクエッジ',
      conditions: [
        { kind: 'param', param: 'atk', min: 6 },
        { kind: 'key', item: 'balloonRubber' },
      ],
      stats: { atk: 4 },
      passives: [{ kind: 'partBoost', rate: 0.3 }],
    },
    {
      id: 'frostBlade',
      name: 'フロストブレード',
      conditions: [
        { kind: 'param', param: 'ice', min: 6 },
        { kind: 'key', item: 'goldfishFin' },
      ],
      attackElement: 'ice',
      stats: { atk: 3 },
    },
  ],
};

const rod: WeaponDef = {
  id: 'prayerRod',
  name: '祈りの杖',
  owner: 'akari',
  evolutions: [
    {
      id: 'iceRod',
      name: 'アイスロッド',
      conditions: [
        { kind: 'param', param: 'ice', min: 6 },
        { kind: 'key', item: 'goldfishFin' },
      ],
      attackElement: 'ice',
      stats: { mag: 3 },
    },
    {
      id: 'healingRod',
      name: '癒しの杖',
      conditions: [
        { kind: 'param', param: 'ice', min: 3 },
        { kind: 'param', param: 'fire', min: 3 },
        { kind: 'key', item: 'cottonStick' },
      ],
      stats: { mp: 10 },
      passives: [{ kind: 'regen', rate: 0.05 }],
    },
    {
      id: 'flameRod',
      name: 'フレイムロッド',
      conditions: [
        { kind: 'param', param: 'fire', min: 6 },
        { kind: 'key', item: 'maskString' },
      ],
      attackElement: 'fire',
      stats: { mag: 3 },
    },
  ],
};

// みおの武器（段階38）：前から大事にしているトランプが、光るカードになったもの。みおの呼び名は「ジョーカーズ」（docs/NAMING.md）。id は前の名前のまま
const cards: WeaponDef = {
  id: 'throwCards',
  name: '切り札のトランプ',
  owner: 'mio',
  evolutions: [
    // 段階39：鍵は 2-1 の雑魚の珍しい素材。トリックカードは、ムーブメントの開いた2章から加わるので、ギアの傾向のまま（はめ方で目指す進化先）
    {
      id: 'thunderCards',
      name: 'サンダーカード',
      conditions: [
        { kind: 'param', param: 'thunder', min: 6 },
        { kind: 'key', item: 'filament' },
      ],
      attackElement: 'thunder',
      stats: { spd: 2 },
    },
    {
      id: 'trickCards',
      name: 'トリックカード',
      conditions: [{ kind: 'tendency', color: 'yellow' }],
      stats: { spd: 1 },
      passives: [{ kind: 'oneMoreDraw', count: 1 }],
    },
    {
      id: 'flameCards',
      name: 'フレイムカード',
      conditions: [
        { kind: 'param', param: 'fire', min: 6 },
        { kind: 'key', item: 'brassBolt' },
      ],
      attackElement: 'fire',
      stats: { spd: 1 },
    },
  ],
};

export const WEAPON_DATA: WeaponData = {
  weapons: { [sword.id]: sword, [rod.id]: rod, [cards.id]: cards },
  fragments: FRAGMENTS,
  items: ITEMS,
  // 経験値 4 で Lv2、8 で Lv3（1人が戦闘1回で行動するのは3回前後なので、だいたい戦闘3つで Lv3）
  levelExp: [4, 8],
  evolveLevel: 3,
  elementRate: 0.02,
  boardExtension: 2,
  // 段階27b：吸わせ枠（累計）。Lv1 で6、Lv2 で12、Lv3 で18
  slotsPerLevel: [6, 12, 18],
  // 時分解は、素材・アイテム2つで記憶の欠片1つ（要らない素材の整理。素材のまま吸わせる方が強い）
  decomposeCost: 2,
  fragmentFor: { atk: FRAGMENTS.courage.id, fire: FRAGMENTS.elation.id, ice: FRAGMENTS.relief.id, thunder: FRAGMENTS.wonder.id },
};
