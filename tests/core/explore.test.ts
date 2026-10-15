import { describe, expect, it } from 'vitest';
import type { AreaDef } from '../../src/core';
import {
  addKoma,
  areaGrid,
  findPath,
  isWalkable,
  keepVitals,
  komaExtra,
  komaLeft,
  komaVars,
  arrive,
  bossReady,
  chestAt,
  checkArea,
  defeatEnemy,
  enemyActive,
  loseBattle,
  markTrigger,
  normalizeExplore,
  openChest,
  patrolRoute,
  pendingTrigger,
  startExplore,
  triggerGears,
  checkRoom,
  enemyNext,
  entryCells,
  exitCells,
  passDoor,
  roomPositions,
  startMind,
} from '../../src/core';
import type { RoomDef } from '../../src/core';

// 小さな区画：S 出発点、P チェックポイント、# は通れない
const area: AreaDef = {
  id: 't',
  name: 'テスト',
  rooms: [
    {
      id: 'main',
      exits: [],
      layout: [
        '#######', //
        '#.....#',
        '#.###.#',
        '#..P..#',
        '#.....#',
        '#..S..#',
        '#######',
      ],
    },
  ],
  chests: [{ id: 'c1', cell: [1, 1], items: ['potion', 'potion'] }],
  enemies: [
    { id: 'e1', patrol: [[1, 3], [1, 4]], battle: 'b1' },
    { id: 'e2', patrol: [[5, 3], [5, 4]], battle: 'b2' },
  ],
  boss: { id: 'boss', cell: [3, 1], battle: 'bb' },
  talkers: [{ id: 'v1', cell: [4, 4], scene: 'voice', label: '人' }],
  triggers: [
    { on: 'wins', count: 1, scene: 'first' },
    { on: 'checkpoint', scene: 'cp', gears: ['speedMemory'] },
    { on: 'wins', count: 2, scene: 'two' },
    { on: 'boss', scene: 'before' },
    { on: 'cleared', scene: 'after' },
  ],
  komaNeed: 5,
};

