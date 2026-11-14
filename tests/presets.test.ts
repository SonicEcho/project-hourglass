import { describe, expect, it } from 'vitest';
import { flowEvents } from '../src/core';
import { SLICE_FLOW, WEAPON_DATA } from '../src/data';
import { areasBefore, carryScore, growthPreset, presetSummary } from '../src/sim/presets';

// 育ち具合で飛ぶ（段階92）
describe('育ち具合で飛ぶ（段階92）', () => {
  it('出来事の前に通し終えた区画を、流れに出る順に数える（晩の途中の区画は入れない）', () => {
    expect(areasBefore('prologue_title')).toEqual([]);
    expect(areasBefore('a3s_enter')).toEqual(['a11', 'a12', 'a21', 'a22', 'a23', 'a23x', 'a31']);
    expect(areasBefore('a31_explore2')).toEqual(['a11', 'a12', 'a21', 'a22', 'a23', 'a23x']);
    expect(areasBefore('a3s_explore2')).toEqual(['a11', 'a12', 'a21', 'a22', 'a23', 'a23x', 'a31', 'a3s1']);
  });

  it('育ち具合の表（段階192。古い戦闘を外す前に書き出して固めた）は、流れの最後までの区画の並びを全部持つ', () => {
    const last = areasBefore(flowEvents(SLICE_FLOW).at(-1)!.id);
    for (let k = 1; k <= last.length; k++) expect(growthPreset(flowEvents(SLICE_FLOW).at(-1)!.id, 'low').areas.slice(0, k)).toEqual(last.slice(0, k));
    expect(growthPreset('a42_enter', 'low').seed).toBeGreaterThan(0);
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

  it('段階198：武器は今の木で進化させ直す（本道だけ。遅く加わる仲間は加わった時の選択まで）', () => {
    const p = growthPreset('a31_enter', 'low');
    const D = WEAPON_DATA;
    for (const [id, w] of Object.entries(p.carry.armory.weapons)) {
      for (const step of w.path) {
        const evo = D.weapons[w.defId].evolutions.find((e) => e.id === step.id);
        expect(evo, `${id} ${step.id}`).toBeDefined();
        expect(evo!.detour, step.id).toBeFalsy();
      }
    }
    expect(p.carry.armory.weapons.hero.path.length).toBeGreaterThanOrEqual(2);
    expect(p.carry.armory.weapons.sayoko.path).toHaveLength(1);
    expect(p.carry.armory.weapons.hayase.path).toHaveLength(2);
  });
});
