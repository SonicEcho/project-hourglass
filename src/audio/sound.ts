import Phaser from 'phaser';
import type { Settings } from '../core';
import { parseSettings, serializeSettings } from '../core';
import type { AssetEntry, BlipVoice } from '../data';
import { addSandGrains, addSandHiss } from './sandNoise';
import { AMBIENCE, ASSETS, BGM_HEAD, BGM_LOOPS, KOMA_SOUND, SAND_RISE_SOUND, SAND_SOUND, SE_GAIN, WAVE_GAIN } from '../data';
import { browserStorage } from '../save/storage';
import { readBgm } from './bgmStore';
import { isDebugEnabled } from '../debug/debugFlag';

// 音を鳴らす部品（段階19）。音はすべてここを通して鳴らす。
// BGM はゲーム全体で1曲だけ。画面が替わっても止めず、別の曲を頼まれた時だけ切り替える。
// スマホのブラウザは最初に画面に触れるまで音を出せないので、その前に頼まれた BGM は触れた後に始める。
// BGM のファイルは起動の時には読まない（効果音は起動の時に読む）。タイトルから始める時に端末にしまい（bgmStore.ts）、流す時にそこから読む。
// BGM のくり返しは、ブラウザの音の機能（Web Audio）に直接任せる（区間の前から区間へのつなぎも、区間の終わりから始めへも切れ目がない。段階20）

const SETTINGS_KEY = 'restopia.settings';
/** 曲を切り替える時に、前の曲を小さくしていく時間（秒） */
const FADE_SEC = 0.6;

interface Playing {
  id: string;
  source: AudioBufferSourceNode;
  /** 曲の音量（設定の BGM 音量。止める時もここで小さくする） */
  gain: GainNode;
  /** 鳴らしている音のデータの大きさ（頭から全体へ移る時に重ねて切り替える） */
  part: GainNode;
  /** 曲の頭だけを鳴らしている（全体が解けたら移る） */
  head: boolean;
  /** 鳴らし始めた時刻（音の時計。全体へ移る時に、鳴っている位置を出す） */
  startedAt: number;
}

let settings: Settings | null = null;
let bgm: Playing | null = null;
/** 流すように頼まれている BGM（読み込み中や、音を出せるようになるのを待っている間も） */
let wantedBgm: string | null = null;
/** 音に解いた曲を残しておく数（探索と戦闘の行き来で、毎回解き直さないように） */
const KEEP_DECODED = 2;
/** 音に解いた曲（古く使ったものから順に並ぶ） */
const decoded = new Map<string, AudioBuffer>();
/** 音に解いている途中の曲 */
const decoding = new Map<string, Promise<AudioBuffer | null>>();
/** 読んだ（読んでいる）曲の mp3 */
const encoded = new Map<string, Promise<ArrayBuffer>>();

/** 鳴っている環境音（段階32b 調整3） */
interface Ambience {
  id: string;
  /** まとめて大きさを変える所 */
  master: GainNode | null;
  timer: ReturnType<typeof setTimeout> | null;
}
let ambience: Ambience | null = null;

/** 環境音の大きさ（効果音の音量に合わせる） */
function ambienceLevel(id: string): number {
  return getSettings().seVolume * (SE_GAIN[id] ?? 1) * AMBIENCE.gain;
}

/** 音量の設定（初めて使う時にブラウザの保存から読む） */
export function getSettings(): Settings {
  if (!settings) settings = parseSettings(browserStorage().read(SETTINGS_KEY));
  return settings;
}

/** 音量を変えて保存する。鳴っている BGM にもすぐ反映する */
export function setSettings(next: Settings): void {
  settings = next;
  browserStorage().write(SETTINGS_KEY, serializeSettings(next));
  if (bgm) bgm.gain.gain.setTargetAtTime(next.bgmVolume, bgm.gain.context.currentTime, 0.02);
  if (ambience?.master) ambience.master.gain.setTargetAtTime(ambienceLevel(ambience.id), ambience.master.context.currentTime, 0.02);
}

function loaded(scene: Phaser.Scene, id: string): boolean {
  return scene.cache.audio.exists(id);
}

/** 効果音を鳴らす。読み込めていない・音量0の時は鳴らさない */
export function playSe(scene: Phaser.Scene, id: string): void {
  const v = getSettings().seVolume;
  if (v <= 0 || !loaded(scene, id) || scene.sound.locked) return;
  scene.sound.play(id, { volume: v * (SE_GAIN[id] ?? 1) });
}

