// 落とし物（段階53。docs/design/economy.md の 5-3）：拠点の落とし物の棚で受ける、任意の頼みごと。Phaser に依存しない。
// 拠点の砂時計はハルトたちが見てきた記憶。その中で、あの時は気づかなかった小さなこと（落とし物）を見つけ、今の持ち主に届ける（伝える）。
// 受けた・見つけた・届けたは、物語の変数（vars）の `落とし物:id` に覚える（セーブの形を変えない）
import type { AreaGather } from './hunt';
import type { GridCell } from './grid';

/** 届けた時のごほうび */
export interface LostReward {
  /** 素材・消費アイテム */
  items?: string[];
  /** 記憶の欠片 */
  fragments?: string[];
  gears?: string[];
  snaps?: string[];
  /** 星の砂 */
  points?: number;
}

/**
 * 落とし物1つ。kind：
 * - find（探し物）：記憶をたどる時だけ、区画の spot に光る所が出る。拾うと「見つけた」（findScene があれば、その会話を見る）
 * - bring（取り出す）：砂嵐の名残が飲みこんでいる。bring の素材を count 個集めて棚へ持っていくと、中から出てくる（届ける時に素材を使う）
 */
export interface LostItemDef {
  id: string;
  name: string;
  /** この区画を返し終えたら棚に届く */
  area: string;
  /** 届ける相手（今の持ち主） */
  owner: string;
  /** 棚に出す説明 */
  text: string;
  kind: 'find' | 'bring';
  spot?: { room?: string; cell: GridCell };
  findScene?: string;
  bring?: { item: string; count: number };
  /** 届ける会話 */
  deliverScene: string;
  reward: LostReward;
}

export type LostStatus = 'none' | 'accepted' | 'found' | 'delivered';

/** 物語の変数の名前 */
export function lostKey(id: string): string {
  return `落とし物:${id}`;
}

export function lostStatus(vars: Record<string, string>, id: string): LostStatus {
  const v = vars[lostKey(id)];
  return v === 'accepted' || v === 'found' || v === 'delivered' ? v : 'none';
}

/** 棚に届いている落とし物（返し終えた区画の分。書いた順） */
export function shelfLost(defs: LostItemDef[], returned: readonly string[]): LostItemDef[] {
  return defs.filter((d) => returned.includes(d.area));
}

/** 受けていて、まだ届けていない落とし物の数 */
export function activeLostCount(defs: LostItemDef[], vars: Record<string, string>): number {
  return defs.filter((d) => ['accepted', 'found'].includes(lostStatus(vars, d.id))).length;
}

/** 受けられない理由。受けられるなら null。max は同時に受けられる数 */
export function getAcceptError(defs: LostItemDef[], vars: Record<string, string>, id: string, max: number): string | null {
  if (!defs.some((d) => d.id === id)) return 'unknown lost item';
  if (lostStatus(vars, id) !== 'none') return 'already accepted';
  if (activeLostCount(defs, vars) >= max) return 'too many accepted';
  return null;
}

export function acceptLost(defs: LostItemDef[], vars: Record<string, string>, id: string, max: number): Record<string, string> {
  const err = getAcceptError(defs, vars, id, max);
  if (err) throw new Error(err);
  return { ...vars, [lostKey(id)]: 'accepted' };
}

/** 記憶をたどる時に置く、探し物の光る所（受けていて、まだ見つけていない find だけ）。id は lost: で始まる */
export function lostSpots(defs: LostItemDef[], vars: Record<string, string>, areaId: string): AreaGather[] {
  return defs
    .filter((d) => d.kind === 'find' && d.area === areaId && d.spot && lostStatus(vars, d.id) === 'accepted')
    .map((d) => ({ id: `lost:${d.id}`, ...(d.spot!.room ? { room: d.spot!.room } : {}), cell: d.spot!.cell, items: [] }));
}

/** 光る所の id から、落とし物の id（落とし物の光る所でなければ null） */
export function lostOfSpot(spotId: string): string | null {
  return spotId.startsWith('lost:') ? spotId.slice('lost:'.length) : null;
}

/** 探し物を見つけた */
export function findLost(vars: Record<string, string>, id: string): Record<string, string> {
  return lostStatus(vars, id) === 'accepted' ? { ...vars, [lostKey(id)]: 'found' } : vars;
}

/** 届けられない理由。届けられるなら null */
export function getDeliverError(def: LostItemDef, vars: Record<string, string>, items: Record<string, number>): string | null {
  const st = lostStatus(vars, def.id);
  if (st === 'none') return 'not accepted';
  if (st === 'delivered') return 'already delivered';
  if (def.kind === 'find') return st === 'found' ? null : 'not found yet';
  const need = def.bring!;
  return (items[need.item] ?? 0) >= need.count ? null : 'not enough items';
}

/** 届ける：取り出す落とし物は素材を使う。ごほうびのうち、素材・欠片はここで足す（ギア・スナップ・星の砂は呼ぶ側） */
export function deliverLost(
  def: LostItemDef,
  vars: Record<string, string>,
  armory: { items: Record<string, number>; fragments: Record<string, number> },
): { vars: Record<string, string>; items: Record<string, number>; fragments: Record<string, number> } {
  const err = getDeliverError(def, vars, armory.items);
  if (err) throw new Error(err);
  const items = { ...armory.items };
  if (def.kind === 'bring') items[def.bring!.item] -= def.bring!.count;
  for (const id of def.reward.items ?? []) items[id] = (items[id] ?? 0) + 1;
  const fragments = { ...armory.fragments };
  for (const id of def.reward.fragments ?? []) fragments[id] = (fragments[id] ?? 0) + 1;
  return { vars: { ...vars, [lostKey(def.id)]: 'delivered' }, items, fragments };
}
