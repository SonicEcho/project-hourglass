import Phaser from 'phaser';
import { canEvolveAny, findBugs, hasSpare } from '../core';
import { ITEMS, POUCH_MAX, POUCH_ORDER, WEAPON_DATA } from '../data';
import { FRAME_COLORS } from '../ui/frame';
import type { GalleryTile } from '../ui/gallery';
import { COLORS } from '../ui/theme';
import { addText } from '../ui/widgets';
import { canChooseParty, currentNaviData, lineupBase, run, storyLineup } from './run';

// 育成の画面（星図・武器・ムーブメント・アルバム・並び）へのタイル（段階147）。
// 育成の画面へは、拠点（レストピア）と、探索の休憩所（チェックポイント）のメニューからだけ入る（星図の下の入口はなくした）

/** 今の章で開いている育成のタイル。key は開く画面 */
export function growthTiles(open: (key: string) => void): GalleryTile[] {
  const lineup = storyLineup();
  const members = lineupBase(lineup);
  const unlocks = lineup.unlocks;
  const tiles: GalleryTile[] = [];
  if (unlocks.growth) tiles.push({ id: 'growth', label: '星図', sub: `星の砂 ${run.growth.points}`, onTap: () => open('Growth') });
  if (unlocks.weapon) {
    const evolvable = members.some((c) => canEvolveAny(WEAPON_DATA, run.armory, c.id));
    tiles.push({ id: 'weapon', label: '武器', badge: evolvable ? '進化できる' : undefined, onTap: () => open('Weapon') });
  }
  if (unlocks.navi) {
    // 狂いがある時だけ赤い札（赤はムーブメントの焼き付きの色。ART.md 5-9 のそろえ方の決まり）
    const bugs = members.reduce((sum, c) => sum + findBugs(currentNaviData(), run.navi, c.id).length, 0);
    tiles.push({ id: 'navi', label: 'ムーブメント', badge: bugs > 0 ? `狂い ${bugs}` : undefined, badgeColor: bugs > 0 ? 0xc0303a : undefined, onTap: () => open('Navi') });
  }
  if (hasSpare(run.album)) tiles.push({ id: 'album', label: 'アルバム', onTap: () => open('Album') });
  // 戦闘の並び（段階91a）：仲間が戦闘に出られる人数より多い時だけ
  if (canChooseParty()) tiles.push({ id: 'party', label: '並び', onTap: () => open('Party') });
  return tiles;
}

/** ポーチの中身を1行で（段階51）。下の端を返す */
export function addPouchLine(scene: Phaser.Scene, root: Phaser.GameObjects.Container, left: number, y: number, w: number): number {
  const pouch = POUCH_ORDER.map((id) => `${ITEMS[id as keyof typeof ITEMS].name} ${run.armory.items[id] ?? 0}`).join('　');
  root.add(scene.add.rectangle(left, y, w, 26, FRAME_COLORS.panel, 0.85).setOrigin(0).setRounded(8).setStrokeStyle(1, FRAME_COLORS.line));
  root.add(addText(scene, left + 10, y + 13, `ポーチ（各${POUCH_MAX}まで）`, { size: 10, color: COLORS.subText }).setOrigin(0, 0.5));
  root.add(addText(scene, left + w - 10, y + 13, pouch, { size: 12, bold: true }).setOrigin(1, 0.5));
  return y + 26;
}
