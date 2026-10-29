// 地図の調整（段階117）：スマホの上で、部屋の歩ける場所・出入口の位置・置いた物の位置を手で直す。Phaser に依存しない。
// 直した中身（MapEdits）は、元のデータ（src/data の部屋と区画）との違いだけを持つ。?debug=1 の時だけ、探索の画面が区画に重ねて使う。
// 「書き出し」の文（exportMapEdits）を開発の会話に貼り、Claude が src/data に入れる
import type { GridCell } from './grid';
import type { AreaDef, RoomDef, RoomSide } from './explore';
import { EXIT_WIDTH, ROOF, exitCells, entryCells, startRoom } from './explore';

/** 部屋の直し：文字の地図の全部と、出入口の位置（辺ごとの最初のマス） */
export interface RoomPatch {
  layout?: string[];
  exitAt?: Partial<Record<RoomSide, number>>;
}

/**
 * 直した中身。rooms は部屋の id ごと、things は thingKey ごとの新しいマス（敵は見回りの最初の点）。
 * patrols は敵の見回りの道の引き直し（段階119。thingKey ごとの折り返しの点の全部。引き直した敵は things に書かない）
 */
export interface MapEdits {
  rooms: Record<string, RoomPatch>;
  things: Record<string, GridCell>;
  patrols?: Record<string, GridCell[]>;
  /** 足した宝箱（段階120。thingKey ごとの部屋・マス・出る晩。中身は Claude が src/data に入れる時に決める。調整の間は空） */
  newChests?: Record<string, NewChest>;
  /** 消した宝箱（段階120。元のデータの宝箱の thingKey） */
  removedChests?: string[];
}

/** 地図の調整で足した宝箱 */
export interface NewChest {
  room: string;
  cell: GridCell;
  /** 何晩目から出るか（晩に分けた区画で、足した時の晩） */
  night?: number;
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
  return (
    Object.keys(edits.rooms).length === 0 &&
    Object.keys(edits.things).length === 0 &&
    Object.keys(edits.patrols ?? {}).length === 0 &&
    Object.keys(edits.newChests ?? {}).length === 0 &&
    (edits.removedChests ?? []).length === 0
  );
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
      const route = edits.patrols?.[thingKey(area.id, 'enemy', e.id)];
      if (route && route.length > 0) return { ...e, patrol: route };
      const c = at('enemy', e.id);
      if (!c) return e;
      const [dc, dr] = [c[0] - e.patrol[0][0], c[1] - e.patrol[0][1]];
      return { ...e, patrol: e.patrol.map(([x, y]): GridCell => [x + dc, y + dr]) };
    }),
    chests: [
      ...area.chests.filter((x) => !edits.removedChests?.includes(thingKey(area.id, 'chest', x.id))).map((x) => moved('chest', x)),
      ...Object.entries(edits.newChests ?? {})
        .filter(([key]) => key.startsWith(`${area.id}/chest/`))
        .map(([key, c]) => ({ id: key.split('/')[2], room: c.room, cell: c.cell, items: [], ...(c.night ? { night: c.night } : {}) })),
    ],
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

/** 物を動かす（元の位置に戻した時は、直しから外す）。見回りの道を引き直した敵は、引き直した道ごとずらす */
export function moveThing(edits: MapEdits, original: AreaDef, thing: PlacedThing, cell: GridCell): MapEdits {
  const added = edits.newChests?.[thing.key];
  if (added) return { ...edits, newChests: { ...edits.newChests, [thing.key]: { ...added, cell: [cell[0], cell[1]] } } };
  const route = thing.kind === 'enemy' ? edits.patrols?.[thing.key] : undefined;
  if (route && route.length > 0) {
    const [dc, dr] = [cell[0] - route[0][0], cell[1] - route[0][1]];
    return setPatrol(edits, original, thing, route.map(([x, y]): GridCell => [x + dc, y + dr]));
  }
  const base = placedThings(original, thing.room).find((t) => t.key === thing.key)?.cell;
  const things = { ...edits.things };
  if (base && base[0] === cell[0] && base[1] === cell[1]) delete things[thing.key];
  else things[thing.key] = [cell[0], cell[1]];
  return { ...edits, things };
}

