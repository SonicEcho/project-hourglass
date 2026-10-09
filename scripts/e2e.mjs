// 通しの自動確認（段階20・23）。本物のブラウザで毎回確かめる。
// 使い方: npm run build の後に npm run e2e（dist/ を手元のサーバーで開き、Chromium で自動で遊ぶ）
// 流れ1（段階23・24・28。時間を返す画面では「返す」→「次へ」）: タイトル →「はじめる」→ プロローグの会話 → ページを開き直して「つづきから」で同じ場面から続く →
//   デバッグメニューの「次の出来事へ飛ばす」で、物語の流れを最後（つづく）まで1つずつ開く（仮の画面の「次へ」、日の扉も押す。屋台めぐりの計画表と、昼の日常の地図が出るか）。途中の探索の画面でも開き直して続き、縁日の BGM が流れることを確かめる。
// 流れ2（段階20）: デバッグメニューの「試作の5戦を最初から」→ 戦闘1〜5（敵のHPを1にして「自動で1ラウンド戦う」）→ 結果。最後に縁日の試作で BGM が切り替わるかを見る。
// エラーが出る・途中で止まる・思った画面にならない時は失敗（終了コード1）にする。失敗した時の画面は e2e-failure.png に残す
import { chromium } from 'playwright';
import { preview } from 'vite';

const BATTLES = 5;
/** 物語の流れの出来事の数の上限（無限に回らないように） */
const MAX_EVENTS = 80;
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
  await waitScene('Dialogue');
  const bgm = await page.evaluate(() => window.__restopia.bgm());
  if (bgm !== 'bgm.title') throw new Error(`タイトルの BGM が流れていない（${bgm}）`);
  step('プロローグの会話が始まった');
  for (let i = 0; i < 3; i++) {
    await tapAt(195, 650);
    await page.waitForTimeout(300);
  }

  step('ページを開き直して「つづきから」で同じ場面から');
  await page.reload();
  await waitScene('Title');
  await until('「つづきから」の下にプロローグの場面', () => findText('プロローグ：参道の入口'));
  await tap('^つづきから$');
  await waitScene('Dialogue');

  step('物語の流れを最後（つづく）まで開く');
  let reloaded = false;
  let sawPlan = false;
  let sawMap = false;
  let sawReturn = false;
  for (let i = 0; ; i++) {
    if (i > MAX_EVENTS) throw new Error('物語の流れが終わらない');
    if (await findText('^つづく$')) break;
    if (await findText('^けいかくひょう$')) sawPlan = true;
    if (await findText('^どこへ行く？$')) sawMap = true;
    if (!reloaded && (await scenes()).includes('Explore')) {
      // 探索の途中でも、開き直して続くか（段階25）
      await until('探索の地図の名前', () => findText('^1-1「金魚の名前」$'));
      await page.reload();
      await waitScene('Title');
      await until('「つづきから」の下に探索の出来事', () => findText('縁日の探索'));
      await tap('^つづきから$');
      await waitScene('Explore');
      await until('縁日の BGM', async () => (await page.evaluate(() => window.__restopia.bgm())) === 'bgm.festival');
      reloaded = true;
      await debugButton('次の出来事へ飛ばす');
    } else if ((await scenes()).includes('Return')) {
      // 時間を返す画面（段階28）：「返す」→ 演出 →「次へ」
      await tap('^返す$');
      await tap('^次へ$');
      sawReturn = true;
    } else if (await findText('^2日目$')) {
      await page.waitForTimeout(700);
      await tapAt(195, 422);
    } else {
      await debugButton('次の出来事へ飛ばす');
    }
    await page.waitForTimeout(500);
    await until('流れの画面か会話の画面', async () => {
      const s = await scenes();
      return s.includes('Flow') || s.includes('Dialogue') || s.includes('Daily') || s.includes('Explore') || s.includes('Return');
    });
  }
  if (!reloaded) throw new Error('探索の画面が出なかった');
  if (!sawReturn) throw new Error('時間を返す画面が出なかった');
  if (!sawPlan) throw new Error('屋台めぐりの「けいかくひょう」が出なかった');
  if (!sawMap) throw new Error('昼の日常の地図が出なかった');
  await tap('^タイトルへ$');
  await waitScene('Title');

  step('試作の5戦を最初から');
  await debugButton('試作の5戦を最初から');
  await waitScene('Growth');

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
