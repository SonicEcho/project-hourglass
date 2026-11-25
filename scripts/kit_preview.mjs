// 段階292：部品で組んだ裏通り（LANE_KIT_ROOMS）と今の裏通りを、scripts/a11_room_preview.py で並べて写すための書き出し
// 使い方：node scripts/kit_preview.mjs x.json && python3 scripts/a11_room_preview.py x.json 出力.png
import { writeFileSync } from 'node:fs';
import { runnerImport } from 'vite';

const { module: d } = await runnerImport('./src/data/index.ts');
const a = d.A11_REWORK;
const file = (id) => d.ASSETS.find((x) => x.id === id)?.file ?? null;
const lane = a.rooms.find((r) => r.id === 'fest2_lane');
const rooms = [['今の版（一枚絵）', lane], ...Object.entries(d.LANE_KIT_ROOMS).map(([k, r]) => [`部品の版 ${k.toUpperCase()}`, r])];
const out = rooms.map(([name, r]) => ({
  id: name,
  layout: r.layout,
  ground: file(r.image),
  parts: (r.parts ?? []).map((p) => ({ ...p, file: file(`part.${p.part}`) })),
  gadgets: (a.gadgets ?? []).filter((g) => g.room === 'fest2_lane').map((g) => ({ cell: g.cell, file: file(d.A11_PROP_ART[g.id]?.off ?? ''), w: d.A11_PROP_ART[g.id]?.w ?? 1, id: g.id })),
  chests: a.chests.filter((c) => c.room === 'fest2_lane').map((c) => c.cell),
  enemies: [],
  talkers: [],
  decor: [],
}));
writeFileSync(process.argv[2], JSON.stringify(out));
