import { describe, expect, it } from 'vitest';
import { refundV13Growth, resetV14Evolutions } from '../src/sim/presetCarryFix';

// 育ち具合の表（presetCarry.json）を今の星図・武器の木に合わせる手順（段階205 でセーブから移した）
describe('育ち具合の表を今の形に合わせる', () => {
  it('入れ替える前の星図（版13）で開けた星の星の砂を全部返し、星図をまっさらにする（段階194）', () => {
    // ハルト：ダブルスラッシュ（8）・ファイア（元から覚えている。3）・攻撃（3）。あかり：大きい能力値（6）。みお：ハルトの出発点（3）
    const back = refundV13Growth(10, { hero: ['altair', 'tarazed', 'alshain', 'muAql'], akari: ['vega', 'sadr'], mio: ['sualocin', 'altair'] });
    expect(back).toEqual({ points: 10 + 8 + 3 + 3 + 6 + 3, opened: {} });
    // 知らない星は3
    expect(refundV13Growth(0, { hero: ['nothing'] }).points).toBe(3);
  });

  it('入れ替える前の武器の進化（版14）は外す。ほかの物は残す（段階197）', () => {
    const armory = { weapons: { hero: { defId: 'x', exp: 30, path: [{ id: 'flameBlade', style: 0 }] } }, items: {} };
    expect(resetV14Evolutions(armory)).toEqual({ weapons: { hero: { defId: 'x', exp: 30, path: [] } }, items: {} });
  });
});
