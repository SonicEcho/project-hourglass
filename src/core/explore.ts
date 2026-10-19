// 探索（段階25）：区画の地図を歩き、宝箱を開け、敵の印に触れて戦い、チェックポイントで記録する。Phaser に依存しない。
// 区画の中身（地図・宝箱・敵・会話のきっかけ）は data 側が決める。ここでは探索の状態と、その変え方だけを扱う。
// 段階47：区画は部屋（使い回せる部品）を出入口でつないだもの。部屋が1つだけの区画（1-1・1-2・2-1）もこの形。
// 宝箱・敵・ボス・話せる人は「どの部屋のどのマス」で書く（room を書かなければ、最初の部屋）。敵には動き方の種類がある
import type { GridCell, GridMap } from './grid';
import type { AreaHunt } from './hunt';
import type { Vitals } from './types';
import { findPath, isWalkable, parseGrid } from './grid';

// ---- 部屋とつなぎ（段階47a） ----

/** 部屋の辺 */
export type RoomSide = 'top' | 'bottom' | 'left' | 'right';
export const ROOM_SIDES: RoomSide[] = ['top', 'bottom', 'left', 'right'];
/** 出入口の幅（マス）。出入口は辺の真ん中にだけ置く（どの部屋とどの部屋もつなぎ替えられるように） */
export const EXIT_WIDTH = 4;

/**
 * 部屋（使い回せる部品）：地図の絵と歩ける場所の文字の地図と、使える出入口。中身（宝箱・敵など）は区画の側に書く。
 * 形は正方形（24×24マス）と縦長（24×43マス）の2種類。使わない出入口は、文字の地図でふさぐ
 */
export interface RoomDef {
  id: string;
  layout: string[];
  /** 地図の絵（台帳の id） */
  image?: string;
  /** 時代の札（砂の底で部品を組み立てる時に使う） */
  era?: string;
  /** 使える出入口（文字の地図で、その辺の真ん中の4マスが通れること） */
  exits: RoomSide[];
}

/** 部屋の出入口 */
export interface RoomDoor {
  room: string;
  side: RoomSide;
}

/** 出入口のつなぎ（a ⇔ b。どちらからも通れる） */
export interface RoomLink {
  a: RoomDoor;
  b: RoomDoor;
  /** 閉じた出入口：この印（敵・ボスの id）を倒すまで通れない（ボスの部屋から入口への近道、砂嵐を倒すと開く扉など） */
  opensWhen?: string;
}

/** 部屋に置くもの（room を書かなければ、区画の最初の部屋） */
interface InRoom {
  room?: string;
}

/** 晩に分けた区画（段階63）で、出る晩（night：何晩目から、until：何晩目まで。書かなければ、どの晩も） */
export interface InNight {
  night?: number;
  until?: number;
}

/** 宝箱：開けると素材・アイテムが持ち物に入る。gears はムーブメントのギア（段階38。ギアは戦闘では落とさず、宝箱と出来事のごほうびで手に入る） */
export interface AreaChest extends InRoom, InNight {
  id: string;
  cell: GridCell;
  items: string[];
  gears?: string[];
  /** 入っているスナップ（段階41。持ち物に入り、アルバムの画面で入れ替えられる） */
  snaps?: string[];
}

/**
 * 敵の動き方（段階47b）。patrol：決まった道を回る（今までの形）／chase：近くに来ると追ってきて、離れるとあきらめる／
 * guard：番人。動かず、倒すまで先へ通さない／flee：逃げる珍しい敵。近づくと逃げ、行き止まりに追いこむと捕まえられる
 */
export type EnemyMove = 'patrol' | 'chase' | 'guard' | 'flee';

/** 敵の印：決まった道を行き来する。触れると戦闘（battle は区画の戦闘の id） */
export interface AreaEnemy extends InRoom, InNight {
  id: string;
  /** 戦う前に見る会話（段階63。番人の前の会話など。1回だけ） */
  scene?: string;
  /** 行き来する道の折り返しの点（最初の点から始まる。3点以上なら輪になる。番人は1点） */
  patrol: GridCell[];
  battle: string;
  /** 動き方（書かなければ見回り） */
  move?: EnemyMove;
}

/** 区画の奥のボスの印（動かない） */
export interface AreaBoss extends InRoom, InNight {
  id: string;
  cell: GridCell;
  battle: string;
}

/** 話せる人（写しの人々）。隣のマスに来るか、タップすると会話の場面 */
export interface AreaTalker extends InRoom, InNight {
  id: string;
  cell: GridCell;
  scene: string;
  label: string;
}