/**
 * BGM を流す。同じ曲が流れていればそのまま。別の曲なら、次の曲の用意ができた時に前の曲を小さくしながら止めて、次の曲を始める。
 * BGM_LOOPS にくり返す区間があれば、区間の前を1回流してから区間をくり返す。なければ曲の全体をくり返す。
 * 曲のファイルは起動の時には読まず、初めて流す時に読む（2026-10-11。1曲が1〜2MB あり、全部を起動で読むと始まるのが遅くなるため）
 */
export function playBgm(scene: Phaser.Scene, id: string): void {
  if (wantedBgm === id) return;
  const entry = ASSETS.find((a) => a.id === id && a.kind === 'audio' && a.file);
  const mgr = scene.sound;
  // Web Audio が使えないブラウザでは BGM を鳴らさない（今のスマホのブラウザはどれも使える）
  if (!entry || !(mgr instanceof Phaser.Sound.WebAudioSoundManager)) return;
  wantedBgm = id;
  if (bgm?.id === id) return;
  // まだ解いていない曲は、頭だけを先に解いてすぐ鳴らし、その後で全体を解いて移る（2026-10-11。全体を解くとスマホで1〜3秒かかるため）
  const fromHead = !decoded.has(id) && !decoding.has(id) && !mgr.locked;
  void (async () => {
    if (fromHead) {
      const head = await decodeHead(mgr.context, entry);
      if (head && wantedBgm === id && bgm?.id !== id && !mgr.locked) startBgm(mgr, id, head, true);
    }
    const buffer = await bgmBuffer(mgr.context, entry);
    // 読めなかった時は、次に頼まれた時にもう一度読む
    if (!buffer && wantedBgm === id && bgm?.id !== id) wantedBgm = bgm?.id ?? null;
    if (!buffer || wantedBgm !== id) return;
    if (bgm?.id === id) {
      if (bgm.head) switchToFull(mgr, bgm, buffer);
      return;
    }
    // スマホのブラウザは最初に画面に触れるまで音を出せないので、触れた後に始める
    if (mgr.locked) {
      mgr.once(Phaser.Sound.Events.UNLOCKED, () => {
        if (wantedBgm === id && bgm?.id !== id) startBgm(mgr, id, buffer, false);
      });
      return;
    }
    startBgm(mgr, id, buffer, false);
  })();
}

/** 曲のくり返し方を音の元に付ける（頭だけの時はくり返さない） */
function setLoop(source: AudioBufferSourceNode, id: string, buffer: AudioBuffer, head: boolean): void {
  source.buffer = buffer;
  source.loop = !head;
  const loop = BGM_LOOPS[id];
  if (loop && !head) {
    source.loopStart = loop.start;
    source.loopEnd = Math.min(loop.end, buffer.duration);
  }
}

/** 前の曲を小さくしながら止めて、用意のできた曲（頭だけか全体）を始める */
function startBgm(mgr: Phaser.Sound.WebAudioSoundManager, id: string, buffer: AudioBuffer, head: boolean): void {
  fadeOutBgm();
  const ctx = mgr.context;
  const gain = ctx.createGain();
  gain.gain.value = getSettings().bgmVolume;
  gain.connect(mgr.destination);
  const part = ctx.createGain();
  part.connect(gain);
  const source = ctx.createBufferSource();
  setLoop(source, id, buffer, head);
  source.connect(part);
  const startedAt = ctx.currentTime;
  source.start(startedAt);
  bgm = { id, source, gain, part, head, startedAt };
}

