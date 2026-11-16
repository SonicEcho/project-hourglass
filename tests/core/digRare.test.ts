import { describe, expect, it } from 'vitest';
import { createArmory, createDig, decomposeCostOf, digLayerTop, fragmentItem } from '../../src/core';
import { digAfterDive, DIG_FULL_VAR, digFullDepth, DIG_LORE, DIG_RARE_GOT_VAR, DIG_RARE_MISS_VAR, DIG_RULES, digLoreVar, digRareAfter, digRareChance, digRuleFor, parseRare, parseRelic, pickDigRare, SAND_BOTTOM, sandBottomFor, WEAPON_DATA, withRareRelic, withRule } from '../../src/data';
import type { DigOwned } from '../../src/data';

// 砂の底のやり込み（段階217。S8a。docs/milestones/M3_sand_bottom.md）：特別ルールと珍品
const none: DigOwned = { item: () => false, snap: () => false, gear: () => false };
const all: DigOwned = { item: () => true, snap: () => true, gear: () => true };
const seq = (...v: number[]) => {
  let i = 0;
  return () => v[i++ % v.length];
};

describe('砂の底：特別ルール（段階217）', () => {
  it('潜るたびに決まり（同じ回は同じ）、いくつかの種類が出る', () => {
    expect(digRuleFor(5, 3)).toBe(digRuleFor(5, 3));
    const seen = new Set(Array.from({ length: 60 }, (_, i) => digRuleFor(7, i)));
    expect(seen.size).toBeGreaterThanOrEqual(4);
    for (const r of seen) expect(DIG_RULES[r]).toBeDefined();
  });

  it('ルールで地面の割合が変わる（ふつうの地面は変えない）', () => {
    const base = sandBottomFor('ch3');
    const l = (d: typeof base) => d.layers[0];
    expect(l(withRule(base, 'traps')).pit).toBe((l(base).pit ?? 0) * 2);
    expect(l(withRule(base, 'dark')).dark).toBe(Math.max(1, (l(base).dark ?? 4) - 1));
    expect(l(withRule(base, 'chests')).chestRate).toBeGreaterThan(l(base).chestRate);
    expect(l(withRule(base, 'grains')).grain).toBe(l(base).grain * 2);
    expect(withRule(base, 'none')).toBe(base);
    const deep = (d: typeof base) => d.layers[d.layers.length - 1];
    expect(deep(withRule(base, 'traps')).pit).toBe(deep(base).pit);
  });
});

describe('砂の底：珍品の確率（段階217）', () => {
  it('まだ取ったことがなければ高め。取ると下がり、外れるたびに上がる（上限あり）。砂嵐が多い回は出やすい', () => {
    expect(digRareChance({})).toBeCloseTo(0.4);
    let v = digRareAfter({}, true);
    expect(digRareChance(v)).toBeCloseTo(0.05);
    v = digRareAfter(v, false);
    expect(digRareChance(v)).toBeCloseTo(0.1);
    for (let i = 0; i < 20; i++) v = digRareAfter(v, false);
    expect(digRareChance(v)).toBeCloseTo(0.4);
    v = digRareAfter(v, true);
    expect([v[DIG_RARE_GOT_VAR], v[DIG_RARE_MISS_VAR]]).toEqual(['1', '0']);
    expect(digRareChance(v, 'storms')).toBeCloseTo(0.2);
  });

  it('外れの回は埋めない。当たりの回は、砂の底のレア素材・レアスナップ・レアギア・懐かしい物・りくのメモ・誰かの日記から選ぶ', () => {
    expect(pickDigRare('ch3', {}, none, 'none', seq(0.99))).toBeNull();
    const kinds = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const r = pickDigRare('ch3', {}, none, 'none', seq(0.01, i / 40, 0.5));
      expect(r).not.toBeNull();
      kinds.add(r!.split(':')[1]);
      expect(parseRelic(r!)?.kind).toBe('rare');
      expect(parseRare(parseRelic(r!)!.ref)).not.toBeNull();
    }
    expect([...kinds].sort()).toEqual(['gear', 'item', 'lore', 'old', 'snap']);
  });

  it('読み物は、開いている層の分から番号の若い物から。見つけた物は出ない。持っている物は懐かしい物にならない', () => {
    const riku = (vars: Record<string, string>) => {
      for (let i = 0; i < 40; i++) {
        const r = pickDigRare('ch2', vars, all, 'none', seq(0.01, i / 40, 0.5));
        if (r?.includes('lore:riku')) return r;
      }
      return null;
    };
    expect(riku({})).toBe('rare:lore:riku1');
    expect(riku({ [digLoreVar('riku1')]: '1' })).toBe('rare:lore:riku2');
    // 2章の時は感覚記憶の層だけ：りくのメモ 4 は出ない
    expect(riku({ [digLoreVar('riku1')]: '1', [digLoreVar('riku2')]: '1', [digLoreVar('riku3')]: '1' })).toBeNull();
    for (let i = 0; i < 40; i++) expect(pickDigRare('ch3', {}, all, 'none', seq(0.01, i / 40, 0.5)) ?? '').not.toContain(':old:');
  });

  it('珍品は、開いている章の層のいちばん下の帯の光る物になり、地面に置かれる', () => {
    const def = withRareRelic(sandBottomFor('ch3'), 'rare:item:digSpool', seq(0.99));
    const holder = def.layers.find((l) => l.relics?.includes('rare:item:digSpool'))!;
    expect(holder.id).toBe('daseki');
    const a = createDig(def, 4);
    expect(Object.values(a.relics)).toContain('rare:item:digSpool');
  });
});

