import type { ArmoryState, BattleState, CharacterDef, GrowthState, Lineup, NaviState, Vitals } from '../core';
import {
  addItems,
  capItems,
  pouchFrom,
  spendItems,
  addParts,
  applyNavi,
  boardColorCells,
  createNavi,
  lineupAt,
  naviDataWithWeapons,
  weaponLevel,
  applyGrowth,
  applyWeapons,
  battleLineup,
  battleReward,
  createArmory,
  createBattle,
  createGrowth,
  getBattleResult,
  getOpenError,
  nodeCost,
  lineupMembers,
  openableNodes,
  openNode,
  recordVictory,
  vitalsAfter,
} from '../core';
import type { CampaignBattle } from '../data';
import { AREA_BATTLES, AREAS, CHAPTER1_LINEUP, createCampaignSetup, GROWTH_MAP, NAVI_DATA, PART_BREAK_POINTS, PARTY, POUCH_ITEMS, POUCH_ORDER, SKILLS, SLICE_FLOW, START_MEMORY_POINTS, START_NAVI_PARTS, WEAPON_DATA } from '../data';
import { autoUseArmory } from './autoArmory';
import { autoPlay, lcg, smartPlay } from './autoBattle';
import { arrangeNavi, MAX_ATTEMPTS, type StageRecord } from './autoRun';

// 区画の自動対戦（段階27。段階37で 1-2 も）：1-1 の縁日を、章のパーティ（ハルトとあかり）で、出会う順に戦ってボスまで通す。
// 戦闘の間に、星図（でたらめ）と武器（autoArmory.ts。一番近い進化先へ向けて吸わせる）で育て、つながりゲージは戦闘をまたいで引き継ぐ。
// 宝箱は最初の戦闘の後に2つとも開ける（縁日の手前にあるので）。負けたらチェックポイントから同じ戦闘をやり直す。
// HP・MP は戦闘をまたいで持ち越す（段階32b 調整3）。チェックポイントの先の戦闘（CHECKPOINT_FROM 番目から）は、星図・武器で育てるために
// チェックポイントへ寄る（全回復する）ものとする。負けてやり直す時も全回復
// 段階39：区画ごとに、物語のその章のパーティで戦う（2-1 は3人）。ムーブメントが開いている章では、区画のごほうびのギア（宝箱・会話）を
// 区画に入った時にもらったものとし、戦闘の前に autoRun.ts の arrangeNavi ではめ直す

/**
 * チェックポイントより先の戦闘（この番目から）。1-1 は社への道の砂嵐とボス（地図の P は、広場と左右の参道の砂嵐の先）。
 * 1-2 は駄菓子屋の前（P）の先の砂嵐から（段階37）。2-2 は中庭のベンチ（P）の先の、駐輪場の逃げる敵から（段階39b）。2-3 もベンチの裏（P）の先の、川べりの逃げる敵から（段階40）。チェックポイントの先では、育成のために寄る（全回復する）ものとする
 */
const CHECKPOINT_FROM: Record<string, number> = { a11: 3, a12: 2, a21: 2, a22: 2, a23: 2, a31: 2, a3s1: 2, a3s2: 3, a32: 2, a3k: 2 };

/** 手の選び方：random（ほぼでたらめ。段階12の方針）、smart（弱点をねらう。autoBattle.ts の smartPlay）、pouch（smart に、ポーチを使うのを足す。段階51） */
export type AreaPolicy = 'random' | 'smart' | 'pouch';

export interface AreaRunRecord {
  seed: number;
  stages: StageRecord[];
  cleared: boolean;
  /** 連携技を使った回数（戦闘ごと。勝った戦闘だけ） */
  links: number[];
  /** ボスの前までに進化した仲間の数（段階27b） */
  evolvedBeforeBoss: number;
  /** ボスの前の、仲間ごとの進化の回数と武器のレベル（段階42）。path は通った進化先の id（段階54） */
  weaponsBeforeBoss: Record<string, { evolutions: number; level: number; path: string[] }>;
  /** この区画で使ったポーチの数（段階51。pouch の方針だけ） */
  pouchUsed: number;
}

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

/**
 * 区画を、出会う順にボスまで通す。prior に書いた区画を先に同じ方針で通し、その育ち具合（星図・武器・つながりゲージ）から始める（段階37。1-2 は 1-1 の後）。
 * 先の区画で負け切っても、そこまでの育ち具合で続ける
 */
