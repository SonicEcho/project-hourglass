import type { ExchangeGood } from '../core/exchange';
import { AREA_BATTLES, AREAS } from './areas';
import { NAVI_PARTS } from './navi';
import { POUCH_ORDER } from './pouch';
import { ITEMS } from './weapons';

// 交換所の品物（段階52。docs/design/economy.md の 5-2）。値段は記憶の欠片の数。数値は仮。
// 進化の鍵・スナップ・星の砂は並べない（物語と狩りで手に入れる）

/** 交換所の番人の名前（時間保管局の取引の窓口の係。2026-10-16 開発者と決めた） */
export const EXCHANGE_KEEPER = 'ペトラ';

/**
 * 交換所を初めて開いた時の会話（段階52）。見たかどうかは scene の id で覚える（1回だけ）。
 * 段階80：拠点は2章の昼から入れるので、カイに会う（after の出来事を過ぎる）前に開いた時は、カイの話をしない early の会話にする
 */
export const EXCHANGE_INTRO = { scene: 'exchange_intro', early: 'exchange_intro_early', after: 'd7_kai' } as const;

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
  // 返す時間のある区画だけ（段階85：2-3 の4晩目の書庫は、ほかの区画の砂嵐を混ぜて使うので、並べない）
  ...Object.keys(AREAS).filter((areaId) => AREAS[areaId].timeTitle).flatMap((areaId) => areaCommonItems(areaId).map((id): ExchangeGood => ({ id: `mat_${id}`, kind: 'item', ref: id, price: 1, area: areaId }))),
  ...GEAR_GOODS,
];
