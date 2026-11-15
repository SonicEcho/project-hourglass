import { describe, expect, it } from 'vitest';
import type { DigState, DigWorldDef } from '../../src/core';
import { clearGuard, clearRoamer, createDig, digBackCost, digEntrance, digLayerAt, digLayerTop, digWeightsAt, goHome, isDigGuardRow, loseDig, stepDig, swapChest, takeChest } from '../../src/core';
import { AREA_BATTLES, canEnterSandBottom, PARTY, SAND_BOTTOM, SAND_BOTTOM_BAND_NAMES, SAND_BOTTOM_DIGGERS, sandBottomFor, WEAPON_DATA, withDigger } from '../../src/data';

// 砂の底を掘る（段階207 試作1・段階208 試作2。docs/milestones/M3_sand_bottom.md）
const items = { common: ['c1', 'c2'], uncommon: ['u1'], rare: ['r1'] };
const flat = { rock: 0, clay: 0, ore: 0, grain: 0, loose: 0, caves: 0, chestRate: 0, nestRate: 0, items };
const DEF: DigWorldDef = {
  width: 7,
  layers: [
    { id: 'top', name: '上', rows: 4, ...flat, weights: { common: 1, uncommon: 0, rare: 0 }, battles: ['b1'] },
    { id: 'low', name: '下', rows: 4, ...flat, weights: { common: 0, uncommon: 0, rare: 1 }, battles: ['b2'] },
  ],
  sand: 20,
  cost: { walk: 1, dig: 3, battle: 10, back: 1 },
  grainSand: 12,
  chase: 3,
  bagMax: 3,
};

/** 決まった形の地面（テスト用）：全部砂にして、指定したマスだけ変える。砂嵐はいない */
function plain(over: Record<number, DigState['tiles'][number]> = {}): DigState {
  const s = createDig(DEF, 1);
  const tiles = s.tiles.map((_, i) => (i < DEF.width ? 'air' : 'sand')) as DigState['tiles'];
  for (const [i, t] of Object.entries(over)) tiles[Number(i)] = t;
  return { ...s, tiles, chests: {}, guards: {}, roamers: [] };
}
const at = (x: number, y: number) => y * DEF.width + x;

