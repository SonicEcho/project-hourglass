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
