import { describe, expect, it } from 'vitest';
import type { ArmoryState } from '../../src/core';
import {
  addFragments,
  addItems,
  applyWeapons,
  basicAttackFor,
  createArmory,
  evolutionChecks,
  evolveWeapon,
  extendBoard,
  feedFragment,
  fragmentItem,
  getBattleResult,
  getEvolveError,
  getFeedError,
  getFragmentError,
  naviDataWithWeapons,
  previewAction,
  recordVictory,
  tendencyOf,
  weaponLevel,
  weaponName,
} from '../../src/core';
import { CAMPAIGN, FRAGMENTS, ITEMS, NAVI_DATA, PARTY, WEAPON_DATA } from '../../src/data';
import { ally, attackOn, battle, enemy, execute, guard, planAll } from './helpers';

const D = WEAPON_DATA;

/** 主人公の武器の経験値を exp にした状態 */
function withExp(a: ArmoryState, charId: string, exp: number): ArmoryState {
  return { ...a, weapons: { ...a.weapons, [charId]: { ...a.weapons[charId], exp } } };
}

/** 素材・アイテムを時分解した時に手に入る記憶の欠片を、1つずつの id の並びにする */
function fragsOf(...itemIds: (keyof typeof ITEMS)[]): string[] {
  return itemIds.flatMap((id) => Object.entries(ITEMS[id].fragments).flatMap(([f, n]) => Array<string>(n).fill(f)));
}

