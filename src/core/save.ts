import type { AreaDef, ExploreState } from './explore';
import { normalizeExplore } from './explore';
import type { Flow } from './flow';
import { dayAt, findEvent, firstEventId } from './flow';
import type { GrowthMap, GrowthState } from './growth';
import { createGrowth } from './growth';
import type { NaviData, NaviState, OwnedPart, PartColor, Placement } from './navi';
import { getPlaceError, placePart } from './navi';
import type { Progress, Story } from './progress';
import { findBattle, normalizeProgress } from './progress';
import type { ArmoryState, WeaponData, WeaponParams, WeaponState } from './weapon';
import { createArmory, naviDataWithWeapons } from './weapon';

// セーブと中断・再開（段階11）。Phaser にもブラウザの保存にも依存しない。
// セーブの中身（文字列）を作る・読む・古い版から直す・今のデータに合わせて整える、だけを受け持つ。

/** セーブの形の版。形を変えたら番号を上げ、MIGRATIONS に古い版から直す手順を足す */
export const SAVE_VERSION = 4;

/** 試作の1章・1区画（5戦）の id（版1のセーブを版2に直す時に使っていた。版3からは古いセーブを引き継がない） */
export const V1_CHAPTER_ID = 'prototype';
export const V1_AREA_ID = 'trial';
export const v1BattleId = (stage: number): string => `battle${stage + 1}`;

/** 周回の状態のうち、セーブするもの */
export interface RunSnapshot {
  seed: number;
  fixed: boolean;
  /** 次に戦う場所と何日目か（段階13。版1では stage：次に戦う戦闘の番号） */
  progress: Progress;
  growth: GrowthState;
  navi: NaviState;
  /** まだ受け取っていないギアの報酬（勝った戦闘の名前。版1では戦闘の番号） */
  pendingReward: string | null;
  armory: ArmoryState;
  /** 物語の流れの、今の出来事（段階23。版3から） */
  event: string;
  /** 物語で覚えた値（プロローグで選んだ金魚の名前・景品など。段階23。版3から） */
  vars: Record<string, string>;
  /** 探索の状態（探索の途中の時だけ。段階25。版4から） */
  explore: ExploreState | null;
}

export interface SaveData {
  version: number;
  /** 保存した日時（ISO 8601） */
  savedAt: string;
  run: RunSnapshot;
}

/** セーブを読む時に、今のデータに合わせて整えるための材料 */
export interface SaveContext {
  growthMap: GrowthMap;
  characterIds: string[];
  startPoints: number;
  naviData: NaviData;
  weaponData: WeaponData;
  /** 章 → 区画 → 戦闘 */
  story: Story;
  /** 物語の流れ（章 → 出来事。段階23） */
  flow: Flow;
  /** 探索の区画（段階25） */
  areas: Record<string, AreaDef>;
}

/** ある版のセーブを、次の版の形に直す手順（キーは直す前の版の番号） */
export type SaveMigrations = Record<number, (raw: Record<string, unknown>) => Record<string, unknown>>;

/**
 * 古い版から直す手順。
 * 版1・2（試作の5戦だけのセーブ）は、スライスの流れ（段階23）には引き継がない（開発者と決めた）。手順を置かないので、読めない古いセーブとして扱う
 */
export const MIGRATIONS: SaveMigrations = {
  // 版3 → 版4（段階25）：探索の状態を足す（版3の時は、まだ探索がなかった）
  3: (raw) => (isObject(raw.run) ? { ...raw, run: { ...raw.run, explore: null } } : raw),
};

/** old は、直す手順がない古い版のセーブ（壊れているのではないので、タイトルでは知らせずに片付ける） */
export type LoadResult = { ok: true; save: SaveData } | { ok: false; error: string; old?: true };

export function serializeSave(run: RunSnapshot, savedAt: Date): string {
  const data: SaveData = { version: SAVE_VERSION, savedAt: savedAt.toISOString(), run };
  return JSON.stringify(data);
}

