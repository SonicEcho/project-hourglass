import { describe, expect, it } from 'vitest';
import { checkScript, chooseOption, fillText, parseClockTime, parseReadLog, parseScript, readKey, runScript, serializeReadLog } from '../../src/core';
import type { ScriptLine } from '../../src/core';

const SAMPLE = `
// メモは読み飛ばす
# a 場面A
@bg shrine
@cast あかり ハルト
あかり〔笑顔〕「こんにちは」
ハルト「……ああ」
〈語り〉あの夏のことを、今でも覚えている。
〈地の文〉朝は苦手だ。
担任（声）「出席とるぞ」
りく（電話）「ハルト！」
（ノート）次は、たぶん——時計屋。
@caption 第1章
? 右へ -> right
? 左へ -> left
* right
@set 道 右
-> after
* left
@set 道 左
* after
あかり「{道}だね。{なし}」
@end
あかり「ここには来ない」

# b 場面B
ハルト「Bの最初」
`;

describe('台本を読む（段階22）', () => {
  const scenes = parseScript(SAMPLE);

  it('場面ごとに分け、行の種類を見分ける', () => {
    expect(scenes.map((s) => [s.id, s.title])).toEqual([
      ['a', '場面A'],
      ['b', '場面B'],
    ]);
    const lines = scenes[0].steps.filter((s): s is ScriptLine => s.kind === 'line');
    expect(lines.map((l) => [l.style, l.speaker, l.face ?? null, l.tag ?? null, l.text])).toEqual([
      ['talk', 'あかり', '笑顔', null, 'こんにちは'],
      ['talk', 'ハルト', null, null, '……ああ'],
      ['narration', null, null, null, 'あの夏のことを、今でも覚えている。'],
      ['monologue', null, null, null, '朝は苦手だ。'],
      ['voice', '担任', null, null, '出席とるぞ'],
      ['voice', 'りく', null, '電話', 'ハルト！'],
      ['document', 'ノート', null, null, '次は、たぶん——時計屋。'],
      ['caption', null, null, null, '第1章'],
      ['talk', 'あかり', null, null, '{道}だね。{なし}'],
      ['talk', 'あかり', null, null, 'ここには来ない'],
    ]);
  });

  it('続けて書いた選択肢は1つにまとめる', () => {
    const choice = scenes[0].steps.find((s) => s.kind === 'choice');
    expect(choice).toMatchObject({ options: [{ label: '右へ', target: 'right' }, { label: '左へ', target: 'left' }] });
  });

  it('書き間違いは何行目かを付けて知らせる', () => {
    expect(() => parseScript('あかり「先に場面がない」')).toThrow('台本の1行目');
    expect(() => parseScript('# a\n@ばくはつ')).toThrow('知らない命令');
    expect(() => parseScript('# a\nこれは読めない')).toThrow('台本の2行目');
    expect(() => parseScript('# a\nあかり（心）「だめ」')).toThrow('声・電話だけ');
    expect(() => parseScript('# a\n# a')).toThrow('重なっている');
    expect(() => parseScript('# a\n* x\n* x')).toThrow('重なっている');
  });

  it('行き先がない・選択肢が1つだけ、を見つける', () => {
    const bad = parseScript('# a\n-> nowhere\n? ひとつだけ -> x\n* x');
    expect(checkScript(bad)).toEqual(['a（2行目）：行き先「nowhere」がない', 'a（3行目）：選択肢が1つしかない']);
    expect(checkScript(scenes)).toEqual([]);
  });
});

