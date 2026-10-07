import type { CharacterDef, SkillDef, Stats } from './types';

// 星図（段階7）。Phaser に依存しない。
// 公開している関数は、受け取った状態を書き換えず、新しい状態を返す。

export type StatKey = keyof Stats;

export type GrowthNodeDef =
  | { id: string; col: number; row: number; kind: 'start'; owner: string }
  | { id: string; col: number; row: number; kind: 'stat' | 'statBig'; stat: StatKey; amount: number }
  | { id: string; col: number; row: number; kind: 'skill'; skillId: string };

export interface GrowthMap {
  cols: number;
  rows: number;
  nodes: GrowthNodeDef[];
  costs: { stat: number; statBig: number; skill: number; passThrough: number };
}

export interface GrowthState {
  /** 星の砂（パーティ共通の財布） */
  points: number;
  /** キャラごとに開けたマス（開けた順） */
  opened: Record<string, string[]>;
}

/** 周回の始めの成長の状態。各キャラは自分の出発点だけ開いている */
export function createGrowth(map: GrowthMap, characterIds: string[], startPoints: number): GrowthState {
  const opened: Record<string, string[]> = {};
  for (const id of characterIds) {
    const start = map.nodes.find((n) => n.kind === 'start' && n.owner === id);
    if (!start) throw new Error(`no start node for ${id}`);
    opened[id] = [start.id];
  }
  return { points: startPoints, opened };
}

export function findNode(map: GrowthMap, nodeId: string): GrowthNodeDef | undefined {
  return map.nodes.find((n) => n.id === nodeId);
}

/** 上下左右に隣り合うマス */
export function neighbors(map: GrowthMap, nodeId: string): GrowthNodeDef[] {
  const n = findNode(map, nodeId);
  if (!n) return [];
  return map.nodes.filter((m) => Math.abs(m.col - n.col) + Math.abs(m.row - n.row) === 1);
}

export function isOpened(growth: GrowthState, charId: string, nodeId: string): boolean {
  return growth.opened[charId]?.includes(nodeId) ?? false;
}

/** そのキャラの駒の位置（最後に開けたマス） */
export function piecePosition(growth: GrowthState, charId: string): string {
  const list = growth.opened[charId];
  return list[list.length - 1];
}

/** そのキャラが今覚えている魔法・スキルの id（元から覚えている分と、マップで覚えた分） */
export function knownSkillIds(map: GrowthMap, growth: GrowthState, base: CharacterDef): string[] {
  const ids = base.skills.map((k) => k.id);
  for (const nodeId of growth.opened[base.id] ?? []) {
    const n = findNode(map, nodeId);
    if (n?.kind === 'skill' && !ids.includes(n.skillId)) ids.push(n.skillId);
  }
  return ids;
}

/**
 * マスを開けるのに必要な星の砂。
 * もう覚えている魔法・スキルのマスと、他のキャラの出発点は「通るだけ」の値段
 */
export function nodeCost(map: GrowthMap, growth: GrowthState, base: CharacterDef, nodeId: string): number {
  const n = findNode(map, nodeId);
  if (!n) return Infinity;
  switch (n.kind) {
    case 'start':
      return n.owner === base.id ? 0 : map.costs.passThrough;
    case 'stat':
      return map.costs.stat;
    case 'statBig':
      return map.costs.statBig;
    case 'skill':
      return knownSkillIds(map, growth, base).includes(n.skillId) ? map.costs.passThrough : map.costs.skill;
  }
}

/** そのキャラが次に開けられるマス（開けたマスの隣の、まだ開けていないマス） */
export function openableNodes(map: GrowthMap, growth: GrowthState, charId: string): GrowthNodeDef[] {
  const out = new Map<string, GrowthNodeDef>();
  for (const id of growth.opened[charId] ?? []) {
    for (const nb of neighbors(map, id)) {
      if (!isOpened(growth, charId, nb.id)) out.set(nb.id, nb);
    }
  }
  return [...out.values()];
}

/** マスを開けられない理由。開けられるなら null */
export function getOpenError(map: GrowthMap, growth: GrowthState, base: CharacterDef, nodeId: string): string | null {
  if (!findNode(map, nodeId)) return 'unknown node';
  if (isOpened(growth, base.id, nodeId)) return 'already opened';
  if (!openableNodes(map, growth, base.id).some((n) => n.id === nodeId)) return 'not next to an opened node';
  if (growth.points < nodeCost(map, growth, base, nodeId)) return 'not enough memory points';
  return null;
}

/** マスを開ける（星の砂を払い、駒がそこへ進む） */
export function openNode(map: GrowthMap, growth: GrowthState, base: CharacterDef, nodeId: string): GrowthState {
  const err = getOpenError(map, growth, base, nodeId);
  if (err) throw new Error(err);
  const cost = nodeCost(map, growth, base, nodeId);
  return {
    points: growth.points - cost,
    opened: { ...growth.opened, [base.id]: [...growth.opened[base.id], nodeId] },
  };
}

/**
 * 成長を反映したキャラ（戦闘に使う）。能力値を足し、マップで覚えた魔法・スキルを後ろに加える。
 * skills は id → 魔法・スキルの定義
 */
export function applyGrowth(map: GrowthMap, growth: GrowthState, bases: CharacterDef[], skills: Record<string, SkillDef>): CharacterDef[] {
  return bases.map((base) => {
    const stats = { ...base.stats };
    const learned: SkillDef[] = [];
    const known = new Set(base.skills.map((k) => k.id));
    for (const nodeId of growth.opened[base.id] ?? []) {
      const n = findNode(map, nodeId);
      if (!n) continue;
      if (n.kind === 'stat' || n.kind === 'statBig') stats[n.stat] += n.amount;
      if (n.kind === 'skill' && !known.has(n.skillId)) {
        const def = skills[n.skillId];
        if (def) {
          learned.push(def);
          known.add(n.skillId);
        }
      }
    }
    return { ...base, stats, skills: [...base.skills, ...learned] };
  });
}

/** 戦闘に勝った時の星の砂（基本 ＋ 壊した部位の数 × partPoints） */
export function battleReward(base: number, brokenParts: number, partPoints: number): number {
  return base + brokenParts * partPoints;
}
