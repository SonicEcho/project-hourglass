import { describe, expect, it } from 'vitest';
import { AREAS, ITEMS } from '../src/data';

// 宝箱の中身（段階113。テストプレイのメモ 26：1箱に最大5つ入っていて、豪華すぎた）。
// 1箱は「目玉1つ（ギアかスナップ）＋もう1つ（素材か回復の薬）」まで。ギアとスナップは別の箱
describe('宝箱の中身', () => {
  it('どの区画の宝箱も、ギアは1つ・スナップは1枚まで、中身は（ギアとスナップを1つと数えて）2つまで', () => {
    const over: string[] = [];
    for (const area of Object.values(AREAS)) {
      if (area.id.startsWith('trial')) continue;
      for (const c of area.chests) {
        const items = c.items ?? [];
        const mats = items.filter((i) => ITEMS[i as keyof typeof ITEMS]?.kind === 'material').length;
        // 段階204：古いスナップをなくしたので、新しい戦闘のスナップ（段階168 から古いスナップと並べて入れていた物）で数える。
        // 段階168 から、ギアの箱にも新しい戦闘のスナップが1枚入っている（中身は変えない）。ギア1つ・スナップ1枚・素材2つまで
        const gears = c.gears?.length ?? 0;
        const snaps = c.chainSnaps?.length ?? 0;
        if (gears > 1 || snaps > 1 || items.length + (gears > 0 && snaps > 0 ? 1 : gears + snaps) > 2) over.push(`${area.id} ${c.id}：ギア${gears}・スナップ${snaps}・素材${mats}・道具${items.length - mats}`);
      }
    }
    expect(over).toEqual([]);
  });
});
