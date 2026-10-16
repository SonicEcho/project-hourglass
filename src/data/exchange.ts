import type { ExchangeGood } from '../core/exchange';
import { AREA_BATTLES, AREAS } from './areas';
import { NAVI_PARTS } from './navi';
import { POUCH_ORDER } from './pouch';
import { ITEMS } from './weapons';

// 交換所の品物（段階52。docs/design/economy.md の 5-2）。値段は記憶の欠片の数。数値は仮。
// 進化の鍵・スナップ・星の砂は並べない（物語と狩りで手に入れる）

/** 交換所の番人の名前（時間保管局の取引の窓口の係。2026-10-16 開発者と決めた） */
export const EXCHANGE_KEEPER = 'ペトラ';

/** 区画の砂嵐が落とす「いつもの」素材（区画の敵の印の戦闘から。出てくる順、同じ物は1回） */
export function areaCommonItems(areaId: string): string[] {
  const area = AREAS[areaId];
  if (!area) return [];
  const ids = area.enemies.flatMap((e) => AREA_BATTLES[e.battle]?.enemies ?? []).flatMap((e) => (e.dropTable?.common ? [e.dropTable.common] : []));
  return [...new Set(ids)];
}

const POUCH_PRICE: Record<string, number> = { [ITEMS.potion.id]: 1, [ITEMS.hiPotion.id]: 2, [ITEMS.ether.id]: 2 };

/** 章ごとのギア（1回だけ）。ムーブメントが開く2章から */
const GEAR_GOODS: ExchangeGood[] = [
  { id: 'gear_mpMemory', kind: 'gear', ref: NAVI_PARTS.mpMemory.id, price: 10, once: true, chapter: 2 },
  { id: 'gear_powerMemory', kind: 'gear', ref: NAVI_PARTS.powerMemory.id, price: 12, once: true, chapter: 2 },
];

/** 交換所に並ぶ品物（ポーチ → 素材（区画の順）→ ギア） */
export const EXCHANGE_GOODS: ExchangeGood[] = [
  ...POUCH_ORDER.map((id): ExchangeGood => ({ id: `pouch_${id}`, kind: 'item', ref: id, price: POUCH_PRICE[id] })),
  ...Object.keys(AREAS).flatMap((areaId) => areaCommonItems(areaId).map((id): ExchangeGood => ({ id: `mat_${id}`, kind: 'item', ref: id, price: 1, area: areaId }))),
  ...GEAR_GOODS,
];
