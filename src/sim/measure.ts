import { CAMPAIGN } from '../data';
import type { AreaPolicy, AreaRunRecord } from './autoArea';
import { areaBattleOrder, autoAreaRun } from './autoArea';
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

// ---- 1-1 の縁日（段階27）：2人のパーティで、出会う順にボスまで ----

export interface AreaMeasureResult {
  runs: number;
  seed: number;
  policy: AreaPolicy;
  cleared: number;
  stages: (StageSummary & { linksTotal: number })[];
}

export function measureArea(runs: number, seed: number, policy: AreaPolicy): AreaMeasureResult {
  const records: AreaRunRecord[] = Array.from({ length: runs }, (_, k) => autoAreaRun((seed + k * 10000) >>> 0, policy));
  const stages = areaBattleOrder().map((b) => ({ name: `${b.name}（${b.enemies.map((e) => e.name).join('・')}）`, reached: 0, firstTryWins: 0, wins: 0, roundsTotal: 0, retriesTotal: 0, linksTotal: 0 }));
  for (const r of records) {
    r.stages.forEach((st, i) => {
      const s = stages[i];
      s.reached++;
      if (!st.won) return;
      s.wins++;
      if (st.attempts === 1) s.firstTryWins++;
      s.roundsTotal += st.rounds ?? 0;
      s.retriesTotal += st.attempts - 1;
      s.linksTotal += r.links[i] ?? 0;
    });
  }
  return { runs, seed, policy, cleared: records.filter((r) => r.cleared).length, stages };
}

const POLICY_LABEL: Record<AreaPolicy, string> = {
  random: '手はほぼでたらめ',
  smart: '弱点をねらう（弱点を突く、弱点が隠れた部位を先に壊す、ためには防御、連携技は体勢が崩れた敵がいる時）',
};

export function formatAreaMeasure(m: AreaMeasureResult): string {
  return [
    `## 1-1 の縁日（ハルトとあかり、${m.runs}回、シード ${m.seed}〜、${POLICY_LABEL[m.policy]}）`,
    '',
    '| 戦闘 | 進めた回数 | 1回目で勝てた割合 | 平均ラウンド（勝った時） | 平均やり直し | 連携技（勝った戦闘1回あたり） |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
    ...m.stages.map((s) => `| ${s.name} | ${s.reached} | ${pct(s.firstTryWins, s.reached)} | ${avg(s.roundsTotal, s.wins)} | ${avg(s.retriesTotal, s.wins)} | ${s.wins === 0 ? '-' : (s.linksTotal / s.wins).toFixed(2)} |`),
    '',
    `ボスまで勝ち切れた割合：${pct(m.cleared, m.runs)}。星図はでたらめ、素材はすべて時分解してでたらめな武器へ、つながりゲージは戦闘をまたいで引き継ぐ`,
  ].join('\n');
}