/** 探索の途中の会話のきっかけ（1回だけ）。gears を書くと、その会話を見た時にごほうびのギアが手に入る（段階38。2-1 でみおが拾った歯車など） */
export type AreaTrigger = AreaTriggerKind & { gears?: string[] } & InNight;
type AreaTriggerKind =
  /** 敵に n 回勝った時。after を書くと、その会話を見た後だけ（段階37。1-2 の「時計屋の後の戦闘」） */
  | { on: 'wins'; count: number; scene: string; after?: string }
  /** 集めたコマが count 個になった時（段階63。コマが戻るたびに、過去の場面が1つずつ進む） */
  | { on: 'koma'; count: number; scene: string }
  /** その部屋に初めて入った時（段階63） */
  | { on: 'room'; room: string; scene: string }
  /** 返すのに要るコマの残りが left 以下になった時（まだそろっていない時。段階28） */
  | { on: 'komaLeft'; left: number; scene: string }
  /** チェックポイントに初めて着いた時。cell を書くと、そのチェックポイントだけ（段階37。チェックポイントが2つある区画。段階47：room はその部屋） */
  | { on: 'checkpoint'; scene: string; cell?: GridCell; room?: string }
  /** ボスの印に触れた時（会話の後でボスと戦う） */
  | { on: 'boss'; scene: string }
  /** ボスに勝った時（会話の後で区画を出る） */
  | { on: 'cleared'; scene: string };

export interface AreaDef {
  id: string;
  name: string;
  /** 使う部屋（段階47。最初の部屋に出発点 S がある） */
  rooms: RoomDef[];
  /** 出入口のつなぎ（部屋が1つなら書かない） */
  links?: RoomLink[];
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
  /** 返す画面の後ろに流す、その時間の景色（会話の背景 BACKDROPS の id。段階46d「記憶の再生」） */
  memory?: string;
  /** 返した時に持ち主からもらうスナップ（段階41。返した報酬） */
  returnSnaps?: string[];
  /** 返し終えた後に入り直す、狩りの中身（段階43。core/hunt.ts） */
  hunt?: AreaHunt;
  /** 晩に分けて入る区画（段階63）：晩ごとの区切り（1晩目から順に） */
  nights?: AreaNight[];
  /** ノイズの壁（段階63）：opens 晩目から開く。それより前の晩は、そのマスを通れない */
  walls?: AreaWall[];
}

/** 晩の区切り（段階63）：コマが koma 個になると、その晩は終わる（最後の晩は書かなくてよい）。start は、その晩を始める所（1晩目は出発点） */
export interface AreaNight {
  koma?: number;
  start?: { room?: string; cell: GridCell };
  /** 今夜の帰り口（段階67）。書かなければ、次の晩を始める所 */
  exit?: { room?: string; cell: GridCell };
}

/** ノイズの壁（段階63）：持ち主が少し思い出すと薄れる、記憶の先をふさぐ壁 */
export interface AreaWall extends InRoom {
  id: string;
  cells: GridCell[];
  opens: number;
}

/** 探索の状態（セーブする） */
export interface ExploreState {
  area: string;
  /** いる部屋（段階47） */
  room: string;
  /** いるマス（いる部屋の中） */
  cell: GridCell;
  /** 最後に記録したチェックポイント（なければ出発点）と、その部屋 */
  checkpoint: GridCell;
  checkpointRoom: string;
  /** 入ったことのある部屋（全体の地図に出す。段階47） */
  visited: string[];
  openedChests: string[];
  /** 倒した敵の印 */
  defeated: string[];
  /** 見た会話のきっかけ（場面の id） */
  seen: string[];
  /** ボスに勝ったか */
  cleared: boolean;
  /** 集めたコマの数（段階28） */
  koma: number;
  /** 晩に分けた区画で、今いる晩（段階63。書いていなければ1晩目） */
  night?: number;
  /**
   * 前の戦闘から持ち越す仲間の HP・MP（段階32b 調整3）。なければ全回復。
   * 区画の中の戦闘は、勝ったら残りを次の戦闘へ持ち越す。チェックポイントに着くと全回復、負けてチェックポイントへ戻る時も全回復
   */
  vitals?: Record<string, Vitals>;
}

/** 区画の最初の部屋（出発点のある部屋） */
export function startRoom(area: AreaDef): string {
  return area.rooms[0].id;
}

/** 部屋（知らない id なら最初の部屋） */
export function roomOf(area: AreaDef, room: string): RoomDef {
  return area.rooms.find((r) => r.id === room) ?? area.rooms[0];
}

/** 部屋に置いたもの（宝箱・敵・ボス・話せる人）が、その部屋にあるか */
export function inRoom(area: AreaDef, thing: InRoom, room: string): boolean {
  return (thing.room ?? startRoom(area)) === room;
}

