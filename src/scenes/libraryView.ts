import type { LibraryState } from '../core';
import { albumFromIds } from '../core';
import { CHAIN_START_ALBUM, LIBRARY_COMBOS, LIBRARY_ENEMIES, LIBRARY_ITEMS, LIBRARY_SNAPS } from '../data';
import { legacyLibrary, readSave, run } from './run';

// ライブラリの画面が読む記録（段階167）。遊んでいる途中は今の周回、タイトルから開いた時はセーブから読む

export interface LibraryView {
  lib: LibraryState;
  /** 持っているスナップの数（新しい戦闘のアルバム） */
  snapOwned: Record<string, number>;
  /** 持っている素材の数 */
  items: Record<string, number>;
}

export function libraryView(): LibraryView {
  if (run.active) return { lib: run.library, snapOwned: run.chainAlbum.owned, items: run.armory.items };
  const r = readSave();
  if (r?.ok) {
    const s = r.save.run;
    const album = s.chainAlbum ?? albumFromIds(CHAIN_START_ALBUM);
    return { lib: s.library ?? legacyLibrary(album, s.armory), snapOwned: album.owned, items: s.armory.items };
  }
  return { lib: run.library, snapOwned: run.chainAlbum.owned, items: {} };
}

/** 見つけたか（スナップ・素材は、今持っている物も見つけた物にする） */
export const isFound = {
  snap: (v: LibraryView, id: string) => v.lib.snaps.includes(id) || (v.snapOwned[id] ?? 0) > 0,
  combo: (v: LibraryView, id: string) => v.lib.combos.includes(id),
  enemy: (v: LibraryView, id: string) => (v.lib.met[id] ?? 0) > 0,
  item: (v: LibraryView, id: string) => v.lib.items.includes(id) || (v.items[id] ?? 0) > 0,
};

/** タブごとの 見つけた数/全部 */
export function libraryProgress(v: LibraryView): Record<'snap' | 'combo' | 'enemy' | 'item', [number, number]> {
  return {
    snap: [LIBRARY_SNAPS.filter((m) => isFound.snap(v, m.id)).length, LIBRARY_SNAPS.length],
    combo: [LIBRARY_COMBOS.filter((l) => isFound.combo(v, l.id)).length, LIBRARY_COMBOS.length],
    enemy: [LIBRARY_ENEMIES.filter((e) => isFound.enemy(v, e.id)).length, LIBRARY_ENEMIES.length],
    item: [LIBRARY_ITEMS.filter((i) => isFound.item(v, i.id)).length, LIBRARY_ITEMS.length],
  };
}

/** 育成のメニューのタイルの一言（記録 n/m） */
export function libraryProgressText(): string {
  const p = Object.values(libraryProgress(libraryView()));
  return `記録 ${p.reduce((a, x) => a + x[0], 0)}/${p.reduce((a, x) => a + x[1], 0)}`;
}
