import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { COLORS, RENDER_SCALE, TITLE_EXIT } from '../ui/theme';
import { addImageOr } from '../assets/loader';
import { addButton, addText } from '../ui/widgets';
import { playBgm, playSand, stopAmbience } from '../audio/sound';
import { prepareBgm } from '../audio/bgmStore';
import { chapterOfEvent, findEvent } from '../core';
import { AREA_BATTLES, BGM, SLICE_FLOW, TIPS } from '../data';
import type { TipGroup } from '../core';
import { resetTips, seenTips, showTipPanel } from '../ui/tipPanel';
import { continueRun, deleteSave, moveBrokenSave, readSave, run, startNewRun } from './run';
import type { BattleSceneData } from './BattleScene';
import { enterScreen, fadeOutAndDestroy, screenBg } from '../ui/skin';
import { openOptions } from '../ui/options';
import { canToggleFullscreen, isFullscreen, onFullscreenChange, toggleFullscreen } from '../ui/fullscreen';
import { notePlayStart, setPlayTracking } from './playRecord';

/** 保存した日時を「10/7 21:05」の形にする */
function formatSavedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 曲のダウンロード（タイトルから始める時。2026-10-11） */
interface BgmJob {
  state: 'loading' | 'ok' | 'error';
  loaded: number;
  total: number;
}

/** バイトを「1.2」（MB）の形にする */
function mb(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(1);
}

export class TitleScene extends Phaser.Scene {
  /** 物語の流れへ移る途中（段階32b 調整5。2回押しで二重に始めないように） */
  private leaving = false;

  constructor() {
    super('Title');
  }

