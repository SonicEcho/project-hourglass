import Phaser from 'phaser';
import { buildCredits } from '../assets/credits';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { ASSETS } from '../data';
import { isDebugEnabled } from '../debug/debugFlag';
import { COLORS, RENDER_SCALE } from '../ui/theme';
import { addButton, addText } from '../ui/widgets';

const TOP = 90;
const BOTTOM = 740;

/** クレジットの画面（段階15）。素材台帳から一覧を作る。長い時は上下にドラッグして読む */
export class CreditsScene extends Phaser.Scene {
  constructor() {
    super('Credits');
  }

  create(): void {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.bg).setOrigin(0);

    // 一覧（ドラッグで動かす）
    const list = this.add.container(0, TOP);
    let y = 0;
    const sections = buildCredits(ASSETS, isDebugEnabled(window.location.search));
    for (const sec of sections) {
      list.add(addText(this, 24, y, sec.heading, { size: 16, bold: true, color: COLORS.accentText }));
      y += 32;
      if (sec.items.length === 0) {
        list.add(addText(this, 36, y, 'まだありません', { size: 13, color: COLORS.subText }));
        y += 30;
      }
      for (const it of sec.items) {
        list.add(addText(this, 36, y, it.title, { size: 15, bold: true }));
        y += 24;
        const body = addText(this, 48, y, it.lines.join('\n'), { size: 12, color: COLORS.subText, wrap: GAME_WIDTH - 72 });
        list.add(body);
        y += body.height + 16;
      }
      y += 12;
    }
    const visible = BOTTOM - TOP;
    const maskShape = this.make.graphics({}).fillRect(0, TOP, GAME_WIDTH, visible);
    list.setMask(maskShape.createGeometryMask());
    const minY = Math.min(TOP, BOTTOM - y);
    if (y > visible) {
      let last: number | null = null;
      this.input.on('pointerdown', (p: Phaser.Input.Pointer) => (last = p.y));
      this.input.on('pointerup', () => (last = null));
      this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
        if (last === null || !p.isDown) return;
        list.y = Phaser.Math.Clamp(list.y + (p.y - last) / RENDER_SCALE, minY, TOP);
        last = p.y;
      });
      addText(this, GAME_WIDTH / 2, BOTTOM + 8, '上下にドラッグして読めます', { size: 11, color: COLORS.dimText }).setOrigin(0.5, 0);
    }

    // 見出しとボタン（一覧の上に重ねる）
    addText(this, GAME_WIDTH / 2, 44, 'クレジット', { size: 22, bold: true }).setOrigin(0.5);
    const footer = this.add.container(0, 0);
    addButton(this, footer, GAME_WIDTH / 2, 780, 220, 52, 'タイトルへ', { onTap: () => this.scene.start('Title') }, { size: 16 });
  }
}
