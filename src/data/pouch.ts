import type { ActionDef } from '../core/types';
import { ITEMS } from './weapons';

// ポーチの消費アイテム（段階51。docs/design/economy.md の 5-1）。持っている数は武器と同じ ArmoryState.items に入る（1種類 POUCH_MAX 個まで）。
// 戦闘の「その他」から味方1人に使う（手番を1つ使う）。回復の量は決まっていて、魔力やバトンの割増しに関係しない。数値は仮（自動対戦で測る）

/** 消費アイテムの id → 使った時の行動 */
export const POUCH_ITEMS: Record<string, ActionDef> = {
  [ITEMS.potion.id]: { id: ITEMS.potion.id, name: ITEMS.potion.name, weight: 1.0, target: 'ally', effects: [{ kind: 'restore', hp: 50 }] },
  [ITEMS.hiPotion.id]: { id: ITEMS.hiPotion.id, name: ITEMS.hiPotion.name, weight: 1.0, target: 'ally', effects: [{ kind: 'restore', hp: 100 }] },
  [ITEMS.ether.id]: { id: ITEMS.ether.id, name: ITEMS.ether.name, weight: 1.0, target: 'ally', effects: [{ kind: 'restore', mp: 12 }] },
};

/** ポーチの並び（戦闘の「その他」と拠点に出す順） */
export const POUCH_ORDER: string[] = [ITEMS.potion.id, ITEMS.hiPotion.id, ITEMS.ether.id];
