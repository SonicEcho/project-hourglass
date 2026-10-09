import Phaser from 'phaser';
import { GAME_WIDTH } from '../config';
import { playSe } from '../audio/sound';
import type { MiniGameName } from '../core';
import { glowingAt, goldfishSchedule, goldfishTap, isShootingHit, shootingTargetX } from '../core';
import { GOLDFISH, SE, SHOOTING } from '../data';
import { addText } from '../ui/widgets';

// プロローグの小さな遊び（段階24）。会話の画面の上に重ねて出し、終わったら done(成功したか) を呼ぶ。
// 当たり外れの判定は core/minigame.ts。ここは見た目とタップだけ

/** 遊びを出す範囲（本文の枠より上） */
const AREA_H = 540;
const DEPTH = 65;

export function playMiniGame(scene: Phaser.Scene, game: MiniGameName, seed: number, done: (ok: boolean) => void): void {
  if (game === 'shooting') playShooting(scene, done);
  else playGoldfish(scene, seed, done);
}

function baseLayer(scene: Phaser.Scene, title: string, color: number): { layer: Phaser.GameObjects.Container; hint: Phaser.GameObjects.Text } {
  const layer = scene.add.container(0, 0).setDepth(DEPTH);
  layer.add(scene.add.rectangle(0, 0, GAME_WIDTH, AREA_H, color, 0.96).setOrigin(0));
  layer.add(addText(scene, GAME_WIDTH / 2, 84, title, { size: 18, bold: true, color: '#f3e2b8' }).setOrigin(0.5));
  const hint = addText(scene, GAME_WIDTH / 2, 500, '', { size: 14, align: 'center', wrap: GAME_WIDTH - 40 }).setOrigin(0.5);
  layer.add(hint);
  return { layer, hint };
}

/** 大きな文字をぱっと出す（「パン！」「すくった！」） */
function pop(scene: Phaser.Scene, layer: Phaser.GameObjects.Container, x: number, y: number, text: string, color = '#ffffff'): void {
  const t = addText(scene, x, y, text, { size: 26, bold: true, color }).setOrigin(0.5).setScale(0.6);
  layer.add(t);
  scene.tweens.add({ targets: t, scale: 1, y: y - 24, duration: 260, ease: 'Back.easeOut' });
  scene.tweens.add({ targets: t, alpha: 0, delay: 700, duration: 300, onComplete: () => t.destroy() });
}

/** 射的：棚の上の景品がゆれ、真ん中の照準に来た瞬間にタップ。3発のうち1発当たれば成功 */
function playShooting(scene: Phaser.Scene, done: (ok: boolean) => void): void {
  const { layer, hint } = baseLayer(scene, '射的', 0x2a1a14);
  const cx = GAME_WIDTH / 2;
  const shelfY = 300;
  const amp = 130;
  // 屋台の幕と棚
  const g = scene.add.graphics();
  for (let i = 0; i < 8; i++) g.fillStyle(i % 2 ? 0xc8402f : 0xf4ecd8, 1).fillRect(i * (GAME_WIDTH / 8), 110, GAME_WIDTH / 8, 40);
  g.fillStyle(0x6a4a2a, 1).fillRect(30, shelfY + 40, GAME_WIDTH - 60, 16);
  layer.add(g);
  // 照準（真ん中）
  const sight = scene.add.circle(cx, shelfY, 44).setStrokeStyle(3, 0xffd84a, 0.9);
  const line = scene.add.rectangle(cx, shelfY, 2, 120, 0xffd84a, 0.6);
  layer.add([line, sight]);
  // 景品（ブリキのロボットの形の的）
  const target = scene.add.container(cx + amp, shelfY);
  target.add(scene.add.rectangle(0, 12, 34, 44, 0x9aa8b8).setStrokeStyle(2, 0x3a4450));
  target.add(scene.add.rectangle(0, -22, 26, 22, 0xb8c4d0).setStrokeStyle(2, 0x3a4450));
  target.add(scene.add.circle(-6, -23, 3, 0xe0563e));
  target.add(scene.add.circle(6, -23, 3, 0xe0563e));
  layer.add(target);
  // 弾（残りの数）
  const bullets: Phaser.GameObjects.Arc[] = [];
  for (let i = 0; i < SHOOTING.shots; i++) {
    const b = scene.add.circle(cx - 30 + i * 30, 430, 9, 0xd9ae62).setStrokeStyle(2, 0x6a4a2a);
    bullets.push(b);
    layer.add(b);
  }
  let shot = 0;
  let start = scene.time.now;
  let busy = false;
  const setHint = () => hint.setText(`真ん中の円に来た瞬間にタップ！（のこり${SHOOTING.shots - shot}発）`);
  setHint();
  const onUpdate = () => {
    if (busy) return;
    target.x = cx + amp * shootingTargetX(SHOOTING, scene.time.now - start, shot);
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);
  const hit = scene.add.rectangle(0, 0, GAME_WIDTH, AREA_H, 0x000000, 0).setOrigin(0).setInteractive();
  layer.add(hit);
  const finish = (ok: boolean) => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    scene.time.delayedCall(900, () => {
      layer.destroy(true);
      done(ok);
    });
  };
  hit.on('pointerdown', () => {
    if (busy) return;
    busy = true;
    const ok = isShootingHit(SHOOTING, scene.time.now - start, shot);
    bullets[shot]?.setFillStyle(0x333333);
    pop(scene, layer, cx, shelfY - 90, 'パン！');
    playSe(scene, SE.shot);
    if (ok) {
      playSe(scene, SE.hit);
      scene.tweens.add({ targets: target, angle: 80, y: shelfY + 60, alpha: 0.4, duration: 380, ease: 'Quad.easeIn' });
      hint.setText('当たり！');
      finish(true);
      return;
    }
    playSe(scene, SE.miss);
    shot += 1;
    if (shot >= SHOOTING.shots) {
      hint.setText('3発とも、外れ……');
      finish(false);
      return;
    }
    hint.setText('外れ……');
    scene.time.delayedCall(600, () => {
      busy = false;
      start = scene.time.now;
      setHint();
    });
  });
}

