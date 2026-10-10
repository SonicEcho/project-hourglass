// 探索（段階25）：区画の地図を歩き、宝箱を開け、敵の印に触れて戦い、チェックポイントで記録する。Phaser に依存しない。
// 区画の中身（地図・宝箱・敵・会話のきっかけ）は data 側が決める。ここでは探索の状態と、その変え方だけを扱う
import type { GridCell, GridMap } from './grid';
import type { Vitals } from './types';
import { findPath, isWalkable, parseGrid } from './grid';

/** 宝箱：開けると素材・アイテムが持ち物に入る */
export interface AreaChest {
  id: string;
  cell: GridCell;
  items: string[];
}

/** 敵の印：決まった道を行き来する。触れると戦闘（battle は区画の戦闘の id） */
export interface AreaEnemy {
  id: string;
  /** 行き来する道の折り返しの点（最初の点から始まる） */
  patrol: GridCell[];
  battle: string;
}

/** 区画の奥のボスの印（動かない） */
export interface AreaBoss {
  id: string;
  cell: GridCell;
  battle: string;
}

/** 話せる人（写しの人々）。隣のマスに来るか、タップすると会話の場面 */
export interface AreaTalker {
  id: string;
  cell: GridCell;
  scene: string;
  label: string;
}

/** 探索の途中の会話のきっかけ（1回だけ） */
export type AreaTrigger =
  /** 敵に n 回勝った時 */
  | { on: 'wins'; count: number; scene: string }
  /** 返すのに要るコマの残りが left 以下になった時（まだそろっていない時。段階28） */
  | { on: 'komaLeft'; left: number; scene: string }
  /** チェックポイントに初めて着いた時 */
  | { on: 'checkpoint'; scene: string }
  /** ボスの印に触れた時（会話の後でボスと戦う） */
  | { on: 'boss'; scene: string }
  /** ボスに勝った時（会話の後で区画を出る） */
  | { on: 'cleared'; scene: string };

export interface AreaDef {
  id: string;
  name: string;
  /** 歩ける場所の文字の地図（# は通れない、S 出発点、P チェックポイント、ほかは通れる） */
  layout: string[];
  /** 地図の絵（台帳の id）。なければ図形で描く */
  image?: string;
  bgm?: string;
  chests: AreaChest[];
  enemies: AreaEnemy[];
  boss: AreaBoss;
  talkers: AreaTalker[];
  triggers: AreaTrigger[];
  /** 盗まれた時間を返すのに要るコマの数（段階28） */
  komaNeed: number;
  /** 返す画面の札に書く、盗まれた時間の名前と持ち主（段階28） */
  timeTitle?: string;
  owner?: string;
}

/** 探索の状態（セーブする） */
export interface ExploreState {
  area: string;
  /** いるマス */
  cell: GridCell;
  /** 最後に記録したチェックポイント（なければ出発点） */
  checkpoint: GridCell;
  openedChests: string[];
  /** 倒した敵の印 */
  defeated: string[];
  /** 見た会話のきっかけ（場面の id） */
  seen: string[];
  /** ボスに勝ったか */
  cleared: boolean;
  /** 集めたコマの数（段階28） */
  koma: number;
  /**
   * 前の戦闘から持ち越す仲間の HP・MP（段階32b 調整3）。なければ全回復。
   * 区画の中の戦闘は、勝ったら残りを次の戦闘へ持ち越す。チェックポイントに着くと全回復、負けてチェックポイントへ戻る時も全回復
   */
  vitals?: Record<string, Vitals>;
}

/** 区画の歩ける地図。宝箱のマスは通れない（上を歩けない。段階27b の時の調整） */
export function areaGrid(area: AreaDef): GridMap {
  const map = parseGrid(area.layout);
  const blocked = [...map.blocked];
  for (const c of area.chests) if (c.cell[0] >= 0 && c.cell[0] < map.cols && c.cell[1] >= 0 && c.cell[1] < map.rows) blocked[c.cell[1] * map.cols + c.cell[0]] = true;
  return { ...map, blocked };
}

/** 文字の地図の中の、ある記号のマス */
export function cellsOf(area: AreaDef, ch: string): GridCell[] {
  const out: GridCell[] = [];
  area.layout.forEach((line, r) => [...line].forEach((c, col) => c === ch && out.push([col, r])));
  return out;
}

export function startExplore(area: AreaDef): ExploreState {
  const start = cellsOf(area, 'S')[0];
  if (!start) throw new Error(`no start in ${area.id}`);
  return { area: area.id, cell: start, checkpoint: start, openedChests: [], defeated: [], seen: [], cleared: false, koma: 0 };
}

const same = (a: GridCell, b: GridCell): boolean => a[0] === b[0] && a[1] === b[1];

/** マスに着いた時の出来事 */
export type ArriveEvent = { type: 'checkpoint'; first: boolean; healed: boolean } | { type: 'none' };

