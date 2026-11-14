import { describe, expect, it } from 'vitest';
import type { ArmoryState } from '../../src/core';
import {
  isJoinChoice,
  absorbMaterial,
  absorbPicked,
  getAbsorbPickedError,
  paramsAfterPicked,
  addFragments,
  addItems,
  applyWeapons,
  createArmory,
  decomposeFragment,
  evolutionChecks,
  evolveWeapon,
  canEvolveAny,
  evolutionTier,
  evolutionVisibility,
  anySlotsFull,
  extendBoard,
  nextEvolutions,
  feedFragment,
  fragmentItem,
  getEvolveError,
  getFeedError,
  getAbsorbError,
  getFragmentError,
  naviDataWithWeapons,
  paramsAfter,
  recordVictory,
  tendencyOf,
  weaponLevel,
  weaponName,
  weaponSlots,
} from '../../src/core';
import { FRAGMENTS, ITEMS, NAVI_DATA, PARTY, WEAPON_DATA } from '../../src/data';

const D = WEAPON_DATA;

/** ハルトの武器の経験値を exp にした状態 */
function withExp(a: ArmoryState, charId: string, exp: number): ArmoryState {
  return { ...a, weapons: { ...a.weapons, [charId]: { ...a.weapons[charId], exp } } };
}

/** 素材を持たせて、順に刻む（枠が足りるよう、必要ならレベルを上げておく） */
function absorbMany(a: ArmoryState, charId: string, ids: string[]): ArmoryState {
  let out = addItems(a, ids);
  for (const id of ids) out = absorbMaterial(D, out, charId, id);
  return out;
}

describe('武器：記憶の欠片を刻む', () => {
  it('3人それぞれに武器が1本ある', () => {
    const a = createArmory(D);
    expect(Object.keys(a.weapons).sort()).toEqual(PARTY.map((c) => c.id).sort());
  });

  it('刻むと、その感情のパラメータが1上がり、記憶の欠片はなくなる', () => {
    let a = addFragments(createArmory(D), ['elation', 'elation']);
    a = feedFragment(D, a, 'hero', 'elation');
    expect(a.weapons.hero.params).toEqual({ atk: 0, fire: 1, ice: 0, thunder: 0 });
    expect(a.fragments.elation).toBe(1);
  });

  it('感情ごとに上がるパラメータが決まっている（勇気＝攻撃、高揚＝火、安堵＝氷、驚嘆＝雷）', () => {
    expect(FRAGMENTS.courage.gains).toEqual({ atk: 1 });
    expect(FRAGMENTS.elation.gains).toEqual({ fire: 1 });
    expect(FRAGMENTS.relief.gains).toEqual({ ice: 1 });
    expect(FRAGMENTS.wonder.gains).toEqual({ thunder: 1 });
  });

  it('持っていない記憶の欠片は刻めない', () => {
    const a = createArmory(D);
    expect(getFeedError(D, a, 'hero', 'elation')).toBe('no fragment left');
    expect(() => feedFragment(D, a, 'hero', 'elation')).toThrow();
  });

  it('元の状態は書き換えない', () => {
    const a = addFragments(createArmory(D), ['elation']);
    feedFragment(D, a, 'hero', 'elation');
    expect(a.fragments.elation).toBe(1);
    expect(a.weapons.hero.params.fire).toBe(0);
  });
});

