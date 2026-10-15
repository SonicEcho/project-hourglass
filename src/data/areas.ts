import type { AreaDef } from '../core/explore';
import type { CampaignBattle } from './campaign';
import { scaleEnemy } from './campaign';
import { BALLOON_NOISE, COTTON_NOISE, GOLDFISH_BOWL_LORD, GOLDFISH_NOISE, MASK_NOISE } from './festivalEnemies';
import { BICYCLE_LORD, MENKO_NOISE, PHONE_NOISE, RAMUNE_NOISE, TIN_NOISE } from './showaEnemies';
import { PROTO_FESTIVAL_LAYOUT } from './prototypes';
import { BGM } from './sounds';
import { ITEMS } from './weapons';

// 探索の区画（段階25）。地図の絵、歩ける場所の文字の地図、宝箱、敵の印、ボス、話せる人、途中の会話のきっかけ。
// 位置はマス（列, 行）。1マスは 32（AREA_TILE）。歩ける場所の文字の地図は、段階18b の縁日の地図をそのまま使う

/** 1マスの大きさ（地図の絵の上の大きさ） */
export const AREA_TILE = 32;
/** 仲間が1マス歩く時間（ミリ秒） */
export const AREA_STEP_MS = 140;
/** 敵の印が1マス進む時間（ミリ秒） */
export const AREA_ENEMY_STEP_MS = 420;
/** 戦闘や会話から戻った後、敵の印に触れても戦闘にしない間（ミリ秒） */
export const AREA_GRACE_MS = 1800;
/** 話せる人に、この距離（マス）まで近づくと話す */
export const AREA_TALK_RANGE = 1;

/**
 * 区画の戦闘（段階25・27）。1-1 は縁日の砂嵐（festivalEnemies.ts）と、区画のボス「金魚鉢のぬし」。
 * reward は星の砂、item は勝った時のアイテム。ギアの報酬は出さない（1章はムーブメントが閉じている。段階26）。
 * 並びは出会う順の目安（広場 → 左右の参道 → 社への道 → 社の前）。数値の目安と測った結果は docs/design/battle.md の 13.
 */
export const AREA_BATTLES: Record<string, CampaignBattle> = {
  a11_storm1: { id: 'a11_storm1', name: '砂嵐', enemies: [GOLDFISH_NOISE, GOLDFISH_NOISE], reward: 4, item: ITEMS.potion.id, koma: 1 },
  a11_storm2: { id: 'a11_storm2', name: '砂嵐', enemies: [GOLDFISH_NOISE, BALLOON_NOISE], reward: 5, item: ITEMS.ether.id, koma: 2 },
  a11_storm3: { id: 'a11_storm3', name: '砂嵐', enemies: [BALLOON_NOISE, MASK_NOISE, GOLDFISH_NOISE], reward: 6, koma: 2 },
  // 社への道の砂嵐は少し強い（HP・攻撃・魔力 ×1.2。ボスの手前の山）
  a11_storm4: { id: 'a11_storm4', name: '砂嵐', enemies: [MASK_NOISE, COTTON_NOISE, BALLOON_NOISE].map((e) => scaleEnemy(e, 1.2)), reward: 6, item: ITEMS.hiPotion.id, koma: 2 },
  // ボスは最後のコマを抱えこんでいる（2つ。1-1 は合わせて9つで、返すのに8つ。1つ余る）
  a11_boss: { id: 'a11_boss', name: '金魚鉢のぬし', enemies: [GOLDFISH_BOWL_LORD], reward: 8, boss: true, koma: 2 },
  // 1-2 の商店街（段階37）。並びは出会う順（入口 → 駄菓子屋の手前 → 駄菓子屋と時計屋の間 → 時計屋の先 → 坂の手前）。
  // 砂嵐は5戦でコマ9つ、ボスが2つ（合わせて11、返すのに10。1つ余る）。坂の手前の2戦は少し強い（ボスの手前の山）
  a12_storm1: { id: 'a12_storm1', name: '砂嵐', enemies: [TIN_NOISE, PHONE_NOISE], reward: 5, item: ITEMS.potion.id, koma: 1 },
  a12_storm2: { id: 'a12_storm2', name: '砂嵐', enemies: [RAMUNE_NOISE, MENKO_NOISE], reward: 5, item: ITEMS.ether.id, koma: 2 },
  a12_storm3: { id: 'a12_storm3', name: '砂嵐', enemies: [PHONE_NOISE, RAMUNE_NOISE, MENKO_NOISE], reward: 6, koma: 2 },
  a12_storm4: { id: 'a12_storm4', name: '砂嵐', enemies: [TIN_NOISE, MENKO_NOISE, RAMUNE_NOISE].map((e) => scaleEnemy(e, 1.2)), reward: 7, item: ITEMS.hiPotion.id, koma: 2 },
  a12_storm5: { id: 'a12_storm5', name: '砂嵐', enemies: [PHONE_NOISE, TIN_NOISE, RAMUNE_NOISE].map((e) => scaleEnemy(e, 1.25)), reward: 7, koma: 2 },
  a12_boss: { id: 'a12_boss', name: '自転車のぬし', enemies: [BICYCLE_LORD], reward: 10, boss: true, koma: 2 },
};

