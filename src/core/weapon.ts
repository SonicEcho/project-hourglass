import type { NaviData, PartColor } from './navi';
import { extendBoard } from './navi';
import type { CharacterDef, Element, PassiveEffect, Stats } from './types';

// 武器ビルドアップ（段階9）。Phaser に依存しない。
// 公開している関数は、受け取った状態を書き換えず、新しい状態を返す。

/** 武器のパラメータ。atk はキャラの攻撃に足す。属性値は、その属性のダメージの割増しになる */
export interface WeaponParams {
  atk: number;
  fire: number;
  ice: number;
  thunder: number;
}

export type WeaponParamKey = keyof WeaponParams;

/** 記憶の欠片（段階10から、記憶に宿る感情ごとの種類） */
export interface FragmentDef {
  id: string;
  name: string;
  gains: Partial<WeaponParams>;
}

/** 素材の種類（段階27b）。落とし物の確率と、画面の色分けに使う */
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'part' | 'boss';

/**
 * 素材（敵が落とす）と通常アイテム（勝利の報酬）。
 * 段階27b：素材は武器に直接吸わせる（gains の分だけ能力値が上下する。吸わせ枠を1つ使う）。
 * 要らない素材・アイテムは時分解で記憶の欠片にする（decomposeCost 個で、一番大きく上がる能力値の欠片1つ）
 */
export interface ItemDef {
  id: string;
  name: string;
  kind: 'material' | 'item';
  /** 吸わせた時の能力値の上がり下がり（素材だけ吸わせられる）。アイテムは時分解した時の欠片の種類を決めるだけ */
  gains: Partial<WeaponParams>;
  /** 素材の種類（アイテムにはない） */
  rarity?: ItemRarity;
}

/** 進化の条件（全部満たすと進化できる） */
export type EvolutionCondition =
  /** パラメータが min 以上 */
  | { kind: 'param'; param: WeaponParamKey; min: number }
  /** ギアの傾向（貯まった色のうち一番多い色）が color */
  | { kind: 'tendency'; color: PartColor }
  /** 鍵の素材を持っている（進化すると1つ使う。段階27b） */
  | { kind: 'key'; item: string };

export interface EvolutionDef {
  id: string;
  name: string;
  conditions: EvolutionCondition[];
  /** 進化した時に足す能力値 */
  stats?: Partial<Stats>;
  /** 通常攻撃の属性 */
  attackElement?: Element;
  /** 進化した時に付く特性 */
  passives?: PassiveEffect[];
}

export interface WeaponDef {
  id: string;
  name: string;
  /** 持ち主のキャラ */
  owner: string;
  evolutions: EvolutionDef[];
}

export interface WeaponData {
  weapons: Record<string, WeaponDef>;
  fragments: Record<string, FragmentDef>;
  /** 素材と通常アイテム */
  items: Record<string, ItemDef>;
  /** Lv2、Lv3…になる経験値（累計） */
  levelExp: number[];
  /** 進化できるレベル */
  evolveLevel: number;
  /** 属性値1あたりのダメージの割増し */
  elementRate: number;
  /** 進化した時に盤に増えるマスの数 */
  boardExtension: number;
  /** レベルごとの吸わせ枠（累計。Lv1, Lv2, …。段階27b） */
  slotsPerLevel: number[];
  /** 時分解：この数の素材・アイテムで、記憶の欠片1つ */
  decomposeCost: number;
  /** 能力値 → その能力値を上げる記憶の欠片の id（時分解で使う） */
  fragmentFor: Record<WeaponParamKey, string>;
}

export interface WeaponState {
  defId: string;
  params: WeaponParams;
  exp: number;
  /** ギアの傾向：勝った戦闘で盤にはまっていたギアの、色ごとのマス数の合計 */
  tendency: Record<PartColor, number>;
  /** 進化先の id（まだなら null） */
  evolvedTo: string | null;
  /** 吸わせた素材の数（吸わせ枠を使った数。段階27b） */
  absorbed: number;
}

