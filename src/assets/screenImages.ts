import { ALLY_FACE, AREA_BATTLES, AREAS, ASSETS, BACKDROPS, BARK_CAST, BARKS, CAST, DAILY_HUBS, ENEMY_ART, ENEMY_CUT_INS, PARTY_PHOTO } from '../data';

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
  for (const list of Object.values(area.hunt?.tables ?? {})) for (const b of list) battles.add(b);
  const maps = area.rooms.map((r) => r.image).filter((x): x is string => !!x);
  return [...new Set([...maps, ...battleImages([...battles]), ...commonImages()])];
}

/** 背景の名前から絵の id */
function backdropImages(names: Iterable<string>): string[] {
  return [...names].map((n) => BACKDROPS[n]?.image).filter((x): x is string => !!x);
}

/** 日常：その日の場所の背景。拠点（レストピア）へも行けるので、拠点の背景も */
export function dailyImages(eventId: string): string[] {
  const names = new Set<string>(['library']);
  collect(DAILY_HUBS[eventId], 'backdrop', names);
  return [...new Set([...backdropImages(names), ...commonImages()])];
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

/** 画面の名前と渡す中身から、その画面で待つ絵（わからない画面は全部の絵を待つ：ALL を返す） */
export function screenImages(key: string, data: Record<string, unknown>, all: string[]): string[] {
  const area = typeof data.area === 'string' ? data.area : '';
  if (key === 'Explore') return exploreImages(area);
  if (key === 'Return') return returnImages(area);
  if (key === 'Daily' && typeof data.event === 'string') return dailyImages(data.event);
  if (key === 'Hub') return hubImages();
  const encounter = data.encounter as { battle?: string } | undefined;
  if (key === 'Battle' && encounter?.battle) return [...new Set([...battleImages([encounter.battle]), ...commonImages()])];
  return all;
}
