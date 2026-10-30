import { CAMPAIGN } from '../data';
import type { AreaPolicy, AreaRunRecord } from './autoArea';
import { areaBattleOrder, areaLineup, autoAreaRun } from './autoArea';
import { lineupMembers } from '../core';
import { PARTY, WEAPON_DATA } from '../data';
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
  area: string;
  cleared: number;
  stages: (StageSummary & { linksTotal: number })[];
  /** ボスまで進めた回のうち、ボスの前に1人以上進化できた回数（段階27b） */
  evolvedRuns: number;
  /** ボスまで進めた回の、仲間ごとの進化の回数と武器のレベルの合計（段階42） */
  weaponTotals: Record<string, { evolutions: number; level: number }>;
  bossReached: number;
  /** 1回の区画で使ったポーチの平均の数の合計（段階51） */
  pouchUsedTotal: number;
}

/** 測る区画と、先に通す区画（段階37。1-2 は 1-1 を通した後の育ち具合から） */
export const MEASURED_AREAS: Record<string, { title: string; prior: string[] }> = {
  a11: { title: '1-1 の縁日', prior: [] },
  a12: { title: '1-2 の商店街（1-1 を通した後から）', prior: ['a11'] },
  a21: { title: '2-1 の町工場（1-1・1-2 を通した後から。みおを入れた3人、ムーブメントあり）', prior: ['a11', 'a12'] },
  a22: { title: '2-2 の文化祭の高校（1-1・1-2・2-1 を通した後から。みおを入れた3人、ムーブメントあり）', prior: ['a11', 'a12', 'a21'] },
  a23: { title: '2-3 の河川敷のグラウンド（1-1〜2-2 を通した後から。みおを入れた3人、ムーブメントあり）', prior: ['a11', 'a12', 'a21', 'a22'] },
  a31: { title: '3-1 の昭和41年の村（1-1〜2-3 を通した後から。3人、ムーブメントあり）', prior: ['a11', 'a12', 'a21', 'a22', 'a23'] },
  a3s1: { title: '祭りの夜の1晩目（1-1〜3-1 を通した後から。3人）', prior: ['a11', 'a12', 'a21', 'a22', 'a23', 'a31'] },
  a3s2: { title: '祭りの夜の2晩目（1晩目の後から。小夜子を入れた3人）', prior: ['a11', 'a12', 'a21', 'a22', 'a23', 'a31', 'a3s1'] },
  a32: { title: '3-2 の卒業式の帰り道（祭りの夜を通した後から。4人から3人）', prior: ['a11', 'a12', 'a21', 'a22', 'a23', 'a31', 'a3s1', 'a3s2'] },
  a3k: { title: '祭りの夜（カイ）（3-2 を通した後から。小夜子を入れた3人）', prior: ['a11', 'a12', 'a21', 'a22', 'a23', 'a31', 'a3s1', 'a3s2', 'a32'] },
  a41: { title: '4-1 の夏の田舎（3章を通した後から。4人から3人）', prior: ['a11', 'a12', 'a21', 'a22', 'a23', 'a31', 'a3s1', 'a3s2', 'a32', 'a3k'] },
  a42: { title: '4-2 の開店の日（4-1 を通した後から。早瀬を入れた3人）', prior: ['a11', 'a12', 'a21', 'a22', 'a23', 'a31', 'a3s1', 'a3s2', 'a32', 'a3k', 'a41'] },
};

export function measureArea(runs: number, seed: number, policy: AreaPolicy, areaId = 'a11'): AreaMeasureResult {
  const prior = MEASURED_AREAS[areaId]?.prior ?? [];
  const records: AreaRunRecord[] = Array.from({ length: runs }, (_, k) => autoAreaRun((seed + k * 10000) >>> 0, policy, undefined, areaId, prior));
  const stages = areaBattleOrder(areaId).map((b) => ({ name: `${b.name}（${b.enemies.map((e) => e.name).join('・')}）`, reached: 0, firstTryWins: 0, wins: 0, roundsTotal: 0, retriesTotal: 0, linksTotal: 0 }));
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
  const bossReached = records.filter((r) => r.stages.length === stages.length).length;
  const evolvedRuns = records.filter((r) => r.stages.length === stages.length && r.evolvedBeforeBoss > 0).length;
  const weaponTotals: AreaMeasureResult['weaponTotals'] = {};
  for (const r of records.filter((x) => x.stages.length === stages.length)) {
    for (const [id, w] of Object.entries(r.weaponsBeforeBoss)) {
      const t = (weaponTotals[id] ??= { evolutions: 0, level: 0 });
      t.evolutions += w.evolutions;
      t.level += w.level;
    }
  }
  const pouchUsedTotal = records.reduce((a, r) => a + r.pouchUsed, 0);
  return { runs, seed, policy, area: areaId, cleared: records.filter((r) => r.cleared).length, stages, evolvedRuns, bossReached, weaponTotals, pouchUsedTotal };
}

const POLICY_LABEL: Record<AreaPolicy, string> = {
  random: '手はほぼでたらめ',
  smart: '弱点をねらう（弱点を突く、弱点が隠れた部位を先に壊す、ためには防御、連携技は体勢が崩れた敵がいる時）',
  pouch: '弱点をねらう＋ポーチを使う（HP が3割を切った仲間にポーション、MP がない仲間にエーテル）',
};