/** 頭だけを鳴らしている曲を、解けた全体へ移す。鳴っている位置から続け、少し重ねて切り替える */
function switchToFull(mgr: Phaser.Sound.WebAudioSoundManager, playing: Playing, buffer: AudioBuffer): void {
  const ctx = mgr.context;
  const at = ctx.currentTime + 0.02;
  let offset = at - playing.startedAt;
  const loop = BGM_LOOPS[playing.id];
  const loopEnd = loop ? Math.min(loop.end, buffer.duration) : buffer.duration;
  const loopStart = loop?.start ?? 0;
  if (offset >= loopEnd) offset = loopStart + ((offset - loopStart) % (loopEnd - loopStart));
  const part = ctx.createGain();
  part.gain.setValueAtTime(0, at);
  part.gain.linearRampToValueAtTime(1, at + BGM_HEAD.crossfadeSec);
  part.connect(playing.gain);
  const source = ctx.createBufferSource();
  setLoop(source, playing.id, buffer, false);
  source.connect(part);
  source.start(at, offset);
  const old = playing.source;
  const oldPart = playing.part;
  oldPart.gain.setValueAtTime(1, at);
  oldPart.gain.linearRampToValueAtTime(0, at + BGM_HEAD.crossfadeSec);
  old.stop(at + BGM_HEAD.crossfadeSec + 0.01);
  old.onended = () => oldPart.disconnect();
  playing.source = source;
  playing.part = part;
  playing.head = false;
  debugLog(`${playing.id}：全体へ移った（${offset.toFixed(2)}秒の所から）`);
}

/** 曲の頭（BGM_HEAD.sec 秒ぶんの mp3）だけを解く。小さい曲や解けない時は null（全体を待つ） */
async function decodeHead(ctx: BaseAudioContext, entry: AssetEntry): Promise<AudioBuffer | null> {
  try {
    const t0 = performance.now();
    const data = await fetchBgm(entry);
    const bytes = BGM_HEAD.sec * BGM_HEAD.bytesPerSec;
    if (data.byteLength < bytes * 2) return null;
    const t1 = performance.now();
    const head = await ctx.decodeAudioData(data.slice(0, bytes));
    debugLog(`${entry.id}：読む ${Math.round(t1 - t0)}ms・頭を解く ${Math.round(performance.now() - t1)}ms（${head.duration.toFixed(1)}秒ぶん）`);
    return head;
  } catch (e) {
    console.warn(`[sound] BGM の頭を解けなかった：${entry.id}`, e);
    return null;
  }
}

/** ?debug=1 の時だけ、曲の読み込みの時間をログに出す（スマホでは eruda で見る） */
function debugLog(msg: string): void {
  if (isDebugEnabled(window.location.search)) console.info(`[bgm] ${msg}`);
}

/**
 * 曲の音のデータを用意する。読んだ mp3 は小さいので全部残し、音に解いたもの（1曲で数十MB）は最近使った KEEP_DECODED 曲だけ残す。
 * 読めない・解けない時は null（BGM なしで続ける）
 */
function bgmBuffer(ctx: BaseAudioContext, entry: AssetEntry): Promise<AudioBuffer | null> {
  const hit = decoded.get(entry.id);
  if (hit) {
    decoded.delete(entry.id);
    decoded.set(entry.id, hit);
    return Promise.resolve(hit);
  }
  let p = decoding.get(entry.id);
  if (!p) {
    p = decodeBgm(ctx, entry);
    decoding.set(entry.id, p);
    void p.then(() => decoding.delete(entry.id));
  }
  return p;
}

async function decodeBgm(ctx: BaseAudioContext, entry: AssetEntry): Promise<AudioBuffer | null> {
  try {
    const t0 = performance.now();
    const data = await fetchBgm(entry);
    const t1 = performance.now();
    // 解くと元のデータが使えなくなるので、写しを渡す
    const buffer = await ctx.decodeAudioData(data.slice(0));
    debugLog(`${entry.id}：読む ${Math.round(t1 - t0)}ms・全体を解く ${Math.round(performance.now() - t1)}ms（${buffer.duration.toFixed(0)}秒）`);
    decoded.set(entry.id, buffer);
    for (const old of decoded.keys()) {
      if (decoded.size <= KEEP_DECODED) break;
      decoded.delete(old);
    }
    return buffer;
  } catch (e) {
    console.warn(`[sound] BGM を読めなかった：${entry.id}`, e);
    return null;
  }
}

/** 曲の mp3 を読む（同じ曲を2回読まない。端末にしまってあればそこから） */
function fetchBgm(entry: AssetEntry): Promise<ArrayBuffer> {
  let p = encoded.get(entry.id);
  if (!p) {
    p = readBgm(entry);
    p.catch(() => encoded.delete(entry.id));
    encoded.set(entry.id, p);
  }
  return p;
}

/**
 * すぐ後で流す曲を、先に音に解いておく（会話の台本の先にある曲など。流す時に待たないように）。
 * 流れている曲と同じなら何もしない
 */
