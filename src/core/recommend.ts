import { addToAlbum, countOf, getAddError, type AlbumState } from './album';
import { chapterLocked, findNode, isOpened, knownSkillIds, neighbors, nodeCost, type GrowthMap, type GrowthNodeDef, type GrowthState } from './growth';
import { findBugs, getPlaceError, isPartActive, placePart, removePart, type NaviData, type NaviState, type Placement, type Rotation } from './navi';
import type { CharacterDef } from './types';
import { evolutionVisibility, getAbsorbError, nextEvolutions, type ArmoryState, type EvolutionDef, type WeaponData, type WeaponParamKey } from './weapon';

// 育成の「おすすめ」（段階100。レビューの E1）。Phaser に依存しない。受け取った状態を書き換えず、新しい状態を返す。
// 取り消せる操作（アルバム・ムーブメントの並べ方）は「おまかせ」で組み、取り消せない操作（星を開ける・素材を吸わせる）は勧めるだけ。
// 自動対戦（src/sim）も同じ選び方を使う

// ---- ① アルバムのおまかせ ----

/**
 * 持っているスナップから、order の順に枚数分を入れてアルバムを組む。足りなければ order の順に上限まで、
 * それでも足りなければ持っている順に足す。size 枚にならない時（持っている数が足りない時）は元のまま
 */
export function recommendAlbum(state: AlbumState, order: [string, number][], size?: number, copyMax?: number): AlbumState {
  let next: AlbumState = { owned: { ...state.owned }, album: {} };
  const add = (id: string, limit: number): void => {
    for (let k = 0; k < limit && getAddError(next, id, size, copyMax) === null; k++) next = addToAlbum(next, id, size, copyMax);
  };
  for (const [id, n] of order) add(id, n - (next.album[id] ?? 0));
  for (const [id] of order) add(id, Infinity);
  for (const id of Object.keys(state.owned)) add(id, Infinity);
  return countOf(next.album) === (size ?? countOf(state.album)) ? next : state;
}

// ---- ② 星図のおすすめの道 ----

/** 星の価値の決め方（数値は src/data の GROWTH_RECOMMEND） */
export interface StarValues {
  stat: number;
  statBig: number;
  skill: number;
  /** その仲間の星座（出発点のある星座）の星の価値に掛ける */
  home: number;
}

export interface StarAdvice {
  /** 目指す星 */
  target: GrowthNodeDef;
  /** 次に開ける星から目指す星までの道（まだ開けていない星だけ。先頭が次に開ける星） */
  path: string[];
  /** 目指す星まで開けるのに要る星の砂 */
  cost: number;
}

/** 星の価値（もう覚えた魔法・スキルと出発点は 0） */
function starValue(map: GrowthMap, growth: GrowthState, base: CharacterDef, node: GrowthNodeDef, values: StarValues, home: string | undefined): number {
  const v =
    node.kind === 'stat'
      ? values.stat
      : node.kind === 'statBig'
        ? values.statBig
        : node.kind === 'skill' && !knownSkillIds(map, growth, base).includes(node.skillId)
          ? values.skill
          : 0;
  return v * (home && node.con === home ? values.home : 1);
}

/**
 * その仲間のおすすめの道：まだ開けていない星を「価値 ÷ そこまで開けるのに要る星の砂」で比べ、一番よい星までの道。
 * 道の星の値段は今の値段で数える。章が来ていない星は通らない。開けられる星がなければ null
 */
