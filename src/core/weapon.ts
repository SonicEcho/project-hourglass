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
  | { kind: 'key'; item: string }
  /** パラメータが max 以下（寄り道の、変わった条件。段階42） */
  | { kind: 'paramMax'; param: WeaponParamKey; max: number };

/**
 * 型（段階42。docs/design/growth.md の 8-1c）：進化するたびに、その進化先の型から1つを選ぶ。
 * 型の効果は、その後の進化にも引き継ぐ。型ごとに、盤に足すマスの形が違う
 */
export interface EvolutionStyleDef {
  /** 名前（「烈」など。武器の名前の後ろに「・烈」と付く） */
  name: string;
  stats?: Partial<Stats>;
  passives?: PassiveEffect[];
  /** 盤に足すマスの形：row はブリッジの行の右端に横へ、column は盤の下へ縦に */
  board: BoardExtension;
}

export type BoardExtension = 'row' | 'column';

/** 通った進化先と、選んだ型（型は進化先の styles の番号） */
export interface EvolutionStep {
  id: string;
  style: number;
}

/**
 * 進化先（段階42から、進化ツリーの1つの節）。from で親をたどると木になる（合流しない）
 */
export interface EvolutionDef {
  id: string;
  /** 名前（sealed の節は空） */
  name: string;
  /** 進化元の進化先の id（なければ、元の武器からの1回目の進化先） */
  from?: string;
  /** 寄り道（短い枝。段階42） */
  detour?: boolean;
  /** まだ作っていない先（影だけ見せる。進化できない。段階42） */
  sealed?: boolean;
  /** 一番先の言い伝え（影と一緒に見せる一文。段階42） */
  legend?: string;
  conditions: EvolutionCondition[];
  /** 型（ふつうは2つ。sealed の節にはない） */
  styles?: EvolutionStyleDef[];
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
  /** 進化できるレベル（何回目の進化か の順。段階42。足りない段は最後の値） */
  evolveLevels: number[];
  /** 属性値1あたりのダメージの割増し */
  elementRate: number;
  /** 進化した時に盤に増えるマスの数（形は選んだ型で決まる） */
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
  /** 通った進化先と選んだ型（古い順。まだ進化していなければ空。段階42で evolvedTo から替えた） */
  path: EvolutionStep[];
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
      path: [],
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

/** 今の進化先（まだ進化していなければ undefined） */
export function currentEvolution(data: WeaponData, w: WeaponState): EvolutionDef | undefined {
  const last = w.path[w.path.length - 1];
  return last ? findEvolution(data, w, last.id) : undefined;
}

/** 今の進化先の型（まだ進化していなければ undefined） */
export function currentStyle(data: WeaponData, w: WeaponState): EvolutionStyleDef | undefined {
  const last = w.path[w.path.length - 1];
  return last ? currentEvolution(data, w)?.styles?.[last.style] : undefined;
}

/** 進化先の段（1回目の進化先が1。親をたどった数） */
export function evolutionTier(def: WeaponDef, evolutionId: string): number {
  let tier = 0;
  let cur = def.evolutions.find((e) => e.id === evolutionId);
  while (cur && tier < 100) {
    tier++;
    cur = cur.from ? def.evolutions.find((e) => e.id === cur!.from) : undefined;
  }
  return tier;
}

/** ある節の子（from が parent。parent が undefined なら1回目の進化先） */
export function childEvolutions(def: WeaponDef, parent: string | undefined): EvolutionDef[] {
  return def.evolutions.filter((e) => e.from === parent);
}

/** 今の武器の次の進化先（影だけの節も含む） */
export function nextEvolutions(data: WeaponData, w: WeaponState): EvolutionDef[] {
  const def = data.weapons[w.defId];
  return def ? childEvolutions(def, w.path[w.path.length - 1]?.id) : [];
}

/** その段の進化に要るレベル */
export function evolveLevelFor(data: WeaponData, tier: number): number {
  const list = data.evolveLevels;
  return list[Math.min(Math.max(tier, 1), list.length) - 1] ?? 1;
}

/** 進化の条件を1つずつ確かめる（レベルの条件を含む）。鍵の素材は、パーティ共通の持ち物 items で確かめる */
export function evolutionChecks(
  data: WeaponData,
  w: WeaponState,
  evo: EvolutionDef,
  items: Record<string, number> = {},
): { condition: EvolutionCondition | { kind: 'level'; min: number }; ok: boolean }[] {
  const level = evolveLevelFor(data, evolutionTier(data.weapons[w.defId], evo.id));
  const checks: { condition: EvolutionCondition | { kind: 'level'; min: number }; ok: boolean }[] = [
    { condition: { kind: 'level', min: level }, ok: weaponLevel(data, w.exp) >= level },
  ];
  for (const c of evo.conditions) {
    const ok =
      c.kind === 'param'
        ? w.params[c.param] >= c.min
        : c.kind === 'paramMax'
          ? w.params[c.param] <= c.max
          : c.kind === 'key'
            ? (items[c.item] ?? 0) >= 1
            : tendencyOf(w) === c.color;
    checks.push({ condition: c, ok });
  }
  return checks;
}

/** 進化できない理由。できるなら null（style は選ぶ型の番号） */
export function getEvolveError(data: WeaponData, armory: ArmoryState, charId: string, evolutionId: string, style = 0): string | null {
  const w = armory.weapons[charId];
  if (!w) return 'no weapon';
  const evo = findEvolution(data, w, evolutionId);
  if (!evo) return 'unknown evolution';
  if (!nextEvolutions(data, w).includes(evo)) return 'not the next evolution';
  if (evo.sealed) return 'sealed';
  if (!Number.isInteger(style) || style < 0 || style >= (evo.styles?.length ?? 0)) return 'unknown style';
  if (!evolutionChecks(data, w, evo, armory.items).every((c) => c.ok)) return 'conditions are not met';
  return null;
}

/** 武器を進化させる（パラメータは引き継ぐ。選んだ型を覚える） */
export function evolveWeapon(data: WeaponData, armory: ArmoryState, charId: string, evolutionId: string, style = 0): ArmoryState {
  const err = getEvolveError(data, armory, charId, evolutionId, style);
  if (err) throw new Error(err);
  // 鍵の素材を使う
  const items = { ...armory.items };
  for (const c of findEvolution(data, armory.weapons[charId], evolutionId)!.conditions) if (c.kind === 'key') items[c.item] -= 1;
  const w = armory.weapons[charId];
  return { ...armory, items, weapons: { ...armory.weapons, [charId]: { ...w, path: [...w.path, { id: evolutionId, style }] } } };
}

/** 今の武器の名前（進化していれば進化先の名前と型。例：「紅蓮の刃・烈」） */
export function weaponName(data: WeaponData, w: WeaponState): string {
  const evo = currentEvolution(data, w);
  if (!evo) return data.weapons[w.defId]?.name ?? '';
  const style = currentStyle(data, w);
  return style ? `${evo.name}・${style.name}` : evo.name;
}

/** 通った進化先と型（古い順。データにないものは飛ばす） */
function pathSteps(data: WeaponData, w: WeaponState): { evo: EvolutionDef; style?: EvolutionStyleDef }[] {
  return w.path.flatMap((s) => {
    const evo = findEvolution(data, w, s.id);
    return evo ? [{ evo, style: evo.styles?.[s.style] }] : [];
  });
}

/**
 * 武器を反映したキャラ（攻撃値と、通った進化先・型の能力値を足し、属性値の割増しと特性を付ける。
 * 通常攻撃の属性は、一番新しい進化先で属性を持つもの）
 */
export function applyWeapons(data: WeaponData, armory: ArmoryState, chars: CharacterDef[]): CharacterDef[] {
  return chars.map((c) => {
    const w = armory.weapons[c.id];
    if (!w) return c;
    const stats = { ...c.stats, atk: c.stats.atk + w.params.atk };
    const passives: PassiveEffect[] = [...(c.passives ?? [])];
    for (const el of ELEMENTS) {
      const value = w.params[el as 'fire' | 'ice' | 'thunder'];
      if (value > 0) passives.push({ kind: 'elementBoost', element: el, rate: value * data.elementRate });
    }
    let attackElement = c.attackElement;
    for (const { evo, style } of pathSteps(data, w)) {
      for (const src of [evo.stats, style?.stats]) for (const [k, v] of Object.entries(src ?? {}) as [keyof Stats, number][]) stats[k] += v;
      passives.push(...(evo.passives ?? []), ...(style?.passives ?? []));
      if (evo.attackElement) attackElement = evo.attackElement;
    }
    return { ...c, stats, passives, attackElement };
  });
}

/** 進化した武器の分だけ盤を広げたムーブメントのデータ（通った進化先ごとに、選んだ型の形でマスを足す） */
export function naviDataWithWeapons(navi: NaviData, data: WeaponData, armory: ArmoryState): NaviData {
  const boards = { ...navi.boards };
  for (const [charId, w] of Object.entries(armory.weapons)) {
    if (!boards[charId]) continue;
    for (const { style } of pathSteps(data, w)) boards[charId] = extendBoard(boards[charId], data.boardExtension, style?.board ?? 'row');
  }
  return { ...navi, boards };
}

/** その武器が、今どれかの進化先に進化できるか */
export function canEvolveAny(data: WeaponData, armory: ArmoryState, charId: string): boolean {
  const w = armory.weapons[charId];
  if (!w) return false;
  return nextEvolutions(data, w).some((e) => getEvolveError(data, armory, charId, e.id) === null);
}

/**
 * ツリーで、その進化先をどこまで見せるか（段階42。docs/design/growth.md の 8-2）
 * - passed：通った（今の進化先を含む）。名前・能力・選んだ型
 * - next：次（1段先）。名前・能力・条件・型
 * - hint：2段先。名前は伏せ、系統・伸びる方向・鍵の手がかり
 * - shadow：3段先より先と、まだ作っていない先。影だけ
 * - legend：一番先（言い伝えの一文と影）
 * - unreachable：今の武器からは行けない（薄く）
 */
export type EvolutionVisibility = 'passed' | 'next' | 'hint' | 'shadow' | 'legend' | 'unreachable';

export function evolutionVisibility(data: WeaponData, w: WeaponState, evolutionId: string): EvolutionVisibility {
  const def = data.weapons[w.defId];
  const evo = def?.evolutions.find((e) => e.id === evolutionId);
  if (!def || !evo) return 'unreachable';
  if (w.path.some((s) => s.id === evolutionId)) return 'passed';
  // 今の進化先の子孫か（親をたどって、今の進化先に着くか）
  const current = w.path[w.path.length - 1]?.id;
  let distance = 1;
  let cur: EvolutionDef | undefined = evo;
  while (cur && cur.from !== current) {
    cur = cur.from ? def.evolutions.find((e) => e.id === cur!.from) : undefined;
    distance++;
  }
  if (!cur) return 'unreachable';
  const isEnd = childEvolutions(def, evo.id).length === 0;
  if (evo.legend && isEnd && distance >= 2) return 'legend';
  if (evo.sealed) return evo.legend && isEnd ? 'legend' : 'shadow';
  if (distance === 1) return 'next';
  if (distance === 2) return 'hint';
  return 'shadow';
}
