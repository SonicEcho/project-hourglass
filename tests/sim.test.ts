import { describe, expect, it } from 'vitest';
import { addParts, createNavi, findBugs, isPartActive } from '../src/core';
import { CAMPAIGN, NAVI_DATA, NAVI_PARTS, PARTY, START_NAVI_PARTS } from '../src/data';
import { arrangeNavi, autoRun, MAX_ATTEMPTS } from '../src/sim/autoRun';
import { formatAreaMeasure, formatMeasure, measure, measureArea, summarize } from '../src/sim/measure';
import { areaBattleOrder, autoAreaRun } from '../src/sim/autoArea';

describe('自動対戦：周回', () => {
  it.each([1, 2])('タイトルからボスまで進み、戦闘ごとの結果が残る（seed %i）', (seed) => {
    const r = autoRun(seed);
    expect(r.stages.length).toBeGreaterThan(0);
    expect(r.stages.length).toBeLessThanOrEqual(CAMPAIGN.length);
    for (const st of r.stages) {
      expect(st.attempts).toBeGreaterThanOrEqual(1);
      expect(st.attempts).toBeLessThanOrEqual(MAX_ATTEMPTS);
      if (st.won) expect(st.rounds).toBeGreaterThan(0);
    }
    expect(r.cleared).toBe(r.stages.length === CAMPAIGN.length && r.stages.every((s) => s.won));
  });

  it('同じシードなら同じ結果になる', () => {
    expect(autoRun(5)).toEqual(autoRun(5));
  });
});

describe('自動対戦：ムーブメントのはめ方', () => {
  it('全種類のギアをはめても狂いを作らず、効果ギアはできるだけブリッジに乗る', () => {
    const navi = arrangeNavi(NAVI_DATA, addParts(createNavi(START_NAVI_PARTS), Object.keys(NAVI_PARTS)));
    for (const c of PARTY) expect(findBugs(NAVI_DATA, navi, c.id)).toEqual([]);
    const placed = navi.parts.filter((p) => p.placement);
    expect(placed.length).toBeGreaterThan(START_NAVI_PARTS.length);
    const effects = placed.filter((p) => NAVI_DATA.parts[p.partId].kind === 'effect');
    expect(effects.filter((p) => isPartActive(NAVI_DATA, p)).length).toBeGreaterThan(0);
  });

  it('最初のギアは全部はまる', () => {
    const navi = arrangeNavi(NAVI_DATA, createNavi(START_NAVI_PARTS));
    expect(navi.parts.every((p) => p.placement)).toBe(true);
  });
});

describe('自動対戦：集計', () => {
  it('戦闘ごとに、進めた周回・1回目の勝ち・やり直しを数える', () => {
    const m = summarize(
      [
        { seed: 1, cleared: false, stages: [{ attempts: 1, won: true, rounds: 2 }, { attempts: MAX_ATTEMPTS, won: false, rounds: null }] },
        { seed: 2, cleared: false, stages: [{ attempts: 3, won: true, rounds: 4 }, { attempts: 1, won: true, rounds: 6 }, { attempts: MAX_ATTEMPTS, won: false, rounds: null }] },
      ],
      1,
    );
    expect(m.stages[0]).toMatchObject({ reached: 2, firstTryWins: 1, wins: 2, roundsTotal: 6, retriesTotal: 2 });
    expect(m.stages[1]).toMatchObject({ reached: 2, firstTryWins: 1, wins: 1, roundsTotal: 6 });
    expect(m.stages[2]).toMatchObject({ reached: 1, firstTryWins: 0, wins: 0 });
    expect(m.stages[3].reached).toBe(0);
    expect(m.cleared).toBe(0);
  });

  it('表にすると、戦闘ごとの行が並ぶ。同じ回数・シードなら同じ表になる', () => {
    const text = formatMeasure(measure(2, 3));
    for (const c of CAMPAIGN) expect(text).toContain(`| ${c.name} |`);
    expect(formatMeasure(measure(2, 3))).toBe(text);
  });
});

describe('自動対戦：1-1 の縁日（段階27）', () => {
  it.each(['random', 'smart'] as const)('2人のパーティで、出会う順にボスまで戦い、戦闘ごとの結果が残る（%s）', (policy) => {
    const r = autoAreaRun(3, policy);
    const order = areaBattleOrder();
    expect(order.at(-1)?.boss).toBe(true);
    expect(r.stages.length).toBeGreaterThan(0);
    expect(r.stages.length).toBeLessThanOrEqual(order.length);
    expect(r.cleared).toBe(r.stages.length === order.length && r.stages.every((s) => s.won));
    expect(autoAreaRun(3, policy)).toEqual(r);
  });

  it('弱点をねらう方針は、ボスまで勝ち切れる（考えれば勝てる）', () => {
    const m = measureArea(10, 1, 'smart');
    expect(m.cleared).toBe(10);
    expect(formatAreaMeasure(m)).toContain('金魚鉢のぬし');
  });
});
