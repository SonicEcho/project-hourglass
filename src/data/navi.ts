import type { NaviBoardDef, NaviData, NaviPartDef } from '../core/navi';
import { parseBoardCells } from '../core/navi';

// ムーブメント（段階8）。数値・形はすべて仮。
// 形は [列, 行]（左上が [0, 0]）。回転は画面で90度ずつ変えられる。

const ONE: [number, number][] = [[0, 0]];
const LINE2: [number, number][] = [[0, 0], [1, 0]];
const LINE3: [number, number][] = [[0, 0], [1, 0], [2, 0]];
const L3: [number, number][] = [[0, 0], [0, 1], [1, 1]];
const SQUARE: [number, number][] = [[0, 0], [1, 0], [0, 1], [1, 1]];

/** 狂い1つにつき、ラウンドの始めに失う最大HPの割合 */
export const BUG_HP_RATE = 0.05;

const part = <T extends NaviPartDef>(p: T): T => p;

export const NAVI_PARTS = {
  // ---- 段階200（段取りの段階G5b）：一覧の 18. の4章までの40種類（docs/milestones/M3_catalog.md）。数字は今の大きさに合わせた（仮） ----
  // 能力値ギア（どこでも効く。ブリッジの外の隙間を埋める役）。名前は上がる能力値＋ギア。1マスは2章から、2マスは3章から
  hpMemory: part({ id: 'hpMemory', name: 'HPギア', color: 'red', cells: ONE, kind: 'stat', stats: { hp: 20 } }),
  hpMemory2: part({ id: 'hpMemory2', name: 'HPギア（大）', color: 'red', cells: LINE2, kind: 'stat', stats: { hp: 44 } }),
  powerMemory1: part({ id: 'powerMemory1', name: 'パワーギア（小）', color: 'red', cells: ONE, kind: 'stat', stats: { atk: 1 } }),
  powerMemory: part({ id: 'powerMemory', name: 'パワーギア', color: 'red', cells: LINE2, kind: 'stat', stats: { atk: 3 } }),
  magicMemory1: part({ id: 'magicMemory1', name: 'マジックギア（小）', color: 'blue', cells: ONE, kind: 'stat', stats: { mag: 1 } }),
  magicMemory: part({ id: 'magicMemory', name: 'マジックギア', color: 'blue', cells: LINE2, kind: 'stat', stats: { mag: 3 } }),
  mpMemory: part({ id: 'mpMemory', name: 'MPギア', color: 'blue', cells: ONE, kind: 'stat', stats: { mp: 8 } }),
  mpMemory2: part({ id: 'mpMemory2', name: 'MPギア（大）', color: 'blue', cells: LINE2, kind: 'stat', stats: { mp: 18 } }),
  guardMemory1: part({ id: 'guardMemory1', name: 'ガードギア（小）', color: 'green', cells: ONE, kind: 'stat', stats: { def: 1 } }),
  guardMemory: part({ id: 'guardMemory', name: 'ガードギア', color: 'green', cells: LINE2, kind: 'stat', stats: { def: 2 } }),
  // ① いつも効く（3個まで）
  fireBoost: part({ id: 'fireBoost', name: 'ファイアブースト', color: 'red', cells: L3, kind: 'effect', effect: { kind: 'elementBoost', element: 'fire', rate: 0.25 } }),
  iceBoost: part({ id: 'iceBoost', name: 'アイスブースト', color: 'blue', cells: L3, kind: 'effect', effect: { kind: 'elementBoost', element: 'ice', rate: 0.25 } }),
  thunderBoost: part({ id: 'thunderBoost', name: 'サンダーブースト', color: 'yellow', cells: L3, kind: 'effect', effect: { kind: 'elementBoost', element: 'thunder', rate: 0.25 } }),
  mpSave: part({ id: 'mpSave', name: 'MPセーブ', color: 'blue', cells: LINE2, kind: 'effect', effect: { kind: 'mpSave', amount: 1 } }),
  firstAid: part({ id: 'firstAid', name: 'ファーストエイド', color: 'green', cells: LINE2, kind: 'effect', effect: { kind: 'regen', rate: 0.05 } }),
  comboBoost: part({ id: 'comboBoost', name: 'コンボブースト', color: 'yellow', cells: SQUARE, kind: 'effect', effect: { kind: 'comboBoost', rate: 0.25 } }),
  pushGear: part({ id: 'pushGear', name: 'プッシュ', color: 'yellow', cells: LINE2, kind: 'effect', effect: { kind: 'pushPlus', count: 1 } }),
  snapBoost: part({ id: 'snapBoost', name: 'スナップブースト', color: 'yellow', cells: L3, kind: 'effect', effect: { kind: 'snapBoost', rate: 0.2 } }),
  effectBoost: part({ id: 'effectBoost', name: 'エフェクトブースト', color: 'blue', cells: L3, kind: 'effect', effect: { kind: 'effectBoost', rate: 0.25 } }),
  longTake: part({ id: 'longTake', name: 'ロングテイク', color: 'blue', cells: L3, kind: 'effect', effect: { kind: 'fragileBoost', rate: 0.25 } }),
  // ② 対策（効く相手にはとても強く、それ以外には何もしない。1〜2個）
  shellCrack: part({ id: 'shellCrack', name: 'シェルクラック', color: 'red', cells: LINE2, kind: 'effect', effect: { kind: 'shellCrack', count: 1 } }),
  armorPierce: part({ id: 'armorPierce', name: 'アーマーピアス', color: 'red', cells: LINE2, kind: 'effect', effect: { kind: 'armorPierce', count: 1 } }),
  wideShot: part({ id: 'wideShot', name: 'ワイドショット', color: 'yellow', cells: LINE3, kind: 'effect', effect: { kind: 'wideShot', count: 1 } }),
  splash: part({ id: 'splash', name: 'スプラッシュ', color: 'red', cells: L3, kind: 'effect', effect: { kind: 'splash', count: 1 } }),
  blastShelter: part({ id: 'blastShelter', name: 'ブラストシェルター', color: 'green', cells: LINE2, kind: 'effect', effect: { kind: 'blastGuard', rate: 0.7 } }),
  mirrorGuard: part({ id: 'mirrorGuard', name: 'ミラーガード', color: 'green', cells: LINE3, kind: 'effect', effect: { kind: 'counterGuard', rate: 0.5 } }),
  timeKeeper: part({ id: 'timeKeeper', name: 'タイムキーパー', color: 'green', cells: LINE2, kind: 'effect', effect: { kind: 'timeKeeper', count: 1 } }),
  anchor: part({ id: 'anchor', name: 'アンカー', color: 'yellow', cells: L3, kind: 'effect', effect: { kind: 'pushPlus', count: 2 } }),
  breakTime: part({ id: 'breakTime', name: 'ブレイクタイム', color: 'red', cells: LINE3, kind: 'effect', effect: { kind: 'breakTime', rate: 0.5 } }),
  hunter: part({ id: 'hunter', name: 'ハンター', color: 'red', cells: LINE2, kind: 'effect', effect: { kind: 'hunter', rate: 0.5 } }),
  finder: part({ id: 'finder', name: 'ファインダー', color: 'blue', cells: LINE2, kind: 'effect', effect: { kind: 'finder', count: 1 } }),
  stopwatch: part({ id: 'stopwatch', name: 'ストップウォッチ', color: 'yellow', cells: LINE2, kind: 'effect', effect: { kind: 'stopwatch', count: 2 } }),
  // ③ 条件（場面を選ぶ代わりに強い。1〜2個）。スタートダッシュは id のまま先手必勝にした（段階200）
  breaker: part({ id: 'breaker', name: 'ブレイカー', color: 'red', cells: LINE3, kind: 'effect', effect: { kind: 'partBoost', rate: 0.5 } }),
  bossKiller: part({ id: 'bossKiller', name: 'ボスキラー', color: 'red', cells: L3, kind: 'effect', effect: { kind: 'bossBoost', rate: 0.3 } }),
  crowdSweep: part({ id: 'crowdSweep', name: '群れ払い', color: 'yellow', cells: LINE3, kind: 'effect', effect: { kind: 'crowdBoost', rate: 0.3 } }),
  startDash: part({ id: 'startDash', name: '先手必勝', color: 'yellow', cells: LINE2, kind: 'effect', effect: { kind: 'firstRound', rate: 0.4 } }),
  lastStand: part({ id: 'lastStand', name: '背水', color: 'red', cells: LINE2, kind: 'effect', effect: { kind: 'desperate', rate: 0.4 } }),
  // ④ 両刃（得と損。1個ずつ）
  reckless: part({ id: 'reckless', name: '捨て身', color: 'red', cells: LINE2, kind: 'effect', effect: { kind: 'reckless', rate: 0.3, taken: 0.2 } }),
  pinpointFocus: part({ id: 'pinpointFocus', name: '一点集中', color: 'red', cells: LINE2, kind: 'effect', effect: { kind: 'focus', rate: 0.4, spread: 0.5 } }),
  // 絆のギア（色なし＝銀。ブリッジに乗っていると、その3人のコンボを開く。4マス）
  fairBond: part({ id: 'fairBond', name: '縁日のギア', color: 'silver', cells: SQUARE, kind: 'bond', links: ['threeTimes'] }),
} satisfies Record<string, NaviPartDef>;

