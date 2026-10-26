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
  // 段階96：本気のカイ（3章のリベンジ）も同じ絵
  kaiRevenge: 'enemy.kai',
  // 2026-10-26：ChatGPT Plus で作った 2-1〜3-1 の敵（docs/ART_QUEUE.md の D）
  gearNoise: 'enemy.gear_noise',
  screwNoise: 'enemy.screw_noise',
  tubeNoise: 'enemy.tube_noise',
  abacusNoise: 'enemy.abacus_noise',
  latheLord: 'enemy.lathe_boss',
  flipPhoneNoise: 'enemy.flip_phone_noise',
  stickerNoise: 'enemy.sticker_noise',
  boomboxNoise: 'enemy.boombox_noise',
  metronomeNoise: 'enemy.metronome_noise',
  ampLord: 'enemy.amp_boss',
  ballNoise: 'enemy.ball_noise',
  petNoise: 'enemy.pet_noise',
  megaphoneNoise: 'enemy.megaphone_noise',
  jugNoise: 'enemy.jug_noise',
  scoreboardLord: 'enemy.scoreboard_boss',
  fanNoise: 'enemy.fan_noise',
  coilNoise: 'enemy.coil_noise',
  radioNoise: 'enemy.radio_noise',
  tableNoise: 'enemy.table_noise',
  postboxNoise: 'enemy.postbox_noise',
  trainLord: 'enemy.train_boss',
  lanternNoise: 'enemy.lantern_noise',
  pinwheelNoise: 'enemy.pinwheel_noise',
  candyNoise: 'enemy.candy_noise',
  phonographNoise: 'enemy.phonograph_noise',
  yaguraLord: 'enemy.yagura_boss',
  earphoneNoise: 'enemy.earphone_noise',
  selfieNoise: 'enemy.selfie_noise',
  tapiocaNoise: 'enemy.tapioca_noise',
  diplomaNoise: 'enemy.diploma_noise',
  yosegakiNoise: 'enemy.yosegaki_noise',
  crossingLord: 'enemy.crossing_boss',
};

/** 部位がなくても、1体で出る時はボスの大きさで描く敵（段階108。テストプレイのメモ 32：2-3 の負け戦のカイが小さかった） */
export const ENEMY_ART_BIG: string[] = ['kai'];

/**
 * ぬしの部位の印を置く所（段階89）：ボスの絵（正方形）の中の位置を、幅・高さに対する割合で。3つめは名前の札を出す向き（書かなければ右）。
 * ここにないぬし（絵がまだない）は、丸い体の上のほうに部位を横に並べる
 */
export const ENEMY_PART_SPOTS: Record<string, Record<string, [x: number, y: number, side?: 'left' | 'right']>> = {
  // ポイの腕の札は、絵に重ならないよう左に出す（段階108。テストプレイのメモ 10）
  goldfishBowlLord: { poiArm: [0.13, 0.66, 'left'], bowl: [0.47, 0.42] },
  bicycleLord: { frontWheel: [0.24, 0.5], bell: [0.3, 0.14] },
  // 段階96：本気のカイの枠の刃（絵の左上で掲げている四角い枠の、左下の角）
  kaiRevenge: { frameBlade: [0.3, 0.2, 'left'] },
  // 2026-10-26：届いた絵に合わせた（旋盤は右の刃物台と真ん中のベルト、アンプは真ん中の大きなスピーカーと左のコード、スコアボードは上の得点板と左のネット）
  latheLord: { toolPost: [0.86, 0.6], belt: [0.42, 0.66, 'left'] },
  ampLord: { speaker: [0.52, 0.3], cord: [0.14, 0.42, 'left'] },
  scoreboardLord: { scoreboard: [0.6, 0.27], backstop: [0.24, 0.6, 'left'] },
  trainLord: { chimney: [0.3, 0.2], wheel: [0.62, 0.74] },
  yaguraLord: { drum: [0.52, 0.22], lanternRope: [0.72, 0.64] },
  crossingLord: { alarm: [0.55, 0.2], barrier: [0.12, 0.42, 'left'] },
};

/**
 * 敵の固有技のカットイン（段階107c）：重要なキャラの専用の特殊技を放つ時に、その人の立ち絵を斜めの帯に大きく出す。
 * 敵の id → 技の id → 出し方。cast と face は会話の立ち絵（`CAST`）の名前と表情。line はカットインの台詞（なければ出さない）
 */
export interface EnemyCutIn {
  cast: string;
  face: string;
  tag: string;
  color: number;
  line?: string;
}

const KAI_FRAME_CUT: EnemyCutIn = { cast: 'カイ', face: '余裕', tag: 'F R A M E   C U T', color: 0x9fdcff, line: 'その一コマ、もらうぞ' };

export const ENEMY_CUT_INS: Record<string, Record<string, EnemyCutIn>> = {
  kai: { frameCut: KAI_FRAME_CUT },
  kaiRevenge: { frameCut: KAI_FRAME_CUT },
};
