import { describe, expect, it } from 'vitest';
import { areaGrid, checkArea, checkNights, isWalkable, nightArea, reachableCells, roomPositions, startRoom } from '../../src/core';
import { A11_REWORK, A11_REWORK_ROOM_NAMES, AREA_BATTLES, AREAS, ROOM_NAMES } from '../../src/data';

// 段階262（docs/milestones/M3_explore_feel.md の 5.・5-7）：新しい1-1の配置の試し
const area = A11_REWORK;

describe('新しい1-1（段階262）', () => {
  it('書き間違いがない（部屋・出入口・つなぎ・置いた物・晩）', () => {
    expect(checkArea(area)).toEqual([]);
    expect(checkNights(area)).toEqual([]);
  });

  it('6部屋で、入口 → 屋台の裏 → 裏通り → 広場 → 入口 の輪になる。全体の地図の位置が重ならない', () => {
    expect(area.rooms.map((r) => r.id)).toEqual(['fest2_gate', 'fest2_backyard', 'fest2_lane', 'fest2_plaza', 'fest2_east', 'fest2_woods']);
    const pos = roomPositions(area);
    expect(pos).toEqual({ fest2_gate: [0, 0], fest2_backyard: [-1, 0], fest2_plaza: [0, -1], fest2_lane: [-1, -1], fest2_east: [1, -1], fest2_woods: [0, -2] });
    expect(new Set(Object.values(pos).map((p) => p.join(','))).size).toBe(6);
    for (const r of area.rooms) expect(ROOM_NAMES[r.id]).toBe(A11_REWORK_ROOM_NAMES[r.id]);
  });

  it('敵の戦闘・コマ・写しの人の台詞・途中の会話・ぬしは、今の1-1 と同じ（置く所だけ変えた）', () => {
    const now = AREAS.a11;
    expect(area.id).toBe('a11');
    expect(area.enemies.map((e) => [e.id, e.battle, e.move, e.night, e.scene]).sort()).toEqual(now.enemies.map((e) => [e.id, e.battle, e.move, e.night, e.scene]).sort());
    expect(area.talkers.map((t) => [t.id, t.scene, t.night, t.until]).sort()).toEqual(now.talkers.map((t) => [t.id, t.scene, t.night, t.until]).sort());
    expect(area.boss.battle).toBe(now.boss.battle);
    expect(area.komaNeed).toBe(now.komaNeed);
    expect(area.enemies.reduce((a, e) => a + (AREA_BATTLES[e.battle]?.koma ?? 0), 0) + (AREA_BATTLES[area.boss.battle]?.koma ?? 0)).toBe(area.komaNeed);
    expect(area.chests.length).toBe(8);
  });

  it('1つの部屋の1つの晩に、写しの人は1人まで（広場の1晩目と社の森だけ2人）', () => {
    const count: Record<string, number> = {};
    for (const t of area.talkers) {
      const key = `${t.room} ${t.night ?? 1}`;
      count[key] = (count[key] ?? 0) + 1;
    }
    for (const [key, n] of Object.entries(count)) expect(n, key).toBeLessThanOrEqual(key === 'fest2_plaza 1' || key === 'fest2_woods 3' ? 2 : 1);
  });

  it('最後の晩より前は、ぬしの前まで歩いて行けない。裏通りは1晩目は入れず、2晩目から入れる', () => {
    for (let n = 1; n <= 2; n++) {
      const start = area.nights![n - 1].start;
      const reach = reachableCells(nightArea(area, n), start ? { room: start.room ?? startRoom(area), cell: start.cell } : undefined);
      expect(reach.fest2_woods?.has('12,3') ?? false).toBe(false);
      // 裏通りの中（左の縦の道）
      expect(reach.fest2_lane?.has('7,8') ?? false).toBe(n >= 2);
    }
  });

  it('敵の見回りの点・写しの人・宝箱は、どれも歩けるマス', () => {
    for (const e of area.enemies) for (const p of e.patrol) expect(isWalkable(areaGrid(area, e.room), p), `${e.id} ${p}`).toBe(true);
    for (const t of area.talkers) expect(isWalkable(areaGrid(area, t.room), t.cell), t.id).toBe(true);
  });
});