describe('砂の底：地面を作る', () => {
  it('同じシードなら同じ地面。地上は空で、入口の真下は砂', () => {
    const a = createDig(SAND_BOTTOM, 42);
    expect(createDig(SAND_BOTTOM, 42)).toEqual(a);
    expect(createDig(SAND_BOTTOM, 43).tiles).not.toEqual(a.tiles);
    expect(a.height).toBe(1 + SAND_BOTTOM.layers.reduce((n, l) => n + l.rows, 0));
    expect(a.tiles.slice(0, a.width).every((t) => t === 'air')).toBe(true);
    expect(a.tiles[a.width + digEntrance(SAND_BOTTOM)]).toBe('sand');
    expect([a.x, a.y, a.sand, a.bag, a.steps]).toEqual([digEntrance(SAND_BOTTOM), 0, SAND_BOTTOM.sand, [], 0]);
  });

  it('層の境目（章の層の間と、いちばん下の層とふつうの地面の間）は岩の帯で、番人のいる1マスだけが通り道。番人は上の層の強い戦闘か、稀にその章のぬし。同じ章の層の帯の境目には番人がいない', () => {
    const L = SAND_BOTTOM.layers;
    const gates = L.filter((l, i) => i > 0 && l.group !== L[i - 1].group);
    expect(gates.map((l) => l.group)).toEqual(['ch2', 'ch3', 'deep']);
    for (const l of L) expect(isDigGuardRow(SAND_BOTTOM, digLayerTop(SAND_BOTTOM, l.id)), l.id).toBe(gates.includes(l));
    let lords = 0;
    let all = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
      const a = createDig(SAND_BOTTOM, seed);
      for (const layer of gates) {
        const top = digLayerTop(SAND_BOTTOM, layer.id);
        const row = a.tiles.slice(top * a.width, (top + 1) * a.width);
        expect(row.filter((t) => t === 'guard'), layer.id).toHaveLength(1);
        expect(row.filter((t) => t !== 'guard' && t !== 'rock'), layer.id).toEqual([]);
        const above = L[L.indexOf(layer) - 1];
        const battle = a.guards[top * a.width + row.indexOf('guard')];
        expect([...above.guards!, ...above.lords!], layer.id).toContain(battle);
        all++;
        if (above.lords!.includes(battle)) lords++;
      }
    }
    // ぬしは稀に（でも出る）
    expect(lords).toBeGreaterThan(0);
    expect(lords).toBeLessThan(all / 3);
  });

  it('宝箱と動く砂嵐は、空いた所にいて中身が合っている。中身はその層の物。鉱脈・砂粒・崩れる砂もある', () => {
    const a = createDig(SAND_BOTTOM, 7);
    const chests = a.tiles.flatMap((t, i) => (t === 'chest' ? [i] : []));
    expect(chests.length).toBeGreaterThan(3);
    expect(Object.keys(a.chests).map(Number).sort((x, y) => x - y)).toEqual(chests);
    for (const c of chests) {
      const layer = digLayerAt(SAND_BOTTOM, Math.floor(c / a.width));
      for (const id of a.chests[c]) expect([...layer.items.common, ...layer.items.uncommon, ...layer.items.rare], id).toContain(id);
    }
    expect(a.roamers.length).toBeGreaterThan(3);
    for (const m of a.roamers) {
      expect(a.tiles[m.y * a.width + m.x]).toBe('air');
      expect(digLayerAt(SAND_BOTTOM, m.y).battles).toContain(m.battle);
    }
    for (const kind of ['ore', 'grain', 'loose'] as const) expect(a.tiles.some((t) => t === kind), kind).toBe(true);
    // 崩れる砂の下は空いていない（作った時に落ちきっている。砂嵐のいるマスの上では止まる）
    const foes = new Set(a.roamers.map((m) => m.y * a.width + m.x));
    for (let i = 0; i < a.tiles.length - a.width; i++) if (a.tiles[i] === 'loose' && !foes.has(i + a.width)) expect(a.tiles[i + a.width]).not.toBe('air');
  });

  it('データ：どの層（帯）にも宝箱の素材と砂嵐の戦闘があり、どれも実在する。深い層ほど珍しい物が出やすい', () => {
    const bands = SAND_BOTTOM.layers.filter((l) => l.group !== 'deep');
    for (const l of bands) {
      expect(l.items.common.length, l.id).toBeGreaterThan(0);
      expect(l.battles.length, l.id).toBeGreaterThan(0);
      for (const id of [...l.items.common, ...l.items.uncommon, ...l.items.rare]) expect(WEAPON_DATA.items[id], id).toBeDefined();
      for (const b of [...l.battles, ...(l.guards ?? []), ...(l.lords ?? [])]) expect(AREA_BATTLES[b], b).toBeDefined();
      expect(l.guards?.length, l.id).toBeGreaterThan(0);
      for (const b of l.lords ?? []) expect(AREA_BATTLES[b].boss, b).toBe(true);
    }
    const rare = bands.map((l) => l.weights.rare / (l.weights.common + l.weights.uncommon + l.weights.rare));
    expect([...rare].sort((x, y) => x - y)).toEqual(rare);
  });
});