/** 文字列のセーブを読み、今の版の形に直して、今のデータに合わせて整える */
export function parseSave(text: string, ctx: SaveContext, migrations: SaveMigrations = MIGRATIONS, version = SAVE_VERSION): LoadResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'JSON として読めない' };
  }
  if (!isObject(raw) || typeof raw.version !== 'number' || !Number.isInteger(raw.version)) return { ok: false, error: '版の番号がない' };
  if (raw.version > version) return { ok: false, error: `新しい版（${raw.version}）のセーブは読めない` };
  let cur: Record<string, unknown> = raw;
  while ((cur.version as number) < version) {
    const from = cur.version as number;
    const step = migrations[from];
    if (!step) return { ok: false, error: `版${from}から直す手順がない`, old: true };
    cur = { ...step(cur), version: from + 1 };
  }
  if (typeof cur.savedAt !== 'string' || !isObject(cur.run)) return { ok: false, error: '中身が足りない' };
  const run = sanitizeRun(cur.run, ctx);
  if (!run) return { ok: false, error: '周回の状態が壊れている' };
  return { ok: true, save: { version, savedAt: cur.savedAt, run } };
}

/**
 * 周回の状態を、今のデータに合わせて整える。
 * 今のデータにない名前は捨て、足りないキャラや武器は初めの状態で補う。ギアは今の盤に置き直す。
 * 形がまったく違う（数のはずが文字など）時は null
 */
export function sanitizeRun(raw: Record<string, unknown>, ctx: SaveContext): RunSnapshot | null {
  const { seed, fixed, pendingReward } = raw;
  if (!isInt(seed) || typeof fixed !== 'boolean' || !isObject(raw.progress)) return null;
  if (pendingReward !== null && typeof pendingReward !== 'string') return null;
  if (!isObject(raw.growth) || !isObject(raw.navi) || !isObject(raw.armory)) return null;
  if (typeof raw.event !== 'string' || !isObject(raw.vars)) return null;
  // 今の流れにない出来事なら、最初の出来事から
  const event = findEvent(ctx.flow, raw.event) ? raw.event : firstEventId(ctx.flow);
  const growth = sanitizeGrowth(raw.growth, ctx);
  const armory = sanitizeArmory(raw.armory, ctx.weaponData);
  if (!growth || !armory) return null;
  const navi = sanitizeNavi(raw.navi, naviDataWithWeapons(ctx.naviData, ctx.weaponData, armory));
  if (!navi) return null;
  return {
    seed: seed >>> 0,
    fixed,
    // 何日目は、今の出来事に合わせる
    progress: { ...normalizeProgress(ctx.story, raw.progress as Partial<Progress>), day: dayAt(ctx.flow, event) },
    growth,
    navi,
    // 今のデータにない戦闘の報酬は捨てる
    pendingReward: pendingReward !== null && findBattle(ctx.story, pendingReward) ? pendingReward : null,
    armory,
    event,
    vars: stringsOf(raw.vars),
    explore: sanitizeExplore(raw.explore, ctx),
  };
}

function sanitizeGrowth(raw: Record<string, unknown>, ctx: SaveContext): GrowthState | null {
  if (!isInt(raw.points) || !isObject(raw.opened)) return null;
  const fresh = createGrowth(ctx.growthMap, ctx.characterIds, ctx.startPoints);
  const nodeIds = new Set(ctx.growthMap.nodes.map((n) => n.id));
  const opened: Record<string, string[]> = {};
  for (const id of ctx.characterIds) {
    const list = raw.opened[id];
    const kept = Array.isArray(list) ? list.filter((n): n is string => typeof n === 'string' && nodeIds.has(n)) : [];
    // 出発点は必ず開いている
    opened[id] = kept.length > 0 ? [...new Set([...fresh.opened[id], ...kept])] : fresh.opened[id];
  }
  return { points: Math.max(0, raw.points), opened };
}