describe('武器：素材を刻む（段階27b）', () => {
  it('素材を刻むと、素材ごとの上がり下がりの分だけ能力値が変わり、刻印を1つ使う', () => {
    let a = absorbMany(createArmory(D), 'hero', ['maskShard']);
    expect(a.weapons.hero.params).toEqual({ atk: 0, fire: 2, ice: 0, thunder: 0 });
    expect(a.weapons.hero.absorbed).toBe(1);
    expect(a.items.maskShard).toBe(0);
    a = absorbMany(a, 'hero', ['goldfishScale', 'maskShard']);
    // 氷は +2 の後に −1
    expect(a.weapons.hero.params).toEqual({ atk: 1, fire: 4, ice: 1, thunder: 0 });
  });

  it('下がっても0より小さくならない。プレビューと同じ値になる', () => {
    const w = createArmory(D).weapons.hero;
    expect(paramsAfter(w.params, ITEMS.cottonThread.gains)).toEqual({ atk: 0, fire: 0, ice: 0, thunder: 2 });
    expect(absorbMany(createArmory(D), 'hero', ['cottonThread']).weapons.hero.params).toEqual({ atk: 0, fire: 0, ice: 0, thunder: 2 });
  });

  it('刻印はレベルで増え、いっぱいなら刻めない', () => {
    const [lv1, lv2, lv3] = D.slotsPerLevel;
    let a = addItems(createArmory(D), Array<string>(lv1 + 1).fill('goldfishScale'));
    expect(weaponSlots(D, a.weapons.hero)).toBe(lv1);
    for (let i = 0; i < lv1; i++) a = absorbMaterial(D, a, 'hero', 'goldfishScale');
    expect(getAbsorbError(D, a, 'hero', 'goldfishScale')).toBe('no slot left');
    a = withExp(a, 'hero', D.levelExp[0]);
    expect(weaponSlots(D, a.weapons.hero)).toBe(lv2);
    expect(getAbsorbError(D, a, 'hero', 'goldfishScale')).toBeNull();
    expect(weaponSlots(D, withExp(a, 'hero', D.levelExp[1]).weapons.hero)).toBe(lv3);
    // 段階42：Lv7 が一番上
    expect(weaponSlots(D, withExp(a, 'hero', 999).weapons.hero)).toBe(D.slotsPerLevel[D.slotsPerLevel.length - 1]);
  });

  it('アイテム・持っていない素材は刻めない。元の状態は書き換えない', () => {
    const a = addItems(createArmory(D), ['potion', 'maskShard']);
    expect(getAbsorbError(D, a, 'hero', 'potion')).toBe('only materials can be absorbed');
    expect(getAbsorbError(D, a, 'hero', 'goldfishFin')).toBe('no item left');
    absorbMaterial(D, a, 'hero', 'maskShard');
    expect(a.items.maskShard).toBe(1);
    expect(a.weapons.hero.params.fire).toBe(0);
  });

  it('素材にはすべて種類があり、上がる方が下がる方より大きい', () => {
    for (const it of Object.values(ITEMS)) {
      if (it.kind !== 'material') continue;
      expect(it.rarity, it.id).toBeDefined();
      const total = Object.values(it.gains).reduce((x: number, n) => x + (n ?? 0), 0);
      expect(total, it.id).toBeGreaterThan(0);
    }
  });
});

describe('武器：素材をまとめて刻む（段階145）', () => {
  it('選んだ数だけ1つずつ刻むのと同じになり、プレビューも同じ値', () => {
    const a = addItems(createArmory(D), ['goldfishScale', 'goldfishScale', 'maskShard']);
    const picks = { goldfishScale: 2, maskShard: 1 };
    expect(getAbsorbPickedError(D, a, 'hero', picks)).toBeNull();
    const b = absorbPicked(D, a, 'hero', picks);
    let c = a;
    for (const id of ['goldfishScale', 'goldfishScale', 'maskShard']) c = absorbMaterial(D, c, 'hero', id);
    expect(b.weapons.hero).toEqual(c.weapons.hero);
    expect(b.items).toEqual(c.items);
    expect(paramsAfterPicked(D, a.weapons.hero.params, picks)).toEqual(b.weapons.hero.params);
    expect(b.weapons.hero.absorbed).toBe(3);
  });

  it('何も選んでいない・持っている数より多い・刻印が足りない・アイテムは刻めない', () => {
    const a = addItems(createArmory(D), ['goldfishScale', 'potion']);
    expect(getAbsorbPickedError(D, a, 'hero', {})).toBe('nothing picked');
    expect(getAbsorbPickedError(D, a, 'hero', { goldfishScale: 0 })).toBe('nothing picked');
    expect(getAbsorbPickedError(D, a, 'hero', { goldfishScale: 2 })).toBe('no item left');
    expect(getAbsorbPickedError(D, a, 'hero', { potion: 1 })).toBe('only materials can be absorbed');
    const many = addItems(createArmory(D), Array<string>(D.slotsPerLevel[0] + 1).fill('goldfishScale'));
    expect(getAbsorbPickedError(D, many, 'hero', { goldfishScale: D.slotsPerLevel[0] })).toBeNull();
    expect(getAbsorbPickedError(D, many, 'hero', { goldfishScale: D.slotsPerLevel[0] + 1 })).toBe('no slot left');
    expect(() => absorbPicked(D, a, 'hero', { goldfishScale: 2 })).toThrow('no item left');
  });
});

