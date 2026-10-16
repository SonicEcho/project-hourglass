// 昼の日常（段階24）：場所を選んで移り、場所に出ている印をタップして出来事を見る。Phaser に依存しない。
// プロローグの屋台めぐりも同じ形（場所が1つで、全部の印を見ると次へ進む）

/** 印の種類（画面の印の形と色に使う） */
export type SpotMark =
  /** 必ず見る出来事 */
  | 'main'
  /** 絆の出来事 */
  | 'bond'
  /** 小話 */
  | 'talk'
  /** 屋台（プロローグ） */
  | 'stall'
  /** ここへ行くと日が進む（夕暮れの時計屋など） */
  | 'go'
  /** 返し終えた区画に入り直して、素材を集める（段階43。回数を使わず、時間も進まない） */
  | 'hunt';

export interface DailySpot {
  /** 印の名前（見たかどうかを、この名前で覚える。会話の場面がある時は、場面の id と同じにする） */
  id: string;
  /** 見る会話の場面の id（なければ、印を選ぶとすぐ次へ進む。ends の印） */
  scene?: string;
  label: string;
  /** 「けいかくひょう」に書く名前（子どものりくの字なので、ひらがな。なければ label。段階32b 調整3） */
  planLabel?: string;
  mark: SpotMark;
  /** 場所の絵の上の位置（390×844 の座標） */
  x: number;
  y: number;
  /** 必ず見る出来事（全部見ないと、日を進められない） */
  required?: boolean;
  /** 見たら、その日の日常を終えて次へ進む（夕暮れになる） */
  ends?: boolean;
  /** ends の印を選ぶ前に確かめる言葉 */
  confirm?: string;
  /** 絆の出来事の相手（段階35。resolveHub が絆の出来事から作る印に付く） */
  partner?: string;
  /** この印の前に見ておく印の id（段階36。「工場の後に楽器店」。その印がその日に出ていて、まだ見ていなければ、まだ選べない） */
  after?: string;
  /** 見た時にもらえるごほうびのギア（段階39。返した翌日に持ち主がくれる物など） */
  gears?: string[];
}

export interface DailyPlace {
  id: string;
  name: string;
  /** 背景（会話の BACKDROPS の id） */
  backdrop: string;
  /** 地図の上の位置（390×844 の座標） */
  mapX: number;
  mapY: number;
  spots: DailySpot[];
}

export interface DailyHub {
  /** 物語の流れの出来事の id と同じ */
  id: string;
  /** 「1日目　放課後」など、上に出す言葉 */
  time: string;
  places: DailyPlace[];
  /** 必ず見る出来事を全部見たら、自動で次へ進む（屋台めぐり） */
  finishWhenRequiredSeen?: boolean;
  /** 画面の端に「計画表」を出す（屋台めぐり。必ず見る出来事の一覧に、見たものは丸） */
  plan?: string;
  /** 何日目か（段階35。絆の出来事の「何日目から」と比べる） */
  day?: number;
  /** 昼に選べる回数（段階35。絆の出来事と小話を1つ見るごとに1回使う。書かなければ何回でも） */
  picks?: number;
  /** その日に会える相手（段階35。相手ごとに、まだ見ていない一番前の絆の出来事の印を出す） */
  partners?: string[];
}

/** 場所の位置と見た目（印を除いたもの。段階35：町の地図の場所は、町じゅうで同じ位置） */
export type DailyPlaceInfo = Omit<DailyPlace, 'spots'>;

/**
 * 絆の出来事（段階35）。相手ごとに順番に並べ、まだ見ていない一番前のものが、その日に会える時に出る。
 * id は会話の場面の id と同じ（見たかどうかを、この id で覚える）
 */
export interface BondEvent {
  id: string;
  /** 題（「消せない写真」など） */
  title: string;
  /** 印の名前（「屋上（あかり）」など） */
  label: string;
  /** 何日目から出るか */
  from: number;
  /** 出る場所の id（町の地図の場所） */
  place: string;
  /** 場所の絵の上の位置 */
  x: number;
  y: number;
}

