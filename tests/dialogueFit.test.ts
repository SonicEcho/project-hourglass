import { describe, expect, it } from 'vitest';
import { SCENES } from '../src/data';
import { applyKinsoku } from '../src/ui/kinsoku';

// 会話の窓に収まるか（段階108。テストプレイのメモ 11・19・28）。DialogueScene の本文は 17px の字で、折り返しの幅は17字（BODY_WRAP）。
// 禁則でぶら下げても、枠の内側（19字）に収まり、6行までにする
const WRAP = 17;
const MAX_WIDTH = 19;
const MAX_LINES = 6;

/** 字の幅（全角を1、半角を約半分） */
function units(ch: string): number {
  return /[ -~]/.test(ch) ? 0.55 : 1;
}

/** 本文の折り返し（Phaser の文字ごとの折り返しと同じ：幅を超える前で折る）と禁則 */
export function wrapLines(text: string): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    let w = 0;
    for (const ch of para) {
      if (w + units(ch) > WRAP && line) {
        out.push(line);
        line = '';
        w = 0;
      }
      line += ch;
      w += units(ch);
    }
    out.push(line);
  }
  return applyKinsoku(out);
}

const width = (line: string) => [...line].reduce((n, ch) => n + units(ch), 0);

describe('会話の窓に収まる（段階108）', () => {
  it('すべての台詞と地の文が、ぶら下げても枠の内側に収まり、6行までに収まる', () => {
    const over: string[] = [];
    for (const scene of SCENES) {
      for (const step of scene.steps) {
        if (step.kind !== 'line' || step.style === 'caption' || step.style === 'logo' || step.style === 'document' || step.style === 'note') continue;
        // 差し込みの名前などは、長めの名前（6字）として数える
        const lines = wrapLines(step.text.replace(/\{[^}]+\}/g, '〇〇〇〇〇〇'));
        if (lines.length > MAX_LINES || lines.some((l) => width(l) > MAX_WIDTH)) over.push(`${scene.id} ${step.src}行目（${lines.length}行）：${step.text}`);
      }
    }
    expect(over).toEqual([]);
  });
});
