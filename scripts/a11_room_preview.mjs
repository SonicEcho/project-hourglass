// 段階274：新しい1-1 の部屋の組み立てを、1枚の絵で確かめるための書き出し（部屋の文字の地図・部品・仕掛け・宝箱・敵・人）。
// 使い方：node scripts/a11_room_preview.mjs 出力.json （絵にするのは scripts/a11_room_preview.py）
import { writeFileSync } from 'node:fs';
import { runnerImport } from 'vite';

const { module: d } = await runnerImport('./src/data/index.ts');
const a = d.A11_REWORK;
const file = (id) => d.ASSETS.find((x) => x.id === id)?.file ?? null;
const out = a.rooms.map((r) => ({
  id: r.id,
  layout: r.layout,
  ground: file(r.image),
  parts: (r.parts ?? []).map((p) => ({ ...p, file: file(`part.${p.part}`) })),
  gadgets: (a.gadgets ?? []).filter((g) => g.room === r.id).map((g) => ({ cell: g.cell, file: file(d.A11_PROP_ART[g.id]?.off ?? ''), w: d.A11_PROP_ART[g.id]?.w ?? 1, id: g.id })),
  chests: a.chests.filter((c) => c.room === r.id).map((c) => c.cell),
  enemies: a.enemies.filter((e) => e.room === r.id).map((e) => e.patrol),
  talkers: a.talkers.filter((t) => t.room === r.id).map((t) => t.cell),
  decor: d.A11_DECOR.filter((x) => x.room === r.id).map((x) => ({ ...x, file: file(x.image) })),
}));
writeFileSync(process.argv[2], JSON.stringify(out));