/**
 * 1-2 の商店街の歩ける場所（段階37。地図の絵 map.showa_street は 24×43マス）。
 * 下のアーケードの入口（S）からまっすぐの通りを上り、駄菓子屋の前の縁台（左の P）、時計屋の前（右の P）を通って、上の出口の坂へ。
 * 通りの両側は店（通れない）。時計屋の手前の歩道だけ、少し広い
 */
export const SHOWA_STREET_LAYOUT = [
  '########################',
  '########################',
  '########################',
  '########################',
  '########################',
  '###########....#########',
  '##########.....#########',
  '##########.....#########',
  '##########......########',
  '##########.......#######',
  '##########.......#######',
  '##########.......#######',
  '##########.......#######',
  '#########.......########',
  '#########.......########',
  '#########.......########',
  '#########.......########',
  '#########.......########',
  '#########.......########',
  '#########.......########',
  '#########.......########',
  '#######..........#######',
  '#######..........#######',
  '#######.........P#######',
  '#######..........#######',
  '#######..........#######',
  '#######..........#######',
  '#######..........#######',
  '#######............#####',
  '#######.P..........#####',
  '#######............#####',
  '#######............#####',
  '#######..........#######',
  '########..........######',
  '########..........######',
  '########..........######',
  '########..........######',
  '########..........######',
  '########........########',
  '########........########',
  '########........########',
  '########....S...########',
  '########........########',
];