export interface ArmoryState {
  /** キャラの id → そのキャラの武器 */
  weapons: Record<string, WeaponState>;
  /** 持っている素材・通常アイテムの数（パーティ共通） */
  items: Record<string, number>;
  /** 持っている記憶の欠片の数（パーティ共通） */
  fragments: Record<string, number>;
}

const ELEMENTS: Element[] = ['fire', 'ice', 'thunder'];
const PARAM_KEYS: WeaponParamKey[] = ['atk', 'fire', 'ice', 'thunder'];

export function createArmory(data: WeaponData): ArmoryState {
  const weapons: Record<string, WeaponState> = {};
  for (const w of Object.values(data.weapons)) {
    weapons[w.owner] = {
      defId: w.id,
      params: { atk: 0, fire: 0, ice: 0, thunder: 0 },
      exp: 0,
      tendency: { red: 0, blue: 0, green: 0, yellow: 0 },
      evolvedTo: null,
      absorbed: 0,
    };
  }
  return { weapons, items: {}, fragments: {} };
}

export function addFragments(armory: ArmoryState, ids: string[]): ArmoryState {
  const fragments = { ...armory.fragments };
  for (const id of ids) fragments[id] = (fragments[id] ?? 0) + 1;
  return { ...armory, fragments };
}

export function addItems(armory: ArmoryState, ids: string[]): ArmoryState {
  const items = { ...armory.items };
  for (const id of ids) items[id] = (items[id] ?? 0) + 1;
  return { ...armory, items };
}

/** 武器の吸わせ枠（今のレベルまでの合計） */
export function weaponSlots(data: WeaponData, w: WeaponState): number {
  const lv = weaponLevel(data, w.exp);
  return data.slotsPerLevel[Math.min(lv, data.slotsPerLevel.length) - 1] ?? 0;
}

/** 素材を吸わせた後の能力値（下がっても0より小さくならない）。プレビューにも使う */
export function paramsAfter(params: WeaponParams, gains: Partial<WeaponParams>): WeaponParams {
  const next = { ...params };
  for (const k of PARAM_KEYS) next[k] = Math.max(0, next[k] + (gains[k] ?? 0));
  return next;
}

/** 素材を吸わせられない理由。吸わせられるなら null */
export function getAbsorbError(data: WeaponData, armory: ArmoryState, charId: string, itemId: string): string | null {
  const w = armory.weapons[charId];
  if (!w) return 'no weapon';
  const it = data.items[itemId];
  if (!it) return 'unknown item';
  if (it.kind !== 'material') return 'only materials can be absorbed';
  if ((armory.items[itemId] ?? 0) <= 0) return 'no item left';
  if (w.absorbed >= weaponSlots(data, w)) return 'no slot left';
  return null;
}

/** 素材を武器に吸わせる（素材は1つ減り、能力値が上下し、吸わせ枠を1つ使う） */
export function absorbMaterial(data: WeaponData, armory: ArmoryState, charId: string, itemId: string): ArmoryState {
  const err = getAbsorbError(data, armory, charId, itemId);
  if (err) throw new Error(err);
  const w = armory.weapons[charId];
  return {
    ...armory,
    weapons: { ...armory.weapons, [charId]: { ...w, params: paramsAfter(w.params, data.items[itemId].gains), absorbed: w.absorbed + 1 } },
    items: { ...armory.items, [itemId]: armory.items[itemId] - 1 },
  };
}

/** 時分解でできる記憶の欠片（一番大きく上がる能力値。同じなら 攻撃 → 火 → 氷 → 雷 の順） */
export function decomposeFragment(data: WeaponData, itemId: string): string {
  const gains = data.items[itemId]?.gains ?? {};
  let best: WeaponParamKey = 'atk';
  for (const k of PARAM_KEYS) if ((gains[k] ?? 0) > (gains[best] ?? 0)) best = k;
  return data.fragmentFor[best];
}

/** 時分解できない理由。できるなら null */
export function getFragmentError(data: WeaponData, armory: ArmoryState, itemId: string): string | null {
  if (!data.items[itemId]) return 'unknown item';
  if ((armory.items[itemId] ?? 0) < data.decomposeCost) return 'not enough items';
  return null;
}

