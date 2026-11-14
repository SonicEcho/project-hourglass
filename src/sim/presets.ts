import type { AlbumState, ArmoryState, GrowthState, NaviState } from '../core';
import { addParts, arrangeBoards, createGrowth, createNavi, evolveWeapon, naviDataWithWeapons, flowEvents, gainSnaps, getEvolveError, nextEvolutions, lineupAt, lineupMembers, nodeCost, openNode, recommendStar, refundV13Growth, resetV14Evolutions, weaponLevel } from '../core';
import { AREAS, CHAPTER1_LINEUP, GROWTH_MAP, GROWTH_RECOMMEND, NAVI_DATA, PARTY, RETURN_VISITS, SLICE_FLOW, START_MEMORY_POINTS, START_NAVI_PARTS, WEAPON_DATA } from '../data';
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
  return grownParty(carry.growth, carry.armory, PARTY, carry.navi).reduce((a, c) => a + c.stats.hp / 5 + c.stats.mp / 2 + c.stats.atk + c.stats.mag + c.stats.def, 0);
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
  // 段階194（段階G3b）：表の星図は入れ替える前の物なので、使った星の砂を返し、今の星図でおすすめの道に沿って開け直す
  if (row) carry.growth = respendGrowth(carry.growth, eventId);
  // 段階197（段階G4b）：表の武器の進化は入れ替える前の木の物なので、進化を外す。段階198（G4c）：今の木で進化させ直す
  if (row) carry.armory = reEvolve(resetV14Evolutions(carry.armory as unknown as Record<string, unknown>) as unknown as ArmoryState);
  // 段階202（段階G5d）：ギアは、そこまでに手に入る物を持ち、その章の並びの仲間の盤におまかせで並べる（表のギアは使わない）
  if (row) carry.navi = presetNavi(areas, eventId, carry.armory);
  return { tier, areas, seed: row?.seed ?? 0, carry, snaps: areas.flatMap(areaSnaps) };
}

/**
 * 入れ替える前の星図の開け方を、今の星図に開け直す（段階194）：星の砂を全部返し、その出来事の章の仲間が、
 * 順番に「おすすめの道」の次の星を1つずつ開ける（払えなくなるまで）。G3c で作り方を見直す
 */
function respendGrowth(old: GrowthState, eventId: string): GrowthState {
  const back = refundV13Growth(old.points, old.opened);
  let growth = { ...createGrowth(GROWTH_MAP, PARTY.map((c) => c.id), START_MEMORY_POINTS), points: back.points };
  const lineup = lineupAt(SLICE_FLOW, eventId, CHAPTER1_LINEUP);
  const members = lineupMembers(PARTY, lineup);
  const chapter = lineup.chapter ?? Infinity;
  for (let moved = true; moved; ) {
    moved = false;
    for (const c of members) {
      const next = recommendStar(GROWTH_MAP, growth, c, GROWTH_RECOMMEND, chapter)?.path[0];
      if (!next || growth.points < nodeCost(GROWTH_MAP, growth, c, next)) continue;
      growth = openNode(GROWTH_MAP, growth, c, next, chapter);
      moved = true;
    }
  }
  return growth;
}

/**
 * 武器を今の木で進化させ直す（段階198）：進化できる先のうち、本道（寄り道でない）を木の並びの順に選ぶ。型は1つ目。
 * 鍵の素材はそろっているものとする（表は古い木の鍵を使った後の持ち物なので）。遅く加わる仲間の、加わった時の選択も同じ順
 */
function reEvolve(armory: ArmoryState): ArmoryState {
  let a = armory;
  for (const charId of Object.keys(a.weapons)) {
    const before = a.items;
    a = { ...deepest(a, charId), items: { ...before } };
  }
  return a;
}

/**
 * 一番先まで進める道（段階202。G4c は木の並びの順に1つずつ選んでいたので、能力値が足りない枝に入ると止まった）。
 * 進化できる本道の先を全部試し、一番多く進化できる道を選ぶ（同じなら木の並びの順）。鍵はそろっているものとする
 */
function deepest(a: ArmoryState, charId: string): ArmoryState {
  const w = a.weapons[charId];
  let best = a;
  for (const e of nextEvolutions(WEAPON_DATA, w).filter((x) => !x.sealed && !x.detour)) {
    const items = { ...a.items };
    for (const c of e.conditions) if (c.kind === 'key') items[c.item] = Math.max(1, items[c.item] ?? 0);
    const withKeys = { ...a, items };
    if (getEvolveError(WEAPON_DATA, withKeys, charId, e.id, 0) !== null) continue;
    const next = deepest(evolveWeapon(WEAPON_DATA, withKeys, charId, e.id, 0), charId);
    if (next.weapons[charId].path.length > best.weapons[charId].path.length) best = next;
  }
  return best;
}

/** 場面を選ぶので、育ち具合では並べない両刃のギア（段階202） */
const PRESET_UNPLACED = new Set(['reckless', 'pinpointFocus']);

/**
 * 育ち具合のギア（段階202）：周回の始めの持ち物と、通し終えた区画の宝箱・会話・返した翌日の出来事で手に入るギア（依頼と狩りの分は数えない）。
 * その出来事の章の並びの仲間の盤に、おまかせで並べる（武器の進化で広がった盤で）。両刃のギアは持つだけ
 */
function presetNavi(areas: string[], eventId: string, armory: ArmoryState): NaviState {
  const gears: string[] = [...START_NAVI_PARTS];
  for (const id of areas) {
    const area = AREAS[id];
    if (!area) continue;
    for (const c of area.chests) gears.push(...(c.gears ?? []));
    for (const t of area.triggers) gears.push(...(t.gears ?? []));
    for (const v of RETURN_VISITS) if (v.area === id) gears.push(...(v.gears ?? []));
  }
  const placed = gears.filter((g) => NAVI_DATA.parts[g] && !PRESET_UNPLACED.has(g));
  const lineup = lineupAt(SLICE_FLOW, eventId, CHAPTER1_LINEUP);
  const members = lineupMembers(PARTY, lineup).map((c) => c.id);
  const data = naviDataWithWeapons(NAVI_DATA, WEAPON_DATA, armory);
  const arranged = lineup.unlocks.navi ? arrangeBoards(data, createNavi(placed), members) : createNavi(placed);
  return addParts(arranged, gears.filter((g) => PRESET_UNPLACED.has(g)));
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

