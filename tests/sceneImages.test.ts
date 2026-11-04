import { describe, expect, it } from 'vitest';
import { parseScript } from '../src/core';
import { sceneImageIds } from '../src/assets/sceneImages';
import { ASSETS, BACKDROPS, CAST, CGS, PORTRAIT_PARTS, SCENES } from '../src/data';

// 会話の場面で使う絵（段階148）：遊び始める・場面が替わる時は、この絵だけを先に読んで待つ
const DATA = { cast: CAST, backdrops: BACKDROPS, cgs: CGS, parts: PORTRAIT_PARTS };

describe('会話の場面で使う絵（段階148）', () => {
  it('出る人の全部の表情とまばたき・口パク、背景、1枚絵を集める（出ない人の絵は入れない）', () => {
    const [scene] = parseScript(['# s テスト', '@bg library', '@cast みお〔驚き〕', 'あかり「やあ」', '@cg fireworks'].join('\n'));
    const ids = sceneImageIds(scene, DATA);
    expect(ids).toContain('bg.library');
    expect(ids).toContain('cg.fireworks');
    expect(ids).toContain('portrait.mio.surprised');
    expect(ids).toContain('portrait.mio.smile');
    expect(ids).toContain('portrait.part.mio_blink_smile');
    expect(ids).toContain('portrait.akari.smile');
    expect(ids.some((id) => id.startsWith('portrait.sayoko.'))).toBe(false);
  });

  it('台本のどの場面でも、出る人の最初の表情の絵が入る（その絵がある人だけ）', () => {
    const known = new Set(ASSETS.map((a) => a.id));
    for (const scene of SCENES) {
      const ids = new Set(sceneImageIds(scene, DATA));
      for (const step of scene.steps) {
        if (step.kind !== 'line' || !step.speaker) continue;
        const def = CAST[step.speaker];
        if (!def?.portrait) continue;
        const first = `${def.portrait}.${def.faces[def.firstFace] ?? def.firstFace}`;
        if (known.has(first)) expect(ids.has(first), `${scene.id}：${step.speaker}`).toBe(true);
      }
    }
  });
});
