import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { hasImage } from '../assets/loader';
import { audioLatencyMs, getSettings, playBgm, playBlip, playSe, setSettings, stopBgm } from '../audio/sound';
import type { ScriptCommand, ScriptLine, ScriptPos, ScriptScene, ScriptVars } from '../core';
import { chooseOption, parseReadLog, runScript, serializeReadLog } from '../core';
import type { ActorMotion, Ambient, Backdrop, BlipVoice, Emote } from '../data';
import { BACKDROPS, BLIP_EVERY, CAST, CGS, FACE_EMOTES, FACE_MOTIONS, M1_SCENES, NARRATION_SAND_COLOR, SCRIPT_BGM, SCRIPT_SE, VOICE_DEFAULT, VOICE_ONLY } from '../data';
import { isDebugEnabled } from '../debug/debugFlag';
import { browserStorage } from '../save/storage';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText } from '../ui/widgets';

/** 文字送りの速さ（1文字あたりのミリ秒）。語りの文はゆっくり */
const CHAR_MS = 35;
const NARRATION_CHAR_MS = 55;
/** 早送りの時、次の行へ進むまでの時間（ミリ秒） */
const SKIP_MS = 120;
/** オートの時、全文が出てから次へ進むまでの時間（ミリ秒）= 基本 + 1文字ごと */
const AUTO_BASE_MS = 1100;
const AUTO_PER_CHAR_MS = 45;
/** 話していない人の立ち絵の暗さ（重なっても透けないよう、薄くするのではなく暗くする。段階18a） */
const DIM_TINT = 0x707070;
/** 立ち絵の下の端（本文の枠の上の辺） */
const STAGE_BOTTOM = 560;
/** 背景・1枚絵を前の絵に重ねて替える時間、人が出入りする時間（ミリ秒） */
const PICTURE_FADE_MS = 350;
const ACTOR_FADE_MS = 250;
/** 背景・1枚絵がゆっくり寄っていく大きさと時間（止まった絵に見えないように） */
const DRIFT_SCALE = 1.04;
const DRIFT_MS = 14000;
const CG_DRIFT_SCALE = 1.06;
const CG_DRIFT_MS = 10000;
/** @zoom で寄る時の中心（立ち絵の顔のあたり）と時間 */
const ZOOM_FOCUS = { x: GAME_WIDTH / 2, y: 330 };
const ZOOM_MS = 700;
/** 文字の音を鳴らさない文字（句読点・記号・空白） */
const SILENT_CHARS = new Set([...'、。，．…‥！？!?「」『』（）()—―ー〜・　 \n']);
/** 読んだ台詞の印の保存先（セーブとは別。はじめからやり直しても、読んだ所は早送りできる） */
const READ_KEY = 'restopia.read';

/** 画面に出す人の並び（人数ごとの x） */
const STAGE_X: Record<number, number[]> = { 1: [195], 2: [118, 272], 3: [78, 195, 312] };

export interface DialogueData {
  /** 最初の場面の id */
  scene: string;
  /** 続けて見る場面（今の場面が終わったら、順に始める） */
  queue?: string[];
  /** 覚えている値（金魚の名前など） */
  vars?: ScriptVars;
  /** 全部終わった後に移る画面（なければタイトル） */
  next?: { key: string; data?: object };
}

/**
 * 画面に出ている人。外の入れ物（obj）は出入り・横の移動・大きさ、中身（body）は芝居の動きに使う（動きがぶつからないように分ける）
 */
interface Actor {
  obj: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Container;
  /** 頭のてっぺん（obj の中の y。ふきだしを出す高さ） */
  top: number;
  face: string;
  /** 沈んでいる（心配など）。別の表情になったら戻す */
  sunk: boolean;
  setActive(active: boolean): void;
  setFace(face: string): void;
}

let readLog: Set<string> | null = null;
function getReadLog(): Set<string> {
  if (!readLog) readLog = parseReadLog(browserStorage().read(READ_KEY));
  return readLog;
}
function markRead(key: string): void {
  const log = getReadLog();
  if (log.has(key)) return;
  log.add(key);
  browserStorage().write(READ_KEY, serializeReadLog(log));
}
/** 読んだ印を全部消す（デバッグメニューから） */
export function clearReadLog(): void {
  readLog = new Set();
  browserStorage().remove(READ_KEY);
}

/**
 * 会話の画面（段階22）。台本（src/data/scriptM1.ts）を src/core/script.ts で読み進めて見せる。
 * 文字送り、タップで全文 → 次へ、話している人の立ち絵を明るく、選択肢、ログ、早送り（読んだ所だけ）、オート。
 * 語りの文には砂が流れる。背景・立ち絵・1枚絵は、絵がなければ色と名前で仮に描く
 */
export class DialogueScene extends Phaser.Scene {
  private scenes: ScriptScene[] = M1_SCENES;
  private pos!: ScriptPos;
  private vars: ScriptVars = {};
  private queue: string[] = [];
  private nextScreen?: DialogueData['next'];
  private debug = false;