describe('出し抜く（段階263）', () => {
  it('見つかる範囲：向きの先3マス。1マス先は真ん中だけ、2・3マス先は左右1マスずつ。通れないマスの先は見えない', async () => {
    const { areaGrid: grid, sightCells } = await import('../../src/core');
    const room = { id: 'r', exits: [], layout: ['.......', '.......', '.......', '...#...', '.......', '.......'] };
    const map = grid({ ...area, rooms: [room] } as never, 'r');
    const key = (cs: [number, number][]) => cs.map((c) => c.join(',')).sort();
    // 上の行から下向きに（(3,0) から下）：(3,1)・(2..4,2)・(3,3) は壁なので、その先の真ん中は見えない
    expect(key(sightCells(map, [3, 0], [0, 1]))).toEqual(key([[3, 1], [2, 2], [3, 2], [4, 2], [2, 3], [4, 3]]));
    // 右向き
    expect(key(sightCells(map, [0, 1], [1, 0]))).toEqual(key([[1, 1], [2, 0], [2, 1], [2, 2], [3, 0], [3, 1], [3, 2]]));
  });

  it('陰のマスにいると見つからない。範囲の外も見つからない', async () => {
    const { areaGrid: grid, spotted } = await import('../../src/core');
    const room = { id: 'r', exits: [], layout: ['.....', '..:..', '.....', '.....'] };
    const map = grid({ ...area, rooms: [room] } as never, 'r');
    expect(spotted(map, room as never, [2, 3], [0, -1], [2, 2])).toBe(true);
    expect(spotted(map, room as never, [2, 3], [0, -1], [2, 1])).toBe(false); // 陰
    expect(spotted(map, room as never, [2, 3], [0, 1], [2, 2])).toBe(false); // 後ろ
  });

  it('不意打ち：コマを持たない砂嵐は倒した扱い、コマを持つ砂嵐・番人は先手、逃げる砂嵐はふつう', async () => {
    const { ambushKind } = await import('../../src/core');
    expect(ambushKind('patrol', 0)).toBe('scatter');
    expect(ambushKind('chase', 0)).toBe('scatter');
    expect(ambushKind('patrol', 1)).toBe('first');
    expect(ambushKind('guard', 1)).toBe('first');
    expect(ambushKind('flee', 0)).toBe('none');
    // 新しい1-1 の砂嵐16のうち、コマを持たないのは9。逃げる砂嵐を除く8が、倒した扱いにできる
    const scatter = area.enemies.filter((e) => ambushKind(e.move ?? 'patrol', AREA_BATTLES[e.battle]?.koma ?? 0) === 'scatter');
    expect(scatter.length).toBe(8);
  });

  it('先手の戦闘：1ラウンド目は敵がみんなダウンで動かない。2ラウンド目に警戒は付かない', async () => {
    const { ambushChainBattle, buildMainChainBattle, createChainBattle, runChainRound } = await import('../../src/core');
    const { CHAIN_AREA_SETUPS, CHAIN_RULES, HERO, AKARI } = await import('../../src/data');
    const st = CHAIN_AREA_SETUPS.a11_n1_gate;
    const def = buildMainChainBattle({ id: 'x', name: 'x', party: [HERO, AKARI], enemies: AREA_BATTLES.a11_n1_gate.enemies, chainEnemies: st.enemies, deck: st.deck, cards: st.cards, links: st.links });
    const s = ambushChainBattle(createChainBattle(def, CHAIN_RULES, 1));
    expect(s.enemies.every((e) => e.down)).toBe(true);
    const r = runChainRound(s, []);
    const acted = r.frames.flatMap((f) => f.events).filter((e) => e.type === 'act' && s.enemies.some((x) => x.uid === e.uid));
    expect(acted).toEqual([]);
    expect(r.state.enemies.every((e) => !e.down && !(e.guard ?? 0))).toBe(true);
  });
});

