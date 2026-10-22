// 主な画面のスクリーンショットを撮る（段階32a。見た目を変えた時に、前と後を見比べるため）
// 使い方: npm run build の後に node scripts/screens.mjs <書き出すフォルダ>
// 撮る画面：タイトル、会話（プロローグ）、昼の地図、探索、戦闘（2-3 のカイ）、返す画面、星図・武器・ムーブメント、遊んだ記録、説明の窓。
// 段階98：デバッグメニューの「確認：出来事へ飛ぶ」（段階92）で各画面へ飛ぶ形にした（「試作の5戦」の入口がなくなったため）
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

  // 最初の「はじめる」は、曲をしまうのに時間がかかる（e2e と同じく60秒まで待つ）
  await tap('^はじめる$');
  await until('画面「Dialogue」', async () => (await page.evaluate(() => window.__restopia?.scenes() ?? [])).includes('Dialogue'), 60000);
  for (let i = 0; i < 4; i++) {
    await tapAt(195, 650);
    await page.waitForTimeout(400);
  }
  await shot('2-dialogue');

  /** デバッグメニューの「確認：出来事へ飛ぶ」で、出来事へ飛ぶ（育ち具合はふつう） */
  async function jump(eventId, scene) {
    await page.getByText('DBG', { exact: true }).click();
    await page.locator('#debug-event').selectOption(eventId);
    await page.locator('#debug-tier').selectOption('normal');
    await page.locator('button', { hasText: '↑ の出来事へ飛ぶ' }).click();
    await until(`画面「${scene}」`, async () => (await page.evaluate(() => window.__restopia?.scenes() ?? [])).includes(scene), 60000);
    await page.waitForTimeout(2500);
    // 飛んだ後に出る育ち具合の一言は、画面の上を隠すので消してから撮る
    await page.evaluate(() => document.querySelectorAll('div').forEach((d) => d.textContent?.startsWith('育ち具合：') && d.remove()));
  }

  await jump('d2_free', 'Daily');
  await shot('3-daily');
  await jump('a21_explore', 'Explore');
  await shot('4-explore');
  await jump('a23_kai', 'Battle');
  await page.waitForTimeout(1500);
  await shot('5-battle');
  // 画面に入る演出が終わった後（数秒後）の戦闘
  await page.waitForTimeout(4000);
  await shot('5b-battle-later');
  await jump('a11_return', 'Return');
  await shot('6-return');

  // 星図・武器・ムーブメント（文字が小さい画面。はみ出しがないかを見る）。2-1 の2晩目はチェックポイントから始まるので、育成の入口がある
  for (const [label, scene, name] of [[null, 'Growth', '7-growth'], ['^武器', 'Weapon', '8-weapon'], ['^ムーブメント', 'Navi', '9-navi']]) {
    await jump('a21_explore2', 'Explore');
    await tap('^星図');
    await waitScene('Growth');
    if (label) {
      await tap(label);
      await waitScene(scene);
    }
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
  // 記録はオプションの窓の中（段階32b 調整3）
  await tap('^オプション$');
  await tap('^遊んだ記録$');
  await waitScene('PlayLog');
  await shot('10-playlog');

  // 説明の窓：見た説明を忘れて、探索へ飛ぶ
  await page.evaluate(() => localStorage.setItem('restopia.tips', '[]'));
  await page.goto(`${base}?debug=1&seed=1`);
  await waitScene('Title');
  await jump('a11_explore', 'Explore');
  await until('説明の窓', () => findText('^はじめての説明$'), 30000);
  await shot('11-tip');
} finally {
  await browser.close();
  await server.close();
}
