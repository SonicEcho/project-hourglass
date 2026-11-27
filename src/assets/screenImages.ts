import { A11_REWORK_IMAGES, ALLY_FACE, AREA_BATTLES, AREAS, ASSETS, BACKDROPS, BARK_CAST, BARKS, BOND_EVENTS, CAST, CGS, DAILY_HUBS, ENEMY_ART, ENEMY_CUT_INS, PARTY_PHOTO, PORTRAIT_PARTS, RETURN_VISITS, SCENES, SIDE_EVENTS, SLICE_FLOW } from '../data';
import { sceneImageIds } from './sceneImages';
import type { FlowEvent } from '../core';

// 会話のほかの画面（探索・戦闘・日常・返す・拠点）で使う絵の id（段階150）。
// 段階148 で会話の画面だけ「その場面の絵だけを待つ」形にした。ほかの画面は全部の絵（約420枚）を待っていたので、
// 探索から再開すると絵が増えるほど待ちが延びた。ここで画面ごとに使う絵を集め、その絵だけを待つ（ui/waitImages.ts）。
// 立ち絵（重さのほとんど）は、会話の画面が自分の場面の分だけを待つので、ここには顔のタブ・写真・戦闘の顔の分しか入れない

/** 中の値を深くたどり、名前が key の文字の値を集める（区画の敵・ぬし・番人の戦闘、日常の場所の背景など） */
function collect(value: unknown, key: string, out: Set<string>): void {
  if (Array.isArray(value)) {
    for (const v of value) collect(v, key, out);
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [k, v] of Object.entries(value)) {
    if (k === key && typeof v === 'string') out.add(v);
    else collect(v, key, out);
  }
}

/** 会話の立ち絵の名前と表情から、絵の id（まだない表情は、代わりに出す表情の絵も） */
function portraitIds(castName: string, face: string): string[] {
  const def = CAST[castName];
  if (!def?.portrait) return [];
  return [face, def.fallback?.[face]].filter((f): f is string => !!f).map((f) => `${def.portrait}.${def.faces[f] ?? f}`);
}

/** どの画面でも使う絵：拠点・休憩所のタイル、スナップの絵、仲間の顔（顔のタブ・並びの写真・戦闘の行動順の丸）、戦闘のひとことの顔 */
export function commonImages(): string[] {
  const ids = new Set<string>();
  for (const a of ASSETS) if (a.kind === 'image' && (a.id.startsWith('tile.') || a.id.startsWith('snap.'))) ids.add(a.id);
  for (const id of [...Object.values(ALLY_FACE), ...Object.values(PARTY_PHOTO)]) ids.add(id);
  for (const [ally, name] of Object.entries(BARK_CAST)) {
    const faces = new Set<string>();
    collect(BARKS[ally], 'face', faces);
    for (const f of faces) for (const id of portraitIds(name, f)) ids.add(id);
  }
  return [...ids];
}

/** その戦闘の敵の絵と、敵の固有技のカットインの立ち絵 */
export function battleImages(battleIds: string[]): string[] {
  const ids = new Set<string>();
  for (const b of battleIds) {
    for (const e of AREA_BATTLES[b]?.enemies ?? []) {
      const art = ENEMY_ART[e.id];
      if (art) ids.add(art);
      for (const c of Object.values(ENEMY_CUT_INS[e.id] ?? {})) for (const id of portraitIds(c.cast, c.face)) ids.add(id);
    }
  }
  return [...ids];
}

/** 探索：区画の部屋の地図と、区画で出る戦闘（敵・ぬし・番人・狩り）の絵。ほかの画面と共通の絵も */
export function exploreImages(areaId: string): string[] {
  const area = AREAS[areaId];
  if (!area) return commonImages();
  const battles = new Set<string>();
  collect(area, 'battle', battles);
  const maps = area.rooms.map((r) => r.image).filter((x): x is string => !!x);
  // 一緒に歩く仲間（段階267）：歩く二頭身の絵
  const walkers = ['hero', 'akari', 'mio', 'sayoko', 'hayase'].map((id) => `sprite.walk_${id}`);
  // 新しい1-1 の試し（段階271・272）：部屋の絵と小物。試しの切り替えはその場で変えられるので、1-1 では両方読む
  const rework = areaId === 'a11' ? A11_REWORK_IMAGES : [];
  return [...new Set([...maps, ...rework, ...battleImages([...battles]), ...walkers, ...commonImages()])];
}

/** 背景の名前から絵の id */
function backdropImages(names: Iterable<string>): string[] {
  return [...names].map((n) => BACKDROPS[n]?.image).filter((x): x is string => !!x);
}

/** 日常：その日の場所の背景。拠点（レストピア）へも行けるので、拠点の背景も。段階246：場所が2つ以上の日は町の地図の絵 */
export function dailyImages(eventId: string): string[] {
  const names = new Set<string>(['library']);
  collect(DAILY_HUBS[eventId], 'backdrop', names);
  const map = (DAILY_HUBS[eventId]?.places.length ?? 0) > 1 ? ['map.town'] : [];
  return [...new Set([...map, ...backdropImages(names), ...commonImages()])];
}