export function autoAreaRun(seed: number, policy: AreaPolicy, lineup?: Lineup, areaId = 'a11', prior: string[] = [], prefer: Record<string, string> = {}): AreaRunRecord {
  const pick = areaPick(seed);
  const carry = newCarry();
  for (const id of prior) runArea(seed, policy, lineup ?? areaLineup(id), id, carry, pick, prefer);
  return runArea(seed, policy, lineup ?? areaLineup(areaId), areaId, carry, pick, prefer);
}

const areaPick = (seed: number) => lcg((seed * 7919 + 3) % 2147483648);

/** 始めの育ち具合（星図・武器・ムーブメントは初め、つながりゲージは0） */
export function newCarry(): Carry {
  return {
    growth: createGrowth(GROWTH_MAP, PARTY.map((c) => c.id), START_MEMORY_POINTS),
    armory: createArmory(WEAPON_DATA),
    navi: createNavi(START_NAVI_PARTS),
    gauge: 0,
  };
}

/**
 * 星図の伸ばし方（段階92）：random は測定と同じでたらめ、even は仲間ごとに順に、開けられる中で一番安い星から開く（確認用の素直な伸ばし方）
 */
export type StarPolicy = 'random' | 'even';

/**
 * 区画を順に通して、育ち具合を返す（段階92。デバッグの「育ち具合で飛ぶ」）。afterArea は区画を1つ通すたびに呼ぶ。
 * 同じシード・同じ区画の並びなら、いつも同じ育ち具合になる
 */
export function runAreasCarry(seed: number, policy: AreaPolicy, areas: string[], stars: StarPolicy, afterArea?: (areaId: string, carry: Carry) => void): Carry {
  const pick = areaPick(seed);
  const carry = newCarry();
  for (const id of areas) {
    runArea(seed, policy, areaLineup(id), id, carry, pick, {}, stars);
    afterArea?.(id, carry);
  }
  return carry;
}

/** 区画をもう一度通して育てる（段階92。やり込みの段の「狩り」の代わり。シードをずらす） */
export function rerunArea(seed: number, policy: AreaPolicy, areaId: string, carry: Carry, stars: StarPolicy): void {
  runArea((seed + 777) >>> 0, policy, areaLineup(areaId), areaId, carry, areaPick(seed + 777), {}, stars);
}

function runArea(
  seed: number,
  policy: AreaPolicy,
  lineup: Lineup,
  areaId: string,
  carry: Carry,
  pick: (n: number) => number,
  prefer: Record<string, string> = {},
  stars: StarPolicy = 'random',
): AreaRunRecord {
  const area = AREAS[areaId];
  const members = lineupMembers(PARTY, lineup);
  const navi = lineup.unlocks.navi;
  if (navi) carry.navi = addParts(carry.navi, [...area.chests.flatMap((c) => c.gears ?? []), ...area.triggers.flatMap((t) => t.gears ?? [])]);
  let vitals: Record<string, Vitals> | undefined;
  const stages: StageRecord[] = [];
  const links: number[] = [];
  let evolvedBeforeBoss = 0;
  let weaponsBeforeBoss: AreaRunRecord['weaponsBeforeBoss'] = {};
  let pouchUsed = 0;
  const battles = areaBattleOrder(areaId);
  const checkpointFrom = CHECKPOINT_FROM[areaId] ?? 0;
  // 章の区切り（段階49）：星図は、まだ来ていない章の区域を開けない
  const chapter = lineup.chapter ?? Infinity;
  for (let i = 0; i < battles.length; i++) {
    const def = battles[i];
    // 宝箱は最初の戦闘の後に開ける
    if (i === 1) carry.armory = capItems(WEAPON_DATA, addItems(carry.armory, area.chests.flatMap((c) => c.items))).armory;
    carry.growth = stars === 'even' ? spendPointsEven(carry.growth, members, chapter) : spendPoints(carry.growth, members, pick, chapter);
    carry.armory = autoUseArmory(carry.armory, members.map((c) => c.id), pick, WEAPON_DATA, prefer);
    if (navi) carry.navi = arrangeNavi(naviDataWithWeapons(NAVI_DATA, WEAPON_DATA, carry.armory), carry.navi);
    if (def.boss) {
      evolvedBeforeBoss = members.filter((c) => carry.armory.weapons[c.id]?.path.length).length;
      weaponsBeforeBoss = Object.fromEntries(
        members.map((c) => [c.id, { evolutions: carry.armory.weapons[c.id].path.length, level: weaponLevel(WEAPON_DATA, carry.armory.weapons[c.id].exp), path: carry.armory.weapons[c.id].path.map((p) => p.id) }]),
      );
    }
    const allies = grownParty(carry.growth, carry.armory, members, navi ? carry.navi : null);
    if (i >= checkpointFrom) vitals = undefined;
    let record: StageRecord = { attempts: MAX_ATTEMPTS, won: false, rounds: null };
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const battleSeed = (seed + i + attempt * 100) >>> 0;
      const pouch = policy === 'pouch' ? pouchFrom(POUCH_ITEMS, POUCH_ORDER, carry.armory.items) : [];
      const start: BattleState = { ...createBattle({ ...createCampaignSetup(def, battleSeed, allies), vitals: attempt === 0 ? vitals : undefined, pouch }), linkGauge: carry.gauge };
      const s = policy === 'random' ? autoPlay(start, battleSeed) : smartPlay(start, battleSeed, { pouch: policy === 'pouch' });
      // 使ったポーチは、勝っても負けても減る
      const used = getBattleResult(s).pouchUsed;
      carry.armory = spendItems(carry.armory, used);
      pouchUsed += Object.values(used).reduce((a, n) => a + n, 0);
      if (s.outcome !== 'victory') continue;
      record = { attempts: attempt + 1, won: true, rounds: s.round };
      links.push(s.log.filter((e) => e.type === 'action' && s.links.some((l) => l.id === e.actionId)).length);
      carry.gauge = s.linkGauge;
      vitals = vitalsAfter(s);
      const result = getBattleResult(s);
      carry.growth = { ...carry.growth, points: carry.growth.points + battleReward(def.reward, result.brokenParts.length, PART_BREAK_POINTS) };
      const naviData = naviDataWithWeapons(NAVI_DATA, WEAPON_DATA, carry.armory);
      const colorCells = navi ? Object.fromEntries(members.map((c) => [c.id, boardColorCells(naviData, carry.navi, c.id)])) : {};
      carry.armory = capItems(WEAPON_DATA, recordVictory(carry.armory, { actions: result.actionCounts, colorCells, items: [...result.drops, ...(def.item ? [def.item] : [])] })).armory;
      break;
    }
    stages.push(record);
    if (!record.won) return { seed, stages, cleared: false, links, evolvedBeforeBoss, weaponsBeforeBoss, pouchUsed };
  }
  return { seed, stages, cleared: true, links, evolvedBeforeBoss, weaponsBeforeBoss, pouchUsed };
}

