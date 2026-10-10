import { describe, expect, it } from 'vitest';
import { addSandGrains, addSandHiss } from '../src/audio/sandNoise';
import { SAND_SOUND } from '../src/data';

// 砂の音の材料（段階32b の直し）。ザラザラではなく、さらさらに聞こえる形になっているかを数で確かめる
const SR = 48000;
const seeded = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

function makeSand(seed: number): Float32Array {
  const rand = seeded(seed);
  const data = new Float32Array(Math.floor(SR * SAND_SOUND.durationSec));
  addSandGrains(data, SR, Math.floor(SAND_SOUND.grainsPerSec * SAND_SOUND.durationSec), SAND_SOUND.grain, rand);
  addSandHiss(data, SR, SAND_SOUND.hiss, rand);
  return data;
}

/** 尖り具合（ふつうの「さーっ」は3。1粒ずつの「チリッ」が目立つほど大きい） */
function kurtosis(data: Float32Array): number {
  let m2 = 0;
  let m4 = 0;
  for (const v of data) {
    m2 += v * v;
    m4 += v ** 4;
  }
  m2 /= data.length;
  m4 /= data.length;
  return m4 / (m2 * m2);
}

describe('砂の音の材料', () => {
  it('同じ乱数なら同じ音になり、はみ出さない', () => {
    const a = makeSand(7);
    const b = makeSand(7);
    expect(Array.from(a.subarray(0, 500))).toEqual(Array.from(b.subarray(0, 500)));
    expect(a.every((v) => Number.isFinite(v) && Math.abs(v) < 1)).toBe(true);
  });

  it('粒が目立ちすぎない（ザラザラにしない）', () => {
    expect(kurtosis(makeSand(1))).toBeLessThan(4.5);
  });

  it('粒の置き場所を、後ろほど多くできる', () => {
    const data = new Float32Array(SR);
    addSandGrains(data, SR, 2000, { grainSec: 0.001, ampMin: 0.5, ampMax: 0.5 }, seeded(3), (u) => Math.sqrt(u));
    const energy = (from: number, to: number) => data.subarray(from, to).reduce((s, v) => s + v * v, 0);
    expect(energy(SR / 2, SR)).toBeGreaterThan(energy(0, SR / 2) * 2);
  });

  it('「さーっ」の大きさがゆらぐ', () => {
    const data = new Float32Array(SR);
    addSandHiss(data, SR, SAND_SOUND.hiss, seeded(5));
    const win = SR / 20;
    const levels: number[] = [];
    for (let i = 0; i + win <= data.length; i += win) levels.push(Math.sqrt(data.subarray(i, i + win).reduce((s, v) => s + v * v, 0) / win));
    expect(Math.max(...levels)).toBeGreaterThan(Math.min(...levels) * 1.3);
  });
});