/** 部屋の歩ける地図。宝箱のマスは通れない（上を歩けない。段階27b の時の調整） */
export function areaGrid(area: AreaDef, room = startRoom(area)): GridMap {
  const map = parseGrid(roomOf(area, room).layout);
  const blocked = [...map.blocked];
  for (const c of area.chests) {
    if (!inRoom(area, c, room)) continue;
    if (c.cell[0] >= 0 && c.cell[0] < map.cols && c.cell[1] >= 0 && c.cell[1] < map.rows) blocked[c.cell[1] * map.cols + c.cell[0]] = true;
  }
  return { ...map, blocked };
}

/** 部屋の文字の地図の中の、ある記号のマス */
export function cellsOf(area: AreaDef, ch: string, room = startRoom(area)): GridCell[] {
  const out: GridCell[] = [];
  roomOf(area, room).layout.forEach((line, r) => [...line].forEach((c, col) => c === ch && out.push([col, r])));
  return out;
}

export function startExplore(area: AreaDef): ExploreState {
  const room = startRoom(area);
  const start = cellsOf(area, 'S', room)[0];
  if (!start) throw new Error(`no start in ${area.id}`);
  return { area: area.id, room, cell: start, checkpoint: start, checkpointRoom: room, visited: [room], openedChests: [], defeated: [], seen: [], cleared: false, koma: 0 };
}

const same = (a: GridCell, b: GridCell): boolean => a[0] === b[0] && a[1] === b[1];

/** 部屋の大きさ（列, 行） */
function roomSize(room: RoomDef): GridCell {
  return [Math.max(0, ...room.layout.map((l) => l.length)), room.layout.length];
}

/** 出入口のマス（辺の真ん中の4マス。上下の辺は左から、左右の辺は上から） */
export function exitCells(room: RoomDef, side: RoomSide): GridCell[] {
  const [cols, rows] = roomSize(room);
  const from = (n: number) => Math.floor(n / 2) - EXIT_WIDTH / 2;
  return Array.from({ length: EXIT_WIDTH }, (_, i): GridCell => {
    if (side === 'top') return [from(cols) + i, 0];
    if (side === 'bottom') return [from(cols) + i, rows - 1];
    if (side === 'left') return [0, from(rows) + i];
    return [cols - 1, from(rows) + i];
  });
}

/** 出入口から入った時に立つマス（出入口の1マス内側） */
export function entryCells(room: RoomDef, side: RoomSide): GridCell[] {
  const inward: Record<RoomSide, GridCell> = { top: [0, 1], bottom: [0, -1], left: [1, 0], right: [-1, 0] };
  const [dc, dr] = inward[side];
  return exitCells(room, side).map(([c, r]): GridCell => [c + dc, r + dr]);
}

/** その部屋の出入口のつなぎ（相手の出入口と一緒に） */
function doorsOf(area: AreaDef, room: string): { link: RoomLink; from: RoomDoor; to: RoomDoor }[] {
  return (area.links ?? []).flatMap((link) => [
    ...(link.a.room === room ? [{ link, from: link.a, to: link.b }] : []),
    ...(link.b.room === room ? [{ link, from: link.b, to: link.a }] : []),
  ]);
}

/** 閉じた出入口が開いているか（opensWhen の印を倒したか） */
export function linkOpen(link: RoomLink, state: ExploreState): boolean {
  return link.opensWhen === undefined || state.defeated.includes(link.opensWhen);
}

/** 出入口を通った結果：つながった部屋に移った／閉じていて通れない（つなぎを返す） */
export type DoorResult = { type: 'moved'; state: ExploreState } | { type: 'locked'; link: RoomLink };

/**
 * 出入口のマスに着いた時（段階47a）。つながった部屋の出入口の内側（同じ並びのマス）に移る。
 * 閉じた出入口なら locked。出入口ではない・つなぎのない出入口なら null
 */
export function passDoor(area: AreaDef, state: ExploreState, cell: GridCell): DoorResult | null {
  const room = roomOf(area, state.room);
  for (const d of doorsOf(area, room.id)) {
    const index = exitCells(room, d.from.side).findIndex((c) => same(c, cell));
    if (index < 0) continue;
    if (!linkOpen(d.link, state)) return { type: 'locked', link: d.link };
    const to = roomOf(area, d.to.room);
    const entry = entryCells(to, d.to.side)[index];
    const visited = state.visited.includes(to.id) ? state.visited : [...state.visited, to.id];
    return { type: 'moved', state: { ...state, room: to.id, cell: entry, visited } };
  }
  return null;
}

/** 全体の地図の部屋の位置（段階47a）。最初の部屋を (0, 0) に、つなぎの向きで隣に置く（上の出入口でつながった部屋は1つ上） */
export function roomPositions(area: AreaDef): Record<string, GridCell> {
  const step: Record<RoomSide, GridCell> = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] };
  const pos: Record<string, GridCell> = { [startRoom(area)]: [0, 0] };
  const queue = [startRoom(area)];
  for (let i = 0; i < queue.length; i++) {
    const room = queue[i];
    for (const d of doorsOf(area, room)) {
      if (pos[d.to.room]) continue;
      const [dx, dy] = step[d.from.side];
      pos[d.to.room] = [pos[room][0] + dx, pos[room][1] + dy];
      queue.push(d.to.room);
    }
  }
  return pos;
}