/** 拠点（レストピア）：背景と、タイル・顔 */
export function hubImages(): string[] {
  return [...new Set([...backdropImages(['library']), ...commonImages()])];
}

/** 区画を返す：その時間の景色（記憶の再生）と、スナップの絵 */
export function returnImages(areaId: string): string[] {
  const memory = AREAS[areaId]?.memory;
  return [...new Set([...backdropImages(memory ? [memory] : []), ...commonImages()])];
}

/**
 * 読み込みのひとまとまり（段階250）：章の中を、時間を返す（または物語の戦闘で区画が終わる）所で区切った出来事の並び。
 * 章の始めと、区画を返した後に、次のまとまりで使う絵を読み込み画面で読む。返す id は、そのまとまりの最初の出来事の id
 */
export function loadSegment(eventId: string): { id: string; chapter: string; name: string; events: FlowEvent[] } | null {
  for (const ch of SLICE_FLOW) {
    let start = 0;
    for (let i = 0; i < ch.events.length; i++) {
      const e = ch.events[i];
      const last = i === ch.events.length - 1 || e.kind === 'return' || e.kind === 'battle';
      if (!last) continue;
      const events = ch.events.slice(start, i + 1);
      if (events.some((x) => x.id === eventId)) return { id: events[0].id, chapter: ch.id, name: ch.name, events };
      start = i + 1;
    }
  }
  return null;
}

/**
 * まとまりで使う絵（段階250）：読み込み画面でまとめて読み、ほかの絵は捨てる。
 * 流れの会話、昼の日常（場所の背景・町の地図と、そこで見られる場面）、探索（地図・戦闘・区画の場面）、返す景色、物語の戦闘、
 * そのまとまりの日に出始める絆の出来事と寄り道、まとまりの区画を返した翌日の場面、どの画面でも使う絵
 */
export function segmentImages(events: FlowEvent[]): string[] {
  const out = new Set<string>(commonImages());
  const scenes = new Set<string>();
  const areas = new Set<string>();
  let firstDay = Infinity;
  let lastDay = 0;
  const day = (d?: number) => {
    if (d === undefined) return;
    firstDay = Math.min(firstDay, d);
    lastDay = Math.max(lastDay, d);
  };
  for (const e of events) {
    if (e.kind === 'dialogue') scenes.add(e.id);
    if (e.kind === 'day') day(e.day);
    if (e.kind === 'daily') {
      for (const id of dailyImages(e.id)) out.add(id);
      collect(DAILY_HUBS[e.id], 'scene', scenes);
      day(DAILY_HUBS[e.id]?.day);
    }
    if ((e.kind === 'explore' || e.kind === 'return') && e.area) {
      areas.add(e.area);
      for (const id of e.kind === 'explore' ? exploreImages(e.area) : returnImages(e.area)) out.add(id);
      collect(AREAS[e.area], 'scene', scenes);
    }
    if (e.kind === 'battle' && e.battle) for (const id of battleImages([e.battle])) out.add(id);
  }
  // 絆の出来事と寄り道は、このまとまりの日に出始める物（前から持ち越した話は、その場面の前に短く読む）
  const inRange = (from: number) => from >= firstDay && from <= lastDay;
  for (const list of Object.values(BOND_EVENTS)) for (const b of list) if (inRange(b.from)) scenes.add(b.id);
  for (const list of Object.values(SIDE_EVENTS)) for (const s of list) if (inRange(s.from)) scenes.add(s.id);
  // 返した翌日の場面（次のまとまりの最初の日に出る）
  for (const v of RETURN_VISITS) if (areas.has(v.area)) scenes.add(v.id);
  const data = { cast: CAST, backdrops: BACKDROPS, cgs: CGS, parts: PORTRAIT_PARTS };
  for (const id of scenes) {
    const scene = SCENES.find((s) => s.id === id);
    if (scene) for (const img of sceneImageIds(scene, data)) out.add(img);
  }
  return [...out];
}

/** 画面の名前と渡す中身から、その画面で待つ絵（わからない画面は全部の絵を待つ：ALL を返す） */
export function screenImages(key: string, data: Record<string, unknown>, all: string[]): string[] {
  const area = typeof data.area === 'string' ? data.area : '';
  if (key === 'Explore') return exploreImages(area);
  if (key === 'Return') return returnImages(area);
  if (key === 'Daily' && typeof data.event === 'string') return dailyImages(data.event);
  if (key === 'Hub') return hubImages();
  // 砂の底（段階207）：顔と、掘る二頭身の人たち（段階210・211。選ぶ窓の後に、選んだ人の絵を待つ）
  if (key === 'SandBottom') return [...commonImages(), ...['hero', 'akari', 'mio', 'sayoko', 'hayase'].map((id) => (id === 'hero' ? 'sprite.dig_hero' : `sprite.dig_${id}`))];
  const encounter = data.encounter as { battle?: string } | undefined;
  if (key === 'Battle' && encounter?.battle) return [...new Set([...battleImages([encounter.battle]), ...commonImages()])];
  return all;
}
