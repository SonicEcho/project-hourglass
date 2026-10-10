// 台本（段階22）。会話の場面を、脚本（docs/script/M1.md）とほぼ同じ書き方の文字で書き、ここで読み取って進める。
// Phaser を読み込まない。画面（DialogueScene）は、ここが返す「止まる所」（台詞・選択肢・終わり）と、その前の演出の命令だけを見る。
//
// 書き方（1行に1つ）
//   # 場面のid 場面の名前        場面の始まり
//   名前〔表情〕「本文」           台詞（表情を書かなければ前のまま）
//   名前（声）「本文」             立ち絵を出さない人の台詞（（電話）も同じ。電話は名前の札に「（電話）」を付ける）
//   〈語り〉本文                   名前の札のない語りの文（砂が流れる）
//   〈地の文〉本文                 ハルトの心の中の文
//   （ノート）本文                 紙や札に書いてある文（かっこの中は見出し）
//   @命令 引数…                   演出（SCRIPT_COMMANDS）
//   ? 選択肢の文 -> 行き先         選択肢（続けて書いた行が1つの選択肢になる）
//   * 行き先                       行き先の印
//   -> 行き先                      行き先へ飛ぶ
//   @game 名前 成功 失敗            小さな遊び（射的・金魚すくい。段階24）。結果で行き先の印へ分かれる
//   @end                           場面の終わり（書かなくても、最後の行の後で終わる）
//   // …                           メモ（読み飛ばす）
// 本文の {名前} は、@set で覚えた値に置き換える

/** 演出の命令の名前 */
export const SCRIPT_COMMANDS = [
  /** 背景を替える（@bg id、なしは @bg none） */
  'bg',
  /** BGM を替える（@bgm 名前、止めるのは @bgm stop） */
  'bgm',
  /** 効果音（@se 名前） */
  'se',
  /** 画面に出す人（@cast 名前 名前…。何も書かなければ全員下げる） */
  'cast',
  /** 暗転・明転・白く光る（@fade out / in / white） */
  'fade',
  /** 画面を揺らす */
  'shake',
  /** 1枚絵（@cg id、消すのは @cg off） */
  'cg',
  /** 待つ（@wait ミリ秒） */
  'wait',
  /** 値を覚える（@set 名前 値） */
  'set',
  /** 章の扉などの大きな文字（@caption 文。タップで次へ） */
  'caption',
  /** 題字（@logo 題名　副題。全角の空白の前が題名、後が副題。金の線と砂の演出で出す。タップで次へ。段階32b 調整3） */
  'logo',
  /** まだ作っていない遊びの所に出す仮の案内（@note 文。タップで次へ） */
  'note',
  /** 立ち絵の芝居（@act 名前 動き。動きは data/dialogue.ts の ACTOR_MOTIONS） */
  'act',
  /** 頭の上の感情のふきだし（@emote 名前 印。印は EMOTES） */
  'emote',
  /** 画面に寄る（@zoom 倍率。戻すのは @zoom 1。場所が替わると戻る） */
  'zoom',
  /** 色を抜く（@mono on / off。時計が止まった時など） */
  'mono',
  /** 画面をノイズで乱す（@noise ミリ秒） */
  'noise',
  /**
   * 時計（@clock show 時:分 / hide / tick / tick many / stop）。
   * show は時計の寄りを出す（立ち絵は隠す）。tick は秒針の音を鳴らし始める（many は店じゅうの時計）。stop は秒針を止める
   */
  'clock',
] as const;
export type ScriptCommandName = (typeof SCRIPT_COMMANDS)[number];

/** @clock の使い方 */
export const CLOCK_ACTIONS = ['show', 'hide', 'tick', 'stop'] as const;

