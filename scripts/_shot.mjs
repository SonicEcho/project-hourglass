import { preview } from 'vite';
import { chromium } from 'playwright';
const out = process.argv[2];
const server = await preview({ preview: { port: 4179, strictPort: false }, logLevel: 'warn' });
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', (e) => console.log('ERR', e.message));
await page.goto(`${base}?debug=1&seed=1`);
await page.evaluate(() => localStorage.setItem('restopia.tips', JSON.stringify(Array.from({length:80},(_, i)=>String(i)))));
await page.waitForFunction(() => window.__restopia?.scenes().includes('Title'), null, { timeout: 60000 });
await page.getByText('DBG', { exact: true }).click();
await page.locator('button', { hasText: '素材とアイテムを全種類2つずつもらう' }).click();
const close = page.getByRole('button', { name: '閉じる', exact: true }); if (await close.isVisible()) await close.click();
await page.evaluate(() => window.__restopia.start('Weapon'));
await page.waitForTimeout(2000);
for (let i=0;i<4;i++){ const t = await page.evaluate(() => window.__restopia.findText('^わかった$')); if(!t) break; await page.mouse.click(t.x,t.y); await page.waitForTimeout(500);} 
await page.screenshot({ path: `${out}/weapon.png` });
await browser.close(); await server.httpServer.close();
