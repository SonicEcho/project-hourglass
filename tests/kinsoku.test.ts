import { describe, expect, it } from 'vitest';
import { applyKinsoku, wrapJapanese } from '../src/ui/kinsoku';

describe('禁則処理（段階22）', () => {
  it('行の始めの句読点・閉じかっこ・小さい仮名は、前の行の終わりにぶら下げる', () => {
    expect(applyKinsoku(['俺、今日はこっちを調べる', '。おまえら、先に行ってろ'])).toEqual(['俺、今日はこっちを調べる。', 'おまえら、先に行ってろ']);
    expect(applyKinsoku(['ちがう', '」……ほら'])).toEqual(['ちがう」', '……ほら']);
    expect(applyKinsoku(['あ', 'っ']).length).toBe(1);
  });

  it('続けて来た記号はまとめて上げる。最初の行は動かさない。行が空になったら消す', () => {
    expect(applyKinsoku(['えっ', '！？そんな'])).toEqual(['えっ！？', 'そんな']);
    expect(applyKinsoku(['。はじまり'])).toEqual(['。はじまり']);
    expect(applyKinsoku(['ふつうの行', 'ふつうの行'])).toEqual(['ふつうの行', 'ふつうの行']);
  });
});

describe('日本語の折り返し（段階125）', () => {
  // 1文字を幅1として測る
  const measure = (s: string) => [...s].length;

  it('英数字のまとまりは途中で切らず、まとめて次の行へ送る', () => {
    expect(wrapJapanese('金の道・あと8pt）', 7, measure)).toEqual(['金の道・あと', '8pt）']);
    expect(wrapJapanese('武器がLv12になる', 5, measure)).toEqual(['武器が', 'Lv12に', 'なる']);
  });

  it('禁則を守り、改行はそのまま残す', () => {
    expect(wrapJapanese('あいうえ。かき', 4, measure)).toEqual(['あいうえ。', 'かき']);
    expect(wrapJapanese('あ\nい', 10, measure)).toEqual(['あ', 'い']);
  });

  it('幅より長い英数字のまとまりは、1行にはみ出して置く', () => {
    expect(wrapJapanese('あabcdefg', 3, measure)).toEqual(['あ', 'abcdefg']);
  });
});