/**
 * マスに着いた。チェックポイントなら記録する（新しい状態と出来事を返す）。
 * 宝箱は、通っただけでは開かない（タップして隣まで来た時に openChest で開ける）
 */
export function arrive(area: AreaDef, state: ExploreState, cell: GridCell): { state: ExploreState; event: ArriveEvent } {
  const next: ExploreState = { ...state, cell };
  if (cellsOf(area, 'P').some((p) => same(p, cell))) {
    // まだどのチェックポイントでも記録していなかった（出発点のまま）なら、初めて
    const first = cellsOf(area, 'P').every((p) => !same(p, state.checkpoint));
    // チェックポイントに着くと、HP・MP が全回復する（段階32b 調整3）
    const { vitals, ...rest } = next;
    return { state: { ...rest, checkpoint: cell }, event: { type: 'checkpoint', first, healed: vitals !== undefined } };
  }
  return { state: next, event: { type: 'none' } };
}

/** そのマスにある、まだ開けていない宝箱（なければ null） */
export function chestAt(area: AreaDef, state: ExploreState, cell: GridCell): AreaChest | null {
  return area.chests.find((c) => same(c.cell, cell) && !state.openedChests.includes(c.id)) ?? null;
}

/**
 * 宝箱を開ける（1回だけ）。開けた宝箱と新しい状態を返す。もう開けていた・知らない宝箱なら null。
 * 中身を持ち物に入れるのは呼ぶ側（武器と持ち物は weapon.ts）
 */
export function openChest(area: AreaDef, state: ExploreState, chestId: string): { state: ExploreState; chest: AreaChest } | null {
  const chest = area.chests.find((c) => c.id === chestId);
  if (!chest || state.openedChests.includes(chest.id)) return null;
  return { state: { ...state, openedChests: [...state.openedChests, chest.id] }, chest };
}

/** チェックポイントのマスか */
export function isCheckpoint(area: AreaDef, cell: GridCell): boolean {
  return cellsOf(area, 'P').some((p) => same(p, cell));
}

/** 敵の印がまだいるか */
export function enemyActive(state: ExploreState, enemyId: string): boolean {
  return !state.defeated.includes(enemyId);
}

/** 敵に勝った。印を消す */
export function defeatEnemy(state: ExploreState, enemyId: string): ExploreState {
  return state.defeated.includes(enemyId) ? state : { ...state, defeated: [...state.defeated, enemyId] };
}

/** 負けた。最後に記録したチェックポイントへ戻り、HP・MP は全回復（倒した敵・開けた宝箱はそのまま） */
export function loseBattle(state: ExploreState): ExploreState {
  const { vitals: _, ...rest } = state;
  return { ...rest, cell: state.checkpoint };
}

/** 勝った戦闘の終わりの HP・MP を、次の戦闘へ持ち越すために覚える（段階32b 調整3） */
export function keepVitals(state: ExploreState, vitals: Record<string, Vitals>): ExploreState {
  return { ...state, vitals: structuredClone(vitals) };
}

/** 今の状態で、まだ見ていない会話のきっかけ（on の種類ごと）。wins は倒した数、komaLeft はコマの残りで決まる */
export function pendingTrigger(area: AreaDef, state: ExploreState, on: AreaTrigger['on']): AreaTrigger | null {
  const wins = state.defeated.filter((id) => area.enemies.some((e) => e.id === id)).length;
  const left = komaLeft(area, state);
  return (
    area.triggers.find((t) => {
      if (t.on !== on || state.seen.includes(t.scene)) return false;
      if (t.on === 'wins') return wins >= t.count;
      if (t.on === 'komaLeft') return left > 0 && left <= t.left;
      return true;
    }) ?? null
  );
}

// ---- コマ（段階28） ----

/** コマを手に入れる */
export function addKoma(state: ExploreState, n: number): ExploreState {
  return n > 0 ? { ...state, koma: state.koma + n } : state;
}

/** 返すのにあと何コマ要るか（そろっていれば0） */
export function komaLeft(area: AreaDef, state: ExploreState): number {
  return Math.max(0, area.komaNeed - state.koma);
}

/**
 * ボスに挑めるか（段階32b 調整3）：ボスが抱えているコマ（bossKoma）を足せば、返せる数になっている。
 * 雑魚の砂嵐を飛ばしてボスに勝ち、コマが足りないまま区画を出てしまわないように。1-1 では砂嵐を全部倒した時
 */
export function bossReady(area: AreaDef, state: ExploreState, bossKoma: number): boolean {
  return komaLeft(area, state) <= bossKoma;
}

/** 返した後に余るコマ */
export function komaExtra(area: AreaDef, state: ExploreState): number {
  return Math.max(0, state.koma - area.komaNeed);
}

