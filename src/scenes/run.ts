import type { BattleState } from '../core';
import type { EncounterId } from '../data';

/**
 * 1回の通しプレイ（戦闘1 → ボス戦）の乱数のシード。
 * 固定していない時は、最初から始めるたび・ボス戦をやり直すたびに新しいシードにする。
 */
export const run = {
  seed: 0,
  fixed: false,
};

export function initRunFromUrl(): void {
  const v = new URLSearchParams(window.location.search).get('seed');
  if (v !== null && v !== '' && !Number.isNaN(Number(v))) {
    run.seed = Number(v) >>> 0;
    run.fixed = true;
  } else {
    run.seed = randomSeed();
  }
}

function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

/** 新しく始める時に呼ぶ。固定中ならシードを変えない */
export function rerollSeed(): void {
  if (!run.fixed) run.seed = randomSeed();
}

/** 戦闘ごとのシード。戦闘2は戦闘1と別の並びになるよう1ずらす */
export function battleSeed(encounter: EncounterId): number {
  return (run.seed + (encounter === 'battle2' ? 1 : 0)) >>> 0;
}

/** デバッグメニューから今の戦闘を操作するための窓口 */
export interface ActiveBattle {
  encounter: EncounterId;
  getState(): BattleState;
  /** 演出中なら false を返して何もしない */
  replaceState(s: BattleState): boolean;
}

let active: ActiveBattle | null = null;

export function setActiveBattle(b: ActiveBattle | null): void {
  active = b;
}

export function getActiveBattle(): ActiveBattle | null {
  return active;
}
