import type { AreaDef, EnemyMove, EnemyTuning } from '../core/explore';
import type { CampaignBattle } from './campaign';
import { scaleEnemy, toughenEnemy } from './campaign';
import type { EnemyDef } from '../core/types';
import { BALLOON_NOISE, COTTON_NOISE, GOLDFISH_BOWL_LORD, GOLDFISH_NOISE, MASK_NOISE } from './festivalEnemies';
import { ABACUS_NOISE, GEAR_NOISE, LATHE_LORD, SCREW_NOISE, TUBE_NOISE } from './factoryEnemies';
import { AMP_LORD, BOOMBOX_NOISE, FLIP_PHONE_NOISE, METRONOME_NOISE, STICKER_NOISE } from './schoolEnemies';
import { BALL_NOISE, JUG_NOISE, KAI, MEGAPHONE_NOISE, PET_NOISE, SCOREBOARD_LORD } from './riversideEnemies';
import { BICYCLE_LORD, MENKO_NOISE, PHONE_NOISE, RAMUNE_NOISE, TIN_NOISE } from './showaEnemies';
import { box, ROOMS } from './rooms';
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
 * 逃げる敵は、段階79で仲間より少し遅くした（まっすぐ追いかけると追いつける。前は仲間とほぼ同じ速さで、行き止まりに追いこまないと捕まらなかった）
 */
export const ENEMY_MOVES = {
  patrol: { stepMs: AREA_ENEMY_STEP_MS, notice: 0, giveUp: 0 },
  chase: { stepMs: AREA_ENEMY_STEP_MS, notice: 4, giveUp: 7 },
  guard: { stepMs: 0, notice: 0, giveUp: 0 },
  flee: { stepMs: 200, notice: 4, giveUp: 0 },
} satisfies Record<EnemyMove, EnemyTuning & { stepMs: number }>;
/** 話せる人に、この距離（マス）まで近づくと話す */
export const AREA_TALK_RANGE = 1;

/**
 * 区画の戦闘（段階25・27）。1-1 は縁日の砂嵐（festivalEnemies.ts）と、区画のボス「金魚鉢のぬし」。
 * reward は星の砂、item は勝った時のアイテム。ギアの報酬は出さない（1章はムーブメントが閉じている。段階26）。
 * 並びは出会う順の目安（広場 → 左右の参道 → 社への道 → 社の前）。数値の目安と測った結果は docs/design/battle.md の 13.
 */
// 区画のボスの snaps は、勝った時に手に入るスナップ（段階41。宝箱の snaps・区画の returnSnaps と合わせて、アルバムの入れ替えに使う）
// 勝利のアイテム・スナップは、段階55で 1つの区画の目安（docs/design/economy.md の 8.）にそろえた：消費アイテムは宝箱と合わせて3つ、スナップは宝箱とぬしで1〜3枚。星の砂（reward）は元のまま（星図は仲間ごとに開けるので、パーティ全体で目安どおりだった）
/** 1-1 の砂嵐の HP の倍率（段階65。オートなしで、ふつうの戦闘が3〜4ラウンド・1〜3分になるように）。1晩目は、まだ仲間が育っていないので軽く */
export const A11_STORM_HP = { night1: 1.4, later: 1.8 };
const tough = (list: EnemyDef[], rate = A11_STORM_HP.later) => list.map((e) => toughenEnemy(e, rate));

