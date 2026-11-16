import type { AlbumState } from './album';
import { sanitizeAlbum } from './album';
import { sanitizeLibrary, type LibraryContext, type LibraryState } from './library';
import type { AreaDef, ExploreState } from './explore';
import { normalizeExplore } from './explore';
import type { Flow } from './flow';
import { dayAt, findEvent, firstEventId } from './flow';
import type { GrowthMap, GrowthState } from './growth';
import { createGrowth } from './growth';
import { LOADOUT_MAX, type Rotation } from './navi';
import type { NaviData, NaviState, OwnedPart, PartColor, Placement } from './navi';
import { refitNavi } from './navi';
import type { Progress, Story } from './progress';
import { normalizeProgress } from './progress';
import type { ArmoryState, EvolutionStep, WeaponData, WeaponParams, WeaponState } from './weapon';
import { capItems, createArmory, naviDataWithWeapons } from './weapon';

// セーブと中断・再開（段階11）。Phaser にもブラウザの保存にも依存しない。
// セーブの中身（文字列）を作る・読む・古い版から直す・今のデータに合わせて整える、だけを受け持つ。

/** セーブの形の版。形を変えたら番号を上げ、MIGRATIONS に古い版から直す手順を足す */
export const SAVE_VERSION = 17;

/** 周回の状態のうち、セーブするもの */
export interface RunSnapshot {
  seed: number;
  fixed: boolean;
  /** 次に戦う場所と何日目か（段階13） */
  progress: Progress;
  growth: GrowthState;
  navi: NaviState;
  armory: ArmoryState;
  /** 物語の流れの、今の出来事（段階23） */
  event: string;
  /** 物語で覚えた値（プロローグで選んだ金魚の名前・景品など。段階23） */
  vars: Record<string, string>;
  /** 探索の状態（探索の途中の時だけ。段階25） */
  explore: ExploreState | null;
  /** 持ち主に返した盗まれた時間（区画の id。返した順。段階28） */
  returned: string[];
  /** 戦闘中（段階44）：閉じたら、この戦闘の始めから続ける。戦闘の外では null */
  battle: SavedBattle | null;
  /** 持っているスナップと、アルバムの中身（新しい戦闘のアルバム。段階163。版17 から必ずある） */
  chainAlbum: AlbumState;
  /** ライブラリの記録（段階167。版17 から必ずある） */
  library: LibraryState;
  /** 遊ぶ人が選んだ戦闘の並び（段階91a）。空なら章の並びのまま */
  party: string[];
}

/** 戦闘中の印（段階44）：どの戦闘か（区画の戦闘の id）と、勝った時・負けた時に開く画面 */
export interface SavedBattle {
  battle: string;
  win: { key: string; data: Record<string, unknown> };
  lose: { key: string; data: Record<string, unknown> };
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
  /** なくなった出来事 → 代わりに続ける出来事（段階40。仮の「2-3：返す」を、カイの会話に替えた） */
  renamedEvents?: Record<string, string>;
  /** 新しい戦闘のスナップと、最初のアルバム、アルバムの決まり（段階163） */
  chainCards: Record<string, { id: string }>;
  initialChainAlbum: AlbumState;
  chainAlbumRules: { size: number; copyMax: number };
  /** ライブラリに載る物（段階167） */
  library: LibraryContext;
  /** 区画の戦闘の id（段階44。戦闘中の印を整える。書かなければ、戦闘中の印は捨てる） */
  battleIds?: readonly string[];
}

/** ある版のセーブを、次の版の形に直す手順（キーは直す前の版の番号） */
export type SaveMigrations = Record<number, (raw: Record<string, unknown>) => Record<string, unknown>>;

/**
 * 古い版から直す手順。
 * 段階205（段取りの段階G6b）：版17 で、古い戦闘だけが使っていた物（古いアルバム・つながりゲージ・ギアの報酬の受け取り待ち）をセーブから外し、
 * 版3〜16 を直す手順は消した。前の版のセーブは、直す手順がない古いセーブとして、読まずにはじめから（開発者と決めた。今までのセーブは使っていないので、今後を優先）。
 * 次に形を変える時は、ここに MIGRATIONS[17] から足す
 */
export const MIGRATIONS: SaveMigrations = {};

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
  const { seed, fixed } = raw;
  if (!isInt(seed) || typeof fixed !== 'boolean' || !isObject(raw.progress)) return null;
  if (!isObject(raw.growth) || !isObject(raw.navi) || !isObject(raw.armory)) return null;
  if (typeof raw.event !== 'string' || !isObject(raw.vars)) return null;
  // なくなった出来事は代わりの出来事から。今の流れにない出来事なら、最初の出来事から
  const renamed = ctx.renamedEvents?.[raw.event] ?? raw.event;
  const event = findEvent(ctx.flow, renamed) ? renamed : firstEventId(ctx.flow);
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
    armory,
    event,
    vars: stringsOf(raw.vars),
    explore: sanitizeExplore(raw.explore, ctx),
    // 今の区画にないものと、重なりは捨てる
    returned: Array.isArray(raw.returned) ? [...new Set(raw.returned.filter((x): x is string => typeof x === 'string' && x in ctx.areas))] : [],
    chainAlbum: sanitizeAlbum(raw.chainAlbum, ctx.chainCards, ctx.initialChainAlbum, ctx.chainAlbumRules.size, ctx.chainAlbumRules.copyMax),
    library: sanitizeLibrary(raw.library, ctx.library),
    battle: sanitizeBattle(raw.battle, ctx),
    // 知らない仲間と、重なりは捨てる（段階91a）
    party: Array.isArray(raw.party) ? [...new Set(raw.party.filter((x): x is string => typeof x === 'string' && ctx.characterIds.includes(x)))] : [],
  };
}

