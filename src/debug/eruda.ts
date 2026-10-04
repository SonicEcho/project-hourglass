/** eruda（スマホ用コンソール）を読み込む。?debug=1 の時だけ呼ぶ */
export async function loadEruda(): Promise<void> {
  const { default: eruda } = await import('eruda');
  eruda.init();
}
