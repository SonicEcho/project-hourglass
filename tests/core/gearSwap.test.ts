import { describe, expect, it } from 'vitest';
import { applyLoadout, boardParts, createNavi, loadoutConflicts, placePart, saveLoadout, type Placement } from '../../src/core';
import { AREAS, areaTraitHints, CHAIN_TRAIT_TEXT, GEAR_COUNTERS, gearCounterTraits, NAVI_DATA, traitHintLine } from '../../src/data';

// 段階201（段階G5c）：ギアの付け替えを活かす仕組み

const at = (charId: string, col: number, row: number): Placement => ({ charId, col, row, rotation: 0 });

describe('並べ方の保存（段階201）', () => {
  it('保存した並べ方に付け替えると、その仲間の盤は保存したとおりになる', () => {
    let n = createNavi(['hpMemory', 'powerMemory1', 'mpSave']);
    n = placePart(NAVI_DATA, n, 0, at('hero', 0, 0));
    n = placePart(NAVI_DATA, n, 2, at('hero', 1, 1));
    n = saveLoadout(n, 'hero', 0, 'ボス用');
    expect(n.loadouts?.hero?.[0]).toMatchObject({ name: 'ボス用' });
    expect(n.loadouts?.hero).toHaveLength(3);
    // 並べ替えてから戻す
    n = { ...n, parts: n.parts.map((p) => ({ ...p, placement: null })) };
    n = placePart(NAVI_DATA, n, 1, at('hero', 3, 3));
    const r = applyLoadout(NAVI_DATA, n, 'hero', 0);
    expect(r.missing).toBe(0);
    expect(boardParts(r.navi, 'hero').map((p) => p.uid).sort()).toEqual([0, 2]);
  });

  it('ほかの仲間の盤にはまっているギアは、確かめてから外して付ける。持っていないギアは飛ばす', () => {
    let n = createNavi(['hpMemory', 'mpSave']);
    n = placePart(NAVI_DATA, n, 1, at('hero', 1, 0));
    n = saveLoadout(n, 'hero', 1, '雑魚用');
    n = { ...n, parts: n.parts.map((p) => (p.uid === 1 ? { ...p, placement: at('akari', 1, 0) } : p)) };
    expect(loadoutConflicts(n, 'hero', 1).map((p) => p.uid)).toEqual([1]);
    const r = applyLoadout(NAVI_DATA, n, 'hero', 1);
    expect(boardParts(r.navi, 'akari')).toHaveLength(0);
    expect(boardParts(r.navi, 'hero').map((p) => p.uid)).toEqual([1]);
    const gone = { ...n, parts: n.parts.filter((p) => p.uid !== 1) };
    expect(applyLoadout(NAVI_DATA, gone, 'hero', 1).missing).toBe(1);
  });

  it('ギアを足しても、保存した並べ方は消えない', async () => {
    const { addParts } = await import('../../src/core');
    const n = saveLoadout(createNavi(['hpMemory']), 'hero', 0, 'a');
    expect(addParts(n, ['mpSave']).loadouts?.hero?.[0]?.name).toBe('a');
  });
});

describe('性質と効くギア（段階201）', () => {
  it('効くギアは本当にあるギアで、効く性質は名前の表にある', () => {
    for (const [t, gears] of Object.entries(GEAR_COUNTERS)) {
      expect(CHAIN_TRAIT_TEXT[t], t).toBeDefined();
      for (const g of gears ?? []) expect(NAVI_DATA.parts[g], g).toBeDefined();
    }
    expect(gearCounterTraits('armorPierce')).toEqual(['hard']);
    expect(gearCounterTraits('wideShot').sort()).toEqual(['interrupt', 'shield']);
  });

  it('区画の予告：その区画の砂嵐に多い性質（3つまで）と、効くギアの1行', () => {
    for (const id of Object.keys(AREAS)) expect(areaTraitHints(id).field.length).toBeLessThanOrEqual(3);
    const h = areaTraitHints('a31');
    expect(h.field.length).toBeGreaterThan(0);
    const line = traitHintLine('この先', h.field, (id) => NAVI_DATA.parts[id]?.name ?? id);
    expect(line).toMatch(/^この先：/);
    expect(line).toContain('効くギア：');
    expect(traitHintLine('この先', [], (id) => id)).toBe('');
  });
});
