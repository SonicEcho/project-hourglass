// 戦闘の行動順の丸に出す顔（段階32a 調整1）。画面は src/ui/battleViews.ts
/** 行動順の丸に出す顔（段階32a 調整1）。立ち絵の台帳の id。ない人は今までどおり名前の1文字 */
export const ALLY_FACE: Record<string, string> = {
  hero: 'portrait.hero.normal',
  akari: 'portrait.akari.gentle',
  // みお（段階45で足した）。立ち絵が胸から上の構図なので、切り出す範囲は FACE_CROPS で別にする
  mio: 'portrait.mio.smile',
  // 小夜子（段階141。育成の画面の顔のタブで使う）。早瀬は立ち絵ができるまで名前の1文字
  sayoko: 'portrait.sayoko.smile',
};

/** 立ち絵から顔を切り出す範囲（絵の幅・高さに対する割合） */
export const FACE_CROP = { x: 0.28, y: 0.12, size: 0.44 } as const;
/** 仲間ごとの顔の切り出し（書いていない仲間は FACE_CROP） */
export const FACE_CROPS: Record<string, { x: number; y: number; size: number }> = {
  mio: { x: 0.23, y: 0.15, size: 0.54 },
};

/**
 * 戦闘中の顔の帯（段階46a）で、立ち絵から顔を切り出す範囲（絵の幅に対する左端 x・幅 w、高さに対する上端 y）。
 * みおの立ち絵は胸から上の構図で顔が大きいので、別に合わせた（2026-10-16 開発者の指摘：顔がずれていた）
 */
export const BARK_FACE_CROP: Record<string, { x: number; y: number; w: number }> = {
  default: { x: 0.22, y: 0.15, w: 0.56 },
  mio: { x: 0.15, y: 0.22, w: 0.7 },
};
