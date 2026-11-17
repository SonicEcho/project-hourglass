import Phaser from 'phaser';
import { drawCoach, type CoachHole } from './coach';
import { markTipSeenNow, seenTips } from './tipPanel';

// 画面の照らす案内（段階236。開発者の声：チュートリアルを全体的に戦闘の時のようにそろえる）。
// 戦闘・ムーブメントと同じ形（照らす所のまわりを暗くし、黄色の枠と吹き出し）で、画面ごとの手順を順に出す。
// 手順は src/data/screenCoach.ts。見たかどうかは説明（TIPS）と同じ記録を使うので、タイトルの「説明を読む」から読み返せる

import type { ScreenCoachStep } from '../data/screenCoach';

/** 照らす案内を出している画面（段階236：画面全体でタップを受ける所が、案内の後ろで反応しないように） */
const active = new WeakSet<Phaser.Scene>();

/** その画面で照らす案内を出しているか */
export function coachActive(scene: Phaser.Scene): boolean {
  return active.has(scene);
}

/**
 * 画面の照らす案内を始める。まだ見ていない時だけ出し、出したら true。
 * rect：照らす所の名前 → 場所（見つからない時は、画面のまん中に吹き出しだけ）。手順のたびに呼ぶので、描き直した後の場所を返せばよい。
 * 最後まで見たら、見たことにして onDone
 */
export function startScreenCoach(
  scene: Phaser.Scene,
  id: string,
  steps: readonly ScreenCoachStep[],
  rect: (target: string) => CoachHole | null,
  onDone?: () => void,
  /** 吹き出しの入れ物を作るたびに呼ぶ（探索の画面で、地図のカメラに映さないため） */
  onLayer?: (layer: Phaser.GameObjects.Container) => void,
): boolean {
  if (steps.length === 0 || seenTips().includes(id)) return false;
  let i = 0;
  let layer: Phaser.GameObjects.Container | null = null;
  const show = (): void => {
    layer?.destroy(true);
    layer = null;
    const step = steps[i];
    if (!step) {
      active.delete(scene);
      markTipSeenNow(id);
      onDone?.();
      return;
    }
    const hole = step.target === 'intro' ? null : rect(step.target);
    layer = drawCoach(scene, hole, step.text, false, () => {
      i++;
      show();
    }, 900);
    onLayer?.(layer);
  };
  active.add(scene);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    active.delete(scene);
    layer?.destroy(true);
    layer = null;
  });
  show();
  return true;
}
