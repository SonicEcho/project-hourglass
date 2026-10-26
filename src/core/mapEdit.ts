// 地図の調整（段階117）：スマホの上で、部屋の歩ける場所・出入口の位置・置いた物の位置を手で直す。Phaser に依存しない。
// 直した中身（MapEdits）は、元のデータ（src/data の部屋と区画）との違いだけを持つ。?debug=1 の時だけ、探索の画面が区画に重ねて使う。
// 「書き出し」の文（exportMapEdits）を開発の会話に貼り、Claude が src/data に入れる
import type { GridCell } from './grid';
import type { AreaDef, RoomDef, RoomSide } from './explore';
import { EXIT_WIDTH, exitCells, entryCells, startRoom } from './explore';

/** 部屋の直し：文字の地図の全部と、出入口の位置（辺ごとの最初のマス） */
export interface RoomPatch {
  layout?: string[];
  exitAt?: Partial<Record<RoomSide, number>>;
}

/** 直した中身。rooms は部屋の id ごと、things は thingKey ごとの新しいマス（敵は見回りの最初の点） */
export interface MapEdits {
  rooms: Record<string, RoomPatch>;
  things: Record<string, GridCell>;
}

/** 動かせる物の種類。start・exit は晩の始め・帰り口（id は何晩目か）、trigger はチェックポイントの会話（id は場面） */
export type ThingKind = 'enemy' | 'chest' | 'talker' | 'gather' | 'boss' | 'start' | 'exit' | 'trigger';

/** 地図の上に置いた物（調整の画面で印を出し、選んで動かす） */
export interface PlacedThing {
  key: string;
  kind: ThingKind;
  id: string;
  room: string;
  cell: GridCell;
  /** 敵の見回りの道（最初の点が cell） */
  patrol?: GridCell[];
  /** 出る晩（書いていなければ、どの晩も） */
  night?: number;
}

export function emptyMapEdits(): MapEdits {
  return { rooms: {}, things: {} };
}

export function thingKey(areaId: string, kind: ThingKind, id: string): string {
  return `${areaId}/${kind}/${id}`;
}

/** 直しが1つもないか */
export function isEmptyMapEdits(edits: MapEdits): boolean {
  return Object.keys(edits.rooms).length === 0 && Object.keys(edits.things).length === 0;
}

/** 部屋に直しを重ねる */
export function patchRoom(room: RoomDef, edits: MapEdits): RoomDef {
  const p = edits.rooms[room.id];
  if (!p) return room;
  return { ...room, ...(p.layout ? { layout: p.layout } : {}), ...(p.exitAt ? { exitAt: { ...room.exitAt, ...p.exitAt } } : {}) };
}

/** 区画に直しを重ねる（部屋・敵・宝箱・話せる人・採取・ぬし・晩の始めと帰り口・チェックポイントの会話） */
export function applyMapEdits(area: AreaDef, edits: MapEdits): AreaDef {
  if (isEmptyMapEdits(edits)) return area;
  const at = (kind: ThingKind, id: string): GridCell | undefined => edits.things[thingKey(area.id, kind, id)];
  const moved = <T extends { id: string; cell: GridCell }>(kind: ThingKind, x: T): T => {
    const c = at(kind, x.id);
    return c ? { ...x, cell: c } : x;
  };
  return {
    ...area,
    rooms: area.rooms.map((r) => patchRoom(r, edits)),
    enemies: area.enemies.map((e) => {
      const c = at('enemy', e.id);
      if (!c) return e;
      const [dc, dr] = [c[0] - e.patrol[0][0], c[1] - e.patrol[0][1]];
      return { ...e, patrol: e.patrol.map(([x, y]): GridCell => [x + dc, y + dr]) };
    }),
    chests: area.chests.map((x) => moved('chest', x)),
    talkers: area.talkers.map((x) => moved('talker', x)),
    boss: moved('boss', area.boss),
    ...(area.hunt ? { hunt: { ...area.hunt, gathers: area.hunt.gathers.map((x) => moved('gather', x)) } } : {}),
    ...(area.nights
      ? {
          nights: area.nights.map((n, i) => {
            const s = at('start', String(i + 1));
            const e = at('exit', String(i + 1));
            return { ...n, ...(n.start && s ? { start: { ...n.start, cell: s } } : {}), ...(n.exit && e ? { exit: { ...n.exit, cell: e } } : {}) };
          }),
        }
      : {}),
    triggers: area.triggers.map((t) => {
      if (t.on !== 'checkpoint' || !t.cell) return t;
      const c = at('trigger', t.scene);
      return c ? { ...t, cell: c } : t;
    }),
  };
}