export const AREA_BATTLES: Record<string, CampaignBattle> = {
  a11_storm1: { id: 'a11_storm1', name: '砂嵐', enemies: [GOLDFISH_NOISE, GOLDFISH_NOISE], reward: 4, koma: 1 },
  a11_storm2: { id: 'a11_storm2', name: '砂嵐', enemies: [GOLDFISH_NOISE, BALLOON_NOISE], reward: 5, item: ITEMS.ether.id, koma: 2 },
  a11_storm3: { id: 'a11_storm3', name: '砂嵐', enemies: [BALLOON_NOISE, MASK_NOISE, GOLDFISH_NOISE], reward: 6, koma: 2 },
  // 社への道の砂嵐は少し強い（HP・攻撃・魔力 ×1.2。ボスの手前の山）
  a11_storm4: { id: 'a11_storm4', name: '砂嵐', enemies: [MASK_NOISE, COTTON_NOISE, BALLOON_NOISE].map((e) => scaleEnemy(e, 1.2)), reward: 6, item: ITEMS.hiPotion.id, koma: 2 },
  // 右の奥の脇道の逃げる敵（段階59。コマなし。勝つとレアの素材。星の砂は少なめ）
  a11_runner: { id: 'a11_runner', name: '砂嵐', enemies: [GOLDFISH_NOISE, GOLDFISH_NOISE], reward: 3, item: ITEMS.natsuTail.id },
  // 1-1 を3晩に分けた区画の戦闘（段階63。本番の量）。コマを持つのは8つ（晩ごとに 3・3・2）。ほかは素材と星の砂だけ。
  // 晩が進むほど、組み合わせを強くする（3晩目は ×1.1〜1.2）
  a11_n1_gate: { id: 'a11_n1_gate', name: '砂嵐', enemies: tough([GOLDFISH_NOISE, GOLDFISH_NOISE], A11_STORM_HP.night1), reward: 3, koma: 1 },
  a11_n1_chaser: { id: 'a11_n1_chaser', name: '砂嵐', enemies: tough([BALLOON_NOISE, GOLDFISH_NOISE, GOLDFISH_NOISE], A11_STORM_HP.night1), reward: 2 },
  a11_n1_back: { id: 'a11_n1_back', name: '砂嵐', enemies: tough([BALLOON_NOISE, GOLDFISH_NOISE], A11_STORM_HP.night1), reward: 2 },
  a11_n1_road: { id: 'a11_n1_road', name: '砂嵐', enemies: tough([GOLDFISH_NOISE, BALLOON_NOISE, GOLDFISH_NOISE], A11_STORM_HP.night1), reward: 3, koma: 1 },
  a11_n1_plaza: { id: 'a11_n1_plaza', name: '砂嵐', enemies: tough([BALLOON_NOISE, MASK_NOISE, GOLDFISH_NOISE], A11_STORM_HP.night1), reward: 4, koma: 1 },
  a11_n2_corridor: { id: 'a11_n2_corridor', name: '砂嵐', enemies: tough([MASK_NOISE, COTTON_NOISE, GOLDFISH_NOISE]), reward: 3, koma: 1 },
  a11_n2_west1: { id: 'a11_n2_west1', name: '砂嵐', enemies: tough([COTTON_NOISE, BALLOON_NOISE, GOLDFISH_NOISE]), reward: 2 },
  a11_n2_west2: { id: 'a11_n2_west2', name: '砂嵐', enemies: tough([MASK_NOISE, COTTON_NOISE, BALLOON_NOISE]), reward: 4, item: ITEMS.hiPotion.id, koma: 1 },
  a11_n2_east1: { id: 'a11_n2_east1', name: '砂嵐', enemies: tough([GOLDFISH_NOISE, GOLDFISH_NOISE, BALLOON_NOISE]), reward: 2 },
  a11_n2_east2: { id: 'a11_n2_east2', name: '砂嵐', enemies: tough([COTTON_NOISE, MASK_NOISE].map((e) => scaleEnemy(e, 1.1))), reward: 2 },
  // 金魚すくいの屋台の前の番人（2晩目の山場）
  a11_n2_guard: { id: 'a11_n2_guard', name: '砂嵐', enemies: tough([MASK_NOISE, COTTON_NOISE, BALLOON_NOISE].map((e) => scaleEnemy(e, 1.2))), reward: 5, koma: 1 },
  a11_n3_steps: { id: 'a11_n3_steps', name: '砂嵐', enemies: tough([COTTON_NOISE, MASK_NOISE, GOLDFISH_NOISE].map((e) => scaleEnemy(e, 1.1))), reward: 2 },
  a11_n3_right: { id: 'a11_n3_right', name: '砂嵐', enemies: tough([BALLOON_NOISE, BALLOON_NOISE, MASK_NOISE].map((e) => scaleEnemy(e, 1.1))), reward: 2 },
  a11_n3_woods1: { id: 'a11_n3_woods1', name: '砂嵐', enemies: tough([MASK_NOISE, COTTON_NOISE, GOLDFISH_NOISE].map((e) => scaleEnemy(e, 1.2))), reward: 2 },
  a11_n3_woods2: { id: 'a11_n3_woods2', name: '砂嵐', enemies: tough([MASK_NOISE, COTTON_NOISE, BALLOON_NOISE].map((e) => scaleEnemy(e, 1.2))), reward: 4, koma: 1 },
  // ボスは最後のコマを抱えこんでいる（段階63から1つ。1-1 は合わせて8つで、返すのに8つ）
  // 段階63で、17戦を通ってから挑むようになったので強めた。段階65：攻撃は元のまま、HP を1.5倍（じっくり戦う山場。でたらめな方針で1回目に勝てるのが3〜4割の目安）
  a11_boss: { id: 'a11_boss', name: '金魚鉢のぬし', enemies: [toughenEnemy(GOLDFISH_BOWL_LORD, 1.5)], reward: 8, boss: true, koma: 1, snaps: ['heavyBlow'] },
  // 1-2 の商店街（段階37）。並びは出会う順（入口 → 駄菓子屋の手前 → 駄菓子屋と時計屋の間 → 時計屋の先 → 坂の手前）。
  // 砂嵐は5戦でコマ9つ、ボスが2つ（合わせて11、返すのに10。1つ余る）。坂の手前の2戦は少し強い（ボスの手前の山）
  a12_storm1: { id: 'a12_storm1', name: '砂嵐', enemies: [TIN_NOISE, PHONE_NOISE], reward: 5, koma: 1 },
  a12_storm2: { id: 'a12_storm2', name: '砂嵐', enemies: [RAMUNE_NOISE, MENKO_NOISE], reward: 5, item: ITEMS.ether.id, koma: 2 },
  a12_storm3: { id: 'a12_storm3', name: '砂嵐', enemies: [PHONE_NOISE, RAMUNE_NOISE, MENKO_NOISE], reward: 6, koma: 2 },
  a12_storm4: { id: 'a12_storm4', name: '砂嵐', enemies: [TIN_NOISE, MENKO_NOISE, RAMUNE_NOISE].map((e) => scaleEnemy(e, 1.2)), reward: 7, koma: 2 },
  a12_storm5: { id: 'a12_storm5', name: '砂嵐', enemies: [PHONE_NOISE, TIN_NOISE, RAMUNE_NOISE].map((e) => scaleEnemy(e, 1.25)), reward: 7, koma: 2 },
  // 1-2 を3晩に分けた区画の戦闘（段階66。1-1 と同じく本番の量。HP は 1晩目 1.4倍、ほかは 1.8倍）。コマを持つのは9つ（3・3・3）＋ぬし
  a12_n1_gate: { id: 'a12_n1_gate', name: '砂嵐', enemies: tough([TIN_NOISE, PHONE_NOISE], A11_STORM_HP.night1), reward: 3, koma: 1 },
  a12_n1_entry: { id: 'a12_n1_entry', name: '砂嵐', enemies: tough([TIN_NOISE, RAMUNE_NOISE], A11_STORM_HP.night1), reward: 2 },
  a12_n1_lower: { id: 'a12_n1_lower', name: '砂嵐', enemies: tough([RAMUNE_NOISE, MENKO_NOISE, TIN_NOISE], A11_STORM_HP.night1), reward: 3, item: ITEMS.ether.id, koma: 1 },
  a12_n1_tobacco: { id: 'a12_n1_tobacco', name: '砂嵐', enemies: tough([PHONE_NOISE, MENKO_NOISE], A11_STORM_HP.night1), reward: 2 },
  a12_n1_mid: { id: 'a12_n1_mid', name: '砂嵐', enemies: tough([PHONE_NOISE, RAMUNE_NOISE, MENKO_NOISE], A11_STORM_HP.night1), reward: 4, koma: 1 },
  a12_n2_upper: { id: 'a12_n2_upper', name: '砂嵐', enemies: tough([TIN_NOISE, MENKO_NOISE, RAMUNE_NOISE]), reward: 3, koma: 1 },
  a12_n2_alley1: { id: 'a12_n2_alley1', name: '砂嵐', enemies: tough([RAMUNE_NOISE, RAMUNE_NOISE, TIN_NOISE]), reward: 2 },
  a12_n2_alley2: { id: 'a12_n2_alley2', name: '砂嵐', enemies: tough([MENKO_NOISE, PHONE_NOISE, TIN_NOISE]), reward: 4, koma: 1 },
  a12_n2_lane1: { id: 'a12_n2_lane1', name: '砂嵐', enemies: tough([PHONE_NOISE, PHONE_NOISE, RAMUNE_NOISE]), reward: 2 },
  a12_n2_lane2: { id: 'a12_n2_lane2', name: '砂嵐', enemies: tough([MENKO_NOISE, TIN_NOISE].map((e) => scaleEnemy(e, 1.1))), reward: 2 },
  // 電器屋の前の番人（2晩目の山場）
  a12_n2_guard: { id: 'a12_n2_guard', name: '砂嵐', enemies: tough([PHONE_NOISE, TIN_NOISE, RAMUNE_NOISE].map((e) => scaleEnemy(e, 1.2))), reward: 5, koma: 1 },
  a12_n3_slope: { id: 'a12_n3_slope', name: '砂嵐', enemies: tough([TIN_NOISE, MENKO_NOISE, RAMUNE_NOISE].map((e) => scaleEnemy(e, 1.2))), reward: 3, koma: 1 },
  a12_n3_slope2: { id: 'a12_n3_slope2', name: '砂嵐', enemies: tough([PHONE_NOISE, TIN_NOISE, RAMUNE_NOISE].map((e) => scaleEnemy(e, 1.25))), reward: 3, koma: 1 },
  a12_n3_hill1: { id: 'a12_n3_hill1', name: '砂嵐', enemies: tough([MENKO_NOISE, RAMUNE_NOISE, PHONE_NOISE].map((e) => scaleEnemy(e, 1.2))), reward: 2 },
  a12_n3_hill2: { id: 'a12_n3_hill2', name: '砂嵐', enemies: tough([TIN_NOISE, PHONE_NOISE, MENKO_NOISE].map((e) => scaleEnemy(e, 1.25))), reward: 4, koma: 1 },
  // 時計屋の手前の広い歩道の逃げる敵（段階59。コマなし。勝つとレアの素材。星の砂は少なめ）
  a12_runner: { id: 'a12_runner', name: '砂嵐', enemies: [RAMUNE_NOISE, RAMUNE_NOISE], reward: 3, item: ITEMS.sunsetMarble.id },
  // 段階63で 1-1 が17戦になり、1-2 に入る時の仲間が強くなったので強めた。段階66：攻撃は元のまま、HP 1.3倍（1.5倍では、ねらう方針で11ラウンドかかって長すぎた）。コマは1つ
  a12_boss: { id: 'a12_boss', name: '自転車のぬし', enemies: [toughenEnemy(BICYCLE_LORD, 1.3)], reward: 10, boss: true, koma: 1, snaps: ['breakArm'] },
  // 2-1 の町工場（段階39）。段階78で、3晩に分けて入る区画に作り直した（脚本 docs/script/2-1_rework.md）。並びは出会う順。
  // 1晩目は路地の入口から銭湯の前と銭湯の裏、2晩目は雪の資材置き場と左右の道から工場の門（番人）、3晩目は工場の門の先と工場の中。
  // コマは晩ごとに 3・3・3＋ぬし（返すのに10）。1-1・1-2 と同じく、攻撃の強さは変えずに HP を上げる（1晩目は 1.4倍、ほかは 1.8倍。段階65）。
  // 星の砂は1戦あたりを減らし、区画の合計は前（8戦）と同じくらい。ギアは落とさない（宝箱と出来事のごほうび。段階38）
  a21_n1_gate: { id: 'a21_n1_gate', name: '砂嵐', enemies: tough([GEAR_NOISE, SCREW_NOISE], A11_STORM_HP.night1), reward: 3, koma: 1 },
  a21_n1_lower: { id: 'a21_n1_lower', name: '砂嵐', enemies: tough([SCREW_NOISE, GEAR_NOISE], A11_STORM_HP.night1), reward: 2 },
  a21_n1_road: { id: 'a21_n1_road', name: '砂嵐', enemies: tough([TUBE_NOISE, SCREW_NOISE, GEAR_NOISE], A11_STORM_HP.night1), reward: 3, koma: 1 },
  a21_n1_plaza: { id: 'a21_n1_plaza', name: '砂嵐', enemies: tough([GEAR_NOISE, TUBE_NOISE, SCREW_NOISE], A11_STORM_HP.night1), reward: 4, koma: 1 },
  a21_n1_bath1: { id: 'a21_n1_bath1', name: '砂嵐', enemies: tough([TUBE_NOISE, GEAR_NOISE], A11_STORM_HP.night1), reward: 2 },
  a21_n2_yard1: { id: 'a21_n2_yard1', name: '砂嵐', enemies: tough([ABACUS_NOISE, TUBE_NOISE, SCREW_NOISE]), reward: 3, koma: 1 },
  a21_n2_yard2: { id: 'a21_n2_yard2', name: '砂嵐', enemies: tough([GEAR_NOISE, GEAR_NOISE, TUBE_NOISE]), reward: 2 },
  a21_n2_left: { id: 'a21_n2_left', name: '砂嵐', enemies: tough([GEAR_NOISE, ABACUS_NOISE, TUBE_NOISE]), reward: 4, item: ITEMS.hiPotion.id, koma: 1 },
  a21_n2_right: { id: 'a21_n2_right', name: '砂嵐', enemies: tough([SCREW_NOISE, SCREW_NOISE, ABACUS_NOISE]), reward: 2 },
  // 工場の門の番人（2晩目の山場。戦う前の会話）。そろばんノイズの守りの固い番人
  a21_n2_guard: { id: 'a21_n2_guard', name: '砂嵐', enemies: tough([ABACUS_NOISE, SCREW_NOISE, GEAR_NOISE].map((e) => scaleEnemy(e, 1.2))), reward: 5, koma: 1 },
  a21_n3_top: { id: 'a21_n3_top', name: '砂嵐', enemies: tough([TUBE_NOISE, ABACUS_NOISE, GEAR_NOISE].map((e) => scaleEnemy(e, 1.2))), reward: 3, koma: 1 },
  a21_n3_corner: { id: 'a21_n3_corner', name: '砂嵐', enemies: tough([SCREW_NOISE, GEAR_NOISE, TUBE_NOISE].map((e) => scaleEnemy(e, 1.2))), reward: 3, koma: 1 },
  a21_n3_steps: { id: 'a21_n3_steps', name: '砂嵐', enemies: tough([ABACUS_NOISE, GEAR_NOISE, SCREW_NOISE].map((e) => scaleEnemy(e, 1.25))), reward: 4, koma: 1 },
  a21_n3_inner: { id: 'a21_n3_inner', name: '砂嵐', enemies: tough([GEAR_NOISE, TUBE_NOISE, ABACUS_NOISE].map((e) => scaleEnemy(e, 1.25))), reward: 2 },
  // 2-1 の寄り道の部屋（地図の絵の手直しと一緒に。2026-10-17）：コマなし。資材置き場の逃げる敵はレアの素材「万博のきっぷ」、銭湯の裏の追ってくる敵は真鍮のボルト（消費アイテムは区画で2〜3つのままにする。economy.md の 3.）
  a21_runner: { id: 'a21_runner', name: '砂嵐', enemies: [GEAR_NOISE, TUBE_NOISE, GEAR_NOISE], reward: 3, item: ITEMS.expoTicket.id },
  a21_alley: { id: 'a21_alley', name: '砂嵐', enemies: tough([SCREW_NOISE, ABACUS_NOISE, SCREW_NOISE], A11_STORM_HP.night1), reward: 3, item: ITEMS.brassBolt.id },
  // 1-2 のぬしと同じく、攻撃は元のまま HP 1.3倍。コマは1つ
  a21_boss: { id: 'a21_boss', name: '旋盤のぬし', enemies: [toughenEnemy(LATHE_LORD, 1.3)], reward: 10, boss: true, koma: 1, snaps: ['heavyBlow'] },
  // 2-2 の文化祭の高校（段階39b。部屋をつなぐ形）。段階82で、3晩に分けて入る区画に作り直した（脚本 docs/script/2-2_rework.md）。並びは出会う順。
  // 1晩目は校門・中庭・駐輪場、2晩目は渡り廊下・お化け屋敷の教室と番人、3晩目は渡り廊下の上と体育館。コマは晩ごとに 3・3・3＋ぬし（返すのに10）。
  // 2-1 と同じく、攻撃の強さは変えずに HP を上げる（1晩目は 1.4倍、ほかは 1.8倍。段階65）。星の砂は1戦あたりを減らし、区画の合計は前と同じくらい
  a22_n1_gate: { id: 'a22_n1_gate', name: '砂嵐', enemies: tough([FLIP_PHONE_NOISE, STICKER_NOISE], A11_STORM_HP.night1), reward: 3, koma: 1 },
  a22_n1_gate2: { id: 'a22_n1_gate2', name: '砂嵐', enemies: tough([STICKER_NOISE, BOOMBOX_NOISE], A11_STORM_HP.night1), reward: 2 },
  a22_n1_stalls: { id: 'a22_n1_stalls', name: '砂嵐', enemies: tough([BOOMBOX_NOISE, FLIP_PHONE_NOISE, STICKER_NOISE], A11_STORM_HP.night1), reward: 3, koma: 1 },
  a22_n1_west: { id: 'a22_n1_west', name: '砂嵐', enemies: tough([FLIP_PHONE_NOISE, FLIP_PHONE_NOISE], A11_STORM_HP.night1), reward: 2 },
  a22_n1_upper: { id: 'a22_n1_upper', name: '砂嵐', enemies: tough([METRONOME_NOISE, STICKER_NOISE, BOOMBOX_NOISE], A11_STORM_HP.night1), reward: 3, koma: 1 },
  a22_n1_bikes: { id: 'a22_n1_bikes', name: '砂嵐', enemies: tough([STICKER_NOISE, METRONOME_NOISE], A11_STORM_HP.night1), reward: 2 },
  a22_n2_hall: { id: 'a22_n2_hall', name: '砂嵐', enemies: tough([FLIP_PHONE_NOISE, METRONOME_NOISE, BOOMBOX_NOISE]), reward: 3, koma: 1 },
  a22_n2_east: { id: 'a22_n2_east', name: '砂嵐', enemies: tough([STICKER_NOISE, STICKER_NOISE, FLIP_PHONE_NOISE]), reward: 2 },
  a22_n2_haunted: { id: 'a22_n2_haunted', name: '砂嵐', enemies: tough([METRONOME_NOISE, BOOMBOX_NOISE, STICKER_NOISE]), reward: 4, koma: 1 },
  a22_n2_room: { id: 'a22_n2_room', name: '砂嵐', enemies: tough([BOOMBOX_NOISE, BOOMBOX_NOISE, METRONOME_NOISE]), reward: 2 },
  // 渡り廊下の上の番人（2晩目の山場。戦う前の会話）。メトロノームのように同じ速さで鳴り続ける
  a22_n2_guard: { id: 'a22_n2_guard', name: '砂嵐', enemies: tough([METRONOME_NOISE, BOOMBOX_NOISE, FLIP_PHONE_NOISE].map((e) => scaleEnemy(e, 1.2))), reward: 5, koma: 1 },
  a22_n3_hall: { id: 'a22_n3_hall', name: '砂嵐', enemies: tough([FLIP_PHONE_NOISE, STICKER_NOISE, METRONOME_NOISE].map((e) => scaleEnemy(e, 1.2))), reward: 3, koma: 1 },
  a22_n3_floor1: { id: 'a22_n3_floor1', name: '砂嵐', enemies: tough([BOOMBOX_NOISE, METRONOME_NOISE, STICKER_NOISE].map((e) => scaleEnemy(e, 1.2))), reward: 4, koma: 1 },
  a22_n3_floor2: { id: 'a22_n3_floor2', name: '砂嵐', enemies: tough([METRONOME_NOISE, FLIP_PHONE_NOISE, BOOMBOX_NOISE].map((e) => scaleEnemy(e, 1.25))), reward: 4, koma: 1 },
  a22_n3_front: { id: 'a22_n3_front', name: '砂嵐', enemies: tough([STICKER_NOISE, BOOMBOX_NOISE, METRONOME_NOISE].map((e) => scaleEnemy(e, 1.25))), reward: 2 },
  // 駐輪場の逃げる敵はコマを持たない寄り道で、勝つとレアの素材「ラストチャイムのデモテープ」
  a22_runner: { id: 'a22_runner', name: '砂嵐', enemies: [STICKER_NOISE, STICKER_NOISE, STICKER_NOISE], reward: 3, item: ITEMS.demoTape.id },
  // 2-1 のぬしと同じく、攻撃は元のまま HP 1.3倍。コマは1つ
  a22_boss: { id: 'a22_boss', name: 'アンプのぬし', enemies: [toughenEnemy(AMP_LORD, 1.3)], reward: 10, boss: true, koma: 1, snaps: ['encore'] },
  // 2-3 の河川敷のグラウンド（段階40。部屋をつなぐ形）。段階85 で3晩に分けた（脚本 docs/script/2-3_rework.md）。2-2 と同じく、晩ごとに 3・3・3＋ぬし（返すのに10）。
  // 1晩目は土手の道・ベンチの裏の木陰・川べり、2晩目は売店のテント・用具小屋の裏と番人、3晩目はダイヤモンド。川べりの逃げる敵はコマなしで、勝つとレアの素材「最後のスコアブック」。
  // 2-3 の砂嵐は元が軽い（2-2 と同じ倍率では1〜3ラウンドで終わった）ので、晩ごとに ×1.15・×1.3・×1.45〜1.5 を重ねた
  a23_n1_slope: { id: 'a23_n1_slope', name: '砂嵐', enemies: tough([BALL_NOISE, PET_NOISE].map((e) => scaleEnemy(e, 1.15))), reward: 2, koma: 1 },
  a23_n1_levee: { id: 'a23_n1_levee', name: '砂嵐', enemies: tough([PET_NOISE, PET_NOISE].map((e) => scaleEnemy(e, 1.15))), reward: 2 },
  a23_n1_bench: { id: 'a23_n1_bench', name: '砂嵐', enemies: tough([MEGAPHONE_NOISE, BALL_NOISE, JUG_NOISE].map((e) => scaleEnemy(e, 1.15))), reward: 3, koma: 1 },
  a23_n1_shade: { id: 'a23_n1_shade', name: '砂嵐', enemies: tough([JUG_NOISE, PET_NOISE, MEGAPHONE_NOISE].map((e) => scaleEnemy(e, 1.15))), reward: 3, koma: 1 },
  a23_n1_bank: { id: 'a23_n1_bank', name: '砂嵐', enemies: tough([BALL_NOISE, BALL_NOISE].map((e) => scaleEnemy(e, 1.15))), reward: 2 },
  a23_runner: { id: 'a23_runner', name: '砂嵐', enemies: [PET_NOISE, PET_NOISE, PET_NOISE], reward: 3, item: ITEMS.scorebook.id },
  a23_n2_stand: { id: 'a23_n2_stand', name: '砂嵐', enemies: tough([BALL_NOISE, MEGAPHONE_NOISE, PET_NOISE].map((e) => scaleEnemy(e, 1.3))), reward: 3, koma: 1 },
  a23_n2_west: { id: 'a23_n2_west', name: '砂嵐', enemies: tough([JUG_NOISE, JUG_NOISE, BALL_NOISE].map((e) => scaleEnemy(e, 1.3))), reward: 2 },
  a23_n2_shed: { id: 'a23_n2_shed', name: '砂嵐', enemies: tough([MEGAPHONE_NOISE, PET_NOISE, JUG_NOISE].map((e) => scaleEnemy(e, 1.3))), reward: 4, koma: 1 },
  a23_n2_shed2: { id: 'a23_n2_shed2', name: '砂嵐', enemies: tough([PET_NOISE, BALL_NOISE, PET_NOISE].map((e) => scaleEnemy(e, 1.3))), reward: 2 },
  // 売店の上の番人（2晩目の山場。戦う前の会話）。「あと一人」をくり返す
  a23_n2_guard: { id: 'a23_n2_guard', name: '砂嵐', enemies: tough([JUG_NOISE, BALL_NOISE, MEGAPHONE_NOISE].map((e) => scaleEnemy(e, 1.45))), reward: 5, koma: 1 },
  a23_n3_stand: { id: 'a23_n3_stand', name: '砂嵐', enemies: tough([BALL_NOISE, PET_NOISE, MEGAPHONE_NOISE].map((e) => scaleEnemy(e, 1.45))), reward: 3, koma: 1 },
  a23_n3_field1: { id: 'a23_n3_field1', name: '砂嵐', enemies: tough([MEGAPHONE_NOISE, JUG_NOISE, BALL_NOISE].map((e) => scaleEnemy(e, 1.45))), reward: 4, koma: 1 },
  a23_n3_field2: { id: 'a23_n3_field2', name: '砂嵐', enemies: tough([PET_NOISE, MEGAPHONE_NOISE, JUG_NOISE].map((e) => scaleEnemy(e, 1.5))), reward: 4, koma: 1 },
  a23_n3_front: { id: 'a23_n3_front', name: '砂嵐', enemies: tough([JUG_NOISE, BALL_NOISE, PET_NOISE].map((e) => scaleEnemy(e, 1.5))), reward: 2 },
  // 攻撃は元のまま HP 1.7倍（2-1・2-2 は 1.3倍。元の HP が低く、1.3倍では2-2 のぬしの7割ほどのラウンドで終わった。2章の山場なので2-2 と同じくらいに）。コマは1つ
  a23_boss: { id: 'a23_boss', name: 'スコアボードのぬし', enemies: [toughenEnemy(SCOREBOARD_LORD, 1.7)], reward: 10, boss: true, koma: 1, snaps: ['pinchHitter'] },
  // 返す直前のカイ（段階40。負け戦）。4ラウンド目の終わりか、カイの HP が半分を切った所で打ち切る。報酬はない（物語の流れの battle の出来事から始める）
  a23_kai: { id: 'a23_kai', name: 'カイ', enemies: [KAI], reward: 0, boss: true, cutoff: { rounds: 4, enemyHpRatio: 0.5 } },
  // 2-3 の4晩目：保管局の奥の書庫（段階85）。しまわれた色々な時代の蔵書から漏れた砂嵐（1章〜2-2 の砂嵐を混ぜる）。コマはない（取り返すのが目当て）
  a23x_corridor: { id: 'a23x_corridor', name: '砂嵐', enemies: tough([GOLDFISH_NOISE, MASK_NOISE, BALLOON_NOISE].map((e) => scaleEnemy(e, 1.3))), reward: 3 },
  a23x_alcove: { id: 'a23x_alcove', name: '砂嵐', enemies: tough([TIN_NOISE, MENKO_NOISE, RAMUNE_NOISE].map((e) => scaleEnemy(e, 1.3))), reward: 3 },
  a23x_reading1: { id: 'a23x_reading1', name: '砂嵐', enemies: tough([GEAR_NOISE, SCREW_NOISE, TUBE_NOISE].map((e) => scaleEnemy(e, 1.2))), reward: 4 },
  a23x_reading2: { id: 'a23x_reading2', name: '砂嵐', enemies: tough([FLIP_PHONE_NOISE, STICKER_NOISE, METRONOME_NOISE].map((e) => scaleEnemy(e, 1.2))), reward: 4 },
  a23x_vault: { id: 'a23x_vault', name: '砂嵐', enemies: tough([GOLDFISH_NOISE, GEAR_NOISE, BOOMBOX_NOISE].map((e) => scaleEnemy(e, 1.25))), reward: 4, item: ITEMS.hiPotion.id },
  a23x_stacks1: { id: 'a23x_stacks1', name: '砂嵐', enemies: tough([RAMUNE_NOISE, ABACUS_NOISE, STICKER_NOISE].map((e) => scaleEnemy(e, 1.25))), reward: 4 },
  a23x_stacks2: { id: 'a23x_stacks2', name: '砂嵐', enemies: tough([MASK_NOISE, TUBE_NOISE, METRONOME_NOISE].map((e) => scaleEnemy(e, 1.25))), reward: 4 },
  // 書庫を見回るカイ（段階85）：見つかると短い負け戦。打ち切ったら、チェックポイントへ戻される（cutoffBack）。報酬はない
  a23x_kai_patrol: { id: 'a23x_kai_patrol', name: 'カイ', enemies: [KAI], reward: 0, boss: true, cutoff: { rounds: 2, enemyHpRatio: 0.5 }, cutoffBack: true },
  // 棚の砂時計を手に取った後のカイ（段階85）：決まったラウンドを耐えると、逃げきる（区画の奥の印の戦闘。打ち切りで区画を終える）
  a23x_kai: { id: 'a23x_kai', name: 'カイ', enemies: [KAI], reward: 0, boss: true, cutoff: { rounds: 3, enemyHpRatio: 0.5 } },
};

