// 戦闘画面の敵の絵（段階37）。敵の id → 台帳の絵の id。ここにない敵は、今までどおり丸い図形で描く。
// 絵は正方形・白い背景を抜いた全身の絵（docs/ART.md の 5-3 の 13 の共通部分）。画面では敵の丸の大きさに合わせて縮める
export const ENEMY_ART: Record<string, string> = {
  tinNoise: 'enemy.tin_noise',
  phoneNoise: 'enemy.phone_noise',
  ramuneNoise: 'enemy.ramune_noise',
  menkoNoise: 'enemy.menko_noise',
  bicycleLord: 'enemy.bicycle_boss',
  // 1-1 の縁日の砂嵐とぬし（2026-10-19）
  goldfishNoise: 'enemy.goldfish_noise',
  balloonNoise: 'enemy.balloon_noise',
  maskNoise: 'enemy.mask_noise',
  cottonNoise: 'enemy.cotton_noise',
  goldfishBowlLord: 'enemy.goldfish_bowl_boss',
  // 段階40：2-3 の負け戦のカイ
  kai: 'enemy.kai',
};

/**
 * ぬしの部位の印を置く所（段階89）：ボスの絵（正方形）の中の位置を、幅・高さに対する割合で。3つめは名前の札を出す向き（書かなければ右）。
 * ここにないぬし（絵がまだない）は、丸い体の上のほうに部位を横に並べる
 */
export const ENEMY_PART_SPOTS: Record<string, Record<string, [x: number, y: number, side?: 'left' | 'right']>> = {
  goldfishBowlLord: { poiArm: [0.13, 0.66], bowl: [0.47, 0.42] },
  bicycleLord: { frontWheel: [0.24, 0.5], bell: [0.3, 0.14] },
};
