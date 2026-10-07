import { CAMPAIGN } from '../data';
import type { RunRecord } from './autoRun';
import { autoRun, MAX_ATTEMPTS } from './autoRun';

// 自動対戦の測定（段階12）。周回を何回も自動で遊び、戦闘ごとの勝率などを集計する

export interface StageSummary {
  name: string;
  /** その戦闘まで進めた周回の数 */
  reached: number;
  /** 1回目で勝てた周回の数 */
  firstTryWins: number;
  /** 勝てた周回の数（やり直しを含む） */
  wins: number;
  /** 勝った戦闘のラウンド数の合計 */
  roundsTotal: number;
  /** 勝てた周回の、やり直した回数の合計 */
  retriesTotal: number;
}

export interface MeasureResult {
  runs: number;
  seed: number;
  cleared: number;
  stages: StageSummary[];
}

/** seed, seed+10000, … の runs 回（やり直しのシードと重ならないよう離す）の周回を自動で遊んで集計する */
export function measure(runs: number, seed: number): MeasureResult {
  const records: RunRecord[] = Array.from({ length: runs }, (_, k) => autoRun((seed + k * 10000) >>> 0));
  return summarize(records, seed);
}

export function summarize(records: RunRecord[], seed: number): MeasureResult {
  const stages: StageSummary[] = CAMPAIGN.map((c) => ({ name: c.name, reached: 0, firstTryWins: 0, wins: 0, roundsTotal: 0, retriesTotal: 0 }));
  for (const r of records) {
    r.stages.forEach((st, i) => {
      const s = stages[i];
      s.reached++;
      if (!st.won) return;
      s.wins++;
      if (st.attempts === 1) s.firstTryWins++;
      s.roundsTotal += st.rounds ?? 0;
      s.retriesTotal += st.attempts - 1;
    });
  }
  return { runs: records.length, seed, cleared: records.filter((r) => r.cleared).length, stages };
}

const pct = (n: number, d: number) => (d === 0 ? '-' : `${Math.round((n / d) * 100)}%`);
const avg = (n: number, d: number) => (d === 0 ? '-' : (n / d).toFixed(1));

/** 結果を Markdown の表にする（GitHub の Summary とターミナルの両方で読めるように） */
export function formatMeasure(m: MeasureResult): string {
  const lines = [
    `## 自動対戦の測定（${m.runs}周、シード ${m.seed}〜）`,
    '',
    '| 戦闘 | 進めた周回 | 1回目で勝てた割合 | 平均ラウンド（勝った時） | 平均やり直し |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...m.stages.map((s) => `| ${s.name} | ${s.reached} | ${pct(s.firstTryWins, s.reached)} | ${avg(s.roundsTotal, s.wins)} | ${avg(s.retriesTotal, s.wins)} |`),
    '',
    `最後まで勝ち切れた周回：${pct(m.cleared, m.runs)}（負けたら同じ戦闘を最大${MAX_ATTEMPTS}回やり直す）`,
    '',
    '方針：手はほぼでたらめ、星の砂はでたらめに使う、ギアは決まったやり方ではめる、素材はすべて時分解してでたらめな武器へ（docs/SPEC.md の段階12）',
  ];
  return lines.join('\n');
}