export type NaviPartId = keyof typeof NAVI_PARTS;

const board = (layout: string[], commandCol: number): NaviBoardDef => ({
  cols: Math.max(...layout.map((l) => l.length)),
  rows: layout.length,
  cells: parseBoardCells(layout),
  commandCol,
  bugEffect: { kind: 'bug', rate: BUG_HP_RATE },
});

/** キャラごとの盤（'#' が置けるマス）。将来、武器ごとの形をここに足せるようにする */
export const NAVI_BOARDS: Record<string, NaviBoardDef> = {
  // ハルト：癖のない正方形
  hero: board(['####', '####', '####', '####'], 1),
  // あかり：縦長。ブリッジが長く、支援の効果ギアを並べやすい（2026-10-16 にブリッジを縦にした時、横長から替えた）
  akari: board(['###', '###', '###', '###', '###'], 1),
  // みお：四隅が欠けた小さな盤（構想ノートでは未定なので仮）
  mio: board(['.##.', '####', '####', '.##.'], 1),
  // 小夜子（段階91a）：斜めに長い盤（薙刀の形。仮）
  sayoko: board(['##..', '###.', '.###', '..##'], 1),
  // 早瀬（段階140a）：マスは多いが、ところどころ置けない盤（構想ノートの「マスが多いが制約も多い」。時計の機械の穴の形。仮）
  hayase: board(['##.##', '#####', '.#.#.', '#####', '##.##'], 1),
};

export const NAVI_DATA: NaviData = { parts: NAVI_PARTS, boards: NAVI_BOARDS };

/** 周回の始めに持っているギア */
/** 段階200：2章の始め（ムーブメントが開く時）に使えるギア。能力値の1マスと、ファイアブースト・ワイドショット */
export const START_NAVI_PARTS: NaviPartId[] = ['hpMemory', 'powerMemory1', 'magicMemory1', 'guardMemory1', 'fireBoost', 'wideShot'];

/** 戦闘に勝った時のギアの候補（戦闘の番号ごと）。この中から NAVI_REWARD_PICKS 個選ぶ */
export const NAVI_REWARD_CANDIDATES: NaviPartId[][] = [
  ['iceBoost', 'thunderBoost', 'mpMemory'],
  ['breaker', 'effectBoost', 'mpMemory'],
  ['comboBoost', 'firstAid', 'powerMemory'],
  ['mpSave', 'startDash', 'hpMemory'],
];
export const NAVI_REWARD_PICKS = 2;

/** ボスの部位を壊すと手に入るはずのギア（結果画面に表示するだけ） */
export const BOSS_PART_REWARDS: Record<string, NaviPartId> = {
  rightArm: 'breaker',
  horn: 'thunderBoost',
};
