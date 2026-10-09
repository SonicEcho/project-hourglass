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
