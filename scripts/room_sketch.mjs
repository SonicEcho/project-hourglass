// 部屋の配置の下絵（段階47）。ChatGPT に部屋の地図の絵を頼む時に、「この配置で描いて」と一緒に付ける絵を作る。
// 文字の地図から、通れる所（明るい色）と通れない所（暗い色）、出入口（青）、チェックポイント（水色の丸）、出発点（黄色）を塗り分ける。
// 使い方：
//   node scripts/room_sketch.mjs <部屋の id（src/data/rooms.ts の ROOMS）> <出力.png>
//   node scripts/room_sketch.mjs <文字の地図のファイル（1行に1列分。# は通れない）> <出力.png>
// 絵の大きさは、正方形（24×24マス）なら 1024×1024、縦長（24×43マス）なら 1024×1536（ChatGPT に頼む大きさ）
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { chromium } from 'playwright';
import { runnerImport } from 'vite';

const [src, out] = process.argv.slice(2);
if (!src || !out) {
  console.error('使い方：node scripts/room_sketch.mjs <部屋の id か、文字の地図のファイル> <出力.png>');
  process.exit(1);
}

const { module: core } = await runnerImport('./src/core/explore.ts');
let room;
if (existsSync(src)) {
  const layout = readFileSync(src, 'utf8').split('\n').map((l) => l.trimEnd()).filter((l) => l.length > 0);
  // ファイルの時は、辺の真ん中の4マスと、その内側が通れる辺を出入口とみなす
  const draft = { id: src, layout, exits: [] };
  const open = (c) => layout[c[1]]?.[c[0]] !== undefined && layout[c[1]][c[0]] !== '#';
  draft.exits = core.ROOM_SIDES.filter((side) => [...core.exitCells(draft, side), ...core.entryCells(draft, side)].every(open));
  room = draft;
} else {
  const { module: rooms } = await runnerImport('./src/data/rooms.ts');
  room = rooms.ROOMS[src];
  if (!room) {
    console.error(`部屋 ${src} がない（src/data/rooms.ts の ROOMS）`);
    process.exit(1);
  }
}

const errors = core.checkRoom(room);
if (errors.length > 0) console.warn(`注意：${errors.join('、')}`);
const rows = room.layout.length;
const cols = Math.max(...room.layout.map((l) => l.length));
const width = 1024;
const height = rows > cols ? 1536 : 1024;
const cw = width / cols;
const ch = height / rows;
const exitKeys = new Set(room.exits.flatMap((side) => core.exitCells(room, side).map(([c, r]) => `${c},${r}`)));
const rects = [];
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const v = room.layout[r][c] ?? '#';
    const fill = exitKeys.has(`${c},${r}`) ? '#5a9ae0' : v === '#' ? '#3a3330' : '#e8dcc0';
    rects.push(`<rect x="${c * cw}" y="${r * ch}" width="${cw + 0.5}" height="${ch + 0.5}" fill="${fill}"/>`);
    if (v === 'P') rects.push(`<circle cx="${(c + 0.5) * cw}" cy="${(r + 0.5) * ch}" r="${cw * 0.4}" fill="none" stroke="#3ab0e0" stroke-width="5"/>`);
    if (v === 'S') rects.push(`<circle cx="${(c + 0.5) * cw}" cy="${(r + 0.5) * ch}" r="${cw * 0.35}" fill="#e0b030"/>`);
  }
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${rects.join('')}</svg>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height } });
await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
writeFileSync(out, await page.screenshot({ clip: { x: 0, y: 0, width, height } }));
await browser.close();
console.log(`${out}：${room.id}（${cols}×${rows}マス、出入口 ${room.exits.join('・') || 'なし'}）`);