function feedMany(a: ArmoryState, charId: string, ids: string[]): ArmoryState {
  let out = addFragments(a, ids);
  for (const id of ids) out = feedFragment(D, out, charId, id);
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

describe('武器：時分解', () => {
  it('素材を時分解すると、素材がなくなり、決まった感情の記憶の欠片が増える', () => {
    let a = addItems(createArmory(D), ['slimeJelly']);
    a = fragmentItem(D, a, 'slimeJelly');
    expect(a.items.slimeJelly).toBe(0);
    expect(a.fragments).toEqual({ elation: 3, courage: 1 });
  });

  it('時分解で出た記憶の欠片は、別々の武器に分けて吸わせられる', () => {
    let a = fragmentItem(D, addItems(createArmory(D), ['ether']), 'ether');
    expect(a.fragments).toEqual({ elation: 2, relief: 2, wonder: 2 });
    a = feedFragment(D, a, 'hero', 'elation');
    a = feedFragment(D, a, 'mio', 'wonder');
    expect(a.weapons.hero.params).toEqual({ atk: 0, fire: 1, ice: 0, thunder: 0 });
    expect(a.weapons.mio.params).toEqual({ atk: 0, fire: 0, ice: 0, thunder: 1 });
    expect(a.fragments).toEqual({ elation: 1, relief: 2, wonder: 1 });
  });

  it('すでに持っている記憶の欠片に足される', () => {
    let a = addItems(createArmory(D), ['slimeJelly', 'hardFur']);
    a = fragmentItem(D, a, 'slimeJelly');
    a = fragmentItem(D, a, 'hardFur');
    expect(a.fragments).toEqual({ elation: 3, courage: 3, relief: 3 });
  });

  it('持っていない素材・アイテムは時分解できない。元の状態は書き換えない', () => {
    const a = addItems(createArmory(D), ['potion']);
    expect(getFragmentError(D, createArmory(D), 'potion')).toBe('no item left');
    expect(getFragmentError(D, a, 'unknown')).toBe('unknown item');
    fragmentItem(D, a, 'potion');
    expect(a.items.potion).toBe(1);
    expect(a.fragments.courage).toBeUndefined();
  });

  it('素材・アイテムは、すべて定義のある記憶の欠片になる', () => {
    for (const it of Object.values(ITEMS)) {
      const entries = Object.entries(it.fragments);
      expect(entries.length).toBeGreaterThan(0);
      for (const [id, n] of entries) {
        expect(D.fragments[id]).toBeDefined();
        expect(n).toBeGreaterThan(0);
      }
    }
  });

  it('時分解して全部吸わせた時の上がり幅は、段階9（調整1回目）の断片と同じ', () => {
    const total = (id: keyof typeof ITEMS) => feedMany(createArmory(D), 'hero', fragsOf(id)).weapons.hero.params;
    expect(total('slimeJelly')).toEqual({ atk: 1, fire: 3, ice: 0, thunder: 0 });
    expect(total('frostFeather')).toEqual({ atk: 0, fire: 0, ice: 1, thunder: 3 });
    expect(total('hardFur')).toEqual({ atk: 2, fire: 0, ice: 3, thunder: 0 });
    expect(total('steelClaw')).toEqual({ atk: 3, fire: 0, ice: 0, thunder: 0 });
    expect(total('potion')).toEqual({ atk: 2, fire: 0, ice: 0, thunder: 0 });
    expect(total('ether')).toEqual({ atk: 0, fire: 2, ice: 2, thunder: 2 });
    expect(total('hiPotion')).toEqual({ atk: 4, fire: 0, ice: 0, thunder: 0 });
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

  it('勝利で、行動の回数が経験値に、盤のパーツの色が傾向に貯まり、断片を受け取る', () => {
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

describe('武器：進化', () => {
  it('Lv3 と条件を満たすと進化できる', () => {
    let a = feedMany(createArmory(D), 'hero', fragsOf('slimeJelly', 'slimeJelly'));
    expect(getEvolveError(D, a, 'hero', 'flameBlade')).toBe('conditions are not met');
    a = withExp(a, 'hero', 20);
    expect(getEvolveError(D, a, 'hero', 'flameBlade')).toBeNull();
    a = evolveWeapon(D, a, 'hero', 'flameBlade');
    expect(weaponName(D, a.weapons.hero)).toBe('フレイムブレード');
  });

  it('条件を1つずつ確かめられる（レベル、パラメータ、傾向）', () => {
    const a = withExp(feedMany(createArmory(D), 'hero', fragsOf('steelClaw', 'steelClaw')), 'hero', 20);
    const evo = D.weapons.recordSword.evolutions.find((e) => e.id === 'breakEdge')!;
    expect(evolutionChecks(D, a.weapons.hero, evo).map((c) => c.ok)).toEqual([true, true, false]);
    const red = { ...a, weapons: { ...a.weapons, hero: { ...a.weapons.hero, tendency: { red: 5, blue: 0, green: 0, yellow: 0 } } } };
    expect(getEvolveError(D, red, 'hero', 'breakEdge')).toBeNull();
  });

  it('進化は1回だけ', () => {
    let a = withExp(feedMany(createArmory(D), 'hero', fragsOf('slimeJelly', 'slimeJelly', 'hardFur', 'hardFur')), 'hero', 20);
    a = evolveWeapon(D, a, 'hero', 'flameBlade');
    expect(getEvolveError(D, a, 'hero', 'frostBlade')).toBe('already evolved');
  });

  it('レベルが足りなければ進化できない', () => {
    const a = withExp(feedMany(createArmory(D), 'hero', fragsOf('slimeJelly', 'slimeJelly')), 'hero', D.levelExp[1] - 1);
    expect(() => evolveWeapon(D, a, 'hero', 'flameBlade')).toThrow();
  });
});

describe('武器：キャラへの反映', () => {
  it('攻撃値はキャラの攻撃に足し、属性値は属性のダメージの割増しになる', () => {
    const a = feedMany(createArmory(D), 'hero', fragsOf('slimeJelly', 'slimeJelly'));
    const [hero] = applyWeapons(D, a, [PARTY[0]]);
    expect(hero.stats.atk).toBe(PARTY[0].stats.atk + 2);
    expect(hero.passives).toEqual([{ kind: 'elementBoost', element: 'fire', rate: 6 * D.elementRate }]);
  });

  it('進化先の能力値・特性・通常攻撃の属性が付く', () => {
    let a = withExp(feedMany(createArmory(D), 'akari', fragsOf('slimeJelly', 'slimeJelly')), 'akari', 20);
    a = evolveWeapon(D, a, 'akari', 'flameRod');
    const akari = applyWeapons(D, a, PARTY).find((c) => c.id === 'akari')!;
    expect(akari.attackElement).toBe('fire');
    expect(akari.stats.mag).toBe(PARTY[1].stats.mag + 3);
  });

  it('進化していない武器では、通常攻撃は物理のまま', () => {
    const [hero] = applyWeapons(D, createArmory(D), [PARTY[0]]);
    expect(hero.attackElement).toBeUndefined();
  });

  it('進化すると、ナビカス盤のコマンドラインの行が右に2マス伸びる', () => {
    let a = withExp(feedMany(createArmory(D), 'hero', fragsOf('slimeJelly', 'slimeJelly')), 'hero', 20);
    a = evolveWeapon(D, a, 'hero', 'flameBlade');
    const data = naviDataWithWeapons(NAVI_DATA, D, a);
    const board = data.boards.hero;
    expect(board.cols).toBe(NAVI_DATA.boards.hero.cols + 2);
    expect(board.cells.length).toBe(NAVI_DATA.boards.hero.cells.length + 2);
    expect(board.cells.filter(([, r]) => r === board.commandRow)).toHaveLength(6);
    // 進化していないキャラの盤は変わらない
    expect(data.boards.akari).toBe(NAVI_DATA.boards.akari);
  });

  it('盤の拡張は、コマンドラインの行の一番右の続きに足す', () => {
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

  it('結果に、倒した敵が落とした断片と、仲間ごとの行動の回数が出る（防御は数えない）', () => {
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
    expect(describeCondition({ kind: 'level', min: 3 })).toBe('Lv3');
    expect(describeFragment(FRAGMENTS.elation)).toBe('火 +1');
    const flame = D.weapons.recordSword.evolutions[0];
    expect(describeEvolution(flame, 2)).toBe('通常攻撃が火になる。攻撃 +3。盤のコマンドラインが2マス伸びる');
  });
});
