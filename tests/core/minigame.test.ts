import { describe, expect, it } from 'vitest';
import type { GoldfishParams, ShootingParams } from '../../src/core';
import { glowingAt, goldfishSchedule, goldfishTap, isShootingHit, shootingTargetX } from '../../src/core';
import { GOLDFISH, SHOOTING } from '../../src/data';

const shoot: ShootingParams = { periodMs: 2000, speedUp: 0.5, window: 0.2, shots: 3 };

describe('射的の判定（段階24）', () => {
  it('構えた時は右の端にいて、4分の1往復で真ん中を通る', () => {
    expect(shootingTargetX(shoot, 0)).toBeCloseTo(1);
    expect(shootingTargetX(shoot, 500)).toBeCloseTo(0);
    expect(shootingTargetX(shoot, 1000)).toBeCloseTo(-1);
  });

  it('真ん中の近くで撃つと当たり、端では外れる', () => {
    expect(isShootingHit(shoot, 0)).toBe(false);
    expect(isShootingHit(shoot, 500)).toBe(true);
    expect(isShootingHit(shoot, 1500)).toBe(true);
    expect(isShootingHit(shoot, 1000)).toBe(false);
  });

  it('2発目からは速くなる', () => {
    // 2発目は1往復 1000ミリ秒なので、250ミリ秒で真ん中
    expect(isShootingHit(shoot, 250, 1)).toBe(true);
    expect(isShootingHit(shoot, 500, 1)).toBe(false);
  });

  it('本番の数値は、真ん中を通る時間が、スマホでタップできる長さ（110ミリ秒以上）', () => {
    const period = SHOOTING.periodMs * Math.pow(SHOOTING.speedUp, SHOOTING.shots - 1);
    // |cos| <= window の幅 = 2・asin(window)/(2π)・period
    const ms = ((2 * Math.asin(SHOOTING.window)) / (2 * Math.PI)) * period;
    expect(ms).toBeGreaterThanOrEqual(110);
  });
});

const fish: GoldfishParams = { gapMinMs: 1000, gapMaxMs: 2000, glowMs: 500, tries: 3, limitMs: 10000 };

describe('金魚すくいの判定（段階24）', () => {
  it('同じシードなら、光る時間の並びは同じ。間は決めた範囲に収まる', () => {
    const a = goldfishSchedule(fish, 42);
    expect(goldfishSchedule(fish, 42)).toEqual(a);
    expect(goldfishSchedule(fish, 43)).not.toEqual(a);
    expect(a.length).toBeGreaterThan(2);
    let prevEnd = 0;
    for (const w of a) {
      expect(w.start - prevEnd).toBeGreaterThanOrEqual(fish.gapMinMs);
      expect(w.start - prevEnd).toBeLessThanOrEqual(fish.gapMaxMs);
      expect(w.end - w.start).toBe(fish.glowMs);
      expect(w.start).toBeLessThan(fish.limitMs);
      prevEnd = w.end;
    }
  });

  it('光っている間のタップですくえる。光っていない時は、ポイが弱って、3回目で破れる', () => {
    const s = goldfishSchedule(fish, 7);
    const w = s[0];
    expect(glowingAt(s, w.start + 10)).toBe(w);
    expect(glowingAt(s, w.start - 10)).toBeNull();
    expect(goldfishTap(fish, s, w.start + 10, 2)).toBe('caught');
    expect(goldfishTap(fish, s, 10, 0)).toBe('weaker');
    expect(goldfishTap(fish, s, 10, 1)).toBe('weaker');
    expect(goldfishTap(fish, s, 10, 2)).toBe('broken');
  });

  it('本番の数値では、遊べる時間の間に、何回も光る', () => {
    expect(goldfishSchedule(GOLDFISH, 1).length).toBeGreaterThanOrEqual(4);
  });
});