/** 「4:30」のような時刻を読む。読めない時は null */
export function parseClockTime(text: string): { hour: number; minute: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(text);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

/** 文の見せ方 */
export type LineStyle =
  /** 立ち絵のある人の台詞 */
  | 'talk'
  /** 立ち絵を出さない人の台詞（声だけ、電話） */
  | 'voice'
  /** 名前の札のない語りの文（砂が流れる） */
  | 'narration'
  /** ハルトの心の中の文 */
  | 'monologue'
  /** 紙や札に書いてある文 */
  | 'document'
  /** 章の扉などの大きな文字 */
  | 'caption'
  /** 題字（RESTOPIA　思い出だけの理想郷） */
  | 'logo'
  /** まだ作っていない遊びの所の仮の案内 */
  | 'note';

export interface ScriptLine {
  kind: 'line';
  style: LineStyle;
  /** 話す人（台詞の時）。紙の文の時は見出し（ノート、札） */
  speaker: string | null;
  /** 名前の札に添える言葉（電話） */
  tag?: string;
  /** 表情（この行から変わる） */
  face?: string;
  text: string;
  /** 台本の何行目か（間違いを知らせるため） */
  src: number;
}

export interface ScriptChoice {
  kind: 'choice';
  options: { label: string; target: string }[];
  /**
   * 小さな遊び（段階24。@game 名前 成功の行き先 失敗の行き先）。
   * 遊びの画面を出し、成功なら options[0]、失敗なら options[1] へ進む
   */
  game?: MiniGameName;
  src: number;
}

/** 台本から出せる小さな遊び（段階24） */
export const MINI_GAMES = ['shooting', 'goldfish'] as const;
export type MiniGameName = (typeof MINI_GAMES)[number];

export interface ScriptCommand {
  kind: 'command';
  name: ScriptCommandName;
  args: string[];
  src: number;
}

export interface ScriptJump {
  kind: 'jump';
  target: string;
  src: number;
}

export interface ScriptEnd {
  kind: 'end';
  src: number;
}

export type ScriptStep = ScriptLine | ScriptChoice | ScriptCommand | ScriptJump | ScriptEnd;

export interface ScriptScene {
  id: string;
  title: string;
  steps: ScriptStep[];
  /** 行き先の印 → 次に行う手の番号 */
  labels: Record<string, number>;
}

/** 台本の書き間違い。何行目かを付けて知らせる */
export class ScriptError extends Error {
  constructor(src: number, message: string) {
    super(`台本の${src}行目：${message}`);
  }
}

const RE_SCENE = /^#\s*(\S+)\s*(.*)$/;
const RE_TALK = /^([^〔（「\s]+)(?:〔([^〕]+)〕)?(?:（([^）]+)）)?「(.*)」$/;
const RE_DOCUMENT = /^（([^）]+)）(.+)$/;
const RE_CHOICE = /^\?\s*(.+?)\s*->\s*(\S+)$/;
const RE_LABEL = /^\*\s*(\S+)$/;
const RE_JUMP = /^->\s*(\S+)$/;
const RE_COMMAND = /^@(\S+)\s*(.*)$/;

/** 台本の文字を読んで、場面の一覧にする。書き間違いがあれば ScriptError */
export function parseScript(text: string): ScriptScene[] {
  const scenes: ScriptScene[] = [];
  let scene: ScriptScene | null = null;
  const lines = text.split('\n');
  lines.forEach((raw, i) => {
    const src = i + 1;
    const line = raw.trim();
    if (line === '' || line.startsWith('//')) return;
    const head = RE_SCENE.exec(line);
    if (head) {
      if (scenes.some((s) => s.id === head[1])) throw new ScriptError(src, `場面の id「${head[1]}」が重なっている`);
      scene = { id: head[1], title: head[2] || head[1], steps: [], labels: {} };
      scenes.push(scene);
      return;
    }
    if (!scene) throw new ScriptError(src, '最初の場面（# id 名前）より前に書いている');
    const s: ScriptScene = scene;
    const step = parseStep(line, src);
    if (step === null) {
      const name = RE_LABEL.exec(line)![1];
      if (name in s.labels) throw new ScriptError(src, `行き先の印「${name}」が重なっている`);
      s.labels[name] = s.steps.length;
      return;
    }
    // 続けて書いた選択肢の行は、1つの選択肢にまとめる
    const last = s.steps[s.steps.length - 1];
    if (step.kind === 'choice' && last?.kind === 'choice' && !step.game && !last.game) {
      last.options.push(...step.options);
      return;
    }
    s.steps.push(step);
  });
  return scenes;
}

/** 1行を読む。行き先の印の行は null */
function parseStep(line: string, src: number): ScriptStep | null {
  if (RE_LABEL.test(line)) return null;
  const jump = RE_JUMP.exec(line);
  if (jump) return { kind: 'jump', target: jump[1], src };
  const choice = RE_CHOICE.exec(line);
  if (choice) return { kind: 'choice', options: [{ label: choice[1], target: choice[2] }], src };
  if (line.startsWith('〈語り〉')) return textLine('narration', null, line.slice(4), src);
  if (line.startsWith('〈地の文〉')) return textLine('monologue', null, line.slice(5), src);
  const cmd = RE_COMMAND.exec(line);
  if (cmd) {
    const name = cmd[1];
    const args = cmd[2] ? cmd[2].split(/\s+/) : [];
    if (name === 'end') return { kind: 'end', src };
    if (name === 'game') {
      const [game, ok, ng] = args;
      if (!(MINI_GAMES as readonly string[]).includes(game)) throw new ScriptError(src, `知らない遊び「${game}」`);
      if (!ok || !ng || args.length !== 3) throw new ScriptError(src, '@game は「@game 名前 成功の行き先 失敗の行き先」と書く');
      return {
        kind: 'choice',
        options: [
          { label: '成功', target: ok },
          { label: '失敗', target: ng },
        ],
        game: game as MiniGameName,
        src,
      };
    }
    if (!(SCRIPT_COMMANDS as readonly string[]).includes(name)) throw new ScriptError(src, `知らない命令「@${name}」`);
    if (name === 'caption' || name === 'note' || name === 'logo') return textLine(name, null, cmd[2], src);
    return { kind: 'command', name: name as ScriptCommandName, args, src };
  }
  const talk = RE_TALK.exec(line);
  if (talk) {
    const [, speaker, face, tag, body] = talk;
    if (!body) throw new ScriptError(src, '本文が空');
    if (tag !== undefined && tag !== '声' && tag !== '電話') throw new ScriptError(src, `（${tag}）は使えない（声・電話だけ）`);
    const out: ScriptLine = { kind: 'line', style: tag ? 'voice' : 'talk', speaker, text: body, src };
    if (face) out.face = face;
    if (tag === '電話') out.tag = '電話';
    return out;
  }
  const doc = RE_DOCUMENT.exec(line);
  if (doc) return textLine('document', doc[1], doc[2], src);
  throw new ScriptError(src, `読めない行「${line}」`);
}

function textLine(style: LineStyle, speaker: string | null, text: string, src: number): ScriptLine {
  const body = text.trim();
  if (!body) throw new ScriptError(src, '本文が空');
  return { kind: 'line', style, speaker, text: body, src };
}

/** 行き先がない・場面が見つからないなどの間違いを、全部まとめて返す（テストで使う） */
export function checkScript(scenes: ScriptScene[]): string[] {
  const errors: string[] = [];
  for (const scene of scenes) {
    for (const step of scene.steps) {
      const targets = step.kind === 'jump' ? [step.target] : step.kind === 'choice' ? step.options.map((o) => o.target) : [];
      for (const t of targets) {
        if (!(t in scene.labels)) errors.push(`${scene.id}（${step.src}行目）：行き先「${t}」がない`);
      }
      if (step.kind === 'choice' && step.options.length < 2) errors.push(`${scene.id}（${step.src}行目）：選択肢が1つしかない`);
    }
  }
  return errors;
}

/** 台本の中で覚えておく値（金魚の名前など） */
export type ScriptVars = Record<string, string>;

/** 台本のどこまで進んだか（次に行う手の番号） */
export interface ScriptPos {
  scene: string;
  index: number;
}

/** 止まる所：台詞（タップを待つ）、選択肢、終わり */
export type ScriptStop =
  | { type: 'line'; line: ScriptLine; text: string; key: string }
  | { type: 'choice'; choice: ScriptChoice }
  | { type: 'end' };

export interface ScriptRun {
  /** 止まる所の前に行う演出（@set は中で済ませるので入らない） */
  commands: ScriptCommand[];
  stop: ScriptStop;
  /** 次に進める時の場所 */
  pos: ScriptPos;
  vars: ScriptVars;
}

/** 飛び先をたどり続けて止まらない台本を、ここで打ち切る */
const MAX_STEPS = 10000;

function findScene(scenes: ScriptScene[], id: string): ScriptScene {
  const scene = scenes.find((s) => s.id === id);
  if (!scene) throw new Error(`台本に場面「${id}」がない`);
  return scene;
}

/** 本文の {名前} を覚えた値に置き換える（覚えていなければ「？」） */
export function fillText(text: string, vars: ScriptVars): string {
  return text.replace(/\{([^}]+)\}/g, (_, k: string) => vars[k] ?? '？');
}

