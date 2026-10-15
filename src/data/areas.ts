import type { AreaDef, EnemyMove, EnemyTuning } from '../core/explore';
import type { CampaignBattle } from './campaign';
import { scaleEnemy } from './campaign';
import { BALLOON_NOISE, COTTON_NOISE, GOLDFISH_BOWL_LORD, GOLDFISH_NOISE, MASK_NOISE } from './festivalEnemies';
import { ABACUS_NOISE, GEAR_NOISE, LATHE_LORD, SCREW_NOISE, TUBE_NOISE } from './factoryEnemies';
import { BICYCLE_LORD, MENKO_NOISE, PHONE_NOISE, RAMUNE_NOISE, TIN_NOISE } from './showaEnemies';
import { ROOMS } from './rooms';
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
/**
 * 敵の動き方ごとの数値（段階47b）。stepMs は1マス進む時間（仲間は AREA_STEP_MS）。追ってくる敵は仲間より遅いので逃げ切れる。
 * 逃げる敵は仲間と同じくらい速いので、行き止まりに追いこんで捕まえる
 */
export const ENEMY_MOVES = {
  patrol: { stepMs: AREA_ENEMY_STEP_MS, notice: 0, giveUp: 0 },
  chase: { stepMs: AREA_ENEMY_STEP_MS, notice: 4, giveUp: 7 },
  guard: { stepMs: 0, notice: 0, giveUp: 0 },
  flee: { stepMs: 150, notice: 4, giveUp: 0 },
} satisfies Record<EnemyMove, EnemyTuning & { stepMs: number }>;
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
  // 2-1 の町工場（段階39。段階38では 1-2 の砂嵐で代わりにしていた）。並びは出会う順（路地の入口 → 路地の上 → 銭湯の左 → 銭湯の右 → 工場の中）。
  // 砂嵐は5戦でコマ9つ、ボスが2つ（合わせて11、返すのに10。1つ余る）。工場の中の砂嵐は少し強い（ボスの手前の山）。ギアは落とさない（宝箱と出来事のごほうび。段階38）
  a21_storm1: { id: 'a21_storm1', name: '砂嵐', enemies: [GEAR_NOISE, SCREW_NOISE], reward: 6, item: ITEMS.potion.id, koma: 1 },
  a21_storm2: { id: 'a21_storm2', name: '砂嵐', enemies: [TUBE_NOISE, SCREW_NOISE, GEAR_NOISE], reward: 6, item: ITEMS.ether.id, koma: 2 },
  a21_storm3: { id: 'a21_storm3', name: '砂嵐', enemies: [ABACUS_NOISE, TUBE_NOISE, SCREW_NOISE], reward: 7, koma: 2 },
  a21_storm4: { id: 'a21_storm4', name: '砂嵐', enemies: [GEAR_NOISE, ABACUS_NOISE, TUBE_NOISE], reward: 7, item: ITEMS.hiPotion.id, koma: 2 },
  a21_storm5: { id: 'a21_storm5', name: '砂嵐', enemies: [SCREW_NOISE, GEAR_NOISE, ABACUS_NOISE].map((e) => scaleEnemy(e, 1.2)), reward: 8, koma: 2 },
  a21_boss: { id: 'a21_boss', name: '旋盤のぬし', enemies: [LATHE_LORD], reward: 10, boss: true, koma: 2 },
};





