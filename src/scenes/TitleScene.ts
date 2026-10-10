import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addImageOr } from '../assets/loader';
import { addButton, addText } from '../ui/widgets';
import { playBgm, stopAmbience } from '../audio/sound';
import { chapterOfEvent, findEvent } from '../core';
import { BGM, SLICE_FLOW, TIPS } from '../data';
import type { TipGroup } from '../core';
import { resetTips, seenTips, showTipPanel } from '../ui/tipPanel';
import { continueRun, deleteSave, moveBrokenSave, readSave, startNewRun } from './run';
import { enterScreen, fadeOutAndDestroy, screenBg } from '../ui/skin';
import { openOptions } from '../ui/options';
import { notePlayStart, setPlayTracking } from './playRecord';

/** 保存した日時を「10/7 21:05」の形にする */
function formatSavedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    enterScreen(this);
    // タイトルにいる間は、遊んだ記録の時間を数えない（段階32b）
    setPlayTracking(false);
    stopAmbience();
    const root = this.add.container(0, 0);
    const cx = GAME_WIDTH / 2;
    root.add(screenBg(this));
    // 砂時計の後ろのほのかな光（段階32a）。ゆっくり明るくなったり暗くなったりする
    const glow = this.add.graphics();
    for (let i = 0; i < 7; i++) {
      glow.fillStyle(COLORS.accent, 0.035);
      glow.fillCircle(cx, 230, 40 + i * 16);
    }
    root.add(glow);
    this.tweens.add({ targets: glow, alpha: 0.55, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // 砂時計（台帳の title.hourglass。読み込めない時は同じ形を図形で描く）
    root.add(
      addImageOr(this, 'title.hourglass', cx, 230, () => {
        const g = this.add.graphics();
        g.lineStyle(3, COLORS.accent, 1);
        g.strokeTriangle(cx - 40, 160, cx + 40, 160, cx, 230);
        g.strokeTriangle(cx - 40, 300, cx + 40, 300, cx, 230);
        return g;
      }),
    );
    // 砂時計の真ん中から下へ落ちる砂（段階32a。粒の絵は背景の砂と同じ）
    const fall = this.add.particles(0, 0, 'ui-sand', {
      x: { min: cx - 1.5, max: cx + 1.5 },
      y: 236,
      speedY: { min: 40, max: 60 },
      scale: { min: 0.35, max: 0.6 },
      tint: COLORS.accent,
      alpha: { start: 0.9, end: 0.2 },
      lifespan: 1050,
      frequency: 45,
    });
    root.add(fall);
    root.add(addText(this, cx, 360, 'RESTOPIA', { size: 34, bold: true }).setOrigin(0.5).setLetterSpacing(4));
    root.add(addText(this, cx, 400, '思い出だけの理想郷', { size: 15, color: COLORS.accentText }).setOrigin(0.5));
    root.add(addText(this, cx, 432, '試作版（M1：プロローグと第1章のはじめ）', { size: 13, color: COLORS.subText }).setOrigin(0.5));
    // 音量・説明・遊んだ記録・クレジットは、右上のオプションにまとめる（段階32b 調整3）
    addButton(this, root, GAME_WIDTH - 66, 36, 112, 44, 'オプション', {
      onTap: () =>
        openOptions(this, {
          links: [
            { label: '説明を読む', onTap: () => this.openTips() },
            { label: '遊んだ記録', onTap: () => this.scene.start('PlayLog', { back: 'Title' }) },
            { label: 'クレジット', onTap: () => this.scene.start('Credits') },
          ],
        }),
    }, { size: 13 });
    // スマホのブラウザは、最初に画面に触れるまで音を出せない。それまでは案内を出す（段階32b 調整3）
    if (this.sound.locked) {
      const hint = addText(this, cx, 500, '画面をタップすると音が出ます', { size: 14, color: COLORS.accentText }).setOrigin(0.5);
      root.add(hint);
      this.tweens.add({ targets: hint, alpha: 0.35, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
        if (!hint.active) return;
        this.tweens.killTweensOf(hint);
        this.tweens.add({ targets: hint, alpha: 0, duration: 400, onComplete: () => hint.destroy() });
      });
    }
    // スマホは最初に画面に触れた後で鳴り始める
    playBgm(this, BGM.title);

    // セーブがあれば「つづきから」（段階11）
    let save = readSave();
    if (save && !save.ok && save.old) {
      // 試作の5戦だけの古いセーブ（版1・2）は引き継がない（段階23）。壊れているのではないので、知らせずに片付ける
      console.info('[save] 古い版のセーブを片付けました', save.error);
      deleteSave();
      save = null;
    } else if (save && !save.ok) {
      console.error('[save] セーブを読めませんでした', save.error);
      moveBrokenSave();
    }
    const strong = { size: 20, bold: true, fill: 0x5a4a10, stroke: COLORS.accent, strokeWidth: 2 };
    const startNew = () => {
      notePlayStart();
      startNewRun();
      this.scene.start('Flow', { done: false });
    };
    if (save?.ok) {
      const s = save.save;
      const event = findEvent(SLICE_FLOW, s.run.event);
      const chapter = chapterOfEvent(SLICE_FLOW, s.run.event);
      addButton(this, root, cx, 600, 260, 64, 'つづきから', {
        onTap: () => {
          if (continueRun()) this.scene.start('Flow', { done: false });
          else this.scene.restart();
        },
      }, strong);
      root.add(
        addText(this, cx, 656, `${chapter?.name ?? ''}　${event?.title ?? ''}\n${formatSavedAt(s.savedAt)}`, {
          size: 12,
          color: COLORS.subText,
          align: 'center',
        }).setOrigin(0.5),
      );
      // 誤タップでセーブを消さないよう、2回押して始める
      let armed = false;
      const warn = addText(this, cx, 790, '', { size: 12, color: COLORS.allyDamage, align: 'center' }).setOrigin(0.5);
      root.add(warn);
      addButton(this, root, cx, 734, 220, 52, 'はじめから', {
        onTap: () => {
          if (armed) startNew();
          else {
            armed = true;
            warn.setText('セーブを消して最初から始めます。\nもう一度押してください');
          }
        },
      }, { size: 16 });
    } else {
      if (save && !save.ok) {
        root.add(addText(this, cx, 560, 'セーブを読めませんでした', { size: 13, color: COLORS.allyDamage }).setOrigin(0.5));
      }
      addButton(this, root, cx, 640, 260, 64, 'はじめる', { onTap: startNew }, strong);
    }
  }

  /** 説明の一覧（段階30）。戦闘・探索・育成のタブ。タップで読む。まだ見ていない説明は、遊んでいて使う場面になると出る */
  private openTips(group: TipGroup = 'battle'): void {
    const cx = GAME_WIDTH / 2;
    const panel = this.add.container(0, 0).setDepth(400);
    panel.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0).setInteractive());
    panel.add(this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH - 24, GAME_HEIGHT - 60, COLORS.panel).setRounded(8).setStrokeStyle(1, COLORS.border));
    panel.add(addText(this, cx, 62, '説明', { size: 18, bold: true }).setOrigin(0.5));
    const groups: { id: TipGroup; name: string }[] = [
      { id: 'battle', name: '戦闘' },
      { id: 'explore', name: '探索' },
      { id: 'growth', name: '育成' },
    ];
    const tabW = (GAME_WIDTH - 60 - 12) / 3;
    groups.forEach((g, i) => {
      const on = g.id === group;
      addButton(this, panel, 30 + tabW / 2 + i * (tabW + 6), 112, tabW, 44, g.name, {
        onTap: () => {
          if (on) return;
          panel.destroy(true);
          this.openTips(g.id);
        },
      }, on ? { size: 15, bold: true, fill: 0x5a4a10, stroke: COLORS.accent } : { size: 15 });
    });
    const seen = seenTips();
    const name = groups.find((g) => g.id === group)?.name ?? '';
    TIPS.filter((t) => t.group === group).forEach((tip, i) => {
      const read = seen.includes(tip.id);
      addButton(this, panel, cx, 172 + i * 54, GAME_WIDTH - 60, 46, read ? tip.title : `${tip.title}（まだ出ていない）`, {
        onTap: () => showTipPanel(this, tip, undefined, `説明（${name}）`),
      }, { size: 14, fill: read ? undefined : 0x1a2430 });
    });
    // 説明をもう一度、使う場面で出す（2回押して決める）
    let armed = false;
    const resetLabel = addText(this, cx, GAME_HEIGHT - 128, '', { size: 11, color: COLORS.allyDamage, align: 'center' }).setOrigin(0.5);
    panel.add(resetLabel);
    addButton(this, panel, cx - 80, GAME_HEIGHT - 74, 150, 48, 'はじめから出す', {
      onTap: () => {
        if (!armed) {
          armed = true;
          resetLabel.setText('見た説明を忘れて、使う場面でまた出します。\nもう一度押してください');
          return;
        }
        resetTips();
        panel.destroy(true);
        this.openTips(group);
      },
    }, { size: 14 });
    addButton(this, panel, cx + 80, GAME_HEIGHT - 74, 150, 48, '閉じる', { onTap: () => fadeOutAndDestroy(this, panel) }, { size: 15 });
  }
}