/** 次の止まる所まで進める。受け取った vars は書き換えず、新しいものを返す */
export function runScript(scenes: ScriptScene[], pos: ScriptPos, vars: ScriptVars): ScriptRun {
  const scene = findScene(scenes, pos.scene);
  const commands: ScriptCommand[] = [];
  let next = { ...vars };
  let i = pos.index;
  for (let n = 0; n < MAX_STEPS; n++) {
    const step = scene.steps[i];
    if (!step || step.kind === 'end') return { commands, stop: { type: 'end' }, pos: { scene: scene.id, index: scene.steps.length }, vars: next };
    if (step.kind === 'jump') {
      i = labelIndex(scene, step.target);
      continue;
    }
    if (step.kind === 'command') {
      if (step.name === 'set') next = { ...next, [step.args[0]]: step.args.slice(1).join(' ') };
      else commands.push(step);
      i++;
      continue;
    }
    if (step.kind === 'choice') return { commands, stop: { type: 'choice', choice: step }, pos: { scene: scene.id, index: i }, vars: next };
    return {
      commands,
      stop: { type: 'line', line: step, text: fillText(step.text, next), key: readKey(scene.id, step) },
      pos: { scene: scene.id, index: i + 1 },
      vars: next,
    };
  }
  throw new Error(`台本「${scene.id}」が止まらない（行き先が輪になっている）`);
}

