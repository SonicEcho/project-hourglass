// データの一覧表を作る（段階17）。使い方：npm run data:tables
// src/data から docs/data/ の Markdown を作り直す。TypeScript のまま読むため Vite の runnerImport を使う
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runnerImport } from 'vite';

const OUT = 'docs/data';
const { module } = await runnerImport('./src/tools/dataTables.ts');
const files = module.buildDataTables();
mkdirSync(OUT, { recursive: true });
// 前に作って、今は作らないファイルは消す
for (const f of readdirSync(OUT)) if (f.endsWith('.md') && !(f in files)) rmSync(join(OUT, f));
for (const [name, text] of Object.entries(files)) writeFileSync(join(OUT, name), text);
console.log(`${OUT}/ に ${Object.keys(files).length} 個の表を作りました：${Object.keys(files).join('、')}`);
