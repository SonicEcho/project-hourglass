// 戦闘画面の敵の絵（段階37）。敵の id → 台帳の絵の id。ここにない敵（1-1 の縁日の砂嵐など）は、今までどおり丸い図形で描く。
// 絵は正方形・白い背景を抜いた全身の絵（docs/ART.md の 5-3 の 13 の共通部分）。画面では敵の丸の大きさに合わせて縮める
export const ENEMY_ART: Record<string, string> = {
  tinNoise: 'enemy.tin_noise',
  phoneNoise: 'enemy.phone_noise',
  ramuneNoise: 'enemy.ramune_noise',
  menkoNoise: 'enemy.menko_noise',
  bicycleLord: 'enemy.bicycle_boss',
  // 段階40：2-3 の負け戦のカイ
  kai: 'enemy.kai',
};