/** その部屋に置いた物の一覧（どの晩の物も。調整の画面の印） */
export function placedThings(area: AreaDef, room: string): PlacedThing[] {
  const first = startRoom(area);
  const out: PlacedThing[] = [];
  const add = (kind: ThingKind, id: string, thing: { room?: string; night?: number }, cell: GridCell, patrol?: GridCell[]) => {
    const r = thing.room ?? first;
    if (r !== room) return;
    out.push({ key: thingKey(area.id, kind, id), kind, id, room: r, cell, ...(patrol ? { patrol } : {}), ...(thing.night ? { night: thing.night } : {}) });
  };
  for (const e of area.enemies) add('enemy', e.id, e, e.patrol[0], e.patrol);
  for (const c of area.chests) add('chest', c.id, c, c.cell);
  for (const t of area.talkers) add('talker', t.id, t, t.cell);
  for (const g of area.hunt?.gathers ?? []) add('gather', g.id, g, g.cell);
  add('boss', area.boss.id, area.boss, area.boss.cell);
  area.nights?.forEach((n, i) => {
    if (n.start) add('start', String(i + 1), { room: n.start.room }, n.start.cell);
    if (n.exit) add('exit', String(i + 1), { room: n.exit.room }, n.exit.cell);
  });
  for (const t of area.triggers) if (t.on === 'checkpoint' && t.cell) add('trigger', t.scene, { room: t.room }, t.cell);
  return out;
}

/** 物を動かす（元の位置に戻した時は、直しから外す） */
export function moveThing(edits: MapEdits, original: AreaDef, thing: PlacedThing, cell: GridCell): MapEdits {
  const base = placedThings(original, thing.room).find((t) => t.key === thing.key)?.cell;
  const things = { ...edits.things };
  if (base && base[0] === cell[0] && base[1] === cell[1]) delete things[thing.key];
  else things[thing.key] = [cell[0], cell[1]];
  return { ...edits, things };
}

/** 部屋の直しを1つ書き換える（元と同じになったら外す） */
function setRoom(edits: MapEdits, original: RoomDef, patch: RoomPatch): MapEdits {
  const next: RoomPatch = { ...edits.rooms[original.id], ...patch };
  if (next.layout && next.layout.join('\n') === original.layout.join('\n')) delete next.layout;
  if (next.exitAt) {
    const exitAt = { ...next.exitAt };
    for (const side of Object.keys(exitAt) as RoomSide[]) if (exitAt[side] === exitFrom(original, side)) delete exitAt[side];
    if (Object.keys(exitAt).length === 0) delete next.exitAt;
    else next.exitAt = exitAt;
  }
  const rooms = { ...edits.rooms };
  if (next.layout || next.exitAt) rooms[original.id] = next;
  else delete rooms[original.id];
  return { ...edits, rooms };
}

/** 出入口の今の最初のマス */
export function exitFrom(room: RoomDef, side: RoomSide): number {
  const c = exitCells(room, side)[0];
  return side === 'top' || side === 'bottom' ? c[0] : c[1];
}

/** マスの記号を書き換えた文字の地図 */
function withCells(layout: string[], cells: GridCell[], ch: (old: string) => string): string[] {
  const rows = layout.map((l) => [...l]);
  for (const [c, r] of cells) if (rows[r]?.[c] !== undefined) rows[r][c] = ch(rows[r][c]);
  return rows.map((r) => r.join(''));
}

