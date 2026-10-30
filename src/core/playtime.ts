// プレイ時間の記録（段階63。デバッグの時だけ使う）：どこが長く、どこが短いかを調べるため、
// 物語の出来事・画面・場面（会話の場面、戦闘、探索の部屋、日常）ごとに、いた時間を足していく。Phaser に依存しない。
// 時間を拾うのは src/debug/playtime.ts（画面が表に出ていて、最近触っている間だけ、1秒ごとに今の場所へ足す）

/** 時間を足す場所：出来事（物語の流れの id）・画面（Phaser の画面の名前）・場面（会話の場面の id、戦闘の id など） */
export interface PlaytimeLabel {
  event: string;
  scene: string;
  detail: string;
}

export interface PlaytimeEntry extends PlaytimeLabel {
  ms: number;
  /** その場所に来た回数（続けている間は1回） */
  visits: number;
}

export interface PlaytimeLog {
  /** 場所の鍵 → 足した時間 */
  entries: Record<string, PlaytimeEntry>;
  /** 初めて来た順の、場所の鍵 */
  order: string[];
  /** 最後に足した場所の鍵（続けて同じ場所なら、来た回数を増やさない） */
  last?: string;
}

export function emptyPlaytime(): PlaytimeLog {
  return { entries: {}, order: [] };
}

export function playtimeKey(label: PlaytimeLabel): string {
  return `${label.event}|${label.scene}|${label.detail}`;
}

/** 今の場所に ms を足す */
export function addPlaytime(log: PlaytimeLog, label: PlaytimeLabel, ms: number): PlaytimeLog {
  if (!(ms > 0)) return log;
  const key = playtimeKey(label);
  const before = log.entries[key];
  const visit = log.last !== key ? 1 : 0;
  const entry: PlaytimeEntry = before ? { ...before, ms: before.ms + ms, visits: before.visits + visit } : { ...label, ms, visits: 1 };
  return { entries: { ...log.entries, [key]: entry }, order: before ? log.order : [...log.order, key], last: key };
}

/** 途切れた（画面を隠した、しばらく触っていない）：次に足す時は、同じ場所でも来た回数を増やす */
export function breakPlaytime(log: PlaytimeLog): PlaytimeLog {
  const { last: _, ...rest } = log;
  return rest;
}

/** セーブから読んだ記録を整える（形が違えば空） */
export function normalizePlaytime(raw: unknown): PlaytimeLog {
  if (typeof raw !== 'object' || raw === null) return emptyPlaytime();
  const r = raw as Record<string, unknown>;
  const entries: Record<string, PlaytimeEntry> = {};
  if (typeof r.entries === 'object' && r.entries !== null) {
    for (const [key, v] of Object.entries(r.entries as Record<string, unknown>)) {
      const e = v as Record<string, unknown> | null;
      if (e && typeof e.event === 'string' && typeof e.scene === 'string' && typeof e.detail === 'string' && typeof e.ms === 'number' && e.ms >= 0 && typeof e.visits === 'number') {
        entries[key] = { event: e.event, scene: e.scene, detail: e.detail, ms: e.ms, visits: e.visits };
      }
    }
  }
  const order = Array.isArray(r.order) ? r.order.filter((k): k is string => typeof k === 'string' && k in entries) : [];
  for (const k of Object.keys(entries)) if (!order.includes(k)) order.push(k);
  return { entries, order };
}

/** 分と秒（1時間を超えたら時も） */
export function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}時間${pad(m)}分${pad(sec)}秒` : `${m}分${pad(sec)}秒`;
}

/** 画面の名前の呼び名 */
const SCENE_NAMES: Record<string, string> = {
  Dialogue: '会話',
  Battle: '戦闘',
  Explore: '探索',
  Daily: '日常',
  Flow: '流れ',
  Return: '返す',
  Growth: '星図',
  Weapon: '武器',
  Navi: 'ムーブメント',
  Album: 'アルバム',
  Hub: '拠点',
  Exchange: '交換所',
  Lost: '落とし物',
  TalkArchive: '町の小話',
  Title: 'タイトル',
  Result: '結果',
};

/**
 * 記録を読める文にする：合計、出来事ごとの合計と中身（物語の流れの順）、画面の種類ごとの合計、長かった場所の順。
 * events は物語の流れの出来事（順番と名前）。流れにない出来事は最後に並べる
 */
export function formatPlaytime(log: PlaytimeLog, events: { id: string; title: string }[], top = 20): string {
  const all = log.order.map((k) => log.entries[k]).filter(Boolean);
  const total = all.reduce((n, e) => n + e.ms, 0);
  const lines: string[] = [`プレイ時間の記録　合計 ${formatDuration(total)}`, ''];
  const label = (e: PlaytimeEntry) => `${SCENE_NAMES[e.scene] ?? e.scene}${e.detail ? `：${e.detail}` : ''}`;
  const titles = new Map(events.map((e) => [e.id, e.title]));
  const eventIds = [...events.map((e) => e.id).filter((id) => all.some((x) => x.event === id)), ...[...new Set(all.map((x) => x.event))].filter((id) => !titles.has(id))];
  lines.push('■ 出来事ごと（物語の流れの順）');
  for (const id of eventIds) {
    const items = all.filter((x) => x.event === id);
    const sum = items.reduce((n, x) => n + x.ms, 0);
    lines.push(`${formatDuration(sum)}　${titles.get(id) ?? id}`);
    for (const x of [...items].sort((a, b) => b.ms - a.ms)) lines.push(`　　${formatDuration(x.ms)}　${label(x)}${x.visits > 1 ? `（${x.visits}回）` : ''}`);
  }
  lines.push('', '■ 画面の種類ごと');
  const byScene = new Map<string, number>();
  for (const x of all) byScene.set(x.scene, (byScene.get(x.scene) ?? 0) + x.ms);
  for (const [scene, ms] of [...byScene].sort((a, b) => b[1] - a[1])) lines.push(`${formatDuration(ms)}　${SCENE_NAMES[scene] ?? scene}（${total > 0 ? Math.round((ms / total) * 100) : 0}%）`);
  lines.push('', `■ 長かった所（上から${top}）`);
  for (const x of [...all].sort((a, b) => b.ms - a.ms).slice(0, top)) lines.push(`${formatDuration(x.ms)}　${label(x)}　〔${titles.get(x.event) ?? x.event}〕`);
  return lines.join('\n');
}