/**
 * 返した翌日に持ち主に会う出来事（段階36）。区画の時間を返した次の日の昼に、必ず見る出来事として、その場所に出る。
 * id は会話の場面の id と同じ（見たかどうかを、この id で覚える）
 */
export interface ReturnVisit {
  /** 返した区画の id */
  area: string;
  id: string;
  /** 印の名前（「来る日じゃないのに」など） */
  label: string;
  /** 出る場所の id（町の地図の場所） */
  place: string;
  /** 場所の絵の上の位置 */
  x: number;
  y: number;
  /** 見た時にもらえるごほうびのギア（段階39。2-1 の翌日に、いさむが最後に削った歯車をくれる） */
  gears?: string[];
}

/**
 * 印の今の状態：見た／見られる／まだ見られない（必ず見る出来事が残っている時の、日を進める印）／
 * 今日はもう時間がない（段階35。昼に選べる回数を使い切った後の、絆の出来事と小話）
 */
export type SpotState = 'seen' | 'open' | 'locked' | 'spent';

/** 見たかどうかを覚える値の名前（物語で覚えた値に入れて、セーブする） */
export function seenKey(spotId: string): string {
  return `見た:${spotId}`;
}

export function isSeen(vars: Record<string, string>, spotId: string): boolean {
  return vars[seenKey(spotId)] === '1';
}

/** 見たことを覚えた、新しい値の一覧 */
export function markSeen(vars: Record<string, string>, spotId: string): Record<string, string> {
  return { ...vars, [seenKey(spotId)]: '1' };
}

export function allSpots(hub: DailyHub): DailySpot[] {
  return hub.places.flatMap((p) => p.spots);
}

/** まだ見ていない、必ず見る出来事 */
export function requiredLeft(hub: DailyHub, vars: Record<string, string>): DailySpot[] {
  return allSpots(hub).filter((s) => s.required && !isSeen(vars, s.id));
}

/** この印の前に見ておく、まだ見ていない印（日を進める印は、必ず見る出来事の残り。段階36：after の印） */
export function blockers(hub: DailyHub, vars: Record<string, string>, spot: DailySpot): DailySpot[] {
  if (spot.ends) return requiredLeft(hub, vars);
  if (!spot.after || isSeen(vars, spot.after)) return [];
  return allSpots(hub).filter((s) => s.id === spot.after);
}

export function spotState(hub: DailyHub, vars: Record<string, string>, spot: DailySpot): SpotState {
  if (isSeen(vars, spot.id) && !spot.ends) return 'seen';
  if (blockers(hub, vars, spot).length > 0) return 'locked';
  if (usesPick(spot) && picksLeft(hub, vars) <= 0) return 'spent';
  return 'open';
}

// ---- 誰と過ごすか（段階35） ----

/** その日に会った相手を覚える値の名前（値は、見た絆の出来事の id） */
export function metKey(hubId: string, partner: string): string {
  return `会った:${hubId}:${partner}`;
}

/** 昼に選べる回数を使う印（絆の出来事と小話。必ず見る出来事は使わない） */
export function usesPick(spot: DailySpot): boolean {
  return !spot.required && !spot.ends && (spot.mark === 'bond' || spot.mark === 'talk');
}

/** 今日、回数を使った数（resolveHub で作った日常で数える） */
export function picksUsed(hub: DailyHub, vars: Record<string, string>): number {
  return allSpots(hub).filter((s) => usesPick(s) && (s.partner ? vars[metKey(hub.id, s.partner)] === s.id : isSeen(vars, s.id))).length;
}

/** 今日、あと何回選べるか（回数を決めていない日常は、いくらでも） */
export function picksLeft(hub: DailyHub, vars: Record<string, string>): number {
  if (hub.picks === undefined) return Infinity;
  return Math.max(0, hub.picks - picksUsed(hub, vars));
}

