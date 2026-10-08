import type { GoldfishParams, ShootingParams } from '../core/minigame';

// プロローグの小さな遊び（段階24）の数値。失敗しても話は進む（おまけをもらえる）。7歳の遊びなので、やさしめにする

/** 射的：ゆれる的が真ん中に来た瞬間にタップ。3発のうち1発当たれば成功 */
export const SHOOTING: ShootingParams = {
  periodMs: 1800,
  speedUp: 0.9,
  window: 0.25,
  shots: 3,
};

/** 金魚すくい：金魚が水面に近づいて光った瞬間にタップ。光っていない時に3回タップするとポイが破れる */
export const GOLDFISH: GoldfishParams = {
  gapMinMs: 1100,
  gapMaxMs: 2300,
  glowMs: 520,
  tries: 3,
  limitMs: 15000,
};