export const AREAS: Record<string, AreaDef> = {
  // 1-1「金魚の名前」：平成の終わりの縁日
  a11: {
    id: 'a11',
    name: '1-1「金魚の名前」',
    rooms: [ROOMS.festival_grounds],
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
    rooms: [ROOMS.showa_street],
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
  // 2-1「親方の背中」：昭和44年の冬の町工場の路地（段階38。みおの初めての戦闘とムーブメントの開放。段階39で敵とボス、返す場面）
  a21: {
    id: 'a21',
    name: '2-1「親方の背中」',
    rooms: [ROOMS.factory_alley],
    // 昭和の町工場の探索の曲が届くまで、日常の曲
    bgm: BGM.daily,
    // 返すのに要るコマ（AREA_BATTLES の koma の合計は11）
    komaNeed: 10,
    timeTitle: '親方の背中',
    owner: 'イサム',
    memory: 'factory_alley',
    // 銭湯の左の道の奥と、右の道の奥。ムーブメントのギアも入っている（段階38）
    chests: [
      { id: 'a21_chest_left', cell: [5, 12], items: [ITEMS.rustyScrew.id, ITEMS.tubeGlass.id, ITEMS.potion.id], gears: ['thunderBoost'] },
      { id: 'a21_chest_right', cell: [19, 12], items: [ITEMS.abacusBead.id, ITEMS.wornGear.id, ITEMS.ether.id], gears: ['firstAid'] },
    ],
    enemies: [
      {
        id: 'a21_e_lower',
        patrol: [
          [11, 33],
          [13, 33],
          [13, 30],
          [11, 30],
        ],
        battle: 'a21_storm1',
      },
      {
        id: 'a21_e_upper',
        patrol: [
          [13, 25],
          [11, 25],
        ],
        battle: 'a21_storm2',
      },
      {
        id: 'a21_e_left',
        patrol: [
          [6, 19],
          [6, 14],
        ],
        battle: 'a21_storm3',
      },
      {
        id: 'a21_e_right',
        patrol: [
          [19, 14],
          [19, 19],
        ],
        battle: 'a21_storm4',
      },
      {
        id: 'a21_e_yard',
        patrol: [
          [9, 7],
          [14, 7],
        ],
        battle: 'a21_storm5',
      },
    ],
    // 工場の中、旋盤の前
    boss: { id: 'a21_boss', cell: [11, 5], battle: 'a21_boss' },
    talkers: [
      { id: 'a21_voice_bath', cell: [14, 19], scene: 'a21_voice_bath', label: '銭湯のおかみさん' },
      { id: 'a21_voice_senior', cell: [7, 11], scene: 'a21_voice_senior', label: '先輩の職人' },
      { id: 'a21_voice_radio', cell: [11, 27], scene: 'a21_voice_radio', label: 'ラジオ' },
      { id: 'a21_voice_kid', cell: [14, 37], scene: 'a21_voice_kid', label: '八百屋の子ども' },
    ],
    triggers: [
      { on: 'wins', count: 1, scene: 'a21_first_koma' },
      // ムーブメントの開放（2-1-4）。みおが拾った歯車を、ごほうびのギアとして渡す
      { on: 'checkpoint', cell: [9, 21], scene: 'a21_checkpoint', gears: ['speedMemory'] },
      { on: 'checkpoint', cell: [15, 11], scene: 'a21_gate' },
      { on: 'komaLeft', left: 3, scene: 'a21_three_left' },
      { on: 'boss', scene: 'a21_boss' },
      { on: 'cleared', scene: 'a21_last_koma' },
    ],
  },
};

/**
 * 試しの区画（段階47。デバッグメニューの「試しの区画」から入る。本編の流れでは使わない）。
 * 商店街（出発点）の上の出入口は、番人を倒すと開く縁日へ。左の出入口は、寄り道の町工場（逃げる敵と宝箱）へ。
 * 商店街には追ってくる敵、縁日には見回りの敵と、奥にボス。戦闘は 1-1 の戦闘を使い回す
 */
export const TRIAL_AREAS: Record<string, AreaDef> = {
  trial47: {
    id: 'trial47',
    name: '試しの区画（段階47）',
    rooms: [ROOMS.trial_street, ROOMS.trial_factory, ROOMS.trial_festival],
    links: [
      { a: { room: 'trial_street', side: 'top' }, b: { room: 'trial_festival', side: 'bottom' }, opensWhen: 'trial_guard' },
      { a: { room: 'trial_street', side: 'left' }, b: { room: 'trial_factory', side: 'right' } },
    ],
    bgm: BGM.daily,
    komaNeed: 7,
    timeTitle: '試しの区画',
    owner: '―',
    chests: [{ id: 'trial_chest', room: 'trial_factory', cell: [5, 12], items: [ITEMS.potion.id], gears: ['mpSave'] }],
    enemies: [
      { id: 'trial_chaser', move: 'chase', patrol: [[9, 32], [16, 32]], battle: 'a11_storm1' },
      { id: 'trial_guard', move: 'guard', patrol: [[12, 7]], battle: 'a11_storm2' },
      { id: 'trial_runner', move: 'flee', room: 'trial_factory', patrol: [[6, 16]], battle: 'a11_storm3' },
      { id: 'trial_walker', room: 'trial_festival', patrol: [[7, 32], [16, 32], [16, 33], [7, 33]], battle: 'a11_storm4' },
    ],
    boss: { id: 'trial_boss', room: 'trial_festival', cell: [12, 7], battle: 'a11_boss' },
    talkers: [],
    triggers: [],
  },
};