function sanitizeArmory(raw: Record<string, unknown>, data: WeaponData): ArmoryState | null {
  if (!isObject(raw.weapons) || !isObject(raw.items) || !isObject(raw.fragments)) return null;
  const fresh = createArmory(data);
  const weapons: Record<string, WeaponState> = {};
  for (const [owner, base] of Object.entries(fresh.weapons)) {
    const w = raw.weapons[owner];
    weapons[owner] = isObject(w) && w.defId === base.defId ? sanitizeWeapon(w, base, data) : base;
  }
  return { weapons, items: countsOf(raw.items, data.items), fragments: countsOf(raw.fragments, data.fragments) };
}

function sanitizeWeapon(raw: Record<string, unknown>, base: WeaponState, data: WeaponData): WeaponState {
  const params = { ...base.params };
  if (isObject(raw.params)) for (const k of Object.keys(params) as (keyof WeaponParams)[]) if (isInt(raw.params[k])) params[k] = raw.params[k];
  const tendency = { ...base.tendency };
  if (isObject(raw.tendency)) for (const k of Object.keys(tendency) as PartColor[]) if (isInt(raw.tendency[k])) tendency[k] = Math.max(0, raw.tendency[k]);
  const evolutions = data.weapons[base.defId].evolutions;
  const evolvedTo = typeof raw.evolvedTo === 'string' && evolutions.some((e) => e.id === raw.evolvedTo) ? raw.evolvedTo : null;
  return { defId: base.defId, params, exp: isInt(raw.exp) ? Math.max(0, raw.exp) : 0, tendency, evolvedTo };
}

function sanitizeNavi(raw: Record<string, unknown>, data: NaviData): NaviState | null {
  if (!Array.isArray(raw.parts) || !isInt(raw.nextUid)) return null;
  const owned: { uid: number; partId: string; placement: Placement | null }[] = [];
  const uids = new Set<number>();
  for (const p of raw.parts) {
    if (!isObject(p) || !isInt(p.uid) || typeof p.partId !== 'string' || !data.parts[p.partId] || uids.has(p.uid)) continue;
    uids.add(p.uid);
    owned.push({ uid: p.uid, partId: p.partId, placement: toPlacement(p.placement) });
  }
  // いったん全部外してから、はめた順（持ち物の順）に今の盤へ置き直す。置けないものは外したままにする
  let navi: NaviState = {
    parts: owned.map((p): OwnedPart => ({ uid: p.uid, partId: p.partId, placement: null })),
    nextUid: Math.max(raw.nextUid, ...owned.map((p) => p.uid + 1), 0),
  };
  for (const p of owned) {
    if (p.placement && !getPlaceError(data, navi, p.uid, p.placement)) navi = placePart(data, navi, p.uid, p.placement);
  }
  return navi;
}

function toPlacement(raw: unknown): Placement | null {
  if (!isObject(raw)) return null;
  const { charId, col, row, rotation } = raw;
  if (typeof charId !== 'string' || !isInt(col) || !isInt(row)) return null;
  if (rotation !== 0 && rotation !== 1 && rotation !== 2 && rotation !== 3) return null;
  return { charId, col, row, rotation };
}

/** 数の表から、今のデータにある名前で、0より大きい整数だけを残す */
function countsOf(raw: Record<string, unknown>, known: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, n] of Object.entries(raw)) if (known[id] && isInt(n) && n > 0) out[id] = n;
  return out;
}

/** 探索の状態を、今の区画に合わせて整える。知らない区画・壊れた形なら、探索の途中ではないことにする */
function sanitizeExplore(raw: unknown, ctx: SaveContext): ExploreState | null {
  if (!isObject(raw) || typeof raw.area !== 'string') return null;
  const area = ctx.areas[raw.area];
  return area ? normalizeExplore(area, raw) : null;
}

/** 文字の値だけを残す */
function stringsOf(raw: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) if (typeof v === 'string') out[k] = v;
  return out;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v);
}
