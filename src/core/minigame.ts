// タイミングでタップする小さな遊び（段階24）の判定。Phaser に依存しない。
// 画面は時間（ミリ秒）を渡して聞くだけにして、当たり外れはここで決める（テストできるように）
import { nextRandom } from './rng';

/** 射的：的が左右にゆれ、真ん中に来た瞬間にタップすると当たる */
export interface ShootingParams {
  /** 的が1往復する時間（ミリ秒）。1発ごとに speedUp 倍に速くなる */
  periodMs: number;
  speedUp: number;
  /** 当たりになる、真ん中からのずれ（ゆれ幅を1として） */
  window: number;
  /** 撃てる数 */
  shots: number;
}

/**
 * 的の位置（-1 が左の端、0 が真ん中、1 が右の端）。tMs はその1発の構え始めからの時間、shot は何発目か（0から）。
 * 構えた時は右の端にいて、真ん中を通って左右にゆれる（構えてすぐ撃っても当たらないように）
 */
export function shootingTargetX(params: ShootingParams, tMs: number, shot = 0): number {
  const period = params.periodMs * Math.pow(params.speedUp, shot);
  return Math.cos((2 * Math.PI * tMs) / period);
}

/** その瞬間に撃ったら当たるか */
export function isShootingHit(params: ShootingParams, tMs: number, shot = 0): boolean {
  return Math.abs(shootingTargetX(params, tMs, shot)) <= params.window;
}

/** 金魚すくい：金魚がときどき水面に近づいて光る。光っている間にタップするとすくえる。光っていない時にタップするとポイが弱る */
export interface GoldfishParams {
  /** 光るまでの間（ミリ秒。この間でばらつく） */
  gapMinMs: number;
  gapMaxMs: number;
  /** 光っている時間（ミリ秒） */
  glowMs: number;
  /** 光っていない時に何回タップするとポイが破れるか */
  tries: number;
  /** 遊べる時間（ミリ秒）。過ぎたら、すくえなかったことにする */
  limitMs: number;
}

export interface GlowWindow {
  start: number;
  end: number;
}

/** 金魚が光る時間の並び（シード付きの乱数で決める。同じシードなら同じ並び） */
export function goldfishSchedule(params: GoldfishParams, seed: number): GlowWindow[] {
  const out: GlowWindow[] = [];
  let t = 0;
  let state = seed >>> 0;
  for (;;) {
    const [r, next] = nextRandom(state);
    state = next;
    t += params.gapMinMs + r * (params.gapMaxMs - params.gapMinMs);
    if (t >= params.limitMs) return out;
    out.push({ start: t, end: t + params.glowMs });
    t += params.glowMs;
  }
}

/** その瞬間に光っている金魚（なければ null） */
export function glowingAt(schedule: GlowWindow[], tMs: number): GlowWindow | null {
  return schedule.find((w) => tMs >= w.start && tMs < w.end) ?? null;
}

/** 金魚すくいの1回のタップの結果 */
export type GoldfishTap = 'caught' | 'weaker' | 'broken';

/** これまでに外した回数 misses の時に、tMs でタップした結果 */
export function goldfishTap(params: GoldfishParams, schedule: GlowWindow[], tMs: number, misses: number): GoldfishTap {
  if (glowingAt(schedule, tMs)) return 'caught';
  return misses + 1 >= params.tries ? 'broken' : 'weaker';
}
