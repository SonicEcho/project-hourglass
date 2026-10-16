import { nextRandom } from './rng';

// 記憶の「薄れ」（段階57。docs/milestones/M2.md の段階57の詳細）：同じ記憶を続けてたどるほど、その回の実入りが減る。
// 記憶（区画）ごとに「その日に入った回数」を数え、1日たつごとに1つ減らす。物語の変数 `記憶の濃さ:区画` に「回数@日」で覚える

/** 物語の変数の名前 */
export function fadeKey(areaId: string): string {
  return `記憶の濃さ:${areaId}`;
}

/** 今日の時点で、この記憶に入った回数（1日たつごとに1つ戻る。0なら濃いまま） */
export function fadeLevel(vars: Record<string, string>, areaId: string, today: number): number {
  const m = /^(\d+)@(\d+)$/.exec(vars[fadeKey(areaId)] ?? '');
  if (!m) return 0;
  const passed = Math.max(0, today - Number(m[2]));
  return Math.max(0, Number(m[1]) - passed);
}

/** 次に入った時の実入りの割合。rates を使い切っていたら null（今日はもう入れない） */
export function fadeRate(rates: readonly number[], level: number): number | null {
  return level < rates.length ? rates[level] : null;
}

/** 記憶に入る：その回の割合と、回数を1つ進めた変数。入れなければ null */
export function enterFade(vars: Record<string, string>, areaId: string, today: number, rates: readonly number[]): { rate: number; vars: Record<string, string> } | null {
  const level = fadeLevel(vars, areaId, today);
  const rate = fadeRate(rates, level);
  if (rate === null) return null;
  return { rate, vars: { ...vars, [fadeKey(areaId)]: `${level + 1}@${today}` } };
}

/** 素材を薄れの割合で減らす：1つずつ、割合の確率で残す（同じ seed なら同じ結果。割合1なら全部残す） */
export function thinItems(items: readonly string[], rate: number, seed: number): string[] {
  if (rate >= 1) return [...items];
  let rng = seed >>> 0;
  return items.filter(() => {
    const [value, next] = nextRandom(rng);
    rng = next;
    return value < rate;
  });
}
