import { describe, expect, it } from 'vitest';
import { flowEvents } from '../src/core';
import { SLICE_FLOW } from '../src/data';
import { PRESET_SEEDS } from '../src/sim/presetSeeds';
import { areasBefore, carryScore, growthPreset, presetSummary } from '../src/sim/presets';

// 育ち具合で飛ぶ（段階92）
describe('育ち具合で飛ぶ（段階92）', () => {
  it('出来事の前に通し終えた区画を、流れに出る順に数える（晩の途中の区画は入れない）', () => {
    expect(areasBefore('prologue_title')).toEqual([]);
    expect(areasBefore('a3s_enter')).toEqual(['a11', 'a12', 'a21', 'a22', 'a23', 'a23x', 'a31']);
    expect(areasBefore('a31_explore2')).toEqual(['a11', 'a12', 'a21', 'a22', 'a23', 'a23x']);
    expect(areasBefore('a3s_explore2')).toEqual(['a11', 'a12', 'a21', 'a22', 'a23', 'a23x', 'a31', 'a3s1']);
  });

  it('前もって選んだシードが、流れの全部の区画にある（区画を足したら npm run presets で作り直す）', () => {
    expect(Object.keys(PRESET_SEEDS)).toEqual(areasBefore(flowEvents(SLICE_FLOW).at(-1)!.id));
  });

  it('同じ出来事・同じ段なら同じ育ち具合。やり込みは、ふつうより育つ', () => {
    const a = growthPreset('a21_enter', 'normal');
    const b = growthPreset('a21_enter', 'normal');
    expect(b.carry).toEqual(a.carry);
    expect(a.areas).toEqual(['a11', 'a12']);
    expect(carryScore(growthPreset('a21_enter', 'high').carry)).toBeGreaterThan(carryScore(a.carry));
    expect(a.snaps.length).toBeGreaterThan(0);
    expect(presetSummary(a, 'a21_enter')).toMatch(/^育ち具合：ふつう（2区画を通した/);
  });

  it('前に区画がなければ、始めの育ち具合', () => {
    const p = growthPreset('prologue_title', 'high');
    expect(p.areas).toEqual([]);
    expect(presetSummary(p, 'prologue_title')).toMatch(/^育ち具合：はじめ/);
  });
});
