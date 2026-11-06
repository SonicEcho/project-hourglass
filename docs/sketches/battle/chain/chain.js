// 並べてつなぐ戦闘の見た目のイメージ（作り込まない見本）。各 html が SCENE を決めてから読む
const A = '../../../../public/assets/';
const X = (t) => 18 + 36 * t; // フィルムの時刻→横の位置（目盛りはマスの境目）
const $ = (h) => document.body.insertAdjacentHTML('beforeend', h);
const S = window.SCENE;

// 上の帯
$(`<div class="abs top"></div>
<div class="abs rec"><b>●</b> REC</div>
<div class="abs round">ROUND 01</div>
<div class="abs form skew"><span class="unskew">金魚すくいの屋台 ／ 店じまい</span></div>`);

// 敵の場
const foes = [
  { x: 4, art: 'ramune_noise', name: 'ラムネノイズ', weak: '物', wc: '#c9c9c9', trait: 'はじける', hp: S === 'play' ? 0.15 : 1,
    intent: { t: 4, n: '大はじけ', p: S === 'plan' ? '全体 40 → ポーズで 20' : '全体 40', big: true } },
  { x: 131, art: 'table_noise', name: 'ちゃぶ台ノイズ', weak: '火', wc: '#ff6a2a', trait: '盾', hp: S === 'play' ? 0.8 : 1,
    intent: { t: 5, n: 'のしかかり', p: '単体 30' } },
  { x: 258, art: 'goldfish_noise', name: '金魚ノイズ', weak: '雷', wc: '#ffd23f', trait: '逃げる', hp: S === 'play' ? 0.75 : 1,
    intent: { t: S === 'plan' ? 9 : 9, n: '逃げる', p: S === 'plan' ? '7 → 押して 9' : '押されて 9' } },
];
$(`<div class="abs stage"><div class="abs bg" style="background-image:url(${A}backgrounds/goldfish_stall.webp)"></div><div class="abs shade"></div><div class="abs scan"></div>
${foes.map((f, i) => `<div class="abs foe" style="left:${f.x}px">
  <div class="abs intent ${f.intent.big ? 'big' : ''}" style="${S === 'play' && f.intent.big ? 'opacity:.35' : ''}"><div class="t">${f.intent.t}</div><div class="n">${f.intent.n}</div><div class="p">${f.intent.p}</div></div>
  <div class="abs trait">${f.trait}</div>
  <img class="abs art" src="${A}enemies/${f.art}.webp">
  <div class="abs name">${f.name}</div>
  <div class="abs weak" style="background:${f.wc};color:#000">${f.weak}</div>
  <div class="abs hp ${S === 'plan' && i === 0 ? 'ghost' : ''}"><i style="width:${f.hp * 100}%"></i></div>
  ${i === 0 && S === 'plan' ? `<div class="abs chip focus plan" style="left:40px;top:230px">◎パノラマ</div><div class="abs chip filter plan" style="left:2px;top:206px">ポーズ <b>あと2</b></div>` : ''}
  ${i === 0 && S === 'play' ? `<div class="abs chip filter" style="left:2px;top:208px">ポーズ <b>あと2</b></div>` : ''}
  ${i === 2 && S === 'plan' ? `<div class="abs chip filter plan" style="left:2px;top:208px">押す →9</div>` : ''}
</div>`).join('')}
</div>`);

// フィルム
const lanes = { foe: 28, hero: 60, akari: 80, mio: 100 };
const plan = [
  { who: 'hero', from: 0, to: 1, lbl: 'パノラマ', n: 1 },
  { who: 'hero', from: 1, to: 3, lbl: '斬る', n: 4 },
  { who: 'hero', from: 3, to: 7, lbl: 'とどめの一閃', n: 7 },
  { who: 'akari', from: 0, to: 2, lbl: 'ポーズ', n: 3 },
  { who: 'akari', from: 2, to: 5, lbl: 'ファイア', n: 6 },
  { who: 'mio', from: 0, to: 1, lbl: '静電気', n: 2 },
  { who: 'mio', from: 1, to: 4, lbl: 'サンダー', n: 5 },
];
const face = { hero: 'hero_determined', akari: 'akari_smile', mio: 'mio_serious' };
let film = `<div class="abs film"><div class="abs holes" style="top:1px"></div><div class="abs holes" style="bottom:1px"></div><div class="abs ticks">`;
for (let t = 0; t <= 10; t++) film += `<div class="tick ${S === 'play' && t === 3 ? 'now' : ''}" style="left:${36 * t}px">${t}</div>`;
film += `</div>`;
for (const y of [lanes.foe + 13, lanes.hero + 11, lanes.akari + 11, lanes.mio + 11]) film += `<div class="abs lane" style="top:${y}px"></div>`;
// 敵の予定
const ef = [{ t: 4, art: 'ramune_noise', big: true }, { t: 5, art: 'table_noise' }, { t: 9, art: 'goldfish_noise' }];
if (S === 'plan') film += `<div class="abs efoe stop" style="left:${X(7)}px;top:${lanes.foe}px;opacity:.3"><img src="${A}enemies/goldfish_noise.webp"></div>
  <div class="abs" style="left:${X(7) + 14}px;top:${lanes.foe + 6}px;width:${36 * 2 - 28}px;height:2px;border-top:2px dashed #ff9db0"></div>`;