export const AREAS: Record<string, AreaDef> = {
  // 1-1「金魚の名前」：平成の終わりの縁日
  a11: {
    id: 'a11',
    name: '1-1「金魚の名前」',
    layout: PROTO_FESTIVAL_LAYOUT,
    image: 'map.festival',
    bgm: BGM.festival,
    // 返すのに要るコマ（段階28。AREA_BATTLES の koma の合計は9）
    komaNeed: 8,
    timeTitle: '金魚の名前',
    owner: 'ユウマ',
    // 返す画面で、すり切れた映像として流す景色（段階46d）
    memory: 'shrine_approach',
    // 金魚すくいとラムネの屋台の前
    chests: [
      { id: 'a11_chest_goldfish', cell: [9, 29], items: [ITEMS.goldfishScale.id, ITEMS.goldfishScale.id, ITEMS.potion.id] },
      { id: 'a11_chest_ramune', cell: [14, 29], items: [ITEMS.balloonShard.id, ITEMS.maskShard.id] },
    ],
    enemies: [
      {
        id: 'a11_e_plaza',
        patrol: [
          [7, 32],
          [16, 32],
        ],
        battle: 'a11_storm1',
      },
      {
        id: 'a11_e_left',
        patrol: [
          [8, 21],
          [8, 24],
        ],
        battle: 'a11_storm2',
      },
      {
        id: 'a11_e_right',
        patrol: [
          [15, 21],
          [15, 24],
        ],
        battle: 'a11_storm3',
      },
      {
        id: 'a11_e_path',
        patrol: [
          [17, 16],
          [22, 16],
        ],
        battle: 'a11_storm4',
      },
    ],
    // 社の前
    boss: { id: 'a11_boss', cell: [12, 7], battle: 'a11_boss' },
    // 写しの人々（同じ言葉をくり返している）
    talkers: [
      { id: 'a11_voice_goldfish', cell: [10, 31], scene: 'a11_voice_goldfish', label: '金魚すくいのおじさん' },
      { id: 'a11_voice_cotton', cell: [13, 31], scene: 'a11_voice_cotton', label: 'わたあめ屋' },
      { id: 'a11_voice_yukata', cell: [12, 22], scene: 'a11_voice_yukata', label: '浴衣の女の人' },
    ],
    triggers: [
      { on: 'wins', count: 1, scene: 'a11_first_koma' },
      { on: 'checkpoint', scene: 'a11_checkpoint' },
      // あとコマが3つ以下になった時（台本の「あと{komaLeft}つ」に本当の数が入る。段階28）
      { on: 'komaLeft', left: 3, scene: 'a11_three_left' },
      { on: 'boss', scene: 'a11_boss' },
      { on: 'cleared', scene: 'a11_last_koma' },
    ],
  },
  // 1-2「夕暮れの二人乗り」：昭和の終わりの商店街（段階37）
  a12: {
    id: 'a12',
    name: '1-2「夕暮れの二人乗り」',
    layout: SHOWA_STREET_LAYOUT,
    image: 'map.showa_street',
    // 昭和の商店街の探索の曲が届くまで、日常の曲（商店街のシティポップ）
    bgm: BGM.daily,
    // 返すのに要るコマ（AREA_BATTLES の koma の合計は11）
    komaNeed: 10,
    timeTitle: '夕暮れの二人乗り',
    owner: 'フミ',
    memory: 'showa_street',
    // 時計屋の手前の広い歩道と、坂の手前の右の歩道
    chests: [
      { id: 'a12_chest_clock', cell: [18, 30], items: [ITEMS.ramuneGlass.id, ITEMS.phoneCord.id, ITEMS.potion.id] },
      { id: 'a12_chest_slope', cell: [16, 10], items: [ITEMS.tinSpring.id, ITEMS.menkoCard.id, ITEMS.hiPotion.id] },
    ],
    enemies: [
      {
        id: 'a12_e_gate',
        patrol: [
          [9, 36],
          [16, 36],
        ],
        battle: 'a12_storm1',
      },
      {
        id: 'a12_e_lower',
        patrol: [
          [15, 32],
          [8, 32],
        ],
        battle: 'a12_storm2',
      },
      {
        id: 'a12_e_middle',
        patrol: [
          [8, 26],
          [15, 26],
        ],
        battle: 'a12_storm3',
      },
      {
        id: 'a12_e_upper',
        patrol: [
          [14, 18],
          [10, 18],
        ],
        battle: 'a12_storm4',
      },
      {
        id: 'a12_e_slope',
        patrol: [
          [10, 12],
          [15, 12],
        ],
        battle: 'a12_storm5',
      },
    ],
    // 出口の坂の上
    boss: { id: 'a12_boss', cell: [12, 7], battle: 'a12_boss' },
    talkers: [
      { id: 'a12_voice_candy', cell: [7, 27], scene: 'a12_voice_candy', label: '駄菓子屋のおばあちゃん' },
      { id: 'a12_voice_grocer', cell: [8, 38], scene: 'a12_voice_grocer', label: '八百屋' },
      { id: 'a12_voice_tv', cell: [9, 15], scene: 'a12_voice_tv', label: '電器屋の子ども' },
      { id: 'a12_voice_tobacco', cell: [17, 28], scene: 'a12_voice_tobacco', label: 'たばこ屋' },
    ],
    triggers: [
      { on: 'wins', count: 1, scene: 'a12_first_koma' },
      { on: 'checkpoint', cell: [8, 29], scene: 'a12_checkpoint' },
      { on: 'checkpoint', cell: [16, 23], scene: 'a12_clockshop' },
      // 時間が食われていく（1-2-6）：時計屋のチェックポイントの後、次の戦闘（4つ目）に勝った時
      { on: 'wins', count: 4, after: 'a12_clockshop', scene: 'a12_eaten' },
      { on: 'komaLeft', left: 3, scene: 'a12_three_left' },
      { on: 'boss', scene: 'a12_boss' },
      { on: 'cleared', scene: 'a12_last_koma' },
    ],
  },
};