describe('武器：時分解（要らない素材の整理。段階27b）', () => {
  it('素材2つで、一番大きく上がる能力値の記憶の欠片1つ', () => {
    let a = addItems(createArmory(D), ['goldfishScale', 'goldfishScale', 'goldfishScale']);
    a = fragmentItem(D, a, 'goldfishScale');
    expect(a.items.goldfishScale).toBe(1);
    expect(a.fragments).toEqual({ relief: 1 });
    expect(getFragmentError(D, a, 'goldfishScale')).toBe('not enough items');
    expect(decomposeFragment(D, 'maskShard')).toBe('elation');
    expect(decomposeFragment(D, 'balloonShard')).toBe('relief');
  });

  it('欠片は刻印を使わずに +1', () => {
    let a = addFragments(createArmory(D), ['relief']);
    a = feedFragment(D, a, 'hero', 'relief');
    expect(a.weapons.hero.params.ice).toBe(1);
    expect(a.weapons.hero.absorbed).toBe(0);
  });

  it('知らない素材は時分解できない', () => {
    expect(getFragmentError(D, createArmory(D), 'unknown')).toBe('unknown item');
  });
});

describe('武器：経験値とレベル', () => {
  it('経験値が決まった値に届くと、レベルが上がる', () => {
    const [lv2, lv3] = D.levelExp;
    expect(weaponLevel(D, 0)).toBe(1);
    expect(weaponLevel(D, lv2 - 1)).toBe(1);
    expect(weaponLevel(D, lv2)).toBe(2);
    expect(weaponLevel(D, lv3)).toBe(3);
    expect(weaponLevel(D, 999)).toBe(D.levelExp.length + 1);
    // 1回目の進化は Lv3、2回目は Lv5、3回目は Lv7（段階42）
    expect(D.evolveLevels).toEqual([3, 5, 7]);
    expect(D.slotsPerLevel).toHaveLength(D.levelExp.length + 1);
  });

  it('勝利で、行動の回数が経験値に、盤のギアの色が傾向に貯まり、記憶の欠片を受け取る', () => {
    const a = recordVictory(createArmory(D), {
      actions: { hero: 5, akari: 3 },
      colorCells: { hero: { red: 3, blue: 1, green: 0, yellow: 0 } },
      items: ['slimeJelly', 'hardFur', 'slimeJelly', 'potion'],
    });
    expect(a.weapons.hero.exp).toBe(5);
    expect(a.weapons.akari.exp).toBe(3);
    expect(a.weapons.mio.exp).toBe(0);
    expect(a.weapons.hero.tendency).toEqual({ red: 3, blue: 1, green: 0, yellow: 0 });
    expect(a.items).toEqual({ slimeJelly: 2, hardFur: 1, potion: 1 });
    expect(a.fragments).toEqual({});
  });

  it('傾向は一番多い色。並んだら、または何もなければ傾向なし', () => {
    const w = createArmory(D).weapons.hero;
    expect(tendencyOf(w)).toBeNull();
    expect(tendencyOf({ ...w, tendency: { red: 4, blue: 2, green: 0, yellow: 0 } })).toBe('red');
    expect(tendencyOf({ ...w, tendency: { red: 4, blue: 4, green: 0, yellow: 0 } })).toBeNull();
  });
});

