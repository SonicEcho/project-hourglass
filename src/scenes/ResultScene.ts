import Phaser from 'phaser';
import type { BattleResult } from '../core';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import type { EncounterId } from '../data';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText } from '../ui/widgets';
import { rerollSeed } from './run';

export interface ResultSceneData {
  outcome: 'victory' | 'defeat';
  encounter: EncounterId;
  brokenParts: BattleResult['brokenParts'];
  seed: number;
}

/** 結果画面。勝利ならタイトルへ、敗北ならボス戦からやり直すか最初からを選ぶ */
export class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  create(data: ResultSceneData): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    const root = this.add.container(0, 0);
    const win = data.outcome === 'victory';
    const cx = GAME_WIDTH / 2;

    root.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.bg).setOrigin(0));
    root.add(
      addText(this, cx, 130, win ? 'クリア！' : '敗北…', { size: 46, bold: true, color: win ? COLORS.accentText : COLORS.allyDamage }).setOrigin(0.5),
    );
    root.add(
      addText(this, cx, 190, win ? '歪みの獣を倒した' : `${data.encounter === 'battle2' ? 'ボス戦' : '戦闘1'}で全滅した`, {
        size: 16,
        color: COLORS.subText,
      }).setOrigin(0.5),
    );

    // 破壊した部位と、手に入るはずの素材（表示のみ）
    const top = 250;
    root.add(this.add.rectangle(20, top, GAME_WIDTH - 40, 230, COLORS.panel).setOrigin(0).setStrokeStyle(1, COLORS.border));
    root.add(addText(this, 36, top + 14, '破壊した部位', { size: 15, bold: true, color: COLORS.accentText }));
    if (data.brokenParts.length === 0) {
      root.add(addText(this, 36, top + 50, 'なし', { size: 14, color: COLORS.subText }));
    } else {
      data.brokenParts.forEach((p, i) => {
        const y = top + 50 + i * 54;
        root.add(addText(this, 36, y, `${p.enemyName}の${p.partName}`, { size: 15, bold: true }));
        root.add(addText(this, 52, y + 24, `素材：${p.material}（表示のみ）`, { size: 13, color: COLORS.subText }));
      });
    }
    root.add(addText(this, cx, top + 250, `seed ${data.seed}`, { size: 11, color: COLORS.dimText }).setOrigin(0.5));

    // 親指の届く下の方にボタンを置く
    const restart = () => {
      rerollSeed();
      this.scene.start('Battle', { encounter: 'battle1' });
    };
    if (win) {
      addButton(this, root, cx, 640, 260, 60, 'タイトルへ', { onTap: () => this.scene.start('Title') }, { size: 18, bold: true });
    } else {
      if (data.encounter === 'battle2') {
        addButton(
          this,
          root,
          cx,
          600,
          260,
          60,
          'ボス戦からやり直す',
          {
            onTap: () => {
              rerollSeed();
              this.scene.start('Battle', { encounter: 'battle2' });
            },
          },
          { size: 18, bold: true, fill: 0x5a4a10, stroke: COLORS.accent, strokeWidth: 2 },
        );
      }
      addButton(this, root, cx, 680, 260, 60, '最初から', { onTap: restart }, { size: 18, bold: true });
      addButton(this, root, cx, 760, 200, 48, 'タイトルへ', { onTap: () => this.scene.start('Title') }, { size: 15 });
    }
  }
}
