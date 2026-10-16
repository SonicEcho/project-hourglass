// ホーム画面のアイコンを作る（段階48）。`node scripts/make_icons.mjs`
// タイトルの砂時計（public/assets/ui/hourglass.svg と同じ形）を、夜の色の上に描いて public/icons/ に PNG で書き出す。
// maskable は、端末が丸や角丸に切り抜いても砂時計が欠けないよう、中央の8割の中に収める
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const OUT = new URL('../public/icons/', import.meta.url);
mkdirSync(OUT, { recursive: true });

/** size 四方の絵。glass は砂時計の高さ（size に対する割合） */
const svg = (size, glass) => {
  const h = size * glass;
  const w = h * (86 / 146);
  const x = (size - w) / 2;
  const y = (size - h) / 2;
  const sx = w / 86;
  const sy = h / 146;
  const p = (px, py) => `${(x + px * sx).toFixed(1)},${(y + py * sy).toFixed(1)}`;
  const stroke = Math.max(2, size * 0.022);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs><radialGradient id="g" cx="50%" cy="58%" r="60%"><stop offset="0" stop-color="#2a2f63"/><stop offset="1" stop-color="#121831"/></radialGradient></defs>
  <rect width="${size}" height="${size}" fill="url(#g)"/>
  <polygon points="${p(14, 120)} ${p(72, 120)} ${p(78, 140)} ${p(8, 140)}" fill="#f2c45a" opacity="0.55"/>
  <g fill="none" stroke="#ffd84a" stroke-width="${stroke}" stroke-linejoin="round">
    <polygon points="${p(3, 3)} ${p(83, 3)} ${p(43, 73)}"/>
    <polygon points="${p(3, 143)} ${p(83, 143)} ${p(43, 73)}"/>
  </g>
</svg>`;
};

const ICONS = [
  { file: 'icon-192.png', size: 192, glass: 0.66 },
  { file: 'icon-512.png', size: 512, glass: 0.66 },
  { file: 'icon-maskable-512.png', size: 512, glass: 0.5 },
  { file: 'apple-touch-icon.png', size: 180, glass: 0.62 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const icon of ICONS) {
  await page.setViewportSize({ width: icon.size, height: icon.size });
  await page.setContent(`<body style="margin:0">${svg(icon.size, icon.glass)}</body>`);
  writeFileSync(new URL(icon.file, OUT), await page.locator('svg').screenshot());
  console.log('wrote', icon.file);
}
await browser.close();
