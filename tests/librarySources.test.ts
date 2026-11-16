import { describe, expect, it } from 'vitest';
import { LIBRARY_ITEMS, LIBRARY_ITEM_SOURCES, LIBRARY_SNAP_SOURCES, LIBRARY_SNAPS, sourceTexts } from '../src/data';

// 段階233：ライブラリの「手に入る所」
describe('ライブラリの手に入る所', () => {
  it('どのスナップにも、手に入る所が1つ以上ある', () => {
    const missing = LIBRARY_SNAPS.filter((m) => !LIBRARY_SNAP_SOURCES[m.id]?.length).map((m) => m.id);
    expect(missing).toEqual([]);
  });
  it('どの素材（ライブラリに載る物）にも、手に入る所が1つ以上ある', () => {
    const missing = LIBRARY_ITEMS.filter((i) => !LIBRARY_ITEM_SOURCES[i.id]?.length).map((i) => i.id);
    expect(missing).toEqual([]);
  });
  it('まだ会っていない敵・知らない区画の名前は伏せ、会うと出る', () => {
    const list = [
      { text: '金魚ノイズが落とす', hidden: '？？？が落とす', gate: { enemy: 'goldfishNoise' } },
      { text: '1-1の宝箱', hidden: '？？？の宝箱', gate: { areas: ['1-1'] } },
      { text: '交換所', hidden: '交換所' },
    ];
    const none = { enemy: () => false, area: () => false };
    expect(sourceTexts(list, none)).toEqual(['？？？が落とす', '？？？の宝箱', '交換所']);
    const all = { enemy: () => true, area: () => true };
    expect(sourceTexts(list, all)).toEqual(['金魚ノイズが落とす', '1-1の宝箱', '交換所']);
  });
  it('同じ伏せた文はまとめる', () => {
    const list = [
      { text: 'Aが落とす', hidden: '？？？が落とす', gate: { enemy: 'a' } },
      { text: 'Bが落とす', hidden: '？？？が落とす', gate: { enemy: 'b' } },
    ];
    expect(sourceTexts(list, { enemy: () => false, area: () => false })).toEqual(['？？？が落とす']);
  });
});
