import type { CharacterDef, SkillDef, Stats } from './types';

// 星図（段階7）。Phaser に依存しない。
// 公開している関数は、受け取った状態を書き換えず、新しい状態を返す。

export type StatKey = keyof Stats;

/**
 * マス（星）の共通の形（段階56：星図の上の位置 x・y と、星の名前・星座）。
 * chapter は、何章の区域か（段階49。書かなければいつでも。docs/design/economy.md の 2.）
 */
type NodeBase = { id: string; x: number; y: number; name?: string; con?: string; chapter?: number };

/** マスの効果（出発点・能力値・魔法・スキル） */
export type GrowthNodeEffect = { kind: 'start'; owner: string } | { kind: 'stat' | 'statBig'; stat: StatKey; amount: number } | { kind: 'skill'; skillId: string };

export type GrowthNodeDef = NodeBase & GrowthNodeEffect;

export interface GrowthMap {
  /** 星図の大きさ（画面より大きく、指でずらして見る。段階56） */
  width: number;
  height: number;
  nodes: GrowthNodeDef[];
  /** 道（星と星。どちらからも進める。段階56） */
  edges: [string, string][];
  costs: { stat: number; statBig: number; skill: number; passThrough: number };
  /** 前の id → 今の id（段階56。格子の星図のマスの id を、同じ効果の星へ付け替える。セーブを読む時に使う） */
  renamed?: Record<string, string>;
  /** 星座の名前と、名前を出す位置 */
  constellations?: Record<string, { name: string; x: number; y: number }>;
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

/** 道でつながったマス（段階56。前は格子の上下左右） */
export function neighbors(map: GrowthMap, nodeId: string): GrowthNodeDef[] {
  const ids = map.edges.flatMap(([a, b]) => (a === nodeId ? [b] : b === nodeId ? [a] : []));
  return ids.map((id) => findNode(map, id)).filter((n): n is GrowthNodeDef => n !== undefined);
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

/** まだ章が来ていなくて開けられないマスか（chapter は今の章。試作の5戦など、章のない時は Infinity） */
export function chapterLocked(node: GrowthNodeDef, chapter: number): boolean {
  return (node.chapter ?? 0) > chapter;
}

/** マスを開けられない理由。開けられるなら null。chapter は今の章（段階49。そのマスの章が来ていなければ開けられない） */
export function getOpenError(map: GrowthMap, growth: GrowthState, base: CharacterDef, nodeId: string, chapter = Infinity): string | null {
  const node = findNode(map, nodeId);
  if (!node) return 'unknown node';
  if (isOpened(growth, base.id, nodeId)) return 'already opened';
  if (!openableNodes(map, growth, base.id).some((n) => n.id === nodeId)) return 'not next to an opened node';
  if (chapterLocked(node, chapter)) return 'chapter locked';
  if (growth.points < nodeCost(map, growth, base, nodeId)) return 'not enough memory points';
  return null;
}

/** マスを開ける（星の砂を払い、駒がそこへ進む） */
export function openNode(map: GrowthMap, growth: GrowthState, base: CharacterDef, nodeId: string, chapter = Infinity): GrowthState {
  const err = getOpenError(map, growth, base, nodeId, chapter);
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

/** 前の id を今の id に付け替える（段階56。知らない id はそのまま） */
export function renameNode(map: GrowthMap, nodeId: string): string {
  return map.renamed?.[nodeId] ?? nodeId;
}

/**
 * 星図のデータの書き間違いを、全部まとめて返す（テストで使う。段階56）：
 * 知らない星への道、同じ道が2本、自分への道、近すぎる星（タップしにくい）、
 * どの章でも、その章までの星だけで出発点から全部の星へ行けるか、
 * 行き止まりの星は大きな能力値か魔法・スキル（将来の星座へつなぐ場所 frontier は除く）
 */
export function checkGrowthMap(map: GrowthMap, opts: { minGap: number; frontier: string[] }): string[] {
  const errors: string[] = [];
  const ids = new Set(map.nodes.map((n) => n.id));
  if (ids.size !== map.nodes.length) errors.push('同じ id の星がある');
  const seen = new Set<string>();
  for (const [a, b] of map.edges) {
    if (!ids.has(a) || !ids.has(b)) errors.push(`知らない星への道：${a}-${b}`);
    if (a === b) errors.push(`自分への道：${a}`);
    const key = [a, b].sort().join('-');
    if (seen.has(key)) errors.push(`同じ道が2本：${key}`);
    seen.add(key);
  }
  for (let i = 0; i < map.nodes.length; i++) {
    for (let j = i + 1; j < map.nodes.length; j++) {
      const [p, q] = [map.nodes[i], map.nodes[j]];
      if (Math.hypot(p.x - q.x, p.y - q.y) < opts.minGap) errors.push(`近すぎる星：${p.id}-${q.id}`);
    }
  }
  for (const n of map.nodes) if (n.x < 0 || n.y < 0 || n.x > map.width || n.y > map.height) errors.push(`星図の外の星：${n.id}`);
  // 章ごとに、その章までの星だけで、出発点から全部の星へ行けるか
  const chapters = [...new Set(map.nodes.map((n) => n.chapter ?? 0))].sort((a, b) => a - b);
  for (const c of chapters) {
    const inside = map.nodes.filter((n) => (n.chapter ?? 0) <= c);
    const reach = new Set(inside.filter((n) => n.kind === 'start').map((n) => n.id));
    const queue = [...reach];
    for (let i = 0; i < queue.length; i++) {
      for (const nb of neighbors(map, queue[i])) {
        if ((nb.chapter ?? 0) > c || reach.has(nb.id)) continue;
        reach.add(nb.id);
        queue.push(nb.id);
      }
    }
    for (const n of inside) if (!reach.has(n.id)) errors.push(`${c}章で、出発点から行けない星：${n.id}`);
  }
  for (const n of map.nodes) {
    if (neighbors(map, n.id).length !== 1 || opts.frontier.includes(n.id)) continue;
    if (n.kind !== 'skill' && n.kind !== 'statBig' && n.kind !== 'start') errors.push(`行き止まりの星が小さな能力値：${n.id}`);
  }
  return errors;
}
