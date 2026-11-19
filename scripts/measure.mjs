// 戦闘の手触りを区画ごとに測る（段階253。docs/milestones/M3_battle_tension.md）。使い方：npm run measure（区画を選ぶ時は npm run measure -- a11 a12）
// 結果は docs/measure.md に書き、画面にも出す。TypeScript のまま読むため Vite の runnerImport を使う
import { writeFileSync } from 'node:fs';
import { runnerImport } from 'vite';

const { module } = await runnerImport('./src/sim/measureAreas.ts');
const areas = process.argv.slice(2).length ? process.argv.slice(2) : module.MEASURE_AREAS;
const rows = [];
for (const a of areas) {
  const row = module.measureArea(a);
  rows.push(row);
  console.log(`${a}：雑魚戦 ${row.battles}・ラウンド ${row.smartRounds.toFixed(1)}`);
}
const table = module.measureTable(rows);
const text = `# 戦闘の手触りの測定（npm run measure）\n\n段階253（\`docs/milestones/M3_battle_tension.md\`）。その区画に入る時点の控えめな育ち具合・区画の山札で、雑魚戦とぬしを3回ずつ（区画の中の HP の持ち越しはなし）。ラウンドは勝った戦闘の平均。\n\n${table}\n`;
writeFileSync('docs/measure.md', text);
console.log(`\n${table}\n\ndocs/measure.md に書きました`);
