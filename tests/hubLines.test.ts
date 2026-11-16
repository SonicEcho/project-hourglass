import { describe, expect, it } from 'vitest';
import { CAST, HUB_LINES } from '../src/data';

// 拠点の仲間のひとこと（段階226）：どの仲間にもひとことがあり、表情は立ち絵にある
describe('拠点の仲間のひとこと（段階226）', () => {
  it('5人分あり、どれも空でなく、表情はその人の立ち絵の表情', () => {
    const names: Record<string, string> = { hero: 'ハルト', akari: 'あかり', mio: 'みお', sayoko: '小夜子', hayase: '早瀬' };
    for (const [id, name] of Object.entries(names)) {
      const l = HUB_LINES[id];
      expect(l, id).toBeDefined();
      expect(l.idle.length, id).toBeGreaterThan(0);
      for (const t of [...l.idle, l.lost, l.evolve, l.talk]) expect(t.length, id).toBeGreaterThan(0);
      expect(Object.keys(CAST[name].faces), id).toContain(l.face);
    }
  });
});
