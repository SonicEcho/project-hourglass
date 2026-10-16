// 自動対戦の測定（段階12）。使い方：npm run measure -- --runs 200 --seed 1
// TypeScript のまま src/sim/measure.ts を読み込むため、Vite の仕組み（runnerImport）を使う
import { appendFileSync } from 'node:fs';
import { runnerImport } from 'vite';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  const v = i >= 0 ? Number(process.argv[i + 1]) : NaN;
  return Number.isInteger(v) && v >= 0 ? v : fallback;
}

const runs = arg('runs', 200);
const seed = arg('seed', 1);
const { module } = await runnerImport('./src/sim/measure.ts');
const started = Date.now();
const text = [
  module.formatMeasure(module.measure(runs, seed)),
  // 段階27：1-1 の縁日（2人のパーティ）を、2つの方針で
  module.formatAreaMeasure(module.measureArea(runs, seed, 'random')),
  module.formatAreaMeasure(module.measureArea(runs, seed, 'smart')),
  // 段階51：ポーチを使う方針（弱点をねらう方針に足す）。使わない方針（上の smart）と比べる
  module.formatAreaMeasure(module.measureArea(runs, seed, 'pouch')),
  // 段階37：1-2 の商店街（1-1 を通した後の育ち具合から）
  module.formatAreaMeasure(module.measureArea(runs, seed, 'random', 'a12')),
  module.formatAreaMeasure(module.measureArea(runs, seed, 'smart', 'a12')),
  module.formatAreaMeasure(module.measureArea(runs, seed, 'pouch', 'a12')),
  // 段階39：2-1 の町工場（1-1・1-2 を通した後から。みおを入れた3人、ムーブメントあり）
  module.formatAreaMeasure(module.measureArea(runs, seed, 'random', 'a21')),
  module.formatAreaMeasure(module.measureArea(runs, seed, 'smart', 'a21')),
  module.formatAreaMeasure(module.measureArea(runs, seed, 'pouch', 'a21')),
  // 段階39b：2-2 の文化祭の高校（1-1・1-2・2-1 を通した後から）
  module.formatAreaMeasure(module.measureArea(runs, seed, 'random', 'a22')),
  module.formatAreaMeasure(module.measureArea(runs, seed, 'smart', 'a22')),
  module.formatAreaMeasure(module.measureArea(runs, seed, 'pouch', 'a22')),
  // 段階40：2-3 の河川敷（1-1〜2-2 を通した後から）
  module.formatAreaMeasure(module.measureArea(runs, seed, 'random', 'a23')),
  module.formatAreaMeasure(module.measureArea(runs, seed, 'smart', 'a23')),
  module.formatAreaMeasure(module.measureArea(runs, seed, 'pouch', 'a23')),
  // 段階54：進化の道ごとの勝率（1人の1回目の進化先を決めて）。2-1 は弱点をねらう方針、2-3 はでたらめな方針（ねらう方針はほぼ勝つため）
  module.formatPathMeasure(module.measureEvolutionPaths(Math.max(1, Math.floor(runs / 2)), seed, 'a21', 'smart')),
  module.formatPathMeasure(module.measureEvolutionPaths(Math.max(1, Math.floor(runs / 2)), seed, 'a23', 'random')),
].join('\n\n');
const took = `\n\n（${((Date.now() - started) / 1000).toFixed(1)}秒）\n`;
console.log(text + took);
// GitHub Actions では、実行結果のページ（Summary）にも出す
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text + took);