export function warmBgm(scene: Phaser.Scene, id: string): void {
  const entry = ASSETS.find((a) => a.id === id && a.kind === 'audio' && a.file);
  const mgr = scene.sound;
  if (!entry || bgm?.id === id || decoded.has(id) || !(mgr instanceof Phaser.Sound.WebAudioSoundManager)) return;
  void bgmBuffer(mgr.context, entry);
}

/** すぐ後で流しそうな曲を、先に読んでおく（探索に入ったら戦闘の曲など。解くのは流す時） */
export function prefetchBgm(ids: string[]): void {
  for (const id of ids) {
    const entry = ASSETS.find((a) => a.id === id && a.kind === 'audio' && a.file);
    if (entry) fetchBgm(entry).catch(() => undefined);
  }
}

/**
 * 会話の文字の音（段階22の試し）。音のファイルを使わず、短い「ポッ」という音をその場で作る。
 * 毎回わずかに高さを揺らして、機械的に聞こえないようにする。設定で切っている・効果音の音量が0・音を出せない時は鳴らさない
 */
export function playBlip(scene: Phaser.Scene, voice: BlipVoice): void {
  const st = getSettings();
  const mgr = scene.sound;
  if (!st.typeSound || st.seVolume <= 0 || mgr.locked || !(mgr instanceof Phaser.Sound.WebAudioSoundManager)) return;
  const ctx = mgr.context;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = voice.wave;
  osc.frequency.value = voice.pitch * (0.94 + Math.random() * 0.12);
  const gain = ctx.createGain();
  // 音色ごとの聞こえ方の差をそろえる（大きくなりすぎないよう上限をかける）
  const peak = Math.min(0.4, 0.2 * (WAVE_GAIN[voice.wave] ?? 1)) * st.seVolume;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
  let out: AudioNode = osc;
  if (voice.phone) {
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 1200;
    band.Q.value = 1.5;
    osc.connect(band);
    out = band;
  }
  out.connect(gain);
  gain.connect(mgr.destination);
  osc.start(now);
  osc.stop(now + 0.06);
  osc.onended = () => gain.disconnect();
}

/**
 * 時計の秒針の「チッ」という音（段階22 調整12）。音のファイルを使わず、短い雑音を高い音だけ通して作る。
 * tock は少し低い音（チッ・タッと交互に鳴らす）。gain で大きさを下げられる（店じゅうの時計の、遠くの音など）
 */
export function playTick(scene: Phaser.Scene, tock: boolean, gain = 1): void {
  const st = getSettings();
  const mgr = scene.sound;
  if (st.seVolume <= 0 || mgr.locked || !(mgr instanceof Phaser.Sound.WebAudioSoundManager)) return;
  const ctx = mgr.context;
  const now = ctx.currentTime;
  const len = Math.floor(ctx.sampleRate * 0.03);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = (tock ? 2600 : 3400) * (0.97 + Math.random() * 0.06);
  band.Q.value = 6;
  const g = ctx.createGain();
  g.gain.value = 1.6 * gain * st.seVolume;
  src.connect(band);
  band.connect(g);
  g.connect(mgr.destination);
  src.start(now);
  src.onended = () => g.disconnect();
}

/**
 * 語りの文の、砂がさらさら落ちる音（段階31c）。効果音ラボに合う音がなかったので、秒針の音と同じくその場で作る。
 * ごく短く弱い粒をたくさん散らし、ゆらぐ「さーっ」を敷いて、高い音だけ通す（材料は sandNoise.ts）。ふわっと始まり、ゆっくり消える
 */
export function playSand(scene: Phaser.Scene): void {
  const st = getSettings();
  const mgr = scene.sound;
  if (st.seVolume <= 0 || mgr.locked || !(mgr instanceof Phaser.Sound.WebAudioSoundManager)) return;
  const ctx = mgr.context;
  const now = ctx.currentTime;
  const { durationSec, grainsPerSec, grain, hiss, highpassHz, lowpassHz, fadeInSec, fadeOutSec, gain } = SAND_SOUND;
  const len = Math.floor(ctx.sampleRate * durationSec);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  addSandGrains(data, ctx.sampleRate, Math.floor(grainsPerSec * durationSec), grain);
  addSandHiss(data, ctx.sampleRate, hiss);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const high = ctx.createBiquadFilter();
  high.type = 'highpass';
  high.frequency.value = highpassHz;
  const low = ctx.createBiquadFilter();
  low.type = 'lowpass';
  low.frequency.value = lowpassHz;
  const g = ctx.createGain();
  const peak = gain * st.seVolume;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(peak, now + fadeInSec);
  g.gain.setValueAtTime(peak, now + durationSec - fadeOutSec);
  g.gain.linearRampToValueAtTime(0, now + durationSec);
  src.connect(high);
  high.connect(low);
  low.connect(g);
  g.connect(mgr.destination);
  src.start(now);
  src.onended = () => g.disconnect();
}