/** マスに着いた時の出来事 */
export type ArriveEvent = { type: 'checkpoint'; first: boolean; healed: boolean } | { type: 'none' };

/**
 * マスに着いた。チェックポイントなら記録する（新しい状態と出来事を返す）。
 * 宝箱は、通っただけでは開かない（タップして隣まで来た時に openChest で開ける）
 */
export function arrive(area: AreaDef, state: ExploreState, cell: GridCell): { state: ExploreState; event: ArriveEvent } {
  const next: ExploreState = { ...state, cell };
  if (isCheckpoint(area, cell, state.room)) {
    // まだどのチェックポイントでも記録していなかった（出発点のまま）なら、初めて
    const first = !isCheckpoint(area, state.checkpoint, state.checkpointRoom);
    // チェックポイントに着くと、HP・MP が全回復する（段階32b 調整3）
    const { vitals, ...rest } = next;
    return { state: { ...rest, checkpoint: cell, checkpointRoom: state.room }, event: { type: 'checkpoint', first, healed: vitals !== undefined } };
  }
  return { state: next, event: { type: 'none' } };
}

/** そのマスにある、まだ開けていない宝箱（なければ null） */
export function chestAt(area: AreaDef, state: ExploreState, cell: GridCell): AreaChest | null {
  return area.chests.find((c) => inRoom(area, c, state.room) && same(c.cell, cell) && !state.openedChests.includes(c.id)) ?? null;
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

/** チェックポイントのマスか（room の部屋の中で） */
export function isCheckpoint(area: AreaDef, cell: GridCell, room = startRoom(area)): boolean {
  return cellsOf(area, 'P', room).some((p) => same(p, cell));
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
  return { ...rest, room: state.checkpointRoom, cell: state.checkpoint };
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
      if (t.on === 'wins') return wins >= t.count && (t.after === undefined || state.seen.includes(t.after));
      if (t.on === 'komaLeft') return left > 0 && left <= t.left;
      if (t.on === 'koma') return state.koma >= t.count;
      if (t.on === 'room') return state.room === t.room;
      if (t.on === 'checkpoint' && t.cell) return same(t.cell, state.cell) && (t.room ?? startRoom(area)) === state.room;
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

/** 会話を見た時に手に入るごほうびのギア（段階38）。もう見た会話・ごほうびのない会話は空（同じごほうびを2回渡さないよう、markTrigger の前に呼ぶ） */
export function triggerGears(area: AreaDef, state: ExploreState, scene: string): string[] {
  if (state.seen.includes(scene)) return [];
  return area.triggers.find((t) => t.scene === scene)?.gears ?? [];
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

// ---- 敵の動き（段階47b） ----

/** 追ってくる・逃げる敵の数値（data 側の ENEMY_MOVES） */
export interface EnemyTuning {
  /** このマス数（縦横の歩数）まで近づくと気づく */
  notice: number;
  /** 追っている時、このマス数より離れるとあきらめる */
  giveUp: number;
}

/** 敵の印の今の様子（画面の側で持つ。セーブしない） */
export interface EnemyMind {
  cell: GridCell;
  /** 見回りの道の、今いる（向かっている）点の番号 */
  index: number;
  /** 追っている途中か（「！」を出す） */
  chasing: boolean;
}

export function startMind(route: GridCell[]): EnemyMind {
  return { cell: route[0], index: 0, chasing: false };
}

const steps = (a: GridCell, b: GridCell): number => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);

/** 道の上を1歩進む（道の外にいる時は、向かう点へ最短の道で戻る） */
function patrolStep(map: GridMap, route: GridCell[], mind: EnemyMind): EnemyMind {
  if (route.length < 2 && same(mind.cell, route[0])) return { ...mind, chasing: false };
  if (same(mind.cell, route[mind.index])) {
    const index = (mind.index + 1) % route.length;
    const back = same(route[index], mind.cell) ? null : findPath(map, mind.cell, route[index]);
    return { cell: back?.[0] ?? route[index], index, chasing: false };
  }
  const back = findPath(map, mind.cell, route[mind.index]);
  return { ...mind, cell: back?.[0] ?? mind.cell, chasing: false };
}

/**
 * 敵の印の次の1歩（段階47b）。player は仲間のいるマス。乱数は使わない（同じ様子からは同じ1歩）。
 * - 見回り：道の次のマスへ
 * - 追ってくる：notice マス以内に来ると追い始め、giveUp マスより離れるとあきらめて道へ戻る
 * - 番人：動かない
 * - 逃げる：notice マス以内に来ると、仲間から一番遠くなる隣のマスへ（どこへ行っても近づくなら、その場にとどまる＝追いつめられる）。
 *   それ以外は見回り（道が1点ならとどまる）
 */
export function enemyNext(map: GridMap, move: EnemyMove, route: GridCell[], mind: EnemyMind, player: GridCell, tuning: EnemyTuning): EnemyMind {
  if (move === 'guard') return mind;
  const d = steps(mind.cell, player);
  if (move === 'chase') {
    const chasing = mind.chasing ? d <= tuning.giveUp : d <= tuning.notice;
    if (!chasing) return patrolStep(map, route, mind);
    const path = findPath(map, mind.cell, player);
    return { ...mind, cell: path?.[0] ?? mind.cell, chasing: true };
  }
  if (move === 'flee' && d <= tuning.notice) {
    // 遠くなる隣のマスへ。同じ歩数なら、まっすぐ遠ざかる方（直線の距離が長い方）
    const score = (c: GridCell) => steps(c, player) * 1000 + (c[0] - player[0]) ** 2 + (c[1] - player[1]) ** 2;
    let best = mind.cell;
    for (const [dc, dr] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const next: GridCell = [mind.cell[0] + dc, mind.cell[1] + dr];
      if (isWalkable(map, next) && steps(next, player) > steps(mind.cell, player) && score(next) > score(best)) best = next;
    }
    return { ...mind, cell: best, chasing: false };
  }
  return patrolStep(map, route, mind);
}

/** セーブから読んだ探索の状態を、今の区画に合わせて整える。形が違えば null */
export function normalizeExplore(area: AreaDef, raw: unknown): ExploreState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const fresh = startExplore(area);
  const roomIds = area.rooms.map((x) => x.id);
  // 段階47（セーブの版9）：部屋を足した。前の版の探索の途中は、最初の部屋にいたことにする
  const roomOk = (v: unknown): v is string => typeof v === 'string' && roomIds.includes(v);
  const cellOk = (v: unknown, room: string): v is GridCell =>
    Array.isArray(v) && v.length === 2 && v.every(Number.isInteger) && isWalkable(areaGrid(area, room), v as GridCell);
  const ids = (v: unknown, known: string[]): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && known.includes(x)) : []);
  const scenes = [...area.triggers.map((t) => t.scene), ...area.enemies.flatMap((e) => (e.scene ? [e.scene] : []))];
  const room = roomOk(r.room) ? r.room : fresh.room;
  const here = cellOk(r.cell, room);
  const checkpointRoom = roomOk(r.checkpointRoom) ? r.checkpointRoom : fresh.checkpointRoom;
  const checkpointHere = cellOk(r.checkpoint, checkpointRoom);
  const at = { room: here ? room : fresh.room, cell: here ? (r.cell as GridCell) : fresh.cell };
  const visited = ids(r.visited, roomIds);
  return {
    area: area.id,
    ...at,
    checkpoint: checkpointHere ? (r.checkpoint as GridCell) : fresh.checkpoint,
    checkpointRoom: checkpointHere ? checkpointRoom : fresh.checkpointRoom,
    visited: [...new Set([fresh.room, ...visited, at.room])],
    openedChests: ids(r.openedChests, area.chests.map((c) => c.id)),
    defeated: ids(r.defeated, [...area.enemies.map((e) => e.id), area.boss.id]),
    seen: ids(r.seen, scenes),
    cleared: r.cleared === true,
    koma: Number.isInteger(r.koma) && (r.koma as number) > 0 ? (r.koma as number) : 0,
    ...(Number.isInteger(r.night) && (r.night as number) > 1 ? { night: r.night as number } : {}),
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

/**
 * 出発点から歩いて行ける部屋とマス（段階47a）。閉じた出入口も、いつかは開くので通れるものとする。
 * 部屋の中を歩いて、出入口のマスに着いたら、つながった部屋の入口のマスから続ける
 */
export function reachableCells(area: AreaDef, from?: { room: string; cell: GridCell }): Record<string, Set<string>> {
  const out: Record<string, Set<string>> = {};
  const key = (c: GridCell) => `${c[0]},${c[1]}`;
  const queue: { room: string; cell: GridCell }[] = [];
  const visit = (room: string, cell: GridCell) => {
    if (!isWalkable(areaGrid(area, room), cell)) return;
    out[room] ??= new Set();
    if (out[room].has(key(cell))) return;
    out[room].add(key(cell));
    queue.push({ room, cell });
  };
  const start = from?.cell ?? cellsOf(area, 'S')[0];
  if (start) visit(from?.room ?? startRoom(area), start);
  for (let i = 0; i < queue.length; i++) {
    const { room, cell } = queue[i];
    const map = areaGrid(area, room);
    for (const [dc, dr] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const next: GridCell = [cell[0] + dc, cell[1] + dr];
      if (isWalkable(map, next)) visit(room, next);
    }
    for (const d of doorsOf(area, room)) {
      const index = exitCells(roomOf(area, room), d.from.side).findIndex((c) => same(c, cell));
      if (index >= 0) visit(d.to.room, entryCells(roomOf(area, d.to.room), d.to.side)[index]);
    }
  }
  return out;
}

/** 部屋のデータの書き間違い（大きさ、使える出入口がふさがっている）を返す */
export function checkRoom(room: RoomDef): string[] {
  const errors: string[] = [];
  const [cols, rows] = roomSize(room);
  if (new Set(room.layout.map((l) => l.length)).size !== 1) errors.push(`部屋 ${room.id}：行の長さがそろっていない`);
  if (cols < EXIT_WIDTH + 2 || rows < EXIT_WIDTH + 2) errors.push(`部屋 ${room.id}：小さすぎる`);
  const map = parseGrid(room.layout);
  for (const side of room.exits) {
    if (![...exitCells(room, side), ...entryCells(room, side)].every((c) => isWalkable(map, c))) errors.push(`部屋 ${room.id}：${side} の出入口がふさがっている`);
  }
  if (new Set(room.exits).size !== room.exits.length) errors.push(`部屋 ${room.id}：出入口が重なっている`);
  return errors;
}

/** 区画のデータの書き間違い（通れないマスに置いた、id の重なり、出入口のつなぎ、など）を、全部まとめて返す（テストで使う） */
export function checkArea(area: AreaDef): string[] {
  const errors: string[] = [];
  if (area.rooms.length === 0) return [`${area.id}：部屋がない`];
  const roomIds = area.rooms.map((r) => r.id);
  if (new Set(roomIds).size !== roomIds.length) errors.push(`${area.id}：部屋が重なっている`);
  for (const room of area.rooms) errors.push(...checkRoom(room).map((e) => `${area.id}：${e}`));
  const roomOfThing = (what: string, thing: InRoom): string | null => {
    const room = thing.room ?? startRoom(area);
    if (roomIds.includes(room)) return room;
    errors.push(`${area.id}：${what} の部屋 ${room} がない`);
    return null;
  };
  const where = (what: string, thing: InRoom, cell: GridCell) => {
    const room = roomOfThing(what, thing);
    if (room && !isWalkable(areaGrid(area, room), cell)) errors.push(`${area.id}：${what} が通れないマス（${cell}）にある`);
  };
  if (cellsOf(area, 'S').length !== 1) errors.push(`${area.id}：出発点（S）が1つではない`);
  for (const room of area.rooms.slice(1)) if (cellsOf(area, 'S', room.id).length > 0) errors.push(`${area.id}：最初の部屋のほかに出発点（S）がある（${room.id}）`);
  // 宝箱は、文字の地図では通れるマスに置き（置いたマスが通れなくなる）、隣のマスから開けられること
  for (const c of area.chests) {
    const room = roomOfThing(`宝箱 ${c.id}`, c);
    if (!room) continue;
    const map = areaGrid(area, room);
    if (!isWalkable(parseGrid(roomOf(area, room).layout), c.cell)) errors.push(`${area.id}：宝箱 ${c.id} が通れないマス（${c.cell}）にある`);
    const around: GridCell[] = [[c.cell[0], c.cell[1] - 1], [c.cell[0] + 1, c.cell[1]], [c.cell[0], c.cell[1] + 1], [c.cell[0] - 1, c.cell[1]]];
    if (!around.some((x) => isWalkable(map, x))) errors.push(`${area.id}：宝箱 ${c.id} の隣に立てるマスがない`);
  }
  for (const e of area.enemies) {
    e.patrol.forEach((p) => where(`敵 ${e.id} の道`, e, p));
    const room = e.room ?? startRoom(area);
    if (roomIds.includes(room) && e.patrol.length >= 2 && patrolRoute(areaGrid(area, room), e.patrol).length < 2) errors.push(`${area.id}：敵 ${e.id} の道がつながらない`);
    if (e.move === 'guard' && e.patrol.length !== 1) errors.push(`${area.id}：番人 ${e.id} の道は1点`);
  }
  where(`ボス ${area.boss.id}`, area.boss, area.boss.cell);
  for (const t of area.talkers) where(`話せる人 ${t.id}`, t, t.cell);
  const ids = [...area.chests, ...area.enemies, area.boss, ...area.talkers].map((x) => x.id);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length > 0) errors.push(`${area.id}：id が重なっている：${dup.join('、')}`);
  // 出入口のつなぎ：ない部屋・使えない出入口、同じ出入口を2回、つなぎのない出入口（片方だけ）、閉じた出入口を開ける印
  const used: string[] = [];
  for (const link of area.links ?? []) {
    for (const door of [link.a, link.b]) {
      const room = area.rooms.find((r) => r.id === door.room);
      if (!room) errors.push(`${area.id}：つなぎの部屋 ${door.room} がない`);
      else if (!room.exits.includes(door.side)) errors.push(`${area.id}：部屋 ${door.room} に ${door.side} の出入口がない`);
      used.push(`${door.room}:${door.side}`);
    }
    if (link.opensWhen !== undefined && !ids.includes(link.opensWhen)) errors.push(`${area.id}：閉じた出入口を開ける印 ${link.opensWhen} がない`);
  }
  const twice = used.filter((u, i) => used.indexOf(u) !== i);
  if (twice.length > 0) errors.push(`${area.id}：同じ出入口に2つのつなぎ：${twice.join('、')}`);
  for (const room of area.rooms) for (const side of room.exits) if (!used.includes(`${room.id}:${side}`)) errors.push(`${area.id}：部屋 ${room.id} の ${side} の出入口がどこにもつながっていない`);
  // どこからも行けない部屋、出発点から行けないボス
  const reach = reachableCells(area);
  for (const room of area.rooms) if (!reach[room.id]) errors.push(`${area.id}：部屋 ${room.id} へ行けない`);
  const bossRoom = area.boss.room ?? startRoom(area);
  if (cellsOf(area, 'S').length > 0 && !reach[bossRoom]?.has(`${area.boss.cell[0]},${area.boss.cell[1]}`)) errors.push(`${area.id}：出発点からボスまで歩けない`);
  if (!(Number.isInteger(area.komaNeed) && area.komaNeed >= 1)) errors.push(`${area.id}：返すのに要るコマの数がない`);
  for (const t of area.triggers) {
    if (t.on === 'checkpoint' && t.cell && !isCheckpoint(area, t.cell, t.room ?? startRoom(area))) errors.push(`${area.id}：会話 ${t.scene} のチェックポイント（${t.cell}）が P のマスではない`);
    if (t.on === 'wins' && t.after && !area.triggers.some((x) => x.scene === t.after)) errors.push(`${area.id}：会話 ${t.scene} の先に見る会話 ${t.after} がない`);
    if (t.on === 'room' && !roomIds.includes(t.room)) errors.push(`${area.id}：会話 ${t.scene} の部屋 ${t.room} がない`);
  }
  errors.push(...checkNights(area));
  return errors;
}

