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
  // 段階68：持ち物が武器に変わる・光る（玄関のチャイムを使っていた所）と、自転車のベル（扉のベルで代わりにしていた所）
  awaken: 'se.awaken',
  sparkle: 'se.sparkle',
  bicycleBell: 'se.bicycle_bell',
  // 段階114：レストピアに切り替わる時（前は突風の扉の音）、2-2 のそろった手拍子と、演奏の後の歓声と拍手
  restopia: 'se.restopia',
  handclap: 'se.handclap',
  applause: 'se.applause',
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
  [SE.restopia]: 0.6,
  [SE.handclap]: 0.6,
  [SE.applause]: 0.6,
};

/**
 * 環境音（段階32b 調整3）：背景が出ている間、小さく鳴り続ける音（屋台の並ぶ参道の人混み）。
 * 台帳の短い音（人混みは4秒）を、少し高さを変えながら重ねて鳴らし続け、同じ音のくり返しに聞こえないようにする。
 * gain は効果音の音量を1とした時の大きさ（2026-10-10、祭の人混みが小さいと開発者から聞いて 0.3 → 0.5）、everySec は次の音を重ね始めるまでの間（秒。少しばらつかせる）、fadeSec は始めと終わりにふわっと変える時間
 */
export const AMBIENCE = { gain: 0.5, everySec: 2.2, jitterSec: 0.5, rateMin: 0.92, rateMax: 1.08, fadeSec: 0.8 } as const;

/** BGM（台帳の id。bgm. で始める：起動では読まず、初めて流す時に読む印） */
export const BGM = {
  title: 'bgm.title',
  daily: 'bgm.daily',
  prologue: 'bgm.prologue',
  festival: 'bgm.festival',
  library: 'bgm.library',
  return: 'bgm.return',
  battle: 'bgm.battle',
  boss: 'bgm.boss',
  // 段階75：しんみり（教室の知らせ・帰り道や電話）、昭和の商店街の記憶（1-2）、夕暮れの時計屋、2-1 の町工場、2-2 の文化祭、カイとの戦い、2-3 の河川敷
  somber: 'bgm.somber',
  uneasy: 'bgm.uneasy',
  showa: 'bgm.showa',
  dusk: 'bgm.dusk',
  factory: 'bgm.factory',
  cultureFestival: 'bgm.culture_festival',
  kai: 'bgm.kai',
  riverside: 'bgm.riverside',
  // 段階86：決意の曲（2-3 の4晩目、保管局の奥の書庫）
  resolve: 'bgm.resolve',
  // 段階114：ふみさんの思い出（4日目の d3_fumi。ふみさんが越すと話す所から）
  fumi: 'bgm.fumi',
} as const;

/**
 * BGM の頭（2026-10-11）：まだ解いていない曲は、mp3 の頭の sec 秒ぶん（96kbps なので1秒 12000 バイト）だけを先に解いてすぐ鳴らし、
 * 全体が解けたら鳴っている位置から全体へ移る（crossfadeSec 秒重ねる）。全体を解くのにスマホで1〜3秒かかるため。sec はそれより十分長く
 */
export const BGM_HEAD = { sec: 15, bytesPerSec: 12000, crossfadeSec: 0.05 } as const;

/**
 * BGM のくり返す区間（秒）。書かなければ曲の全体をくり返す。
 * Suno の曲は最初から最後までがループになっていないので、つなぎ目をここに書く（start まで1回だけ流し、start〜end をくり返す）
 */
export const BGM_LOOPS: Record<string, { start: number; end: number }> = {
  // Suno の BGM（2026-10-13。scripts/suno_bgm.py が書き出した時に表示する値）。タイトル・レストピア・返す場面は全体をくり返す
  [BGM.daily]: { start: 67.175329, end: 153.459546 },
  [BGM.prologue]: { start: 35.64263, end: 120.384082 },
  [BGM.festival]: { start: 31.300499, end: 108.875011 },
  [BGM.battle]: { start: 23.359274, end: 56.955986 },
  [BGM.boss]: { start: 97.29161, end: 161.5222 },
  // 段階75（2026-10-19）
  [BGM.somber]: { start: 41.935238, end: 97.068662 },
  [BGM.uneasy]: { start: 65.851791, end: 112.819501 },
  [BGM.showa]: { start: 49.179864, end: 178.397642 },
  [BGM.dusk]: { start: 55.449252, end: 136.002902 },
  [BGM.factory]: { start: 26.935147, end: 72.079751 },
  [BGM.cultureFestival]: { start: 19.272562, end: 93.281542 },
  [BGM.kai]: { start: 20.57288, end: 53.588345 },
  [BGM.riverside]: { start: 68.220227, end: 109.019456 },
  // 段階86（2026-10-21。40小節）
  [BGM.resolve]: { start: 40.402721, end: 113.038299 },
};

/**
 * 語りの文の、砂がさらさら落ちる音（段階31c。audio/sound.ts の playSand がその場で作る。材料は audio/sandNoise.ts）。
 * 段階32b の直し（2026-10-10）：粒が長く強くてザラザラに聞こえたので、ごく短く弱い粒を多く散らし、ゆらぐ「さーっ」を敷いた
 */
export const SAND_SOUND = {
  /** 長さ（秒） */
  durationSec: 1.8,
  /** 1秒あたりの粒の数（多くて弱いほど「さらさら」、少なくて強いほど「ぱらぱら・ザラザラ」） */
  grainsPerSec: 3200,
  /** 粒の形（長さは秒） */
  grain: { grainSec: 0.0012, ampMin: 0.04, ampMax: 0.3 },
  /** 下に敷く「さーっ」（ゆらぎの速さは Hz） */
  hiss: { amp: 0.15, flutterDepth: 0.45, flutterHz: [2.3, 3.7, 6.1] },
  /** 通す高さ（この間の高い音だけ。Hz） */
  highpassHz: 4500,
  lowpassHz: 11000,
  fadeInSec: 0.3,
  fadeOutSec: 0.9,
  /** 大きさ（効果音の音量を1とした時。直す前と同じくらいの大きさに合わせた） */
  gain: 2.0,
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
  /** 1秒あたりの粒の数（始め → 終わり）。粒と「さーっ」の形は語りの砂（SAND_SOUND）と同じ */
  grainsFrom: 900,
  grainsTo: 4000,
  /** 粒の高さ（高い音だけ通す境目。始め → 終わり、Hz） */
  highFrom: 3000,
  highTo: 7000,
  /** 昇る音の高さ（始め → 終わり、Hz） */
  toneFrom: 330,
  toneTo: 1320,
  /** 昇る音の大きさ（粒の大きさを1とした時） */
  toneGain: 0.04,
  fadeInSec: 0.4,
  fadeOutSec: 0.5,
  /** 大きさ（効果音の音量を1とした時） */
  gain: 1.8,
} as const;
