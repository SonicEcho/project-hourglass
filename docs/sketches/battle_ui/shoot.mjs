// 戦闘の画面のイメージ（段階101）を 390×844 で撮る。使い方：node docs/sketches/battle_ui/shoot.mjs
// 同じフォルダの *.html を開き、同じ名前の .jpg に書き出す（作り込まない見本。ゲームの中では使わない）。最後に4案を並べた compare.jpg も作る
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const dir = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
for (const name of readdirSync(dir).filter((f) => f.endsWith('.html')).sort()) {
  await page.goto(pathToFileURL(join(dir, name)).href);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  const out = join(dir, name.replace(/\.html$/, '.jpg'));
  await page.screenshot({ path: out, type: 'jpeg', quality: 82 });
  console.log(`- ${out}`);
}
// 4案を横に並べた見比べ（半分の大きさ）
const shots = readdirSync(dir).filter((f) => /^\d_.*\.jpg$/.test(f)).sort();
const cmp = await browser.newPage({ viewport: { width: 195 * shots.length + 10 * (shots.length + 1), height: 452 }, deviceScaleFactor: 2 });
await cmp.setContent(`<body style="margin:0;background:#141820;display:flex;gap:10px;padding:10px">${shots.map((f) => `<img src="data:image/jpeg;base64,${readFileSync(join(dir, f)).toString('base64')}" style="width:195px;height:422px">`).join('')}</body>`);
await cmp.waitForLoadState('networkidle');
await cmp.screenshot({ path: join(dir, 'compare.jpg'), type: 'jpeg', quality: 82 });
console.log(`- ${join(dir, 'compare.jpg')}`);
await browser.close();
