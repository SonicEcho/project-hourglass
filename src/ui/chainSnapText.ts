import type { ChainLinkDef, ChainMove } from '../core';
import { chainCardCategory, chainComboMaterials } from '../core';
import { A11_CARDS, CHAIN17_COMBO_HINT, LIBRARY_COMBOS, LIBRARY_ENEMIES, LIBRARY_ENEMY_SNAP } from '../data';
import type { IconKind } from './icons';
import { SNAP_CATEGORY } from './listKit';

// 新しい戦闘のスナップとコンボの見せ方（段階167。アルバムとライブラリで同じ物を使う）

/** スナップの分類の名前・色・アイコン */
export function chainSnapLook(m: ChainMove): { color: number; label: string; icon: IconKind } {
  const cat = chainCardCategory(m);
  const base = SNAP_CATEGORY[cat] ?? SNAP_CATEGORY.attack;
  const icon: IconKind = m.effect.kind === 'heal' ? 'heal' : m.effect.kind === 'addon' ? 'support' : cat === 'finish' ? 'star' : m.effect.kind === 'damage' ? m.effect.element : 'support';
  return { ...base, icon };
}

/** 敵のスナップ → その敵の名前 */
export const ENEMY_OF_SNAP: Record<string, string> = Object.fromEntries(LIBRARY_ENEMIES.filter((e) => LIBRARY_ENEMY_SNAP[e.id]).map((e) => [LIBRARY_ENEMY_SNAP[e.id], e.base.name]));

/** コンボの材料の名前（「雪の結晶＋ブルーアワー」） */
export function comboMaterialNames(l: ChainLinkDef): string {
  return l.cards.map((id) => A11_CARDS[id]?.name ?? id).join('＋');
}

/** スナップの説明：名前・分類・重さ・効果、見つけたコンボの材料なら★、敵のスナップなら手に入れ方 */
export function snapDetailLines(m: ChainMove, found: readonly string[]): string[] {
  const lines = [`${m.name}（${chainSnapLook(m).label}・重さ${m.weight}）`, m.text];
  const combos = chainComboMaterials(LIBRARY_COMBOS, found)[m.id];
  if (combos?.length) lines.push(`★コンボの材料：${combos.map((l) => `${l.move.name}（${comboMaterialNames(l)}）`).join('、')}`);
  const foe = ENEMY_OF_SNAP[m.id];
  if (foe) lines.push(`敵のスナップ：${foe}に★3で勝つと、ときどき手に入る`);
  return lines;
}

/** コンボの説明。まだ見つけていないコンボは手がかりだけ */
export function comboDetailLines(l: ChainLinkDef, found: readonly string[]): string[] {
  if (!found.includes(l.id)) return ['？？？（まだ見つけていないコンボ）', `手がかり：${CHAIN17_COMBO_HINT[l.id] ?? '？'}`];
  return [`${l.move.name}（コンボ・重さ${l.move.weight}）`, `材料：${comboMaterialNames(l)}`, l.move.text];
}

/** スナップが、見つけたコンボの材料か */
export function isComboMaterial(id: string, found: readonly string[]): boolean {
  return !!chainComboMaterials(LIBRARY_COMBOS, found)[id];
}