/** 戦闘中の印：今のデータにない戦闘・形の違うものは捨てる（段階44） */
function sanitizeBattle(raw: unknown, ctx: SaveContext): SavedBattle | null {
  const target = (t: unknown): t is { key: string; data: Record<string, unknown> } => isObject(t) && typeof t.key === 'string' && isObject(t.data);
  if (!isObject(raw) || typeof raw.battle !== 'string' || !ctx.battleIds?.includes(raw.battle)) return null;
  if (!target(raw.win) || !target(raw.lose)) return null;
  return { battle: raw.battle, win: { key: raw.win.key, data: { ...raw.win.data } }, lose: { key: raw.lose.key, data: { ...raw.lose.data } } };
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
  // 2本目（段階223）：しまってある方。前の版のセーブにはないので、なければ持っている1本だけ（セーブの版は変えない）
  const spare: Record<string, WeaponState> = {};
  if (isObject(raw.spare))
    for (const [owner, base] of Object.entries(fresh.weapons)) {
      const w = raw.spare[owner];
      if (isObject(w) && w.defId === base.defId) spare[owner] = sanitizeWeapon(w, base, data);
    }
  // 持てる数のある物は、持てる数にそろえる（段階204 で消費アイテムをなくしたので、今は持てる数のある物はない）
  return capItems(data, { weapons, items: countsOf(raw.items, data.items), fragments: countsOf(raw.fragments, data.fragments), ...(Object.keys(spare).length ? { spare } : {}) }).armory;
}

function sanitizeWeapon(raw: Record<string, unknown>, base: WeaponState, data: WeaponData): WeaponState {
  const params = { ...base.params };
  if (isObject(raw.params)) for (const k of Object.keys(params) as (keyof WeaponParams)[]) if (isInt(raw.params[k])) params[k] = raw.params[k];
  const tendency = { ...base.tendency };
  if (isObject(raw.tendency)) for (const k of Object.keys(tendency) as PartColor[]) if (isInt(raw.tendency[k])) tendency[k] = Math.max(0, raw.tendency[k]);
  // 通った進化先：親から順につながっている所までを残す（今のデータにない進化先・まだ作っていない先・知らない型で切る）
  const def = data.weapons[base.defId];
  const path: EvolutionStep[] = [];
  for (const step of Array.isArray(raw.path) ? raw.path : []) {
    if (!isObject(step) || typeof step.id !== 'string' || !isInt(step.style)) break;
    const evo = def.evolutions.find((e) => e.id === step.id);
    if (!evo || evo.sealed || evo.from !== path[path.length - 1]?.id || step.style < 0 || step.style >= (evo.styles?.length ?? 0)) break;
    path.push({ id: step.id, style: step.style });
  }
  const absorbed = isInt(raw.absorbed) ? Math.max(0, raw.absorbed) : 0;
  return { defId: base.defId, params, exp: isInt(raw.exp) ? Math.max(0, raw.exp) : 0, tendency, path, absorbed, ...(raw.copy === true ? { copy: true } : {}) };
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
  navi = refitNavi(data, { ...navi, parts: owned.map((p) => ({ uid: p.uid, partId: p.partId, placement: p.placement })) });
  // 保存した並べ方（段階201）：形の合う物だけ残す（ギアを持っていない・置けない物は、付け替える時に飛ばす）
  const loadouts = sanitizeLoadouts(raw.loadouts);
  return loadouts ? { ...navi, loadouts } : navi;
}

function sanitizeLoadouts(raw: unknown): NaviState['loadouts'] | undefined {
  if (!isObject(raw)) return undefined;
  const out: NonNullable<NaviState['loadouts']> = {};
  for (const [charId, list] of Object.entries(raw)) {
    if (!Array.isArray(list)) continue;
    out[charId] = list.slice(0, LOADOUT_MAX).map((l) => {
      if (!isObject(l) || typeof l.name !== 'string' || !Array.isArray(l.parts)) return null;
      const parts = l.parts.flatMap((p) => {
        if (!isObject(p) || !isInt(p.uid) || !isInt(p.col) || !isInt(p.row)) return [];
        const rotation = p.rotation;
        if (rotation !== 0 && rotation !== 1 && rotation !== 2 && rotation !== 3) return [];
        return [{ uid: p.uid, col: p.col, row: p.row, rotation: rotation as Rotation }];
      });
      return { name: l.name.slice(0, 20), parts };
    });
  }
  return Object.keys(out).length ? out : undefined;
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