// ---- 晩に分けた区画（段階63。docs/design/explore.md の 2-5） ----

/** そのものが、その晩に出るか */
export function inNight(thing: InNight, night: number): boolean {
  return (thing.night ?? 1) <= night && night <= (thing.until ?? Infinity);
}

/** まだ開いていない壁（その部屋の） */
export function closedWalls(area: AreaDef, night: number, room?: string): AreaWall[] {
  return (area.walls ?? []).filter((w) => w.opens > night && (room === undefined || inRoom(area, w, room)));
}

/**
 * その晩の区画：まだ開いていない壁のマスを通れなくし、その晩に出ないもの（宝箱・敵・話せる人・途中の会話）を除く。
 * ボスは除かない（区画に1つあるので、出るかどうかは呼ぶ側が inNight で見る）。晩に分けていない区画は、そのまま
 */
export function nightArea(area: AreaDef, night: number): AreaDef {
  if (!area.nights) return area;
  const rooms = area.rooms.map((room) => {
    const walls = closedWalls(area, night, room.id);
    if (walls.length === 0) return room;
    const rows = room.layout.map((l) => [...l]);
    for (const w of walls) for (const [c, r] of w.cells) if (rows[r]?.[c] !== undefined) rows[r][c] = '#';
    return { ...room, layout: rows.map((r) => r.join('')) };
  });
  return {
    ...area,
    rooms,
    chests: area.chests.filter((x) => inNight(x, night)),
    enemies: area.enemies.filter((x) => inNight(x, night)),
    talkers: area.talkers.filter((x) => inNight(x, night)),
    triggers: area.triggers.filter((x) => inNight(x, night)),
  };
}

