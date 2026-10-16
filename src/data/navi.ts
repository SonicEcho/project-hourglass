import type { NaviBoardDef, NaviData, NaviPartDef } from '../core/navi';
import { parseBoardCells } from '../core/navi';

// ムーブメント（段階8）。数値・形はすべて仮。
// 形は [列, 行]（左上が [0, 0]）。回転は画面で90度ずつ変えられる。

const ONE: [number, number][] = [[0, 0]];
const LINE2: [number, number][] = [[0, 0], [1, 0]];
const LINE3: [number, number][] = [[0, 0], [1, 0], [2, 0]];
const L3: [number, number][] = [[0, 0], [0, 1], [1, 1]];
const T4: [number, number][] = [[0, 0], [1, 0], [2, 0], [1, 1]];
const SQUARE: [number, number][] = [[0, 0], [1, 0], [0, 1], [1, 1]];

/** 狂い1つにつき、ラウンドの始めに失う最大HPの割合 */
export const BUG_HP_RATE = 0.05;

const part = <T extends NaviPartDef>(p: T): T => p;

export const NAVI_PARTS = {
  // 能力値ギア（どこでも効く）。名前は上がる能力値の呼び名＋歯車（2026-10-16 開発者と決めた。「○○メモリ」はナビカスらしさが残るため）
  hpMemory: part({ id: 'hpMemory', name: 'HPの歯車', color: 'red', cells: ONE, kind: 'stat', stats: { hp: 20 } }),
  mpMemory: part({ id: 'mpMemory', name: 'MPの歯車', color: 'blue', cells: ONE, kind: 'stat', stats: { mp: 8 } }),
  powerMemory: part({ id: 'powerMemory', name: '攻撃の歯車', color: 'red', cells: LINE2, kind: 'stat', stats: { atk: 3 } }),
  magicMemory: part({ id: 'magicMemory', name: '魔力の歯車', color: 'blue', cells: LINE2, kind: 'stat', stats: { mag: 3 } }),
  guardMemory: part({ id: 'guardMemory', name: '防御の歯車', color: 'green', cells: LINE2, kind: 'stat', stats: { def: 2 } }),
  speedMemory: part({ id: 'speedMemory', name: '速さの歯車', color: 'yellow', cells: L3, kind: 'stat', stats: { spd: 2 } }),
  // 効果ギア（ブリッジに乗っている時だけ効く）
  fireBoost: part({ id: 'fireBoost', name: 'ファイアブースト', color: 'red', cells: L3, kind: 'effect', effect: { kind: 'elementBoost', element: 'fire', rate: 0.25 } }),
  iceBoost: part({ id: 'iceBoost', name: 'アイスブースト', color: 'blue', cells: L3, kind: 'effect', effect: { kind: 'elementBoost', element: 'ice', rate: 0.25 } }),
  thunderBoost: part({ id: 'thunderBoost', name: 'サンダーブースト', color: 'yellow', cells: L3, kind: 'effect', effect: { kind: 'elementBoost', element: 'thunder', rate: 0.25 } }),
  breaker: part({ id: 'breaker', name: 'ブレイカー', color: 'red', cells: LINE3, kind: 'effect', effect: { kind: 'partBoost', rate: 0.5 } }),
  oneMoreDraw: part({ id: 'oneMoreDraw', name: '延長ドロー', color: 'yellow', cells: T4, kind: 'effect', effect: { kind: 'oneMoreDraw', count: 1 } }),
  batonReceiver: part({ id: 'batonReceiver', name: 'バトンレシーバー', color: 'green', cells: LINE3, kind: 'effect', effect: { kind: 'batonBoost', rate: 0.25 } }),
  comboBoost: part({ id: 'comboBoost', name: 'コンボブースト', color: 'yellow', cells: SQUARE, kind: 'effect', effect: { kind: 'comboBoost', rate: 0.25 } }),
  firstAid: part({ id: 'firstAid', name: 'ファーストエイド', color: 'green', cells: LINE2, kind: 'effect', effect: { kind: 'regen', rate: 0.05 } }),
  mpSave: part({ id: 'mpSave', name: 'MPセーブ', color: 'blue', cells: LINE2, kind: 'effect', effect: { kind: 'mpSave', amount: 1 } }),
  startDash: part({ id: 'startDash', name: 'スタートダッシュ', color: 'yellow', cells: LINE2, kind: 'effect', effect: { kind: 'startDash' } }),
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
};

export const NAVI_DATA: NaviData = { parts: NAVI_PARTS, boards: NAVI_BOARDS };

/** 周回の始めに持っているギア */
export const START_NAVI_PARTS: NaviPartId[] = ['hpMemory', 'powerMemory', 'magicMemory', 'guardMemory', 'fireBoost', 'oneMoreDraw'];

/** 戦闘に勝った時のギアの候補（戦闘の番号ごと）。この中から NAVI_REWARD_PICKS 個選ぶ */
export const NAVI_REWARD_CANDIDATES: NaviPartId[][] = [
  ['iceBoost', 'thunderBoost', 'speedMemory'],
  ['breaker', 'batonReceiver', 'mpMemory'],
  ['comboBoost', 'firstAid', 'powerMemory'],
  ['mpSave', 'startDash', 'hpMemory'],
];
export const NAVI_REWARD_PICKS = 2;

/** ボスの部位を壊すと手に入るはずのギア（結果画面に表示するだけ） */
export const BOSS_PART_REWARDS: Record<string, NaviPartId> = {
  rightArm: 'breaker',
  horn: 'thunderBoost',
};
