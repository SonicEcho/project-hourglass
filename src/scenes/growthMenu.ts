import { canEvolveAny, findBugs, hasSpare } from '../core';
import { WEAPON_DATA } from '../data';
import type { GalleryTile } from '../ui/gallery';
import { libraryProgressText } from './libraryView';
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
    const evolvable = members.some((c) => canEvolveAny(WEAPON_DATA, run.armory, c.id, run.vars));
    tiles.push({ id: 'weapon', label: '武器', badge: evolvable ? '進化できる' : undefined, onTap: () => open('Weapon') });
  }
  if (unlocks.navi) {
    // 狂いがある時だけ赤い札（赤はムーブメントの焼き付きの色。ART.md 5-9 のそろえ方の決まり）
    const bugs = members.reduce((sum, c) => sum + findBugs(currentNaviData(), run.navi, c.id).length, 0);
    tiles.push({ id: 'navi', label: 'ムーブメント', badge: bugs > 0 ? `狂い ${bugs}` : undefined, badgeColor: bugs > 0 ? 0xc0303a : undefined, onTap: () => open('Navi') });
  }
  // 段階163：新しい戦闘の区画にいる時は、新しい戦闘のアルバム
  if (hasSpare(run.chainAlbum)) tiles.push({ id: 'album', label: 'アルバム', onTap: () => open('Album') });
  // 戦闘の並び（段階91a）：仲間が戦闘に出られる人数より多い時だけ
  if (canChooseParty()) tiles.push({ id: 'party', label: '編成', onTap: () => open('Party') });
  // ライブラリ（段階167）：見つけたスナップ・コンボ・会った敵・素材の記録
  tiles.push({ id: 'library', label: 'ライブラリ', sub: libraryProgressText(), onTap: () => open('Library') });
  return tiles;
}

