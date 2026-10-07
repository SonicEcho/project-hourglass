// 戦闘画面の「魔法・スキル」の一覧の並べ方（画面に依存しない。テストからも使う）
//
// 一覧は手札の場所（高さ LAYOUT.hand.h）に出す。3つまでは1列、4つ以上は2列で、1ページに6つまで並べる。
// 6つを超える時は、1ページに5つと「次のページ」のボタンを並べる。

/** 一覧の見出しの高さ */
export const SKILL_PANEL_TOP = 24;
/** 1つの高さ（タップしやすい大きさ） */
export const SKILL_ROW_H = 46;
export const SKILL_ROW_GAP = 4;
export const SKILL_COL_GAP = 6;
const ROWS = 3;

export interface SkillSlot {
  /** 技の並び順（-1 は「次のページ」のボタン） */
  index: number;
  /** 一覧の左上からの位置と大きさ */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SkillPanelLayout {
  cols: 1 | 2;
  page: number;
  pages: number;
  slots: SkillSlot[];
}

/** count 個の技を、幅 width の一覧の page ページ目に並べる */
export function skillPanelLayout(count: number, width: number, page: number): SkillPanelLayout {
  const cols = count <= ROWS ? 1 : 2;
  const capacity = ROWS * cols;
  const paged = count > capacity;
  const perPage = paged ? capacity - 1 : capacity;
  const pages = Math.max(1, Math.ceil(count / perPage));
  const p = ((page % pages) + pages) % pages;
  const w = cols === 1 ? width : (width - SKILL_COL_GAP) / 2;
  const indices: number[] = [];
  for (let i = p * perPage; i < Math.min(count, (p + 1) * perPage); i++) indices.push(i);
  if (paged) indices.push(-1);
  const slots = indices.map((index, k) => {
    const col = cols === 1 ? 0 : k % 2;
    const row = cols === 1 ? k : Math.floor(k / 2);
    return { index, x: col * (w + SKILL_COL_GAP), y: SKILL_PANEL_TOP + row * (SKILL_ROW_H + SKILL_ROW_GAP), w, h: SKILL_ROW_H };
  });
  return { cols, page: p, pages, slots };
}