/**
 * 戦いごとの曲（段階75）。書かなければ、ボスはボス戦の曲、ほかはふだんの戦闘の曲。
 * カイとの戦いは、負け戦も再戦も、どれもカイの戦闘曲（テーマ曲として一貫させる。段階86。開発者の考え）
 */
export const BATTLE_BGM: Partial<Record<string, string>> = {
  a23_kai: BGM.kai,
  a23x_kai_patrol: BGM.kai,
  a23x_kai: BGM.kai,
};





export const AREAS: Record<string, AreaDef> = {
  // 1-1「金魚の名前」：平成の終わりの縁日。段階63で、3晩に分けて入る区画に作り直した（脚本 docs/script/1-1_rework.md）。
  // 1晩目「しぶしぶの兄」：参道の入口・屋台の裏・縁日の広場。2晩目「迷子」：広場の上の通りと、左右の屋台の裏通り・射的と金魚すくいの通り。
  // 3晩目「ふたりで、なつまつり」：石段と社の前、社の裏の林。晩ごとのコマは 3・3・2（返すのに8つ。余りはない）
  a11: {
    id: 'a11',
    name: '1-1「金魚の名前」',
    rooms: [ROOMS.fest_gate, ROOMS.fest_backyard, ROOMS.festival_night, ROOMS.fest_west, ROOMS.fest_east, ROOMS.fest_woods],
    links: [
      { a: { room: 'fest_gate', side: 'top' }, b: { room: 'festival_night', side: 'bottom' } },
      { a: { room: 'fest_gate', side: 'left' }, b: { room: 'fest_backyard', side: 'right' } },
      { a: { room: 'festival_night', side: 'left' }, b: { room: 'fest_west', side: 'right' } },
      { a: { room: 'festival_night', side: 'right' }, b: { room: 'fest_east', side: 'left' } },
      { a: { room: 'festival_night', side: 'top' }, b: { room: 'fest_woods', side: 'bottom' } },
    ],
    bgm: BGM.festival,
    // 返すのに要るコマ（段階28。AREA_BATTLES の koma の合計も8）
    komaNeed: 8,
    timeTitle: '金魚の名前',
    owner: 'ユウマ',
    // 返す画面で、すり切れた映像として流す景色（段階46d）
    memory: 'shrine_approach',
    // 晩の区切り（段階63）：2晩目は広場のチェックポイントから、3晩目は石段の下のチェックポイントから
    nights: [{ koma: 3 }, { koma: 6, start: { room: 'festival_night', cell: [11, 30] } }, { start: { room: 'festival_night', cell: [11, 17] } }],
    // ノイズの壁（段階63）：広場の上（2晩目から開く）と、石段の下（3晩目から開く）
    walls: [
      { id: 'a11_wall_plaza', room: 'festival_night', cells: box(8, 15, 23, 24), opens: 2 },
      { id: 'a11_wall_steps', room: 'festival_night', cells: box(10, 13, 18, 18), opens: 3 },
    ],
    // 狩り（段階43）：採取の場所は、1回目の宝箱と浴衣の女の人の所。砂嵐は入るたびに縁日の戦闘から選ぶ
    hunt: {
      gathers: [
        { id: 'a11_gather_goldfish', room: 'festival_night', cell: [9, 29], items: [ITEMS.goldfishScale.id, ITEMS.goldfishScale.id] },
        { id: 'a11_gather_ramune', room: 'festival_night', cell: [14, 29], items: [ITEMS.balloonShard.id, ITEMS.cottonThread.id] },
        { id: 'a11_gather_yukata', room: 'festival_night', cell: [12, 22], items: [ITEMS.maskShard.id] },
        { id: 'a11_gather_back', room: 'fest_backyard', cell: [2, 2], items: [ITEMS.cottonThread.id, ITEMS.goldfishFin.id] },
      ],
      tables: {
        fest_gate: ['a11_n1_gate', 'a11_n1_chaser'],
        festival_night: ['a11_n1_road', 'a11_n1_plaza', 'a11_n2_corridor', 'a11_n3_steps'],
        fest_west: ['a11_n2_west1', 'a11_n2_west2'],
        fest_east: ['a11_n2_east1', 'a11_n2_east2'],
        fest_woods: ['a11_n3_woods1', 'a11_n3_woods2'],
      },
    },
    chests: [
      { id: 'a11_chest_goldfish', room: 'festival_night', cell: [9, 29], items: [ITEMS.goldfishScale.id, ITEMS.goldfishScale.id, ITEMS.potion.id] },
      { id: 'a11_chest_ramune', room: 'festival_night', cell: [14, 29], items: [ITEMS.balloonShard.id, ITEMS.maskShard.id] },
      { id: 'a11_chest_back', room: 'fest_backyard', cell: [2, 2], items: [ITEMS.cottonThread.id, ITEMS.goldfishFin.id] },
      { id: 'a11_chest_west', room: 'fest_west', cell: [2, 2], night: 2, items: [ITEMS.goldfishScale.id, ITEMS.balloonShard.id, ITEMS.ether.id] },
      { id: 'a11_chest_woods', room: 'fest_woods', cell: [3, 2], night: 3, items: [ITEMS.goldfishFin.id, ITEMS.maskShard.id, ITEMS.cottonThread.id] },
    ],
    enemies: [
      // ---- 1晩目 ----
      { id: 'a11_e_gate', room: 'fest_gate', patrol: [[6, 7], [17, 7]], battle: 'a11_n1_gate' },
      { id: 'a11_e_gate_chase', room: 'fest_gate', move: 'chase', patrol: [[18, 11], [18, 16]], battle: 'a11_n1_chaser' },
      { id: 'a11_e_back', room: 'fest_backyard', patrol: [[3, 12], [20, 12]], battle: 'a11_n1_back' },
      // 屋台の裏の逃げる敵（寄り道。コマなし、レアの素材。段階59）
      { id: 'a11_e_runner', room: 'fest_backyard', move: 'flee', patrol: [[13, 17]], battle: 'a11_runner' },
      { id: 'a11_e_road', room: 'festival_night', patrol: [[10, 38], [13, 38]], battle: 'a11_n1_road' },
      { id: 'a11_e_plaza', room: 'festival_night', move: 'chase', patrol: [[7, 32], [16, 32]], battle: 'a11_n1_plaza' },
      // ---- 2晩目 ----
      { id: 'a11_e_corridor', room: 'festival_night', night: 2, patrol: [[8, 21], [15, 21]], battle: 'a11_n2_corridor' },
      { id: 'a11_e_west1', room: 'fest_west', night: 2, move: 'chase', patrol: [[7, 7], [16, 7]], battle: 'a11_n2_west1' },
      { id: 'a11_e_west2', room: 'fest_west', night: 2, patrol: [[3, 16], [20, 16]], battle: 'a11_n2_west2' },
      { id: 'a11_e_east1', room: 'fest_east', night: 2, patrol: [[4, 2], [16, 2]], battle: 'a11_n2_east1' },
      { id: 'a11_e_east2', room: 'fest_east', night: 2, move: 'chase', patrol: [[10, 15], [20, 15]], battle: 'a11_n2_east2' },
      // 金魚すくいの屋台の前の番人（2晩目の山場。戦う前の会話）
      { id: 'a11_e_guard', room: 'fest_east', night: 2, move: 'guard', patrol: [[18, 21]], battle: 'a11_n2_guard', scene: 'a11_guard' },
      // ---- 3晩目 ----
      { id: 'a11_e_steps', room: 'festival_night', night: 3, patrol: [[10, 13], [7, 16]], battle: 'a11_n3_steps' },
      { id: 'a11_e_right', room: 'festival_night', night: 3, move: 'chase', patrol: [[14, 16], [22, 16]], battle: 'a11_n3_right' },
      { id: 'a11_e_woods1', room: 'fest_woods', night: 3, move: 'chase', patrol: [[4, 8], [9, 8]], battle: 'a11_n3_woods1' },
      { id: 'a11_e_woods2', room: 'fest_woods', night: 3, patrol: [[12, 8], [20, 8]], battle: 'a11_n3_woods2' },
    ],
    // 社の前
    boss: { id: 'a11_boss', room: 'festival_night', cell: [12, 7], battle: 'a11_boss' },
    // 写しの人々。晩ごとに、戻ってきた過去の分だけ言葉が先へ進む（段階63）
    talkers: [
      { id: 'a11_voice_goldfish', room: 'festival_night', cell: [9, 27], until: 1, scene: 'a11_voice_goldfish', label: '金魚すくいのおじさん' },
      { id: 'a11_voice_cotton', room: 'festival_night', cell: [14, 27], until: 1, scene: 'a11_voice_cotton', label: 'わたあめ屋' },
      { id: 'a11_voice_yukata', room: 'festival_night', cell: [12, 34], until: 1, scene: 'a11_voice_yukata', label: '浴衣の女の人' },
      { id: 'a11_voice2_goldfish', room: 'fest_east', cell: [16, 20], night: 2, until: 2, scene: 'a11_voice2_goldfish', label: '金魚すくいのおじさん' },
      { id: 'a11_voice2_cotton', room: 'fest_west', cell: [4, 11], night: 2, until: 2, scene: 'a11_voice2_cotton', label: 'わたあめ屋' },
      { id: 'a11_voice2_yukata', room: 'festival_night', cell: [12, 22], night: 2, until: 2, scene: 'a11_voice2_yukata', label: '浴衣の女の人' },
      { id: 'a11_voice3_goldfish', room: 'festival_night', cell: [8, 9], night: 3, scene: 'a11_voice3_goldfish', label: '金魚すくいのおじさん' },
      { id: 'a11_voice3_cotton', room: 'festival_night', cell: [11, 11], night: 3, scene: 'a11_voice3_cotton', label: 'わたあめ屋' },
      { id: 'a11_voice3_yukata', room: 'festival_night', cell: [15, 9], night: 3, scene: 'a11_voice3_yukata', label: '浴衣の女の人' },
    ],
    // コマが戻るたびに、過去の場面が1つずつ進む（段階63）
    triggers: [
      { on: 'koma', count: 1, scene: 'a11_first_koma' },
      { on: 'checkpoint', scene: 'a11_checkpoint' },
      { on: 'koma', count: 2, scene: 'a11_koma2' },
      { on: 'koma', count: 3, scene: 'a11_koma3' },
      { on: 'room', room: 'fest_east', night: 2, scene: 'a11_riku_trace' },
      { on: 'koma', count: 4, scene: 'a11_koma4' },
      { on: 'koma', count: 5, scene: 'a11_koma5' },
      { on: 'koma', count: 6, scene: 'a11_koma6' },
      { on: 'koma', count: 7, scene: 'a11_koma7' },
      // あとコマが1つの時（台本の「あと{komaLeft}つ」に本当の数が入る。段階28）
      { on: 'komaLeft', left: 1, scene: 'a11_one_left' },
      { on: 'boss', scene: 'a11_boss' },
      { on: 'cleared', scene: 'a11_last_koma' },
    ],
  },
  // 1-2「夕暮れの二人乗り」：昭和の終わりの商店街（段階37）。段階66で、3晩に分けて入る区画に作り直した（脚本 docs/script/1-2_rework.md）。
  // 1晩目「出迎えの支度」：入口から時計屋の前。2晩目「帰り道」：時計屋の前から坂の手前、左右の路地。3晩目「振り返った顔」：坂の上と、その先。
  // 晩ごとのコマは 3・3・4（ぬしの1つを含めて10。返すのに10）
  a12: {
    id: 'a12',
    name: '1-2「夕暮れの二人乗り」',
    rooms: [ROOMS.showa_night, ROOMS.showa_alley, ROOMS.showa_lane, ROOMS.showa_hill],
    links: [
      { a: { room: 'showa_night', side: 'left' }, b: { room: 'showa_alley', side: 'right' } },
      { a: { room: 'showa_night', side: 'right' }, b: { room: 'showa_lane', side: 'left' } },
      { a: { room: 'showa_night', side: 'top' }, b: { room: 'showa_hill', side: 'bottom' } },
    ],
    // 記憶の中の曲（段階73。段階75 で曲が届いた）：昭和の商店街の記憶の曲（台本の showa と同じ）
    bgm: BGM.showa,
    komaNeed: 10,
    timeTitle: '夕暮れの二人乗り',
    owner: 'フミ',
    memory: 'showa_street',
    // 返した報酬のスナップ（段階41）
    returnSnaps: ['recover'],
    // 晩の区切り（段階66）：2晩目は時計屋の前から、3晩目は坂の手前から
    nights: [{ koma: 3 }, { koma: 6, start: { cell: [16, 23] } }, { start: { cell: [12, 13] } }],
    // ノイズの壁：時計屋の先（2晩目から開く）と、坂の上（3晩目から開く）
    walls: [
      { id: 'a12_wall_clock', cells: box(7, 16, 21, 22), opens: 2 },
      { id: 'a12_wall_slope', cells: box(10, 16, 12, 12), opens: 3 },
    ],
    // 狩り（段階43）：採取の場所は、1回目の宝箱と電器屋の子どもの所
    hunt: {
      gathers: [
        { id: 'a12_gather_clock', cell: [18, 30], items: [ITEMS.ramuneGlass.id, ITEMS.phoneCord.id] },
        { id: 'a12_gather_slope', cell: [16, 10], items: [ITEMS.tinSpring.id, ITEMS.menkoCard.id] },
        { id: 'a12_gather_tv', cell: [9, 15], items: [ITEMS.phoneCord.id] },
        { id: 'a12_gather_alley', room: 'showa_alley', cell: [2, 2], items: [ITEMS.ramuneGlass.id, ITEMS.tinSpring.id] },
      ],
      tables: {
        showa_night: ['a12_n1_gate', 'a12_n1_lower', 'a12_n1_mid', 'a12_n2_upper', 'a12_n3_slope'],
        showa_alley: ['a12_n2_alley1', 'a12_n2_alley2'],
        showa_lane: ['a12_n2_lane1', 'a12_n2_lane2'],
        showa_hill: ['a12_n3_hill1', 'a12_n3_hill2'],
      },
    },
    chests: [
      { id: 'a12_chest_clock', cell: [18, 30], items: [ITEMS.ramuneGlass.id, ITEMS.phoneCord.id, ITEMS.potion.id], snaps: ['heavyBlow'] },
      { id: 'a12_chest_alley', room: 'showa_alley', cell: [2, 2], night: 2, items: [ITEMS.tinSpring.id, ITEMS.menkoCard.id, ITEMS.hiPotion.id], snaps: ['iceChip'] },
      { id: 'a12_chest_hill', room: 'showa_hill', cell: [3, 2], night: 3, items: [ITEMS.ramuneGlass.id, ITEMS.phoneCord.id, ITEMS.menkoCard.id] },
    ],
    enemies: [
      // ---- 1晩目（入口から時計屋の前） ----
      { id: 'a12_e_gate', patrol: [[9, 36], [16, 36]], battle: 'a12_n1_gate' },
      { id: 'a12_e_entry', patrol: [[9, 40], [14, 40]], battle: 'a12_n1_entry' },
      { id: 'a12_e_lower', move: 'chase', patrol: [[15, 32], [8, 32]], battle: 'a12_n1_lower' },
      { id: 'a12_e_tobacco', move: 'chase', patrol: [[16, 33], [16, 37]], battle: 'a12_n1_tobacco' },
      { id: 'a12_e_middle', patrol: [[8, 26], [15, 26]], battle: 'a12_n1_mid' },
      // 時計屋の手前の広い歩道の逃げる敵（段階59）
      { id: 'a12_e_runner', move: 'flee', patrol: [[18, 31]], battle: 'a12_runner' },
      // ---- 2晩目（時計屋の前から坂の手前、左右の路地） ----
      { id: 'a12_e_upper', night: 2, patrol: [[10, 19], [14, 19]], battle: 'a12_n2_upper' },
      { id: 'a12_e_alley1', room: 'showa_alley', night: 2, move: 'chase', patrol: [[7, 7], [16, 7]], battle: 'a12_n2_alley1' },
      { id: 'a12_e_alley2', room: 'showa_alley', night: 2, patrol: [[3, 16], [20, 16]], battle: 'a12_n2_alley2' },
      { id: 'a12_e_lane1', room: 'showa_lane', night: 2, patrol: [[4, 2], [16, 2]], battle: 'a12_n2_lane1' },
      { id: 'a12_e_lane2', room: 'showa_lane', night: 2, move: 'chase', patrol: [[10, 15], [20, 15]], battle: 'a12_n2_lane2' },
      // 電器屋の前の番人（2晩目の山場。戦う前の会話）
      { id: 'a12_e_guard', night: 2, move: 'guard', patrol: [[12, 16]], battle: 'a12_n2_guard', scene: 'a12_guard' },
      // ---- 3晩目（坂の上と、その先） ----
      { id: 'a12_e_slope', night: 3, patrol: [[10, 10], [15, 10]], battle: 'a12_n3_slope' },
      { id: 'a12_e_slope2', night: 3, move: 'chase', patrol: [[11, 6], [14, 6]], battle: 'a12_n3_slope2' },
      { id: 'a12_e_hill1', room: 'showa_hill', night: 3, move: 'chase', patrol: [[4, 8], [9, 8]], battle: 'a12_n3_hill1' },
      { id: 'a12_e_hill2', room: 'showa_hill', night: 3, patrol: [[12, 8], [20, 8]], battle: 'a12_n3_hill2' },
    ],
    // 出口の坂の上
    boss: { id: 'a12_boss', cell: [12, 7], battle: 'a12_boss' },
    // 写しの人々。晩ごとに、戻ってきた過去の分だけ言葉が先へ進む（段階66）
    talkers: [
      { id: 'a12_voice_candy', cell: [7, 27], until: 1, scene: 'a12_voice_candy', label: '駄菓子屋のおばあちゃん' },
      { id: 'a12_voice_grocer', cell: [8, 38], until: 1, scene: 'a12_voice_grocer', label: '八百屋' },
      { id: 'a12_voice_tobacco', cell: [17, 28], until: 1, scene: 'a12_voice_tobacco', label: 'たばこ屋' },
      { id: 'a12_voice_tv', cell: [9, 15], night: 2, until: 2, scene: 'a12_voice_tv', label: '電器屋の子ども' },
      { id: 'a12_voice2_grocer', cell: [14, 20], night: 2, until: 2, scene: 'a12_voice2_grocer', label: '八百屋' },
      { id: 'a12_voice2_candy', room: 'showa_alley', cell: [4, 11], night: 2, until: 2, scene: 'a12_voice2_candy', label: '駄菓子屋のおばあちゃん' },
      { id: 'a12_voice2_tobacco', room: 'showa_lane', cell: [16, 20], night: 2, until: 2, scene: 'a12_voice2_tobacco', label: 'たばこ屋' },
      { id: 'a12_voice3_grocer', cell: [11, 9], night: 3, scene: 'a12_voice3_grocer', label: '八百屋' },
      { id: 'a12_voice3_candy', cell: [15, 11], night: 3, scene: 'a12_voice3_candy', label: '駄菓子屋のおばあちゃん' },
    ],
    triggers: [
      { on: 'koma', count: 1, scene: 'a12_first_koma' },
      { on: 'checkpoint', cell: [8, 29], scene: 'a12_checkpoint' },
      { on: 'checkpoint', cell: [16, 23], scene: 'a12_clockshop' },
      { on: 'koma', count: 2, scene: 'a12_koma2' },
      { on: 'koma', count: 3, scene: 'a12_koma3' },
      { on: 'koma', count: 4, scene: 'a12_koma4' },
      { on: 'koma', count: 5, scene: 'a12_koma5' },
      { on: 'koma', count: 6, scene: 'a12_koma6' },
      { on: 'koma', count: 7, scene: 'a12_koma7' },
      { on: 'komaLeft', left: 1, scene: 'a12_one_left' },
      { on: 'boss', scene: 'a12_boss' },
      { on: 'cleared', scene: 'a12_last_koma' },
    ],
  },
  // 2-1「親方の背中」：昭和44年の冬の町工場の路地（段階38。みおの初めての戦闘とムーブメントの開放。段階39で敵とボス、返す場面）。
  // 段階78で、3晩に分けて入る区画に作り直した（脚本 docs/script/2-1_rework.md）。1晩目「今日はお前がやれ」：路地の入口から銭湯の前と、銭湯の裏。
  // 2晩目「欠けた歯」：雪の資材置き場と、左右の道から工場の門。3晩目「いい仕事だ」：工場の中。晩ごとのコマは 3・3・3＋ぬし（返すのに10）
  a21: {
    id: 'a21',
    name: '2-1「親方の背中」',
    // 路地が1つ目の部屋。銭湯の前の広場の左に「雪の資材置き場」、右に「銭湯の裏の路地」（どちらも行き止まりの寄り道。docs/ART.md の 6-2）
    rooms: [ROOMS.factory_alley, ROOMS.factory_yard, ROOMS.bath_alley],
    links: [
      { a: { room: 'factory_alley', side: 'left' }, b: { room: 'factory_yard', side: 'right' } },
      { a: { room: 'factory_alley', side: 'right' }, b: { room: 'bath_alley', side: 'left' } },
    ],
    // 昭和44年の町工場の曲（段階75）
    bgm: BGM.factory,
    komaNeed: 10,
    timeTitle: '親方の背中',
    owner: 'イサム',
    memory: 'factory_alley',
    // 返した報酬のスナップ（段階41）
    returnSnaps: ['joker'],
    // 晩の区切り（段階78）：2晩目は銭湯の前の長いすから、3晩目は工場の門から
    nights: [{ koma: 3 }, { koma: 6, start: { cell: [9, 21] } }, { start: { cell: [15, 11] } }],
    // ノイズの壁：資材置き場への出入口と、銭湯の左右の道（2晩目から開く）。工場の中への入口（3晩目から開く）
    walls: [
      { id: 'a21_wall_yard', cells: [...box(0, 1, 19, 22), ...box(5, 6, 17, 18), ...box(19, 19, 17, 18)], opens: 2 },
      { id: 'a21_wall_factory', cells: box(10, 13, 8, 9), opens: 3 },
    ],
    // 狩り（段階43）：採取の場所は、1回目の宝箱とラジオの所
    hunt: {
      gathers: [
        { id: 'a21_gather_left', room: 'factory_yard', cell: [4, 3], items: [ITEMS.rustyScrew.id, ITEMS.tubeGlass.id] },
        { id: 'a21_gather_right', cell: [19, 12], items: [ITEMS.abacusBead.id, ITEMS.wornGear.id] },
        { id: 'a21_gather_radio', cell: [11, 27], items: [ITEMS.tubeGlass.id] },
        { id: 'a21_gather_bath', room: 'bath_alley', cell: [20, 20], items: [ITEMS.rustyScrew.id, ITEMS.filament.id] },
      ],
      tables: {
        factory_alley: ['a21_n1_gate', 'a21_n1_road', 'a21_n1_plaza', 'a21_n2_left', 'a21_n3_top'],
        factory_yard: ['a21_n2_yard1', 'a21_n2_yard2'],
        bath_alley: ['a21_n1_bath1', 'a21_alley'],
      },
    },
    // 資材置き場の左上の行き止まり、銭湯の右の道の奥、銭湯の裏の路地の行き止まり。ムーブメントのギアも入っている（段階38）
    chests: [
      { id: 'a21_chest_left', room: 'factory_yard', cell: [4, 3], night: 2, items: [ITEMS.rustyScrew.id, ITEMS.tubeGlass.id, ITEMS.potion.id], gears: ['thunderBoost'], snaps: ['thunderChip'] },
      { id: 'a21_chest_right', cell: [19, 12], night: 2, items: [ITEMS.abacusBead.id, ITEMS.wornGear.id, ITEMS.ether.id], gears: ['firstAid'], snaps: ['draw'] },
      { id: 'a21_chest_bath', room: 'bath_alley', cell: [20, 20], items: [ITEMS.brassBolt.id, ITEMS.filament.id, ITEMS.abacusFrame.id] },
    ],
    enemies: [
      // ---- 1晩目（路地の入口から銭湯の前と、銭湯の裏） ----
      { id: 'a21_e_gate', patrol: [[11, 38], [13, 38]], battle: 'a21_n1_gate' },
      { id: 'a21_e_lower', patrol: [[11, 31], [13, 31], [13, 28], [11, 28]], battle: 'a21_n1_lower' },
      { id: 'a21_e_road', patrol: [[13, 25], [11, 25]], battle: 'a21_n1_road' },
      { id: 'a21_e_plaza', patrol: [[15, 21], [20, 21]], battle: 'a21_n1_plaza' },
      { id: 'a21_e_bath1', room: 'bath_alley', patrol: [[8, 3], [17, 3]], battle: 'a21_n1_bath1' },
      // 銭湯の裏の路地：右の細い通りで、近づくと追ってくる（寄り道。コマなし）
      { id: 'a21_e_alley', room: 'bath_alley', move: 'chase', patrol: [[18, 6], [18, 16]], battle: 'a21_alley' },
      // ---- 2晩目（雪の資材置き場と、左右の道から工場の門） ----
      { id: 'a21_e_yard1', room: 'factory_yard', night: 2, patrol: [[13, 7], [18, 7]], battle: 'a21_n2_yard1' },
      // 資材置き場の逃げる敵（寄り道。コマなし、レアの素材）
      { id: 'a21_e_runner', room: 'factory_yard', night: 2, move: 'flee', patrol: [[12, 11]], battle: 'a21_runner' },
      { id: 'a21_e_yard2', room: 'factory_yard', night: 2, move: 'chase', patrol: [[6, 17], [11, 17]], battle: 'a21_n2_yard2' },
      { id: 'a21_e_left', night: 2, patrol: [[6, 16], [6, 12]], battle: 'a21_n2_left' },
      { id: 'a21_e_right', night: 2, patrol: [[19, 13], [19, 15]], battle: 'a21_n2_right' },
      // 工場の門の番人（2晩目の山場。戦う前の会話）
      { id: 'a21_e_guard', night: 2, until: 2, move: 'guard', patrol: [[10, 11]], battle: 'a21_n2_guard', scene: 'a21_guard' },
      // ---- 3晩目（工場の門の先と、工場の中） ----
      { id: 'a21_e_top', night: 3, patrol: [[6, 10], [9, 10]], battle: 'a21_n3_top' },
      { id: 'a21_e_corner', night: 3, move: 'chase', patrol: [[6, 14], [6, 17]], battle: 'a21_n3_corner' },
      { id: 'a21_e_steps', night: 3, patrol: [[11, 9], [12, 9]], battle: 'a21_n3_steps' },
      { id: 'a21_e_inner', night: 3, patrol: [[9, 7], [14, 7]], battle: 'a21_n3_inner' },
    ],
    // 工場の中、旋盤の前
    boss: { id: 'a21_boss', cell: [11, 5], battle: 'a21_boss' },
    // 写しの人々。晩ごとに、戻ってきた過去の分だけ言葉が先へ進む（段階78）
    talkers: [
      { id: 'a21_voice_bath', cell: [14, 19], until: 1, scene: 'a21_voice_bath', label: '銭湯の娘' },
      { id: 'a21_voice_senior', cell: [4, 21], until: 1, scene: 'a21_voice_senior', label: '先輩の職人' },
      { id: 'a21_voice_radio', cell: [11, 27], scene: 'a21_voice_radio', label: 'ラジオ' },
      { id: 'a21_voice_kid', cell: [14, 37], until: 2, scene: 'a21_voice_kid', label: '八百屋の子ども' },
      { id: 'a21_voice2_senior', cell: [7, 11], night: 2, scene: 'a21_voice2_senior', label: '先輩の職人' },
      // 雪景色の四角い穴（2-1-14。カイの「切り取る」の前触れ）
      { id: 'a21_square_hole', room: 'factory_yard', cell: [8, 4], night: 2, until: 2, scene: 'a21_square_hole', label: '四角い穴' },
    ],
    // コマが戻るたびに、過去の場面が1つずつ進む（段階78）
    triggers: [
      { on: 'koma', count: 1, scene: 'a21_first_koma' },
      // ムーブメントの開放（2-1-3）。みおが拾った歯車を、ごほうびのギアとして渡す
      { on: 'checkpoint', cell: [9, 21], scene: 'a21_checkpoint', gears: ['speedMemory'] },
      { on: 'koma', count: 2, scene: 'a21_koma2' },
      { on: 'koma', count: 3, scene: 'a21_koma3' },
      { on: 'koma', count: 4, scene: 'a21_koma4' },
      { on: 'koma', count: 5, scene: 'a21_koma5' },
      { on: 'checkpoint', cell: [15, 11], scene: 'a21_gate' },
      { on: 'koma', count: 6, scene: 'a21_koma6' },
      { on: 'koma', count: 7, scene: 'a21_koma7' },
      // あとコマが1つの時（台本の「あと{komaLeft}つ」に本当の数が入る。段階28）
      { on: 'komaLeft', left: 1, scene: 'a21_one_left' },
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
      // 体育館への扉は、渡り廊下の番人を倒すと開く（段階82：さらに、3晩目まではノイズの壁でふさがっている）
      { a: { room: 'school_corridor', side: 'top' }, b: { room: 'school_gym', side: 'bottom' }, opensWhen: 'a22_e_stage' },
    ],
    // 平成18年の文化祭の曲（段階75）
    bgm: BGM.cultureFestival,
    komaNeed: 10,
    timeTitle: '最後の文化祭',
    owner: 'ケンタ',
    memory: 'school_festival',
    // 返した報酬のスナップ（段階41）
    returnSnaps: ['joker'],
    // 晩の区切り（段階82）：2晩目は中庭のベンチ（チェックポイント）から、3晩目は音楽室の前の廊下から
    nights: [{ koma: 3 }, { koma: 6, start: { room: 'school_courtyard', cell: [9, 23] } }, { start: { room: 'school_corridor', cell: [5, 8] } }],
    // ノイズの壁：中庭から渡り廊下への出入口（2晩目から開く）と、渡り廊下から体育館への出入口（3晩目から開く）
    walls: [
      { id: 'a22_wall_corridor', room: 'school_courtyard', cells: box(10, 13, 0, 1), opens: 2 },
      { id: 'a22_wall_gym', room: 'school_corridor', cells: box(10, 13, 0, 1), opens: 3 },
    ],
    // 中庭の右の模擬店の裏、駐輪場の奥、お化け屋敷の教室の奥。寄り道の2つにはムーブメントのギア
    // 狩り（段階43）：採取の場所は、1回目の宝箱の所。番人（渡り廊下）は出ないので、番人の戦闘は教室の表に入れる
    hunt: {
      gathers: [
        { id: 'a22_gather_stall', room: 'school_courtyard', cell: [20, 24], items: [ITEMS.photoSticker.id, ITEMS.phoneStrap.id] },
        { id: 'a22_gather_bikes', room: 'school_bikes', cell: [3, 3], items: [ITEMS.cassetteTape.id, ITEMS.pendulumWeight.id] },
        { id: 'a22_gather_haunted', room: 'school_classroom', cell: [20, 4], items: [ITEMS.photoSticker.id, ITEMS.cassetteTape.id] },
      ],
      tables: {
        school_gate: ['a22_n1_gate', 'a22_n1_gate2'],
        school_courtyard: ['a22_n1_stalls', 'a22_n1_upper', 'a22_n1_west'],
        school_bikes: ['a22_n1_bikes'],
        school_corridor: ['a22_n2_hall', 'a22_n2_east', 'a22_n3_hall'],
        school_classroom: ['a22_n2_haunted', 'a22_n2_room', 'a22_n2_guard'],
        school_gym: ['a22_n3_floor1', 'a22_n3_floor2', 'a22_n3_front'],
      },
    },
    chests: [
      { id: 'a22_chest_stall', room: 'school_courtyard', cell: [20, 24], items: [ITEMS.photoSticker.id, ITEMS.phoneStrap.id, ITEMS.potion.id], snaps: ['fireChip'] },
      { id: 'a22_chest_bikes', room: 'school_bikes', cell: [3, 3], items: [ITEMS.cassetteTape.id, ITEMS.pendulumWeight.id, ITEMS.ether.id], gears: ['iceBoost'], snaps: ['search'] },
      { id: 'a22_chest_haunted', room: 'school_classroom', cell: [20, 4], night: 2, items: [ITEMS.glitterPen.id, ITEMS.ringtoneChip.id, ITEMS.hiPotion.id], gears: ['comboBoost'] },
    ],
    enemies: [
      // ---- 1晩目（校門・中庭・駐輪場） ----
      { id: 'a22_e_gate', patrol: [[5, 12], [18, 12]], battle: 'a22_n1_gate' },
      { id: 'a22_e_gate2', patrol: [[6, 17], [17, 17]], battle: 'a22_n1_gate2' },
      { id: 'a22_e_stalls', room: 'school_courtyard', patrol: [[6, 35], [17, 35]], battle: 'a22_n1_stalls' },
      { id: 'a22_e_west', room: 'school_courtyard', patrol: [[3, 17], [10, 17]], battle: 'a22_n1_west' },
      // 中庭の上の模擬店の通り：近づくと追ってくる
      { id: 'a22_e_upper', room: 'school_courtyard', move: 'chase', patrol: [[7, 13], [16, 13]], battle: 'a22_n1_upper' },
      // 駐輪場の逃げる敵（寄り道。コマなし、レアの素材）
      { id: 'a22_e_runner', room: 'school_bikes', move: 'flee', patrol: [[8, 16]], battle: 'a22_runner' },
      { id: 'a22_e_bikes', room: 'school_bikes', patrol: [[4, 6], [17, 6]], battle: 'a22_n1_bikes' },
      // ---- 2晩目（渡り廊下・お化け屋敷の教室） ----
      { id: 'a22_e_hall', room: 'school_corridor', night: 2, patrol: [[5, 15], [18, 15]], battle: 'a22_n2_hall' },
      { id: 'a22_e_east', room: 'school_corridor', night: 2, patrol: [[16, 11], [22, 11]], battle: 'a22_n2_east' },
      // お化け屋敷の教室：暗幕の迷路で追ってくる
      { id: 'a22_e_haunted', room: 'school_classroom', night: 2, move: 'chase', patrol: [[10, 6], [10, 17]], battle: 'a22_n2_haunted' },
      { id: 'a22_e_room', room: 'school_classroom', night: 2, patrol: [[17, 5], [20, 5]], battle: 'a22_n2_room' },
      // 渡り廊下の上の番人：倒すと体育館への扉が開く（3晩目から。戦う前の会話）
      { id: 'a22_e_stage', room: 'school_corridor', night: 2, until: 2, move: 'guard', patrol: [[11, 3]], battle: 'a22_n2_guard', scene: 'a22_guard' },
      // ---- 3晩目（渡り廊下の上と体育館） ----
      { id: 'a22_e_hall3', room: 'school_corridor', night: 3, patrol: [[10, 6], [13, 6]], battle: 'a22_n3_hall' },
      { id: 'a22_e_floor1', room: 'school_gym', night: 3, patrol: [[4, 16], [19, 16]], battle: 'a22_n3_floor1' },
      { id: 'a22_e_floor2', room: 'school_gym', night: 3, move: 'chase', patrol: [[5, 10], [18, 10]], battle: 'a22_n3_floor2' },
      { id: 'a22_e_front', room: 'school_gym', night: 3, patrol: [[7, 6], [10, 6]], battle: 'a22_n3_front' },
    ],
    // 体育館のステージ
    boss: { id: 'a22_boss', room: 'school_gym', cell: [11, 4], battle: 'a22_boss' },
    // 写しの人々。晩ごとに、戻ってきた過去の分だけ言葉が先へ進む（段階82）
    talkers: [
      { id: 'a22_voice_committee', cell: [6, 18], until: 1, scene: 'a22_voice_committee', label: '実行委員' },
      { id: 'a22_voice_stall', room: 'school_courtyard', cell: [6, 28], until: 1, scene: 'a22_voice_stall', label: '模擬店の生徒' },
      { id: 'a22_voice_classmate', room: 'school_courtyard', cell: [16, 24], until: 2, scene: 'a22_voice_classmate', label: 'クラスメイト' },
      { id: 'a22_voice_teacher', room: 'school_corridor', cell: [7, 6], night: 2, scene: 'a22_voice_teacher', label: '音楽の先生' },
      { id: 'a22_voice2_committee', room: 'school_corridor', cell: [19, 13], night: 2, until: 2, scene: 'a22_voice2_committee', label: '実行委員' },
      // お化け屋敷の教室の入口（2-2-12。緩める）
      { id: 'a22_haunted', room: 'school_classroom', cell: [3, 12], night: 2, until: 2, scene: 'a22_haunted', label: 'お化け屋敷' },
    ],
    // コマが戻るたびに、過去の場面が1つずつ進む（段階82）
    triggers: [
      { on: 'koma', count: 1, scene: 'a22_first_koma' },
      { on: 'checkpoint', room: 'school_courtyard', cell: [9, 23], scene: 'a22_checkpoint' },
      { on: 'koma', count: 2, scene: 'a22_koma2' },
      { on: 'koma', count: 3, scene: 'a22_koma3' },
      { on: 'koma', count: 4, scene: 'a22_koma4' },
      { on: 'koma', count: 5, scene: 'a22_koma5' },
      { on: 'checkpoint', room: 'school_corridor', cell: [5, 8], scene: 'a22_music_room' },
      { on: 'koma', count: 6, scene: 'a22_koma6' },
      { on: 'koma', count: 7, scene: 'a22_koma7' },
      { on: 'komaLeft', left: 1, scene: 'a22_one_left' },
      { on: 'boss', scene: 'a22_boss' },
      { on: 'cleared', scene: 'a22_last_koma' },
    ],
  },
  // 2-3「最後の打席」：平成10年の夏の河川敷のグラウンド（段階40）。段階85 で3晩に分けた。3晩目にぬしに勝ってコマがそろった後、返す直前にカイに持ち去られる（物語の流れの a23_kai）。
  // 取り返すのは4晩目の書庫（a23x）で、返すのはこの区画（物語の流れの a23_return）。
  // 土手の道 → ベンチの裏の木陰（右に寄り道の川べり）→ 売店のテント（左に寄り道の用具小屋の裏）→ 番人を倒すと開くダイヤモンド
  a23: {
    id: 'a23',
    name: '2-3「最後の打席」',
    rooms: [ROOMS.riverside_levee, ROOMS.riverside_bench, ROOMS.riverside_bank, ROOMS.riverside_stand, ROOMS.riverside_shed, ROOMS.riverside_diamond],
    links: [
      { a: { room: 'riverside_levee', side: 'top' }, b: { room: 'riverside_bench', side: 'bottom' } },
      { a: { room: 'riverside_bench', side: 'right' }, b: { room: 'riverside_bank', side: 'left' } },
      { a: { room: 'riverside_bench', side: 'top' }, b: { room: 'riverside_stand', side: 'bottom' } },
      { a: { room: 'riverside_stand', side: 'left' }, b: { room: 'riverside_shed', side: 'right' } },
      // ダイヤモンドへは、売店の上の番人を倒すと入れる（壁は3晩目から開く）
      { a: { room: 'riverside_stand', side: 'top' }, b: { room: 'riverside_diamond', side: 'bottom' }, opensWhen: 'a23_e_gate' },
    ],
    // 平成10年の夏の河川敷の曲（段階75）
    bgm: BGM.riverside,
    komaNeed: 10,
    timeTitle: '最後の打席',
    owner: 'コウジ',
    memory: 'riverside_1998',
    // 晩の区切り（段階85）：2晩目はベンチの裏の木陰、3晩目は売店のテント（どちらもチェックポイント）から
    nights: [{ koma: 3 }, { koma: 6, start: { room: 'riverside_bench', cell: [9, 21] } }, { start: { room: 'riverside_stand', cell: [12, 14] } }],
    // ノイズの壁：ベンチの裏から売店への出入口（2晩目から開く）と、売店からダイヤモンドへの出入口（3晩目から開く）
    walls: [
      { id: 'a23_wall_stand', room: 'riverside_bench', cells: box(10, 13, 0, 1), opens: 2 },
      { id: 'a23_wall_diamond', room: 'riverside_stand', cells: box(10, 13, 0, 1), opens: 3 },
    ],
    // 狩り（段階43）：採取の場所は、1回目の宝箱の所。番人（売店の上）は出ないので、番人の戦闘は売店の表に入れる
    hunt: {
      gathers: [
        { id: 'a23_gather_bench', room: 'riverside_bench', cell: [19, 15], items: [ITEMS.ballSeam.id, ITEMS.jugIce.id] },
        { id: 'a23_gather_bank', room: 'riverside_bank', cell: [16, 4], items: [ITEMS.petEgg.id, ITEMS.megaphoneMouth.id] },
        { id: 'a23_gather_shed', room: 'riverside_shed', cell: [4, 4], items: [ITEMS.ballSeam.id, ITEMS.petEgg.id] },
      ],
      tables: {
        riverside_levee: ['a23_n1_slope', 'a23_n1_levee'],
        riverside_bench: ['a23_n1_bench', 'a23_n1_shade'],
        riverside_bank: ['a23_n1_bank'],
        riverside_stand: ['a23_n2_stand', 'a23_n2_west', 'a23_n2_guard', 'a23_n3_stand'],
        riverside_shed: ['a23_n2_shed', 'a23_n2_shed2'],
        riverside_diamond: ['a23_n3_field1', 'a23_n3_field2', 'a23_n3_front'],
      },
    },
    chests: [
      { id: 'a23_chest_bench', room: 'riverside_bench', cell: [19, 15], items: [ITEMS.ballSeam.id, ITEMS.jugIce.id, ITEMS.potion.id] },
      { id: 'a23_chest_bank', room: 'riverside_bank', cell: [16, 4], items: [ITEMS.petEgg.id, ITEMS.megaphoneMouth.id, ITEMS.ether.id], gears: ['startDash'], snaps: ['iceChip'] },
      { id: 'a23_chest_shed', room: 'riverside_shed', cell: [4, 4], night: 2, items: [ITEMS.autographBall.id, ITEMS.cheerBand.id, ITEMS.hiPotion.id], gears: ['breaker'], snaps: ['wideShot'] },
    ],
    enemies: [
      // ---- 1晩目（土手の道・ベンチの裏の木陰・川べり） ----
      { id: 'a23_e_slope', patrol: [[17, 15], [17, 8]], battle: 'a23_n1_slope' },
      { id: 'a23_e_levee', patrol: [[12, 4], [19, 4]], battle: 'a23_n1_levee' },
      { id: 'a23_e_bench', room: 'riverside_bench', patrol: [[5, 33], [18, 33]], battle: 'a23_n1_bench' },
      // ベンチの裏の上：近づくと追ってくる
      { id: 'a23_e_shade', room: 'riverside_bench', move: 'chase', patrol: [[8, 9], [15, 9]], battle: 'a23_n1_shade' },
      { id: 'a23_e_bank', room: 'riverside_bank', patrol: [[5, 19], [16, 19]], battle: 'a23_n1_bank' },
      // 川べりの逃げる敵（寄り道。コマなし、レアの素材）
      { id: 'a23_e_runner', room: 'riverside_bank', move: 'flee', patrol: [[10, 16]], battle: 'a23_runner' },
      // ---- 2晩目（売店のテント・用具小屋の裏） ----
      { id: 'a23_e_stand', room: 'riverside_stand', night: 2, patrol: [[4, 8], [18, 8]], battle: 'a23_n2_stand' },
      { id: 'a23_e_west', room: 'riverside_stand', night: 2, patrol: [[1, 12], [11, 12]], battle: 'a23_n2_west' },
      // 用具小屋の裏：追ってくる
      { id: 'a23_e_shed', room: 'riverside_shed', night: 2, move: 'chase', patrol: [[10, 6], [10, 18]], battle: 'a23_n2_shed' },
      { id: 'a23_e_shed2', room: 'riverside_shed', night: 2, patrol: [[5, 6], [5, 18]], battle: 'a23_n2_shed2' },
      // 売店の上の番人：倒すとダイヤモンドへの道が開く（3晩目から。戦う前の会話）
      { id: 'a23_e_gate', room: 'riverside_stand', night: 2, until: 2, move: 'guard', patrol: [[11, 5]], battle: 'a23_n2_guard', scene: 'a23_guard' },
      // ---- 3晩目（売店のテントとダイヤモンド） ----
      { id: 'a23_e_stand3', room: 'riverside_stand', night: 3, patrol: [[16, 16], [20, 16]], battle: 'a23_n3_stand' },
      { id: 'a23_e_field1', room: 'riverside_diamond', night: 3, patrol: [[4, 16], [19, 16]], battle: 'a23_n3_field1' },
      { id: 'a23_e_field2', room: 'riverside_diamond', night: 3, move: 'chase', patrol: [[5, 11], [18, 11]], battle: 'a23_n3_field2' },
      { id: 'a23_e_front', room: 'riverside_diamond', night: 3, patrol: [[4, 9], [8, 9]], battle: 'a23_n3_front' },
    ],
    // ホームベースの前
    boss: { id: 'a23_boss', room: 'riverside_diamond', cell: [11, 6], battle: 'a23_boss' },
    // 写しの人々。晩ごとに、戻ってきた過去の分だけ言葉が先へ進む（段階85）
    talkers: [
      { id: 'a23_voice_team', cell: [7, 13], until: 1, scene: 'a23_voice_team', label: 'チームの子' },
      { id: 'a23_voice_coach', room: 'riverside_bench', cell: [5, 28], until: 1, scene: 'a23_voice_coach', label: '監督' },
      { id: 'a23_voice_coach2', room: 'riverside_bench', cell: [5, 28], night: 2, scene: 'a23_voice_coach2', label: '監督' },
      { id: 'a23_voice_shop', room: 'riverside_stand', cell: [18, 13], night: 2, scene: 'a23_voice_shop', label: '売店のおばちゃん' },
      { id: 'a23_voice_rival', room: 'riverside_stand', cell: [4, 16], night: 2, scene: 'a23_voice_rival', label: '相手チームの子' },
      { id: 'a23_voice_kid', room: 'riverside_stand', cell: [16, 9], night: 2, scene: 'a23_voice_kid', label: 'スタンドの子ども' },
    ],
    // コマが戻るたびに、過去の場面が1つずつ進む（段階85）
    triggers: [
      { on: 'koma', count: 1, scene: 'a23_first_koma' },
      { on: 'checkpoint', room: 'riverside_bench', cell: [9, 21], scene: 'a23_checkpoint' },
      { on: 'koma', count: 2, scene: 'a23_koma2' },
      { on: 'koma', count: 3, scene: 'a23_koma3' },
      { on: 'koma', count: 4, scene: 'a23_koma4' },
      { on: 'checkpoint', room: 'riverside_stand', cell: [12, 14], scene: 'a23_stand' },
      { on: 'koma', count: 5, scene: 'a23_koma5' },
      { on: 'koma', count: 6, scene: 'a23_koma6' },
      { on: 'koma', count: 7, scene: 'a23_koma7' },
      { on: 'komaLeft', left: 1, scene: 'a23_one_left' },
      { on: 'boss', scene: 'a23_boss' },
      { on: 'cleared', scene: 'a23_last_koma' },
    ],
  },
  // 2-3 の4晩目「取り返す」：保管局の奥の書庫（段階85。docs/script/2-3_rework.md の 3.）。交換所の窓口の奥の通用口から入る。
  // 通用口の廊下 → 閲覧室（チェックポイント。右に寄り道の黒い扉の部屋）→ 奥の書庫（いちばん奥の棚に「最後の打席」の砂時計）。
  // カイが見回っていて、見つかると短い負け戦の後、チェックポイントに戻される。カイを倒す道はない。コマは要らない。
  // 棚の砂時計（区画の奥の印）に触れると、カイとの負け戦（決まったラウンドを耐える）の後に逃げきって、区画を終える
  a23x: {
    id: 'a23x',
    name: '2-3「最後の打席」：保管局の奥の書庫',
    rooms: [ROOMS.archive_corridor, ROOMS.archive_reading, ROOMS.archive_vault, ROOMS.archive_stacks],
    links: [
      { a: { room: 'archive_corridor', side: 'top' }, b: { room: 'archive_reading', side: 'bottom' } },
      { a: { room: 'archive_reading', side: 'right' }, b: { room: 'archive_vault', side: 'left' } },
      { a: { room: 'archive_reading', side: 'top' }, b: { room: 'archive_stacks', side: 'bottom' } },
    ],
    // 決意の曲（Leaving For Tomorrow。段階86）
    bgm: BGM.resolve,
    komaNeed: 0,
    goal: { band: '目当て：奥の棚の砂時計', guide: 'ビー玉が鳴る方へ。いちばん奥の棚の砂時計を取り返す\nカイに見つかると、チェックポイントへ戻される' },
    chests: [{ id: 'a23x_chest_vault', room: 'archive_vault', cell: [14, 19], items: [ITEMS.hiPotion.id, ITEMS.ether.id] }],
    enemies: [
      { id: 'a23x_e_corridor', patrol: [[9, 6], [14, 6]], battle: 'a23x_corridor' },
      { id: 'a23x_e_alcove', patrol: [[4, 10], [4, 14]], battle: 'a23x_alcove' },
      { id: 'a23x_e_reading1', room: 'archive_reading', patrol: [[5, 22], [18, 22]], battle: 'a23x_reading1' },
      { id: 'a23x_e_reading2', room: 'archive_reading', patrol: [[5, 3], [18, 3]], battle: 'a23x_reading2' },
      { id: 'a23x_e_vault', room: 'archive_vault', move: 'chase', patrol: [[7, 7], [7, 16]], battle: 'a23x_vault' },
      { id: 'a23x_e_stacks1', room: 'archive_stacks', patrol: [[5, 20], [18, 20]], battle: 'a23x_stacks1' },
      { id: 'a23x_e_stacks2', room: 'archive_stacks', patrol: [[5, 8], [18, 8]], battle: 'a23x_stacks2' },
      // 見回るカイ（閲覧室と奥の書庫）。近づくと追ってくる。見つかると、チェックポイントへ戻される。最初に見つかった時だけ、カイのひとこと
      { id: 'a23x_e_kai1', room: 'archive_reading', move: 'chase', patrol: [[5, 9], [18, 9]], battle: 'a23x_kai_patrol', scene: 'a23x_kai_seen' },
      { id: 'a23x_e_kai2', room: 'archive_stacks', move: 'chase', patrol: [[5, 16], [18, 16]], battle: 'a23x_kai_patrol', scene: 'a23x_kai_seen' },
    ],
    // いちばん奥の棚の「最後の打席」の砂時計。触れると、カイとの負け戦
    boss: { id: 'a23x_shelf', room: 'archive_stacks', cell: [11, 3], battle: 'a23x_kai', label: '砂時計' },
    talkers: [{ id: 'a23x_door', room: 'archive_vault', cell: [14, 4], scene: 'a23x_door', label: '黒い扉' }],
    triggers: [
      { on: 'checkpoint', room: 'archive_reading', cell: [12, 14], scene: 'a23x_reading' },
      { on: 'boss', scene: 'a23x_found' },
      { on: 'cleared', scene: 'a23x_escape' },
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