export function recommendStar(map: GrowthMap, growth: GrowthState, base: CharacterDef, values: StarValues, chapter = Infinity): StarAdvice | null {
  const home = map.nodes.find((n) => n.kind === 'start' && n.owner === base.id)?.con;
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const queue: string[] = [];
  for (const id of growth.opened[base.id] ?? []) {
    dist.set(id, 0);
    prev.set(id, null);
    queue.push(id);
  }
  // 星は50ほどなので、一番近いものを毎回探す形で足りる
  const done = new Set<string>();
  while (queue.length > 0) {
    queue.sort((a, b) => dist.get(a)! - dist.get(b)!);
    const id = queue.shift()!;
    if (done.has(id)) continue;
    done.add(id);
    for (const nb of neighbors(map, id)) {
      if (isOpened(growth, base.id, nb.id) || chapterLocked(nb, chapter)) continue;
      const d = dist.get(id)! + nodeCost(map, growth, base, nb.id);
      if (d < (dist.get(nb.id) ?? Infinity)) {
        dist.set(nb.id, d);
        prev.set(nb.id, isOpened(growth, base.id, id) ? null : id);
        queue.push(nb.id);
      }
    }
  }
  let best: { node: GrowthNodeDef; score: number; cost: number } | null = null;
  for (const node of map.nodes) {
    const cost = dist.get(node.id);
    if (cost === undefined || cost === 0 || isOpened(growth, base.id, node.id)) continue;
    const score = starValue(map, growth, base, node, values, home) / cost;
    if (score <= 0) continue;
    if (!best || score > best.score || (score === best.score && cost < best.cost)) best = { node, score, cost };
  }
  if (!best) return null;
  const path: string[] = [];
  for (let id: string | null | undefined = best.node.id; id; id = prev.get(id)) path.unshift(id);
  return { target: best.node, path, cost: best.cost };
}

/** おすすめの道の、次に開ける星（なければ null） */
export function nextRecommendedStar(map: GrowthMap, advice: StarAdvice | null): GrowthNodeDef | null {
  return advice ? (findNode(map, advice.path[0]) ?? null) : null;
}

// ---- ③ ムーブメントのおまかせ ----

/**
 * charIds の盤のギアと、まだはめていないギアを、大きい順に仲間へ順番に並べ直す。
 * 狂いが出ない所だけに置き、効果ギアはブリッジに乗る所を先に探す。ほかの仲間の盤はそのまま
 */
export function arrangeBoards(data: NaviData, navi0: NaviState, charIds: string[]): NaviState {
  let navi = navi0.parts.filter((p) => p.placement && charIds.includes(p.placement.charId)).reduce((n, p) => removePart(n, p.uid), navi0);
  const order = navi.parts.filter((p) => !p.placement).sort((a, b) => data.parts[b.partId].cells.length - data.parts[a.partId].cells.length || a.uid - b.uid);
  let turn = 0;
  for (const part of order) {
    const isEffect = data.parts[part.partId].kind === 'effect';
    for (let k = 0; k < charIds.length; k++) {
      const charId = charIds[(turn + k) % charIds.length];
      const spot = bestSpot(data, navi, part.uid, charId, isEffect);
      if (!spot) continue;
      navi = placePart(data, navi, part.uid, spot);
      turn = (turn + k + 1) % charIds.length;
      break;
    }
  }
  return navi;
}

function bestSpot(data: NaviData, navi: NaviState, uid: number, charId: string, isEffect: boolean): Placement | null {
  const board = data.boards[charId];
  if (!board) return null;
  let fallback: Placement | null = null;
  for (const rotation of [0, 1, 2, 3] as Rotation[]) {
    for (let row = 0; row < board.rows; row++) {
      for (let col = 0; col < board.cols; col++) {
        const p: Placement = { charId, col, row, rotation };
        if (getPlaceError(data, navi, uid, p)) continue;
        const next = placePart(data, navi, uid, p);
        if (findBugs(data, next, charId).length > 0) continue;
        if (!isEffect) return p;
        if (isPartActive(data, next.parts.find((x) => x.uid === uid)!)) return p;
        fallback ??= p;
      }
    }
  }
  return fallback;
}

// ---- ④ 武器に吸わせる素材のおすすめ ----

/** 進化の鍵になる素材（勧めない・時分解しない） */
export function evolutionKeys(D: WeaponData): Set<string> {
  return new Set(Object.values(D.weapons).flatMap((w) => w.evolutions.flatMap((e) => e.conditions.flatMap((c) => (c.kind === 'key' ? [c.item] : [])))));
}