export function formatAreaMeasure(m: AreaMeasureResult): string {
  return [
    `## ${MEASURED_AREAS[m.area]?.title ?? m.area}（${lineupMembers(PARTY, areaLineup(m.area)).map((c) => c.name).join('・')}、${m.runs}回、シード ${m.seed}〜、${POLICY_LABEL[m.policy]}）`,
    '',
    '| 戦闘 | 進めた回数 | 1回目で勝てた割合 | 平均ラウンド（勝った時） | 平均やり直し | 連携技（勝った戦闘1回あたり） |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
    ...m.stages.map((s) => `| ${s.name} | ${s.reached} | ${pct(s.firstTryWins, s.reached)} | ${avg(s.roundsTotal, s.wins)} | ${avg(s.retriesTotal, s.wins)} | ${s.wins === 0 ? '-' : (s.linksTotal / s.wins).toFixed(2)} |`),
    '',
    `ボスまで勝ち切れた割合：${pct(m.cleared, m.runs)}。ボスの前に1人以上進化できた割合：${pct(m.evolvedRuns, m.bossReached)}${m.policy === 'pouch' ? `。区画で使ったポーチ（平均）：${avg(m.pouchUsedTotal, m.runs)}個` : ''}`,
    `ボスの前の武器（平均。進化の回数／レベル）：${Object.entries(m.weaponTotals)
      .map(([id, t]) => `${PARTY.find((c) => c.id === id)?.name ?? id} ${avg(t.evolutions, m.bossReached)}回／Lv${avg(t.level, m.bossReached)}`)
      .join('、')}`,
    '',
    '星図はでたらめ、素材は一番近い進化先へ向けて吸わせ、残りは時分解（鍵の素材は残す）、つながりゲージは戦闘をまたいで引き継ぐ',
  ].join('\n');
}

// ---- 進化の道ごとの勝率（段階54。docs/design/economy.md の 9-2 の 5.） ----

export interface PathMeasureRow {
  charId: string;
  /** 1回目の進化先（本道の入口） */
  evolution: string;
  runs: number;
  /** ボスの前に、この道を通れた回数 */
  took: number;
  bossReached: number;
  bossFirstTry: number;
  cleared: number;
}

/**
 * 仲間1人の1回目の進化先を決めて（ほかの仲間はいつもどおり）、区画を通す（弱点をねらう方針はぬしにほぼ勝つ区画があるので、でたらめな方針でも測る）。仲間ごと・1回目の本道ごとに、ぬしの勝率を出す。
 * どの本道も勝率が ±5% に収まるのが目安（寄り道は測らない）
 */
export function measureEvolutionPaths(runs: number, seed: number, areaId = 'a23', policy: AreaPolicy = 'smart'): { area: string; runs: number; seed: number; policy: AreaPolicy; rows: PathMeasureRow[] } {
  const prior = MEASURED_AREAS[areaId]?.prior ?? [];
  const members = lineupMembers(PARTY, areaLineup(areaId));
  const rows: PathMeasureRow[] = [];
  const bossIndex = areaBattleOrder(areaId).length - 1;
  for (const c of members) {
    const weapon = Object.values(WEAPON_DATA.weapons).find((w) => w.owner === c.id);
    if (!weapon) continue;
    for (const evo of weapon.evolutions.filter((e) => !e.from && !e.detour && !e.sealed)) {
      const records = Array.from({ length: runs }, (_, k) => autoAreaRun((seed + k * 10000) >>> 0, policy, undefined, areaId, prior, { [c.id]: evo.id }));
      const reached = records.filter((r) => r.stages.length > bossIndex);
      rows.push({
        charId: c.id,
        evolution: evo.id,
        runs,
        took: records.filter((r) => r.weaponsBeforeBoss[c.id]?.path[0] === evo.id).length,
        bossReached: reached.length,
        bossFirstTry: reached.filter((r) => r.stages[bossIndex].won && r.stages[bossIndex].attempts === 1).length,
        cleared: records.filter((r) => r.cleared).length,
      });
    }
  }
  return { area: areaId, runs, seed, policy, rows };
}

export function formatPathMeasure(m: ReturnType<typeof measureEvolutionPaths>): string {
  const name = (charId: string, id: string) => Object.values(WEAPON_DATA.weapons).find((w) => w.owner === charId)?.evolutions.find((e) => e.id === id)?.name ?? id;
  return [
    `## 進化の道ごとの勝率：${MEASURED_AREAS[m.area]?.title ?? m.area}（${m.runs}回ずつ、シード ${m.seed}〜、${POLICY_LABEL[m.policy].split('（')[0]}。1人の1回目の進化先を決め、ほかの仲間はいつもどおり）`,
    '',
    '| 仲間 | 1回目の進化先（本道） | この道を通れた割合 | ぬしの1回目の勝率 | 勝ち切り |',
    '| --- | --- | ---: | ---: | ---: |',
    ...m.rows.map((r) => `| ${PARTY.find((c) => c.id === r.charId)?.name ?? r.charId} | ${name(r.charId, r.evolution)} | ${pct(r.took, r.runs)} | ${pct(r.bossFirstTry, r.bossReached)} | ${pct(r.cleared, r.runs)} |`),
    '',
    '目安：どの本道も、ぬしの勝率が ±5% に収まる（docs/design/economy.md の 9-2）',
  ].join('\n');
}
