import Phaser from 'phaser';
import type { Settings } from '../core';
import { parseSettings, serializeSettings } from '../core';
import type { BlipVoice } from '../data';
import { addSandGrains, addSandHiss } from './sandNoise';
import { AMBIENCE, BGM_LOOPS, KOMA_SOUND, SAND_RISE_SOUND, SAND_SOUND, SE_GAIN, WAVE_GAIN } from '../data';
import { browserStorage } from '../save/storage';

// 音を鳴らす部品（段階19）。音はすべてここを通して鳴らす。
// BGM はゲーム全体で1曲だけ。画面が替わっても止めず、別の曲を頼まれた時だけ切り替える。
// スマホのブラウザは最初に画面に触れるまで音を出せないので、その前に頼まれた BGM は触れた後に始める。
// BGM のくり返しは、ブラウザの音の機能（Web Audio）に直接任せる（区間の前から区間へのつなぎも、区間の終わりから始めへも切れ目がない。段階20）

const SETTINGS_KEY = 'restopia.settings';
/** 曲を切り替える時に、前の曲を小さくしていく時間（秒） */
const FADE_SEC = 0.6;

interface Playing {
  id: string;
  source: AudioBufferSourceNode;
  gain: GainNode;
}

let settings: Settings | null = null;
let bgm: Playing | null = null;
/** 音を出せるようになるのを待っている BGM */
let waitingBgm: string | null = null;

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
 * BGM を流す。同じ曲が流れていればそのまま。別の曲なら前の曲を小さくしながら止めて、次の曲を始める。
 * BGM_LOOPS にくり返す区間があれば、区間の前を1回流してから区間をくり返す。なければ曲の全体をくり返す
 */
export function playBgm(scene: Phaser.Scene, id: string): void {
  if (bgm?.id === id || !loaded(scene, id)) return;
  const mgr = scene.sound;
  // Web Audio が使えないブラウザでは BGM を鳴らさない（今のスマホのブラウザはどれも使える）
  if (!(mgr instanceof Phaser.Sound.WebAudioSoundManager)) return;
  if (mgr.locked) {
    if (waitingBgm === null) {
      mgr.once(Phaser.Sound.Events.UNLOCKED, () => {
        const next = waitingBgm;
        waitingBgm = null;
        if (next) playBgm(scene.game.scene.getScenes(true)[0] ?? scene, next);
      });
    }
    waitingBgm = id;
    return;
  }
  stopBgm();
  const buffer = scene.cache.audio.get(id) as AudioBuffer;
  const ctx = mgr.context;
  const gain = ctx.createGain();
  gain.gain.value = getSettings().bgmVolume;
  gain.connect(mgr.destination);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const loop = BGM_LOOPS[id];
  if (loop) {
    source.loopStart = loop.start;
    source.loopEnd = Math.min(loop.end, buffer.duration);
  }
  source.connect(gain);
  source.start();
  bgm = { id, source, gain };
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
  waitingBgm = null;
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
