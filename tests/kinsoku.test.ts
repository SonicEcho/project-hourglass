import { describe, expect, it } from 'vitest';
import { applyKinsoku } from '../src/ui/kinsoku';

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
