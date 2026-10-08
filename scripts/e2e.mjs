// 通しの自動確認（段階20）。M0 の完成の基準「今の試作と同じ遊びが動く。途中で閉じても続きから遊べる」を、本物のブラウザで毎回確かめる。
// 使い方: npm run build の後に npm run e2e（dist/ を手元のサーバーで開き、Chromium で自動で遊ぶ）
// 流れ: タイトル →「はじめる」→ 戦闘1〜5（敵のHPを1にして「自動で1ラウンド戦う」）→ 結果。
// 戦闘2の後でページを開き直し、「つづきから」で同じ所から続くことを確かめる。最後に縁日の試作で BGM が切り替わるかを見る。
// エラーが出る・途中で止まる・思った画面にならない時は失敗（終了コード1）にする。失敗した時の画面は e2e-failure.png に残す
import { chromium } from 'playwright';
import { preview } from 'vite';

const BATTLES = 5;
const step = (msg) => console.log(`- ${msg}`);

const server = await preview({ preview: { port: 4173, strictPort: false }, logLevel: 'warn' });
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
});

/** 条件が合うまで待つ。合わなければ失敗 */
async function until(what, fn, timeout = 15000) {
  const end = Date.now() + timeout;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (errors.length > 0) throw new Error(`${what} を待つ間にエラー：\n${errors.join('\n')}`);
    if (Date.now() > end) throw new Error(`${what} にならなかった（${timeout / 1000}秒）`);
    await page.waitForTimeout(150);
  }
}

const findText = (pattern) => page.evaluate((p) => window.__restopia.findText(p), pattern);
const scenes = () => page.evaluate(() => window.__restopia?.scenes() ?? []);
const waitScene = (key) => until(`画面「${key}」`, async () => (await scenes()).includes(key));

/** 390×844 の座標を、ページの座標にしてタップする */
async function tapAt(x, y) {
  const box = await page.locator('#game canvas').boundingBox();
  await page.mouse.click(box.x + (x / 390) * box.width, box.y + (y / 844) * box.height);
}

/** 画面に出ている文字（正規表現）をタップする */
async function tap(pattern) {
  const t = await until(`「${pattern}」が出る`, () => findText(pattern));
  await tapAt(t.x, t.y);
  return t.text;
}

/** デバッグメニューを開いて、ボタンを押す（index は同じ文字のボタンが複数ある時の何番目か） */
async function debugButton(label, index = 0) {
  await page.getByText('DBG', { exact: true }).click();
  await page.locator('button', { hasText: label }).nth(index).click();
}
async function closeDebugMenu() {
  const close = page.getByRole('button', { name: '閉じる', exact: true });
  if (await close.isVisible()) await close.click();
}

/** 今の戦闘に勝つ：敵のHPを1にしてから、自動で1ラウンドずつ戦う */
async function winBattle() {
  await waitScene('Battle');
  await page.getByText('DBG', { exact: true }).click();
  const enemies = await page.locator('button', { hasText: 'のHPを1にする' }).count();
  await closeDebugMenu();
  for (let i = 0; i < enemies; i++) {
    await debugButton('のHPを1にする', i);
    await closeDebugMenu();
  }
  for (let round = 0; round < 40; round++) {
    if (await findText('^勝利！$')) return;
    if (await findText('^敗北…$')) throw new Error('戦闘に負けた');
    await debugButton('自動で1ラウンド戦う');
    await closeDebugMenu(); // 演出中で受け付けられなかった時はメニューが開いたまま
    await page.waitForTimeout(400);
  }
  await until('「勝利！」', () => findText('^勝利！$'), 60000);
}

/** 星図で、勝利の報酬のギアを選んで受け取る */
async function claimReward() {
  if (!(await findText('^ギアを手に入れた！$'))) return;
  // 候補は上から並ぶ（GrowthScene.showReward の配置）。上の2つを選ぶ
  await tapAt(195, 306);
  await page.waitForTimeout(200);
  await tapAt(195, 418);
  await page.waitForTimeout(200);
  await tap('^受け取る$');
  await until('報酬の窓が閉じる', async () => !(await findText('^ギアを手に入れた！$')));
}

let failed = false;
try {
  step('タイトルを開く');
  await page.goto(`${base}?debug=1&seed=1`);
  await waitScene('Title');
  await tap('^はじめる$');
  await waitScene('Growth');
  const bgm = await page.evaluate(() => window.__restopia.bgm());
  if (bgm !== 'bgm.title') throw new Error(`タイトルの BGM が流れていない（${bgm}）`);

  for (let n = 1; n <= BATTLES; n++) {
    const label = await tap(n === BATTLES ? '（ボス）へ$' : `^戦闘${n}へ$`);
    step(`${label.replace(/へ$/, '')}`);
    await winBattle();
    if (n === BATTLES) {
      await tap('^結果へ$');
      await waitScene('Result');
      break;
    }
    await tap('^星図へ$');
    await waitScene('Growth');
    await claimReward();
    if (n === 2) {
      step('ページを開き直して「つづきから」');
      await page.reload();
      await waitScene('Title');
      await tap('^つづきから$');
      await waitScene('Growth');
      await until('戦闘3から続く', () => findText('^戦闘3へ$'));
    }
  }
  step('結果の画面まで進んだ');

  step('縁日の試作で BGM が切り替わる');
  await tap('^タイトルへ$');
  await waitScene('Title');
  await debugButton('試作：縁日のマップを歩く');
  await waitScene('ProtoExplore');
  await until('縁日の BGM', async () => (await page.evaluate(() => window.__restopia.bgm())) === 'bgm.festival');

  if (errors.length > 0) throw new Error(errors.join('\n'));
  console.log('通しの自動確認：成功');
} catch (e) {
  failed = true;
  console.error(`通しの自動確認：失敗\n${e instanceof Error ? e.message : e}`);
  await page.screenshot({ path: 'e2e-failure.png' }).catch(() => {});
} finally {
  await browser.close();
  await server.close();
}
process.exit(failed ? 1 : 0);