  private line?: ScriptLine;
  private text = '';
  /** 全文で折り返した後の文（文字送りの途中で折り返しが変わって、はみ出して見えないように） */
  private wrapped = '';
  private voice?: BlipVoice;
  private shown = 0;
  private typing?: Phaser.Time.TimerEvent;
  /** 文字の音を鳴らす時計（文字を出す時計より、音の遅れの分だけ先に動かす） */
  private blipTimer?: Phaser.Time.TimerEvent;
  /** 演出の途中（タップを受け付けない） */
  private busy = false;
  private choosing = false;
  private skip = false;
  private auto = false;
  private waitTimer?: Phaser.Time.TimerEvent;
  private fadedOut = false;
  private history: string[] = [];

  /** 背景・立ち絵・1枚絵をまとめた入れ物（寄る・色を抜く時に、本文の枠やボタンは動かさないため） */
  private world!: Phaser.GameObjects.Container;
  private zoom = 1;
  private monoFx?: Phaser.FX.ColorMatrix;
  private noiseLayer!: Phaser.GameObjects.Graphics;
  private noiseTimer?: Phaser.Time.TimerEvent;
  private bgLayer!: Phaser.GameObjects.Container;
  private stage!: Phaser.GameObjects.Container;
  private cgLayer!: Phaser.GameObjects.Container;
  private actors = new Map<string, Actor>();
  private cast: string[] = [];
  private box!: Phaser.GameObjects.Rectangle;
  private nameBox!: Phaser.GameObjects.Rectangle;
  private nameTag!: Phaser.GameObjects.Text;
  private body!: Phaser.GameObjects.Text;
  private cursor!: Phaser.GameObjects.Text;
  private caption!: Phaser.GameObjects.Text;
  private captionBg!: Phaser.GameObjects.Rectangle;
  private sand!: Phaser.GameObjects.Particles.ParticleEmitter;
  private logLayer?: Phaser.GameObjects.Container;
  private skipButton!: Phaser.GameObjects.Rectangle;
  private autoButton!: Phaser.GameObjects.Rectangle;
  private blipButton!: Phaser.GameObjects.Rectangle;
  private blipLabel!: Phaser.GameObjects.Text;
  private toast?: Phaser.GameObjects.Text;

  constructor() {
    super('Dialogue');
  }

  create(data: DialogueData): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.debug = isDebugEnabled(window.location.search);
    this.pos = { scene: data.scene, index: 0 };
    this.vars = { ...(data.vars ?? {}) };
    this.queue = [...(data.queue ?? [])];
    this.nextScreen = data.next;
    this.line = undefined;
    this.busy = false;
    this.choosing = false;
    this.skip = false;
    this.auto = false;
    this.fadedOut = false;
    this.history = [];
    this.actors.clear();
    this.cast = [];
    this.logLayer = undefined;

    this.zoom = 1;
    this.monoFx = undefined;
    this.bgLayer = this.add.container(0, 0);
    this.stage = this.add.container(0, 0);
    this.cgLayer = this.add.container(0, 0);
    this.world = this.add.container(0, 0, [this.bgLayer, this.stage, this.cgLayer]).setDepth(0);
    this.noiseLayer = this.add.graphics().setDepth(30);
    if (!this.textures.exists('dialogue-sand')) {
      const g = this.make.graphics({}, false);
      g.fillStyle(0xffffff, 1).fillRect(0, 0, 2, 2);
      g.generateTexture('dialogue-sand', 2, 2);
      g.destroy();
    }
    this.setBackdrop('black');

    // 本文の枠
    this.box = this.add.rectangle(16, 560, GAME_WIDTH - 32, 200, 0x0b1118, 0.92).setOrigin(0).setStrokeStyle(2, COLORS.border).setDepth(40);
    this.nameBox = this.add.rectangle(28, 540, 140, 36, COLORS.panelLight).setOrigin(0).setStrokeStyle(2, COLORS.accent).setDepth(41);
    this.nameTag = addText(this, 98, 558, '', { size: 15, bold: true, color: COLORS.accentText }).setOrigin(0.5).setDepth(42);
    this.body = addText(this, 34, 592, '', { size: 17, wrap: GAME_WIDTH - 68 }).setDepth(42);
    this.body.setLineSpacing(6);
    this.cursor = addText(this, GAME_WIDTH - 40, 735, '▼', { size: 14, color: COLORS.accentText }).setOrigin(0.5).setDepth(42);
    this.tweens.add({ targets: this.cursor, alpha: 0.2, yoyo: true, repeat: -1, duration: 400 });

