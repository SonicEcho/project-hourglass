import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addImageOr } from '../assets/loader';
import { addButton, addText } from '../ui/widgets';
import { getSettings, playBgm, playSe, setSettings } from '../audio/sound';
import { nextVolume } from '../core';
import { BGM, SE } from '../data';
import { battleAt, battleCount, continueRun, moveBrokenSave, readSave, startNewRun } from './run';

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
    const root = this.add.container(0, 0);
    const cx = GAME_WIDTH / 2;
    root.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.bg).setOrigin(0));
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
    root.add(addText(this, cx, 360, 'RESTOPIA', { size: 34, bold: true }).setOrigin(0.5));
    root.add(addText(this, cx, 400, '思い出だけの理想郷', { size: 15, color: COLORS.accentText }).setOrigin(0.5));
    root.add(addText(this, cx, 432, 'バトルプロトタイプ', { size: 13, color: COLORS.subText }).setOrigin(0.5));
    root.add(
      addText(this, cx, 470, '星図で育てながら5戦。最後はボス「歪みの獣」', { size: 13, color: COLORS.subText }).setOrigin(0.5),
    );
    // クレジット（段階15）。親指の邪魔にならない右上に小さく
    addButton(this, root, GAME_WIDTH - 62, 36, 104, 44, 'クレジット', { onTap: () => this.scene.start('Credits') }, { size: 13 });
    // 音量（段階19）。クレジットと反対の左上に
    addButton(this, root, 62, 36, 104, 44, '音量', { onTap: () => this.openVolume() }, { size: 13 });
    // スマホは最初に画面に触れた後で鳴り始める
    playBgm(this, BGM.title);

    // セーブがあれば「つづきから」（段階11）
    const save = readSave();
    if (save && !save.ok) {
      console.error('[save] セーブを読めませんでした', save.error);
      moveBrokenSave();
    }
    const strong = { size: 20, bold: true, fill: 0x5a4a10, stroke: COLORS.accent, strokeWidth: 2 };
    const startNew = () => {
      startNewRun();
      this.scene.start('Growth');
    };
    if (save?.ok) {
      const s = save.save;
      const next = battleAt(s.run.progress);
      const count = battleCount(s.run.progress);
      addButton(this, root, cx, 600, 260, 64, 'つづきから', {
        onTap: () => {
          if (continueRun()) this.scene.start('Growth');
          else this.scene.restart();
        },
      }, strong);
      root.add(
        addText(this, cx, 645, `${next.name}の前（${count.n}/${count.total}）　${formatSavedAt(s.savedAt)}`, {
          size: 12,
          color: COLORS.subText,
        }).setOrigin(0.5),
      );
      // 誤タップでセーブを消さないよう、2回押して始める
      let armed = false;
      const warn = addText(this, cx, 770, '', { size: 12, color: COLORS.allyDamage, align: 'center' }).setOrigin(0.5);
      root.add(warn);
      addButton(this, root, cx, 720, 220, 52, 'はじめから', {
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

  /** 音量の窓。BGM と効果音のボタンを押すたびに 0→25→50→75→100% と変わり、すぐ保存する */
  private openVolume(): void {
    const cx = GAME_WIDTH / 2;
    const panel = this.add.container(0, 0);
    // 後ろのボタンを押せないよう、画面全体を覆う
    panel.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0).setInteractive());
    panel.add(this.add.rectangle(cx, 400, 300, 300, COLORS.panel).setStrokeStyle(1, COLORS.border));
    panel.add(addText(this, cx, 280, '音量', { size: 18, bold: true }).setOrigin(0.5));
    const pct = (v: number) => `${Math.round(v * 100)}%`;
    const draw = () => {
      rows.removeAll(true);
      const st = getSettings();
      rows.add(addText(this, cx - 120, 340, 'BGM', { size: 15 }).setOrigin(0, 0.5));
      addButton(this, rows, cx + 70, 340, 120, 48, pct(st.bgmVolume), {
        onTap: () => {
          setSettings({ ...getSettings(), bgmVolume: nextVolume(getSettings().bgmVolume) });
          draw();
        },
      }, { size: 16 });
      rows.add(addText(this, cx - 120, 410, '効果音', { size: 15 }).setOrigin(0, 0.5));
      addButton(this, rows, cx + 70, 410, 120, 48, pct(st.seVolume), {
        onTap: () => {
          setSettings({ ...getSettings(), seVolume: nextVolume(getSettings().seVolume) });
          // 新しい大きさで鳴らして聞かせる（ボタンの音は前の大きさで鳴っている）
          playSe(this, SE.heal);
          draw();
        },
      }, { size: 16 });
    };
    const rows = this.add.container(0, 0);
    panel.add(rows);
    draw();
    addButton(this, panel, cx, 500, 160, 48, '閉じる', { onTap: () => panel.destroy(true) }, { size: 15 });
  }
}
