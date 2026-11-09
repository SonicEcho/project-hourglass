import type { Element } from './types';

// ライブラリの記録（段階167。docs/design/run.md）：見つけた物の記録。アルバム（20枚を組む道具）とは別。
// まだ見つけていない物は、画面で「？？？」として並べる。周回のセーブに入れる（新しく始めると空から）

export interface LibraryState {
  /** 会った敵（敵の id → 会った数） */
  met: Record<string, number>;
  /** 倒した敵（敵の id → 倒した数） */
  defeated: Record<string, number>;
  /** 分かった弱点（敵の id → 属性）。戦闘で当てて分かった物 */
  weak: Record<string, Element[]>;
  /** 手に入れたことのあるスナップ（手に入れた順） */
  snaps: string[];
  /** 見つけたコンボ（見つけた順） */
  combos: string[];
  /** 手に入れたことのある素材・アイテム（手に入れた順） */
  items: string[];
}

export function createLibrary(): LibraryState {
  return { met: {}, defeated: {}, weak: {}, snaps: [], combos: [], items: [] };
}

function addUnique(list: readonly string[], add: readonly string[]): string[] {
  const out = [...list];
  for (const id of add) if (!out.includes(id)) out.push(id);
  return out;
}

function addCounts(counts: Record<string, number>, ids: readonly string[]): Record<string, number> {
  const out = { ...counts };
  for (const id of ids) out[id] = (out[id] ?? 0) + 1;
  return out;
}

/** 戦闘の記録：会った敵・倒した敵（1体ごとに数える）と、分かった弱点（今までの物に足す） */
export function recordLibraryBattle(lib: LibraryState, r: { met: readonly string[]; defeated: readonly string[]; weak?: Readonly<Record<string, readonly Element[]>> }): LibraryState {
  const weak: Record<string, Element[]> = Object.fromEntries(Object.entries(lib.weak).map(([k, v]) => [k, [...v]]));
  for (const [id, list] of Object.entries(r.weak ?? {})) {
    if (!list.length) continue;
    weak[id] = addUnique(weak[id] ?? [], list) as Element[];
  }
  return { ...lib, met: addCounts(lib.met, r.met), defeated: addCounts(lib.defeated, r.defeated), weak };
}

/** 手に入れた物の記録：スナップ・コンボ・素材（重なりは足さない） */
export function recordLibraryFinds(lib: LibraryState, f: { snaps?: readonly string[]; combos?: readonly string[]; items?: readonly string[] }): LibraryState {
  return {
    ...lib,
    snaps: addUnique(lib.snaps, f.snaps ?? []),
    combos: addUnique(lib.combos, f.combos ?? []),
    items: addUnique(lib.items, f.items ?? []),
  };
}

/** セーブを読む時に、今のデータに合わせて整える材料（今のデータにない id は捨てる） */
export interface LibraryContext {
  enemies: readonly string[];
  snaps: readonly string[];
  combos: readonly string[];
  items: readonly string[];
}

const ELEMENTS: readonly Element[] = ['physical', 'fire', 'ice', 'thunder'];

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function idsOf(raw: unknown, known: readonly string[]): string[] {
  return Array.isArray(raw) ? addUnique([], raw.filter((x): x is string => typeof x === 'string' && known.includes(x))) : [];
}

function countsOf(raw: unknown, known: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {};
  if (!isObj(raw)) return out;
  for (const [k, v] of Object.entries(raw)) if (known.includes(k) && typeof v === 'number' && Number.isFinite(v) && v > 0) out[k] = Math.floor(v);
  return out;
}

/** 形の違う物・今のデータにない物を捨てて読む。形がまったく違えば空のライブラリ */
export function sanitizeLibrary(raw: unknown, ctx: LibraryContext): LibraryState {
  if (!isObj(raw)) return createLibrary();
  const weak: Record<string, Element[]> = {};
  if (isObj(raw.weak)) {
    for (const [k, v] of Object.entries(raw.weak)) {
      if (!ctx.enemies.includes(k) || !Array.isArray(v)) continue;
      const list = addUnique([], v.filter((x): x is Element => typeof x === 'string' && (ELEMENTS as readonly string[]).includes(x))) as Element[];
      if (list.length) weak[k] = list;
    }
  }
  return {
    met: countsOf(raw.met, ctx.enemies),
    defeated: countsOf(raw.defeated, ctx.enemies),
    weak,
    snaps: idsOf(raw.snaps, ctx.snaps),
    combos: idsOf(raw.combos, ctx.combos),
    items: idsOf(raw.items, ctx.items),
  };
}
