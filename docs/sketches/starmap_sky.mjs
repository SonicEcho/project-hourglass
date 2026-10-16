// 本物の星座に沿った星図の見本（段階56のたたき台）。夏の大三角のまわり：わし座（ハルト）・こと座（あかり）・いるか座（みお）・や座とこぎつね座（橋）・はくちょう座（2章）
// 位置は実際の赤経（時）・赤緯（度）。空を見上げた向き（東が左）。小さな星座は、その星座の中心から広げる（タップできるように）
import { writeFileSync } from 'node:fs';
// 段階56のたたき台（2026-10-16、開発者と見本で確認）。`node docs/sketches/starmap_sky.mjs <出力先のフォルダ>/` で見本の HTML を書き出す
const dir = process.argv[2] ?? new URL('.', import.meta.url).pathname;
// [id, 星の名前, 星座, 赤経h, 赤緯°, 章, 効果]  効果：start:誰 / skill:名前 / 能力値 a2 h12 m2 p6 d1 s1（大は A4 H24 M4 P12 D2 S2）
const STARS = [
  // わし座（ハルト）
  ['altair', 'アルタイル', 'aql', 19.846, 8.87, 1, 'start:hero'],
  ['tarazed', 'タラゼド', 'aql', 19.771, 10.61, 1, 'skill:ダブルスラッシュ'],
  ['alshain', 'アルシャイン', 'aql', 19.922, 6.41, 1, 'skill:ファイア'],
  ['muAql', 'わし座μ', 'aql', 19.567, 7.38, 1, 'a2'],
  ['deltaAql', 'わし座δ', 'aql', 19.425, 3.11, 1, 'h12'],
  ['zetaAql', 'わし座ζ', 'aql', 19.090, 13.86, 1, 'a2'],
  ['epsAql', 'わし座ε', 'aql', 18.994, 15.07, 1, 'h12'],
  ['lambdaAql', 'わし座λ', 'aql', 19.104, -4.88, 1, 'a2'],
  ['iotaAql', 'わし座ι', 'aql', 19.613, -1.29, 1, 'D2'],
  ['etaAql', 'わし座η', 'aql', 19.874, 1.01, 1, 'a2'],
  ['thetaAql', 'わし座θ', 'aql', 20.188, -0.82, 1, 'h12'],
  // こと座（あかり）とこぎつね座
  ['vega', 'ベガ', 'lyr', 18.615, 38.78, 1, 'start:akari'],
  ['epsLyr', 'こと座ε', 'lyr', 18.739, 39.67, 1, 'skill:ケアル'],
  ['zetaLyr', 'こと座ζ', 'lyr', 18.746, 37.61, 1, 'm2'],
  ['deltaLyr', 'こと座δ', 'lyr', 18.908, 36.90, 1, 'p6'],
  ['sulafat', 'スラファト', 'lyr', 18.982, 32.69, 1, 'm2'],
  ['sheliak', 'シェリアク', 'lyr', 18.835, 33.36, 1, 'skill:ケア'],
  ['thetaLyr', 'こと座θ', 'lyr', 19.272, 38.13, 1, 'skill:アイス'],
  ['kappaLyr', 'こと座κ', 'lyr', 18.331, 36.06, 1, 'h12'],
  ['anser', 'アンサー', 'vul', 19.478, 24.67, 1, 'p6'],
  // や座（橋）
  ['alphaSge', 'や座α', 'sge', 19.668, 18.01, 1, 'a2'],
  ['betaSge', 'や座β', 'sge', 19.684, 16.48, 1, 'p6'],
  ['deltaSge', 'や座δ', 'sge', 19.790, 18.53, 1, 's1'],
  ['gammaSge', 'や座γ', 'sge', 19.979, 19.49, 1, 's1'],
  // いるか座（みお）
  ['sualocin', 'スアロキン', 'del', 20.661, 15.91, 1, 'start:mio'],
  ['rotanev', 'ロタネフ', 'del', 20.626, 14.60, 1, 'skill:サンダー'],
  ['gammaDel', 'いるか座γ', 'del', 20.777, 16.12, 1, 's1'],
  ['deltaDel', 'いるか座δ', 'del', 20.724, 15.07, 1, 's1'],
  ['epsDel', 'いるか座ε', 'del', 20.554, 11.30, 1, 'skill:ひらめき'],
  ['etaDel', 'いるか座η', 'del', 20.564, 13.03, 1, 's1'],
  ['kappaDel', 'いるか座κ', 'del', 20.656, 10.09, 1, 'd1'],
  // はくちょう座（2章）
  ['deneb', 'デネブ', 'cyg', 20.690, 45.28, 2, 'skill:ファイラ'],
  ['sadr', 'サドル', 'cyg', 20.370, 40.26, 2, 'A4'],
  ['etaCyg', 'はくちょう座η', 'cyg', 19.938, 35.08, 2, 'h12'],
  ['phiCyg', 'はくちょう座φ', 'cyg', 19.657, 30.15, 2, 'd1'],
  ['albireo', 'アルビレオ', 'cyg', 19.512, 27.96, 2, 's1'],
  ['deltaCyg', 'はくちょう座δ', 'cyg', 19.750, 45.13, 2, 'm2'],
  ['thetaCyg', 'はくちょう座θ', 'cyg', 19.640, 49.40, 2, 'm2'],
  ['iotaCyg', 'はくちょう座ι', 'cyg', 19.495, 51.73, 2, 'P12'],
  ['kappaCyg', 'はくちょう座κ', 'cyg', 19.285, 53.37, 2, 'skill:ブリザラ'],
  ['gienah', 'ギェナー', 'cyg', 20.770, 33.97, 2, 'H24'],
  ['c41', 'はくちょう座41', 'cyg', 20.488, 30.37, 2, 'M4'],
  ['zetaCyg', 'はくちょう座ζ', 'cyg', 21.216, 30.23, 2, 'skill:サンダラ'],
  ['tauCyg', 'はくちょう座τ', 'cyg', 21.248, 38.05, 2, 's1'],
  ['nuCyg', 'はくちょう座ν', 'cyg', 20.953, 41.17, 2, 's1'],
  ['xiCyg', 'はくちょう座ξ', 'cyg', 21.082, 43.93, 2, 'D2'],
  ['rhoCyg', 'はくちょう座ρ', 'cyg', 21.566, 45.59, 2, 'S2'],
  ['omiCyg', 'はくちょう座ο', 'cyg', 20.227, 46.74, 2, 'p6'],
];
const EDGES = [
  // わし座
  'tarazed-altair', 'altair-alshain', 'altair-muAql', 'muAql-deltaAql', 'deltaAql-zetaAql', 'zetaAql-epsAql', 'deltaAql-lambdaAql', 'deltaAql-iotaAql', 'alshain-etaAql', 'etaAql-thetaAql',
  // こと座
  'vega-epsLyr', 'vega-zetaLyr', 'zetaLyr-sheliak', 'zetaLyr-deltaLyr', 'deltaLyr-sulafat', 'sheliak-sulafat', 'vega-kappaLyr', 'epsLyr-thetaLyr', 'thetaLyr-deltaLyr',
  // こと座 → こぎつね座 → や座（橋）
  'sulafat-anser', 'anser-alphaSge',
  // や座
  'alphaSge-deltaSge', 'betaSge-deltaSge', 'deltaSge-gammaSge',
  // や座 → わし座、や座 → いるか座（橋）
  'betaSge-tarazed', 'gammaSge-etaDel', 'epsAql-alphaSge',
  // いるか座
  'epsDel-rotanev', 'rotanev-sualocin', 'sualocin-gammaDel', 'gammaDel-deltaDel', 'deltaDel-rotanev', 'etaDel-rotanev', 'kappaDel-epsDel',
  // わし座 → いるか座（橋）
  'thetaAql-kappaDel',
  // はくちょう座
  'albireo-phiCyg', 'phiCyg-etaCyg', 'etaCyg-sadr', 'sadr-deneb', 'sadr-deltaCyg', 'deltaCyg-thetaCyg', 'thetaCyg-iotaCyg', 'iotaCyg-kappaCyg', 'sadr-gienah', 'gienah-zetaCyg', 'gienah-c41',
  'deneb-nuCyg', 'nuCyg-xiCyg', 'xiCyg-rhoCyg', 'zetaCyg-tauCyg', 'tauCyg-nuCyg', 'deltaCyg-omiCyg', 'omiCyg-deneb',
  // 2章の橋：はくちょう座 → こぎつね座・こと座
  'albireo-anser', 'deltaCyg-thetaLyr',
];
// 星座ごとの広げ方（小さな星座ほど大きく）
const SPREAD = { aql: 1.5, lyr: 1.7, vul: 1, sge: 2.3, del: 2.5, cyg: 1.0 };
// 1度あたりのピクセル（星図は画面より大きく、指でずらして見る）
const K = Number(process.env.K ?? 13);
const NAMES = { aql: 'わし座', lyr: 'こと座', vul: 'こぎつね座', sge: 'や座', del: 'いるか座', cyg: 'はくちょう座' };
const RA0 = 20.0, DEC0 = 24;
const raw = (ra, dec) => ({ x: -(ra - RA0) * 15 * Math.cos((DEC0 * Math.PI) / 180), y: -(dec - DEC0) });
const stars = STARS.map(([id, name, con, ra, dec, chapter, eff]) => ({ id, name, con, chapter, eff, ...raw(ra, dec) }));
for (const con of Object.keys(SPREAD)) {
  const g = stars.filter((s) => s.con === con);
  const cx = g.reduce((a, s) => a + s.x, 0) / g.length, cy = g.reduce((a, s) => a + s.y, 0) / g.length;
  for (const s of g) { s.x = cx + (s.x - cx) * SPREAD[con]; s.y = cy + (s.y - cy) * SPREAD[con]; }
}
const xs = stars.map((s) => s.x), ys = stars.map((s) => s.y);
const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
const k = K;
const MAP_W = (maxX - minX) * k + 80, MAP_H = (maxY - minY) * k + 100;
for (const s of stars) { s.x = 40 + (s.x - minX) * k; s.y = 60 + (s.y - minY) * k; }
// 近すぎる星の組（タップしにくい）
const close = [];
for (let i = 0; i < stars.length; i++) for (let j = i + 1; j < stars.length; j++) { const d = Math.hypot(stars[i].x - stars[j].x, stars[i].y - stars[j].y); if (d < 34) close.push(`${stars[i].id}-${stars[j].id}:${d.toFixed(0)}`); }
console.log('map', MAP_W.toFixed(0), 'x', MAP_H.toFixed(0), 'close', close.join(' '));
const by = Object.fromEntries(stars.map((s) => [s.id, s]));
for (const e of EDGES) for (const id of e.split('-')) if (!by[id]) throw new Error('no star ' + id);
writeFileSync(dir + 'sky.json', JSON.stringify({ stars, edges: EDGES, names: NAMES, scale: k }));

