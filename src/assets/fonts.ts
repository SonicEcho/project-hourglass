import { HEADING_FONT_NAME } from '../ui/theme';

// 見出しの書体を読み込む（段階32a）。Phaser の文字はキャンバスに描くので、書体が読み込まれてから文字を作る。
// 読み込めない・遅い時は待たずに進む（端末の文字で代わりに出る）

/** これ以上は待たない（ミリ秒） */
const TIMEOUT_MS = 3000;

let loading: Promise<void> | null = null;

export function loadHeadingFont(): Promise<void> {
  if (loading) return loading;
  const url = `${import.meta.env.BASE_URL}assets/fonts/heading.woff2`;
  const load = (async () => {
    if (typeof FontFace === 'undefined') return;
    const face = new FontFace(HEADING_FONT_NAME, `url(${url}) format("woff2")`, { weight: '400 900' });
    document.fonts.add(await face.load());
  })().catch((e) => console.warn('[fonts] 見出しの書体を読み込めなかった。端末の文字で代わりに出す', e));
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, TIMEOUT_MS));
  loading = Promise.race([load, timeout]);
  return loading;
}
