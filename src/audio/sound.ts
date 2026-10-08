import Phaser from 'phaser';
import type { Settings } from '../core';
import { parseSettings, serializeSettings } from '../core';
import { BGM_LOOPS } from '../data';
import { browserStorage } from '../save/storage';

// 音を鳴らす部品（段階19）。音はすべてここを通して鳴らす。
// BGM はゲーム全体で1曲だけ。画面が替わっても止めず、別の曲を頼まれた時だけ切り替える。
// スマホのブラウザは最初に画面に触れるまで音を出せないので、その前に頼まれた BGM は触れた後に始める

const SETTINGS_KEY = 'restopia.settings';
/** 曲を切り替える時に、前の曲を小さくしていく時間（ミリ秒） */
const FADE_MS = 600;

let settings: Settings | null = null;
let bgm: { id: string; sound: Phaser.Sound.BaseSound } | null = null;
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
  if (bgm) setVolume(bgm.sound, next.bgmVolume);
}

function setVolume(sound: Phaser.Sound.BaseSound, v: number): void {
  (sound as Phaser.Sound.WebAudioSound).setVolume(v);
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
  if (scene.sound.locked) {
    if (waitingBgm === null) {
      scene.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
        const next = waitingBgm;
        waitingBgm = null;
        if (next) playBgm(scene.game.scene.getScenes(true)[0] ?? scene, next);
      });
    }
    waitingBgm = id;
    return;
  }
  stopBgm(scene);
  const volume = getSettings().bgmVolume;
  const sound = scene.sound.add(id, { volume });
  const loop = BGM_LOOPS[id];
  if (loop) {
    sound.addMarker({ name: 'intro', start: 0, duration: loop.start });
    sound.addMarker({ name: 'loop', start: loop.start, duration: loop.end - loop.start, config: { loop: true, volume } });
    sound.once(Phaser.Sound.Events.COMPLETE, () => {
      if (bgm?.sound === sound) sound.play('loop', { volume: getSettings().bgmVolume });
    });
    sound.play(loop.start > 0 ? 'intro' : 'loop');
  } else {
    sound.play({ loop: true });
  }
  bgm = { id, sound };
}

/** BGM を小さくしながら止める */
export function stopBgm(scene: Phaser.Scene): void {
  waitingBgm = null;
  if (!bgm) return;
  const old = bgm.sound;
  bgm = null;
  // 小さくしている途中で画面が替わったら、その場で止める
  const kill = () => old.destroy();
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, kill);
  scene.tweens.add({
    targets: old,
    volume: 0,
    duration: FADE_MS,
    onComplete: () => {
      scene.events.off(Phaser.Scenes.Events.SHUTDOWN, kill);
      old.destroy();
    },
  });
}