const COLOR = { a: '#ffb35c', h: '#ff7a7a', m: '#c99bff', p: '#7ab8ff', d: '#9be0b0', s: '#ffe36e' };
const SHORT = { a: '攻', h: 'H', m: '魔', p: 'M', d: '防', s: '速' };
const ALLY = { hero: '#ff9a4a', akari: '#ff8fc0', mio: '#ffd84a' };
const OWNER = { hero: 'ハルト', akari: 'あかり', mio: 'みお' };
const rnd = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return ((h >>> 0) % 10000) / 10000; };
function mapSvg(chapter) {
  const show = (s) => s.chapter <= chapter;
  const W = MAP_W.toFixed(0), H = MAP_H.toFixed(0);
  let o = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0f2c"/><stop offset="0.65" stop-color="#151a45"/><stop offset="1" stop-color="#1d1830"/></linearGradient>
<filter id="b"><feGaussianBlur stdDeviation="2.2"/></filter><filter id="b2"><feGaussianBlur stdDeviation="22"/></filter></defs>
<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  // 天の川：はくちょう座の背骨からわし座へ
  const mw = ['deneb', 'sadr', 'etaCyg', 'albireo', 'alphaSge', 'deltaAql', 'lambdaAql'].map((id) => by[id]);
  o += `<path d="M ${mw.map((p) => `${p.x} ${p.y}`).join(' L ')}" stroke="#9fb8ff" stroke-opacity="0.12" stroke-width="170" stroke-linejoin="round" stroke-linecap="round" fill="none" filter="url(#b2)"/>`;
  for (let i = 0; i < 380; i++) o += `<circle cx="${(rnd('x' + i) * MAP_W).toFixed(1)}" cy="${(rnd('y' + i) * MAP_H).toFixed(1)}" r="${(0.4 + rnd('r' + i) * 1.1).toFixed(2)}" fill="#fff" opacity="${(0.2 + rnd('o' + i) * 0.5).toFixed(2)}"/>`;
  // 星座の名前は、星座ごとに決めた星のそば（重ならないように）
  const LABEL_AT = { aql: ['lambdaAql', 0, 34], lyr: ['vega', 0, -40], vul: ['anser', -58, 4], sge: ['gammaSge', 30, -26], del: ['sualocin', -10, -44], cyg: ['kappaCyg', 0, -34] };
  for (const [con, name] of Object.entries(NAMES)) {
    const [id, dx, dy] = LABEL_AT[con]; const st = by[id]; if (!show(st)) continue;
    o += `<text x="${st.x + dx}" y="${st.y + dy}" fill="#c8d4ff" font-size="12" text-anchor="middle" opacity="0.6" font-family="sans-serif" letter-spacing="3">${name}</text>`;
  }
  const opened = new Set(['altair', 'alshain', 'tarazed', 'muAql']);
  const nbs = (id) => EDGES.flatMap((e) => { const [a, b] = e.split('-'); return a === id ? [b] : b === id ? [a] : []; });
  const can = new Set(stars.filter((s) => !opened.has(s.id) && show(s) && nbs(s.id).some((x) => opened.has(x))).map((s) => s.id));
  for (const e of EDGES) {
    const [a, b] = e.split('-').map((id) => by[id]); if (!show(a) || !show(b)) continue;
    const lit = opened.has(a.id) && opened.has(b.id); const bridge = a.con !== b.con;
    if (lit) o += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#ffb35c" stroke-width="7" opacity="0.2" filter="url(#b)"/>`;
    o += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${lit ? '#ffcf8a' : '#9fb8e8'}" stroke-width="${lit ? 2.2 : 1.1}" opacity="${lit ? 0.95 : 0.45}" ${bridge && !lit ? 'stroke-dasharray="5 4"' : ''}/>`;
  }
  // 将来つなぐ場所（3章以降の星座へ）。[星, 向き x, 向き y, 先の星座]
  const FUTURE = [['lambdaAql', 0.2, 1, 'たて座・いて座'], ['kappaLyr', 1, -0.15, 'ヘルクレス座'], ['rhoCyg', -1, -0.3, 'ケフェウス座'], ['kappaCyg', 0.25, -1, 'りゅう座']];
  for (const [id, dx, dy, name] of FUTURE) {
    const st = by[id]; if (!show(st)) continue;
    const len = Math.hypot(dx, dy), ex = st.x + (dx / len) * 46, ey = st.y + (dy / len) * 46;
    o += `<line x1="${st.x}" y1="${st.y}" x2="${ex}" y2="${ey}" stroke="#9fb8e8" stroke-width="1" stroke-dasharray="2 5" opacity="0.45"/>`;
    o += `<text x="${ex + (dx / len) * 8}" y="${ey + (dy / len) * 8 + 4}" fill="#c8d4ff" font-size="12" text-anchor="middle" opacity="0.55" font-family="sans-serif">？</text>`;
  }
  for (const s of stars) {
    if (!show(s)) continue;
    const on = opened.has(s.id), c = can.has(s.id), al = on ? 1 : c ? 0.9 : 0.6;
    let color = '#fff', r = 6, label = '';
    const [kind, val] = s.eff.split(':');
    if (kind === 'start') { color = ALLY[val]; r = 12; label = OWNER[val]; }
    else if (kind === 'skill') { color = '#ffd76a'; r = 10; label = val; }
    else { const st = s.eff[0].toLowerCase(); const big = s.eff[0] !== st; color = COLOR[st]; r = big ? 8.5 : 6; label = SHORT[st] + s.eff.slice(1); }
    o += `<circle cx="${s.x}" cy="${s.y}" r="${r * 2.6}" fill="${color}" opacity="${(on ? 0.35 : 0.15) * al}" filter="url(#b)"/>`;
    if (kind === 'skill') { const a = r * 1.5, w = r * 0.35; o += `<path d="M ${s.x} ${s.y - a} L ${s.x + w} ${s.y - w} L ${s.x + a} ${s.y} L ${s.x + w} ${s.y + w} L ${s.x} ${s.y + a} L ${s.x - w} ${s.y + w} L ${s.x - a} ${s.y} L ${s.x - w} ${s.y - w} Z" fill="${color}" opacity="${al}"/>`; }
    else o += `<circle cx="${s.x}" cy="${s.y}" r="${r}" fill="${color}" opacity="${al}"/><circle cx="${s.x}" cy="${s.y}" r="${r * 0.45}" fill="#fff" opacity="${al}"/>`;
    if (/^[AHMPDS]/.test(s.eff)) o += `<circle cx="${s.x}" cy="${s.y}" r="${r + 3}" fill="none" stroke="#fff" stroke-width="0.9" opacity="${0.6 * al}"/>`;
    if (c) o += `<circle cx="${s.x}" cy="${s.y}" r="${r + 7}" fill="none" stroke="#f2c45a" stroke-width="1.8" stroke-dasharray="3 3"/>`;
    o += `<text x="${s.x}" y="${s.y + r + 13}" fill="${on || c ? '#e8eefc' : '#a9bbd0'}" font-size="${kind === 'start' || kind === 'skill' ? 11 : 10}" text-anchor="middle" font-family="sans-serif" opacity="${Math.max(0.7, al)}">${label}</text>`;
    // 有名な星の名前は、星の右上（アルタイルは左上。隣のタラゼドと重ならないように）
    // 星ごとの名前の置き場所（[横, 縦, 寄せ方]）。アルタイルは真横の左、タラゼドは左上
    const NAME_AT = { altair: [-r - 6, 4, 'end'], tarazed: [-r - 4, -r - 2, 'end'] };
    const [nx, ny, anchor] = NAME_AT[s.id] ?? [r + 4, -r - 2, 'start'];
    if (['altair', 'vega', 'deneb', 'albireo', 'sualocin', 'tarazed', 'sadr'].includes(s.id)) o += `<text x="${s.x + nx}" y="${s.y + ny}" fill="#c8d4ff" font-size="9" text-anchor="${anchor}" font-family="sans-serif" opacity="0.75">${s.name}</text>`;
  }
  return o + '</svg>';
}
function phone(map, mode, chapter) {
  const areaH = 560, top = 50;
  let pos;
  if (mode === 'all') {
    const sc = Math.min(390 / MAP_W, areaH / MAP_H);
    pos = `left:${(390 - MAP_W * sc) / 2}px;top:0px;width:${MAP_W}px;height:${MAP_H}px;transform:scale(${sc});transform-origin:0 0`;
  } else {
    const a = by.altair; const ox = Math.min(0, Math.max(390 - MAP_W, 195 - a.x)), oy = Math.min(0, Math.max(areaH - MAP_H, areaH * 0.55 - a.y));
    pos = `left:${ox}px;top:${oy}px`;
  }
  const note = mode === 'all' ? '全体図（縮めて表示。実際は指でずらして見る）' : '実際の大きさ（アルタイルのまわり）。指でずらすと全体が見られる';
  return `<div style="position:relative;width:390px;height:844px;background:#0a0f2c;overflow:hidden;font-family:sans-serif">
<div style="position:absolute;left:0;top:${top}px;width:390px;height:${areaH}px;overflow:hidden"><div style="position:absolute;${pos}">${map}</div></div>
<div style="position:absolute;left:16px;top:12px;color:#f2c45a;font-size:18px;font-weight:bold">星図</div><div style="position:absolute;right:16px;top:10px;color:#f2c45a;font-size:22px;font-weight:bold">12</div><div style="position:absolute;right:52px;top:18px;color:#9fb3c8;font-size:11px">星の砂</div>
<div style="position:absolute;left:12px;top:620px;width:342px;height:86px;padding:12px;border-radius:8px;background:#1d2544;border:1px solid #3e5670;color:#e8eefc;font-size:12px;line-height:1.7">アルタイル（わし座）：ハルトの出発点<br><span style="color:#9fb3c8;font-size:11px">${chapter >= 2 ? '星図が広がった！　はくちょう座が現れた' : '（1章：はくちょう座はまだ見えない）'}<br>点線は、星座と星座をつなぐ橋</span></div>
<div style="position:absolute;left:12px;top:724px;width:116px;height:40px;border-radius:8px;background:#30465c;color:#fff;font-size:13px;text-align:center;line-height:40px">ハルト</div><div style="position:absolute;left:137px;top:724px;width:116px;height:40px;border-radius:8px;background:#22303f;color:#cfd8e3;font-size:13px;text-align:center;line-height:40px">あかり</div><div style="position:absolute;left:262px;top:724px;width:116px;height:40px;border-radius:8px;background:#22303f;color:#cfd8e3;font-size:13px;text-align:center;line-height:40px">みお</div>
<div style="position:absolute;left:0;top:790px;width:390px;text-align:center;color:#7f8fa8;font-size:10px">${note}</div></div>`;
}
writeFileSync(dir + 'all1.html', phone(mapSvg(1), 'all', 1));
writeFileSync(dir + 'all2.html', phone(mapSvg(2), 'all', 2));
writeFileSync(dir + 'real2.html', phone(mapSvg(2), 'real', 2));
console.log('stars', stars.length, 'edges', EDGES.length, 'px/deg', k.toFixed(1));