  create(): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    enterScreen(this);
    this.leaving = false;
    this.input.enabled = true;
    // タイトルにいる間は、遊んだ記録の時間を数えない（段階32b）
    setPlayTracking(false);
    stopAmbience();
    let root = this.add.container(0, 0);
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
    // 物語の流れへ移る時に消すもの（ボタンと小さな文字）。題字と砂時計は残す（段階32b 調整5）
    const ui = this.add.container(0, 0);
    root.add(ui);
    const flow = (data: object) => this.leave(glow, fall, ui, () => this.scene.start('Flow', data));
    // 戦闘の途中から続ける（段階44）
    const battle = (data: BattleSceneData) => this.leave(glow, fall, ui, () => this.scene.start('Battle', data));
    root = ui;
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
    // 左上に全画面のボタン（段階48）。ホーム画面のアイコンから開いた時と、全画面にできないブラウザでは出さない
    if (canToggleFullscreen()) {
      const fs = this.add.container(0, 0);
      root.add(fs);
      const drawFs = () => {
        if (!fs.active) return;
        fs.removeAll(true);
        const full = isFullscreen();
        addButton(this, fs, 72, 36, 124, 44, full ? '全画面をやめる' : '全画面', { onTap: () => toggleFullscreen() }, { size: 13 });
      };
      drawFs();
      onFullscreenChange(this, drawFs);
    }
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
      flow({ done: false, fromTitle: true });
    };
    if (save?.ok) {
      const s = save.save;
      const event = findEvent(SLICE_FLOW, s.run.event);
      const chapter = chapterOfEvent(SLICE_FLOW, s.run.event);
      addButton(this, root, cx, 600, 260, 64, 'つづきから', {
        onTap: () => {
          if (!continueRun()) this.scene.restart();
          // 戦闘の途中で閉じていたら、その戦闘の始めから（段階44）
          else if (run.battle) battle({ encounter: { battle: run.battle.battle, win: run.battle.win, lose: run.battle.lose } });
          else flow({ done: false, fromTitle: true });
        },
      }, strong);
      root.add(
        addText(this, cx, 656, `${chapter?.name ?? ''}　${event?.title ?? ''}${s.run.battle ? `（${AREA_BATTLES[s.run.battle.battle]?.name ?? '戦闘'}の途中）` : ''}\n${formatSavedAt(s.savedAt)}`, {
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

  /**
   * タイトルから物語の流れへ移る時の余韻（段階32b 調整5）。ほかのボタンを押せなくし、ボタンと小さな文字を消す。
   * 砂時計の砂を強く流して光を明るくし、砂の音を鳴らす。少し置いて暗転し、一呼吸おいてから次の画面へ。
   * BGM は止めない（画面が替わっても曲は続ける決まり。docs/design/tech.md。日常の画面などは自分で曲を流さないため）
   */
  private leave(glow: Phaser.GameObjects.Graphics, fall: Phaser.GameObjects.Particles.ParticleEmitter, ui: Phaser.GameObjects.Container, go: () => void): void {
    if (this.leaving) return;
    this.leaving = true;
    this.input.enabled = false;
    // 余韻の間に、まだしまっていない曲をダウンロードする（2026-10-11）
    const job = this.startBgmJob();
    playSand(this);
    this.tweens.add({ targets: ui, alpha: 0, duration: TITLE_EXIT.uiFadeMs, ease: 'Sine.easeOut' });
    this.tweens.killTweensOf(glow);
    this.tweens.add({ targets: glow, alpha: 1, duration: TITLE_EXIT.holdMs, ease: 'Sine.easeOut' });
    fall.frequency = TITLE_EXIT.sandFrequency;
    this.time.delayedCall(TITLE_EXIT.holdMs, () => {
      const cam = this.cameras.main;
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.time.delayedCall(TITLE_EXIT.blackMs, () => this.waitBgm(job, go)));
      cam.fadeOut(TITLE_EXIT.fadeMs, 0, 0, 0);
    });
  }

  /** 足りない曲のダウンロードを始める */
  private startBgmJob(): BgmJob {
    const job: BgmJob = { state: 'loading', loaded: 0, total: 0 };
    prepareBgm((loaded, total) => {
      job.loaded = loaded;
      job.total = total;
    }).then(
      () => (job.state = 'ok'),
      (e) => {
        console.warn('[bgm] 曲をダウンロードできなかった', e);
        job.state = 'error';
      },
    );
    return job;
  }

  /**
   * 余韻が終わった時に曲がそろっていなければ、暗い画面に進み具合を出して待つ（2026-10-11）。
   * 取れなかった時は「もう一度」と「曲なしで進む」（曲なしで進んだら、流す時にその場で読む）
   */
  private waitBgm(job: BgmJob, go: () => void): void {
    if (job.state === 'ok') {
      go();
      return;
    }
    const cx = GAME_WIDTH / 2;
    const cam = this.cameras.main;
    cam.resetFX();
    const layer = this.add.container(0, 0).setDepth(1000);
    // 下のボタンを押せないように、全体を覆う
    layer.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 1).setOrigin(0).setInteractive());
    const title = addText(this, cx, 380, '曲を読み込んでいます', { size: 16, color: COLORS.accentText }).setOrigin(0.5);
    const barW = 240;
    const barBg = this.add.rectangle(cx - barW / 2, 420, barW, 6, COLORS.panel).setOrigin(0, 0.5);
    const bar = this.add.rectangle(cx - barW / 2, 420, 0, 6, COLORS.accent).setOrigin(0, 0.5);
    const amount = addText(this, cx, 448, '', { size: 13, color: COLORS.subText }).setOrigin(0.5);
    layer.add([title, barBg, bar, amount]);
    const buttons = this.add.container(0, 0);
    layer.add(buttons);
    const show = () => {
      if (job.total > 0) {
        bar.width = barW * Math.min(1, job.loaded / job.total);
        amount.setText(`${mb(job.loaded)} / ${mb(job.total)}MB`);
      }
    };
    show();
    const timer = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        if (job.state !== 'error') show();
        if (job.state === 'ok') {
          timer.remove();
          cam.fadeOut(200, 0, 0, 0);
          cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, go);
        } else if (job.state === 'error' && buttons.length === 0) {
          title.setText('曲を読み込めませんでした');
          amount.setText('電波のよい所で、もう一度試してください');
          this.input.enabled = true;
          addButton(this, buttons, cx, 530, 220, 56, 'もう一度', {
            onTap: () => {
              timer.remove();
              layer.destroy(true);
              this.input.enabled = false;
              this.waitBgm(this.startBgmJob(), go);
            },
          }, { size: 16, bold: true });
          addButton(this, buttons, cx, 606, 220, 52, '曲なしで進む', {
            onTap: () => {
              timer.remove();
              this.input.enabled = false;
              go();
            },
          }, { size: 15 });
        }
      },
    });
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