describe('仕掛けと仲間の力（段階264）', () => {
  const at0: [number, number] = [0, 0];
  const g = (id: string) => area.gadgets!.find((x) => x.id === id)!;

  it('拾う品 → 使う：物置の木箱で燃料の缶を拾うと、発電機が動き、下の路地（停電の扉）が開く（段階281）', async () => {
    const { gadgetArea, startExplore, useGadget, closedGates } = await import('../../src/core');
    let s = startExplore(area);
    expect(useGadget(area, s, g('p_generator'), ['hero', 'akari'], at0).solved).toEqual([]);
    s = useGadget(area, s, g('p_fuel'), ['hero', 'akari'], at0).state;
    const r = useGadget(area, s, g('p_generator'), ['hero', 'akari'], at0);
    expect(r.solved).toEqual(['p_generator']);
    expect(closedGates(area, r.state, 'fest2_backyard')).toEqual([]);
    const before = gadgetArea(area, startExplore(area), 1);
    const after = gadgetArea(area, r.state, 1);
    expect(isWalkable(areaGrid(before, 'fest2_backyard'), [12, 22])).toBe(false);
    expect(isWalkable(areaGrid(after, 'fest2_backyard'), [12, 22])).toBe(true);
    expect(isWalkable(areaGrid(after, 'fest2_backyard'), [8, 6])).toBe(true);
  });

  it('仲間の力：止まった自販機は、みおが編成にいれば動いて奥への道があく（いなければ、そのまま）', async () => {
    const { startExplore, useGadget } = await import('../../src/core');
    const s = startExplore(area);
    expect(useGadget(area, s, g('l_vending'), ['hero', 'akari'], at0).solved).toEqual([]);
    expect(useGadget(area, s, g('l_vending'), ['hero', 'mio'], at0).solved).toEqual(['l_vending']);
  });

  it('池の霧は、池の砂嵐を倒すと晴れる（扉の by に、倒した敵の id）。晴れた時に地図の出来事', async () => {
    const { closedGates, defeatEnemy, pendingEvent, startExplore } = await import('../../src/core');
    const s = startExplore(area);
    expect(closedGates(area, s, 'fest2_woods').map((x) => x.id)).toEqual(['g_stones']);
    const won = defeatEnemy(s, 'a11_e_woods1');
    expect(closedGates(area, won, 'fest2_woods')).toEqual([]);
    expect(pendingEvent(area, won, 3, 'fest2_woods', { on: 'solved', flag: 'a11_e_woods1' })?.id).toBe('ev_pond');
  });

  it('仕掛けは1晩に1つ（区画で3つ）。ほかは後で来る所と思い出の一枚だけ（段階281）', () => {
    const main = area.gadgets!.filter((x) => x.kind === 'use' || x.kind === 'push' || x.kind === 'order' || (x.kind === 'ability' && x.ally !== 'mio'));
    expect(main.map((x) => x.id).sort()).toEqual(['p_generator', 'p_mask']);
    expect(area.gates!.map((x) => x.by).sort()).toEqual(['a11_e_woods1', 'p_generator', 'p_mask']);
  });

  it('仕掛けを解かなくても、コマを持つ砂嵐・ぬし・次の晩の始まりへ歩いて行ける（仕掛けはごほうびだけ）', async () => {
    const { gadgetArea, startExplore } = await import('../../src/core');
    const s = startExplore(area);
    for (let n = 1; n <= 3; n++) {
      const night = gadgetArea(nightArea(area, n), s, n);
      const start = area.nights![n - 1].start;
      const reach = reachableCells(night, start ? { room: start.room ?? startRoom(area), cell: start.cell } : undefined);
      for (const e of night.enemies.filter((x) => (AREA_BATTLES[x.battle]?.koma ?? 0) > 0)) expect(reach[e.room!]?.has(e.patrol[0].join(',')), `${n}晩目 ${e.id}`).toBe(true);
      if (n === 3) expect([...(reach.fest2_woods ?? [])].some((k) => ['10,3', '12,3', '11,4'].includes(k))).toBe(true);
      // 仕掛けは、どれも隣のマスまで歩いて行ける（後で来る所は、仕掛けを解いた奥にもある）
      for (const gd of night.gadgets!.filter((x) => x.kind !== 'later' && x.kind !== 'photo' && (x.night ?? 1) <= n && n <= (x.until ?? 9))) {
        const [c, r] = gd.cell;
        const sides = [[c, r - 1], [c + 1, r], [c, r + 1], [c - 1, r]].map((x) => x.join(','));
        expect(sides.some((k) => reach[gd.room!]?.has(k)), `${n}晩目 ${gd.id}`).toBe(true);
      }
    }
  });
});

