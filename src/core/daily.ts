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
  | 'go';

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
}

/** 印の今の状態：見た／見られる／まだ見られない（必ず見る出来事が残っている時の、日を進める印） */
export type SpotState = 'seen' | 'open' | 'locked';

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

export function spotState(hub: DailyHub, vars: Record<string, string>, spot: DailySpot): SpotState {
  if (isSeen(vars, spot.id) && !spot.ends) return 'seen';
  if (spot.ends && requiredLeft(hub, vars).length > 0) return 'locked';
  return 'open';
}

/** 印を見終えた後、その日の日常を終えるか */
export function finishesAfter(hub: DailyHub, vars: Record<string, string>, spot: DailySpot): boolean {
  if (spot.ends) return true;
  return !!hub.finishWhenRequiredSeen && requiredLeft(hub, markSeen(vars, spot.id)).length === 0;
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
