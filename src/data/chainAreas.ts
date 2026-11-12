import type { ChainMove } from '../core';
import { A11_CARDS, A11_CARD_ART, A11_ENEMY_SNAPS, A11_SETUPS, A11_SHORT_TEXT, type ChainAreaSetup } from './chainArea11';
import { A12_CARD_ART, A12_ENEMY_SNAP, A12_ENEMY_SNAPS, A12_SETUPS, A12_SHORT_TEXT } from './chainArea12';
import { A21_CARD_ART, A21_ENEMY_SNAP, A21_ENEMY_SNAPS, A21_NEW_SNAPS, A21_SETUPS, A21_SHORT_TEXT } from './chainArea21';
import { A22_CARD_ART, A22_ENEMY_SNAP, A22_ENEMY_SNAPS, A22_NEW_SNAPS, A22_SETUPS, A22_SHORT_TEXT } from './chainArea22';
import { A23_CARD_ART, A23_ENEMY_SNAP, A23_ENEMY_SNAPS, A23_NEW_SNAPS, A23_SETUPS, A23_SHORT_TEXT } from './chainArea23';

// 新しい戦闘の区画をまとめる（段階168）。区画ごとのファイル（chainArea11・chainArea12…）の札・敵のスナップ・戦闘の中身を、ここで1つにする。
// アルバムには、ほかの区画で手に入れた札も入るので、どの区画の戦闘でも、全部の札（CHAIN_MAIN_CARDS）を使えるようにする

/** 新しい戦闘の本番の札（スペシャルを含む） */
export const CHAIN_MAIN_CARDS: Record<string, ChainMove> = {
  ...A11_CARDS,
  ...Object.fromEntries([...Object.values(A12_ENEMY_SNAP), ...A21_NEW_SNAPS, ...Object.values(A21_ENEMY_SNAP), ...A22_NEW_SNAPS, ...Object.values(A22_ENEMY_SNAP), ...A23_NEW_SNAPS, ...Object.values(A23_ENEMY_SNAP)].map((m) => [m.id, m])),
};

/**
 * 新しい戦闘のスナップ（段階163）：アルバムに入れられる札の一覧（スペシャルを除く）。章ごとに足していく。並びはアルバムの画面の並び
 */
export const CHAIN_SNAPS: Record<string, ChainMove> = Object.fromEntries(Object.values(CHAIN_MAIN_CARDS).filter((m) => !m.owner).map((m) => [m.id, m]));

/** 敵の種類 → その敵のスナップ（段階165） */
export const CHAIN_ENEMY_SNAPS: Record<string, string> = { ...A11_ENEMY_SNAPS, ...A12_ENEMY_SNAPS, ...A21_ENEMY_SNAPS, ...A22_ENEMY_SNAPS, ...A23_ENEMY_SNAPS };

/** 本番の札の絵と短い説明（試しにない物） */
export const CHAIN_MAIN_CARD_ART: Record<string, string> = { ...A11_CARD_ART, ...A12_CARD_ART, ...A21_CARD_ART, ...A22_CARD_ART, ...A23_CARD_ART };
export const CHAIN_MAIN_SHORT_TEXT: Record<string, string> = { ...A11_SHORT_TEXT, ...A12_SHORT_TEXT, ...A21_SHORT_TEXT, ...A22_SHORT_TEXT, ...A23_SHORT_TEXT };

/** 区画の戦闘を新しい戦闘で戦う時の中身（AREA_BATTLES の id → 中身）。札は全部の札 */
export const CHAIN_AREA_SETUPS: Record<string, ChainAreaSetup> = Object.fromEntries(
  Object.entries({ ...A11_SETUPS, ...A12_SETUPS, ...A21_SETUPS, ...A22_SETUPS, ...A23_SETUPS }).map(([id, s]) => [id, { ...s, cards: CHAIN_MAIN_CARDS }]),
);

/**
 * 新しい戦闘で戦う区画の戦闘（AREA_BATTLES の id）。段階D1（160）で 1-1 の雑魚、段階D2（162）で 1-1 のぬし、段階168・169 で 1-2、段階170・171 で 2-1、段階172・173 で 2-2、段階174 で 2-3 の雑魚。段階F で章ごとに増やす。
 * ここにない戦闘は、今の本番の戦闘のまま（デバッグメニューの切り替えで、全部を新しい戦闘にして試せる）
 */
export const CHAIN_AREA_BATTLES: string[] = Object.keys(CHAIN_AREA_SETUPS);
