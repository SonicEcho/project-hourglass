import { describe, expect, it } from 'vitest';
import type { AreaDef, RoomDef } from '../../src/core';
import {
  applyMapEdits,
  checkArea,
  emptyMapEdits,
  exitAtTap,
  exitCells,
  exportMapEdits,
  isEmptyMapEdits,
  isWalkable,
  parseGrid,
  roofCells,
  moveExit,
  moveMark,
  moveThing,
  paintCells,
  parseMapEdits,
  patchRoom,
  placedThings,
  setPatrol,
  addChest,
  removeChest,
  chestKeys,
  placeChestInOrder,
  moveChestTo,
  linkedGather,
  overviewLayout,
  overviewCell,
  OVERVIEW_GAP,
  paintRoofFine,
  roofMask,
  isShade,
} from '../../src/core';

// 段階117：地図の調整（スマホで部屋の歩ける場所・出入口・物の位置を直す）

const LAYOUT = [
  '##########',
  '#S.......#',
  '#........#',
  '....P....#',
  '.........#',
  '.........#',
  '.........#',
  '#........#',
  '#........#',
  '##########',
];
const ROOM: RoomDef = { id: 'r1', layout: LAYOUT, exits: ['left'] };
const ROOM2: RoomDef = { id: 'r2', layout: LAYOUT.map((l) => l.replace('S', '.').replace('P', '.')), exits: ['left'] };

const AREA: AreaDef = {
  id: 'ax',
  name: '試し',
  rooms: [{ ...ROOM, exits: [] }],
  chests: [{ id: 'c1', cell: [6, 2], items: [] }],
  enemies: [{ id: 'e1', patrol: [[2, 2], [5, 2]], battle: 'b1' }],
  boss: { id: 'boss', cell: [7, 6], battle: 'bb' },
  talkers: [{ id: 't1', cell: [3, 6], scene: 's1', label: '人' }],
  triggers: [{ on: 'checkpoint', scene: 'cp', cell: [4, 3] }],
  komaNeed: 1,
  nights: [{ koma: 1, exit: { cell: [2, 7] } }, { start: { cell: [4, 3] } }],
  hunt: { gathers: [{ id: 'g1', cell: [8, 8], items: [] }] },
};

