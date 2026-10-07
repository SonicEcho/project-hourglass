import type { ArmoryState, BattleState, CharacterDef, GrowthState, LoadResult, NaviData, NaviState, RunSnapshot, SaveContext } from '../core';
import { applyGrowth, applyNavi, applyWeapons, createArmory, createGrowth, createNavi, naviDataWithWeapons, parseSave, serializeSave } from '../core';
import { CAMPAIGN, GROWTH_MAP, NAVI_DATA, PARTY, SKILLS, START_MEMORY_POINTS, START_NAVI_PARTS, WEAPON_DATA } from '../data';
import type { SaveStorage } from '../save/storage';
import { browserStorage } from '../save/storage';

/**
 * 1回の通しプレイ（星図と5戦の周回）の状態。
 * シードを固定していない時は、最初から始めるたび・戦闘をやり直すたびに新しいシードにする。
 * 戦闘の外の状態は自動でセーブする（段階11。下の saveRun）
 */
export const run: {
  /** 自動のセーブをするか（周回を始めた・続けた時に true、ボスに勝って周回を終えたら false） */
  active: boolean;
  seed: number;
  fixed: boolean;
  stage: number;
  growth: GrowthState;
  /** ムーブメントのギア（持ち物と、どの盤のどこにはめたか） */
  navi: NaviState;
  /** まだ受け取っていない勝利の報酬（ギアの候補）。戦闘の番号（0から） */
  pendingReward: number | null;
  /** 武器と記憶の欠片 */
  armory: ArmoryState;
} = {
  active: false,
  seed: 0,
  fixed: false,
  /** 次に戦う戦闘の番号（0から） */
  stage: 0,
  growth: createGrowth(GROWTH_MAP, PARTY.map((c) => c.id), START_MEMORY_POINTS),
  navi: createNavi(START_NAVI_PARTS),
  pendingReward: null,
  armory: createArmory(WEAPON_DATA),
};

/** URL の ?seed= で固定したシード（なければ null） */
let urlSeed: number | null = null;

export function initRunFromUrl(): void {
  const v = new URLSearchParams(window.location.search).get('seed');
  if (v !== null && v !== '' && !Number.isNaN(Number(v))) {
    urlSeed = Number(v) >>> 0;
    run.seed = urlSeed;
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
  run.active = true;
  rerollSeed();
  run.stage = 0;
  run.growth = createGrowth(GROWTH_MAP, PARTY.map((c) => c.id), START_MEMORY_POINTS);
  run.navi = createNavi(START_NAVI_PARTS);
  run.pendingReward = null;
  run.armory = createArmory(WEAPON_DATA);
  saveRun();
}

// ---- セーブ（段階11） ----

/** 自動のセーブの場所。壊れて読めなかったセーブは、消さずに BROKEN_KEY に移す */
export const SAVE_KEY = 'restopia.save.auto';
export const BROKEN_KEY = 'restopia.save.broken';

let storage: SaveStorage = browserStorage();
/** 最後に書き込んだ中身（同じなら書き込まない） */
let lastWritten: string | null = null;

/** 保存の場所を差し替える（テストやアプリ用） */
export function setSaveStorage(s: SaveStorage): void {
  storage = s;
  lastWritten = null;
}

export function saveContext(): SaveContext {
  return {
    growthMap: GROWTH_MAP,
    characterIds: PARTY.map((c) => c.id),
    startPoints: START_MEMORY_POINTS,
    naviData: NAVI_DATA,
    weaponData: WEAPON_DATA,
    stageCount: CAMPAIGN.length,
  };
}

function snapshot(): RunSnapshot {
  return { seed: run.seed, fixed: run.fixed, stage: run.stage, growth: run.growth, navi: run.navi, pendingReward: run.pendingReward, armory: run.armory };
}

/** 今の周回の状態を保存する。周回の外（タイトル、クリア後）では何もしない。中身が前と同じなら書き込まない */
export function saveRun(): void {
  if (!run.active) return;
  const text = serializeSave(snapshot(), new Date());
  // 日時を除いた中身で比べる
  const body = JSON.stringify(snapshot());
  if (body === lastWritten) return;
  if (storage.write(SAVE_KEY, text)) lastWritten = body;
}

/** セーブを読む（なければ null）。読めない時は error */
export function readSave(): LoadResult | null {
  const text = storage.read(SAVE_KEY);
  if (text === null) return null;
  return parseSave(text, saveContext());
}

/** セーブの生の中身（デバッグ用） */
export function readSaveText(): string | null {
  return storage.read(SAVE_KEY);
}

/** 読めなかったセーブを、消さずに別の場所へ移す */
export function moveBrokenSave(): void {
  const text = storage.read(SAVE_KEY);
  if (text !== null) storage.write(BROKEN_KEY, text);
  storage.remove(SAVE_KEY);
  lastWritten = null;
}

export function deleteSave(): void {
  storage.remove(SAVE_KEY);
  lastWritten = null;
}

/** セーブから続ける。読めたら true。URL の ?seed= がある時は、そのシードを優先する */
export function continueRun(): boolean {
  const r = readSave();
  if (!r || !r.ok) return false;
  const s = r.save.run;
  run.seed = urlSeed ?? s.seed;
  run.fixed = urlSeed !== null || s.fixed;
  run.stage = s.stage;
  run.growth = s.growth;
  run.navi = s.navi;
  run.pendingReward = s.pendingReward;
  run.armory = s.armory;
  run.active = true;
  lastWritten = null;
  saveRun();
  return true;
}

/** 周回を終えた（ボスに勝った）。セーブを消し、自動のセーブを止める */
export function finishRun(): void {
  run.active = false;
  deleteSave();
}

/** 戦闘ごとのシード。戦闘ごとに別の並びになるよう、番号の分ずらす */
export function battleSeed(stage: number): number {
  return (run.seed + stage) >>> 0;
}

/** 今のムーブメントのデータ（武器の進化で広がった盤） */
export function currentNaviData(): NaviData {
  return naviDataWithWeapons(NAVI_DATA, WEAPON_DATA, run.armory);
}

/** 成長を反映した仲間（星図 → ムーブメント → 武器の順に反映する） */
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