/** 今いる晩 */
export function nightOf(state: ExploreState): number {
  return state.night ?? 1;
}

/**
 * 晩を始める：前の晩のまま来たら、その晩を始める所へ移り、そこを記録したチェックポイントにする（HP・MP は全回復）。
 * もう始めていた晩（戦闘や会話から戻ってきた時）なら、そのまま
 */
export function startNight(area: AreaDef, state: ExploreState, night: number): ExploreState {
  if (!area.nights || nightOf(state) >= night) return state;
  const start = area.nights[night - 1]?.start;
  const { vitals: _, ...rest } = state;
  if (!start) return { ...rest, night };
  const room = start.room ?? startRoom(area);
  const visited = state.visited.includes(room) ? state.visited : [...state.visited, room];
  return { ...rest, night, room, cell: start.cell, checkpoint: start.cell, checkpointRoom: room, visited };
}

/** その晩のコマがそろったか（最後の晩は、ぬしに勝つまで終わらない） */
export function nightDone(area: AreaDef, state: ExploreState, night: number): boolean {
  const n = area.nights?.[night - 1];
  return !!area.nights && night < area.nights.length && n?.koma !== undefined && state.koma >= n.koma;
}

/** 今夜の目標（段階67）：今夜集めるコマの数と、今夜もう集めた数。最後の晩は、区画を返すまでの残り（ぬしの分も入る） */
export function nightGoal(area: AreaDef, state: ExploreState, night: number): { have: number; need: number; last: boolean } {
  const nights = area.nights ?? [];
  const last = night >= nights.length;
  const before = night > 1 ? (nights[night - 2]?.koma ?? 0) : 0;
  const until = last ? area.komaNeed : (nights[night - 1]?.koma ?? area.komaNeed);
  return { have: Math.max(0, Math.min(state.koma, until) - before), need: until - before, last };
}

