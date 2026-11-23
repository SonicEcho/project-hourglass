// 段階270（docs/milestones/M3_explore_feel.md の 7.）：新しい1-1 の部屋の形・仕掛け・宝箱・扉を JSON に書き出す（下絵を作る scripts/a11_art_sketch.py が読む）
// 使い方：node scripts/a11_art_dump.mjs
import { writeFileSync } from 'node:fs';
import { runnerImport } from 'vite';

const { module } = await runnerImport('./src/data/a11Rework.ts');
const a = module.A11_REWORK;
const out = {
  rooms: a.rooms.map((r) => ({ id: r.id, layout: r.layout, exits: r.exits, exitAt: r.exitAt ?? null, name: module.A11_REWORK_ROOM_NAMES[r.id] })),
  chests: a.chests.map((c) => ({ id: c.id, room: c.room, cell: c.cell })),
  gadgets: a.gadgets.map((g) => ({ id: g.id, room: g.room, cell: g.cell, kind: g.kind, mark: g.mark, label: g.label })),
  gates: a.gates.map((g) => ({ id: g.id, room: g.room, cells: g.cells, look: g.look, label: g.label })),
  checkpoints: [],
};
writeFileSync('docs/sketches/a11_art/rooms.json', JSON.stringify(out, null, 1));
console.log(out.rooms.map((r) => `${r.id} ${r.name} ${r.exits}\n${r.layout.join('\n')}`).join('\n\n'));
