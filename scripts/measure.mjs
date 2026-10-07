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
const text = module.formatMeasure(module.measure(runs, seed));
const took = `\n\n（${((Date.now() - started) / 1000).toFixed(1)}秒）\n`;
console.log(text + took);
// GitHub Actions では、実行結果のページ（Summary）にも出す
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text + took);