/** 会話に渡す、コマの値（台本の {komaHave} {komaNeed} {komaLeft}） */
export function komaVars(area: AreaDef, state: ExploreState): Record<string, string> {
  return { komaHave: String(Math.min(state.koma, area.komaNeed)), komaNeed: String(area.komaNeed), komaLeft: String(komaLeft(area, state)) };
}

export function markTrigger(state: ExploreState, scene: string): ExploreState {
  return state.seen.includes(scene) ? state : { ...state, seen: [...state.seen, scene] };
}

/** 敵の印が行き来するマスの並び（折り返しの点の間を最短の道でつなぐ。最後は最初の点の手前まで） */
export function patrolRoute(map: GridMap, patrol: GridCell[]): GridCell[] {
  const route: GridCell[] = [patrol[0]];
  for (let i = 0; i < patrol.length; i++) {
    const from = patrol[i];
    const to = patrol[(i + 1) % patrol.length];
    route.push(...(findPath(map, from, to) ?? []));
  }
  route.pop();
  return route;
}

/** セーブから読んだ探索の状態を、今の区画に合わせて整える。形が違えば null */
export function normalizeExplore(area: AreaDef, raw: unknown): ExploreState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const map = areaGrid(area);
  const fresh = startExplore(area);
  const cellOk = (v: unknown): v is GridCell => Array.isArray(v) && v.length === 2 && v.every(Number.isInteger) && isWalkable(map, v as GridCell);
  const ids = (v: unknown, known: string[]): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && known.includes(x)) : []);
  const scenes = area.triggers.map((t) => t.scene);
  return {
    area: area.id,
    cell: cellOk(r.cell) ? r.cell : fresh.cell,
    checkpoint: cellOk(r.checkpoint) ? r.checkpoint : fresh.checkpoint,
    openedChests: ids(r.openedChests, area.chests.map((c) => c.id)),
    defeated: ids(r.defeated, [...area.enemies.map((e) => e.id), area.boss.id]),
    seen: ids(r.seen, scenes),
    cleared: r.cleared === true,
    koma: Number.isInteger(r.koma) && (r.koma as number) > 0 ? (r.koma as number) : 0,
    ...(normalizeVitals(r.vitals) ? { vitals: normalizeVitals(r.vitals) } : {}),
  };
}

/** セーブから読んだ HP・MP。形が違う仲間は除く（全回復になる）。1人もいなければ undefined */
function normalizeVitals(raw: unknown): Record<string, Vitals> | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
  const out: Record<string, Vitals> = {};
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    const o = v as Record<string, unknown> | null;
    if (o && num(o.hp) && num(o.mp)) out[id] = { hp: o.hp, mp: o.mp };
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** 区画のデータの書き間違い（通れないマスに置いた、id の重なり、など）を、全部まとめて返す（テストで使う） */
export function checkArea(area: AreaDef): string[] {
  const errors: string[] = [];
  const map = areaGrid(area);
  const where = (what: string, cell: GridCell) => !isWalkable(map, cell) && errors.push(`${area.id}：${what} が通れないマス（${cell}）にある`);
  if (cellsOf(area, 'S').length !== 1) errors.push(`${area.id}：出発点（S）が1つではない`);
  // 宝箱は、文字の地図では通れるマスに置き（置いたマスが通れなくなる）、隣のマスから開けられること
  const raw = parseGrid(area.layout);
  for (const c of area.chests) {
    if (!isWalkable(raw, c.cell)) errors.push(`${area.id}：宝箱 ${c.id} が通れないマス（${c.cell}）にある`);
    const around: GridCell[] = [[c.cell[0], c.cell[1] - 1], [c.cell[0] + 1, c.cell[1]], [c.cell[0], c.cell[1] + 1], [c.cell[0] - 1, c.cell[1]]];
    if (!around.some((x) => isWalkable(map, x))) errors.push(`${area.id}：宝箱 ${c.id} の隣に立てるマスがない`);
  }
  for (const e of area.enemies) {
    e.patrol.forEach((p) => where(`敵 ${e.id} の道`, p));
    if (e.patrol.length >= 2 && patrolRoute(map, e.patrol).length < 2) errors.push(`${area.id}：敵 ${e.id} の道がつながらない`);
  }
  where(`ボス ${area.boss.id}`, area.boss.cell);
  for (const t of area.talkers) where(`話せる人 ${t.id}`, t.cell);
  const ids = [...area.chests, ...area.enemies, area.boss, ...area.talkers].map((x) => x.id);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length > 0) errors.push(`${area.id}：id が重なっている：${dup.join('、')}`);
  const start = cellsOf(area, 'S')[0];
  if (start && !findPath(map, start, area.boss.cell)) errors.push(`${area.id}：出発点からボスまで歩けない`);
  if (!(Number.isInteger(area.komaNeed) && area.komaNeed >= 1)) errors.push(`${area.id}：返すのに要るコマの数がない`);
  return errors;
}
