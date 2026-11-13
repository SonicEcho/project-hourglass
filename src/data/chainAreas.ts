import type { ChainMove } from '../core';
import { A11_CARDS, A11_CARD_ART, A11_ENEMY_SNAPS, A11_SETUPS, A11_SHORT_TEXT, type ChainAreaSetup } from './chainArea11';
import { A12_CARD_ART, A12_ENEMY_SNAP, A12_ENEMY_SNAPS, A12_SETUPS, A12_SHORT_TEXT } from './chainArea12';
import { A21_CARD_ART, A21_ENEMY_SNAP, A21_ENEMY_SNAPS, A21_NEW_SNAPS, A21_SETUPS, A21_SHORT_TEXT } from './chainArea21';
import { A22_CARD_ART, A22_ENEMY_SNAP, A22_ENEMY_SNAPS, A22_NEW_SNAPS, A22_SETUPS, A22_SHORT_TEXT } from './chainArea22';
import { A23_CARD_ART, A23_ENEMY_SNAP, A23_ENEMY_SNAPS, A23_NEW_SNAPS, A23_SETUPS, A23_SHORT_TEXT } from './chainArea23';
import { A3S_CARD_ART, A3S_ENEMY_SNAP, A3S_ENEMY_SNAPS, A3S_NEW_SNAPS, A3S_SETUPS, A3S_SHORT_TEXT } from './chainArea3s';
import { A3K_SETUPS } from './chainArea3k';
import { A31_CARD_ART, A31_ENEMY_SNAP, A31_ENEMY_SNAPS, A31_NEW_SNAPS, A31_SETUPS, A31_SHORT_TEXT } from './chainArea31';

// 新しい戦闘の区画をまとめる（段階168）。区画ごとのファイル（chainArea11・chainArea12…）の札・敵のスナップ・戦闘の中身を、ここで1つにする。
// アルバムには、ほかの区画で手に入れた札も入るので、どの区画の戦闘でも、全部の札（CHAIN_MAIN_CARDS）を使えるようにする

/** 新しい戦闘の本番の札（スペシャルを含む） */
export const CHAIN_MAIN_CARDS: Record<string, ChainMove> = {
  ...A11_CARDS,
  ...Object.fromEntries([...Object.values(A12_ENEMY_SNAP), ...A21_NEW_SNAPS, ...Object.values(A21_ENEMY_SNAP), ...A22_NEW_SNAPS, ...Object.values(A22_ENEMY_SNAP), ...A23_NEW_SNAPS, ...Object.values(A23_ENEMY_SNAP), ...A31_NEW_SNAPS, ...Object.values(A31_ENEMY_SNAP), ...A3S_NEW_SNAPS, ...Object.values(A3S_ENEMY_SNAP)].map((m) => [m.id, m])),
};

/**
 * 新しい戦闘のスナップ（段階163）：アルバムに入れられる札の一覧（スペシャルを除く）。章ごとに足していく。並びはアルバムの画面の並び
 */
export const CHAIN_SNAPS: Record<string, ChainMove> = Object.fromEntries(Object.values(CHAIN_MAIN_CARDS).filter((m) => !m.owner).map((m) => [m.id, m]));

/** 敵の種類 → その敵のスナップ（段階165） */
export const CHAIN_ENEMY_SNAPS: Record<string, string> = { ...A11_ENEMY_SNAPS, ...A12_ENEMY_SNAPS, ...A21_ENEMY_SNAPS, ...A22_ENEMY_SNAPS, ...A23_ENEMY_SNAPS, ...A31_ENEMY_SNAPS, ...A3S_ENEMY_SNAPS };

/** 本番の札の絵と短い説明（試しにない物） */
export const CHAIN_MAIN_CARD_ART: Record<string, string> = { ...A11_CARD_ART, ...A12_CARD_ART, ...A21_CARD_ART, ...A22_CARD_ART, ...A23_CARD_ART, ...A31_CARD_ART, ...A3S_CARD_ART };
export const CHAIN_MAIN_SHORT_TEXT: Record<string, string> = { ...A11_SHORT_TEXT, ...A12_SHORT_TEXT, ...A21_SHORT_TEXT, ...A22_SHORT_TEXT, ...A23_SHORT_TEXT, ...A31_SHORT_TEXT, ...A3S_SHORT_TEXT };

/**
 * ぬし戦の評価の基準（段階180。決着した時刻のマス。★3＝high 以内、★2＝mid 以内）。ぬしのスナップは ★3 の時だけ。
 * 自動対戦（考える方針・1章は育成なしの2人、2章からはその区画に入る時点の控えめな育ち具合の3人・20戦）で、勝った戦いの速いほう 35〜50% が ★3 に届くように決めた。
 * 勝った戦いの決着の時刻：1-1 23〜35、1-2 22〜55、2-1 36〜84、2-2 42〜62、2-3 43〜63、3-1 49〜64（それまでの基準 35 では、2章から誰も届かなかった）
 */
export const CHAIN_BOSS_GRADE: Record<string, { high: number; mid: number }> = {
  a11_boss: { high: 27, mid: 40 },
  a12_boss: { high: 33, mid: 48 },
  a21_boss: { high: 51, mid: 66 },
  a22_boss: { high: 51, mid: 66 },
  a23_boss: { high: 53, mid: 68 },
  a31_boss: { high: 59, mid: 74 },
  // 段階182：祭りの夜のやぐらのぬし（勝った戦いの決着 39〜93）
  a3s2_boss: { high: 46, mid: 61 },
};

/** 区画の戦闘を新しい戦闘で戦う時の中身（AREA_BATTLES の id → 中身）。札は全部の札 */
export const CHAIN_AREA_SETUPS: Record<string, ChainAreaSetup> = Object.fromEntries(
  Object.entries({ ...A11_SETUPS, ...A12_SETUPS, ...A21_SETUPS, ...A22_SETUPS, ...A23_SETUPS, ...A31_SETUPS, ...A3S_SETUPS, ...A3K_SETUPS }).map(([id, s]) => [id, { ...s, cards: CHAIN_MAIN_CARDS, ...(CHAIN_BOSS_GRADE[id] ? { gradeAt: CHAIN_BOSS_GRADE[id] } : {}) }]),
);

/**
 * 新しい戦闘で戦う区画の戦闘（AREA_BATTLES の id）。段階D1（160）で 1-1 の雑魚、段階D2（162）で 1-1 のぬし、段階168・169 で 1-2、段階170・171 で 2-1、段階172・173 で 2-2、段階174〜176 で 2-3、段階178・179 で 3-1、段階181・182 で祭りの夜、段階183 で祭りの夜（カイ）の砂嵐。段階F で章ごとに増やす。
 * ここにない戦闘は、今の本番の戦闘のまま（デバッグメニューの切り替えで、全部を新しい戦闘にして試せる）
 */
export const CHAIN_AREA_BATTLES: string[] = Object.keys(CHAIN_AREA_SETUPS);
