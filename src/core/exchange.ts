import type { ArmoryState } from './weapon';

// 交換所（段階52。docs/design/economy.md の 5-2）：拠点で、記憶の欠片と品物を交換する。新しいお金は作らない。
// 1回だけの品物を交換したことは、物語の変数（vars）の `交換:id` に覚える

/** 交換所の品物。kind が item なら持ち物（ArmoryState.items）、gear ならギア（ムーブメント）が1つ増える */
export interface ExchangeGood {
  id: string;
  kind: 'item' | 'gear';
  /** 増える物の id（素材・消費アイテム、またはギア） */
  ref: string;
  /** 記憶の欠片の数 */
  price: number;
  /** 1回だけ交換できる */
  once?: boolean;
  /** この章から並ぶ */
  chapter?: number;
  /** この区画を返し終えたら並ぶ */
  area?: string;
}

export interface ExchangeContext {
  /** 返し終えた区画 */
  returned: string[];
  /** 今の章（分からない時は章で絞らない） */
  chapter?: number;
}

/** 物語の変数の名前（1回だけの品物を交換した印） */
export function exchangedKey(goodId: string): string {
  return `交換:${goodId}`;
}

/** 今並ぶ品物（返した区画・章で絞る。書いた順） */
export function exchangeGoods(goods: ExchangeGood[], ctx: ExchangeContext): ExchangeGood[] {
  return goods.filter((g) => (!g.area || ctx.returned.includes(g.area)) && (g.chapter === undefined || ctx.chapter === undefined || ctx.chapter >= g.chapter));
}

/** 持っている記憶の欠片の合計 */
export function fragmentTotal(fragments: Record<string, number>): number {
  return Object.values(fragments).reduce((a, n) => a + Math.max(0, n), 0);
}

/** 欠片で払う：多く持っている種類から1つずつ使う（同じ数なら order の順）。足りなければ null */
export function payFragments(fragments: Record<string, number>, price: number, order: string[]): Record<string, number> | null {
  if (fragmentTotal(fragments) < price) return null;
  const out = { ...fragments };
  const ids = [...new Set([...order, ...Object.keys(out)])];
  for (let i = 0; i < price; i++) {
    let best = ids[0];
    for (const id of ids) if ((out[id] ?? 0) > (out[best] ?? 0)) best = id;
    out[best] = (out[best] ?? 0) - 1;
  }
  return out;
}

/** 交換できない理由。できるなら null。max は持てる数（消費アイテム。なければ上限なし） */
export function getExchangeError(good: ExchangeGood, armory: ArmoryState, vars: Record<string, string>, max?: number): string | null {
  if (good.once && vars[exchangedKey(good.id)]) return 'already exchanged';
  if (good.kind === 'item' && max !== undefined && (armory.items[good.ref] ?? 0) >= max) return 'pouch is full';
  if (fragmentTotal(armory.fragments) < good.price) return 'not enough fragments';
  return null;
}

/** 交換する。gear は増えるギアの id（ムーブメントに足すのは呼ぶ側） */
export function exchange(
  good: ExchangeGood,
  armory: ArmoryState,
  vars: Record<string, string>,
  order: string[],
  max?: number,
): { armory: ArmoryState; vars: Record<string, string>; gear?: string } {
  const err = getExchangeError(good, armory, vars, max);
  if (err) throw new Error(err);
  const fragments = payFragments(armory.fragments, good.price, order)!;
  const items = good.kind === 'item' ? { ...armory.items, [good.ref]: (armory.items[good.ref] ?? 0) + 1 } : armory.items;
  return {
    armory: { ...armory, fragments, items },
    vars: good.once ? { ...vars, [exchangedKey(good.id)]: '1' } : vars,
    ...(good.kind === 'gear' ? { gear: good.ref } : {}),
  };
}