describe('砂の底：掘って進む', () => {
  it('空は歩く（1）、砂は掘って進む（3）、固い土は1回目で砂になるだけ（3）、岩と外は進めない', () => {
    let s = plain({ [at(3, 2)]: 'clay', [at(2, 1)]: 'rock' });
    s = { ...s, x: 3, y: 0 };
    let r = stepDig(DEF, s, 'down');
    expect([r.event, r.state.y, r.state.sand, r.state.steps]).toEqual([{ type: 'dig', through: true }, 1, 17, 1]);
    r = stepDig(DEF, r.state, 'down');
    expect([r.event, r.state.y, r.state.tiles[at(3, 2)], r.state.sand]).toEqual([{ type: 'dig', through: false }, 1, 'sand', 14]);
    r = stepDig(DEF, r.state, 'up');
    expect([r.event.type, r.state.y, r.state.sand]).toEqual(['move', 0, 13]);
    expect(stepDig(DEF, { ...r.state, x: 2, y: 0 }, 'down').event).toEqual({ type: 'blocked', reason: 'rock' });
    expect(stepDig(DEF, { ...r.state, x: 0 }, 'left').event).toEqual({ type: 'blocked', reason: 'edge' });
  });

  it('砂が足りなければ進めない。いちばん深い所を覚える', () => {
    const s = { ...plain(), x: 3, y: 0, sand: 2 };
    expect(stepDig(DEF, s, 'down').event).toEqual({ type: 'blocked', reason: 'sand' });
    const deep = stepDig(DEF, { ...s, sand: 20 }, 'down').state;
    expect(deep.deepest).toBe(1);
    expect(stepDig(DEF, deep, 'up').state.deepest).toBe(1);
  });

  it('鉱脈：掘って進み、その層の素材がかばんへ（いっぱいなら砂に戻る）。砂粒：掘って進み、砂が戻る', () => {
    const s = { ...plain({ [at(3, 1)]: 'ore', [at(4, 1)]: 'grain' }), x: 3, y: 0 };
    const r = stepDig(DEF, s, 'down');
    expect(r.event.type).toBe('ore');
    expect(r.event.type === 'ore' && r.event.kept).toBe(true);
    expect(r.state.bag).toHaveLength(1);
    expect(items.common.concat(items.uncommon)).toContain(r.state.bag[0]);
    const full = stepDig(DEF, { ...s, bag: ['x', 'y', 'z'] }, 'down');
    expect(full.event.type === 'ore' && full.event.kept).toBe(false);
    expect(full.state.bag).toEqual(['x', 'y', 'z']);
    const g = stepDig(DEF, r.state, 'right');
    expect(g.event).toEqual({ type: 'grain', sand: 12 });
    expect(g.state.sand).toBe(r.state.sand - 3 + 12);
  });

  it('崩れる砂：下を掘って空けると落ちてきて、道がふさがる（自分のいるマスには落ちない）', () => {
    // (3,1) 崩れる砂、(3,2)(3,3) 砂。(2,2) から右へ掘って (3,2) を空けると、(3,1) の砂が落ちる。自分は (3,2) にいるので、その上で止まる
    const s = { ...plain({ [at(3, 1)]: 'loose', [at(2, 2)]: 'air' }), x: 2, y: 2 };
    const r = stepDig(DEF, s, 'right');
    expect(r.state.tiles[at(3, 1)]).toBe('loose');
    // さらに下へ掘ると、空いた (3,2) に砂が落ちてきて、帰り道がふさがる
    const r2 = stepDig(DEF, r.state, 'down');
    expect(r2.state.tiles[at(3, 1)]).toBe('air');
    expect(r2.state.tiles[at(3, 2)]).toBe('loose');
  });
});

describe('砂の底：宝箱とかばん', () => {
  it('宝箱は進まずに知らせる。開けると入る分だけかばんへ、残りは宝箱に残る', () => {
    const cell = at(3, 1);
    const s: DigState = { ...plain({ [cell]: 'chest' }), chests: { [cell]: ['c1', 'u1'] }, x: 3, y: 0, bag: ['c2', 'c2'] };
    const r = stepDig(DEF, s, 'down');
    expect(r.event).toEqual({ type: 'chest', cell, items: ['c1', 'u1'] });
    expect(r.state).toBe(s);
    const t = takeChest(DEF, s, cell);
    expect(t.state.bag).toEqual(['c2', 'c2', 'c1']);
    expect(t.left).toEqual(['u1']);
    expect(t.state.tiles[cell]).toBe('chest');
    const sw = swapChest(t.state, cell, 0, 'u1');
    expect(sw.bag).toEqual(['u1', 'c2', 'c1']);
    expect(sw.chests[cell]).toEqual(['c2']);
    const all = takeChest(DEF, { ...s, bag: [] }, cell);
    expect(all.state.tiles[cell]).toBe('air');
    expect(all.state.chests[cell]).toBeUndefined();
  });
});

