// 日本語の禁則処理（段階22）。折り返した行の始めに、句読点・閉じかっこ・小さい仮名・長音などが来ないようにする。
// 行の始めに来た文字は、前の行の終わりにぶら下げる（1〜2文字ぶん枠の内側の余白にはみ出すが、読みやすさを優先する）

/** 行の始めに置かない文字 */
const NO_LINE_START = new Set([...'、。，．,.！？!?」』）)】〕〉》ー〜～・：；ゃゅょっぁぃぅぇぉゎャュョッァィゥェォヮヵヶ']);

/** 折り返した行の並びを、禁則に合わせて直す（受け取った配列は書き換えない） */
export function applyKinsoku(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    let rest = line;
    while (out.length > 0 && rest.length > 0 && NO_LINE_START.has(rest[0])) {
      out[out.length - 1] += rest[0];
      rest = rest.slice(1);
    }
    if (rest.length > 0 || out.length === 0) out.push(rest);
  }
  return out;
}

/**
 * 日本語の文を幅に合わせて折り返す（段階125。レビューの項目27）。1文字ずつ詰め、英数字のまとまり（「8pt」「Lv5」など）は途中で切らない。
 * 改行はそのまま残し、段落ごとに禁則（applyKinsoku）をかける。measure は文字の幅を測る関数（画面では Phaser の文字の幅）
 */
export function wrapJapanese(text: string, width: number, measure: (s: string) => number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    const units = para.match(/[A-Za-z0-9.%+\-/]+|[\s\S]/gu) ?? [];
    const lines: string[] = [];
    let line = '';
    for (const u of units) {
      if (line !== '' && measure(line + u) > width) {
        lines.push(line);
        line = u === ' ' ? '' : u;
      } else line += u;
    }
    lines.push(line);
    out.push(...applyKinsoku(lines));
  }
  return out;
}
