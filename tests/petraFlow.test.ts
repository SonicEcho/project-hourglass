import { describe, expect, it } from 'vitest';
import { SCENES } from '../src/data';

// 段階152（テストプレイのメモ 2 の 2・6）：15日目の夕暮れの窓口は、まだ交換所を開いていなければ初めて会う形にし、見た印を付ける
describe('15日目の夕暮れのペトラ（段階152）', () => {
  it('交換所の初めての会話を見ていなければ、名乗る台詞を通って見た印を付ける', () => {
    const scene = SCENES.find((s) => s.id === 'd15_petra')!;
    const steps = scene.steps;
    const branch = steps.findIndex((st) => st.kind === 'command' && st.name === 'if' && st.args[0] === '見た:exchange_intro');
    expect(branch).toBeGreaterThan(-1);
    const set = steps.findIndex((st) => st.kind === 'command' && st.name === 'set' && st.args[0] === '見た:exchange_intro' && st.args[1] === '1');
    expect(set).toBeGreaterThan(branch);
    const named = steps.slice(branch, set).some((st) => st.kind === 'line' && st.text.includes('ペトラと申します'));
    expect(named).toBe(true);
  });
});