/**
 * これから使う進化の鍵（段階100）：鍵の素材 → 残しておく数。持っている武器ごとに、まだ通っていない、これから行ける進化先の鍵を数える
 * （進化1回で鍵を1つ使う。どの枝へ進むか分からないので、行ける先の全部を数える）。画面のおすすめは、これより多く持っている分だけ勧める
 */
export function upcomingKeys(D: WeaponData, armory: ArmoryState): Map<string, number> {
  const out = new Map<string, number>();
  for (const w of Object.values(armory.weapons)) {
    for (const e of D.weapons[w.defId]?.evolutions ?? []) {
      if (['passed', 'unreachable'].includes(evolutionVisibility(D, w, e.id))) continue;
      for (const c of e.conditions) if (c.kind === 'key') out.set(c.item, (out.get(c.item) ?? 0) + 1);
    }
  }
  return out;
}

/** 目指してよい進化先（寄り道とまだ作っていない先は除く。prefer があれば、1回目はその進化先だけ。段階54の道ごとの測定） */
function evolutionCandidates(D: WeaponData, armory: ArmoryState, owner: string, prefer?: string): EvolutionDef[] {
  const w = armory.weapons[owner];
  if (!w) return [];
  return nextEvolutions(D, w).filter((e) => !e.sealed && !e.detour && (!prefer || w.path.length > 0 || e.id === prefer));
}

/** 一番近い進化先（条件の能力値の足りない分が一番少ない先）と、その条件の能力値 */
export function nearestEvolution(D: WeaponData, armory: ArmoryState, owner: string, prefer?: string): { evolution: EvolutionDef; params: WeaponParamKey[] } | null {
  const w = armory.weapons[owner];
  if (!w) return null;
  let best: { lack: number; evolution: EvolutionDef; params: WeaponParamKey[] } | null = null;
  for (const evo of evolutionCandidates(D, armory, owner, prefer)) {
    const conds = evo.conditions.flatMap((c) => (c.kind === 'param' ? [c] : []));
    if (conds.length === 0) continue;
    const lack = conds.reduce((sum, c) => sum + Math.max(0, c.min - w.params[c.param]), 0);
    if (!best || lack < best.lack) best = { lack, evolution: evo, params: conds.map((c) => c.param) };
  }
  return best ? { evolution: best.evolution, params: best.params } : null;
}

/**
 * その仲間に吸わせる素材の順番（よい方から）：一番近い進化先の条件の能力値を上げる素材ほど先、次に上がる合計の大きい素材。
 * 条件の能力値を下げる素材、上がらない素材、今は吸わせられない素材は入れない。進化の鍵の素材は、残しておく数（reserve）より多く持っている時だけ。
 * reserve を書かなければ、どの武器のどの進化の鍵も勧めない（自動対戦。鍵は吸わせない）
 */
export function recommendMaterials(D: WeaponData, armory: ArmoryState, owner: string, prefer?: string, reserve?: Map<string, number>): string[] {
  const target = nearestEvolution(D, armory, owner, prefer)?.params ?? [];
  const keys = evolutionKeys(D);
  const spare = (id: string): boolean => (reserve ? (armory.items[id] ?? 0) > (reserve.get(id) ?? 0) : !keys.has(id));
  const score = (id: string): number => {
    const g = D.items[id].gains;
    const total = Object.values(g).reduce((a, n) => a + (n ?? 0), 0);
    const toward = target.reduce((a, k) => a + (g[k] ?? 0), 0);
    const hurts = target.some((k) => (g[k] ?? 0) < 0);
    return hurts ? -1 : toward * 10 + total;
  };
  return Object.keys(armory.items)
    .filter((id) => D.items[id]?.kind === 'material' && (armory.items[id] ?? 0) > 0 && spare(id) && score(id) > 0 && getAbsorbError(D, armory, owner, id) === null)
    .sort((a, b) => score(b) - score(a));
}