describe('武器：進化（能力値＋鍵の素材。段階27b）', () => {
  /** ハルトの攻撃値を12にして、Lv3 にする（水風船のゴム6つ。段階197：ハルトの1回目の刃の系統は攻撃） */
  const atk6 = () => withExp(absorbMany(createArmory(D), 'hero', Array<string>(6).fill('balloonRubber')), 'hero', 20);

  it('Lv3、能力値、鍵の素材がそろうと進化でき、鍵を1つ使う', () => {
    let a = atk6();
    expect(getEvolveError(D, a, 'hero', 'breakEdge')).toBe('conditions are not met');
    a = addItems(a, ['balloonRubber']);
    expect(getEvolveError(D, a, 'hero', 'breakEdge')).toBeNull();
    a = evolveWeapon(D, a, 'hero', 'breakEdge');
    // 型を選ばなければ1つ目の型（剛）
    expect(weaponName(D, a.weapons.hero)).toBe('ブレイクエッジ・剛');
    expect(a.weapons.hero.path).toEqual([{ id: 'breakEdge', style: 0 }]);
    expect(a.items.balloonRubber).toBe(0);
  });

  it('条件を1つずつ確かめられる（レベル、能力値、鍵）', () => {
    const a = atk6();
    const evo = D.weapons.recordSword.evolutions.find((e) => e.id === 'breakEdge')!;
    expect(evolutionChecks(D, a.weapons.hero, evo, a.items).map((c) => c.ok)).toEqual([true, true, false]);
    expect(evolutionChecks(D, a.weapons.hero, evo, { balloonRubber: 1 }).map((c) => c.ok)).toEqual([true, true, true]);
  });

  it('1回選んだら、ほかの枝には進化できない（段階42）', () => {
    let a = addItems(atk6(), ['balloonRubber', 'cottonStick']);
    a = evolveWeapon(D, a, 'hero', 'breakEdge');
    expect(getEvolveError(D, a, 'hero', 'copySword')).toBe('not the next evolution');
    expect(getEvolveError(D, a, 'hero', 'breakEdge')).toBe('not the next evolution');
  });

  it('レベルが足りなければ進化できない', () => {
    const a = addItems(withExp(atk6(), 'hero', D.levelExp[1] - 1), ['balloonRubber']);
    expect(() => evolveWeapon(D, a, 'hero', 'breakEdge')).toThrow();
  });

  it('1章のハルトの進化先は、どれも鍵の素材が要る。あかりの歌の系統だけは、ギアの傾向（2章から）', () => {
    for (const w of [D.weapons.recordSword, D.weapons.prayerRod]) {
      for (const e of w.evolutions.filter((x) => !x.sealed)) {
        const tendency = e.conditions.some((c) => c.kind === 'tendency');
        expect(tendency, e.id).toBe(['bellRod', 'chimeRod', 'templeBellRod'].includes(e.id));
        if (!tendency) expect(e.conditions.some((c) => c.kind === 'key'), e.id).toBe(true);
        for (const c of e.conditions) if (c.kind === 'key') expect(D.items[c.item]?.kind, c.item).toBe('material');
      }
    }
  });

  it('条件「どれかの属性が◯以上」（段階197。ハルトの記の系統）', () => {
    const a = withExp(absorbMany(createArmory(D), 'hero', Array<string>(4).fill('balloonRubber')), 'hero', 20);
    const evo = D.weapons.recordSword.evolutions.find((e) => e.id === 'bookmarkSword')!;
    // 攻撃 8・雷 4 では、どれかの属性 6 に届かない
    expect(evolutionChecks(D, a.weapons.hero, evo, { maskString: 1 }).map((c) => c.ok)).toEqual([true, true, false, true]);
    const b = absorbMany(a, 'hero', ['cottonStick']);
    expect(evolutionChecks(D, b.weapons.hero, evo, { maskString: 1 }).every((c) => c.ok)).toBe(true);
  });

  it('遅く加わる仲間（段階197）：小夜子は1回目、早瀬は2回目までを、条件なし・鍵を使わずに選べる（寄り道は選べない）', () => {
    let a = createArmory(D);
    expect(isJoinChoice(D, a.weapons.sayoko)).toBe(true);
    expect(getEvolveError(D, a, 'sayoko', 'duskNaginata')).toBeNull();
    a = evolveWeapon(D, a, 'sayoko', 'duskNaginata');
    expect(isJoinChoice(D, a.weapons.sayoko)).toBe(false);
    expect(getEvolveError(D, a, 'sayoko', 'midnightNaginata')).toBe('conditions are not met');
    a = evolveWeapon(D, a, 'hayase', 'secondDriver');
    expect(getEvolveError(D, a, 'hayase', 'coolDriver')).toBe('not the next evolution');
    a = evolveWeapon(D, a, 'hayase', 'pendulumDriver');
    expect(a.weapons.hayase.path.map((p) => p.id)).toEqual(['secondDriver', 'pendulumDriver']);
    expect(isJoinChoice(D, a.weapons.hayase)).toBe(false);
    expect(a.items).toEqual({});
    // 寄り道は選べない
    const h = evolveWeapon(D, createArmory(D), 'hayase', 'temperDriver');
    expect(getEvolveError(D, h, 'hayase', 'coolDriver')).toBe('conditions are not met');
    expect(isJoinChoice(D, a.weapons.hero)).toBe(false);
  });
});