/**
 * その日に、相手の印に出す絆の出来事。今日もう会っていれば、その出来事（見た印になる）。
 * まだなら、見ていない一番前の出来事。それが「何日目から」より前なら、出さない（先の出来事を飛ばして出さない）
 */
export function bondEventFor(hub: DailyHub, vars: Record<string, string>, partner: string, events: readonly BondEvent[]): BondEvent | undefined {
  const met = vars[metKey(hub.id, partner)];
  if (met) return events.find((e) => e.id === met);
  const next = events.find((e) => !isSeen(vars, e.id));
  if (!next || next.from > (hub.day ?? 0)) return undefined;
  return next;
}

/** 絆の深さ：相手の、見た絆の出来事の数 */
export function bondLevel(vars: Record<string, string>, events: readonly BondEvent[]): number {
  return events.filter((e) => isSeen(vars, e.id)).length;
}

// ---- 返した翌日に持ち主に会う（段階36） ----

/** その日に出る、返した翌日の出来事（returnDays：区画の id → 返した日。flow.ts の returnDays） */
export function visitsFor(hub: DailyHub, visits: readonly ReturnVisit[], returnDays: Readonly<Record<string, number>>): ReturnVisit[] {
  if (hub.day === undefined) return [];
  return visits.filter((v) => returnDays[v.area] !== undefined && returnDays[v.area] + 1 === hub.day);
}

/** 返した翌日の出来事の印（必ず見る出来事） */
export function visitSpot(v: ReturnVisit): DailySpot {
  return { id: v.id, scene: v.id, label: v.label, mark: 'main', x: v.x, y: v.y, required: true, ...(v.gears ? { gears: v.gears } : {}) };
}

/** 印を見終えた時にもらえるごほうびのギア（段階39）。もう見た印・ごほうびのない印は空（同じごほうびを2回渡さないよう、markVisited の前に呼ぶ） */
export function spotGears(hub: DailyHub, vars: Record<string, string>, spot: DailySpot): string[] {
  return spot.gears && spotState(hub, vars, spot) !== 'seen' ? spot.gears : [];
}

/**
 * その日の日常を、今の値で組み立てる（段階35）：会える相手ごとに、絆の出来事の印をその場所に足す。
 * 段階36：返した翌日の出来事（visits。visitsFor で選んだもの）も、必ず見る出来事としてその場所の先頭に足す。
 * 段階43：狩りの入口の印（hunt）も、その場所に足す。
 * 日常のデータにない場所は町の地図（town）から足す（日を進める印のある場所より前に入れる）。印のない場所は出さない
 */
export function resolveHub(
  hub: DailyHub,
  vars: Record<string, string>,
  bonds: Readonly<Record<string, readonly BondEvent[]>>,
  town: Readonly<Record<string, DailyPlaceInfo>>,
  visits: readonly ReturnVisit[] = [],
  hunt?: { place: string; spot: DailySpot },
): DailyHub {
  const places: DailyPlace[] = hub.places.map((p) => ({ ...p, spots: [...p.spots] }));
  /** その場所（日常のデータになければ、町の地図から足す） */
  const placeOf = (id: string): DailyPlace | undefined => {
    const found = places.find((p) => p.id === id);
    if (found) return found;
    const info = town[id];
    if (!info) return undefined;
    const place: DailyPlace = { ...info, spots: [] };
    const goAt = places.findIndex((p) => p.spots.some((s) => s.ends));
    places.splice(goAt < 0 ? places.length : goAt, 0, place);
    return place;
  };
  for (const v of visits) placeOf(v.place)?.spots.unshift(visitSpot(v));
  // 狩りの入口（段階43。返した区画がある時だけ、呼ぶ側が渡す）
  if (hunt) placeOf(hunt.place)?.spots.push(hunt.spot);
  for (const partner of hub.partners ?? []) {
    const ev = bondEventFor(hub, vars, partner, bonds[partner] ?? []);
    if (!ev) continue;
    placeOf(ev.place)?.spots.push({ id: ev.id, scene: ev.id, label: ev.label, mark: 'bond', x: ev.x, y: ev.y, partner });
  }
  return { ...hub, places: places.filter((p) => p.spots.length > 0) };
}