/** マスを塗る：歩ける（# を . に）か、通れない（. を # に）。出発点 S とチェックポイント P はそのまま */
export function paintCells(edits: MapEdits, original: RoomDef, cells: GridCell[], walkable: boolean): MapEdits {
  const room = patchRoom(original, edits);
  const layout = withCells(room.layout, cells, (old) => (old === 'S' || old === 'P' ? old : walkable ? (old === '#' ? '.' : old) : '#'));
  return setRoom(edits, original, { layout });
}

/** S・P の記号を別のマスへ動かす（前のマスは歩ける所に。チェックポイントの会話も一緒に動かす） */
export function moveMark(edits: MapEdits, area: AreaDef, original: RoomDef, from: GridCell, to: GridCell): MapEdits {
  const room = patchRoom(original, edits);
  const mark = room.layout[from[1]]?.[from[0]];
  if (mark !== 'S' && mark !== 'P') return edits;
  let layout = withCells(room.layout, [from], () => '.');
  layout = withCells(layout, [to], () => mark);
  let next = setRoom(edits, original, { layout });
  if (mark === 'P') {
    const edited = applyMapEdits(area, edits);
    for (const t of placedThings(edited, original.id)) {
      if (t.kind === 'trigger' && t.cell[0] === from[0] && t.cell[1] === from[1]) next = moveThing(next, area, t, to);
    }
  }
  return next;
}

/**
 * 出入口をずらす：first から幅4マス。辺のマスと1つ内側のマスを歩ける所にし、前の出入口の辺のマスのうち新しい出入口でないものは閉じる
 * （辺のマスが開いたままだと、出入口でない所から外へ出られるように見えるため）
 */
export function moveExit(edits: MapEdits, original: RoomDef, side: RoomSide, first: number): MapEdits {
  const room = patchRoom(original, edits);
  const cols = room.layout[0]?.length ?? 0;
  const length = side === 'top' || side === 'bottom' ? cols : room.layout.length;
  const from = Math.max(0, Math.min(length - EXIT_WIDTH, first));
  const before = exitCells(room, side);
  const moved: RoomDef = { ...room, exitAt: { ...room.exitAt, [side]: from } };
  const now = exitCells(moved, side);
  const key = (c: GridCell) => `${c[0]},${c[1]}`;
  const keep = new Set(now.map(key));
  let layout = withCells(room.layout, before.filter((c) => !keep.has(key(c))), (old) => (old === 'S' || old === 'P' ? old : '#'));
  layout = withCells(layout, [...now, ...entryCells(moved, side)], (old) => (old === '#' ? '.' : old));
  return setRoom(edits, original, { layout, exitAt: { ...edits.rooms[original.id]?.exitAt, [side]: from } });
}

/** タップしたマスから、近い辺の出入口と、そのマスを2つ目に置く最初のマス（辺から3マスより離れていれば null） */
export function exitAtTap(room: RoomDef, cell: GridCell): { side: RoomSide; first: number } | null {
  const cols = room.layout[0]?.length ?? 0;
  const rows = room.layout.length;
  const dist: Record<RoomSide, number> = { top: cell[1], bottom: rows - 1 - cell[1], left: cell[0], right: cols - 1 - cell[0] };
  const sides = room.exits.filter((s) => dist[s] <= 3).sort((a, b) => dist[a] - dist[b]);
  const side = sides[0];
  if (!side) return null;
  const along = side === 'top' || side === 'bottom' ? cell[0] : cell[1];
  return { side, first: along - 1 };
}

/** 開発の会話に貼る文（1行目は見出し、2行目から JSON） */
export function exportMapEdits(edits: MapEdits): string {
  return `地図の調整（段階117）\n${JSON.stringify(edits, null, 1)}`;
}

/** 覚えておいた文から戻す（読めなければ空） */
export function parseMapEdits(text: string | null): MapEdits {
  if (!text) return emptyMapEdits();
  try {
    const json = text.slice(text.indexOf('{'));
    const v = JSON.parse(json) as Partial<MapEdits>;
    const rooms = v.rooms && typeof v.rooms === 'object' ? v.rooms : {};
    const things = v.things && typeof v.things === 'object' ? v.things : {};
    return { rooms, things };
  } catch {
    return emptyMapEdits();
  }
}
