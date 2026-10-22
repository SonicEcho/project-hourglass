import { describe, expect, it } from 'vitest';
import type { ArmoryState } from '../../src/core';
import {
  absorbMaterial,
  addFragments,
  addItems,
  applyWeapons,
  basicAttackFor,
  createArmory,
  decomposeFragment,
  evolutionChecks,
  evolveWeapon,
  canEvolveAny,
  evolutionTier,
  evolutionVisibility,
  extendBoard,
  nextEvolutions,
  feedFragment,
  fragmentItem,
  getBattleResult,
  getEvolveError,
  getFeedError,
  getAbsorbError,
  getFragmentError,
  naviDataWithWeapons,
  paramsAfter,
  previewAction,
  recordVictory,
  tendencyOf,
  weaponLevel,
  weaponName,
  weaponSlots,
} from '../../src/core';
import { CAMPAIGN, FRAGMENTS, ITEMS, NAVI_DATA, PARTY, WEAPON_DATA } from '../../src/data';
import { ally, attackOn, battle, enemy, execute, guard, planAll } from './helpers';

const D = WEAPON_DATA;

/** ハルトの武器の経験値を exp にした状態 */
function withExp(a: ArmoryState, charId: string, exp: number): ArmoryState {
  return { ...a, weapons: { ...a.weapons, [charId]: { ...a.weapons[charId], exp } } };
}

/** 素材を持たせて、順に吸わせる（枠が足りるよう、必要ならレベルを上げておく） */
function absorbMany(a: ArmoryState, charId: string, ids: string[]): ArmoryState {
  let out = addItems(a, ids);
  for (const id of ids) out = absorbMaterial(D, out, charId, id);
  return out;
}

