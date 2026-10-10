import Phaser from 'phaser';
import type { AreaDef } from '../core';
import { addFragments, komaExtra } from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { playSandRise } from '../audio/sound';
import { AREAS, FRAGMENTS } from '../data';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { describeFragment } from '../ui/weaponText';
import { addButton, addText } from '../ui/widgets';
import { run, saveRun } from './run';

// 時間を返す（段階28）：集めたコマで、盗まれた時間を持ち主に返す。
// 札（蔵書の名前・持ち主・コマ）→「返す」→ コマが砂になって昇る演出 → 余ったコマを記憶の欠片にする → 物語の次へ（夕暮れの時計屋の会話）。
// 返し終えた時に、返した時間をセーブに残し（run.returned）、探索の状態を片付ける。途中で閉じたら、この画面の最初から

export interface ReturnData {
  /** 返す区画（AREAS の id） */
  area: string;
}

/** 「返す」を押す前の、札の色 */
const CARD = 0x2a2418;

export class ReturnScene extends Phaser.Scene {
  private area!: AreaDef;
  /** 集めたコマ（探索の状態から。デバッグで飛ばした時など、なければ返すのに要る数） */
  private koma = 0;
  private root!: Phaser.GameObjects.Container;
  private busy = false;

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
    this.root = this.add.container(0, 0);
    this.root.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0b0a14).setOrigin(0));
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

  /** 返す：コマが砂になって昇り、画面が白く光る */
  private giveBack(): void {
    if (this.busy) return;
    this.busy = true;
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
    this.root.removeAll(true);
    this.root.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0b0a14).setOrigin(0));
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
    if (!run.returned.includes(this.area.id)) run.returned = [...run.returned, this.area.id];
    run.explore = null;
    saveRun();
    addButton(this, this.root, GAME_WIDTH / 2, 700, 240, 60, '次へ', { onTap: () => this.scene.start('Flow', { done: true }) }, { size: 18, bold: true });
  }
}