/**
 * 今夜の帰り口（段階67）：今夜のコマがそろった後、ここから時計屋へ帰って晩を終える。
 * 晩の exit。書いていなければ次の晩を始める所（チェックポイント）、それもなければ出発点。最後の晩にはない
 */
export function nightExit(area: AreaDef, night: number): { room: string; cell: GridCell } | null {
  if (!area.nights || night >= area.nights.length) return null;
  const start = area.nights[night - 1]?.exit ?? area.nights[night]?.start;
  if (start) return { room: start.room ?? startRoom(area), cell: start.cell };
  const s = cellsOf(area, 'S')[0];
  return s ? { room: startRoom(area), cell: s } : null;
}

/**
 * 晩に分けた区画の書き間違い：壁のマス・晩を始める所、晩ごとに、その晩の始める所から、その晩に出る敵・宝箱・話せる人へ歩けるか。
 * 最後の晩は、ぬしまで歩けるか
 */
export function checkNights(area: AreaDef): string[] {
  if (!area.nights) return [];
  const errors: string[] = [];
  const roomIds = area.rooms.map((r) => r.id);
  for (const w of area.walls ?? []) {
    const room = w.room ?? startRoom(area);
    if (!roomIds.includes(room)) errors.push(`${area.id}：壁 ${w.id} の部屋 ${room} がない`);
    else for (const c of w.cells) if (!isWalkable(parseGrid(roomOf(area, room).layout), c)) errors.push(`${area.id}：壁 ${w.id} のマス（${c}）が、もともと通れない`);
  }
  area.nights.forEach((n, i) => {
    const night = i + 1;
    const a = nightArea(area, night);
    const from = n.start ? { room: n.start.room ?? startRoom(area), cell: n.start.cell } : { room: startRoom(area), cell: cellsOf(area, 'S')[0] };
    if (!from.cell || !isWalkable(areaGrid(a, from.room), from.cell)) {
      errors.push(`${area.id}：${night}晩目を始める所が通れない`);
      return;
    }
    if (n.start && !isCheckpoint(area, n.start.cell, from.room)) errors.push(`${area.id}：${night}晩目を始める所が P のマスではない`);
    const reach = reachableCells(a, from);
    const ok = (thing: InRoom, cell: GridCell) => reach[thing.room ?? startRoom(area)]?.has(`${cell[0]},${cell[1]}`) ?? false;
    const near = (thing: InRoom, cell: GridCell) =>
      [cell, [cell[0], cell[1] - 1], [cell[0] + 1, cell[1]], [cell[0], cell[1] + 1], [cell[0] - 1, cell[1]]].some((c) => ok(thing, c as GridCell));
    for (const e of a.enemies) if (!ok(e, e.patrol[0])) errors.push(`${area.id}：${night}晩目の敵 ${e.id} へ歩けない`);
    for (const c of a.chests) if (!near(c, c.cell)) errors.push(`${area.id}：${night}晩目の宝箱 ${c.id} へ歩けない`);
    for (const t of a.talkers) if (!near(t, t.cell)) errors.push(`${area.id}：${night}晩目の話せる人 ${t.id} へ歩けない`);
    if (night === area.nights!.length && !near(area.boss, area.boss.cell)) errors.push(`${area.id}：最後の晩に、ぬしへ歩けない`);
    if (night < area.nights!.length && n.koma === undefined) errors.push(`${area.id}：${night}晩目に、終わるコマの数がない`);
    // 帰り口（段階67）：その晩のうちに歩いて行けるか
    const exit = nightExit(area, night);
    if (exit && !reach[exit.room]?.has(`${exit.cell[0]},${exit.cell[1]}`)) errors.push(`${area.id}：${night}晩目の帰り口へ歩けない`);
  });
  return errors;
}