/**
 * コマを手に入れた時の「キラン」（段階31c の残り）。澄んだ音（正弦波と、その倍の高さの小さな音）を少しずつずらして重ねる。
 * all はそろった時（3音）
 */
export function playKoma(scene: Phaser.Scene, all = false): void {
  const st = getSettings();
  const mgr = scene.sound;
  if (st.seVolume <= 0 || mgr.locked || !(mgr instanceof Phaser.Sound.WebAudioSoundManager)) return;
  const ctx = mgr.context;
  const { stepSec, ringSec, gain } = KOMA_SOUND;
  const notes = all ? KOMA_SOUND.all : KOMA_SOUND.notes;
  notes.forEach((hz, i) => {
    const at = ctx.currentTime + i * stepSec;
    const g = ctx.createGain();
    const peak = gain * st.seVolume;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(peak, at + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, at + ringSec);
    g.connect(mgr.destination);
    for (const [mul, amp] of [[1, 1], [2, 0.25]] as const) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = hz * mul;
      const og = ctx.createGain();
      og.gain.value = amp;
      osc.connect(og);
      og.connect(g);
      osc.start(at);
      osc.stop(at + ringSec);
      osc.onended = () => og.disconnect();
    }
    setTimeout(() => g.disconnect(), (i * stepSec + ringSec) * 1000 + 100);
  });
}

/**
 * 時間を返す時の、砂が昇る音（段階31c の残り）。語りの砂の音と同じ粒を、後ろほど濃く散らし、高い音だけ通す境目を上げていく。
 * 下に、高さが上がっていくうっすらした音を重ねる
 */
export function playSandRise(scene: Phaser.Scene): void {
  const st = getSettings();
  const mgr = scene.sound;
  if (st.seVolume <= 0 || mgr.locked || !(mgr instanceof Phaser.Sound.WebAudioSoundManager)) return;
  const ctx = mgr.context;
  const now = ctx.currentTime;
  const r = SAND_RISE_SOUND;
  const len = Math.floor(ctx.sampleRate * r.durationSec);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  // 粒：時間とともに増やす（1秒あたりの数を、始めから終わりへ直線で。後ろほど多く置く）
  const a: number = r.grainsFrom;
  const b: number = r.grainsTo;
  const place = (u: number) => (a === b ? u : (Math.sqrt(a * a + (b * b - a * a) * u) - a) / (b - a));
  addSandGrains(data, ctx.sampleRate, Math.floor(((a + b) / 2) * r.durationSec), SAND_SOUND.grain, Math.random, place);
  addSandHiss(data, ctx.sampleRate, SAND_SOUND.hiss);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const high = ctx.createBiquadFilter();
  high.type = 'highpass';
  high.frequency.setValueAtTime(r.highFrom, now);
  high.frequency.exponentialRampToValueAtTime(r.highTo, now + r.durationSec);
  const low = ctx.createBiquadFilter();
  low.type = 'lowpass';
  low.frequency.value = SAND_SOUND.lowpassHz;
  const g = ctx.createGain();
  const peak = r.gain * st.seVolume;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(peak, now + r.fadeInSec);
  g.gain.setValueAtTime(peak, now + r.durationSec - r.fadeOutSec);
  g.gain.linearRampToValueAtTime(0, now + r.durationSec);
  src.connect(high);
  high.connect(low);
  low.connect(g);
  g.connect(mgr.destination);
  // 昇る音
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(r.toneFrom, now);
  osc.frequency.exponentialRampToValueAtTime(r.toneTo, now + r.durationSec);
  const og = ctx.createGain();
  og.gain.value = r.toneGain;
  osc.connect(og);
  og.connect(g);
  src.start(now);
  osc.start(now);
  osc.stop(now + r.durationSec);
  src.onended = () => {
    og.disconnect();
    g.disconnect();
  };
}

