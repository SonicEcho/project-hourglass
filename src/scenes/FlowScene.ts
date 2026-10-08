import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { FlowEvent } from '../core';
import { chapterOfEvent, dialogueRun } from '../core';
import { SLICE_FLOW } from '../data';
import { applyKinsoku } from '../ui/kinsoku';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText } from '../ui/widgets';
import type { DialogueData } from './DialogueScene';
import { advanceEvent, currentEvent, run, setEvent, setStoryVars } from './run';

// 物語の流れ（段階23）：今の出来事を見て、その画面へ渡す。出来事を終えた画面は、done を付けてここへ戻る。
// 昼の日常は日常の画面（DailyScene）へ。まだ作っていない遊び（探索・時間を返す）は、ここで仮の画面を出して「次へ」で通す

/** Phaser はデータを渡さずに開くと前のデータを使い回すので、この画面を開く時は必ず done を渡す */
export interface FlowData {
  /** 今の出来事を終えた（次の出来事へ進める） */
  done: boolean;
}

/** 仮の画面の見出し */
const KIND_LABEL: Partial<Record<FlowEvent['kind'], string>> = {
  return: '時間を返す（仮）',
};

export class FlowScene extends Phaser.Scene {
  constructor() {
    super('Flow');
  }

  create(data: FlowData): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    const event = data?.done ? advanceEvent() : currentEvent();
    switch (event.kind) {
      case 'dialogue':
        this.openDialogue(event);
        return;
      case 'day':
        this.showDay(event);
        return;
      case 'end':
        this.showEnd();
        return;
      case 'daily':
        this.scene.start('Daily', { event: event.id });
        return;
      case 'explore':
        if (event.area) {
          this.scene.start('Explore', { area: event.area, won: undefined, lost: undefined, seen: undefined });
          return;
        }
        this.showPlaceholder(event);
        return;
      default:
        this.showPlaceholder(event);
    }
  }

  /** 会話の出来事が続く所までを、会話の画面1回で続けて読む。場面を読み始めるたびに、今の出来事を覚えてセーブする */
  private openDialogue(event: FlowEvent): void {
    const [first, ...queue] = dialogueRun(SLICE_FLOW, event.id);
    const data: DialogueData = {
      scene: first,
      queue,
      vars: run.vars,
      seed: run.seed,
      next: { key: 'Flow', data: { done: true } },
      onScene: (id) => setEvent(id),
      onVars: (vars) => setStoryVars(vars),
    };
    this.scene.start('Dialogue', data);
  }

  /** 「2日目」の扉。タップで次へ */
  private showDay(event: FlowEvent): void {
    const cx = GAME_WIDTH / 2;
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000).setOrigin(0);
    const title = addText(this, cx, GAME_HEIGHT / 2 - 10, event.title, { size: 30, bold: true, color: '#f3e2b8' }).setOrigin(0.5).setAlpha(0);
    const hint = addText(this, cx, GAME_HEIGHT / 2 + 60, 'タップで次へ', { size: 13, color: COLORS.subText }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 600 });
    this.tweens.add({ targets: hint, alpha: 1, delay: 600, duration: 400 });
    this.cameras.main.fadeIn(400, 0, 0, 0);
    // 出てすぐのタップで飛ばさないよう、少し待ってから受け付ける
    this.time.delayedCall(500, () => {
      this.input.once('pointerup', () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.restart({ done: true }));
      });
    });
  }

  /** まだ作っていない遊びの仮の画面：何をする所かの案内と、「次へ」 */
  private showPlaceholder(event: FlowEvent): void {
    const cx = GAME_WIDTH / 2;
    const root = this.add.container(0, 0);
    root.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.bg).setOrigin(0));
    addButton(this, root, 52, 36, 84, 44, 'タイトル', { onTap: () => this.scene.start('Title') }, { size: 13 });
    const chapter = chapterOfEvent(SLICE_FLOW, event.id);
    root.add(addText(this, cx, 110, `${chapter?.name ?? ''}　${run.progress.day}日目`, { size: 13, color: COLORS.subText }).setOrigin(0.5));
    root.add(addText(this, cx, 150, KIND_LABEL[event.kind] ?? '', { size: 14, color: COLORS.accentText }).setOrigin(0.5));
    root.add(addText(this, cx, 190, event.title, { size: 20, bold: true, align: 'center', wrap: GAME_WIDTH - 40 }).setOrigin(0.5));
    root.add(this.add.rectangle(cx, 330, GAME_WIDTH - 40, 190, COLORS.panel).setStrokeStyle(1, COLORS.border));
    const note = addText(this, 36, 250, '', { size: 14, wrap: GAME_WIDTH - 72 }).setLineSpacing(6);
    // 行の頭に「、」などが来ないよう、折り返しを先に決めてから出す（会話の画面と同じ）
    note.setText(applyKinsoku(note.getWrappedText(event.note ?? '')).join('\n')).setWordWrapWidth(null);
    root.add(note);
    addButton(this, root, cx, 720, 260, 64, '次へ', { onTap: () => this.scene.restart({ done: true }) }, {
      size: 20,
      bold: true,
      fill: 0x5a4a10,
      stroke: COLORS.accent,
      strokeWidth: 2,
    });
  }

  /** スライスの終わり */
  private showEnd(): void {
    const cx = GAME_WIDTH / 2;
    const root = this.add.container(0, 0);
    root.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000).setOrigin(0));
    root.add(addText(this, cx, 360, 'つづく', { size: 34, bold: true, color: '#f3e2b8' }).setOrigin(0.5));
    root.add(addText(this, cx, 420, 'ここまで遊んでくれて、ありがとうございます', { size: 13, color: COLORS.subText }).setOrigin(0.5));
    this.cameras.main.fadeIn(800, 0, 0, 0);
    addButton(this, root, cx, 640, 220, 56, 'タイトルへ', { onTap: () => this.scene.start('Title') }, { size: 16 });
  }
}