/**
 * 敵の見回りの道を引き直す（段階119）。route は折り返しの点の全部（最初の点が敵の立つ所。1点なら動かない、2点なら行き来、3点以上なら輪）。
 * 元の道と同じなら直しから外す。引き直した敵の位置の直し（things）は、道の最初の点に含めるので外す
 */
export function setPatrol(edits: MapEdits, original: AreaDef, thing: PlacedThing, route: GridCell[]): MapEdits {
  const base = original.enemies.find((e) => thingKey(original.id, 'enemy', e.id) === thing.key)?.patrol ?? [];
  const patrols = { ...edits.patrols };
  const things = { ...edits.things };
  delete things[thing.key];
  if (JSON.stringify(base) === JSON.stringify(route)) delete patrols[thing.key];
  else patrols[thing.key] = route.map(([x, y]): GridCell => [x, y]);
  const next: MapEdits = { ...edits, things, patrols };
  if (Object.keys(patrols).length === 0) delete next.patrols;
  return next;
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

/** 塗り方：歩ける（# と屋根の下を . に）・通れない（# に）・屋根の下（段階118。歩ける ^ に） */
export type PaintMode = 'open' | 'block' | 'roof';

/** マスを塗る。出発点 S とチェックポイント P はそのまま */
export function paintCells(edits: MapEdits, original: RoomDef, cells: GridCell[], mode: PaintMode): MapEdits {
  const room = patchRoom(original, edits);
  const to = (old: string): string => {
    if (old === 'S' || old === 'P') return old;
    if (mode === 'block') return '#';
    if (mode === 'roof') return ROOF;
    return old === '#' || old === ROOF ? '.' : old;
  };
  return setRoom(edits, original, { layout: withCells(room.layout, cells, to) });
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

/** 宝箱を足す（段階120）。id は「区画_chest_new番号」 */
export function addChest(edits: MapEdits, area: AreaDef, room: string, cell: GridCell, night = 0): MapEdits {
  const used = new Set([...area.chests.map((c) => c.id), ...Object.keys(edits.newChests ?? {}).map((k) => k.split('/')[2])]);
  let n = 1;
  while (used.has(`${area.id}_chest_new${n}`)) n++;
  const key = thingKey(area.id, 'chest', `${area.id}_chest_new${n}`);
  return { ...edits, newChests: { ...edits.newChests, [key]: { room, cell: [cell[0], cell[1]], ...(night > 0 ? { night } : {}) } } };
}

/** 宝箱を消す（段階120）。足した宝箱はなかったことにし、元の宝箱は消した印を付ける（動かした直しも外す） */
export function removeChest(edits: MapEdits, thing: PlacedThing): MapEdits {
  if (edits.newChests?.[thing.key]) {
    const newChests = { ...edits.newChests };
    delete newChests[thing.key];
    const next: MapEdits = { ...edits, newChests };
    if (Object.keys(newChests).length === 0) delete next.newChests;
    return next;
  }
  const things = { ...edits.things };
  delete things[thing.key];
  return { ...edits, things, removedChests: [...(edits.removedChests ?? []), thing.key] };
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
    const out: MapEdits = { rooms, things };
    if (v.patrols && typeof v.patrols === 'object' && Object.keys(v.patrols).length > 0) out.patrols = v.patrols;
    if (v.newChests && typeof v.newChests === 'object' && Object.keys(v.newChests).length > 0) out.newChests = v.newChests;
    if (Array.isArray(v.removedChests) && v.removedChests.length > 0) out.removedChests = v.removedChests;
    return out;
  } catch {
    return emptyMapEdits();
  }
}