/**
 * 音を出すように頼んでから、実際にスピーカーから聞こえるまでの遅れ（ミリ秒）。
 * ワイヤレスイヤホン（Bluetooth）は 0.1〜0.3 秒遅れるので、設定でワイヤレスイヤホンを選んだ時だけ、文字の音をこの分だけ文字より先に鳴らし始める。
 * ブラウザが教えてくれない時は、少しだけ（50ミリ秒）先に鳴らす
 */
export function audioLatencyMs(scene: Phaser.Scene): number {
  // スピーカーでは早めない（ブラウザの値はワイヤレスイヤホンの遅れに近く、スピーカーだと音が早すぎた。2026-10-08 開発者のスマホで確認）
  if (getSettings().audioOut !== 'wireless') return 0;
  const mgr = scene.sound;
  if (!(mgr instanceof Phaser.Sound.WebAudioSoundManager)) return 0;
  const ctx = mgr.context as AudioContext;
  const sec = (ctx.outputLatency || 0) + (ctx.baseLatency || 0) || 0.05;
  return Math.min(300, Math.max(0, Math.round(sec * 1000)));
}

/**
 * 環境音を鳴らし始める（段階32b 調整3）。同じ音が鳴っていればそのまま。短い音を、高さを少し変えながら重ねて鳴らし続ける。
 * 音を出せない間に頼まれたら、出せるようになってから始める
 */
export function startAmbience(scene: Phaser.Scene, id: string): void {
  if (ambience?.id === id) return;
  stopAmbience();
  const mgr = scene.sound;
  if (!loaded(scene, id) || !(mgr instanceof Phaser.Sound.WebAudioSoundManager)) return;
  const amb: Ambience = { id, master: null, timer: null };
  ambience = amb;
  const begin = () => {
    if (ambience !== amb) return;
    const ctx = mgr.context;
    const buffer = scene.cache.audio.get(id) as AudioBuffer;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(ambienceLevel(id), ctx.currentTime + AMBIENCE.fadeSec);
    master.connect(mgr.destination);
    amb.master = master;
    const spawn = () => {
      if (ambience !== amb) return;
      const now = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const rate = AMBIENCE.rateMin + Math.random() * (AMBIENCE.rateMax - AMBIENCE.rateMin);
      src.playbackRate.value = rate;
      // 始めをふわっと（台帳の音は終わりが消えていくので、終わりはそのまま重ねる）
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(1, now + AMBIENCE.fadeSec);
      src.connect(g);
      g.connect(master);
      src.start(now);
      src.onended = () => g.disconnect();
      const next = AMBIENCE.everySec + (Math.random() * 2 - 1) * AMBIENCE.jitterSec;
      amb.timer = setTimeout(spawn, Math.max(0.5, next) * 1000);
    };
    spawn();
  };
  if (mgr.locked) mgr.once(Phaser.Sound.Events.UNLOCKED, begin);
  else begin();
}

/** 環境音を小さくしながら止める */
export function stopAmbience(): void {
  const amb = ambience;
  ambience = null;
  if (!amb) return;
  if (amb.timer) clearTimeout(amb.timer);
  const master = amb.master;
  if (!master) return;
  const now = master.context.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  master.gain.linearRampToValueAtTime(0, now + AMBIENCE.fadeSec);
  setTimeout(() => master.disconnect(), (AMBIENCE.fadeSec + 0.1) * 1000);
}

/** 今鳴っている環境音（台帳の id）。自動の確認で使う */
export function currentAmbience(): string | null {
  return ambience?.id ?? null;
}

/** BGM を小さくしながら止める */
export function stopBgm(): void {
  wantedBgm = null;
  fadeOutBgm();
}

function fadeOutBgm(): void {
  if (!bgm) return;
  const { source, gain } = bgm;
  bgm = null;
  const now = gain.context.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(0, now + FADE_SEC);
  source.stop(now + FADE_SEC);
  source.onended = () => gain.disconnect();
}

/** 今流れている BGM（台帳の id）。自動の確認で使う */
export function currentBgm(): string | null {
  return bgm?.id ?? null;
}

/** 今流れている BGM を、頭だけで鳴らしているか（自動の確認で使う） */
export function bgmFromHead(): boolean {
  return bgm?.head ?? false;
}
