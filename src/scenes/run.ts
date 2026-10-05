import type { BattleState, CharacterDef, GrowthState } from '../core';
import { applyGrowth, createGrowth } from '../core';
import { GROWTH_MAP, PARTY, SKILLS, START_MEMORY_POINTS } from '../data';

/**
 * 1回の通しプレイ（成長マップと5戦の周回）の状態。
 * シードを固定していない時は、最初から始めるたび・戦闘をやり直すたびに新しいシードにする。
 * セーブはしない（ページを閉じると最初から）
 */
export const run: { seed: number; fixed: boolean; stage: number; growth: GrowthState } = {
  seed: 0,
  fixed: false,
  /** 次に戦う戦闘の番号（0から） */
  stage: 0,
  growth: createGrowth(GROWTH_MAP, PARTY.map((c) => c.id), START_MEMORY_POINTS),
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

/** 最初から始める（成長もリセット） */
export function startNewRun(): void {
  rerollSeed();
  run.stage = 0;
  run.growth = createGrowth(GROWTH_MAP, PARTY.map((c) => c.id), START_MEMORY_POINTS);
}

/** 戦闘ごとのシード。戦闘ごとに別の並びになるよう、番号の分ずらす */
export function battleSeed(stage: number): number {
  return (run.seed + stage) >>> 0;
}

/** 成長を反映した仲間 */
export function currentParty(): CharacterDef[] {
  return applyGrowth(GROWTH_MAP, run.growth, PARTY, SKILLS);
}

/** デバッグメニューから今の戦闘を操作するための窓口 */
export interface ActiveBattle {
  stage: number;
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