describe('砂の底：番人と動く砂嵐', () => {
  it('番人は進まずに知らせる。勝つと通り道が開き、戦った分の砂が減る', () => {
    const cell = at(3, 1);
    const s: DigState = { ...plain({ [cell]: 'guard' }), guards: { [cell]: 'b2' }, x: 3, y: 0 };
    expect(stepDig(DEF, s, 'down').event).toEqual({ type: 'guard', cell, battle: 'b2' });
    const won = clearGuard(DEF, s, cell);
    expect([won.tiles[cell], won.guards[cell], won.sand]).toEqual(['air', undefined, 10]);
  });

  it('近くの砂嵐は、空いたマスを通って追ってくる。追いつかれたら戦闘。自分から入っても戦闘', () => {
    // 横の通路 y=2 に空き。自分 (1,2)、砂嵐 (4,2)（距離3 → 追う）
    const tiles: Record<number, 'air'> = {};
    for (let x = 0; x < 7; x++) tiles[at(x, 2)] = 'air';
    const s: DigState = { ...plain({ ...tiles, [at(2, 1)]: 'clay' }), x: 1, y: 2, roamers: [{ id: 0, x: 4, y: 2, battle: 'b1', chasing: false }] };
    const r1 = stepDig(DEF, s, 'right');
    // 自分は (2,2) へ、砂嵐は (3,2) へ寄ってくる
    expect([r1.state.x, r1.state.roamers[0].x, r1.state.roamers[0].chasing]).toEqual([2, 3, true]);
    expect(r1.event.type).toBe('move');
    // 自分から入る
    expect(stepDig(DEF, r1.state, 'right').event).toEqual({ type: 'roamer', id: 0, battle: 'b1' });
    // 同じ速さで逃げれば追いつかれない
    expect(stepDig(DEF, r1.state, 'left').event.type).toBe('move');
    // 固い土を掘って止まっている間に、追いつかれる
    const r2 = stepDig(DEF, r1.state, 'up');
    expect(r2.event).toEqual({ type: 'roamer', id: 0, battle: 'b1' });
    expect([r2.state.x, r2.state.y, r2.state.tiles[at(2, 1)]]).toEqual([2, 2, 'sand']);
    // 勝つと消える
    expect(clearRoamer(DEF, s, 0).roamers).toEqual([]);
  });

  it('遠くの砂嵐は追ってこない。砂の中は通れない', () => {
    const s: DigState = { ...plain({ [at(6, 6)]: 'air' }), x: 0, y: 1, roamers: [{ id: 0, x: 6, y: 6, battle: 'b1', chasing: false }] };
    const r = stepDig(DEF, s, 'down');
    expect(r.state.roamers[0]).toMatchObject({ x: 6, y: 6, chasing: false });
  });
});

describe('砂の底：帰り道', () => {
  it('上へ戻る：深さの分の砂があれば全部持ち帰る。足りなければ、かばんの半分（多い方を残す）を失う', () => {
    const s: DigState = { ...plain(), x: 3, y: 6, sand: 6, bag: ['a', 'b', 'c'] };
    expect(digBackCost(DEF, s)).toBe(6);
    const home = goHome(DEF, s);
    expect([home.outcome, home.sand, home.y, home.bag]).toEqual(['home', 0, 0, ['a', 'b', 'c']]);
    const late = goHome(DEF, { ...s, sand: 5 });
    expect([late.outcome, late.sand, late.y]).toEqual(['late', 0, 0]);
    expect(late.bag).toHaveLength(2);
  });

  it('戦闘に負けると、地上へ戻され、かばんの半分を失う。帰った後は掘れない', () => {
    const lost = loseDig(DEF, { ...plain(), x: 3, y: 4, bag: ['a', 'b', 'c', 'd'] });
    expect([lost.outcome, lost.y, lost.bag.length]).toEqual(['lost', 0, 2]);
    expect(stepDig(DEF, lost, 'down').event.type).toBe('blocked');
  });
});

