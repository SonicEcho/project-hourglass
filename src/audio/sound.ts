import Phaser from 'phaser';
import type { Settings } from '../core';
import { parseSettings, serializeSettings } from '../core';
import type { BlipVoice } from '../data';
import { BGM_LOOPS } from '../data';
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
}

function loaded(scene: Phaser.Scene, id: string): boolean {
  return scene.cache.audio.exists(id);
}

/** 効果音を鳴らす。読み込めていない・音量0の時は鳴らさない */
export function playSe(scene: Phaser.Scene, id: string): void {
  const v = getSettings().seVolume;
  if (v <= 0 || !loaded(scene, id) || scene.sound.locked) return;
  scene.sound.play(id, { volume: v });
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
  const peak = 0.09 * st.seVolume;
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
