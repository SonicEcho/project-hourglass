// 段階292：部品で組む地面（src/data/a11LaneKit.ts の LANE_KIT_GROUNDS）を書き出し、scripts/kit_compose.py で合成する。
// 使い方：node scripts/kit_compose.mjs x.json && python3 scripts/kit_compose.py x.json
import { writeFileSync } from 'node:fs';
import { runnerImport } from 'vite';

const { module: d } = await runnerImport('./src/data/index.ts');
writeFileSync(process.argv[2], JSON.stringify(Object.values(d.LANE_KIT_GROUNDS)));