describe('武器：キャラへの反映', () => {
  it('攻撃値はキャラの攻撃に足し、属性値は属性のダメージの割増しになる', () => {
    const a = absorbMany(createArmory(D), 'hero', ['maskString', 'maskString', 'maskString']);
    const [hero] = applyWeapons(D, a, [PARTY[0]]);
    expect(hero.stats.atk).toBe(PARTY[0].stats.atk + 6);
    expect(hero.passives).toEqual([{ kind: 'elementBoost', element: 'fire', rate: 6 * D.elementRate }]);
  });

  it('進化先の能力値・通常攻撃の属性と形が付く', () => {
    let a = addItems(withExp(absorbMany(createArmory(D), 'akari', Array<string>(4).fill('goldfishFin')), 'akari', 20), ['goldfishFin']);
    a = evolveWeapon(D, a, 'akari', 'iceRod');
    const akari = applyWeapons(D, a, PARTY).find((c) => c.id === 'akari')!;
    expect(akari.attackElement).toBe('ice');
    expect(akari.stats.mag).toBe(PARTY[1].stats.mag + 3);
    expect(akari.basic).toEqual({ hits: 2 });
  });


  it('進化していない武器では、通常攻撃は物理のまま', () => {
    const [hero] = applyWeapons(D, createArmory(D), [PARTY[0]]);
    expect(hero.attackElement).toBeUndefined();
  });

  it('ブリッジが伸びる型で進化すると、盤のすぐ下に、ブリッジの真下から1マス増える（段階100b。段階111 から1マス）', () => {
    let a = addItems(withExp(absorbMany(createArmory(D), 'hero', Array<string>(6).fill('balloonRubber')), 'hero', 20), ['balloonRubber']);
    a = evolveWeapon(D, a, 'hero', 'breakEdge');
    const data = naviDataWithWeapons(NAVI_DATA, D, a);
    const board = data.boards.hero;
    expect(board.rows).toBe(NAVI_DATA.boards.hero.rows + 1);
    expect(D.boardExtension).toBe(1);
    expect(board.cells.length).toBe(NAVI_DATA.boards.hero.cells.length + 1);
    expect(board.cells.filter(([c]) => c === board.commandCol)).toHaveLength(5);
    expect(board.cells.slice(-1)).toEqual([[1, 4]]);
    // 進化していないキャラの盤は変わらない
    expect(data.boards.akari).toBe(NAVI_DATA.boards.akari);
  });

  it('盤の拡張（段階100b）：新しい行は、ブリッジから近い順に埋め、そろうと次の行へ。1マス幅のしっぽにならない', () => {
    let b = NAVI_DATA.boards.hero;
    for (let k = 0; k < 3; k++) b = extendBoard(b, 2);
    // 4マスの行が1つそろい、次の行の2マス
    expect(b.cells.slice(-6)).toEqual([[1, 4], [2, 4], [0, 4], [3, 4], [1, 5], [2, 5]]);
    expect(b.rows).toBe(6);
  });

  it('盤の拡張（段階100b）：新しいマスは、すでにある盤のマスに接する所だけ（四隅の欠けた盤でも離れたマスを作らない）', () => {
    for (const shape of ['row', 'column'] as const) {
      for (const base of Object.values(NAVI_DATA.boards)) {
        let b = base;
        for (let k = 0; k < 4; k++) b = extendBoard(b, 2, shape);
        expect(b.cells.length).toBe(base.cells.length + 8);
        for (const [c, r] of b.cells.slice(base.cells.length)) {
          const touches = b.cells.some(([x, y]) => Math.abs(x - c) + Math.abs(y - r) === 1);
          expect(touches, `${shape} ${c},${r}`).toBe(true);
        }
        expect(new Set(b.cells.map(([c, r]) => `${c},${r}`)).size).toBe(b.cells.length);
      }
    }
  });
});


