import type { AlbumState } from '../core';
import { flowEvents, gainSnaps, lineupAt, lineupMembers, weaponLevel } from '../core';
import { AREAS, CHAPTER1_LINEUP, PARTY, SLICE_FLOW, WEAPON_DATA } from '../data';
import type { Carry } from './autoArea';
import { areaBattleOrder, grownParty, newCarry } from './autoArea';
import presetCarryTable from './presetCarry.json';

// 育ち具合で飛ぶ（段階92。docs/design/tech.md の 9.）：デバッグの「出来事へ飛ぶ」で、そこまで遊んだ人と同じくらいの育ち具合にする。
// 育ち具合は、前の区画を出会う順に通した時の物（段階192 からは、古い戦闘の自動対戦で作った物を表にして固めた。PRESET_CARRY）。
// 控えめ・ふつうは、何十回か回した中の、育ちが下の方・真ん中の回。やり込みは、ふつうの後に、最後に通した区画を2つ回り直したもの（狩りの代わり）

export type GrowthTier = 'low' | 'normal' | 'high';
export const GROWTH_TIERS: GrowthTier[] = ['low', 'normal', 'high'];
export const TIER_LABEL: Record<GrowthTier, string> = { low: '控えめ', normal: 'ふつう', high: 'やり込み' };

/**
 * 育ち具合の表（段階192・段階G2）：古い戦闘を外す前に、古い戦闘の自動対戦で作っていた育ち具合を、通した区画の並びごと・段ごとに書き出して固めた（presetCarry.json）。
 * これまでの新しい戦闘の測定は、この育ち具合で測っている。星図・武器・ギアを入れ替える段階G3〜G5 で、作り方を新しい戦闘に合わせて作り直す
 */
const PRESET_CARRY = presetCarryTable as unknown as Record<string, Partial<Record<GrowthTier, { seed: number; carry: Carry }>>>;

/**
 * その出来事より前に、探索を通し終えた区画（流れに初めて出る順）。晩に分けた区画は、最後の晩がその出来事より前の時だけ入る
 */
export function areasBefore(eventId: string): string[] {
  const events = flowEvents(SLICE_FLOW);
  const at = events.findIndex((e) => e.id === eventId);
  if (at < 0) return [];
  const order: string[] = [];
  const last = new Map<string, number>();
  events.forEach((e, i) => {
    if (e.kind !== 'explore' || !e.area || !AREAS[e.area]) return;
    if (!order.includes(e.area)) order.push(e.area);
    last.set(e.area, i);
  });
  return order.filter((a) => (last.get(a) ?? Infinity) < at);
}

/** 育ち具合の強さの目安（並べるため）：仲間全員の、育ちを足した後の能力値の合計（HP は 1/5、MP は 1/2 にして足す） */
export function carryScore(carry: Carry): number {
  return grownParty(carry.growth, carry.armory, PARTY, carry.navi).reduce((a, c) => a + c.stats.hp / 5 + c.stats.mp / 2 + c.stats.atk + c.stats.mag + c.stats.def + c.stats.spd, 0);
}

export interface GrowthPreset {
  tier: GrowthTier;
  /** 通した区画（流れの順） */
  areas: string[];
  seed: number;
  carry: Carry;
  /** 通した区画で手に入るスナップ（戦闘・宝箱・返した時） */
  snaps: string[];
}

/** その出来事の育ち具合を作る（前の区画がなければ、始めの育ち具合） */
export function growthPreset(eventId: string, tier: GrowthTier): GrowthPreset {
  const areas = areasBefore(eventId);
  if (areas.length === 0) return { tier, areas, seed: 0, carry: newCarry(), snaps: [] };
  const row = PRESET_CARRY[areas.join(',')]?.[tier];
  // 表にない並び（区画を足した時など）は、始めの育ち具合（段階G3〜G5 で作り方を作り直すまでの間）
  const carry: Carry = row ? (JSON.parse(JSON.stringify(row.carry)) as Carry) : newCarry();
  return { tier, areas, seed: row?.seed ?? 0, carry, snaps: areas.flatMap(areaSnaps) };
}

/** 区画で手に入るスナップ（戦闘の勝ち・宝箱・返した時） */
function areaSnaps(areaId: string): string[] {
  const area = AREAS[areaId];
  return [...areaBattleOrder(areaId).flatMap((b) => b.snaps ?? []), ...area.chests.flatMap((c) => c.snaps ?? []), ...(area.returnSnaps ?? [])];
}

/** 持っているスナップに足す */
export function withPresetSnaps(album: AlbumState, preset: GrowthPreset): AlbumState {
  const missing = preset.snaps.filter((id) => !(album.owned[id] ?? 0));
  return missing.length ? gainSnaps(album, missing) : album;
}

/** 飛んだ後に出す一言（その出来事の章の仲間ごとに、武器のレベルと進化の回数、開けた星の数） */
export function presetSummary(preset: GrowthPreset, eventId: string): string {
  const members = lineupMembers(PARTY, lineupAt(SLICE_FLOW, eventId, CHAPTER1_LINEUP));
  const head = preset.areas.length ? `育ち具合：${TIER_LABEL[preset.tier]}（${preset.areas.length}区画を通した。最後は ${AREAS[preset.areas.at(-1)!].name}）` : '育ち具合：はじめ（まだ区画を通していない）';
  const rows = members.map((c) => {
    const w = preset.carry.armory.weapons[c.id];
    const lv = w ? weaponLevel(WEAPON_DATA, w.exp) : 1;
    const evo = w?.path.length ?? 0;
    const stars = Math.max(0, (preset.carry.growth.opened[c.id]?.length ?? 1) - 1);
    return `${c.name} 武器Lv${lv}・進化${evo}回・星${stars}`;
  });
  return [head, rows.join('　'), `星の砂の残り ${preset.carry.growth.points}`].join('\n');
}

