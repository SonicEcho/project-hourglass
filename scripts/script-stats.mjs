// 台本の数え方（段階97。レビューの B1・B3）。使い方：node scripts/script-stats.mjs
// 話ごと（1-1、1-2…）に、ハルトの台詞のうち「……」で始まる割合と、表情「泣き笑い」の数を数えて、表で出す。
// 場面は、物語の流れの日（day）・昼の日常の日・区画を探索する日で、話に割り当てる。どこにも出てこない場面は「その他」
import { runnerImport } from 'vite';

const { module: data } = await runnerImport('./src/data/index.ts');
const { module: m1 } = await runnerImport('./src/data/scriptM1.ts');
const { module: m2 } = await runnerImport('./src/data/scriptM2.ts');
const { module: m3 } = await runnerImport('./src/data/scriptM3.ts');

/** 話の区切り（何日目から）。プロローグは0日目 */
const EPISODES = [
  [0, 'プロローグ'],
  [1, '1-1'],
  [4, '1-2'],
  [8, '2-1'],
  [12, '2-2'],
  [16, '2-3'],
  // 段階103：2章が1日延び、3章の日が1つずれた
  [22, '3-1'],
  [25, '祭りの夜'],
  [28, '3-2'],
  [32, 'カイとノア・3章の終わり'],
];
const episodeOf = (day) => [...EPISODES].reverse().find(([from]) => day >= from)?.[1] ?? 'プロローグ';

// 場面 → 日
const dayOf = new Map();
const put = (id, day) => {
  if (id && !dayOf.has(id)) dayOf.set(id, day);
};
let day = 0;
for (const chapter of data.SLICE_FLOW) {
  for (const e of chapter.events) {
    if (e.kind === 'day') day = e.day;
    if (e.kind === 'dialogue') put(e.id, day);
    if (e.kind === 'daily') {
      const hub = data.DAILY_HUBS[e.id];
      const d = hub?.day ?? day;
      for (const place of hub?.places ?? []) for (const s of place.spots) put(s.scene ?? s.id, d);
    }
    if (e.kind === 'explore' && e.area) {
      const area = data.AREAS[e.area];
      for (const t of area?.talkers ?? []) put(t.scene, day);
      for (const t of area?.triggers ?? []) put(t.scene, day);
      for (const en of area?.enemies ?? []) put(en.scene, day);
    }
  }
}
for (const list of Object.values(data.BOND_EVENTS)) for (const b of list) put(b.id, b.from);
// 返した翌日の場面は、その区画を返した日の次の日
const returnDay = new Map();
day = 0;
for (const chapter of data.SLICE_FLOW) for (const e of chapter.events) {
  if (e.kind === 'day') day = e.day;
  if (e.kind === 'return' && e.area) returnDay.set(e.area, day);
}
for (const v of data.RETURN_VISITS) if (returnDay.has(v.area)) put(v.id, returnDay.get(v.area) + 1);
const others = new Set();

const rows = new Map();
const row = (ep) => rows.get(ep) ?? rows.set(ep, { lines: 0, ellipsis: 0, teary: 0 }).get(ep);
const LINE = /^(\S+?)(?:〔([^〕]*)〕)?(?:（[^）]*）)?「(.*)/;
for (const text of [m1.SCRIPT_M1, m2.SCRIPT_M2, m3.SCRIPT_M3]) {
  let ep = 'その他';
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('# ')) {
      const id = line.slice(2).split(' ')[0];
      const d = dayOf.get(id);
      ep = d === undefined ? 'その他' : episodeOf(d);
      if (d === undefined) others.add(id);
      continue;
    }
    const m = LINE.exec(line);
    if (!m) continue;
    const r = row(ep);
    if (m[2] === '泣き笑い') r.teary++;
    if (m[1] === 'ハルト') {
      r.lines++;
      if (m[3].startsWith('……')) r.ellipsis++;
    }
  }
}

const order = [...EPISODES.map(([, n]) => n), 'その他'];
const out = ['| 話 | ハルトの台詞 | 「……」で始まる | 割合 | 泣き笑い（全員） |', '| --- | ---: | ---: | ---: | ---: |'];
let total = { lines: 0, ellipsis: 0, teary: 0 };
for (const ep of order) {
  const r = rows.get(ep);
  if (!r) continue;
  out.push(`| ${ep} | ${r.lines} | ${r.ellipsis} | ${r.lines ? Math.round((r.ellipsis / r.lines) * 100) : 0}% | ${r.teary} |`);
  total = { lines: total.lines + r.lines, ellipsis: total.ellipsis + r.ellipsis, teary: total.teary + r.teary };
}
out.push(`| 合計 | ${total.lines} | ${total.ellipsis} | ${Math.round((total.ellipsis / total.lines) * 100)}% | ${total.teary} |`);
console.log(out.join('\n'));
if (process.argv.includes('--others')) console.log([...others].join(' '));