/** 見終えた印を覚えた、新しい値（絆の出来事は、今日会った相手も覚える） */
export function markVisited(hub: DailyHub, vars: Record<string, string>, spot: DailySpot): Record<string, string> {
  const next = markSeen(vars, spot.id);
  return spot.partner ? { ...next, [metKey(hub.id, spot.partner)]: spot.id } : next;
}

/** 印を見終えた後、その日の日常を終えるか（hub は resolveHub で組み立てたもの） */
export function finishesAfter(hub: DailyHub, vars: Record<string, string>, spot: DailySpot): boolean {
  if (spot.ends) return true;
  const after = markVisited(hub, vars, spot);
  if (requiredLeft(hub, after).length > 0) return false;
  if (hub.finishWhenRequiredSeen) return true;
  // 選べる回数を使い切り、必ず見る出来事も見たら、夕暮れへ（段階35）
  return hub.picks !== undefined && picksLeft(hub, after) <= 0;
}

/** 書き間違い（場面の重なり、終わり方がない、など）を、全部まとめて返す（テストで使う） */
export function checkDailyHub(hub: DailyHub): string[] {
  const errors: string[] = [];
  const spots = allSpots(hub);
  if (hub.places.length === 0) errors.push(`${hub.id}：場所がない`);
  const seen = new Set<string>();
  for (const s of spots) {
    if (seen.has(s.id)) errors.push(`${hub.id}：同じ名前の印が2つある：${s.id}`);
    seen.add(s.id);
    if (!s.scene && !s.ends) errors.push(`${hub.id}：場面も終わりもない印：${s.id}`);
  }
  const canEnd = spots.some((s) => s.ends) || (hub.finishWhenRequiredSeen && spots.some((s) => s.required));
  if (!canEnd) errors.push(`${hub.id}：日常を終える印がない`);
  return errors;
}

/** 返した翌日の出来事の書き間違い（場所がない、同じ id、同じ区画が2つ）を、全部まとめて返す（テストで使う。段階36） */
export function checkVisits(visits: readonly ReturnVisit[], town: Readonly<Record<string, DailyPlaceInfo>>): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const areas = new Set<string>();
  for (const v of visits) {
    if (ids.has(v.id)) errors.push(`同じ id の返した翌日の出来事が2つある：${v.id}`);
    if (areas.has(v.area)) errors.push(`同じ区画の返した翌日の出来事が2つある：${v.area}`);
    ids.add(v.id);
    areas.add(v.area);
    if (!town[v.place]) errors.push(`町の地図にない場所：${v.id} ${v.place}`);
  }
  return errors;
}

/** 絆の出来事の書き間違い（場所がない、同じ id、「何日目から」が前の出来事より早い）を、全部まとめて返す（テストで使う。段階35） */
export function checkBonds(bonds: Readonly<Record<string, readonly BondEvent[]>>, town: Readonly<Record<string, DailyPlaceInfo>>): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const [partner, events] of Object.entries(bonds)) {
    events.forEach((e, i) => {
      if (ids.has(e.id)) errors.push(`${partner}：同じ id の絆の出来事が2つある：${e.id}`);
      ids.add(e.id);
      if (!town[e.place]) errors.push(`${partner}：町の地図にない場所：${e.id} ${e.place}`);
      if (i > 0 && e.from < events[i - 1].from) errors.push(`${partner}：前の出来事より早く出る：${e.id}`);
    });
  }
  return errors;
}
