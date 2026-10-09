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
  extendBoard,
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
    expect(weaponSlots(D, withExp(a, 'hero', 99).weapons.hero)).toBe(lv3);
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
    expect(D.evolveLevel).toBe(3);
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
  /** ハルトの火を6にして、Lv3 にする（お面のひも3つ） */
  const fire6 = () => withExp(absorbMany(createArmory(D), 'hero', ['maskString', 'maskString', 'maskString']), 'hero', 20);

  it('Lv3、能力値、鍵の素材がそろうと進化でき、鍵を1つ使う', () => {
    let a = fire6();
    expect(getEvolveError(D, a, 'hero', 'flameBlade')).toBe('conditions are not met');
    a = addItems(a, ['maskString']);
    expect(getEvolveError(D, a, 'hero', 'flameBlade')).toBeNull();
    a = evolveWeapon(D, a, 'hero', 'flameBlade');
    expect(weaponName(D, a.weapons.hero)).toBe('フレイムブレード');
    expect(a.items.maskString).toBe(0);
  });

  it('条件を1つずつ確かめられる（レベル、能力値、鍵）', () => {
    const a = fire6();
    const evo = D.weapons.recordSword.evolutions.find((e) => e.id === 'flameBlade')!;
    expect(evolutionChecks(D, a.weapons.hero, evo, a.items).map((c) => c.ok)).toEqual([true, true, false]);
    expect(evolutionChecks(D, a.weapons.hero, evo, { maskString: 1 }).map((c) => c.ok)).toEqual([true, true, true]);
  });

  it('進化は1回だけ', () => {
    let a = addItems(fire6(), ['maskString', 'goldfishFin']);
    a = evolveWeapon(D, a, 'hero', 'flameBlade');
    expect(getEvolveError(D, a, 'hero', 'frostBlade')).toBe('already evolved');
  });

  it('レベルが足りなければ進化できない', () => {
    const a = addItems(withExp(fire6(), 'hero', D.levelExp[1] - 1), ['maskString']);
    expect(() => evolveWeapon(D, a, 'hero', 'flameBlade')).toThrow();
  });

  it('1章のハルトとあかりの進化先は、どれも鍵の素材が要る（ギアの傾向は使わない）', () => {
    for (const w of [D.weapons.recordSword, D.weapons.prayerRod]) {
      for (const e of w.evolutions) {
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
    let a = addItems(withExp(absorbMany(createArmory(D), 'akari', ['maskString', 'maskString', 'maskString']), 'akari', 20), ['maskString']);
    a = evolveWeapon(D, a, 'akari', 'flameRod');
    const akari = applyWeapons(D, a, PARTY).find((c) => c.id === 'akari')!;
    expect(akari.attackElement).toBe('fire');
    expect(akari.stats.mag).toBe(PARTY[1].stats.mag + 3);
  });

  it('進化していない武器では、通常攻撃は物理のまま', () => {
    const [hero] = applyWeapons(D, createArmory(D), [PARTY[0]]);
    expect(hero.attackElement).toBeUndefined();
  });

  it('進化すると、ムーブメントのブリッジの行が右に2マス伸びる', () => {
    let a = addItems(withExp(absorbMany(createArmory(D), 'hero', ['maskString', 'maskString', 'maskString']), 'hero', 20), ['maskString']);
    a = evolveWeapon(D, a, 'hero', 'flameBlade');
    const data = naviDataWithWeapons(NAVI_DATA, D, a);
    const board = data.boards.hero;
    expect(board.cols).toBe(NAVI_DATA.boards.hero.cols + 2);
    expect(board.cells.length).toBe(NAVI_DATA.boards.hero.cells.length + 2);
    expect(board.cells.filter(([, r]) => r === board.commandRow)).toHaveLength(6);
    // 進化していないキャラの盤は変わらない
    expect(data.boards.akari).toBe(NAVI_DATA.boards.akari);
  });

  it('盤の拡張は、ブリッジの行の一番右の続きに足す', () => {
    const b = extendBoard(NAVI_DATA.boards.mio, 2);
    expect(b.cells.slice(-2)).toEqual([[4, 1], [5, 1]]);
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
    expect(describeEvolution(flame, 2)).toBe('通常攻撃が火になる。攻撃 +3。ブリッジが2マス伸びる');
  });
});