describe('砂の底：砂の底だけの素材と読み物（段階217）', () => {
  it('素材は実在し、ふつうの素材は宝箱・鉱脈の◆の段に混ざる。レア素材は時分解で1つから欠片5つ', () => {
    const kingyo = SAND_BOTTOM.layers.find((l) => l.id === 'kingyo')!;
    expect(kingyo.items.uncommon).toContain('digScent');
    const rare = WEAPON_DATA.items.digAfterglow;
    expect([rare.rarity, rare.fragments, decomposeCostOf(WEAPON_DATA, 'digAfterglow'), decomposeCostOf(WEAPON_DATA, 'digScent')]).toEqual(['rare', 5, 1, WEAPON_DATA.decomposeCost]);
    const armory = { ...createArmory(WEAPON_DATA), items: { digAfterglow: 1 } };
    const after = fragmentItem(WEAPON_DATA, armory, 'digAfterglow');
    expect(Object.values(after.fragments).reduce((a, b) => a + b, 0) - Object.values(armory.fragments).reduce((a, b) => a + b, 0)).toBe(5);
    expect(after.items.digAfterglow).toBe(0);
  });

  it('読み物：id が重ならず、章の層がある。番号はそれぞれ通し番号', () => {
    const ids = DIG_LORE.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const d of DIG_LORE) expect(['ch1', 'ch2', 'ch3', 'ch4'], d.id).toContain(d.stratum);
    for (const k of ['riku', 'diary'] as const) {
      const nos = DIG_LORE.filter((d) => d.kind === k).map((d) => d.no);
      expect(nos).toEqual(nos.map((_, i) => i + 1));
    }
    // 物語の軸（STORY.md の 2-0）：体の時間が減る書き方はしない
    for (const d of DIG_LORE) expect(d.text, d.id).not.toMatch(/残り時間|寿命|年老い/);
  });
});

describe('砂の底：選び直しを防ぐ（段階218）', () => {
  it('ちゃんと潜ったとみなす深さは、いちばん浅い章の層のいちばん下の帯の上の端', () => {
    const def = sandBottomFor('ch2');
    expect(digFullDepth(def)).toBe(digLayerTop(def, 'futari'));
    expect(digFullDepth(sandBottomFor('ch4'))).toBe(digLayerTop(sandBottomFor('ch4'), 'futari'));
  });

  it('すぐ戻った回は、回数も外れも進まない。ちゃんと潜った回は進む。取った回は深さに関係なく取った', () => {
    expect(digAfterDive({}, false, false)).toEqual({});
    const full = digAfterDive({}, true, false);
    expect([full[DIG_FULL_VAR], full[DIG_RARE_MISS_VAR]]).toEqual(['1', '1']);
    const got = digAfterDive({}, false, true);
    expect([got[DIG_FULL_VAR], got[DIG_RARE_GOT_VAR], got[DIG_RARE_MISS_VAR]]).toEqual([undefined, '1', '0']);
  });
});

describe('砂の底：レアスナップ・レアギア（段階219）', () => {
  it('どの層にもレアスナップとレアギアがあり、実在する。持っている物は珍品に出ない', async () => {
    const { CHAIN_SNAPS, NAVI_DATA } = await import('../../src/data');
    for (const id of ['dig_zanzo', 'dig_utakata', 'dig_kaiso']) expect(CHAIN_SNAPS[id], id).toBeDefined();
    for (const id of ['digFlash', 'digFleeting', 'digSomato']) expect(NAVI_DATA.parts[id], id).toBeDefined();
    for (let i = 0; i < 40; i++) {
      const r = pickDigRare('ch4', {}, all, 'none', seq(0.01, i / 40, 0.5)) ?? '';
      expect(r).not.toMatch(/rare:(snap|gear):/);
    }
  });
});
