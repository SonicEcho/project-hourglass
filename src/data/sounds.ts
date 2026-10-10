// 音の名前（段階19）。ファイルと入手元は台帳（assets.ts）に書く。ここは画面から使う名前と、BGM のくり返し方だけ

/** 効果音（台帳の id） */
export const SE = {
  /** ボタンを押す */
  tap: 'se.tap',
  /** 味方の攻撃（斬る） */
  slash: 'se.slash',
  /** 敵の攻撃（打撃） */
  hit: 'se.hit',
  heal: 'se.heal',
  /** 探索で宝箱を開ける */
  chest: 'se.chest',
  /** 探索で敵の印に触れる */
  encounter: 'se.encounter',
  // 段階31c：台本の効果音（台本の名前との対応は dialogue.ts の SCRIPT_SE）
  crowd: 'se.crowd',
  classroom: 'se.classroom',
  paper: 'se.paper',
  shot: 'se.shot',
  miss: 'se.miss',
  water: 'se.water',
  splash: 'se.splash',
  poiBreak: 'se.poi_break',
  firework: 'se.firework',
  drum: 'se.drum',
  footsteps: 'se.footsteps',
  alarm: 'se.alarm',
  pan: 'se.pan',
  chime: 'se.chime',
  doorSlam: 'se.door_slam',
  storeEnter: 'se.store_enter',
  bagOpen: 'se.bag_open',
  shutter: 'se.shutter',
  send: 'se.send',
  bell: 'se.bell',
  phone: 'se.phone',
  noise: 'se.noise',
  hangUp: 'se.hang_up',
  doorOpen: 'se.door_open',
} as const;

/**
 * 効果音ごとの大きさ（効果音の音量を1とした時。書かなければ1）。
 * 段階31c で足した台本の効果音は、ボタンや戦闘の音より大きく聞こえたので下げる（段階32b、開発者の確認）。
 * 元のファイルが特に大きいもの（目覚まし・着信・入店チャイム・コルク）は、もう少し下げる
 */
export const SE_GAIN: Partial<Record<string, number>> = {
  [SE.crowd]: 0.6,
  [SE.classroom]: 0.6,
  [SE.paper]: 0.6,
  [SE.shot]: 0.45,
  [SE.miss]: 0.6,
  [SE.water]: 0.6,
  [SE.splash]: 0.6,
  [SE.poiBreak]: 0.6,
  [SE.firework]: 0.6,
  [SE.drum]: 0.6,
  [SE.footsteps]: 0.6,
  [SE.alarm]: 0.4,
  [SE.pan]: 0.6,
  [SE.chime]: 0.5,
  [SE.doorSlam]: 0.55,
  [SE.storeEnter]: 0.45,
  [SE.bagOpen]: 0.6,
  [SE.shutter]: 0.6,
  [SE.send]: 0.6,
  [SE.bell]: 0.6,
  [SE.phone]: 0.4,
  [SE.noise]: 0.55,
  [SE.hangUp]: 0.55,
  [SE.doorOpen]: 0.6,
};

/**
 * 環境音（段階32b 調整3）：背景が出ている間、小さく鳴り続ける音（屋台の並ぶ参道の人混み）。
 * 台帳の短い音（人混みは4秒）を、少し高さを変えながら重ねて鳴らし続け、同じ音のくり返しに聞こえないようにする。
 * gain は効果音の音量を1とした時の大きさ、everySec は次の音を重ね始めるまでの間（秒。少しばらつかせる）、fadeSec は始めと終わりにふわっと変える時間
 */
export const AMBIENCE = { gain: 0.3, everySec: 2.2, jitterSec: 0.5, rateMin: 0.92, rateMax: 1.08, fadeSec: 0.8 } as const;

/** BGM（台帳の id） */
export const BGM = {
  title: 'bgm.title',
  festival: 'bgm.festival',
} as const;

/**
 * BGM のくり返す区間（秒）。書かなければ曲の全体をくり返す。
 * Suno の曲は最初から最後までがループになっていないので、つなぎ目をここに書く（start まで1回だけ流し、start〜end をくり返す）
 */
export const BGM_LOOPS: Record<string, { start: number; end: number }> = {
  // 仮の BGM（scripts/placeholder_bgm.py が書き出した時に表示する値）。mp3 の頭の無音をよけるため、0.5秒から1周をくり返す
  [BGM.title]: { start: 0.5, end: 13.131565 },
  [BGM.festival]: { start: 0.5, end: 9.227256 },
};

/** 語りの文の、砂がさらさら落ちる音（段階31c。audio/sound.ts の playSand がその場で作る） */
export const SAND_SOUND = {
  /** 長さ（秒） */
  durationSec: 1.8,
  /** 1秒あたりの粒の数（多いと「さーっ」、少ないと「ぱらぱら」） */
  grainsPerSec: 900,
  fadeInSec: 0.3,
  fadeOutSec: 0.9,
  /** 大きさ（効果音の音量を1とした時） */
  gain: 0.9,
} as const;

/**
 * コマを手に入れた時の「キラン」（段階31c の残り）。音のファイルを使わず、澄んだ音を短く重ねて作る。
 * notes は鳴らす音の高さ（Hz）を順に。そろった時は all を鳴らす
 */
export const KOMA_SOUND = {
  /** ふだん（2音） */
  notes: [1318.5, 1975.5],
  /** そろった時（3音。少し華やかに） */
  all: [1318.5, 1661.2, 2637],
  /** 次の音までの間（秒） */
  stepSec: 0.075,
  /** 1音の長さ（減っていく余韻まで。秒） */
  ringSec: 0.6,
  /** 大きさ（効果音の音量を1とした時） */
  gain: 0.22,
} as const;

/**
 * 時間を返す時の、砂が昇る音（段階31c の残り）。砂の粒の音が、だんだん高く・濃くなり、下にうっすら昇る音を重ねる。
 * 長さは返す演出（コマが砂になって昇り、白く光る）に合わせる
 */
export const SAND_RISE_SOUND = {
  durationSec: 2.0,
  /** 1秒あたりの粒の数（始め → 終わり） */
  grainsFrom: 250,
  grainsTo: 1400,
  /** 粒の高さ（高い音だけ通す境目。始め → 終わり、Hz） */
  highFrom: 1800,
  highTo: 6500,
  /** 昇る音の高さ（始め → 終わり、Hz） */
  toneFrom: 330,
  toneTo: 1320,
  /** 昇る音の大きさ（粒の大きさを1とした時） */
  toneGain: 0.08,
  fadeInSec: 0.4,
  fadeOutSec: 0.5,
  /** 大きさ（効果音の音量を1とした時） */
  gain: 0.9,
} as const;
