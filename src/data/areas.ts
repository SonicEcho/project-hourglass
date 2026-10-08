import type { AreaDef } from '../core/explore';
import type { CampaignBattle } from './campaign';
import { strengthen } from './campaign';
import { ARMOR_DOG, DISTORTED_BEAST, FROST_BAT, SLIME } from './enemies';
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
 * 区画の戦闘（段階25）。敵の砂嵐は段階27で作るので、今は試作の敵で代わりに戦う。
 * reward は星の砂、item は勝った時のアイテム（試作の5戦と同じ形）。ギアの報酬は、育成を開放する段階26で決める
 */
export const AREA_BATTLES: Record<string, CampaignBattle> = {
  a11_storm1: { id: 'a11_storm1', name: '砂嵐（仮）', enemies: [SLIME, SLIME], reward: 4, item: ITEMS.potion.id },
  a11_storm2: { id: 'a11_storm2', name: '砂嵐（仮）', enemies: [SLIME, FROST_BAT], reward: 5, item: ITEMS.ether.id },
  a11_storm3: { id: 'a11_storm3', name: '砂嵐（仮）', enemies: [SLIME, FROST_BAT, ARMOR_DOG], reward: 6 },
  a11_storm4: {
    id: 'a11_storm4',
    name: '砂嵐（仮）',
    enemies: [SLIME, FROST_BAT, ARMOR_DOG].map((e) => strengthen(e, 1.2)),
    reward: 6,
    item: ITEMS.hiPotion.id,
  },
  a11_boss: { id: 'a11_boss', name: '金魚鉢のぬし（仮）', enemies: [DISTORTED_BEAST], reward: 8, boss: true },
};

export const AREAS: Record<string, AreaDef> = {
  // 1-1「金魚の名前」：平成の終わりの縁日
  a11: {
    id: 'a11',
    name: '1-1「金魚の名前」',
    layout: PROTO_FESTIVAL_LAYOUT,
    image: 'map.festival',
    bgm: BGM.festival,
    // 金魚すくいとラムネの屋台の前
    chests: [
      { id: 'a11_chest_goldfish', cell: [9, 29], items: [ITEMS.slimeJelly.id, ITEMS.slimeJelly.id, ITEMS.potion.id] },
      { id: 'a11_chest_ramune', cell: [14, 29], items: [ITEMS.frostFeather.id, ITEMS.hardFur.id] },
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
      { on: 'wins', count: 3, scene: 'a11_three_left' },
      { on: 'boss', scene: 'a11_boss' },
      { on: 'cleared', scene: 'a11_last_koma' },
    ],
  },
};