describe('地図の調整', () => {
  it('塗ると歩ける・通れないが変わり、S と P はそのまま', () => {
    let edits = paintCells(emptyMapEdits(), ROOM, [[2, 2], [1, 1], [4, 3]], 'block');
    const room = patchRoom(ROOM, edits);
    expect(room.layout[2][2]).toBe('#');
    expect(room.layout[1][1]).toBe('S');
    expect(room.layout[3][4]).toBe('P');
    edits = paintCells(edits, ROOM, [[2, 2], [0, 1]], 'open');
    expect(patchRoom(ROOM, edits).layout[1][0]).toBe('.');
    // 元に戻した所は、直しから外れる
    edits = paintCells(edits, ROOM, [[0, 1]], 'block');
    expect(isEmptyMapEdits(edits)).toBe(true);
  });

  it('屋根の下（段階118）：^ に塗ると歩けて、歩けるで塗ると屋根が外れる', () => {
    let edits = paintCells(emptyMapEdits(), ROOM, [[0, 0], [2, 2], [1, 1]], 'roof');
    const room = patchRoom(ROOM, edits);
    expect(roofCells(room)).toEqual([[0, 0], [2, 2]]);
    expect(isWalkable(parseGrid(room.layout), [0, 0])).toBe(true);
    expect(room.layout[1][1]).toBe('S');
    edits = paintCells(edits, ROOM, [[0, 0], [2, 2]], 'open');
    expect(roofCells(patchRoom(ROOM, edits))).toEqual([]);
    expect(patchRoom(ROOM, edits).layout[0][0]).toBe('.');
  });

  it('細かい屋根（段階121）：小さな四角ごとに塗り・外し、元と同じになると直しから外れる', () => {
    // マス (2,2) の左上の小さな四角と、その右の四角
    let edits = paintRoofFine(emptyMapEdits(), ROOM, [[8, 8], [9, 8]], true);
    let room = patchRoom(ROOM, edits);
    expect(roofMask(room, 2, 2)).toBe(0b11);
    expect(roofCells(room)).toEqual([[2, 2]]);
    expect(room.roofFine).toEqual({ '2,2': '0003' });
    // 全部屋根の ^ のマスの一部を外す
    edits = paintCells(edits, ROOM, [[3, 3]], 'roof');
    edits = paintRoofFine(edits, ROOM, [[15, 15]], false);
    room = patchRoom(ROOM, edits);
    expect(roofMask(room, 3, 3)).toBe(0xffff & ~(1 << 15));
    // 歩けるで塗ると、そのマスの細かい屋根も外れる
    edits = paintCells(edits, ROOM, [[2, 2], [3, 3]], 'open');
    expect(isEmptyMapEdits(edits)).toBe(true);
  });

  it('陰（段階121）：: に塗ると歩けて、歩けるで塗ると外れる', () => {
    let edits = paintCells(emptyMapEdits(), ROOM, [[2, 2]], 'shade');
    const room = patchRoom(ROOM, edits);
    expect(isShade(room, [2, 2])).toBe(true);
    expect(isWalkable(parseGrid(room.layout), [2, 2])).toBe(true);
    edits = paintCells(edits, ROOM, [[2, 2]], 'open');
    expect(isEmptyMapEdits(edits)).toBe(true);
  });

  it('出入口をずらすと、辺と内側のマスが開き、前の辺のマスは閉じる', () => {
    const edits = moveExit(emptyMapEdits(), ROOM, 'left', 1);
    const room = patchRoom(ROOM, edits);
    expect(exitCells(room, 'left')).toEqual([[0, 1], [0, 2], [0, 3], [0, 4]]);
    expect(room.layout.map((l) => l[0]).join('')).toBe('#....#####');
    expect(room.layout[1][1]).toBe('S');
    expect(edits.rooms.r1.exitAt).toEqual({ left: 1 });
    // 辺からはみ出す所は、端に寄せる
    expect(exitCells(patchRoom(ROOM, moveExit(edits, ROOM, 'left', 9)), 'left')[3]).toEqual([0, 9]);
  });

  it('タップしたマスから、近い辺の出入口の位置を決める', () => {
    expect(exitAtTap(ROOM, [1, 2])).toEqual({ side: 'left', first: 1 });
    expect(exitAtTap(ROOM, [7, 2])).toBeNull();
  });

  it('物を動かす：敵は見回りの道ごと、元の所に戻すと直しから外れる', () => {
    const enemy = placedThings(AREA, 'r1').find((t) => t.kind === 'enemy')!;
    let edits = moveThing(emptyMapEdits(), AREA, enemy, [2, 5]);
    expect(applyMapEdits(AREA, edits).enemies[0].patrol).toEqual([[2, 5], [5, 5]]);
    edits = moveThing(edits, AREA, enemy, [2, 2]);
    expect(isEmptyMapEdits(edits)).toBe(true);
  });

  it('敵の見回りの道を引き直す（段階119）：元の道と同じなら外れ、引き直した後に動かすと道ごとずれる', () => {
    const enemy = placedThings(AREA, 'r1').find((t) => t.kind === 'enemy')!;
    let edits = moveThing(emptyMapEdits(), AREA, enemy, [2, 5]);
    edits = setPatrol(edits, AREA, { ...enemy, cell: [2, 5] }, [[2, 5], [6, 5], [6, 7]]);
    expect(edits.things).toEqual({});
    expect(applyMapEdits(AREA, edits).enemies[0].patrol).toEqual([[2, 5], [6, 5], [6, 7]]);
    expect(checkArea(applyMapEdits(AREA, edits))).toEqual([]);
    edits = moveThing(edits, AREA, enemy, [3, 5]);
    expect(applyMapEdits(AREA, edits).enemies[0].patrol).toEqual([[3, 5], [7, 5], [7, 7]]);
    expect(parseMapEdits(exportMapEdits(edits))).toEqual(edits);
    edits = setPatrol(edits, AREA, enemy, [[2, 2], [5, 2]]);
    expect(isEmptyMapEdits(edits)).toBe(true);
  });

  it('宝箱を足す・消す（段階120）：足した宝箱は空で出て、動かせる。元の宝箱を消すと区画から外れる', () => {
    let edits = addChest(emptyMapEdits(), AREA, 'r1', [3, 7], 2);
    edits = addChest(edits, AREA, 'r1', [5, 7]);
    let a = applyMapEdits(AREA, edits);
    expect(a.chests.map((c) => c.id)).toEqual(['c1', 'ax_chest_new1', 'ax_chest_new2']);
    expect(a.chests[1]).toEqual({ id: 'ax_chest_new1', room: 'r1', cell: [3, 7], items: [], night: 2 });
    const added = placedThings(a, 'r1').find((t) => t.id === 'ax_chest_new2')!;
    edits = moveThing(edits, AREA, added, [6, 7]);
    expect(applyMapEdits(AREA, edits).chests[2].cell).toEqual([6, 7]);
    edits = removeChest(edits, added);
    const original = placedThings(AREA, 'r1').find((t) => t.id === 'c1')!;
    edits = removeChest(moveThing(edits, AREA, original, [6, 6]), original);
    a = applyMapEdits(AREA, edits);
    expect(a.chests.map((c) => c.id)).toEqual(['ax_chest_new1']);
    expect(edits.things).toEqual({});
    expect(parseMapEdits(exportMapEdits(edits))).toEqual(edits);
    // ほかの区画の足した宝箱は入らない
    expect(applyMapEdits({ ...AREA, id: 'az' }, edits).chests.map((c) => c.id)).toEqual(['c1']);
  });

  // 段階123：全体地図で、区画のどの部屋へでも宝箱を置く
  const AREA2: AreaDef = {
    ...AREA,
    rooms: [ROOM, ROOM2],
    links: [{ a: { room: 'r1', side: 'left' }, b: { room: 'r2', side: 'left' } }],
    chests: [...AREA.chests, { id: 'c2', room: 'r2', cell: [6, 3], items: ['potion'] }],
    hunt: { gathers: [{ id: 'g1', cell: [6, 2], items: [] }, { id: 'g2', room: 'r2', cell: [8, 8], items: [] }] },
  };

  it('宝箱を別の部屋へ動かす（段階123）：中身と id はそのままで、同じマスの採取の場所も一緒に動く。元に戻すと直しから外れる', () => {
    expect(linkedGather(AREA2, 'ax/chest/c1')).toBe('ax/gather/g1');
    expect(linkedGather(AREA2, 'ax/chest/c2')).toBeUndefined();
    let edits = moveChestTo(emptyMapEdits(), AREA2, 'ax/chest/c1', 'r2', [3, 4]);
    expect(edits.thingRooms).toEqual({ 'ax/chest/c1': 'r2', 'ax/gather/g1': 'r2' });
    const a = applyMapEdits(AREA2, edits);
    expect(a.chests[0]).toEqual({ id: 'c1', cell: [3, 4], items: [], room: 'r2' });
    expect(a.hunt!.gathers[0]).toEqual({ id: 'g1', cell: [3, 4], items: [], room: 'r2' });
    expect(placedThings(a, 'r2').filter((t) => t.kind === 'chest').map((t) => t.id)).toEqual(['c1', 'c2']);
    expect(parseMapEdits(exportMapEdits(edits))).toEqual(edits);
    edits = moveChestTo(edits, AREA2, 'ax/chest/c1', 'r1', [6, 2]);
    expect(isEmptyMapEdits(edits)).toBe(true);
    // 足した宝箱は、newChests の部屋とマスが変わる
    edits = addChest(emptyMapEdits(), AREA2, 'r1', [3, 7], 2);
    edits = moveChestTo(edits, AREA2, 'ax/chest/ax_chest_new1', 'r2', [2, 2]);
    expect(edits.newChests).toEqual({ 'ax/chest/ax_chest_new1': { room: 'r2', cell: [2, 2], night: 2 } });
  });

  it('持ち上げた宝箱を順に置く（段階122・123）：タップした部屋とマスへ順に移り、置き終えたら新しい宝箱を足す', () => {
    let edits = emptyMapEdits();
    let waiting = chestKeys(AREA2);
    expect(waiting).toEqual(['ax/chest/c1', 'ax/chest/c2']);
    // 先に消した宝箱は飛ばす
    edits = removeChest(edits, placedThings(AREA2, 'r1').find((t) => t.id === 'c1')!);
    ({ edits, waiting } = placeChestInOrder(edits, AREA2, waiting, 'r1', [2, 4]));
    expect(waiting).toEqual([]);
    let a = applyMapEdits(AREA2, edits);
    expect(a.chests.map((c) => [c.id, c.room, c.cell])).toEqual([['c2', 'r1', [2, 4]]]);
    ({ edits, waiting } = placeChestInOrder(edits, AREA2, waiting, 'r2', [2, 6], 2));
    a = applyMapEdits(AREA2, edits);
    expect(a.chests[1]).toEqual({ id: 'ax_chest_new1', room: 'r2', cell: [2, 6], items: [], night: 2 });
  });

  it('全体地図の並び（段階123）：部屋はつなぎの向きに並び、全体のマスから部屋とマスがわかる', () => {
    const layout = overviewLayout(AREA2);
    // r2 は r1 の左
    expect(layout.offsets).toEqual({ r2: [0, 0], r1: [10 + OVERVIEW_GAP, 0] });
    expect([layout.cols, layout.rows]).toEqual([20 + OVERVIEW_GAP, 10]);
    expect(overviewCell(AREA2, layout, [3, 4])).toEqual({ room: 'r2', cell: [3, 4] });
    expect(overviewCell(AREA2, layout, [10 + OVERVIEW_GAP + 1, 2])).toEqual({ room: 'r1', cell: [1, 2] });
    expect(overviewCell(AREA2, layout, [10, 2])).toBeNull();
  });

  it('宝箱・人・ぬし・採取・晩の始めと帰り口を動かせる', () => {
    const things = placedThings(AREA, 'r1');
    expect(things.map((t) => t.kind).sort()).toEqual(['boss', 'chest', 'enemy', 'exit', 'gather', 'start', 'talker', 'trigger']);
    let edits = emptyMapEdits();
    for (const t of things) if (t.kind !== 'enemy' && t.kind !== 'trigger') edits = moveThing(edits, AREA, t, [5, 5]);
    const a = applyMapEdits(AREA, edits);
    expect(a.chests[0].cell).toEqual([5, 5]);
    expect(a.talkers[0].cell).toEqual([5, 5]);
    expect(a.boss.cell).toEqual([5, 5]);
    expect(a.hunt!.gathers[0].cell).toEqual([5, 5]);
    expect(a.nights![1].start!.cell).toEqual([5, 5]);
    expect(a.nights![0].exit!.cell).toEqual([5, 5]);
    expect(placedThings(AREA, 'r2')).toEqual([]);
  });

  it('P を動かすと、そのチェックポイントの会話も一緒に動く', () => {
    const edits = moveMark(emptyMapEdits(), AREA, ROOM, [4, 3], [6, 6]);
    const a = applyMapEdits(AREA, edits);
    expect(a.rooms[0].layout[6][6]).toBe('P');
    expect(a.rooms[0].layout[3][4]).toBe('.');
    expect(a.triggers[0]).toMatchObject({ cell: [6, 6] });
    // S・P でないマスからは動かさない
    expect(moveMark(emptyMapEdits(), AREA, ROOM, [2, 2], [6, 6])).toEqual(emptyMapEdits());
  });

  it('直した区画も検査できる（通れなくしたマスにいる敵を見つける）', () => {
    expect(checkArea(AREA)).toEqual([]);
    const edits = paintCells(emptyMapEdits(), ROOM, [[5, 2]], 'block');
    expect(checkArea(applyMapEdits(AREA, edits)).length).toBeGreaterThan(0);
  });

  it('部屋の直しは、同じ部屋を使う区画のどれにも効く', () => {
    const edits = paintCells(emptyMapEdits(), ROOM2, [[2, 2]], 'block');
    const other: AreaDef = { ...AREA, id: 'ay', rooms: [ROOM, ROOM2] };
    expect(applyMapEdits(other, edits).rooms[1].layout[2][2]).toBe('#');
    expect(applyMapEdits(other, edits).rooms[0].layout[2][2]).toBe('.');
  });

  it('書き出しの文から戻せる。読めない文は空', () => {
    const edits = moveExit(moveThing(emptyMapEdits(), AREA, placedThings(AREA, 'r1')[1], [5, 5]), ROOM, 'left', 2);
    expect(parseMapEdits(exportMapEdits(edits))).toEqual(edits);
    expect(parseMapEdits('こわれた{')).toEqual(emptyMapEdits());
    expect(parseMapEdits(null)).toEqual(emptyMapEdits());
  });
});