    // 章の扉などの大きな文字
    this.captionBg = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 1).setOrigin(0).setDepth(70).setVisible(false);
    this.caption = addText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, '', { size: 22, bold: true, align: 'center', wrap: GAME_WIDTH - 60, color: '#f3e2b8' })
      .setOrigin(0.5)
      .setDepth(71)
      .setVisible(false);

    // 語りの文に流れる砂（ヴィクトの鎖の砂時計と同じ暗い金）
    this.sand = this.add.particles(0, 0, 'dialogue-sand', {
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(30, 575, GAME_WIDTH - 60, 20) } as Phaser.Types.GameObjects.Particles.EmitZoneData,
      speedY: { min: 18, max: 45 },
      speedX: { min: -8, max: 8 },
      lifespan: 2200,
      alpha: { start: 0.9, end: 0 },
      scale: { min: 0.6, max: 1.2 },
      tint: NARRATION_SAND_COLOR,
      frequency: 45,
      emitting: false,
    });
    this.sand.setDepth(43);

    // 上のボタン
    const ui = this.add.container(0, 0).setDepth(50);
    addButton(this, ui, 42, 30, 70, 40, '戻る', { onTap: () => this.leave() }, { size: 13 });
    this.blipButton = addButton(this, ui, 121, 30, 74, 40, '', { onTap: () => this.toggleBlip() }, { size: 12 });
    this.blipLabel = ui.list[ui.list.length - 1] as Phaser.GameObjects.Text;
    this.refreshBlipButton();
    this.autoButton = addButton(this, ui, 200, 30, 70, 40, 'オート', { onTap: () => this.toggleAuto() }, { size: 13 });
    this.skipButton = addButton(this, ui, 276, 30, 70, 40, '早送り', { onTap: () => this.toggleSkip() }, { size: 13 });
    addButton(this, ui, 350, 30, 68, 40, 'ログ', { onTap: () => this.toggleLog() }, { size: 13 });

    // 画面のどこかをタップ（ボタン・選択肢の上は除く）
    this.input.on('pointerup', (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length > 0 || this.choosing || this.logLayer) return;
      this.advance();
    });

    void this.proceed();
  }

  /** 次の止まる所まで台本を進め、演出をしてから見せる */
  private async proceed(): Promise<void> {
    this.busy = true;
    this.waitTimer?.remove();
    const r = runScript(this.scenes, this.pos, this.vars);
    this.vars = r.vars;
    for (const cmd of r.commands) await this.apply(cmd);
    this.busy = false;
    if (r.stop.type === 'end') {
      this.endScene();
      return;
    }
    if (r.stop.type === 'choice') {
      this.pos = r.pos;
      this.showChoices(r.stop.choice.options.map((o) => o.label));
      return;
    }
    this.pos = r.pos;
    if (this.skip && !this.debug && !getReadLog().has(r.stop.key)) {
      this.setSkip(false);
      this.showToast('まだ読んでいない所で止まりました');
    }
    markRead(r.stop.key);
    if (this.fadedOut) await this.fade('in');
    this.showLine(r.stop.line, r.stop.text);
  }

  /** 演出の命令を1つ行う。時間がかかるものは終わるまで待つ */
  private async apply(cmd: ScriptCommand): Promise<void> {
    const [a, ...rest] = cmd.args;
    switch (cmd.name) {
      case 'bg':
        this.setBackdrop(a ?? 'black');
        return;
      case 'bgm':
        if (a === 'stop') stopBgm();
        else if (SCRIPT_BGM[a]) playBgm(this, SCRIPT_BGM[a]);
        return;
      case 'se': {
        const id = SCRIPT_SE[a];
        if (id && !this.skip) playSe(this, id);
        return;
      }
      case 'cast':
        this.setCast(cmd.args);
        return;
      case 'fade':
        await this.fade(a as 'out' | 'in' | 'white');
        return;
      case 'shake':
        if (!this.skip) this.cameras.main.shake(300, 0.008);
        return;
      case 'cg':
        this.setCg(a === 'off' ? null : a);
        return;
      case 'wait':
        await this.delay(this.skip ? 0 : Number(a) || 0);
        return;
      case 'act': {
        const actor = this.actors.get(a);
        if (actor) this.act(actor, rest[0] as ActorMotion);
        return;
      }
      case 'emote': {
        const actor = this.actors.get(a);
        if (actor) this.emote(actor, rest[0] as Emote);
        return;
      }
      case 'zoom':
        this.setZoom(Number(a) || 1);
        return;
      case 'mono':
        this.setMono(a === 'on');
        return;
      case 'noise':
        this.playNoise(Number(a) || 500);
        return;
      default:
        console.warn('[dialogue] 使えない命令', cmd.name, rest);
    }
  }

  private delay(ms: number): Promise<void> {
    if (ms <= 0) return Promise.resolve();
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  private fade(kind: 'out' | 'in' | 'white'): Promise<void> {
    const cam = this.cameras.main;
    const ms = this.skip ? 80 : 450;
    return new Promise((resolve) => {
      if (kind === 'out') {
        this.fadedOut = true;
        cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => resolve());
        cam.fadeOut(ms, 0, 0, 0);
      } else if (kind === 'in') {
        this.fadedOut = false;
        cam.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => resolve());
        cam.fadeIn(ms, 0, 0, 0);
      } else {
        cam.flash(ms + 150, 255, 255, 255);
        this.time.delayedCall(ms, resolve);
      }
    });
  }

  /** 背景。絵があれば画面を覆うように置き、なければ色の帯と名前（仮） */
  private setBackdrop(id: string): void {
    const def = id === 'none' ? BACKDROPS.black : BACKDROPS[id];
    if (!def) {
      console.warn('[dialogue] 背景がない', id);
      return;
    }
    const holder = this.add.container(0, 0);
    this.drawPicture(holder, def, 0, GAME_HEIGHT, id !== 'black' && id !== 'white' && id !== 'none');
    if (def.ambient) this.addAmbient(holder, def.ambient);
    this.drift(holder, GAME_WIDTH / 2, GAME_HEIGHT / 2, DRIFT_SCALE, DRIFT_MS);
    this.crossfade(this.bgLayer, holder);
    // 場所が替わったら、寄っていたのを戻す
    if (this.zoom !== 1) this.setZoom(1);
  }

  /** 止まった絵に見えないよう、絵をゆっくり寄せては戻す（中心を保ったまま大きくするので、端に隙間はできない） */
  private drift(holder: Phaser.GameObjects.Container, cx: number, cy: number, scale: number, ms: number): void {
    const t = { k: 1 };
    const tween = this.tweens.add({
      targets: t,
      k: scale,
      duration: ms,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        if (!holder.active) return;
        holder.setScale(t.k).setPosition(cx * (1 - t.k), cy * (1 - t.k));
      },
    });
    holder.once(Phaser.GameObjects.Events.DESTROY, () => tween.remove());
  }

  /** 背景に流す空気：提灯の灯り（ゆっくり昇る暖かい光）、星（またたく）、舞う砂（ゆっくり落ちる金の粒） */
  private addAmbient(holder: Phaser.GameObjects.Container, kind: Ambient): void {
    const area = new Phaser.Geom.Rectangle(0, 60, GAME_WIDTH, STAGE_BOTTOM - 60);
    const twinkle = (_p: Phaser.GameObjects.Particles.Particle, _k: string, t: number) => Math.sin(t * Math.PI);
    const configs: Record<Ambient, Phaser.Types.GameObjects.Particles.ParticleEmitterConfig> = {
      lanterns: { speedY: { min: -14, max: -5 }, speedX: { min: -4, max: 4 }, lifespan: 5000, scale: { min: 1.5, max: 3 }, tint: [0xffc979, 0xffa04a, 0xffe0a0], frequency: 260 },
      stars: { speed: 0, lifespan: 3200, scale: { min: 0.6, max: 1.4 }, tint: [0xffffff, 0xcfe0ff], frequency: 180 },
      dust: { speedY: { min: 4, max: 12 }, speedX: { min: -5, max: 5 }, lifespan: 6000, scale: { min: 0.6, max: 1.2 }, tint: [0xd9ae62, 0xb08a3a], frequency: 220 },
    };
    const emitter = this.add.particles(0, 0, 'dialogue-sand', {
      ...configs[kind],
      emitZone: { type: 'random', source: area } as Phaser.Types.GameObjects.Particles.EmitZoneData,
      alpha: { onUpdate: twinkle },
      // 最初から画面に散らばっているように、少し先まで進めておく
      advance: 4000,
    });
    holder.add(emitter);
  }

  /** @zoom：背景・立ち絵・1枚絵だけを、顔のあたりを中心に寄せる（本文の枠とボタンは動かさない） */
  private setZoom(k: number): void {
    this.zoom = k;
    this.tweens.killTweensOf(this.world);
    const to = { scale: k, x: ZOOM_FOCUS.x * (1 - k), y: ZOOM_FOCUS.y * (1 - k) };
    if (this.skip) this.world.setScale(to.scale).setPosition(to.x, to.y);
    else this.tweens.add({ targets: this.world, ...to, duration: ZOOM_MS, ease: 'Sine.easeInOut' });
  }

  /** @mono：色を抜く（時計が止まった時など）。WebGL でない時は何もしない */
  private setMono(on: boolean): void {
    const fx = this.world.postFX;
    if (!fx) return;
    if (!this.monoFx) this.monoFx = fx.addColorMatrix();
    const m = this.monoFx;
    const from = on ? 0 : 1;
    const to = on ? 1 : 0;
    const t = { v: from };
    this.tweens.add({
      targets: t,
      v: to,
      duration: this.skip ? 0 : 500,
      onUpdate: () => {
        m.reset();
        m.saturate(-t.v);
      },
    });
  }

  /** @noise：すり切れた時間のノイズで、画面を少しの間乱す */
  private playNoise(ms: number): void {
    if (this.skip) return;
    this.noiseTimer?.remove();
    const g = this.noiseLayer;
    const until = this.time.now + ms;
    this.noiseTimer = this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        g.clear();
        if (this.time.now >= until) {
          this.noiseTimer?.remove();
          return;
        }
        for (let i = 0; i < 14; i++) {
          const y = Math.random() * STAGE_BOTTOM;
          g.fillStyle(Math.random() < 0.5 ? 0xffffff : 0x000000, 0.12 + Math.random() * 0.25).fillRect(0, y, GAME_WIDTH, 1 + Math.random() * 6);
        }
        for (let i = 0; i < 80; i++) g.fillStyle(0xffffff, Math.random() * 0.5).fillRect(Math.random() * GAME_WIDTH, Math.random() * STAGE_BOTTOM, 2, 2);
      },
    });
  }

  /** 前の絵の上に新しい絵を重ね、少しずつ濃くしてから前の絵を消す（急に切り替わらないように） */
  private crossfade(layer: Phaser.GameObjects.Container, holder: Phaser.GameObjects.Container): void {
    const prev = [...layer.list];
    layer.add(holder);
    if (this.skip || prev.length === 0) {
      prev.forEach((o) => o.destroy());
      return;
    }
    holder.setAlpha(0);
    this.tweens.add({ targets: holder, alpha: 1, duration: PICTURE_FADE_MS, onComplete: () => prev.forEach((o) => o.destroy()) });
  }

  /** 1枚絵（絵がなければ色と名前で仮に描く）。出している間は立ち絵を隠す */
  private setCg(id: string | null): void {
    const ms = this.skip ? 0 : PICTURE_FADE_MS;
    this.tweens.killTweensOf(this.stage);
    if (id === null) {
      const prev = [...this.cgLayer.list];
      this.tweens.add({ targets: prev, alpha: 0, duration: ms, onComplete: () => prev.forEach((o) => o.destroy()) });
      this.tweens.add({ targets: this.stage, alpha: 1, duration: ms });
      return;
    }
    const def = CGS[id];
    if (!def) {
      console.warn('[dialogue] 1枚絵がない', id);
      return;
    }
    const holder = this.add.container(0, 0);
    this.drawPicture(holder, def, 0, STAGE_BOTTOM, true);
    // 1枚絵は、ゆっくり寄っていく
    this.drift(holder, GAME_WIDTH / 2, STAGE_BOTTOM / 2, CG_DRIFT_SCALE, CG_DRIFT_MS);
    this.crossfade(this.cgLayer, holder);
    this.tweens.add({ targets: this.stage, alpha: 0, duration: ms });
  }

  private drawPicture(layer: Phaser.GameObjects.Container, def: Backdrop, top: number, bottom: number, label: boolean): void {
    const h = bottom - top;
    if (def.image && hasImage(this, def.image)) {
      const img = this.add.image(GAME_WIDTH / 2, top + h / 2, def.image);
      // 画面を覆う大きさにして、はみ出した所は見せない（地図の絵は縦長なので、真ん中あたりが見える）
      const s = Math.max(GAME_WIDTH / img.width, h / img.height);
      const cw = GAME_WIDTH / s;
      const ch = h / s;
      img.setScale(s).setCrop((img.width - cw) / 2, (img.height - ch) / 2, cw, ch);
      layer.add(img);
      return;
    }
    const g = this.add.graphics();
    g.fillGradientStyle(def.top, def.top, def.bottom, def.bottom, 1).fillRect(0, top, GAME_WIDTH, h);
    layer.add(g);
    if (label) layer.add(addText(this, GAME_WIDTH / 2, top + 90, `（仮）${def.title}`, { size: 13, color: '#ffffffaa', align: 'center', wrap: GAME_WIDTH - 40 }).setOrigin(0.5));
  }

  /** 画面に出す人を替える。前からいる人は表情をそのままにする */
  private setCast(names: string[]): void {
    const ms = this.skip ? 0 : ACTOR_FADE_MS;
    for (const [name, actor] of this.actors) {
      if (!names.includes(name)) {
        this.actors.delete(name);
        this.tweens.killTweensOf(actor.obj);
        this.tweens.add({ targets: actor.obj, alpha: 0, duration: ms, onComplete: () => actor.obj.destroy() });
      }
    }
    this.cast = names.slice(0, 3);
    const xs = STAGE_X[this.cast.length] ?? [];
    const small = this.cast.length >= 3;
    const k = small ? 0.82 : 1;
    this.cast.forEach((name, i) => {
      let actor = this.actors.get(name);
      if (actor && actor.obj.scale !== k) this.tweens.add({ targets: actor.obj, scale: k, duration: ms });
      if (!actor) {
        // 新しく出る人は、少し下からふわっと出す
        actor = this.makeActor(name);
        this.actors.set(name, actor);
        actor.obj.setScale(k).setPosition(xs[i], STAGE_BOTTOM + 12).setAlpha(0);
        this.tweens.add({ targets: actor.obj, alpha: 1, y: STAGE_BOTTOM, duration: ms, ease: 'Sine.easeOut' });
        return;
      }
      // 前からいる人は、並びが変わったら横に歩いて移る
      if (actor.obj.x !== xs[i]) this.tweens.add({ targets: actor.obj, x: xs[i], duration: ms, ease: 'Sine.easeInOut' });
    });
  }

  private makeActor(name: string): Actor {
    const def = CAST[name];
    const faceId = (face: string) => (def?.portrait ? `${def.portrait}.${def.faces[face] ?? face}` : '');
    const obj = this.add.container(0, STAGE_BOTTOM);
    const body = this.add.container(0, 0);
    obj.add(body);
    this.stage.add(obj);
    const base = { obj, body, face: def?.firstFace ?? '', sunk: false };
    if (def?.portrait && hasImage(this, faceId(def.firstFace))) {
      const img = this.add.image(0, 0, faceId(def.firstFace)).setOrigin(0.5, 1);
      const scale = (def.height ?? 420) / img.height;
      img.setScale(scale);
      // ゆっくり息をするように、わずかに伸び縮みさせる
      this.tweens.add({ targets: img, scaleY: scale * 1.006, yoyo: true, repeat: -1, duration: 1800, ease: 'Sine.easeInOut' });
      body.add(img);
      return {
        ...base,
        top: -img.displayHeight,
        setActive: (active) => (active ? img.clearTint() : img.setTint(DIM_TINT)),
        setFace: (face) => {
          // まだ絵のない表情は、代わりの表情の絵で出す
          const id = [face, def.fallback?.[face]].map((f) => (f ? faceId(f) : '')).find((x) => x && hasImage(this, x));
          if (id) img.setTexture(id);
        },
      };
    }
    // 絵がない人は図形と名前・表情で描く（仮）。足もと（本文の枠の上の辺）を基準に描く
    const color = def?.color ?? 0x808080;
    const head = this.add.ellipse(0, -310, 80, 92, color);
    const torso = this.add.rectangle(0, -95, 120, 190, color);
    const label = addText(this, 0, -90, name, { size: 13, bold: true, align: 'center' }).setOrigin(0.5);
    const faceText = addText(this, 0, -64, def ? `〔${def.firstFace}〕` : '', { size: 11, color: '#ffffffcc', align: 'center' }).setOrigin(0.5);
    body.add([head, torso, label, faceText]);
    return {
      ...base,
      top: -356,
      setActive: (active) => [head, torso, label].forEach((o) => o.setAlpha(active ? 1 : 0.45)),
      setFace: (face) => faceText.setText(`〔${face}〕`),
    };
  }

  /** 表情を替える。替わった表情に合わせて、芝居の動きとふきだしを出す */
  private changeFace(actor: Actor, face: string): void {
    if (actor.face === face) return;
    actor.face = face;
    actor.setFace(face);
    const motion = FACE_MOTIONS[face];
    if (actor.sunk && motion !== 'sink') this.act(actor, 'rise');
    if (motion) this.act(actor, motion);
    const mark = FACE_EMOTES[face];
    if (mark) this.emote(actor, mark);
  }

  /** 立ち絵の芝居。中身（body）だけを動かす */
  private act(actor: Actor, motion: ActorMotion): void {
    if (this.skip) {
      if (motion === 'sink' || motion === 'rise') {
        actor.sunk = motion === 'sink';
        actor.body.setY(actor.sunk ? 10 : 0);
      }
      return;
    }
    const b = actor.body;
    const restY = actor.sunk ? 10 : 0;
    this.tweens.killTweensOf(b);
    b.setPosition(0, restY).setScale(1).setAngle(0);
    switch (motion) {
      case 'hop':
        this.tweens.add({ targets: b, y: restY - 18, duration: 110, yoyo: true, ease: 'Quad.easeOut' });
        return;
      case 'bounce':
        this.tweens.add({ targets: b, y: restY - 9, duration: 90, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
        return;
      case 'nod':
        this.tweens.add({ targets: b, y: restY + 6, duration: 120, yoyo: true, ease: 'Sine.easeInOut' });
        return;
      case 'shake':
        this.tweens.add({ targets: b, x: 5, duration: 35, yoyo: true, repeat: 3, ease: 'Sine.easeInOut', onComplete: () => b.setX(0) });
        return;
      case 'sink':
        actor.sunk = true;
        this.tweens.add({ targets: b, y: 10, duration: 350, ease: 'Sine.easeOut' });
        return;
      case 'rise':
        actor.sunk = false;
        this.tweens.add({ targets: b, y: 0, duration: 250, ease: 'Sine.easeOut' });
        return;
      case 'step':
        this.tweens.add({ targets: b, scale: 1.05, duration: 160, yoyo: true, ease: 'Sine.easeOut' });
        return;
      case 'sway':
        this.tweens.add({ targets: b, angle: 1.5, duration: 700, yoyo: true, ease: 'Sine.easeInOut' });
        return;
    }
  }

  /** 頭の上に感情のふきだしをぽんと出す */
  private emote(actor: Actor, mark: Emote): void {
    if (this.skip) return;
    const bubble = this.add.container(actor.body.x + 46, actor.top - 6);
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.95).fillRoundedRect(-24, -22, 48, 38, 12);
    g.fillTriangle(-10, 14, 2, 14, -14, 26);
    g.lineStyle(2, 0x3a2a20, 0.8).strokeRoundedRect(-24, -22, 48, 38, 12);
    bubble.add(g);
    if (mark === '汗') {
      const drop = this.add.graphics();
      drop.fillStyle(0x5aa8ff, 1).fillCircle(0, 2, 7).fillTriangle(-6, -1, 6, -1, 0, -14);
      bubble.add(drop);
    } else {
      const color = mark === '♪' ? '#d9483b' : '#3a2a20';
      bubble.add(addText(this, 0, -3, mark, { size: mark.length > 1 ? 17 : 22, bold: true, color, align: 'center' }).setOrigin(0.5));
    }
    actor.obj.add(bubble);
    bubble.setScale(0);
    this.tweens.add({ targets: bubble, scale: 1, duration: 180, ease: 'Back.easeOut' });
    this.tweens.add({ targets: bubble, alpha: 0, y: bubble.y - 8, delay: 1200, duration: 300, onComplete: () => bubble.destroy() });
  }

  /** 1行を出し始める */
  private showLine(line: ScriptLine, text: string): void {
    this.line = line;
    this.text = text;
    this.shown = 0;
    this.typing?.remove();
    const style = line.style;
    const isCaption = style === 'caption';
    this.setCaptionVisible(isCaption);
    this.voice =
      style === 'talk' ? (CAST[line.speaker ?? '']?.voice ?? VOICE_DEFAULT)
      : style === 'voice' ? { ...(VOICE_ONLY[line.speaker ?? ''] ?? CAST[line.speaker ?? '']?.voice ?? VOICE_DEFAULT), phone: line.tag === '電話' }
      : undefined;
    for (const o of [this.box, this.body]) o.setVisible(!isCaption);

    // 立ち絵：話している人だけ明るく。声だけ・地の文などは全員を暗く（語りの文は誰も暗くしない）
    const speaker = style === 'talk' ? line.speaker : null;
    const speaking = speaker ? this.actors.get(speaker) : undefined;
    if (speaking && line.face) this.changeFace(speaking, line.face);
    for (const [name, actor] of this.actors) actor.setActive(style === 'narration' || name === speaker);

    // 名前の札
    const named = style === 'talk' || style === 'voice' || style === 'document' || style === 'note';
    const name = style === 'note' ? '開発メモ' : `${line.speaker ?? ''}${line.tag ? `（${line.tag}）` : ''}`;
    this.nameBox.setVisible(named && !isCaption);
    this.nameTag.setVisible(named && !isCaption).setText(name);

    // 文の色と枠
    const paper = style === 'document';
    this.box.setFillStyle(paper ? 0xf1e6d2 : 0x0b1118, paper ? 0.97 : 0.92);
    const color = paper ? '#3a2a20' : style === 'narration' ? '#f3e2b8' : style === 'monologue' ? '#cfd8e3' : style === 'note' ? COLORS.accentText : COLORS.text;
    this.body.setColor(color);
    this.cursor.setVisible(false);
    if (style === 'narration') this.sand.start();
    else {
      this.sand.stop();
      this.sand.killAll();
    }

    this.history.push(style === 'talk' || style === 'voice' || style === 'document' ? `${name}「${text}」` : text);

    if (isCaption) {
      this.caption.setText(text).setAlpha(0);
      this.tweens.add({ targets: this.caption, alpha: 1, duration: this.skip ? 50 : 600 });
      this.finishTyping();
      return;
    }
    // 全文で先に折り返しを決めてから1文字ずつ出す（途中の文で折り返すと、行の終わりの文字が一瞬はみ出して見えるため）
    this.wrapped = this.body.getWrappedText(text).join('\n');
    if (this.skip) {
      this.finishTyping();
      return;
    }
    this.body.setText('');
    const all = this.wrapped;
    const charMs = style === 'narration' ? NARRATION_CHAR_MS : CHAR_MS;
    // 文字の音：どの文字で鳴らすかを先に決め、文字と同じ速さで、音の遅れの分だけ先に鳴らし始める（スマホで文字より遅れて聞こえないように）
    const voice = this.voice;
    let lead = 0;
    if (voice && getSettings().typeSound) {
      let count = 0;
      const ring = [...all].map((ch) => !SILENT_CHARS.has(ch) && count++ % BLIP_EVERY === 0);
      lead = audioLatencyMs(this);
      let i = 0;
      const tick = () => {
        if (ring[i]) playBlip(this, voice);
        i++;
      };
      tick();
      if (all.length > 1) this.blipTimer = this.time.addEvent({ delay: charMs, repeat: all.length - 2, callback: tick });
    }
    const startTyping = () => {
      this.typing = this.time.addEvent({
        delay: charMs,
        repeat: all.length - 1,
        callback: () => {
          this.shown++;
          this.body.setText(all.slice(0, this.shown));
          if (this.shown >= all.length) this.finishTyping();
        },
      });
    };
    // 遅らせている間も「文字送りの途中」として扱う（その間のタップで全文を出せるように）
    if (lead > 0) this.typing = this.time.delayedCall(lead, startTyping);
    else startTyping();
  }

  private finishTyping(): void {
    this.typing?.remove();
    this.typing = undefined;
    this.blipTimer?.remove();
    this.blipTimer = undefined;
    this.shown = this.wrapped.length;
    if (this.line?.style !== 'caption') this.body.setText(this.wrapped);
    this.cursor.setVisible(this.line?.style !== 'caption');
    this.waitTimer?.remove();
    if (this.skip) this.waitTimer = this.time.delayedCall(SKIP_MS, () => this.advance());
    else if (this.auto) this.waitTimer = this.time.delayedCall(AUTO_BASE_MS + this.text.length * AUTO_PER_CHAR_MS, () => this.advance());
  }

  /** タップ：文字送りの途中なら全文、全部出ていれば次へ */
  private advance(): void {
    if (this.busy || this.choosing) return;
    if (this.typing) {
      this.finishTyping();
      return;
    }
    void this.proceed();
  }

  private showChoices(labels: string[]): void {
    // 早送りとオートは選択肢で止まる
    this.setSkip(false);
    this.setAuto(false);
    this.sand.stop();
    this.choosing = true;
    const layer = this.add.container(0, 0).setDepth(60);
    layer.add(this.add.rectangle(0, 0, GAME_WIDTH, 540, 0x000000, 0.35).setOrigin(0));
    const top = 300 - (labels.length - 1) * 38;
    labels.forEach((label, i) => {
      addButton(
        this,
        layer,
        GAME_WIDTH / 2,
        top + i * 76,
        310,
        60,
        label,
        {
          onTap: () => {
            layer.destroy();
            this.choosing = false;
            this.history.push(`→ ${label}`);
            this.pos = chooseOption(this.scenes, this.pos, i);
            void this.proceed();
          },
        },
        { size: 16, bold: true, fill: 0x5a4a10, stroke: COLORS.accent, strokeWidth: 2 },
      );
    });
  }

  /** 場面の終わり：続きの場面があれば始める。なければ次の画面へ */
  private endScene(): void {
    const next = this.queue.shift();
    if (next) {
      this.pos = { scene: next, index: 0 };
      void this.proceed();
      return;
    }
    this.sand.stop();
    this.setSkip(false);
    this.setAuto(false);
    this.cameras.main.resetFX();
    if (this.nextScreen) this.scene.start(this.nextScreen.key, this.nextScreen.data);
    else this.scene.start('Title');
  }

  private leave(): void {
    this.cameras.main.resetFX();
    this.scene.start('Title');
  }

  private setSkip(on: boolean): void {
    this.skip = on;
    this.skipButton.setFillStyle(on ? 0x5a4a10 : COLORS.panelLight).setStrokeStyle(on ? 2 : 1, on ? COLORS.accent : COLORS.border);
    if (!on) this.waitTimer?.remove();
  }

  private setAuto(on: boolean): void {
    this.auto = on;
    this.autoButton.setFillStyle(on ? 0x2a4a5a : COLORS.panelLight).setStrokeStyle(on ? 2 : 1, on ? 0x7ac8e0 : COLORS.border);
    if (!on) this.waitTimer?.remove();
  }

  private toggleSkip(): void {
    const on = !this.skip;
    this.setAuto(false);
    this.setSkip(on);
    if (on && !this.choosing && !this.logLayer) this.advance();
  }

  private toggleAuto(): void {
    const on = !this.auto;
    this.setSkip(false);
    this.setAuto(on);
    if (on && !this.typing && !this.busy && !this.choosing) this.finishTyping();
  }

  /** 章の扉の黒い幕と大きな文字を、ふわっと出し入れする */
  private setCaptionVisible(on: boolean): void {
    const targets = [this.captionBg, this.caption];
    if (this.captionBg.visible === on) return;
    this.tweens.killTweensOf(targets);
    if (on) {
      targets.forEach((o) => o.setVisible(true));
      this.captionBg.setAlpha(this.skip ? 1 : 0);
      this.tweens.add({ targets: this.captionBg, alpha: 1, duration: this.skip ? 0 : PICTURE_FADE_MS });
      return;
    }
    this.tweens.add({ targets, alpha: 0, duration: this.skip ? 0 : PICTURE_FADE_MS, onComplete: () => targets.forEach((o) => o.setVisible(false)) });
  }

  private toggleBlip(): void {
    // 入（スピーカー）→ 無線（Bluetooth のイヤホン。音を早めに鳴らす）→ 切 → 入 …
    const st = getSettings();
    const next = !st.typeSound ? { typeSound: true, audioOut: 'speaker' as const } : st.audioOut === 'speaker' ? { typeSound: true, audioOut: 'wireless' as const } : { typeSound: false };
    setSettings({ ...st, ...next });
    this.refreshBlipButton();
  }

  private refreshBlipButton(): void {
    const st = getSettings();
    const on = st.typeSound;
    this.blipLabel.setText(!on ? '文字音 切' : st.audioOut === 'wireless' ? '文字音 無線' : '文字音 入');
    this.blipButton.setFillStyle(on ? 0x2a4a5a : COLORS.panelLight).setStrokeStyle(on ? 2 : 1, on ? 0x7ac8e0 : COLORS.border);
  }

  private showToast(msg: string): void {
    this.toast?.destroy();
    this.toast = addText(this, GAME_WIDTH / 2, 80, msg, { size: 13, color: COLORS.accentText, align: 'center' }).setOrigin(0.5).setDepth(80);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 1400, duration: 400 });
  }

  private toggleLog(): void {
    if (this.logLayer) {
      this.logLayer.destroy();
      this.logLayer = undefined;
      return;
    }
    this.setSkip(false);
    this.setAuto(false);
    const layer = this.add.container(0, 0).setDepth(100);
    const bg = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0b1118, 1).setOrigin(0).setInteractive();
    layer.add(bg);
    layer.add(addText(this, GAME_WIDTH / 2, 90, 'ログ（タップで閉じる）', { size: 16, bold: true, color: COLORS.accentText }).setOrigin(0.5));
    // 新しい方から、画面に入るだけ下から積む
    let y = GAME_HEIGHT - 80;
    for (const text of [...this.history].reverse()) {
      const t = addText(this, 24, 0, text, { size: 14, wrap: GAME_WIDTH - 48, color: COLORS.subText });
      y -= t.height + 12;
      if (y < 120) {
        t.destroy();
        break;
      }
      t.setY(y);
      layer.add(t);
    }
    bg.on('pointerup', () => this.toggleLog());
    this.logLayer = layer;
  }
}
