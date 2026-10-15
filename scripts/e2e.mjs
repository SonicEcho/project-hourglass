// 通しの自動確認（段階20・23）。本物のブラウザで毎回確かめる。
// 使い方: npm run build の後に npm run e2e（dist/ を手元のサーバーで開き、Chromium で自動で遊ぶ）
// 流れ1（段階23・24・28。時間を返す画面では「返す」→「次へ」）: タイトル →「はじめる」→ プロローグの会話 → ページを開き直して「つづきから」で同じ場面から続く →
//   デバッグメニューの「次の出来事へ飛ばす」で、物語の流れを最後（つづく）まで1つずつ開く（仮の画面の「次へ」、日の扉も押す。屋台めぐりの計画表と、昼の日常の地図が出るか）。途中の探索の画面でも開き直して続き、縁日の BGM が流れることを確かめる。 物語の戦闘（段階40。カイの負け戦）は、ラウンドを進めて打ち切りの窓の「次へ」で続ける。
// 流れ2（段階20）: デバッグメニューの「試作の5戦を最初から」→ 戦闘1〜5（敵のHPを1にして「自動で1ラウンド戦う」）→ 結果。最後に縁日の試作で BGM が切り替わるかを見る。
// 初めての人向けの説明（段階30）は最初から全部見たことにして通し、最後に、見た説明を忘れると星図で説明が出ることを確かめる。
// エラーが出る・途中で止まる・思った画面にならない時は失敗（終了コード1）にする。失敗した時の画面は e2e-failure.png に残す
import { readFileSync } from 'node:fs';
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

// 初めての人向けの説明（段階30）は、流れの途中で窓が出て止まらないよう、最初から全部見たことにしておく（最後に1つだけ出ることを確かめる）
const TIP_IDS = [...readFileSync(new URL('../src/data/tips.ts', import.meta.url), 'utf8').matchAll(/id: '([a-z_]+)'/g)].map((m) => m[1]);
await page.addInitScript((ids) => {
  if (localStorage.getItem('restopia.tips') === null) localStorage.setItem('restopia.tips', JSON.stringify(ids));
}, TIP_IDS);

