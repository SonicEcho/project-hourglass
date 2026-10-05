import type { ArmoryState, BattleState, CharacterDef, GrowthState, NaviData, NaviState } from '../core';
import { applyGrowth, applyNavi, applyWeapons, createArmory, createGrowth, createNavi, naviDataWithWeapons } from '../core';
import { GROWTH_MAP, NAVI_DATA, PARTY, SKILLS, START_MEMORY_POINTS, START_NAVI_PARTS, WEAPON_DATA } from '../data';

/**
 * 1回の通しプレイ（成長マップと5戦の周回）の状態。
 * シードを固定していない時は、最初から始めるたび・戦闘をやり直すたびに新しいシードにする。
 * セーブはしない（ページを閉じると最初から）
 */
export const run: {
  seed: number;
  fixed: boolean;
  stage: number;
  growth: GrowthState;
  /** ナビカス盤のパーツ（持ち物と、どの盤のどこにはめたか） */
  navi: NaviState;
  /** まだ受け取っていない勝利の報酬（パーツの候補）。戦闘の番号（0から） */
  pendingReward: number | null;
  /** 武器と記憶の断片 */
  armory: ArmoryState;
} = {
  seed: 0,
  fixed: false,
  /** 次に戦う戦闘の番号（0から） */
  stage: 0,
  growth: createGrowth(GROWTH_MAP, PARTY.map((c) => c.id), START_MEMORY_POINTS),
  navi: createNavi(START_NAVI_PARTS),
  pendingReward: null,
  armory: createArmory(WEAPON_DATA),
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
  run.navi = createNavi(START_NAVI_PARTS);
  run.pendingReward = null;
  run.armory = createArmory(WEAPON_DATA);
}

/** 戦闘ごとのシード。戦闘ごとに別の並びになるよう、番号の分ずらす */
export function battleSeed(stage: number): number {
  return (run.seed + stage) >>> 0;
}

/** 今のナビカス盤のデータ（武器の進化で広がった盤） */
export function currentNaviData(): NaviData {
  return naviDataWithWeapons(NAVI_DATA, WEAPON_DATA, run.armory);
}

/** 成長を反映した仲間（成長マップ → ナビカス盤 → 武器の順に反映する） */
export function currentParty(): CharacterDef[] {
  const grown = applyGrowth(GROWTH_MAP, run.growth, PARTY, SKILLS);
  return applyWeapons(WEAPON_DATA, run.armory, applyNavi(currentNaviData(), run.navi, grown));
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