for (const e of ef) film += `<div class="abs efoe ${e.big ? 'big' : ''} ${S === 'play' && e.big ? 'stop' : ''}" style="left:${X(e.t)}px;top:${lanes.foe}px"><img src="${A}enemies/${e.art}.webp"></div>`;
for (const p of plan) {
  const past = S === 'play' && p.to <= 3;
  film += `<div class="abs bar ${p.who}" style="left:${X(p.from) + 2}px;top:${lanes[p.who]}px;width:${36 * (p.to - p.from) - 4}px;${past ? 'filter:brightness(.5)' : ''}">
    ${p.to - p.from > 1 ? `<div class="face" style="background-image:url(${A}portraits/${face[p.who]}.webp)"></div>` : ''}<div class="lbl" style="${p.to - p.from > 1 ? '' : 'font-size:8px;padding-left:2px'}">${p.lbl}</div></div>
    <div class="abs arrow" style="left:${X(p.to) - 2}px;top:${lanes[p.who] - 6}px"></div>`;
  if (S === 'plan') film += `<div class="abs order" style="left:${X(p.to) - 2}px;top:${lanes[p.who] + 2}px">${p.n}</div>`;
}
film += `</div>`;
$(film);

// 仲間
const allies = [
  { id: 'hero', x: 10, nm: 'ハルト', c: '#ffd23f', hp: 1, n: '112/112' },
  { id: 'akari', x: 136, nm: 'あかり', c: '#ff6a4a', hp: 0.86, n: '84/98' },
  { id: 'mio', x: 262, nm: 'みお', c: '#3aa0ff', hp: 1, n: '90/90' },
];
const allyHtml = allies.map((a) => `<div class="abs ally" style="left:${a.x}px;--c:${a.c}"><div class="abs plate"></div>
  <div class="abs por" style="background-image:url(${A}portraits/${face[a.id]}.webp)"></div>
  <div class="abs nm">${a.nm}</div><div class="abs hp"><i style="width:${a.hp * 100}%;background:${a.c}"></i></div><div class="abs num">HP ${a.n}</div>
  ${S === 'plan' ? `<div class="abs done">あと${a.id === 'hero' ? 3 : a.id === 'akari' ? 5 : 6}マス</div>` : ''}</div>`).join('');

