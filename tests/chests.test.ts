import { describe, expect, it } from 'vitest';
import { AREAS, ITEMS } from '../src/data';

// 宝箱の中身（段階113。テストプレイのメモ 26：1箱に最大5つ入っていて、豪華すぎた）。
// 1箱は「目玉1つ（ギアかスナップ）＋もう1つ（素材か回復の薬）」まで。ギアとスナップは別の箱
describe('宝箱の中身', () => {
  it('どの区画の宝箱も、目玉は1つまで、中身は2つまで', () => {
    const over: string[] = [];
    for (const area of Object.values(AREAS)) {
      if (area.id.startsWith('trial')) continue;
      for (const c of area.chests) {
        const items = c.items ?? [];
        const mats = items.filter((i) => ITEMS[i as keyof typeof ITEMS]?.kind === 'material').length;
        const keys = (c.gears?.length ?? 0) + (c.snaps?.length ?? 0);
        if (keys > 1 || items.length + keys > 2) over.push(`${area.id} ${c.id}：目玉${keys}・素材${mats}・道具${items.length - mats}`);
      }
    }
    expect(over).toEqual([]);
  });
});