describe('武器：表示の文字', () => {
  it('条件と進化先の効果を、日本語で説明する', async () => {
    const { describeCondition, describeEvolution, describeFragment } = await import('../../src/ui/weaponText');
    expect(describeCondition({ kind: 'param', param: 'fire', min: 6 })).toBe('火 6以上');
    expect(describeCondition({ kind: 'tendency', color: 'red' })).toBe('傾向が銅');
    expect(describeCondition({ kind: 'key', item: 'maskString' }, D)).toBe('鍵：お面のひも');
    expect(describeCondition({ kind: 'level', min: 3 })).toBe('Lv3');
    expect(describeFragment(FRAGMENTS.elation)).toBe('火 +1');
    const edge = D.weapons.recordSword.evolutions[0];
    const { describeGains } = await import('../../src/ui/weaponText');
    expect(describeGains(ITEMS.goldfishFin.gains)).toBe('氷+3、火−1');
    expect(describeEvolution(edge)).toBe('通常攻撃が2回当たる。攻撃 +4');
    expect(describeCondition({ kind: 'elementAny', min: 6 })).toBe('火・氷・雷のどれか 6以上');
    expect(describeCondition({ kind: 'join' })).toBe('加わった時の選択（条件なし）');
  });
});

describe('武器：進化ツリー（段階42）', () => {
  /** ハルトの武器を、レベル・素材をそろえて道どおりに進化させる */
  const evolveAlong = (steps: [string, number][], extra: string[] = []): ArmoryState => {
    let a = withExp(createArmory(D), 'hero', 999);
    a = absorbMany(a, 'hero', [...Array<string>(18).fill('maskString'), ...extra]);
    for (const [id, style] of steps) {
      const evo = D.weapons.recordSword.evolutions.find((e) => e.id === id)!;
      a = addItems(a, evo.conditions.flatMap((c) => (c.kind === 'key' ? [c.item] : [])));
      a = evolveWeapon(D, a, 'hero', id, style);
    }
    return a;
  };

  it('ツリーの形（段階197）：合流せず、本道は 3 → 3 → 4。寄り道は作った物2本と言い伝え。3回目までは作ってあり、その先は影', () => {
    for (const w of Object.values(D.weapons)) {
      const ids = new Set(w.evolutions.map((e) => e.id));
      expect(ids.size, w.id).toBe(w.evolutions.length);
      for (const e of w.evolutions) if (e.from) expect(ids.has(e.from), e.id).toBe(true);
      const main = w.evolutions.filter((e) => !e.detour);
      const perTier = [1, 2, 3].map((t) => main.filter((e) => evolutionTier(w, e.id) === t).length);
      expect(perTier, w.id).toEqual([3, 3, 4]);
      const detours = w.evolutions.filter((e) => e.detour);
      expect(detours.filter((e) => !e.sealed), w.id).toHaveLength(2);
      for (const e of detours.filter((x) => x.sealed)) expect(e.legend, e.id).toBeTruthy();
      for (const e of w.evolutions) {
        const tier = evolutionTier(w, e.id);
        const kids = w.evolutions.filter((x) => x.from === e.id);
        if ((tier <= 3 && !e.detour) || (e.detour && !e.sealed)) {
          // 作った進化先：名前・型2つ（横と縦を1つずつ）・鍵の素材
          expect(e.sealed, e.id).toBeFalsy();
          expect(e.name, e.id).not.toBe('');
          expect(e.styles?.map((s) => s.board).sort(), e.id).toEqual(['column', 'row']);
          for (const c of e.conditions) if (c.kind === 'key') expect(D.items[c.item]?.kind, c.item).toBe('material');
        } else {
          expect(e.sealed, e.id).toBe(true);
        }
        // 寄り道はその先がない。本道の一番先には言い伝え
        if (e.detour) expect(kids, e.id).toHaveLength(0);
        if (!e.detour && kids.length === 0) {
          expect(tier, e.id).toBe(6);
          expect(e.legend, e.id).toBeTruthy();
        }
      }
    }
  });

  it('2回目は Lv5、3回目は Lv7 で、能力値と鍵がそろうと進化できる', () => {
    let a = evolveAlong([['breakEdge', 0]]);
    a = withExp(a, 'hero', D.levelExp[2]);
    const crush = D.weapons.recordSword.evolutions.find((e) => e.id === 'crushEdge')!;
    a = addItems(a, ['tinKey']);
    expect(evolutionChecks(D, a.weapons.hero, crush, a.items)[0]).toEqual({ condition: { kind: 'level', min: 5 }, ok: false });
    expect(getEvolveError(D, a, 'hero', 'crushEdge')).toBe('conditions are not met');
    a = withExp(a, 'hero', D.levelExp[3]);
    expect(getEvolveError(D, a, 'hero', 'crushEdge')).toBeNull();
    a = evolveWeapon(D, a, 'hero', 'crushEdge', 1);
    expect(weaponName(D, a.weapons.hero)).toBe('クラッシュエッジ・砕');
    expect(a.weapons.hero.path).toHaveLength(2);
    const grand = D.weapons.recordSword.evolutions.find((e) => e.id === 'grandEdge')!;
    expect(evolutionChecks(D, a.weapons.hero, grand, {})[0].condition).toEqual({ kind: 'level', min: 7 });
  });

  it('型は選べ、知らない型では進化できない。まだ作っていない先には進化できない', () => {
    const base = addItems(withExp(absorbMany(createArmory(D), 'hero', Array<string>(6).fill('balloonRubber')), 'hero', 999), ['balloonRubber']);
    expect(getEvolveError(D, base, 'hero', 'breakEdge', 2)).toBe('unknown style');
    expect(getEvolveError(D, base, 'hero', 'breakEdge', 1)).toBeNull();
    const a = evolveAlong([['breakEdge', 0], ['crushEdge', 0], ['grandEdge', 0]]);
    expect(nextEvolutions(D, a.weapons.hero).every((e) => e.sealed)).toBe(true);
    expect(getEvolveError(D, a, 'hero', 'grandEdge_1a')).toBe('sealed');
    expect(canEvolveAny(D, a, 'hero')).toBe(false);
  });

  it('通った進化先と型の能力値・特性は全部足し、通常攻撃の属性は一番新しいもの', () => {
    const a = evolveAlong([['breakEdge', 1], ['crushEdge', 1], ['grandEdge', 0]]);
    const [hero] = applyWeapons(D, a, [PARTY[0]]);
    // 攻撃：刻んだ素材（お面のひも 18個で +36）＋ ブレイクエッジ 4 ＋ クラッシュエッジ 5 ＋ グランドエッジ 6 ＋ 剛 3
    expect(hero.stats.atk).toBe(PARTY[0].stats.atk + 36 + 4 + 5 + 6 + 3);
    // 砕（型）の部位の割増しと、クラッシュエッジの部位の割増し
    expect(hero.passives).toContainEqual({ kind: 'partBoost', rate: 0.2 });
    expect(hero.traits).toContainEqual({ kind: 'partBoost', rate: 0.2 });
    // 通常攻撃の形は重ねる：2回 → 3回・部位に1.5倍
    expect(hero.basic).toEqual({ hits: 3, partMult: 1.5 });
    expect(hero.attackElement).toBeUndefined();
  });

  it('型の形で盤が広がる：ブリッジが伸びる型は下の行へ、盤が広がる型は右の列へ（上から。段階100b）', () => {
    const a = evolveAlong([['breakEdge', 0], ['crushEdge', 1]]);
    const board = naviDataWithWeapons(NAVI_DATA, D, a).boards.hero;
    const base = NAVI_DATA.boards.hero;
    expect(board.cells.length).toBe(base.cells.length + 2);
    expect(board.cols).toBe(base.cols + 1);
    expect(board.rows).toBe(base.rows + 1);
    expect(board.cells.slice(-1)).toEqual([[4, 0]]);
    // みおの盤は四隅が欠けているので、右の列は、欠けていない行（1・2行目）の隣から
    const b = extendBoard(NAVI_DATA.boards.mio, 2, 'column');
    expect(b.cells.slice(-2)).toEqual([[4, 1], [4, 2]]);
  });

  it('寄り道は、能力値を低いままにする条件', () => {
    let a = withExp(absorbMany(createArmory(D), 'hero', Array<string>(6).fill('balloonRubber')), 'hero', 999);
    a = evolveWeapon(D, addItems(a, ['balloonRubber']), 'hero', 'breakEdge');
    a = addItems(a, ['bentSpoke']);
    // 水風船のゴム6つで雷が6なので、雷2以下の寄り道には進めない
    expect(a.weapons.hero.params.thunder).toBe(6);
    expect(getEvolveError(D, a, 'hero', 'strayEdge')).toBe('conditions are not met');
    const low = { ...a, weapons: { ...a.weapons, hero: { ...a.weapons.hero, params: { ...a.weapons.hero.params, thunder: 2 } } } };
    expect(getEvolveError(D, low, 'hero', 'strayEdge')).toBeNull();
  });

  it('見せ方：次は全部、2段先は伏せる、その先は影、一番先は言い伝え、行けない枝は薄く（8-2）', () => {
    const fresh = createArmory(D).weapons.hero;
    const vis = (w: typeof fresh, id: string) => evolutionVisibility(D, w, id);
    expect(vis(fresh, 'breakEdge')).toBe('next');
    expect(vis(fresh, 'crushEdge')).toBe('hint');
    expect(vis(fresh, 'strayEdge')).toBe('hint');
    expect(vis(fresh, 'grandEdge')).toBe('shadow');
    expect(vis(fresh, 'grandEdge_1a')).toBe('shadow');
    expect(vis(fresh, 'grandEdge_1c1')).toBe('legend');
    const w = evolveAlong([['breakEdge', 0], ['crushEdge', 0]]).weapons.hero;
    expect(vis(w, 'breakEdge')).toBe('passed');
    expect(vis(w, 'crushEdge')).toBe('passed');
    expect(vis(w, 'grandEdge')).toBe('next');
    expect(vis(w, 'grandEdge_1a')).toBe('shadow');
    expect(vis(w, 'copySword')).toBe('unreachable');
    expect(vis(w, 'diarySword_1c1')).toBe('unreachable');
  });

  it('伸びる方向・型・鍵の手がかりを、日本語で説明する', async () => {
    const { describeDirection, describeStyle, describeCondition } = await import('../../src/ui/weaponText');
    const { itemHint } = await import('../../src/data');
    const find = (id: string) => Object.values(D.weapons).flatMap((w) => w.evolutions).find((e) => e.id === id)!;
    expect(describeDirection(find('grandEdge'))).toBe('攻↑↑');
    expect(describeDirection(find('blessRod'))).toBe('氷↑↑ 攻↓');
    expect(describeDirection(find('bookmarkSword'))).toBe('攻↑↑ 属性どれか↑');
    expect(describeDirection(find('magicianCards'))).toBe('雷↑↑ 傾向 真鍮');
    expect(describeDirection(find('strayEdge'))).toBe('雷↓');
    expect(describeCondition({ kind: 'paramMax', param: 'thunder', max: 2 })).toBe('雷 2以下');
    expect(describeStyle(find('healingRod').styles![1], 2)).toBe('灯：ラウンドの始めに最大HPの3%を回復。盤の右に2マス増える');
    expect(describeStyle(find('healingRod').styles![1], 0)).toBe('灯：ラウンドの始めに最大HPの3%を回復');
    expect(describeStyle(find('bookmarkSword').styles![0], 0)).toBe('結：自分が使うコンボのダメージ・回復量 +10%');
    expect(itemHint('beigoma')).toBe('1-2 の砂嵐が落とすらしい');
    expect(itemHint('brokenBelt')).toBe('2-1 のぬしの体から取れるらしい');
    expect(itemHint('sunsetMarble')).toBe('1-2 の砂嵐が、ごくまれに落とすらしい');
  });
});

describe('時分解を出すきっかけ（段階100c）', () => {
  it('どれかの武器の刻印がいっぱいになると true。初めは false', () => {
    const fresh = createArmory(D);
    expect(anySlotsFull(D, fresh)).toBe(false);
    const hero = fresh.weapons.hero;
    const full = { ...fresh, weapons: { ...fresh.weapons, hero: { ...hero, absorbed: weaponSlots(D, hero) } } };
    expect(anySlotsFull(D, full)).toBe(true);
    // レベルが上がって枠が増えると、また空きができる（画面は、一度出た時分解を物語の変数に覚えて隠さない）
    const grown = { ...full, weapons: { ...full.weapons, hero: { ...full.weapons.hero, exp: 999 } } };
    expect(anySlotsFull(D, grown)).toBe(false);
  });
});
