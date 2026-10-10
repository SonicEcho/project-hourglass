import type { ArmoryState, BattleState, CharacterDef, GrowthState, Lineup, Vitals } from '../core';
import {
  addItems,
  applyGrowth,
  applyWeapons,
  battleReward,
  createArmory,
  createBattle,
  createGrowth,
  getBattleResult,
  getOpenError,
  lineupMembers,
  openableNodes,
  openNode,
  recordVictory,
  vitalsAfter,
} from '../core';
import type { CampaignBattle } from '../data';
import { AREA_BATTLES, AREAS, CHAPTER1_LINEUP, createCampaignSetup, GROWTH_MAP, PART_BREAK_POINTS, PARTY, SKILLS, START_MEMORY_POINTS, WEAPON_DATA } from '../data';
import { autoUseArmory } from './autoArmory';
import { autoPlay, lcg, smartPlay } from './autoBattle';
import { MAX_ATTEMPTS, type StageRecord } from './autoRun';

// 区画の自動対戦（段階27）：1-1 の縁日を、章のパーティ（ハルトとあかり）で、出会う順に戦ってボスまで通す。
// 戦闘の間に、星図（でたらめ）と武器（autoArmory.ts。一番近い進化先へ向けて吸わせる）で育て、つながりゲージは戦闘をまたいで引き継ぐ。
// 宝箱は最初の戦闘の後に2つとも開ける（縁日の手前にあるので）。負けたらチェックポイントから同じ戦闘をやり直す。
// HP・MP は戦闘をまたいで持ち越す（段階32b 調整3）。チェックポイントの先の戦闘（CHECKPOINT_FROM 番目から）は、星図・武器で育てるために
// チェックポイントへ寄る（全回復する）ものとする。負けてやり直す時も全回復

/** チェックポイントより先の戦闘（1-1 は社への道の砂嵐とボス。地図の P は、広場と左右の参道の砂嵐の先） */
const CHECKPOINT_FROM = 3;

/** 手の選び方：random（ほぼでたらめ。段階12の方針）、smart（弱点をねらう。autoBattle.ts の smartPlay） */
export type AreaPolicy = 'random' | 'smart';

export interface AreaRunRecord {
  seed: number;
  stages: StageRecord[];
  cleared: boolean;
  /** 連携技を使った回数（戦闘ごと。勝った戦闘だけ） */
  links: number[];
  /** ボスの前までに進化した仲間の数（段階27b） */
  evolvedBeforeBoss: number;
}

/** 1-1 の戦闘を出会う順に（敵の印の並び → ボス） */
export function areaBattleOrder(areaId = 'a11'): CampaignBattle[] {
  const area = AREAS[areaId];
  return [...area.enemies.map((e) => AREA_BATTLES[e.battle]), AREA_BATTLES[area.boss.battle]];
}

export function autoAreaRun(seed: number, policy: AreaPolicy, lineup: Lineup = CHAPTER1_LINEUP, areaId = 'a11'): AreaRunRecord {
  const pick = lcg((seed * 7919 + 3) % 2147483648);
  const area = AREAS[areaId];
  const members = lineupMembers(PARTY, lineup);
  let growth: GrowthState = createGrowth(GROWTH_MAP, PARTY.map((c) => c.id), START_MEMORY_POINTS);
  let armory: ArmoryState = createArmory(WEAPON_DATA);
  let gauge = 0;
  let vitals: Record<string, Vitals> | undefined;
  const stages: StageRecord[] = [];
  const links: number[] = [];
  let evolvedBeforeBoss = 0;
  const battles = areaBattleOrder(areaId);
  for (let i = 0; i < battles.length; i++) {
    const def = battles[i];
    if (i === 1) armory = addItems(armory, area.chests.flatMap((c) => c.items));
    growth = spendPoints(growth, members, pick);
    armory = autoUseArmory(armory, members.map((c) => c.id), pick);
    if (def.boss) evolvedBeforeBoss = members.filter((c) => armory.weapons[c.id]?.evolvedTo).length;
    const allies = grownParty(growth, armory, members);
    if (i >= CHECKPOINT_FROM) vitals = undefined;
    let record: StageRecord = { attempts: MAX_ATTEMPTS, won: false, rounds: null };
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const battleSeed = (seed + i + attempt * 100) >>> 0;
      const start: BattleState = { ...createBattle({ ...createCampaignSetup(def, battleSeed, allies), vitals: attempt === 0 ? vitals : undefined }), linkGauge: gauge };
      const s = policy === 'smart' ? smartPlay(start, battleSeed) : autoPlay(start, battleSeed);
      if (s.outcome !== 'victory') continue;
      record = { attempts: attempt + 1, won: true, rounds: s.round };
      links.push(s.log.filter((e) => e.type === 'action' && s.links.some((l) => l.id === e.actionId)).length);
      gauge = s.linkGauge;
      vitals = vitalsAfter(s);
      const result = getBattleResult(s);
      growth = { ...growth, points: growth.points + battleReward(def.reward, result.brokenParts.length, PART_BREAK_POINTS) };
      armory = recordVictory(armory, { actions: result.actionCounts, colorCells: {}, items: [...result.drops, ...(def.item ? [def.item] : [])] });
      break;
    }
    stages.push(record);
    if (!record.won) return { seed, stages, cleared: false, links, evolvedBeforeBoss };
  }
  return { seed, stages, cleared: true, links, evolvedBeforeBoss };
}

function grownParty(growth: GrowthState, armory: ArmoryState, members: CharacterDef[]): CharacterDef[] {
  return applyWeapons(WEAPON_DATA, armory, applyGrowth(GROWTH_MAP, growth, members, SKILLS));
}

/** 星図：パーティのでたらめな仲間の、開けられるでたらめなマスに、払えなくなるまで星の砂を使う */
function spendPoints(growth0: GrowthState, members: CharacterDef[], pick: (n: number) => number): GrowthState {
  let growth = growth0;
  for (let guard = 0; guard < 200; guard++) {
    const options = members.flatMap((c) =>
      openableNodes(GROWTH_MAP, growth, c.id)
        .filter((n) => getOpenError(GROWTH_MAP, growth, c, n.id) === null)
        .map((n) => ({ c, id: n.id })),
    );
    if (options.length === 0) return growth;
    const o = options[pick(options.length)];
    growth = openNode(GROWTH_MAP, growth, o.c, o.id);
  }
  return growth;
}
