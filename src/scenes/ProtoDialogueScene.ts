import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { ProtoLine } from '../data';
import { AKARI, HERO, PROTO_SCRIPT } from '../data';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText } from '../ui/widgets';

/** 文字送りの速さ（1文字あたりのミリ秒） */
const CHAR_MS = 35;
/** 早送りの時、次の行へ進むまでの時間（ミリ秒） */
const SKIP_MS = 180;

const NAMES: Record<string, string> = { hero: HERO.name, akari: AKARI.name };

/**
 * 会話の試作（段階16）。エンジンを決めるために、会話の画面を小さく試す。本編では使わない。
 * 文字送り、タップで全文 → 次へ、話している人の立ち絵を明るく、選択肢、ログ、早送り
 */
export class ProtoDialogueScene extends Phaser.Scene {
  private line!: ProtoLine;
  private shown = 0;
  private typing?: Phaser.Time.TimerEvent;
  private skip = false;
  private history: string[] = [];
  private portraits: Record<string, Phaser.GameObjects.Container> = {};
  private nameTag!: Phaser.GameObjects.Text;
  private nameBox!: Phaser.GameObjects.Rectangle;
  private body!: Phaser.GameObjects.Text;
  private cursor!: Phaser.GameObjects.Text;
  private choiceLayer?: Phaser.GameObjects.Container;
  private logLayer?: Phaser.GameObjects.Container;
  private skipButton!: Phaser.GameObjects.Rectangle;
  private skipTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super('ProtoDialogue');
  }

  create(): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.skip = false;
    this.history = [];
    this.choiceLayer = undefined;
    this.logLayer = undefined;

    // 背景（仮）：夕暮れの空と地面
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2a2f5a, 0x2a2f5a, 0xb0605a, 0xb0605a, 1).fillRect(0, 0, GAME_WIDTH, 520);
    bg.fillStyle(0x1d2a38, 1).fillRect(0, 520, GAME_WIDTH, GAME_HEIGHT - 520);

    // 立ち絵の枠（仮の図形）
    const portrait = (id: string, x: number, color: number) => {
      const c = this.add.container(x, 380);
      c.add(this.add.ellipse(0, -110, 90, 100, color));
      c.add(this.add.rectangle(0, 30, 130, 170, color).setOrigin(0.5));
      c.add(addText(this, 0, 140, NAMES[id], { size: 14, bold: true }).setOrigin(0.5));
      this.portraits[id] = c;
    };
    portrait('akari', 105, 0xd06b8a);
    portrait('hero', 285, COLORS.ally);

    // 本文の枠
    this.add.rectangle(16, 560, GAME_WIDTH - 32, 200, 0x0b1118, 0.92).setOrigin(0).setStrokeStyle(2, COLORS.border);
    this.nameBox = this.add.rectangle(28, 540, 120, 36, COLORS.panelLight).setOrigin(0).setStrokeStyle(2, COLORS.accent);
    this.nameTag = addText(this, 88, 558, '', { size: 15, bold: true, color: COLORS.accentText }).setOrigin(0.5);
    this.body = addText(this, 34, 592, '', { size: 17, wrap: GAME_WIDTH - 68 });
    this.body.setLineSpacing(6);
    this.cursor = addText(this, GAME_WIDTH - 40, 735, '▼', { size: 14, color: COLORS.accentText }).setOrigin(0.5);
    this.tweens.add({ targets: this.cursor, alpha: 0.2, yoyo: true, repeat: -1, duration: 400 });

    // 上のボタン
    addButton(this, this.add.container(0, 0), 46, 36, 76, 44, '戻る', { onTap: () => this.scene.start('Title') }, { size: 14 });
    addButton(this, this.add.container(0, 0), GAME_WIDTH - 140, 36, 84, 44, 'ログ', { onTap: () => this.toggleLog() }, { size: 14 });
    this.skipButton = addButton(this, this.add.container(0, 0), GAME_WIDTH - 50, 36, 84, 44, '早送り', { onTap: () => this.toggleSkip() }, { size: 14 });

    addText(this, GAME_WIDTH / 2, GAME_HEIGHT - 56, '会話の試作（絵と台詞は仮）', { size: 12, color: COLORS.dimText }).setOrigin(0.5);

    // 画面のどこかをタップ（ボタン・選択肢の上は除く）
    this.input.on('pointerup', (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length > 0 || this.choiceLayer || this.logLayer) return;
      this.advance();
    });

    this.show(PROTO_SCRIPT[0]);
  }

  /** 1行を出し始める */
  private show(line: ProtoLine): void {
    this.line = line;
    this.shown = 0;
    this.typing?.remove();
    const speaker = line.speaker;
    for (const [id, c] of Object.entries(this.portraits)) c.setAlpha(speaker === null || speaker === id ? 1 : 0.4);
    this.nameBox.setVisible(speaker !== null);
    this.nameTag.setText(speaker ? NAMES[speaker] : '');
    this.cursor.setVisible(false);
    this.history.push(speaker ? `${NAMES[speaker]}「${line.text}」` : line.text);
    if (this.skip) {
      this.finishTyping();
      return;
    }
    this.body.setText('');
    this.typing = this.time.addEvent({
      delay: CHAR_MS,
      repeat: line.text.length - 1,
      callback: () => {
        this.shown++;
        this.body.setText(line.text.slice(0, this.shown));
        if (this.shown >= line.text.length) this.finishTyping();
      },
    });
  }

  private finishTyping(): void {
    this.typing?.remove();
    this.typing = undefined;
    this.shown = this.line.text.length;
    this.body.setText(this.line.text);
    if (this.line.choices) {
      this.showChoices(this.line.choices);
      return;
    }
    this.cursor.setVisible(true);
    if (this.skip && !this.line.end) {
      this.skipTimer?.remove();
      this.skipTimer = this.time.delayedCall(SKIP_MS, () => this.advance());
    }
  }

  /** タップ：文字送りの途中なら全文、全部出ていれば次へ */
  private advance(): void {
    if (this.typing) {
      this.finishTyping();
      return;
    }
    if (this.line.choices) return;
    if (this.line.end) {
      this.scene.start('Title');
      return;
    }
    const nextId = this.line.next;
    const index = PROTO_SCRIPT.findIndex((l) => l.id === (nextId ?? this.line.id));
    const next = nextId ? PROTO_SCRIPT[index] : PROTO_SCRIPT[index + 1];
    if (next) this.show(next);
  }

  private showChoices(choices: NonNullable<ProtoLine['choices']>): void {
    // 早送りは選択肢で止まる
    if (this.skip) this.toggleSkip();
    const layer = this.add.container(0, 0);
    layer.add(this.add.rectangle(0, 0, GAME_WIDTH, 540, 0x000000, 0.35).setOrigin(0));
    choices.forEach((ch, i) => {
      addButton(this, layer, GAME_WIDTH / 2, 300 + i * 80, 300, 60, ch.label, {
        onTap: () => {
          layer.destroy();
          this.choiceLayer = undefined;
          this.history.push(`→ ${ch.label}`);
          const next = PROTO_SCRIPT.find((l) => l.id === ch.next);
          if (next) this.show(next);
        },
      }, { size: 16, bold: true, fill: 0x5a4a10, stroke: COLORS.accent, strokeWidth: 2 });
    });
    this.choiceLayer = layer;
  }

  private toggleSkip(): void {
    this.skip = !this.skip;
    this.skipButton.setFillStyle(this.skip ? 0x5a4a10 : COLORS.panelLight).setStrokeStyle(this.skip ? 2 : 1, this.skip ? COLORS.accent : COLORS.border);
    this.skipTimer?.remove();
    if (this.skip && !this.choiceLayer && !this.logLayer) this.advance();
  }

  private toggleLog(): void {
    if (this.logLayer) {
      this.logLayer.destroy();
      this.logLayer = undefined;
      return;
    }
    if (this.skip) this.toggleSkip();
    const layer = this.add.container(0, 0).setDepth(100);
    layer.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0b1118, 1).setOrigin(0).setInteractive());
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
    layer.list[0].on('pointerup', () => this.toggleLog());
    this.logLayer = layer;
  }
}