/** 金魚すくい：金魚が水面に近づいて光った瞬間にタップ。光っていない時に3回タップするとポイが破れる */
function playGoldfish(scene: Phaser.Scene, seed: number, done: (ok: boolean) => void): void {
  const { layer, hint } = baseLayer(scene, '金魚すくい', 0x14202a);
  const cx = GAME_WIDTH / 2;
  // 水槽
  const tank = scene.add.graphics();
  tank.fillStyle(0x6a8aa8, 1).fillRoundedRect(28, 130, GAME_WIDTH - 56, 300, 18);
  tank.fillStyle(0x3a6a9a, 1).fillRoundedRect(40, 142, GAME_WIDTH - 80, 276, 14);
  layer.add(tank);
  // 金魚：水槽の中をゆっくり泳ぐ
  const fish: Phaser.GameObjects.Container[] = [];
  for (let i = 0; i < 5; i++) {
    const f = scene.add.container(80 + i * 58, 190 + (i % 3) * 70);
    const body = scene.add.graphics();
    body.fillStyle(0xe0563e, 1).fillTriangle(-11, 0, -24, -9, -24, 9);
    body.fillStyle(0xf06a3a, 1).fillEllipse(0, 0, 30, 16);
    body.fillStyle(0x000000, 1).fillCircle(8, -2, 2);
    f.add(body);
    f.setAlpha(0.75).setScale(0.9);
    fish.push(f);
    layer.add(f);
    const swim = () => {
      const tx = Phaser.Math.Between(70, GAME_WIDTH - 70);
      const ty = Phaser.Math.Between(170, 400);
      f.setScale(tx < f.x ? -0.9 : 0.9, 0.9);
      scene.tweens.add({ targets: f, x: tx, y: ty, duration: Phaser.Math.Between(1600, 2600), ease: 'Sine.easeInOut', onComplete: swim });
    };
    swim();
  }
  const glow = scene.add.circle(0, 0, 30, 0xfff3c0, 0.55).setVisible(false);
  layer.add(glow);
  // ポイ（破れていく）
  const poi = scene.add.circle(cx, 460, 20, 0xf8f4ea).setStrokeStyle(4, 0xd9483b);
  layer.add(poi);
  const schedule = goldfishSchedule(GOLDFISH, seed);
  const start = scene.time.now;
  let misses = 0;
  let over = false;
  hint.setText('金魚が光った瞬間にタップ！');
  const onUpdate = () => {
    if (over) return;
    const t = scene.time.now - start;
    const w = glowingAt(schedule, t);
    const target = w ? fish[schedule.indexOf(w) % fish.length] : null;
    fish.forEach((f) => f.setAlpha(f === target ? 1 : 0.75));
    glow.setVisible(!!target);
    if (target) glow.setPosition(target.x, target.y).setScale(1 + 0.2 * Math.sin(t / 60));
    if (t > GOLDFISH.limitMs) end(false, 'ポイが、ふやけてしまった……');
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);
  const hit = scene.add.rectangle(0, 0, GAME_WIDTH, AREA_H, 0x000000, 0).setOrigin(0).setInteractive();
  layer.add(hit);
  const end = (ok: boolean, text: string) => {
    over = true;
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    hint.setText(text);
    scene.time.delayedCall(1000, () => {
      fish.forEach((f) => scene.tweens.killTweensOf(f));
      layer.destroy(true);
      done(ok);
    });
  };
  hit.on('pointerdown', () => {
    if (over) return;
    const t = scene.time.now - start;
    const r = goldfishTap(GOLDFISH, schedule, t, misses);
    if (r === 'caught') {
      playSe(scene, SE.splash);
      pop(scene, layer, glow.x, glow.y - 20, 'すくった！', '#ffd84a');
      end(true, 'すくった！');
      return;
    }
    misses += 1;
    poi.setAlpha(1 - misses * 0.25);
    if (r === 'broken') {
      playSe(scene, SE.poiBreak);
      pop(scene, layer, cx, 420, 'やぶれた……');
      end(false, 'ポイが、やぶれてしまった……');
      return;
    }
    playSe(scene, SE.tap);
    hint.setText(`まだ光っていない！（ポイ、のこり${GOLDFISH.tries - misses}回）`);
  });
}