/** 選択肢を選んだ後の場所 */
export function chooseOption(scenes: ScriptScene[], pos: ScriptPos, option: number): ScriptPos {
  const scene = findScene(scenes, pos.scene);
  const step = scene.steps[pos.index];
  if (step?.kind !== 'choice') throw new Error('選択肢の所ではない');
  const o = step.options[option];
  if (!o) throw new Error(`選択肢の番号 ${option} がない`);
  return { scene: scene.id, index: labelIndex(scene, o.target) };
}

function labelIndex(scene: ScriptScene, label: string): number {
  const i = scene.labels[label];
  if (i === undefined) throw new Error(`台本「${scene.id}」に行き先「${label}」がない`);
  return i;
}

/**
 * 読んだ台詞の印。場面と、話す人・本文から作る（台本の別の所を書き足しても、印がずれないように）。
 * 本文を直した台詞は、まだ読んでいない扱いになる
 */
export function readKey(sceneId: string, line: Pick<ScriptLine, 'speaker' | 'text'>): string {
  const s = `${line.speaker ?? ''}|${line.text}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return `${sceneId}:${h.toString(36)}`;
}

/** 読んだ台詞の印の一覧を、保存された文字から読む（壊れていたら空） */
export function parseReadLog(text: string | null): Set<string> {
  if (!text) return new Set();
  try {
    const raw: unknown = JSON.parse(text);
    return new Set(Array.isArray(raw) ? raw.filter((k): k is string => typeof k === 'string') : []);
  } catch {
    return new Set();
  }
}

export function serializeReadLog(log: Set<string>): string {
  return JSON.stringify([...log]);
}