describe('武器：記憶の欠片を吸わせる', () => {
  it('3人それぞれに武器が1本ある', () => {
    const a = createArmory(D);
    expect(Object.keys(a.weapons).sort()).toEqual(PARTY.map((c) => c.id).sort());
  });

  it('吸わせると、その感情のパラメータが1上がり、記憶の欠片はなくなる', () => {
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

  it('持っていない記憶の欠片は吸わせられない', () => {
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

describe('武器：素材を吸わせる（段階27b）', () => {
  it('素材を吸わせると、素材ごとの上がり下がりの分だけ能力値が変わり、吸わせ枠を1つ使う', () => {
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

  it('吸わせ枠はレベルで増え、いっぱいなら吸わせられない', () => {
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

  it('アイテム・持っていない素材は吸わせられない。元の状態は書き換えない', () => {
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

  it('欠片は吸わせ枠を使わずに +1', () => {
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
  /** ハルトの火を12にして、Lv3 にする（お面のひも6つ。段階74で進化の能力値を2倍にした） */
  const fire6 = () => withExp(absorbMany(createArmory(D), 'hero', Array<string>(6).fill('maskString')), 'hero', 20);

  it('Lv3、能力値、鍵の素材がそろうと進化でき、鍵を1つ使う', () => {
    let a = fire6();
    expect(getEvolveError(D, a, 'hero', 'flameBlade')).toBe('conditions are not met');
    a = addItems(a, ['maskString']);
    expect(getEvolveError(D, a, 'hero', 'flameBlade')).toBeNull();
    a = evolveWeapon(D, a, 'hero', 'flameBlade');
    // 型を選ばなければ1つ目の型（烈）
    expect(weaponName(D, a.weapons.hero)).toBe('フレイムブレード・烈');
    expect(a.weapons.hero.path).toEqual([{ id: 'flameBlade', style: 0 }]);
    expect(a.items.maskString).toBe(0);
  });

  it('条件を1つずつ確かめられる（レベル、能力値、鍵）', () => {
    const a = fire6();
    const evo = D.weapons.recordSword.evolutions.find((e) => e.id === 'flameBlade')!;
    expect(evolutionChecks(D, a.weapons.hero, evo, a.items).map((c) => c.ok)).toEqual([true, true, false]);
    expect(evolutionChecks(D, a.weapons.hero, evo, { maskString: 1 }).map((c) => c.ok)).toEqual([true, true, true]);
  });

  it('1回選んだら、ほかの枝には進化できない（段階42）', () => {
    let a = addItems(fire6(), ['maskString', 'goldfishFin']);
    a = evolveWeapon(D, a, 'hero', 'flameBlade');
    expect(getEvolveError(D, a, 'hero', 'frostBlade')).toBe('not the next evolution');
    expect(getEvolveError(D, a, 'hero', 'flameBlade')).toBe('not the next evolution');
  });

  it('レベルが足りなければ進化できない', () => {
    const a = addItems(withExp(fire6(), 'hero', D.levelExp[1] - 1), ['maskString']);
    expect(() => evolveWeapon(D, a, 'hero', 'flameBlade')).toThrow();
  });

  it('1章のハルトとあかりの進化先は、どれも鍵の素材が要る（ギアの傾向は使わない）', () => {
    for (const w of [D.weapons.recordSword, D.weapons.prayerRod]) {
      for (const e of w.evolutions.filter((x) => !x.sealed)) {
        expect(e.conditions.some((c) => c.kind === 'key'), e.id).toBe(true);
        expect(e.conditions.some((c) => c.kind === 'tendency'), e.id).toBe(false);
        for (const c of e.conditions) if (c.kind === 'key') expect(D.items[c.item]?.kind, c.item).toBe('material');
      }
    }
  });
});

describe('武器：キャラへの反映', () => {
  it('攻撃値はキャラの攻撃に足し、属性値は属性のダメージの割増しになる', () => {
    const a = absorbMany(createArmory(D), 'hero', ['maskString', 'maskString', 'maskString']);
    const [hero] = applyWeapons(D, a, [PARTY[0]]);
    expect(hero.stats.atk).toBe(PARTY[0].stats.atk + 6);
    expect(hero.passives).toEqual([{ kind: 'elementBoost', element: 'fire', rate: 6 * D.elementRate }]);
  });

  it('進化先の能力値・特性・通常攻撃の属性が付く', () => {
    let a = addItems(withExp(absorbMany(createArmory(D), 'akari', Array<string>(6).fill('maskString')), 'akari', 20), ['maskString']);
    a = evolveWeapon(D, a, 'akari', 'flameRod');
    const akari = applyWeapons(D, a, PARTY).find((c) => c.id === 'akari')!;
    expect(akari.attackElement).toBe('fire');
    expect(akari.stats.mag).toBe(PARTY[1].stats.mag + 3);
  });

  it('進化していない武器では、通常攻撃は物理のまま', () => {
    const [hero] = applyWeapons(D, createArmory(D), [PARTY[0]]);
    expect(hero.attackElement).toBeUndefined();
  });

  it('ブリッジが伸びる型で進化すると、盤のすぐ下に、ブリッジの真下から2マス増える（段階100b）', () => {
    let a = addItems(withExp(absorbMany(createArmory(D), 'hero', Array<string>(6).fill('maskString')), 'hero', 20), ['maskString']);
    a = evolveWeapon(D, a, 'hero', 'flameBlade');
    const data = naviDataWithWeapons(NAVI_DATA, D, a);
    const board = data.boards.hero;
    expect(board.rows).toBe(NAVI_DATA.boards.hero.rows + 1);
    expect(board.cells.length).toBe(NAVI_DATA.boards.hero.cells.length + 2);
    expect(board.cells.filter(([c]) => c === board.commandCol)).toHaveLength(5);
    expect(board.cells.slice(-2)).toEqual([[1, 4], [2, 4]]);
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

describe('武器：戦闘', () => {
  it('通常攻撃に属性が乗ると、その属性で弱点を突ける（魔力で計算）', () => {
    const s = battle({
      allies: [{ ...ally('hero', { atk: 1, mag: 30 }), attackElement: 'fire' }],
      enemies: [enemy('a', {}, { weaknesses: ['fire'] })],
    });
    const p = previewAction(s, 'hero', attackOn('enemy0'));
    // 弱点はまだ判明していないので相性は通常で見せるが、魔力で計算している
    expect(p.targets[0].min).toBeGreaterThan(20);
    const after = execute(planAll(s, { hero: attackOn('enemy0') }));
    expect(after.enemies[0].down).toBe(true);
    expect(basicAttackFor({ attackElement: 'fire' }).effects[0]).toMatchObject({ kind: 'damage', type: 'fire' });
    expect(basicAttackFor({}).effects[0]).toMatchObject({ type: 'physical' });
  });

  it('結果に、倒した敵が落とした素材と、仲間ごとの行動の回数が出る（防御は数えない）', () => {
    let s = battle({
      allies: [ally('hero', { atk: 999, spd: 50 }), ally('akari')],
      enemies: [enemy('a', { hp: 1 }, { drops: ['slimeJelly'] }), enemy('b', {}, { drops: ['hardFur'] })],
    });
    s = execute(planAll(s, { hero: attackOn('enemy0'), akari: guard }));
    const r = getBattleResult(s);
    expect(r.drops).toEqual(['slimeJelly']);
    expect(r.actionCounts).toEqual({ hero: 1, akari: 0 });
  });

  it('周回の敵は素材を落とす。戦闘4の敵は鋼の爪も落とす。勝利でアイテムももらえる', () => {
    expect(CAMPAIGN[0].enemies.flatMap((e) => e.drops ?? [])).toEqual(['slimeJelly', 'slimeJelly']);
    expect(CAMPAIGN[3].enemies.flatMap((e) => e.drops ?? []).filter((d) => d === ITEMS.steelClaw.id)).toHaveLength(3);
    for (const id of CAMPAIGN.flatMap((b) => b.enemies.flatMap((e) => e.drops ?? []))) expect(D.items[id]?.kind).toBe('material');
    expect(CAMPAIGN.slice(0, 4).map((b) => b.item)).toEqual(['potion', 'ether', 'potion', 'hiPotion']);
    for (const b of CAMPAIGN) if (b.item) expect(D.items[b.item].kind).toBe('item');
  });
});

describe('武器：表示の文字', () => {
  it('条件と進化先の効果を、日本語で説明する', async () => {
    const { describeCondition, describeEvolution, describeFragment } = await import('../../src/ui/weaponText');
    expect(describeCondition({ kind: 'param', param: 'fire', min: 6 })).toBe('火 6以上');
    expect(describeCondition({ kind: 'tendency', color: 'red' })).toBe('傾向が赤');
    expect(describeCondition({ kind: 'key', item: 'maskString' }, D)).toBe('鍵：お面のひも');
    expect(describeCondition({ kind: 'level', min: 3 })).toBe('Lv3');
    expect(describeFragment(FRAGMENTS.elation)).toBe('火 +1');
    const flame = D.weapons.recordSword.evolutions[0];
    const { describeGains } = await import('../../src/ui/weaponText');
    expect(describeGains(ITEMS.goldfishFin.gains)).toBe('氷+3、火−1');
    expect(describeEvolution(flame)).toBe('通常攻撃が火になる。攻撃 +3');
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

  it('ツリーの形：合流せず、本道は 3 → 3 → 4 → 5 → 5 → 6、寄り道は1本。3回目までは作ってあり、その先は影', () => {
    for (const w of Object.values(D.weapons)) {
      const ids = new Set(w.evolutions.map((e) => e.id));
      expect(ids.size, w.id).toBe(w.evolutions.length);
      for (const e of w.evolutions) if (e.from) expect(ids.has(e.from), e.id).toBe(true);
      const main = w.evolutions.filter((e) => !e.detour);
      const perTier = [1, 2, 3, 4, 5, 6].map((t) => main.filter((e) => evolutionTier(w, e.id) === t).length);
      expect(perTier, w.id).toEqual([3, 3, 4, 5, 5, 6]);
      const detours = w.evolutions.filter((e) => e.detour);
      expect(detours, w.id).toHaveLength(1);
      for (const e of w.evolutions) {
        const tier = evolutionTier(w, e.id);
        const kids = w.evolutions.filter((x) => x.from === e.id);
        if (tier <= 3 || e.detour) {
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
    let a = evolveAlong([['flameBlade', 0]]);
    a = withExp(a, 'hero', D.levelExp[2]);
    const crimson = D.weapons.recordSword.evolutions.find((e) => e.id === 'crimsonBlade')!;
    a = addItems(a, ['beigoma']);
    expect(evolutionChecks(D, a.weapons.hero, crimson, a.items)[0]).toEqual({ condition: { kind: 'level', min: 5 }, ok: false });
    expect(getEvolveError(D, a, 'hero', 'crimsonBlade')).toBe('conditions are not met');
    a = withExp(a, 'hero', D.levelExp[3]);
    expect(getEvolveError(D, a, 'hero', 'crimsonBlade')).toBeNull();
    a = evolveWeapon(D, a, 'hero', 'crimsonBlade', 1);
    expect(weaponName(D, a.weapons.hero)).toBe('紅蓮の刃・灯');
    expect(a.weapons.hero.path).toHaveLength(2);
    const blaze = D.weapons.recordSword.evolutions.find((e) => e.id === 'blazeBlade')!;
    expect(evolutionChecks(D, a.weapons.hero, blaze, {})[0].condition).toEqual({ kind: 'level', min: 7 });
  });

  it('型は選べ、知らない型では進化できない。まだ作っていない先には進化できない', () => {
    const base = addItems(withExp(absorbMany(createArmory(D), 'hero', Array<string>(6).fill('maskString')), 'hero', 999), ['maskString']);
    expect(getEvolveError(D, base, 'hero', 'flameBlade', 2)).toBe('unknown style');
    expect(getEvolveError(D, base, 'hero', 'flameBlade', 1)).toBeNull();
    const a = evolveAlong([['flameBlade', 0], ['crimsonBlade', 0], ['blazeBlade', 0]], Array<string>(9).fill('expoTicket'));
    expect(nextEvolutions(D, a.weapons.hero).every((e) => e.sealed)).toBe(true);
    expect(getEvolveError(D, a, 'hero', 'blazeBlade_1a')).toBe('sealed');
    expect(canEvolveAny(D, a, 'hero')).toBe(false);
  });

  it('通った進化先と型の能力値・特性は全部足し、通常攻撃の属性は一番新しいもの', () => {
    const a = evolveAlong([['flameBlade', 1], ['crimsonBlade', 0]]);
    const [hero] = applyWeapons(D, a, [PARTY[0]]);
    // 攻撃：吸わせた素材（お面のひも 18個で +36）＋ フレイムブレード 3 ＋ 紅蓮の刃 4 ＋ 剛 3
    expect(hero.stats.atk).toBe(PARTY[0].stats.atk + 36 + 3 + 4 + 3);
    // 灯（フレイムブレードの型）の再生
    expect(hero.passives).toContainEqual({ kind: 'regen', rate: 0.03 });
    expect(hero.attackElement).toBe('fire');
  });

  it('型の形で盤が広がる：ブリッジが伸びる型は下の行へ、盤が広がる型は右の列へ（上から。段階100b）', () => {
    const a = evolveAlong([['flameBlade', 0], ['crimsonBlade', 1]]);
    const board = naviDataWithWeapons(NAVI_DATA, D, a).boards.hero;
    const base = NAVI_DATA.boards.hero;
    expect(board.cells.length).toBe(base.cells.length + 4);
    expect(board.cols).toBe(base.cols + 1);
    expect(board.rows).toBe(base.rows + 1);
    expect(board.cells.slice(-2)).toEqual([[4, 0], [4, 1]]);
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
    expect(vis(fresh, 'flameBlade')).toBe('next');
    expect(vis(fresh, 'crimsonBlade')).toBe('hint');
    expect(vis(fresh, 'strayEdge')).toBe('hint');
    expect(vis(fresh, 'blazeBlade')).toBe('shadow');
    expect(vis(fresh, 'blazeBlade_1a')).toBe('shadow');
    expect(vis(fresh, 'blazeBlade_1c1')).toBe('legend');
    const w = evolveAlong([['flameBlade', 0], ['crimsonBlade', 0]]).weapons.hero;
    expect(vis(w, 'flameBlade')).toBe('passed');
    expect(vis(w, 'crimsonBlade')).toBe('passed');
    expect(vis(w, 'blazeBlade')).toBe('next');
    expect(vis(w, 'blazeBlade_1a')).toBe('shadow');
    expect(vis(w, 'frostBlade')).toBe('unreachable');
    expect(vis(w, 'grandEdge_1c1')).toBe('unreachable');
  });

  it('伸びる方向・型・鍵の手がかりを、日本語で説明する', async () => {
    const { describeDirection, describeStyle, describeCondition } = await import('../../src/ui/weaponText');
    const { itemHint } = await import('../../src/data');
    const find = (id: string) => Object.values(D.weapons).flatMap((w) => w.evolutions).find((e) => e.id === id)!;
    expect(describeDirection(find('sunsetBlade'))).toBe('火↑↑ 攻↑↑');
    expect(describeDirection(find('blessRod'))).toBe('氷↑↑ 火↑↑');
    expect(describeDirection(find('magicianCards'))).toBe('雷↑↑ 傾向 黄');
    expect(describeDirection(find('strayEdge'))).toBe('雷↓');
    expect(describeCondition({ kind: 'paramMax', param: 'thunder', max: 2 })).toBe('雷 2以下');
    expect(describeStyle(find('flameBlade').styles![1], 2)).toBe('灯：ラウンドの始めに最大HPの3%を回復。盤の右に2マス増える');
    expect(describeStyle(find('flameBlade').styles![1], 0)).toBe('灯：ラウンドの始めに最大HPの3%を回復');
    expect(itemHint('beigoma')).toBe('1-2 の砂嵐が落とすらしい');
    expect(itemHint('brokenBelt')).toBe('2-1 のぬしの体から取れるらしい');
    expect(itemHint('sunsetMarble')).toBe('1-2 の砂嵐が、ごくまれに落とすらしい');
  });
});