describe('台本を進める（段階22）', () => {
  const scenes = parseScript(SAMPLE);

  it('止まる所（台詞）までの演出をまとめて返し、次の場所へ進める', () => {
    const r = runScript(scenes, { scene: 'a', index: 0 }, {});
    expect(r.commands.map((c) => [c.name, c.args])).toEqual([
      ['bg', ['shrine']],
      ['cast', ['あかり', 'ハルト']],
    ]);
    expect(r.stop.type).toBe('line');
    expect(r.stop.type === 'line' && r.stop.text).toBe('こんにちは');
    const r2 = runScript(scenes, r.pos, r.vars);
    expect(r2.commands).toEqual([]);
    expect(r2.stop.type === 'line' && r2.stop.text).toBe('……ああ');
  });

  const toChoice = () => {
    let r = runScript(scenes, { scene: 'a', index: 0 }, {});
    while (r.stop.type === 'line') r = runScript(scenes, r.pos, r.vars);
    return r;
  };

  it('選択肢で止まり、選んだ先へ進む。@set の値を本文に入れる（知らない名前は「？」）', () => {
    const r = toChoice();
    expect(r.stop.type).toBe('choice');
    const left = runScript(scenes, chooseOption(scenes, r.pos, 1), r.vars);
    expect(left.stop.type === 'line' && left.stop.text).toBe('左だね。？');
    expect(left.vars).toEqual({ 道: '左' });
    const right = runScript(scenes, chooseOption(scenes, r.pos, 0), r.vars);
    expect(right.stop.type === 'line' && right.stop.text).toBe('右だね。？');
    // @end で終わり、後ろの行には進まない
    const end = runScript(scenes, right.pos, right.vars);
    expect(end.stop.type).toBe('end');
  });

  it('受け取った値は書き換えない', () => {
    const vars = { 道: '前' };
    const r = toChoice();
    runScript(scenes, chooseOption(scenes, r.pos, 0), vars);
    expect(vars).toEqual({ 道: '前' });
  });

  it('最後の行の後は終わり。選択肢でない所で選ぶ・ない場面はエラー', () => {
    const b1 = runScript(scenes, { scene: 'b', index: 0 }, {});
    expect(runScript(scenes, b1.pos, {}).stop.type).toBe('end');
    expect(() => chooseOption(scenes, { scene: 'b', index: 0 }, 0)).toThrow('選択肢の所ではない');
    expect(() => runScript(scenes, { scene: 'zzz', index: 0 }, {})).toThrow('場面「zzz」');
  });

  it('行き先が輪になって止まらない台本は打ち切る', () => {
    const loop = parseScript('# a\n* x\n-> x');
    expect(() => runScript(loop, { scene: 'a', index: 0 }, {})).toThrow('止まらない');
  });

  it('本文の置き換え', () => {
    expect(fillText('{金魚}と{景品}', { 金魚: 'ゆうやけ' })).toBe('ゆうやけと？');
  });
});

describe('読んだ台詞の印（段階22）', () => {
  it('場面と本文から作る。別の行を書き足しても変わらず、本文を直すと変わる', () => {
    const a = readKey('a', { speaker: 'あかり', text: 'こんにちは' });
    expect(readKey('a', { speaker: 'あかり', text: 'こんにちは' })).toBe(a);
    expect(readKey('a', { speaker: 'あかり', text: 'こんばんは' })).not.toBe(a);
    expect(readKey('b', { speaker: 'あかり', text: 'こんにちは' })).not.toBe(a);
  });

  it('保存した印を読み戻せる。壊れていたら空', () => {
    const log = new Set(['a:1', 'b:2']);
    expect(parseReadLog(serializeReadLog(log))).toEqual(log);
    expect(parseReadLog(null)).toEqual(new Set());
    expect(parseReadLog('{壊れた')).toEqual(new Set());
    expect(parseReadLog('[1, "a:1"]')).toEqual(new Set(['a:1']));
  });
});

describe('時計の時刻を読む（段階22 調整12）', () => {
  it('「時:分」を読む', () => {
    expect(parseClockTime('4:30')).toEqual({ hour: 4, minute: 30 });
    expect(parseClockTime('17:12')).toEqual({ hour: 17, minute: 12 });
  });

  it('読めない時刻は null', () => {
    expect(parseClockTime('')).toBeNull();
    expect(parseClockTime('4時30分')).toBeNull();
    expect(parseClockTime('24:00')).toBeNull();
    expect(parseClockTime('4:60')).toBeNull();
  });

  it('@clock は命令として読める', () => {
    const [scene] = parseScript('# a 場面\n@clock show 5:12\n@clock tick many\n');
    expect(scene.steps[0]).toMatchObject({ kind: 'command', name: 'clock', args: ['show', '5:12'] });
    expect(scene.steps[1]).toMatchObject({ kind: 'command', name: 'clock', args: ['tick', 'many'] });
  });
});

describe('小さな遊び（@game。段階24）', () => {
  it('成功と失敗の行き先を持つ選択肢として読み、後ろの選択肢とはまとめない', () => {
    const [scene] = parseScript('# a 場面\n@game shooting hit miss\n? A -> hit\n* hit\nハルト「x」\n* miss\n');
    expect(scene.steps[0]).toMatchObject({ kind: 'choice', game: 'shooting', options: [{ target: 'hit' }, { target: 'miss' }] });
    expect(scene.steps[1]).toMatchObject({ kind: 'choice', options: [{ label: 'A', target: 'hit' }] });
    expect(chooseOption([scene], { scene: 'a', index: 0 }, 1)).toEqual({ scene: 'a', index: scene.labels.miss });
  });

  it('知らない遊びや、行き先が足りない書き方は止める', () => {
    expect(() => parseScript('# a 場面\n@game dance ok ng\n')).toThrow('知らない遊び');
    expect(() => parseScript('# a 場面\n@game shooting ok\n')).toThrow('@game は');
  });
});
