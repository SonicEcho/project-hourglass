// 主な画面のスクリーンショットを撮る（段階32a。見た目を変えた時に、前と後を見比べるため）
// 使い方: npm run build の後に node scripts/screens.mjs <書き出すフォルダ>
// 撮る画面：タイトル、会話（プロローグ）、星図、戦闘（試作の5戦の1戦目）、説明の窓
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { preview } from 'vite';

const outDir = process.argv[2] ?? 'screens';
mkdirSync(outDir, { recursive: true });

const server = await preview({ preview: { port: 4174, strictPort: false }, logLevel: 'warn' });
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

const TIP_IDS = [...readFileSync(new URL('../src/data/tips.ts', import.meta.url), 'utf8').matchAll(/id: '([a-z_]+)'/g)].map((m) => m[1]);
await page.addInitScript((ids) => {
  if (localStorage.getItem('restopia.tips') === null) localStorage.setItem('restopia.tips', JSON.stringify(ids));
}, TIP_IDS);

async function until(what, fn, timeout = 15000) {
  const end = Date.now() + timeout;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) throw new Error(`${what} にならなかった`);
    await page.waitForTimeout(150);
  }
}
const findText = (p) => page.evaluate((q) => window.__restopia.findText(q), p);
const waitScene = (key) => until(`画面「${key}」`, async () => (await page.evaluate(() => window.__restopia?.scenes() ?? [])).includes(key));
async function tapAt(x, y) {
  const box = await page.locator('#game canvas').boundingBox();
  await page.mouse.click(box.x + (x / 390) * box.width, box.y + (y / 844) * box.height);
}
async function tap(pattern) {
  const t = await until(`「${pattern}」`, () => findText(pattern));
  await tapAt(t.x, t.y);
}
async function shot(name) {
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${outDir}/${name}.png` });
  console.log(`- ${outDir}/${name}.png`);
}

try {
  await page.goto(`${base}?debug=1&seed=1`);
  await waitScene('Title');
  await shot('1-title');

  await tap('^はじめる$');
  await waitScene('Dialogue');
  for (let i = 0; i < 4; i++) {
    await tapAt(195, 650);
    await page.waitForTimeout(400);
  }
  await shot('2-dialogue');

  await page.goto(`${base}?debug=1&seed=1`);
  await waitScene('Title');
  await page.getByText('DBG', { exact: true }).click();
  await page.locator('button', { hasText: '試作の5戦を最初から' }).click();
  await waitScene('Growth');
  await shot('3-growth');

  await tap('^戦闘1へ$');
  await waitScene('Battle');
  await page.waitForTimeout(1500);
  await shot('4-battle');
  // 画面に入る演出が終わった後（数秒後）の戦闘
  await page.waitForTimeout(4000);
  await shot('4b-battle-later');

  // 武器とムーブメント（文字が小さい画面。はみ出しがないかを見る）
  for (const [label, scene, name] of [['^武器', 'Weapon', '6-weapon'], ['^ムーブメント', 'Navi', '7-navi']]) {
    await page.goto(`${base}?debug=1&seed=1`);
    await waitScene('Title');
    await page.getByText('DBG', { exact: true }).click();
    await page.locator('button', { hasText: '試作の5戦を最初から' }).click();
    await waitScene('Growth');
    await tap(label);
    await waitScene(scene);
    await page.waitForTimeout(1500);
    await shot(name);
  }

  // 遊んだ記録の画面（段階32b）。見本の記録を入れて開く
  await page.evaluate(() => {
    const m = 60_000;
    const events = {
      prologue_open: { ms: 3.2 * m, wins: 0, losses: 0 },
      prologue_stalls: { ms: 4.5 * m, wins: 0, losses: 0 },
      prologue_end: { ms: 2.1 * m, wins: 0, losses: 0 },
      chapter1_title: { ms: 0.2 * m, wins: 0, losses: 0 },
      day1: { ms: 0.1 * m, wins: 0, losses: 0 },
      d1_morning: { ms: 1.8 * m, wins: 0, losses: 0 },
      d1_classroom: { ms: 2.4 * m, wins: 0, losses: 0 },
      d1_street: { ms: 1.5 * m, wins: 0, losses: 0 },
      d1_free: { ms: 3.7 * m, wins: 0, losses: 0 },
      d1_clockshop: { ms: 1.9 * m, wins: 0, losses: 0 },
      d1_library: { ms: 1.2 * m, wins: 0, losses: 0 },
      a11_enter: { ms: 0.9 * m, wins: 0, losses: 0 },
      a11_explore: { ms: 14.6 * m, wins: 5, losses: 1 },
    };
    const at = new Date().toISOString();
    localStorage.setItem('restopia.playlog', JSON.stringify({ startedAt: at, starts: 1, events, furthest: 'a11_explore', last: 'a11_explore', lastAt: at, finished: 0 }));
  });
  await page.goto(`${base}?debug=1&seed=1`);
  await waitScene('Title');
  await tap('^記録$');
  await waitScene('PlayLog');
  await shot('8-playlog');

  await page.evaluate(() => localStorage.setItem('restopia.tips', '[]'));
  await page.goto(`${base}?debug=1&seed=1`);
  await waitScene('Title');
  await page.getByText('DBG', { exact: true }).click();
  await page.locator('button', { hasText: '試作の5戦を最初から' }).click();
  await waitScene('Growth');
  await until('説明の窓', () => findText('^はじめての説明$'));
  await shot('5-tip');
} finally {
  await browser.close();
  await server.close();
}