/** 素材・アイテムを時分解する（decomposeCost 個がなくなり、記憶の欠片が1つ増える。要らない素材の整理） */
export function fragmentItem(data: WeaponData, armory: ArmoryState, itemId: string): ArmoryState {
  const err = getFragmentError(data, armory, itemId);
  if (err) throw new Error(err);
  const f = decomposeFragment(data, itemId);
  return {
    ...armory,
    items: { ...armory.items, [itemId]: armory.items[itemId] - data.decomposeCost },
    fragments: { ...armory.fragments, [f]: (armory.fragments[f] ?? 0) + 1 },
  };
}

/** 記憶の欠片を吸わせられない理由。吸わせられるなら null */
export function getFeedError(data: WeaponData, armory: ArmoryState, charId: string, fragmentId: string): string | null {
  if (!armory.weapons[charId]) return 'no weapon';
  if (!data.fragments[fragmentId]) return 'unknown fragment';
  if ((armory.fragments[fragmentId] ?? 0) <= 0) return 'no fragment left';
  return null;
}

/** 記憶の欠片を武器に吸わせる（記憶の欠片はなくなり、パラメータが上がる。吸わせ枠は使わない） */
export function feedFragment(data: WeaponData, armory: ArmoryState, charId: string, fragmentId: string): ArmoryState {
  const err = getFeedError(data, armory, charId, fragmentId);
  if (err) throw new Error(err);
  const w = armory.weapons[charId];
  const params = { ...w.params };
  for (const k of PARAM_KEYS) params[k] += data.fragments[fragmentId].gains[k] ?? 0;
  return {
    ...armory,
    weapons: { ...armory.weapons, [charId]: { ...w, params } },
    fragments: { ...armory.fragments, [fragmentId]: armory.fragments[fragmentId] - 1 },
  };
}

/** 経験値からレベル（1から） */
export function weaponLevel(data: WeaponData, exp: number): number {
  return 1 + data.levelExp.filter((need) => exp >= need).length;
}

/** ギアの傾向：一番多い色（同じ数で並んだら、または何もなければ null） */
export function tendencyOf(w: WeaponState): PartColor | null {
  const entries = Object.entries(w.tendency) as [PartColor, number][];
  const max = Math.max(...entries.map(([, n]) => n));
  if (max <= 0) return null;
  const top = entries.filter(([, n]) => n === max);
  return top.length === 1 ? top[0][0] : null;
}

export interface BattleRecord {
  /** 仲間ごとの行動の回数 */
  actions: Record<string, number>;
  /** 仲間ごとの、盤にはまっていたギアの色ごとのマス数 */
  colorCells: Record<string, Record<PartColor, number>>;
  /** 手に入れた素材・通常アイテム */
  items: string[];
}

/** 戦闘に勝った時：素材・アイテムを受け取り、経験値とギアの傾向を貯める */
export function recordVictory(armory: ArmoryState, record: BattleRecord): ArmoryState {
  const weapons: Record<string, WeaponState> = {};
  for (const [charId, w] of Object.entries(armory.weapons)) {
    const cells = record.colorCells[charId];
    const tendency = { ...w.tendency };
    if (cells) for (const c of Object.keys(tendency) as PartColor[]) tendency[c] += cells[c] ?? 0;
    weapons[charId] = { ...w, exp: w.exp + (record.actions[charId] ?? 0), tendency };
  }
  return addItems({ ...armory, weapons }, record.items);
}

export function findEvolution(data: WeaponData, w: WeaponState, evolutionId: string): EvolutionDef | undefined {
  return data.weapons[w.defId]?.evolutions.find((e) => e.id === evolutionId);
}

