import { describe, expect, it } from 'vitest';
import type { ArmoryState } from '../../src/core';
import { createArmory, createNavi, forgeSecondWeapon, getForgeError, hasSecondWeapon, placePart, recordVictory, refitNavi, swapWeapon } from '../../src/core';
import { NAVI_DATA, WEAPON_DATA } from '../../src/data';

// 2本目の武器と持ち替え（段階223。docs/milestones/M3_second_weapon.md）
const D = WEAPON_DATA;

function grown(): ArmoryState {
  const a = createArmory(D);
  return { ...a, fragments: { courage: 10, wonder: 4 }, weapons: { ...a.weapons, hero: { ...a.weapons.hero, exp: 500, path: [{ id: 'breakEdge', style: 0 }] } } };
}

describe('2本目の武器（段階223）', () => {
  it('記憶の欠片で組む：多い種類から使い、Lv1 の写しが、しまってある方に入る。2本目は1つだけ', () => {
    expect(D.second?.fragments).toBe(12);
    const a = grown();
    expect(getForgeError(D, { ...a, fragments: { courage: 11 } }, 'hero')).toBe('not enough fragments');
    expect(getForgeError(D, a, 'hero')).toBeNull();
    const b = forgeSecondWeapon(D, a, 'hero');
    expect(hasSecondWeapon(b, 'hero')).toBe(true);
    expect(hasSecondWeapon(b, 'akari')).toBe(false);
    expect(b.fragments).toEqual({ courage: 1, wonder: 1 });
    expect(b.spare!.hero).toMatchObject({ defId: a.weapons.hero.defId, exp: 0, path: [], copy: true });
    expect(b.weapons.hero).toEqual(a.weapons.hero);
    expect(getForgeError(D, { ...b, fragments: { courage: 99 } }, 'hero')).toBe('already has second');
  });

  it('持ち替える：持っている武器としまってある武器が入れ替わり、育ちはそれぞれに残る', () => {
    const b = forgeSecondWeapon(D, grown(), 'hero');
    const c = swapWeapon(b, 'hero');
    expect(c.weapons.hero.copy).toBe(true);
    expect(c.spare!.hero.path).toEqual([{ id: 'breakEdge', style: 0 }]);
    expect(swapWeapon(c, 'hero')).toEqual(b);
    expect(() => swapWeapon(c, 'akari')).toThrow();
  });

  it('追いつきの経験値：しまってある武器より少ない間だけ倍。追いついた所で止まり、その先は1倍', () => {
    const c = swapWeapon(forgeSecondWeapon(D, grown(), 'hero'), 'hero');
    const win = (a: ArmoryState, n: number) => recordVictory(a, { actions: { hero: n }, colorCells: {}, items: [] }, 2);
    expect(win(c, 10).weapons.hero.exp).toBe(20);
    const near = { ...c, weapons: { ...c.weapons, hero: { ...c.weapons.hero, exp: 495 } } };
    // 495 + 10×2 = 515 だが、追いつくのは 500 まで（1倍の 505 より少なくはならない）
    expect(win(near, 10).weapons.hero.exp).toBe(505);
    const ahead = { ...c, weapons: { ...c.weapons, hero: { ...c.weapons.hero, exp: 600 } } };
    expect(win(ahead, 10).weapons.hero.exp).toBe(610);
    // 倍率を渡さなければ1倍
    expect(recordVictory(c, { actions: { hero: 10 }, colorCells: {}, items: [] }).weapons.hero.exp).toBe(10);
  });

  it('盤の形が変わったら、はめたギアを置き直す（はみ出す物は外れる）', () => {
    let navi = createNavi(['hpMemory']);
    const uid = navi.parts[0].uid;
    navi = placePart(NAVI_DATA, navi, uid, { charId: 'hero', col: 0, row: 0, rotation: 0 });
    expect(refitNavi(NAVI_DATA, navi).parts[0].placement).not.toBeNull();
    const tiny = { ...NAVI_DATA, boards: { ...NAVI_DATA.boards, hero: { ...NAVI_DATA.boards.hero, cells: [] } } };
    expect(refitNavi(tiny, navi).parts[0].placement).toBeNull();
  });
});