describe('探索（段階25）', () => {
  it('出発点から始まり、チェックポイントも最初は出発点', () => {
    const s = startExplore(area);
    expect(s.cell).toEqual([3, 5]);
    expect(s.checkpoint).toEqual([3, 5]);
    expect(checkArea(area)).toEqual([]);
  });

  it('宝箱のマスは通れない（上を歩けない）。道は宝箱をよける', () => {
    const map = areaGrid(area);
    expect(isWalkable(map, [1, 1])).toBe(false);
    expect(isWalkable(map, [2, 1])).toBe(true);
    // 宝箱の隣のマスへは歩ける
    expect(findPath(map, [3, 5], [2, 1])).not.toBeNull();
    expect(checkArea({ ...area, chests: [{ id: 'c9', cell: [0, 0], items: [] }] })).toContain('t：宝箱 c9 が通れないマス（0,0）にある');
  });

  it('宝箱は通っただけでは開かない（段階26）', () => {
    const r = arrive(area, startExplore(area), [1, 1]);
    expect(r.event).toEqual({ type: 'none' });
    expect(r.state.openedChests).toEqual([]);
    expect(chestAt(area, r.state, [1, 1])).toEqual(area.chests[0]);
    expect(chestAt(area, r.state, [2, 1])).toBeNull();
  });

  it('宝箱は開けると1回だけ中身が出る', () => {
    const r = openChest(area, startExplore(area), 'c1');
    expect(r?.chest).toEqual(area.chests[0]);
    expect(r?.state.openedChests).toEqual(['c1']);
    expect(openChest(area, r!.state, 'c1')).toBeNull();
    expect(chestAt(area, r!.state, [1, 1])).toBeNull();
    expect(openChest(area, startExplore(area), 'nothing')).toBeNull();
  });

  it('チェックポイントで記録し、負けるとそこへ戻る', () => {
    const r = arrive(area, startExplore(area), [3, 3]);
    expect(r.event).toEqual({ type: 'checkpoint', first: true, healed: false });
    expect(arrive(area, r.state, [3, 3]).event).toEqual({ type: 'checkpoint', first: false, healed: false });
    const away = { ...r.state, cell: [1, 1] as [number, number] };
    expect(loseBattle(away).cell).toEqual([3, 3]);
    // 記録する前に負けたら出発点へ
    expect(loseBattle({ ...startExplore(area), cell: [1, 1] }).cell).toEqual([3, 5]);
  });

  it('倒した敵の印は消え、勝った回数で途中の会話が出る（1回ずつ）', () => {
    let s = startExplore(area);
    expect(pendingTrigger(area, s, 'wins')).toBeNull();
    s = defeatEnemy(s, 'e1');
    expect(enemyActive(s, 'e1')).toBe(false);
    expect(enemyActive(s, 'e2')).toBe(true);
    expect(pendingTrigger(area, s, 'wins')?.scene).toBe('first');
    s = markTrigger(s, 'first');
    expect(pendingTrigger(area, s, 'wins')).toBeNull();
    s = defeatEnemy(defeatEnemy(s, 'e2'), 'e2');
    expect(s.defeated).toEqual(['e1', 'e2']);
    expect(pendingTrigger(area, s, 'wins')?.scene).toBe('two');
    // ボスは勝った回数に数えない
    expect(pendingTrigger(area, defeatEnemy(startExplore(area), 'boss'), 'wins')).toBeNull();
    expect(pendingTrigger(area, s, 'boss')?.scene).toBe('before');
  });

  it('敵の印の道は、折り返しの点を最短でつなぐ', () => {
    expect(patrolRoute(areaGrid(area), [[1, 3], [1, 4]])).toEqual([[1, 3], [1, 4]]);
  });

  it('コマ：勝つと増え、返すのに要る残りと、余りがわかる。残りが少なくなると会話が出る（段階28）', () => {
    let s = startExplore(area);
    expect(komaLeft(area, s)).toBe(5);
    s = addKoma(s, 2);
    expect(komaVars(area, s)).toEqual({ komaHave: '2', komaNeed: '5', komaLeft: '3' });
    const withLeft = { ...area, triggers: [{ on: 'komaLeft' as const, left: 3, scene: 'left3' }] };
    expect(pendingTrigger(withLeft, startExplore(area), 'komaLeft')).toBeNull();
    expect(pendingTrigger(withLeft, s, 'komaLeft')?.scene).toBe('left3');
    s = addKoma(s, 4);
    expect(komaLeft(area, s)).toBe(0);
    expect(komaExtra(area, s)).toBe(1);
    // そろった後は「あと◯つ」の会話は出ない
    expect(pendingTrigger(withLeft, s, 'komaLeft')).toBeNull();
    expect(normalizeExplore(area, { ...s, koma: -1 })?.koma).toBe(0);
  });

  it('ボスは、ボスのコマを足せば返せる数になるまで戦えない（段階32b 調整3）', () => {
    // area は返すのに5つ。ボスが2つ抱えているなら、3つ集めるまで眠っている
    let s = startExplore(area);
    expect(bossReady(area, s, 2)).toBe(false);
    s = addKoma(s, 2);
    expect(bossReady(area, s, 2)).toBe(false);
    s = addKoma(s, 1);
    expect(bossReady(area, s, 2)).toBe(true);
    expect(bossReady(area, startExplore(area), 5)).toBe(true);
  });

  it('HP・MP：勝った後は持ち越し、チェックポイントに着くと全回復、負けても全回復（段階32b 調整3）', () => {
    const vitals = { hero: { hp: 40, mp: 3 } };
    let s = keepVitals(startExplore(area), vitals);
    expect(s.vitals).toEqual(vitals);
    // 覚えた値は、渡した物と切り離す
    vitals.hero.hp = 1;
    expect(s.vitals?.hero.hp).toBe(40);
    expect(loseBattle(s).vitals).toBeUndefined();
    const r = arrive(area, s, [3, 3]);
    expect(r.event).toEqual({ type: 'checkpoint', first: true, healed: true });
    expect(r.state.vitals).toBeUndefined();
    expect(arrive(area, r.state, [3, 3]).event).toEqual({ type: 'checkpoint', first: false, healed: false });
    // 歩くだけでは変わらない
    s = keepVitals(s, { hero: { hp: 40, mp: 3 } });
    expect(arrive(area, s, [3, 4]).state.vitals).toEqual({ hero: { hp: 40, mp: 3 } });
  });

  it('セーブから読んだ状態を、今の区画に合わせて整える', () => {
    const raw = { area: 't', cell: [0, 0], checkpoint: [3, 3], openedChests: ['c1', 'gone'], defeated: ['e1', 'x'], seen: ['first', 'y'], cleared: true, koma: 3 };
    expect(normalizeExplore(area, raw)).toEqual({
      area: 't',
      room: 'main',
      cell: [3, 5],
      checkpoint: [3, 3],
      checkpointRoom: 'main',
      visited: ['main'],
      openedChests: ['c1'],
      defeated: ['e1'],
      seen: ['first'],
      cleared: true,
      koma: 3,
    });
    expect(normalizeExplore(area, 'x')).toBeNull();
    // HP・MP は形の合う仲間だけ残す（なければ全回復）
    expect(normalizeExplore(area, { ...raw, vitals: { hero: { hp: 30, mp: 2 }, bad: { hp: 'x' } } })?.vitals).toEqual({ hero: { hp: 30, mp: 2 } });
    expect(normalizeExplore(area, { ...raw, vitals: { bad: 1 } })?.vitals).toBeUndefined();
  });

  it('区画の書き間違いを見つける', () => {
    const bad: AreaDef = { ...area, chests: [{ id: 'c1', cell: [0, 0], items: [] }], boss: { id: 'c1', cell: [3, 1], battle: 'bb' } };
    expect(checkArea(bad)).toEqual(['t：宝箱 c1 が通れないマス（0,0）にある', 't：宝箱 c1 の隣に立てるマスがない', 't：id が重なっている：c1']);
  });
});

