// 戦闘の行動順の丸に出す顔（段階32a 調整1）。画面は src/ui/battleViews.ts
/** 行動順の丸に出す顔（段階32a 調整1）。立ち絵の台帳の id。ない人は今までどおり名前の1文字 */
export const ALLY_FACE: Record<string, string> = {
  hero: 'portrait.hero.normal',
  akari: 'portrait.akari.gentle',
};

/** 立ち絵から顔を切り出す範囲（絵の幅・高さに対する割合。全員同じ構図なので共通） */
export const FACE_CROP = { x: 0.28, y: 0.12, size: 0.44 } as const;

/**
 * 戦闘中の顔の帯（段階46a）で、立ち絵から顔を切り出す範囲（絵の幅に対する左端 x・幅 w、高さに対する上端 y）。
 * みおの立ち絵は胸から上の構図で顔が大きいので、別に合わせた（2026-10-16 開発者の指摘：顔がずれていた）
 */
export const BARK_FACE_CROP: Record<string, { x: number; y: number; w: number }> = {
  default: { x: 0.22, y: 0.15, w: 0.56 },
  mio: { x: 0.15, y: 0.22, w: 0.7 },
};
