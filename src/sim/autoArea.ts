import type { ArmoryState, CharacterDef, GrowthState, Lineup, NaviState } from '../core';
import { applyGrowth, applyNavi, applyWeapons, battleLineup, createArmory, createGrowth, createNavi, lineupAt, naviDataWithWeapons } from '../core';
import type { CampaignBattle } from '../data';
import { AREA_BATTLES, AREAS, CHAPTER1_LINEUP, GROWTH_MAP, NAVI_DATA, PARTY, SKILLS, SLICE_FLOW, START_MEMORY_POINTS, START_NAVI_PARTS, WEAPON_DATA } from '../data';

// 区画と育ち具合の道具（段階27 からの区画の自動対戦の残り）。段階192（段階G2）で古い戦闘を外した時に、古い戦闘で区画を通す自動対戦は外し、
// 育ち具合（presets.ts の表）を仲間の能力値にする所と、区画の戦闘の並び・章の並びだけを残した

/** 区画の戦闘を出会う順に（敵の印の並び → ボス） */
export function areaBattleOrder(areaId = 'a11'): CampaignBattle[] {
  const area = AREAS[areaId];
  return [...area.enemies.map((e) => AREA_BATTLES[e.battle]), AREA_BATTLES[area.boss.battle]];
}

/** 区画をまたいで引き継ぐもの（星図・武器・ムーブメント・つながりゲージ） */
export interface Carry {
  growth: GrowthState;
  armory: ArmoryState;
  navi: NaviState;
  gauge: number;
}

/** 区画を探索する章のパーティ（物語の流れで、その区画の探索の出来事がある章。段階39） */
export function areaLineup(areaId: string): Lineup {
  const event = SLICE_FLOW.flatMap((c) => c.events).find((e) => e.kind === 'explore' && e.area === areaId);
  // 段階91：戦闘に出る人数より仲間が多い時は、区画で外せない仲間と、並びの順の先頭から選ぶ（遊ぶ人が並びを選ばなかった時と同じ）
  return battleLineup(event ? lineupAt(SLICE_FLOW, event.id, CHAPTER1_LINEUP) : CHAPTER1_LINEUP, [], AREAS[areaId]?.partyFixed ?? []);
}

/** 始めの育ち具合（星図・武器・ムーブメントは初め、つながりゲージは0） */
export function newCarry(): Carry {
  return {
    growth: createGrowth(GROWTH_MAP, PARTY.map((c) => c.id), START_MEMORY_POINTS),
    armory: createArmory(WEAPON_DATA),
    navi: createNavi(START_NAVI_PARTS),
    gauge: 0,
  };
}

/** 育ち具合を反映した仲間（星図・ムーブメント・武器） */
export function grownParty(growth: GrowthState, armory: ArmoryState, members: CharacterDef[], navi: NaviState | null): CharacterDef[] {
  const grown = applyGrowth(GROWTH_MAP, growth, members, SKILLS);
  const withNavi = navi ? applyNavi(naviDataWithWeapons(NAVI_DATA, WEAPON_DATA, armory), navi, grown) : grown;
  return applyWeapons(WEAPON_DATA, armory, withNavi);
}