describe('チェックポイントが2つある区画（段階37）', () => {
  // 左の P（1,3）と右の P（5,3）。右の P の会話を見た後に、2回目の勝ちで出る会話
  const two: AreaDef = {
    ...area,
    rooms: [{ id: 'main', exits: [], layout: ['#######', '#.....#', '#.###.#', '#P...P#', '#.....#', '#..S..#', '#######'] }],
    triggers: [
      { on: 'checkpoint', cell: [1, 3], scene: 'left' },
      { on: 'checkpoint', cell: [5, 3], scene: 'right' },
      { on: 'wins', count: 2, after: 'right', scene: 'eaten' },
    ],
  };

  it('着いたチェックポイントの会話だけが出る', () => {
    const atRight = arrive(two, startExplore(two), [5, 3]).state;
    expect(pendingTrigger(two, atRight, 'checkpoint')?.scene).toBe('right');
    const atLeft = arrive(two, startExplore(two), [1, 3]).state;
    expect(pendingTrigger(two, atLeft, 'checkpoint')?.scene).toBe('left');
    // 見た後は、もう一方に着いた時だけ
    const seen = markTrigger(atLeft, 'left');
    expect(pendingTrigger(two, seen, 'checkpoint')).toBeNull();
    expect(pendingTrigger(two, arrive(two, seen, [5, 3]).state, 'checkpoint')?.scene).toBe('right');
  });

  it('先に見る会話（after）を見るまで、勝った回数の会話は出ない', () => {
    const won = defeatEnemy(defeatEnemy(startExplore(two), 'e1'), 'e2');
    expect(pendingTrigger(two, won, 'wins')).toBeNull();
    expect(pendingTrigger(two, markTrigger(won, 'right'), 'wins')?.scene).toBe('eaten');
  });

  it('書き間違い：P でないマスのチェックポイント、ない会話を先に見る', () => {
    expect(checkArea(two)).toEqual([]);
    const bad: AreaDef = {
      ...two,
      triggers: [
        { on: 'checkpoint', cell: [2, 3], scene: 'left' },
        { on: 'wins', count: 2, after: 'nothing', scene: 'eaten' },
      ],
    };
    expect(checkArea(bad)).toEqual(['t：会話 left のチェックポイント（2,3）が P のマスではない', 't：会話 eaten の先に見る会話 nothing がない']);
  });
});