export function grownParty(growth: GrowthState, armory: ArmoryState, members: CharacterDef[], navi: NaviState | null): CharacterDef[] {
  const grown = applyGrowth(GROWTH_MAP, growth, members, SKILLS);
  const withNavi = navi ? applyNavi(naviDataWithWeapons(NAVI_DATA, WEAPON_DATA, armory), navi, grown) : grown;
  return applyWeapons(WEAPON_DATA, armory, withNavi);
}

/** 星図（段階92。確認用）：仲間ごとに順に、開けられる中で一番安い星（同じなら星図の並びの先）を、払えなくなるまで開く */
function spendPointsEven(growth0: GrowthState, members: CharacterDef[], chapter = Infinity): GrowthState {
  let growth = growth0;
  let turn = 0;
  for (let guard = 0; guard < 400; guard++) {
    let opened = false;
    for (let k = 0; k < members.length && !opened; k++) {
      const c = members[(turn + k) % members.length];
      const options = openableNodes(GROWTH_MAP, growth, c.id).filter((n) => getOpenError(GROWTH_MAP, growth, c, n.id, chapter) === null);
      if (options.length === 0) continue;
      const best = options.reduce((a, n) => (nodeCost(GROWTH_MAP, growth, c, n.id) < nodeCost(GROWTH_MAP, growth, c, a.id) ? n : a));
      growth = openNode(GROWTH_MAP, growth, c, best.id, chapter);
      turn = (turn + k + 1) % members.length;
      opened = true;
    }
    if (!opened) return growth;
  }
  return growth;
}

/** 星図：パーティのでたらめな仲間の、開けられるでたらめなマスに、払えなくなるまで星の砂を使う */
function spendPoints(growth0: GrowthState, members: CharacterDef[], pick: (n: number) => number, chapter = Infinity): GrowthState {
  let growth = growth0;
  for (let guard = 0; guard < 200; guard++) {
    const options = members.flatMap((c) =>
      openableNodes(GROWTH_MAP, growth, c.id)
        .filter((n) => getOpenError(GROWTH_MAP, growth, c, n.id, chapter) === null)
        .map((n) => ({ c, id: n.id })),
    );
    if (options.length === 0) return growth;
    const o = options[pick(options.length)];
    growth = openNode(GROWTH_MAP, growth, o.c, o.id, chapter);
  }
  return growth;
}
