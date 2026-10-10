import { HAND_FONT_NAME, HEADING_FONT_NAME } from '../ui/theme';

// 見出しの書体（段階32a）と、子どもの手書き風の書体（段階32b 調整3）を読み込む。Phaser の文字はキャンバスに描くので、書体が読み込まれてから文字を作る。
// 読み込めない・遅い時は待たずに進む（端末の文字で代わりに出る）

/** これ以上は待たない（ミリ秒） */
const TIMEOUT_MS = 3000;

let loading: Promise<void> | null = null;

function loadFace(name: string, file: string, weight: string): Promise<void> {
  const url = `${import.meta.env.BASE_URL}assets/fonts/${file}`;
  return (async () => {
    if (typeof FontFace === 'undefined') return;
    const face = new FontFace(name, `url(${url}) format("woff2")`, { weight });
    document.fonts.add(await face.load());
  })().catch((e) => console.warn(`[fonts] 書体 ${file} を読み込めなかった。端末の文字で代わりに出す`, e));
}

export function loadHeadingFont(): Promise<void> {
  if (loading) return loading;
  const load = Promise.all([loadFace(HEADING_FONT_NAME, 'heading.woff2', '400 900'), loadFace(HAND_FONT_NAME, 'hand.woff2', '400 900')]).then(() => undefined);
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, TIMEOUT_MS));
  loading = Promise.race([load, timeout]);
  return loading;
}