let failed = false;
try {
  step('タイトルを開く');
  await page.goto(`${base}?debug=1&seed=1`);
  await waitScene('Title');
  await tap('^はじめる$');
  await waitScene('Dialogue');
  // BGM は初めて流す時に読むので、少し待つ（2026-10-11）
  await until('タイトルの BGM', async () => (await page.evaluate(() => window.__restopia.bgm())) === 'bgm.title');
  // 「はじめる」で曲を全部ダウンロードして端末にしまう（2026-10-11）
  const BGM_COUNT = [...readFileSync(new URL('../src/data/assets.ts', import.meta.url), 'utf8').matchAll(/Bgm\(\s*'bgm\./g)].length;
  const stored = await page.evaluate(async () => (await (await caches.open('restopia-bgm')).keys()).length);
  if (stored !== BGM_COUNT) throw new Error(`端末にしまった曲が ${stored} 曲（台帳は ${BGM_COUNT} 曲）`);
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
  let sawCutoff = false;
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
    } else if ((await scenes()).includes('Battle')) {
      // 物語の戦闘（段階40。カイの負け戦）：ラウンドを進めると打ち切りの窓が出て、「次へ」で話の続きへ
      for (let round = 0; round < 12 && !(await findText('^次へ$')); round++) {
        await debugButton('自動で1ラウンド戦う');
        await closeDebugMenu();
        await page.waitForTimeout(800);
      }
      await until('打ち切りの窓', () => findText('動きが、見えない'), 60000);
      await tap('^次へ$');
      sawCutoff = true;
    } else if (await findText('^\\d日目$')) {
      await page.waitForTimeout(700);
      await tapAt(195, 422);
    } else {
      await debugButton('次の出来事へ飛ばす');
    }
    await page.waitForTimeout(500);
    await until('流れの画面か会話の画面', async () => {
      const s = await scenes();
      return s.includes('Flow') || s.includes('Dialogue') || s.includes('Daily') || s.includes('Explore') || s.includes('Return') || s.includes('Battle');
    });
  }
  if (!sawCutoff) throw new Error('カイの負け戦の打ち切りが出なかった');
  if (!reloaded) throw new Error('探索の画面が出なかった');
  if (!sawReturn) throw new Error('時間を返す画面が出なかった');
  if (!sawPlan) throw new Error('屋台めぐりの「けいかくひょう」が出なかった');
  if (!sawMap) throw new Error('昼の日常の地図が出なかった');

  step('遊んだ記録の画面（段階32b）');
  await tap('^遊んだ記録を見る$');
  await waitScene('PlayLog');
  await until('一番先が「つづく」', () => findText('一番先：つづく\n'));
  await until('はじめた回数と、つづくまで着いた回数', () => findText('はじめから　1回　　「つづく」まで　1回'));
  await tap('^戻る$');
  await until('「つづく」の画面に戻る', () => findText('^つづく$'));
  await tap('^タイトルへ$');
  await waitScene('Title');
  // タイトルの音量・説明・記録・クレジットは「オプション」にまとめた（段階32b 調整3）
  await tap('^オプション$');
  await until('オプションの窓', () => findText('^BGM$'));
  await tap('^遊んだ記録$');
  await waitScene('PlayLog');
  await tap('^戻る$');
  await waitScene('Title');

  step('試作の5戦を最初から');
  await debugButton('試作の5戦を最初から');
  await waitScene('Growth');

  for (let n = 1; n <= BATTLES; n++) {
    const label = await tap(n === BATTLES ? '（ボス）へ$' : `^戦闘${n}へ$`);
    step(`${label.replace(/へ$/, '')}`);
    await waitScene('Battle');
    const battleBgm = n === BATTLES ? 'bgm.boss' : 'bgm.battle';
    await until(`戦闘の BGM（${battleBgm}）`, async () => (await page.evaluate(() => window.__restopia.bgm())) === battleBgm);
    // まだ解いていない曲は頭だけで鳴り始め、全体が解けたら移る（2026-10-11）
    await until('BGM が曲の全体へ移る', async () => !(await page.evaluate(() => window.__restopia.bgmHead())));
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

  step('見た説明を忘れると、星図を開いた時に説明が出る');
  await page.evaluate(() => localStorage.setItem('restopia.tips', '[]'));
  await page.goto(`${base}?debug=1&seed=1`);
  await waitScene('Title');
  await debugButton('試作の5戦を最初から');
  await waitScene('Growth');
  await until('星図の説明', () => findText('^はじめての説明$'));
  await tap('^わかった$');
  await until('説明が閉じる', async () => !(await findText('^はじめての説明$')));

  step('探索で説明が出ても固まらない（窓が見えて、閉じたら歩ける）');
  await page.evaluate(() => window.__restopia.start('Explore', { area: 'a11' }));
  await waitScene('Explore');
  // 説明の窓が見えるまで出てくる（2026-10-13 の直し。窓の出る動きまで止めていて、見えない窓で後ろを押せなくなっていた）
  for (let i = 0; i < 4; i++) {
    await until('探索の説明の窓', () => findText('^はじめての説明$'));
    // 窓（いちばん手前の入れ物）がすき通ったままでなく、ちゃんと見えるまで出てくる
    await until('探索の説明の窓が見える', () =>
      page.evaluate(() => window.__restopia.scene('Explore').children.list.some((o) => o.depth === 500 && o.active && o.alpha > 0.9)),
    3000);
    await tap('^わかった$');
    await page.waitForTimeout(500);
    if (!(await findText('^はじめての説明$'))) break;
  }
  await until('説明が閉じる', async () => !(await findText('^はじめての説明$')));
  const hero = () => page.evaluate(() => { const s = window.__restopia.scene('Explore'); return [s.player.x, s.player.y]; });
  const before = await hero();
  await tapAt(195, 600);
  await until('仲間が歩く', async () => { const now = await hero(); return now[0] !== before[0] || now[1] !== before[1]; }, 5000);

  step('探索の戦闘に勝って、すぐ会話になる時も縁日の曲に戻る');
  const back = { key: 'Explore', data: { area: 'a11', won: undefined, lost: true, seen: undefined } };
  await page.evaluate((b) => window.__restopia.start('Battle', { encounter: { battle: 'a11_storm1', win: b, lose: b } }), back);
  await until('戦闘の BGM', async () => (await page.evaluate(() => window.__restopia.bgm())) === 'bgm.battle');
  // 1回目に勝つと「最初のコマ」の会話になる
  await page.evaluate(() => window.__restopia.start('Explore', { area: 'a11', won: 'a11_e_plaza', lost: undefined, seen: undefined }));
  await waitScene('Dialogue');
  await until('会話で縁日の BGM', async () => (await page.evaluate(() => window.__restopia.bgm())) === 'bgm.festival');

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
