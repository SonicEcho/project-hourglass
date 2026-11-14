import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { addText } from './widgets';

// 照らす説明（段階161 で戦闘の画面に作った物を、段階203 で共通の部品にした。ムーブメントの画面も使う）。
// 照らす所のまわりを暗くし、黄色の枠を点滅させ、吹き出しに説明。文はよくあるゲームのチュートリアルの言い回しにする（開発者の頼み）

const YELLOW = 0xffd23f;

export interface CoachHole {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * 照らす覆いを描いて返す（depth で前に出す）。hole が null なら、画面のまん中に吹き出しだけ（はじめのあいさつ）。
 * guide：照らした所だけ押せる（まわりの暗い所は押せない）。それ以外は、画面のどこかをタップで onNext（出てすぐの誤タップは無視する）
 */
export function drawCoach(scene: Phaser.Scene, hole: CoachHole | null, text: string, guide: boolean, onNext: () => void, depth = 120): Phaser.GameObjects.Container {
  const h = hole ?? { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 - 120, w: 0, h: 0 };
  const o = scene.add.container(0, 0).setDepth(depth);
  const since = scene.time.now;
  const dim = 0x000000;
  const a = 0.62;
  const parts = [
    scene.add.rectangle(0, 0, GAME_WIDTH, h.y, dim, a),
    scene.add.rectangle(0, h.y + h.h, GAME_WIDTH, GAME_HEIGHT - h.y - h.h, dim, a),
    scene.add.rectangle(0, h.y, h.x, h.h, dim, a),
    scene.add.rectangle(h.x + h.w, h.y, GAME_WIDTH - h.x - h.w, h.h, dim, a),
  ].map((r) => r.setOrigin(0));
  for (const r of parts) {
    if (guide) r.setInteractive();
    o.add(r);
  }
  if (hole) {
    const frame = scene.add.rectangle(h.x, h.y, h.w, h.h).setOrigin(0).setStrokeStyle(3, YELLOW);
    o.add(frame);
    scene.tweens.add({ targets: frame, alpha: 0.35, duration: 520, yoyo: true, repeat: -1 });
  }
  // 吹き出し：照らした所が上半分なら下に、下半分なら上に
  const below = h.y + h.h / 2 < GAME_HEIGHT / 2;
  const bw = GAME_WIDTH - 32;
  const t = addText(scene, 0, 0, text, { size: 14, bold: true, color: '#1a1300', wrap: bw - 28, ja: true }).setLineSpacing(4);
  const hint = guide ? '' : 'タップで次へ ▶';
  const bh = t.height + (hint ? 40 : 24);
  const by = below ? Math.min(h.y + h.h + 14, GAME_HEIGHT - bh - 12) : Math.max(h.y - bh - 14, 12);
  const box = scene.add.container(16, by);
  box.add(scene.add.rectangle(4, 5, bw, bh, 0x000000, 0.5).setOrigin(0));
  box.add(scene.add.rectangle(0, 0, bw, bh, 0xfff6d8).setOrigin(0).setStrokeStyle(3, YELLOW));
  const tip = below ? [h.x + h.w / 2 - 16 - 10, 0, h.x + h.w / 2 - 16 + 10, 0, h.x + h.w / 2 - 16, -12] : [h.x + h.w / 2 - 16 - 10, bh, h.x + h.w / 2 - 16 + 10, bh, h.x + h.w / 2 - 16, bh + 12];
  if (hole) box.add(scene.add.triangle(0, 0, tip[0], tip[1], tip[2], tip[3], tip[4], tip[5], 0xfff6d8).setOrigin(0));
  else box.add(addText(scene, bw / 2, -2, 'TUTORIAL', { size: 12, bold: true, color: '#ffffff' }).setOrigin(0.5, 1).setFontStyle('bold italic').setShadow(2, 2, '#ff2d55', 0, false, true));
  t.setPosition(14, 12);
  box.add(t);
  if (hint) box.add(addText(scene, bw - 14, bh - 14, hint, { size: 11, bold: true, color: '#a06a00' }).setOrigin(1, 0.5));
  o.add(box);
  if (!guide) {
    // 説明だけの手順：画面のどこをタップしても次へ（下の物は押せない）
    const all = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0.001).setOrigin(0).setInteractive();
    all.on('pointerup', () => {
      if (scene.time.now - since < 600) return;
      onNext();
    });
    o.add(all);
  }
  return o;
}
