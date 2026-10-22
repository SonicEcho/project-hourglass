// 育ち具合で飛ぶ（段階92）の、前もって選ぶシードを作る。使い方：npm run presets -- --runs 30
// 流れの全部の区画を何十回か自動対戦で通し、区画ごとに育ちが下の方（控えめ）・真ん中（ふつう）の回のシードを src/sim/presetSeeds.ts に書く。
// 区画や敵の数値を変えた後に作り直す（作り直さなくても飛べるが、控えめ・ふつうの目安が少しずれる）
import { writeFileSync } from 'node:fs';
import { runnerImport } from 'vite';

const i = process.argv.indexOf('--runs');
const runs = i >= 0 ? Number(process.argv[i + 1]) : 30;
const { module } = await runnerImport('./src/sim/presets.ts');
const started = Date.now();
const seeds = module.choosePresetSeeds(runs);
const body = Object.entries(seeds)
  .map(([area, s]) => `  ${area}: { low: ${s.low}, normal: ${s.normal} },`)
  .join('\n');
writeFileSync(
  new URL('../src/sim/presetSeeds.ts', import.meta.url),
  `import type { PresetSeeds } from './presets';\n\n// このファイルは npm run presets で作る（段階92。${runs}回から選んだ）。手で書き換えない\nexport const PRESET_SEEDS: PresetSeeds = {\n${body}\n};\n`,
);
console.log(`${Object.keys(seeds).length}区画（${runs}回、${((Date.now() - started) / 1000).toFixed(1)}秒）`);
