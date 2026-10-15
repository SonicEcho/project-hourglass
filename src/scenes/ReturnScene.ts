import Phaser from 'phaser';
import type { AreaDef } from '../core';
import { addFragments, gainSnaps, komaExtra } from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { playSandRise, playTick } from '../audio/sound';
import { AREAS, BACKDROPS, FRAGMENTS, snapNames } from '../data';
import { drawBackdrop } from '../ui/backdrop';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { describeFragment } from '../ui/weaponText';
import { addButton, addText } from '../ui/widgets';
import { run, saveRun } from './run';

// 時間を返す（段階28）：集めたコマで、盗まれた時間を持ち主に返す。
// 札（蔵書の名前・持ち主・コマ）→「返す」→ コマが砂になって昇る演出 → 余ったコマを記憶の欠片にする → 物語の次へ（夕暮れの時計屋の会話）。
// 返し終えた時に、返した時間をセーブに残し（run.returned）、探索の状態を片付ける。途中で閉じたら、この画面の最初から。
// 記憶の再生（段階46d）：後ろにその時間の景色を「すり切れた映像」（色あせ・ノイズ・走査線・コマ落ち）で流し、
// 「返す」でコマが1つずつ灯るたびに映像が直っていく。そろうと砂が昇って白く光る。途中のタップで最後まで飛ばせる

export interface ReturnData {
  /** 返す区画（AREAS の id） */
  area: string;
}

/** 「返す」を押す前の、札の色 */
const CARD = 0x2a2418;
/** 記憶の再生：コマが1つ灯る間（ミリ秒）、灯り始めるまでの間、そろってから光るまでの間 */
const REPLAY = { perKoma: 380, lead: 500, settle: 600 };
const BG = 0x0b0a14;

export class ReturnScene extends Phaser.Scene {
  private area!: AreaDef;
  /** 集めたコマ（探索の状態から。デバッグで飛ばした時など、なければ返すのに要る数） */
  private koma = 0;
  private root!: Phaser.GameObjects.Container;
  private busy = false;
  /** 記憶の再生の部品（景色がない区画では undefined） */
  private memory?: {
    layer: Phaser.GameObjects.Container;
    fx?: Phaser.FX.ColorMatrix;
    noise: Phaser.GameObjects.TileSprite;
    scan: Phaser.GameObjects.TileSprite;
    drop: Phaser.GameObjects.Rectangle;
    shade: Phaser.GameObjects.Rectangle;
    code: Phaser.GameObjects.Text;
  };
  /** 直り具合（0：すり切れたまま 〜 1：直った） */
  private mend = 0;
  /** 記憶の再生の途中のタップで、最後まで飛ばす */
  private hurry = false;
  /** 「返す」を押した時刻（押したタップで飛ばさないように） */
  private startedAt = 0;

  constructor() {
    super('Return');
  }