describe('写しの人がくれる物と思い出の一枚（段階265）', () => {
  it('写しの人はみんな、くれる物がある。おじさん＝弱点、わたあめ屋＝一息、浴衣の女の人＝場所の手がかり。手がかりの先は、ある仕掛け', () => {
    const kind: Record<string, string> = { 金魚すくいのおじさん: 'weak', わたあめ屋: 'rest', 浴衣の女の人: 'hint' };
    for (const t of area.talkers) {
      expect(t.gift?.kind, t.id).toBe(kind[t.label]);
      if (t.gift?.kind === 'hint') expect(area.gadgets!.some((g) => g.id === (t.gift as { target: string }).target), t.id).toBe(true);
      if (t.gift?.kind === 'weak') {
        const g = t.gift;
        const enemy = Object.values(AREA_BATTLES).flatMap((b) => b.enemies).find((e) => e.id === g.enemy);
        expect(enemy?.weaknesses, t.id).toContain(g.element);
      }
    }
  });

  it('もらうのは1人1回。場所の手がかりは、その仕掛けに印の flag', async () => {
    const { startExplore, takeGift } = await import('../../src/core');
    const t = area.talkers.find((x) => x.id === 'a11_voice_yukata')!;
    const first = takeGift(startExplore(area), t)!;
    expect(first.state.flags).toEqual(['gift:a11_voice_yukata', 'hint:p_fuel']);
    expect(takeGift(first.state, t)).toBeNull();
  });

  it('一息：持ち越している HP・MP を、最大の割合だけ戻す（最大は超えない）。全回復の時はそのまま', async () => {
    const { restVitals, startExplore } = await import('../../src/core');
    const s = { ...startExplore(area), vitals: { hero: { hp: 10, mp: 1 }, akari: { hp: 95, mp: 30 } } };
    const r = restVitals(s, 0.3, { hero: { hp: 100, mp: 20 }, akari: { hp: 100, mp: 30 } });
    expect(r.vitals).toEqual({ hero: { hp: 40, mp: 7 }, akari: { hp: 100, mp: 30 } });
    expect(restVitals(startExplore(area), 0.3, {}).vitals).toBeUndefined();
  });

  it('思い出の一枚は4枚。撮ると flag が付き、もう一度タップしても同じ場面が見られる', async () => {
    const { startExplore, useGadget } = await import('../../src/core');
    const photos = area.gadgets!.filter((g) => g.kind === 'photo');
    expect(photos.map((g) => g.room)).toEqual(['fest2_gate', 'fest2_plaza', 'fest2_east', 'fest2_woods']);
    const r = useGadget(area, startExplore(area), photos[0], [], [0, 0]);
    expect(r.state.flags).toEqual(['m_gate']);
    expect(useGadget(area, r.state, photos[0], [], [0, 0]).text).toBe(photos[0].done);
  });
});

