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