  create(data: ReturnData): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    const area = AREAS[data.area];
    if (!area) throw new Error(`unknown area ${data.area}`);
    this.area = area;
    this.koma = run.explore?.area === area.id ? Math.max(run.explore.koma, area.komaNeed) : area.komaNeed;
    this.busy = false;
    this.mend = 0;
    this.hurry = false;
    this.memory = undefined;
    this.drawMemory();
    this.root = this.add.container(0, 0).setDepth(10);
    this.root.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, BG, this.memory ? 0 : 1).setOrigin(0));
    this.drawCard(false);
    addButton(this, this.root, GAME_WIDTH / 2, 700, 240, 64, '返す', { onTap: () => this.giveBack() }, {
      size: 22,
      bold: true,
      fill: 0x5a4a10,
      stroke: COLORS.accent,
      strokeWidth: 3,
      textColor: COLORS.accentText,
    });
    this.root.add(addText(this, GAME_WIDTH / 2, 760, '集めたコマで、盗まれた時間を持ち主に返す', { size: 12, color: COLORS.subText }).setOrigin(0.5));
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.input.on('pointerup', () => {
      if (this.busy && this.time.now - this.startedAt > 300) this.hurry = true;
    });
  }

  /** 記憶の再生：その時間の景色を、すり切れた映像で後ろに流す（区画に景色がなければ何もしない） */
  private drawMemory(): void {
    const def = this.area.memory ? BACKDROPS[this.area.memory] : undefined;
    if (!def) return;
    const layer = this.add.container(0, 0).setDepth(0);
    drawBackdrop(this, layer, def, 0, GAME_HEIGHT, false);
    // 色あせ（WebGL の時だけ。ない時は暗い幕だけ）
    const fx = layer.postFX?.addColorMatrix();
    if (!this.textures.exists('return-noise')) {
      const n = 128;
      const tex = this.textures.createCanvas('return-noise', n, n);
      const ctx = tex?.getContext();
      if (tex && ctx) {
        const img = ctx.createImageData(n, n);
        for (let i = 0; i < img.data.length; i += 4) {
          const v = Math.random() * 255;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
          img.data[i + 3] = 255;
        }
        ctx.putImageData(img, 0, 0);
        tex.refresh();
      }
      const g = this.make.graphics({}, false);
      g.fillStyle(0x000000, 1).fillRect(0, 0, 4, 1);
      g.generateTexture('return-scan', 4, 3);
      g.destroy();
    }
    const noise = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'return-noise').setOrigin(0).setBlendMode(Phaser.BlendModes.SCREEN).setDepth(1);
    const scan = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'return-scan').setOrigin(0).setDepth(1);
    const drop = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0).setOrigin(0).setDepth(1);
    // 札が読めるように、映像の上に暗い幕をかける（返す間は薄くする）
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, BG, 0.62).setOrigin(0).setDepth(2);
    const code = addText(this, 16, 14, '', { size: 12, color: '#ffffff' }).setDepth(3);
    this.memory = { layer, fx, noise, scan, drop, shade, code };
    this.applyMend();
    // ノイズとコマ落ちは、少しずつ揺らし続ける
    this.time.addEvent({ delay: 70, loop: true, callback: () => this.flicker() });
  }

  /** 直り具合に合わせて、色・ノイズ・走査線・時刻の表示を変える */
  private applyMend(): void {
    const m = this.memory;
    if (!m) return;
    const worn = 1 - this.mend;
    if (m.fx) {
      m.fx.reset();
      m.fx.saturate(-worn);
      m.fx.brightness(0.65 + 0.35 * this.mend, true);
    }
    m.noise.setAlpha(0.3 * worn + 0.02);
    m.scan.setAlpha(0.55 * worn + 0.04);
    const have = Math.round(this.mend * this.area.komaNeed);
    m.code.setText(this.mend >= 1 ? '' : `▶ 再生　コマ ${have}/${this.area.komaNeed}`);
  }

  /** ノイズを動かし、抜けたコマが多いほど、黒い一瞬（コマ落ち）と画面のずれを出す */
  private flicker(): void {
    const m = this.memory;
    if (!m) return;
    const worn = 1 - this.mend;
    m.noise.setTilePosition(Math.random() * 128, Math.random() * 128);
    const dropped = worn > 0 && Math.random() < 0.09 * worn;
    m.drop.setAlpha(dropped ? 0.85 : 0);
    const jolt = worn > 0 && Math.random() < 0.08 * worn;
    m.layer.setPosition(jolt ? (Math.random() - 0.5) * 12 : 0, jolt ? (Math.random() - 0.5) * 5 : 0);
  }

  /** 待つ（途中のタップで飛ばす時はすぐ） */
  private pause(ms: number): Promise<void> {
    return new Promise((resolve) => (this.hurry ? resolve() : this.time.delayedCall(ms, resolve)));
  }

  /** 記憶の再生：下にコマを並べ、1つずつ灯す。灯るたびに砂が舞い、映像が直っていく */
  private async replay(): Promise<void> {
    const m = this.memory;
    if (!m) return;
    this.tweens.add({ targets: this.root, alpha: 0, duration: 300 });
    this.tweens.add({ targets: m.shade, alpha: 0.1, duration: 400 });
    const n = this.area.komaNeed;
    const w = Math.min(36, (GAME_WIDTH - 40 - (n - 1) * 6) / n);
    const x0 = GAME_WIDTH / 2 - (n * w + (n - 1) * 6) / 2;
    const frames = Array.from({ length: n }, (_, i) =>
      this.add.rectangle(x0 + i * (w + 6), 770, w, w * 0.75, 0x000000, 0.55).setOrigin(0).setStrokeStyle(1, 0xffffff, 0.4).setDepth(5),
    );
    await this.pause(REPLAY.lead);
    for (let i = 0; i < n; i++) {
      const f = frames[i];
      f.setFillStyle(0xe8c070, 1).setStrokeStyle(2, COLORS.accent);
      if (!this.hurry) {
        playTick(this, i % 2 === 1, 0.8);
        for (let k = 0; k < 5; k++) {
          const grain = this.add.circle(f.x + Math.random() * f.width, f.y, 2, 0xffe0a0).setDepth(5);
          this.tweens.add({ targets: grain, y: grain.y - 120 - Math.random() * 160, x: grain.x + (Math.random() - 0.5) * 40, alpha: 0, duration: 1100, onComplete: () => grain.destroy() });
        }
      }
      this.mend = (i + 1) / n;
      this.applyMend();
      await this.pause(REPLAY.perKoma);
    }
    this.mend = 1;
    this.applyMend();
    await this.pause(REPLAY.settle);
    frames.forEach((f, i) => this.tweens.add({ targets: f, alpha: 0, y: f.y - 30, delay: i * 40, duration: 500, onComplete: () => f.destroy() }));
  }

  /** 札：蔵書の名前、持ち主、返却の印、コマ（フィルムのコマの形） */
  private drawCard(done: boolean): void {
    const a = this.area;
    const top = 150;
    this.root.add(this.add.rectangle(30, top, GAME_WIDTH - 60, 300, CARD).setRounded(8).setOrigin(0).setStrokeStyle(2, COLORS.accent));
    this.root.add(addText(this, GAME_WIDTH / 2, top + 20, '蔵書', { size: 13, color: COLORS.subText }).setOrigin(0.5, 0));
    this.root.add(addText(this, GAME_WIDTH / 2, top + 42, `「${a.timeTitle ?? a.name}」`, { size: 24, bold: true, color: '#fff3d0' }).setOrigin(0.5, 0));
    this.root.add(addText(this, GAME_WIDTH / 2, top + 86, `持ち主　${a.owner ?? '―'}`, { size: 15 }).setOrigin(0.5, 0));
    this.root.add(
      addText(this, GAME_WIDTH / 2, top + 120, done ? '返却：済み' : `返却：コマがそろった（${a.komaNeed}/${a.komaNeed}）`, {
        size: 15,
        bold: true,
        color: COLORS.accentText,
      }).setOrigin(0.5, 0),
    );
    // コマ：返すのに使う分と、余った分
    const extra = this.koma - a.komaNeed;
    const n = this.koma;
    const w = 26;
    const gap = 6;
    const x0 = GAME_WIDTH / 2 - (n * w + (n - 1) * gap) / 2;
    for (let i = 0; i < n; i++) {
      const used = i < a.komaNeed;
      const frame = this.add.rectangle(x0 + i * (w + gap), top + 180, w, 34, used ? 0xe8c070 : 0x8fd0ff, done && used ? 0.15 : 1).setOrigin(0);
      frame.setStrokeStyle(2, 0x3a2a10);
      frame.setName(used ? 'koma' : 'extra');
      this.root.add(frame);
    }
    if (extra > 0) this.root.add(addText(this, GAME_WIDTH / 2, top + 228, `余ったコマ ${extra}（青）`, { size: 12, color: '#8fd0ff' }).setOrigin(0.5, 0));
  }

  /** 返す：（記憶の再生の後で）コマが砂になって昇り、画面が白く光る */
  private async giveBack(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.startedAt = this.time.now;
    if (this.memory) {
      await this.replay();
      this.root.setAlpha(1);
    }
    playSandRise(this);
    const frames = this.root.list.filter((o) => o.name === 'koma') as Phaser.GameObjects.Rectangle[];
    frames.forEach((f, i) => {
      // 砂粒
      for (let k = 0; k < 6; k++) {
        const grain = this.add.circle(f.x + Math.random() * f.width, f.y + Math.random() * f.height, 2, 0xffe0a0);
        this.tweens.add({ targets: grain, y: grain.y - 260 - Math.random() * 120, alpha: 0, delay: 200 + i * 80 + k * 30, duration: 1200 });
      }
      this.tweens.add({ targets: f, alpha: 0.1, y: f.y - 20, delay: 200 + i * 80, duration: 600 });
    });
    const flash = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0).setOrigin(0).setDepth(50);
    this.tweens.add({ targets: flash, alpha: { from: 0, to: 0.9 }, delay: 1200, duration: 500, yoyo: true, hold: 300 });
    this.time.delayedCall(2100, () => this.afterReturn());
  }

  private afterReturn(): void {
    this.busy = false;
    this.root.removeAll(true);
    // 直った景色を、暗くして後ろに残す
    if (this.memory) this.memory.shade.setAlpha(0.7);
    this.root.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, BG, this.memory ? 0 : 1).setOrigin(0));
    this.drawCard(true);
    this.root.add(addText(this, GAME_WIDTH / 2, 500, '盗まれた時間を、持ち主に返した', { size: 18, bold: true, color: '#fff3d0' }).setOrigin(0.5));
    const extra = run.explore?.area === this.area.id ? komaExtra(this.area, run.explore) : 0;
    if (extra > 0) this.chooseFragment(extra);
    else this.showNext();
  }

  /** 余ったコマを、好きな記憶の欠片にする（1コマで1つ） */
  private chooseFragment(extra: number): void {
    const panel = this.add.container(0, 0);
    this.root.add(panel);
    panel.add(addText(this, GAME_WIDTH / 2, 545, `余ったコマ ${extra}つを、記憶の欠片にする（好きな種類を選ぶ）`, { size: 13, align: 'center', wrap: GAME_WIDTH - 40 }).setOrigin(0.5));
    const list = Object.values(FRAGMENTS);
    const w = (GAME_WIDTH - 40 - 6 * 3) / 4;
    list.forEach((f, i) => {
      addButton(this, panel, 20 + w / 2 + i * (w + 6), 610, w, 64, `${f.name}\n${describeFragment(f)}`, {
        onTap: () => {
          run.armory = addFragments(run.armory, Array<string>(extra).fill(f.id));
          panel.destroy(true);
          this.root.add(addText(this, GAME_WIDTH / 2, 560, `記憶の欠片（${f.name}）を${extra}つ手に入れた。武器の画面で吸わせられる`, { size: 13, color: COLORS.accentText, align: 'center', wrap: GAME_WIDTH - 40 }).setOrigin(0.5));
          this.showNext();
        },
      }, { size: 12, bold: true });
    });
  }

  /** 返した時間をセーブに残し、探索の状態を片付けて、物語の次へ */
  private showNext(): void {
    if (!run.returned.includes(this.area.id)) {
      // 返した報酬のスナップ（段階41）。返した時に1回だけ
      const snaps = this.area.returnSnaps ?? [];
      if (snaps.length > 0) {
        run.album = gainSnaps(run.album, snaps);
        this.root.add(
          addText(this, GAME_WIDTH / 2, 640, `${this.area.owner ?? '持ち主'}の想いが、スナップになった：${snapNames(snaps)}\n（チェックポイントのアルバムで入れ替えられる）`, {
            size: 13,
            color: COLORS.accentText,
            align: 'center',
            wrap: GAME_WIDTH - 40,
          }).setOrigin(0.5),
        );
      }
      run.returned = [...run.returned, this.area.id];
    }
    run.explore = null;
    saveRun();
    addButton(this, this.root, GAME_WIDTH / 2, 700, 240, 60, '次へ', { onTap: () => this.scene.start('Flow', { done: true }) }, { size: 18, bold: true });
  }
}