describe('砂の底：本編に入れる（段階209）', () => {
  it('空洞の移動は砂を使わない（掘る時だけ）。層は深く、砂時計の砂は章ごとに増える', () => {
    const free: DigWorldDef = { ...DEF, cost: { ...DEF.cost, walk: 0 } };
    const tiles: Record<number, 'air'> = { [at(3, 1)]: 'air', [at(3, 2)]: 'air' };
    const r = stepDig(free, { ...plain(tiles), x: 3, y: 0, sand: 0 }, 'down');
    expect([r.event.type, r.state.y, r.state.sand]).toEqual(['move', 1, 0]);
    expect(SAND_BOTTOM.cost.walk).toBe(0);
    const sands = ['ch1', 'ch2', 'ch3', 'ch4'].map((c) => sandBottomFor(c).sand);
    expect([...sands].sort((a, b) => a - b)).toEqual(sands);
    expect(new Set(sands).size).toBe(4);
    expect(sandBottomFor('unknown').sand).toBe(sands[3]);
  });

  it('空洞に稀に砂嵐が湧く：自分から離れた空いたマスに、その深さの層の砂嵐。上限を超えない。同じ手なら同じ所', () => {
    // 地面を全部空洞にして、毎手かならず湧くようにする
    const sp: DigWorldDef = { ...DEF, cost: { ...DEF.cost, walk: 0 }, spawn: { rate: 1, min: 3, max: 5, cap: 2 } };
    const open = Object.fromEntries(Array.from({ length: 7 * 9 }, (_, i) => [i, 'air'])) as Record<number, 'air'>;
    const s0: DigState = { ...plain(open), x: 0, y: 1 };
    const r1 = stepDig(sp, s0, 'down');
    expect(r1.state.roamers).toHaveLength(1);
    const m = r1.state.roamers[0];
    const d = Math.abs(m.x - r1.state.x) + Math.abs(m.y - r1.state.y);
    expect(d).toBeGreaterThanOrEqual(3);
    expect(d).toBeLessThanOrEqual(5);
    expect(digLayerAt(sp, m.y).battles).toContain(m.battle);
    expect(stepDig(sp, s0, 'down').state.roamers).toEqual(r1.state.roamers);
    let s = r1.state;
    for (let i = 0; i < 5; i++) s = stepDig(sp, s, i % 2 ? 'up' : 'down').state;
    expect(s.roamers.length).toBeLessThanOrEqual(2);
    // 書かなければ湧かない
    expect(stepDig({ ...sp, spawn: undefined }, s0, 'down').state.roamers).toEqual([]);
  });
});

describe('砂の底：掘る人の特徴（段階211）', () => {
  it('固い土を1回で掘れる人は、1回で進む（砂はふつうの量）', () => {
    const def = { ...DEF, clayOnce: true };
    const s = plain({ [at(3, 1)]: 'clay' });
    const r = stepDig(def, s, 'down');
    expect(r.event).toEqual({ type: 'dig', through: true });
    expect([r.state.x, r.state.y, r.state.sand]).toEqual([3, 1, 20 - 3]);
    expect(r.state.tiles[at(3, 1)]).toBe('air');
  });

  it('岩を割れる人は、岩を割って進む（rockCost の砂）。境目の岩の帯は割れない', () => {
    const def = { ...DEF, rockCost: 6 };
    const s = plain({ [at(3, 1)]: 'rock' });
    const r = stepDig(def, s, 'down');
    expect(r.event).toEqual({ type: 'dig', through: true });
    expect([r.state.y, r.state.sand]).toEqual([1, 20 - 6]);
    expect(stepDig(DEF, s, 'down').event).toEqual({ type: 'blocked', reason: 'rock' });
    // 2つ目の層の上の行（帯）
    const band = digLayerTop(DEF, 'low');
    expect(isDigGuardRow(DEF, band)).toBe(true);
    expect(isDigGuardRow(DEF, band + 1)).toBe(false);
    expect(isDigGuardRow(DEF, digLayerTop(DEF, 'top'))).toBe(false);
    const deep = { ...plain({ [at(3, band)]: 'rock' }), x: 3, y: band - 1 };
    expect(stepDig(def, deep, 'down').event).toEqual({ type: 'blocked', reason: 'rock' });
    // 岩の砂が足りなければ割れない
    expect(stepDig(def, { ...s, sand: 5 }, 'down').event).toEqual({ type: 'blocked', reason: 'sand' });
  });

  it('データ：仲間の5人に特徴があり、withDigger で数値に入る。ハルトは平均（そのまま）', () => {
    expect(Object.keys(SAND_BOTTOM_DIGGERS).sort()).toEqual(['akari', 'hayase', 'hero', 'mio', 'sayoko']);
    for (const id of Object.keys(SAND_BOTTOM_DIGGERS)) expect(PARTY.some((c) => c.id === id), id).toBe(true);
    const hero = withDigger(SAND_BOTTOM, 'hero');
    expect([hero.cost, hero.rockCost, hero.clayOnce]).toEqual([SAND_BOTTOM.cost, undefined, undefined]);
    expect(withDigger(SAND_BOTTOM, 'hayase').cost.dig).toBeLessThan(SAND_BOTTOM.cost.dig);
    expect(withDigger(SAND_BOTTOM, 'mio').clayOnce).toBe(true);
    expect(withDigger(SAND_BOTTOM, 'sayoko').rockCost).toBeGreaterThan(SAND_BOTTOM.cost.dig);
    expect(SAND_BOTTOM_DIGGERS.akari.heal).toBeGreaterThan(0);
    expect(withDigger(SAND_BOTTOM, 'nobody')).toBe(SAND_BOTTOM);
  });
});

