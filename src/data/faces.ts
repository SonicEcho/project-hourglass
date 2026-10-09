// 戦闘の行動順の丸に出す顔（段階32a 調整1）。画面は src/ui/battleViews.ts
/** 行動順の丸に出す顔（段階32a 調整1）。立ち絵の台帳の id。ない人は今までどおり名前の1文字 */
export const ALLY_FACE: Record<string, string> = {
  hero: 'portrait.hero.normal',
  akari: 'portrait.akari.gentle',
};

/** 立ち絵から顔を切り出す範囲（絵の幅・高さに対する割合。全員同じ構図なので共通） */
export const FACE_CROP = { x: 0.28, y: 0.12, size: 0.44 } as const;