describe('会話のごほうびのギア（段階38）', () => {
  it('ごほうびのある会話を初めて見た時だけ、そのギアを返す（見た後と、ごほうびのない会話は空）', () => {
    const s0 = startExplore(area);
    expect(triggerGears(area, s0, 'cp')).toEqual(['speedMemory']);
    expect(triggerGears(area, s0, 'first')).toEqual([]);
    expect(triggerGears(area, s0, 'unknown')).toEqual([]);
    const s1 = markTrigger(s0, 'cp');
    expect(triggerGears(area, s1, 'cp')).toEqual([]);
  });
});

describe('部屋をつなぐ区画（段階47a）', () => {
  // 8×8 の部屋3つ。A（出発点）の右 ⇔ B の左、B の上 ⇔ C の下（e1 を倒すと開く）。出入口は辺の真ん中の4マス（2〜5）
  const A: RoomDef = { id: 'A', exits: ['right'], layout: ['########', '#......#', '#.......', '#.......', '#..S....', '#.......', '#......#', '########'] };
  const B: RoomDef = { id: 'B', exits: ['left', 'top'], layout: ['##....##', '#......#', '.......#', '.......#', '.......#', '......P#', '#......#', '########'] };
  const C: RoomDef = { id: 'C', exits: ['bottom'], layout: ['########', '#......#', '#......#', '#......#', '#......#', '#......#', '#......#', '##....##'] };
  const rooms3: AreaDef = {
    id: 'r3',
    name: '部屋3つ',
    rooms: [A, B, C],
    links: [
      { a: { room: 'A', side: 'right' }, b: { room: 'B', side: 'left' } },
      { a: { room: 'B', side: 'top' }, b: { room: 'C', side: 'bottom' }, opensWhen: 'e1' },
    ],
    chests: [{ id: 'cb', room: 'B', cell: [3, 3], items: ['potion'] }],
    enemies: [{ id: 'e1', room: 'B', patrol: [[2, 6], [5, 6]], battle: 'b1' }],
    boss: { id: 'boss', room: 'C', cell: [3, 2], battle: 'bb' },
    talkers: [],
    triggers: [{ on: 'checkpoint', room: 'B', cell: [6, 5], scene: 'cpB' }],
    komaNeed: 1,
  };

  it('書き間違いがない。出入口は辺の真ん中の4マスで、入口はその1マス内側', () => {
    expect(checkArea(rooms3)).toEqual([]);
    expect(exitCells(A, 'right')).toEqual([[7, 2], [7, 3], [7, 4], [7, 5]]);
    expect(entryCells(B, 'left')).toEqual([[1, 2], [1, 3], [1, 4], [1, 5]]);
    expect(exitCells(C, 'bottom')).toEqual([[2, 7], [3, 7], [4, 7], [5, 7]]);
  });

  it('出入口のマスに着くと、つながった部屋の出入口の内側（同じ並び）に移り、入った部屋を覚える', () => {
    const s0 = startExplore(rooms3);
    expect(s0).toMatchObject({ room: 'A', checkpointRoom: 'A', visited: ['A'] });
    const r = passDoor(rooms3, s0, [7, 3]);
    expect(r).toEqual({ type: 'moved', state: { ...s0, room: 'B', cell: [1, 3], visited: ['A', 'B'] } });
    // 出入口ではないマス
    expect(passDoor(rooms3, s0, [6, 3])).toBeNull();
    // 部屋ごとの地図：B の宝箱のマスは B でだけ通れない。宝箱も B にいる時だけ見つかる
    const inB = (r as { state: typeof s0 }).state;
    expect(areaGrid(rooms3, 'B').blocked[3 * 8 + 3]).toBe(true);
    expect(areaGrid(rooms3, 'A').blocked[3 * 8 + 3]).toBe(false);
    expect(chestAt(rooms3, inB, [3, 3])?.id).toBe('cb');
    expect(chestAt(rooms3, s0, [3, 3])).toBeNull();
    // 戻ることもできる
    expect(passDoor(rooms3, inB, [0, 3])).toMatchObject({ type: 'moved', state: { room: 'A', cell: [6, 3] } });
  });

  it('閉じた出入口は、決まった印を倒すまで通れない', () => {
    const inB = { ...startExplore(rooms3), room: 'B', cell: [3, 1] as [number, number], visited: ['A', 'B'] };
    expect(passDoor(rooms3, inB, [3, 0])).toEqual({ type: 'locked', link: rooms3.links![1] });
    const open = passDoor(rooms3, defeatEnemy(inB, 'e1'), [3, 0]);
    expect(open).toMatchObject({ type: 'moved', state: { room: 'C', cell: [3, 6] } });
  });

  it('全体の地図の位置：最初の部屋から、つなぎの向きで隣に置く', () => {
    expect(roomPositions(rooms3)).toEqual({ A: [0, 0], B: [1, 0], C: [1, -1] });
  });

  it('チェックポイントは部屋ごと。負けたら、記録した部屋のチェックポイントへ戻る', () => {
    const inB = { ...startExplore(rooms3), room: 'B', cell: [5, 5] as [number, number], visited: ['A', 'B'] };
    const r = arrive(rooms3, inB, [6, 5]);
    expect(r.event).toMatchObject({ type: 'checkpoint', first: true });
    expect(r.state).toMatchObject({ checkpoint: [6, 5], checkpointRoom: 'B' });
    expect(pendingTrigger(rooms3, r.state, 'checkpoint')?.scene).toBe('cpB');
    // 同じ位置でも、別の部屋ならチェックポイントではない
    expect(arrive(rooms3, startExplore(rooms3), [6, 5]).event.type).toBe('none');
    const back = loseBattle({ ...r.state, room: 'A', cell: [2, 2] });
    expect(back).toMatchObject({ room: 'B', cell: [6, 5] });
  });

  it('セーブから読む：前の版（部屋がない）は最初の部屋。知らない部屋・通れないマスは出発点', () => {
    const fresh = startExplore(rooms3);
    const old = { area: 'r3', cell: [2, 2], checkpoint: [3, 4], openedChests: [], defeated: [], seen: [], cleared: false, koma: 0 };
    expect(normalizeExplore(rooms3, old)).toMatchObject({ room: 'A', cell: [2, 2], checkpointRoom: 'A', visited: ['A'] });
    expect(normalizeExplore(rooms3, { ...old, room: 'B', cell: [1, 3], visited: ['B', 'X'] })).toMatchObject({ room: 'B', cell: [1, 3], visited: ['A', 'B'] });
    expect(normalizeExplore(rooms3, { ...old, room: 'X' })).toMatchObject({ room: 'A' });
    // B の宝箱のマスには立てない
    expect(normalizeExplore(rooms3, { ...old, room: 'B', cell: [3, 3] })).toMatchObject({ room: 'A', cell: fresh.cell });
  });

  it('つなぎの書き間違い（ない出入口、片方だけのつなぎ、ふさがった出入口、どこからも行けない部屋）を見つける', () => {
    const noSide = { ...rooms3, links: [{ a: { room: 'A', side: 'top' as const }, b: { room: 'B', side: 'left' as const } }, rooms3.links![1]] };
    expect(checkArea(noSide).join('\n')).toContain('部屋 A に top の出入口がない');
    expect(checkArea(noSide).join('\n')).toContain('部屋 A の right の出入口がどこにもつながっていない');
    const alone = { ...rooms3, links: [rooms3.links![0]] };
    expect(checkArea(alone).join('\n')).toContain('部屋 C へ行けない');
    expect(checkArea(alone).join('\n')).toContain('部屋 B の top の出入口がどこにもつながっていない');
    expect(checkArea(alone).join('\n')).toContain('出発点からボスまで歩けない');
    const shut: RoomDef = { ...C, layout: [...C.layout.slice(0, 7), '########'] };
    expect(checkRoom(shut)).toEqual(['部屋 C：bottom の出入口がふさがっている']);
    expect(checkArea({ ...rooms3, links: [rooms3.links![0], { ...rooms3.links![1], opensWhen: 'nobody' }] }).join('\n')).toContain('閉じた出入口を開ける印 nobody がない');
  });
});

