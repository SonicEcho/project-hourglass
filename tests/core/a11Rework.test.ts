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
      expect(reach.fest2_woods?.has('11,3') ?? false).toBe(false);
      // 裏通りの中（左の縦の道）
      expect(reach.fest2_lane?.has('4,12') ?? false).toBe(n >= 2);
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

  it('拾う品 → 使う：つまみを拾うと、発電機が直り、下の路地（停電の扉）が開く', async () => {
    const { gadgetArea, startExplore, useGadget, closedGates } = await import('../../src/core');
    let s = startExplore(area);
    expect(useGadget(area, s, g('p_generator'), ['hero', 'akari'], at0).solved).toEqual([]);
    s = useGadget(area, s, g('p_knob'), ['hero', 'akari'], at0).state;
    const r = useGadget(area, s, g('p_generator'), ['hero', 'akari'], at0);
    expect(r.solved).toEqual(['p_generator']);
    expect(closedGates(area, r.state, 'fest2_backyard')).toEqual([]);
    // 拾った品は地図から消え、そのマスは通れる。開く前の扉のマスは通れない
    const before = gadgetArea(area, startExplore(area), 1);
    const after = gadgetArea(area, r.state, 1);
    expect(isWalkable(areaGrid(before, 'fest2_backyard'), [8, 36])).toBe(false);
    expect(isWalkable(areaGrid(after, 'fest2_backyard'), [8, 36])).toBe(true);
    expect(isWalkable(areaGrid(after, 'fest2_backyard'), [4, 5])).toBe(true);
  });

  it('押す：荷車は上のマスから押すと動く。下からは動かない', async () => {
    const { startExplore, useGadget } = await import('../../src/core');
    const s = startExplore(area);
    expect(useGadget(area, s, g('p_cart'), ['hero'], [4, 17]).solved).toEqual([]);
    expect(useGadget(area, s, g('p_cart'), ['hero'], [4, 15]).solved).toEqual(['p_cart']);
  });

  it('仲間の力：あかりが編成にいれば人混みが道をあける。後で来る所は、その仲間がいないと開かない', async () => {
    const { startExplore, useGadget } = await import('../../src/core');
    const s = startExplore(area);
    expect(useGadget(area, s, g('p_song'), ['hero'], at0).solved).toEqual([]);
    expect(useGadget(area, s, g('p_song'), ['hero', 'akari'], at0).solved).toEqual(['p_song']);
    expect(useGadget(area, s, g('l_vending'), ['hero', 'akari'], at0).solved).toEqual([]);
    expect(useGadget(area, s, g('l_vending'), ['hero', 'mio'], at0).solved).toEqual(['l_vending']);
  });

  it('順番：提灯は右 → 左 → 下。まちがえると灯った物が消える。そろうと、やぐらの前に宝箱が出る', async () => {
    const { gadgetArea, startExplore, useGadget } = await import('../../src/core');
    let s = startExplore(area);
    s = useGadget(area, s, g('p_lantern1'), [], at0).state;
    expect(s.flags).toEqual(['p_lanterns:0']);
    s = useGadget(area, s, g('p_lantern3'), [], at0).state;
    expect(s.flags).toEqual([]);
    for (const id of ['p_lantern1', 'p_lantern2']) s = useGadget(area, s, g(id), [], at0).state;
    const last = useGadget(area, s, g('p_lantern3'), [], at0);
    expect(last.solved).toEqual(['p_lanterns']);
    expect(gadgetArea(area, s, 3).chests.some((c) => c.id === 'a11_chest_new1')).toBe(false);
    expect(gadgetArea(area, last.state, 3).chests.some((c) => c.id === 'a11_chest_new1')).toBe(true);
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
    expect(first.state.flags).toEqual(['gift:a11_voice_yukata', 'hint:p_knob']);
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
    const gate = area.enemies.find((e) => e.id === 'a11_e_gate_chase')!;
    expect(enemyShown(s, gate)).toBe(false);
    const ev = pendingEvent(area, s, 1, 'fest2_gate', { on: 'enter', cell: [11, 15] })!;
    expect(ev.id).toBe('ev_gate_ambush');
    expect(pendingEvent(area, s, 1, 'fest2_gate', { on: 'enter', cell: [11, 16] })).toBeNull();
    const after = markEvent(s, ev);
    expect(pendingEvent(area, after, 1, 'fest2_gate', { on: 'enter', cell: [11, 15] })).toBeNull();
    expect(enemyShown(after, gate)).toBe(true);
    expect(pendingEvent(area, s, 1, 'fest2_backyard', { on: 'solved', flag: 'p_generator' })?.id).toBe('ev_generator');
  });
});
