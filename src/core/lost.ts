// 落とし物（段階53。docs/design/economy.md の 5-3）：拠点の落とし物の棚で受ける、任意の頼みごと。Phaser に依存しない。
// 拠点の砂時計はハルトたちが見てきた記憶。その中で、あの時は気づかなかった小さなこと（落とし物）を見つけ、今の持ち主に届ける（伝える）。
// 受けた・見つけた・届けたは、物語の変数（vars）の `落とし物:id` に覚える（セーブの形を変えない）
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
  /** 絆の点が進む仲間（段階220。届けると、絆の足しが1つ付く） */
  bond?: string;
}

/** 届けた後、落とし物の棚で読める仲間のひとこと（段階220）。after の区画を返し終えていれば読める（仲間が加わった後のひとこと） */
export interface LostAfterword {
  speaker: string;
  text: string;
  after?: string;
}

/**
 * 落とし物1つ。kind：
 * - find（探し物）：段階43 の狩りで区画に光る所を出していた形（段階237 で狩りを外したので、今は使っていない。found になれば届けられる）
 * - bring（取り出す）：砂嵐の名残が飲みこんでいる。bring の素材を count 個集めて棚へ持っていくと、中から出てくる（届ける時に素材を使う）
 * - voices（声をたどる。段階220）：砂の底の、その区画の帯に「声のかけら」が埋まる。掘り当てるたびに voices の会話を1つ順に聞き、全部聞くと「見つけた」
 */
export interface LostItemDef {
  id: string;
  name: string;
  /** この区画を返し終えたら棚に届く */
  area: string;
  /** この区画も返し終えるまで、棚に出さない（段階244。ペトラの頼みを 4章の後にする） */
  needs?: string;
  /** 届ける相手（今の持ち主） */
  owner: string;
  /** 棚に出す説明 */
  text: string;
  kind: 'find' | 'bring' | 'voices';
  spot?: { room?: string; cell: GridCell };
  findScene?: string;
  bring?: { item: string; count: number };
  /** 声をたどる時に聞く会話（順に） */
  voices?: string[];
  /** 届ける会話 */
  deliverScene: string;
  reward: LostReward;
  /** 届けた後のひとこと（段階220） */
  afterwords?: LostAfterword[];
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
  return defs.filter((d) => returned.includes(d.area) && (!d.needs || returned.includes(d.needs)));
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

/** 聞いた声の数を覚える、物語の変数の名前（段階220） */
export function lostVoiceKey(id: string): string {
  return `落とし物の声:${id}`;
}

/** 聞いた声のかけらの数（段階220） */
export function lostVoicesHeard(vars: Record<string, string>, id: string): number {
  return Number(vars[lostVoiceKey(id)] ?? 0) || 0;
}

/** 声のかけらを掘り当てられるか（受けていて、まだ全部聞いていない声をたどる依頼。段階220） */
export function wantsLostVoice(def: LostItemDef, vars: Record<string, string>): boolean {
  return def.kind === 'voices' && lostStatus(vars, def.id) === 'accepted' && lostVoicesHeard(vars, def.id) < (def.voices?.length ?? 0);
}

/**
 * 声のかけらを1つ聞く（段階220）。聞く会話（scene）と、何番目か（no は 1 から）を返す。全部聞くと「見つけた」。
 * 聞けない時（受けていない・もう全部聞いた）は scene が null で、vars はそのまま
 */
export function hearLostVoice(def: LostItemDef, vars: Record<string, string>): { vars: Record<string, string>; scene: string | null; no: number; total: number } {
  const total = def.voices?.length ?? 0;
  const heard = lostVoicesHeard(vars, def.id);
  if (!wantsLostVoice(def, vars)) return { vars, scene: null, no: heard, total };
  const no = heard + 1;
  const next = { ...vars, [lostVoiceKey(def.id)]: String(no) };
  return { vars: no >= total ? { ...next, [lostKey(def.id)]: 'found' } : next, scene: def.voices![heard], no, total };
}

/** 絆の足しを覚える、物語の変数の名前（段階220。daily.ts の bondPoints が数える） */
export function lostBondKey(partner: string, id: string): string {
  return `絆の足し:${partner}:落とし物:${id}`;
}

/** 届けた依頼の数（段階220。武器の寄り道③の鍵に使う） */
export function deliveredLostCount(defs: LostItemDef[], vars: Record<string, string>): number {
  return defs.filter((d) => lostStatus(vars, d.id) === 'delivered').length;
}

/** 読める、届けた後のひとこと（段階220）。届けていて、after の区画を返し終えている物 */
export function lostAfterwords(def: LostItemDef, vars: Record<string, string>, returned: readonly string[]): LostAfterword[] {
  if (lostStatus(vars, def.id) !== 'delivered') return [];
  return (def.afterwords ?? []).filter((a) => !a.after || returned.includes(a.after));
}


/** 届けられない理由。届けられるなら null */
export function getDeliverError(def: LostItemDef, vars: Record<string, string>, items: Record<string, number>): string | null {
  const st = lostStatus(vars, def.id);
  if (st === 'none') return 'not accepted';
  if (st === 'delivered') return 'already delivered';
  if (def.kind === 'find' || def.kind === 'voices') return st === 'found' ? null : 'not found yet';
  const need = def.bring!;
  return (items[need.item] ?? 0) >= need.count ? null : 'not enough items';
}

/** 届ける：取り出す落とし物は素材を使う。ごほうびのうち、素材・欠片・絆の足しはここで足す（ギア・スナップ・星の砂は呼ぶ側） */
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
  const bond = def.reward.bond ? { [lostBondKey(def.reward.bond, def.id)]: '1' } : {};
  return { vars: { ...vars, [lostKey(def.id)]: 'delivered', ...bond }, items, fragments };
}