/** 進化の条件を1つずつ確かめる（レベルの条件を含む）。鍵の素材は、パーティ共通の持ち物 items で確かめる */
export function evolutionChecks(
  data: WeaponData,
  w: WeaponState,
  evo: EvolutionDef,
  items: Record<string, number> = {},
): { condition: EvolutionCondition | { kind: 'level'; min: number }; ok: boolean }[] {
  const checks: { condition: EvolutionCondition | { kind: 'level'; min: number }; ok: boolean }[] = [
    { condition: { kind: 'level', min: data.evolveLevel }, ok: weaponLevel(data, w.exp) >= data.evolveLevel },
  ];
  for (const c of evo.conditions) {
    const ok = c.kind === 'param' ? w.params[c.param] >= c.min : c.kind === 'key' ? (items[c.item] ?? 0) >= 1 : tendencyOf(w) === c.color;
    checks.push({ condition: c, ok });
  }
  return checks;
}

/** 進化できない理由。できるなら null */
export function getEvolveError(data: WeaponData, armory: ArmoryState, charId: string, evolutionId: string): string | null {
  const w = armory.weapons[charId];
  if (!w) return 'no weapon';
  if (w.evolvedTo) return 'already evolved';
  const evo = findEvolution(data, w, evolutionId);
  if (!evo) return 'unknown evolution';
  if (!evolutionChecks(data, w, evo, armory.items).every((c) => c.ok)) return 'conditions are not met';
  return null;
}

/** 武器を進化させる（パラメータは引き継ぐ） */
export function evolveWeapon(data: WeaponData, armory: ArmoryState, charId: string, evolutionId: string): ArmoryState {
  const err = getEvolveError(data, armory, charId, evolutionId);
  if (err) throw new Error(err);
  // 鍵の素材を使う
  const items = { ...armory.items };
  for (const c of findEvolution(data, armory.weapons[charId], evolutionId)!.conditions) if (c.kind === 'key') items[c.item] -= 1;
  return { ...armory, items, weapons: { ...armory.weapons, [charId]: { ...armory.weapons[charId], evolvedTo: evolutionId } } };
}

/** 今の武器の名前（進化していれば進化先の名前） */
export function weaponName(data: WeaponData, w: WeaponState): string {
  const evo = w.evolvedTo ? findEvolution(data, w, w.evolvedTo) : undefined;
  return evo?.name ?? data.weapons[w.defId]?.name ?? '';
}

/** 武器を反映したキャラ（攻撃値と進化先の能力値を足し、属性値の割増しと進化先の特性・通常攻撃の属性を付ける） */
export function applyWeapons(data: WeaponData, armory: ArmoryState, chars: CharacterDef[]): CharacterDef[] {
  return chars.map((c) => {
    const w = armory.weapons[c.id];
    if (!w) return c;
    const evo = w.evolvedTo ? findEvolution(data, w, w.evolvedTo) : undefined;
    const stats = { ...c.stats, atk: c.stats.atk + w.params.atk };
    for (const [k, v] of Object.entries(evo?.stats ?? {}) as [keyof Stats, number][]) stats[k] += v;
    const passives: PassiveEffect[] = [...(c.passives ?? [])];
    for (const el of ELEMENTS) {
      const value = w.params[el as 'fire' | 'ice' | 'thunder'];
      if (value > 0) passives.push({ kind: 'elementBoost', element: el, rate: value * data.elementRate });
    }
    passives.push(...(evo?.passives ?? []));
    return { ...c, stats, passives, attackElement: evo?.attackElement ?? c.attackElement };
  });
}

/** 進化した武器の分だけ盤を広げたムーブメントのデータ */
export function naviDataWithWeapons(navi: NaviData, data: WeaponData, armory: ArmoryState): NaviData {
  const boards = { ...navi.boards };
  for (const [charId, w] of Object.entries(armory.weapons)) {
    if (w.evolvedTo && boards[charId]) boards[charId] = extendBoard(boards[charId], data.boardExtension);
  }
  return { ...navi, boards };
}

/** その武器が、今どれかの進化先に進化できるか */
export function canEvolveAny(data: WeaponData, armory: ArmoryState, charId: string): boolean {
  const w = armory.weapons[charId];
  if (!w) return false;
  return (data.weapons[w.defId]?.evolutions ?? []).some((e) => getEvolveError(data, armory, charId, e.id) === null);
}