if (S === 'plan') {
  $(allyHtml);
  $(`<div class="abs tabs"><div class="tab on"><span>手札・連携技 ★</span></div><div class="tab"><span>技</span></div><div class="tab"><span>？</span></div></div>
  <div class="abs linkstrip"><div class="in"><b>★ 連携技 アフターグロウ</b>ハルト＋あかり／斬る＋ファイア</div></div>`);
  const cards = [
    { ty: 'フォーカス', c: '#b36bff', cn: 'パノラマ', ef: '次の一撃が<br>全員に広がる', w: 1, ph: 'search', used: true },
    { ty: 'フィルター', c: '#19d3c5', cn: 'ポーズ', ef: '大技を<br>止める 2R', w: 2, ph: 'joker', used: true },
    { ty: 'フィルター', c: '#19d3c5', cn: 'ヒート', ef: '終わりごとに<br>熱ダメージ 3R', w: 1, ph: 'fireChip', lift: true },
    { ty: 'フィニッシュ', c: '#ff2d55', cn: '決めの一枚', ef: 'ダウン中なら<br>2倍', w: 3, ph: 'heavyBlow' },
    { ty: 'あかり専用', c: '#ff8a1a', cn: '線香花火', ef: '敵全体に火', w: 3, ph: 'wideShot', sig: true },
  ];
  $(`<div class="abs hand">${cards.map((k, i) => `<div class="abs card ${k.used ? 'used' : ''} ${k.lift ? 'lift' : ''} ${k.sig ? 'sig' : ''}" style="left:${i * 76}px;top:${k.lift ? -10 : 6}px;--c:${k.c};transform:rotate(${(i - 2) * 2.5}deg)">
    <div class="abs ty">${k.ty}</div><div class="abs ph" style="background-image:url(${A}snaps/${k.ph}.webp)"></div>
    <div class="abs cn">${k.cn}</div><div class="abs ef">${k.ef}</div>
    <div class="abs w">${[1, 2, 3, 4].map((n) => `<i class="${n <= k.w ? '' : 'off'}"></i>`).join('')}</div>
    ${k.used ? '<div class="abs" style="left:6px;top:40px;background:#fff;color:#000;font-size:11px;padding:1px 6px;transform:rotate(-10deg)">置いた</div>' : ''}
  </div>`).join('')}</div>
  <div class="abs btns"><div class="abs btn" style="left:0;width:92px"><span>1つ戻す</span></div><div class="abs btn" style="left:100px;width:92px"><span>全部やめる</span></div>
  <div class="abs btn go" style="left:202px;width:170px"><span><b>●</b> REC 実行</span></div></div>
  <div class="abs" style="left:226px;top:766px;font-size:11px;color:#ffd23f">いま決着見込み：7マス目 ★★★</div>`);
}

if (S === 'play') {
  // 再生の線（3マス目）
  $(`<div class="abs head" style="left:${X(3) - 1}px;top:310px;height:122px"></div><div class="abs headtag" style="left:${X(3) - 16}px;top:300px">PLAY</div>`);
  // 斬るの軌跡：フィルムのハルトの棒の終わり → ラムネ
  const sx = X(3), sy = 370, tx = 68, ty = 160;
  const len = Math.hypot(tx - sx, ty - sy), ang = Math.atan2(ty - sy, tx - sx) * 180 / Math.PI;
  $(`<div class="abs streak" style="left:${sx}px;top:${sy}px;width:${len}px;transform:rotate(${ang}deg)"></div>
  <div class="abs burst" style="left:${tx}px;top:${ty}px"></div>
  <div class="abs dmg" style="left:20px;top:100px">33</div>
  <div class="abs stk weak" style="left:84px;top:96px">WEAK!</div>
  <div class="abs stk down" style="left:70px;top:206px">DOWN</div>
  <div class="abs wave" style="left:150px;top:150px"></div><div class="abs wave" style="left:278px;top:150px"></div>
  <div class="abs dmg" style="left:160px;top:106px;font-size:30px;text-shadow:3px 3px 0 #b36bff">22</div>
  <div class="abs dmg" style="left:290px;top:106px;font-size:30px;text-shadow:3px 3px 0 #b36bff">22</div>
  <div class="abs stk stop" style="left:14px;top:50px;font-size:13px">大はじけ 阻止！</div>
  <div class="abs cutin" style="top:244px;height:58px"><div class="por" style="background-image:url(${A}portraits/hero_determined.webp)"></div>
    <div class="big">パノラマ！</div><div class="sub">斬るの一撃が、ほかの敵みんなに広がった</div></div>`);
  // 動いた順の一覧
  const rows = [
    ['1', 'ハルト　パノラマ → ラムネノイズ', 'dim'],
    ['2', 'みお　静電気 → 金魚ノイズ　押した！ 7→9', 'dim'],
    ['3', 'あかり　ポーズ → ラムネノイズ', 'dim'],
    ['4', 'ハルト　斬る → ラムネ　WEAK! DOWN　パノラマ', 'now'],
    ['5', 'みお　サンダー → 金魚ノイズ', ''],
    ['敵', 'ラムネノイズ　大はじけ　→ ダウンで止まる', ''],
    ['6', 'あかり　ファイア → ちゃぶ台ノイズ', ''],
    ['敵', 'ちゃぶ台ノイズ　のしかかり', ''],
    ['7', 'ハルト　とどめの一閃 → 金魚ノイズ', ''],
  ];
  $(`<div class="abs log">${rows.map((r, i) => `<div class="row ${r[2]}" style="top:${14 + i * 30}px"><i>${r[0]}</i>${r[1]}</div>`).join('')}</div>
  <div class="abs btns"><div class="abs btn" style="left:0;width:150px"><span>▶▶ 早送り</span></div><div class="abs btn" style="left:160px;width:212px"><span>結果まで飛ばす</span></div></div>`);
}