describe('地図の上の寸劇（段階266）', () => {
  it('書き間違いがない（マス・砂嵐・戦闘が最後・仕掛けがある）', async () => {
    const { checkEvents } = await import('../../src/core');
    expect(checkEvents(area)).toEqual([]);
    // 書き間違いを見つける
    const bad = { ...area, events: [{ id: 'x', room: 'fest2_gate', when: { on: 'enter' as const, cells: [[0, 0] as [number, number]] }, steps: [{ do: 'battle' as const, enemy: 'nobody' }, { do: 'shake' as const }] }] };
    expect(checkEvents(bad).length).toBe(3);
  });

  it('マスに着いた時・仕掛けが解けた時に起きる。1回だけ。湧かせた砂嵐は、その後も地図に出る', async () => {
    const { enemyShown, markEvent, pendingEvent, startExplore } = await import('../../src/core');
    const s = startExplore(area);
    const runner = area.enemies.find((e) => e.id === 'a11_e_runner')!;
    expect(enemyShown(s, runner)).toBe(false);
    const ev = pendingEvent(area, s, 1, 'fest2_backyard', { on: 'solved', flag: 'p_generator' })!;
    expect(ev.id).toBe('ev_generator');
    const after = markEvent(s, ev);
    expect(pendingEvent(area, after, 1, 'fest2_backyard', { on: 'solved', flag: 'p_generator' })).toBeNull();
    expect(enemyShown(after, runner)).toBe(true);
    const tank = pendingEvent(area, s, 2, 'fest2_east', { on: 'enter', cell: [8, 17] });
    expect(tank?.id).toBe('ev_tank');
  });
});

describe('小さく濃い1-1（段階268）', () => {
  it('6部屋とも 24×24。地図の出来事は、遊ぶ人がした事のあとに起きる（屋台の裏・東の屋台・社の森）', () => {
    for (const r of area.rooms) expect([r.layout[0].length, r.layout.length], r.id).toEqual([24, 24]);
    expect([...new Set(area.events!.map((ev) => ev.room))].sort()).toEqual(['fest2_backyard', 'fest2_east', 'fest2_woods']);
  });

  it('スナップの数は変えない：思い出を返した時のリカバリーを、池の真ん中の宝箱へ移した（段階281）', () => {
    const snapsOf = (a: typeof area) => [...(a.chainReturnSnaps ?? []), ...a.chests.flatMap((c) => c.chainSnaps ?? [])].sort();
    expect(snapsOf(area)).toEqual(snapsOf(AREAS.a11));
    expect(area.chests.find((c) => c.id === 'a11_chest_new1')).toMatchObject({ room: 'fest2_woods', chainSnaps: ['a11_recovery'] });
  });
});

describe('晩の始まりの安全（段階268）', () => {
  it('晩を始めるチェックポイントから4マス以内に、その晩までに出る砂嵐の見回りの道がない（始まってすぐ戦闘にならない。デバッグで途中の晩へ飛んだ時も）', () => {
    for (let n = 2; n <= 3; n++) {
      const start = area.nights![n - 1].start!;
      for (const e of nightArea(area, n).enemies.filter((x) => x.room === start.room && (x.night ?? 1) <= n)) {
        for (const p of e.patrol) expect(Math.abs(p[0] - start.cell[0]) + Math.abs(p[1] - start.cell[1]), `${n}晩目 ${e.id}`).toBeGreaterThan(4);
      }
    }
  });
});

