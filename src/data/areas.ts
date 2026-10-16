import type { AreaDef, EnemyMove, EnemyTuning } from '../core/explore';
import type { CampaignBattle } from './campaign';
import { scaleEnemy } from './campaign';
import { BALLOON_NOISE, COTTON_NOISE, GOLDFISH_BOWL_LORD, GOLDFISH_NOISE, MASK_NOISE } from './festivalEnemies';
import { ABACUS_NOISE, GEAR_NOISE, LATHE_LORD, SCREW_NOISE, TUBE_NOISE } from './factoryEnemies';
import { AMP_LORD, BOOMBOX_NOISE, FLIP_PHONE_NOISE, METRONOME_NOISE, STICKER_NOISE } from './schoolEnemies';
import { BALL_NOISE, JUG_NOISE, KAI, MEGAPHONE_NOISE, PET_NOISE, SCOREBOARD_LORD } from './riversideEnemies';
import { BICYCLE_LORD, MENKO_NOISE, PHONE_NOISE, RAMUNE_NOISE, TIN_NOISE } from './showaEnemies';
import { ROOMS } from './rooms';
import { BGM } from './sounds';
import { ITEMS } from './weapons';

// 探索の区画（段階25）。地図の絵、歩ける場所の文字の地図、宝箱、敵の印、ボス、話せる人、途中の会話のきっかけ。
// 位置はマス（列, 行）。1マスは 32（AREA_TILE）。歩ける場所の文字の地図は、段階18b の縁日の地図をそのまま使う

