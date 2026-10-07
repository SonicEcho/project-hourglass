import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { CAMPAIGN } from '../data';
import { addButton, addText } from '../ui/widgets';
import { continueRun, moveBrokenSave, readSave, startNewRun } from './run';

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
    // 仮の砂時計
    const g = this.add.graphics();
    g.lineStyle(3, COLORS.accent, 1);
    g.strokeTriangle(cx - 40, 160, cx + 40, 160, cx, 230);
    g.strokeTriangle(cx - 40, 300, cx + 40, 300, cx, 230);
    root.add(g);
    root.add(addText(this, cx, 360, 'RESTOPIA', { size: 34, bold: true }).setOrigin(0.5));
    root.add(addText(this, cx, 400, '思い出だけの理想郷', { size: 15, color: COLORS.accentText }).setOrigin(0.5));
    root.add(addText(this, cx, 432, 'バトルプロトタイプ', { size: 13, color: COLORS.subText }).setOrigin(0.5));
    root.add(
      addText(this, cx, 470, '星図で育てながら5戦。最後はボス「歪みの獣」', { size: 13, color: COLORS.subText }).setOrigin(0.5),
    );
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
      const next = CAMPAIGN[s.run.stage];
      addButton(this, root, cx, 600, 260, 64, 'つづきから', {
        onTap: () => {
          if (continueRun()) this.scene.start('Growth');
          else this.scene.restart();
        },
      }, strong);
      root.add(
        addText(this, cx, 645, `${next?.name ?? ''}の前（${s.run.stage + 1}/${CAMPAIGN.length}）　${formatSavedAt(s.savedAt)}`, {
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
}
