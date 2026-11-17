import { describe, expect, it, vi } from 'vitest';

vi.stubGlobal('window', { devicePixelRatio: 1 });

describe('まとまりごとの絵の読み込み（段階250）', () => {
  it('物語の流れのどの出来事も、ちょうど1つのまとまりに入る', async () => {
    const { loadSegment } = await import('../src/assets/screenImages');
    const { SLICE_FLOW } = await import('../src/data');
    for (const ch of SLICE_FLOW) {
      for (const e of ch.events) {
        const seg = loadSegment(e.id);
        expect(seg, e.id).not.toBeNull();
        expect(seg!.events.map((x) => x.id)).toContain(e.id);
        expect(seg!.chapter).toBe(ch.id);
      }
    }
  });

  it('まとまりは、時間を返す・物語の戦闘の所で終わる', async () => {
    const { loadSegment } = await import('../src/assets/screenImages');
    const { SLICE_FLOW } = await import('../src/data');
    for (const ch of SLICE_FLOW) {
      for (const e of ch.events) {
        const seg = loadSegment(e.id)!;
        const inner = seg.events.slice(0, -1);
        expect(inner.filter((x) => x.kind === 'return' || x.kind === 'battle').map((x) => x.id), seg.id).toEqual([]);
      }
    }
  });

  it('まとまりで読む絵は台帳にある（絵のない表情の名前は、読み込みで飛ばす）。差分の元の絵は入らない', async () => {
    const { loadSegment, segmentImages } = await import('../src/assets/screenImages');
    const { SLICE_FLOW, ASSETS } = await import('../src/data');
    const known = new Set(ASSETS.filter((a) => a.kind === 'image').map((a) => a.id));
    for (const ch of SLICE_FLOW) {
      const seg = loadSegment(ch.events[0].id)!;
      const ids = segmentImages(seg.events);
      expect(ids.length).toBeGreaterThan(0);
      expect(ids.filter((id) => known.has(id)).length).toBeGreaterThan(ids.length * 0.9);
      expect(ids.filter((id) => id.endsWith('_src'))).toEqual([]);
    }
  });

  it('まばたき・口パクの差分は、切り詰めた位置の表にある', async () => {
    const { ASSETS, PORTRAIT_PART_BOXES } = await import('../src/data');
    const parts = ASSETS.filter((a) => a.id.startsWith('portrait.part.'));
    expect(parts.filter((a) => !PORTRAIT_PART_BOXES[a.id.replace('portrait.part.', '')]).map((a) => a.id)).toEqual([]);
  });
});