describe('砂の底：層を物語に合わせる（段階212）', () => {
  const groups = (def: DigWorldDef) => [...new Set(def.layers.map((l) => l.group))];

  it('2章から入れる。終えた章の層まで開く（深いほど後の章）。いちばん下は、ふつうの地面', () => {
    expect([undefined, 'ch1', 'ch2', 'ch3', 'ch4'].map((c) => canEnterSandBottom(c))).toEqual([false, false, true, true, true]);
    expect(groups(sandBottomFor('ch2'))).toEqual(['ch1', 'deep']);
    expect(groups(sandBottomFor('ch3'))).toEqual(['ch1', 'ch2', 'deep']);
    expect(groups(sandBottomFor('ch4'))).toEqual(['ch1', 'ch2', 'ch3', 'deep']);
    // 1章（デバッグの入口）は、感覚記憶の層だけ
    expect(groups(sandBottomFor('ch1'))).toEqual(['ch1', 'deep']);
    expect(sandBottomFor('ch2').layers.map((l) => l.name)).toEqual(['感覚記憶の層', '感覚記憶の層', 'まだ思い出せない深さ']);
    expect(SAND_BOTTOM.layers.filter((l) => l.group === 'ch3').map((l) => SAND_BOTTOM_BAND_NAMES[l.id])).toEqual(['はじめての仕送り', '言えなかった卒業式', '大正の祭りの夜']);
  });

  it('帯の敵は、その区画の砂嵐（金魚の帯には 1-1 の砂嵐）', () => {
    const kingyo = SAND_BOTTOM.layers.find((l) => l.id === 'kingyo')!;
    expect(kingyo.battles.length).toBeGreaterThan(0);
    expect(kingyo.battles.every((b) => b.startsWith('a11_'))).toBe(true);
    const taisho = SAND_BOTTOM.layers.find((l) => l.id === 'taisho')!;
    expect(taisho.battles.every((b) => b.startsWith('a3s'))).toBe(true);
  });

  it('ふつうの地面：上の境目に番人。その下は空洞・宝箱・砂嵐・鉱脈・砂粒がなく、砂がどうやっても足りない深さ（1マス2以上で、入った時の砂の行数）', () => {
    for (const c of ['ch2', 'ch3', 'ch4']) {
      const def = sandBottomFor(c);
      const deep = def.layers[def.layers.length - 1];
      expect([deep.caves, deep.chestRate, deep.nestRate, deep.ore, deep.grain, deep.battles.length], c).toEqual([0, 0, 0, 0, 0, 0]);
      expect(deep.rows, c).toBeGreaterThanOrEqual(def.sand);
      const a = createDig(def, 5);
      const top = digLayerTop(def, deep.id);
      // いちばん上の行は、層の番人の行（岩の帯）
      expect(isDigGuardRow(def, top), c).toBe(true);
      const deepTiles = a.tiles.slice((top + 1) * a.width);
      expect(deepTiles.filter((t) => t === 'air' || t === 'chest' || t === 'guard' || t === 'ore' || t === 'grain'), c).toEqual([]);
      expect(a.roamers.filter((m) => m.y >= top), c).toEqual([]);
    }
  });
});

describe('砂の底：層の下の方ほど珍しい（段階212）', () => {
  it('宝箱の重みは、章の層の上の端から下の端へ、珍しい物が増える（2章の時の感覚記憶の層でも）', () => {
    const def = sandBottomFor('ch2');
    const top = digLayerTop(def, 'kingyo');
    const bottom = digLayerTop(def, 'deep') - 1;
    const rare = (y: number) => {
      const w = digWeightsAt(def, y);
      return w.rare / (w.common + w.uncommon + w.rare);
    };
    expect(rare(bottom)).toBeGreaterThan(rare(top) * 3);
    expect(rare(top + 12)).toBeGreaterThan(rare(top));
    expect(digWeightsAt(def, top)).toEqual(def.layers[0].weights);
  });

  it('ぬしは、その章の区画のぬし（2-3 のカイの負け戦は入らない）', () => {
    expect(SAND_BOTTOM.layers.find((l) => l.id === 'kingyo')!.lords).toEqual(['a11_boss', 'a12_boss']);
    expect(SAND_BOTTOM.layers.find((l) => l.id === 'daseki')!.lords).not.toContain('a23_kai');
  });
});