describe('新しい1-1 の絵（段階271・272）', () => {
  it('部屋の絵・小物・下をくぐる物は、どれも台帳にあって、ファイルもある', async () => {
    const { existsSync } = await import('node:fs');
    const { ASSETS, A11_REWORK_IMAGES } = await import('../../src/data');
    for (const id of A11_REWORK_IMAGES) {
      const a = ASSETS.find((x) => x.id === id);
      expect(a, id).toBeTruthy();
      expect(existsSync(`public/${a!.file}`), a!.file).toBe(true);
    }
  });

  it('小物の絵は、ある仕掛けにだけ割り当てる。鳥居の柱の根もとは通れない', async () => {
    const { A11_PROP_ART } = await import('../../src/data');
    const ids = (area.gadgets ?? []).map((x) => x.id);
    for (const id of Object.keys(A11_PROP_ART)) expect(ids, id).toContain(id);
    const grid = areaGrid(area, 'fest2_gate');
    expect(isWalkable(grid, [10, 17])).toBe(false);
    expect(isWalkable(grid, [13, 17])).toBe(false);
    expect(isWalkable(grid, [11, 17])).toBe(true);
  });
});

describe('部品で組む部屋（段階273）', () => {
  it('部品の足もとは通れない。歩ける飾りは通れる', async () => {
    const { composeLayout, partCells } = await import('../../src/core');
    const base = ['.....', '.....', '.....'];
    const parts = [
      { part: 'a', cell: [1, 2] as [number, number], w: 2, d: 2 },
      { part: 'b', cell: [4, 0] as [number, number], w: 1, walk: true },
    ];
    expect(partCells(parts[0]).map((c) => c.join(','))).toEqual(['1,1', '2,1', '1,2', '2,2']);
    expect(composeLayout(base, parts)).toEqual(['.....', '.##..', '.##..']);
  });

  it('屋台の裏の部品は台帳にあり、足もとは地面の歩ける所の上に置いている', async () => {
    const { BACKYARD_PARTS, ASSETS } = await import('../../src/data');
    const { partCells } = await import('../../src/core');
    const room = area.rooms.find((r) => r.id === 'fest2_backyard')!;
    expect(room.parts).toBe(BACKYARD_PARTS);
    for (const p of BACKYARD_PARTS) {
      expect(ASSETS.some((a) => a.id === `part.${p.part}`), p.part).toBe(true);
      for (const [c, r] of partCells(p)) expect(room.layout[r][c], `${p.part} ${c},${r}`).toBe('#');
    }
  });
});

describe('見つかる範囲の扇（段階278）', () => {
  it('ひらけた所では、向きの先へ半径いっぱいにのびる。壁に当たると、そこで止まる', async () => {
    const { parseGrid } = await import('../../src/core');
    const { sightFan, SIGHT_FAN_RADIUS } = await import('../../src/core');
    const open = parseGrid(['.........', '.........', '.........', '.........', '.........', '.........', '.........', '.........', '.........']);
    const pts = sightFan(open, [4, 1], [0, 1], 5);
    const mid = pts[2];
    expect(mid.x).toBeCloseTo(4.5, 5);
    expect(mid.y - 1.5).toBeGreaterThan(SIGHT_FAN_RADIUS - 0.11);
    // 2マス下が壁なら、真ん中の線はその手前で止まる
    const wall = parseGrid(['.........', '.........', '.........', '....#....', '.........', '.........', '.........', '.........', '.........']);
    const mid2 = sightFan(wall, [4, 1], [0, 1], 5)[2];
    expect(mid2.y).toBeLessThan(3.01);
  });
});

describe('細い出入口（2026-11-24）', () => {
  it('東の屋台の左の出入口は2マス。広場の右の出入口（4マス）から入ると、その2マスのどれかに着く', async () => {
    const { exitCells, passDoor, startExplore } = await import('../../src/core');
    const east = area.rooms.find((r) => r.id === 'fest2_east')!;
    expect(exitCells(east, 'left')).toHaveLength(2);
    const plaza = area.rooms.find((r) => r.id === 'fest2_plaza')!;
    const s = { ...startExplore(area), room: 'fest2_plaza' };
    const arrived = exitCells(plaza, 'right').map((c) => passDoor(area, s, c));
    for (const r of arrived) {
      expect(r?.type).toBe('moved');
      if (r?.type === 'moved') expect([[1, 8], [1, 9]]).toContainEqual(r.state.cell);
    }
  });
});