/** 狩りで、前の章の区画の砂嵐と戦った時の星の砂と武器の経験値の割合（段階49。今の章の区画は全部） */
export const HUNT_OLD_AREA_RATE = 0.5;

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
// 区画のボスの snaps は、勝った時に手に入るスナップ（段階41。宝箱の snaps・区画の returnSnaps と合わせて、アルバムの入れ替えに使う）
// 星の砂（reward）・勝利のアイテム・スナップは、段階55で 1つの区画の目安（docs/design/economy.md の 8.）にそろえた：星の砂は部位破壊と合わせて約25（その章の区域の約半分）、消費アイテムは宝箱と合わせて3つ
export const AREA_BATTLES: Record<string, CampaignBattle> = {
  a11_storm1: { id: 'a11_storm1', name: '砂嵐', enemies: [GOLDFISH_NOISE, GOLDFISH_NOISE], reward: 3, koma: 1 },
  a11_storm2: { id: 'a11_storm2', name: '砂嵐', enemies: [GOLDFISH_NOISE, BALLOON_NOISE], reward: 3, item: ITEMS.ether.id, koma: 2 },
  a11_storm3: { id: 'a11_storm3', name: '砂嵐', enemies: [BALLOON_NOISE, MASK_NOISE, GOLDFISH_NOISE], reward: 4, koma: 2 },
  // 社への道の砂嵐は少し強い（HP・攻撃・魔力 ×1.2。ボスの手前の山）
  a11_storm4: { id: 'a11_storm4', name: '砂嵐', enemies: [MASK_NOISE, COTTON_NOISE, BALLOON_NOISE].map((e) => scaleEnemy(e, 1.2)), reward: 4, item: ITEMS.hiPotion.id, koma: 2 },
  // ボスは最後のコマを抱えこんでいる（2つ。1-1 は合わせて9つで、返すのに8つ。1つ余る）
  a11_boss: { id: 'a11_boss', name: '金魚鉢のぬし', enemies: [GOLDFISH_BOWL_LORD], reward: 5, boss: true, koma: 2, snaps: ['heavyBlow'] },
  // 1-2 の商店街（段階37）。並びは出会う順（入口 → 駄菓子屋の手前 → 駄菓子屋と時計屋の間 → 時計屋の先 → 坂の手前）。
  // 砂嵐は5戦でコマ9つ、ボスが2つ（合わせて11、返すのに10。1つ余る）。坂の手前の2戦は少し強い（ボスの手前の山）
  a12_storm1: { id: 'a12_storm1', name: '砂嵐', enemies: [TIN_NOISE, PHONE_NOISE], reward: 3, koma: 1 },
  a12_storm2: { id: 'a12_storm2', name: '砂嵐', enemies: [RAMUNE_NOISE, MENKO_NOISE], reward: 3, item: ITEMS.ether.id, koma: 2 },
  a12_storm3: { id: 'a12_storm3', name: '砂嵐', enemies: [PHONE_NOISE, RAMUNE_NOISE, MENKO_NOISE], reward: 3, koma: 2 },
  a12_storm4: { id: 'a12_storm4', name: '砂嵐', enemies: [TIN_NOISE, MENKO_NOISE, RAMUNE_NOISE].map((e) => scaleEnemy(e, 1.2)), reward: 3, koma: 2 },
  a12_storm5: { id: 'a12_storm5', name: '砂嵐', enemies: [PHONE_NOISE, TIN_NOISE, RAMUNE_NOISE].map((e) => scaleEnemy(e, 1.25)), reward: 4, koma: 2 },
  a12_boss: { id: 'a12_boss', name: '自転車のぬし', enemies: [BICYCLE_LORD], reward: 5, boss: true, koma: 2, snaps: ['breakArm'] },
  // 2-1 の町工場（段階39。段階38では 1-2 の砂嵐で代わりにしていた）。並びは出会う順（路地の入口 → 路地の上 → 銭湯の左 → 銭湯の右 → 工場の中）。
  // 砂嵐は5戦でコマ9つ、ボスが2つ（合わせて11、返すのに10。1つ余る）。工場の中の砂嵐は少し強い（ボスの手前の山）。ギアは落とさない（宝箱と出来事のごほうび。段階38）
  a21_storm1: { id: 'a21_storm1', name: '砂嵐', enemies: [GEAR_NOISE, SCREW_NOISE], reward: 3, koma: 1 },
  a21_storm2: { id: 'a21_storm2', name: '砂嵐', enemies: [TUBE_NOISE, SCREW_NOISE, GEAR_NOISE], reward: 3, koma: 2 },
  a21_storm3: { id: 'a21_storm3', name: '砂嵐', enemies: [ABACUS_NOISE, TUBE_NOISE, SCREW_NOISE], reward: 3, koma: 2 },
  a21_storm4: { id: 'a21_storm4', name: '砂嵐', enemies: [GEAR_NOISE, ABACUS_NOISE, TUBE_NOISE], reward: 3, item: ITEMS.hiPotion.id, koma: 2 },
  a21_storm5: { id: 'a21_storm5', name: '砂嵐', enemies: [SCREW_NOISE, GEAR_NOISE, ABACUS_NOISE].map((e) => scaleEnemy(e, 1.2)), reward: 4, koma: 2 },
  a21_boss: { id: 'a21_boss', name: '旋盤のぬし', enemies: [LATHE_LORD], reward: 5, boss: true, koma: 2, snaps: ['heavyBlow'] },
  // 2-2 の文化祭の高校（段階39b。部屋をつなぐ形）。並びは出会う順（校門 → 中庭の下 → 中庭の上 → お化け屋敷の教室 → 渡り廊下の番人）。
  // 砂嵐は5戦でコマ9つ、ボスが2つ（合わせて11、返すのに10。1つ余る）。番人は少し強い（×1.3。ボスの手前の山）。
  // 駐輪場の逃げる敵はコマを持たない寄り道で、勝つとレアの素材「ラストチャイムのデモテープ」
  a22_storm1: { id: 'a22_storm1', name: '砂嵐', enemies: [FLIP_PHONE_NOISE, STICKER_NOISE], reward: 3, koma: 1 },
  a22_storm2: { id: 'a22_storm2', name: '砂嵐', enemies: [BOOMBOX_NOISE, FLIP_PHONE_NOISE, STICKER_NOISE], reward: 3, koma: 2 },
  a22_storm3: { id: 'a22_storm3', name: '砂嵐', enemies: [METRONOME_NOISE, STICKER_NOISE, BOOMBOX_NOISE], reward: 3, koma: 2 },
  a22_storm4: { id: 'a22_storm4', name: '砂嵐', enemies: [FLIP_PHONE_NOISE, METRONOME_NOISE, BOOMBOX_NOISE], reward: 3, koma: 2 },
  a22_storm5: { id: 'a22_storm5', name: '砂嵐', enemies: [METRONOME_NOISE, BOOMBOX_NOISE, FLIP_PHONE_NOISE].map((e) => scaleEnemy(e, 1.3)), reward: 3, koma: 2 },
  a22_runner: { id: 'a22_runner', name: '砂嵐', enemies: [STICKER_NOISE, STICKER_NOISE, STICKER_NOISE], reward: 2, item: ITEMS.demoTape.id },
  a22_boss: { id: 'a22_boss', name: 'アンプのぬし', enemies: [AMP_LORD], reward: 5, boss: true, koma: 2, snaps: ['encore'] },
  // 2-3 の河川敷のグラウンド（段階40。部屋をつなぐ形）。並びは出会う順（土手の道 → ベンチの前 → 川べりの逃げる敵 → ベンチの裏の上 → 用具小屋の裏 → 売店の番人）。
  // 砂嵐は5戦でコマ9つ、ボスが2つ（合わせて11、返すのに10）。番人は ×1.15。川べりの逃げる敵はコマなしで、勝つとレアの素材「最後のスコアブック」
  a23_storm1: { id: 'a23_storm1', name: '砂嵐', enemies: [BALL_NOISE, PET_NOISE], reward: 3, koma: 1 },
  a23_storm2: { id: 'a23_storm2', name: '砂嵐', enemies: [MEGAPHONE_NOISE, BALL_NOISE, JUG_NOISE], reward: 3, koma: 2 },
  a23_runner: { id: 'a23_runner', name: '砂嵐', enemies: [PET_NOISE, PET_NOISE, PET_NOISE], reward: 2, item: ITEMS.scorebook.id },
  a23_storm3: { id: 'a23_storm3', name: '砂嵐', enemies: [JUG_NOISE, PET_NOISE, MEGAPHONE_NOISE], reward: 3, koma: 2 },
  a23_storm4: { id: 'a23_storm4', name: '砂嵐', enemies: [BALL_NOISE, MEGAPHONE_NOISE, PET_NOISE], reward: 3, koma: 2 },
  a23_storm5: { id: 'a23_storm5', name: '砂嵐', enemies: [JUG_NOISE, BALL_NOISE, MEGAPHONE_NOISE].map((e) => scaleEnemy(e, 1.15)), reward: 3, koma: 2 },
  a23_boss: { id: 'a23_boss', name: 'スコアボードのぬし', enemies: [SCOREBOARD_LORD], reward: 5, boss: true, koma: 2, snaps: ['pinchHitter'] },
  // 返す直前のカイ（段階40。負け戦）。4ラウンド目の終わりか、カイの HP が半分を切った所で打ち切る。報酬はない（物語の流れの battle の出来事から始める）
  a23_kai: { id: 'a23_kai', name: 'カイ', enemies: [KAI], reward: 0, boss: true, cutoff: { rounds: 4, enemyHpRatio: 0.5 } },
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
    // 狩り（段階43）：採取の場所は、1回目の宝箱と浴衣の女の人の所。砂嵐は入るたびに縁日の4つの戦闘から選ぶ
    hunt: {
      gathers: [
        { id: 'a11_gather_goldfish', cell: [9, 29], items: [ITEMS.goldfishScale.id, ITEMS.goldfishScale.id] },
        { id: 'a11_gather_ramune', cell: [14, 29], items: [ITEMS.balloonShard.id, ITEMS.cottonThread.id] },
        { id: 'a11_gather_yukata', cell: [12, 22], items: [ITEMS.maskShard.id] },
      ],
      tables: { festival_grounds: ['a11_storm1', 'a11_storm2', 'a11_storm3', 'a11_storm4'] },
    },
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
    // 返した報酬のスナップ（段階41）
    returnSnaps: ['recover'],
    // 時計屋の手前の広い歩道と、坂の手前の右の歩道
    // 狩り（段階43）：採取の場所は、1回目の宝箱と電器屋の子どもの所
    hunt: {
      gathers: [
        { id: 'a12_gather_clock', cell: [18, 30], items: [ITEMS.ramuneGlass.id, ITEMS.phoneCord.id] },
        { id: 'a12_gather_slope', cell: [16, 10], items: [ITEMS.tinSpring.id, ITEMS.menkoCard.id] },
        { id: 'a12_gather_tv', cell: [9, 15], items: [ITEMS.phoneCord.id] },
      ],
      tables: { showa_street: ['a12_storm1', 'a12_storm2', 'a12_storm3', 'a12_storm4', 'a12_storm5'] },
    },
    chests: [
      { id: 'a12_chest_clock', cell: [18, 30], items: [ITEMS.ramuneGlass.id, ITEMS.phoneCord.id, ITEMS.potion.id], snaps: ['heavyBlow'] },
      { id: 'a12_chest_slope', cell: [16, 10], items: [ITEMS.tinSpring.id, ITEMS.menkoCard.id, ITEMS.hiPotion.id], snaps: ['iceChip'] },
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
    // 返した報酬のスナップ（段階41）
    returnSnaps: ['joker'],
    // 銭湯の左の道の奥と、右の道の奥。ムーブメントのギアも入っている（段階38）
    // 狩り（段階43）：採取の場所は、1回目の宝箱とラジオの所
    hunt: {
      gathers: [
        { id: 'a21_gather_left', cell: [5, 12], items: [ITEMS.rustyScrew.id, ITEMS.tubeGlass.id] },
        { id: 'a21_gather_right', cell: [19, 12], items: [ITEMS.abacusBead.id, ITEMS.wornGear.id] },
        { id: 'a21_gather_radio', cell: [11, 27], items: [ITEMS.tubeGlass.id] },
      ],
      tables: { factory_alley: ['a21_storm1', 'a21_storm2', 'a21_storm3', 'a21_storm4', 'a21_storm5'] },
    },
    chests: [
      { id: 'a21_chest_left', cell: [5, 12], items: [ITEMS.rustyScrew.id, ITEMS.tubeGlass.id, ITEMS.potion.id], gears: ['thunderBoost'], snaps: ['thunderChip'] },
      { id: 'a21_chest_right', cell: [19, 12], items: [ITEMS.abacusBead.id, ITEMS.wornGear.id, ITEMS.ether.id], gears: ['firstAid'], snaps: ['draw'] },
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
  // 2-2「最後の文化祭」：平成18年の秋の高校の文化祭（段階39b）。部屋をつなぐ形で作った最初の区画。
  // 校門 → 中庭（左に寄り道の駐輪場）→ 渡り廊下（右にお化け屋敷の教室）→ 番人を倒すと開く体育館
  a22: {
    id: 'a22',
    name: '2-2「最後の文化祭」',
    rooms: [ROOMS.school_gate, ROOMS.school_courtyard, ROOMS.school_bikes, ROOMS.school_corridor, ROOMS.school_classroom, ROOMS.school_gym],
    links: [
      { a: { room: 'school_gate', side: 'top' }, b: { room: 'school_courtyard', side: 'bottom' } },
      { a: { room: 'school_courtyard', side: 'left' }, b: { room: 'school_bikes', side: 'right' } },
      { a: { room: 'school_courtyard', side: 'top' }, b: { room: 'school_corridor', side: 'bottom' } },
      { a: { room: 'school_corridor', side: 'right' }, b: { room: 'school_classroom', side: 'left' } },
      // 体育館への扉は、渡り廊下の番人を倒すと開く
      { a: { room: 'school_corridor', side: 'top' }, b: { room: 'school_gym', side: 'bottom' }, opensWhen: 'a22_e_stage' },
    ],
    // 平成の文化祭の探索の曲が届くまで、日常の曲
    bgm: BGM.daily,
    // 返すのに要るコマ（AREA_BATTLES の koma の合計は11）
    komaNeed: 10,
    timeTitle: '最後の文化祭',
    owner: 'ケンタ',
    memory: 'school_festival',
    // 返した報酬のスナップ（段階41）
    returnSnaps: ['joker'],
    // 中庭の右の模擬店の裏、駐輪場の奥、お化け屋敷の教室の奥。寄り道の2つにはムーブメントのギア
    // 狩り（段階43）：採取の場所は、1回目の宝箱の所。番人（渡り廊下）は出ないので、番人の戦闘は教室の表に入れる
    hunt: {
      gathers: [
        { id: 'a22_gather_stall', room: 'school_courtyard', cell: [20, 24], items: [ITEMS.photoSticker.id, ITEMS.phoneStrap.id] },
        { id: 'a22_gather_bikes', room: 'school_bikes', cell: [3, 3], items: [ITEMS.cassetteTape.id, ITEMS.pendulumWeight.id] },
        { id: 'a22_gather_haunted', room: 'school_classroom', cell: [20, 4], items: [ITEMS.photoSticker.id, ITEMS.cassetteTape.id] },
      ],
      tables: {
        school_gate: ['a22_storm1', 'a22_storm1', 'a22_storm2'],
        school_courtyard: ['a22_storm2', 'a22_storm3'],
        school_classroom: ['a22_storm3', 'a22_storm4', 'a22_storm5'],
      },
    },
    chests: [
      { id: 'a22_chest_stall', room: 'school_courtyard', cell: [20, 24], items: [ITEMS.photoSticker.id, ITEMS.phoneStrap.id, ITEMS.potion.id], snaps: ['fireChip'] },
      { id: 'a22_chest_bikes', room: 'school_bikes', cell: [3, 3], items: [ITEMS.cassetteTape.id, ITEMS.pendulumWeight.id, ITEMS.ether.id], gears: ['iceBoost'], snaps: ['search'] },
      { id: 'a22_chest_haunted', room: 'school_classroom', cell: [20, 4], items: [ITEMS.glitterPen.id, ITEMS.ringtoneChip.id, ITEMS.hiPotion.id], gears: ['comboBoost'] },
    ],
    enemies: [
      {
        id: 'a22_e_gate',
        patrol: [
          [5, 12],
          [18, 12],
        ],
        battle: 'a22_storm1',
      },
      {
        id: 'a22_e_stalls',
        room: 'school_courtyard',
        patrol: [
          [6, 35],
          [17, 35],
        ],
        battle: 'a22_storm2',
      },
      // 駐輪場の逃げる敵（寄り道。コマなし、レアの素材）
      { id: 'a22_e_runner', room: 'school_bikes', move: 'flee', patrol: [[8, 16]], battle: 'a22_runner' },
      // 中庭の上の模擬店の通り：近づくと追ってくる
      {
        id: 'a22_e_upper',
        room: 'school_courtyard',
        move: 'chase',
        patrol: [
          [7, 13],
          [16, 13],
        ],
        battle: 'a22_storm3',
      },
      // お化け屋敷の教室：暗幕の迷路で追ってくる
      {
        id: 'a22_e_haunted',
        room: 'school_classroom',
        move: 'chase',
        patrol: [
          [10, 6],
          [10, 17],
        ],
        battle: 'a22_storm4',
      },
      // 渡り廊下の番人：倒すと体育館への扉が開く
      { id: 'a22_e_stage', room: 'school_corridor', move: 'guard', patrol: [[11, 3]], battle: 'a22_storm5' },
    ],
    // 体育館のステージ
    boss: { id: 'a22_boss', room: 'school_gym', cell: [11, 4], battle: 'a22_boss' },
    talkers: [
      { id: 'a22_voice_committee', cell: [6, 18], scene: 'a22_voice_committee', label: '実行委員' },
      { id: 'a22_voice_stall', room: 'school_courtyard', cell: [6, 28], scene: 'a22_voice_stall', label: '模擬店の生徒' },
      { id: 'a22_voice_classmate', room: 'school_corridor', cell: [19, 16], scene: 'a22_voice_classmate', label: 'クラスメイト' },
      { id: 'a22_voice_teacher', room: 'school_corridor', cell: [7, 6], scene: 'a22_voice_teacher', label: '音楽の先生' },
    ],
    triggers: [
      { on: 'checkpoint', room: 'school_courtyard', cell: [9, 23], scene: 'a22_checkpoint' },
      { on: 'checkpoint', room: 'school_corridor', cell: [5, 8], scene: 'a22_music_room' },
      { on: 'komaLeft', left: 3, scene: 'a22_three_left' },
      { on: 'boss', scene: 'a22_boss' },
      { on: 'cleared', scene: 'a22_last_koma' },
    ],
  },
  // 2-3「最後の打席」：平成10年の夏の河川敷のグラウンド（段階40）。ボスに勝ってコマがそろった後、返す直前にカイに持ち去られる（物語の流れの a23_kai）。
  // 土手の道 → ベンチの裏の木陰（右に寄り道の川べり）→ 売店のテント（左に用具小屋の裏）→ 番人を倒すと開くダイヤモンド
  a23: {
    id: 'a23',
    name: '2-3「最後の打席」',
    rooms: [ROOMS.riverside_levee, ROOMS.riverside_bench, ROOMS.riverside_bank, ROOMS.riverside_stand, ROOMS.riverside_shed, ROOMS.riverside_diamond],
    links: [
      { a: { room: 'riverside_levee', side: 'top' }, b: { room: 'riverside_bench', side: 'bottom' } },
      { a: { room: 'riverside_bench', side: 'right' }, b: { room: 'riverside_bank', side: 'left' } },
      { a: { room: 'riverside_bench', side: 'top' }, b: { room: 'riverside_stand', side: 'bottom' } },
      { a: { room: 'riverside_stand', side: 'left' }, b: { room: 'riverside_shed', side: 'right' } },
      // ダイヤモンドへは、売店の上の番人を倒すと入れる
      { a: { room: 'riverside_stand', side: 'top' }, b: { room: 'riverside_diamond', side: 'bottom' }, opensWhen: 'a23_e_gate' },
    ],
    // 平成の夏の河川敷の探索の曲が届くまで、日常の曲
    bgm: BGM.daily,
    // 返すのに要るコマ（AREA_BATTLES の koma の合計は11）。返す前にカイに持ち去られる
    komaNeed: 10,
    timeTitle: '最後の打席',
    owner: 'コウジ',
    memory: 'riverside_1998',
    chests: [
      { id: 'a23_chest_bench', room: 'riverside_bench', cell: [19, 15], items: [ITEMS.ballSeam.id, ITEMS.jugIce.id, ITEMS.potion.id] },
      { id: 'a23_chest_bank', room: 'riverside_bank', cell: [16, 4], items: [ITEMS.petEgg.id, ITEMS.megaphoneMouth.id, ITEMS.ether.id], gears: ['startDash'], snaps: ['iceChip'] },
      { id: 'a23_chest_shed', room: 'riverside_shed', cell: [4, 4], items: [ITEMS.autographBall.id, ITEMS.cheerBand.id, ITEMS.hiPotion.id], gears: ['breaker'], snaps: ['wideShot'] },
    ],
    enemies: [
      {
        id: 'a23_e_slope',
        patrol: [
          [17, 15],
          [17, 8],
        ],
        battle: 'a23_storm1',
      },
      {
        id: 'a23_e_bench',
        room: 'riverside_bench',
        patrol: [
          [5, 33],
          [18, 33],
        ],
        battle: 'a23_storm2',
      },
      // 川べりの逃げる敵（寄り道。コマなし、レアの素材）
      { id: 'a23_e_runner', room: 'riverside_bank', move: 'flee', patrol: [[10, 16]], battle: 'a23_runner' },
      // ベンチの裏の上：近づくと追ってくる
      {
        id: 'a23_e_shade',
        room: 'riverside_bench',
        move: 'chase',
        patrol: [
          [8, 9],
          [15, 9],
        ],
        battle: 'a23_storm3',
      },
      // 用具小屋の裏：追ってくる
      {
        id: 'a23_e_shed',
        room: 'riverside_shed',
        move: 'chase',
        patrol: [
          [10, 6],
          [10, 18],
        ],
        battle: 'a23_storm4',
      },
      // 売店の上の番人：倒すとダイヤモンドへの道が開く
      { id: 'a23_e_gate', room: 'riverside_stand', move: 'guard', patrol: [[11, 5]], battle: 'a23_storm5' },
    ],
    // ホームベースの前
    boss: { id: 'a23_boss', room: 'riverside_diamond', cell: [11, 6], battle: 'a23_boss' },
    talkers: [
      { id: 'a23_voice_kid', cell: [7, 13], scene: 'a23_voice_kid', label: 'スタンドの子ども' },
      { id: 'a23_voice_coach', room: 'riverside_bench', cell: [5, 28], scene: 'a23_voice_coach', label: '監督' },
      { id: 'a23_voice_shop', room: 'riverside_stand', cell: [18, 13], scene: 'a23_voice_shop', label: '売店のおばちゃん' },
      { id: 'a23_voice_rival', room: 'riverside_stand', cell: [4, 16], scene: 'a23_voice_rival', label: '相手チームの子' },
    ],
    triggers: [
      { on: 'checkpoint', room: 'riverside_bench', cell: [9, 21], scene: 'a23_checkpoint' },
      { on: 'checkpoint', room: 'riverside_stand', cell: [12, 14], scene: 'a23_stand' },
      { on: 'komaLeft', left: 3, scene: 'a23_three_left' },
      { on: 'boss', scene: 'a23_boss' },
      { on: 'cleared', scene: 'a23_last_koma' },
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