describe('敵の動き（段階47b）', () => {
  // 7×5 の広場（まわりは壁）
  const room: RoomDef = { id: 'm', exits: [], layout: ['#######', '#.....#', '#.....#', '#.....#', '#######'] };
  const map = parseGridOf(room);
  const tuning = { notice: 2, giveUp: 3 };
  const route = patrolRoute(map, [[1, 1], [5, 1]]);

  it('見回りは道の次のマスへ。番人は動かない', () => {
    const m0 = startMind(route);
    expect(enemyNext(map, 'patrol', route, m0, [5, 3], tuning).cell).toEqual([2, 1]);
    expect(enemyNext(map, 'guard', [[3, 2]], startMind([[3, 2]]), [3, 3], tuning)).toEqual(startMind([[3, 2]]));
  });

  it('追ってくる敵は、近くに来ると追い始め、離れるとあきらめて道へ戻る', () => {
    const m0 = startMind(route);
    // 遠い間は見回り
    expect(enemyNext(map, 'chase', route, m0, [5, 3], tuning)).toMatchObject({ chasing: false, cell: [2, 1] });
    // 2マス以内に来ると、仲間へ向かって1歩
    const near = enemyNext(map, 'chase', route, m0, [1, 3], tuning);
    expect(near).toMatchObject({ chasing: true, cell: [1, 2] });
    // 追っている間は3マスまで追う。4マス離れるとあきらめる
    expect(enemyNext(map, 'chase', route, { ...near, cell: [1, 1] }, [4, 1], tuning).chasing).toBe(true);
    const gaveUp = enemyNext(map, 'chase', route, { ...near, cell: [1, 2] }, [5, 3], tuning);
    expect(gaveUp.chasing).toBe(false);
    // 道の外にいる時は、向かっていた点へ戻る
    expect(gaveUp.cell).toEqual([1, 1]);
  });

  it('逃げる敵は、近づくと遠ざかり、追いつめられるとその場にとどまる', () => {
    const m: ReturnType<typeof startMind> = { cell: [3, 2], index: 0, chasing: false };
    expect(enemyNext(map, 'flee', [[3, 2]], m, [2, 2], tuning).cell).toEqual([4, 2]);
    // 角（5,1）で、仲間が斜め隣の（4,2）にいる：どこへ行っても近づくので、とどまる（追いつめた）
    const corner = { ...m, cell: [5, 1] as [number, number] };
    expect(enemyNext(map, 'flee', [[5, 1]], corner, [4, 2], tuning).cell).toEqual([5, 1]);
    // 仲間が横の（4,1）なら、下へ逃げる
    expect(enemyNext(map, 'flee', [[5, 1]], corner, [4, 1], tuning).cell).toEqual([5, 2]);
    // 遠い間は動かない（道が1点）
    expect(enemyNext(map, 'flee', [[3, 2]], m, [5, 3], { notice: 1, giveUp: 0 }).cell).toEqual([3, 2]);
  });
});

function parseGridOf(room: RoomDef) {
  return areaGrid({ id: 'x', name: 'x', rooms: [room], chests: [], enemies: [], boss: { id: 'b', cell: [1, 1], battle: 'b' }, talkers: [], triggers: [], komaNeed: 1 });
}
